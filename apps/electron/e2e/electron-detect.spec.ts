import { test, expect } from '@playwright/test';
import { launchApp, closeApp } from './fixtures/helpers';

test.describe('Electron Detection', () => {
  test('window.electronAPI is exposed in renderer', async () => {
    const { electronApp, page } = await launchApp();
    const hasApi = await page.evaluate(() => {
      return typeof (window as any).electronAPI !== 'undefined';
    });
    expect(hasApi).toBe(true);
    await closeApp(electronApp);
  });

  test('all electronAPI methods exist', async () => {
    const { electronApp, page } = await launchApp();
    const methods = await page.evaluate(() => {
      const api = (window as any).electronAPI;
      return {
        openFile: typeof api.openFile,
        saveFile: typeof api.saveFile,
        saveFileAs: typeof api.saveFileAs,
        apiRequest: typeof api.apiRequest,
        getStartupArgs: typeof api.getStartupArgs,
      };
    });
    expect(methods.openFile).toBe('function');
    expect(methods.saveFile).toBe('function');
    expect(methods.saveFileAs).toBe('function');
    expect(methods.apiRequest).toBe('function');
    expect(methods.getStartupArgs).toBe('function');
    await closeApp(electronApp);
  });

  test('menu event listeners are callable', async () => {
    const { electronApp, page } = await launchApp();
    const listenerTypes = await page.evaluate(() => {
      const api = (window as any).electronAPI;
      return {
        onMenuOpenFile: typeof api.onMenuOpenFile,
        onMenuSave: typeof api.onMenuSave,
        onMenuSaveAs: typeof api.onMenuSaveAs,
        onMenuConnectDevice: typeof api.onMenuConnectDevice,
        onOpenFile: typeof api.onOpenFile,
      };
    });
    expect(listenerTypes.onMenuOpenFile).toBe('function');
    expect(listenerTypes.onMenuSave).toBe('function');
    expect(listenerTypes.onMenuSaveAs).toBe('function');
    expect(listenerTypes.onMenuConnectDevice).toBe('function');
    expect(listenerTypes.onOpenFile).toBe('function');
    // Verify they return cleanup functions
    const cleanups = await page.evaluate(() => {
      const api = (window as any).electronAPI;
      const c1 = api.onMenuOpenFile(() => {});
      const c2 = api.onMenuSave(() => {});
      const c3 = api.onMenuSaveAs(() => {});
      const c4 = api.onMenuConnectDevice(() => {});
      const c5 = api.onOpenFile(() => {});
      return [typeof c1, typeof c2, typeof c3, typeof c4, typeof c5];
    });
    for (const c of cleanups) {
      expect(c).toBe('function');
    }
    await closeApp(electronApp);
  });

  test('contextIsolation is active', async () => {
    const { electronApp, page } = await launchApp();
    const hasRequire = await page.evaluate(() => {
      return typeof require !== 'undefined';
    });
    expect(hasRequire).toBe(false);
    // Also verify nodeIntegration is off
    const hasProcess = await page.evaluate(() => {
      return typeof process !== 'undefined';
    });
    expect(hasProcess).toBe(false);
    await closeApp(electronApp);
  });
});
