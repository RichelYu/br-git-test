import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/riot-api': {
        target: 'https://na1.api.riotgames.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/riot-api\/[^/]+/, ''),
      }
    }
  }
})
