import { Page, expect } from '@playwright/test';

/**
 * Upload a JSON config object via the file input and wait for file mode to activate.
 */
export async function uploadConfigAndEnterFileMode(
  page: Page,
  config: Record<string, unknown>,
  fileName = 'test-config.json',
): Promise<void> {
  await page.goto('/');

  // Click the "Open Config File" trigger if present
  const openFileBtn = page.getByRole('button', { name: /open config file/i });
  if (await openFileBtn.isVisible()) {
    await openFileBtn.click();
  }

  // Use setInputFiles to simulate file selection
  await page.locator('input[type="file"]').setInputFiles({
    name: fileName,
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(config, null, 2)),
  });

  // Wait for the app to enter file mode — look for the file name in the header
  await expect(
    page.getByText(new RegExp(fileName.replace('.', '\\.'), 'i')),
  ).toBeVisible({ timeout: 8000 });
}
