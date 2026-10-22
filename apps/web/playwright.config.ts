import { defineConfig, devices } from '@playwright/test'
export default defineConfig({
  testDir: './e2e', fullyParallel: false, workers: 1, timeout: 60_000, expect: { timeout: 10_000 },
  use: { baseURL: 'http://127.0.0.1:3004', reducedMotion: 'reduce', trace: 'retain-on-failure', screenshot: 'only-on-failure',
    launchOptions: process.env.PLAYWRIGHT_CHROMIUM_PATH ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH } : {} },
  projects: [
    { name: 'phone', use: { ...devices['iPhone 13'], defaultBrowserType: 'chromium' } },
    { name: 'small-phone', use: { viewport: { width: 320, height: 740 }, isMobile: true, hasTouch: true } },
    { name: 'landscape-phone', use: { viewport: { width: 844, height: 390 }, isMobile: true, hasTouch: true } },
  ],
  webServer: {
    command: 'node .next/standalone/apps/web/server.js', cwd: '.',
    url: 'http://127.0.0.1:3004/api/health', reuseExistingServer: !process.env.CI,
    env: { PORT: '3004', HOSTNAME: '127.0.0.1', DATA_SOURCE: 'fixtures', REDIS_ENABLED: '0' },
  },
})
