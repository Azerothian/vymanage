import { test, expect } from '@playwright/test';
import { loginToQemu, navigateToPanel } from './fixtures/qemu-helpers';

test.describe('QEMU Interfaces', () => {
  test.beforeEach(async ({ page }) => {
    await loginToQemu(page);
    await navigateToPanel(page, 'Interfaces');
  });

  test('eth0 is visible in the interface list', async ({ page }) => {
    await expect(page.getByRole('cell', { name: 'eth0' })).toBeVisible();
  });

  test('loopback interface is visible', async ({ page }) => {
    await expect(page.getByRole('cell', { name: 'lo', exact: true })).toBeVisible();
  });

  test('eth0 shows DHCP address', async ({ page }) => {
    await expect(page.getByRole('cell', { name: 'dhcp' })).toBeVisible();
  });

  test('interface table has expected columns', async ({ page }) => {
    await expect(page.getByRole('columnheader', { name: 'Name' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Address' })).toBeVisible();
  });
});
