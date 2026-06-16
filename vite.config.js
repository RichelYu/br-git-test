import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  // 相对路径：兼容 Electron 通过 file:// 加载打包后的页面
  base: './',
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
