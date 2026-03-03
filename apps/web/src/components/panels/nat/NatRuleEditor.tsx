'use client';

import { useState, useCallback } from 'react';
import type { VyosConnectionInfo } from '@vymanage/vyos-client';
import { CrossRefCombobox } from '@/components/config/CrossRefCombobox';
import type { NatFamily, NatRuleEditorValues } from './types';

const PROTOCOL_OPTIONS = [
  { value: '', label: 'Any' },
  { value: 'tcp', label: 'TCP' },
  { value: 'udp', label: 'UDP' },
  { value: 'tcp_udp', label: 'TCP/UDP' },
  { value: 'icmp', label: 'ICMP' },
  { value: 'all', label: 'All' },
];

export interface NatRuleEditorProps {
  values: NatRuleEditorValues;
  family: NatFamily;
  connection: VyosConnectionInfo;
  onSubmit: (values: NatRuleEditorValues) => Promise<void>;
  onCancel: () => void;
  isNew?: boolean;
}

export function NatRuleEditor({
  values: initial,
  family,
  connection,
  onSubmit,
  onCancel,
  isNew = false,
}: NatRuleEditorProps) {
  const [values, setValues] = useState<NatRuleEditorValues>(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = useCallback(<K extends keyof NatRuleEditorValues>(key: K, val: NatRuleEditorValues[K]) => {
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

  const showOutbound = family === 'source' || family === 'cgnat' || family === 'nat66';
  const showInbound = family === 'destination' || family === 'nat64';
  const showTranslation = true;

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

      {/* Interface */}
      {showOutbound && (
        <div>
          <label className="mb-1 block text-sm font-medium">Outbound Interface</label>
          <CrossRefCombobox
            lookupType="interfaces"
            value={values.outboundInterface}
            onChange={(v) => set('outboundInterface', v)}
            connection={connection}
            placeholder="Any interface"
          />
        </div>
      )}
      {showInbound && (
        <div>
          <label className="mb-1 block text-sm font-medium">Inbound Interface</label>
          <CrossRefCombobox
            lookupType="interfaces"
            value={values.inboundInterface}
            onChange={(v) => set('inboundInterface', v)}
            connection={connection}
            placeholder="Any interface"
          />
        </div>
      )}

      {/* Source */}
      <fieldset className="rounded-md border border-border p-3 space-y-2">
        <legend className="px-1 text-xs font-semibold text-muted-foreground">Source</legend>
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Address / Prefix</label>
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
      </fieldset>

      {/* Destination */}
      <fieldset className="rounded-md border border-border p-3 space-y-2">
        <legend className="px-1 text-xs font-semibold text-muted-foreground">Destination</legend>
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Address / Prefix</label>
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
              placeholder="443"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>
      </fieldset>

      {/* Translation */}
      {showTranslation && (
        <fieldset className="rounded-md border border-border p-3 space-y-2">
          <legend className="px-1 text-xs font-semibold text-muted-foreground">Translation</legend>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Address</label>
              <input
                type="text"
                value={values.translationAddress}
                onChange={(e) => set('translationAddress', e.target.value)}
                placeholder="203.0.113.1"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div className="flex-1">
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Port</label>
              <input
                type="text"
                value={values.translationPort}
                onChange={(e) => set('translationPort', e.target.value)}
                placeholder="8080"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>
          {(family === 'nat64' || family === 'nat66') && (
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Prefix</label>
              <input
                type="text"
                value={values.translationPrefix}
                onChange={(e) => set('translationPrefix', e.target.value)}
                placeholder="64:ff9b::/96"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          )}
        </fieldset>
      )}

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
