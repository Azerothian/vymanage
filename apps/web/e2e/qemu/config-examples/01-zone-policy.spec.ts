import { test, expect } from '@playwright/test';
import { loginToQemu, navigateToPanel, openTab } from '../fixtures/qemu-helpers';
import { QEMU_ZONE_POLICY } from '../../../../../e2e/shared/qemu-adapted-configs';
import { applyConfigToDevice, cleanupConfigFromDevice } from '../../../../../e2e/shared/qemu-config-utils';

test.describe.serial('QEMU Config: Zone-Based Firewall', () => {
  test.beforeAll(async () => {
    test.setTimeout(180_000);
    await cleanupConfigFromDevice(QEMU_ZONE_POLICY);
    await applyConfigToDevice(QEMU_ZONE_POLICY);
  });

  test.afterAll(async () => {
    await cleanupConfigFromDevice(QEMU_ZONE_POLICY);
  });

  test.beforeEach(async ({ page }) => {
    await loginToQemu(page);
  });

  test('Firewall panel opens with tab buttons visible', async ({ page }) => {
    await navigateToPanel(page, 'Firewall');
    await expect(page.getByRole('button', { name: /Zones/i }).last()).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole('button', { name: /IPv4 Rules/i }).last()).toBeVisible();
    await expect(page.getByRole('button', { name: /IPv6 Rules/i }).last()).toBeVisible();
  });

  test('IPv4 Rules tab shows rule set names in dropdown', async ({ page }) => {
    await navigateToPanel(page, 'Firewall');
    await openTab(page, 'IPv4 Rules');
    await expect(page.locator('select option').filter({ hasText: 'lan-dmz' })).toBeAttached({ timeout: 15000 });
    await expect(page.locator('select option').filter({ hasText: 'wan-dmz' })).toBeAttached();
    await expect(page.locator('select option').filter({ hasText: 'wan-lan' })).toBeAttached();
  });

  test('IPv6 Rules tab shows rule set names in dropdown', async ({ page }) => {
    await navigateToPanel(page, 'Firewall');
    await openTab(page, 'IPv6 Rules');
    await expect(page.locator('select option').filter({ hasText: 'lan-dmz-6' })).toBeAttached({ timeout: 15000 });
  });

  test('Interfaces panel shows ethernet interface', async ({ page }) => {
    await navigateToPanel(page, 'Interfaces');
    await expect(page.getByText('eth0')).toBeVisible({ timeout: 15000 });
  });
});
