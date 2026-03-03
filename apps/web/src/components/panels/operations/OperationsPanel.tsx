'use client';

import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { VyosConnectionInfo } from '@vymanage/vyos-client';
import { ConfigPanel, type TabDefinition } from '@/components/config/ConfigPanel';
import { useClient } from '@/lib/context/ClientContext';

const TABS: TabDefinition[] = [
  { id: 'system-info', label: 'System Info', configPath: ['system'] },
  { id: 'reboot', label: 'Reboot/Poweroff', configPath: ['system', 'host-name'] },
  { id: 'show-commands', label: 'Show Commands', configPath: ['system', 'host-name'] },
];

interface Props {
  connection: VyosConnectionInfo;
}

function SystemInfoContent({ connection }: { connection: VyosConnectionInfo }) {
  const client = useClient(connection);

  const { data: version, isLoading: vLoading } = useQuery({
    queryKey: ['op', connection.host, 'version'],
    queryFn: () => client!.show(['version']),
    enabled: !!client,
    staleTime: 60_000,
  });

  const { data: uptime, isLoading: uLoading } = useQuery({
    queryKey: ['op', connection.host, 'uptime'],
    queryFn: () => client!.show(['system', 'uptime']),
    enabled: !!client,
    refetchInterval: 30_000,
  });

  const { data: interfaces, isLoading: iLoading } = useQuery({
    queryKey: ['op', connection.host, 'interfaces'],
    queryFn: () => client!.show(['interfaces']),
    enabled: !!client,
    refetchInterval: 30_000,
  });

  const isLoading = vLoading || uLoading || iLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <span className="ml-2 text-sm text-muted-foreground">Loading system info...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-md border border-border p-4">
          <h3 className="mb-2 text-sm font-medium text-muted-foreground">Version</h3>
          <pre className="overflow-auto font-mono text-xs text-foreground">
            {typeof version === 'string' ? version : JSON.stringify(version, null, 2)}
          </pre>
        </div>
        <div className="rounded-md border border-border p-4">
          <h3 className="mb-2 text-sm font-medium text-muted-foreground">Uptime</h3>
          <pre className="overflow-auto font-mono text-xs text-foreground">
            {typeof uptime === 'string' ? uptime : JSON.stringify(uptime, null, 2)}
          </pre>
        </div>
      </div>
      <div className="rounded-md border border-border p-4">
        <h3 className="mb-2 text-sm font-medium text-muted-foreground">Interfaces</h3>
        <pre className="max-h-60 overflow-auto font-mono text-xs text-foreground scrollbar-thin">
          {typeof interfaces === 'string' ? interfaces : JSON.stringify(interfaces, null, 2)}
        </pre>
      </div>
    </div>
  );
}

function RebootContent({ connection }: { connection: VyosConnectionInfo }) {
  const [showRebootConfirm, setShowRebootConfirm] = useState(false);
  const [showPoweroffConfirm, setShowPoweroffConfirm] = useState(false);
  const [actionResult, setActionResult] = useState<string | null>(null);
  const [isActing, setIsActing] = useState(false);
  const client = useClient(connection);

  const handleReboot = useCallback(async () => {
    setIsActing(true);
    try {
      await client?.show(['reboot', 'now']);
      setActionResult('Reboot command sent. System will restart shortly.');
    } catch (err) {
      setActionResult(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsActing(false);
      setShowRebootConfirm(false);
    }
  }, [client]);

  const handlePoweroff = useCallback(async () => {
    setIsActing(true);
    try {
      await client?.show(['poweroff', 'now']);
      setActionResult('Poweroff command sent. System will shut down shortly.');
    } catch (err) {
      setActionResult(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsActing(false);
      setShowPoweroffConfirm(false);
    }
  }, [client]);

  return (
    <div className="space-y-4">
      {actionResult && (
        <div className="rounded-md border border-border bg-muted/50 p-4 text-sm">
          {actionResult}
          <button onClick={() => setActionResult(null)} className="ml-2 text-muted-foreground hover:text-foreground">
            Dismiss
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-md border border-border p-4">
          <h3 className="mb-2 font-medium">Reboot System</h3>
          <p className="mb-4 text-sm text-muted-foreground">
            Restart the router. All current connections will be interrupted.
          </p>
          {!showRebootConfirm ? (
            <button
              onClick={() => setShowRebootConfirm(true)}
              className="rounded-md bg-yellow-500 px-4 py-2 text-sm font-medium text-white hover:bg-yellow-600"
            >
              Reboot
            </button>
          ) : (
            <div className="space-y-2">
              <p className="text-sm font-medium text-yellow-600 dark:text-yellow-400">Are you sure you want to reboot?</p>
              <div className="flex gap-2">
                <button
                  onClick={handleReboot}
                  disabled={isActing}
                  className="rounded-md bg-yellow-500 px-4 py-2 text-sm font-medium text-white hover:bg-yellow-600 disabled:opacity-50"
                >
                  {isActing ? 'Sending...' : 'Confirm Reboot'}
                </button>
                <button
                  onClick={() => setShowRebootConfirm(false)}
                  className="rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-muted"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="rounded-md border border-border p-4">
          <h3 className="mb-2 font-medium">Power Off System</h3>
          <p className="mb-4 text-sm text-muted-foreground">
            Shut down the router. Requires physical access to restart.
          </p>
          {!showPoweroffConfirm ? (
            <button
              onClick={() => setShowPoweroffConfirm(true)}
              className="rounded-md bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground hover:bg-destructive/90"
            >
              Power Off
            </button>
          ) : (
            <div className="space-y-2">
              <p className="text-sm font-medium text-destructive">Are you sure you want to power off?</p>
              <div className="flex gap-2">
                <button
                  onClick={handlePoweroff}
                  disabled={isActing}
                  className="rounded-md bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50"
                >
                  {isActing ? 'Sending...' : 'Confirm Power Off'}
                </button>
                <button
                  onClick={() => setShowPoweroffConfirm(false)}
                  className="rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-muted"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ShowCommandsContent({ connection }: { connection: VyosConnectionInfo }) {
  const [command, setCommand] = useState('');
  const [submittedCommand, setSubmittedCommand] = useState<string[]>([]);
  const [output, setOutput] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const client = useClient(connection);

  const handleRun = useCallback(async () => {
    if (!command.trim()) return;
    const parts = command.trim().split(/\s+/);
    setSubmittedCommand(parts);
    setIsLoading(true);
    setError(null);
    setOutput(null);
    try {
      const result = await client?.show(parts);
      setOutput(typeof result === 'string' ? result : JSON.stringify(result, null, 2));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Command failed');
    } finally {
      setIsLoading(false);
    }
  }, [command, client]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleRun();
  }, [handleRun]);

  const quickCommands = [
    'interfaces',
    'version',
    'system uptime',
    'ip route',
    'ip bgp summary',
    'arp',
    'ntp',
    'firewall summary',
  ];

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-sm text-muted-foreground">show</span>
          <input
            type="text"
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="interfaces, ip route, bgp summary..."
            className="w-full rounded-md border border-input bg-background py-2 pl-14 pr-3 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <button
          onClick={handleRun}
          disabled={isLoading || !command.trim()}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {isLoading ? 'Running...' : 'Run'}
        </button>
      </div>

      <div className="flex flex-wrap gap-1">
        {quickCommands.map((cmd) => (
          <button
            key={cmd}
            onClick={() => {
              setCommand(cmd);
            }}
            className="rounded-full border border-border px-2 py-0.5 font-mono text-xs hover:bg-muted"
          >
            {cmd}
          </button>
        ))}
      </div>

      {(output !== null || error || isLoading) && (
        <div className="rounded-md border border-border">
          <div className="flex items-center gap-2 border-b border-border bg-muted/50 px-3 py-1.5">
            <span className="font-mono text-xs text-muted-foreground">
              $ show {submittedCommand.join(' ')}
            </span>
          </div>
          {isLoading ? (
            <div className="p-4 text-center text-sm text-muted-foreground">Running command...</div>
          ) : error ? (
            <div className="p-4 font-mono text-sm text-destructive">{error}</div>
          ) : (
            <pre className="max-h-96 overflow-auto p-4 font-mono text-xs scrollbar-thin">{output}</pre>
          )}
        </div>
      )}
    </div>
  );
}

export function OperationsPanel({ connection }: Props) {
  return (
    <ConfigPanel
      menuId="operations"
      tabs={TABS}
      connection={connection}
      renderContent={(_data, tab) => {
        if (tab.id === 'system-info') return <SystemInfoContent connection={connection} />;
        if (tab.id === 'reboot') return <RebootContent connection={connection} />;
        if (tab.id === 'show-commands') return <ShowCommandsContent connection={connection} />;
        return null;
      }}
    />
  );
}
