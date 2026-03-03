import { diffLines, type Change } from 'diff';

export interface DiffLine {
  type: 'added' | 'removed' | 'unchanged';
  content: string;
}

export interface DiffResult {
  lines: DiffLine[];
  hasChanges: boolean;
  additions: number;
  deletions: number;
}

export function computeConfigDiff(oldConfig: string, newConfig: string): DiffResult {
  const changes: Change[] = diffLines(oldConfig, newConfig);
  const lines: DiffLine[] = [];
  let additions = 0;
  let deletions = 0;

  for (const change of changes) {
    const content = change.value.replace(/\n$/, '');
    const contentLines = content.split('\n');

    for (const line of contentLines) {
      if (change.added) {
        lines.push({ type: 'added', content: line });
        additions++;
      } else if (change.removed) {
        lines.push({ type: 'removed', content: line });
        deletions++;
      } else {
        lines.push({ type: 'unchanged', content: line });
      }
    }
  }

  return {
    lines,
    hasChanges: additions > 0 || deletions > 0,
    additions,
    deletions,
  };
}

export function configToString(config: unknown, indent = 0): string {
  if (config === null || config === undefined) return '';
  if (typeof config === 'string') return config;
  if (typeof config !== 'object') return String(config);

  const spaces = '    '.repeat(indent);
  const lines: string[] = [];

  for (const [key, value] of Object.entries(config as Record<string, unknown>)) {
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      lines.push(`${spaces}${key} {`);
      lines.push(configToString(value, indent + 1));
      lines.push(`${spaces}}`);
    } else if (Array.isArray(value)) {
      for (const item of value) {
        lines.push(`${spaces}${key} ${item}`);
      }
    } else if (value === null || value === undefined || value === '') {
      lines.push(`${spaces}${key}`);
    } else {
      lines.push(`${spaces}${key} ${value}`);
    }
  }

  return lines.join('\n');
}
