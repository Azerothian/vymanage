import { Page, expect } from '@playwright/test';

// Allow self-signed certs for Node.js fetch in route proxy
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const QEMU_HOST = process.env.VYOS_QEMU_HOST ?? '127.0.0.1';
const QEMU_PORT = process.env.VYOS_QEMU_PORT ?? '9443';
const QEMU_API_KEY = process.env.VYOS_QEMU_API_KEY ?? 'e2e-test-api-key';
const VYOS_BASE = `https://${QEMU_HOST}:${QEMU_PORT}`;

/**
 * Set up a CORS proxy via Playwright route interception.
 * The browser can't directly call the VyOS API due to CORS restrictions,
 * so we intercept requests and proxy them through Node.js.
 */
export async function setupApiProxy(page: Page): Promise<void> {
  await page.route(`${VYOS_BASE}/**`, async (route) => {
    const request = route.request();
    try {
      const response = await fetch(request.url(), {
        method: request.method(),
        headers: request.headers(),
        body: request.method() !== 'GET' ? request.postData() ?? undefined : undefined,
      });
      const body = Buffer.from(await response.arrayBuffer());
      await route.fulfill({
        status: response.status,
        contentType: response.headers.get('content-type') ?? 'application/json',
        body,
      });
    } catch {
      await route.abort('connectionfailed');
    }
  });
}

export async function loginToQemu(page: Page): Promise<void> {
  // Set up CORS proxy before navigating
  await setupApiProxy(page);
  await page.goto('/');
  await page.getByLabel(/host/i).fill(`${QEMU_HOST}:${QEMU_PORT}`);
  await page.getByLabel(/api key/i).fill(QEMU_API_KEY);
  // Do NOT check insecure — we want HTTPS, the proxy handles self-signed certs
  await page.getByRole('button', { name: /connect/i }).click();
  // Wait for successful connection — sidebar navigation appears
  const nav = page.locator('nav, [role="navigation"]');
  await expect(nav.getByText('Interfaces')).toBeVisible({ timeout: 30_000 });
  // Give time for device info to load
  await page.waitForTimeout(2000);
}

export async function navigateToPanel(page: Page, panelName: string): Promise<void> {
  await page.locator('nav, [role="navigation"]').getByText(panelName).click();
  await page.waitForTimeout(1000);
}

export async function openTab(page: Page, tabName: string): Promise<void> {
  await page.getByRole('button', { name: new RegExp(tabName, 'i') }).last().click();
  await page.waitForTimeout(500);
}
