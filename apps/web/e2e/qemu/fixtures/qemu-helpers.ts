import { Page, expect } from '@playwright/test';

const QEMU_HOST = process.env.VYOS_QEMU_HOST ?? '127.0.0.1';
const QEMU_PORT = process.env.VYOS_QEMU_PORT ?? '8443';
const QEMU_API_KEY = process.env.VYOS_QEMU_API_KEY ?? 'e2e-test-api-key';

export async function loginToQemu(page: Page): Promise<void> {
  await page.goto('/');
  await page.getByLabel(/host/i).fill(`${QEMU_HOST}:${QEMU_PORT}`);
  await page.getByLabel(/api key/i).fill(QEMU_API_KEY);
  // Check the insecure/self-signed checkbox if present
  const insecureCheckbox = page.getByLabel(/insecure|self-signed|skip.*verif/i);
  if (await insecureCheckbox.isVisible({ timeout: 2000 }).catch(() => false)) {
    await insecureCheckbox.check();
  }
  await page.getByRole('button', { name: /connect/i }).click();
  // Wait for successful connection — hostname appears in header
  await expect(page.getByText('vyos-qemu')).toBeVisible({ timeout: 30_000 });
}

export async function navigateToPanel(page: Page, panelName: string): Promise<void> {
  await page.locator('nav, [role="navigation"]').getByText(panelName).click();
  await page.waitForTimeout(1000);
}

export async function openTab(page: Page, tabName: string): Promise<void> {
  await page.getByRole('button', { name: new RegExp(tabName, 'i') }).last().click();
  await page.waitForTimeout(500);
}
