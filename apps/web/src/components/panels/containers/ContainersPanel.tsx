'use client';

import type { VyosConnectionInfo } from '@vymanage/vyos-client';
import { ConfigPanel, type TabDefinition } from '@/components/config/ConfigPanel';
import { OperationalDataSection } from '@/components/config/OperationalDataSection';

const TABS: TabDefinition[] = [
  { id: 'containers', label: 'Containers', configPath: ['container', 'name'], pollInterval: 10000 },
  { id: 'networks', label: 'Networks', configPath: ['container', 'network'] },
  { id: 'registries', label: 'Registries', configPath: ['container', 'registry'] },
];

interface Props {
  connection: VyosConnectionInfo;
}

function ContainerList({ data, connection }: { data: unknown; connection: VyosConnectionInfo }) {
  const containers = data && typeof data === 'object' ? Object.entries(data as Record<string, unknown>) : [];

  return (
    <div className="space-y-4">
      <div className="rounded-md border border-border">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="px-3 py-2 text-left text-xs font-medium uppercase text-muted-foreground">Name</th>
              <th className="px-3 py-2 text-left text-xs font-medium uppercase text-muted-foreground">Image</th>
              <th className="px-3 py-2 text-left text-xs font-medium uppercase text-muted-foreground">Network</th>
              <th className="px-3 py-2 text-left text-xs font-medium uppercase text-muted-foreground">Restart</th>
              <th className="px-3 py-2 text-left text-xs font-medium uppercase text-muted-foreground">Memory</th>
            </tr>
          </thead>
          <tbody>
            {containers.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-sm text-muted-foreground">No containers configured</td>
              </tr>
            ) : (
              containers.map(([name, cfg]) => {
                const cont = cfg as Record<string, unknown>;
                const networks = Object.keys((cont.network as Record<string, unknown>) || {}).join(', ');
                return (
                  <tr key={name} className="border-b border-border hover:bg-muted/50">
                    <td className="px-3 py-2 font-medium text-sm">{name}</td>
                    <td className="px-3 py-2 font-mono text-xs">{String(cont.image || '')}</td>
                    <td className="px-3 py-2 text-sm">{networks || '-'}</td>
                    <td className="px-3 py-2 text-sm">{String(cont.restart || 'no')}</td>
                    <td className="px-3 py-2 text-sm">{String(cont.memory || '')}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      <OperationalDataSection
        connection={connection}
        path={['container', 'summary']}
        pollInterval={10000}
        title="Container Status"
      />
    </div>
  );
}

function NetworkList({ data }: { data: unknown }) {
  const networks = data && typeof data === 'object' ? Object.entries(data as Record<string, unknown>) : [];

  return (
    <div className="rounded-md border border-border">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border bg-muted/50">
            <th className="px-3 py-2 text-left text-xs font-medium uppercase text-muted-foreground">Network Name</th>
            <th className="px-3 py-2 text-left text-xs font-medium uppercase text-muted-foreground">Prefix</th>
            <th className="px-3 py-2 text-left text-xs font-medium uppercase text-muted-foreground">Description</th>
          </tr>
        </thead>
        <tbody>
          {networks.length === 0 ? (
            <tr>
              <td colSpan={3} className="px-4 py-8 text-center text-sm text-muted-foreground">No container networks configured</td>
            </tr>
          ) : (
            networks.map(([name, cfg]) => {
              const net = cfg as Record<string, unknown>;
              const prefixes = Object.keys((net.prefix as Record<string, unknown>) || {}).join(', ');
              return (
                <tr key={name} className="border-b border-border hover:bg-muted/50">
                  <td className="px-3 py-2 font-medium text-sm">{name}</td>
                  <td className="px-3 py-2 font-mono text-xs">{prefixes || '-'}</td>
                  <td className="px-3 py-2 text-sm text-muted-foreground">{String(net.description || '')}</td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
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
        if (tab.id === 'networks') return <NetworkList data={data} />;
        return (
          <pre className="max-h-96 overflow-auto rounded bg-muted/50 p-3 font-mono text-xs scrollbar-thin">
            {data === undefined || data === null ? 'No configuration' : JSON.stringify(data, null, 2)}
          </pre>
        );
      }}
    />
  );
}
