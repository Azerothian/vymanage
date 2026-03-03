import { test, expect } from '@playwright/test';
import { loginToQemu } from './fixtures/qemu-helpers';

test.describe('QEMU Connection', () => {
  test('connects to real VyOS and shows hostname', async ({ page }) => {
    await loginToQemu(page);
    await expect(page.getByText('vyos-qemu')).toBeVisible();
  });

  test('sidebar navigation panels are visible after connect', async ({ page }) => {
    await loginToQemu(page);
    const nav = page.locator('nav, [role="navigation"]');
    await expect(nav).toBeVisible();
    await expect(nav.getByText(/interfaces/i)).toBeVisible();
    await expect(nav.getByText(/firewall/i)).toBeVisible();
    await expect(nav.getByText(/system/i)).toBeVisible();
  });
});
