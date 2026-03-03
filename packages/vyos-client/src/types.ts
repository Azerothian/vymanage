export interface VyosDeviceConnection {
  mode: 'device';
  host: string;
  key: string;
  insecure: boolean;
}

export interface VyosFileConnection {
  mode: 'file';
  host: string;      // "file://filename.json"
  fileName: string;
}

export type VyosConnectionInfo = VyosDeviceConnection | VyosFileConnection;

export function isDeviceConnection(conn: VyosConnectionInfo): conn is VyosDeviceConnection {
  return conn.mode === 'device';
}

export function isFileConnection(conn: VyosConnectionInfo): conn is VyosFileConnection {
  return conn.mode === 'file';
}

export interface VyosInfo {
  version: string;
  hostname?: string;
  [key: string]: unknown;
}

export interface VyosApiResponse<T = unknown> {
  success: boolean;
  data: T;
  error?: string;
}

export interface ConfigCommand {
  op: 'set' | 'delete';
  path: string[];
  value?: string;
}

export interface ConfigureRequest {
  commands: ConfigCommand[];
  confirm_time?: number;
}

export interface RetrieveRequest {
  op: 'showConfig' | 'returnValues' | 'exists';
  path: string[];
}

export interface ConfigFileRequest {
  op: 'save' | 'load' | 'merge' | 'confirm';
  file?: string;
}

export interface ShowRequest {
  op: string;
  path?: string[];
}

export interface GenerateRequest {
  op: string;
  path: string[];
}

export interface ResetRequest {
  op: string;
  path: string[];
}

export interface ImageRequest {
  op: 'add' | 'delete';
  url?: string;
  name?: string;
}

export interface IVyosClient {
  getInfo(): Promise<VyosInfo>;
  showConfig(path?: string[]): Promise<unknown>;
  returnValues(path: string[]): Promise<string[]>;
  exists(path: string[]): Promise<boolean>;
  set(path: string[], value?: string): Promise<void>;
  delete(path: string[]): Promise<void>;
  configure(commands: ConfigCommand[], confirmTime?: number): Promise<void>;
  save(file?: string): Promise<void>;
  load(file: string): Promise<void>;
  confirm(): Promise<void>;
  show(path: string[]): Promise<unknown>;
  generate(path: string[]): Promise<unknown>;
  reset(path: string[]): Promise<unknown>;
  reboot(): Promise<void>;
  poweroff(): Promise<void>;
  addImage(url: string): Promise<void>;
  deleteImage(name: string): Promise<void>;
}
