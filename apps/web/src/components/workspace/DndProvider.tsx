'use client';

import { DndProvider as ReactDndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

// Drag item types - kept separate to avoid conflicts (spec 10)
export const DragItemTypes = {
  RULE: 'RULE',
  WINDOW: 'WINDOW',
  PANEL: 'PANEL',
} as const;

export function DndProvider({ children }: { children: React.ReactNode }) {
  return <ReactDndProvider backend={HTML5Backend}>{children}</ReactDndProvider>;
}
