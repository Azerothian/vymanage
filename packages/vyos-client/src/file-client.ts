import type { IVyosClient, VyosInfo, ConfigCommand } from './types';

export interface ConfigStore {
  getAtPath(path: string[]): unknown;
  setAtPath(path: string[], value: unknown): void;
  deleteAtPath(path: string[]): void;
  getFullConfig(): Record<string, unknown>;
  exportAsJson(): string;
}

export class FileVyosClient implements IVyosClient {
  private store: ConfigStore;
  private fileName: string;

  constructor(store: ConfigStore, fileName: string) {
    this.store = store;
    this.fileName = fileName;
  }

  async getInfo(): Promise<VyosInfo> {
    return { version: 'File Mode', hostname: this.fileName };
  }

  async showConfig(path: string[] = []): Promise<unknown> {
    if (path.length === 0) return this.store.getFullConfig();
    return this.store.getAtPath(path);
  }

  async returnValues(path: string[]): Promise<string[]> {
    const val = this.store.getAtPath(path);
    if (Array.isArray(val)) return val.map(String);
    if (val !== undefined && val !== null) return [String(val)];
    return [];
  }

  async exists(path: string[]): Promise<boolean> {
    return this.store.getAtPath(path) !== undefined;
  }

  async set(path: string[], value?: string): Promise<void> {
    this.store.setAtPath(path, value ?? {});
  }

  async delete(path: string[]): Promise<void> {
    this.store.deleteAtPath(path);
  }

  async configure(commands: ConfigCommand[]): Promise<void> {
    for (const cmd of commands) {
      if (cmd.op === 'set') {
        this.store.setAtPath(cmd.path, cmd.value ?? {});
      } else if (cmd.op === 'delete') {
        this.store.deleteAtPath(cmd.path);
      }
    }
  }

  async save(): Promise<void> {
    // Download handled by the UI layer via ConfigStore.exportAsJson()
  }

  async load(): Promise<void> { /* noop in file mode */ }
  async confirm(): Promise<void> { /* noop */ }
  async show(): Promise<unknown> { return null; }
  async generate(): Promise<unknown> { return null; }
  async reset(): Promise<unknown> { return null; }
  async reboot(): Promise<void> { /* noop */ }
  async poweroff(): Promise<void> { /* noop */ }
  async addImage(): Promise<void> { /* noop */ }
  async deleteImage(): Promise<void> { /* noop */ }
}
