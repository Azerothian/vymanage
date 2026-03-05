'use client';

import type { VyosConnectionInfo } from '@vymanage/vyos-client';
import { KeyedItemTable } from './KeyedItemTable';
import { EmptyConfigState } from './EmptyConfigState';
import { useKeyedCrud } from '@/lib/hooks/useKeyedCrud';

interface GenericConfigTabProps {
  data: unknown;
  connection: VyosConnectionInfo;
  basePath: string[];
  title?: string;
}

export function GenericConfigTab({ data, connection, basePath, title }: GenericConfigTabProps) {
  const { addItem, updateItem, deleteItem } = useKeyedCrud(connection, basePath);

  if (data === undefined || data === null) {
    return null; // EmptyConfigState is handled by ConfigPanel
  }

  // Primitive value
  if (typeof data !== 'object') {
    return (
      <div className="space-y-2">
        {title && <h3 className="text-sm font-medium">{title}</h3>}
        <div className="rounded-md border border-border bg-muted/30 p-3">
          <span className="font-mono text-sm">{String(data)}</span>
        </div>
      </div>
    );
  }

  // Array
  if (Array.isArray(data)) {
    return (
      <div className="space-y-2">
        {title && <h3 className="text-sm font-medium">{title}</h3>}
        <div className="rounded-md border border-border">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-3 py-2 text-left text-xs font-medium uppercase text-muted-foreground">Value</th>
              </tr>
            </thead>
            <tbody>
              {data.map((item, i) => (
                <tr key={i} className="border-b border-border hover:bg-muted/50">
                  <td className="px-3 py-2 font-mono text-sm">{typeof item === 'object' ? JSON.stringify(item) : String(item)}</td>
                </tr>
              ))}
              {data.length === 0 && (
                <tr>
                  <td className="px-4 py-8 text-center text-sm text-muted-foreground">No items</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  const obj = data as Record<string, unknown>;
  const entries = Object.entries(obj);

  if (entries.length === 0) {
    return <EmptyConfigState configPath={basePath} />;
  }

  // Check if this is a keyed collection (values are objects) vs flat key-value
  const hasObjectValues = entries.some(([, v]) => v !== null && typeof v === 'object' && !Array.isArray(v));
  const allObjectValues = entries.every(([, v]) => v !== null && typeof v === 'object' && !Array.isArray(v));

  // All values are objects -> keyed collection table
  if (allObjectValues && entries.length > 0) {
    // Collect all unique keys across all child objects for columns
    const allKeys = new Set<string>();
    for (const [, v] of entries) {
      if (v && typeof v === 'object') {
        for (const k of Object.keys(v as Record<string, unknown>)) {
          allKeys.add(k);
        }
      }
    }

    // Pick up to 4 most common leaf-value columns
    const columnKeys = Array.from(allKeys)
      .filter((k) => {
        // Only show columns where most entries have a simple (non-object) value
        const simpleCount = entries.filter(([, v]) => {
          const val = (v as Record<string, unknown>)[k];
          return val !== undefined && val !== null && typeof val !== 'object';
        }).length;
        return simpleCount > entries.length * 0.3;
      })
      .slice(0, 4);

    const columns = columnKeys.map((k) => ({
      id: k,
      header: k.replace(/-/g, ' '),
      accessor: (_key: string, value: Record<string, unknown>) => {
        const v = value[k];
        if (v === undefined || v === null) return <span className="text-muted-foreground">-</span>;
        if (typeof v === 'object') return <span className="text-muted-foreground">{`{${Object.keys(v as Record<string, unknown>).length}}`}</span>;
        return <span className="font-mono text-xs">{String(v)}</span>;
      },
    }));

    return (
      <div className="space-y-2">
        {title && <h3 className="text-sm font-medium">{title}</h3>}
        <KeyedItemTable
          data={obj}
          columns={columns}
          onAdd={(key, fields) => addItem(key, fields)}
          onEdit={(key, fields) => updateItem(key, fields)}
          onDelete={(key) => deleteItem(key)}
          formFields={columnKeys.map((k) => ({
            name: k,
            label: k.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
            type: 'text' as const,
          }))}
          formTitle={title || basePath[basePath.length - 1] || 'Item'}
        />
      </div>
    );
  }

  // Mixed or flat key-value -> sectioned view
  const flatEntries = entries.filter(([, v]) => typeof v !== 'object' || v === null || Array.isArray(v));
  const objectEntries = entries.filter(([, v]) => v !== null && typeof v === 'object' && !Array.isArray(v));

  return (
    <div className="space-y-6">
      {title && <h3 className="text-sm font-medium">{title}</h3>}

      {/* Flat key-value pairs */}
      {flatEntries.length > 0 && (
        <div className="rounded-md border border-border">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-3 py-2 text-left text-xs font-medium uppercase text-muted-foreground">Setting</th>
                <th className="px-3 py-2 text-left text-xs font-medium uppercase text-muted-foreground">Value</th>
              </tr>
            </thead>
            <tbody>
              {flatEntries.map(([key, value]) => (
                <tr key={key} className="border-b border-border hover:bg-muted/50">
                  <td className="px-3 py-2 text-sm font-medium">{key.replace(/-/g, ' ')}</td>
                  <td className="px-3 py-2 font-mono text-sm">
                    {Array.isArray(value) ? (value as unknown[]).join(', ') : String(value ?? '')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Object sub-sections */}
      {objectEntries.map(([key, value]) => (
        <GenericConfigTab
          key={key}
          data={value}
          connection={connection}
          basePath={[...basePath, key]}
          title={key.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
        />
      ))}
    </div>
  );
}
