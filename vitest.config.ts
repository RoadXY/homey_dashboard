import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: [
      "src/server/**/*.{test,spec}.{js,ts}",
      "src/client/**/*.{test,spec}.{js,ts,jsx,tsx}",
    ],
  },
});
