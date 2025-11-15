import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'edge-runtime',
    include: ['tests/**/*.test.ts'],
    exclude: ['node_modules', 'convex/_generated', 'tests/**/*.eval.ts'],
    server: {
      deps: { inline: ['convex-test'] },
    },
    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: './test-results/coverage',
      exclude: [
        'node_modules/**',
        'convex/_generated/**',
        'tests/**',
        '*.config.ts',
        '*.config.js',
        'scripts/**',
        'dist/**',
        '.convex/**',
      ],
      include: ['convex/**/*.ts'],
      // Thresholds (fail tests if coverage below these values)
      thresholds: {
        lines: 60,
        functions: 60,
        branches: 50,
        statements: 60,
      },
    },
    // Parallel execution for faster tests
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: false,
        maxThreads: 4, // Run up to 4 test files in parallel
      },
    },
    // Test output
    outputFile: {
      json: './test-results/summary.json',
    },
  },
  resolve: {
    alias: {
      '~': path.resolve(__dirname, './convex'),
    },
  },
});
