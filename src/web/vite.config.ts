import { defineConfig } from 'vite'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import react from '@vitejs/plugin-react'
import tailwindcss from 'tailwindcss'
import autoprefixer from 'autoprefixer'

const here = dirname(fileURLToPath(import.meta.url))

// Build artifacts are emitted to `<repo>/dist`.
export default defineConfig({
  root: here,
  plugins: [react()],
  base: '/',
  build: {
    outDir: '../../dist',
    emptyOutDir: true,
  },
  css: {
    postcss: {
      plugins: [tailwindcss(resolve(here, 'tailwind.config.js')), autoprefixer()],
    },
  },
})
