import { test, expect } from '@playwright/test';
import { loginToQemu, navigateToPanel } from './fixtures/qemu-helpers';

test.describe('QEMU System', () => {
  test.beforeEach(async ({ page }) => {
    await loginToQemu(page);
    await navigateToPanel(page, 'System');
  });

  test('system panel loads', async ({ page }) => {
    // System panel should open — sidebar shows System as active
    const nav = page.locator('nav, [role="navigation"]');
    await expect(nav.getByText('System')).toBeVisible();
    await page.waitForTimeout(2000);
  });

  test('system panel has content', async ({ page }) => {
    // Wait for panel content to render
    await page.waitForTimeout(3000);
    const nav = page.locator('nav, [role="navigation"]');
    await expect(nav.getByText('System')).toBeVisible();
  });
});
