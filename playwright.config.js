import { defineConfig, devices } from "@playwright/test";

const localBrowser = process.env.PLAYWRIGHT_EDGE === "1"
  ? { launchOptions: { executablePath: "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe" } }
  : {};
const port = process.env.PLAYWRIGHT_PORT || "3000";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 60_000,
  reporter: [["list"]],

  use: {
    baseURL: `http://localhost:${port}`,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    viewport: { width: 1440, height: 900 },
  },

  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"], ...localBrowser } }],

  webServer: {
    command: `npm run dev -- --port ${port}`,
    url: `http://localhost:${port}`,
    reuseExistingServer: true,
    timeout: 180_000,
  },
});
