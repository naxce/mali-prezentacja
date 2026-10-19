import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'e2e',
  testIgnore: ['perf.spec.ts'],
  timeout: 60000,
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:5173/wos/mali/',
    ...devices['Desktop Chrome'],
    viewport: { width: 1280, height: 720 }
  },
  webServer: [
    {
      command: 'npx vite --port 5173 --strictPort',
      url: 'http://localhost:5173/wos/mali/',
      reuseExistingServer: true,
      timeout: 60000
    },
    {
      command: 'node server/main.ts',
      url: 'http://127.0.0.1:3210/wos/mali/api/health',
      reuseExistingServer: false,
      timeout: 30000,
      env: {
        HOST_KEY: 'test-host-key-123',
        QUESTIONS_PATH: 'data/questions.example.json',
        ALLOWED_ORIGINS: 'http://localhost:5173',
        POW_BITS: '8'
      }
    }
  ]
});
