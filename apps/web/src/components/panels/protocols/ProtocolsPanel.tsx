'use client';

import type { VyosConnectionInfo } from '@vymanage/vyos-client';
import { ConfigPanel, type TabDefinition } from '@/components/config/ConfigPanel';
import { OperationalDataSection } from '@/components/config/OperationalDataSection';
import { GenericConfigTab } from '@/components/config/GenericConfigTab';
import { KeyedItemTable } from '@/components/config/KeyedItemTable';
import { useKeyedCrud } from '@/lib/hooks/useKeyedCrud';

const TABS: TabDefinition[] = [
  { id: 'static', label: 'Static Routes', configPath: ['protocols', 'static'] },
  { id: 'bgp', label: 'BGP', configPath: ['protocols', 'bgp'], pollInterval: 10000 },
  { id: 'ospf', label: 'OSPF', configPath: ['protocols', 'ospf'], pollInterval: 10000 },
  { id: 'ospfv3', label: 'OSPFv3', configPath: ['protocols', 'ospfv3'], pollInterval: 10000 },
  { id: 'isis', label: 'ISIS', configPath: ['protocols', 'isis'] },
  { id: 'rip', label: 'RIP', configPath: ['protocols', 'rip'] },
  { id: 'babel', label: 'Babel', configPath: ['protocols', 'babel'] },
  { id: 'bfd', label: 'BFD', configPath: ['protocols', 'bfd'] },
  { id: 'mpls', label: 'MPLS', configPath: ['protocols', 'mpls'] },
  { id: 'segment-routing', label: 'Segment Routing', configPath: ['protocols', 'segment-routing'] },
  { id: 'igmp-proxy', label: 'IGMP Proxy', configPath: ['protocols', 'igmp-proxy'] },
  { id: 'pim', label: 'PIM', configPath: ['protocols', 'pim'] },
  { id: 'multicast', label: 'Multicast', configPath: ['protocols', 'multicast'] },
  { id: 'rpki', label: 'RPKI', configPath: ['protocols', 'rpki'] },
  { id: 'failover', label: 'Failover', configPath: ['protocols', 'failover'] },
];

interface Props {
  connection: VyosConnectionInfo;
}

function StaticRoutesTab({ data, connection }: { data: unknown; connection: VyosConnectionInfo }) {
  const basePath = ['protocols', 'static', 'route'];
  const { addItem, updateItem, deleteItem } = useKeyedCrud(connection, basePath);
  const routes = data && typeof data === 'object' ? (data as Record<string, unknown>) : {};
  const routeData = (routes.route && typeof routes.route === 'object' ? routes.route : {}) as Record<string, unknown>;

  return (
    <div className="space-y-4">
      <KeyedItemTable
        data={routeData}
        keyHeader="Prefix"
        emptyMessage="No static routes configured"
        columns={[
          {
            id: 'next-hop',
            header: 'Next Hop',
            accessor: (_key, value) => {
              const nexthops = Object.keys((value['next-hop'] as Record<string, unknown>) || {});
              return <span className="font-mono text-xs">{nexthops.join(', ') || '-'}</span>;
            },
          },
          {
            id: 'distance',
            header: 'Distance',
            accessor: (_key, value) => {
              const nexthops = Object.values((value['next-hop'] as Record<string, unknown>) || {});
              const dist = nexthops.length > 0 ? (nexthops[0] as Record<string, unknown>)?.distance : undefined;
              return <span className="font-mono text-xs">{dist !== undefined ? String(dist) : '-'}</span>;
            },
          },
        ]}
        formFields={[
          { name: 'next-hop', label: 'Next Hop', type: 'text' },
        ]}
        formTitle="Static Route"
        addLabel="Add Route"
        onAdd={(key, fields) => addItem(key, fields)}
        onEdit={(key, fields) => updateItem(key, fields)}
        onDelete={(key) => deleteItem(key)}
      />
    </div>
  );
}

function renderContent(data: unknown, tab: TabDefinition, connection: VyosConnectionInfo) {
  if (tab.id === 'bgp') {
    return (
      <div className="space-y-4">
        <GenericConfigTab data={data} connection={connection} basePath={tab.configPath} />
        <OperationalDataSection
          connection={connection}
          path={['bgp', 'summary']}
          pollInterval={10000}
          title="BGP Summary"
        />
      </div>
    );
  }

  if (tab.id === 'ospf') {
    return (
      <div className="space-y-4">
        <GenericConfigTab data={data} connection={connection} basePath={tab.configPath} />
        <OperationalDataSection
          connection={connection}
          path={['ospf', 'neighbor']}
          pollInterval={10000}
          title="OSPF Neighbors"
        />
      </div>
    );
  }

  if (tab.id === 'static') {
    return <StaticRoutesTab data={data} connection={connection} />;
  }

  return <GenericConfigTab data={data} connection={connection} basePath={tab.configPath} />;
}

export function ProtocolsPanel({ connection }: Props) {
  return (
    <ConfigPanel
      menuId="routing"
      tabs={TABS}
      connection={connection}
      renderContent={(data, tab) => renderContent(data, tab, connection)}
    />
  );
}
