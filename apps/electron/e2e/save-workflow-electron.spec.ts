import { test, expect } from '@playwright/test';
import { launchApp, closeApp, mockSaveDialog } from './fixtures/helpers';
import { MockVyosApiServer } from './fixtures/mock-api-server';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';

test.describe('Save Workflow in Electron', () => {
  test('save in file mode calls electronAPI.saveFile', async () => {
    const { electronApp, page } = await launchApp();
    const tmpFile = path.join(os.tmpdir(), `vymanage-save-test-${Date.now()}.json`);
    const testJson = JSON.stringify({ system: { 'host-name': 'test-save' } });
    try {
      const result = await page.evaluate(
        ({ json, filePath }) => {
          return (window as any).electronAPI.saveFile(json, filePath);
        },
        { json: testJson, filePath: tmpFile },
      );
      expect(result).toBeTruthy();
      expect(result.filePath).toBe(tmpFile);
      expect(fs.existsSync(tmpFile)).toBe(true);
    } finally {
      if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile);
    }
    await closeApp(electronApp);
  });

  test('save-as in file mode calls electronAPI.saveFileAs', async () => {
    const tmpFile = path.join(os.tmpdir(), `vymanage-saveas-test-${Date.now()}.json`);
    const { electronApp, page } = await launchApp();
    await mockSaveDialog(electronApp, {
      canceled: false,
      filePath: tmpFile,
    });
    const testJson = JSON.stringify({ system: { 'host-name': 'test-saveas' } });
    try {
      const result = await page.evaluate(
        (json) => {
          return (window as any).electronAPI.saveFileAs(json);
        },
        testJson,
      );
      expect(result).toBeTruthy();
      expect(result.filePath).toBe(tmpFile);
      expect(fs.existsSync(tmpFile)).toBe(true);
      const content = JSON.parse(fs.readFileSync(tmpFile, 'utf-8'));
      expect(content.system['host-name']).toBe('test-saveas');
    } finally {
      if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile);
    }
    await closeApp(electronApp);
  });

  test('Ctrl+S triggers save workflow via menu click', async () => {
    const { electronApp, page } = await launchApp();
    await page.evaluate(() => {
      (window as any).__saveFired = false;
      (window as any).electronAPI.onMenuSave(() => {
        (window as any).__saveFired = true;
      });
    });
    // Trigger Save menu item directly (keyboard shortcuts go through Electron's menu accelerator
    // system which isn't reliably testable via page.keyboard in headless/CI)
    await electronApp.evaluate(({ Menu }) => {
      const menu = Menu.getApplicationMenu();
      const fileMenu = menu?.items.find((item) => item.label === 'File');
      const saveItem = fileMenu?.submenu?.items.find((item) => item.label === 'Save');
      saveItem?.click(undefined as any, undefined as any, undefined as any);
    });
    await page.waitForTimeout(500);
    const fired = await page.evaluate(() => (window as any).__saveFired);
    expect(fired).toBe(true);
    await closeApp(electronApp);
  });

  test('Ctrl+Shift+S triggers save-as workflow via menu click', async () => {
    const { electronApp, page } = await launchApp();
    await page.evaluate(() => {
      (window as any).__saveAsFired = false;
      (window as any).electronAPI.onMenuSaveAs(() => {
        (window as any).__saveAsFired = true;
      });
    });
    // Trigger Save As menu item directly
    await electronApp.evaluate(({ Menu }) => {
      const menu = Menu.getApplicationMenu();
      const fileMenu = menu?.items.find((item) => item.label === 'File');
      const saveAsItem = fileMenu?.submenu?.items.find((item) => item.label === 'Save As...');
      saveAsItem?.click(undefined as any, undefined as any, undefined as any);
    });
    await page.waitForTimeout(500);
    const fired = await page.evaluate(() => (window as any).__saveAsFired);
    expect(fired).toBe(true);
    await closeApp(electronApp);
  });

  test('save to connected device uses API proxy', async () => {
    const mockServer = new MockVyosApiServer();
    await mockServer.start();
    const { electronApp, page } = await launchApp();
    // Use the API proxy to save config to a "device"
    const result = await page.evaluate(
      async (baseUrl) => {
        return (window as any).electronAPI.apiRequest({
          url: `${baseUrl}/config-file`,
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            data: JSON.stringify({ op: 'save', key: 'test-key' }),
          }).toString(),
        });
      },
      mockServer.baseUrl,
    );
    expect(result.status).toBe(200);
    expect(result.data.success).toBe(true);
    // Verify the mock server received the request
    expect(mockServer.lastRequest.url).toBe('/config-file');
    expect(mockServer.lastRequest.method).toBe('POST');
    await mockServer.stop();
    await closeApp(electronApp);
  });
});
