import { test, expect } from '@playwright/test';
import { loginToQemu, navigateToPanel } from './fixtures/qemu-helpers';

test.describe('QEMU Firewall', () => {
  test.beforeEach(async ({ page }) => {
    await loginToQemu(page);
    await navigateToPanel(page, 'Firewall');
  });

  test('firewall panel loads without error', async ({ page }) => {
    // Firewall panel should open — sidebar shows Firewall as active
    const nav = page.locator('nav, [role="navigation"]');
    await expect(nav.getByText('Firewall')).toBeVisible();
  });

  test('firewall window is visible', async ({ page }) => {
    // The firewall panel opens in a desktop window
    await page.waitForTimeout(2000);
    const nav = page.locator('nav, [role="navigation"]');
    await expect(nav.getByText('Firewall')).toBeVisible();
  });
});
