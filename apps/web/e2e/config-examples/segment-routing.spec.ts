import { test, expect } from '@playwright/test';
import { SEGMENT_ROUTING_CONFIG } from '../fixtures/configs/segment-routing-config';
import { uploadConfigAndEnterFileMode } from '../fixtures/file-mode-helpers';
import { navigateToPanel } from '../fixtures/helpers';

test.describe('Config Example: Segment Routing with IS-IS', () => {
  test.beforeEach(async ({ page }) => {
    await uploadConfigAndEnterFileMode(page, SEGMENT_ROUTING_CONFIG, 'segment-routing.json');
  });

  test('Routing panel opens with ISIS tab available', async ({ page }) => {
    await navigateToPanel(page, 'Routing / Protocols');
    await expect(page.getByRole('button', { name: /^ISIS$/i }).last()).toBeVisible({ timeout: 8000 });
  });

  test('Segment Routing tab is available', async ({ page }) => {
    await navigateToPanel(page, 'Routing / Protocols');
    await expect(page.getByRole('button', { name: /Segment Routing/i }).last()).toBeVisible({ timeout: 8000 });
  });

  test('MPLS tab is available', async ({ page }) => {
    await navigateToPanel(page, 'Routing / Protocols');
    await expect(page.getByRole('button', { name: /MPLS/i }).last()).toBeVisible({ timeout: 8000 });
  });

  test('ISIS tab renders config data without crashing', async ({ page }) => {
    await navigateToPanel(page, 'Routing / Protocols');
    await page.getByRole('button', { name: /^ISIS$/i }).last().click();
    await page.waitForTimeout(300);
    // ISIS config should render as JSON — check for IS-IS net address
    await expect(page.getByText('49.0000.0000.0000.0001.00')).toBeVisible({ timeout: 8000 });
  });

  test('Interfaces panel shows ethernet interfaces', async ({ page }) => {
    await navigateToPanel(page, 'Interfaces');
    await expect(page.getByRole('cell', { name: 'eth1' })).toBeVisible({ timeout: 8000 });
    await expect(page.getByRole('cell', { name: 'eth3' })).toBeVisible();
  });

  test('no API calls made in file mode', async ({ page }) => {
    const apiCalls: string[] = [];
    await page.route('**/{configure,retrieve,config-file}', (route) => {
      apiCalls.push(route.request().url());
      return route.continue();
    });
    await navigateToPanel(page, 'Routing / Protocols');
    await page.getByRole('button', { name: /^ISIS$/i }).last().click();
    await page.waitForTimeout(500);
    expect(apiCalls).toHaveLength(0);
  });
});
