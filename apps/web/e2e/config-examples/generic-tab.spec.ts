import { test, expect } from '@playwright/test';
import { HA_VRRP_CONFIG } from '../fixtures/configs/ha-vrrp-config';
import { uploadConfigAndEnterFileMode } from '../fixtures/file-mode-helpers';
import { navigateToPanel, openTab } from '../fixtures/helpers';

/**
 * Navigate to a panel using exact text matching to avoid ambiguity
 * (e.g. "Policy" vs "Traffic Policy / QoS").
 */
async function navigateToPanelExact(page: import('@playwright/test').Page, panelName: string) {
  await page.locator('nav, [role="navigation"]').getByText(panelName, { exact: true }).click();
  await page.waitForTimeout(500);
}

test.describe('Config Example: GenericConfigTab Structured Rendering', () => {
  test.beforeEach(async ({ page }) => {
    await uploadConfigAndEnterFileMode(page, HA_VRRP_CONFIG, 'ha-vrrp.json');
  });

  test('BGP tab renders structured data, not raw JSON', async ({ page }) => {
    await navigateToPanel(page, 'Routing / Protocols');
    await openTab(page, 'BGP');
    await page.waitForTimeout(1000);
    // Should NOT have raw JSON pre blocks with curly braces
    const jsonPreBlocks = page.locator('pre').filter({ hasText: /^\s*\{/ });
    await expect(jsonPreBlocks).toHaveCount(0);
  });

  test('OSPF tab renders structured content', async ({ page }) => {
    await navigateToPanel(page, 'Routing / Protocols');
    await openTab(page, 'OSPF');
    await page.waitForTimeout(1000);
    const jsonPreBlocks = page.locator('pre').filter({ hasText: /^\s*\{/ });
    await expect(jsonPreBlocks).toHaveCount(0);
  });

  test('Static tab renders table with route data', async ({ page }) => {
    await navigateToPanel(page, 'Routing / Protocols');
    await openTab(page, 'Static');
    await expect(page.locator('table')).toBeVisible({ timeout: 8000 });
    // HA_VRRP_CONFIG has route 0.0.0.0/0
    await expect(page.getByText('0.0.0.0/0')).toBeVisible();
  });

  test('SSH tab renders without raw JSON', async ({ page }) => {
    await navigateToPanel(page, 'Services');
    await openTab(page, 'SSH');
    await page.waitForTimeout(1000);
    const jsonPreBlocks = page.locator('pre').filter({ hasText: /^\s*\{/ });
    await expect(jsonPreBlocks).toHaveCount(0);
  });

  test('Conntrack Sync tab renders structured data', async ({ page }) => {
    await navigateToPanel(page, 'Services');
    // The tab name in the menu is just the service name
    // service.conntrack-sync - need to check exact tab label
    await openTab(page, 'Conntrack');
    await page.waitForTimeout(1000);
    const jsonPreBlocks = page.locator('pre').filter({ hasText: /^\s*\{/ });
    await expect(jsonPreBlocks).toHaveCount(0);
  });

  test('Route Maps tab shows table with BGPOUT entries', async ({ page }) => {
    await navigateToPanelExact(page, 'Policy');
    await openTab(page, 'Route Maps');
    await expect(page.locator('table')).toBeVisible({ timeout: 8000 });
    await expect(page.getByText('BGPOUT').first()).toBeVisible();
  });

  test('Prefix Lists tab shows table with BGPOUT rules', async ({ page }) => {
    await navigateToPanelExact(page, 'Policy');
    await openTab(page, 'Prefix Lists');
    await expect(page.locator('table')).toBeVisible({ timeout: 8000 });
    await expect(page.getByText('BGPOUT').first()).toBeVisible();
  });

  test('Access Lists tab shows table with entries', async ({ page }) => {
    await navigateToPanelExact(page, 'Policy');
    await openTab(page, 'Access Lists');
    await expect(page.locator('table')).toBeVisible({ timeout: 8000 });
    // HA_VRRP_CONFIG has access-list 150
    await expect(page.getByText('150').first()).toBeVisible();
  });
});
