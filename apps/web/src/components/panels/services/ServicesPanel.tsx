'use client';

import type { VyosConnectionInfo } from '@vymanage/vyos-client';
import { ConfigPanel, type TabDefinition } from '@/components/config/ConfigPanel';
import { OperationalDataSection } from '@/components/config/OperationalDataSection';

const TABS: TabDefinition[] = [
  { id: 'dhcp', label: 'DHCP Server', configPath: ['service', 'dhcp-server'] },
  { id: 'dhcpv6', label: 'DHCPv6', configPath: ['service', 'dhcpv6-server'] },
  { id: 'dhcp-relay', label: 'DHCP Relay', configPath: ['service', 'dhcp-relay'] },
  { id: 'dns', label: 'DNS', configPath: ['service', 'dns'] },
  { id: 'ssh', label: 'SSH', configPath: ['service', 'ssh'] },
  { id: 'https', label: 'HTTPS', configPath: ['service', 'https'] },
  { id: 'ntp', label: 'NTP', configPath: ['service', 'ntp'] },
  { id: 'snmp', label: 'SNMP', configPath: ['service', 'snmp'] },
  { id: 'lldp', label: 'LLDP', configPath: ['service', 'lldp'] },
  { id: 'pppoe-server', label: 'PPPoE Server', configPath: ['service', 'pppoe-server'] },
  { id: 'ipoe-server', label: 'IPoE Server', configPath: ['service', 'ipoe-server'] },
  { id: 'monitoring', label: 'Monitoring', configPath: ['service', 'monitoring'] },
  { id: 'sflow', label: 'Sflow', configPath: ['service', 'sflow'] },
  { id: 'flow-accounting', label: 'Flow Accounting', configPath: ['system', 'flow-accounting'] },
  { id: 'config-sync', label: 'Config Sync', configPath: ['service', 'config-sync'] },
  { id: 'conntrack-sync', label: 'Conntrack Sync', configPath: ['service', 'conntrack-sync'] },
  { id: 'router-advert', label: 'Router Advertisements', configPath: ['service', 'router-advert'] },
  { id: 'mdns', label: 'mDNS', configPath: ['service', 'mdns'] },
  { id: 'event-handler', label: 'Event Handler', configPath: ['service', 'event-handler'] },
  { id: 'broadcast-relay', label: 'Broadcast Relay', configPath: ['service', 'broadcast-relay'] },
  { id: 'tftp', label: 'TFTP', configPath: ['service', 'tftp-server'] },
  { id: 'web-proxy', label: 'Web Proxy', configPath: ['service', 'webproxy'] },
  { id: 'suricata', label: 'Suricata', configPath: ['service', 'suricata'] },
  { id: 'console-server', label: 'Console Server', configPath: ['service', 'console-server'] },
];

interface Props {
  connection: VyosConnectionInfo;
}

function DhcpContent({ data, connection }: { data: unknown; connection: VyosConnectionInfo }) {
  const dhcp = data && typeof data === 'object' ? data as Record<string, unknown> : {};
  const sharedNetworks = Object.entries((dhcp['shared-network-name'] as Record<string, unknown>) || {});

  return (
    <div className="space-y-4">
      <div className="rounded-md border border-border">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="px-3 py-2 text-left text-xs font-medium uppercase text-muted-foreground">Network Name</th>
              <th className="px-3 py-2 text-left text-xs font-medium uppercase text-muted-foreground">Subnet</th>
              <th className="px-3 py-2 text-left text-xs font-medium uppercase text-muted-foreground">Range Start</th>
              <th className="px-3 py-2 text-left text-xs font-medium uppercase text-muted-foreground">Range Stop</th>
              <th className="px-3 py-2 text-left text-xs font-medium uppercase text-muted-foreground">Router</th>
            </tr>
          </thead>
          <tbody>
            {sharedNetworks.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-sm text-muted-foreground">No DHCP shared networks configured</td>
              </tr>
            ) : (
              sharedNetworks.map(([name, netCfg]) => {
                const net = netCfg as Record<string, unknown>;
                const subnets = Object.entries((net.subnet as Record<string, unknown>) || {});
                return subnets.map(([subnet, subCfg]) => {
                  const sub = subCfg as Record<string, unknown>;
                  const ranges = Object.entries((sub.range as Record<string, unknown>) || {});
                  const firstRange = ranges[0]?.[1] as Record<string, unknown> || {};
                  return (
                    <tr key={`${name}-${subnet}`} className="border-b border-border hover:bg-muted/50">
                      <td className="px-3 py-2 text-sm font-medium">{name}</td>
                      <td className="px-3 py-2 font-mono text-sm">{subnet}</td>
                      <td className="px-3 py-2 font-mono text-sm">{String(firstRange.start || '')}</td>
                      <td className="px-3 py-2 font-mono text-sm">{String(firstRange.stop || '')}</td>
                      <td className="px-3 py-2 font-mono text-sm">{String((sub['default-router'] as string) || '')}</td>
                    </tr>
                  );
                });
              })
            )}
          </tbody>
        </table>
      </div>
      <OperationalDataSection
        connection={connection}
        path={['dhcp', 'server', 'leases']}
        pollInterval={30000}
        title="Active DHCP Leases"
      />
    </div>
  );
}

export function ServicesPanel({ connection }: Props) {
  return (
    <ConfigPanel
      menuId="services"
      tabs={TABS}
      connection={connection}
      renderContent={(data, tab) => {
        if (tab.id === 'dhcp') return <DhcpContent data={data} connection={connection} />;
        return (
          <pre className="max-h-96 overflow-auto rounded bg-muted/50 p-3 font-mono text-xs scrollbar-thin">
            {data === undefined || data === null ? 'No configuration' : JSON.stringify(data, null, 2)}
          </pre>
        );
      }}
    />
  );
}
