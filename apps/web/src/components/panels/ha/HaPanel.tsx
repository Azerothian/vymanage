'use client';

import type { VyosConnectionInfo } from '@vymanage/vyos-client';
import { ConfigPanel, type TabDefinition } from '@/components/config/ConfigPanel';
import { OperationalDataSection } from '@/components/config/OperationalDataSection';

const TABS: TabDefinition[] = [
  { id: 'vrrp', label: 'VRRP', configPath: ['high-availability', 'vrrp'], pollInterval: 5000 },
  { id: 'virtual-server', label: 'Virtual Server', configPath: ['high-availability', 'virtual-server'] },
];

interface Props {
  connection: VyosConnectionInfo;
}

function VrrpContent({ data, connection }: { data: unknown; connection: VyosConnectionInfo }) {
  const vrrp = data && typeof data === 'object' ? data as Record<string, unknown> : {};
  const groups = Object.entries((vrrp.group as Record<string, unknown>) || {});

  return (
    <div className="space-y-4">
      <div className="rounded-md border border-border">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="px-3 py-2 text-left text-xs font-medium uppercase text-muted-foreground">Group</th>
              <th className="px-3 py-2 text-left text-xs font-medium uppercase text-muted-foreground">Interface</th>
              <th className="px-3 py-2 text-left text-xs font-medium uppercase text-muted-foreground">VRID</th>
              <th className="px-3 py-2 text-left text-xs font-medium uppercase text-muted-foreground">Priority</th>
              <th className="px-3 py-2 text-left text-xs font-medium uppercase text-muted-foreground">Virtual IPs</th>
            </tr>
          </thead>
          <tbody>
            {groups.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-sm text-muted-foreground">No VRRP groups configured</td>
              </tr>
            ) : (
              groups.map(([name, cfg]) => {
                const group = cfg as Record<string, unknown>;
                const vips = Array.isArray(group['virtual-address'])
                  ? (group['virtual-address'] as string[]).join(', ')
                  : String(group['virtual-address'] || '');
                return (
                  <tr key={name} className="border-b border-border hover:bg-muted/50">
                    <td className="px-3 py-2 font-medium text-sm">{name}</td>
                    <td className="px-3 py-2 text-sm">{String(group.interface || '')}</td>
                    <td className="px-3 py-2 text-sm">{String(group.vrid || '')}</td>
                    <td className="px-3 py-2 text-sm">{String(group.priority || '100')}</td>
                    <td className="px-3 py-2 font-mono text-xs">{vips || '-'}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
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
        return (
          <pre className="max-h-96 overflow-auto rounded bg-muted/50 p-3 font-mono text-xs scrollbar-thin">
            {data === undefined || data === null ? 'No configuration' : JSON.stringify(data, null, 2)}
          </pre>
        );
      }}
    />
  );
}
