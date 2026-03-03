'use client';

import { useCallback, useRef } from 'react';
import { useDrag, useDrop } from 'react-dnd';

const DRAG_TYPE = 'RULE';

export interface RuleColumn<T> {
  id: string;
  header: string;
  accessor: (row: T) => React.ReactNode;
  width?: string;
}

export interface RuleTableProps<T extends { id: string | number }> {
  rules: T[];
  columns: RuleColumn<T>[];
  onReorder: (fromIndex: number, toIndex: number) => void;
  onAdd?: () => void;
  onDelete?: (rule: T) => void;
  onEdit?: (rule: T) => void;
  addLabel?: string;
}

interface DragItem {
  type: string;
  index: number;
}

function DraggableRow<T extends { id: string | number }>({
  rule,
  index,
  columns,
  onReorder,
  onDelete,
  onEdit,
}: {
  rule: T;
  index: number;
  columns: RuleColumn<T>[];
  onReorder: (from: number, to: number) => void;
  onDelete?: (rule: T) => void;
  onEdit?: (rule: T) => void;
}) {
  const ref = useRef<HTMLTableRowElement>(null);

  const [{ isDragging }, drag, preview] = useDrag({
    type: DRAG_TYPE,
    item: (): DragItem => ({ type: DRAG_TYPE, index }),
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [{ isOver }, drop] = useDrop({
    accept: DRAG_TYPE,
    hover(item: DragItem) {
      if (item.index === index) return;
      onReorder(item.index, index);
      item.index = index;
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  });

  preview(drop(ref));

  return (
    <tr
      ref={ref}
      className={`border-b border-border transition-colors hover:bg-muted/50 ${
        isDragging ? 'opacity-50' : ''
      } ${isOver ? 'bg-accent/30' : ''}`}
    >
      <td className="w-8 px-2 py-2">
        <span
          ref={(node) => { drag(node); }}
          className="cursor-grab text-muted-foreground hover:text-foreground"
        >
          ≡
        </span>
      </td>
      {columns.map((col) => (
        <td key={col.id} className="px-3 py-2 text-sm" style={col.width ? { width: col.width } : undefined}>
          {col.accessor(rule)}
        </td>
      ))}
      <td className="px-2 py-2 text-right">
        <div className="flex justify-end gap-1">
          {onEdit && (
            <button
              onClick={() => onEdit(rule)}
              className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
              title="Edit"
            >
              ✎
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(rule)}
              className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
              title="Delete"
            >
              🗑
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}

export function RuleTable<T extends { id: string | number }>({
  rules,
  columns,
  onReorder,
  onAdd,
  onDelete,
  onEdit,
  addLabel = 'Add Rule',
}: RuleTableProps<T>) {
  const handleReorder = useCallback(
    (fromIndex: number, toIndex: number) => {
      onReorder(fromIndex, toIndex);
    },
    [onReorder],
  );

  return (
    <div className="rounded-md border border-border">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="w-8 px-2 py-2" />
              {columns.map((col) => (
                <th
                  key={col.id}
                  className="px-3 py-2 text-left text-xs font-medium uppercase text-muted-foreground"
                  style={col.width ? { width: col.width } : undefined}
                >
                  {col.header}
                </th>
              ))}
              <th className="w-20 px-2 py-2" />
            </tr>
          </thead>
          <tbody>
            {rules.map((rule, index) => (
              <DraggableRow
                key={rule.id}
                rule={rule}
                index={index}
                columns={columns}
                onReorder={handleReorder}
                onDelete={onDelete}
                onEdit={onEdit}
              />
            ))}
            {rules.length === 0 && (
              <tr>
                <td colSpan={columns.length + 2} className="px-4 py-8 text-center text-sm text-muted-foreground">
                  No rules configured
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {onAdd && (
        <div className="border-t border-border p-2">
          <button
            onClick={onAdd}
            className="rounded-md px-3 py-1.5 text-sm font-medium text-primary hover:bg-primary/10"
          >
            + {addLabel}
          </button>
        </div>
      )}
    </div>
  );
}
