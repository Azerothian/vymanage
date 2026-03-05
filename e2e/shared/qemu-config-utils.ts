import { flattenConfigToCommands, generateCleanupCommands, type ConfigCommand } from './config-to-commands';

// Allow self-signed certs
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const QEMU_HOST = process.env.VYOS_QEMU_HOST ?? '127.0.0.1';
const QEMU_PORT = process.env.VYOS_QEMU_PORT ?? '9443';
const QEMU_API_KEY = process.env.VYOS_QEMU_API_KEY ?? 'e2e-test-api-key';
const VYOS_BASE = `https://${QEMU_HOST}:${QEMU_PORT}`;

const BATCH_SIZE = 20;
const INTER_BATCH_DELAY_MS = 300;

/** Protected paths that should never be deleted during cleanup */
const PROTECTED_PATHS: string[][] = [
  ['system', 'host-name'],
  ['service', 'https'],
  ['service', 'ssh'],
  ['interfaces', 'ethernet', 'eth0', 'address'],
  ['interfaces', 'loopback'],
];

function commandToVyosOp(cmd: ConfigCommand): { op: string; path: string[] } {
  return {
    op: cmd.op,
    path: cmd.value ? [...cmd.path, cmd.value] : [...cmd.path],
  };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Send a batch of config commands with retry logic.
 */
async function sendConfigBatch(
  commands: ConfigCommand[],
  maxRetries = 3,
  baseDelay = 2000,
  timeoutMs = 30_000,
): Promise<void> {
  const ops = commands.map(commandToVyosOp);
  const body = new URLSearchParams();
  body.set('key', QEMU_API_KEY);
  body.set('data', JSON.stringify(ops));

  let lastError: Error | undefined;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), timeoutMs);
      const response = await fetch(`${VYOS_BASE}/configure`, {
        method: 'POST',
        body,
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`VyOS configure failed (${response.status}): ${text}`);
      }

      const result = await response.json() as { success?: boolean; error?: string };
      if (!result.success) {
        throw new Error(`VyOS configure error: ${result.error ?? JSON.stringify(result)}`);
      }
      return; // success
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      const isTransient = lastError.message.includes('ECONNREFUSED') ||
        lastError.message.includes('ECONNRESET') ||
        lastError.message.includes('ETIMEDOUT') ||
        lastError.message.includes('ConnectTimeoutError') ||
        lastError.message.includes('UND_ERR_CONNECT_TIMEOUT') ||
        lastError.message.includes('fetch failed') ||
        lastError.message.includes('aborted');
      if (!isTransient || attempt === maxRetries) {
        throw lastError;
      }
      const delay = baseDelay * Math.pow(2, attempt);
      await sleep(delay);
    }
  }
  throw lastError!;
}

/**
 * Wait for the VyOS API to respond to a basic retrieve call.
 */
async function waitForApiHealthy(maxWaitMs = 30_000): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < maxWaitMs) {
    try {
      const body = new URLSearchParams();
      body.set('key', QEMU_API_KEY);
      body.set('data', JSON.stringify({ op: 'showConfig', path: ['system', 'host-name'] }));
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5_000);
      const response = await fetch(`${VYOS_BASE}/retrieve`, {
        method: 'POST',
        body,
        signal: controller.signal,
      });
      clearTimeout(timeout);
      if (response.ok) return;
    } catch {
      // API not ready yet
    }
    await sleep(1000);
  }
}

/**
 * Apply a VyOS config to the live QEMU device.
 * Flattens the config JSON to set commands and sends in batches.
 */
export async function applyConfigToDevice(config: Record<string, unknown>): Promise<void> {
  // Health check before starting — 60s max to survive post-cleanup recovery
  await waitForApiHealthy(60_000);

  const commands = flattenConfigToCommands(config);

  for (let i = 0; i < commands.length; i += BATCH_SIZE) {
    const batch = commands.slice(i, i + BATCH_SIZE);
    await sendConfigBatch(batch, 3, 2000, 30_000);
    if (i + BATCH_SIZE < commands.length) {
      await sleep(INTER_BATCH_DELAY_MS);
    }
  }

  // Brief pause to let VyOS settle — no full health check needed since we just got responses
  await sleep(1000);
}

/**
 * Remove a VyOS config from the live QEMU device.
 * Sends delete commands one at a time in reverse order (dependencies first)
 * to avoid overwhelming the VyOS API with heavy bulk deletes.
 * Errors are ignored since paths may not exist.
 */
export async function cleanupConfigFromDevice(config: Record<string, unknown>): Promise<void> {
  const commands = generateCleanupCommands(config, PROTECTED_PATHS);

  if (commands.length === 0) return;

  // Reverse order: delete firewall/nat before vrf before interfaces.
  // This ensures dependencies are removed before the things they reference.
  const reversed = [...commands].reverse();

  // Send deletes one at a time with delays to avoid overwhelming VyOS.
  // Bulk deletes (e.g., "delete vrf" removing 4 routing tables at once)
  // can crash the VyOS HTTPS API when combined with other heavy deletes.
  for (const cmd of reversed) {
    try {
      await sendConfigBatch([cmd], 1, 2000, 30_000);
    } catch {
      // Ignore — path may not exist
    }
    await sleep(1000);
  }

  // Wait for API to recover after cleanup — heavy configs (VRF, bridges) can
  // cause the API to restart or become temporarily unresponsive.
  await sleep(3000);
  await waitForApiHealthy(60_000);
}
