import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const updaterManifestPath = fileURLToPath(new URL('../docs/update.json', import.meta.url))
const updaterManifest = existsSync(updaterManifestPath)
  ? readFileSync(updaterManifestPath)
  : undefined

const preserveUpdaterManifest = {
  name: 'preserve-updater-manifest',
  closeBundle() {
    if (updaterManifest) writeFileSync(updaterManifestPath, updaterManifest)
  },
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), preserveUpdaterManifest],
  base: '/projman/',
  build: {
    outDir: '../docs',
    emptyOutDir: true,
  },
})
