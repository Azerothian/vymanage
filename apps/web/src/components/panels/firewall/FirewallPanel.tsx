'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { VyosConnectionInfo } from '@vymanage/vyos-client';
import { useConfigActions } from '@/lib/hooks/useConfig';
import { useClient } from '@/lib/context/ClientContext';
import { getStorageItem, setStorageItem } from '@/lib/utils/storage';
import { useTabSelection } from '@/lib/hooks/useTabSelection';
import { KeyedItemTable } from '@/components/config/KeyedItemTable';
import { EmptyConfigState } from '@/components/config/EmptyConfigState';
import { useKeyedCrud } from '@/lib/hooks/useKeyedCrud';
import { RuleSetTab } from './RuleSetTab';
import { GroupsTab } from './GroupsTab';
import { ZonesTab } from './ZonesTab';

export interface FirewallPanelProps {
  connection: VyosConnectionInfo;
}

type TabId = 'ipv4' | 'ipv6' | 'bridge' | 'groups' | 'zones' | 'flowtables' | 'global';

const TABS: { id: TabId; label: string }[] = [
  { id: 'ipv4', label: 'IPv4 Rules' },
  { id: 'ipv6', label: 'IPv6 Rules' },
  { id: 'bridge', label: 'Bridge Rules' },
  { id: 'groups', label: 'Groups' },
  { id: 'zones', label: 'Zones' },
  { id: 'flowtables', label: 'Flow Tables' },
  { id: 'global', label: 'Global Options' },
];

const STORAGE_KEY = 'vymanage:active-tab:firewall';

const GLOBAL_OPTIONS = [
  { key: 'all-ping', label: 'Allow all ping' },
  { key: 'broadcast-ping', label: 'Allow broadcast ping' },
  { key: 'ip-src-route', label: 'Allow IP source routing' },
  { key: 'log-martians', label: 'Log martian packets' },
  { key: 'receive-redirects', label: 'Receive ICMP redirects' },
  { key: 'send-redirects', label: 'Send ICMP redirects' },
  { key: 'syn-cookies', label: 'Enable SYN cookies' },
  { key: 'twa-hazards-protection', label: 'TWA hazards protection' },
];

function GlobalOptionsTab({ connection }: { connection: VyosConnectionInfo }) {
  const GLOBAL_PATH = ['firewall', 'global-options'];
  const client = useClient(connection);
  const queryClient = useQueryClient();
  const { setConfig } = useConfigActions(connection);

  const { data, isLoading } = useQuery({
    queryKey: ['config', connection.host, ...GLOBAL_PATH],
    queryFn: () => client!.showConfig(GLOBAL_PATH),
    enabled: !!client,
  });

  const raw = useMemo(() => (data ?? {}) as Record<string, string>, [data]);

  if (isLoading) {
    return <div className="py-8 text-center text-sm text-muted-foreground">Loading...</div>;
  }

  return (
    <div className="max-w-lg space-y-3">
      <p className="text-sm text-muted-foreground mb-4">Global firewall options affecting all traffic.</p>
      {GLOBAL_OPTIONS.map((opt) => (
        <label
          key={opt.key}
          className="flex items-center justify-between gap-4 rounded-md border border-border px-4 py-3 cursor-pointer hover:bg-muted/30"
        >
          <span className="text-sm font-medium">{opt.label}</span>
          <select
            value={raw[opt.key] ?? 'disable'}
            onChange={(e) => {
              setConfig([...GLOBAL_PATH, opt.key], e.target.value).then(() => {
                queryClient.invalidateQueries({
                  queryKey: ['config', connection.host, ...GLOBAL_PATH],
                });
              });
            }}
            className="rounded border border-input bg-background px-2 py-1 text-sm"
          >
            <option value="enable">Enable</option>
            <option value="disable">Disable</option>
          </select>
        </label>
      ))}
    </div>
  );
}

function FlowTablesTab({ connection }: { connection: VyosConnectionInfo }) {
  const FLOW_PATH = ['firewall', 'flowtable'];
  const client = useClient(connection);
  const { addItem, updateItem, deleteItem } = useKeyedCrud(connection, FLOW_PATH);

  const { data, isLoading } = useQuery({
    queryKey: ['config', connection.host, ...FLOW_PATH],
    queryFn: () => client!.showConfig(FLOW_PATH),
    enabled: !!client,
  });

  if (isLoading) {
    return <div className="py-8 text-center text-sm text-muted-foreground">Loading...</div>;
  }

  if (data === undefined || data === null) {
    return <EmptyConfigState configPath={FLOW_PATH} />;
  }

  return (
    <KeyedItemTable
      data={data as Record<string, unknown>}
      columns={[
        {
          id: 'interface',
          header: 'Interfaces',
          accessor: (_k, v) => {
            const ifaces = v.interface;
            if (Array.isArray(ifaces)) return (ifaces as string[]).join(', ');
            if (ifaces && typeof ifaces === 'object') return Object.keys(ifaces).join(', ');
            return String(ifaces || '-');
          },
        },
        {
          id: 'offload',
          header: 'Offload',
          accessor: (_k, v) => String(v.offload || '-'),
          width: '100px',
        },
      ]}
      keyHeader="Flow Table"
      emptyMessage="No flow tables configured"
      onAdd={(key, fields) => addItem(key, fields)}
      onEdit={(key, fields) => updateItem(key, fields)}
      onDelete={(key) => deleteItem(key)}
      addLabel="Add Flow Table"
      formFields={[
        { name: 'interface', label: 'Interfaces', type: 'text', placeholder: 'eth0, eth1' },
        { name: 'offload', label: 'Offload', type: 'select', options: [{ label: 'Hardware', value: 'hardware' }, { label: 'Software', value: 'software' }] },
      ]}
      formTitle="Flow Table"
    />
  );
}

export function FirewallPanel({ connection }: FirewallPanelProps) {
  const [activeTab, setActiveTab] = useState<TabId>(
    () => getStorageItem(STORAGE_KEY, 'ipv4') as TabId,
  );

  useEffect(() => {
    setStorageItem(STORAGE_KEY, activeTab);
  }, [activeTab]);

  useTabSelection('firewall', useCallback((tabId: string) => {
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
        {activeTab === 'ipv4' && <RuleSetTab family="ipv4" connection={connection} />}
        {activeTab === 'ipv6' && <RuleSetTab family="ipv6" connection={connection} />}
        {activeTab === 'bridge' && <RuleSetTab family="bridge" connection={connection} />}
        {activeTab === 'groups' && <GroupsTab connection={connection} />}
        {activeTab === 'zones' && <ZonesTab connection={connection} />}
        {activeTab === 'flowtables' && <FlowTablesTab connection={connection} />}
        {activeTab === 'global' && <GlobalOptionsTab connection={connection} />}
      </div>
    </div>
  );
}
