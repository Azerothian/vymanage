'use client';

import type { VyosConnectionInfo } from '@vymanage/vyos-client';
import { ConfigPanel, type TabDefinition } from '@/components/config/ConfigPanel';
import { OperationalDataSection } from '@/components/config/OperationalDataSection';
import { GenericConfigTab } from '@/components/config/GenericConfigTab';
import { KeyedItemTable } from '@/components/config/KeyedItemTable';
import { useKeyedCrud } from '@/lib/hooks/useKeyedCrud';

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

const IKE_COLUMNS = [
  {
    id: 'proposals',
    header: 'Proposals',
    accessor: (_key: string, value: Record<string, unknown>) => {
      const proposals = value.proposal as Record<string, unknown> | undefined;
      if (!proposals) return <span className="text-muted-foreground">-</span>;
      return <span className="font-mono text-xs">{Object.keys(proposals).join(', ')}</span>;
    },
  },
  {
    id: 'lifetime',
    header: 'Lifetime',
    accessor: (_key: string, value: Record<string, unknown>) => {
      const lifetime = value.lifetime;
      if (lifetime === undefined || lifetime === null) return <span className="text-muted-foreground">-</span>;
      return <span className="font-mono text-xs">{String(lifetime)}</span>;
    },
  },
  {
    id: 'dh-group',
    header: 'DH Group',
    accessor: (_key: string, value: Record<string, unknown>) => {
      const proposal = value.proposal as Record<string, unknown> | undefined;
      if (!proposal) return <span className="text-muted-foreground">-</span>;
      const firstProposal = Object.values(proposal)[0] as Record<string, unknown> | undefined;
      const dhGroup = firstProposal?.['dh-group'];
      if (dhGroup === undefined || dhGroup === null) return <span className="text-muted-foreground">-</span>;
      return <span className="font-mono text-xs">{String(dhGroup)}</span>;
    },
  },
];

const ESP_COLUMNS = [
  {
    id: 'proposals',
    header: 'Proposals',
    accessor: (_key: string, value: Record<string, unknown>) => {
      const proposals = value.proposal as Record<string, unknown> | undefined;
      if (!proposals) return <span className="text-muted-foreground">-</span>;
      return <span className="font-mono text-xs">{Object.keys(proposals).join(', ')}</span>;
    },
  },
  {
    id: 'lifetime',
    header: 'Lifetime',
    accessor: (_key: string, value: Record<string, unknown>) => {
      const lifetime = value.lifetime;
      if (lifetime === undefined || lifetime === null) return <span className="text-muted-foreground">-</span>;
      return <span className="font-mono text-xs">{String(lifetime)}</span>;
    },
  },
];

const S2S_COLUMNS = [
  {
    id: 'auth',
    header: 'Auth',
    accessor: (_key: string, value: Record<string, unknown>) => {
      const auth = value.authentication as Record<string, unknown> | undefined;
      if (!auth) return <span className="text-muted-foreground">-</span>;
      return <span className="text-xs">{String(auth.mode || '')}</span>;
    },
  },
  {
    id: 'ike-group',
    header: 'IKE Group',
    accessor: (_key: string, value: Record<string, unknown>) => {
      const g = value['ike-group'];
      if (g === undefined || g === null) return <span className="text-muted-foreground">-</span>;
      return <span className="font-mono text-xs">{String(g)}</span>;
    },
  },
  {
    id: 'esp-group',
    header: 'ESP Group',
    accessor: (_key: string, value: Record<string, unknown>) => {
      const vti = value.vti as Record<string, unknown> | undefined;
      const g = value['default-esp-group'] ?? vti?.['esp-group'];
      if (g === undefined || g === null) return <span className="text-muted-foreground">-</span>;
      return <span className="font-mono text-xs">{String(g)}</span>;
    },
  },
  {
    id: 'local-address',
    header: 'Local Addr',
    accessor: (_key: string, value: Record<string, unknown>) => {
      const addr = value['local-address'];
      if (addr === undefined || addr === null) return <span className="text-muted-foreground">-</span>;
      return <span className="font-mono text-xs">{String(addr)}</span>;
    },
  },
];

const S2S_FORM_FIELDS = [
  { name: 'authentication/mode', label: 'Auth Mode', type: 'text' as const },
  { name: 'ike-group', label: 'IKE Group', type: 'text' as const },
  { name: 'default-esp-group', label: 'ESP Group', type: 'text' as const },
  { name: 'local-address', label: 'Local Address', type: 'text' as const },
];

const IKE_FORM_FIELDS = [
  { name: 'lifetime', label: 'Lifetime', type: 'text' as const },
];

const ESP_FORM_FIELDS = [
  { name: 'lifetime', label: 'Lifetime', type: 'text' as const },
];

function IpsecS2SContent({ data, connection }: { data: unknown; connection: VyosConnectionInfo }) {
  const basePath = ['vpn', 'ipsec', 'site-to-site'];
  const { addItem, updateItem, deleteItem } = useKeyedCrud(connection, basePath);
  const obj = data && typeof data === 'object' ? (data as Record<string, unknown>) : null;

  return (
    <div className="space-y-4">
      <KeyedItemTable
        data={obj}
        columns={S2S_COLUMNS}
        keyHeader="Peer"
        emptyMessage="No IPsec site-to-site peers configured"
        formFields={S2S_FORM_FIELDS}
        formTitle="Peer"
        addLabel="Add Peer"
        onAdd={(key, fields) => addItem(key, fields)}
        onEdit={(key, fields) => updateItem(key, fields)}
        onDelete={(key) => deleteItem(key)}
      />
      <OperationalDataSection
        connection={connection}
        path={['vpn', 'ipsec', 'sa']}
        pollInterval={10000}
        title="IPsec SA Status"
      />
    </div>
  );
}

function IkeGroupsContent({ data, connection }: { data: unknown; connection: VyosConnectionInfo }) {
  const basePath = ['vpn', 'ipsec', 'ike-group'];
  const { addItem, updateItem, deleteItem } = useKeyedCrud(connection, basePath);
  const obj = data && typeof data === 'object' ? (data as Record<string, unknown>) : null;

  return (
    <KeyedItemTable
      data={obj}
      columns={IKE_COLUMNS}
      keyHeader="Name"
      emptyMessage="No IKE groups configured"
      formFields={IKE_FORM_FIELDS}
      formTitle="IKE Group"
      addLabel="Add IKE Group"
      onAdd={(key, fields) => addItem(key, fields)}
      onEdit={(key, fields) => updateItem(key, fields)}
      onDelete={(key) => deleteItem(key)}
    />
  );
}

function EspGroupsContent({ data, connection }: { data: unknown; connection: VyosConnectionInfo }) {
  const basePath = ['vpn', 'ipsec', 'esp-group'];
  const { addItem, updateItem, deleteItem } = useKeyedCrud(connection, basePath);
  const obj = data && typeof data === 'object' ? (data as Record<string, unknown>) : null;

  return (
    <KeyedItemTable
      data={obj}
      columns={ESP_COLUMNS}
      keyHeader="Name"
      emptyMessage="No ESP groups configured"
      formFields={ESP_FORM_FIELDS}
      formTitle="ESP Group"
      addLabel="Add ESP Group"
      onAdd={(key, fields) => addItem(key, fields)}
      onEdit={(key, fields) => updateItem(key, fields)}
      onDelete={(key) => deleteItem(key)}
    />
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
        if (tab.id === 'ike-groups') return <IkeGroupsContent data={data} connection={connection} />;
        if (tab.id === 'esp-groups') return <EspGroupsContent data={data} connection={connection} />;
        return <GenericConfigTab data={data} connection={connection} basePath={tab.configPath} />;
      }}
    />
  );
}
