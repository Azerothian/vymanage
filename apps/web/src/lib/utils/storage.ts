export function getStorageItem<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue;
  try {
    const item = localStorage.getItem(key);
    return item ? (JSON.parse(item) as T) : defaultValue;
  } catch {
    return defaultValue;
  }
}

export function setStorageItem<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage full or unavailable
  }
}

export function removeStorageItem(key: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(key);
  } catch {
    // Storage unavailable
  }
}

// Storage keys
export const STORAGE_KEYS = {
  WORKSPACE_MODE: 'vymanage:workspace-mode',
  DESKTOP_WINDOWS: 'vymanage:desktop-windows',
  SPLIT_LAYOUT: 'vymanage:split-layout',
  INLINE_ACTIVE: 'vymanage:inline-active',
  SIDEBAR_COLLAPSED: 'vymanage:sidebar-collapsed',
  ACTIVE_TABS: 'vymanage:active-tabs',
} as const;
