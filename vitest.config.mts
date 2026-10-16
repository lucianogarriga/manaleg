import { defineConfig } from "vitest/config";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Mismo alias "@/" que usa la app (tsconfig).
export default defineConfig({
  resolve: {
    alias: { "@": path.resolve(path.dirname(fileURLToPath(import.meta.url)), ".") },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
  },
});
