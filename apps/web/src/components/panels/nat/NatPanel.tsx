'use client';

import { useState, useEffect, useCallback } from 'react';
import type { VyosConnectionInfo } from '@vymanage/vyos-client';
import { getStorageItem, setStorageItem } from '@/lib/utils/storage';
import { useTabSelection } from '@/lib/hooks/useTabSelection';
import { NatRuleTab } from './NatRuleTab';
import type { NatFamily } from './types';

export interface NatPanelProps {
  connection: VyosConnectionInfo;
}

type TabId = NatFamily;

const TABS: { id: TabId; label: string }[] = [
  { id: 'source', label: 'NAT44 Source' },
  { id: 'destination', label: 'NAT44 Destination' },
  { id: 'nat64', label: 'NAT64' },
  { id: 'nat66', label: 'NAT66' },
  { id: 'cgnat', label: 'CGNAT' },
];

const STORAGE_KEY = 'vymanage:active-tab:nat';

export function NatPanel({ connection }: NatPanelProps) {
  const [activeTab, setActiveTab] = useState<TabId>(
    () => getStorageItem(STORAGE_KEY, 'source') as TabId,
  );

  useEffect(() => {
    setStorageItem(STORAGE_KEY, activeTab);
  }, [activeTab]);

  useTabSelection('nat', useCallback((tabId: string) => {
    const match = TABS.find((t) => t.id === tabId);
    if (match) setActiveTab(match.id);
  }, []));

  return (
    <div className="flex h-full flex-col">
      {/* Tab bar */}
      <div className="flex border-b border-border bg-muted/30 overflow-x-auto scrollbar-thin">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`whitespace-nowrap border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:border-border hover:text-foreground'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-auto p-4 scrollbar-thin">
        <NatRuleTab family={activeTab} connection={connection} />
      </div>
    </div>
  );
}
