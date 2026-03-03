import { useMutation, useQueryClient } from '@tanstack/react-query';
import { VyosClient } from './client';
import { vyosQueryKeys } from './queries';
import type { VyosConnectionInfo, ConfigCommand } from './types';

export function useSetConfig(connection: VyosConnectionInfo) {
  const client = new VyosClient(connection);
  const queryClient = useQueryClient();
  const keys = vyosQueryKeys(connection);

  return useMutation({
    mutationFn: ({ path, value }: { path: string[]; value?: string }) =>
      client.set(path, value),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: keys.all });
    },
  });
}

export function useDeleteConfig(connection: VyosConnectionInfo) {
  const client = new VyosClient(connection);
  const queryClient = useQueryClient();
  const keys = vyosQueryKeys(connection);

  return useMutation({
    mutationFn: ({ path }: { path: string[] }) => client.delete(path),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: keys.all });
    },
  });
}

export function useConfigure(connection: VyosConnectionInfo) {
  const client = new VyosClient(connection);
  const queryClient = useQueryClient();
  const keys = vyosQueryKeys(connection);

  return useMutation({
    mutationFn: ({
      commands,
      confirmTime,
    }: {
      commands: ConfigCommand[];
      confirmTime?: number;
    }) => client.configure(commands, confirmTime),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: keys.all });
    },
  });
}

export function useSaveConfig(connection: VyosConnectionInfo) {
  const client = new VyosClient(connection);

  return useMutation({
    mutationFn: ({ file }: { file?: string } = {}) => client.save(file),
  });
}

export function useConfirmCommit(connection: VyosConnectionInfo) {
  const client = new VyosClient(connection);

  return useMutation({
    mutationFn: () => client.confirm(),
  });
}
