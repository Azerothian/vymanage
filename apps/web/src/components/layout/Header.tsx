'use client';

import { Save, Download, Monitor, Columns2, AlignJustify, ChevronDown, Wifi, WifiOff, FileText } from 'lucide-react';
import { Button } from '@vymanage/ui';
import type { VyosInfo, VyosConnectionInfo } from '@vymanage/vyos-client';
import { isFileConnection } from '@vymanage/vyos-client';
import type { WorkspaceMode } from '../workspace/WorkspaceProvider';
import { InsecureBanner } from './InsecureBanner';

interface HeaderProps {
  deviceInfo: VyosInfo | null;
  isInsecure: boolean;
  connection: VyosConnectionInfo;
  viewMode: WorkspaceMode;
  onViewModeChange: (mode: WorkspaceMode) => void;
  onSave: () => void;
  onDisconnect: () => void;
}

const viewModeOptions: { value: WorkspaceMode; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { value: 'desktop', label: 'Desktop', icon: Monitor },
  { value: 'split', label: 'Split', icon: Columns2 },
  { value: 'inline', label: 'Inline', icon: AlignJustify },
];

export function Header({
  deviceInfo,
  isInsecure,
  connection,
  viewMode,
  onViewModeChange,
  onSave,
  onDisconnect,
}: HeaderProps) {
  const currentModeOption = viewModeOptions.find((o) => o.value === viewMode) ?? viewModeOptions[0];
  const ModeIcon = currentModeOption.icon;
  const fileMode = isFileConnection(connection);

  return (
    <header className="flex flex-col border-b border-border bg-card">
      {isInsecure && <InsecureBanner />}
      <div className="flex items-center gap-3 px-4 py-2">
        {/* Device / file info */}
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex items-center gap-1.5">
            {fileMode ? (
              <FileText className="h-4 w-4 text-blue-500 shrink-0" />
            ) : deviceInfo ? (
              <Wifi className="h-4 w-4 text-green-500 shrink-0" />
            ) : (
              <WifiOff className="h-4 w-4 text-muted-foreground shrink-0" />
            )}
            <span className="text-sm font-semibold truncate">
              {fileMode
                ? connection.fileName
                : (deviceInfo?.hostname ?? 'VyOS Router')}
            </span>
          </div>
          {!fileMode && deviceInfo?.version && (
            <span className="text-xs text-muted-foreground truncate">
              v{deviceInfo.version}
            </span>
          )}
        </div>

        <div className="flex-1" />

        {/* Commit-confirm timer placeholder */}
        <div className="text-xs text-muted-foreground px-2" aria-label="Commit timer">
          {/* Timer will appear here when a commit-confirm is pending */}
        </div>

        {/* Mode toggle */}
        <div className="relative group">
          <Button variant="outline" size="sm" className="gap-1.5">
            <ModeIcon className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{currentModeOption.label}</span>
            <ChevronDown className="h-3 w-3" />
          </Button>
          <div className="absolute right-0 top-full z-50 mt-1 hidden w-36 rounded-md border border-border bg-popover shadow-md group-hover:block">
            {viewModeOptions.map((opt) => {
              const Icon = opt.icon;
              return (
                <button
                  key={opt.value}
                  onClick={() => onViewModeChange(opt.value)}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-accent"
                >
                  <Icon className="h-3.5 w-3.5" />
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Save / Download button */}
        <Button size="sm" onClick={onSave} className="gap-1.5">
          {fileMode ? (
            <Download className="h-3.5 w-3.5" />
          ) : (
            <Save className="h-3.5 w-3.5" />
          )}
          <span className="hidden sm:inline">{fileMode ? 'Download' : 'Save'}</span>
        </Button>

        {/* Disconnect / Close File */}
        <Button variant="ghost" size="sm" onClick={onDisconnect} className="text-muted-foreground">
          {fileMode ? 'Close File' : 'Disconnect'}
        </Button>
      </div>
    </header>
  );
}
