'use client';

import { useQuery } from '@tanstack/react-query';
import type { VyosConnectionInfo } from '@vymanage/vyos-client';
import { useClient } from '@/lib/context/ClientContext';

export interface OperationalDataSectionProps {
  connection: VyosConnectionInfo;
  path: string[];
  pollInterval?: number;
  enabled?: boolean;
  renderData?: (data: unknown) => React.ReactNode;
  title?: string;
}

export function OperationalDataSection({
  connection,
  path,
  pollInterval = 5000,
  enabled = true,
  renderData,
  title = 'Operational Data',
}: OperationalDataSectionProps) {
  const client = useClient(connection);

  const { data, isLoading, error, dataUpdatedAt } = useQuery({
    queryKey: ['operational', connection.host, ...path],
    queryFn: () => client!.show(path),
    refetchInterval: enabled ? pollInterval : false,
    enabled: enabled && !!client,
  });

  const lastUpdated = dataUpdatedAt
    ? `${Math.round((Date.now() - dataUpdatedAt) / 1000)}s ago`
    : 'never';

  return (
    <div className="mt-4 border-t border-border pt-4">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>🔄 polling: {pollInterval / 1000}s</span>
          <span>· updated {lastUpdated}</span>
        </div>
      </div>

      {isLoading && (
        <div className="py-4 text-center text-sm text-muted-foreground">
          Loading operational data...
        </div>
      )}

      {error && (
        <div className="rounded bg-destructive/10 p-2 text-sm text-destructive">
          Failed to fetch operational data
        </div>
      )}

      {data !== undefined && !isLoading && (
        renderData ? (
          renderData(data)
        ) : (
          <pre className="max-h-40 overflow-auto rounded bg-muted/50 p-3 font-mono text-xs scrollbar-thin">
            {typeof data === 'string' ? data : JSON.stringify(data, null, 2)}
          </pre>
        )
      )}
    </div>
  );
}
