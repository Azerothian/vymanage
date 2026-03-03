/**
 * Get a value at a nested path in an object.
 * Returns undefined if path doesn't exist.
 */
export function getAtPath(obj: Record<string, unknown>, path: string[]): unknown {
  let current: unknown = obj;
  for (const key of path) {
    if (current === null || current === undefined || typeof current !== 'object') {
      return undefined;
    }
    current = (current as Record<string, unknown>)[key];
  }
  return current;
}

/**
 * Set a value at a nested path in an object.
 * Creates intermediate objects as needed.
 */
export function setAtPath(obj: Record<string, unknown>, path: string[], value: unknown): void {
  if (path.length === 0) return;
  let current: Record<string, unknown> = obj;
  for (let i = 0; i < path.length - 1; i++) {
    const key = path[i];
    if (current[key] === null || current[key] === undefined || typeof current[key] !== 'object') {
      current[key] = {};
    }
    current = current[key] as Record<string, unknown>;
  }
  current[path[path.length - 1]] = value;
}

/**
 * Delete a value at a nested path in an object.
 * Cleans up empty parent objects.
 */
export function deleteAtPath(obj: Record<string, unknown>, path: string[]): void {
  if (path.length === 0) return;
  if (path.length === 1) {
    delete obj[path[0]];
    return;
  }
  const parents: Array<{ obj: Record<string, unknown>; key: string }> = [];
  let current: Record<string, unknown> = obj;
  for (let i = 0; i < path.length - 1; i++) {
    const key = path[i];
    if (current[key] === null || current[key] === undefined || typeof current[key] !== 'object') {
      return; // Path doesn't exist
    }
    parents.push({ obj: current, key });
    current = current[key] as Record<string, unknown>;
  }
  delete current[path[path.length - 1]];
  // Clean up empty parent objects
  for (let i = parents.length - 1; i >= 0; i--) {
    const { obj: parentObj, key } = parents[i];
    const child = parentObj[key] as Record<string, unknown>;
    if (Object.keys(child).length === 0) {
      delete parentObj[key];
    } else {
      break;
    }
  }
}
