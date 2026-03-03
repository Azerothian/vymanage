import { test, expect } from '@playwright/test';
import { WAN_LB_CONFIG } from '../fixtures/configs/wan-lb-config';
import { uploadConfigAndEnterFileMode } from '../fixtures/file-mode-helpers';
import { navigateToPanel, openTab } from '../fixtures/helpers';

test.describe('Config Example: WAN Load Balancing', () => {
  test.beforeEach(async ({ page }) => {
    await uploadConfigAndEnterFileMode(page, WAN_LB_CONFIG, 'wan-lb.json');
  });

  test('Load Balancing panel opens with WAN tab', async ({ page }) => {
    await navigateToPanel(page, 'Load Balancing');
    await expect(page.getByRole('button', { name: /WAN/i }).last()).toBeVisible({ timeout: 8000 });
  });

  test('WAN tab renders a table without crashing', async ({ page }) => {
    await navigateToPanel(page, 'Load Balancing');
    await openTab(page, 'WAN');
    // The WAN tab should render at least a table (even if some cells show [object Object])
    await expect(page.locator('table').first()).toBeVisible({ timeout: 8000 });
  });

  test('Interfaces panel shows WAN interfaces', async ({ page }) => {
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
    await navigateToPanel(page, 'Load Balancing');
    await openTab(page, 'WAN');
    expect(apiCalls).toHaveLength(0);
  });
});
