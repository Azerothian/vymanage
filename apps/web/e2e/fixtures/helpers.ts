import { Page, expect } from '@playwright/test';

export async function login(page: Page): Promise<void> {
  await page.goto('/');
  await page.getByLabel(/host/i).fill('192.168.1.1');
  await page.getByLabel(/api key/i).fill('test-api-key');
  await page.getByRole('button', { name: /connect/i }).click();
  // Wait for main UI to load (hostname appears in header after successful connect)
  await expect(page.getByText('vyos-router')).toBeVisible({ timeout: 10000 });
}

export async function navigateToPanel(page: Page, panelName: string): Promise<void> {
  // Click the panel label in the sidebar navigation
  await page.locator('nav, [role="navigation"]').getByText(panelName).click();
  // Wait for panel content to appear
  await page.waitForTimeout(500);
}

export async function openTab(page: Page, tabName: string): Promise<void> {
  // Tab buttons are plain <button> elements (not role="tab").
  // They appear in both sidebar submenu and panel content area.
  // Use .last() to target the panel content tab (appears after sidebar in DOM).
  await page.getByRole('button', { name: new RegExp(tabName, 'i') }).last().click();
  await page.waitForTimeout(300);
}
