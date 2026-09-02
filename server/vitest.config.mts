import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Without this, vitest's default glob also picks up the compiled
    // dist/**/*.test.js output from `npm run build` (tsc -b), which is
    // CommonJS and fails under vitest's ESM loader.
    exclude: ["**/node_modules/**", "**/dist/**"],
  },
});
