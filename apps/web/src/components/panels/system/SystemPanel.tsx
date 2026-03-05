'use client';

import type { VyosConnectionInfo } from '@vymanage/vyos-client';
import { ConfigPanel, type TabDefinition } from '@/components/config/ConfigPanel';
import { OperationalDataSection } from '@/components/config/OperationalDataSection';
import { GenericConfigTab } from '@/components/config/GenericConfigTab';
import { KeyedItemTable } from '@/components/config/KeyedItemTable';
import { useKeyedCrud } from '@/lib/hooks/useKeyedCrud';

const TABS: TabDefinition[] = [
  { id: 'hostname', label: 'Hostname', configPath: ['system', 'host-name'] },
  { id: 'dns', label: 'DNS', configPath: ['system', 'name-server'] },
  { id: 'timezone', label: 'Timezone', configPath: ['system', 'time-zone'] },
  { id: 'users', label: 'Users', configPath: ['system', 'login', 'user'] },
  { id: 'syslog', label: 'Syslog', configPath: ['system', 'syslog'] },
  { id: 'conntrack', label: 'Conntrack', configPath: ['system', 'conntrack'] },
  { id: 'ip-settings', label: 'IP Settings', configPath: ['system', 'ip'] },
  { id: 'console', label: 'Console', configPath: ['system', 'console'] },
  { id: 'task-scheduler', label: 'Task Scheduler', configPath: ['system', 'task-scheduler'] },
  { id: 'watchdog', label: 'Watchdog', configPath: ['system', 'watchdog'] },
  { id: 'options', label: 'Options', configPath: ['system', 'options'] },
  { id: 'acceleration', label: 'Acceleration', configPath: ['system', 'acceleration'] },
  { id: 'updates', label: 'Updates', configPath: ['system', 'update-check'] },
  { id: 'image-mgmt', label: 'Image Management', configPath: ['system', 'image'] },
];

interface Props {
  connection: VyosConnectionInfo;
}

const USER_BASEPATH = ['system', 'login', 'user'];

const USER_COLUMNS = [
  {
    id: 'full-name',
    header: 'Full Name',
    accessor: (_key: string, value: Record<string, unknown>) => (
      <span className="text-sm text-muted-foreground">{String(value['full-name'] || '')}</span>
    ),
  },
  {
    id: 'level',
    header: 'Level',
    accessor: (_key: string, value: Record<string, unknown>) => (
      <span className={`rounded px-1.5 py-0.5 text-xs font-medium ${String(value.level) === 'admin' ? 'bg-orange-500/20 text-orange-700 dark:text-orange-400' : 'bg-blue-500/20 text-blue-700 dark:text-blue-400'}`}>
        {String(value.level || 'operator')}
      </span>
    ),
  },
  {
    id: 'ssh-keys',
    header: 'SSH Keys',
    accessor: (_key: string, value: Record<string, unknown>) => {
      const auth = value['authentication'] as Record<string, unknown> | undefined;
      const pubKeys = auth?.['public-keys'] as Record<string, unknown> | undefined;
      const count = pubKeys ? Object.keys(pubKeys).length : 0;
      return <span className="text-sm">{count > 0 ? `${count} key(s)` : 'None'}</span>;
    },
  },
];

const USER_FORM_FIELDS = [
  { name: 'full-name', label: 'Full Name', type: 'text' as const },
  {
    name: 'level',
    label: 'Level',
    type: 'select' as const,
    options: [
      { value: 'admin', label: 'Admin' },
      { value: 'operator', label: 'Operator' },
    ],
  },
  { name: 'authentication/plaintext-password', label: 'Password', type: 'text' as const },
];

function UsersTable({ data, connection }: { data: unknown; connection: VyosConnectionInfo }) {
  const { addItem, updateItem, deleteItem } = useKeyedCrud(connection, USER_BASEPATH);
  const usersObj = data && typeof data === 'object' && !Array.isArray(data)
    ? (data as Record<string, unknown>)
    : null;

  return (
    <KeyedItemTable
      data={usersObj}
      columns={USER_COLUMNS}
      keyHeader="Username"
      emptyMessage="No users configured"
      addLabel="Add User"
      formFields={USER_FORM_FIELDS}
      formTitle="User"
      onAdd={(key, fields) => addItem(key, fields)}
      onEdit={(key, fields) => updateItem(key, fields)}
      onDelete={(key) => deleteItem(key)}
    />
  );
}

function SystemMetrics({ connection }: { connection: VyosConnectionInfo }) {
  return (
    <div className="space-y-3">
      <OperationalDataSection
        connection={connection}
        path={['system', 'uptime']}
        pollInterval={10000}
        title="System Uptime"
      />
      <OperationalDataSection
        connection={connection}
        path={['system', 'cpu']}
        pollInterval={10000}
        title="CPU Usage"
      />
      <OperationalDataSection
        connection={connection}
        path={['system', 'memory']}
        pollInterval={10000}
        title="Memory Usage"
      />
    </div>
  );
}

export function SystemPanel({ connection }: Props) {
  return (
    <ConfigPanel
      menuId="system"
      tabs={TABS}
      connection={connection}
      renderContent={(data, tab) => {
        if (tab.id === 'users') return <UsersTable data={data} connection={connection} />;
        if (tab.id === 'hostname') {
          return (
            <div className="space-y-4">
              <div className="rounded-md border border-border p-4">
                <p className="text-sm text-muted-foreground">Current hostname:</p>
                <p className="mt-1 font-mono text-lg font-medium">{String(data || 'Not configured')}</p>
              </div>
              <SystemMetrics connection={connection} />
            </div>
          );
        }
        if (tab.id === 'dns') {
          const servers = Array.isArray(data) ? data : (data ? [data] : []);
          return (
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Name Servers</h3>
              {servers.length === 0 ? (
                <p className="text-sm text-muted-foreground">No name servers configured</p>
              ) : (
                <ul className="space-y-1">
                  {servers.map((s, i) => (
                    <li key={i} className="font-mono text-sm rounded bg-muted/50 px-3 py-1.5">{String(s)}</li>
                  ))}
                </ul>
              )}
            </div>
          );
        }
        return <GenericConfigTab data={data} connection={connection} basePath={tab.configPath} />;
      }}
    />
  );
}
