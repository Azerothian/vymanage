import { test, expect } from '@playwright/test';
import { loginToQemu, navigateToPanel, openTab } from '../fixtures/qemu-helpers';
import { QEMU_FIREWALL_VRF } from '../../../../../e2e/shared/qemu-adapted-configs';
import { applyConfigToDevice, cleanupConfigFromDevice } from '../../../../../e2e/shared/qemu-config-utils';

test.describe.serial('QEMU Config: Firewall + VRF', () => {
  test.beforeAll(async () => {
    test.setTimeout(180_000);
    await cleanupConfigFromDevice(QEMU_FIREWALL_VRF);
    await applyConfigToDevice(QEMU_FIREWALL_VRF);
  });

  test.afterAll(async () => {
    await cleanupConfigFromDevice(QEMU_FIREWALL_VRF);
  });

  test.beforeEach(async ({ page }) => {
    await loginToQemu(page);
  });

  test('VRF panel opens and shows VRF table', async ({ page }) => {
    await navigateToPanel(page, 'VRF');
    await expect(page.locator('table')).toBeVisible({ timeout: 15000 });
    // Verify table has expected column headers
    await expect(page.getByRole('columnheader', { name: 'VRF Name' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Table ID' })).toBeVisible();
    // Verify at least one data row exists
    await expect(page.locator('table tbody tr').first()).toBeVisible();
  });

  test('Firewall panel opens with Global Options tab', async ({ page }) => {
    await navigateToPanel(page, 'Firewall');
    await expect(page.getByRole('button', { name: /Global Options/i }).last()).toBeVisible({ timeout: 15000 });
  });

  test('NAT44 Source tab shows masquerade rules', async ({ page }) => {
    await navigateToPanel(page, 'NAT');
    await openTab(page, 'NAT44 Source');
    await expect(page.locator('table')).toBeVisible({ timeout: 15000 });
    // Wait for data rows to load before checking cell content
    await expect(page.locator('table tbody tr').first()).toBeVisible({ timeout: 15000 });
    await expect(page.getByText(/masquerade/i).first()).toBeVisible({ timeout: 10000 });
  });
});
