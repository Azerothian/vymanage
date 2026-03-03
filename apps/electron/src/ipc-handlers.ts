import { ipcMain, dialog } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';

interface StartupArgs {
  file?: string;
  host?: string;
  key?: string;
  insecure?: boolean;
}

export function registerIpcHandlers(startupArgs: StartupArgs): void {
  // Open file dialog and read JSON config
  ipcMain.handle('file:open', async () => {
    const result = await dialog.showOpenDialog({
      title: 'Open VyOS Configuration',
      filters: [{ name: 'VyOS Config', extensions: ['json'] }],
      properties: ['openFile'],
    });

    if (result.canceled || result.filePaths.length === 0) {
      return null;
    }

    const filePath = result.filePaths[0];
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const data = JSON.parse(content);
      return { data, filePath, fileName: path.basename(filePath) };
    } catch (err) {
      throw new Error(`Failed to read config file: ${err instanceof Error ? err.message : String(err)}`);
    }
  });

  // Save JSON to a known file path
  ipcMain.handle('file:save', async (_event, json: string, filePath: string) => {
    try {
      fs.writeFileSync(filePath, json, 'utf-8');
      return { filePath };
    } catch (err) {
      throw new Error(`Failed to save file: ${err instanceof Error ? err.message : String(err)}`);
    }
  });

  // Save As dialog
  ipcMain.handle('file:saveAs', async (_event, json: string) => {
    const result = await dialog.showSaveDialog({
      title: 'Save VyOS Configuration',
      defaultPath: 'config.json',
      filters: [{ name: 'VyOS Config', extensions: ['json'] }],
    });

    if (result.canceled || !result.filePath) {
      return null;
    }

    try {
      fs.writeFileSync(result.filePath, json, 'utf-8');
      return { filePath: result.filePath, fileName: path.basename(result.filePath) };
    } catch (err) {
      throw new Error(`Failed to save file: ${err instanceof Error ? err.message : String(err)}`);
    }
  });

  // API proxy - bypasses CORS by making requests from Node.js main process
  ipcMain.handle('api:request', async (_event, opts: {
    url: string;
    method: string;
    headers: Record<string, string>;
    body?: string;
    insecure?: boolean;
  }) => {
    try {
      const url = new URL(opts.url);
      const isHttps = url.protocol === 'https:';

      const fetchOpts: RequestInit & { dispatcher?: unknown } = {
        method: opts.method,
        headers: opts.headers,
        body: opts.body,
      };

      // For insecure HTTPS connections, use a custom agent
      if (isHttps && opts.insecure) {
        const agent = new https.Agent({ rejectUnauthorized: false });
        // Use Node.js native fetch with custom agent via undici dispatcher
        const response = await new Promise<{ status: number; data: unknown }>((resolve, reject) => {
          const req = https.request(url, {
            method: opts.method,
            headers: opts.headers,
            agent,
          }, (res) => {
            let body = '';
            res.on('data', (chunk) => { body += chunk; });
            res.on('end', () => {
              try {
                resolve({ status: res.statusCode || 200, data: JSON.parse(body) });
              } catch {
                resolve({ status: res.statusCode || 200, data: body });
              }
            });
          });
          req.on('error', reject);
          if (opts.body) req.write(opts.body);
          req.end();
        });
        return response;
      }

      // Standard fetch for HTTP or secure HTTPS
      const response = await fetch(opts.url, fetchOpts);
      const text = await response.text();
      let data: unknown;
      try {
        data = JSON.parse(text);
      } catch {
        data = text;
      }
      return { status: response.status, data };
    } catch (err) {
      throw new Error(`API request failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  });

  // Return parsed startup arguments
  ipcMain.handle('app:getStartupArgs', () => {
    return startupArgs;
  });
}
