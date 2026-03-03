'use client';

import type { VyosConnectionInfo } from '@vymanage/vyos-client';
import { ConfigPanel, type TabDefinition } from '@/components/config/ConfigPanel';
import { OperationalDataSection } from '@/components/config/OperationalDataSection';

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

function UsersTable({ data }: { data: unknown }) {
  const users = data && typeof data === 'object' ? Object.entries(data as Record<string, unknown>) : [];

  return (
    <div className="rounded-md border border-border">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border bg-muted/50">
            <th className="px-3 py-2 text-left text-xs font-medium uppercase text-muted-foreground">Username</th>
            <th className="px-3 py-2 text-left text-xs font-medium uppercase text-muted-foreground">Full Name</th>
            <th className="px-3 py-2 text-left text-xs font-medium uppercase text-muted-foreground">Level</th>
            <th className="px-3 py-2 text-left text-xs font-medium uppercase text-muted-foreground">SSH Keys</th>
          </tr>
        </thead>
        <tbody>
          {users.length === 0 ? (
            <tr>
              <td colSpan={4} className="px-4 py-8 text-center text-sm text-muted-foreground">No users configured</td>
            </tr>
          ) : (
            users.map(([username, cfg]) => {
              const user = cfg as Record<string, unknown>;
              const sshKeys = Object.keys((user['authentication'] as Record<string, unknown> || {})?.['public-keys'] as Record<string, unknown> || {}).length;
              return (
                <tr key={username} className="border-b border-border hover:bg-muted/50">
                  <td className="px-3 py-2 font-medium text-sm">{username}</td>
                  <td className="px-3 py-2 text-sm text-muted-foreground">{String(user['full-name'] || '')}</td>
                  <td className="px-3 py-2 text-sm">
                    <span className={`rounded px-1.5 py-0.5 text-xs font-medium ${String(user.level) === 'admin' ? 'bg-orange-500/20 text-orange-700 dark:text-orange-400' : 'bg-blue-500/20 text-blue-700 dark:text-blue-400'}`}>
                      {String(user.level || 'operator')}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-sm">{sshKeys > 0 ? `${sshKeys} key(s)` : 'None'}</td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
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
        if (tab.id === 'users') return <UsersTable data={data} />;
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
        return (
          <pre className="max-h-96 overflow-auto rounded bg-muted/50 p-3 font-mono text-xs scrollbar-thin">
            {data === undefined || data === null ? 'No configuration' : JSON.stringify(data, null, 2)}
          </pre>
        );
      }}
    />
  );
}
