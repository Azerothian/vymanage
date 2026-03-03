import { test, expect } from '@playwright/test';
import { loginToQemu, navigateToPanel } from './fixtures/qemu-helpers';

test.describe('QEMU Interfaces', () => {
  test.beforeEach(async ({ page }) => {
    await loginToQemu(page);
    await navigateToPanel(page, 'Interfaces');
  });

  test('eth0 is visible in the interface list', async ({ page }) => {
    await expect(page.getByText('eth0')).toBeVisible();
  });

  test('loopback interface is visible', async ({ page }) => {
    await expect(page.getByText('lo')).toBeVisible();
  });

  test('eth0 shows DHCP address', async ({ page }) => {
    // eth0 should have a DHCP-assigned address visible
    await expect(page.getByText(/\d+\.\d+\.\d+\.\d+/)).toBeVisible({ timeout: 15_000 });
  });

  test('interface table has expected columns', async ({ page }) => {
    await expect(page.getByText(/name/i)).toBeVisible();
    await expect(page.getByText(/address/i)).toBeVisible();
  });
});
