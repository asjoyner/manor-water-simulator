import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { execSync } from 'child_process'

const commitHash = execSync('git rev-parse --short HEAD').toString().trim()
const commitDate = execSync('git log -1 --format=%cI').toString().trim()
const buildDate = new Date().toISOString()

export default defineConfig({
  plugins: [react()],
  base: './',
  define: {
    __COMMIT_HASH__: JSON.stringify(commitHash),
    __COMMIT_DATE__: JSON.stringify(commitDate),
    __BUILD_DATE__: JSON.stringify(buildDate),
  },
})
