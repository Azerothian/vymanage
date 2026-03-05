import { test, expect } from '@playwright/test';
import { loginToQemu, navigateToPanel, openTab } from '../fixtures/qemu-helpers';
import { QEMU_WAN_LB } from '../../../../../e2e/shared/qemu-adapted-configs';
import { applyConfigToDevice, cleanupConfigFromDevice } from '../../../../../e2e/shared/qemu-config-utils';

test.describe.serial('QEMU Config: WAN Load Balancing', () => {
  test.beforeAll(async () => {
    test.setTimeout(180_000);
    await cleanupConfigFromDevice(QEMU_WAN_LB);
    await applyConfigToDevice(QEMU_WAN_LB);
  });

  test.afterAll(async () => {
    await cleanupConfigFromDevice(QEMU_WAN_LB);
  });

  test.beforeEach(async ({ page }) => {
    await loginToQemu(page);
  });

  test('Load Balancing panel opens with WAN tab', async ({ page }) => {
    await navigateToPanel(page, 'Load Balancing');
    await expect(page.getByRole('button', { name: /WAN/i }).last()).toBeVisible({ timeout: 15000 });
  });

  test('WAN tab renders a table', async ({ page }) => {
    await navigateToPanel(page, 'Load Balancing');
    await openTab(page, 'WAN');
    await expect(page.locator('table').first()).toBeVisible({ timeout: 15000 });
  });
});
