import { test, expect } from '@playwright/test';
import { launchQemuApp, closeQemuApp, waitForConnected } from './fixtures/qemu-helpers';

test.describe('QEMU Electron Connection', () => {
  test('auto-connects via CLI args and shows hostname', async () => {
    const { electronApp, page } = await launchQemuApp();
    try {
      await waitForConnected(page);
      await expect(page.getByText('vyos-qemu')).toBeVisible();
      const nav = page.locator('nav, [role="navigation"]');
      await expect(nav).toBeVisible();
    } finally {
      await closeQemuApp(electronApp);
    }
  });
});
