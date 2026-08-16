import { defineConfig } from 'vitest/config'

export default defineConfig({
  // Resolves the `@/*` aliases declared in tsconfig.json.
  resolve: { tsconfigPaths: true },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
