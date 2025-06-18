<template>
  <div
    class="qrcode-renderer"
    :class="{ 
      'selected': selected, 
      'preview-mode': previewMode,
      'locked': component.locked 
    }"
    :style="qrcodeStyle"
    @click.stop="handleClick"
    @mousedown="handleMouseDown"
    @contextmenu.prevent="handleContextMenu"
  >
    <div class="qrcode-container" ref="qrcodeContainer">
      <canvas ref="qrcodeCanvas" :style="canvasStyle" />
    </div>

    <!-- 选中状态的控制点 -->
    <div v-if="selected && !previewMode" class="resize-handles">
      <div class="resize-handle nw" @mousedown.stop="handleResize('nw', $event)" />
      <div class="resize-handle ne" @mousedown.stop="handleResize('ne', $event)" />
      <div class="resize-handle sw" @mousedown.stop="handleResize('sw', $event)" />
      <div class="resize-handle se" @mousedown.stop="handleResize('se', $event)" />
    </div>

    <!-- 锁定图标 -->
    <div v-if="component.locked && !previewMode" class="lock-icon">
      <el-icon><Lock /></el-icon>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, watch, nextTick } from 'vue';
import { Lock } from '@element-plus/icons-vue';
import QRCode from 'qrcode';
import { QRCodeComponent, PreviewData } from '@/shared/types/printDesigner';
import { DataBinding } from '@/shared/utils/printDesigner';

// Props
interface Props {
  component: QRCodeComponent;
  selected: boolean;
  previewMode: boolean;
  previewData: PreviewData;
  scale: number;
}

const props = defineProps<Props>();

// Emits
const emit = defineEmits<{
  select: [id: string, event: MouseEvent];
  update: [component: QRCodeComponent];
  delete: [id: string];
  clone: [id: string];
}>();

// Refs
const qrcodeCanvas = ref<HTMLCanvasElement>();
const qrcodeContainer = ref<HTMLDivElement>();

// 计算二维码样式
const qrcodeStyle = computed(() => ({
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

const canvasStyle = computed(() => ({
  width: '100%',
  height: '100%',
  display: 'block'
}));

// 计算二维码内容
const qrcodeContent = computed(() => {
  if (props.previewMode && props.component.fieldBinding && props.previewData) {
    return DataBinding.replaceFieldBinding(props.component.content, props.previewData);
  }
  return props.component.content || 'QR Code';
});

// 生成二维码
const generateQRCode = async () => {
  if (!qrcodeCanvas.value) return;
  
  try {
    const canvas = qrcodeCanvas.value;
    const size = Math.min(props.component.width, props.component.height);
    
    canvas.width = size;
    canvas.height = size;
    
    await QRCode.toCanvas(canvas, qrcodeContent.value, {
      errorCorrectionLevel: props.component.options.errorCorrectionLevel,
      margin: props.component.options.margin,
      color: {
        dark: props.component.options.color.dark,
        light: props.component.options.color.light
      },
      width: size
    });
  } catch (error) {
    console.error('生成二维码失败:', error);
    
    // 如果生成失败，显示错误信息
    const canvas = qrcodeCanvas.value;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#f5f5f5';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#999';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('二维码生成失败', canvas.width / 2, canvas.height / 2);
      }
    }
  }
};

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
    
    const updatedComponent: QRCodeComponent = {
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
    
    // 保持正方形比例
    const delta = Math.max(Math.abs(deltaX), Math.abs(deltaY));
    const signX = deltaX >= 0 ? 1 : -1;
    const signY = deltaY >= 0 ? 1 : -1;
    
    switch (direction) {
      case 'se':
        newWidth = Math.max(30, startWidth + delta * signX);
        newHeight = newWidth;
        break;
      case 'sw':
        newWidth = Math.max(30, startWidth - delta * signX);
        newHeight = newWidth;
        newX = startLeft + startWidth - newWidth;
        break;
      case 'ne':
        newWidth = Math.max(30, startWidth + delta * signX);
        newHeight = newWidth;
        newY = startTop + startHeight - newHeight;
        break;
      case 'nw':
        newWidth = Math.max(30, startWidth - delta * signX);
        newHeight = newWidth;
        newX = startLeft + startWidth - newWidth;
        newY = startTop + startHeight - newHeight;
        break;
    }
    
    const updatedComponent: QRCodeComponent = {
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

// 监听内容变化，重新生成二维码
watch([qrcodeContent, () => props.component.width, () => props.component.height], () => {
  nextTick(() => {
    generateQRCode();
  });
});

// 组件挂载后生成二维码
onMounted(() => {
  nextTick(() => {
    generateQRCode();
  });
});
</script>

<style scoped>
.qrcode-renderer {
  border: 2px solid transparent;
  position: relative;
}

.qrcode-renderer.selected {
  border-color: #409eff;
}

.qrcode-renderer.locked {
  border-color: #f56c6c;
}

.qrcode-container {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
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
  width: 8px;
  height: 8px;
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

.lock-icon {
  position: absolute;
  top: -20px;
  right: -20px;
  color: #f56c6c;
  font-size: 16px;
}
</style> 