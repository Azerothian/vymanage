'use client';

import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { VyosConnectionInfo, ConfigCommand } from '@vymanage/vyos-client';
import { useClient } from '@/lib/context/ClientContext';

export function useConfigActions(connection: VyosConnectionInfo | null) {
  const queryClient = useQueryClient();

  const client = useClient(connection);

  const setConfig = useCallback(
    async (path: string[], value?: string) => {
      if (!client) throw new Error('Not connected');
      const result = await client.set(path, value);
      await queryClient.invalidateQueries({ queryKey: ['config'] });
      return result;
    },
    [client, queryClient],
  );

  const deleteConfig = useCallback(
    async (path: string[]) => {
      if (!client) throw new Error('Not connected');
      const result = await client.delete(path);
      await queryClient.invalidateQueries({ queryKey: ['config'] });
      return result;
    },
    [client, queryClient],
  );

  const batchConfigure = useCallback(
    async (commands: ConfigCommand[], confirmTime?: number) => {
      if (!client) throw new Error('Not connected');
      const result = await client.configure(commands, confirmTime);
      await queryClient.invalidateQueries({ queryKey: ['config'] });
      return result;
    },
    [client, queryClient],
  );

  const showConfig = useCallback(
    async (path: string[] = []) => {
      if (!client) throw new Error('Not connected');
      return client.showConfig(path);
    },
    [client],
  );

  const showOperational = useCallback(
    async (path: string[]) => {
      if (!client) throw new Error('Not connected');
      return client.show(path);
    },
    [client],
  );

  return {
    setConfig,
    deleteConfig,
    batchConfigure,
    showConfig,
    showOperational,
    isConnected: !!client,
  };
}
