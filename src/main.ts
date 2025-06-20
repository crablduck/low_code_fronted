/*
 * @Author: Mr.Crab wei17306927526@gmail.com
 * @Date: 2025-05-13 13:59:53
 * @LastEditors: KrabWW wei17306927526@gmail.com
 * @LastEditTime: 2025-06-17 17:52:08
 * @FilePath: /workflow-system/src/main.ts
 * @Description: 应用程序入口文件
 */
// @ts-nocheck
import { createApp } from 'vue'
import './style.css'
import './styles/responsive.css' // 引入响应式工具类
import App from './App.vue'
import router from './router/index'

// Element Plus
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'

// Vue Flow 样式
import '@vue-flow/core/dist/style.css'
import '@vue-flow/core/dist/theme-default.css'

// Pinia 状态管理
import { createPinia } from 'pinia'

// 开发工具
import { initStagewiseToolbar, fixPassiveEventListeners } from '@/app/config/dev-tools'

const app = createApp(App)
const pinia = createPinia()

// 注册所有图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

app.use(ElementPlus)
app.use(pinia)
app.use(router)

// 初始化开发工具
if (import.meta.env.DEV) {
  fixPassiveEventListeners()
  initStagewiseToolbar()
}

// 调试信息 - 检查环境变量是否正确加载
console.log('=== 应用启动环境变量检查 ===')
console.log('VITE_SKIP_AUTH:', import.meta.env.VITE_SKIP_AUTH)
console.log('VITE_API_BASE_URL:', import.meta.env.VITE_API_BASE_URL)
console.log('VITE_DATASOURCE_BASE_URL:', import.meta.env.VITE_DATASOURCE_BASE_URL)

app.mount('#app')
