import { test, expect, type ElectronApplication, type Page } from '@playwright/test';
import { IPSEC_VPN_CONFIG } from '../fixtures/configs/ipsec-vpn-config';
import { openConfigInElectron } from '../fixtures/electron-file-mode-helpers';
import { launchApp, closeApp, navigateToPanel, openTab } from '../fixtures/helpers';

test.describe('Config Example: IPsec Route-Based VPN', () => {
  let electronApp: ElectronApplication;
  let page: Page;

  test.beforeEach(async () => {
    ({ electronApp, page } = await launchApp());
    await openConfigInElectron(electronApp, page, IPSEC_VPN_CONFIG, 'ipsec-vpn.json');
  });

  test.afterEach(async () => {
    await closeApp(electronApp);
  });

  test('VPN panel opens with IPsec S2S tab', async () => {
    await navigateToPanel(page, 'VPN');
    await expect(page.getByRole('button', { name: /IPsec S2S/i }).last()).toBeVisible({ timeout: 8000 });
  });

  test('IPsec S2S tab shows peers table', async () => {
    await navigateToPanel(page, 'VPN');
    await openTab(page, 'IPsec S2S');
    await expect(page.getByRole('columnheader', { name: 'Peer' })).toBeVisible({ timeout: 8000 });
  });

  test('IKE Groups tab is available', async () => {
    await navigateToPanel(page, 'VPN');
    await expect(page.getByRole('button', { name: /IKE Groups/i }).last()).toBeVisible({ timeout: 8000 });
  });

  test('ESP Groups tab is available', async () => {
    await navigateToPanel(page, 'VPN');
    await expect(page.getByRole('button', { name: /ESP Groups/i }).last()).toBeVisible({ timeout: 8000 });
  });

  test('Interfaces panel shows VTI interface', async () => {
    await navigateToPanel(page, 'Interfaces');
    await expect(page.getByRole('cell', { name: 'vti1' })).toBeVisible({ timeout: 8000 });
  });

  test('Interfaces panel shows ethernet interfaces', async () => {
    await navigateToPanel(page, 'Interfaces');
    await expect(page.getByRole('cell', { name: 'eth0' })).toBeVisible({ timeout: 8000 });
    await expect(page.getByRole('cell', { name: 'eth1' })).toBeVisible({ timeout: 8000 });
  });

  test('no API calls made in file mode', async () => {
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
