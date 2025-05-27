<template>
  <div class="designer-container" ref="containerRef">
    <!-- 左侧组件面板 -->
    <div class="component-panel" ref="componentPanelRef">
      <slot name="component-panel"></slot>
    </div>

    <!-- 中间画布区域 -->
    <div class="canvas-container" ref="canvasRef">
      <div class="canvas-content">
        <slot name="canvas"></slot>
      </div>
    </div>

    <!-- 右侧属性面板 -->
    <div class="property-panel" ref="propertyPanelRef">
      <slot name="property-panel"></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue';
import '@/styles/designer-layout.scss';

const containerRef = ref<HTMLElement>();
const componentPanelRef = ref<HTMLElement>();
const canvasRef = ref<HTMLElement>();
const propertyPanelRef = ref<HTMLElement>();

// 计算并调整布局
const adjustLayout = () => {
  if (!containerRef.value || !componentPanelRef.value || !canvasRef.value || !propertyPanelRef.value) {
    return;
  }

  const containerWidth = containerRef.value.clientWidth;
  
  // 根据屏幕宽度动态计算面板宽度
  let componentWidth: number;
  let propertyWidth: number;
  let minCanvasWidth: number;

  if (containerWidth >= 1440) {
    // 大屏幕
    componentWidth = 220;
    propertyWidth = 260;
    minCanvasWidth = 500;
  } else if (containerWidth >= 1200) {
    // 中等屏幕
    componentWidth = 200;
    propertyWidth = 240;
    minCanvasWidth = 400;
  } else if (containerWidth >= 1024) {
    // 小屏幕
    componentWidth = 180;
    propertyWidth = 220;
    minCanvasWidth = 350;
  } else if (containerWidth >= 768) {
    // 平板
    componentWidth = 160;
    propertyWidth = 200;
    minCanvasWidth = 300;
  } else {
    // 手机
    componentWidth = 140;
    propertyWidth = 180;
    minCanvasWidth = 250;
  }

  // 计算总的侧边栏宽度
  const totalSidebarWidth = componentWidth + propertyWidth;
  
  // 检查是否有足够空间
  if (containerWidth < totalSidebarWidth + minCanvasWidth) {
    // 空间不足，按比例缩小侧边栏
    const availableWidth = containerWidth - minCanvasWidth;
    const ratio = availableWidth / totalSidebarWidth;
    
    if (ratio > 0.6) { // 如果比例不是太小，按比例缩放
      componentWidth = Math.floor(componentWidth * ratio);
      propertyWidth = Math.floor(propertyWidth * ratio);
    } else {
      // 比例太小，使用最小宽度
      componentWidth = Math.max(120, Math.floor(availableWidth * 0.4));
      propertyWidth = Math.max(140, availableWidth - componentWidth);
    }
  }

  // 应用计算出的宽度
  componentPanelRef.value.style.width = `${componentWidth}px`;
  propertyPanelRef.value.style.width = `${propertyWidth}px`;
  
  // 确保画布区域正确计算
  const canvasWidth = containerWidth - componentWidth - propertyWidth;
  canvasRef.value.style.width = `${canvasWidth}px`;
  canvasRef.value.style.flexBasis = `${canvasWidth}px`;
};

// 防抖函数
const debounce = (func: Function, wait: number) => {
  let timeout: number;
  return function executedFunction(...args: any[]) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = window.setTimeout(later, wait);
  };
};

const debouncedAdjustLayout = debounce(adjustLayout, 100);

// 监听窗口大小变化
const handleResize = () => {
  debouncedAdjustLayout();
};

onMounted(() => {
  nextTick(() => {
    adjustLayout();
  });
  
  window.addEventListener('resize', handleResize);
  
  // 使用 ResizeObserver 监听容器大小变化
  if (containerRef.value && 'ResizeObserver' in window) {
    const resizeObserver = new ResizeObserver(() => {
      debouncedAdjustLayout();
    });
    resizeObserver.observe(containerRef.value);
    
    // 在组件卸载时清理
    onUnmounted(() => {
      resizeObserver.disconnect();
    });
  }
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
});

// 暴露调整布局的方法，供父组件调用
defineExpose({
  adjustLayout
});
</script>

<style scoped>
.designer-container {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  overflow: hidden;
}

/* 确保面板不会被压缩得太小 */
.component-panel {
  min-width: 120px !important;
  max-width: 300px !important;
}

.property-panel {
  min-width: 140px !important;
  max-width: 350px !important;
}

.canvas-container {
  min-width: 200px !important;
  flex-grow: 1;
  flex-shrink: 1;
}
</style> 