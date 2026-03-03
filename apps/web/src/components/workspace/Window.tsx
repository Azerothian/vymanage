'use client';

import { useRef, useCallback, useState, useEffect } from 'react';
import { useWorkspace, type WindowState } from './WorkspaceProvider';

interface WindowProps {
  window: WindowState;
  children: React.ReactNode;
}

export function Window({ window: win, children }: WindowProps) {
  const { focusWindow, closeWindow, minimizeWindow, maximizeWindow, moveWindow, resizeWindow } =
    useWorkspace();
  const windowRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, winX: 0, winY: 0 });
  const resizeStart = useRef({ x: 0, y: 0, width: 0, height: 0 });

  // Drag handling
  const handleDragStart = useCallback(
    (e: React.MouseEvent) => {
      if (win.maximized) return;
      e.preventDefault();
      focusWindow(win.id);
      setIsDragging(true);
      dragStart.current = { x: e.clientX, y: e.clientY, winX: win.x, winY: win.y };
    },
    [win.id, win.x, win.y, win.maximized, focusWindow],
  );

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const dx = e.clientX - dragStart.current.x;
      const dy = e.clientY - dragStart.current.y;
      moveWindow(win.id, dragStart.current.winX + dx, dragStart.current.winY + dy);
    };

    const handleMouseUp = () => setIsDragging(false);

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, win.id, moveWindow]);

  // Resize handling
  const handleResizeStart = useCallback(
    (e: React.MouseEvent) => {
      if (win.maximized) return;
      e.preventDefault();
      e.stopPropagation();
      focusWindow(win.id);
      setIsResizing(true);
      resizeStart.current = { x: e.clientX, y: e.clientY, width: win.width, height: win.height };
    },
    [win.id, win.width, win.height, win.maximized, focusWindow],
  );

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const dx = e.clientX - resizeStart.current.x;
      const dy = e.clientY - resizeStart.current.y;
      resizeWindow(win.id, resizeStart.current.width + dx, resizeStart.current.height + dy);
    };

    const handleMouseUp = () => setIsResizing(false);

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, win.id, resizeWindow]);

  if (win.minimized) return null;

  const style: React.CSSProperties = win.maximized
    ? { position: 'absolute', inset: 0, zIndex: win.zIndex }
    : {
        position: 'absolute',
        left: win.x,
        top: win.y,
        width: win.width,
        height: win.height,
        zIndex: win.zIndex,
      };

  return (
    <div
      ref={windowRef}
      style={style}
      className="flex flex-col overflow-hidden rounded-lg border border-border bg-background shadow-lg"
      onMouseDown={() => focusWindow(win.id)}
    >
      {/* Title bar */}
      <div
        className="flex h-9 shrink-0 cursor-grab items-center justify-between border-b border-border bg-muted/50 px-3 active:cursor-grabbing"
        onMouseDown={handleDragStart}
      >
        <div className="flex items-center gap-2 text-sm font-medium">
          <span>{win.icon}</span>
          <span className="truncate">{win.title}</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              minimizeWindow(win.id);
            }}
            className="rounded p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
            title="Minimize"
          >
            <span className="text-xs">_</span>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              maximizeWindow(win.id);
            }}
            className="rounded p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
            title={win.maximized ? 'Restore' : 'Maximize'}
          >
            <span className="text-xs">{win.maximized ? '❐' : '▢'}</span>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              closeWindow(win.id);
            }}
            className="rounded p-0.5 text-muted-foreground hover:bg-destructive/20 hover:text-destructive"
            title="Close"
          >
            <span className="text-xs">✕</span>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto scrollbar-thin">{children}</div>

      {/* Resize handle (bottom-right corner) */}
      {!win.maximized && (
        <div
          className="absolute bottom-0 right-0 h-3 w-3 cursor-se-resize"
          onMouseDown={handleResizeStart}
        />
      )}
    </div>
  );
}
