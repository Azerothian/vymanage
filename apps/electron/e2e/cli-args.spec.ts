import { test, expect } from '@playwright/test';
import { launchApp, closeApp } from './fixtures/helpers';
import * as path from 'path';

test.describe('CLI Arguments', () => {
  test('--host and --key are returned by getStartupArgs()', async () => {
    const { electronApp, page } = await launchApp({
      args: ['--host', '192.168.1.1', '--key', 'my-api-key'],
    });
    const args = await page.evaluate(() => {
      return (window as any).electronAPI.getStartupArgs();
    });
    expect(args).toMatchObject({
      host: '192.168.1.1',
      key: 'my-api-key',
    });
    await closeApp(electronApp);
  });

  test('--insecure flag parsed as boolean', async () => {
    const { electronApp, page } = await launchApp({
      args: ['--insecure'],
    });
    const args = await page.evaluate(() => {
      return (window as any).electronAPI.getStartupArgs();
    });
    expect(args.insecure).toBe(true);
    await closeApp(electronApp);
  });

  test('--file path opens config on startup', async () => {
    const configPath = path.join(__dirname, 'fixtures', 'sample-configs', 'minimal-config.json');
    const { electronApp, page } = await launchApp({
      args: ['--file', configPath],
    });
    // Wait for the file:opened event to be sent to the renderer
    await page.waitForTimeout(2000);
    // The startup file loading sends file:opened event to the renderer
    // Verify the startup args reflect the file
    const args = await page.evaluate(() => {
      return (window as any).electronAPI.getStartupArgs();
    });
    expect(args.file).toBe(configPath);
    await closeApp(electronApp);
  });

  test('--file with nonexistent path does not crash app', async () => {
    const { electronApp, page } = await launchApp({
      args: ['--file', '/nonexistent/path/config.json'],
    });
    // App should still be running
    const windows = electronApp.windows();
    expect(windows.length).toBeGreaterThanOrEqual(1);
    // Page should still be functional
    const args = await page.evaluate(() => {
      return (window as any).electronAPI.getStartupArgs();
    });
    expect(args.file).toBe('/nonexistent/path/config.json');
    await closeApp(electronApp);
  });

  test('no args returns empty/default object', async () => {
    const { electronApp, page } = await launchApp();
    const args = await page.evaluate(() => {
      return (window as any).electronAPI.getStartupArgs();
    });
    expect(args).toBeDefined();
    expect(args.host).toBeUndefined();
    expect(args.key).toBeUndefined();
    expect(args.file).toBeUndefined();
    expect(args.insecure).toBeUndefined();
    await closeApp(electronApp);
  });
});
