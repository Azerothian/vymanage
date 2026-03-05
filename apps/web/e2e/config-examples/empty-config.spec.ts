import { test, expect } from '@playwright/test';
import { EMPTY_CONFIG } from '../fixtures/configs/empty-config';
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

/**
 * Assert that the panel renders without crashing (no unhandled React error overlay).
 * Some panels show "Not Configured" / "No X configured" / "Failed to load" with
 * empty config — we just verify no full-page crash occurs.
 */
async function expectPanelRendersCleanly(page: import('@playwright/test').Page) {
  await page.waitForTimeout(1000);
  // Should not have a React/Next.js error overlay (unhandled exception)
  const errorOverlay = page.locator('#__next-build-error, [data-nextjs-dialog]');
  await expect(errorOverlay).toHaveCount(0);
  // Should not show raw JSON <pre> blocks
  const jsonPreBlocks = page.locator('pre').filter({ hasText: /^\s*\{/ });
  await expect(jsonPreBlocks).toHaveCount(0);
}

test.describe('Config Example: Empty Config (Empty State Rendering)', () => {
  test.beforeEach(async ({ page }) => {
    await uploadConfigAndEnterFileMode(page, EMPTY_CONFIG, 'empty-config.json');
  });

  test('Firewall panel renders without errors', async ({ page }) => {
    await navigateToPanel(page, 'Firewall');
    await expectPanelRendersCleanly(page);
    // Firewall shows "Select or create a rule set" when empty
    await expect(page.getByText(/select or create/i)).toBeVisible({ timeout: 8000 });
  });

  test('VPN panel renders without crashing', async ({ page }) => {
    await navigateToPanel(page, 'VPN');
    await expectPanelRendersCleanly(page);
    // VPN panel tab bar should be visible (sidebar + panel both have tabs — use .last())
    await expect(page.getByRole('button', { name: /ipsec s2s/i }).last()).toBeVisible({ timeout: 8000 });
  });

  test('Services panel renders without crashing', async ({ page }) => {
    await navigateToPanel(page, 'Services');
    await expectPanelRendersCleanly(page);
    // Services tab bar should be visible
    await expect(page.getByRole('button', { name: /dhcp/i }).first()).toBeVisible({ timeout: 8000 });
  });

  test('HA VRRP tab renders without crashing', async ({ page }) => {
    await navigateToPanel(page, 'High Availability');
    await openTab(page, 'VRRP');
    await expectPanelRendersCleanly(page);
    // With empty config, HA panel shows empty state or handled error
    await expect(page.getByRole('button', { name: /vrrp/i }).last()).toBeVisible({ timeout: 8000 });
  });

  test('PKI panel renders without crashing', async ({ page }) => {
    await navigateToPanel(page, 'PKI');
    await expectPanelRendersCleanly(page);
    // PKI tab bar should be visible
    await expect(page.getByRole('button', { name: /ca/i }).first()).toBeVisible({ timeout: 8000 });
  });

  test('Protocols panel renders without crashing', async ({ page }) => {
    await navigateToPanel(page, 'Routing / Protocols');
    await expectPanelRendersCleanly(page);
    // Tab bar should be visible
    await expect(page.getByRole('button', { name: /static/i }).first()).toBeVisible({ timeout: 8000 });
  });

  test('Containers panel renders without crashing', async ({ page }) => {
    await navigateToPanel(page, 'Containers');
    await expectPanelRendersCleanly(page);
    await expect(page.getByRole('button', { name: /containers/i }).first()).toBeVisible({ timeout: 8000 });
  });

  test('Policy panel renders without crashing', async ({ page }) => {
    await navigateToPanelExact(page, 'Policy');
    await expectPanelRendersCleanly(page);
    await expect(page.getByRole('button', { name: /route maps/i }).first()).toBeVisible({ timeout: 8000 });
  });

  test('System panel shows hostname vyos-empty', async ({ page }) => {
    await navigateToPanel(page, 'System');
    await expect(page.getByText('vyos-empty')).toBeVisible({ timeout: 8000 });
  });

  test('no API calls made in file mode', async ({ page }) => {
    const apiCalls: string[] = [];
    await page.route('**/{configure,retrieve,config-file}', (route) => {
      apiCalls.push(route.request().url());
      return route.continue();
    });
    await navigateToPanel(page, 'Firewall');
    await page.waitForTimeout(1000);
    await navigateToPanel(page, 'VPN');
    await page.waitForTimeout(1000);
    expect(apiCalls).toHaveLength(0);
  });
});
