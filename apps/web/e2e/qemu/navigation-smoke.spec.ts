import { test, expect } from '@playwright/test';
import { loginToQemu, navigateToPanel } from './fixtures/qemu-helpers';

const PANELS = ['Interfaces', 'Firewall', 'NAT', 'System'];

test.describe('QEMU Navigation Smoke', () => {
  test('navigate all panels without crash', async ({ page }) => {
    await loginToQemu(page);
    for (const panel of PANELS) {
      await navigateToPanel(page, panel);
      // Verify page didn't crash — main content area should be visible
      const content = page.locator('main, [role="main"], .content');
      await expect(content).toBeVisible({ timeout: 10_000 });
    }
  });
});
