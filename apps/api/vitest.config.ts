import path from "node:path";
import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    fileParallelism: false,
    testTimeout: 30000,
  },
  resolve: {
    alias: {
      "@padosipro/validation": path.resolve(root, "../../packages/validation/src/index.ts"),
      "@padosipro/types": path.resolve(root, "../../packages/types/src/index.ts"),
    },
  },
});
