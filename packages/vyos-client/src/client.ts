import type {
  VyosConnectionInfo,
  VyosDeviceConnection,
  IVyosClient,
  VyosInfo,
  VyosApiResponse,
  ConfigCommand,
  ConfigFileRequest,
} from './types';

export class VyosClient implements IVyosClient {
  private baseUrl: string;
  private key: string;

  constructor(connection: VyosConnectionInfo | { host: string; key: string; insecure: boolean }) {
    const deviceConn = connection as VyosDeviceConnection & { insecure?: boolean };
    const protocol = deviceConn.insecure ? 'http' : 'https';
    this.baseUrl = `${protocol}://${connection.host}`;
    this.key = (connection as VyosDeviceConnection).key ?? '';
  }

  private async post<T>(endpoint: string, data: object): Promise<T> {
    const formData = new URLSearchParams();
    formData.append('data', JSON.stringify({ ...data, key: this.key }));

    const response = await fetch(`${this.baseUrl}/${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData.toString(),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = (await response.json()) as VyosApiResponse<T>;
    if (!result.success) {
      throw new Error(result.error || 'API request failed');
    }

    return result.data;
  }

  async getInfo(): Promise<VyosInfo> {
    const response = await fetch(`${this.baseUrl}/info`, { method: 'GET' });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return response.json() as Promise<VyosInfo>;
  }

  async showConfig(path: string[] = []): Promise<unknown> {
    return this.post('retrieve', { op: 'showConfig', path });
  }

  async returnValues(path: string[]): Promise<string[]> {
    return this.post('retrieve', { op: 'returnValues', path });
  }

  async exists(path: string[]): Promise<boolean> {
    return this.post('retrieve', { op: 'exists', path });
  }

  async set(path: string[], value?: string): Promise<void> {
    const cmd: ConfigCommand = { op: 'set', path };
    if (value !== undefined) cmd.value = value;
    await this.post('configure', { commands: [cmd] });
  }

  async delete(path: string[]): Promise<void> {
    await this.post('configure', { commands: [{ op: 'delete', path }] });
  }

  async configure(commands: ConfigCommand[], confirmTime?: number): Promise<void> {
    const data: Record<string, unknown> = { commands };
    if (confirmTime !== undefined) data.confirm_time = confirmTime;
    await this.post('configure', data);
  }

  async save(file?: string): Promise<void> {
    const data: ConfigFileRequest = { op: 'save' };
    if (file) data.file = file;
    await this.post('config-file', data);
  }

  async load(file: string): Promise<void> {
    await this.post('config-file', { op: 'load', file });
  }

  async confirm(): Promise<void> {
    await this.post('config-file', { op: 'confirm' });
  }

  async show(path: string[]): Promise<unknown> {
    return this.post('show', { op: 'show', path });
  }

  async generate(path: string[]): Promise<unknown> {
    return this.post('generate', { op: 'generate', path });
  }

  async reset(path: string[]): Promise<unknown> {
    return this.post('reset', { op: 'reset', path });
  }

  async reboot(): Promise<void> {
    await this.post('reboot', { op: 'reboot' });
  }

  async poweroff(): Promise<void> {
    await this.post('poweroff', { op: 'poweroff' });
  }

  async addImage(url: string): Promise<void> {
    await this.post('image', { op: 'add', url });
  }

  async deleteImage(name: string): Promise<void> {
    await this.post('image', { op: 'delete', name });
  }
}
