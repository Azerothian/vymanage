'use client';

import type { VyosConnectionInfo } from '@vymanage/vyos-client';
import { ConfigPanel, type TabDefinition } from '@/components/config/ConfigPanel';

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

function PolicyTable({ data, policyType }: { data: unknown; policyType: string }) {
  const policies = data && typeof data === 'object' ? Object.entries(data as Record<string, unknown>) : [];

  return (
    <div className="rounded-md border border-border">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border bg-muted/50">
            <th className="px-3 py-2 text-left text-xs font-medium uppercase text-muted-foreground">Name</th>
            <th className="px-3 py-2 text-left text-xs font-medium uppercase text-muted-foreground">Description</th>
            <th className="px-3 py-2 text-left text-xs font-medium uppercase text-muted-foreground">Bandwidth</th>
          </tr>
        </thead>
        <tbody>
          {policies.length === 0 ? (
            <tr>
              <td colSpan={3} className="px-4 py-8 text-center text-sm text-muted-foreground">
                No {policyType} policies configured
              </td>
            </tr>
          ) : (
            policies.map(([name, cfg]) => {
              const policy = cfg as Record<string, unknown>;
              return (
                <tr key={name} className="border-b border-border hover:bg-muted/50">
                  <td className="px-3 py-2 font-medium text-sm">{name}</td>
                  <td className="px-3 py-2 text-sm text-muted-foreground">{String(policy.description || '')}</td>
                  <td className="px-3 py-2 font-mono text-sm">{String(policy.bandwidth || '')}</td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}

export function QosPanel({ connection }: Props) {
  return (
    <ConfigPanel
      menuId="qos"
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
        return <PolicyTable data={data} policyType={policyTypeMap[tab.id] || tab.label} />;
      }}
    />
  );
}
