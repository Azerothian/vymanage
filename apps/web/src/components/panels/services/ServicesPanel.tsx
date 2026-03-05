'use client';

import type { VyosConnectionInfo } from '@vymanage/vyos-client';
import { ConfigPanel, type TabDefinition } from '@/components/config/ConfigPanel';
import { OperationalDataSection } from '@/components/config/OperationalDataSection';
import { GenericConfigTab } from '@/components/config/GenericConfigTab';
import { KeyedItemTable } from '@/components/config/KeyedItemTable';
import { useKeyedCrud } from '@/lib/hooks/useKeyedCrud';

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

const DHCP_CRUD_BASE = ['service', 'dhcp-server', 'shared-network-name'];

const DHCP_COLUMNS = [
  {
    id: 'subnet',
    header: 'Subnet',
    accessor: (_key: string, value: Record<string, unknown>) => {
      const subnets = Object.keys((value.subnet as Record<string, unknown>) || {});
      return <span className="font-mono text-xs">{subnets.join(', ') || '-'}</span>;
    },
  },
  {
    id: 'default-router',
    header: 'Router',
    accessor: (_key: string, value: Record<string, unknown>) => {
      const subnets = Object.values((value.subnet as Record<string, unknown>) || {});
      const router = subnets.length > 0
        ? (subnets[0] as Record<string, unknown>)['default-router']
        : undefined;
      return <span className="font-mono text-xs">{router ? String(router) : '-'}</span>;
    },
  },
  {
    id: 'range',
    header: 'Range',
    accessor: (_key: string, value: Record<string, unknown>) => {
      const subnets = Object.values((value.subnet as Record<string, unknown>) || {});
      if (subnets.length === 0) return <span className="text-muted-foreground">-</span>;
      const ranges = Object.values(
        ((subnets[0] as Record<string, unknown>).range as Record<string, unknown>) || {},
      );
      if (ranges.length === 0) return <span className="text-muted-foreground">-</span>;
      const first = ranges[0] as Record<string, unknown>;
      return (
        <span className="font-mono text-xs">
          {String(first.start || '')} – {String(first.stop || '')}
        </span>
      );
    },
  },
];

const DHCP_FORM_FIELDS = [
  { name: 'subnet/start', label: 'Range Start', type: 'text' as const },
  { name: 'subnet/stop', label: 'Range Stop', type: 'text' as const },
  { name: 'subnet/default-router', label: 'Default Router', type: 'text' as const },
];

interface Props {
  connection: VyosConnectionInfo;
}

function DhcpContent({ data, connection }: { data: unknown; connection: VyosConnectionInfo }) {
  const { addItem, updateItem, deleteItem } = useKeyedCrud(connection, DHCP_CRUD_BASE);

  const dhcp = data && typeof data === 'object' ? (data as Record<string, unknown>) : {};
  const sharedNetworks = (dhcp['shared-network-name'] as Record<string, unknown>) || null;

  return (
    <div className="space-y-4">
      <KeyedItemTable
        data={sharedNetworks}
        columns={DHCP_COLUMNS}
        keyHeader="Network Name"
        emptyMessage="No DHCP shared networks configured"
        onAdd={(key, fields) => addItem(key, fields)}
        onEdit={(key, fields) => updateItem(key, fields)}
        onDelete={(key) => deleteItem(key)}
        formFields={DHCP_FORM_FIELDS}
        formTitle="DHCP Network"
        addLabel="Add Network"
      />
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
          <GenericConfigTab data={data} connection={connection} basePath={tab.configPath} />
        );
      }}
    />
  );
}
