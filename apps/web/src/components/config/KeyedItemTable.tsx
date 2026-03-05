'use client';

import { useState } from 'react';
import { ConfigFormDialog, type FormFieldDef } from './ConfigFormDialog';

export interface KeyedColumn {
  id: string;
  header: string;
  accessor: (key: string, value: Record<string, unknown>) => React.ReactNode;
  width?: string;
}

export interface KeyedItemTableProps {
  data: Record<string, unknown> | null | undefined;
  columns: KeyedColumn[];
  keyHeader?: string;
  emptyMessage?: string;
  onAdd?: (key: string, values: Record<string, string>) => void | Promise<void>;
  onEdit?: (key: string, values: Record<string, string>) => void | Promise<void>;
  onDelete?: (key: string) => void | Promise<void>;
  addLabel?: string;
  formFields?: FormFieldDef[];
  formTitle?: string;
  getEditValues?: (key: string, value: Record<string, unknown>) => Record<string, string>;
}

export function KeyedItemTable({
  data,
  columns,
  keyHeader = 'Name',
  emptyMessage = 'No items configured',
  onAdd,
  onEdit,
  onDelete,
  addLabel = 'Add',
  formFields = [],
  formTitle = 'Item',
  getEditValues,
}: KeyedItemTableProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editKey, setEditKey] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Record<string, string>>({});

  const entries = data && typeof data === 'object' ? Object.entries(data) : [];

  function handleAdd() {
    setEditKey(null);
    setEditValues({});
    setDialogOpen(true);
  }

  function handleEdit(key: string, value: Record<string, unknown>) {
    setEditKey(key);
    setEditValues(getEditValues ? getEditValues(key, value) : extractStringValues(value));
    setDialogOpen(true);
  }

  async function handleSubmit(values: Record<string, string>) {
    const key = values.__key || editKey;
    if (!key) return;
    const { __key: _, ...fields } = values;
    if (editKey && onEdit) {
      await onEdit(editKey, fields);
    } else if (onAdd) {
      await onAdd(key, fields);
    }
  }

  async function handleDelete(key: string) {
    if (!onDelete) return;
    await onDelete(key);
  }

  return (
    <>
      <div className="rounded-md border border-border">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-3 py-2 text-left text-xs font-medium uppercase text-muted-foreground">
                  {keyHeader}
                </th>
                {columns.map((col) => (
                  <th
                    key={col.id}
                    className="px-3 py-2 text-left text-xs font-medium uppercase text-muted-foreground"
                    style={col.width ? { width: col.width } : undefined}
                  >
                    {col.header}
                  </th>
                ))}
                {(onEdit || onDelete) && <th className="w-20 px-2 py-2" />}
              </tr>
            </thead>
            <tbody>
              {entries.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length + 1 + (onEdit || onDelete ? 1 : 0)}
                    className="px-4 py-8 text-center text-sm text-muted-foreground"
                  >
                    {emptyMessage}
                  </td>
                </tr>
              ) : (
                entries.map(([key, value]) => {
                  const val = (value && typeof value === 'object' ? value : {}) as Record<string, unknown>;
                  return (
                    <tr key={key} className="border-b border-border hover:bg-muted/50">
                      <td className="px-3 py-2 text-sm font-medium">{key}</td>
                      {columns.map((col) => (
                        <td
                          key={col.id}
                          className="px-3 py-2 text-sm"
                          style={col.width ? { width: col.width } : undefined}
                        >
                          {col.accessor(key, val)}
                        </td>
                      ))}
                      {(onEdit || onDelete) && (
                        <td className="px-2 py-2 text-right">
                          <div className="flex justify-end gap-1">
                            {onEdit && (
                              <button
                                onClick={() => handleEdit(key, val)}
                                className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                                title="Edit"
                              >
                                ✎
                              </button>
                            )}
                            {onDelete && (
                              <button
                                onClick={() => handleDelete(key)}
                                className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                                title="Delete"
                              >
                                🗑
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        {onAdd && (
          <div className="border-t border-border p-2">
            <button
              onClick={handleAdd}
              className="rounded-md px-3 py-1.5 text-sm font-medium text-primary hover:bg-primary/10"
            >
              + {addLabel}
            </button>
          </div>
        )}
      </div>

      {formFields.length > 0 && (
        <ConfigFormDialog
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          title={editKey ? `Edit ${formTitle}` : `Add ${formTitle}`}
          fields={formFields}
          initialValues={editValues}
          onSubmit={handleSubmit}
          isNew={!editKey}
          keyField={!editKey ? { name: 'key', label: keyHeader, placeholder: `Enter ${keyHeader.toLowerCase()}` } : undefined}
        />
      )}
    </>
  );
}

function extractStringValues(obj: Record<string, unknown>): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') {
      result[k] = String(v);
    }
  }
  return result;
}
