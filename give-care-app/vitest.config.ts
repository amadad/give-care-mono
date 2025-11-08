import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'edge-runtime',
    include: ['tests/**/*.test.ts'],
    exclude: ['node_modules', 'convex/_generated'],
    server: {
      deps: { inline: ['convex-test'] },
    },
  },
  resolve: {
    alias: {
      '~': path.resolve(__dirname, './convex'),
    },
  },
});
