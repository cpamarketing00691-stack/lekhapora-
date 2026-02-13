import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: false,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug'],
      },
    },
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            // Core Framework: Bundling together prevents circular dependency issues
            if (
              id.includes('react') || 
              id.includes('react-dom') || 
              id.includes('react-router-dom') ||
              id.includes('scheduler') ||
              id.includes('object-assign')
            ) {
              return 'vendor-core';
            }
            // UI Components & Icons
            if (id.includes('lucide-react') || id.includes('framer-motion')) {
              return 'vendor-ui';
            }
            // Heavy data & analysis tools
            if (id.includes('recharts') || id.includes('supabase') || id.includes('tesseract.js')) {
              return 'vendor-heavy';
            }
            // Generic libraries
            return 'vendor-libs';
          }
          // Code-split application panels for lazy loading
          if (id.includes('/panels/')) {
            const panelName = id.split('/').pop()?.split('.')[0];
            return `panel-${panelName}`;
          }
        },
      },
    },
    chunkSizeWarningLimit: 800,
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', '@supabase/supabase-js', 'lucide-react'],
  },
  server: {
    port: 3000,
  },
});