import { test, expect, type ElectronApplication, type Page } from '@playwright/test';
import { launchQemuApp, closeQemuApp, waitForConnected, navigateToPanel } from '../fixtures/qemu-helpers';
import { QEMU_FIREWALL_VRF } from '../../../../../e2e/shared/qemu-adapted-configs';
import { applyConfigToDevice, cleanupConfigFromDevice } from '../../../../../e2e/shared/qemu-config-utils';

async function openTab(page: Page, tabName: string): Promise<void> {
  await page.getByRole('button', { name: new RegExp(tabName, 'i') }).last().click({ force: true });
  await page.waitForTimeout(500);
}

test.describe.serial('QEMU Config: Firewall + VRF', () => {
  let electronApp: ElectronApplication;
  let page: Page;

  test.beforeAll(async () => {
    test.setTimeout(180_000);
    await cleanupConfigFromDevice(QEMU_FIREWALL_VRF);
    await applyConfigToDevice(QEMU_FIREWALL_VRF);
  });

  test.afterAll(async () => {
    await cleanupConfigFromDevice(QEMU_FIREWALL_VRF);
  });

  test.beforeEach(async () => {
    ({ electronApp, page } = await launchQemuApp());
    await waitForConnected(page);
  });

  test.afterEach(async () => {
    await closeQemuApp(electronApp);
  });

  test('VRF panel opens and shows VRF table', async () => {
    await navigateToPanel(page, 'VRF');
    await expect(page.locator('table')).toBeVisible({ timeout: 15000 });
    // Verify table has expected column headers
    await expect(page.getByRole('columnheader', { name: 'VRF Name' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Table ID' })).toBeVisible();
    // Verify at least one data row exists
    await expect(page.locator('table tbody tr').first()).toBeVisible();
  });

  test('Firewall panel opens with Global Options tab', async () => {
    await navigateToPanel(page, 'Firewall');
    await expect(page.getByRole('button', { name: /Global Options/i }).last()).toBeVisible({ timeout: 15000 });
  });

  test('NAT44 Source tab shows masquerade rules', async () => {
    await navigateToPanel(page, 'NAT');
    await openTab(page, 'NAT44 Source');
    await expect(page.locator('table')).toBeVisible({ timeout: 15000 });
    // Wait for data rows to load before checking cell content
    await expect(page.locator('table tbody tr').first()).toBeVisible({ timeout: 15000 });
    await expect(page.getByText(/masquerade/i).first()).toBeVisible({ timeout: 10000 });
  });
});
