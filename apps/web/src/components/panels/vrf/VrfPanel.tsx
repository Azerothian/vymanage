'use client';

import type { VyosConnectionInfo } from '@vymanage/vyos-client';
import { ConfigPanel, type TabDefinition } from '@/components/config/ConfigPanel';

const TABS: TabDefinition[] = [
  { id: 'vrf-instances', label: 'VRF Instances', configPath: ['vrf', 'name'] },
];

interface Props {
  connection: VyosConnectionInfo;
}

function VrfTable({ data }: { data: unknown }) {
  const vrfs = data && typeof data === 'object' ? Object.entries(data as Record<string, unknown>) : [];

  return (
    <div className="rounded-md border border-border">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border bg-muted/50">
            <th className="px-3 py-2 text-left text-xs font-medium uppercase text-muted-foreground">VRF Name</th>
            <th className="px-3 py-2 text-left text-xs font-medium uppercase text-muted-foreground">Table ID</th>
            <th className="px-3 py-2 text-left text-xs font-medium uppercase text-muted-foreground">Description</th>
            <th className="px-3 py-2 text-left text-xs font-medium uppercase text-muted-foreground">Protocols</th>
          </tr>
        </thead>
        <tbody>
          {vrfs.length === 0 ? (
            <tr>
              <td colSpan={4} className="px-4 py-8 text-center text-sm text-muted-foreground">No VRF instances configured</td>
            </tr>
          ) : (
            vrfs.map(([name, cfg]) => {
              const vrf = cfg as Record<string, unknown>;
              const protocols = Object.keys((vrf.protocols as Record<string, unknown>) || {}).join(', ');
              return (
                <tr key={name} className="border-b border-border hover:bg-muted/50">
                  <td className="px-3 py-2 font-medium text-sm">{name}</td>
                  <td className="px-3 py-2 text-sm">{String(vrf.table || '')}</td>
                  <td className="px-3 py-2 text-sm text-muted-foreground">{String(vrf.description || '')}</td>
                  <td className="px-3 py-2 text-sm">{protocols || '-'}</td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}

export function VrfPanel({ connection }: Props) {
  return (
    <ConfigPanel
      menuId="vrf"
      tabs={TABS}
      connection={connection}
      renderContent={(data) => <VrfTable data={data} />}
    />
  );
}
