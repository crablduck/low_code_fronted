<template>
  <div
    class="text-renderer"
    :class="{ selected: selected, preview: previewMode }"
    :style="componentStyle"
    @click="handleClick"
    @mousedown="handleMouseDown"
  >
    <!-- 选择框 -->
    <div v-if="selected && !previewMode" class="selection-border">
      <!-- 调整手柄 -->
      <div class="resize-handle resize-handle-nw" @mousedown="handleResizeStart('nw', $event)"></div>
      <div class="resize-handle resize-handle-ne" @mousedown="handleResizeStart('ne', $event)"></div>
      <div class="resize-handle resize-handle-sw" @mousedown="handleResizeStart('sw', $event)"></div>
      <div class="resize-handle resize-handle-se" @mousedown="handleResizeStart('se', $event)"></div>
    </div>

    <!-- 文本内容 -->
    <div class="text-content" :style="textStyle">
      {{ displayText }}
    </div>

    <!-- 右键菜单 -->
    <el-dropdown
      v-if="!previewMode"
      ref="contextMenu"
      trigger="contextmenu"
      @command="handleContextCommand"
    >
      <span />
      <template #dropdown>
        <el-dropdown-menu>
          <el-dropdown-item command="edit">
            <el-icon><Edit /></el-icon>
            编辑文本
          </el-dropdown-item>
          <el-dropdown-item command="copy">
            <el-icon><DocumentCopy /></el-icon>
            复制
          </el-dropdown-item>
          <el-dropdown-item command="delete" divided>
            <el-icon><Delete /></el-icon>
            删除
          </el-dropdown-item>
        </el-dropdown-menu>
      </template>
    </el-dropdown>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { Edit, DocumentCopy, Delete } from '@element-plus/icons-vue';
import { TextComponent, PreviewData } from '@/shared/types/printDesigner';

// Props
interface Props {
  component: TextComponent;
  selected: boolean;
  previewMode: boolean;
  previewData: PreviewData;
  scale: number;
}

const props = defineProps<Props>();

// Emits
const emit = defineEmits<{
  select: [id: string, multiSelect?: boolean];
  update: [component: TextComponent];
  delete: [id: string];
  clone: [component: TextComponent];
}>();

// 响应式数据
const contextMenu = ref();
const isDragging = ref(false);
const isResizing = ref(false);
const resizeDirection = ref('');
const startPosition = ref({ x: 0, y: 0 });
const startSize = ref({ width: 0, height: 0 });

// 计算属性
const componentStyle = computed(() => ({
  position: 'absolute',
  left: `${props.component.x}px`,
  top: `${props.component.y}px`,
  width: `${props.component.width}px`,
  height: `${props.component.height}px`,
  zIndex: props.component.zIndex,
  cursor: props.previewMode ? 'default' : 'move',
  opacity: props.component.visible ? 1 : 0.5,
  pointerEvents: props.component.locked ? 'none' : 'auto'
}));

const textStyle = computed(() => ({
  fontSize: `${props.component.style.fontSize}px`,
  fontFamily: props.component.style.fontFamily,
  fontWeight: props.component.style.fontWeight,
  color: props.component.style.color,
  textAlign: props.component.style.textAlign,
  lineHeight: props.component.style.lineHeight,
  width: '100%',
  height: '100%',
  display: 'flex',
  alignItems: 'center',
  padding: '4px',
  wordBreak: 'break-word',
  overflow: 'hidden'
}));

const displayText = computed(() => {
  let text = props.component.content;
  
  // 如果有字段绑定且有预览数据，则替换字段
  if (props.component.fieldBinding && props.previewData) {
    const fieldPattern = /\{\{(\w+)\}\}/g;
    text = text.replace(fieldPattern, (match, fieldName) => {
      const value = props.previewData[fieldName];
      return value !== undefined ? String(value) : match;
    });
  }
  
  return text || '文本内容';
});

// 事件处理
const handleClick = (event: MouseEvent) => {
  if (!props.previewMode) {
    event.stopPropagation();
    emit('select', props.component.id, event.ctrlKey || event.metaKey);
  }
};

const handleMouseDown = (event: MouseEvent) => {
  if (props.previewMode || props.component.locked) return;
  
  event.preventDefault();
  event.stopPropagation();
  
  isDragging.value = true;
  startPosition.value = {
    x: event.clientX - props.component.x,
    y: event.clientY - props.component.y
  };
  
  document.addEventListener('mousemove', handleMouseMove);
  document.addEventListener('mouseup', handleMouseUp);
};

const handleMouseMove = (event: MouseEvent) => {
  if (isDragging.value) {
    const newX = event.clientX - startPosition.value.x;
    const newY = event.clientY - startPosition.value.y;
    
    const updatedComponent = {
      ...props.component,
      x: Math.max(0, newX),
      y: Math.max(0, newY)
    };
    
    emit('update', updatedComponent);
  } else if (isResizing.value) {
    handleResize(event);
  }
};

const handleMouseUp = () => {
  isDragging.value = false;
  isResizing.value = false;
  resizeDirection.value = '';
  
  document.removeEventListener('mousemove', handleMouseMove);
  document.removeEventListener('mouseup', handleMouseUp);
};

const handleResizeStart = (direction: string, event: MouseEvent) => {
  event.preventDefault();
  event.stopPropagation();
  
  isResizing.value = true;
  resizeDirection.value = direction;
  startPosition.value = { x: event.clientX, y: event.clientY };
  startSize.value = {
    width: props.component.width,
    height: props.component.height
  };
  
  document.addEventListener('mousemove', handleMouseMove);
  document.addEventListener('mouseup', handleMouseUp);
};

const handleResize = (event: MouseEvent) => {
  const deltaX = event.clientX - startPosition.value.x;
  const deltaY = event.clientY - startPosition.value.y;
  
  let newWidth = startSize.value.width;
  let newHeight = startSize.value.height;
  let newX = props.component.x;
  let newY = props.component.y;
  
  switch (resizeDirection.value) {
    case 'se': // 右下角
      newWidth = Math.max(20, startSize.value.width + deltaX);
      newHeight = Math.max(20, startSize.value.height + deltaY);
      break;
    case 'sw': // 左下角
      newWidth = Math.max(20, startSize.value.width - deltaX);
      newHeight = Math.max(20, startSize.value.height + deltaY);
      newX = props.component.x + (startSize.value.width - newWidth);
      break;
    case 'ne': // 右上角
      newWidth = Math.max(20, startSize.value.width + deltaX);
      newHeight = Math.max(20, startSize.value.height - deltaY);
      newY = props.component.y + (startSize.value.height - newHeight);
      break;
    case 'nw': // 左上角
      newWidth = Math.max(20, startSize.value.width - deltaX);
      newHeight = Math.max(20, startSize.value.height - deltaY);
      newX = props.component.x + (startSize.value.width - newWidth);
      newY = props.component.y + (startSize.value.height - newHeight);
      break;
  }
  
  const updatedComponent = {
    ...props.component,
    x: Math.max(0, newX),
    y: Math.max(0, newY),
    width: newWidth,
    height: newHeight
  };
  
  emit('update', updatedComponent);
};

const handleContextCommand = (command: string) => {
  switch (command) {
    case 'edit':
      // 触发编辑模式
      break;
    case 'copy':
      emit('clone', props.component);
      break;
    case 'delete':
      emit('delete', props.component.id);
      break;
  }
};
</script>

<style scoped>
.text-renderer {
  border: 1px solid transparent;
  transition: all 0.2s ease;
  user-select: none;
}

.text-renderer:hover:not(.preview) {
  border-color: #409eff;
}

.text-renderer.selected {
  border-color: #409eff;
}

.text-renderer.preview {
  border: none;
}

.selection-border {
  position: absolute;
  top: -2px;
  left: -2px;
  right: -2px;
  bottom: -2px;
  border: 2px solid #409eff;
  pointer-events: none;
}

.resize-handle {
  position: absolute;
  width: 8px;
  height: 8px;
  background: #409eff;
  border: 1px solid #fff;
  border-radius: 50%;
  pointer-events: auto;
  z-index: 10;
}

.resize-handle-nw {
  top: -4px;
  left: -4px;
  cursor: nw-resize;
}

.resize-handle-ne {
  top: -4px;
  right: -4px;
  cursor: ne-resize;
}

.resize-handle-sw {
  bottom: -4px;
  left: -4px;
  cursor: sw-resize;
}

.resize-handle-se {
  bottom: -4px;
  right: -4px;
  cursor: se-resize;
}

.text-content {
  pointer-events: none;
}

/* 拖拽状态 */
.text-renderer.dragging {
  opacity: 0.8;
  transform: rotate(2deg);
}

/* 锁定状态 */
.text-renderer.locked {
  opacity: 0.6;
  cursor: not-allowed;
}

.text-renderer.locked .resize-handle {
  display: none;
}
</style> 