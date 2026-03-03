'use client';

import { useState } from 'react';
import {
  Network,
  Shield,
  ArrowLeftRight,
  Route,
  FileText,
  Lock,
  Server,
  Gauge,
  HeartPulse,
  Scale,
  Box,
  KeyRound,
  Layers,
  Settings,
  Terminal,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
} from 'lucide-react';
import { cn } from '@vymanage/ui';
import { menuItems } from '../../lib/config/menu';
import type { MenuItem } from '../../lib/config/menu';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Network,
  Shield,
  ArrowLeftRight,
  Route,
  FileText,
  Lock,
  Server,
  Gauge,
  HeartPulse,
  Scale,
  Box,
  KeyRound,
  Layers,
  Settings,
  Terminal,
};

interface SidebarProps {
  activeItemId: string | null;
  onSelectItem: (item: MenuItem, tabId?: string) => void;
}

export function Sidebar({ activeItemId, onSelectItem }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [expandedItem, setExpandedItem] = useState<string | null>(null);

  function handleItemClick(item: MenuItem) {
    if (item.tabs && item.tabs.length > 0) {
      if (collapsed) {
        setCollapsed(false);
      }
      setExpandedItem(expandedItem === item.id ? null : item.id);
      onSelectItem(item, item.tabs[0].id);
    } else {
      onSelectItem(item);
    }
  }

  return (
    <aside
      className={cn(
        'flex h-full flex-col border-r border-border bg-card transition-all duration-200',
        collapsed ? 'w-14' : 'w-56'
      )}
    >
      {/* Collapse toggle */}
      <div className="flex items-center justify-end border-b border-border p-2">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="rounded-md p-1 hover:bg-accent"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      {/* Menu items */}
      <nav className="flex-1 overflow-y-auto py-2">
        {menuItems.map((item) => {
          const Icon = iconMap[item.icon] ?? Network;
          const isActive = activeItemId === item.id;
          const isExpanded = expandedItem === item.id;

          return (
            <div key={item.id}>
              <button
                onClick={() => handleItemClick(item)}
                className={cn(
                  'flex w-full items-center gap-2 px-3 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground',
                  isActive && 'bg-accent text-accent-foreground font-medium',
                  collapsed && 'justify-center px-2'
                )}
                title={collapsed ? item.label : undefined}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {!collapsed && (
                  <>
                    <span className="flex-1 text-left">{item.label}</span>
                    {item.tabs && item.tabs.length > 0 && (
                      <ChevronDown
                        className={cn(
                          'h-3 w-3 shrink-0 transition-transform',
                          isExpanded && 'rotate-180'
                        )}
                      />
                    )}
                  </>
                )}
              </button>

              {/* Sub-tabs */}
              {!collapsed && isExpanded && item.tabs && (
                <div className="border-l border-border ml-4 pl-2 py-1">
                  {item.tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => onSelectItem(item, tab.id)}
                      className="flex w-full items-center px-2 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-accent rounded-sm transition-colors"
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
