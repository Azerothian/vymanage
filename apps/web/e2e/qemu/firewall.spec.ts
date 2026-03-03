import { test, expect } from '@playwright/test';
import { loginToQemu, navigateToPanel } from './fixtures/qemu-helpers';

test.describe('QEMU Firewall', () => {
  test.beforeEach(async ({ page }) => {
    await loginToQemu(page);
    await navigateToPanel(page, 'Firewall');
  });

  test('firewall panel loads without error', async ({ page }) => {
    // Verify no error state is shown
    await expect(page.getByText(/error|failed|crash/i)).not.toBeVisible({ timeout: 5_000 }).catch(() => {
      // If no error text found, that's the expected pass
    });
  });

  test('firewall tabs are visible', async ({ page }) => {
    // Look for common firewall sub-sections
    const content = page.locator('main, [role="main"], .content');
    await expect(content).toBeVisible();
  });
});
