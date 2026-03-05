'use client';

import { useState, useCallback } from 'react';
import type { VyosConnectionInfo } from '@vymanage/vyos-client';
import { ConfigPanel, type TabDefinition } from '@/components/config/ConfigPanel';
import { RuleTable, type RuleColumn } from '@/components/config/RuleTable';
import { GenericConfigTab } from '@/components/config/GenericConfigTab';
import { useConfigActions } from '@/lib/hooks/useConfig';

const TABS: TabDefinition[] = [
  { id: 'route-map', label: 'Route Maps', configPath: ['policy', 'route-map'] },
  { id: 'access-list', label: 'Access Lists', configPath: ['policy', 'access-list'] },
  { id: 'prefix-list', label: 'Prefix Lists', configPath: ['policy', 'prefix-list'] },
  { id: 'as-path-list', label: 'AS Path Lists', configPath: ['policy', 'as-path-list'] },
  { id: 'community-list', label: 'Community Lists', configPath: ['policy', 'community-list'] },
  { id: 'extcommunity-list', label: 'Ext Community', configPath: ['policy', 'extcommunity-list'] },
  { id: 'large-community-list', label: 'Large Community', configPath: ['policy', 'large-community-list'] },
  { id: 'local-route', label: 'Local Route', configPath: ['policy', 'local-route'] },
];

interface RouteMapEntry {
  id: string;
  name: string;
  seq: string;
  action: string;
  description: string;
}

interface Props {
  connection: VyosConnectionInfo;
}

function RouteMapTable({ data, connection }: { data: unknown; connection: VyosConnectionInfo }) {
  const { setConfig, deleteConfig } = useConfigActions(connection);

  const [entries, setEntries] = useState<RouteMapEntry[]>(() => {
    if (!data || typeof data !== 'object') return [];
    const rows: RouteMapEntry[] = [];
    for (const [name, mapCfg] of Object.entries(data as Record<string, unknown>)) {
      const seqs = (mapCfg as Record<string, unknown>).rule as Record<string, unknown> || {};
      for (const [seq, ruleCfg] of Object.entries(seqs)) {
        const rule = ruleCfg as Record<string, unknown>;
        rows.push({
          id: `${name}-${seq}`,
          name,
          seq,
          action: String(rule.action || ''),
          description: String(rule.description || ''),
        });
      }
    }
    return rows;
  });

  const columns: RuleColumn<RouteMapEntry>[] = [
    { id: 'name', header: 'Map Name', accessor: (r) => r.name },
    { id: 'seq', header: 'Sequence', accessor: (r) => r.seq, width: '80px' },
    {
      id: 'action',
      header: 'Action',
      accessor: (r) => (
        <span
          className={`rounded px-1.5 py-0.5 text-xs font-medium ${r.action === 'permit' ? 'bg-green-500/20 text-green-700 dark:text-green-400' : 'bg-red-500/20 text-red-700 dark:text-red-400'}`}
        >
          {r.action || '-'}
        </span>
      ),
      width: '80px',
    },
    { id: 'description', header: 'Description', accessor: (r) => r.description || '-' },
  ];

  const handleReorder = useCallback((from: number, to: number) => {
    setEntries((prev) => {
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  }, []);

  const handleAdd = useCallback(async () => {
    const name = window.prompt('Route map name:');
    if (!name) return;
    const seq = window.prompt('Sequence number:');
    if (!seq) return;
    await setConfig(['policy', 'route-map', name, 'rule', seq, 'action'], 'permit');
    setEntries((prev) => [
      ...prev,
      { id: `${name}-${seq}`, name, seq, action: 'permit', description: '' },
    ]);
  }, [setConfig]);

  const handleEdit = useCallback(
    async (entry: RouteMapEntry) => {
      const description = window.prompt('Description:', entry.description);
      if (description === null) return;
      await setConfig(['policy', 'route-map', entry.name, 'rule', entry.seq, 'description'], description);
      setEntries((prev) =>
        prev.map((e) => (e.id === entry.id ? { ...e, description } : e)),
      );
    },
    [setConfig],
  );

  const handleDelete = useCallback(
    async (entry: RouteMapEntry) => {
      await deleteConfig(['policy', 'route-map', entry.name, 'rule', entry.seq]);
      setEntries((prev) => prev.filter((e) => e.id !== entry.id));
    },
    [deleteConfig],
  );

  return (
    <RuleTable
      rules={entries}
      columns={columns}
      onReorder={handleReorder}
      addLabel="Add Route Map Entry"
      onAdd={handleAdd}
      onEdit={handleEdit}
      onDelete={handleDelete}
    />
  );
}

function GenericListTable({
  data,
  connection,
  basePath,
  nameCol,
}: {
  data: unknown;
  connection: VyosConnectionInfo;
  basePath: string[];
  nameCol: string;
}) {
  const { setConfig, deleteConfig } = useConfigActions(connection);

  const [entries, setEntries] = useState<
    Array<{ id: string; name: string; seq: string; action: string; network: string }>
  >(() => {
    if (!data || typeof data !== 'object') return [];
    const rows: Array<{ id: string; name: string; seq: string; action: string; network: string }> = [];
    for (const [name, listCfg] of Object.entries(data as Record<string, unknown>)) {
      const rules = ((listCfg as Record<string, unknown>).rule as Record<string, unknown>) || {};
      for (const [seq, ruleCfg] of Object.entries(rules)) {
        const rule = ruleCfg as Record<string, unknown>;
        rows.push({
          id: `${name}-${seq}`,
          name,
          seq,
          action: String(rule.action || ''),
          network: String(rule.prefix || rule.network || rule.regex || rule.description || ''),
        });
      }
    }
    return rows;
  });

  const columns: RuleColumn<(typeof entries)[0]>[] = [
    { id: 'name', header: nameCol, accessor: (r) => r.name },
    { id: 'seq', header: 'Seq', accessor: (r) => r.seq, width: '60px' },
    {
      id: 'action',
      header: 'Action',
      accessor: (r) => (
        <span
          className={`rounded px-1.5 py-0.5 text-xs font-medium ${r.action === 'permit' ? 'bg-green-500/20 text-green-700 dark:text-green-400' : 'bg-red-500/20 text-red-700 dark:text-red-400'}`}
        >
          {r.action || '-'}
        </span>
      ),
      width: '80px',
    },
    {
      id: 'network',
      header: 'Match',
      accessor: (r) => <span className="font-mono text-xs">{r.network || '-'}</span>,
    },
  ];

  const handleReorder = useCallback((from: number, to: number) => {
    setEntries((prev) => {
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  }, []);

  const handleAdd = useCallback(async () => {
    const name = window.prompt('List name:');
    if (!name) return;
    const seq = window.prompt('Sequence number:');
    if (!seq) return;
    await setConfig([...basePath, name, 'rule', seq, 'action'], 'permit');
    setEntries((prev) => [
      ...prev,
      { id: `${name}-${seq}`, name, seq, action: 'permit', network: '' },
    ]);
  }, [setConfig, basePath]);

  const handleEdit = useCallback(
    async (entry: (typeof entries)[0]) => {
      const network = window.prompt('Match (prefix/network/regex):', entry.network);
      if (network === null) return;
      await setConfig([...basePath, entry.name, 'rule', entry.seq, 'prefix'], network);
      setEntries((prev) =>
        prev.map((e) => (e.id === entry.id ? { ...e, network } : e)),
      );
    },
    [setConfig, basePath],
  );

  const handleDelete = useCallback(
    async (entry: (typeof entries)[0]) => {
      await deleteConfig([...basePath, entry.name, 'rule', entry.seq]);
      setEntries((prev) => prev.filter((e) => e.id !== entry.id));
    },
    [deleteConfig, basePath],
  );

  return (
    <RuleTable
      rules={entries}
      columns={columns}
      onReorder={handleReorder}
      addLabel="Add Entry"
      onAdd={handleAdd}
      onEdit={handleEdit}
      onDelete={handleDelete}
    />
  );
}

export function PolicyPanel({ connection }: Props) {
  return (
    <ConfigPanel
      menuId="policy"
      tabs={TABS}
      connection={connection}
      renderContent={(data, tab) => {
        if (tab.id === 'route-map') return <RouteMapTable data={data} connection={connection} />;
        if (tab.id === 'access-list')
          return (
            <GenericListTable
              data={data}
              connection={connection}
              basePath={['policy', 'access-list']}
              nameCol="List Name"
            />
          );
        if (tab.id === 'prefix-list')
          return (
            <GenericListTable
              data={data}
              connection={connection}
              basePath={['policy', 'prefix-list']}
              nameCol="Prefix List"
            />
          );
        if (tab.id === 'as-path-list')
          return (
            <GenericListTable
              data={data}
              connection={connection}
              basePath={['policy', 'as-path-list']}
              nameCol="AS Path List"
            />
          );
        if (tab.id === 'community-list')
          return (
            <GenericListTable
              data={data}
              connection={connection}
              basePath={['policy', 'community-list']}
              nameCol="Community List"
            />
          );
        if (tab.id === 'extcommunity-list')
          return (
            <GenericListTable
              data={data}
              connection={connection}
              basePath={['policy', 'extcommunity-list']}
              nameCol="Ext Community"
            />
          );
        if (tab.id === 'large-community-list')
          return (
            <GenericListTable
              data={data}
              connection={connection}
              basePath={['policy', 'large-community-list']}
              nameCol="Large Community"
            />
          );
        if (tab.id === 'local-route')
          return <GenericConfigTab data={data} connection={connection} basePath={['policy', 'local-route']} />;
        return (
          <GenericConfigTab data={data} connection={connection} basePath={tab.configPath} />
        );
      }}
    />
  );
}
