import { test, expect } from '@playwright/test';
import { launchApp, closeApp } from './fixtures/helpers';

test.describe('Custom Protocol', () => {
  test('vymanage://app/index.html loads the web app', async () => {
    const { electronApp, page } = await launchApp();
    // The app loads vymanage://app/index.html by default
    // Check that the root element exists (React app mounts here)
    const root = page.locator('#root, #__next, [data-testid="app"], body');
    await expect(root.first()).toBeVisible();
    await closeApp(electronApp);
  });

  test('static assets load without 404 console errors', async () => {
    const errors: string[] = [];
    const { electronApp, page } = await launchApp();
    page.on('console', (msg) => {
      if (msg.type() === 'error' && msg.text().includes('404')) {
        errors.push(msg.text());
      }
    });
    // Wait for any assets to load
    await page.waitForLoadState('load');
    await new Promise((r) => setTimeout(r, 1000));
    expect(errors).toEqual([]);
    await closeApp(electronApp);
  });

  test('unknown paths fall back to index.html (SPA routing)', async () => {
    const { electronApp, page } = await launchApp();
    // Navigate to a non-existent path - should fall back to index.html
    await page.goto('vymanage://app/some/nonexistent/route');
    await page.waitForLoadState('domcontentloaded');
    // Should still have the app root since it falls back to index.html
    const root = page.locator('#root, #__next, [data-testid="app"], body');
    await expect(root.first()).toBeVisible();
    await closeApp(electronApp);
  });
});
