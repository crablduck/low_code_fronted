<template>
  <div class="designer-canvas" @dragover.prevent @drop="handleDrop">
    <!-- 快捷操作工具栏 -->
    <div class="canvas-toolbar" v-if="hasCharts">
      <el-button-group size="small">
        <el-button @click="handleSelectAll">
          <el-icon><Select /></el-icon>
          全选
        </el-button>
        <el-button @click="handleClearAll" type="danger">
          <el-icon><Delete /></el-icon>
          清空
        </el-button>
        <el-button @click="handleAutoLayout">
          <el-icon><Grid /></el-icon>
          自动布局
        </el-button>
        <el-button @click="handleExport">
          <el-icon><Download /></el-icon>
          导出
        </el-button>
      </el-button-group>
    </div>

    <!-- 空状态提示 -->
    <div v-if="!hasCharts" class="empty-canvas">
      <div class="empty-content">
        <div class="empty-icon">
          <el-icon><DataBoard /></el-icon>
        </div>
        <h3>开始创建你的仪表盘</h3>
        <p>从左侧拖拽图表类型或组件到此区域开始设计</p>
        <div class="empty-tips">
          <div class="tip-item">
            <span class="tip-number">1</span>
            <span>选择图表类型</span>
          </div>
          <div class="tip-item">
            <span class="tip-number">2</span>
            <span>拖拽到画布</span>
          </div>
          <div class="tip-item">
            <span class="tip-number">3</span>
            <span>配置图表属性</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Grid Layout 画布 -->
          <grid-layout
        v-if="hasCharts"
        :layout="layout"
        @layout-updated="handleLayoutUpdate"
        :col-num="12"
        :row-height="30"
      :is-draggable="!isPreview"
      :is-resizable="!isPreview"
      :vertical-compact="false"
      :use-css-transforms="true"
      :margin="[10, 10]"
      @update:layout="handleLayoutUpdate"
      @click="handleCanvasClick"
      :class="{ 'show-grid': showGridHelper }"
    >
      <grid-item
        v-for="item in layout"
        :key="item.i"
        :x="item.x"
        :y="item.y"
        :w="item.w"
        :h="item.h"
        :i="item.i"
        @resize="handleResize"
        @resized="handleResized"
        @move="handleMove"
        @moved="handleMoved"
        @contextmenu="handleChartContextMenu($event, item)"
        drag-allow-from=".chart-drag-handler"
        :drag-ignore-from="'.chart-actions, .el-select, .el-input, .el-date-editor, .el-slider, .el-button'"
        class="grid-chart-item"
        :class="{ 
          'selected': selectedChart?.i === item.i,
          'preview-mode': isPreview
        }"
      >
        <ChartItem
          :item="item"
          :is-preview="isPreview"
          :is-selected="selectedChart?.i === item.i"
          :key="`${item.i}-${item.w}-${item.h}`"
          @update-config="(config) => handleUpdateConfig(item.i, config)"
          @remove="handleDeleteChart(item.i)"
          @duplicate="handleCopyChart(item.i)"
          @chart-click="handleChartClick(item.i)"
        />
      </grid-item>
    </grid-layout>
  </div>
</template>

<script setup lang="ts">
// @ts-ignore
import { GridLayout, GridItem } from 'vue3-grid-layout-next'
import ChartItem from './ChartItem.vue'
import { 
  Select, 
  Delete, 
  Grid, 
  Download, 
  DataBoard 
} from '@element-plus/icons-vue'
import type { LayoutItem, ChartConfig } from '@/shared/types/dashboard'

interface Props {
  layout: LayoutItem[]
  selectedChart: ChartConfig | null
  isPreview: boolean
  showGridHelper: boolean
  hasCharts: boolean
}

interface Emits {
  (e: 'update:layout', layout: LayoutItem[]): void
  (e: 'drop', event: DragEvent): void
  (e: 'chart-click', chartId: string): void
  (e: 'canvas-click'): void
  (e: 'chart-context-menu', event: MouseEvent, item: LayoutItem): void
  (e: 'update-config', itemId: string, config: any): void
  (e: 'delete-chart', chartId: string): void
  (e: 'copy-chart', chartId: string): void
  (e: 'select-all'): void
  (e: 'clear-all'): void
  (e: 'auto-layout'): void
  (e: 'export'): void
  (e: 'resize', i: string, newH: number, newW: number, newHPx: number, newWPx: number): void
  (e: 'resized', i: string, newH: number, newW: number, newHPx: number, newWPx: number): void
  (e: 'move', i: string, newX: number, newY: number): void
  (e: 'moved', i: string, newX: number, newY: number): void
}

defineProps<Props>()
const emit = defineEmits<Emits>()

const handleDrop = (event: DragEvent) => {
  emit('drop', event)
}

const handleLayoutUpdate = (newLayout: LayoutItem[]) => {
  emit('update:layout', newLayout)
}

const handleChartClick = (chartId: string) => {
  emit('chart-click', chartId)
}

const handleCanvasClick = () => {
  emit('canvas-click')
}

const handleChartContextMenu = (event: MouseEvent, item: LayoutItem) => {
  emit('chart-context-menu', event, item)
}

const handleUpdateConfig = (itemId: string, config: any) => {
  emit('update-config', itemId, config)
}

const handleDeleteChart = (chartId: string) => {
  emit('delete-chart', chartId)
}

const handleCopyChart = (chartId: string) => {
  emit('copy-chart', chartId)
}

const handleSelectAll = () => {
  emit('select-all')
}

const handleClearAll = () => {
  emit('clear-all')
}

const handleAutoLayout = () => {
  emit('auto-layout')
}

const handleExport = () => {
  emit('export')
}

const handleResize = (i: string, newH: number, newW: number, newHPx: number, newWPx: number) => {
  emit('resize', i, newH, newW, newHPx, newWPx)
}

const handleResized = (i: string, newH: number, newW: number, newHPx: number, newWPx: number) => {
  emit('resized', i, newH, newW, newHPx, newWPx)
}

const handleMove = (i: string, newX: number, newY: number) => {
  emit('move', i, newX, newY)
}

const handleMoved = (i: string, newX: number, newY: number) => {
  emit('moved', i, newX, newY)
}
</script>

<style lang="scss" scoped>
.designer-canvas {
  flex: 1;
  height: 100%;
  background: #f5f7fa;
  position: relative;
  overflow: auto;
  
  .canvas-toolbar {
    display: flex;
    justify-content: center;
    padding: 12px;
    background: white;
    border-bottom: 1px solid #e4e7ed;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    
    .el-button-group {
      .el-button {
        font-size: 12px;
        padding: 8px 12px;
        
        .el-icon {
          margin-right: 4px;
        }
        
        &.el-button--danger {
          &:hover {
            background: #f56c6c;
            border-color: #f56c6c;
          }
        }
      }
    }
  }
  
  .empty-canvas {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    min-height: 400px;
    
    .empty-content {
      text-align: center;
      padding: 60px 40px;
      
      .empty-icon {
        margin-bottom: 24px;
        
        .el-icon {
          font-size: 80px;
          color: #d3d3d3;
          transition: all 0.3s ease;
        }
      }
      
      h3 {
        margin: 0 0 12px 0;
        font-size: 20px;
        font-weight: 600;
        color: #606266;
      }
      
      p {
        margin: 0 0 32px 0;
        font-size: 14px;
        color: #909399;
        line-height: 1.6;
      }
      
      .empty-tips {
        display: flex;
        justify-content: center;
        gap: 24px;
        
        .tip-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          
          .tip-number {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 32px;
            height: 32px;
            background: #409eff;
            color: white;
            border-radius: 50%;
            font-size: 14px;
            font-weight: 600;
          }
          
          span:last-child {
            font-size: 12px;
            color: #606266;
            font-weight: 500;
          }
        }
      }
    }
    
    &:hover .empty-content .empty-icon .el-icon {
      color: #409eff;
      transform: scale(1.05);
    }
  }
  
  :deep(.vue-grid-layout) {
    &.show-grid {
      background-image: 
        linear-gradient(rgba(64, 158, 255, 0.1) 1px, transparent 1px),
        linear-gradient(90deg, rgba(64, 158, 255, 0.1) 1px, transparent 1px);
      background-size: 20px 20px;
    }
    
    .vue-grid-item {
      &.vue-grid-placeholder {
        background: rgba(64, 158, 255, 0.2);
        border: 2px dashed #409eff;
        border-radius: 8px;
        opacity: 1;
        z-index: 2;
        user-select: none;
        transition: all 0.2s ease;
      }
    }
  }
  
  .grid-chart-item {
    background: white;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    transition: all 0.3s ease;
    
    &:hover {
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
    }
    
    &.selected {
      border: 2px solid #409eff;
      box-shadow: 0 4px 16px rgba(64, 158, 255, 0.3);
    }
    
    &.preview-mode {
      cursor: default;
      
      &:hover {
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      }
    }
  }
}

// 响应式设计
@media (max-width: 768px) {
  .designer-canvas {
    .canvas-toolbar {
      padding: 8px;
      
      .el-button-group .el-button {
        font-size: 11px;
        padding: 6px 8px;
      }
    }
    
    .empty-canvas .empty-content {
      padding: 40px 20px;
      
      .empty-icon .el-icon {
        font-size: 60px;
      }
      
      h3 {
        font-size: 18px;
      }
      
      .empty-tips {
        flex-direction: column;
        gap: 16px;
        
        .tip-item {
          flex-direction: row;
          gap: 12px;
          
          .tip-number {
            width: 24px;
            height: 24px;
            font-size: 12px;
          }
        }
      }
    }
  }
}
</style> 