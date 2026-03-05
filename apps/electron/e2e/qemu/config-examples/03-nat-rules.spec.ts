import { test, expect, type ElectronApplication, type Page } from '@playwright/test';
import { launchQemuApp, closeQemuApp, waitForConnected, navigateToPanel } from '../fixtures/qemu-helpers';
import { QEMU_NAT } from '../../../../../e2e/shared/qemu-adapted-configs';
import { applyConfigToDevice, cleanupConfigFromDevice } from '../../../../../e2e/shared/qemu-config-utils';

async function openTab(page: Page, tabName: string): Promise<void> {
  await page.getByRole('button', { name: new RegExp(tabName, 'i') }).last().click({ force: true });
  await page.waitForTimeout(500);
}

test.describe.serial('QEMU Config: NAT Rules', () => {
  let electronApp: ElectronApplication;
  let page: Page;

  test.beforeAll(async () => {
    test.setTimeout(180_000);
    await cleanupConfigFromDevice(QEMU_NAT);
    await applyConfigToDevice(QEMU_NAT);
  });

  test.afterAll(async () => {
    await cleanupConfigFromDevice(QEMU_NAT);
  });

  test.beforeEach(async () => {
    ({ electronApp, page } = await launchQemuApp());
    await waitForConnected(page);
  });

  test.afterEach(async () => {
    await closeQemuApp(electronApp);
  });

  test('NAT panel opens with NAT44 Source tab', async () => {
    await navigateToPanel(page, 'NAT');
    await expect(page.getByRole('button', { name: /NAT44 Source/i }).last()).toBeVisible({ timeout: 15000 });
  });

  test('NAT44 Source tab shows masquerade rules', async () => {
    await navigateToPanel(page, 'NAT');
    await openTab(page, 'NAT44 Source');
    await expect(page.locator('table').first()).toBeVisible({ timeout: 15000 });
    await expect(page.locator('table tbody tr').first()).toBeVisible({ timeout: 15000 });
    await expect(page.getByText(/masquerade/i).first()).toBeVisible({ timeout: 10000 });
  });

  test('NAT44 Source shows eth0 as outbound interface', async () => {
    await navigateToPanel(page, 'NAT');
    await openTab(page, 'NAT44 Source');
    await expect(page.getByRole('cell', { name: /eth0/i }).first()).toBeVisible({ timeout: 15000 });
  });
});
