/*
 * @Author: Mr.Crab wei17306927526@gmail.com
 * @Date: 2025-05-13 13:59:53
 * @LastEditors: Mr.Crab wei17306927526@gmail.com
 * @LastEditTime: 2025-06-06 23:19:50
 * @FilePath: /workflow-system/vite.config.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import { resolve } from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueJsx()
  ],
  server: {
    port: 3000,
    host: true,
    strictPort: true,
    proxy: {
      '/api': {
       // target: 'http://localhost:8080',
        target: 'http://172.16.1.107:8080',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  optimizeDeps: {
    include: [
      'echarts',
      'vue3-grid-layout-next',
      '@univerjs/core',
      '@univerjs/design',
      '@univerjs/engine-render',
      '@univerjs/engine-formula',
      '@univerjs/ui',
      '@univerjs/sheets',
      '@univerjs/sheets-ui',
      '@univerjs/presets',
      '@univerjs/presets/preset-sheets-core',
      '@univerjs/presets/preset-sheets-drawing',
      '@univerjs/presets/preset-sheets-advanced'
    ]
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['vue', 'vue-router', 'pinia'],
          element: ['element-plus'],
          charts: ['echarts'],
          univer: [
            '@univerjs/core',
            '@univerjs/design',
            '@univerjs/engine-render',
            '@univerjs/engine-formula',
            '@univerjs/ui',
            '@univerjs/sheets',
            '@univerjs/sheets-ui',
            '@univerjs/presets',
            '@univerjs/presets/preset-sheets-core',
            '@univerjs/presets/preset-sheets-drawing',
            '@univerjs/presets/preset-sheets-advanced'
          ]
        }
      }
    }
  }
})
