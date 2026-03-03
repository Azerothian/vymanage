// VyOS API Client - @vymanage/vyos-client
// Re-exports all client functionality

export { VyosClient } from './client';
export type * from './types';
export { isDeviceConnection, isFileConnection } from './types';

// File mode client
export { FileVyosClient } from './file-client';
export type { ConfigStore } from './file-client';

// Electron client (CORS-free via main process proxy)
export { ElectronVyosClient } from './electron-client';

// Config tree utilities
export { getAtPath, setAtPath, deleteAtPath } from './config-tree';

// Query hooks (read operations)
export {
  vyosQueryKeys,
  useVyosInfo,
  useConfig,
  useConfigExists,
  useReturnValues,
  useOperationalData,
} from './queries';

// Mutation hooks (write operations)
export {
  useSetConfig,
  useDeleteConfig,
  useConfigure,
  useSaveConfig,
  useConfirmCommit,
} from './mutations';

// Path builder utilities
export {
  buildPath,
  interfacePath,
  firewallPath,
  natPath,
  routingPath,
  servicePath,
  systemPath,
  vpnPath,
  policyPath,
} from './paths';
