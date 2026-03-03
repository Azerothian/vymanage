import { test, expect, type ElectronApplication, type Page } from '@playwright/test';
import { DMVPN_CONFIG } from '../fixtures/configs/dmvpn-config';
import { openConfigInElectron } from '../fixtures/electron-file-mode-helpers';
import { launchApp, closeApp, navigateToPanel, openTab } from '../fixtures/helpers';

test.describe('Config Example: DMVPN Dual-Hub', () => {
  let electronApp: ElectronApplication;
  let page: Page;

  test.beforeEach(async () => {
    ({ electronApp, page } = await launchApp());
    await openConfigInElectron(electronApp, page, DMVPN_CONFIG, 'dmvpn.json');
  });

  test.afterEach(async () => {
    await closeApp(electronApp);
  });

  test('VPN panel opens with DMVPN tab available', async () => {
    await navigateToPanel(page, 'VPN');
    await expect(page.getByRole('button', { name: /DMVPN/i }).last()).toBeVisible({ timeout: 8000 });
  });

  test('DMVPN tab renders without crashing', async () => {
    await navigateToPanel(page, 'VPN');
    await openTab(page, 'DMVPN');
    // After clicking DMVPN tab, the tab button should remain visible (no crash)
    await expect(page.getByRole('button', { name: /DMVPN/i }).last()).toBeVisible({ timeout: 8000 });
  });

  test('Interfaces panel shows tunnel interfaces', async () => {
    await navigateToPanel(page, 'Interfaces');
    await expect(page.getByRole('cell', { name: 'tun100' })).toBeVisible({ timeout: 8000 });
    await expect(page.getByRole('cell', { name: 'tun101' })).toBeVisible({ timeout: 8000 });
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
    await openTab(page, 'DMVPN');
    expect(apiCalls).toHaveLength(0);
  });
});
