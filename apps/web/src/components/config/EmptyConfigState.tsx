'use client';

import { Settings2 } from 'lucide-react';

interface EmptyConfigStateProps {
  configPath: string[];
  onAdd?: () => void;
  addLabel?: string;
}

export function EmptyConfigState({ configPath, onAdd, addLabel = 'Configure' }: EmptyConfigStateProps) {
  const pathStr = configPath.join(' > ');

  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <Settings2 className="mb-3 h-10 w-10 text-muted-foreground/50" />
      <h3 className="text-sm font-medium text-foreground">Not Configured</h3>
      <p className="mt-1 text-xs text-muted-foreground">
        No configuration exists at <span className="font-mono">{pathStr}</span>
      </p>
      {onAdd && (
        <button
          onClick={onAdd}
          className="mt-4 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          + {addLabel}
        </button>
      )}
    </div>
  );
}
