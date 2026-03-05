import { test, expect } from '@playwright/test';
import { loginToQemu, navigateToPanel, openTab } from '../fixtures/qemu-helpers';
import { QEMU_QOS } from '../../../../../e2e/shared/qemu-adapted-configs';
import { applyConfigToDevice, cleanupConfigFromDevice } from '../../../../../e2e/shared/qemu-config-utils';

test.describe.serial('QEMU Config: QoS Traffic Shaping', () => {
  test.beforeAll(async () => {
    test.setTimeout(180_000);
    await cleanupConfigFromDevice(QEMU_QOS);
    await applyConfigToDevice(QEMU_QOS);
  });

  test.afterAll(async () => {
    await cleanupConfigFromDevice(QEMU_QOS);
  });

  test.beforeEach(async ({ page }) => {
    await loginToQemu(page);
  });

  test('Traffic Policy panel opens with Shaper tab', async ({ page }) => {
    await navigateToPanel(page, 'Traffic Policy / QoS');
    await expect(page.getByRole('button', { name: /Shaper/i }).last()).toBeVisible({ timeout: 15000 });
  });

  test('Shaper tab shows policy name vyos3', async ({ page }) => {
    await navigateToPanel(page, 'Traffic Policy / QoS');
    await openTab(page, 'Shaper');
    await expect(page.locator('table')).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole('cell', { name: 'vyos3' })).toBeVisible();
  });

  test('Shaper table has Name column', async ({ page }) => {
    await navigateToPanel(page, 'Traffic Policy / QoS');
    await openTab(page, 'Shaper');
    await expect(page.getByRole('columnheader', { name: 'Name' })).toBeVisible({ timeout: 15000 });
  });
});
