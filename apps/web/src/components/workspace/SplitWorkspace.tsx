'use client';

import { useCallback, useRef, useState, useEffect } from 'react';
import { useWorkspace, type SplitNode } from './WorkspaceProvider';

interface SplitWorkspaceProps {
  renderPanel: (menuId: string) => React.ReactNode;
}

function SplitPanelView({
  node,
  renderPanel,
  onClose,
  onUpdateRatio,
}: {
  node: SplitNode;
  renderPanel: (menuId: string) => React.ReactNode;
  onClose: (menuId: string) => void;
  onUpdateRatio: (path: number[], ratio: number) => void;
}) {
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleDragStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const ratio =
        node.direction === 'horizontal'
          ? (e.clientX - rect.left) / rect.width
          : (e.clientY - rect.top) / rect.height;
      onUpdateRatio([], Math.min(0.9, Math.max(0.1, ratio)));
    };

    const handleMouseUp = () => setIsDragging(false);

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, node.direction, onUpdateRatio]);

  if (node.type === 'leaf' && node.menuId) {
    return (
      <div className="flex h-full flex-col overflow-hidden">
        <div className="flex h-8 shrink-0 items-center justify-between border-b border-border bg-muted/30 px-3">
          <span className="truncate text-sm font-medium">{node.menuId}</span>
          <button
            onClick={() => onClose(node.menuId!)}
            className="rounded p-0.5 text-muted-foreground hover:bg-destructive/20 hover:text-destructive"
          >
            <span className="text-xs">✕</span>
          </button>
        </div>
        <div className="flex-1 overflow-auto scrollbar-thin">{renderPanel(node.menuId)}</div>
      </div>
    );
  }

  if (node.type === 'split' && node.children) {
    const ratio = node.ratio ?? 0.5;
    const isHorizontal = node.direction === 'horizontal';

    return (
      <div
        ref={containerRef}
        className={`flex h-full ${isHorizontal ? 'flex-row' : 'flex-col'}`}
      >
        <div style={{ [isHorizontal ? 'width' : 'height']: `${ratio * 100}%` }} className="overflow-hidden">
          <SplitPanelView
            node={node.children[0]}
            renderPanel={renderPanel}
            onClose={onClose}
            onUpdateRatio={(path, r) => onUpdateRatio([0, ...path], r)}
          />
        </div>
        <div
          className={`shrink-0 ${isHorizontal ? 'w-1 cursor-col-resize' : 'h-1 cursor-row-resize'} bg-border hover:bg-primary/50`}
          onMouseDown={handleDragStart}
        />
        <div style={{ [isHorizontal ? 'width' : 'height']: `${(1 - ratio) * 100}%` }} className="overflow-hidden">
          <SplitPanelView
            node={node.children[1]}
            renderPanel={renderPanel}
            onClose={onClose}
            onUpdateRatio={(path, r) => onUpdateRatio([1, ...path], r)}
          />
        </div>
      </div>
    );
  }

  return null;
}

export function SplitWorkspace({ renderPanel }: SplitWorkspaceProps) {
  const { splitLayout, closeSplitPanel, setSplitLayout } = useWorkspace();

  const handleUpdateRatio = useCallback(
    (path: number[], ratio: number) => {
      if (!splitLayout) return;

      const update = (node: SplitNode, p: number[]): SplitNode => {
        if (p.length === 0) return { ...node, ratio };
        if (node.type === 'split' && node.children) {
          const [idx, ...rest] = p;
          const newChildren: [SplitNode, SplitNode] = [...node.children];
          newChildren[idx] = update(newChildren[idx], rest);
          return { ...node, children: newChildren };
        }
        return node;
      };

      setSplitLayout(update(splitLayout, path));
    },
    [splitLayout, setSplitLayout],
  );

  if (!splitLayout) {
    return (
      <div className="flex flex-1 items-center justify-center text-muted-foreground">
        Select a menu item to get started
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-hidden">
      <SplitPanelView
        node={splitLayout}
        renderPanel={renderPanel}
        onClose={closeSplitPanel}
        onUpdateRatio={handleUpdateRatio}
      />
    </div>
  );
}
