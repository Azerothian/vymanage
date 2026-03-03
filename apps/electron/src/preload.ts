import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  // File operations
  openFile: () => ipcRenderer.invoke('file:open'),
  saveFile: (json: string, filePath: string) => ipcRenderer.invoke('file:save', json, filePath),
  saveFileAs: (json: string) => ipcRenderer.invoke('file:saveAs', json),

  // API proxy (bypasses CORS)
  apiRequest: (opts: { url: string; method: string; headers: Record<string, string>; body?: string }) =>
    ipcRenderer.invoke('api:request', opts),

  // CLI args
  getStartupArgs: () => ipcRenderer.invoke('app:getStartupArgs'),

  // Menu event listeners
  onMenuOpenFile: (cb: () => void) => {
    ipcRenderer.on('menu:openFile', () => cb());
    return () => { ipcRenderer.removeAllListeners('menu:openFile'); };
  },
  onMenuSave: (cb: () => void) => {
    ipcRenderer.on('menu:save', () => cb());
    return () => { ipcRenderer.removeAllListeners('menu:save'); };
  },
  onMenuSaveAs: (cb: () => void) => {
    ipcRenderer.on('menu:saveAs', () => cb());
    return () => { ipcRenderer.removeAllListeners('menu:saveAs'); };
  },
  onMenuConnectDevice: (cb: () => void) => {
    ipcRenderer.on('menu:connectDevice', () => cb());
    return () => { ipcRenderer.removeAllListeners('menu:connectDevice'); };
  },

  // File opened from main process (e.g., startup args or menu)
  onOpenFile: (cb: (data: object, fileName: string) => void) => {
    ipcRenderer.on('file:opened', (_e, data, fileName) => cb(data, fileName));
    return () => { ipcRenderer.removeAllListeners('file:opened'); };
  },
});
