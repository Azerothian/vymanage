import { test, expect } from '@playwright/test';
import { HA_VRRP_CONFIG } from '../fixtures/configs/ha-vrrp-config';
import { IPSEC_VPN_CONFIG } from '../fixtures/configs/ipsec-vpn-config';
import { uploadConfigAndEnterFileMode } from '../fixtures/file-mode-helpers';
import { navigateToPanel, openTab } from '../fixtures/helpers';

/**
 * Navigate to a panel using exact text matching to avoid ambiguity
 * (e.g. "Policy" vs "Traffic Policy / QoS").
 */
async function navigateToPanelExact(page: import('@playwright/test').Page, panelName: string) {
  await page.locator('nav, [role="navigation"]').getByText(panelName, { exact: true }).click();
  await page.waitForTimeout(500);
}

test.describe('Config Example: CRUD Button Visibility', () => {
  test.describe('HA VRRP CRUD buttons', () => {
    test.beforeEach(async ({ page }) => {
      await uploadConfigAndEnterFileMode(page, HA_VRRP_CONFIG, 'ha-vrrp.json');
    });

    test('VRRP tab has Add Group button and Edit/Delete on rows', async ({ page }) => {
      await navigateToPanel(page, 'High Availability');
      await openTab(page, 'VRRP');
      await expect(page.locator('table')).toBeVisible({ timeout: 8000 });
      // Add button uses "+ Add Group" text
      await expect(page.getByRole('button', { name: /add group/i })).toBeVisible();
      // Edit and Delete buttons on rows
      await expect(page.getByTitle('Edit').first()).toBeVisible();
      await expect(page.getByTitle('Delete').first()).toBeVisible();
    });
  });

  test.describe('VPN IPsec CRUD buttons', () => {
    test.beforeEach(async ({ page }) => {
      await uploadConfigAndEnterFileMode(page, IPSEC_VPN_CONFIG, 'ipsec-vpn.json');
    });

    test('IPsec S2S tab has Add Peer button and Edit/Delete on rows', async ({ page }) => {
      await navigateToPanel(page, 'VPN');
      await openTab(page, 'IPsec S2S');
      await expect(page.locator('table')).toBeVisible({ timeout: 8000 });
      await expect(page.getByRole('button', { name: /add peer/i })).toBeVisible();
      await expect(page.getByTitle('Edit').first()).toBeVisible();
      await expect(page.getByTitle('Delete').first()).toBeVisible();
    });

    test('IKE Groups tab has Add IKE Group button', async ({ page }) => {
      await navigateToPanel(page, 'VPN');
      await openTab(page, 'IKE Groups');
      await expect(page.locator('table')).toBeVisible({ timeout: 8000 });
      await expect(page.getByRole('button', { name: /add ike group/i })).toBeVisible();
    });

    test('ESP Groups tab has Add ESP Group button', async ({ page }) => {
      await navigateToPanel(page, 'VPN');
      await openTab(page, 'ESP Groups');
      await expect(page.locator('table')).toBeVisible({ timeout: 8000 });
      await expect(page.getByRole('button', { name: /add esp group/i })).toBeVisible();
    });
  });

  test.describe('Policy CRUD buttons', () => {
    test.beforeEach(async ({ page }) => {
      await uploadConfigAndEnterFileMode(page, HA_VRRP_CONFIG, 'ha-vrrp.json');
    });

    test('Route Maps tab has Add Route Map Entry button', async ({ page }) => {
      await navigateToPanelExact(page, 'Policy');
      await openTab(page, 'Route Maps');
      await expect(page.locator('table')).toBeVisible({ timeout: 8000 });
      await expect(page.getByRole('button', { name: /add route map entry/i })).toBeVisible();
    });

    test('Prefix Lists tab has Add Entry button', async ({ page }) => {
      await navigateToPanelExact(page, 'Policy');
      await openTab(page, 'Prefix Lists');
      await expect(page.locator('table')).toBeVisible({ timeout: 8000 });
      await expect(page.getByRole('button', { name: /add entry/i })).toBeVisible();
    });

    test('Access Lists tab has Add Entry button', async ({ page }) => {
      await navigateToPanelExact(page, 'Policy');
      await openTab(page, 'Access Lists');
      await expect(page.locator('table')).toBeVisible({ timeout: 8000 });
      await expect(page.getByRole('button', { name: /add entry/i })).toBeVisible();
    });
  });

  test.describe('Protocols CRUD buttons', () => {
    test.beforeEach(async ({ page }) => {
      await uploadConfigAndEnterFileMode(page, HA_VRRP_CONFIG, 'ha-vrrp.json');
    });

    test('Static tab has Add Route button', async ({ page }) => {
      await navigateToPanel(page, 'Routing / Protocols');
      await openTab(page, 'Static');
      await expect(page.locator('table')).toBeVisible({ timeout: 8000 });
      await expect(page.getByRole('button', { name: /add route/i })).toBeVisible();
    });
  });

  test('no API calls made in file mode', async ({ page }) => {
    await uploadConfigAndEnterFileMode(page, HA_VRRP_CONFIG, 'ha-vrrp.json');
    const apiCalls: string[] = [];
    await page.route('**/{configure,retrieve,config-file}', (route) => {
      apiCalls.push(route.request().url());
      return route.continue();
    });
    await navigateToPanel(page, 'High Availability');
    await openTab(page, 'VRRP');
    await navigateToPanelExact(page, 'Policy');
    await openTab(page, 'Route Maps');
    expect(apiCalls).toHaveLength(0);
  });
});
