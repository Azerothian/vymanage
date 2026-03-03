import { test, expect } from '@playwright/test';
import { OSPF_UNNUMBERED_CONFIG } from '../fixtures/configs/ospf-unnumbered-config';
import { uploadConfigAndEnterFileMode } from '../fixtures/file-mode-helpers';
import { navigateToPanel } from '../fixtures/helpers';

test.describe('Config Example: OSPF Unnumbered', () => {
  test.beforeEach(async ({ page }) => {
    await uploadConfigAndEnterFileMode(page, OSPF_UNNUMBERED_CONFIG, 'ospf-unnumbered.json');
  });

  test('Routing panel opens with OSPF tab available', async ({ page }) => {
    await navigateToPanel(page, 'Routing / Protocols');
    await expect(page.getByRole('button', { name: /^OSPF$/i }).last()).toBeVisible({ timeout: 8000 });
  });

  test('OSPF tab renders config JSON without crashing', async ({ page }) => {
    await navigateToPanel(page, 'Routing / Protocols');
    // Click OSPF specifically (not OSPFv3) — use exact match
    await page.getByRole('button', { name: /^OSPF$/ }).last().click();
    await page.waitForTimeout(300);
    // OSPF config data should render — look for area or router-id
    await expect(page.getByText('0.0.0.0')).toBeVisible({ timeout: 8000 });
  });

  test('Interfaces panel shows ethernet interfaces with addresses', async ({ page }) => {
    await navigateToPanel(page, 'Interfaces');
    await expect(page.getByRole('cell', { name: 'eth0' })).toBeVisible({ timeout: 8000 });
    await expect(page.getByText('10.0.0.1/24')).toBeVisible();
  });

  test('no API calls made in file mode', async ({ page }) => {
    const apiCalls: string[] = [];
    await page.route('**/{configure,retrieve,config-file}', (route) => {
      apiCalls.push(route.request().url());
      return route.continue();
    });
    await navigateToPanel(page, 'Routing / Protocols');
    await page.getByRole('button', { name: /^OSPF$/ }).last().click();
    await page.waitForTimeout(500);
    expect(apiCalls).toHaveLength(0);
  });
});
