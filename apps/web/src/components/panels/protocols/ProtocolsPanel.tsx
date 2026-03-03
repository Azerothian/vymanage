'use client';

import type { VyosConnectionInfo } from '@vymanage/vyos-client';
import { ConfigPanel, type TabDefinition } from '@/components/config/ConfigPanel';
import { OperationalDataSection } from '@/components/config/OperationalDataSection';

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

function renderContent(data: unknown, tab: TabDefinition, connection: VyosConnectionInfo) {
  if (tab.id === 'bgp') {
    return (
      <div className="space-y-4">
        <pre className="max-h-96 overflow-auto rounded bg-muted/50 p-3 font-mono text-xs scrollbar-thin">
          {JSON.stringify(data, null, 2)}
        </pre>
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
        <pre className="max-h-96 overflow-auto rounded bg-muted/50 p-3 font-mono text-xs scrollbar-thin">
          {JSON.stringify(data, null, 2)}
        </pre>
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
    const routes = data && typeof data === 'object' ? data as Record<string, unknown> : {};
    const routeEntries = Object.entries(routes.route || {});
    return (
      <div className="space-y-4">
        <div className="rounded-md border border-border">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-3 py-2 text-left text-xs font-medium uppercase text-muted-foreground">Prefix</th>
                <th className="px-3 py-2 text-left text-xs font-medium uppercase text-muted-foreground">Next Hop</th>
                <th className="px-3 py-2 text-left text-xs font-medium uppercase text-muted-foreground">Interface</th>
                <th className="px-3 py-2 text-left text-xs font-medium uppercase text-muted-foreground">Distance</th>
              </tr>
            </thead>
            <tbody>
              {routeEntries.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-sm text-muted-foreground">No static routes configured</td>
                </tr>
              ) : (
                routeEntries.map(([prefix, cfg]) => {
                  const route = cfg as Record<string, unknown>;
                  const nexthops = Object.entries((route['next-hop'] as Record<string, unknown>) || {});
                  return nexthops.map(([nh, nhcfg]) => {
                    const nhObj = nhcfg as Record<string, unknown>;
                    return (
                      <tr key={`${prefix}-${nh}`} className="border-b border-border hover:bg-muted/50">
                        <td className="px-3 py-2 font-mono text-sm">{prefix}</td>
                        <td className="px-3 py-2 text-sm">{nh}</td>
                        <td className="px-3 py-2 text-sm">{String(nhObj.interface || '')}</td>
                        <td className="px-3 py-2 text-sm">{String(nhObj.distance || '')}</td>
                      </tr>
                    );
                  });
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <pre className="max-h-96 overflow-auto rounded bg-muted/50 p-3 font-mono text-xs scrollbar-thin">
      {data === undefined || data === null ? 'No configuration' : JSON.stringify(data, null, 2)}
    </pre>
  );
}

export function ProtocolsPanel({ connection }: Props) {
  return (
    <ConfigPanel
      menuId="protocols"
      tabs={TABS}
      connection={connection}
      renderContent={(data, tab) => renderContent(data, tab, connection)}
    />
  );
}
