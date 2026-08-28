import { defineConfig } from 'vite';
import { resolve } from 'node:path';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: './',
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        lighthouse: resolve(__dirname, 'lighthouse.html'),
        lighthousePartner: resolve(__dirname, 'lighthouse-partner.html'),
      },
    },
  },
});
