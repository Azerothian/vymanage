'use client';

import type { VyosConnectionInfo } from '@vymanage/vyos-client';
import { ConfigPanel, type TabDefinition } from '@/components/config/ConfigPanel';
import { OperationalDataSection } from '@/components/config/OperationalDataSection';
import { GenericConfigTab } from '@/components/config/GenericConfigTab';
import { KeyedItemTable } from '@/components/config/KeyedItemTable';
import { useKeyedCrud } from '@/lib/hooks/useKeyedCrud';

const TABS: TabDefinition[] = [
  { id: 'containers', label: 'Containers', configPath: ['container', 'name'], pollInterval: 10000 },
  { id: 'networks', label: 'Networks', configPath: ['container', 'network'] },
  { id: 'registries', label: 'Registries', configPath: ['container', 'registry'] },
];

interface Props {
  connection: VyosConnectionInfo;
}

const CONTAINER_COLUMNS = [
  {
    id: 'image',
    header: 'Image',
    accessor: (_key: string, value: Record<string, unknown>) => (
      <span className="font-mono text-xs">{String(value.image || '')}</span>
    ),
  },
  {
    id: 'network',
    header: 'Network',
    accessor: (_key: string, value: Record<string, unknown>) => {
      const networks = Object.keys((value.network as Record<string, unknown>) || {}).join(', ');
      return <span>{networks || '-'}</span>;
    },
  },
  {
    id: 'restart',
    header: 'Restart',
    accessor: (_key: string, value: Record<string, unknown>) => (
      <span>{String(value.restart || 'no')}</span>
    ),
  },
  {
    id: 'memory',
    header: 'Memory',
    accessor: (_key: string, value: Record<string, unknown>) => (
      <span>{String(value.memory || '')}</span>
    ),
  },
];

const CONTAINER_FORM_FIELDS = [
  { name: 'image', label: 'Image', type: 'text' as const },
  {
    name: 'restart',
    label: 'Restart',
    type: 'select' as const,
    options: [
      { value: 'no', label: 'no' },
      { value: 'on-failure', label: 'on-failure' },
      { value: 'always', label: 'always' },
    ],
  },
  { name: 'memory', label: 'Memory', type: 'text' as const },
];

const NETWORK_COLUMNS = [
  {
    id: 'prefix',
    header: 'Prefix',
    accessor: (_key: string, value: Record<string, unknown>) => {
      const prefixes = Object.keys((value.prefix as Record<string, unknown>) || {}).join(', ');
      return <span className="font-mono text-xs">{prefixes || '-'}</span>;
    },
  },
  {
    id: 'description',
    header: 'Description',
    accessor: (_key: string, value: Record<string, unknown>) => (
      <span className="text-muted-foreground">{String(value.description || '')}</span>
    ),
  },
];

const NETWORK_FORM_FIELDS = [
  { name: 'prefix', label: 'Prefix', type: 'text' as const },
  { name: 'description', label: 'Description', type: 'text' as const },
];

function ContainerList({ data, connection }: { data: unknown; connection: VyosConnectionInfo }) {
  const containers = data && typeof data === 'object' ? data as Record<string, unknown> : null;
  const { addItem, updateItem, deleteItem } = useKeyedCrud(connection, ['container', 'name']);

  return (
    <div className="space-y-4">
      <KeyedItemTable
        data={containers}
        columns={CONTAINER_COLUMNS}
        keyHeader="Name"
        emptyMessage="No containers configured"
        onAdd={addItem}
        onEdit={updateItem}
        onDelete={deleteItem}
        addLabel="Add Container"
        formFields={CONTAINER_FORM_FIELDS}
        formTitle="Container"
      />
      <OperationalDataSection
        connection={connection}
        path={['container', 'summary']}
        pollInterval={10000}
        title="Container Status"
      />
    </div>
  );
}

function NetworkList({ data, connection }: { data: unknown; connection: VyosConnectionInfo }) {
  const networks = data && typeof data === 'object' ? data as Record<string, unknown> : null;
  const { addItem, updateItem, deleteItem } = useKeyedCrud(connection, ['container', 'network']);

  return (
    <KeyedItemTable
      data={networks}
      columns={NETWORK_COLUMNS}
      keyHeader="Network Name"
      emptyMessage="No container networks configured"
      onAdd={addItem}
      onEdit={updateItem}
      onDelete={deleteItem}
      addLabel="Add Network"
      formFields={NETWORK_FORM_FIELDS}
      formTitle="Network"
    />
  );
}

export function ContainersPanel({ connection }: Props) {
  return (
    <ConfigPanel
      menuId="containers"
      tabs={TABS}
      connection={connection}
      renderContent={(data, tab) => {
        if (tab.id === 'containers') return <ContainerList data={data} connection={connection} />;
        if (tab.id === 'networks') return <NetworkList data={data} connection={connection} />;
        if (tab.id === 'registries') {
          return (
            <GenericConfigTab
              data={data}
              connection={connection}
              basePath={['container', 'registry']}
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
