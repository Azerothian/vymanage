import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import { VyosClient } from '../client';
import { handlers, mockVyosInfo, mockConfig, mockShowOutput } from '../__mocks__/handlers';
import type { VyosConnectionInfo } from '../types';

const server = setupServer(...handlers);

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const connection: VyosConnectionInfo = {
  mode: 'device',
  host: '192.168.1.1',
  key: 'test-api-key',
  insecure: false,
};

const insecureConnection: VyosConnectionInfo = {
  mode: 'device',
  host: '10.0.0.1',
  key: 'test-key',
  insecure: true,
};

describe('VyosClient - URL construction', () => {
  it('uses https when insecure is false', async () => {
    let capturedUrl = '';
    server.use(
      http.get('https://192.168.1.1/info', ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json(mockVyosInfo);
      }),
    );

    const client = new VyosClient(connection);
    await client.getInfo();
    expect(capturedUrl).toMatch(/^https:/);
  });

  it('uses http when insecure is true', async () => {
    let capturedUrl = '';
    server.use(
      http.get('http://10.0.0.1/info', ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json(mockVyosInfo);
      }),
    );

    const client = new VyosClient(insecureConnection);
    await client.getInfo();
    expect(capturedUrl).toMatch(/^http:/);
  });
});

describe('VyosClient - request body format', () => {
  it('includes key in POST body', async () => {
    let capturedData: Record<string, unknown> = {};
    server.use(
      http.post('https://192.168.1.1/retrieve', async ({ request }) => {
        const body = await request.text();
        const params = new URLSearchParams(body);
        capturedData = JSON.parse(params.get('data') ?? '{}') as Record<string, unknown>;
        return HttpResponse.json({ success: true, data: mockConfig, error: null });
      }),
    );

    const client = new VyosClient(connection);
    await client.showConfig([]);
    expect(capturedData.key).toBe('test-api-key');
  });

  it('sends path as array', async () => {
    let capturedData: Record<string, unknown> = {};
    server.use(
      http.post('https://192.168.1.1/retrieve', async ({ request }) => {
        const body = await request.text();
        const params = new URLSearchParams(body);
        capturedData = JSON.parse(params.get('data') ?? '{}') as Record<string, unknown>;
        return HttpResponse.json({ success: true, data: true, error: null });
      }),
    );

    const client = new VyosClient(connection);
    await client.exists(['interfaces', 'ethernet', 'eth0']);
    expect(capturedData.path).toEqual(['interfaces', 'ethernet', 'eth0']);
  });

  it('sends content-type as application/x-www-form-urlencoded', async () => {
    let contentType = '';
    server.use(
      http.post('https://192.168.1.1/retrieve', async ({ request }) => {
        contentType = request.headers.get('content-type') ?? '';
        return HttpResponse.json({ success: true, data: mockConfig, error: null });
      }),
    );

    const client = new VyosClient(connection);
    await client.showConfig([]);
    expect(contentType).toContain('application/x-www-form-urlencoded');
  });
});

describe('VyosClient - error handling', () => {
  it('throws on non-200 HTTP status', async () => {
    server.use(
      http.post('https://192.168.1.1/retrieve', () => {
        return HttpResponse.json({ success: false, data: null, error: 'Unauthorized' }, { status: 401 });
      }),
    );

    const client = new VyosClient(connection);
    await expect(client.showConfig([])).rejects.toThrow('HTTP 401');
  });

  it('throws when success is false', async () => {
    server.use(
      http.post('https://192.168.1.1/retrieve', () => {
        return HttpResponse.json({ success: false, data: null, error: 'Path not found' });
      }),
    );

    const client = new VyosClient(connection);
    await expect(client.showConfig(['nonexistent'])).rejects.toThrow('Path not found');
  });

  it('throws generic message when success is false with no error field', async () => {
    server.use(
      http.post('https://192.168.1.1/retrieve', () => {
        return HttpResponse.json({ success: false, data: null });
      }),
    );

    const client = new VyosClient(connection);
    await expect(client.showConfig([])).rejects.toThrow('API request failed');
  });

  it('throws on getInfo non-200', async () => {
    server.use(
      http.get('https://192.168.1.1/info', () => {
        return HttpResponse.json({}, { status: 500 });
      }),
    );

    const client = new VyosClient(connection);
    await expect(client.getInfo()).rejects.toThrow('HTTP 500');
  });
});

describe('VyosClient - getInfo', () => {
  it('returns device info', async () => {
    const client = new VyosClient(connection);
    const info = await client.getInfo();
    expect(info.version).toBe('VyOS 1.4.0');
    expect(info.hostname).toBe('vyos-router');
  });
});

describe('VyosClient - showConfig', () => {
  it('returns config at root path', async () => {
    const client = new VyosClient(connection);
    const config = await client.showConfig([]);
    expect(config).toEqual(mockConfig);
  });

  it('defaults to empty path when called with no args', async () => {
    let capturedPath: unknown;
    server.use(
      http.post('https://192.168.1.1/retrieve', async ({ request }) => {
        const body = await request.text();
        const params = new URLSearchParams(body);
        const data = JSON.parse(params.get('data') ?? '{}') as Record<string, unknown>;
        capturedPath = data.path;
        return HttpResponse.json({ success: true, data: mockConfig, error: null });
      }),
    );
    const client = new VyosClient(connection);
    await client.showConfig();
    expect(capturedPath).toEqual([]);
  });
});

describe('VyosClient - exists', () => {
  it('returns boolean exists result', async () => {
    const client = new VyosClient(connection);
    const result = await client.exists(['interfaces', 'ethernet', 'eth0']);
    expect(result).toBe(true);
  });
});

describe('VyosClient - returnValues', () => {
  it('returns string array', async () => {
    const client = new VyosClient(connection);
    const result = await client.returnValues(['interfaces', 'ethernet', 'eth0', 'address']);
    expect(Array.isArray(result)).toBe(true);
  });
});

describe('VyosClient - set', () => {
  it('sends set command with path', async () => {
    let capturedData: Record<string, unknown> = {};
    server.use(
      http.post('https://192.168.1.1/configure', async ({ request }) => {
        const body = await request.text();
        const params = new URLSearchParams(body);
        capturedData = JSON.parse(params.get('data') ?? '{}') as Record<string, unknown>;
        return HttpResponse.json({ success: true, data: null, error: null });
      }),
    );

    const client = new VyosClient(connection);
    await client.set(['interfaces', 'ethernet', 'eth0', 'description'], 'LAN');
    const commands = capturedData.commands as Array<Record<string, unknown>>;
    expect(commands[0].op).toBe('set');
    expect(commands[0].path).toEqual(['interfaces', 'ethernet', 'eth0', 'description']);
    expect(commands[0].value).toBe('LAN');
  });
});

describe('VyosClient - delete', () => {
  it('sends delete command', async () => {
    let capturedData: Record<string, unknown> = {};
    server.use(
      http.post('https://192.168.1.1/configure', async ({ request }) => {
        const body = await request.text();
        const params = new URLSearchParams(body);
        capturedData = JSON.parse(params.get('data') ?? '{}') as Record<string, unknown>;
        return HttpResponse.json({ success: true, data: null, error: null });
      }),
    );

    const client = new VyosClient(connection);
    await client.delete(['interfaces', 'ethernet', 'eth2']);
    const commands = capturedData.commands as Array<Record<string, unknown>>;
    expect(commands[0].op).toBe('delete');
    expect(commands[0].path).toEqual(['interfaces', 'ethernet', 'eth2']);
  });
});

describe('VyosClient - configure', () => {
  it('sends batch commands', async () => {
    const client = new VyosClient(connection);
    await client.configure([
      { op: 'set', path: ['system', 'host-name'], value: 'my-router' },
      { op: 'delete', path: ['service', 'telnet'] },
    ]);
  });

  it('includes confirm_time when provided', async () => {
    let capturedData: Record<string, unknown> = {};
    server.use(
      http.post('https://192.168.1.1/configure', async ({ request }) => {
        const body = await request.text();
        const params = new URLSearchParams(body);
        capturedData = JSON.parse(params.get('data') ?? '{}') as Record<string, unknown>;
        return HttpResponse.json({ success: true, data: null, error: null });
      }),
    );

    const client = new VyosClient(connection);
    await client.configure([{ op: 'set', path: ['system', 'host-name'], value: 'test' }], 60);
    expect(capturedData.confirm_time).toBe(60);
  });
});

describe('VyosClient - save', () => {
  it('sends save operation', async () => {
    const client = new VyosClient(connection);
    await client.save();
  });

  it('includes file path when provided', async () => {
    let capturedData: Record<string, unknown> = {};
    server.use(
      http.post('https://192.168.1.1/config-file', async ({ request }) => {
        const body = await request.text();
        const params = new URLSearchParams(body);
        capturedData = JSON.parse(params.get('data') ?? '{}') as Record<string, unknown>;
        return HttpResponse.json({ success: true, data: null, error: null });
      }),
    );

    const client = new VyosClient(connection);
    await client.save('/config/config.boot.bak');
    expect(capturedData.file).toBe('/config/config.boot.bak');
  });
});

describe('VyosClient - confirm', () => {
  it('sends confirm operation', async () => {
    const client = new VyosClient(connection);
    await client.confirm();
  });
});

describe('VyosClient - show', () => {
  it('returns operational data', async () => {
    const client = new VyosClient(connection);
    const result = await client.show(['interfaces']);
    expect(result).toEqual(mockShowOutput);
  });
});

describe('VyosClient - generate', () => {
  it('sends generate command', async () => {
    const client = new VyosClient(connection);
    await client.generate(['pki', 'certificate', 'self-signed']);
  });
});

describe('VyosClient - reset', () => {
  it('sends reset command', async () => {
    const client = new VyosClient(connection);
    await client.reset(['ip', 'bgp']);
  });
});

describe('VyosClient - reboot', () => {
  it('sends reboot command', async () => {
    const client = new VyosClient(connection);
    await client.reboot();
  });
});

describe('VyosClient - poweroff', () => {
  it('sends poweroff command', async () => {
    const client = new VyosClient(connection);
    await client.poweroff();
  });
});

describe('VyosClient - image management', () => {
  it('sends addImage command with url', async () => {
    let capturedData: Record<string, unknown> = {};
    server.use(
      http.post('https://192.168.1.1/image', async ({ request }) => {
        const body = await request.text();
        const params = new URLSearchParams(body);
        capturedData = JSON.parse(params.get('data') ?? '{}') as Record<string, unknown>;
        return HttpResponse.json({ success: true, data: null, error: null });
      }),
    );

    const client = new VyosClient(connection);
    await client.addImage('https://downloads.vyos.io/vyos-1.5.iso');
    expect(capturedData.op).toBe('add');
    expect(capturedData.url).toBe('https://downloads.vyos.io/vyos-1.5.iso');
  });

  it('sends deleteImage command with name', async () => {
    let capturedData: Record<string, unknown> = {};
    server.use(
      http.post('https://192.168.1.1/image', async ({ request }) => {
        const body = await request.text();
        const params = new URLSearchParams(body);
        capturedData = JSON.parse(params.get('data') ?? '{}') as Record<string, unknown>;
        return HttpResponse.json({ success: true, data: null, error: null });
      }),
    );

    const client = new VyosClient(connection);
    await client.deleteImage('VyOS-1.4.0');
    expect(capturedData.op).toBe('delete');
    expect(capturedData.name).toBe('VyOS-1.4.0');
  });
});
