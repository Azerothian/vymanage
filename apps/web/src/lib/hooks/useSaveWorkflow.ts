'use client';

import { useState, useCallback, useRef } from 'react';
import type { VyosConnectionInfo } from '@vymanage/vyos-client';
import { isFileConnection } from '@vymanage/vyos-client';
import { computeConfigDiff, configToString, type DiffResult } from '@/lib/utils/diff';
import { useClient } from '@/lib/context/ClientContext';
import type { ConfigStore } from '@/lib/config/ConfigStore';
import { isElectron, getElectronAPI } from '@/lib/utils/electron';

export interface UseSaveWorkflowReturn {
  isOpen: boolean;
  diff: DiffResult | null;
  isSaving: boolean;
  error: string | null;
  openDiff: () => Promise<void>;
  closeDiff: () => void;
  confirmSave: (commitConfirm: boolean, timeout: number) => Promise<void>;
}

export function useSaveWorkflow(
  connection: VyosConnectionInfo | null,
  configStore?: ConfigStore,
): UseSaveWorkflowReturn {
  const [isOpen, setIsOpen] = useState(false);
  const [diff, setDiff] = useState<DiffResult | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cachedConfig = useRef<string>('');
  const client = useClient(connection);

  const openDiff = useCallback(async () => {
    if (!client) return;
    setError(null);

    try {
      if (connection && isFileConnection(connection) && configStore) {
        const originalStr = configToString(configStore.getOriginalConfig());
        const currentStr = configToString(configStore.getFullConfig());
        const result = computeConfigDiff(originalStr, currentStr);

        if (!result.hasChanges) {
          setError('No configuration changes detected');
          return;
        }

        setDiff(result);
        setIsOpen(true);
        return;
      }

      const currentConfig = await client.showConfig();
      const currentStr = configToString(currentConfig);
      const result = computeConfigDiff(cachedConfig.current, currentStr);

      if (!result.hasChanges) {
        setError('No configuration changes detected');
        return;
      }

      setDiff(result);
      setIsOpen(true);
      cachedConfig.current = currentStr;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch config');
    }
  }, [client, connection, configStore]);

  const closeDiff = useCallback(() => {
    setIsOpen(false);
    setDiff(null);
    setError(null);
  }, []);

  const confirmSave = useCallback(
    async (commitConfirm: boolean, timeout: number) => {
      if (!client) return;
      setIsSaving(true);
      setError(null);

      try {
        if (connection && isFileConnection(connection) && configStore) {
          const json = configStore.exportAsJson();

          // Use native save dialog in Electron
          const electronApi = isElectron() ? getElectronAPI() : null;
          if (electronApi) {
            await electronApi.saveFile(json, connection.fileName);
          } else {
            const blob = new Blob([json], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = connection.fileName;
            a.click();
            URL.revokeObjectURL(url);
          }

          setIsOpen(false);
          setDiff(null);
          return;
        }

        if (commitConfirm) {
          await client.configure([], timeout);
        }

        await client.save();
        cachedConfig.current = '';
        setIsOpen(false);
        setDiff(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Save failed');
      } finally {
        setIsSaving(false);
      }
    },
    [client, connection, configStore],
  );

  return {
    isOpen,
    diff,
    isSaving,
    error,
    openDiff,
    closeDiff,
    confirmSave,
  };
}
