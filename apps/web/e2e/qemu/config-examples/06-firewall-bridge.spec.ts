import { test, expect } from '@playwright/test';
import { loginToQemu, navigateToPanel, openTab } from '../fixtures/qemu-helpers';
import { QEMU_FIREWALL_BRIDGE } from '../../../../../e2e/shared/qemu-adapted-configs';
import { applyConfigToDevice, cleanupConfigFromDevice } from '../../../../../e2e/shared/qemu-config-utils';

test.describe.serial('QEMU Config: Firewall + Bridge', () => {
  test.beforeAll(async () => {
    test.setTimeout(180_000);
    await cleanupConfigFromDevice(QEMU_FIREWALL_BRIDGE);
    await applyConfigToDevice(QEMU_FIREWALL_BRIDGE);
  });

  test.afterAll(async () => {
    await cleanupConfigFromDevice(QEMU_FIREWALL_BRIDGE);
  });

  test.beforeEach(async ({ page }) => {
    await loginToQemu(page);
  });

  test('Firewall panel opens with IPv4 Rules tab', async ({ page }) => {
    await navigateToPanel(page, 'Firewall');
    await expect(page.getByRole('button', { name: /IPv4 Rules/i }).last()).toBeVisible({ timeout: 15000 });
  });

  test('Interfaces panel shows bridge interfaces', async ({ page }) => {
    await navigateToPanel(page, 'Interfaces');
    await expect(page.locator('table').getByText('br0').first()).toBeVisible({ timeout: 15000 });
    await expect(page.locator('table').getByText('br1').first()).toBeVisible();
    await expect(page.locator('table').getByText('br2').first()).toBeVisible();
  });

  test('Firewall Groups tab renders interface groups', async ({ page }) => {
    await navigateToPanel(page, 'Firewall');
    await openTab(page, 'Groups');
    await expect(page.getByRole('button', { name: /Interface Groups/i })).toBeVisible({ timeout: 15000 });
  });
});
