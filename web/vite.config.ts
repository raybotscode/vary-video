import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
import {fileURLToPath, URL} from 'node:url';

export default defineConfig({
  base: '/',
  plugins: [react()],
  resolve: {
    alias: {
      '@vary/shared': fileURLToPath(new URL('../src/shared', import.meta.url)),
      '@vary/compositions': fileURLToPath(new URL('../src/compositions', import.meta.url)),
    },
    // Force all packages to use the same React instance
    dedupe: ['react', 'react-dom'],
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-dom/client',
      '@remotion/player',
      'remotion',
      'remotion/no-react',
      '@remotion/google-fonts/Inter',
    ],
  },
  build: {
    outDir: 'dist',
    minify: true,
  },
  server: {
    allowedHosts: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
});
