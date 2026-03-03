import { test, expect } from '@playwright/test';
import { QOS_CONFIG } from '../fixtures/configs/qos-config';
import { uploadConfigAndEnterFileMode } from '../fixtures/file-mode-helpers';
import { navigateToPanel, openTab } from '../fixtures/helpers';

test.describe('Config Example: QoS Traffic Shaping', () => {
  test.beforeEach(async ({ page }) => {
    await uploadConfigAndEnterFileMode(page, QOS_CONFIG, 'qos.json');
  });

  test('Traffic Policy panel opens with Shaper tab', async ({ page }) => {
    await navigateToPanel(page, 'Traffic Policy / QoS');
    await expect(page.getByRole('button', { name: /Shaper/i }).last()).toBeVisible({ timeout: 8000 });
  });

  test('Shaper tab shows policy names table', async ({ page }) => {
    await navigateToPanel(page, 'Traffic Policy / QoS');
    await openTab(page, 'Shaper');
    await expect(page.locator('table')).toBeVisible({ timeout: 8000 });
    await expect(page.getByRole('cell', { name: 'vyos3' })).toBeVisible();
  });

  test('Shaper table has Name column', async ({ page }) => {
    await navigateToPanel(page, 'Traffic Policy / QoS');
    await openTab(page, 'Shaper');
    await expect(page.getByRole('columnheader', { name: 'Name' })).toBeVisible({ timeout: 8000 });
  });

  test('no API calls made in file mode', async ({ page }) => {
    const apiCalls: string[] = [];
    await page.route('**/{configure,retrieve,config-file}', (route) => {
      apiCalls.push(route.request().url());
      return route.continue();
    });
    await navigateToPanel(page, 'Traffic Policy / QoS');
    await openTab(page, 'Shaper');
    expect(apiCalls).toHaveLength(0);
  });
});
