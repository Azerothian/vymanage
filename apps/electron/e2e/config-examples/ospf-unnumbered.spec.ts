import { test, expect, type ElectronApplication, type Page } from '@playwright/test';
import { OSPF_UNNUMBERED_CONFIG } from '../fixtures/configs/ospf-unnumbered-config';
import { openConfigInElectron } from '../fixtures/electron-file-mode-helpers';
import { launchApp, closeApp, navigateToPanel, openTab } from '../fixtures/helpers';

test.describe('Config Example: OSPF Unnumbered', () => {
  let electronApp: ElectronApplication;
  let page: Page;

  test.beforeEach(async () => {
    ({ electronApp, page } = await launchApp());
    await openConfigInElectron(electronApp, page, OSPF_UNNUMBERED_CONFIG, 'ospf-unnumbered.json');
  });

  test.afterEach(async () => {
    await closeApp(electronApp);
  });

  test('Routing panel opens with OSPF tab available', async () => {
    await navigateToPanel(page, 'Routing / Protocols');
    await expect(page.getByRole('button', { name: /^OSPF$/i }).last()).toBeVisible({ timeout: 8000 });
  });

  test('OSPF tab renders without crashing', async () => {
    await navigateToPanel(page, 'Routing / Protocols');
    await openTab(page, '^OSPF$');
    // After clicking OSPF tab, the tab button should remain visible (no crash)
    await expect(page.getByRole('button', { name: /^OSPF$/i }).last()).toBeVisible({ timeout: 8000 });
  });

  test('Interfaces panel shows ethernet interfaces with addresses', async () => {
    await navigateToPanel(page, 'Interfaces');
    await expect(page.getByRole('cell', { name: 'eth0' })).toBeVisible({ timeout: 8000 });
    await expect(page.getByText('10.0.0.1/24')).toBeVisible({ timeout: 8000 });
  });

  test('no API calls made in file mode', async () => {
    const apiCalls: string[] = [];
    await page.route('**/{configure,retrieve,config-file}', (route) => {
      apiCalls.push(route.request().url());
      return route.continue();
    });
    await navigateToPanel(page, 'Routing / Protocols');
    await openTab(page, '^OSPF$');
    await page.waitForTimeout(500);
    expect(apiCalls).toHaveLength(0);
  });
});
