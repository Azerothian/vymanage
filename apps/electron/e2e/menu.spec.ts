import { test, expect } from '@playwright/test';
import { launchApp, closeApp } from './fixtures/helpers';

test.describe('Menu', () => {
  test('File menu has Open Config, Save, Save As, Connect items', async () => {
    const { electronApp, page } = await launchApp();
    const menuLabels = await electronApp.evaluate(({ Menu }) => {
      const menu = Menu.getApplicationMenu();
      if (!menu) return [];
      const fileMenu = menu.items.find((item) => item.label === 'File');
      if (!fileMenu || !fileMenu.submenu) return [];
      return fileMenu.submenu.items.map((item) => item.label).filter((l) => l !== '');
    });
    expect(menuLabels).toContain('Open Config');
    expect(menuLabels).toContain('Save');
    expect(menuLabels).toContain('Save As...');
    expect(menuLabels).toContain('Connect to Device');
    await closeApp(electronApp);
  });

  test('menu "Open Config" sends menu:openFile event to renderer', async () => {
    const { electronApp, page } = await launchApp();
    // Set up a listener in the renderer
    await page.evaluate(() => {
      (window as any).__menuOpenFileFired = false;
      (window as any).electronAPI.onMenuOpenFile(() => {
        (window as any).__menuOpenFileFired = true;
      });
    });
    // Click the menu item from main process
    await electronApp.evaluate(({ Menu }) => {
      const menu = Menu.getApplicationMenu();
      const fileMenu = menu?.items.find((item) => item.label === 'File');
      const openItem = fileMenu?.submenu?.items.find((item) => item.label === 'Open Config');
      openItem?.click(undefined as any, undefined as any, undefined as any);
    });
    await page.waitForTimeout(500);
    const fired = await page.evaluate(() => (window as any).__menuOpenFileFired);
    expect(fired).toBe(true);
    await closeApp(electronApp);
  });

  test('menu "Save" sends menu:save event to renderer', async () => {
    const { electronApp, page } = await launchApp();
    await page.evaluate(() => {
      (window as any).__menuSaveFired = false;
      (window as any).electronAPI.onMenuSave(() => {
        (window as any).__menuSaveFired = true;
      });
    });
    await electronApp.evaluate(({ Menu }) => {
      const menu = Menu.getApplicationMenu();
      const fileMenu = menu?.items.find((item) => item.label === 'File');
      const saveItem = fileMenu?.submenu?.items.find((item) => item.label === 'Save');
      saveItem?.click(undefined as any, undefined as any, undefined as any);
    });
    await page.waitForTimeout(500);
    const fired = await page.evaluate(() => (window as any).__menuSaveFired);
    expect(fired).toBe(true);
    await closeApp(electronApp);
  });

  test('Ctrl+O accelerator is registered on Open Config menu item', async () => {
    const { electronApp, page } = await launchApp();
    const accelerator = await electronApp.evaluate(({ Menu }) => {
      const menu = Menu.getApplicationMenu();
      const fileMenu = menu?.items.find((item) => item.label === 'File');
      const openItem = fileMenu?.submenu?.items.find((item) => item.label === 'Open Config');
      return openItem?.accelerator ?? null;
    });
    expect(accelerator).toBe('CmdOrCtrl+O');
    await closeApp(electronApp);
  });

  test('Ctrl+S accelerator is registered on Save menu item', async () => {
    const { electronApp, page } = await launchApp();
    const accelerator = await electronApp.evaluate(({ Menu }) => {
      const menu = Menu.getApplicationMenu();
      const fileMenu = menu?.items.find((item) => item.label === 'File');
      const saveItem = fileMenu?.submenu?.items.find((item) => item.label === 'Save');
      return saveItem?.accelerator ?? null;
    });
    expect(accelerator).toBe('CmdOrCtrl+S');
    await closeApp(electronApp);
  });
});
