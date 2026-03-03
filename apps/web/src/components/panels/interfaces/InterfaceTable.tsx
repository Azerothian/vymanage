'use client';

import { useState, useMemo } from 'react';
import type { InterfaceNode, InterfaceTypeFilter } from './types';

const INTERFACE_TYPE_OPTIONS: { value: InterfaceTypeFilter; label: string }[] = [
  { value: 'all', label: 'All Types' },
  { value: 'ethernet', label: 'Ethernet' },
  { value: 'bonding', label: 'Bonding' },
  { value: 'bridge', label: 'Bridge' },
  { value: 'vlan', label: 'VLAN' },
  { value: 'pppoe', label: 'PPPoE' },
  { value: 'wireguard', label: 'WireGuard' },
  { value: 'openvpn', label: 'OpenVPN' },
  { value: 'loopback', label: 'Loopback' },
  { value: 'tunnel', label: 'Tunnel' },
  { value: 'wireless', label: 'Wireless' },
  { value: 'vxlan', label: 'VXLAN' },
  { value: 'dummy', label: 'Dummy' },
];

function StatusBadge({ status }: { status: string }) {
  const color =
    status === 'up'
      ? 'bg-green-500/20 text-green-700 dark:text-green-400'
      : status === 'down'
        ? 'bg-red-500/20 text-red-700 dark:text-red-400'
        : 'bg-muted text-muted-foreground';
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${color}`}>
      {status}
    </span>
  );
}

function TypeBadge({ type }: { type: string }) {
  return (
    <span className="inline-flex items-center rounded px-1.5 py-0.5 text-xs font-mono bg-muted text-muted-foreground">
      {type}
    </span>
  );
}

interface InterfaceRowProps {
  node: InterfaceNode;
  isExpanded: boolean;
  onToggle: (name: string) => void;
  onSelect: (node: InterfaceNode) => void;
  onDelete: (node: InterfaceNode) => void;
  selected: boolean;
}

function InterfaceRow({ node, isExpanded, onToggle, onSelect, onDelete, selected }: InterfaceRowProps) {
  const hasChildren = node.children.length > 0;
  const indent = node.depth * 20;

  return (
    <tr
      className={`border-b border-border transition-colors hover:bg-muted/40 cursor-pointer ${selected ? 'bg-accent/30' : ''}`}
      onClick={() => onSelect(node)}
    >
      <td className="px-3 py-2 text-sm" style={{ paddingLeft: `${indent + 12}px` }}>
        <div className="flex items-center gap-1.5">
          {hasChildren ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggle(node.name);
              }}
              className="text-muted-foreground hover:text-foreground w-4 text-center"
            >
              {isExpanded ? '▾' : '▸'}
            </button>
          ) : (
            <span className="w-4" />
          )}
          <span className="font-mono font-medium">{node.name}</span>
        </div>
      </td>
      <td className="px-3 py-2 text-sm">
        <TypeBadge type={node.type} />
      </td>
      <td className="px-3 py-2 text-sm">
        <StatusBadge status={node.disabled ? 'down' : node.status} />
      </td>
      <td className="px-3 py-2 text-sm font-mono text-xs text-muted-foreground max-w-[180px]">
        {node.addresses.length > 0 ? (
          <div className="flex flex-col gap-0.5">
            {node.addresses.slice(0, 2).map((addr) => (
              <span key={addr}>{addr}</span>
            ))}
            {node.addresses.length > 2 && (
              <span className="text-xs text-muted-foreground">+{node.addresses.length - 2} more</span>
            )}
          </div>
        ) : (
          <span className="text-muted-foreground/50">—</span>
        )}
      </td>
      <td className="px-3 py-2 text-sm text-muted-foreground max-w-[160px] truncate">
        {node.description || <span className="text-muted-foreground/40">—</span>}
      </td>
      <td className="px-3 py-2 text-sm text-muted-foreground">
        {node.vrf || <span className="text-muted-foreground/40">default</span>}
      </td>
      <td className="px-2 py-2 text-right">
        <div className="flex justify-end gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSelect(node);
            }}
            className="rounded p-1 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
            title="Edit"
          >
            ✎
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(node);
            }}
            className="rounded p-1 text-xs text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
            title="Delete"
          >
            ✕
          </button>
        </div>
      </td>
    </tr>
  );
}

function flattenWithExpansion(
  nodes: InterfaceNode[],
  expandedSet: Set<string>,
): InterfaceNode[] {
  const result: InterfaceNode[] = [];
  for (const node of nodes) {
    result.push(node);
    if (node.children.length > 0 && expandedSet.has(node.name)) {
      result.push(...flattenWithExpansion(node.children, expandedSet));
    }
  }
  return result;
}

export interface InterfaceTableProps {
  roots: InterfaceNode[];
  selectedName?: string;
  onSelect: (node: InterfaceNode) => void;
  onAdd: () => void;
  onDelete: (node: InterfaceNode) => void;
}

export function InterfaceTable({ roots, selectedName, onSelect, onAdd, onDelete }: InterfaceTableProps) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [typeFilter, setTypeFilter] = useState<InterfaceTypeFilter>('all');
  const [search, setSearch] = useState('');

  const filteredRoots = useMemo(() => {
    if (typeFilter === 'all' && !search) return roots;
    const lower = search.toLowerCase();

    function matchNode(node: InterfaceNode): boolean {
      const matchesType = typeFilter === 'all' || node.type === typeFilter;
      const matchesSearch =
        !search ||
        node.name.toLowerCase().includes(lower) ||
        (node.description?.toLowerCase().includes(lower) ?? false) ||
        node.addresses.some((a) => a.toLowerCase().includes(lower));
      return (matchesType && matchesSearch) || node.children.some(matchNode);
    }

    function filterNodes(nodes: InterfaceNode[]): InterfaceNode[] {
      return nodes
        .filter(matchNode)
        .map((node) => ({ ...node, children: filterNodes(node.children) }));
    }

    return filterNodes(roots);
  }, [roots, typeFilter, search]);

  const visibleNodes = useMemo(
    () => flattenWithExpansion(filteredRoots, expanded),
    [filteredRoots, expanded],
  );

  const handleToggle = (name: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const expandAll = () => {
    const allNames = new Set<string>();
    function collectNames(nodes: InterfaceNode[]) {
      for (const n of nodes) {
        if (n.children.length > 0) allNames.add(n.name);
        collectNames(n.children);
      }
    }
    collectNames(roots);
    setExpanded(allNames);
  };

  const collapseAll = () => setExpanded(new Set());

  return (
    <div className="flex flex-col gap-2">
      {/* Toolbar */}
      <div className="flex items-center gap-2 flex-wrap">
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as InterfaceTypeFilter)}
          className="rounded-md border border-input bg-background px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          {INTERFACE_TYPE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search interfaces..."
          className="rounded-md border border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring flex-1 min-w-[160px]"
        />
        <button
          onClick={expandAll}
          className="rounded-md border border-border px-2 py-1.5 text-xs text-muted-foreground hover:bg-muted"
        >
          Expand All
        </button>
        <button
          onClick={collapseAll}
          className="rounded-md border border-border px-2 py-1.5 text-xs text-muted-foreground hover:bg-muted"
        >
          Collapse All
        </button>
        <button
          onClick={onAdd}
          className="ml-auto rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          + Add Interface
        </button>
      </div>

      {/* Table */}
      <div className="rounded-md border border-border overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="px-3 py-2 text-left text-xs font-medium uppercase text-muted-foreground">Name</th>
              <th className="px-3 py-2 text-left text-xs font-medium uppercase text-muted-foreground">Type</th>
              <th className="px-3 py-2 text-left text-xs font-medium uppercase text-muted-foreground">Status</th>
              <th className="px-3 py-2 text-left text-xs font-medium uppercase text-muted-foreground">Address</th>
              <th className="px-3 py-2 text-left text-xs font-medium uppercase text-muted-foreground">Description</th>
              <th className="px-3 py-2 text-left text-xs font-medium uppercase text-muted-foreground">VRF</th>
              <th className="w-20 px-2 py-2" />
            </tr>
          </thead>
          <tbody>
            {visibleNodes.map((node) => (
              <InterfaceRow
                key={`${node.parentName ?? ''}:${node.name}`}
                node={node}
                isExpanded={expanded.has(node.name)}
                onToggle={handleToggle}
                onSelect={onSelect}
                onDelete={onDelete}
                selected={selectedName === node.name}
              />
            ))}
            {visibleNodes.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-sm text-muted-foreground">
                  No interfaces found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
