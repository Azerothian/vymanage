'use client';

import type { VyosConnectionInfo } from '@vymanage/vyos-client';
import { ConfigPanel, type TabDefinition } from '@/components/config/ConfigPanel';
import { KeyedItemTable, type KeyedColumn } from '@/components/config/KeyedItemTable';
import { useKeyedCrud } from '@/lib/hooks/useKeyedCrud';

const TABS: TabDefinition[] = [
  { id: 'shaper', label: 'Shaper', configPath: ['traffic-policy', 'shaper'] },
  { id: 'priority-queue', label: 'Priority Queue', configPath: ['traffic-policy', 'priority-queue'] },
  { id: 'round-robin', label: 'Round Robin', configPath: ['traffic-policy', 'round-robin'] },
  { id: 'random-detect', label: 'Random Detect', configPath: ['traffic-policy', 'random-detect'] },
  { id: 'cake', label: 'CAKE', configPath: ['traffic-policy', 'cake'] },
  { id: 'fq-codel', label: 'FQ-CoDel', configPath: ['traffic-policy', 'fq-codel'] },
  { id: 'fair-queue', label: 'Fair Queue', configPath: ['traffic-policy', 'fair-queue'] },
  { id: 'drop-tail', label: 'Drop Tail', configPath: ['traffic-policy', 'drop-tail'] },
  { id: 'rate-control', label: 'Rate Control', configPath: ['traffic-policy', 'rate-control'] },
  { id: 'limiter', label: 'Limiter', configPath: ['traffic-policy', 'limiter'] },
  { id: 'network-emulator', label: 'Network Emulator', configPath: ['traffic-policy', 'network-emulator'] },
];

interface Props {
  connection: VyosConnectionInfo;
}

const POLICY_COLUMNS: KeyedColumn[] = [
  {
    id: 'description',
    header: 'Description',
    accessor: (_key, val) => <span className="text-muted-foreground">{String(val.description || '')}</span>,
  },
  {
    id: 'bandwidth',
    header: 'Bandwidth',
    width: '120px',
    accessor: (_key, val) => <span className="font-mono text-sm">{String(val.bandwidth || '')}</span>,
  },
];

const POLICY_FORM_FIELDS = [
  { name: 'description', label: 'Description', type: 'text' as const },
  { name: 'bandwidth', label: 'Bandwidth', type: 'text' as const },
];

function PolicyCrudTable({
  data,
  connection,
  basePath,
  policyType,
}: {
  data: unknown;
  connection: VyosConnectionInfo;
  basePath: string[];
  policyType: string;
}) {
  const { addItem, updateItem, deleteItem } = useKeyedCrud(connection, basePath);
  const tableData = data && typeof data === 'object' ? (data as Record<string, unknown>) : null;

  return (
    <KeyedItemTable
      data={tableData}
      columns={POLICY_COLUMNS}
      emptyMessage={`No ${policyType} policies configured`}
      addLabel={`Add ${policyType} Policy`}
      formTitle={`${policyType} Policy`}
      formFields={POLICY_FORM_FIELDS}
      onAdd={addItem}
      onEdit={updateItem}
      onDelete={deleteItem}
    />
  );
}

export function QosPanel({ connection }: Props) {
  return (
    <ConfigPanel
      menuId="trafficpolicy"
      tabs={TABS}
      connection={connection}
      renderContent={(data, tab) => {
        const policyTypeMap: Record<string, string> = {
          shaper: 'Shaper',
          'priority-queue': 'Priority Queue',
          'round-robin': 'Round Robin',
          'random-detect': 'Random Detect',
          cake: 'CAKE',
          'fq-codel': 'FQ-CoDel',
          'fair-queue': 'Fair Queue',
          'drop-tail': 'Drop Tail',
          'rate-control': 'Rate Control',
          limiter: 'Limiter',
          'network-emulator': 'Network Emulator',
        };
        return (
          <PolicyCrudTable
            data={data}
            connection={connection}
            basePath={tab.configPath}
            policyType={policyTypeMap[tab.id] || tab.label}
          />
        );
      }}
    />
  );
}
