'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../lib/hooks/useAuth';
import { ConnectionDialog } from '../components/auth/ConnectionDialog';
import { AppShell } from '../components/layout/AppShell';
import { ClientFactoryProvider } from '../lib/context/ClientContext';
import { ConfigStore } from '../lib/config/ConfigStore';
import { FileVyosClient, VyosClient } from '@vymanage/vyos-client';
import type { VyosFileConnection, VyosInfo } from '@vymanage/vyos-client';
import { isElectron, getElectronAPI } from '../lib/utils/electron';

export default function Home() {
  const { isAuthenticated, isLoading, connection, deviceInfo, connect, disconnect, error } = useAuth();

  const [configStore, setConfigStore] = useState<ConfigStore | null>(null);
  const [fileConnection, setFileConnection] = useState<VyosFileConnection | null>(null);
  const [fileDeviceInfo, setFileDeviceInfo] = useState<VyosInfo | null>(null);

  function handleFileOpen(config: Record<string, unknown>, fileName: string) {
    const store = new ConfigStore(config);
    const conn: VyosFileConnection = {
      mode: 'file',
      host: 'file://' + fileName,
      fileName,
    };
    setConfigStore(store);
    setFileConnection(conn);
    setFileDeviceInfo({ version: 'File Mode', hostname: fileName });
  }

  // Handle Electron startup arguments and events
  useEffect(() => {
    if (!isElectron()) return;
    const api = getElectronAPI();
    if (!api) return;

    // Check for CLI startup args
    api.getStartupArgs().then((args) => {
      if (args.host && args.key) {
        connect({ mode: 'device', host: args.host, key: args.key, insecure: args.insecure ?? false });
      }
    });

    // Listen for file:opened events from main process (startup --file arg)
    const cleanupFileOpened = api.onOpenFile((data, fileName) => {
      if (
        typeof data === 'object' &&
        data !== null &&
        !Array.isArray(data) &&
        Object.keys(data).length > 0
      ) {
        handleFileOpen(data as Record<string, unknown>, fileName);
      }
    });

    return () => {
      cleanupFileOpened();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleNewConfig() {
    handleFileOpen({}, 'new-config.json');
  }

  function handleFileClose() {
    setConfigStore(null);
    setFileConnection(null);
    setFileDeviceInfo(null);
  }

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent mx-auto" />
          <p className="mt-3 text-sm text-muted-foreground">Connecting...</p>
        </div>
      </main>
    );
  }

  // File mode
  if (fileConnection && configStore) {
    const capturedStore = configStore;
    const capturedConn = fileConnection;
    const fileFactory = () => new FileVyosClient(capturedStore, capturedConn.fileName);

    function handleFileSave() {
      const json = capturedStore.exportAsJson();

      // Use native save in Electron
      if (isElectron()) {
        const api = getElectronAPI();
        if (api) {
          api.saveFile(json, capturedConn.fileName);
          return;
        }
      }

      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = capturedConn.fileName;
      a.click();
      URL.revokeObjectURL(url);
    }

    return (
      <ClientFactoryProvider factory={fileFactory}>
        <AppShell
          deviceInfo={fileDeviceInfo}
          connection={fileConnection}
          onSave={handleFileSave}
          onDisconnect={handleFileClose}
        />
      </ClientFactoryProvider>
    );
  }

  if (!isAuthenticated || !connection) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background">
        <ConnectionDialog
          onConnect={connect}
          onFileOpen={handleFileOpen}
          onNewConfig={handleNewConfig}
          error={error}
          isLoading={isLoading}
        />
      </main>
    );
  }

  // Device mode
  const deviceFactory = (conn: typeof connection) => new VyosClient(conn);

  return (
    <ClientFactoryProvider factory={deviceFactory}>
      <AppShell
        deviceInfo={deviceInfo}
        connection={connection}
        onSave={() => { /* handled by useSaveWorkflow inside AppShell panels */ }}
        onDisconnect={disconnect}
      />
    </ClientFactoryProvider>
  );
}
