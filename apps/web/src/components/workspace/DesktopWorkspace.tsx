'use client';

import { useRef, useCallback, useEffect, useState } from 'react';
import { useWorkspace } from './WorkspaceProvider';
import { Window } from './Window';

interface DesktopWorkspaceProps {
  renderPanel: (menuId: string) => React.ReactNode;
}

export function DesktopWorkspace({ renderPanel }: DesktopWorkspaceProps) {
  const { windows } = useWorkspace();
  const canvasRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);

  // Compute canvas bounds based on window positions
  const canvasBounds = windows.reduce(
    (bounds, win) => ({
      width: Math.max(bounds.width, win.x + win.width + 100),
      height: Math.max(bounds.height, win.y + win.height + 100),
    }),
    { width: 1200, height: 800 },
  );

  // Ctrl+scroll for workspace zoom
  const handleWheel = useCallback(
    (e: WheelEvent) => {
      if (e.ctrlKey) {
        e.preventDefault();
        setZoom((z) => Math.min(2, Math.max(0.25, z - e.deltaY * 0.001)));
      }
    },
    [],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.addEventListener('wheel', handleWheel, { passive: false });
    return () => canvas.removeEventListener('wheel', handleWheel);
  }, [handleWheel]);

  return (
    <div
      ref={canvasRef}
      className="relative flex-1 overflow-auto scrollbar-always bg-muted/20"
    >
      <div
        style={{
          width: canvasBounds.width * zoom,
          height: canvasBounds.height * zoom,
          transform: `scale(${zoom})`,
          transformOrigin: 'top left',
          minWidth: '100%',
          minHeight: '100%',
        }}
        className="relative"
      >
        {windows.map((win) => (
          <Window key={win.id} window={win}>
            {renderPanel(win.menuId)}
          </Window>
        ))}
      </div>
    </div>
  );
}
