import { test, expect, type ElectronApplication, type Page } from '@playwright/test';
import { EMPTY_CONFIG } from '../fixtures/configs/empty-config';
import { openConfigInElectron } from '../fixtures/electron-file-mode-helpers';
import { launchApp, closeApp, navigateToPanel, openTab } from '../fixtures/helpers';

/**
 * Navigate to a panel using exact text matching to avoid ambiguity.
 */
async function navigateToPanelExact(page: Page, panelName: string) {
  await page.locator('nav, [role="navigation"]').getByText(panelName, { exact: true }).click();
  await page.waitForTimeout(500);
}

/**
 * Assert that the panel renders without crashing.
 */
async function expectPanelRendersCleanly(page: Page) {
  await page.waitForTimeout(1000);
  const errorOverlay = page.locator('#__next-build-error, [data-nextjs-dialog]');
  await expect(errorOverlay).toHaveCount(0);
  const jsonPreBlocks = page.locator('pre').filter({ hasText: /^\s*\{/ });
  await expect(jsonPreBlocks).toHaveCount(0);
}

test.describe('Config Example: Empty Config (Empty State Rendering)', () => {
  let electronApp: ElectronApplication;
  let page: Page;

  test.beforeEach(async () => {
    ({ electronApp, page } = await launchApp());
    await openConfigInElectron(electronApp, page, EMPTY_CONFIG, 'empty-config.json');
  });

  test.afterEach(async () => {
    await closeApp(electronApp);
  });

  test('Firewall panel renders without errors', async () => {
    await navigateToPanel(page, 'Firewall');
    await expectPanelRendersCleanly(page);
    await expect(page.getByText(/select or create/i)).toBeVisible({ timeout: 8000 });
  });

  test('VPN panel renders without crashing', async () => {
    await navigateToPanel(page, 'VPN');
    await expectPanelRendersCleanly(page);
    await expect(page.getByRole('button', { name: /ipsec s2s/i }).last()).toBeVisible({ timeout: 8000 });
  });

  test('Services panel renders without crashing', async () => {
    await navigateToPanel(page, 'Services');
    await expectPanelRendersCleanly(page);
    await expect(page.getByRole('button', { name: /dhcp/i }).first()).toBeVisible({ timeout: 8000 });
  });

  test('HA VRRP tab renders without crashing', async () => {
    await navigateToPanel(page, 'High Availability');
    await openTab(page, 'VRRP');
    await expectPanelRendersCleanly(page);
    await expect(page.getByRole('button', { name: /vrrp/i }).last()).toBeVisible({ timeout: 8000 });
  });

  test('PKI panel renders without crashing', async () => {
    await navigateToPanel(page, 'PKI');
    await expectPanelRendersCleanly(page);
    await expect(page.getByRole('button', { name: /ca/i }).first()).toBeVisible({ timeout: 8000 });
  });

  test('Protocols panel renders without crashing', async () => {
    await navigateToPanel(page, 'Routing / Protocols');
    await expectPanelRendersCleanly(page);
    await expect(page.getByRole('button', { name: /static/i }).first()).toBeVisible({ timeout: 8000 });
  });

  test('Containers panel renders without crashing', async () => {
    await navigateToPanel(page, 'Containers');
    await expectPanelRendersCleanly(page);
    await expect(page.getByRole('button', { name: /containers/i }).first()).toBeVisible({ timeout: 8000 });
  });

  test('Policy panel renders without crashing', async () => {
    await navigateToPanelExact(page, 'Policy');
    await expectPanelRendersCleanly(page);
    await expect(page.getByRole('button', { name: /route maps/i }).first()).toBeVisible({ timeout: 8000 });
  });

  test('System panel shows hostname vyos-empty', async () => {
    await navigateToPanel(page, 'System');
    await expect(page.getByText('vyos-empty')).toBeVisible({ timeout: 8000 });
  });
});
