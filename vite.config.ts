import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  server: {
    port: 3000,
    host: '0.0.0.0',
  },
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/three/')) return 'three-core';
          if (
            id.includes('@react-three/postprocessing') ||
            id.includes('node_modules/postprocessing/') ||
            id.includes('node_modules/n8ao/')
          ) {
            return 'postprocessing';
          }
          if (
            id.includes('@react-three/') ||
            id.includes('three-stdlib') ||
            id.includes('maath') ||
            id.includes('troika')
          ) {
            return 'r3f-drei';
          }
          if (
            id.includes('node_modules/motion') ||
            id.includes('framer-motion') ||
            id.includes('lucide-react')
          ) {
            return 'ui-motion';
          }
          if (
            id.includes('node_modules/react-dom/') ||
            id.includes('node_modules/react/')
          ) {
            return 'react-vendor';
          }
        },
      },
    },
  },
});
