export class StatefulMockApi {
  private config: Record<string, unknown>;
  private commandLog: Array<{ op: string; path: string[]; value?: string; timestamp: number }>;

  constructor(initialConfig: Record<string, unknown>) {
    this.config = structuredClone(initialConfig);
    this.commandLog = [];
  }

  showConfig(path: string[]): unknown {
    let current: unknown = this.config;
    for (const key of path) {
      if (current === null || current === undefined || typeof current !== 'object') return undefined;
      current = (current as Record<string, unknown>)[key];
    }
    return current;
  }

  processCommands(commands: Array<{ op: string; path: string[]; value?: string }>): void {
    for (const cmd of commands) {
      this.commandLog.push({ ...cmd, timestamp: Date.now() });
      if (cmd.op === 'set') {
        this.setAtPath(cmd.path, cmd.value ?? {});
      } else if (cmd.op === 'delete') {
        this.deleteAtPath(cmd.path);
      }
    }
  }

  getConfig(): Record<string, unknown> {
    return structuredClone(this.config);
  }

  getCommandLog() {
    return [...this.commandLog];
  }

  private setAtPath(path: string[], value: unknown): void {
    if (path.length === 0) return;
    let current: Record<string, unknown> = this.config;
    for (let i = 0; i < path.length - 1; i++) {
      const key = path[i];
      if (current[key] === null || current[key] === undefined || typeof current[key] !== 'object') {
        current[key] = {};
      }
      current = current[key] as Record<string, unknown>;
    }
    current[path[path.length - 1]] = value;
  }

  private deleteAtPath(path: string[]): void {
    if (path.length === 0) return;
    let current: Record<string, unknown> = this.config;
    for (let i = 0; i < path.length - 1; i++) {
      const key = path[i];
      if (current[key] === null || current[key] === undefined || typeof current[key] !== 'object') return;
      current = current[key] as Record<string, unknown>;
    }
    delete current[path[path.length - 1]];
  }
}
