import { test, expect, type ElectronApplication, type Page } from '@playwright/test';
import { HA_VRRP_CONFIG } from '../fixtures/configs/ha-vrrp-config';
import { openConfigInElectron } from '../fixtures/electron-file-mode-helpers';
import { launchApp, closeApp, navigateToPanel, openTab } from '../fixtures/helpers';

test.describe('Config Example: CRUD Button Visibility', () => {
  let electronApp: ElectronApplication;
  let page: Page;

  test.beforeEach(async () => {
    ({ electronApp, page } = await launchApp());
    await openConfigInElectron(electronApp, page, HA_VRRP_CONFIG, 'ha-vrrp.json');
  });

  test.afterEach(async () => {
    await closeApp(electronApp);
  });

  test('VRRP tab has Add Group button and Edit/Delete on rows', async () => {
    await navigateToPanel(page, 'High Availability');
    await openTab(page, 'VRRP');
    await expect(page.getByRole('columnheader', { name: 'Group' })).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('button', { name: /add group/i })).toBeVisible({ timeout: 8000 });
    await expect(page.getByTitle('Edit').first()).toBeVisible({ timeout: 8000 });
    await expect(page.getByTitle('Delete').first()).toBeVisible({ timeout: 8000 });
  });

  test('Route Maps tab has Add Route Map Entry button', async () => {
    // Expand Policy in sidebar, then click the sub-item to open the panel
    await page.locator('nav, [role="navigation"]').getByText('Policy', { exact: true }).click({ force: true });
    await page.waitForTimeout(500);
    // Click Route Maps in the sidebar sub-menu to open the panel on that tab
    await page.locator('nav, [role="navigation"]').getByRole('button', { name: /route maps/i }).click({ force: true });
    await page.waitForTimeout(800);
    await expect(page.getByRole('button', { name: /add route map entry/i })).toBeVisible({ timeout: 10000 });
  });

  test('Prefix Lists tab has Add Entry button', async () => {
    // Open Policy panel via sidebar
    await page.locator('nav, [role="navigation"]').getByText('Policy', { exact: true }).click({ force: true });
    await page.waitForTimeout(500);
    await page.locator('nav, [role="navigation"]').getByRole('button', { name: /prefix lists/i }).click({ force: true });
    await page.waitForTimeout(800);
    // Also click the Prefix Lists tab in the panel tab bar to ensure it's active
    await openTab(page, 'Prefix Lists');
    await expect(page.getByRole('button', { name: /add entry/i })).toBeVisible({ timeout: 10000 });
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
