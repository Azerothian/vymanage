'use client';

export interface CommitConfirmBannerProps {
  remainingSeconds: number;
  onConfirm: () => void;
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function CommitConfirmBanner({ remainingSeconds, onConfirm }: CommitConfirmBannerProps) {
  return (
    <div className="flex items-center gap-3 rounded-md bg-amber-500/15 px-4 py-2 text-amber-700 dark:text-amber-400">
      <span className="text-sm font-medium">
        ⚠ Commit-confirm active: {formatTime(remainingSeconds)} remaining
      </span>
      <button
        onClick={onConfirm}
        className="rounded-md bg-amber-600 px-3 py-1 text-xs font-medium text-white hover:bg-amber-700"
      >
        Confirm
      </button>
    </div>
  );
}
