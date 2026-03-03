'use client';

import { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { VyosConnectionInfo } from '@vymanage/vyos-client';
import { useConfigActions } from '@/lib/hooks/useConfig';
import { useClient } from '@/lib/context/ClientContext';
import { CrossRefCombobox } from '@/components/config/CrossRefCombobox';
import type { FirewallZone } from './types';

const ZONE_PATH = ['firewall', 'zone'];

type RawZoneConfig = {
  description?: string;
  'default-action'?: string;
  interface?: string | string[];
  from?: Record<string, { firewall?: { name?: string; 'ipv6-name'?: string } }>;
};

function parseZones(data: unknown): FirewallZone[] {
  if (!data || typeof data !== 'object') return [];
  return Object.entries(data as Record<string, RawZoneConfig>).map(([name, cfg]) => {
    const ifaces = cfg.interface
      ? Array.isArray(cfg.interface) ? cfg.interface : [cfg.interface]
      : [];
    const from = Object.entries(cfg.from ?? {}).map(([zone, fromCfg]) => ({
      zone,
      firewallName: fromCfg.firewall?.name,
      firewallIpv6Name: fromCfg.firewall?.['ipv6-name'],
    }));
    return {
      name,
      interfaces: ifaces,
      defaultAction: cfg['default-action'],
      description: cfg.description,
      from,
    };
  });
}

interface ZoneDetailProps {
  zone: FirewallZone;
  connection: VyosConnectionInfo;
  onSaved: () => void;
  onClose: () => void;
}

function ZoneDetail({ zone, connection, onSaved, onClose }: ZoneDetailProps) {
  const { setConfig, deleteConfig } = useConfigActions(connection);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [description, setDescription] = useState(zone.description ?? '');
  const [defaultAction, setDefaultAction] = useState(zone.defaultAction ?? 'drop');
  const [interfaces, setInterfaces] = useState<string[]>(zone.interfaces);
  const [from, setFrom] = useState(zone.from);
  const [newInterface, setNewInterface] = useState('');

  const base = [...ZONE_PATH, zone.name];

  const handleAddInterface = () => {
    if (!newInterface) return;
    setInterfaces((prev) => [...prev, newInterface]);
    setNewInterface('');
  };

  const handleRemoveInterface = (iface: string) => {
    setInterfaces((prev) => prev.filter((i) => i !== iface));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      if (description) await setConfig([...base, 'description'], description);
      else await deleteConfig([...base, 'description']).catch(() => undefined);
      await setConfig([...base, 'default-action'], defaultAction);

      // Remove all old interfaces then set new ones
      await deleteConfig([...base, 'interface']).catch(() => undefined);
      for (const iface of interfaces) {
        await setConfig([...base, 'interface'], iface);
      }

      // Save from rules
      for (const f of from) {
        if (f.firewallName) await setConfig([...base, 'from', f.zone, 'firewall', 'name'], f.firewallName);
        if (f.firewallIpv6Name) await setConfig([...base, 'from', f.zone, 'firewall', 'ipv6-name'], f.firewallIpv6Name);
      }

      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-4 p-4">
      <div>
        <label className="mb-1 block text-sm font-medium">Description</label>
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Default Action</label>
        <select
          value={defaultAction}
          onChange={(e) => setDefaultAction(e.target.value)}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="drop">Drop</option>
          <option value="accept">Accept</option>
          <option value="reject">Reject</option>
        </select>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Interfaces</label>
        <div className="flex flex-wrap gap-1 mb-2">
          {interfaces.map((iface) => (
            <span key={iface} className="flex items-center gap-1 rounded bg-muted px-2 py-0.5 text-xs font-mono">
              {iface}
              <button type="button" onClick={() => handleRemoveInterface(iface)} className="text-muted-foreground hover:text-destructive">✕</button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <div className="flex-1">
            <CrossRefCombobox
              lookupType="interfaces"
              value={newInterface}
              onChange={setNewInterface}
              connection={connection}
              placeholder="Add interface..."
            />
          </div>
          <button
            type="button"
            onClick={handleAddInterface}
            className="rounded-md border border-border px-3 py-2 text-sm hover:bg-muted"
          >
            Add
          </button>
        </div>
      </div>

      {from.length > 0 && (
        <div>
          <label className="mb-1 block text-sm font-medium">From Zones</label>
          <div className="rounded-md border border-border overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">Zone</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">IPv4 Ruleset</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">IPv6 Ruleset</th>
                </tr>
              </thead>
              <tbody>
                {from.map((f, i) => (
                  <tr key={f.zone} className="border-b border-border">
                    <td className="px-3 py-2 text-sm font-mono">{f.zone}</td>
                    <td className="px-3 py-2">
                      <CrossRefCombobox
                        lookupType="firewall-ipv4-rulesets"
                        value={f.firewallName ?? ''}
                        onChange={(v) => {
                          const next = [...from];
                          next[i] = { ...next[i], firewallName: v };
                          setFrom(next);
                        }}
                        connection={connection}
                        placeholder="No ruleset"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <CrossRefCombobox
                        lookupType="firewall-ipv6-rulesets"
                        value={f.firewallIpv6Name ?? ''}
                        onChange={(v) => {
                          const next = [...from];
                          next[i] = { ...next[i], firewallIpv6Name: v };
                          setFrom(next);
                        }}
                        connection={connection}
                        placeholder="No ruleset"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
      )}

      <div className="flex justify-end gap-2">
        <button type="button" onClick={onClose} className="rounded-md border border-border px-4 py-2 text-sm hover:bg-muted">
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Apply'}
        </button>
      </div>
    </form>
  );
}

export interface ZonesTabProps {
  connection: VyosConnectionInfo;
}

export function ZonesTab({ connection }: ZonesTabProps) {
  const [editingZone, setEditingZone] = useState<FirewallZone | null>(null);
  const queryClient = useQueryClient();
  const { setConfig, deleteConfig } = useConfigActions(connection);
  const client = useClient(connection);

  const { data, isLoading } = useQuery({
    queryKey: ['config', connection.host, ...ZONE_PATH],
    queryFn: () => client!.showConfig(ZONE_PATH),
    enabled: !!client,
    refetchInterval: false,
  });

  const zones = useMemo(() => parseZones(data), [data]);

  const handleDelete = async (name: string) => {
    if (!confirm(`Delete zone "${name}"?`)) return;
    await deleteConfig([...ZONE_PATH, name]);
    await queryClient.invalidateQueries({ queryKey: ['config', connection.host, ...ZONE_PATH] });
    if (editingZone?.name === name) setEditingZone(null);
  };

  const handleAdd = () => {
    const name = prompt('New zone name:');
    if (!name) return;
    setConfig([...ZONE_PATH, name, 'default-action'], 'drop').then(() => {
      queryClient.invalidateQueries({ queryKey: ['config', connection.host, ...ZONE_PATH] });
    });
  };

  const handleSaved = () => {
    queryClient.invalidateQueries({ queryKey: ['config', connection.host, ...ZONE_PATH] });
    setEditingZone(null);
  };

  return (
    <div className="flex gap-4 h-full">
      {/* Zone list */}
      <div className="flex flex-col gap-3 w-64 flex-shrink-0">
        <button
          onClick={handleAdd}
          className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          + Add Zone
        </button>

        {isLoading ? (
          <div className="text-sm text-muted-foreground py-4 text-center">Loading...</div>
        ) : (
          <div className="rounded-md border border-border overflow-hidden">
            {zones.length === 0 ? (
              <div className="px-4 py-6 text-center text-sm text-muted-foreground">No zones configured</div>
            ) : (
              zones.map((zone) => (
                <div
                  key={zone.name}
                  className={`flex items-center justify-between border-b border-border last:border-0 px-3 py-2 cursor-pointer hover:bg-muted/40 ${editingZone?.name === zone.name ? 'bg-accent/30' : ''}`}
                  onClick={() => setEditingZone(zone)}
                >
                  <div>
                    <div className="text-sm font-medium">{zone.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {zone.interfaces.length} interface{zone.interfaces.length !== 1 ? 's' : ''}
                    </div>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(zone.name); }}
                    className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                  >
                    ✕
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Zone detail */}
      <div className="flex-1 overflow-auto">
        {editingZone ? (
          <div className="rounded-md border border-border">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <h3 className="text-sm font-semibold">Zone: {editingZone.name}</h3>
              <button onClick={() => setEditingZone(null)} className="text-muted-foreground hover:text-foreground">✕</button>
            </div>
            <ZoneDetail
              zone={editingZone}
              connection={connection}
              onSaved={handleSaved}
              onClose={() => setEditingZone(null)}
            />
          </div>
        ) : (
          <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">
            Select a zone to configure
          </div>
        )}
      </div>
    </div>
  );
}
