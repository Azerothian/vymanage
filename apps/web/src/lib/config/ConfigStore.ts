import { getAtPath, setAtPath, deleteAtPath } from '@vymanage/vyos-client';
import type { ConfigStore as IConfigStore } from '@vymanage/vyos-client';

export class ConfigStore implements IConfigStore {
  private data: Record<string, unknown>;
  private original: Record<string, unknown>;

  constructor(initialData: Record<string, unknown>) {
    this.original = structuredClone(initialData);
    this.data = structuredClone(initialData);
  }

  getAtPath(path: string[]): unknown {
    return getAtPath(this.data, path);
  }

  setAtPath(path: string[], value: unknown): void {
    setAtPath(this.data, path, value);
  }

  deleteAtPath(path: string[]): void {
    deleteAtPath(this.data, path);
  }

  getFullConfig(): Record<string, unknown> {
    return structuredClone(this.data);
  }

  getOriginalConfig(): Record<string, unknown> {
    return structuredClone(this.original);
  }

  exportAsJson(): string {
    return JSON.stringify(this.data, null, 2);
  }

  hasChanges(): boolean {
    return JSON.stringify(this.data) !== JSON.stringify(this.original);
  }
}
