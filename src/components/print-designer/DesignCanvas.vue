<template>
  <div class="design-canvas" ref="canvasContainer">
    <!-- 工具栏 -->
    <div class="canvas-toolbar">
      <div class="toolbar-left">
        <el-button-group>
          <el-button 
            :icon="ZoomOut" 
            size="small" 
            @click="zoomOut"
            :disabled="scale <= 0.25"
          />
          <el-button size="small" @click="resetZoom">
            {{ Math.round(scale * 100) }}%
          </el-button>
          <el-button 
            :icon="ZoomIn" 
            size="small" 
            @click="zoomIn"
            :disabled="scale >= 3"
          />
        </el-button-group>

        <el-divider direction="vertical" />

        <el-button-group>
          <el-button 
            :icon="Grid" 
            size="small" 
            :type="gridConfig.visible ? 'primary' : 'default'"
            @click="toggleGrid"
          />
          <el-button 
            :icon="Magnet" 
            size="small" 
            :type="gridConfig.snap ? 'primary' : 'default'"
            @click="toggleSnap"
          />
        </el-button-group>

        <el-divider direction="vertical" />

        <el-button-group>
          <el-button 
            :icon="Back" 
            size="small" 
            @click="undo"
            :disabled="!canUndo"
          />
          <el-button 
            :icon="Right" 
            size="small" 
            @click="redo"
            :disabled="!canRedo"
          />
        </el-button-group>
      </div>

      <div class="toolbar-right">
        <el-button 
          :icon="View" 
          size="small" 
          :type="previewMode ? 'primary' : 'default'"
          @click="togglePreview"
        >
          {{ previewMode ? '退出预览' : '预览' }}
        </el-button>
      </div>
    </div>

    <!-- 画布区域 -->
    <div class="canvas-wrapper" @scroll="handleScroll">
      <div 
        class="canvas-content"
        :style="canvasContentStyle"
        @drop="handleDrop"
        @dragover="handleDragOver"
        @click="handleCanvasClick"
      >
        <!-- 页面背景 -->
        <div 
          class="page-background"
          :style="pageStyle"
          ref="pageElement"
        >
          <!-- 网格 -->
          <div 
            v-if="gridConfig.visible && !previewMode"
            class="grid-overlay"
            :style="gridStyle"
          />

          <!-- 标尺 -->
          <div v-if="rulerConfig.enabled && !previewMode" class="rulers">
            <div class="ruler ruler-horizontal" :style="horizontalRulerStyle" />
            <div class="ruler ruler-vertical" :style="verticalRulerStyle" />
          </div>

          <!-- 组件渲染 -->
          <component
            v-for="component in components"
            :key="component.id"
            :is="getComponentRenderer(component.type)"
            :component="component"
            :selected="selectedIds.includes(component.id)"
            :preview-mode="previewMode"
            :preview-data="previewData"
            :scale="scale"
            @select="handleComponentSelect"
            @update="handleComponentUpdate"
            @delete="handleComponentDelete"
            @clone="handleComponentClone"
          />

          <!-- 选择框 -->
          <div
            v-if="selectionBox.visible"
            class="selection-box"
            :style="selectionBoxStyle"
          />

          <!-- 拖拽指示器 -->
          <div
            v-if="dragIndicator.visible"
            class="drag-indicator"
            :style="dragIndicatorStyle"
          />
        </div>
      </div>
    </div>

    <!-- 右键菜单 -->
    <el-dropdown
      ref="contextMenu"
      trigger="contextmenu"
      @command="handleContextMenuCommand"
    >
      <span />
      <template #dropdown>
        <el-dropdown-menu>
          <el-dropdown-item command="copy" :disabled="selectedIds.length === 0">
            <el-icon><DocumentCopy /></el-icon>
            复制
          </el-dropdown-item>
          <el-dropdown-item command="paste" :disabled="clipboard.length === 0">
            <el-icon><Document /></el-icon>
            粘贴
          </el-dropdown-item>
          <el-dropdown-item command="delete" :disabled="selectedIds.length === 0" divided>
            <el-icon><Delete /></el-icon>
            删除
          </el-dropdown-item>
          <el-dropdown-item command="selectAll">
            <el-icon><Select /></el-icon>
            全选
          </el-dropdown-item>
          <el-dropdown-item command="bringToFront" :disabled="selectedIds.length === 0" divided>
            <el-icon><Top /></el-icon>
            置于顶层
          </el-dropdown-item>
          <el-dropdown-item command="sendToBack" :disabled="selectedIds.length === 0">
            <el-icon><Bottom /></el-icon>
            置于底层
          </el-dropdown-item>
        </el-dropdown-menu>
      </template>
    </el-dropdown>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue';
import { 
  ZoomIn, 
  ZoomOut, 
  Grid, 
  Magnet, 
  Back, 
  Right, 
  View,
  DocumentCopy,
  Document,
  Delete,
  Select,
  Top,
  Bottom
} from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import { 
  PrintComponent, 
  PageConfig, 
  GridConfig, 
  RulerConfig,
  PreviewData,
  ComponentType
} from '@/types/printDesigner';
import { 
  UnitConverter, 
  ComponentFactory, 
  GridSnap,
  HistoryManager
} from '@/utils/printDesigner';

// 导入组件渲染器
import TextRenderer from './renderers/TextRenderer.vue';
import LineRenderer from './renderers/LineRenderer.vue';
import TableRenderer from './renderers/TableRenderer.vue';
import QRCodeRenderer from './renderers/QRCodeRenderer.vue';
import BarcodeRenderer from './renderers/BarcodeRenderer.vue';
import ImageRenderer from './renderers/ImageRenderer.vue';
import PageNumberRenderer from './renderers/PageNumberRenderer.vue';

// Props
interface Props {
  components: PrintComponent[];
  pageConfig: PageConfig;
  gridConfig: GridConfig;
  rulerConfig: RulerConfig;
  selectedIds: string[];
  clipboard: PrintComponent[];
  previewMode: boolean;
  previewData: PreviewData;
  canUndo: boolean;
  canRedo: boolean;
}

const props = defineProps<Props>();

// Emits
const emit = defineEmits<{
  'update:components': [components: PrintComponent[]];
  'update:selectedIds': [ids: string[]];
  'update:clipboard': [components: PrintComponent[]];
  'update:gridConfig': [config: GridConfig];
  'update:previewMode': [mode: boolean];
  componentAdd: [component: PrintComponent];
  componentUpdate: [component: PrintComponent];
  componentDelete: [id: string];
  undo: [];
  redo: [];
  saveHistory: [description: string];
}>();

// 响应式数据
const canvasContainer = ref<HTMLElement>();
const pageElement = ref<HTMLElement>();
const contextMenu = ref();
const scale = ref(1);
const scrollPosition = ref({ x: 0, y: 0 });

// 选择框状态
const selectionBox = ref({
  visible: false,
  startX: 0,
  startY: 0,
  endX: 0,
  endY: 0
});

// 拖拽指示器状态
const dragIndicator = ref({
  visible: false,
  x: 0,
  y: 0,
  width: 100,
  height: 50
});

// 计算属性
const pageSize = computed(() => UnitConverter.getPageSizePx(props.pageConfig));

const canvasContentStyle = computed(() => ({
  transform: `scale(${scale.value})`,
  transformOrigin: 'top left'
}));

const pageStyle = computed(() => {
  const size = pageSize.value;
  return {
    width: `${size.width}px`,
    height: `${size.height}px`,
    background: '#ffffff',
    boxShadow: '0 0 20px rgba(0,0,0,0.1)',
    position: 'relative',
    margin: '50px auto',
    overflow: 'hidden'
  };
});

const gridStyle = computed(() => {
  const gridSize = props.gridConfig.size;
  return {
    backgroundImage: `
      linear-gradient(to right, #e0e0e0 1px, transparent 1px),
      linear-gradient(to bottom, #e0e0e0 1px, transparent 1px)
    `,
    backgroundSize: `${gridSize}px ${gridSize}px`,
    width: '100%',
    height: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
    pointerEvents: 'none',
    opacity: 0.5
  };
});

const horizontalRulerStyle = computed(() => ({
  width: `${pageSize.value.width}px`,
  height: '20px',
  position: 'absolute',
  top: '-20px',
  left: '0',
  background: '#f5f5f5',
  borderBottom: '1px solid #ddd'
}));

const verticalRulerStyle = computed(() => ({
  width: '20px',
  height: `${pageSize.value.height}px`,
  position: 'absolute',
  top: '0',
  left: '-20px',
  background: '#f5f5f5',
  borderRight: '1px solid #ddd'
}));

const selectionBoxStyle = computed(() => ({
  position: 'absolute',
  left: `${Math.min(selectionBox.value.startX, selectionBox.value.endX)}px`,
  top: `${Math.min(selectionBox.value.startY, selectionBox.value.endY)}px`,
  width: `${Math.abs(selectionBox.value.endX - selectionBox.value.startX)}px`,
  height: `${Math.abs(selectionBox.value.endY - selectionBox.value.startY)}px`,
  border: '1px dashed #409eff',
  background: 'rgba(64, 158, 255, 0.1)',
  pointerEvents: 'none'
}));

const dragIndicatorStyle = computed(() => ({
  position: 'absolute',
  left: `${dragIndicator.value.x}px`,
  top: `${dragIndicator.value.y}px`,
  width: `${dragIndicator.value.width}px`,
  height: `${dragIndicator.value.height}px`,
  border: '2px dashed #409eff',
  background: 'rgba(64, 158, 255, 0.1)',
  pointerEvents: 'none'
}));

// 获取组件渲染器
const getComponentRenderer = (type: ComponentType) => {
  const rendererMap = {
    text: TextRenderer,
    line: LineRenderer,
    table: TableRenderer,
    qrcode: QRCodeRenderer,
    barcode: BarcodeRenderer,
    image: ImageRenderer,
    pageNumber: PageNumberRenderer
  };
  return rendererMap[type] || TextRenderer;
};

// 缩放控制
const zoomIn = () => {
  if (scale.value < 3) {
    scale.value = Math.min(3, scale.value + 0.25);
  }
};

const zoomOut = () => {
  if (scale.value > 0.25) {
    scale.value = Math.max(0.25, scale.value - 0.25);
  }
};

const resetZoom = () => {
  scale.value = 1;
};

// 网格控制
const toggleGrid = () => {
  emit('update:gridConfig', {
    ...props.gridConfig,
    visible: !props.gridConfig.visible
  });
};

const toggleSnap = () => {
  emit('update:gridConfig', {
    ...props.gridConfig,
    snap: !props.gridConfig.snap
  });
};

// 预览模式
const togglePreview = () => {
  emit('update:previewMode', !props.previewMode);
};

// 历史记录
const undo = () => {
  emit('undo');
};

const redo = () => {
  emit('redo');
};

// 拖拽处理
const handleDragOver = (event: DragEvent) => {
  event.preventDefault();
  event.dataTransfer!.dropEffect = 'copy';
  
  // 显示拖拽指示器
  const rect = pageElement.value!.getBoundingClientRect();
  const x = (event.clientX - rect.left) / scale.value;
  const y = (event.clientY - rect.top) / scale.value;
  
  dragIndicator.value = {
    visible: true,
    x: props.gridConfig.snap ? GridSnap.snapToGrid(x, props.gridConfig.size) : x,
    y: props.gridConfig.snap ? GridSnap.snapToGrid(y, props.gridConfig.size) : y,
    width: 100,
    height: 50
  };
};

const handleDrop = (event: DragEvent) => {
  event.preventDefault();
  dragIndicator.value.visible = false;
  
  try {
    const data = JSON.parse(event.dataTransfer!.getData('application/json'));
    const rect = pageElement.value!.getBoundingClientRect();
    let x = (event.clientX - rect.left) / scale.value;
    let y = (event.clientY - rect.top) / scale.value;
    
    // 网格吸附
    if (props.gridConfig.snap) {
      x = GridSnap.snapToGrid(x, props.gridConfig.size);
      y = GridSnap.snapToGrid(y, props.gridConfig.size);
    }
    
    if (data.type === 'component') {
      // 创建新组件
      const component = ComponentFactory.createComponent(data.componentType, x, y);
      
      // 应用默认属性
      if (data.defaultProps) {
        Object.assign(component, data.defaultProps);
        component.x = x;
        component.y = y;
      }
      
      emit('componentAdd', component);
      emit('update:selectedIds', [component.id]);
      emit('saveHistory', `添加${data.componentType}组件`);
      
    } else if (data.type === 'field') {
      // 创建绑定字段的文本组件
      const component = ComponentFactory.createComponent('text', x, y);
      component.content = `{{${data.fieldName}}}`;
      component.fieldBinding = `{{${data.fieldName}}}`;
      
      emit('componentAdd', component);
      emit('update:selectedIds', [component.id]);
      emit('saveHistory', `添加字段${data.fieldLabel}`);
    }
    
  } catch (error) {
    console.error('拖拽数据解析失败:', error);
    ElMessage.error('拖拽数据格式错误');
  }
};

// 画布点击
const handleCanvasClick = (event: MouseEvent) => {
  if (event.target === pageElement.value) {
    emit('update:selectedIds', []);
  }
};

// 组件事件处理
const handleComponentSelect = (id: string, multiSelect: boolean = false) => {
  if (multiSelect) {
    const newSelectedIds = props.selectedIds.includes(id)
      ? props.selectedIds.filter(selectedId => selectedId !== id)
      : [...props.selectedIds, id];
    emit('update:selectedIds', newSelectedIds);
  } else {
    emit('update:selectedIds', [id]);
  }
};

const handleComponentUpdate = (component: PrintComponent) => {
  emit('componentUpdate', component);
};

const handleComponentDelete = (id: string) => {
  emit('componentDelete', id);
  emit('saveHistory', '删除组件');
};

const handleComponentClone = (component: PrintComponent) => {
  const cloned = ComponentFactory.cloneComponent(component);
  emit('componentAdd', cloned);
  emit('update:selectedIds', [cloned.id]);
  emit('saveHistory', '克隆组件');
};

// 右键菜单
const handleContextMenuCommand = (command: string) => {
  switch (command) {
    case 'copy':
      copySelectedComponents();
      break;
    case 'paste':
      pasteComponents();
      break;
    case 'delete':
      deleteSelectedComponents();
      break;
    case 'selectAll':
      selectAllComponents();
      break;
    case 'bringToFront':
      bringToFront();
      break;
    case 'sendToBack':
      sendToBack();
      break;
  }
};

// 复制选中组件
const copySelectedComponents = () => {
  const selectedComponents = props.components.filter(c => 
    props.selectedIds.includes(c.id)
  );
  emit('update:clipboard', selectedComponents);
  ElMessage.success(`已复制 ${selectedComponents.length} 个组件`);
};

// 粘贴组件
const pasteComponents = () => {
  const newComponents = props.clipboard.map(component => 
    ComponentFactory.cloneComponent(component, 20, 20)
  );
  
  newComponents.forEach(component => {
    emit('componentAdd', component);
  });
  
  emit('update:selectedIds', newComponents.map(c => c.id));
  emit('saveHistory', `粘贴 ${newComponents.length} 个组件`);
  ElMessage.success(`已粘贴 ${newComponents.length} 个组件`);
};

// 删除选中组件
const deleteSelectedComponents = () => {
  props.selectedIds.forEach(id => {
    emit('componentDelete', id);
  });
  emit('update:selectedIds', []);
  emit('saveHistory', `删除 ${props.selectedIds.length} 个组件`);
};

// 全选组件
const selectAllComponents = () => {
  emit('update:selectedIds', props.components.map(c => c.id));
};

// 置于顶层
const bringToFront = () => {
  const maxZIndex = Math.max(...props.components.map(c => c.zIndex));
  props.selectedIds.forEach(id => {
    const component = props.components.find(c => c.id === id);
    if (component) {
      emit('componentUpdate', { ...component, zIndex: maxZIndex + 1 });
    }
  });
  emit('saveHistory', '置于顶层');
};

// 置于底层
const sendToBack = () => {
  const minZIndex = Math.min(...props.components.map(c => c.zIndex));
  props.selectedIds.forEach(id => {
    const component = props.components.find(c => c.id === id);
    if (component) {
      emit('componentUpdate', { ...component, zIndex: minZIndex - 1 });
    }
  });
  emit('saveHistory', '置于底层');
};

// 滚动处理
const handleScroll = (event: Event) => {
  const target = event.target as HTMLElement;
  scrollPosition.value = {
    x: target.scrollLeft,
    y: target.scrollTop
  };
};

// 键盘事件处理
const handleKeyDown = (event: KeyboardEvent) => {
  if (event.ctrlKey || event.metaKey) {
    switch (event.key) {
      case 'z':
        event.preventDefault();
        if (event.shiftKey) {
          redo();
        } else {
          undo();
        }
        break;
      case 'c':
        event.preventDefault();
        copySelectedComponents();
        break;
      case 'v':
        event.preventDefault();
        pasteComponents();
        break;
      case 'a':
        event.preventDefault();
        selectAllComponents();
        break;
    }
  } else if (event.key === 'Delete') {
    event.preventDefault();
    deleteSelectedComponents();
  }
};

// 生命周期
onMounted(() => {
  document.addEventListener('keydown', handleKeyDown);
});

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeyDown);
});
</script>

<style scoped>
.design-canvas {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: #f5f5f5;
  position: relative;
}

.canvas-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 16px;
  background: #ffffff;
  border-bottom: 1px solid #e4e7ed;
  box-shadow: 0 1px 4px rgba(0,0,0,0.1);
}

.toolbar-left,
.toolbar-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.canvas-wrapper {
  flex: 1;
  overflow: auto;
  position: relative;
}

.canvas-content {
  min-width: 100%;
  min-height: 100%;
  transition: transform 0.2s ease;
}

.page-background {
  position: relative;
  border: 1px solid #ddd;
}

.grid-overlay {
  position: absolute;
  top: 0;
  left: 0;
  pointer-events: none;
}

.rulers {
  position: absolute;
  top: 0;
  left: 0;
  pointer-events: none;
}

.ruler {
  background: #f5f5f5;
  border: 1px solid #ddd;
  font-size: 10px;
  color: #666;
}

.selection-box {
  z-index: 1000;
}

.drag-indicator {
  z-index: 999;
  border-radius: 4px;
}

/* 滚动条样式 */
.canvas-wrapper::-webkit-scrollbar {
  width: 12px;
  height: 12px;
}

.canvas-wrapper::-webkit-scrollbar-track {
  background: #f1f1f1;
}

.canvas-wrapper::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 6px;
}

.canvas-wrapper::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

.canvas-wrapper::-webkit-scrollbar-corner {
  background: #f1f1f1;
}

/* 预览模式样式 */
.design-canvas.preview-mode .page-background {
  box-shadow: none;
  border: none;
}

.design-canvas.preview-mode .grid-overlay,
.design-canvas.preview-mode .rulers {
  display: none;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .canvas-toolbar {
    padding: 4px 8px;
    flex-wrap: wrap;
    gap: 8px;
  }
  
  .toolbar-left,
  .toolbar-right {
    gap: 4px;
  }
}
</style> 