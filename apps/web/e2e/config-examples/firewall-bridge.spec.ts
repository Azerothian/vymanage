import { test, expect } from '@playwright/test';
import { FIREWALL_BRIDGE_CONFIG } from '../fixtures/configs/firewall-bridge-config';
import { uploadConfigAndEnterFileMode } from '../fixtures/file-mode-helpers';
import { navigateToPanel, openTab } from '../fixtures/helpers';

test.describe('Config Example: Firewall + Bridge', () => {
  test.beforeEach(async ({ page }) => {
    await uploadConfigAndEnterFileMode(page, FIREWALL_BRIDGE_CONFIG, 'firewall-bridge.json');
  });

  test('Firewall panel opens with Bridge Rules tab', async ({ page }) => {
    await navigateToPanel(page, 'Firewall');
    await expect(page.getByRole('button', { name: /Bridge Rules/i }).last()).toBeVisible({ timeout: 8000 });
  });

  test('Bridge Rules tab shows named rule sets in dropdown', async ({ page }) => {
    await navigateToPanel(page, 'Firewall');
    await openTab(page, 'Bridge Rules');
    // Bridge rule set names appear as <option> elements
    await expect(page.locator('select option').filter({ hasText: 'br0-fwd' })).toBeAttached({ timeout: 8000 });
  });

  test('Interfaces panel shows bridge interfaces in table', async ({ page }) => {
    await navigateToPanel(page, 'Interfaces');
    // Bridge interfaces appear in Name cells with expand arrow prefix "▸ br0"
    await expect(page.locator('table').getByText('br0').first()).toBeVisible({ timeout: 8000 });
    await expect(page.locator('table').getByText('br1').first()).toBeVisible();
    await expect(page.locator('table').getByText('br2').first()).toBeVisible();
  });

  test('Firewall Groups tab renders without errors', async ({ page }) => {
    await navigateToPanel(page, 'Firewall');
    await openTab(page, 'Groups');
    // Groups tab has sub-tabs: Address Groups, Port Groups, Network Groups, Interface Groups
    await expect(page.getByRole('button', { name: /Interface Groups/i })).toBeVisible({ timeout: 8000 });
  });

  test('no API calls made in file mode', async ({ page }) => {
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
