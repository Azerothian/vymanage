import { test, expect } from '@playwright/test';
import { launchQemuApp, closeQemuApp, waitForConnected, navigateToPanel } from './fixtures/qemu-helpers';

const PANELS = ['Interfaces', 'Firewall', 'NAT', 'System'];

test.describe('QEMU Electron Navigation Smoke', () => {
  test('navigate all panels without crash', async () => {
    const { electronApp, page } = await launchQemuApp();
    try {
      await waitForConnected(page);
      for (const panel of PANELS) {
        await navigateToPanel(page, panel);
        const nav = page.locator('nav, [role="navigation"]');
        await expect(nav.getByText(panel, { exact: true }).first()).toBeVisible({ timeout: 10_000 });
      }
    } finally {
      await closeQemuApp(electronApp);
    }
  });
});
