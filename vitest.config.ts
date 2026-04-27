import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    // Tests are pure-utility unit tests; no globals or DOM needed.
    globals: false,
  },
});
