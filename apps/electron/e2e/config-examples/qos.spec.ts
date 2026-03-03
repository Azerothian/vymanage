import { test, expect, type ElectronApplication, type Page } from '@playwright/test';
import { QOS_CONFIG } from '../fixtures/configs/qos-config';
import { openConfigInElectron } from '../fixtures/electron-file-mode-helpers';
import { launchApp, closeApp, navigateToPanel, openTab } from '../fixtures/helpers';

test.describe('Config Example: QoS Traffic Shaping', () => {
  let electronApp: ElectronApplication;
  let page: Page;

  test.beforeEach(async () => {
    ({ electronApp, page } = await launchApp());
    await openConfigInElectron(electronApp, page, QOS_CONFIG, 'qos.json');
  });

  test.afterEach(async () => {
    await closeApp(electronApp);
  });

  test('Traffic Policy panel opens with Shaper tab', async () => {
    await navigateToPanel(page, 'Traffic Policy / QoS');
    await expect(page.getByRole('button', { name: /Shaper/i }).last()).toBeVisible({ timeout: 8000 });
  });

  test('Shaper tab renders without crashing', async () => {
    await navigateToPanel(page, 'Traffic Policy / QoS');
    await openTab(page, 'Shaper');
    // After clicking Shaper tab, the tab button should remain visible (no crash)
    await expect(page.getByRole('button', { name: /Shaper/i }).last()).toBeVisible({ timeout: 8000 });
  });

  test('Shaper table has Name column', async () => {
    await navigateToPanel(page, 'Traffic Policy / QoS');
    await openTab(page, 'Shaper');
    await expect(page.getByRole('columnheader', { name: 'Name' }).first()).toBeVisible({ timeout: 8000 });
  });

  test('no API calls made in file mode', async () => {
    const apiCalls: string[] = [];
    await page.route('**/{configure,retrieve,config-file}', (route) => {
      apiCalls.push(route.request().url());
      return route.continue();
    });
    await navigateToPanel(page, 'Traffic Policy / QoS');
    await openTab(page, 'Shaper');
    expect(apiCalls).toHaveLength(0);
  });
});
