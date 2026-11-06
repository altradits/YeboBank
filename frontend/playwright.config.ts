import { defineConfig, devices } from "@playwright/test";

// Headless only — never launch the Chrome app. The demo runs in mock-data
// mode (default); YEBO_BACKEND stays unset for e2e.
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  retries: 0,
  reporter: "list",
  use: {
    baseURL: "http://127.0.0.1:3100",
    trace: "off",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "npm run dev -- --port 3100 -H 127.0.0.1",
    url: "http://127.0.0.1:3100",
    reuseExistingServer: false,
    timeout: 120000,
    env: { PORT: "3100" },
  },
});
