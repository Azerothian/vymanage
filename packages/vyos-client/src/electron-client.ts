import type {
  VyosDeviceConnection,
  IVyosClient,
  VyosInfo,
  VyosApiResponse,
  ConfigCommand,
  ConfigFileRequest,
} from './types';

interface ElectronApiRequest {
  (opts: {
    url: string;
    method: string;
    headers: Record<string, string>;
    body?: string;
    insecure?: boolean;
  }): Promise<{ status: number; data: unknown }>;
}

/**
 * VyOS client that proxies API calls through Electron's main process,
 * bypassing CORS restrictions and handling self-signed certificates.
 */
export class ElectronVyosClient implements IVyosClient {
  private baseUrl: string;
  private key: string;
  private insecure: boolean;
  private apiRequest: ElectronApiRequest;

  constructor(connection: VyosDeviceConnection, apiRequest: ElectronApiRequest) {
    // Electron always uses HTTPS — the IPC handler manages cert validation
    // via rejectUnauthorized when insecure=true, so we never downgrade to HTTP
    this.baseUrl = `https://${connection.host}`;
    this.key = connection.key;
    this.insecure = connection.insecure;
    this.apiRequest = apiRequest;
  }

  private async post<T>(endpoint: string, data: object): Promise<T> {
    const formData = new URLSearchParams();
    formData.append('data', JSON.stringify({ ...data, key: this.key }));

    const response = await this.apiRequest({
      url: `${this.baseUrl}/${endpoint}`,
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData.toString(),
      insecure: this.insecure,
    });

    if (response.status < 200 || response.status >= 300) {
      throw new Error(`HTTP ${response.status}`);
    }

    const result = response.data as VyosApiResponse<T>;
    if (!result.success) {
      throw new Error(result.error || 'API request failed');
    }

    return result.data;
  }

  async getInfo(): Promise<VyosInfo> {
    const response = await this.apiRequest({
      url: `${this.baseUrl}/info`,
      method: 'GET',
      headers: {},
      insecure: this.insecure,
    });

    if (response.status < 200 || response.status >= 300) {
      throw new Error(`HTTP ${response.status}`);
    }

    return response.data as VyosInfo;
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
