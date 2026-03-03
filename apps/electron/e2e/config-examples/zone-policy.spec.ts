import { test, expect, type ElectronApplication, type Page } from '@playwright/test';
import { ZONE_POLICY_CONFIG } from '../fixtures/configs/zone-policy-config';
import { openConfigInElectron } from '../fixtures/electron-file-mode-helpers';
import { launchApp, closeApp, navigateToPanel, openTab } from '../fixtures/helpers';

test.describe('Config Example: Zone-Based Firewall', () => {
  let electronApp: ElectronApplication;
  let page: Page;

  test.beforeEach(async () => {
    ({ electronApp, page } = await launchApp());
    await openConfigInElectron(electronApp, page, ZONE_POLICY_CONFIG, 'zone-policy.json');
  });

  test.afterEach(async () => {
    await closeApp(electronApp);
  });

  test('Firewall panel opens with tab buttons visible', async () => {
    await navigateToPanel(page, 'Firewall');
    await expect(page.getByRole('button', { name: /Zones/i }).last()).toBeVisible({ timeout: 8000 });
    await expect(page.getByRole('button', { name: /IPv4 Rules/i }).last()).toBeVisible({ timeout: 8000 });
    await expect(page.getByRole('button', { name: /IPv6 Rules/i }).last()).toBeVisible({ timeout: 8000 });
  });

  test('IPv4 Rules tab shows rule set names in dropdown', async () => {
    await navigateToPanel(page, 'Firewall');
    await openTab(page, 'IPv4 Rules');
    // Rule sets appear as <option> elements in a <select> combobox
    await expect(page.locator('select option').filter({ hasText: 'lan-dmz' })).toBeAttached({ timeout: 8000 });
  });

  test('IPv6 Rules tab shows rule set names in dropdown', async () => {
    await navigateToPanel(page, 'Firewall');
    await openTab(page, 'IPv6 Rules');
    await expect(page.locator('select option').filter({ hasText: 'lan-dmz-6' })).toBeAttached({ timeout: 8000 });
  });

  test('Interfaces panel shows ethernet interface', async () => {
    await navigateToPanel(page, 'Interfaces');
    await expect(page.getByText('eth0')).toBeVisible({ timeout: 8000 });
  });

  test('no API calls made in file mode', async () => {
    const apiCalls: string[] = [];
    await page.route('**/{configure,retrieve,config-file}', (route) => {
      apiCalls.push(route.request().url());
      return route.continue();
    });
    await navigateToPanel(page, 'Firewall');
    await openTab(page, 'IPv4 Rules');
    expect(apiCalls).toHaveLength(0);
  });
});
