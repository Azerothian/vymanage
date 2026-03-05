import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e/qemu',
  fullyParallel: false,
  workers: 1,
  timeout: 60_000,
  expect: {
    timeout: 15_000,
  },
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: [['html', { outputFolder: 'playwright-report-qemu' }]],
  use: {
    baseURL: 'http://localhost:3000',
    ignoreHTTPSErrors: true,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'base-tests',
      testDir: './e2e/qemu',
      testIgnore: /config-examples\//,
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'config-examples',
      testDir: './e2e/qemu/config-examples',
      dependencies: ['base-tests'],
      timeout: 180_000,
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npx serve out -l 3000',
    port: 3000,
    reuseExistingServer: true,
  },
});
