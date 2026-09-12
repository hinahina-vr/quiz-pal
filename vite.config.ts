import { defineConfig } from "vitest/config";
import { resolve } from "node:path";

export default defineConfig(({ command }) => ({
  base: "./",
  // Build assets are copied explicitly so removed vendor directories can never
  // leak into a distribution. The dev server still serves `public` normally.
  publicDir: command === "build" ? false : "public",
  resolve: {
    alias: {
      "native-ui/jsx-dev-runtime": resolve(import.meta.dirname, "src/native-ui/jsx-dev-runtime.ts"),
      "native-ui/jsx-runtime": resolve(import.meta.dirname, "src/native-ui/jsx-runtime.ts"),
      "native-ui": resolve(import.meta.dirname, "src/native-ui/core.ts"),
    },
  },
  build: {
    rollupOptions: {
      input: {
        studio: resolve(import.meta.dirname, "studio.html"),
      },
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./tests/setup.ts"],
    include: ["tests/**/*.test.{ts,tsx}"],
  },
}));
