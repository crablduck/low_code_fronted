import { initToolbar } from '@stagewise/toolbar'

/**
 * 初始化 Stagewise AI 辅助工具
 * 根据最新文档使用 initToolbar 方法
 */
export const initStagewiseToolbar = async () => {
  if (import.meta.env.DEV) {
    console.log('🔧 开发模式：启用 Stagewise AI 辅助工具')
    
    try {
      // 定义工具栏配置
      const stagewiseConfig = {
        plugins: [], // 可以在这里添加自定义插件
        theme: 'dark', // 设置主题
        position: 'bottom' // 设置位置
      }
      
      // 使用新的 initToolbar 方法初始化
      initToolbar(stagewiseConfig)
      
      console.log('✅ Stagewise 工具栏已启用')
      console.log('💡 提示：请确保已安装 VS Code 扩展: https://marketplace.visualstudio.com/items?itemName=stagewise.stagewise-vscode-extension')
    } catch (error) {
      console.warn('⚠️ Stagewise 工具栏加载失败:', error)
      console.log('💡 请检查是否已正确安装 @stagewise/toolbar 包')
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