import { test, expect } from '@playwright/test';
import { loginToQemu, navigateToPanel, openTab } from '../fixtures/qemu-helpers';
import { QEMU_NAT } from '../../../../../e2e/shared/qemu-adapted-configs';
import { applyConfigToDevice, cleanupConfigFromDevice } from '../../../../../e2e/shared/qemu-config-utils';

test.describe.serial('QEMU Config: NAT Rules', () => {
  test.beforeAll(async () => {
    test.setTimeout(180_000);
    await cleanupConfigFromDevice(QEMU_NAT);
    await applyConfigToDevice(QEMU_NAT);
  });

  test.afterAll(async () => {
    await cleanupConfigFromDevice(QEMU_NAT);
  });

  test.beforeEach(async ({ page }) => {
    await loginToQemu(page);
  });

  test('NAT panel opens with NAT44 Source tab', async ({ page }) => {
    await navigateToPanel(page, 'NAT');
    await expect(page.getByRole('button', { name: /NAT44 Source/i }).last()).toBeVisible({ timeout: 15000 });
  });

  test('NAT44 Source tab shows masquerade rules', async ({ page }) => {
    await navigateToPanel(page, 'NAT');
    await openTab(page, 'NAT44 Source');
    await expect(page.locator('table').first()).toBeVisible({ timeout: 15000 });
    await expect(page.locator('table tbody tr').first()).toBeVisible({ timeout: 15000 });
    await expect(page.getByText(/masquerade/i).first()).toBeVisible({ timeout: 10000 });
  });

  test('NAT44 Source shows eth0 as outbound interface', async ({ page }) => {
    await navigateToPanel(page, 'NAT');
    await openTab(page, 'NAT44 Source');
    await expect(page.getByRole('cell', { name: /eth0/i }).first()).toBeVisible({ timeout: 15000 });
  });
});
