/*
 * @Author: Mr.Crab wei17306927526@gmail.com
 * @Date: 2025-05-13 13:59:53
 * @LastEditors: KrabWW wei17306927526@gmail.com
 * @LastEditTime: 2025-06-17 17:52:08
 * @FilePath: /workflow-system/src/main.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
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
import { initStagewiseToolbar, fixPassiveEventListeners } from './config/dev-tools'

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

app.mount('#app')
