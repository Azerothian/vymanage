import { type ElectronApplication, type Page, expect } from '@playwright/test';

// Sends file:opened IPC event from main process to renderer
// This mirrors what happens when --file arg is used or native dialog opens a file
export async function openConfigInElectron(
  electronApp: ElectronApplication,
  page: Page,
  config: Record<string, unknown>,
  fileName: string,
): Promise<void> {
  // Wait for the React app to fully mount and register the onOpenFile listener.
  // The listener is set up in a useEffect after hydration, so we need to wait
  // for the electronAPI to be available and the app to be interactive.
  await page.waitForLoadState('load');
  await page.waitForFunction(
    () => typeof (window as any).electronAPI?.onOpenFile === 'function',
    { timeout: 10000 },
  );
  // Small delay to ensure the useEffect has run and registered the listener
  await page.waitForTimeout(500);

  // Send the file:opened event from main process to renderer
  await electronApp.evaluate(
    ({ BrowserWindow }, { config, fileName }) => {
      const win = BrowserWindow.getAllWindows()[0];
      win?.webContents.send('file:opened', config, fileName);
    },
    { config, fileName },
  );

  // Wait for the app to enter file mode — look for file name in header
  await expect(
    page.getByText(new RegExp(fileName.replace('.', '\\.'), 'i')),
  ).toBeVisible({ timeout: 10000 });
}
