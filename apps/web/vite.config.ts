import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      // Use ESM TypeScript source in Vite; the package's CommonJS dist output
      // cannot expose its `export *` bindings as browser named exports.
      '@ocj/contracts': fileURLToPath(new URL('../../packages/contracts/index.ts', import.meta.url)),
    },
  },
})
