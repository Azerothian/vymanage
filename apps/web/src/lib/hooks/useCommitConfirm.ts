'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import type { VyosConnectionInfo } from '@vymanage/vyos-client';
import { useClient } from '@/lib/context/ClientContext';

export interface UseCommitConfirmReturn {
  isActive: boolean;
  remainingSeconds: number;
  confirm: () => Promise<void>;
  start: (timeoutMinutes: number) => void;
  cancel: () => void;
  error: string | null;
}

export function useCommitConfirm(connection: VyosConnectionInfo | null): UseCommitConfirmReturn {
  const [isActive, setIsActive] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const endTimeRef = useRef<number>(0);
  const client = useClient(connection);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const start = useCallback((timeoutMinutes: number) => {
    const totalSeconds = timeoutMinutes * 60;
    endTimeRef.current = Date.now() + totalSeconds * 1000;
    setRemainingSeconds(totalSeconds);
    setIsActive(true);
    setError(null);

    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      const remaining = Math.max(0, Math.round((endTimeRef.current - Date.now()) / 1000));
      setRemainingSeconds(remaining);

      if (remaining <= 0) {
        if (timerRef.current) clearInterval(timerRef.current);
        setIsActive(false);
        // VyOS auto-rolls back - refresh config
      }
    }, 1000);
  }, []);

  const confirm = useCallback(async () => {
    if (!client) return;
    setError(null);

    try {
      await client.confirm();
      if (timerRef.current) clearInterval(timerRef.current);
      setIsActive(false);
      setRemainingSeconds(0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Confirm failed');
    }
  }, [client]);

  const cancel = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    setIsActive(false);
    setRemainingSeconds(0);
  }, []);

  return {
    isActive,
    remainingSeconds,
    confirm,
    start,
    cancel,
    error,
  };
}
