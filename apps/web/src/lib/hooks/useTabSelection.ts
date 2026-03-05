'use client';

import { useEffect } from 'react';

export interface TabSelectEvent {
  menuId: string;
  tabId: string;
}

export function useTabSelection(
  menuId: string,
  onTabSelect: (tabId: string) => void,
) {
  useEffect(() => {
    function handleTabSelect(e: Event) {
      const detail = (e as CustomEvent<TabSelectEvent>).detail;
      if (detail.menuId === menuId) {
        onTabSelect(detail.tabId);
      }
    }
    window.addEventListener('vymanage:tab-select', handleTabSelect);
    return () => window.removeEventListener('vymanage:tab-select', handleTabSelect);
  }, [menuId, onTabSelect]);
}

export function dispatchTabSelect(menuId: string, tabId: string) {
  window.dispatchEvent(
    new CustomEvent<TabSelectEvent>('vymanage:tab-select', {
      detail: { menuId, tabId },
    }),
  );
}
