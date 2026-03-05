'use client';

import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { VyosConnectionInfo } from '@vymanage/vyos-client';
import { useConfigActions } from '@/lib/hooks/useConfig';

export function useKeyedCrud(connection: VyosConnectionInfo, basePath: string[]) {
  const { setConfig, deleteConfig } = useConfigActions(connection);
  const queryClient = useQueryClient();

  const invalidate = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ['config'] });
  }, [queryClient]);

  const addItem = useCallback(
    async (key: string, fields: Record<string, string | undefined>) => {
      for (const [field, value] of Object.entries(fields)) {
        if (value !== undefined && value !== '') {
          await setConfig([...basePath, key, ...field.split('/')], value);
        }
      }
      await invalidate();
    },
    [basePath, setConfig, invalidate],
  );

  const updateItem = useCallback(
    async (
      key: string,
      fields: Record<string, string | undefined>,
      original?: Record<string, string | undefined>,
    ) => {
      for (const [field, value] of Object.entries(fields)) {
        const path = [...basePath, key, ...field.split('/')];
        if (value !== undefined && value !== '') {
          await setConfig(path, value);
        } else if (original && original[field] !== undefined) {
          await deleteConfig(path);
        }
      }
      await invalidate();
    },
    [basePath, setConfig, deleteConfig, invalidate],
  );

  const deleteItem = useCallback(
    async (key: string) => {
      await deleteConfig([...basePath, key]);
      await invalidate();
    },
    [basePath, deleteConfig, invalidate],
  );

  return { addItem, updateItem, deleteItem };
}
