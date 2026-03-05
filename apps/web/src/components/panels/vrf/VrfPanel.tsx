'use client';

import type { VyosConnectionInfo } from '@vymanage/vyos-client';
import { ConfigPanel, type TabDefinition } from '@/components/config/ConfigPanel';
import { KeyedItemTable, type KeyedColumn } from '@/components/config/KeyedItemTable';
import { useKeyedCrud } from '@/lib/hooks/useKeyedCrud';

const TABS: TabDefinition[] = [
  { id: 'vrf-instances', label: 'VRF Instances', configPath: ['vrf', 'name'] },
];

interface Props {
  connection: VyosConnectionInfo;
}

const VRF_COLUMNS: KeyedColumn[] = [
  {
    id: 'table',
    header: 'Table ID',
    width: '100px',
    accessor: (_key, val) => <span>{String(val.table || '')}</span>,
  },
  {
    id: 'description',
    header: 'Description',
    accessor: (_key, val) => <span className="text-muted-foreground">{String(val.description || '')}</span>,
  },
  {
    id: 'protocols',
    header: 'Protocols',
    accessor: (_key, val) => {
      const protocols = Object.keys((val.protocols as Record<string, unknown>) || {}).join(', ');
      return <span>{protocols || '-'}</span>;
    },
  },
];

const VRF_FORM_FIELDS = [
  { name: 'table', label: 'Table ID', type: 'text' as const },
  { name: 'description', label: 'Description', type: 'text' as const },
];

function VrfCrudTable({ data, connection }: { data: unknown; connection: VyosConnectionInfo }) {
  const { addItem, updateItem, deleteItem } = useKeyedCrud(connection, ['vrf', 'name']);
  const tableData = data && typeof data === 'object' ? (data as Record<string, unknown>) : null;

  return (
    <KeyedItemTable
      data={tableData}
      columns={VRF_COLUMNS}
      keyHeader="VRF Name"
      emptyMessage="No VRF instances configured"
      addLabel="Add VRF"
      formTitle="VRF Instance"
      formFields={VRF_FORM_FIELDS}
      onAdd={addItem}
      onEdit={updateItem}
      onDelete={deleteItem}
    />
  );
}

export function VrfPanel({ connection }: Props) {
  return (
    <ConfigPanel
      menuId="vrf"
      tabs={TABS}
      connection={connection}
      renderContent={(data) => <VrfCrudTable data={data} connection={connection} />}
    />
  );
}
