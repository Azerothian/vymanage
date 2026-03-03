import { test, expect } from '@playwright/test';
import { loginToQemu, navigateToPanel } from './fixtures/qemu-helpers';

test.describe('QEMU System', () => {
  test.beforeEach(async ({ page }) => {
    await loginToQemu(page);
    await navigateToPanel(page, 'System');
  });

  test('system panel loads', async ({ page }) => {
    const content = page.locator('main, [role="main"], .content');
    await expect(content).toBeVisible();
  });

  test('hostname vyos-qemu appears in system info', async ({ page }) => {
    await expect(page.getByText('vyos-qemu')).toBeVisible();
  });
});
