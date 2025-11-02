import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [
          ['@babel/plugin-proposal-decorators', { version: '2023-05' }],
        ],
      },
    }),
  ],
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
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.test.ts', 'src/**/*.d.ts'],
    },
  },
});
