export interface ElectronAPI {
  openFile: () => Promise<{ data: Record<string, unknown>; filePath: string; fileName: string } | null>;
  saveFile: (json: string, filePath: string) => Promise<{ filePath: string }>;
  saveFileAs: (json: string) => Promise<{ filePath: string; fileName: string } | null>;
  apiRequest: (opts: {
    url: string;
    method: string;
    headers: Record<string, string>;
    body?: string;
    insecure?: boolean;
  }) => Promise<{ status: number; data: unknown }>;
  getStartupArgs: () => Promise<{
    file?: string;
    host?: string;
    key?: string;
    insecure?: boolean;
  }>;
  onMenuOpenFile: (cb: () => void) => () => void;
  onMenuSave: (cb: () => void) => () => void;
  onMenuSaveAs: (cb: () => void) => () => void;
  onMenuConnectDevice: (cb: () => void) => () => void;
  onOpenFile: (cb: (data: object, fileName: string) => void) => () => void;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}
