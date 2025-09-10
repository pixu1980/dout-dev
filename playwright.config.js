import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  expect: {
    toHaveScreenshot: {
      animations: 'disabled',
      maxDiffPixelRatio: 0.01,
    },
  },
  fullyParallel: false,
  testDir: './tests/visual',
  timeout: 30_000,
  use: {
    ...devices['Desktop Chrome'],
    baseURL: 'http://127.0.0.1:4173',
    colorScheme: 'light',
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'pnpm exec vite preview --host 127.0.0.1 --port 4173',
    port: 4173,
    reuseExistingServer: !process.env.CI,
  },
});
