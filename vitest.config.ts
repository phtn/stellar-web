import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    coverage: {
      reporter: ['text', 'html'],
    },
    include: [
      'services/**/*.test.ts',
      'services/**/__tests__/**/*.ts',
    ],
  },
}) 