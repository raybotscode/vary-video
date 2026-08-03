import {defineConfig} from 'vitest/config';
import {fileURLToPath, URL} from 'node:url';

export default defineConfig({
  resolve: {
    alias: {
      '@vary/shared': fileURLToPath(new URL('./src/shared', import.meta.url)),
    },
  },
  test: {
    environment: 'node',
    include: [
      'src/**/*.test.ts',
      'web/src/**/*.test.ts',
      'api/src/**/*.test.ts',
    ],
  },
});
