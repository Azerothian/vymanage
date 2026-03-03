import type { ConfigCommand } from '@vymanage/vyos-client';

/**
 * Compute minimal delete+set operations for rule renumbering after drag-and-drop.
 * Given old and new orderings of rule numbers, generates the API commands to reorder.
 */
export function computeRenumberCommands(
  basePath: string[],
  oldOrder: number[],
  newOrder: number[],
): ConfigCommand[] {
  const commands: ConfigCommand[] = [];

  // Find rules that changed position
  const moved = new Set<number>();
  for (let i = 0; i < newOrder.length; i++) {
    if (oldOrder[i] !== newOrder[i]) {
      moved.add(oldOrder[i]);
      moved.add(newOrder[i]);
    }
  }

  if (moved.size === 0) return commands;

  // Generate standard rule numbers (10, 20, 30, ...)
  const targetNumbers = newOrder.map((_, i) => (i + 1) * 10);

  // Delete rules that need to move
  for (const ruleNum of oldOrder) {
    commands.push({
      op: 'delete',
      path: [...basePath, 'rule', String(ruleNum)],
    });
  }

  // Re-create rules in new order with new numbers
  for (let i = 0; i < newOrder.length; i++) {
    commands.push({
      op: 'set',
      path: [...basePath, 'rule', String(targetNumbers[i])],
    });
  }

  return commands;
}

/**
 * Reorder an array by moving an item from one index to another.
 */
export function reorderArray<T>(array: T[], fromIndex: number, toIndex: number): T[] {
  const result = [...array];
  const [removed] = result.splice(fromIndex, 1);
  result.splice(toIndex, 0, removed);
  return result;
}
