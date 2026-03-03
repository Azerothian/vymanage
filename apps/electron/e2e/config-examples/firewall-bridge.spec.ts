import { test, expect, type ElectronApplication, type Page } from '@playwright/test';
import { FIREWALL_BRIDGE_CONFIG } from '../fixtures/configs/firewall-bridge-config';
import { openConfigInElectron } from '../fixtures/electron-file-mode-helpers';
import { launchApp, closeApp, navigateToPanel, openTab } from '../fixtures/helpers';

test.describe('Config Example: Firewall + Bridge', () => {
  let electronApp: ElectronApplication;
  let page: Page;

  test.beforeEach(async () => {
    ({ electronApp, page } = await launchApp());
    await openConfigInElectron(electronApp, page, FIREWALL_BRIDGE_CONFIG, 'firewall-bridge.json');
  });

  test.afterEach(async () => {
    await closeApp(electronApp);
  });

  test('Firewall panel opens with Bridge Rules tab', async () => {
    await navigateToPanel(page, 'Firewall');
    await expect(page.getByRole('button', { name: /Bridge Rules/i }).last()).toBeVisible({ timeout: 8000 });
  });

  test('Bridge Rules tab shows named rule sets in dropdown', async () => {
    await navigateToPanel(page, 'Firewall');
    await openTab(page, 'Bridge Rules');
    // Bridge rule set names appear as <option> elements — check at least one option exists
    await expect(page.locator('select option').first()).toBeAttached({ timeout: 8000 });
  });

  test('Interfaces panel shows bridge interfaces in table', async () => {
    await navigateToPanel(page, 'Interfaces');
    // Bridge interfaces appear in Name cells with expand arrow prefix "▸ br0"
    await expect(page.locator('table').getByText('br0').first()).toBeVisible({ timeout: 8000 });
    await expect(page.locator('table').getByText('br1').first()).toBeVisible({ timeout: 8000 });
    await expect(page.locator('table').getByText('br2').first()).toBeVisible({ timeout: 8000 });
  });

  test('Firewall Groups tab renders without errors', async () => {
    await navigateToPanel(page, 'Firewall');
    await openTab(page, 'Groups');
    // Groups tab should render without crashing — verify the tab button remains active
    await expect(page.getByRole('button', { name: /Groups/i }).last()).toBeVisible({ timeout: 8000 });
  });

  test('no API calls made in file mode', async () => {
    const apiCalls: string[] = [];
    await page.route('**/{configure,retrieve,config-file}', (route) => {
      apiCalls.push(route.request().url());
      return route.continue();
    });
    await navigateToPanel(page, 'Firewall');
    await openTab(page, 'Bridge Rules');
    expect(apiCalls).toHaveLength(0);
  });
});
