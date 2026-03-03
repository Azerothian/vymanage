import { test, expect, type ElectronApplication, type Page } from '@playwright/test';
import { FIREWALL_VRF_CONFIG } from '../fixtures/configs/firewall-vrf-config';
import { openConfigInElectron } from '../fixtures/electron-file-mode-helpers';
import { launchApp, closeApp, navigateToPanel, openTab } from '../fixtures/helpers';

test.describe('Config Example: Firewall + VRF', () => {
  let electronApp: ElectronApplication;
  let page: Page;

  test.beforeEach(async () => {
    ({ electronApp, page } = await launchApp());
    await openConfigInElectron(electronApp, page, FIREWALL_VRF_CONFIG, 'firewall-vrf.json');
  });

  test.afterEach(async () => {
    await closeApp(electronApp);
  });

  test('VRF panel opens and shows VRF table', async () => {
    await navigateToPanel(page, 'VRF');
    // VRF panel should show a table with VRF names
    await expect(page.getByRole('cell', { name: 'LAN', exact: true }).first()).toBeVisible({ timeout: 8000 });
    await expect(page.getByRole('cell', { name: 'MGMT', exact: true }).first()).toBeVisible({ timeout: 8000 });
  });

  test('Firewall panel opens with Global Options tab', async () => {
    await navigateToPanel(page, 'Firewall');
    await expect(page.getByRole('button', { name: /Global Options/i }).last()).toBeVisible({ timeout: 8000 });
  });

  test('NAT44 Source tab shows masquerade rules in table', async () => {
    await navigateToPanel(page, 'NAT');
    await openTab(page, 'NAT44 Source');
    await expect(page.getByRole('cell', { name: /masquerade/i }).first()).toBeVisible({ timeout: 8000 });
  });

  test('NAT44 Source shows pppoe0 as outbound interface', async () => {
    await navigateToPanel(page, 'NAT');
    await openTab(page, 'NAT44 Source');
    await expect(page.getByRole('cell', { name: /pppoe0/i }).first()).toBeVisible({ timeout: 8000 });
  });

  test('Interfaces panel shows PPPoE interface', async () => {
    await navigateToPanel(page, 'Interfaces');
    await expect(page.getByRole('cell', { name: 'pppoe0' }).first()).toBeVisible({ timeout: 8000 });
  });

  test('no API calls made in file mode', async () => {
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
