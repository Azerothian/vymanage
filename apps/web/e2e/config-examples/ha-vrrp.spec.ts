import { test, expect } from '@playwright/test';
import { HA_VRRP_CONFIG } from '../fixtures/configs/ha-vrrp-config';
import { uploadConfigAndEnterFileMode } from '../fixtures/file-mode-helpers';
import { navigateToPanel, openTab } from '../fixtures/helpers';

test.describe('Config Example: High Availability VRRP', () => {
  test.beforeEach(async ({ page }) => {
    await uploadConfigAndEnterFileMode(page, HA_VRRP_CONFIG, 'ha-vrrp.json');
  });

  test('VRRP tab shows groups table', async ({ page }) => {
    await navigateToPanel(page, 'High Availability');
    await openTab(page, 'VRRP');
    await expect(page.locator('table')).toBeVisible({ timeout: 8000 });
    await expect(page.getByRole('columnheader', { name: 'Group' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'VRID' })).toBeVisible();
  });

  test('VRRP table shows group "int" with interface eth0.201', async ({ page }) => {
    await navigateToPanel(page, 'High Availability');
    await openTab(page, 'VRRP');
    // Wait for the table to render with data
    await expect(page.getByRole('cell', { name: 'int' })).toBeVisible({ timeout: 8000 });
    await expect(page.getByRole('cell', { name: 'eth0.201' })).toBeVisible();
  });

  test('VRRP table shows group "public" with VRID 113', async ({ page }) => {
    await navigateToPanel(page, 'High Availability');
    await openTab(page, 'VRRP');
    const publicRow = page.getByRole('row').filter({ hasText: 'public' });
    await expect(publicRow).toBeVisible({ timeout: 8000 });
    await expect(publicRow.getByRole('cell', { name: '113' })).toBeVisible();
  });

  test('VRRP table shows priority 200', async ({ page }) => {
    await navigateToPanel(page, 'High Availability');
    await openTab(page, 'VRRP');
    await expect(page.getByRole('cell', { name: '200' }).first()).toBeVisible({ timeout: 8000 });
  });

  test('NAT44 Source shows translation address', async ({ page }) => {
    await navigateToPanel(page, 'NAT');
    await openTab(page, 'NAT44 Source');
    await expect(page.locator('table')).toBeVisible({ timeout: 8000 });
    await expect(page.getByText('203.0.113.1')).toBeVisible();
  });

  test('no API calls made in file mode', async ({ page }) => {
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
