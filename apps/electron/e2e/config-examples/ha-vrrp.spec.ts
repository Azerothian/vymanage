import { test, expect, type ElectronApplication, type Page } from '@playwright/test';
import { HA_VRRP_CONFIG } from '../fixtures/configs/ha-vrrp-config';
import { openConfigInElectron } from '../fixtures/electron-file-mode-helpers';
import { launchApp, closeApp, navigateToPanel, openTab } from '../fixtures/helpers';

test.describe('Config Example: High Availability VRRP', () => {
  let electronApp: ElectronApplication;
  let page: Page;

  test.beforeEach(async () => {
    ({ electronApp, page } = await launchApp());
    await openConfigInElectron(electronApp, page, HA_VRRP_CONFIG, 'ha-vrrp.json');
  });

  test.afterEach(async () => {
    await closeApp(electronApp);
  });

  test('VRRP tab shows groups table', async () => {
    await navigateToPanel(page, 'High Availability');
    await openTab(page, 'VRRP');
    await expect(page.getByRole('columnheader', { name: 'Group' })).toBeVisible({ timeout: 8000 });
    await expect(page.getByRole('columnheader', { name: 'VRID' })).toBeVisible({ timeout: 8000 });
  });

  test('VRRP table shows group "int" with interface eth0.201', async () => {
    await navigateToPanel(page, 'High Availability');
    await openTab(page, 'VRRP');
    // Wait for the table to render with data
    await expect(page.getByRole('cell', { name: 'int' })).toBeVisible({ timeout: 8000 });
    await expect(page.getByRole('cell', { name: 'eth0.201' })).toBeVisible({ timeout: 8000 });
  });

  test('VRRP table shows group "public" with VRID 113', async () => {
    await navigateToPanel(page, 'High Availability');
    await openTab(page, 'VRRP');
    const publicRow = page.getByRole('row').filter({ hasText: 'public' });
    await expect(publicRow).toBeVisible({ timeout: 8000 });
    await expect(publicRow.getByRole('cell', { name: '113' })).toBeVisible({ timeout: 8000 });
  });

  test('VRRP table shows priority 200', async () => {
    await navigateToPanel(page, 'High Availability');
    await openTab(page, 'VRRP');
    await expect(page.getByRole('cell', { name: '200' }).first()).toBeVisible({ timeout: 8000 });
  });

  test('NAT44 Source shows translation address', async () => {
    await navigateToPanel(page, 'NAT');
    await openTab(page, 'NAT44 Source');
    await expect(page.getByText('203.0.113.1')).toBeVisible({ timeout: 8000 });
  });

  test('no API calls made in file mode', async () => {
    const apiCalls: string[] = [];
    await page.route('**/{configure,retrieve,config-file}', (route) => {
      apiCalls.push(route.request().url());
      return route.continue();
    });
    await navigateToPanel(page, 'High Availability');
    await openTab(page, 'VRRP');
    expect(apiCalls).toHaveLength(0);
  });
});
