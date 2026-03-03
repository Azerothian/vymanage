import { _electron, type ElectronApplication, type Page, expect } from '@playwright/test';
import * as path from 'path';

const ELECTRON_MAIN = path.join(__dirname, '..', '..', 'dist', 'main.js');

export interface AppContext {
  electronApp: ElectronApplication;
  page: Page;
}

export async function launchApp(opts?: { args?: string[] }): Promise<AppContext> {
  const args = [ELECTRON_MAIN, ...(opts?.args ?? [])];
  const electronApp = await _electron.launch({ args });
  const page = await electronApp.firstWindow();
  // Wait for the page to be ready
  await page.waitForLoadState('domcontentloaded');
  return { electronApp, page };
}

export async function closeApp(electronApp: ElectronApplication): Promise<void> {
  await electronApp.close();
}

export async function mockOpenDialog(
  electronApp: ElectronApplication,
  response: { canceled: boolean; filePaths: string[] },
): Promise<void> {
  await electronApp.evaluate(
    ({ dialog }, resp) => {
      dialog.showOpenDialog = () => Promise.resolve(resp as Electron.OpenDialogReturnValue);
    },
    response,
  );
}

export async function mockSaveDialog(
  electronApp: ElectronApplication,
  response: { canceled: boolean; filePath?: string },
): Promise<void> {
  await electronApp.evaluate(
    ({ dialog }, resp) => {
      dialog.showSaveDialog = () => Promise.resolve(resp as Electron.SaveDialogReturnValue);
    },
    response,
  );
}

export async function navigateToPanel(page: Page, panelName: string): Promise<void> {
  await page.locator('nav, [role="navigation"]').getByText(panelName).click();
  await page.waitForTimeout(500);
}

export async function openTab(page: Page, tabName: string): Promise<void> {
  // Tab buttons are plain <button> elements (not role="tab").
  // Use .last() to target the panel content tab (appears after sidebar in DOM).
  // Use force:true to bypass sidebar popover overlay interception in Electron windows.
  await page.getByRole('button', { name: new RegExp(tabName, 'i') }).last().click({ force: true });
  await page.waitForTimeout(300);
}
