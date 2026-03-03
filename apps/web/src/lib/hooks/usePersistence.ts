'use client';

import { useEffect } from 'react';
import { getStorageItem, setStorageItem } from '@/lib/utils/storage';

/**
 * Hook to persist a value to localStorage and restore it on mount.
 */
export function usePersistence<T>(key: string, value: T, setValue: (val: T) => void) {
  // Restore on mount
  useEffect(() => {
    const stored = getStorageItem<T | null>(key, null);
    if (stored !== null) {
      setValue(stored);
    }
    // Only run on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist on change
  useEffect(() => {
    setStorageItem(key, value);
  }, [key, value]);
}
