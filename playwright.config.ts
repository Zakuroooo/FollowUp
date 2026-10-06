import { defineConfig } from "@playwright/test";

// Runs against the local app + local Supabase (npx supabase start). Uses the Chrome already installed.
export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  use: { baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3200", channel: "chrome", headless: true },
  reporter: [["list"]],
});
