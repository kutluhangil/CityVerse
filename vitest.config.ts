import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['sim/**/*.test.ts'],
    exclude: ['e2e/**', 'node_modules/**', 'dist/**'],
  },
});
