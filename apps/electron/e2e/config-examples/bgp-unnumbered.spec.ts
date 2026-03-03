import { test, expect, type ElectronApplication, type Page } from '@playwright/test';
import { BGP_UNNUMBERED_CONFIG } from '../fixtures/configs/bgp-unnumbered-config';
import { openConfigInElectron } from '../fixtures/electron-file-mode-helpers';
import { launchApp, closeApp, navigateToPanel, openTab } from '../fixtures/helpers';

test.describe('Config Example: BGP IPv6 Unnumbered', () => {
  let electronApp: ElectronApplication;
  let page: Page;

  test.beforeEach(async () => {
    ({ electronApp, page } = await launchApp());
    await openConfigInElectron(electronApp, page, BGP_UNNUMBERED_CONFIG, 'bgp-unnumbered.json');
  });

  test.afterEach(async () => {
    await closeApp(electronApp);
  });

  test('Routing panel opens with BGP tab available', async () => {
    await navigateToPanel(page, 'Routing / Protocols');
    await expect(page.getByRole('button', { name: /^BGP$/i }).last()).toBeVisible({ timeout: 8000 });
  });

  test('BGP tab renders config JSON without crashing', async () => {
    await navigateToPanel(page, 'Routing / Protocols');
    await openTab(page, '^BGP$');
    // BGP config data should render — look for system-as value
    await expect(page.getByText('64496')).toBeVisible({ timeout: 8000 });
  });

  test('Interfaces panel shows ethernet interfaces', async () => {
    await navigateToPanel(page, 'Interfaces');
    await expect(page.getByRole('cell', { name: 'eth1' })).toBeVisible({ timeout: 8000 });
    await expect(page.getByRole('cell', { name: 'eth2' })).toBeVisible({ timeout: 8000 });
  });

  test('Interfaces panel shows loopback interface', async () => {
    await navigateToPanel(page, 'Interfaces');
    await expect(page.getByRole('cell', { name: /^lo$/ })).toBeVisible({ timeout: 8000 });
  });

  test('no API calls made in file mode', async () => {
    const apiCalls: string[] = [];
    await page.route('**/{configure,retrieve,config-file}', (route) => {
      apiCalls.push(route.request().url());
      return route.continue();
    });
    await navigateToPanel(page, 'Routing / Protocols');
    await openTab(page, '^BGP$');
    await page.waitForTimeout(500);
    expect(apiCalls).toHaveLength(0);
  });
});
