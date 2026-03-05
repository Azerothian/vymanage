import { test, expect, type ElectronApplication, type Page } from '@playwright/test';
import { launchQemuApp, closeQemuApp, waitForConnected, navigateToPanel } from '../fixtures/qemu-helpers';
import { QEMU_WAN_LB } from '../../../../../e2e/shared/qemu-adapted-configs';
import { applyConfigToDevice, cleanupConfigFromDevice } from '../../../../../e2e/shared/qemu-config-utils';

async function openTab(page: Page, tabName: string): Promise<void> {
  await page.getByRole('button', { name: new RegExp(tabName, 'i') }).last().click({ force: true });
  await page.waitForTimeout(500);
}

test.describe.serial('QEMU Config: WAN Load Balancing', () => {
  let electronApp: ElectronApplication;
  let page: Page;

  test.beforeAll(async () => {
    test.setTimeout(180_000);
    await cleanupConfigFromDevice(QEMU_WAN_LB);
    await applyConfigToDevice(QEMU_WAN_LB);
  });

  test.afterAll(async () => {
    await cleanupConfigFromDevice(QEMU_WAN_LB);
  });

  test.beforeEach(async () => {
    ({ electronApp, page } = await launchQemuApp());
    await waitForConnected(page);
  });

  test.afterEach(async () => {
    await closeQemuApp(electronApp);
  });

  test('Load Balancing panel opens with WAN tab', async () => {
    await navigateToPanel(page, 'Load Balancing');
    await expect(page.getByRole('button', { name: /WAN/i }).last()).toBeVisible({ timeout: 15000 });
  });

  test('WAN tab renders a table', async () => {
    await navigateToPanel(page, 'Load Balancing');
    await openTab(page, 'WAN');
    await expect(page.locator('table').first()).toBeVisible({ timeout: 15000 });
  });
});
