'use client';

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import { getStorageItem, setStorageItem, STORAGE_KEYS } from '@/lib/utils/storage';

export type WorkspaceMode = 'desktop' | 'split' | 'inline';

export interface WindowState {
  id: string;
  menuId: string;
  title: string;
  icon: string;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
  minimized: boolean;
  maximized: boolean;
}

export interface SplitNode {
  type: 'leaf' | 'split';
  menuId?: string;
  direction?: 'horizontal' | 'vertical';
  ratio?: number;
  children?: [SplitNode, SplitNode];
}

export interface WorkspaceState {
  mode: WorkspaceMode;
  windows: WindowState[];
  splitLayout: SplitNode | null;
  inlineActiveId: string | null;
  nextZIndex: number;
}

export interface WorkspaceContextValue extends WorkspaceState {
  setMode: (mode: WorkspaceMode) => void;
  // Desktop mode
  openWindow: (menuId: string, title: string, icon: string) => void;
  closeWindow: (id: string) => void;
  minimizeWindow: (id: string) => void;
  maximizeWindow: (id: string) => void;
  restoreWindow: (id: string) => void;
  focusWindow: (id: string) => void;
  moveWindow: (id: string, x: number, y: number) => void;
  resizeWindow: (id: string, width: number, height: number) => void;
  // Split mode
  setSplitLayout: (layout: SplitNode) => void;
  splitPanel: (targetMenuId: string, newMenuId: string, direction: 'horizontal' | 'vertical') => void;
  closeSplitPanel: (menuId: string) => void;
  // Inline mode
  setInlineActive: (menuId: string) => void;
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

export function useWorkspace() {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error('useWorkspace must be used within WorkspaceProvider');
  return ctx;
}

const DEFAULT_WINDOW_WIDTH = 600;
const DEFAULT_WINDOW_HEIGHT = 450;

function createInitialState(): WorkspaceState {
  return {
    mode: getStorageItem<WorkspaceMode>(STORAGE_KEYS.WORKSPACE_MODE, 'desktop'),
    windows: getStorageItem<WindowState[]>(STORAGE_KEYS.DESKTOP_WINDOWS, []),
    splitLayout: getStorageItem<SplitNode | null>(STORAGE_KEYS.SPLIT_LAYOUT, null),
    inlineActiveId: getStorageItem<string | null>(STORAGE_KEYS.INLINE_ACTIVE, null),
    nextZIndex: 100,
  };
}

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<WorkspaceState>(createInitialState);

  // Persist state changes
  useEffect(() => {
    setStorageItem(STORAGE_KEYS.WORKSPACE_MODE, state.mode);
  }, [state.mode]);

  useEffect(() => {
    setStorageItem(STORAGE_KEYS.DESKTOP_WINDOWS, state.windows);
  }, [state.windows]);

  useEffect(() => {
    setStorageItem(STORAGE_KEYS.SPLIT_LAYOUT, state.splitLayout);
  }, [state.splitLayout]);

  useEffect(() => {
    setStorageItem(STORAGE_KEYS.INLINE_ACTIVE, state.inlineActiveId);
  }, [state.inlineActiveId]);

  const setMode = useCallback((mode: WorkspaceMode) => {
    setState((s) => ({ ...s, mode }));
  }, []);

  // Desktop mode operations
  const openWindow = useCallback((menuId: string, title: string, icon: string) => {
    setState((s) => {
      const existing = s.windows.find((w) => w.menuId === menuId);
      if (existing) {
        // Focus existing window
        return {
          ...s,
          windows: s.windows.map((w) =>
            w.id === existing.id
              ? { ...w, minimized: false, zIndex: s.nextZIndex }
              : w,
          ),
          nextZIndex: s.nextZIndex + 1,
        };
      }

      const offset = (s.windows.length % 5) * 30;
      const newWindow: WindowState = {
        id: `window-${Date.now()}`,
        menuId,
        title,
        icon,
        x: 50 + offset,
        y: 50 + offset,
        width: DEFAULT_WINDOW_WIDTH,
        height: DEFAULT_WINDOW_HEIGHT,
        zIndex: s.nextZIndex,
        minimized: false,
        maximized: false,
      };

      return {
        ...s,
        windows: [...s.windows, newWindow],
        nextZIndex: s.nextZIndex + 1,
      };
    });
  }, []);

  const closeWindow = useCallback((id: string) => {
    setState((s) => ({
      ...s,
      windows: s.windows.filter((w) => w.id !== id),
    }));
  }, []);

  const minimizeWindow = useCallback((id: string) => {
    setState((s) => ({
      ...s,
      windows: s.windows.map((w) => (w.id === id ? { ...w, minimized: true } : w)),
    }));
  }, []);

  const maximizeWindow = useCallback((id: string) => {
    setState((s) => ({
      ...s,
      windows: s.windows.map((w) =>
        w.id === id ? { ...w, maximized: !w.maximized, zIndex: s.nextZIndex } : w,
      ),
      nextZIndex: s.nextZIndex + 1,
    }));
  }, []);

  const restoreWindow = useCallback((id: string) => {
    setState((s) => ({
      ...s,
      windows: s.windows.map((w) =>
        w.id === id ? { ...w, minimized: false, zIndex: s.nextZIndex } : w,
      ),
      nextZIndex: s.nextZIndex + 1,
    }));
  }, []);

  const focusWindow = useCallback((id: string) => {
    setState((s) => ({
      ...s,
      windows: s.windows.map((w) =>
        w.id === id ? { ...w, zIndex: s.nextZIndex } : w,
      ),
      nextZIndex: s.nextZIndex + 1,
    }));
  }, []);

  const moveWindow = useCallback((id: string, x: number, y: number) => {
    setState((s) => ({
      ...s,
      windows: s.windows.map((w) => (w.id === id ? { ...w, x, y } : w)),
    }));
  }, []);

  const resizeWindow = useCallback((id: string, width: number, height: number) => {
    setState((s) => ({
      ...s,
      windows: s.windows.map((w) =>
        w.id === id ? { ...w, width: Math.max(300, width), height: Math.max(200, height) } : w,
      ),
    }));
  }, []);

  // Split mode operations
  const setSplitLayout = useCallback((layout: SplitNode) => {
    setState((s) => ({ ...s, splitLayout: layout }));
  }, []);

  const splitPanel = useCallback(
    (targetMenuId: string, newMenuId: string, direction: 'horizontal' | 'vertical') => {
      setState((s) => {
        const addSplit = (node: SplitNode): SplitNode => {
          if (node.type === 'leaf' && node.menuId === targetMenuId) {
            return {
              type: 'split',
              direction,
              ratio: 0.5,
              children: [
                { type: 'leaf', menuId: targetMenuId },
                { type: 'leaf', menuId: newMenuId },
              ],
            };
          }
          if (node.type === 'split' && node.children) {
            return {
              ...node,
              children: [addSplit(node.children[0]), addSplit(node.children[1])],
            };
          }
          return node;
        };

        const currentLayout = s.splitLayout || { type: 'leaf' as const, menuId: targetMenuId };
        return { ...s, splitLayout: addSplit(currentLayout) };
      });
    },
    [],
  );

  const closeSplitPanel = useCallback((menuId: string) => {
    setState((s) => {
      const removePanel = (node: SplitNode): SplitNode | null => {
        if (node.type === 'leaf') {
          return node.menuId === menuId ? null : node;
        }
        if (node.type === 'split' && node.children) {
          const left = removePanel(node.children[0]);
          const right = removePanel(node.children[1]);
          if (!left) return right;
          if (!right) return left;
          return { ...node, children: [left, right] };
        }
        return node;
      };

      return { ...s, splitLayout: s.splitLayout ? removePanel(s.splitLayout) : null };
    });
  }, []);

  // Inline mode
  const setInlineActive = useCallback((menuId: string) => {
    setState((s) => ({ ...s, inlineActiveId: menuId }));
  }, []);

  const value: WorkspaceContextValue = {
    ...state,
    setMode,
    openWindow,
    closeWindow,
    minimizeWindow,
    maximizeWindow,
    restoreWindow,
    focusWindow,
    moveWindow,
    resizeWindow,
    setSplitLayout,
    splitPanel,
    closeSplitPanel,
    setInlineActive,
  };

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}
