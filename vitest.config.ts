import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/**/*.test.ts"],
  },
  resolve: {
    alias: {
      obsidian: path.resolve(__dirname, "src/test/obsidian-mock.ts"),
    },
  },
});
