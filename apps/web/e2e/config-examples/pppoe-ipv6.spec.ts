import { test, expect } from '@playwright/test';
import { PPPOE_IPV6_CONFIG } from '../fixtures/configs/pppoe-ipv6-config';
import { uploadConfigAndEnterFileMode } from '../fixtures/file-mode-helpers';
import { navigateToPanel, openTab } from '../fixtures/helpers';

test.describe('Config Example: PPPoE IPv6', () => {
  test.beforeEach(async ({ page }) => {
    await uploadConfigAndEnterFileMode(page, PPPOE_IPV6_CONFIG, 'pppoe-ipv6.json');
  });

  test('Interfaces panel shows PPPoE interface', async ({ page }) => {
    await navigateToPanel(page, 'Interfaces');
    await expect(page.getByText('pppoe0')).toBeVisible({ timeout: 8000 });
  });

  test('Interfaces panel shows LAN interface', async ({ page }) => {
    await navigateToPanel(page, 'Interfaces');
    await expect(page.getByText('eth1')).toBeVisible({ timeout: 8000 });
  });

  test('IPv6 Rules tab shows WAN_IN rule set in dropdown', async ({ page }) => {
    await navigateToPanel(page, 'Firewall');
    await openTab(page, 'IPv6 Rules');
    await expect(page.locator('select option').filter({ hasText: 'WAN_IN' })).toBeAttached({ timeout: 8000 });
  });

  test('IPv6 Rules tab shows WAN_LOCAL rule set in dropdown', async ({ page }) => {
    await navigateToPanel(page, 'Firewall');
    await openTab(page, 'IPv6 Rules');
    await expect(page.locator('select option').filter({ hasText: 'WAN_LOCAL' })).toBeAttached({ timeout: 8000 });
  });

  test('no API calls made in file mode', async ({ page }) => {
    const apiCalls: string[] = [];
    await page.route('**/{configure,retrieve,config-file}', (route) => {
      apiCalls.push(route.request().url());
      return route.continue();
    });
    await navigateToPanel(page, 'Interfaces');
    expect(apiCalls).toHaveLength(0);
  });
});
