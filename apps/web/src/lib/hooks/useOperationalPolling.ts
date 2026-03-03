'use client';

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import React from 'react';

interface PollingContextValue {
  isPollingEnabled: boolean;
  togglePolling: () => void;
  setPollingEnabled: (enabled: boolean) => void;
}

const PollingContext = createContext<PollingContextValue>({
  isPollingEnabled: true,
  togglePolling: () => {},
  setPollingEnabled: () => {},
});

export function useOperationalPolling() {
  return useContext(PollingContext);
}

export function PollingProvider({ children }: { children: ReactNode }) {
  const [isPollingEnabled, setIsPollingEnabled] = useState(true);

  const togglePolling = useCallback(() => {
    setIsPollingEnabled((prev) => !prev);
  }, []);

  const setPollingEnabled = useCallback((enabled: boolean) => {
    setIsPollingEnabled(enabled);
  }, []);

  return React.createElement(
    PollingContext.Provider,
    { value: { isPollingEnabled, togglePolling, setPollingEnabled } },
    children,
  );
}
