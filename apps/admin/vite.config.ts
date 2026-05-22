import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': path.resolve(__dirname, 'src') },
  },
  server: {
    port: 5174,
    proxy: {
      '/api': {
        target: process.env.VITE_API_BASE || 'http://localhost:8081',
        changeOrigin: true,
      },
      '/auth-api': {
        target: process.env.VITE_AUTH_BASE || 'http://localhost:8082',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/auth-api/, ''),
      },
    },
  },
});
