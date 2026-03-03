'use client';

import { cn } from '@vymanage/ui';

export interface TaskbarEntry {
  id: string;
  title: string;
  isActive: boolean;
}

interface TaskbarProps {
  entries: TaskbarEntry[];
  onEntryClick: (id: string) => void;
}

export function Taskbar({ entries, onEntryClick }: TaskbarProps) {
  if (entries.length === 0) return null;

  return (
    <div className="flex h-9 items-center gap-1 border-t border-border bg-card px-2 overflow-x-auto">
      {entries.map((entry) => (
        <button
          key={entry.id}
          onClick={() => onEntryClick(entry.id)}
          className={cn(
            'flex h-7 min-w-24 max-w-40 items-center rounded px-3 text-xs truncate transition-colors',
            entry.isActive
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground'
          )}
          title={entry.title}
        >
          {entry.title}
        </button>
      ))}
    </div>
  );
}
