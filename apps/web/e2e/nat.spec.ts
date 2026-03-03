import { test, expect } from '@playwright/test';
import { setupStatefulApiMocks } from './fixtures/api-mocks';
import { login, navigateToPanel } from './fixtures/helpers';

test.describe('NAT Panel', () => {
  let mockApi: Awaited<ReturnType<typeof setupStatefulApiMocks>>;

  test.beforeEach(async ({ page }) => {
    mockApi = await setupStatefulApiMocks(page);
    await login(page);
    await navigateToPanel(page, 'NAT');
  });

  test.describe('Tab navigation', () => {
    test('NAT44 Source tab is visible', async ({ page }) => {
      await expect(page.getByRole('button', { name: 'NAT44 Source' })).toBeVisible({ timeout: 8000 });
    });

    test('NAT44 Destination tab is visible', async ({ page }) => {
      await expect(page.getByRole('button', { name: 'NAT44 Destination' })).toBeVisible({ timeout: 8000 });
    });

    test('NAT64 tab is visible', async ({ page }) => {
      await expect(page.getByRole('button', { name: 'NAT64' })).toBeVisible({ timeout: 8000 });
    });

    test('NAT66 tab is visible', async ({ page }) => {
      await expect(page.getByRole('button', { name: 'NAT66' })).toBeVisible({ timeout: 8000 });
    });

    test('CGNAT tab is visible', async ({ page }) => {
      await expect(page.getByRole('button', { name: 'CGNAT' })).toBeVisible({ timeout: 8000 });
    });

    test('switching to NAT44 Destination tab works', async ({ page }) => {
      await page.getByRole('button', { name: 'NAT44 Destination' }).click();
      await page.waitForTimeout(300);
      // Destination tab should render a rule table
      await expect(page.locator('table').first()).toBeVisible({ timeout: 5000 });
    });

    test('tab cycle: Source → Destination → back to Source', async ({ page }) => {
      await page.getByRole('button', { name: 'NAT44 Destination' }).click();
      await page.waitForTimeout(200);
      await page.getByRole('button', { name: 'NAT44 Source' }).click();
      await page.waitForTimeout(300);
      // Back on source — rule 10 should be visible
      await expect(page.getByRole('cell', { name: '10' }).first()).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('Source NAT rules', () => {
    test('source rule 10 is visible', async ({ page }) => {
      await expect(page.getByRole('cell', { name: '10' }).first()).toBeVisible({ timeout: 8000 });
    });

    test('source rule 10 shows masquerade translation', async ({ page }) => {
      await expect(page.getByText('masquerade')).toBeVisible({ timeout: 8000 });
    });

    test('source rule 10 shows eth0 as outbound interface', async ({ page }) => {
      // The mock config has outbound_interface.name = 'eth0' but NatRuleTab reads
      // 'outbound-interface'.name; the mock-config uses outbound_interface (underscore).
      // The rule table renders the interface column — eth0 should appear.
      await expect(page.getByText('eth0').first()).toBeVisible({ timeout: 8000 });
    });

    test('LAN masquerade description is visible', async ({ page }) => {
      await expect(page.getByText('LAN masquerade')).toBeVisible({ timeout: 8000 });
    });

    test('rule table has # Type Interface Source Destination Translation Description columns', async ({ page }) => {
      await expect(page.getByRole('columnheader', { name: '#' })).toBeVisible({ timeout: 8000 });
      await expect(page.getByRole('columnheader', { name: /type/i })).toBeVisible();
      await expect(page.getByRole('columnheader', { name: /interface/i })).toBeVisible();
      await expect(page.getByRole('columnheader', { name: /source/i })).toBeVisible();
      await expect(page.getByRole('columnheader', { name: /destination/i })).toBeVisible();
      await expect(page.getByRole('columnheader', { name: /translation/i })).toBeVisible();
      await expect(page.getByRole('columnheader', { name: /description/i })).toBeVisible();
    });

    test('Add Rule button is visible on source tab', async ({ page }) => {
      await expect(page.getByRole('button', { name: /\+ Add Rule/i })).toBeVisible({ timeout: 8000 });
    });

    test('source rule rows have Edit and Delete buttons', async ({ page }) => {
      await expect(page.getByTitle('Edit').first()).toBeVisible({ timeout: 8000 });
      await expect(page.getByTitle('Delete').first()).toBeVisible({ timeout: 8000 });
    });
  });

  test.describe('Destination NAT rules', () => {
    test.beforeEach(async ({ page }) => {
      await page.getByRole('button', { name: 'NAT44 Destination' }).click();
      await page.waitForTimeout(300);
    });

    test('destination rule 10 is visible', async ({ page }) => {
      await expect(page.getByRole('cell', { name: '10' }).first()).toBeVisible({ timeout: 8000 });
    });

    test('destination rule 10 shows translation address 192.168.1.100', async ({ page }) => {
      await expect(page.getByText('192.168.1.100')).toBeVisible({ timeout: 8000 });
    });

    test('HTTPS to web server description is visible', async ({ page }) => {
      await expect(page.getByText('HTTPS to web server')).toBeVisible({ timeout: 8000 });
    });

    test('Add Rule button is visible on destination tab', async ({ page }) => {
      await expect(page.getByRole('button', { name: /\+ Add Rule/i })).toBeVisible({ timeout: 8000 });
    });

    test('destination rule rows have Edit and Delete buttons', async ({ page }) => {
      await expect(page.getByTitle('Edit').first()).toBeVisible({ timeout: 8000 });
      await expect(page.getByTitle('Delete').first()).toBeVisible({ timeout: 8000 });
    });
  });

  test.describe('Add source NAT rule', () => {
    test('clicking Add Rule opens the editor dialog', async ({ page }) => {
      await page.getByRole('button', { name: /\+ Add Rule/i }).click();
      await expect(page.getByText('Add NAT Rule')).toBeVisible({ timeout: 5000 });
    });

    test('editor dialog shows SOURCE family label', async ({ page }) => {
      await page.getByRole('button', { name: /\+ Add Rule/i }).click();
      await page.waitForTimeout(300);
      await expect(page.getByText(/SOURCE/i)).toBeVisible({ timeout: 5000 });
    });

    test('submitting a source NAT rule logs set commands', async ({ page }) => {
      await page.getByRole('button', { name: /\+ Add Rule/i }).click();
      await page.waitForTimeout(300);

      // Fill outbound interface
      const outboundField = page.locator(
        'input[placeholder*="interface"], input[name*="outboundInterface"]'
      ).first();
      if (await outboundField.isVisible()) {
        await outboundField.fill('eth0');
      }

      // Fill source address
      const srcAddrField = page.locator(
        'input[placeholder*="source"], input[name*="srcAddress"]'
      ).first();
      if (await srcAddrField.isVisible()) {
        await srcAddrField.fill('10.0.0.0/24');
      }

      // Fill translation address
      const translationField = page.locator(
        'input[placeholder*="translation"], input[name*="translationAddress"]'
      ).first();
      if (await translationField.isVisible()) {
        await translationField.fill('masquerade');
      }

      const submitBtn = page.getByRole('button', { name: /save|submit|apply/i }).first();
      if (await submitBtn.isVisible()) {
        await submitBtn.click();
      }

      await page.waitForTimeout(500);

      const log = mockApi.getCommandLog();
      const setCmds = log.filter((cmd) => cmd.op === 'set');
      expect(setCmds.length).toBeGreaterThan(0);
    });

    test('cancelling the editor closes it without logging commands', async ({ page }) => {
      const initialLogLength = mockApi.getCommandLog().length;

      await page.getByRole('button', { name: /\+ Add Rule/i }).click();
      await page.waitForTimeout(300);

      await page.getByRole('button', { name: '✕' }).click();
      await page.waitForTimeout(300);

      await expect(page.getByText('Add NAT Rule')).not.toBeVisible();
      expect(mockApi.getCommandLog().length).toBe(initialLogLength);
    });
  });

  test.describe('Edit destination NAT rule', () => {
    test.beforeEach(async ({ page }) => {
      await page.getByRole('button', { name: 'NAT44 Destination' }).click();
      await page.waitForTimeout(300);
    });

    test('clicking Edit on destination rule 10 opens the editor', async ({ page }) => {
      await page.getByTitle('Edit').first().click();
      await page.waitForTimeout(300);
      await expect(page.getByText(/Edit Rule 10/i)).toBeVisible({ timeout: 5000 });
    });

    test('editing destination rule 10 translation address logs set command', async ({ page }) => {
      await page.getByTitle('Edit').first().click();
      await page.waitForTimeout(300);

      // Find the translation address input and update it
      const translationField = page.locator(
        'input[name*="translationAddress"], input[placeholder*="translation"]'
      ).first();
      if (await translationField.isVisible()) {
        await translationField.fill('192.168.1.200');
      }

      const submitBtn = page.getByRole('button', { name: /save|submit|apply/i }).first();
      if (await submitBtn.isVisible()) {
        await submitBtn.click();
      }

      await page.waitForTimeout(500);

      const log = mockApi.getCommandLog();
      const setCmds = log.filter((cmd) => cmd.op === 'set');
      expect(setCmds.length).toBeGreaterThan(0);
    });

    test('editor dialog shows DESTINATION family label', async ({ page }) => {
      await page.getByTitle('Edit').first().click();
      await page.waitForTimeout(300);
      await expect(page.getByText(/DESTINATION/i)).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('Delete NAT rule', () => {
    test('clicking delete on source rule 10 sends delete command', async ({ page }) => {
      await page.getByTitle('Delete').first().click();
      await page.waitForTimeout(500);

      const log = mockApi.getCommandLog();
      const deleteCmd = log.find(
        (cmd) => cmd.op === 'delete' && cmd.path.includes('10'),
      );
      expect(deleteCmd).toBeDefined();
    });

    test('delete command path contains nat and source', async ({ page }) => {
      await page.getByTitle('Delete').first().click();
      await page.waitForTimeout(500);

      const log = mockApi.getCommandLog();
      const deleteCmd = log.find((cmd) => cmd.op === 'delete');
      expect(deleteCmd).toBeDefined();
      expect(deleteCmd!.path).toContain('nat');
      expect(deleteCmd!.path).toContain('source');
    });

    test('deleting destination rule 10 sends delete command', async ({ page }) => {
      await page.getByRole('button', { name: 'NAT44 Destination' }).click();
      await page.waitForTimeout(300);

      await page.getByTitle('Delete').first().click();
      await page.waitForTimeout(500);

      const log = mockApi.getCommandLog();
      const deleteCmd = log.find(
        (cmd) => cmd.op === 'delete' && cmd.path.includes('destination'),
      );
      expect(deleteCmd).toBeDefined();
    });

    test('after deleting source rule, config no longer has that rule', async ({ page }) => {
      await page.getByTitle('Delete').first().click();
      await page.waitForTimeout(500);

      const config = mockApi.getConfig();
      const sourceRules = (config.nat as Record<string, unknown>)?.source as Record<string, unknown>;
      const rule10 = (sourceRules?.rule as Record<string, unknown>)?.['10'];
      expect(rule10).toBeUndefined();
    });
  });

  test.describe('Empty NAT families', () => {
    test('NAT64 tab shows an empty rule table', async ({ page }) => {
      await page.getByRole('button', { name: 'NAT64' }).click();
      await page.waitForTimeout(300);
      await expect(page.getByText('No rules configured')).toBeVisible({ timeout: 5000 });
    });

    test('NAT66 tab shows an empty rule table', async ({ page }) => {
      await page.getByRole('button', { name: 'NAT66' }).click();
      await page.waitForTimeout(300);
      await expect(page.getByText('No rules configured')).toBeVisible({ timeout: 5000 });
    });

    test('CGNAT tab shows an empty rule table', async ({ page }) => {
      await page.getByRole('button', { name: 'CGNAT' }).click();
      await page.waitForTimeout(300);
      await expect(page.getByText('No rules configured')).toBeVisible({ timeout: 5000 });
    });
  });
});
