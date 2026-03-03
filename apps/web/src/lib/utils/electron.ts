import type { ElectronAPI } from './electron-types';

export function isElectron(): boolean {
  return typeof window !== 'undefined' && 'electronAPI' in window;
}

export function getElectronAPI(): ElectronAPI | null {
  if (!isElectron()) return null;
  return (window as Window & { electronAPI: ElectronAPI }).electronAPI;
}
