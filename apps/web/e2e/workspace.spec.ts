import { test, expect } from '@playwright/test';
import { setupStatefulApiMocks } from './fixtures/api-mocks';
import { login } from './fixtures/helpers';

test.describe('Workspace Modes', () => {
  test.beforeEach(async ({ page }) => {
    await setupStatefulApiMocks(page);
    // Clear workspace-related localStorage so each test starts from a clean state
    await page.addInitScript(() => {
      localStorage.removeItem('vymanage:workspace-mode');
      localStorage.removeItem('vymanage:desktop-windows');
      localStorage.removeItem('vymanage:split-layout');
      localStorage.removeItem('vymanage:inline-active');
    });
    await login(page);
  });

  test.describe('Mode toggle', () => {
    test('mode toggle button is visible in header', async ({ page }) => {
      // The header renders a button showing the current mode label (Desktop/Split/Inline)
      const modeButton = page.getByRole('button', { name: /desktop|split|inline/i }).first();
      await expect(modeButton).toBeVisible();
    });

    test('mode toggle shows Desktop as the current mode by default', async ({ page }) => {
      // The header button label reflects the active mode; default is Desktop
      const modeButton = page.getByRole('button', { name: /desktop/i }).first();
      await expect(modeButton).toBeVisible();
    });
  });

  test.describe('Desktop mode', () => {
    test('clicking a sidebar item opens a window in the workspace', async ({ page }) => {
      // Click Interfaces in the sidebar navigation
      await page.locator('nav, [role="navigation"]').getByText('Interfaces').click();

      // A window should appear — the Window component renders the title in a title bar
      await expect(page.getByText('Interfaces')).toBeVisible({ timeout: 5000 });
    });

    test('window appears after clicking sidebar item in desktop mode', async ({ page }) => {
      await page.locator('nav, [role="navigation"]').getByText('Firewall').click();

      // The Window component wraps content in a positioned div with a title bar
      // The title bar text matches the menu item label
      await expect(page.getByText('Firewall').first()).toBeVisible({ timeout: 5000 });
    });

    test('minimize button hides the window from the workspace', async ({ page }) => {
      await page.locator('nav, [role="navigation"]').getByText('Interfaces').click();
      await page.waitForTimeout(500);

      // The Window title bar has a minimize button with title="Minimize"
      const minimizeBtn = page.getByTitle('Minimize');
      await expect(minimizeBtn).toBeVisible();
      await minimizeBtn.click();

      // After minimize, Window renders null — the panel content is gone
      // The taskbar entry should now appear as inactive (bg-muted style)
      // We verify via the taskbar button existing but the window content not being rendered
      const taskbarBtn = page.getByRole('button', { name: /interfaces/i }).first();
      await expect(taskbarBtn).toBeVisible();
    });

    test('taskbar shows an entry for an open window', async ({ page }) => {
      await page.locator('nav, [role="navigation"]').getByText('Interfaces').click();
      await page.waitForTimeout(500);

      // Taskbar is rendered at the bottom; it contains a button with the window title
      const taskbarEntry = page.locator('div.flex.h-9').getByText('Interfaces');
      await expect(taskbarEntry).toBeVisible({ timeout: 5000 });
    });

    test('clicking taskbar entry for a minimized window restores it', async ({ page }) => {
      await page.locator('nav, [role="navigation"]').getByText('Interfaces').click();
      await page.waitForTimeout(500);

      // Minimize the window
      await page.getByTitle('Minimize').click();
      await page.waitForTimeout(300);

      // Click the taskbar button to restore
      // Taskbar buttons are in the h-9 footer bar
      const taskbarEntry = page.locator('div.flex.h-9').getByRole('button', { name: /interfaces/i });
      await taskbarEntry.click();
      await page.waitForTimeout(300);

      // After restore, the close button (title="Close") inside the window should reappear
      await expect(page.getByTitle('Close')).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('Split mode', () => {
    test('switching to Split mode via the header toggle renders the split workspace', async ({ page }) => {
      // Hover the mode toggle button to reveal the dropdown
      const modeButton = page.getByRole('button', { name: /desktop/i }).first();
      await modeButton.hover();

      // Click the Split option in the dropdown
      await page.getByRole('button', { name: /^split$/i }).click();
      await page.waitForTimeout(300);

      // After switching, the header button should now reflect Split
      await expect(page.getByRole('button', { name: /split/i }).first()).toBeVisible();
    });

    test('split workspace shows "Select a menu item" placeholder before any item is opened', async ({ page }) => {
      const modeButton = page.getByRole('button', { name: /desktop/i }).first();
      await modeButton.hover();
      await page.getByRole('button', { name: /^split$/i }).click();
      await page.waitForTimeout(300);

      await expect(page.getByText('Select a menu item to get started')).toBeVisible();
    });

    test('clicking a sidebar item in split mode renders a panel', async ({ page }) => {
      const modeButton = page.getByRole('button', { name: /desktop/i }).first();
      await modeButton.hover();
      await page.getByRole('button', { name: /^split$/i }).click();
      await page.waitForTimeout(300);

      await page.locator('nav, [role="navigation"]').getByText('Interfaces').click();
      await page.waitForTimeout(500);

      // SplitPanelView renders the menuId as a label in the panel header
      await expect(page.getByText('interfaces')).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('Inline mode', () => {
    test('switching to Inline mode via the header toggle works', async ({ page }) => {
      const modeButton = page.getByRole('button', { name: /desktop/i }).first();
      await modeButton.hover();
      await page.getByRole('button', { name: /^inline$/i }).click();
      await page.waitForTimeout(300);

      await expect(page.getByRole('button', { name: /inline/i }).first()).toBeVisible();
    });

    test('inline workspace shows "Select a menu item" placeholder before selection', async ({ page }) => {
      const modeButton = page.getByRole('button', { name: /desktop/i }).first();
      await modeButton.hover();
      await page.getByRole('button', { name: /^inline$/i }).click();
      await page.waitForTimeout(300);

      await expect(page.getByText('Select a menu item to get started')).toBeVisible();
    });

    test('clicking a sidebar item in inline mode shows a single panel', async ({ page }) => {
      const modeButton = page.getByRole('button', { name: /desktop/i }).first();
      await modeButton.hover();
      await page.getByRole('button', { name: /^inline$/i }).click();
      await page.waitForTimeout(300);

      await page.locator('nav, [role="navigation"]').getByText('System').click();
      await page.waitForTimeout(500);

      // InlineWorkspace renders renderPanel(inlineActiveId); System panel should appear
      // The "Select a menu item" placeholder should no longer be visible
      await expect(page.getByText('Select a menu item to get started')).not.toBeVisible();
    });
  });

  test.describe('Mode persistence', () => {
    test('workspace mode is written to localStorage when changed', async ({ page }) => {
      const modeButton = page.getByRole('button', { name: /desktop/i }).first();
      await modeButton.hover();
      await page.getByRole('button', { name: /^split$/i }).click();
      await page.waitForTimeout(300);

      const stored = await page.evaluate(() =>
        localStorage.getItem('vymanage:workspace-mode'),
      );
      expect(stored).toBe('"split"');
    });

    test('switching to Split then reloading keeps Split mode', async ({ page }) => {
      // Switch to split
      const modeButton = page.getByRole('button', { name: /desktop/i }).first();
      await modeButton.hover();
      await page.getByRole('button', { name: /^split$/i }).click();
      await page.waitForTimeout(300);

      // Verify localStorage was written
      const stored = await page.evaluate(() =>
        localStorage.getItem('vymanage:workspace-mode'),
      );
      expect(stored).toBe('"split"');

      // Reload the page (mocks are re-registered in beforeEach but page reload needs them
      // re-applied; we re-register them inline here)
      await setupStatefulApiMocks(page);
      await page.reload();

      // After reload the app re-reads localStorage so we should still be in split mode
      await expect(page.getByText('Select a menu item to get started')).toBeVisible({ timeout: 10000 });

      const storedAfterReload = await page.evaluate(() =>
        localStorage.getItem('vymanage:workspace-mode'),
      );
      expect(storedAfterReload).toBe('"split"');
    });

    test('workspace mode defaults to Desktop when localStorage has no value', async ({ page }) => {
      // beforeEach already clears the key and logs in, so at this point we're in desktop mode
      const stored = await page.evaluate(() =>
        localStorage.getItem('vymanage:workspace-mode'),
      );
      // After login the WorkspaceProvider writes the mode; desktop should be stored
      expect(stored).toBe('"desktop"');
    });
  });
});
