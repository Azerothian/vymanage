'use client';

import { useState, useCallback } from 'react';
import type { VyosConnectionInfo } from '@vymanage/vyos-client';
import { CrossRefCombobox } from '@/components/config/CrossRefCombobox';
import type { RuleEditorValues } from './types';

const ACTION_OPTIONS = [
  { value: 'accept', label: 'Accept' },
  { value: 'drop', label: 'Drop' },
  { value: 'reject', label: 'Reject' },
  { value: 'jump', label: 'Jump' },
  { value: 'return', label: 'Return' },
  { value: 'queue', label: 'Queue' },
  { value: 'continue', label: 'Continue' },
];

const PROTOCOL_OPTIONS = [
  { value: '', label: 'Any' },
  { value: 'tcp', label: 'TCP' },
  { value: 'udp', label: 'UDP' },
  { value: 'tcp_udp', label: 'TCP/UDP' },
  { value: 'icmp', label: 'ICMP' },
  { value: 'icmpv6', label: 'ICMPv6' },
  { value: 'esp', label: 'ESP' },
  { value: 'ah', label: 'AH' },
  { value: 'gre', label: 'GRE' },
  { value: 'all', label: 'All' },
];

export interface RuleEditorProps {
  values: RuleEditorValues;
  connection: VyosConnectionInfo;
  onSubmit: (values: RuleEditorValues) => Promise<void>;
  onCancel: () => void;
  isNew?: boolean;
}

export function RuleEditor({ values: initial, connection, onSubmit, onCancel, isNew = false }: RuleEditorProps) {
  const [values, setValues] = useState<RuleEditorValues>(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = useCallback(<K extends keyof RuleEditorValues>(key: K, val: RuleEditorValues[K]) => {
    setValues((prev) => ({ ...prev, [key]: val }));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await onSubmit(values);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save rule');
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4">
      <div className="flex gap-3">
        <div className="w-28">
          <label className="mb-1 block text-sm font-medium">Rule #</label>
          <input
            type="number"
            value={values.id}
            onChange={(e) => set('id', Number(e.target.value))}
            min={1}
            max={999999}
            disabled={!isNew}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
          />
        </div>
        <div className="flex-1">
          <label className="mb-1 block text-sm font-medium">Action</label>
          <select
            value={values.action}
            onChange={(e) => set('action', e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {ACTION_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
        <div className="flex-1">
          <label className="mb-1 block text-sm font-medium">Protocol</label>
          <select
            value={values.protocol}
            onChange={(e) => set('protocol', e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {PROTOCOL_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Description</label>
        <input
          type="text"
          value={values.description}
          onChange={(e) => set('description', e.target.value)}
          placeholder="Optional description"
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {/* Source */}
      <fieldset className="rounded-md border border-border p-3 space-y-3">
        <legend className="px-1 text-xs font-semibold text-muted-foreground">Source</legend>
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Address</label>
            <input
              type="text"
              value={values.srcAddress}
              onChange={(e) => set('srcAddress', e.target.value)}
              placeholder="0.0.0.0/0"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div className="flex-1">
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Port</label>
            <input
              type="text"
              value={values.srcPort}
              onChange={(e) => set('srcPort', e.target.value)}
              placeholder="80 or 80-90"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Address Group</label>
            <CrossRefCombobox
              lookupType="firewall-address-groups"
              value={values.srcAddressGroup}
              onChange={(v) => set('srcAddressGroup', v)}
              connection={connection}
              placeholder="No group"
            />
          </div>
          <div className="flex-1">
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Port Group</label>
            <CrossRefCombobox
              lookupType="firewall-port-groups"
              value={values.srcPortGroup}
              onChange={(v) => set('srcPortGroup', v)}
              connection={connection}
              placeholder="No group"
            />
          </div>
        </div>
      </fieldset>

      {/* Destination */}
      <fieldset className="rounded-md border border-border p-3 space-y-3">
        <legend className="px-1 text-xs font-semibold text-muted-foreground">Destination</legend>
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Address</label>
            <input
              type="text"
              value={values.dstAddress}
              onChange={(e) => set('dstAddress', e.target.value)}
              placeholder="0.0.0.0/0"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div className="flex-1">
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Port</label>
            <input
              type="text"
              value={values.dstPort}
              onChange={(e) => set('dstPort', e.target.value)}
              placeholder="443 or 443-445"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Address Group</label>
            <CrossRefCombobox
              lookupType="firewall-address-groups"
              value={values.dstAddressGroup}
              onChange={(v) => set('dstAddressGroup', v)}
              connection={connection}
              placeholder="No group"
            />
          </div>
          <div className="flex-1">
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Port Group</label>
            <CrossRefCombobox
              lookupType="firewall-port-groups"
              value={values.dstPortGroup}
              onChange={(v) => set('dstPortGroup', v)}
              connection={connection}
              placeholder="No group"
            />
          </div>
        </div>
      </fieldset>

      <div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={values.disabled}
            onChange={(e) => set('disabled', e.target.checked)}
            className="rounded border-input"
          />
          <span className="text-sm">Disable rule</span>
        </label>
      </div>

      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
      )}

      <div className="flex justify-end gap-2 pt-1">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border border-border px-4 py-2 text-sm hover:bg-muted"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {saving ? 'Saving...' : isNew ? 'Add Rule' : 'Update Rule'}
        </button>
      </div>
    </form>
  );
}
