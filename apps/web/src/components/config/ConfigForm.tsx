'use client';

import { useState, useCallback } from 'react';
import type { VyosConnectionInfo } from '@vymanage/vyos-client';
import { useConfigActions } from '@/lib/hooks/useConfig';

export interface ConfigField {
  key: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'checkbox' | 'crossref';
  options?: { value: string; label: string }[];
  crossrefType?: string;
  required?: boolean;
  placeholder?: string;
  helpText?: string;
}

export interface ConfigFormProps {
  connection: VyosConnectionInfo;
  basePath: string[];
  fields: ConfigField[];
  initialValues?: Record<string, string>;
  onSaved?: () => void;
}

export function ConfigForm({
  connection,
  basePath,
  fields,
  initialValues = {},
  onSaved,
}: ConfigFormProps) {
  const [values, setValues] = useState<Record<string, string>>(initialValues);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { setConfig, deleteConfig } = useConfigActions(connection);

  const handleChange = useCallback((key: string, value: string) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setSaving(true);
      setError(null);

      try {
        for (const field of fields) {
          const newValue = values[field.key] ?? '';
          const oldValue = initialValues[field.key] ?? '';

          if (newValue !== oldValue) {
            if (newValue === '' && oldValue !== '') {
              await deleteConfig([...basePath, field.key]);
            } else if (newValue !== '') {
              await setConfig([...basePath, field.key], newValue);
            }
          }
        }
        onSaved?.();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to save');
      } finally {
        setSaving(false);
      }
    },
    [values, initialValues, fields, basePath, setConfig, deleteConfig, onSaved],
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {fields.map((field) => (
        <div key={field.key}>
          <label className="mb-1 block text-sm font-medium">
            {field.label}
            {field.required && <span className="text-destructive"> *</span>}
          </label>

          {field.type === 'text' || field.type === 'number' ? (
            <input
              type={field.type}
              value={values[field.key] ?? ''}
              onChange={(e) => handleChange(field.key, e.target.value)}
              placeholder={field.placeholder}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          ) : field.type === 'select' ? (
            <select
              value={values[field.key] ?? ''}
              onChange={(e) => handleChange(field.key, e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">Select...</option>
              {field.options?.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          ) : field.type === 'checkbox' ? (
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={values[field.key] === 'true'}
                onChange={(e) => handleChange(field.key, String(e.target.checked))}
                className="rounded border-input"
              />
              <span className="text-sm text-muted-foreground">{field.helpText}</span>
            </label>
          ) : null}

          {field.helpText && field.type !== 'checkbox' && (
            <p className="mt-1 text-xs text-muted-foreground">{field.helpText}</p>
          )}
        </div>
      ))}

      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
      )}

      <div className="flex justify-end gap-2">
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
