import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Dev server proxies /api to the local Express server (see server/src/index.ts).
// Production build is served as static files by that same Express server.
// base is overridable via VITE_BASE_PATH for subpath deployments (nginx
// proxying http://host/golf/ -> this app) without changing dev-mode behavior.
export default defineConfig({
  base: process.env.VITE_BASE_PATH ?? '/',
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:4002',
    },
  },
  build: {
    outDir: 'dist',
  },
})
