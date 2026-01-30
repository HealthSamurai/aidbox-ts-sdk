import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    // Integration tests share database state and must run sequentially.
    // fileParallelism: false - prevents parallel execution of test files.
    // Note: sequence.concurrent only affects tests within a file, not between files.
    // Note: pool: 'forks' with singleFork breaks native fetch in CI (returns undefined).
    fileParallelism: false,
  },
  resolve: {
    alias: {
      '@fhir-types': '@fhir-types',
    },
  },
});
