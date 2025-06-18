<template>
  <div
    class="image-renderer"
    :class="{ 
      'selected': selected, 
      'preview-mode': previewMode,
      'locked': component.locked 
    }"
    :style="imageStyle"
    @click.stop="handleClick"
    @mousedown="handleMouseDown"
    @contextmenu.prevent="handleContextMenu"
  >
    <div class="image-container">
      <img 
        v-if="component.src"
        :src="component.src" 
        :alt="component.alt"
        :style="imgStyle"
        @error="handleImageError"
        @load="handleImageLoad"
      />
      <div v-else class="placeholder">
        <el-icon class="placeholder-icon"><Picture /></el-icon>
        <span class="placeholder-text">点击选择图片</span>
      </div>
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
import { computed, ref } from 'vue';
import { Lock, Picture } from '@element-plus/icons-vue';
import { ImageComponent, PreviewData } from '@/shared/types/printDesigner';

// Props
interface Props {
  component: ImageComponent;
  selected: boolean;
  previewMode: boolean;
  previewData: PreviewData;
  scale: number;
}

const props = defineProps<Props>();

// Emits
const emit = defineEmits<{
  select: [id: string, event: MouseEvent];
  update: [component: ImageComponent];
  delete: [id: string];
  clone: [id: string];
}>();

// 状态
const imageLoaded = ref(false);
const imageError = ref(false);

// 计算图片样式
const imageStyle = computed(() => ({
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

const imgStyle = computed(() => ({
  width: '100%',
  height: '100%',
  objectFit: props.component.style.objectFit,
  border: props.component.style.border 
    ? `${props.component.style.border.width}px ${props.component.style.border.style} ${props.component.style.border.color}`
    : 'none',
  borderRadius: '2px'
}));

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
    
    const updatedComponent: ImageComponent = {
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
        newHeight = Math.max(30, startHeight + deltaY);
        break;
      case 'sw':
        newWidth = Math.max(30, startWidth - deltaX);
        newHeight = Math.max(30, startHeight + deltaY);
        newX = startLeft + deltaX;
        break;
      case 'ne':
        newWidth = Math.max(30, startWidth + deltaX);
        newHeight = Math.max(30, startHeight - deltaY);
        newY = startTop + deltaY;
        break;
      case 'nw':
        newWidth = Math.max(30, startWidth - deltaX);
        newHeight = Math.max(30, startHeight - deltaY);
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
        newHeight = Math.max(30, startHeight + deltaY);
        break;
      case 'n':
        newHeight = Math.max(30, startHeight - deltaY);
        newY = startTop + deltaY;
        break;
    }
    
    const updatedComponent: ImageComponent = {
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

const handleImageLoad = () => {
  imageLoaded.value = true;
  imageError.value = false;
};

const handleImageError = () => {
  imageLoaded.value = false;
  imageError.value = true;
};
</script>

<style scoped>
.image-renderer {
  border: 2px solid transparent;
  position: relative;
}

.image-renderer.selected {
  border-color: #409eff;
}

.image-renderer.locked {
  border-color: #f56c6c;
}

.image-container {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: #f5f5f5;
  border: 2px dashed #ddd;
  color: #999;
  font-size: 12px;
}

.placeholder-icon {
  font-size: 24px;
  margin-bottom: 8px;
}

.placeholder-text {
  font-size: 12px;
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