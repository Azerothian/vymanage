'use client';

import { useState, useRef, useCallback } from 'react';
import { FileText, FilePlus2 } from 'lucide-react';
import type { VyosConnectionInfo } from '@vymanage/vyos-client';
import { isElectron, getElectronAPI } from '@/lib/utils/electron';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  Button,
  Input,
  Label,
  Checkbox,
} from '@vymanage/ui';

interface ConnectionDialogProps {
  onConnect: (info: VyosConnectionInfo) => Promise<void>;
  onFileOpen: (config: Record<string, unknown>, fileName: string) => void;
  onNewConfig?: () => void;
  error: string | null;
  isLoading: boolean;
}

export function ConnectionDialog({ onConnect, onFileOpen, onNewConfig, error, isLoading }: ConnectionDialogProps) {
  const [host, setHost] = useState('');
  const [key, setKey] = useState('');
  const [insecure, setInsecure] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await onConnect({ mode: 'device', host, key, insecure });
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileError(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result;
        if (typeof text !== 'string') {
          setFileError('Failed to read file.');
          return;
        }
        const parsed: unknown = JSON.parse(text);
        if (
          typeof parsed !== 'object' ||
          parsed === null ||
          Array.isArray(parsed) ||
          Object.keys(parsed).length === 0
        ) {
          setFileError('File must be a non-empty JSON object.');
          return;
        }
        onFileOpen(parsed as Record<string, unknown>, file.name);
      } catch {
        setFileError('Invalid JSON file.');
      }
    };
    reader.readAsText(file);
    // Reset so the same file can be re-selected
    e.target.value = '';
  }

  const handleElectronOpen = useCallback(async () => {
    const api = getElectronAPI();
    if (!api) return;
    try {
      const result = await api.openFile();
      if (!result) return;
      const { data, fileName } = result;
      if (
        typeof data !== 'object' ||
        data === null ||
        Array.isArray(data) ||
        Object.keys(data).length === 0
      ) {
        setFileError('File must be a non-empty JSON object.');
        return;
      }
      onFileOpen(data as Record<string, unknown>, fileName);
    } catch {
      setFileError('Failed to open file.');
    }
  }, [onFileOpen]);

  function handleDropZoneClick() {
    if (isElectron()) {
      handleElectronOpen();
      return;
    }
    fileInputRef.current?.click();
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    setFileError(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result;
        if (typeof text !== 'string') {
          setFileError('Failed to read file.');
          return;
        }
        const parsed: unknown = JSON.parse(text);
        if (
          typeof parsed !== 'object' ||
          parsed === null ||
          Array.isArray(parsed) ||
          Object.keys(parsed).length === 0
        ) {
          setFileError('File must be a non-empty JSON object.');
          return;
        }
        onFileOpen(parsed as Record<string, unknown>, file.name);
      } catch {
        setFileError('Invalid JSON file.');
      }
    };
    reader.readAsText(file);
  }

  function handleDragOver(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
  }

  return (
    <Dialog open>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Connect to VyOS</DialogTitle>
          <DialogDescription>
            Enter your VyOS device connection details.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="host">Host URL</Label>
            <Input
              id="host"
              type="text"
              placeholder="192.168.1.1 or router.example.com"
              value={host}
              onChange={(e) => setHost(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="key">API Key</Label>
            <Input
              id="key"
              type="password"
              placeholder="Your VyOS API key"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="insecure"
              checked={insecure}
              onCheckedChange={(checked) => setInsecure(checked === true)}
              disabled={isLoading}
            />
            <Label htmlFor="insecure" className="cursor-pointer">
              Allow insecure HTTP connection
            </Label>
          </div>

          {insecure && (
            <div className="rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-200">
              Warning: API key will be sent unencrypted
            </div>
          )}

          {error && (
            <div className="rounded-md border border-destructive bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Connecting...' : 'Connect'}
          </Button>
        </form>

        {/* Divider */}
        <div className="relative my-2">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">or</span>
          </div>
        </div>

        {/* Create new config */}
        {onNewConfig && (
          <button
            type="button"
            onClick={onNewConfig}
            className="flex w-full items-center justify-center gap-2 rounded-md border border-border bg-background px-4 py-3 text-sm font-medium transition-colors hover:bg-muted"
          >
            <FilePlus2 className="h-4 w-4" />
            Create New Config
          </button>
        )}

        {/* File open section */}
        <div className="space-y-2">
          <div
            role="button"
            tabIndex={0}
            onClick={handleDropZoneClick}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleDropZoneClick(); }}
            className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed border-border bg-muted/30 px-4 py-6 text-center transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <FileText className="h-6 w-6 text-muted-foreground" />
            <span className="text-sm font-medium">Open Config File</span>
            <span className="text-xs text-muted-foreground">
              Drop a .json file here or click to browse
            </span>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            className="hidden"
            onChange={handleFileChange}
          />
          {fileError && (
            <div className="rounded-md border border-destructive bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {fileError}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
