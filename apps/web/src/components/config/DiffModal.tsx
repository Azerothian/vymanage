'use client';

import { useState } from 'react';
import type { DiffResult } from '@/lib/utils/diff';

export interface DiffModalProps {
  diff: DiffResult;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (commitConfirm: boolean, timeout: number) => void;
  isSaving?: boolean;
}

export function DiffModal({ diff, isOpen, onClose, onConfirm, isSaving = false }: DiffModalProps) {
  const [enableCommitConfirm, setEnableCommitConfirm] = useState(false);
  const [timeout, setTimeout] = useState(5);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="relative z-10 mx-4 flex max-h-[80vh] w-full max-w-3xl flex-col rounded-lg border border-border bg-background shadow-xl">
        {/* Header */}
        <div className="border-b border-border px-6 py-4">
          <h2 className="text-lg font-semibold">Review Configuration Changes</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {diff.additions} addition{diff.additions !== 1 ? 's' : ''},{' '}
            {diff.deletions} deletion{diff.deletions !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Diff content */}
        <div className="flex-1 overflow-auto p-6 scrollbar-thin">
          <pre className="rounded-md bg-muted/50 p-4 font-mono text-sm">
            {diff.lines.map((line, i) => (
              <div
                key={i}
                className={`${
                  line.type === 'added'
                    ? 'bg-green-500/10 text-green-700 dark:text-green-400'
                    : line.type === 'removed'
                      ? 'bg-red-500/10 text-red-700 dark:text-red-400'
                      : 'text-foreground'
                }`}
              >
                <span className="inline-block w-6 select-none text-right text-muted-foreground">
                  {line.type === 'added' ? '+' : line.type === 'removed' ? '-' : ' '}
                </span>
                {' '}{line.content}
              </div>
            ))}
          </pre>
        </div>

        {/* Commit-confirm option */}
        <div className="border-t border-border px-6 py-3">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={enableCommitConfirm}
              onChange={(e) => setEnableCommitConfirm(e.target.checked)}
              className="rounded border-border"
            />
            Enable commit-confirm
          </label>
          {enableCommitConfirm && (
            <div className="mt-2 flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Timeout:</span>
              <input
                type="number"
                min={1}
                max={60}
                value={timeout}
                onChange={(e) => setTimeout(Number(e.target.value))}
                className="w-16 rounded-md border border-input bg-background px-2 py-1 text-sm"
              />
              <span className="text-sm text-muted-foreground">min</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 border-t border-border px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-muted"
            disabled={isSaving}
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(enableCommitConfirm, timeout)}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            disabled={isSaving}
          >
            {isSaving ? 'Saving...' : 'Confirm & Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
