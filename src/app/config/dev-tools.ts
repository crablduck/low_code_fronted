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
 * 修复被动事件监听器
 * 解决 Chrome 中 'Unable to preventDefault inside passive event listener' 警告
 */
export function fixPassiveEventListeners() {
  if (typeof window !== 'undefined') {
    const supportsPassive = (() => {
      let passive = false;
      try {
        const options = Object.defineProperty({}, 'passive', {
          get() {
            passive = true;
            return true;
          }
        });
        window.addEventListener('test', null as any, options);
        window.removeEventListener('test', null as any, options);
      } catch (e) {
        // 忽略错误
      }
      return passive;
    })();

    if (supportsPassive) {
      const noop = () => {};
      window.addEventListener('touchstart', noop, { passive: true });
      window.removeEventListener('touchstart', noop);
    }
  }
} 