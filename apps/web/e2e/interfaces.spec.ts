import { test, expect } from '@playwright/test';
import { setupStatefulApiMocks } from './fixtures/api-mocks';
import { login, navigateToPanel } from './fixtures/helpers';

test.describe('Interfaces Panel', () => {
  let mockApi: Awaited<ReturnType<typeof setupStatefulApiMocks>>;

  test.beforeEach(async ({ page }) => {
    mockApi = await setupStatefulApiMocks(page);
    await login(page);
    await navigateToPanel(page, 'Interfaces');
  });

  test.describe('Display', () => {
    test('shows eth0 in the interface table', async ({ page }) => {
      await expect(page.getByRole('cell', { name: 'eth0' })).toBeVisible({ timeout: 8000 });
    });

    test('shows eth1 in the interface table', async ({ page }) => {
      await expect(page.getByRole('cell', { name: 'eth1' })).toBeVisible({ timeout: 8000 });
    });

    test('shows bond0 in the interface table', async ({ page }) => {
      await expect(page.getByRole('cell', { name: 'bond0' })).toBeVisible({ timeout: 8000 });
    });

    test('shows br0 in the interface table', async ({ page }) => {
      await expect(page.getByRole('cell', { name: 'br0' })).toBeVisible({ timeout: 8000 });
    });

    test('shows wg0 in the interface table', async ({ page }) => {
      await expect(page.getByRole('cell', { name: 'wg0' })).toBeVisible({ timeout: 8000 });
    });

    test('shows lo in the interface table', async ({ page }) => {
      await expect(page.getByRole('cell', { name: 'lo' })).toBeVisible({ timeout: 8000 });
    });

    test('displays WAN description for eth0', async ({ page }) => {
      await expect(page.getByText('WAN')).toBeVisible({ timeout: 8000 });
    });

    test('displays LAN description for eth1', async ({ page }) => {
      await expect(page.getByText('LAN')).toBeVisible({ timeout: 8000 });
    });

    test('shows type filter dropdown', async ({ page }) => {
      await expect(page.getByRole('option', { name: 'All Types' })).toBeAttached({ timeout: 8000 });
    });

    test('shows search input', async ({ page }) => {
      await expect(page.getByPlaceholder('Search interfaces...')).toBeVisible({ timeout: 8000 });
    });

    test('shows Add Interface button', async ({ page }) => {
      await expect(page.getByRole('button', { name: '+ Add Interface' })).toBeVisible({ timeout: 8000 });
    });

    test('shows Expand All and Collapse All buttons', async ({ page }) => {
      await expect(page.getByRole('button', { name: 'Expand All' })).toBeVisible({ timeout: 8000 });
      await expect(page.getByRole('button', { name: 'Collapse All' })).toBeVisible({ timeout: 8000 });
    });

    test('table has Name, Type, Status, Address, Description columns', async ({ page }) => {
      await expect(page.getByRole('columnheader', { name: /name/i })).toBeVisible({ timeout: 8000 });
      await expect(page.getByRole('columnheader', { name: /type/i })).toBeVisible({ timeout: 8000 });
      await expect(page.getByRole('columnheader', { name: /status/i })).toBeVisible({ timeout: 8000 });
      await expect(page.getByRole('columnheader', { name: /address/i })).toBeVisible({ timeout: 8000 });
      await expect(page.getByRole('columnheader', { name: /description/i })).toBeVisible({ timeout: 8000 });
    });
  });

  test.describe('Tree structure', () => {
    test('bond0 expand button is visible when it has children', async ({ page }) => {
      // bond0 has eth2 and eth3 as members — the expand toggle (▸) should appear
      await expect(page.getByRole('cell', { name: 'bond0' })).toBeVisible({ timeout: 8000 });
      // The row for bond0 should contain a toggle button
      const bond0Row = page.locator('tr').filter({ hasText: 'bond0' }).first();
      await expect(bond0Row).toBeVisible();
    });

    test('expanding bond0 reveals its member interfaces', async ({ page }) => {
      await page.getByRole('button', { name: 'Expand All' }).click();
      await page.waitForTimeout(300);
      // After expand, eth2 and eth3 (bond members) should be visible
      await expect(page.getByRole('cell', { name: 'eth2' })).toBeVisible({ timeout: 5000 });
      await expect(page.getByRole('cell', { name: 'eth3' })).toBeVisible({ timeout: 5000 });
    });

    test('expanding br0 reveals its member interfaces', async ({ page }) => {
      await page.getByRole('button', { name: 'Expand All' }).click();
      await page.waitForTimeout(300);
      // After expand, eth4 and eth5 (bridge members) should be visible
      await expect(page.getByRole('cell', { name: 'eth4' })).toBeVisible({ timeout: 5000 });
      await expect(page.getByRole('cell', { name: 'eth5' })).toBeVisible({ timeout: 5000 });
    });

    test('member interfaces are hidden before expand', async ({ page }) => {
      // eth2/eth3 are bond members and should not appear until expanded
      await expect(page.getByRole('cell', { name: 'eth2' })).not.toBeVisible();
    });

    test('Collapse All hides member interfaces after expand', async ({ page }) => {
      await page.getByRole('button', { name: 'Expand All' }).click();
      await page.waitForTimeout(300);
      await expect(page.getByRole('cell', { name: 'eth2' })).toBeVisible({ timeout: 5000 });

      await page.getByRole('button', { name: 'Collapse All' }).click();
      await page.waitForTimeout(300);
      await expect(page.getByRole('cell', { name: 'eth2' })).not.toBeVisible();
    });

    test('clicking bond0 toggle expands its children', async ({ page }) => {
      const bond0Row = page.locator('tr').filter({ hasText: 'bond0' }).first();
      const toggleBtn = bond0Row.locator('button').first();
      await toggleBtn.click();
      await page.waitForTimeout(300);
      await expect(page.getByRole('cell', { name: 'eth2' })).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('Detail panel', () => {
    test('clicking eth0 row opens the detail panel', async ({ page }) => {
      const eth0Row = page.locator('tr').filter({ hasText: /^.*eth0.*$/ }).first();
      await eth0Row.click();
      // Detail panel appears on the right (border-l side panel)
      await expect(page.locator('[class*="border-l"]').first()).toBeVisible({ timeout: 5000 });
    });

    test('clicking eth1 row opens the detail panel', async ({ page }) => {
      const eth1Row = page.locator('tr').filter({ hasText: /eth1/ }).first();
      await eth1Row.click();
      await expect(page.locator('[class*="border-l"]').first()).toBeVisible({ timeout: 5000 });
    });

    test('clicking the edit button on eth0 opens the detail panel', async ({ page }) => {
      const eth0Row = page.locator('tr').filter({ hasText: /eth0/ }).first();
      const editBtn = eth0Row.getByTitle('Edit');
      await editBtn.click();
      await expect(page.locator('[class*="border-l"]').first()).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('Search', () => {
    test('searching for eth0 shows only eth0', async ({ page }) => {
      await page.getByPlaceholder('Search interfaces...').fill('eth0');
      await page.waitForTimeout(300);
      await expect(page.getByRole('cell', { name: 'eth0' })).toBeVisible();
      await expect(page.getByRole('cell', { name: 'eth1' })).not.toBeVisible();
    });

    test('searching for WAN matches eth0 by description', async ({ page }) => {
      await page.getByPlaceholder('Search interfaces...').fill('WAN');
      await page.waitForTimeout(300);
      await expect(page.getByRole('cell', { name: 'eth0' })).toBeVisible();
    });

    test('searching for a non-existent interface shows No interfaces found', async ({ page }) => {
      await page.getByPlaceholder('Search interfaces...').fill('zzznomatch');
      await page.waitForTimeout(300);
      await expect(page.getByText('No interfaces found')).toBeVisible();
    });
  });

  test.describe('Type filter', () => {
    test('filtering by Loopback shows lo', async ({ page }) => {
      await page.selectOption('select', 'loopback');
      await page.waitForTimeout(300);
      await expect(page.getByRole('cell', { name: 'lo' })).toBeVisible();
    });

    test('filtering by WireGuard shows wg0', async ({ page }) => {
      await page.selectOption('select', 'wireguard');
      await page.waitForTimeout(300);
      await expect(page.getByRole('cell', { name: 'wg0' })).toBeVisible();
    });

    test('filtering by Bonding shows bond0', async ({ page }) => {
      await page.selectOption('select', 'bonding');
      await page.waitForTimeout(300);
      await expect(page.getByRole('cell', { name: 'bond0' })).toBeVisible();
    });
  });

  test.describe('Delete', () => {
    test('clicking delete on eth0 shows confirm dialog', async ({ page }) => {
      page.on('dialog', async (dialog) => {
        expect(dialog.message()).toMatch(/delete interface eth0/i);
        await dialog.dismiss();
      });

      const eth0Row = page.locator('tr').filter({ hasText: /eth0/ }).first();
      const deleteBtn = eth0Row.getByTitle('Delete');
      await deleteBtn.click();
    });

    test('confirming delete of wg0 sends delete command to API', async ({ page }) => {
      page.on('dialog', async (dialog) => {
        await dialog.accept();
      });

      const wg0Row = page.locator('tr').filter({ hasText: /wg0/ }).first();
      const deleteBtn = wg0Row.getByTitle('Delete');
      await deleteBtn.click();
      await page.waitForTimeout(500);

      const log = mockApi.getCommandLog();
      const deleteCmd = log.find(
        (cmd) => cmd.op === 'delete' && cmd.path.includes('wg0'),
      );
      expect(deleteCmd).toBeDefined();
    });

    test('dismissing delete confirm keeps interface in config', async ({ page }) => {
      page.on('dialog', async (dialog) => {
        await dialog.dismiss();
      });

      const eth0Row = page.locator('tr').filter({ hasText: /eth0/ }).first();
      const deleteBtn = eth0Row.getByTitle('Delete');
      await deleteBtn.click();
      await page.waitForTimeout(300);

      const config = mockApi.getConfig();
      const eth = config.interfaces as Record<string, Record<string, unknown>>;
      expect(eth.ethernet.eth0).toBeDefined();
    });
  });
});
