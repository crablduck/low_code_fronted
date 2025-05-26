<template>
  <div
    class="table-renderer"
    :class="{ 
      'selected': selected, 
      'preview-mode': previewMode,
      'locked': component.locked 
    }"
    :style="tableStyle"
    @click.stop="handleClick"
    @mousedown="handleMouseDown"
    @contextmenu.prevent="handleContextMenu"
  >
    <table class="print-table" :style="tableInnerStyle">
      <tbody>
        <tr v-for="(row, rowIndex) in tableData" :key="rowIndex">
          <td
            v-for="(cell, colIndex) in row"
            :key="colIndex"
            :colspan="cell.colspan"
            :rowspan="cell.rowspan"
            :style="getCellStyle(cell)"
            class="table-cell"
          >
            {{ getCellContent(cell) }}
          </td>
        </tr>
      </tbody>
    </table>

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
import { Lock } from '@element-plus/icons-vue';
import { TableComponent, PreviewData, TableCell } from '@/types/printDesigner';
import { DataBinding } from '@/utils/printDesigner';

// Props
interface Props {
  component: TableComponent;
  selected: boolean;
  previewMode: boolean;
  previewData: PreviewData;
  scale: number;
}

const props = defineProps<Props>();

// Emits
const emit = defineEmits<{
  select: [id: string, event: MouseEvent];
  update: [component: TableComponent];
  delete: [id: string];
  clone: [id: string];
}>();

// 计算表格样式
const tableStyle = computed(() => ({
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

const tableInnerStyle = computed(() => ({
  width: '100%',
  height: '100%',
  borderCollapse: 'collapse',
  border: `${props.component.style.borderWidth}px solid ${props.component.style.borderColor}`,
  backgroundColor: props.component.style.backgroundColor || 'transparent'
}));

// 计算表格数据
const tableData = computed(() => {
  if (props.previewMode && props.component.dataBinding?.isDetail && props.previewData) {
    // 如果是明细表且有预览数据，使用动态数据
    const dataSource = props.previewData[props.component.dataBinding.source];
    if (Array.isArray(dataSource) && dataSource.length > 0) {
      return generateDynamicTable(dataSource);
    }
  }
  
  // 使用静态表格数据
  return props.component.cells;
});

// 生成动态表格数据
const generateDynamicTable = (dataSource: any[]) => {
  const result: TableCell[][] = [];
  
  // 添加表头（如果原表格有表头）
  if (props.component.cells.length > 0) {
    result.push(props.component.cells[0]);
  }
  
  // 添加数据行
  dataSource.forEach((item, index) => {
    const row: TableCell[] = [];
    for (let col = 0; col < props.component.cols; col++) {
      const templateCell = props.component.cells[1]?.[col] || props.component.cells[0]?.[col];
      if (templateCell) {
        const cell: TableCell = {
          ...templateCell,
          content: templateCell.fieldBinding 
            ? DataBinding.replaceFieldBinding(templateCell.content, item)
            : templateCell.content
        };
        row.push(cell);
      }
    }
    result.push(row);
  });
  
  return result;
};

// 获取单元格样式
const getCellStyle = (cell: TableCell) => ({
  fontSize: `${cell.style.fontSize}px`,
  fontFamily: cell.style.fontFamily,
  fontWeight: cell.style.fontWeight,
  color: cell.style.color,
  textAlign: cell.style.textAlign,
  backgroundColor: cell.style.backgroundColor || 'transparent',
  padding: `${cell.style.padding.top}px ${cell.style.padding.right}px ${cell.style.padding.bottom}px ${cell.style.padding.left}px`,
  border: `1px solid ${props.component.style.borderColor}`,
  verticalAlign: 'middle'
});

// 获取单元格内容
const getCellContent = (cell: TableCell) => {
  if (props.previewMode && cell.fieldBinding && props.previewData) {
    return DataBinding.replaceFieldBinding(cell.content, props.previewData);
  }
  return cell.content;
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
    
    const updatedComponent: TableComponent = {
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
        newWidth = Math.max(50, startWidth + deltaX);
        newHeight = Math.max(30, startHeight + deltaY);
        break;
      case 'sw':
        newWidth = Math.max(50, startWidth - deltaX);
        newHeight = Math.max(30, startHeight + deltaY);
        newX = startLeft + deltaX;
        break;
      case 'ne':
        newWidth = Math.max(50, startWidth + deltaX);
        newHeight = Math.max(30, startHeight - deltaY);
        newY = startTop + deltaY;
        break;
      case 'nw':
        newWidth = Math.max(50, startWidth - deltaX);
        newHeight = Math.max(30, startHeight - deltaY);
        newX = startLeft + deltaX;
        newY = startTop + deltaY;
        break;
      case 'e':
        newWidth = Math.max(50, startWidth + deltaX);
        break;
      case 'w':
        newWidth = Math.max(50, startWidth - deltaX);
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
    
    const updatedComponent: TableComponent = {
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
.table-renderer {
  border: 2px solid transparent;
  position: relative;
}

.table-renderer.selected {
  border-color: #409eff;
}

.table-renderer.locked {
  border-color: #f56c6c;
}

.print-table {
  font-family: inherit;
}

.table-cell {
  word-wrap: break-word;
  word-break: break-all;
  min-height: 20px;
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