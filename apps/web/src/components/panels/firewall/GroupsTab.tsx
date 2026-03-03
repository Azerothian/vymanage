'use client';

import { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { VyosConnectionInfo } from '@vymanage/vyos-client';
import { useConfigActions } from '@/lib/hooks/useConfig';
import { useClient } from '@/lib/context/ClientContext';
import type { FirewallGroup } from './types';

type GroupType = 'address-group' | 'port-group' | 'interface-group' | 'network-group';

const GROUP_TYPES: { value: GroupType; label: string }[] = [
  { value: 'address-group', label: 'Address Groups' },
  { value: 'port-group', label: 'Port Groups' },
  { value: 'interface-group', label: 'Interface Groups' },
  { value: 'network-group', label: 'Network Groups' },
];

function parseGroups(data: unknown, type: GroupType): FirewallGroup[] {
  if (!data || typeof data !== 'object') return [];
  return Object.entries(data as Record<string, unknown>).map(([name, cfg]) => {
    const raw = (cfg ?? {}) as Record<string, unknown>;
    let members: string[] = [];
    if (type === 'address-group' || type === 'network-group') {
      const v = raw['address'] ?? raw['network'];
      members = Array.isArray(v) ? v : v ? [String(v)] : [];
    } else if (type === 'port-group') {
      const v = raw['port'];
      members = Array.isArray(v) ? v : v ? [String(v)] : [];
    } else if (type === 'interface-group') {
      const v = raw['interface'];
      members = Array.isArray(v) ? v : v ? [String(v)] : [];
    }
    return {
      name,
      type,
      members,
      description: raw['description'] as string | undefined,
    };
  });
}

interface GroupRowProps {
  group: FirewallGroup;
  onDelete: (name: string) => void;
  onAddMember: (name: string) => void;
}

function GroupRow({ group, onDelete, onAddMember }: GroupRowProps) {
  const [expanded, setExpanded] = useState(false);
  return (
    <>
      <tr className="border-b border-border hover:bg-muted/40">
        <td className="px-3 py-2 text-sm">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setExpanded((v) => !v)}
              className="text-muted-foreground hover:text-foreground w-4 text-center"
            >
              {group.members.length > 0 ? (expanded ? '▾' : '▸') : ' '}
            </button>
            <span className="font-mono font-medium">{group.name}</span>
          </div>
        </td>
        <td className="px-3 py-2 text-sm text-muted-foreground">{group.description || '—'}</td>
        <td className="px-3 py-2 text-sm text-muted-foreground">{group.members.length}</td>
        <td className="px-2 py-2 text-right">
          <div className="flex justify-end gap-1">
            <button
              onClick={() => onAddMember(group.name)}
              className="rounded px-2 py-1 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              + Member
            </button>
            <button
              onClick={() => onDelete(group.name)}
              className="rounded px-2 py-1 text-xs text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
            >
              Delete
            </button>
          </div>
        </td>
      </tr>
      {expanded && group.members.map((m) => (
        <tr key={m} className="border-b border-border bg-muted/20">
          <td className="px-3 py-1.5 text-sm pl-10" colSpan={2}>
            <span className="font-mono text-xs">{m}</span>
          </td>
          <td className="px-3 py-1.5 text-xs text-muted-foreground" colSpan={2} />
        </tr>
      ))}
    </>
  );
}

export interface GroupsTabProps {
  connection: VyosConnectionInfo;
}

export function GroupsTab({ connection }: GroupsTabProps) {
  const [activeType, setActiveType] = useState<GroupType>('address-group');
  const queryClient = useQueryClient();
  const { setConfig, deleteConfig } = useConfigActions(connection);
  const client = useClient(connection);

  const groupPath = ['firewall', 'group', activeType];

  const { data, isLoading } = useQuery({
    queryKey: ['config', connection.host, ...groupPath],
    queryFn: () => client!.showConfig(groupPath),
    enabled: !!client,
    refetchInterval: false,
  });

  const groups = useMemo(() => parseGroups(data, activeType), [data, activeType]);

  const handleDeleteGroup = async (name: string) => {
    if (!confirm(`Delete group "${name}"?`)) return;
    await deleteConfig([...groupPath, name]);
    await queryClient.invalidateQueries({ queryKey: ['config', connection.host, 'firewall', 'group'] });
  };

  const handleAddGroup = () => {
    const name = prompt('New group name:');
    if (!name) return;
    setConfig([...groupPath, name, 'description'], '').catch(() => undefined).then(() => {
      queryClient.invalidateQueries({ queryKey: ['config', connection.host, 'firewall', 'group'] });
    });
  };

  const handleAddMember = (groupName: string) => {
    const value = prompt(`Add member to "${groupName}" (address/port/interface):`);
    if (!value) return;
    const memberKey =
      activeType === 'address-group' ? 'address' :
      activeType === 'network-group' ? 'network' :
      activeType === 'port-group' ? 'port' : 'interface';
    setConfig([...groupPath, groupName, memberKey], value).then(() => {
      queryClient.invalidateQueries({ queryKey: ['config', connection.host, 'firewall', 'group'] });
    });
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Type tabs */}
      <div className="flex gap-0 border-b border-border">
        {GROUP_TYPES.map((t) => (
          <button
            key={t.value}
            onClick={() => setActiveType(t.value)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeType === t.value
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-2">
        <button
          onClick={handleAddGroup}
          className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          + Add Group
        </button>
      </div>

      {isLoading ? (
        <div className="py-8 text-center text-sm text-muted-foreground">Loading groups...</div>
      ) : (
        <div className="rounded-md border border-border overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-3 py-2 text-left text-xs font-medium uppercase text-muted-foreground">Name</th>
                <th className="px-3 py-2 text-left text-xs font-medium uppercase text-muted-foreground">Description</th>
                <th className="px-3 py-2 text-left text-xs font-medium uppercase text-muted-foreground">Members</th>
                <th className="w-32 px-2 py-2" />
              </tr>
            </thead>
            <tbody>
              {groups.map((group) => (
                <GroupRow
                  key={group.name}
                  group={group}
                  onDelete={handleDeleteGroup}
                  onAddMember={handleAddMember}
                />
              ))}
              {groups.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-sm text-muted-foreground">
                    No {GROUP_TYPES.find((t) => t.value === activeType)?.label.toLowerCase()} configured
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
