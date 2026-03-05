import { test, expect, type ElectronApplication, type Page } from '@playwright/test';
import { launchQemuApp, closeQemuApp, waitForConnected, navigateToPanel } from '../fixtures/qemu-helpers';
import { QEMU_ZONE_POLICY } from '../../../../../e2e/shared/qemu-adapted-configs';
import { applyConfigToDevice, cleanupConfigFromDevice } from '../../../../../e2e/shared/qemu-config-utils';

async function openTab(page: Page, tabName: string): Promise<void> {
  await page.getByRole('button', { name: new RegExp(tabName, 'i') }).last().click({ force: true });
  await page.waitForTimeout(500);
}

test.describe.serial('QEMU Config: Zone-Based Firewall', () => {
  let electronApp: ElectronApplication;
  let page: Page;

  test.beforeAll(async () => {
    test.setTimeout(180_000);
    await cleanupConfigFromDevice(QEMU_ZONE_POLICY);
    await applyConfigToDevice(QEMU_ZONE_POLICY);
  });

  test.afterAll(async () => {
    await cleanupConfigFromDevice(QEMU_ZONE_POLICY);
  });

  test.beforeEach(async () => {
    ({ electronApp, page } = await launchQemuApp());
    await waitForConnected(page);
  });

  test.afterEach(async () => {
    await closeQemuApp(electronApp);
  });

  test('Firewall panel opens with tab buttons visible', async () => {
    await navigateToPanel(page, 'Firewall');
    await expect(page.getByRole('button', { name: /Zones/i }).last()).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole('button', { name: /IPv4 Rules/i }).last()).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole('button', { name: /IPv6 Rules/i }).last()).toBeVisible({ timeout: 15000 });
  });

  test('IPv4 Rules tab shows rule set names in dropdown', async () => {
    await navigateToPanel(page, 'Firewall');
    await openTab(page, 'IPv4 Rules');
    await expect(page.locator('select option').filter({ hasText: 'lan-dmz' })).toBeAttached({ timeout: 15000 });
    await expect(page.locator('select option').filter({ hasText: 'wan-dmz' })).toBeAttached();
    await expect(page.locator('select option').filter({ hasText: 'wan-lan' })).toBeAttached();
  });

  test('IPv6 Rules tab shows rule set names in dropdown', async () => {
    await navigateToPanel(page, 'Firewall');
    await openTab(page, 'IPv6 Rules');
    await expect(page.locator('select option').filter({ hasText: 'lan-dmz-6' })).toBeAttached({ timeout: 15000 });
  });

  test('Interfaces panel shows ethernet interface', async () => {
    await navigateToPanel(page, 'Interfaces');
    await expect(page.getByText('eth0')).toBeVisible({ timeout: 15000 });
  });
});
