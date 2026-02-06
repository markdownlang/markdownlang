import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  base: './',
  resolve: {
    alias: {
      fs: resolve(__dirname, 'src/node-stubs.ts'),
      path: resolve(__dirname, 'src/node-stubs.ts'),
    },
  },
});
