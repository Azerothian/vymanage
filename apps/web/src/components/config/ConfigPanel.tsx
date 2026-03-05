'use client';

import { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { VyosConnectionInfo } from '@vymanage/vyos-client';
import { getStorageItem, setStorageItem } from '@/lib/utils/storage';
import { useClient } from '@/lib/context/ClientContext';
import { useTabSelection } from '@/lib/hooks/useTabSelection';
import { EmptyConfigState } from './EmptyConfigState';

export interface TabDefinition {
  id: string;
  label: string;
  configPath: string[];
  pollInterval?: number;
}

export interface ConfigPanelProps {
  menuId: string;
  tabs: TabDefinition[];
  connection: VyosConnectionInfo;
  renderContent?: (data: unknown, tab: TabDefinition) => React.ReactNode;
  children?: React.ReactNode;
}

export function ConfigPanel({ menuId, tabs, connection, renderContent, children }: ConfigPanelProps) {
  const storageKey = `vymanage:active-tab:${menuId}`;
  const [activeTabId, setActiveTabId] = useState<string>(() => {
    return getStorageItem(storageKey, tabs[0]?.id ?? '');
  });

  const activeTab = tabs.find((t) => t.id === activeTabId) ?? tabs[0];

  useEffect(() => {
    setStorageItem(storageKey, activeTabId);
  }, [activeTabId, storageKey]);

  const client = useClient(connection);

  const { data, isLoading, error } = useQuery({
    queryKey: ['config', connection.host, ...activeTab.configPath],
    queryFn: () => client!.showConfig(activeTab.configPath),
    enabled: !!activeTab && !!client,
    refetchInterval: activeTab.pollInterval,
  });

  const handleTabChange = useCallback((tabId: string) => {
    setActiveTabId(tabId);
  }, []);

  useTabSelection(menuId, useCallback((tabId: string) => {
    const match = tabs.find((t) => t.id === tabId);
    if (match) setActiveTabId(tabId);
  }, [tabs]));

  if (tabs.length === 0) {
    return <div className="p-4">{children}</div>;
  }

  return (
    <div className="flex h-full flex-col">
      {/* Tab bar */}
      {tabs.length > 1 && (
        <div className="flex border-b border-border bg-muted/30">
          <div className="flex gap-0 overflow-x-auto scrollbar-thin">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`whitespace-nowrap border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
                  activeTabId === tab.id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:border-border hover:text-foreground'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Tab content */}
      <div className="flex-1 overflow-auto p-4 scrollbar-thin">
        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <span className="ml-2 text-sm text-muted-foreground">Loading configuration...</span>
          </div>
        )}

        {error && (
          <div className="rounded-md border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
            Failed to load configuration: {error instanceof Error ? error.message : 'Unknown error'}
          </div>
        )}

        {!isLoading && !error && (
          <>
            {data === undefined || data === null ? (
              <EmptyConfigState configPath={activeTab.configPath} />
            ) : (
              renderContent ? renderContent(data, activeTab) : children
            )}
          </>
        )}
      </div>
    </div>
  );
}
