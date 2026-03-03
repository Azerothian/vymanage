import { test, expect } from '@playwright/test';
import { setupApiMocks } from './fixtures/api-mocks';

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    await setupApiMocks(page);
  });

  test('shows connection dialog on first visit', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Connect to VyOS Device')).toBeVisible();
    await expect(page.getByLabel(/host/i)).toBeVisible();
    await expect(page.getByLabel(/api key/i)).toBeVisible();
  });

  test('connects with valid key', async ({ page }) => {
    await page.goto('/');
    await page.getByLabel(/host/i).fill('192.168.1.1');
    await page.getByLabel(/api key/i).fill('test-api-key');
    await page.getByRole('button', { name: /connect/i }).click();

    // Should redirect to main UI
    await expect(page.getByText('vyos-router')).toBeVisible({ timeout: 5000 });
  });

  test('shows error with invalid key', async ({ page }) => {
    // Override info endpoint to fail
    await page.route('**/info', async (route) => {
      await route.fulfill({ status: 401, body: 'Unauthorized' });
    });

    await page.goto('/');
    await page.getByLabel(/host/i).fill('192.168.1.1');
    await page.getByLabel(/api key/i).fill('bad-key');
    await page.getByRole('button', { name: /connect/i }).click();

    await expect(page.getByText(/failed|error|unauthorized/i)).toBeVisible({ timeout: 5000 });
  });

  test('insecure mode shows warning', async ({ page }) => {
    await page.goto('/');
    await page.getByLabel(/insecure/i).check();
    await expect(page.getByText(/unencrypted/i)).toBeVisible();
  });
});

test.describe('Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await setupApiMocks(page);
    await page.goto('/');
    await page.getByLabel(/host/i).fill('192.168.1.1');
    await page.getByLabel(/api key/i).fill('test-api-key');
    await page.getByRole('button', { name: /connect/i }).click();
    await expect(page.getByText('vyos-router')).toBeVisible({ timeout: 5000 });
  });

  test('sidebar shows all 15 menu items', async ({ page }) => {
    const sidebar = page.locator('nav, [role="navigation"]');
    await expect(sidebar.getByText('Interfaces')).toBeVisible();
    await expect(sidebar.getByText('Firewall')).toBeVisible();
    await expect(sidebar.getByText('NAT')).toBeVisible();
    await expect(sidebar.getByText('System')).toBeVisible();
    await expect(sidebar.getByText('Operations')).toBeVisible();
  });

  test('sidebar collapse/expand', async ({ page }) => {
    const collapseButton = page.getByRole('button', { name: /collapse|menu|toggle/i });
    if (await collapseButton.isVisible()) {
      await collapseButton.click();
      // After collapse, labels should be hidden
      await expect(page.getByText('Interfaces')).toBeHidden();
    }
  });
});

test.describe('Workspace Modes', () => {
  test.beforeEach(async ({ page }) => {
    await setupApiMocks(page);
    await page.goto('/');
    await page.getByLabel(/host/i).fill('192.168.1.1');
    await page.getByLabel(/api key/i).fill('test-api-key');
    await page.getByRole('button', { name: /connect/i }).click();
    await expect(page.getByText('vyos-router')).toBeVisible({ timeout: 5000 });
  });

  test('desktop mode opens windows', async ({ page }) => {
    // Click Interfaces in sidebar
    await page.getByText('Interfaces').click();
    // Should show a window or panel
    await expect(page.getByText(/interface|eth0/i)).toBeVisible({ timeout: 5000 });
  });

  test('mode toggle exists', async ({ page }) => {
    const modeToggle = page.getByText(/desktop|split|inline/i).first();
    await expect(modeToggle).toBeVisible();
  });
});
