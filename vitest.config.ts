import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

// Unit tests only (lib/). Browser tests live in e2e/ and run with Playwright.
export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL(".", import.meta.url)) } },
  test: { include: ["lib/**/*.test.ts"] },
});
