import { test, expect, type ElectronApplication, type Page } from '@playwright/test';
import { launchQemuApp, closeQemuApp, waitForConnected, navigateToPanel } from '../fixtures/qemu-helpers';
import { QEMU_FIREWALL_BRIDGE } from '../../../../../e2e/shared/qemu-adapted-configs';
import { applyConfigToDevice, cleanupConfigFromDevice } from '../../../../../e2e/shared/qemu-config-utils';

async function openTab(page: Page, tabName: string): Promise<void> {
  await page.getByRole('button', { name: new RegExp(tabName, 'i') }).last().click({ force: true });
  await page.waitForTimeout(500);
}

test.describe.serial('QEMU Config: Firewall + Bridge', () => {
  let electronApp: ElectronApplication;
  let page: Page;

  test.beforeAll(async () => {
    test.setTimeout(180_000);
    await cleanupConfigFromDevice(QEMU_FIREWALL_BRIDGE);
    await applyConfigToDevice(QEMU_FIREWALL_BRIDGE);
  });

  test.afterAll(async () => {
    await cleanupConfigFromDevice(QEMU_FIREWALL_BRIDGE);
  });

  test.beforeEach(async () => {
    ({ electronApp, page } = await launchQemuApp());
    await waitForConnected(page);
  });

  test.afterEach(async () => {
    await closeQemuApp(electronApp);
  });

  test('Firewall panel opens with IPv4 Rules tab', async () => {
    await navigateToPanel(page, 'Firewall');
    await expect(page.getByRole('button', { name: /IPv4 Rules/i }).last()).toBeVisible({ timeout: 15000 });
  });

  test('Interfaces panel shows bridge interfaces', async () => {
    await navigateToPanel(page, 'Interfaces');
    await expect(page.locator('table').getByText('br0').first()).toBeVisible({ timeout: 15000 });
    await expect(page.locator('table').getByText('br1').first()).toBeVisible({ timeout: 15000 });
    await expect(page.locator('table').getByText('br2').first()).toBeVisible({ timeout: 15000 });
  });

  test('Firewall Groups tab renders interface groups', async () => {
    await navigateToPanel(page, 'Firewall');
    await openTab(page, 'Groups');
    await expect(page.getByRole('button', { name: /Interface Groups/i })).toBeVisible({ timeout: 15000 });
  });
});
