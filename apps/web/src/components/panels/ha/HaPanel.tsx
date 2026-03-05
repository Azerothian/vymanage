'use client';

import type { VyosConnectionInfo } from '@vymanage/vyos-client';
import { ConfigPanel, type TabDefinition } from '@/components/config/ConfigPanel';
import { OperationalDataSection } from '@/components/config/OperationalDataSection';
import { GenericConfigTab } from '@/components/config/GenericConfigTab';
import { KeyedItemTable } from '@/components/config/KeyedItemTable';
import { useKeyedCrud } from '@/lib/hooks/useKeyedCrud';

const TABS: TabDefinition[] = [
  { id: 'vrrp', label: 'VRRP', configPath: ['high-availability', 'vrrp'], pollInterval: 5000 },
  { id: 'virtual-server', label: 'Virtual Server', configPath: ['high-availability', 'virtual-server'] },
];

interface Props {
  connection: VyosConnectionInfo;
}

const VRRP_COLUMNS = [
  {
    id: 'interface',
    header: 'Interface',
    accessor: (_key: string, value: Record<string, unknown>) => (
      <span>{String(value.interface || '')}</span>
    ),
  },
  {
    id: 'vrid',
    header: 'VRID',
    accessor: (_key: string, value: Record<string, unknown>) => (
      <span>{String(value.vrid || '')}</span>
    ),
  },
  {
    id: 'priority',
    header: 'Priority',
    accessor: (_key: string, value: Record<string, unknown>) => (
      <span>{String(value.priority || '100')}</span>
    ),
  },
  {
    id: 'virtual-address',
    header: 'Virtual IPs',
    accessor: (_key: string, value: Record<string, unknown>) => {
      const vips = Array.isArray(value['virtual-address'])
        ? (value['virtual-address'] as string[]).join(', ')
        : String(value['virtual-address'] || '');
      return <span className="font-mono text-xs">{vips || '-'}</span>;
    },
  },
];

const VRRP_FORM_FIELDS = [
  { name: 'interface', label: 'Interface', type: 'text' as const },
  { name: 'vrid', label: 'VRID', type: 'text' as const },
  { name: 'priority', label: 'Priority', type: 'text' as const },
  { name: 'virtual-address', label: 'Virtual Address', type: 'text' as const },
];

function VrrpContent({ data, connection }: { data: unknown; connection: VyosConnectionInfo }) {
  const vrrp = data && typeof data === 'object' ? data as Record<string, unknown> : {};
  const groups = (vrrp.group as Record<string, unknown>) || null;
  const { addItem, updateItem, deleteItem } = useKeyedCrud(connection, ['high-availability', 'vrrp', 'group']);

  return (
    <div className="space-y-4">
      <KeyedItemTable
        data={groups}
        columns={VRRP_COLUMNS}
        keyHeader="Group"
        emptyMessage="No VRRP groups configured"
        onAdd={addItem}
        onEdit={updateItem}
        onDelete={deleteItem}
        addLabel="Add Group"
        formFields={VRRP_FORM_FIELDS}
        formTitle="VRRP Group"
      />
      <OperationalDataSection
        connection={connection}
        path={['vrrp', 'detail']}
        pollInterval={5000}
        title="VRRP State"
      />
    </div>
  );
}

export function HaPanel({ connection }: Props) {
  return (
    <ConfigPanel
      menuId="ha"
      tabs={TABS}
      connection={connection}
      renderContent={(data, tab) => {
        if (tab.id === 'vrrp') return <VrrpContent data={data} connection={connection} />;
        if (tab.id === 'virtual-server') {
          return (
            <GenericConfigTab
              data={data}
              connection={connection}
              basePath={['high-availability', 'virtual-server']}
            />
          );
        }
        return (
          <GenericConfigTab data={data} connection={connection} basePath={tab.configPath} />
        );
      }}
    />
  );
}
