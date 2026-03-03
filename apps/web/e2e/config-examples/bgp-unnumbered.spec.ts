import { test, expect } from '@playwright/test';
import { BGP_UNNUMBERED_CONFIG } from '../fixtures/configs/bgp-unnumbered-config';
import { uploadConfigAndEnterFileMode } from '../fixtures/file-mode-helpers';
import { navigateToPanel } from '../fixtures/helpers';

test.describe('Config Example: BGP IPv6 Unnumbered', () => {
  test.beforeEach(async ({ page }) => {
    await uploadConfigAndEnterFileMode(page, BGP_UNNUMBERED_CONFIG, 'bgp-unnumbered.json');
  });

  test('Routing panel opens with BGP tab available', async ({ page }) => {
    await navigateToPanel(page, 'Routing / Protocols');
    await expect(page.getByRole('button', { name: /^BGP$/i }).last()).toBeVisible({ timeout: 8000 });
  });

  test('BGP tab renders config JSON without crashing', async ({ page }) => {
    await navigateToPanel(page, 'Routing / Protocols');
    await page.getByRole('button', { name: /^BGP$/i }).last().click();
    await page.waitForTimeout(300);
    // BGP config data should render — look for system-as value
    await expect(page.getByText('64496')).toBeVisible({ timeout: 8000 });
  });

  test('Interfaces panel shows ethernet interfaces', async ({ page }) => {
    await navigateToPanel(page, 'Interfaces');
    await expect(page.getByRole('cell', { name: 'eth1' })).toBeVisible({ timeout: 8000 });
    await expect(page.getByRole('cell', { name: 'eth2' })).toBeVisible();
  });

  test('Interfaces panel shows loopback interface', async ({ page }) => {
    await navigateToPanel(page, 'Interfaces');
    await expect(page.getByRole('cell', { name: /^lo$/ })).toBeVisible({ timeout: 8000 });
  });

  test('no API calls made in file mode', async ({ page }) => {
    const apiCalls: string[] = [];
    await page.route('**/{configure,retrieve,config-file}', (route) => {
      apiCalls.push(route.request().url());
      return route.continue();
    });
    await navigateToPanel(page, 'Routing / Protocols');
    await page.getByRole('button', { name: /^BGP$/i }).last().click();
    await page.waitForTimeout(500);
    expect(apiCalls).toHaveLength(0);
  });
});
