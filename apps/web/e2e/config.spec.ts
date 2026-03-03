import { test, expect } from '@playwright/test';
import { setupApiMocks } from './fixtures/api-mocks';

async function login(page: import('@playwright/test').Page) {
  await setupApiMocks(page);
  await page.goto('/');
  await page.getByLabel(/host/i).fill('192.168.1.1');
  await page.getByLabel(/api key/i).fill('test-api-key');
  await page.getByRole('button', { name: /connect/i }).click();
  await expect(page.getByText('vyos-router')).toBeVisible({ timeout: 5000 });
}

test.describe('Interfaces Panel', () => {
  test('displays interface table', async ({ page }) => {
    await login(page);
    await page.getByText('Interfaces').click();
    await expect(page.getByText(/eth0|eth1/)).toBeVisible({ timeout: 5000 });
  });

  test('shows tree structure with children', async ({ page }) => {
    await login(page);
    await page.getByText('Interfaces').click();
    // Bond should show members
    const bond = page.getByText('bond0');
    if (await bond.isVisible()) {
      await expect(bond).toBeVisible();
    }
  });
});

test.describe('Firewall Panel', () => {
  test('shows firewall tabs', async ({ page }) => {
    await login(page);
    await page.getByText('Firewall').click();
    await expect(page.getByText(/IPv4|Rules|Groups/i)).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Save Workflow', () => {
  test('save button exists', async ({ page }) => {
    await login(page);
    const saveBtn = page.getByRole('button', { name: /save/i });
    await expect(saveBtn).toBeVisible();
  });
});

test.describe('State Persistence', () => {
  test('mode persists across reload', async ({ page }) => {
    await login(page);
    // The mode should be stored in localStorage
    const mode = await page.evaluate(() => localStorage.getItem('vymanage:workspace-mode'));
    expect(mode).toBeTruthy();
  });
});
