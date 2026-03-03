'use client';

import { useState, useMemo, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { VyosConnectionInfo } from '@vymanage/vyos-client';
import { useConfigActions } from '@/lib/hooks/useConfig';
import { useClient } from '@/lib/context/ClientContext';
import { RuleTable } from '@/components/config/RuleTable';
import type { RuleColumn } from '@/components/config/RuleTable';
import { RuleEditor } from './RuleEditor';
import type { FirewallFamily, FirewallRule, RuleEditorValues } from './types';

const FAMILY_CONFIG_PATH: Record<FirewallFamily, string[]> = {
  ipv4: ['firewall', 'ipv4', 'name'],
  ipv6: ['firewall', 'ipv6', 'name'],
  bridge: ['firewall', 'bridge', 'name'],
};

type RawRuleConfig = {
  action?: string;
  protocol?: string;
  description?: string;
  disable?: unknown;
  source?: {
    address?: string;
    port?: string;
    group?: { 'address-group'?: string; 'port-group'?: string };
  };
  destination?: {
    address?: string;
    port?: string;
    group?: { 'address-group'?: string; 'port-group'?: string };
  };
};

function parseRules(ruleSetData: unknown): FirewallRule[] {
  if (!ruleSetData || typeof ruleSetData !== 'object') return [];
  const raw = ruleSetData as Record<string, unknown>;
  const rulesRaw = raw['rule'];
  if (!rulesRaw || typeof rulesRaw !== 'object') return [];

  return Object.entries(rulesRaw as Record<string, RawRuleConfig>)
    .map(([numStr, ruleCfg]) => ({
      id: Number(numStr),
      action: ruleCfg.action ?? 'drop',
      protocol: ruleCfg.protocol,
      description: ruleCfg.description,
      disabled: !!ruleCfg.disable,
      source: ruleCfg.source
        ? {
            address: ruleCfg.source.address,
            port: ruleCfg.source.port,
            group: ruleCfg.source.group,
          }
        : undefined,
      destination: ruleCfg.destination
        ? {
            address: ruleCfg.destination.address,
            port: ruleCfg.destination.port,
            group: ruleCfg.destination.group,
          }
        : undefined,
    }))
    .sort((a, b) => a.id - b.id);
}

function editorValuesFromRule(rule: FirewallRule): RuleEditorValues {
  return {
    id: rule.id,
    action: rule.action,
    protocol: rule.protocol ?? '',
    description: rule.description ?? '',
    disabled: rule.disabled ?? false,
    srcAddress: rule.source?.address ?? '',
    srcPort: String(rule.source?.port ?? ''),
    srcAddressGroup: rule.source?.group?.['address-group'] ?? '',
    srcPortGroup: rule.source?.group?.['port-group'] ?? '',
    dstAddress: rule.destination?.address ?? '',
    dstPort: String(rule.destination?.port ?? ''),
    dstAddressGroup: rule.destination?.group?.['address-group'] ?? '',
    dstPortGroup: rule.destination?.group?.['port-group'] ?? '',
  };
}

function defaultEditorValues(): RuleEditorValues {
  return {
    id: 10,
    action: 'accept',
    protocol: '',
    description: '',
    disabled: false,
    srcAddress: '',
    srcPort: '',
    srcAddressGroup: '',
    srcPortGroup: '',
    dstAddress: '',
    dstPort: '',
    dstAddressGroup: '',
    dstPortGroup: '',
  };
}

export interface RuleSetTabProps {
  family: FirewallFamily;
  connection: VyosConnectionInfo;
}

export function RuleSetTab({ family, connection }: RuleSetTabProps) {
  const [selectedRuleSet, setSelectedRuleSet] = useState<string>('');
  const [editorRule, setEditorRule] = useState<RuleEditorValues | null>(null);
  const [isNew, setIsNew] = useState(false);
  const queryClient = useQueryClient();
  const { setConfig, deleteConfig } = useConfigActions(connection);
  const client = useClient(connection);

  const basePath = FAMILY_CONFIG_PATH[family];

  const { data: ruleSetsData, isLoading } = useQuery({
    queryKey: ['config', connection.host, ...basePath],
    queryFn: () => client!.showConfig(basePath),
    enabled: !!client,
    refetchInterval: false,
  });

  const ruleSetNames = useMemo(() => {
    if (!ruleSetsData || typeof ruleSetsData !== 'object') return [];
    return Object.keys(ruleSetsData as Record<string, unknown>).sort();
  }, [ruleSetsData]);

  // Auto-select first ruleset
  const activeRuleSet = selectedRuleSet || ruleSetNames[0] || '';

  // Get rules for active ruleset with 10s hit counter polling
  const { data: ruleSetData } = useQuery({
    queryKey: ['config', connection.host, ...basePath, activeRuleSet],
    queryFn: () => client!.showConfig([...basePath, activeRuleSet]),
    enabled: !!client && !!activeRuleSet,
    refetchInterval: 10_000,
  });

  const rules = useMemo(() => parseRules(ruleSetData), [ruleSetData]);

  const columns: RuleColumn<FirewallRule>[] = [
    { id: 'id', header: '#', accessor: (r) => <span className="font-mono font-medium">{r.id}</span>, width: '60px' },
    {
      id: 'action',
      header: 'Action',
      accessor: (r) => (
        <span className={`rounded px-1.5 py-0.5 text-xs font-medium ${
          r.action === 'accept' ? 'bg-green-500/20 text-green-700 dark:text-green-400' :
          r.action === 'drop' || r.action === 'reject' ? 'bg-red-500/20 text-red-700 dark:text-red-400' :
          'bg-muted text-muted-foreground'
        }`}>
          {r.action}
        </span>
      ),
      width: '80px',
    },
    {
      id: 'protocol',
      header: 'Protocol',
      accessor: (r) => <span className="font-mono text-xs">{r.protocol || 'any'}</span>,
      width: '80px',
    },
    {
      id: 'source',
      header: 'Source',
      accessor: (r) => (
        <span className="font-mono text-xs">
          {r.source?.group?.['address-group']
            ? `grp:${r.source.group['address-group']}`
            : r.source?.address || 'any'}
          {r.source?.port ? `:${r.source.port}` : ''}
        </span>
      ),
    },
    {
      id: 'destination',
      header: 'Destination',
      accessor: (r) => (
        <span className="font-mono text-xs">
          {r.destination?.group?.['address-group']
            ? `grp:${r.destination.group['address-group']}`
            : r.destination?.address || 'any'}
          {r.destination?.port ? `:${r.destination.port}` : ''}
        </span>
      ),
    },
    {
      id: 'hits',
      header: 'Hits',
      accessor: (r) => (
        <span className="font-mono text-xs text-muted-foreground">
          {r.hitCount ?? '—'}
        </span>
      ),
      width: '60px',
    },
  ];

  const handleReorder = useCallback(
    async (fromIndex: number, toIndex: number) => {
      // Reorder is visual only — VyOS rules are ordered by number
      // In practice a full renumber would be needed; skip for now
      void fromIndex;
      void toIndex;
    },
    [],
  );

  const handleDelete = useCallback(
    async (rule: FirewallRule) => {
      if (!activeRuleSet) return;
      await deleteConfig([...basePath, activeRuleSet, 'rule', String(rule.id)]);
      await queryClient.invalidateQueries({ queryKey: ['config', connection.host, ...basePath] });
    },
    [activeRuleSet, basePath, deleteConfig, queryClient, connection.host],
  );

  const handleEdit = useCallback((rule: FirewallRule) => {
    setEditorRule(editorValuesFromRule(rule));
    setIsNew(false);
  }, []);

  const handleAdd = useCallback(() => {
    const nextId = rules.length > 0 ? Math.max(...rules.map((r) => r.id)) + 10 : 10;
    setEditorRule({ ...defaultEditorValues(), id: nextId });
    setIsNew(true);
  }, [rules]);

  const handleSubmitRule = useCallback(
    async (vals: RuleEditorValues) => {
      if (!activeRuleSet) return;
      const rulePath = [...basePath, activeRuleSet, 'rule', String(vals.id)];
      await setConfig([...rulePath, 'action'], vals.action);
      if (vals.protocol) await setConfig([...rulePath, 'protocol'], vals.protocol);
      if (vals.description) await setConfig([...rulePath, 'description'], vals.description);
      if (vals.srcAddress) await setConfig([...rulePath, 'source', 'address'], vals.srcAddress);
      if (vals.srcPort) await setConfig([...rulePath, 'source', 'port'], vals.srcPort);
      if (vals.srcAddressGroup) await setConfig([...rulePath, 'source', 'group', 'address-group'], vals.srcAddressGroup);
      if (vals.srcPortGroup) await setConfig([...rulePath, 'source', 'group', 'port-group'], vals.srcPortGroup);
      if (vals.dstAddress) await setConfig([...rulePath, 'destination', 'address'], vals.dstAddress);
      if (vals.dstPort) await setConfig([...rulePath, 'destination', 'port'], vals.dstPort);
      if (vals.dstAddressGroup) await setConfig([...rulePath, 'destination', 'group', 'address-group'], vals.dstAddressGroup);
      if (vals.dstPortGroup) await setConfig([...rulePath, 'destination', 'group', 'port-group'], vals.dstPortGroup);
      if (vals.disabled) await setConfig([...rulePath, 'disable']);
      else await deleteConfig([...rulePath, 'disable']).catch(() => undefined);
      await queryClient.invalidateQueries({ queryKey: ['config', connection.host, ...basePath] });
      setEditorRule(null);
    },
    [activeRuleSet, basePath, setConfig, deleteConfig, queryClient, connection.host],
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <span className="ml-2 text-sm text-muted-foreground">Loading rule sets...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Rule set selector */}
      <div className="flex items-center gap-3">
        <label className="text-sm font-medium whitespace-nowrap">Rule Set:</label>
        <select
          value={activeRuleSet}
          onChange={(e) => setSelectedRuleSet(e.target.value)}
          className="rounded-md border border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring min-w-[200px]"
        >
          {ruleSetNames.length === 0 && <option value="">No rule sets</option>}
          {ruleSetNames.map((name) => (
            <option key={name} value={name}>{name}</option>
          ))}
        </select>
        <button
          onClick={() => {
            const name = prompt('New rule set name:');
            if (!name) return;
            setConfig([...basePath, name, 'default-action'], 'drop').then(() => {
              queryClient.invalidateQueries({ queryKey: ['config', connection.host, ...basePath] });
              setSelectedRuleSet(name);
            });
          }}
          className="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-muted"
        >
          + New Set
        </button>
        {activeRuleSet && (
          <button
            onClick={() => {
              if (!confirm(`Delete rule set "${activeRuleSet}"?`)) return;
              deleteConfig([...basePath, activeRuleSet]).then(() => {
                queryClient.invalidateQueries({ queryKey: ['config', connection.host, ...basePath] });
                setSelectedRuleSet('');
              });
            }}
            className="rounded-md border border-destructive/30 px-3 py-1.5 text-sm text-destructive hover:bg-destructive/10"
          >
            Delete Set
          </button>
        )}
      </div>

      {/* Editor dialog */}
      {editorRule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50" onClick={() => setEditorRule(null)} />
          <div className="relative z-50 w-full max-w-2xl rounded-lg border border-border bg-background shadow-xl overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <h2 className="text-sm font-semibold">
                {isNew ? 'Add Rule' : `Edit Rule ${editorRule.id}`} — {activeRuleSet}
              </h2>
              <button onClick={() => setEditorRule(null)} className="text-muted-foreground hover:text-foreground">✕</button>
            </div>
            <RuleEditor
              values={editorRule}
              connection={connection}
              onSubmit={handleSubmitRule}
              onCancel={() => setEditorRule(null)}
              isNew={isNew}
            />
          </div>
        </div>
      )}

      {/* Rule table */}
      {activeRuleSet ? (
        <RuleTable
          rules={rules}
          columns={columns}
          onReorder={handleReorder}
          onAdd={handleAdd}
          onDelete={handleDelete}
          onEdit={handleEdit}
          addLabel="Add Rule"
        />
      ) : (
        <div className="rounded-md border border-border px-4 py-8 text-center text-sm text-muted-foreground">
          Select or create a rule set to manage rules
        </div>
      )}
    </div>
  );
}
