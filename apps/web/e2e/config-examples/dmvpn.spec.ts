import { test, expect } from '@playwright/test';
import { DMVPN_CONFIG } from '../fixtures/configs/dmvpn-config';
import { uploadConfigAndEnterFileMode } from '../fixtures/file-mode-helpers';
import { navigateToPanel, openTab } from '../fixtures/helpers';

test.describe('Config Example: DMVPN Dual-Hub', () => {
  test.beforeEach(async ({ page }) => {
    await uploadConfigAndEnterFileMode(page, DMVPN_CONFIG, 'dmvpn.json');
  });

  test('VPN panel opens with DMVPN tab available', async ({ page }) => {
    await navigateToPanel(page, 'VPN');
    await expect(page.getByRole('button', { name: /DMVPN/i }).last()).toBeVisible({ timeout: 8000 });
  });

  test('DMVPN tab renders without crashing', async ({ page }) => {
    await navigateToPanel(page, 'VPN');
    await openTab(page, 'DMVPN');
    // After clicking DMVPN tab, the tab button should remain visible (no crash)
    await expect(page.getByRole('button', { name: /DMVPN/i }).last()).toBeVisible({ timeout: 8000 });
  });

  test('Interfaces panel shows tunnel interfaces', async ({ page }) => {
    await navigateToPanel(page, 'Interfaces');
    await expect(page.getByRole('cell', { name: 'tun100' })).toBeVisible({ timeout: 8000 });
    await expect(page.getByRole('cell', { name: 'tun101' })).toBeVisible();
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
    await openTab(page, 'DMVPN');
    expect(apiCalls).toHaveLength(0);
  });
});
