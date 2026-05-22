import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      'react-i18next': path.resolve(
        __dirname,
        'node_modules/@maill/shared/node_modules/react-i18next',
      ),
    },
  },
  server: {
    port: 5174,
    proxy: {
      '/api': {
        target: process.env.VITE_API_BASE || 'http://localhost:8081',
        changeOrigin: true,
      },
    },
  },
});
