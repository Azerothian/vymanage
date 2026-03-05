export interface ConfigCommand {
  op: 'set' | 'delete';
  path: string[];
  value?: string;
}

/**
 * Flatten a nested VyOS JSON config into set commands.
 * - String/number leaf values → set with value
 * - Arrays of strings → multiple set commands with same path, different values
 * - Empty objects {} → valueless set command
 * - Nested objects → recurse deeper
 * - Boolean true → valueless set (VyOS uses presence)
 * - Boolean false → skip (absence means disabled)
 */
export function flattenConfigToCommands(
  config: Record<string, unknown>,
  basePath: string[] = [],
): ConfigCommand[] {
  const commands: ConfigCommand[] = [];

  for (const [key, value] of Object.entries(config)) {
    const currentPath = [...basePath, key];

    if (value === null || value === undefined || value === false) {
      continue;
    }

    if (value === true) {
      commands.push({ op: 'set', path: currentPath });
      continue;
    }

    if (typeof value === 'string' || typeof value === 'number') {
      commands.push({ op: 'set', path: currentPath, value: String(value) });
      continue;
    }

    if (Array.isArray(value)) {
      for (const item of value) {
        if (typeof item === 'string' || typeof item === 'number') {
          commands.push({ op: 'set', path: currentPath, value: String(item) });
        }
      }
      continue;
    }

    if (typeof value === 'object') {
      const obj = value as Record<string, unknown>;
      if (Object.keys(obj).length === 0) {
        commands.push({ op: 'set', path: currentPath });
      } else {
        commands.push(...flattenConfigToCommands(obj, currentPath));
      }
      continue;
    }
  }

  return commands;
}

/**
 * Generate delete commands for cleanup. Deletes at the top-level keys
 * of the config, skipping any protected paths.
 */
export function generateCleanupCommands(
  config: Record<string, unknown>,
  protectedPaths: string[][] = [],
): ConfigCommand[] {
  const commands: ConfigCommand[] = [];

  // Returns true if path is equal to or a descendant of a protected path.
  function isProtected(path: string[]): boolean {
    return protectedPaths.some(
      (pp) =>
        pp.length <= path.length &&
        pp.every((segment, i) => segment === path[i]),
    );
  }

  // Returns true if any protected path is a descendant of (or equal to) this path,
  // meaning we must recurse into this node rather than deleting it wholesale.
  function hasProtectedDescendant(path: string[]): boolean {
    return protectedPaths.some(
      (pp) =>
        pp.length > path.length &&
        path.every((segment, i) => segment === pp[i]),
    );
  }

  function generateDeletes(
    obj: Record<string, unknown>,
    basePath: string[],
    depth: number,
  ): void {
    for (const key of Object.keys(obj)) {
      const currentPath = [...basePath, key];

      if (isProtected(currentPath)) {
        // This node itself is protected — recurse to find non-protected siblings deeper.
        const val = obj[key];
        if (
          val &&
          typeof val === 'object' &&
          !Array.isArray(val) &&
          Object.keys(val as Record<string, unknown>).length > 0
        ) {
          generateDeletes(val as Record<string, unknown>, currentPath, depth + 1);
        }
        // Otherwise skip entirely — this path is protected
        continue;
      }

      if (hasProtectedDescendant(currentPath)) {
        // A child of this node is protected — recurse instead of bulk-deleting.
        const val = obj[key];
        if (
          val &&
          typeof val === 'object' &&
          !Array.isArray(val) &&
          Object.keys(val as Record<string, unknown>).length > 0
        ) {
          generateDeletes(val as Record<string, unknown>, currentPath, depth + 1);
        }
        continue;
      }

      commands.push({ op: 'delete', path: currentPath });
    }
  }

  generateDeletes(config, [], 0);
  return commands;
}

/**
 * Pick specific top-level sections from a config object.
 */
export function pickConfigSections(
  config: Record<string, unknown>,
  sections: string[],
): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const section of sections) {
    if (section in config) {
      result[section] = config[section];
    }
  }
  return result;
}
