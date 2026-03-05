'use client';

import { useState, useEffect } from 'react';

export interface FormFieldDef {
  name: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'checkbox' | 'textarea';
  options?: { label: string; value: string }[];
  placeholder?: string;
  required?: boolean;
}

export interface ConfigFormDialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  fields: FormFieldDef[];
  initialValues?: Record<string, string>;
  onSubmit: (values: Record<string, string>) => void | Promise<void>;
  isNew?: boolean;
  keyField?: { name: string; label: string; placeholder?: string };
}

export function ConfigFormDialog({
  open,
  onClose,
  title,
  fields,
  initialValues,
  onSubmit,
  isNew,
  keyField,
}: ConfigFormDialogProps) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [keyValue, setKeyValue] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setValues(initialValues ?? {});
      setKeyValue('');
      setSubmitting(false);
    }
  }, [open, initialValues]);

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const result = keyField && isNew ? { ...values, __key: keyValue } : values;
      await onSubmit(result);
      onClose();
    } catch {
      // keep dialog open on error
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-50 w-full max-w-lg rounded-lg border border-border bg-card p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {keyField && isNew && (
            <div className="space-y-1">
              <label className="text-sm font-medium">{keyField.label}</label>
              <input
                type="text"
                value={keyValue}
                onChange={(e) => setKeyValue(e.target.value)}
                placeholder={keyField.placeholder}
                required
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          )}

          {fields.map((field) => (
            <div key={field.name} className="space-y-1">
              <label className="text-sm font-medium">{field.label}</label>
              {field.type === 'textarea' ? (
                <textarea
                  value={values[field.name] ?? ''}
                  onChange={(e) => setValues((v) => ({ ...v, [field.name]: e.target.value }))}
                  placeholder={field.placeholder}
                  required={field.required}
                  rows={4}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              ) : field.type === 'select' ? (
                <select
                  value={values[field.name] ?? ''}
                  onChange={(e) => setValues((v) => ({ ...v, [field.name]: e.target.value }))}
                  required={field.required}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">Select...</option>
                  {field.options?.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              ) : field.type === 'checkbox' ? (
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={values[field.name] === 'true'}
                    onChange={(e) =>
                      setValues((v) => ({ ...v, [field.name]: e.target.checked ? 'true' : '' }))
                    }
                    className="h-4 w-4 rounded border-border"
                  />
                  <span className="text-sm text-muted-foreground">{field.placeholder}</span>
                </div>
              ) : (
                <input
                  type={field.type}
                  value={values[field.name] ?? ''}
                  onChange={(e) => setValues((v) => ({ ...v, [field.name]: e.target.value }))}
                  placeholder={field.placeholder}
                  required={field.required}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              )}
            </div>
          ))}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {submitting ? 'Saving...' : isNew ? 'Add' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
