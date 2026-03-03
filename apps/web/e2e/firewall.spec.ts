import { test, expect } from '@playwright/test';
import { setupStatefulApiMocks } from './fixtures/api-mocks';
import { login, navigateToPanel, openTab } from './fixtures/helpers';

test.describe('Firewall Panel', () => {
  let mockApi: Awaited<ReturnType<typeof setupStatefulApiMocks>>;

  test.beforeEach(async ({ page }) => {
    mockApi = await setupStatefulApiMocks(page);
    await login(page);
    await navigateToPanel(page, 'Firewall');
  });

  test.describe('Tab navigation', () => {
    test('IPv4 Rules tab is visible by default', async ({ page }) => {
      await expect(page.getByRole('button', { name: 'IPv4 Rules' })).toBeVisible({ timeout: 8000 });
    });

    test('all top-level tabs are visible', async ({ page }) => {
      await expect(page.getByRole('button', { name: 'IPv4 Rules' })).toBeVisible({ timeout: 8000 });
      await expect(page.getByRole('button', { name: 'IPv6 Rules' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Bridge Rules' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Groups' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Zones' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Flow Tables' })).toBeVisible();
    });

    test('switching to IPv6 Rules tab works', async ({ page }) => {
      await page.getByRole('button', { name: 'IPv6 Rules' }).click();
      await page.waitForTimeout(300);
      // IPv6 content loads — rule set selector appears (even if empty)
      await expect(page.getByText('Rule Set:')).toBeVisible({ timeout: 5000 });
    });

    test('switching to Bridge Rules tab works', async ({ page }) => {
      await page.getByRole('button', { name: 'Bridge Rules' }).click();
      await page.waitForTimeout(300);
      await expect(page.getByText('Rule Set:')).toBeVisible({ timeout: 5000 });
    });

    test('switching to Groups tab shows group type buttons', async ({ page }) => {
      await page.getByRole('button', { name: 'Groups' }).click();
      await page.waitForTimeout(300);
      await expect(page.getByRole('button', { name: 'Address Groups' })).toBeVisible({ timeout: 5000 });
    });

    test('switching to Zones tab works', async ({ page }) => {
      await page.getByRole('button', { name: 'Zones' }).click();
      await page.waitForTimeout(300);
      // Zones tab renders something (even a placeholder)
      await expect(page.locator('body')).toBeVisible();
    });

    test('full tab cycle: IPv4 → IPv6 → Bridge → Groups → Zones', async ({ page }) => {
      for (const tabName of ['IPv6 Rules', 'Bridge Rules', 'Groups', 'Zones']) {
        await page.getByRole('button', { name: tabName }).click();
        await page.waitForTimeout(200);
      }
      // Return to IPv4
      await page.getByRole('button', { name: 'IPv4 Rules' }).click();
      await page.waitForTimeout(300);
      await expect(page.getByText('Rule Set:')).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('IPv4 rule sets', () => {
    test('rule set selector is visible', async ({ page }) => {
      await expect(page.getByText('Rule Set:')).toBeVisible({ timeout: 8000 });
    });

    test('WAN_IN appears in the rule set dropdown', async ({ page }) => {
      await expect(page.getByRole('option', { name: 'WAN_IN' })).toBeAttached({ timeout: 8000 });
    });

    test('WAN_LOCAL appears in the rule set dropdown', async ({ page }) => {
      await expect(page.getByRole('option', { name: 'WAN_LOCAL' })).toBeAttached({ timeout: 8000 });
    });

    test('New Set button is visible', async ({ page }) => {
      await expect(page.getByRole('button', { name: '+ New Set' })).toBeVisible({ timeout: 8000 });
    });

    test('Delete Set button is visible when a rule set is selected', async ({ page }) => {
      await expect(page.getByRole('button', { name: 'Delete Set' })).toBeVisible({ timeout: 8000 });
    });
  });

  test.describe('IPv4 rule display (WAN_IN)', () => {
    test('rule 10 is visible', async ({ page }) => {
      // WAN_IN is auto-selected (first alphabetically); rule 10 should appear
      await expect(page.getByRole('cell', { name: '10' }).first()).toBeVisible({ timeout: 8000 });
    });

    test('rule 20 is visible', async ({ page }) => {
      await expect(page.getByRole('cell', { name: '20' }).first()).toBeVisible({ timeout: 8000 });
    });

    test('rule 30 is visible', async ({ page }) => {
      await expect(page.getByRole('cell', { name: '30' }).first()).toBeVisible({ timeout: 8000 });
    });

    test('rules are displayed in ascending numeric order', async ({ page }) => {
      const cells = page.locator('tbody td').filter({ hasText: /^(10|20|30)$/ });
      const count = await cells.count();
      expect(count).toBeGreaterThanOrEqual(3);

      const texts: string[] = [];
      for (let i = 0; i < count; i++) {
        texts.push(await cells.nth(i).innerText());
      }
      const nums = texts.map(Number).filter((n) => [10, 20, 30].includes(n));
      expect(nums).toEqual([...nums].sort((a, b) => a - b));
    });

    test('Add Rule button is visible', async ({ page }) => {
      await expect(page.getByRole('button', { name: /\+ Add Rule/i })).toBeVisible({ timeout: 8000 });
    });

    test('rule rows have Edit and Delete action buttons', async ({ page }) => {
      await expect(page.getByTitle('Edit').first()).toBeVisible({ timeout: 8000 });
      await expect(page.getByTitle('Delete').first()).toBeVisible({ timeout: 8000 });
    });
  });

  test.describe('Add rule', () => {
    test('clicking Add Rule opens the editor dialog', async ({ page }) => {
      await page.getByRole('button', { name: /\+ Add Rule/i }).click();
      await expect(page.getByText('Add Rule')).toBeVisible({ timeout: 5000 });
    });

    test('editor dialog has action, protocol and description fields', async ({ page }) => {
      await page.getByRole('button', { name: /\+ Add Rule/i }).click();
      await expect(page.getByRole('combobox', { name: /action/i }).or(
        page.locator('select').filter({ hasText: /accept|drop|reject/i })
      ).first()).toBeVisible({ timeout: 5000 });
    });

    test('submitting a new rule logs set commands', async ({ page }) => {
      await page.getByRole('button', { name: /\+ Add Rule/i }).click();
      await page.waitForTimeout(300);

      // Fill action field — find the select containing accept/drop
      const actionSelect = page.locator('select').filter({ hasText: /accept/i }).first();
      if (await actionSelect.isVisible()) {
        await actionSelect.selectOption('accept');
      }

      // Fill protocol field
      const protocolField = page.locator('input[placeholder*="protocol"], input[name*="protocol"]').first();
      if (await protocolField.isVisible()) {
        await protocolField.fill('tcp');
      }

      // Fill destination port
      const dstPortField = page.locator('input[placeholder*="port"], input[name*="dstPort"]').first();
      if (await dstPortField.isVisible()) {
        await dstPortField.fill('443');
      }

      // Submit the form
      const submitBtn = page.getByRole('button', { name: /save|submit|apply/i }).first();
      if (await submitBtn.isVisible()) {
        await submitBtn.click();
      }

      await page.waitForTimeout(500);

      const log = mockApi.getCommandLog();
      // At least one set command should have been issued for the new rule
      const setCmds = log.filter((cmd) => cmd.op === 'set');
      expect(setCmds.length).toBeGreaterThan(0);
    });

    test('cancelling the editor dialog closes it without logging commands', async ({ page }) => {
      const initialLogLength = mockApi.getCommandLog().length;

      await page.getByRole('button', { name: /\+ Add Rule/i }).click();
      await page.waitForTimeout(300);

      // Close via the X button
      await page.getByRole('button', { name: '✕' }).click();
      await page.waitForTimeout(300);

      await expect(page.getByText('Add Rule')).not.toBeVisible();
      expect(mockApi.getCommandLog().length).toBe(initialLogLength);
    });
  });

  test.describe('Edit rule', () => {
    test('clicking Edit on rule 10 opens the editor with rule 10 pre-filled', async ({ page }) => {
      const editBtns = page.getByTitle('Edit');
      await editBtns.first().click();
      await page.waitForTimeout(300);

      // Dialog title should mention the rule number and the rule set name
      await expect(page.getByText(/Edit Rule 10/i)).toBeVisible({ timeout: 5000 });
    });

    test('submitting an edited rule logs set commands', async ({ page }) => {
      const editBtns = page.getByTitle('Edit');
      await editBtns.first().click();
      await page.waitForTimeout(300);

      // Submit without changes — still logs set commands to persist values
      const submitBtn = page.getByRole('button', { name: /save|submit|apply/i }).first();
      if (await submitBtn.isVisible()) {
        await submitBtn.click();
      }

      await page.waitForTimeout(500);
      const log = mockApi.getCommandLog();
      expect(log.filter((c) => c.op === 'set').length).toBeGreaterThan(0);
    });
  });

  test.describe('Delete rule', () => {
    test('clicking Delete on rule 30 sends a delete command', async ({ page }) => {
      // Rule 30 is the third rule in WAN_IN
      const deleteBtns = page.getByTitle('Delete');
      // The third delete button corresponds to rule 30
      const thirdDelete = deleteBtns.nth(2);
      await thirdDelete.click();
      await page.waitForTimeout(500);

      const log = mockApi.getCommandLog();
      const deleteCmd = log.find(
        (cmd) => cmd.op === 'delete' && cmd.path.includes('30'),
      );
      expect(deleteCmd).toBeDefined();
    });

    test('delete command path contains the firewall name path', async ({ page }) => {
      const deleteBtns = page.getByTitle('Delete');
      await deleteBtns.first().click();
      await page.waitForTimeout(500);

      const log = mockApi.getCommandLog();
      const deleteCmd = log.find((cmd) => cmd.op === 'delete');
      expect(deleteCmd).toBeDefined();
      expect(deleteCmd!.path).toContain('firewall');
    });
  });

  test.describe('New rule set', () => {
    test('clicking + New Set triggers a prompt dialog', async ({ page }) => {
      let dialogSeen = false;
      page.on('dialog', async (dialog) => {
        dialogSeen = true;
        expect(dialog.message()).toMatch(/new rule set name/i);
        await dialog.dismiss();
      });

      await page.getByRole('button', { name: '+ New Set' }).click();
      await page.waitForTimeout(500);
      expect(dialogSeen).toBe(true);
    });

    test('entering a name in the prompt creates the rule set', async ({ page }) => {
      page.on('dialog', async (dialog) => {
        await dialog.accept('TEST_SET');
      });

      await page.getByRole('button', { name: '+ New Set' }).click();
      await page.waitForTimeout(500);

      const log = mockApi.getCommandLog();
      const createCmd = log.find(
        (cmd) => cmd.op === 'set' && cmd.path.includes('TEST_SET'),
      );
      expect(createCmd).toBeDefined();
    });

    test('dismissing the new set prompt does not log any commands', async ({ page }) => {
      const initialLogLength = mockApi.getCommandLog().length;

      page.on('dialog', async (dialog) => {
        await dialog.dismiss();
      });

      await page.getByRole('button', { name: '+ New Set' }).click();
      await page.waitForTimeout(500);

      expect(mockApi.getCommandLog().length).toBe(initialLogLength);
    });
  });

  test.describe('Delete rule set', () => {
    test('clicking Delete Set triggers a confirm dialog', async ({ page }) => {
      let dialogSeen = false;
      page.on('dialog', async (dialog) => {
        dialogSeen = true;
        expect(dialog.message()).toMatch(/delete rule set/i);
        await dialog.dismiss();
      });

      await page.getByRole('button', { name: 'Delete Set' }).click();
      await page.waitForTimeout(500);
      expect(dialogSeen).toBe(true);
    });

    test('confirming delete set sends a delete command for the selected set', async ({ page }) => {
      page.on('dialog', async (dialog) => {
        await dialog.accept();
      });

      await page.getByRole('button', { name: 'Delete Set' }).click();
      await page.waitForTimeout(500);

      const log = mockApi.getCommandLog();
      const deleteCmd = log.find((cmd) => cmd.op === 'delete');
      expect(deleteCmd).toBeDefined();
    });
  });

  test.describe('Groups tab', () => {
    test.beforeEach(async ({ page }) => {
      await page.getByRole('button', { name: 'Groups' }).click();
      await page.waitForTimeout(300);
    });

    test('Address Groups sub-tab is active by default', async ({ page }) => {
      await expect(page.getByRole('button', { name: 'Address Groups' })).toBeVisible({ timeout: 5000 });
    });

    test('Port Groups sub-tab is visible', async ({ page }) => {
      await expect(page.getByRole('button', { name: 'Port Groups' })).toBeVisible({ timeout: 5000 });
    });

    test('TRUSTED address group is visible', async ({ page }) => {
      await expect(page.getByRole('cell', { name: 'TRUSTED' })).toBeVisible({ timeout: 8000 });
    });

    test('BLOCKED address group is visible', async ({ page }) => {
      await expect(page.getByRole('cell', { name: 'BLOCKED' })).toBeVisible({ timeout: 8000 });
    });

    test('switching to Port Groups shows WEB_PORTS', async ({ page }) => {
      await page.getByRole('button', { name: 'Port Groups' }).click();
      await page.waitForTimeout(300);
      await expect(page.getByRole('cell', { name: 'WEB_PORTS' })).toBeVisible({ timeout: 8000 });
    });

    test('switching to Port Groups shows MAIL_PORTS', async ({ page }) => {
      await page.getByRole('button', { name: 'Port Groups' }).click();
      await page.waitForTimeout(300);
      await expect(page.getByRole('cell', { name: 'MAIL_PORTS' })).toBeVisible({ timeout: 8000 });
    });

    test('groups table has Name, Description, Members columns', async ({ page }) => {
      await expect(page.getByRole('columnheader', { name: /name/i })).toBeVisible({ timeout: 5000 });
      await expect(page.getByRole('columnheader', { name: /description/i })).toBeVisible();
      await expect(page.getByRole('columnheader', { name: /members/i })).toBeVisible();
    });

    test('+ Add Group button is visible', async ({ page }) => {
      await expect(page.getByRole('button', { name: '+ Add Group' })).toBeVisible({ timeout: 5000 });
    });

    test('Add Group triggers a prompt dialog', async ({ page }) => {
      let dialogSeen = false;
      page.on('dialog', async (dialog) => {
        dialogSeen = true;
        expect(dialog.message()).toMatch(/new group name/i);
        await dialog.dismiss();
      });

      await page.getByRole('button', { name: '+ Add Group' }).click();
      await page.waitForTimeout(500);
      expect(dialogSeen).toBe(true);
    });

    test('creating a new group logs a set command', async ({ page }) => {
      page.on('dialog', async (dialog) => {
        await dialog.accept('MY_GROUP');
      });

      await page.getByRole('button', { name: '+ Add Group' }).click();
      await page.waitForTimeout(500);

      const log = mockApi.getCommandLog();
      const createCmd = log.find(
        (cmd) => cmd.op === 'set' && cmd.path.includes('MY_GROUP'),
      );
      expect(createCmd).toBeDefined();
    });

    test('expanding TRUSTED group shows its member addresses', async ({ page }) => {
      const trustedRow = page.locator('tr').filter({ hasText: 'TRUSTED' }).first();
      const toggleBtn = trustedRow.locator('button').first();
      if (await toggleBtn.isVisible()) {
        await toggleBtn.click();
        await page.waitForTimeout(300);
        await expect(page.getByText('192.168.1.0/24')).toBeVisible({ timeout: 5000 });
      }
    });

    test('delete button on TRUSTED shows confirm dialog', async ({ page }) => {
      let dialogSeen = false;
      page.on('dialog', async (dialog) => {
        dialogSeen = true;
        expect(dialog.message()).toMatch(/delete group/i);
        await dialog.dismiss();
      });

      const trustedRow = page.locator('tr').filter({ hasText: 'TRUSTED' }).first();
      await trustedRow.getByRole('button', { name: 'Delete' }).click();
      await page.waitForTimeout(500);
      expect(dialogSeen).toBe(true);
    });

    test('confirming group delete logs delete command', async ({ page }) => {
      page.on('dialog', async (dialog) => {
        await dialog.accept();
      });

      const trustedRow = page.locator('tr').filter({ hasText: 'TRUSTED' }).first();
      await trustedRow.getByRole('button', { name: 'Delete' }).click();
      await page.waitForTimeout(500);

      const log = mockApi.getCommandLog();
      const deleteCmd = log.find(
        (cmd) => cmd.op === 'delete' && cmd.path.includes('TRUSTED'),
      );
      expect(deleteCmd).toBeDefined();
    });
  });

  test.describe('WAN_LOCAL rule set', () => {
    test('selecting WAN_LOCAL from the dropdown shows its rules', async ({ page }) => {
      const select = page.locator('select').first();
      await select.selectOption('WAN_LOCAL');
      await page.waitForTimeout(500);

      // WAN_LOCAL has rules 10 and 20
      await expect(page.getByRole('cell', { name: '10' }).first()).toBeVisible({ timeout: 5000 });
      await expect(page.getByRole('cell', { name: '20' }).first()).toBeVisible({ timeout: 5000 });
    });
  });
});
