import { test, expect } from '@playwright/test';
import { loginToQemu, navigateToPanel, openTab } from '../fixtures/qemu-helpers';
import { QEMU_PPPOE_IPV6 } from '../../../../../e2e/shared/qemu-adapted-configs';
import { applyConfigToDevice, cleanupConfigFromDevice } from '../../../../../e2e/shared/qemu-config-utils';

test.describe.serial('QEMU Config: PPPoE IPv6 Firewall Rules', () => {
  test.beforeAll(async () => {
    test.setTimeout(180_000);
    await cleanupConfigFromDevice(QEMU_PPPOE_IPV6);
    await applyConfigToDevice(QEMU_PPPOE_IPV6);
  });

  test.afterAll(async () => {
    await cleanupConfigFromDevice(QEMU_PPPOE_IPV6);
  });

  test.beforeEach(async ({ page }) => {
    await loginToQemu(page);
  });

  test('IPv6 Rules tab shows WAN_IN rule set', async ({ page }) => {
    await navigateToPanel(page, 'Firewall');
    await openTab(page, 'IPv6 Rules');
    await expect(page.locator('select option').filter({ hasText: 'WAN_IN' })).toBeAttached({ timeout: 15000 });
  });

  test('IPv6 Rules tab shows WAN_LOCAL rule set', async ({ page }) => {
    await navigateToPanel(page, 'Firewall');
    await openTab(page, 'IPv6 Rules');
    await expect(page.locator('select option').filter({ hasText: 'WAN_LOCAL' })).toBeAttached({ timeout: 15000 });
  });
});
