import { test, expect, type ElectronApplication, type Page } from '@playwright/test';
import { SEGMENT_ROUTING_CONFIG } from '../fixtures/configs/segment-routing-config';
import { openConfigInElectron } from '../fixtures/electron-file-mode-helpers';
import { launchApp, closeApp, navigateToPanel, openTab } from '../fixtures/helpers';

test.describe('Config Example: Segment Routing with IS-IS', () => {
  let electronApp: ElectronApplication;
  let page: Page;

  test.beforeEach(async () => {
    ({ electronApp, page } = await launchApp());
    await openConfigInElectron(electronApp, page, SEGMENT_ROUTING_CONFIG, 'segment-routing.json');
  });

  test.afterEach(async () => {
    await closeApp(electronApp);
  });

  test('Routing panel opens with ISIS tab available', async () => {
    await navigateToPanel(page, 'Routing / Protocols');
    await expect(page.getByRole('button', { name: /^ISIS$/i }).last()).toBeVisible({ timeout: 8000 });
  });

  test('Segment Routing tab is available', async () => {
    await navigateToPanel(page, 'Routing / Protocols');
    await expect(page.getByRole('button', { name: /Segment Routing/i }).last()).toBeVisible({ timeout: 8000 });
  });

  test('MPLS tab is available', async () => {
    await navigateToPanel(page, 'Routing / Protocols');
    await expect(page.getByRole('button', { name: /MPLS/i }).last()).toBeVisible({ timeout: 8000 });
  });

  test('ISIS tab renders without crashing', async () => {
    await navigateToPanel(page, 'Routing / Protocols');
    await openTab(page, '^ISIS$');
    // After clicking ISIS tab, the tab button should remain visible (no crash)
    await expect(page.getByRole('button', { name: /^ISIS$/i }).last()).toBeVisible({ timeout: 8000 });
  });

  test('Interfaces panel shows ethernet interfaces', async () => {
    await navigateToPanel(page, 'Interfaces');
    await expect(page.getByRole('cell', { name: 'eth1' })).toBeVisible({ timeout: 8000 });
    await expect(page.getByRole('cell', { name: 'eth3' })).toBeVisible({ timeout: 8000 });
  });

  test('no API calls made in file mode', async () => {
    const apiCalls: string[] = [];
    await page.route('**/{configure,retrieve,config-file}', (route) => {
      apiCalls.push(route.request().url());
      return route.continue();
    });
    await navigateToPanel(page, 'Routing / Protocols');
    await openTab(page, '^ISIS$');
    await page.waitForTimeout(500);
    expect(apiCalls).toHaveLength(0);
  });
});
