'use client';

import type { VyosConnectionInfo } from '@vymanage/vyos-client';
import { ConfigPanel, type TabDefinition } from '@/components/config/ConfigPanel';
import { OperationalDataSection } from '@/components/config/OperationalDataSection';

const TABS: TabDefinition[] = [
  { id: 'ipsec-s2s', label: 'IPsec S2S', configPath: ['vpn', 'ipsec', 'site-to-site'], pollInterval: 10000 },
  { id: 'ipsec-ra', label: 'IPsec RA', configPath: ['vpn', 'ipsec', 'remote-access'] },
  { id: 'ike-groups', label: 'IKE Groups', configPath: ['vpn', 'ipsec', 'ike-group'] },
  { id: 'esp-groups', label: 'ESP Groups', configPath: ['vpn', 'ipsec', 'esp-group'] },
  { id: 'dmvpn', label: 'DMVPN', configPath: ['protocols', 'nhrp'] },
  { id: 'l2tp', label: 'L2TP', configPath: ['vpn', 'l2tp'] },
  { id: 'openconnect', label: 'OpenConnect', configPath: ['vpn', 'openconnect'] },
  { id: 'pptp', label: 'PPTP', configPath: ['vpn', 'pptp'] },
  { id: 'sstp', label: 'SSTP', configPath: ['vpn', 'sstp'] },
];

interface Props {
  connection: VyosConnectionInfo;
}

function IpsecS2SContent({ data, connection }: { data: unknown; connection: VyosConnectionInfo }) {
  const peers = data && typeof data === 'object' ? Object.entries(data as Record<string, unknown>) : [];

  return (
    <div className="space-y-4">
      <div className="rounded-md border border-border">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="px-3 py-2 text-left text-xs font-medium uppercase text-muted-foreground">Peer</th>
              <th className="px-3 py-2 text-left text-xs font-medium uppercase text-muted-foreground">Auth</th>
              <th className="px-3 py-2 text-left text-xs font-medium uppercase text-muted-foreground">IKE Group</th>
              <th className="px-3 py-2 text-left text-xs font-medium uppercase text-muted-foreground">ESP Group</th>
              <th className="px-3 py-2 text-left text-xs font-medium uppercase text-muted-foreground">Local Addr</th>
            </tr>
          </thead>
          <tbody>
            {peers.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-sm text-muted-foreground">No IPsec site-to-site peers configured</td>
              </tr>
            ) : (
              peers.map(([peer, cfg]) => {
                const peerCfg = cfg as Record<string, unknown>;
                const auth = peerCfg.authentication as Record<string, unknown> || {};
                const vti = peerCfg.vti as Record<string, unknown> || {};
                return (
                  <tr key={peer} className="border-b border-border hover:bg-muted/50">
                    <td className="px-3 py-2 font-mono text-sm">{peer}</td>
                    <td className="px-3 py-2 text-sm">{String(auth.mode || '')}</td>
                    <td className="px-3 py-2 text-sm">{String(peerCfg['ike-group'] || '')}</td>
                    <td className="px-3 py-2 text-sm">{String(peerCfg['default-esp-group'] || (vti as Record<string, unknown>)['esp-group'] || '')}</td>
                    <td className="px-3 py-2 font-mono text-sm">{String(peerCfg['local-address'] || '')}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      <OperationalDataSection
        connection={connection}
        path={['vpn', 'ipsec', 'sa']}
        pollInterval={10000}
        title="IPsec SA Status"
      />
    </div>
  );
}

export function VpnPanel({ connection }: Props) {
  return (
    <ConfigPanel
      menuId="vpn"
      tabs={TABS}
      connection={connection}
      renderContent={(data, tab) => {
        if (tab.id === 'ipsec-s2s') return <IpsecS2SContent data={data} connection={connection} />;
        return (
          <pre className="max-h-96 overflow-auto rounded bg-muted/50 p-3 font-mono text-xs scrollbar-thin">
            {data === undefined || data === null ? 'No configuration' : JSON.stringify(data, null, 2)}
          </pre>
        );
      }}
    />
  );
}
