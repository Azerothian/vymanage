'use client';

import type { VyosConnectionInfo } from '@vymanage/vyos-client';
import { ConfigPanel, type TabDefinition } from '@/components/config/ConfigPanel';
import { OperationalDataSection } from '@/components/config/OperationalDataSection';

const TABS: TabDefinition[] = [
  { id: 'wan', label: 'WAN', configPath: ['load-balancing', 'wan'], pollInterval: 5000 },
  { id: 'haproxy', label: 'HAProxy', configPath: ['load-balancing', 'haproxy'] },
];

interface Props {
  connection: VyosConnectionInfo;
}

function WanContent({ data, connection }: { data: unknown; connection: VyosConnectionInfo }) {
  const wan = data && typeof data === 'object' ? data as Record<string, unknown> : {};
  const interfaces = Object.entries((wan.interface as Record<string, unknown>) || {});
  const rules = Object.entries((wan.rule as Record<string, unknown>) || {});

  return (
    <div className="space-y-6">
      <div>
        <h3 className="mb-2 text-sm font-medium">WAN Interfaces</h3>
        <div className="rounded-md border border-border">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-3 py-2 text-left text-xs font-medium uppercase text-muted-foreground">Interface</th>
                <th className="px-3 py-2 text-left text-xs font-medium uppercase text-muted-foreground">Weight</th>
                <th className="px-3 py-2 text-left text-xs font-medium uppercase text-muted-foreground">Nexthop</th>
                <th className="px-3 py-2 text-left text-xs font-medium uppercase text-muted-foreground">Health Check</th>
              </tr>
            </thead>
            <tbody>
              {interfaces.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-sm text-muted-foreground">No WAN interfaces configured</td>
                </tr>
              ) : (
                interfaces.map(([iface, cfg]) => {
                  const ifCfg = cfg as Record<string, unknown>;
                  const hc = ifCfg['health-check'] as Record<string, unknown> || {};
                  return (
                    <tr key={iface} className="border-b border-border hover:bg-muted/50">
                      <td className="px-3 py-2 font-medium text-sm">{iface}</td>
                      <td className="px-3 py-2 text-sm">{String(ifCfg.weight || '1')}</td>
                      <td className="px-3 py-2 font-mono text-sm">{String(ifCfg['gateway'] || ifCfg.nexthop || '')}</td>
                      <td className="px-3 py-2 text-sm">{String(hc.target || hc.type || '')}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {rules.length > 0 && (
        <div>
          <h3 className="mb-2 text-sm font-medium">Load Balancing Rules ({rules.length})</h3>
          <div className="rounded-md border border-border">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-3 py-2 text-left text-xs font-medium uppercase text-muted-foreground">Rule</th>
                  <th className="px-3 py-2 text-left text-xs font-medium uppercase text-muted-foreground">Description</th>
                  <th className="px-3 py-2 text-left text-xs font-medium uppercase text-muted-foreground">Interface</th>
                </tr>
              </thead>
              <tbody>
                {rules.map(([seq, cfg]) => {
                  const ruleCfg = cfg as Record<string, unknown>;
                  return (
                    <tr key={seq} className="border-b border-border hover:bg-muted/50">
                      <td className="px-3 py-2 text-sm">{seq}</td>
                      <td className="px-3 py-2 text-sm text-muted-foreground">{String(ruleCfg.description || '')}</td>
                      <td className="px-3 py-2 text-sm">{String(ruleCfg.interface || '')}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

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
        return (
          <pre className="max-h-96 overflow-auto rounded bg-muted/50 p-3 font-mono text-xs scrollbar-thin">
            {data === undefined || data === null ? 'No configuration' : JSON.stringify(data, null, 2)}
          </pre>
        );
      }}
    />
  );
}
