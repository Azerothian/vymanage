import { test, expect } from '@playwright/test';
import { IPSEC_VPN_CONFIG } from '../fixtures/configs/ipsec-vpn-config';
import { uploadConfigAndEnterFileMode } from '../fixtures/file-mode-helpers';
import { navigateToPanel, openTab } from '../fixtures/helpers';

test.describe('Config Example: IPsec Route-Based VPN', () => {
  test.beforeEach(async ({ page }) => {
    await uploadConfigAndEnterFileMode(page, IPSEC_VPN_CONFIG, 'ipsec-vpn.json');
  });

  test('VPN panel opens with IPsec S2S tab', async ({ page }) => {
    await navigateToPanel(page, 'VPN');
    await expect(page.getByRole('button', { name: /IPsec S2S/i }).last()).toBeVisible({ timeout: 8000 });
  });

  test('IPsec S2S tab shows peers table', async ({ page }) => {
    await navigateToPanel(page, 'VPN');
    await openTab(page, 'IPsec S2S');
    await expect(page.locator('table')).toBeVisible({ timeout: 8000 });
    await expect(page.getByRole('columnheader', { name: 'Peer' })).toBeVisible();
  });

  test('IKE Groups tab is available', async ({ page }) => {
    await navigateToPanel(page, 'VPN');
    await expect(page.getByRole('button', { name: /IKE Groups/i }).last()).toBeVisible({ timeout: 8000 });
  });

  test('ESP Groups tab is available', async ({ page }) => {
    await navigateToPanel(page, 'VPN');
    await expect(page.getByRole('button', { name: /ESP Groups/i }).last()).toBeVisible({ timeout: 8000 });
  });

  test('Interfaces panel shows VTI interface', async ({ page }) => {
    await navigateToPanel(page, 'Interfaces');
    await expect(page.getByRole('cell', { name: 'vti1' })).toBeVisible({ timeout: 8000 });
  });

  test('Interfaces panel shows ethernet interfaces', async ({ page }) => {
    await navigateToPanel(page, 'Interfaces');
    await expect(page.getByRole('cell', { name: 'eth0' })).toBeVisible({ timeout: 8000 });
    await expect(page.getByRole('cell', { name: 'eth1' })).toBeVisible();
  });

  test('no API calls made in file mode', async ({ page }) => {
    const apiCalls: string[] = [];
    await page.route('**/{configure,retrieve,config-file}', (route) => {
      apiCalls.push(route.request().url());
      return route.continue();
    });
    await navigateToPanel(page, 'VPN');
    await openTab(page, 'IPsec S2S');
    expect(apiCalls).toHaveLength(0);
  });
});
