import { test, expect, type ElectronApplication, type Page } from '@playwright/test';
import { launchQemuApp, closeQemuApp, waitForConnected, navigateToPanel } from '../fixtures/qemu-helpers';
import { QEMU_QOS } from '../../../../../e2e/shared/qemu-adapted-configs';
import { applyConfigToDevice, cleanupConfigFromDevice } from '../../../../../e2e/shared/qemu-config-utils';

async function openTab(page: Page, tabName: string): Promise<void> {
  await page.getByRole('button', { name: new RegExp(tabName, 'i') }).last().click({ force: true });
  await page.waitForTimeout(500);
}

test.describe.serial('QEMU Config: QoS Traffic Shaping', () => {
  let electronApp: ElectronApplication;
  let page: Page;

  test.beforeAll(async () => {
    test.setTimeout(180_000);
    await cleanupConfigFromDevice(QEMU_QOS);
    await applyConfigToDevice(QEMU_QOS);
  });

  test.afterAll(async () => {
    await cleanupConfigFromDevice(QEMU_QOS);
  });

  test.beforeEach(async () => {
    ({ electronApp, page } = await launchQemuApp());
    await waitForConnected(page);
  });

  test.afterEach(async () => {
    await closeQemuApp(electronApp);
  });

  test('Traffic Policy panel opens with Shaper tab', async () => {
    await navigateToPanel(page, 'Traffic Policy / QoS');
    await expect(page.getByRole('button', { name: /Shaper/i }).last()).toBeVisible({ timeout: 15000 });
  });

  test('Shaper tab shows policy name vyos3', async () => {
    await navigateToPanel(page, 'Traffic Policy / QoS');
    await openTab(page, 'Shaper');
    await expect(page.locator('table')).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole('cell', { name: 'vyos3' })).toBeVisible({ timeout: 15000 });
  });

  test('Shaper table has Name column', async () => {
    await navigateToPanel(page, 'Traffic Policy / QoS');
    await openTab(page, 'Shaper');
    await expect(page.getByRole('columnheader', { name: 'Name' })).toBeVisible({ timeout: 15000 });
  });
});
