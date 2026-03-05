'use client';

import type { VyosConnectionInfo } from '@vymanage/vyos-client';
import { ConfigPanel, type TabDefinition } from '@/components/config/ConfigPanel';
import { KeyedItemTable, type KeyedColumn } from '@/components/config/KeyedItemTable';
import { GenericConfigTab } from '@/components/config/GenericConfigTab';
import { useKeyedCrud } from '@/lib/hooks/useKeyedCrud';

const TABS: TabDefinition[] = [
  { id: 'ca', label: 'CA', configPath: ['pki', 'ca'] },
  { id: 'certificates', label: 'Certificates', configPath: ['pki', 'certificate'] },
  { id: 'key-pairs', label: 'Key Pairs', configPath: ['pki', 'key-pair'] },
  { id: 'dh', label: 'DH Parameters', configPath: ['pki', 'dh'] },
];

interface Props {
  connection: VyosConnectionInfo;
}

const CERT_COLUMNS: KeyedColumn[] = [
  {
    id: 'description',
    header: 'Description',
    accessor: (_key, val) => <span className="text-muted-foreground">{String(val.description || '')}</span>,
  },
  {
    id: 'private-key',
    header: 'Has Private Key',
    width: '120px',
    accessor: (_key, val) => {
      const has = !!(val['private'] || val['private-key']);
      return has ? (
        <span className="rounded bg-green-500/20 px-1.5 py-0.5 text-xs text-green-700 dark:text-green-400">Yes</span>
      ) : (
        <span className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">No</span>
      );
    },
  },
];

const CERT_FORM_FIELDS = [
  { name: 'certificate', label: 'Certificate (PEM)', type: 'textarea' as const },
  { name: 'description', label: 'Description', type: 'text' as const },
  { name: 'private/key', label: 'Private Key (PEM)', type: 'textarea' as const },
];

const KEY_PAIR_COLUMNS: KeyedColumn[] = [
  {
    id: 'public-key',
    header: 'Has Public Key',
    width: '120px',
    accessor: (_key, val) => {
      const has = !!(val['public'] || val['public-key']);
      return has ? (
        <span className="rounded bg-green-500/20 px-1.5 py-0.5 text-xs text-green-700 dark:text-green-400">Yes</span>
      ) : (
        <span className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">No</span>
      );
    },
  },
  {
    id: 'private-key',
    header: 'Has Private Key',
    width: '120px',
    accessor: (_key, val) => {
      const has = !!(val['private'] || val['private-key']);
      return has ? (
        <span className="rounded bg-green-500/20 px-1.5 py-0.5 text-xs text-green-700 dark:text-green-400">Yes</span>
      ) : (
        <span className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">No</span>
      );
    },
  },
];

const KEY_PAIR_FORM_FIELDS = [
  { name: 'public/key', label: 'Public Key (PEM)', type: 'textarea' as const },
  { name: 'private/key', label: 'Private Key (PEM)', type: 'textarea' as const },
];

const DH_COLUMNS: KeyedColumn[] = [
  {
    id: 'description',
    header: 'Description',
    accessor: (_key, val) => <span className="text-muted-foreground">{String(val.description || '')}</span>,
  },
];

const DH_FORM_FIELDS = [
  { name: 'parameters', label: 'Parameters (PEM)', type: 'textarea' as const },
  { name: 'description', label: 'Description', type: 'text' as const },
];

function CertCrudTable({
  data,
  connection,
  basePath,
  kind,
}: {
  data: unknown;
  connection: VyosConnectionInfo;
  basePath: string[];
  kind: string;
}) {
  const { addItem, updateItem, deleteItem } = useKeyedCrud(connection, basePath);
  const tableData = data && typeof data === 'object' ? (data as Record<string, unknown>) : null;

  return (
    <KeyedItemTable
      data={tableData}
      columns={CERT_COLUMNS}
      emptyMessage={`No ${kind} configured`}
      addLabel={`Add ${kind}`}
      formTitle={kind}
      formFields={CERT_FORM_FIELDS}
      onAdd={addItem}
      onEdit={updateItem}
      onDelete={deleteItem}
    />
  );
}

function KeyPairCrudTable({
  data,
  connection,
}: {
  data: unknown;
  connection: VyosConnectionInfo;
}) {
  const { addItem, updateItem, deleteItem } = useKeyedCrud(connection, ['pki', 'key-pair']);
  const tableData = data && typeof data === 'object' ? (data as Record<string, unknown>) : null;

  return (
    <KeyedItemTable
      data={tableData}
      columns={KEY_PAIR_COLUMNS}
      emptyMessage="No key pairs configured"
      addLabel="Add Key Pair"
      formTitle="Key Pair"
      formFields={KEY_PAIR_FORM_FIELDS}
      onAdd={addItem}
      onEdit={updateItem}
      onDelete={deleteItem}
    />
  );
}

function DhCrudTable({
  data,
  connection,
}: {
  data: unknown;
  connection: VyosConnectionInfo;
}) {
  const { addItem, updateItem, deleteItem } = useKeyedCrud(connection, ['pki', 'dh']);
  const tableData = data && typeof data === 'object' ? (data as Record<string, unknown>) : null;

  return (
    <KeyedItemTable
      data={tableData}
      columns={DH_COLUMNS}
      emptyMessage="No DH parameters configured"
      addLabel="Add DH Parameters"
      formTitle="DH Parameters"
      formFields={DH_FORM_FIELDS}
      onAdd={addItem}
      onEdit={updateItem}
      onDelete={deleteItem}
    />
  );
}

export function PkiPanel({ connection }: Props) {
  return (
    <ConfigPanel
      menuId="pki"
      tabs={TABS}
      connection={connection}
      renderContent={(data, tab) => {
        if (tab.id === 'ca')
          return (
            <CertCrudTable
              data={data}
              connection={connection}
              basePath={['pki', 'ca']}
              kind="Certificate Authorities"
            />
          );
        if (tab.id === 'certificates')
          return (
            <CertCrudTable
              data={data}
              connection={connection}
              basePath={['pki', 'certificate']}
              kind="Certificates"
            />
          );
        if (tab.id === 'key-pairs') return <KeyPairCrudTable data={data} connection={connection} />;
        if (tab.id === 'dh') return <DhCrudTable data={data} connection={connection} />;
        return (
          <GenericConfigTab data={data} connection={connection} basePath={tab.configPath} />
        );
      }}
    />
  );
}
