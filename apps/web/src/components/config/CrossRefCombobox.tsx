'use client';

import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { VyosConnectionInfo } from '@vymanage/vyos-client';
import { LOOKUP_REGISTRY, type LookupType } from '@/lib/config/cross-references';
import { useClient } from '@/lib/context/ClientContext';

export interface CrossRefOption {
  value: string;
  label: string;
  description?: string;
  group?: string;
}

export interface CrossRefComboboxProps {
  lookupType: LookupType;
  value: string;
  onChange: (value: string) => void;
  connection: VyosConnectionInfo;
  placeholder?: string;
  disabled?: boolean;
}

function parseConfigKeys(data: unknown, groupBy?: string): CrossRefOption[] {
  if (!data || typeof data !== 'object') return [];

  const options: CrossRefOption[] = [];

  if (groupBy === 'type') {
    // For interfaces, group by interface type
    for (const [type, interfaces] of Object.entries(data as Record<string, unknown>)) {
      if (interfaces && typeof interfaces === 'object') {
        for (const name of Object.keys(interfaces as Record<string, unknown>)) {
          options.push({
            value: name,
            label: name,
            group: type.charAt(0).toUpperCase() + type.slice(1),
            description: type,
          });
        }
      }
    }
  } else {
    for (const key of Object.keys(data as Record<string, unknown>)) {
      options.push({ value: key, label: key });
    }
  }

  return options;
}

export function CrossRefCombobox({
  lookupType,
  value,
  onChange,
  connection,
  placeholder = 'Select...',
  disabled = false,
}: CrossRefComboboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const lookup = LOOKUP_REGISTRY[lookupType];

  const client = useClient(connection);

  const { data } = useQuery({
    queryKey: ['crossref', lookupType, connection.host],
    queryFn: () => client!.showConfig(lookup.configPath),
    enabled: isOpen && !!client,
    staleTime: 30_000,
  });

  const options = useMemo(() => parseConfigKeys(data, lookup.groupBy), [data, lookup.groupBy]);

  const filtered = useMemo(() => {
    if (!search) return options;
    const lower = search.toLowerCase();
    return options.filter(
      (opt) =>
        opt.value.toLowerCase().includes(lower) ||
        opt.label.toLowerCase().includes(lower) ||
        opt.description?.toLowerCase().includes(lower),
    );
  }, [options, search]);

  const grouped = useMemo(() => {
    const groups = new Map<string, CrossRefOption[]>();
    for (const opt of filtered) {
      const group = opt.group || 'Other';
      const arr = groups.get(group) || [];
      arr.push(opt);
      groups.set(group, arr);
    }
    return groups;
  }, [filtered]);

  useEffect(() => {
    if (!isOpen) setSearch('');
  }, [isOpen]);

  const handleSelect = (val: string) => {
    onChange(val);
    setIsOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && search && filtered.length === 0) {
      // Free-text fallback
      onChange(search);
      setIsOpen(false);
    }
    if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div className="relative">
      <div className="flex">
        <input
          type="text"
          value={isOpen ? search : value}
          onChange={(e) => {
            setSearch(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        />
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          disabled={disabled}
          className="ml-1 rounded-md border border-input bg-background px-2 py-2 text-sm hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
        >
          ▾
        </button>
      </div>

      {isOpen && (
        <div className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border border-border bg-popover shadow-lg scrollbar-thin">
          {Array.from(grouped.entries()).map(([group, opts]) => (
            <div key={group}>
              {grouped.size > 1 && (
                <div className="px-3 py-1.5 text-xs font-semibold text-muted-foreground">
                  ── {group} ──
                </div>
              )}
              {opts.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleSelect(opt.value)}
                  className={`flex w-full items-center gap-2 px-3 py-1.5 text-sm hover:bg-accent ${
                    opt.value === value ? 'bg-accent/50 font-medium' : ''
                  }`}
                >
                  <span>{opt.label}</span>
                  {opt.description && (
                    <span className="text-xs text-muted-foreground">{opt.description}</span>
                  )}
                </button>
              ))}
            </div>
          ))}

          {filtered.length === 0 && (
            <div className="px-3 py-3 text-center text-sm text-muted-foreground">
              {search ? (
                <>
                  No matches. Press <kbd className="rounded bg-muted px-1">Enter</kbd> to use &quot;{search}&quot; as free text.
                </>
              ) : (
                'No options available'
              )}
            </div>
          )}

          {filtered.length > 0 && (
            <div className="border-t border-border px-3 py-1.5 text-xs text-muted-foreground">
              ℹ Type a name not listed above to use free-text
            </div>
          )}
        </div>
      )}

      {/* Click-outside handler */}
      {isOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
      )}
    </div>
  );
}
