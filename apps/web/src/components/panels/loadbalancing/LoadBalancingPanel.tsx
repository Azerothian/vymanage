'use client';

import type { VyosConnectionInfo } from '@vymanage/vyos-client';
import { ConfigPanel, type TabDefinition } from '@/components/config/ConfigPanel';
import { OperationalDataSection } from '@/components/config/OperationalDataSection';
import { GenericConfigTab } from '@/components/config/GenericConfigTab';
import { KeyedItemTable } from '@/components/config/KeyedItemTable';
import { useKeyedCrud } from '@/lib/hooks/useKeyedCrud';

const TABS: TabDefinition[] = [
  { id: 'wan', label: 'WAN', configPath: ['load-balancing', 'wan'], pollInterval: 5000 },
  { id: 'haproxy', label: 'HAProxy', configPath: ['load-balancing', 'haproxy'] },
];

interface Props {
  connection: VyosConnectionInfo;
}

const WAN_IFACE_COLUMNS = [
  {
    id: 'weight',
    header: 'Weight',
    accessor: (_key: string, value: Record<string, unknown>) => (
      <span>{String(value.weight || '1')}</span>
    ),
  },
  {
    id: 'nexthop',
    header: 'Nexthop',
    accessor: (_key: string, value: Record<string, unknown>) => (
      <span className="font-mono text-xs">{String(value['gateway'] || value.nexthop || '')}</span>
    ),
  },
  {
    id: 'health-check',
    header: 'Health Check',
    accessor: (_key: string, value: Record<string, unknown>) => {
      const hc = (value['health-check'] as Record<string, unknown>) || {};
      return <span>{String(hc.target || hc.type || '')}</span>;
    },
  },
];

const WAN_IFACE_FORM_FIELDS = [
  { name: 'weight', label: 'Weight', type: 'text' as const },
  { name: 'gateway', label: 'Nexthop / Gateway', type: 'text' as const },
];

const WAN_RULE_COLUMNS = [
  {
    id: 'description',
    header: 'Description',
    accessor: (_key: string, value: Record<string, unknown>) => (
      <span className="text-muted-foreground">{String(value.description || '')}</span>
    ),
  },
  {
    id: 'interface',
    header: 'Interface',
    accessor: (_key: string, value: Record<string, unknown>) => (
      <span>{String(value.interface || '')}</span>
    ),
  },
];

const WAN_RULE_FORM_FIELDS = [
  { name: 'description', label: 'Description', type: 'text' as const },
  { name: 'interface', label: 'Interface', type: 'text' as const },
];

function WanContent({ data, connection }: { data: unknown; connection: VyosConnectionInfo }) {
  const wan = data && typeof data === 'object' ? data as Record<string, unknown> : {};
  const interfaces = (wan.interface as Record<string, unknown>) || null;
  const rules = (wan.rule as Record<string, unknown>) || null;

  const ifaceCrud = useKeyedCrud(connection, ['load-balancing', 'wan', 'interface']);
  const ruleCrud = useKeyedCrud(connection, ['load-balancing', 'wan', 'rule']);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="mb-2 text-sm font-medium">WAN Interfaces</h3>
        <KeyedItemTable
          data={interfaces}
          columns={WAN_IFACE_COLUMNS}
          keyHeader="Interface"
          emptyMessage="No WAN interfaces configured"
          onAdd={ifaceCrud.addItem}
          onEdit={ifaceCrud.updateItem}
          onDelete={ifaceCrud.deleteItem}
          addLabel="Add Interface"
          formFields={WAN_IFACE_FORM_FIELDS}
          formTitle="WAN Interface"
        />
      </div>

      <div>
        <h3 className="mb-2 text-sm font-medium">Load Balancing Rules</h3>
        <KeyedItemTable
          data={rules}
          columns={WAN_RULE_COLUMNS}
          keyHeader="Rule"
          emptyMessage="No load balancing rules configured"
          onAdd={ruleCrud.addItem}
          onEdit={ruleCrud.updateItem}
          onDelete={ruleCrud.deleteItem}
          addLabel="Add Rule"
          formFields={WAN_RULE_FORM_FIELDS}
          formTitle="LB Rule"
        />
      </div>

      <OperationalDataSection
        connection={connection}
        path={['load-balancing', 'wan', 'status']}
        pollInterval={5000}
        title="WAN LB Status"
      />
    </div>
  );
}

export function LoadBalancingPanel({ connection }: Props) {
  return (
    <ConfigPanel
      menuId="loadbalancing"
      tabs={TABS}
      connection={connection}
      renderContent={(data, tab) => {
        if (tab.id === 'wan') return <WanContent data={data} connection={connection} />;
        if (tab.id === 'haproxy') {
          return (
            <GenericConfigTab
              data={data}
              connection={connection}
              basePath={['load-balancing', 'haproxy']}
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
