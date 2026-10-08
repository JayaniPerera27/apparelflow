import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";
import { config } from "dotenv";

config(); // load .env so TEST_DATABASE_URL is available

export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./", import.meta.url)) },
  },
  test: {
    environment: "node",
    setupFiles: ["./tests/setup.ts"],
    testTimeout: 30_000,
    hookTimeout: 60_000,
    fileParallelism: false,
  },
});