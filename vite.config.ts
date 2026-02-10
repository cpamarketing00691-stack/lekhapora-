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
        'service-worker': './service-worker.ts'
      },
      output: {
        entryFileNames: (assetInfo) => {
          return assetInfo.name === 'service-worker' ? '[name].js' : 'assets/[name]-[hash].js';
        }
      }
    }
  }
});