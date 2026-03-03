import { useQuery } from '@tanstack/react-query';
import { VyosClient } from './client';
import type { VyosConnectionInfo, VyosInfo } from './types';

export function vyosQueryKeys(connection: VyosConnectionInfo) {
  return {
    all: [connection.host] as const,
    info: [connection.host, 'info'] as const,
    config: (path: string[]) => [connection.host, 'config', ...path] as const,
    exists: (path: string[]) => [connection.host, 'exists', ...path] as const,
    returnValues: (path: string[]) => [connection.host, 'returnValues', ...path] as const,
    show: (path: string[]) => [connection.host, 'show', ...path] as const,
  };
}

export function useVyosInfo(connection: VyosConnectionInfo) {
  const client = new VyosClient(connection);
  const keys = vyosQueryKeys(connection);

  return useQuery<VyosInfo>({
    queryKey: keys.info,
    queryFn: () => client.getInfo(),
  });
}

export function useConfig(
  connection: VyosConnectionInfo,
  path: string[] = [],
  options?: { staleTime?: number; enabled?: boolean },
) {
  const client = new VyosClient(connection);
  const keys = vyosQueryKeys(connection);

  return useQuery<unknown>({
    queryKey: keys.config(path),
    queryFn: () => client.showConfig(path),
    staleTime: options?.staleTime,
    enabled: options?.enabled,
  });
}

export function useConfigExists(
  connection: VyosConnectionInfo,
  path: string[],
  options?: { enabled?: boolean },
) {
  const client = new VyosClient(connection);
  const keys = vyosQueryKeys(connection);

  return useQuery<boolean>({
    queryKey: keys.exists(path),
    queryFn: () => client.exists(path),
    enabled: options?.enabled,
  });
}

export function useReturnValues(
  connection: VyosConnectionInfo,
  path: string[],
  options?: { enabled?: boolean },
) {
  const client = new VyosClient(connection);
  const keys = vyosQueryKeys(connection);

  return useQuery<string[]>({
    queryKey: keys.returnValues(path),
    queryFn: () => client.returnValues(path),
    enabled: options?.enabled,
  });
}

export function useOperationalData(
  connection: VyosConnectionInfo,
  path: string[],
  options?: { refetchInterval?: number; enabled?: boolean },
) {
  const client = new VyosClient(connection);
  const keys = vyosQueryKeys(connection);

  return useQuery<unknown>({
    queryKey: keys.show(path),
    queryFn: () => client.show(path),
    refetchInterval: options?.refetchInterval ?? 5000,
    enabled: options?.enabled,
  });
}
