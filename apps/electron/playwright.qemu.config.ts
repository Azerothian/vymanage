import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e/qemu',
  workers: 1,
  fullyParallel: false,
  timeout: 60_000,
  expect: {
    timeout: 15_000,
  },
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: [['list']],
});
