/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/wishlist-checker/',
  build: {
    rollupOptions: {
      input: './index.html',
      output: {
        manualChunks: {
          dnd: ['@dnd-kit/core', '@dnd-kit/sortable', '@dnd-kit/utilities'],
          motion: ['framer-motion'],
          markdown: ['react-markdown', 'remark-gfm'],
          supabase: ['@supabase/supabase-js']
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
