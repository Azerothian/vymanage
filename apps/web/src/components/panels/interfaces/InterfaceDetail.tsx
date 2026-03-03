'use client';

import { useState, useCallback } from 'react';
import type { VyosConnectionInfo } from '@vymanage/vyos-client';
import { useConfigActions } from '@/lib/hooks/useConfig';
import { CrossRefCombobox } from '@/components/config/CrossRefCombobox';
import type { InterfaceNode } from './types';

export interface InterfaceDetailProps {
  node: InterfaceNode | null;
  connection: VyosConnectionInfo;
  onClose: () => void;
  onSaved: () => void;
}

const SPEED_OPTIONS = [
  { value: 'auto', label: 'Auto' },
  { value: '10', label: '10 Mbps' },
  { value: '100', label: '100 Mbps' },
  { value: '1000', label: '1 Gbps' },
  { value: '2500', label: '2.5 Gbps' },
  { value: '10000', label: '10 Gbps' },
];

const DUPLEX_OPTIONS = [
  { value: 'auto', label: 'Auto' },
  { value: 'half', label: 'Half' },
  { value: 'full', label: 'Full' },
];

function getBasePath(node: InterfaceNode): string[] {
  switch (node.type) {
    case 'ethernet': return ['interfaces', 'ethernet', node.name];
    case 'bonding': return ['interfaces', 'bonding', node.name];
    case 'bridge': return ['interfaces', 'bridge', node.name];
    case 'pppoe': return ['interfaces', 'pppoe', node.name];
    case 'wireguard': return ['interfaces', 'wireguard', node.name];
    case 'openvpn': return ['interfaces', 'openvpn', node.name];
    case 'loopback': return ['interfaces', 'loopback', node.name];
    case 'dummy': return ['interfaces', 'dummy', node.name];
    case 'tunnel': return ['interfaces', 'tunnel', node.name];
    case 'wireless': return ['interfaces', 'wireless', node.name];
    case 'vxlan': return ['interfaces', 'vxlan', node.name];
    case 'vlan':
      if (node.parentName) {
        const parts = node.name.split('.');
        const vifId = parts[parts.length - 1];
        return ['interfaces', 'ethernet', parts[0], 'vif', vifId];
      }
      return ['interfaces', 'ethernet', node.name];
    default: return ['interfaces', 'ethernet', node.name];
  }
}

export function InterfaceDetail({ node, connection, onClose, onSaved }: InterfaceDetailProps) {
  const { setConfig, deleteConfig } = useConfigActions(connection);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [description, setDescription] = useState(node?.description ?? '');
  const [address, setAddress] = useState(node?.addresses[0] ?? '');
  const [vrf, setVrf] = useState(node?.vrf ?? '');
  const [mtu, setMtu] = useState(String(node?.mtu ?? ''));
  const [speed, setSpeed] = useState(node?.speed ?? 'auto');
  const [duplex, setDuplex] = useState(node?.duplex ?? 'auto');
  const [disabled, setDisabled] = useState(node?.disabled ?? false);

  const handleSave = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!node) return;
      setSaving(true);
      setError(null);
      const base = getBasePath(node);

      try {
        if (description) await setConfig([...base, 'description'], description);
        else await deleteConfig([...base, 'description']).catch(() => undefined);

        if (address) await setConfig([...base, 'address'], address);

        if (vrf) await setConfig([...base, 'vrf'], vrf);
        else await deleteConfig([...base, 'vrf']).catch(() => undefined);

        if (mtu) await setConfig([...base, 'mtu'], mtu);

        if (node.type === 'ethernet' || node.type === 'bonding') {
          await setConfig([...base, 'speed'], speed);
          await setConfig([...base, 'duplex'], duplex);
        }

        if (disabled) await setConfig([...base, 'disable']);
        else await deleteConfig([...base, 'disable']).catch(() => undefined);

        onSaved();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to save');
      } finally {
        setSaving(false);
      }
    },
    [node, description, address, vrf, mtu, speed, duplex, disabled, setConfig, deleteConfig, onSaved],
  );

  if (!node) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        Select an interface to view details
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="font-mono font-semibold">{node.name}</span>
          <span className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">{node.type}</span>
        </div>
        <button
          onClick={onClose}
          className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          ✕
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Description</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Interface description"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">IP Address</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="e.g. 192.168.1.1/24"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">VRF</label>
            <CrossRefCombobox
              lookupType="vrf-instances"
              value={vrf}
              onChange={setVrf}
              connection={connection}
              placeholder="Default (no VRF)"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">MTU</label>
            <input
              type="number"
              value={mtu}
              onChange={(e) => setMtu(e.target.value)}
              placeholder="1500"
              min={68}
              max={9200}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {(node.type === 'ethernet' || node.type === 'bonding') && (
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="mb-1 block text-sm font-medium">Speed</label>
                <select
                  value={speed}
                  onChange={(e) => setSpeed(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {SPEED_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div className="flex-1">
                <label className="mb-1 block text-sm font-medium">Duplex</label>
                <select
                  value={duplex}
                  onChange={(e) => setDuplex(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {DUPLEX_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={disabled}
                onChange={(e) => setDisabled(e.target.checked)}
                className="rounded border-input"
              />
              <span className="text-sm">Disable interface</span>
            </label>
          </div>

          {node.children.length > 0 && (
            <div className="rounded-md border border-border p-3">
              <p className="text-xs font-medium text-muted-foreground mb-2">
                Sub-interfaces / Members ({node.children.length})
              </p>
              <div className="flex flex-wrap gap-1">
                {node.children.map((child) => (
                  <span key={child.name} className="rounded bg-muted px-2 py-0.5 text-xs font-mono">
                    {child.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-border px-4 py-2 text-sm hover:bg-muted"
            >
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
      </div>
    </div>
  );
}
