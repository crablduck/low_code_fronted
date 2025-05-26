/*
 * @Author: Mr.Crab wei17306927526@gmail.com
 * @Date: 2025-05-13 13:59:53
 * @LastEditors: Mr.Crab wei17306927526@gmail.com
 * @LastEditTime: 2025-05-23 17:20:06
 * @FilePath: /workflow-system/src/main.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
// @ts-nocheck
import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import router from './router/index'

// Element Plus
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'

const app = createApp(App)

// 注册所有图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

app.use(ElementPlus)
app.use(router)

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
