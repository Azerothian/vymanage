import { test, expect } from '@playwright/test';
import { launchApp, closeApp } from './fixtures/helpers';
import { MockVyosApiServer } from './fixtures/mock-api-server';

test.describe('IPC API Proxy', () => {
  let mockServer: MockVyosApiServer;

  test.beforeEach(async () => {
    mockServer = new MockVyosApiServer();
    await mockServer.start();
  });

  test.afterEach(async () => {
    await mockServer.stop();
  });

  test('api:request forwards POST to mock server and returns { status, data }', async () => {
    const { electronApp, page } = await launchApp();
    const result = await page.evaluate(
      async (baseUrl) => {
        return (window as any).electronAPI.apiRequest({
          url: `${baseUrl}/retrieve`,
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            data: JSON.stringify({ op: 'showConfig', path: [], key: 'test-key' }),
          }).toString(),
        });
      },
      mockServer.baseUrl,
    );
    expect(result).toBeTruthy();
    expect(result.status).toBe(200);
    expect(result.data).toBeTruthy();
    expect(result.data.success).toBe(true);
    expect(result.data.data).toBeDefined();
    await closeApp(electronApp);
  });

  test('request body and headers forwarded correctly', async () => {
    const { electronApp, page } = await launchApp();
    await page.evaluate(
      async (baseUrl) => {
        return (window as any).electronAPI.apiRequest({
          url: `${baseUrl}/configure`,
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'X-Custom-Header': 'test-value',
          },
          body: new URLSearchParams({
            data: JSON.stringify({ commands: [{ op: 'set', path: ['system', 'host-name'], value: 'test' }] }),
          }).toString(),
        });
      },
      mockServer.baseUrl,
    );
    // Verify the mock server received the request
    expect(mockServer.lastRequest.method).toBe('POST');
    expect(mockServer.lastRequest.url).toBe('/configure');
    expect(mockServer.lastRequest.headers?.['content-type']).toBe('application/x-www-form-urlencoded');
    expect(mockServer.lastRequest.headers?.['x-custom-header']).toBe('test-value');
    expect(mockServer.lastRequest.body).toContain('host-name');
    await closeApp(electronApp);
  });

  test('network error (unreachable host) returns error', async () => {
    const { electronApp, page } = await launchApp();
    const result = await page.evaluate(async () => {
      try {
        await (window as any).electronAPI.apiRequest({
          url: 'http://192.0.2.1:1/retrieve',
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: 'data={}',
        });
        return { error: null };
      } catch (e: any) {
        return { error: e.message };
      }
    });
    expect(result.error).toBeTruthy();
    await closeApp(electronApp);
  });

  test('insecure: true accepts self-signed certs', async () => {
    const httpsServer = new MockVyosApiServer({ https: true });
    let httpsPort: number;
    try {
      httpsPort = await httpsServer.start();
    } catch {
      // Skip if HTTPS server can't be created (no openssl)
      test.skip();
      return;
    }
    const { electronApp, page } = await launchApp();
    try {
      const result = await page.evaluate(
        async ({ baseUrl }) => {
          return (window as any).electronAPI.apiRequest({
            url: `${baseUrl}/info`,
            method: 'GET',
            headers: {},
            insecure: true,
          });
        },
        { baseUrl: `https://127.0.0.1:${httpsPort}` },
      );
      expect(result).toBeTruthy();
      expect(result.status).toBe(200);
      expect(result.data).toBeTruthy();
    } finally {
      await httpsServer.stop();
      await closeApp(electronApp);
    }
  });
});
