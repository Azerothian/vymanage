import { test, expect } from '@playwright/test';
import { _electron } from '@playwright/test';
import { launchApp, closeApp } from './fixtures/helpers';
import * as path from 'path';

const ELECTRON_MAIN = path.join(__dirname, '..', 'dist', 'main.js');

test.describe('App Launch', () => {
  test('app launches and shows a window', async () => {
    const { electronApp, page } = await launchApp();
    expect(page).toBeTruthy();
    const windows = electronApp.windows();
    expect(windows.length).toBeGreaterThanOrEqual(1);
    await closeApp(electronApp);
  });

  test('window title is "VyManage"', async () => {
    const { electronApp, page } = await launchApp();
    const title = await page.title();
    // Title may include the page title from the web app; at minimum, the BrowserWindow title is set
    const windowTitle = await electronApp.evaluate(({ BrowserWindow }) => {
      const win = BrowserWindow.getAllWindows()[0];
      return win?.getTitle() ?? '';
    });
    // The window title should contain VyManage (either from BrowserWindow or page)
    const hasTitle = windowTitle.includes('VyManage') || title.includes('VyManage');
    expect(hasTitle).toBe(true);
    await closeApp(electronApp);
  });

  test('window has reasonable dimensions', async () => {
    const { electronApp, page } = await launchApp();
    const { width, height } = await electronApp.evaluate(({ BrowserWindow }) => {
      const win = BrowserWindow.getAllWindows()[0];
      const [w, h] = win.getSize();
      return { width: w, height: h };
    });
    expect(width).toBeGreaterThanOrEqual(900);
    expect(height).toBeGreaterThanOrEqual(600);
    await closeApp(electronApp);
  });

  test('app quits cleanly via electronApp.close()', async () => {
    const { electronApp } = await launchApp();
    // close() should not throw
    await expect(closeApp(electronApp)).resolves.not.toThrow();
  });

  test('single instance lock prevents second instance', async () => {
    const { electronApp: first } = await launchApp();
    // Try launching a second instance - it should exit immediately due to single-instance lock
    // The launch will throw because the process exits before a window appears
    let secondLaunchFailed = false;
    try {
      const secondApp = await _electron.launch({ args: [ELECTRON_MAIN] });
      // If we get here, try to check windows — second app should have quit
      await new Promise((r) => setTimeout(r, 1000));
      try { await secondApp.close(); } catch { /* already exited */ }
    } catch {
      // Expected: Playwright throws because the second Electron process exits
      secondLaunchFailed = true;
    }
    // The first instance should still be running regardless
    const firstWindows = first.windows();
    expect(firstWindows.length).toBeGreaterThanOrEqual(1);
    // Second launch should have failed due to single-instance lock
    expect(secondLaunchFailed).toBe(true);
    await closeApp(first);
  });
});
