/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/wishlist-checker/',
  build: {
    // Убеждаемся что Service Worker не минифицируется с ошибками
    rollupOptions: {
      input: {
        main: './index.html',
        sw: './public/sw.js'
      },
      output: {
        entryFileNames: (chunkInfo) => {
          return chunkInfo.name === 'sw' ? 'sw.js' : '[name]-[hash].js'
        }
      }
    }
  },
  // @ts-ignore - vitest configuration
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
  },
})
