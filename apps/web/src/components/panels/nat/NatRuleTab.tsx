'use client';

import { useState, useMemo, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { VyosConnectionInfo } from '@vymanage/vyos-client';
import { useConfigActions } from '@/lib/hooks/useConfig';
import { useClient } from '@/lib/context/ClientContext';
import { RuleTable } from '@/components/config/RuleTable';
import type { RuleColumn } from '@/components/config/RuleTable';
import { NatRuleEditor } from './NatRuleEditor';
import type { NatFamily, NatRule, NatRuleEditorValues } from './types';

const FAMILY_CONFIG_PATH: Record<NatFamily, string[]> = {
  source: ['nat', 'source', 'rule'],
  destination: ['nat', 'destination', 'rule'],
  nat64: ['nat', 'nat64', 'rule'],
  nat66: ['nat', 'nat66', 'rule'],
  cgnat: ['nat', 'cgnat', 'rule'],
};

type RawNatRule = {
  description?: string;
  disable?: unknown;
  protocol?: string;
  'outbound-interface'?: { name?: string; group?: string };
  'inbound-interface'?: { name?: string; group?: string };
  source?: { address?: string; port?: string; prefix?: string };
  destination?: { address?: string; port?: string; prefix?: string };
  translation?: { address?: string; port?: string; prefix?: string };
};

function parseNatRules(data: unknown, family: NatFamily): NatRule[] {
  if (!data || typeof data !== 'object') return [];
  return Object.entries(data as Record<string, RawNatRule>)
    .map(([numStr, cfg]) => ({
      id: Number(numStr),
      type: family,
      description: cfg.description,
      disabled: !!cfg.disable,
      protocol: cfg.protocol,
      outboundInterface: cfg['outbound-interface']?.name,
      inboundInterface: cfg['inbound-interface']?.name,
      outboundInterfaceGroup: cfg['outbound-interface']?.group,
      inboundInterfaceGroup: cfg['inbound-interface']?.group,
      source: cfg.source,
      destination: cfg.destination,
      translation: cfg.translation,
    }))
    .sort((a, b) => a.id - b.id);
}

function editorValuesFromRule(rule: NatRule): NatRuleEditorValues {
  return {
    id: rule.id,
    description: rule.description ?? '',
    disabled: rule.disabled ?? false,
    protocol: rule.protocol ?? '',
    outboundInterface: rule.outboundInterface ?? '',
    inboundInterface: rule.inboundInterface ?? '',
    outboundInterfaceGroup: rule.outboundInterfaceGroup ?? '',
    inboundInterfaceGroup: rule.inboundInterfaceGroup ?? '',
    srcAddress: rule.source?.address ?? '',
    srcPort: String(rule.source?.port ?? ''),
    dstAddress: rule.destination?.address ?? '',
    dstPort: String(rule.destination?.port ?? ''),
    translationAddress: rule.translation?.address ?? '',
    translationPort: String(rule.translation?.port ?? ''),
    translationPrefix: rule.translation?.prefix ?? '',
  };
}

function defaultEditorValues(): NatRuleEditorValues {
  return {
    id: 10,
    description: '',
    disabled: false,
    protocol: '',
    outboundInterface: '',
    inboundInterface: '',
    outboundInterfaceGroup: '',
    inboundInterfaceGroup: '',
    srcAddress: '',
    srcPort: '',
    dstAddress: '',
    dstPort: '',
    translationAddress: '',
    translationPort: '',
    translationPrefix: '',
  };
}

export interface NatRuleTabProps {
  family: NatFamily;
  connection: VyosConnectionInfo;
}

export function NatRuleTab({ family, connection }: NatRuleTabProps) {
  const [editorRule, setEditorRule] = useState<NatRuleEditorValues | null>(null);
  const [isNew, setIsNew] = useState(false);
  const queryClient = useQueryClient();
  const { setConfig, deleteConfig } = useConfigActions(connection);
  const client = useClient(connection);

  const rulePath = FAMILY_CONFIG_PATH[family];

  const { data, isLoading } = useQuery({
    queryKey: ['config', connection.host, ...rulePath],
    queryFn: () => client!.showConfig(rulePath),
    enabled: !!client,
    refetchInterval: false,
  });

  const rules = useMemo(() => parseNatRules(data, family), [data, family]);

  const columns: RuleColumn<NatRule>[] = [
    {
      id: 'id',
      header: '#',
      accessor: (r) => <span className="font-mono font-medium">{r.id}</span>,
      width: '60px',
    },
    {
      id: 'type',
      header: 'Type',
      accessor: (r) => (
        <span className="rounded bg-muted px-1.5 py-0.5 text-xs font-medium text-muted-foreground">
          {r.type.toUpperCase()}
        </span>
      ),
      width: '80px',
    },
    {
      id: 'interface',
      header: 'Interface',
      accessor: (r) => (
        <span className="font-mono text-xs">
          {r.outboundInterface || r.inboundInterface || r.outboundInterfaceGroup
            ? (r.outboundInterface || r.inboundInterface || `grp:${r.outboundInterfaceGroup}`)
            : <span className="text-muted-foreground">any</span>}
        </span>
      ),
    },
    {
      id: 'source',
      header: 'Source',
      accessor: (r) => (
        <span className="font-mono text-xs">
          {r.source?.address || r.source?.prefix || <span className="text-muted-foreground">any</span>}
          {r.source?.port ? `:${r.source.port}` : ''}
        </span>
      ),
    },
    {
      id: 'destination',
      header: 'Destination',
      accessor: (r) => (
        <span className="font-mono text-xs">
          {r.destination?.address || r.destination?.prefix || <span className="text-muted-foreground">any</span>}
          {r.destination?.port ? `:${r.destination.port}` : ''}
        </span>
      ),
    },
    {
      id: 'translation',
      header: 'Translation',
      accessor: (r) => (
        <span className="font-mono text-xs">
          {r.translation?.address || r.translation?.prefix || <span className="text-muted-foreground">—</span>}
          {r.translation?.port ? `:${r.translation.port}` : ''}
        </span>
      ),
    },
    {
      id: 'description',
      header: 'Description',
      accessor: (r) => (
        <span className="text-xs text-muted-foreground">{r.description || '—'}</span>
      ),
    },
  ];

  const handleReorder = useCallback((_from: number, _to: number) => {
    // NAT rules ordered by number; reorder not supported without renumbering
  }, []);

  const handleDelete = useCallback(
    async (rule: NatRule) => {
      await deleteConfig([...rulePath, String(rule.id)]);
      await queryClient.invalidateQueries({ queryKey: ['config', connection.host, ...rulePath] });
    },
    [rulePath, deleteConfig, queryClient, connection.host],
  );

  const handleEdit = useCallback((rule: NatRule) => {
    setEditorRule(editorValuesFromRule(rule));
    setIsNew(false);
  }, []);

  const handleAdd = useCallback(() => {
    const nextId = rules.length > 0 ? Math.max(...rules.map((r) => r.id)) + 10 : 10;
    setEditorRule({ ...defaultEditorValues(), id: nextId });
    setIsNew(true);
  }, [rules]);

  const handleSubmitRule = useCallback(
    async (vals: NatRuleEditorValues) => {
      const base = [...rulePath, String(vals.id)];
      if (vals.description) await setConfig([...base, 'description'], vals.description);
      if (vals.protocol) await setConfig([...base, 'protocol'], vals.protocol);
      if (vals.outboundInterface) await setConfig([...base, 'outbound-interface', 'name'], vals.outboundInterface);
      if (vals.inboundInterface) await setConfig([...base, 'inbound-interface', 'name'], vals.inboundInterface);
      if (vals.outboundInterfaceGroup) await setConfig([...base, 'outbound-interface', 'group'], vals.outboundInterfaceGroup);
      if (vals.inboundInterfaceGroup) await setConfig([...base, 'inbound-interface', 'group'], vals.inboundInterfaceGroup);
      if (vals.srcAddress) await setConfig([...base, 'source', 'address'], vals.srcAddress);
      if (vals.srcPort) await setConfig([...base, 'source', 'port'], vals.srcPort);
      if (vals.dstAddress) await setConfig([...base, 'destination', 'address'], vals.dstAddress);
      if (vals.dstPort) await setConfig([...base, 'destination', 'port'], vals.dstPort);
      if (vals.translationAddress) await setConfig([...base, 'translation', 'address'], vals.translationAddress);
      if (vals.translationPort) await setConfig([...base, 'translation', 'port'], vals.translationPort);
      if (vals.translationPrefix) await setConfig([...base, 'translation', 'prefix'], vals.translationPrefix);
      if (vals.disabled) await setConfig([...base, 'disable']);
      else await deleteConfig([...base, 'disable']).catch(() => undefined);
      await queryClient.invalidateQueries({ queryKey: ['config', connection.host, ...rulePath] });
      setEditorRule(null);
    },
    [rulePath, setConfig, deleteConfig, queryClient, connection.host],
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <span className="ml-2 text-sm text-muted-foreground">Loading rules...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Editor dialog */}
      {editorRule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50" onClick={() => setEditorRule(null)} />
          <div className="relative z-50 w-full max-w-2xl rounded-lg border border-border bg-background shadow-xl overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <h2 className="text-sm font-semibold">
                {isNew ? 'Add NAT Rule' : `Edit Rule ${editorRule.id}`} — {family.toUpperCase()}
              </h2>
              <button onClick={() => setEditorRule(null)} className="text-muted-foreground hover:text-foreground">✕</button>
            </div>
            <NatRuleEditor
              values={editorRule}
              family={family}
              connection={connection}
              onSubmit={handleSubmitRule}
              onCancel={() => setEditorRule(null)}
              isNew={isNew}
            />
          </div>
        </div>
      )}

      <RuleTable
        rules={rules}
        columns={columns}
        onReorder={handleReorder}
        onAdd={handleAdd}
        onDelete={handleDelete}
        onEdit={handleEdit}
        addLabel="Add Rule"
      />
    </div>
  );
}
