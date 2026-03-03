import type { VyosConnectionInfo } from '@vymanage/vyos-client';
import { isDeviceConnection } from '@vymanage/vyos-client';

const COOKIE_NAME = 'vymanage_connection';

export function setConnectionCookie(info: VyosConnectionInfo): void {
  if (!isDeviceConnection(info)) return;
  const value = JSON.stringify({ host: info.host, key: info.key, insecure: info.insecure });
  const encoded = encodeURIComponent(value);
  const maxAge = 60 * 60 * 24; // 1 day in seconds
  const secureFlag = info.insecure ? '' : '; Secure';
  document.cookie = `${COOKIE_NAME}=${encoded}; Max-Age=${maxAge}; SameSite=Strict; Path=/${secureFlag}`;
}

export function getConnectionCookie(): VyosConnectionInfo | null {
  if (typeof document === 'undefined') return null;
  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [name, ...rest] = cookie.trim().split('=');
    if (name === COOKIE_NAME) {
      try {
        const decoded = decodeURIComponent(rest.join('='));
        const parsed = JSON.parse(decoded) as Record<string, unknown>;
        if (parsed.host && parsed.key !== undefined && parsed.insecure !== undefined) {
          return {
            mode: 'device',
            host: parsed.host as string,
            key: parsed.key as string,
            insecure: parsed.insecure as boolean,
          };
        }
      } catch {
        return null;
      }
    }
  }
  return null;
}

export function clearConnectionCookie(): void {
  document.cookie = `${COOKIE_NAME}=; Max-Age=0; SameSite=Strict; Path=/`;
}
