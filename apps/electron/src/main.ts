import { app, BrowserWindow, protocol, Menu, shell } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { registerIpcHandlers } from './ipc-handlers';

// Parse CLI arguments
function parseArgs(): { file?: string; host?: string; key?: string; insecure?: boolean } {
  const args: { file?: string; host?: string; key?: string; insecure?: boolean } = {};
  const argv = process.argv.slice(app.isPackaged ? 1 : 2);

  for (let i = 0; i < argv.length; i++) {
    switch (argv[i]) {
      case '--file':
        args.file = argv[++i];
        break;
      case '--host':
        args.host = argv[++i];
        break;
      case '--key':
        args.key = argv[++i];
        break;
      case '--insecure':
        args.insecure = true;
        break;
    }
  }

  return args;
}

const startupArgs = parseArgs();

// Resolve the web assets directory
function getWebRoot(): string {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, 'web');
  }
  return path.join(__dirname, '..', '..', 'web', 'out');
}

// MIME types for static file serving
const MIME_TYPES: Record<string, string> = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.eot': 'application/vnd.ms-fontobject',
  '.txt': 'text/plain',
  '.map': 'application/json',
  '.webp': 'image/webp',
};

// Register custom protocol before app is ready
protocol.registerSchemesAsPrivileged([
  {
    scheme: 'vymanage',
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      corsEnabled: false,
    },
  },
]);

let mainWindow: BrowserWindow | null = null;

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    title: 'VyManage',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  mainWindow.loadURL('vymanage://app/index.html');

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function buildMenu(): void {
  const template: Electron.MenuItemConstructorOptions[] = [
    {
      label: 'File',
      submenu: [
        {
          label: 'Open Config',
          accelerator: 'CmdOrCtrl+O',
          click: () => mainWindow?.webContents.send('menu:openFile'),
        },
        {
          label: 'Save',
          accelerator: 'CmdOrCtrl+S',
          click: () => mainWindow?.webContents.send('menu:save'),
        },
        {
          label: 'Save As...',
          accelerator: 'CmdOrCtrl+Shift+S',
          click: () => mainWindow?.webContents.send('menu:saveAs'),
        },
        { type: 'separator' },
        {
          label: 'Connect to Device',
          click: () => mainWindow?.webContents.send('menu:connectDevice'),
        },
        { type: 'separator' },
        process.platform === 'darwin'
          ? { role: 'close' }
          : { role: 'quit' },
      ],
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' },
      ],
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
      ],
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'About VyManage',
          click: () => {
            const { dialog } = require('electron');
            dialog.showMessageBox({
              type: 'info',
              title: 'About VyManage',
              message: 'VyManage',
              detail: `Version ${app.getVersion()}\nA desktop manager for VyOS routers.`,
            });
          },
        },
        {
          label: 'Learn More',
          click: () => shell.openExternal('https://github.com/vymanage/vymanage'),
        },
      ],
    },
  ];

  // macOS app menu
  if (process.platform === 'darwin') {
    template.unshift({
      label: app.getName(),
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        { role: 'services' },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideOthers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' },
      ],
    });
  }

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

// Single instance lock
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.whenReady().then(() => {
    // Register protocol handler for vymanage:// scheme
    protocol.handle('vymanage', (request) => {
      const webRoot = getWebRoot();
      let urlPath = new URL(request.url).pathname;

      // Remove leading slash
      if (urlPath.startsWith('/')) {
        urlPath = urlPath.slice(1);
      }

      // Default to index.html
      if (!urlPath || urlPath === '') {
        urlPath = 'index.html';
      }

      const filePath = path.join(webRoot, urlPath);

      // Check if file exists, fall back to index.html for client-side routing
      let resolvedPath = filePath;
      if (!fs.existsSync(resolvedPath)) {
        resolvedPath = path.join(webRoot, 'index.html');
      }

      const ext = path.extname(resolvedPath).toLowerCase();
      const mimeType = MIME_TYPES[ext] || 'application/octet-stream';

      try {
        const data = fs.readFileSync(resolvedPath);
        return new Response(data, {
          headers: { 'Content-Type': mimeType },
        });
      } catch {
        return new Response('Not Found', { status: 404 });
      }
    });

    registerIpcHandlers(startupArgs);
    buildMenu();
    createWindow();

    // Send startup args to renderer once it's ready
    mainWindow?.webContents.on('did-finish-load', () => {
      if (startupArgs.file) {
        try {
          const content = fs.readFileSync(startupArgs.file, 'utf-8');
          const data = JSON.parse(content);
          mainWindow?.webContents.send('file:opened', data, path.basename(startupArgs.file));
        } catch (err) {
          console.error('Failed to open startup file:', err);
        }
      }
    });
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });

  app.on('activate', () => {
    if (mainWindow === null) {
      createWindow();
    }
  });
}
