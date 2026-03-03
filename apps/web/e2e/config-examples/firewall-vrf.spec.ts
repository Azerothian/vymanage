import { test, expect } from '@playwright/test';
import { FIREWALL_VRF_CONFIG } from '../fixtures/configs/firewall-vrf-config';
import { uploadConfigAndEnterFileMode } from '../fixtures/file-mode-helpers';
import { navigateToPanel, openTab } from '../fixtures/helpers';

test.describe('Config Example: Firewall + VRF', () => {
  test.beforeEach(async ({ page }) => {
    await uploadConfigAndEnterFileMode(page, FIREWALL_VRF_CONFIG, 'firewall-vrf.json');
  });

  test('VRF panel opens and shows VRF table', async ({ page }) => {
    await navigateToPanel(page, 'VRF');
    // VRF panel should show a table with VRF names
    await expect(page.locator('table')).toBeVisible({ timeout: 8000 });
    await expect(page.getByRole('cell', { name: 'LAN' })).toBeVisible();
    await expect(page.getByRole('cell', { name: 'MGMT' })).toBeVisible();
  });

  test('Firewall panel opens with Global Options tab', async ({ page }) => {
    await navigateToPanel(page, 'Firewall');
    await expect(page.getByRole('button', { name: /Global Options/i }).last()).toBeVisible({ timeout: 8000 });
  });

  test('NAT44 Source tab shows masquerade rules in table', async ({ page }) => {
    await navigateToPanel(page, 'NAT');
    await openTab(page, 'NAT44 Source');
    await expect(page.locator('table')).toBeVisible({ timeout: 8000 });
    await expect(page.getByRole('cell', { name: /masquerade/i }).first()).toBeVisible({ timeout: 8000 });
  });

  test('NAT44 Source shows pppoe0 as outbound interface', async ({ page }) => {
    await navigateToPanel(page, 'NAT');
    await openTab(page, 'NAT44 Source');
    await expect(page.getByRole('cell', { name: /pppoe0/i }).first()).toBeVisible({ timeout: 8000 });
  });

  test('Interfaces panel shows PPPoE interface', async ({ page }) => {
    await navigateToPanel(page, 'Interfaces');
    await expect(page.getByRole('cell', { name: 'pppoe0' })).toBeVisible({ timeout: 8000 });
  });

  test('no API calls made in file mode', async ({ page }) => {
    const apiCalls: string[] = [];
    await page.route('**/{configure,retrieve,config-file}', (route) => {
      apiCalls.push(route.request().url());
      return route.continue();
    });
    await navigateToPanel(page, 'NAT');
    await openTab(page, 'NAT44 Source');
    expect(apiCalls).toHaveLength(0);
  });
});
