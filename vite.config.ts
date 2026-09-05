import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: process.env.GITHUB_ACTIONS ? '/three-js-experiement/' : '/',
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: false,
    setupFiles: ['./src/vitest-setup.ts'],
    exclude: ['**/node_modules/**', '**/dist/**', '**/._*'],
  },
})
