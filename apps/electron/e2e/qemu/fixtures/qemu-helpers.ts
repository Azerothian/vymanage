import { _electron, type ElectronApplication, type Page, expect } from '@playwright/test';
import * as path from 'path';

const ELECTRON_MAIN = path.join(__dirname, '..', '..', '..', 'dist', 'main.js');
const QEMU_HOST = process.env.VYOS_QEMU_HOST ?? '127.0.0.1';
const QEMU_PORT = process.env.VYOS_QEMU_PORT ?? '8443';
const QEMU_API_KEY = process.env.VYOS_QEMU_API_KEY ?? 'e2e-test-api-key';

export async function launchQemuApp(): Promise<{ electronApp: ElectronApplication; page: Page }> {
  const electronApp = await _electron.launch({
    args: [
      ELECTRON_MAIN,
      '--host', `${QEMU_HOST}:${QEMU_PORT}`,
      '--key', QEMU_API_KEY,
      '--insecure',
    ],
  });
  const page = await electronApp.firstWindow();
  await page.waitForLoadState('domcontentloaded');
  return { electronApp, page };
}

export async function closeQemuApp(electronApp: ElectronApplication): Promise<void> {
  await electronApp.close();
}

export async function waitForConnected(page: Page): Promise<void> {
  await expect(page.getByText('vyos-qemu')).toBeVisible({ timeout: 30_000 });
}

export async function navigateToPanel(page: Page, panelName: string): Promise<void> {
  await page.locator('nav, [role="navigation"]').getByText(panelName).click({ force: true });
  await page.waitForTimeout(1000);
}
