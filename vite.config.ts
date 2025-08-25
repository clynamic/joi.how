import { defineConfig } from 'vite';
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
});
