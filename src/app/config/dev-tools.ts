import { createApp } from 'vue'
import type { StagewiseToolbar } from '@stagewise/toolbar-vue'

/**
 * 初始化 Stagewise AI 辅助工具
 */
export const initStagewiseToolbar = async () => {
  if (import.meta.env.DEV) {
    console.log('🔧 开发模式：启用 Stagewise AI 辅助工具')
    
    try {
      const { StagewiseToolbar } = await import('@stagewise/toolbar-vue')
      
      // 创建工具栏容器
      const toolbarContainer = document.createElement('div')
      toolbarContainer.id = 'stagewise-toolbar'
      document.body.appendChild(toolbarContainer)
      
      // 创建并挂载 stagewise 工具栏
      const toolbarApp = createApp(StagewiseToolbar, {
        theme: 'dark',
        position: 'bottom'
      })
      
      toolbarApp.mount('#stagewise-toolbar')
      console.log('✅ Stagewise 工具栏已启用')
    } catch (error) {
      console.warn('⚠️ Stagewise 工具栏加载失败:', error)
    }
  } else {
    console.log('🚀 生产模式：Stagewise 工具栏已禁用')
  }
}

/**
 * 修复 passive 事件监听器警告
 */
export const fixPassiveEventListeners = () => {
  if (!import.meta.env.DEV) return
  
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