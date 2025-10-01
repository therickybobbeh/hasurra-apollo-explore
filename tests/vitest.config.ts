import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./helpers/setup.ts'],
    testTimeout: 10000,
    hookTimeout: 10000,
  },
});
