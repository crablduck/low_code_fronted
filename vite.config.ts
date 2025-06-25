/*
 * @Author: Mr.Crab wei17306927526@gmail.com
 * @Date: 2025-05-13 13:59:53
 * @LastEditors: Mr.Crab wei17306927526@gmail.com
 * @LastEditTime: 2025-06-06 23:19:50
 * @FilePath: /workflow-system/vite.config.ts
 * @Description: Vite配置文件
 */
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import { resolve } from 'path'
import { codeInspectorPlugin } from 'code-inspector-plugin'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueJsx(),
    codeInspectorPlugin({
      bundler: 'vite',
    })
  ],
  server: {
    port: 3000,
    host: true,
    proxy: {
      '/api': {
       // target: 'http://localhost:8080',
        target: process.env.VITE_DATASOURCE_BASE_URL || 'http://127.0.0.1:8080',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@/app': resolve(__dirname, 'src/app'),
      '@/shared': resolve(__dirname, 'src/shared'),
      '@/features': resolve(__dirname, 'src/features'),
      '@/layouts': resolve(__dirname, 'src/layouts'),
      '@/assets': resolve(__dirname, 'src/assets'),
      '@/components': resolve(__dirname, 'src/components'),
      '@/views': resolve(__dirname, 'src/views'),
      '@/stores': resolve(__dirname, 'src/stores'),
      '@/api': resolve(__dirname, 'src/api'),
      '@/router': resolve(__dirname, 'src/router')
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
