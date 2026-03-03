'use client';

import { useState, useEffect, useCallback } from 'react';
import { VyosClient } from '@vymanage/vyos-client';
import type { VyosConnectionInfo, VyosInfo } from '@vymanage/vyos-client';
import { setConnectionCookie, getConnectionCookie, clearConnectionCookie } from '../utils/cookies';

export interface UseAuthReturn {
  isAuthenticated: boolean;
  isLoading: boolean;
  connection: VyosConnectionInfo | null;
  deviceInfo: VyosInfo | null;
  connect: (info: VyosConnectionInfo) => Promise<void>;
  disconnect: () => void;
  error: string | null;
}

export function useAuth(): UseAuthReturn {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [connection, setConnection] = useState<VyosConnectionInfo | null>(null);
  const [deviceInfo, setDeviceInfo] = useState<VyosInfo | null>(null);
  const [error, setError] = useState<string | null>(null);

  // On mount: check cookie and verify with GET /info
  useEffect(() => {
    async function checkExistingSession() {
      setIsLoading(true);
      try {
        const saved = getConnectionCookie();
        if (!saved) {
          setIsLoading(false);
          return;
        }
        const client = new VyosClient(saved);
        const info = await client.getInfo();
        setConnection(saved);
        setDeviceInfo(info);
        setIsAuthenticated(true);
      } catch {
        clearConnectionCookie();
      } finally {
        setIsLoading(false);
      }
    }
    void checkExistingSession();
  }, []);

  const connect = useCallback(async (info: VyosConnectionInfo): Promise<void> => {
    setError(null);
    setIsLoading(true);
    try {
      const client = new VyosClient(info);
      const deviceInfo = await client.getInfo();
      setConnectionCookie(info);
      setConnection(info);
      setDeviceInfo(deviceInfo);
      setIsAuthenticated(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Connection failed';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    clearConnectionCookie();
    setConnection(null);
    setDeviceInfo(null);
    setIsAuthenticated(false);
    setError(null);
  }, []);

  return { isAuthenticated, isLoading, connection, deviceInfo, connect, disconnect, error };
}
