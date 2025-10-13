import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts"], // only .test.ts files
    reporters: "default",
    globals: true, // enables describe/it/expect without imports
    environment: "node"
  }
});
