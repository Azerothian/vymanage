'use client';

import { createContext, useContext, useMemo } from 'react';
import { VyosClient, ElectronVyosClient, isDeviceConnection } from '@vymanage/vyos-client';
import type { VyosConnectionInfo, IVyosClient } from '@vymanage/vyos-client';
import { isElectron, getElectronAPI } from '@/lib/utils/electron';

type ClientFactory = (connection: VyosConnectionInfo) => IVyosClient;

const ClientFactoryContext = createContext<ClientFactory | null>(null);

export function ClientFactoryProvider({
  factory,
  children,
}: {
  factory: ClientFactory;
  children: React.ReactNode;
}) {
  return (
    <ClientFactoryContext.Provider value={factory}>
      {children}
    </ClientFactoryContext.Provider>
  );
}

export function useClient(connection: VyosConnectionInfo | null): IVyosClient | null {
  const factory = useContext(ClientFactoryContext);

  return useMemo(() => {
    if (!connection) return null;
    if (factory) return factory(connection);

    // In Electron device mode, use ElectronVyosClient to bypass CORS
    if (isElectron() && isDeviceConnection(connection)) {
      const api = getElectronAPI();
      if (api) {
        return new ElectronVyosClient(connection, api.apiRequest);
      }
    }

    // Default: create VyosClient for device connections
    return new VyosClient(connection);
  }, [connection, factory]);
}
