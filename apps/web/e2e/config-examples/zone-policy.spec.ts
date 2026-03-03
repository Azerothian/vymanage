import { test, expect } from '@playwright/test';
import { ZONE_POLICY_CONFIG } from '../fixtures/configs/zone-policy-config';
import { uploadConfigAndEnterFileMode } from '../fixtures/file-mode-helpers';
import { navigateToPanel, openTab } from '../fixtures/helpers';

test.describe('Config Example: Zone-Based Firewall', () => {
  test.beforeEach(async ({ page }) => {
    await uploadConfigAndEnterFileMode(page, ZONE_POLICY_CONFIG, 'zone-policy.json');
  });

  test('Firewall panel opens with tab buttons visible', async ({ page }) => {
    await navigateToPanel(page, 'Firewall');
    await expect(page.getByRole('button', { name: /Zones/i }).last()).toBeVisible({ timeout: 8000 });
    await expect(page.getByRole('button', { name: /IPv4 Rules/i }).last()).toBeVisible();
    await expect(page.getByRole('button', { name: /IPv6 Rules/i }).last()).toBeVisible();
  });

  test('IPv4 Rules tab shows rule set names in dropdown', async ({ page }) => {
    await navigateToPanel(page, 'Firewall');
    await openTab(page, 'IPv4 Rules');
    // Rule sets appear as <option> elements in a <select> combobox
    await expect(page.locator('select option').filter({ hasText: 'lan-dmz' })).toBeAttached({ timeout: 8000 });
    await expect(page.locator('select option').filter({ hasText: 'wan-dmz' })).toBeAttached();
    await expect(page.locator('select option').filter({ hasText: 'wan-lan' })).toBeAttached();
  });

  test('IPv6 Rules tab shows rule set names in dropdown', async ({ page }) => {
    await navigateToPanel(page, 'Firewall');
    await openTab(page, 'IPv6 Rules');
    await expect(page.locator('select option').filter({ hasText: 'lan-dmz-6' })).toBeAttached({ timeout: 8000 });
  });

  test('Interfaces panel shows ethernet interface', async ({ page }) => {
    await navigateToPanel(page, 'Interfaces');
    await expect(page.getByText('eth0')).toBeVisible({ timeout: 8000 });
  });

  test('no API calls made in file mode', async ({ page }) => {
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
