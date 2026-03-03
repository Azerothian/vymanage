'use client';

import type { VyosConnectionInfo } from '@vymanage/vyos-client';
import { ConfigPanel, type TabDefinition } from '@/components/config/ConfigPanel';

const TABS: TabDefinition[] = [
  { id: 'ca', label: 'CA', configPath: ['pki', 'ca'] },
  { id: 'certificates', label: 'Certificates', configPath: ['pki', 'certificate'] },
  { id: 'key-pairs', label: 'Key Pairs', configPath: ['pki', 'key-pair'] },
  { id: 'dh', label: 'DH Parameters', configPath: ['pki', 'dh'] },
];

interface Props {
  connection: VyosConnectionInfo;
}

function CertTable({ data, kind }: { data: unknown; kind: string }) {
  const entries = data && typeof data === 'object' ? Object.entries(data as Record<string, unknown>) : [];

  return (
    <div className="rounded-md border border-border">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border bg-muted/50">
            <th className="px-3 py-2 text-left text-xs font-medium uppercase text-muted-foreground">Name</th>
            <th className="px-3 py-2 text-left text-xs font-medium uppercase text-muted-foreground">Description</th>
            <th className="px-3 py-2 text-left text-xs font-medium uppercase text-muted-foreground">Has Private Key</th>
          </tr>
        </thead>
        <tbody>
          {entries.length === 0 ? (
            <tr>
              <td colSpan={3} className="px-4 py-8 text-center text-sm text-muted-foreground">
                No {kind} configured
              </td>
            </tr>
          ) : (
            entries.map(([name, cfg]) => {
              const cert = cfg as Record<string, unknown>;
              const hasPrivKey = !!(cert['private'] || cert['private-key']);
              return (
                <tr key={name} className="border-b border-border hover:bg-muted/50">
                  <td className="px-3 py-2 font-medium text-sm">{name}</td>
                  <td className="px-3 py-2 text-sm text-muted-foreground">{String(cert.description || '')}</td>
                  <td className="px-3 py-2 text-sm">
                    {hasPrivKey ? (
                      <span className="rounded bg-green-500/20 px-1.5 py-0.5 text-xs text-green-700 dark:text-green-400">Yes</span>
                    ) : (
                      <span className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">No</span>
                    )}
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}

function DhTable({ data }: { data: unknown }) {
  const entries = data && typeof data === 'object' ? Object.entries(data as Record<string, unknown>) : [];

  return (
    <div className="rounded-md border border-border">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border bg-muted/50">
            <th className="px-3 py-2 text-left text-xs font-medium uppercase text-muted-foreground">Name</th>
            <th className="px-3 py-2 text-left text-xs font-medium uppercase text-muted-foreground">Description</th>
          </tr>
        </thead>
        <tbody>
          {entries.length === 0 ? (
            <tr>
              <td colSpan={2} className="px-4 py-8 text-center text-sm text-muted-foreground">No DH parameters configured</td>
            </tr>
          ) : (
            entries.map(([name, cfg]) => {
              const dh = cfg as Record<string, unknown>;
              return (
                <tr key={name} className="border-b border-border hover:bg-muted/50">
                  <td className="px-3 py-2 font-medium text-sm">{name}</td>
                  <td className="px-3 py-2 text-sm text-muted-foreground">{String(dh.description || '')}</td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}

export function PkiPanel({ connection }: Props) {
  return (
    <ConfigPanel
      menuId="pki"
      tabs={TABS}
      connection={connection}
      renderContent={(data, tab) => {
        if (tab.id === 'ca') return <CertTable data={data} kind="Certificate Authorities" />;
        if (tab.id === 'certificates') return <CertTable data={data} kind="Certificates" />;
        if (tab.id === 'key-pairs') return <CertTable data={data} kind="Key Pairs" />;
        if (tab.id === 'dh') return <DhTable data={data} />;
        return (
          <pre className="max-h-96 overflow-auto rounded bg-muted/50 p-3 font-mono text-xs scrollbar-thin">
            {data === undefined || data === null ? 'No configuration' : JSON.stringify(data, null, 2)}
          </pre>
        );
      }}
    />
  );
}
