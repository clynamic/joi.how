import { defineConfig } from 'vitest/config';

// https://vitejs.dev/config/
export default defineConfig({
  esbuild: {
    target: 'es2022',
  },
  server: {
    host: '0.0.0.0',
    port: 5224,
  },
  build: {
    sourcemap: true,
  },
  optimizeDeps: {
    esbuildOptions: {
      sourcemap: false,
    },
    force: true,
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    exclude: ['**/node_modules/**', 'scratch/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.d.ts', 'tests/**/*.test.ts'],
    },
  },
});
