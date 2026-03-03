'use client';

import { useCallback } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { VyosInfo, VyosConnectionInfo } from '@vymanage/vyos-client';
import { isDeviceConnection } from '@vymanage/vyos-client';
import { WorkspaceProvider, useWorkspace } from '../workspace/WorkspaceProvider';
import { DndProvider } from '../workspace/DndProvider';
import { DesktopWorkspace } from '../workspace/DesktopWorkspace';
import { SplitWorkspace } from '../workspace/SplitWorkspace';
import { InlineWorkspace } from '../workspace/InlineWorkspace';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { Taskbar } from './Taskbar';
import { renderPanel } from '../panels/PanelRegistry';
import { menuItems } from '../../lib/config/menu';
import type { MenuItem } from '../../lib/config/menu';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
});

interface AppShellProps {
  deviceInfo: VyosInfo | null;
  connection: VyosConnectionInfo;
  onSave: () => void;
  onDisconnect: () => void;
}

function WorkspaceContent({ connection }: { connection: VyosConnectionInfo }) {
  const workspace = useWorkspace();

  const handleSelectItem = useCallback(
    (item: MenuItem, _tabId?: string) => {
      const menuItem = menuItems.find((m) => m.id === item.id) ?? item;
      // tabId is available for panels that support initial tab selection;
      // panels manage their own active tab via localStorage persistence
      switch (workspace.mode) {
        case 'desktop':
          workspace.openWindow(menuItem.id, menuItem.label, menuItem.icon);
          break;
        case 'split':
          if (!workspace.splitLayout) {
            workspace.setSplitLayout({ type: 'leaf', menuId: menuItem.id });
          } else {
            // Find first leaf to split with
            const findLeaf = (node: typeof workspace.splitLayout): string | null => {
              if (!node) return null;
              if (node.type === 'leaf') return node.menuId ?? null;
              if (node.children) return findLeaf(node.children[0]) || findLeaf(node.children[1]);
              return null;
            };
            const target = findLeaf(workspace.splitLayout);
            if (target && target !== menuItem.id) {
              workspace.splitPanel(target, menuItem.id, 'horizontal');
            } else {
              workspace.setSplitLayout({ type: 'leaf', menuId: menuItem.id });
            }
          }
          break;
        case 'inline':
          workspace.setInlineActive(menuItem.id);
          break;
      }
    },
    [workspace],
  );

  const panelRenderer = useCallback(
    (menuId: string) => renderPanel(menuId, connection),
    [connection],
  );

  // Determine active sidebar item based on workspace state
  let activeItemId: string | null = null;
  if (workspace.mode === 'inline') {
    activeItemId = workspace.inlineActiveId;
  } else if (workspace.mode === 'desktop') {
    // Highest z-index non-minimized window
    const topWindow = workspace.windows
      .filter((w) => !w.minimized)
      .sort((a, b) => b.zIndex - a.zIndex)[0];
    activeItemId = topWindow?.menuId ?? null;
  }

  return (
    <div className="flex flex-1 overflow-hidden">
      <Sidebar activeItemId={activeItemId} onSelectItem={handleSelectItem} />
      <div className="flex flex-1 flex-col overflow-hidden">
        {workspace.mode === 'desktop' && <DesktopWorkspace renderPanel={panelRenderer} />}
        {workspace.mode === 'split' && <SplitWorkspace renderPanel={panelRenderer} />}
        {workspace.mode === 'inline' && <InlineWorkspace renderPanel={panelRenderer} />}
      </div>
    </div>
  );
}

function WorkspaceTaskbar() {
  const { mode, windows, focusWindow, restoreWindow } = useWorkspace();
  if (mode !== 'desktop' || windows.length === 0) return null;

  return (
    <Taskbar
      entries={windows.map((w) => ({
        id: w.id,
        title: w.title,
        isActive: !w.minimized,
      }))}
      onEntryClick={(id) => {
        const win = windows.find((w) => w.id === id);
        if (win?.minimized) {
          restoreWindow(id);
        } else {
          focusWindow(id);
        }
      }}
    />
  );
}

function HeaderWithWorkspace({
  deviceInfo,
  connection,
  onSave,
  onDisconnect,
}: {
  deviceInfo: VyosInfo | null;
  connection: VyosConnectionInfo;
  onSave: () => void;
  onDisconnect: () => void;
}) {
  const { mode, setMode } = useWorkspace();
  const isInsecure = isDeviceConnection(connection) ? connection.insecure : false;

  return (
    <Header
      deviceInfo={deviceInfo}
      isInsecure={isInsecure}
      connection={connection}
      viewMode={mode}
      onViewModeChange={setMode}
      onSave={onSave}
      onDisconnect={onDisconnect}
    />
  );
}

export function AppShell({ deviceInfo, connection, onSave, onDisconnect }: AppShellProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <DndProvider>
        <WorkspaceProvider>
          <div className="flex h-screen flex-col overflow-hidden bg-background">
            <HeaderWithWorkspace
              deviceInfo={deviceInfo}
              connection={connection}
              onSave={onSave}
              onDisconnect={onDisconnect}
            />
            <WorkspaceContent connection={connection} />
            <WorkspaceTaskbar />
          </div>
        </WorkspaceProvider>
      </DndProvider>
    </QueryClientProvider>
  );
}
