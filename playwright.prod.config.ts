import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'e2e',
  testMatch: ['quiz.spec.ts', 'smoke.spec.ts', 'perf.spec.ts'],
  timeout: 60000,
  workers: 1,
  reporter: [['list']],
  use: { baseURL: 'http://localhost:4173/wos/mali/', ...devices['Desktop Chrome'], viewport: { width: 1280, height: 720 } },
  webServer: [
    { command: 'npx vite preview --port 4173 --strictPort', url: 'http://localhost:4173/wos/mali/', reuseExistingServer: false, timeout: 60000 },
    {
      command: 'node build/server/server/main.js',
      url: 'http://127.0.0.1:3210/wos/mali/api/health',
      reuseExistingServer: false,
      timeout: 30000,
      env: { HOST_KEY: 'test-host-key-123', QUESTIONS_PATH: 'data/questions.example.json', ALLOWED_ORIGINS: 'http://localhost:4173', POW_BITS: '8' }
    }
  ]
});
