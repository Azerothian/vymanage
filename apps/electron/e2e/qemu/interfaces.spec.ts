import { test, expect } from '@playwright/test';
import { launchQemuApp, closeQemuApp, waitForConnected, navigateToPanel } from './fixtures/qemu-helpers';

test.describe('QEMU Electron Interfaces', () => {
  test('eth0 and lo are visible from real device', async () => {
    const { electronApp, page } = await launchQemuApp();
    try {
      await waitForConnected(page);
      await navigateToPanel(page, 'Interfaces');
      await expect(page.getByRole('cell', { name: 'eth0' })).toBeVisible();
      await expect(page.getByRole('cell', { name: 'lo', exact: true })).toBeVisible();
    } finally {
      await closeQemuApp(electronApp);
    }
  });
});
