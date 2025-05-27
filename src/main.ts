/*
 * @Author: Mr.Crab wei17306927526@gmail.com
 * @Date: 2025-05-13 13:59:53
 * @LastEditors: Mr.Crab wei17306927526@gmail.com
 * @LastEditTime: 2025-05-27 13:03:37
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

const app = createApp(App)
const pinia = createPinia()

// 注册所有图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

app.use(ElementPlus)
app.use(pinia)
app.use(router)

// 修复 passive 事件监听器警告
// 为 wheel、touchstart、touchmove 事件添加 passive 选项
const addPassiveEventListeners = () => {
  const originalAddEventListener = EventTarget.prototype.addEventListener
  EventTarget.prototype.addEventListener = function(type, listener, options) {
    if (typeof options === 'boolean') {
      options = { capture: options }
    }
    if (!options) {
      options = {}
    }
    
    // 为滚动相关事件添加 passive 选项
    if (['wheel', 'mousewheel', 'touchstart', 'touchmove'].includes(type)) {
      options.passive = options.passive !== false
    }
    
    return originalAddEventListener.call(this, type, listener, options)
  }
}

// 在开发环境中应用修复
if (import.meta.env.DEV) {
  addPassiveEventListeners()
}

// 🚀 仅在开发环境中启用 stagewise 工具栏
// 开发模式: npm run dev -> import.meta.env.DEV = true
// 生产模式: npm run build -> import.meta.env.DEV = false
if (import.meta.env.DEV) {
  console.log('🔧 开发模式：启用 Stagewise AI 辅助工具')
  
  // 动态导入 stagewise 工具栏，避免在生产环境中包含
  import('@stagewise/toolbar-vue').then(({ StagewiseToolbar }) => {
    // 创建工具栏容器
    const toolbarContainer = document.createElement('div')
    toolbarContainer.id = 'stagewise-toolbar'
    document.body.appendChild(toolbarContainer)
    
    // 创建并挂载 stagewise 工具栏
    const toolbarApp = createApp(StagewiseToolbar, {
      // 可以在这里配置 stagewise 选项
      theme: 'dark',
      position: 'bottom'
    })
    
    toolbarApp.mount('#stagewise-toolbar')
    
    console.log('✅ Stagewise 工具栏已启用')
  }).catch(error => {
    console.warn('⚠️ Stagewise 工具栏加载失败:', error)
  })
} else {
  console.log('🚀 生产模式：Stagewise 工具栏已禁用')
}

app.mount('#app')
