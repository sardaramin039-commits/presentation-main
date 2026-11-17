import { defineConfig } from 'vitest/config';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['src/test/setup.ts'],
    include: ['src/**/*.spec.ts'],
    exclude: ['node_modules', 'dist', '.angular'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json-summary'],
      include: ['src/app/core/services/**/*.ts', 'src/app/core/formatters/**/*.ts'],
      exclude: ['**/*.spec.ts', 'src/test/**']
    }
  },
  resolve: {
    alias: {
      '@core': resolve(__dirname, './src/app/core'),
      '@components': resolve(__dirname, './src/app/components'),
      '@test': resolve(__dirname, './src/test')
    }
  }
});
