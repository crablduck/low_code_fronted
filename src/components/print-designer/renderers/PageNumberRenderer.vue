<template>
  <div
    class="page-number-renderer"
    :class="{ 
      'selected': selected, 
      'preview-mode': previewMode,
      'locked': component.locked 
    }"
    :style="pageNumberStyle"
    @click.stop="handleClick"
    @mousedown="handleMouseDown"
    @contextmenu.prevent="handleContextMenu"
  >
    <div class="page-number-content" :style="contentStyle">
      {{ displayText }}
    </div>

    <!-- 选中状态的控制点 -->
    <div v-if="selected && !previewMode" class="resize-handles">
      <div class="resize-handle nw" @mousedown.stop="handleResize('nw', $event)" />
      <div class="resize-handle ne" @mousedown.stop="handleResize('ne', $event)" />
      <div class="resize-handle sw" @mousedown.stop="handleResize('sw', $event)" />
      <div class="resize-handle se" @mousedown.stop="handleResize('se', $event)" />
      <div class="resize-handle n" @mousedown.stop="handleResize('n', $event)" />
      <div class="resize-handle s" @mousedown.stop="handleResize('s', $event)" />
      <div class="resize-handle w" @mousedown.stop="handleResize('w', $event)" />
      <div class="resize-handle e" @mousedown.stop="handleResize('e', $event)" />
    </div>

    <!-- 锁定图标 -->
    <div v-if="component.locked && !previewMode" class="lock-icon">
      <el-icon><Lock /></el-icon>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Lock } from '@element-plus/icons-vue';
import { PageNumberComponent, PreviewData } from '@/types/printDesigner';

// Props
interface Props {
  component: PageNumberComponent;
  selected: boolean;
  previewMode: boolean;
  previewData: PreviewData;
  scale: number;
}

const props = defineProps<Props>();

// Emits
const emit = defineEmits<{
  select: [id: string, event: MouseEvent];
  update: [component: PageNumberComponent];
  delete: [id: string];
  clone: [id: string];
}>();

// 计算页码样式
const pageNumberStyle = computed(() => ({
  position: 'absolute',
  left: `${props.component.x}px`,
  top: `${props.component.y}px`,
  width: `${props.component.width}px`,
  height: `${props.component.height}px`,
  zIndex: props.component.zIndex,
  opacity: props.component.visible ? 1 : 0.5,
  transform: `scale(${props.scale})`,
  transformOrigin: 'top left',
  cursor: props.previewMode ? 'default' : 'move'
}));

const contentStyle = computed(() => ({
  width: '100%',
  height: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: props.component.style.textAlign === 'center' ? 'center' 
    : props.component.style.textAlign === 'right' ? 'flex-end' : 'flex-start',
  fontSize: `${props.component.style.fontSize}px`,
  fontFamily: props.component.style.fontFamily,
  fontWeight: props.component.style.fontWeight,
  color: props.component.style.color,
  lineHeight: '1.2',
  wordWrap: 'break-word',
  wordBreak: 'break-all'
}));

// 计算显示文本
const displayText = computed(() => {
  let text = '';
  
  if (props.previewMode) {
    // 预览模式下显示实际页码
    const currentPage = 1; // 在实际应用中，这应该从预览数据中获取
    const totalPages = 1;   // 在实际应用中，这应该从预览数据中获取
    
    switch (props.component.format) {
      case 'current':
        text = `${currentPage}`;
        break;
      case 'total':
        text = `${totalPages}`;
        break;
      case 'current/total':
        text = `${currentPage}/${totalPages}`;
        break;
      default:
        text = `${currentPage}`;
    }
  } else {
    // 设计模式下显示示例文本
    switch (props.component.format) {
      case 'current':
        text = '1';
        break;
      case 'total':
        text = '10';
        break;
      case 'current/total':
        text = '1/10';
        break;
      default:
        text = '1';
    }
  }
  
  return `${props.component.prefix}${text}${props.component.suffix}`;
});

// 事件处理
const handleClick = (event: MouseEvent) => {
  if (!props.previewMode) {
    emit('select', props.component.id, event);
  }
};

const handleMouseDown = (event: MouseEvent) => {
  if (props.previewMode || props.component.locked) return;
  
  event.preventDefault();
  
  const startX = event.clientX;
  const startY = event.clientY;
  const startLeft = props.component.x;
  const startTop = props.component.y;
  
  const handleMouseMove = (e: MouseEvent) => {
    const deltaX = (e.clientX - startX) / props.scale;
    const deltaY = (e.clientY - startY) / props.scale;
    
    const updatedComponent: PageNumberComponent = {
      ...props.component,
      x: startLeft + deltaX,
      y: startTop + deltaY
    };
    
    emit('update', updatedComponent);
  };
  
  const handleMouseUp = () => {
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };
  
  document.addEventListener('mousemove', handleMouseMove);
  document.addEventListener('mouseup', handleMouseUp);
};

const handleResize = (direction: string, event: MouseEvent) => {
  event.preventDefault();
  event.stopPropagation();
  
  const startX = event.clientX;
  const startY = event.clientY;
  const startWidth = props.component.width;
  const startHeight = props.component.height;
  const startLeft = props.component.x;
  const startTop = props.component.y;
  
  const handleMouseMove = (e: MouseEvent) => {
    const deltaX = (e.clientX - startX) / props.scale;
    const deltaY = (e.clientY - startY) / props.scale;
    
    let newWidth = startWidth;
    let newHeight = startHeight;
    let newX = startLeft;
    let newY = startTop;
    
    switch (direction) {
      case 'se':
        newWidth = Math.max(30, startWidth + deltaX);
        newHeight = Math.max(20, startHeight + deltaY);
        break;
      case 'sw':
        newWidth = Math.max(30, startWidth - deltaX);
        newHeight = Math.max(20, startHeight + deltaY);
        newX = startLeft + deltaX;
        break;
      case 'ne':
        newWidth = Math.max(30, startWidth + deltaX);
        newHeight = Math.max(20, startHeight - deltaY);
        newY = startTop + deltaY;
        break;
      case 'nw':
        newWidth = Math.max(30, startWidth - deltaX);
        newHeight = Math.max(20, startHeight - deltaY);
        newX = startLeft + deltaX;
        newY = startTop + deltaY;
        break;
      case 'e':
        newWidth = Math.max(30, startWidth + deltaX);
        break;
      case 'w':
        newWidth = Math.max(30, startWidth - deltaX);
        newX = startLeft + deltaX;
        break;
      case 's':
        newHeight = Math.max(20, startHeight + deltaY);
        break;
      case 'n':
        newHeight = Math.max(20, startHeight - deltaY);
        newY = startTop + deltaY;
        break;
    }
    
    const updatedComponent: PageNumberComponent = {
      ...props.component,
      x: newX,
      y: newY,
      width: newWidth,
      height: newHeight
    };
    
    emit('update', updatedComponent);
  };
  
  const handleMouseUp = () => {
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };
  
  document.addEventListener('mousemove', handleMouseMove);
  document.addEventListener('mouseup', handleMouseUp);
};

const handleContextMenu = (event: MouseEvent) => {
  if (!props.previewMode) {
    emit('select', props.component.id, event);
  }
};
</script>

<style scoped>
.page-number-renderer {
  border: 2px solid transparent;
  position: relative;
}

.page-number-renderer.selected {
  border-color: #409eff;
}

.page-number-renderer.locked {
  border-color: #f56c6c;
}

.page-number-content {
  user-select: none;
  overflow: hidden;
}

.resize-handles {
  position: absolute;
  top: -4px;
  left: -4px;
  right: -4px;
  bottom: -4px;
  pointer-events: none;
}

.resize-handle {
  position: absolute;
  background: #409eff;
  border: 1px solid #fff;
  pointer-events: all;
  z-index: 1000;
}

.resize-handle.nw,
.resize-handle.ne,
.resize-handle.sw,
.resize-handle.se {
  width: 8px;
  height: 8px;
}

.resize-handle.n,
.resize-handle.s {
  width: 8px;
  height: 4px;
  left: 50%;
  transform: translateX(-50%);
}

.resize-handle.w,
.resize-handle.e {
  width: 4px;
  height: 8px;
  top: 50%;
  transform: translateY(-50%);
}

.resize-handle.nw {
  top: -4px;
  left: -4px;
  cursor: nw-resize;
}

.resize-handle.ne {
  top: -4px;
  right: -4px;
  cursor: ne-resize;
}

.resize-handle.sw {
  bottom: -4px;
  left: -4px;
  cursor: sw-resize;
}

.resize-handle.se {
  bottom: -4px;
  right: -4px;
  cursor: se-resize;
}

.resize-handle.n {
  top: -2px;
  cursor: n-resize;
}

.resize-handle.s {
  bottom: -2px;
  cursor: s-resize;
}

.resize-handle.w {
  left: -2px;
  cursor: w-resize;
}

.resize-handle.e {
  right: -2px;
  cursor: e-resize;
}

.lock-icon {
  position: absolute;
  top: -20px;
  right: -20px;
  color: #f56c6c;
  font-size: 16px;
}
</style> 