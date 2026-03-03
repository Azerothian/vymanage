import { test, expect } from '@playwright/test';
import { launchApp, closeApp, mockOpenDialog, mockSaveDialog } from './fixtures/helpers';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';

test.describe('IPC File Operations', () => {
  test('file:open with mocked dialog returns { data, filePath, fileName }', async () => {
    const configPath = path.join(__dirname, 'fixtures', 'sample-configs', 'valid-config.json');
    const { electronApp, page } = await launchApp();
    await mockOpenDialog(electronApp, {
      canceled: false,
      filePaths: [configPath],
    });
    const result = await page.evaluate(() => {
      return (window as any).electronAPI.openFile();
    });
    expect(result).toBeTruthy();
    expect(result.data).toBeTruthy();
    expect(result.data.system).toBeDefined();
    expect(result.data.system['host-name']).toBe('vyos-router');
    expect(result.filePath).toBe(configPath);
    expect(result.fileName).toBe('valid-config.json');
    await closeApp(electronApp);
  });

  test('file:open with cancelled dialog returns null', async () => {
    const { electronApp, page } = await launchApp();
    await mockOpenDialog(electronApp, {
      canceled: true,
      filePaths: [],
    });
    const result = await page.evaluate(() => {
      return (window as any).electronAPI.openFile();
    });
    expect(result).toBeNull();
    await closeApp(electronApp);
  });

  test('file:save writes JSON to temp file', async () => {
    const { electronApp, page } = await launchApp();
    const tmpFile = path.join(os.tmpdir(), `vymanage-test-${Date.now()}.json`);
    const testData = JSON.stringify({ system: { 'host-name': 'save-test' } }, null, 2);
    try {
      const result = await page.evaluate(
        ({ json, filePath }) => {
          return (window as any).electronAPI.saveFile(json, filePath);
        },
        { json: testData, filePath: tmpFile },
      );
      expect(result).toBeTruthy();
      expect(result.filePath).toBe(tmpFile);
      // Verify file was actually written
      const written = fs.readFileSync(tmpFile, 'utf-8');
      expect(JSON.parse(written)).toEqual({ system: { 'host-name': 'save-test' } });
    } finally {
      if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile);
    }
    await closeApp(electronApp);
  });

  test('file:save with invalid path throws error', async () => {
    const { electronApp, page } = await launchApp();
    const result = await page.evaluate(async () => {
      try {
        await (window as any).electronAPI.saveFile('{}', '/nonexistent/dir/file.json');
        return { error: null };
      } catch (e: any) {
        return { error: e.message };
      }
    });
    expect(result.error).toBeTruthy();
    await closeApp(electronApp);
  });

  test('file:saveAs with mocked dialog returns path', async () => {
    const tmpFile = path.join(os.tmpdir(), `vymanage-saveas-${Date.now()}.json`);
    const { electronApp, page } = await launchApp();
    await mockSaveDialog(electronApp, {
      canceled: false,
      filePath: tmpFile,
    });
    const testData = JSON.stringify({ system: { 'host-name': 'saveas-test' } });
    try {
      const result = await page.evaluate(
        (json) => {
          return (window as any).electronAPI.saveFileAs(json);
        },
        testData,
      );
      expect(result).toBeTruthy();
      expect(result.filePath).toBe(tmpFile);
      expect(result.fileName).toBe(path.basename(tmpFile));
      // Verify file was written
      const written = fs.readFileSync(tmpFile, 'utf-8');
      expect(JSON.parse(written)).toEqual({ system: { 'host-name': 'saveas-test' } });
    } finally {
      if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile);
    }
    await closeApp(electronApp);
  });

  test('file:saveAs with cancelled dialog returns null', async () => {
    const { electronApp, page } = await launchApp();
    await mockSaveDialog(electronApp, {
      canceled: true,
    });
    const result = await page.evaluate(() => {
      return (window as any).electronAPI.saveFileAs('{}');
    });
    expect(result).toBeNull();
    await closeApp(electronApp);
  });
});
