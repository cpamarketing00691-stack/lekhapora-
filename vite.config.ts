import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: './index.html',
        sw: './service-worker.js'
      },
      output: {
        entryFileNames: (assetInfo) => {
          return assetInfo.name === 'sw' ? '[name].js' : 'assets/[name]-[hash].js';
        }
      }
    }
  }
});