'use client';

import { useWorkspace } from './WorkspaceProvider';

interface InlineWorkspaceProps {
  renderPanel: (menuId: string) => React.ReactNode;
}

export function InlineWorkspace({ renderPanel }: InlineWorkspaceProps) {
  const { inlineActiveId } = useWorkspace();

  if (!inlineActiveId) {
    return (
      <div className="flex flex-1 items-center justify-center text-muted-foreground">
        Select a menu item to get started
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto scrollbar-thin">
      {renderPanel(inlineActiveId)}
    </div>
  );
}
