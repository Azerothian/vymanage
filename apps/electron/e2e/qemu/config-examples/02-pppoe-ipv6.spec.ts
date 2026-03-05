import { test, expect, type ElectronApplication, type Page } from '@playwright/test';
import { launchQemuApp, closeQemuApp, waitForConnected, navigateToPanel } from '../fixtures/qemu-helpers';
import { QEMU_PPPOE_IPV6 } from '../../../../../e2e/shared/qemu-adapted-configs';
import { applyConfigToDevice, cleanupConfigFromDevice } from '../../../../../e2e/shared/qemu-config-utils';

async function openTab(page: Page, tabName: string): Promise<void> {
  await page.getByRole('button', { name: new RegExp(tabName, 'i') }).last().click({ force: true });
  await page.waitForTimeout(500);
}

test.describe.serial('QEMU Config: PPPoE IPv6 Firewall Rules', () => {
  let electronApp: ElectronApplication;
  let page: Page;

  test.beforeAll(async () => {
    test.setTimeout(180_000);
    await cleanupConfigFromDevice(QEMU_PPPOE_IPV6);
    await applyConfigToDevice(QEMU_PPPOE_IPV6);
  });

  test.afterAll(async () => {
    await cleanupConfigFromDevice(QEMU_PPPOE_IPV6);
  });

  test.beforeEach(async () => {
    ({ electronApp, page } = await launchQemuApp());
    await waitForConnected(page);
  });

  test.afterEach(async () => {
    await closeQemuApp(electronApp);
  });

  test('IPv6 Rules tab shows WAN_IN rule set', async () => {
    await navigateToPanel(page, 'Firewall');
    await openTab(page, 'IPv6 Rules');
    await expect(page.locator('select option').filter({ hasText: 'WAN_IN' })).toBeAttached({ timeout: 15000 });
  });

  test('IPv6 Rules tab shows WAN_LOCAL rule set', async () => {
    await navigateToPanel(page, 'Firewall');
    await openTab(page, 'IPv6 Rules');
    await expect(page.locator('select option').filter({ hasText: 'WAN_LOCAL' })).toBeAttached({ timeout: 15000 });
  });
});
