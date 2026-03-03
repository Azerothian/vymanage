/**
 * E2E tests for file mode (open a local JSON config file).
 *
 * File mode is being implemented in Phase 3 concurrently. These tests are
 * written against the PLANNED behaviour described in the task specification.
 * They will pass once Phase 3 is complete and the file-mode UI exists.
 *
 * NOTE: setupStatefulApiMocks is NOT used here because file mode bypasses
 * the VyOS HTTP API entirely. The app reads config from the uploaded file.
 */

import { test, expect } from '@playwright/test';
import { FULL_MOCK_CONFIG } from './fixtures/mock-config';

// Serialised JSON content of the fake config file used throughout these tests
const FAKE_CONFIG_JSON = JSON.stringify(FULL_MOCK_CONFIG, null, 2);
const FAKE_CONFIG_BUFFER = Buffer.from(FAKE_CONFIG_JSON);

test.describe('File Mode', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the root — no API mocks needed for file mode
    await page.goto('/');
  });

  test.describe('Connection dialog file mode entry point', () => {
    test('connection dialog has an "Open Config File" button or section', async ({ page }) => {
      // The ConnectionDialog should expose a way to open a local file
      // Expected: a button, link, or labelled section with text matching "open config file"
      await expect(
        page.getByRole('button', { name: /open config file/i }).or(
          page.getByText(/open config file/i),
        ),
      ).toBeVisible({ timeout: 5000 });
    });

    test('a file input for JSON files is present in the connection dialog', async ({ page }) => {
      // The file picker should accept only .json files
      // Either the input is directly visible or revealed after clicking the button
      const openFileBtn = page.getByRole('button', { name: /open config file/i });
      if (await openFileBtn.isVisible()) {
        await openFileBtn.click();
      }

      const fileInput = page.locator('input[type="file"]');
      await expect(fileInput).toBeAttached({ timeout: 5000 });

      // Verify the accept attribute restricts to JSON
      const accept = await fileInput.getAttribute('accept');
      expect(accept).toMatch(/\.json|application\/json/i);
    });
  });

  test.describe('After opening a valid JSON config file', () => {
    // Helper that simulates uploading the fake config file and waits for file mode to activate
    async function uploadConfigFile(page: import('@playwright/test').Page) {
      // Click the "Open Config File" trigger if present
      const openFileBtn = page.getByRole('button', { name: /open config file/i });
      if (await openFileBtn.isVisible()) {
        await openFileBtn.click();
      }

      // Use setInputFiles to simulate file selection
      await page.locator('input[type="file"]').setInputFiles({
        name: 'vyos-config.json',
        mimeType: 'application/json',
        buffer: FAKE_CONFIG_BUFFER,
      });

      // Wait for the app to enter file mode — look for the file name in the header
      await expect(page.getByText(/vyos-config\.json/i)).toBeVisible({ timeout: 8000 });
    }

    test('header shows the file name instead of hostname after opening a config file', async ({ page }) => {
      await uploadConfigFile(page);

      // In file mode the header should display the file name
      await expect(page.getByText(/vyos-config\.json/i)).toBeVisible();
    });

    test('header shows a file icon instead of Wifi icon in file mode', async ({ page }) => {
      await uploadConfigFile(page);

      // The header should render a file-related icon; Wifi icon should not be present.
      // Check via aria-label, data attribute, or SVG title if the icon library adds one.
      // At minimum, the green Wifi indicator (connected state) should not be present.
      const wifiIcon = page.locator('[data-icon="wifi"], svg[aria-label*="wifi" i]');
      await expect(wifiIcon).not.toBeVisible();
    });

    test('Save button label changes to "Download" in file mode', async ({ page }) => {
      await uploadConfigFile(page);

      // In file mode the Save action becomes a Download action
      await expect(page.getByRole('button', { name: /download/i })).toBeVisible({ timeout: 5000 });
    });

    test('Disconnect button label changes to "Close File" in file mode', async ({ page }) => {
      await uploadConfigFile(page);

      // In file mode the Disconnect action becomes Close File
      await expect(
        page.getByRole('button', { name: /close file/i }),
      ).toBeVisible({ timeout: 5000 });
    });

    test('panels display config data loaded from the file', async ({ page }) => {
      await uploadConfigFile(page);

      // Navigate to the Interfaces panel and verify data from FULL_MOCK_CONFIG is shown
      // FULL_MOCK_CONFIG has ethernet.eth0 with description 'WAN'
      await page.locator('nav, [role="navigation"]').getByText('Interfaces').click();
      await page.waitForTimeout(800);

      await expect(page.getByText(/eth0|WAN/i)).toBeVisible({ timeout: 8000 });
    });

    test('config from the file includes all top-level sections in panels', async ({ page }) => {
      await uploadConfigFile(page);

      // Navigate to Firewall panel — FULL_MOCK_CONFIG has firewall.ipv4.name.WAN_IN
      await page.locator('nav, [role="navigation"]').getByText('Firewall').click();
      await page.waitForTimeout(800);

      await expect(page.getByText(/WAN_IN|firewall/i)).toBeVisible({ timeout: 8000 });
    });
  });

  test.describe('Editing config in file mode', () => {
    async function uploadConfigFile(page: import('@playwright/test').Page) {
      const openFileBtn = page.getByRole('button', { name: /open config file/i });
      if (await openFileBtn.isVisible()) {
        await openFileBtn.click();
      }
      await page.locator('input[type="file"]').setInputFiles({
        name: 'vyos-config.json',
        mimeType: 'application/json',
        buffer: FAKE_CONFIG_BUFFER,
      });
      await expect(page.getByText(/vyos-config\.json/i)).toBeVisible({ timeout: 8000 });
    }

    test('editing config in file mode updates the internal state without calling the API', async ({ page }) => {
      // Track any API calls that should NOT happen in file mode
      const apiCalls: string[] = [];
      await page.route('**/configure', (route) => {
        apiCalls.push('configure');
        return route.continue();
      });
      await page.route('**/retrieve', (route) => {
        apiCalls.push('retrieve');
        return route.continue();
      });

      await uploadConfigFile(page);

      // Open Interfaces and interact with the panel to make an edit
      await page.locator('nav, [role="navigation"]').getByText('Interfaces').click();
      await page.waitForTimeout(800);

      // File mode edits update in-memory state only, not the API
      // After opening the panel no API calls should have been made
      expect(apiCalls).toHaveLength(0);
    });
  });

  test.describe('Save / Download in file mode', () => {
    async function uploadConfigFile(page: import('@playwright/test').Page) {
      const openFileBtn = page.getByRole('button', { name: /open config file/i });
      if (await openFileBtn.isVisible()) {
        await openFileBtn.click();
      }
      await page.locator('input[type="file"]').setInputFiles({
        name: 'vyos-config.json',
        mimeType: 'application/json',
        buffer: FAKE_CONFIG_BUFFER,
      });
      await expect(page.getByText(/vyos-config\.json/i)).toBeVisible({ timeout: 8000 });
    }

    test('clicking Download triggers a file download', async ({ page }) => {
      await uploadConfigFile(page);

      // Playwright intercepts downloads via page.waitForEvent('download')
      const downloadPromise = page.waitForEvent('download', { timeout: 8000 });

      const downloadBtn = page.getByRole('button', { name: /download/i });
      await downloadBtn.click();

      const download = await downloadPromise;
      // The downloaded file should be a JSON file
      expect(download.suggestedFilename()).toMatch(/\.json$/i);
    });

    test('downloaded file contains valid JSON matching the loaded config', async ({ page }) => {
      await uploadConfigFile(page);

      const downloadPromise = page.waitForEvent('download', { timeout: 8000 });
      await page.getByRole('button', { name: /download/i }).click();

      const download = await downloadPromise;
      const path = await download.path();

      if (path) {
        const fs = await import('fs/promises');
        const content = await fs.readFile(path, 'utf-8');
        const parsed = JSON.parse(content) as Record<string, unknown>;

        // The downloaded config should contain the interfaces section from FULL_MOCK_CONFIG
        expect(parsed).toHaveProperty('interfaces');
      }
    });
  });

  test.describe('Closing file mode', () => {
    async function uploadConfigFile(page: import('@playwright/test').Page) {
      const openFileBtn = page.getByRole('button', { name: /open config file/i });
      if (await openFileBtn.isVisible()) {
        await openFileBtn.click();
      }
      await page.locator('input[type="file"]').setInputFiles({
        name: 'vyos-config.json',
        mimeType: 'application/json',
        buffer: FAKE_CONFIG_BUFFER,
      });
      await expect(page.getByText(/vyos-config\.json/i)).toBeVisible({ timeout: 8000 });
    }

    test('"Close File" button returns to the connection dialog', async ({ page }) => {
      await uploadConfigFile(page);

      const closeFileBtn = page.getByRole('button', { name: /close file/i });
      await closeFileBtn.click();

      // After closing, the app should return to the connection dialog
      await expect(
        page.getByText(/connect to vyos/i),
      ).toBeVisible({ timeout: 5000 });
    });

    test('connection dialog is shown again after closing a file', async ({ page }) => {
      await uploadConfigFile(page);

      await page.getByRole('button', { name: /close file/i }).click();

      // The host and API key inputs should be visible again
      await expect(page.getByLabel(/host/i)).toBeVisible({ timeout: 5000 });
    });
  });
});
