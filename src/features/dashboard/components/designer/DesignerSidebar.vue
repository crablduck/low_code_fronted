<template>
  <div class="designer-sidebar" :class="{ 'mobile-sidebar': isMobile }">
    <!-- 图表类型选择 -->
    <div class="panel-section">
      <h3 class="section-title">
        <el-icon><TrendCharts /></el-icon>
        图表类型
      </h3>
      <div class="chart-types">
        <div 
          class="chart-type-item" 
          v-for="type in chartTypes" 
          :key="type.value"
          draggable="true"
          @dragstart="handleChartDragStart($event, type)"
          :title="type.label"
        >
          <el-icon>
            <component :is="type.icon" />
          </el-icon>
          <span v-if="!isMobile">{{ type.label }}</span>
        </div>
      </div>
    </div>

    <!-- 组件类型选择 -->
    <div class="panel-section">
      <h3 class="section-title">
        <el-icon><Filter /></el-icon>
        组件类型
      </h3>
      
      <!-- 筛选器组件 -->
      <div class="component-category">
        <h4 class="category-title">
          <el-icon><Filter /></el-icon>
          筛选器
        </h4>
        <div class="component-types">
          <div 
            class="component-type-item" 
            v-for="type in filterTypes" 
            :key="type.value"
            draggable="true"
            @dragstart="handleComponentDragStart($event, type)"
            :title="type.label"
          >
            <el-icon>
              <component :is="type.icon" />
            </el-icon>
            <span v-if="!isMobile">{{ type.label }}</span>
          </div>
        </div>
      </div>

      <!-- 文本组件 -->
      <div class="component-category">
        <h4 class="category-title">
          <el-icon><Document /></el-icon>
          文本
        </h4>
        <div class="component-types">
          <div 
            class="component-type-item" 
            v-for="type in textTypes" 
            :key="type.value"
            draggable="true"
            @dragstart="handleComponentDragStart($event, type)"
            :title="type.label"
          >
            <el-icon>
              <component :is="type.icon" />
            </el-icon>
            <span v-if="!isMobile">{{ type.label }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { 
  TrendCharts, 
  Filter, 
  Document,
  DataAnalysis,
  PieChart,
  Grid,
  Picture,
  Select,
  Calendar,
  Edit,
  Reading
} from '@element-plus/icons-vue'
import { chartTypes, componentTypes } from '../../composables/useDragAndDrop'

interface Props {
  isMobile: boolean
}

interface Emits {
  (e: 'chart-drag-start', event: DragEvent, chartType: any): void
  (e: 'component-drag-start', event: DragEvent, componentType: any): void
}

defineProps<Props>()
const emit = defineEmits<Emits>()

// 筛选组件类型
const filterTypes = computed(() => 
  componentTypes.filter(type => type.category === 'filter')
)

const textTypes = computed(() => 
  componentTypes.filter(type => type.category === 'text')
)

const handleChartDragStart = (event: DragEvent, chartType: any) => {
  emit('chart-drag-start', event, chartType)
}

const handleComponentDragStart = (event: DragEvent, componentType: any) => {
  emit('component-drag-start', event, componentType)
}
</script>

<style lang="scss" scoped>
.designer-sidebar {
  width: 280px;
  background: #fafbfc;
  border-right: 1px solid #e4e7ed;
  overflow-y: auto;
  height: 100%;
  
  .panel-section {
    border-bottom: 1px solid #f0f0f0;
    
    &:last-child {
      border-bottom: none;
    }
    
    .section-title {
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 0;
      padding: 16px 20px 12px;
      font-size: 14px;
      font-weight: 600;
      color: #303133;
      background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
      border-bottom: 1px solid #e4e7ed;
      
      .el-icon {
        color: #409eff;
        font-size: 16px;
      }
    }
    
    .chart-types, .component-types {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(80px, 1fr));
      gap: 12px;
      padding: 16px 20px;
    }
    
    .chart-type-item, .component-type-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      padding: 16px 12px;
      background: white;
      border: 2px solid #e4e7ed;
      border-radius: 8px;
      cursor: grab;
      transition: all 0.3s ease;
      min-height: 80px;
      justify-content: center;
      
      &:hover {
        border-color: #409eff;
        background: #ecf5ff;
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(64, 158, 255, 0.15);
      }
      
      &:active {
        cursor: grabbing;
        transform: translateY(0);
      }
      
      .el-icon {
        font-size: 24px;
        color: #606266;
        transition: color 0.3s ease;
      }
      
      span {
        font-size: 12px;
        color: #606266;
        text-align: center;
        line-height: 1.2;
        font-weight: 500;
      }
      
      &:hover {
        .el-icon {
          color: #409eff;
        }
        
        span {
          color: #409eff;
        }
      }
    }
    
    .component-category {
      .category-title {
        display: flex;
        align-items: center;
        gap: 8px;
        margin: 0;
        padding: 12px 20px 8px;
        font-size: 13px;
        font-weight: 500;
        color: #606266;
        
        .el-icon {
          color: #909399;
          font-size: 14px;
        }
      }
      
      .component-types {
        padding: 8px 20px 16px;
        gap: 10px;
        grid-template-columns: repeat(auto-fit, minmax(70px, 1fr));
      }
      
      .component-type-item {
        min-height: 70px;
        padding: 12px 8px;
        
        .el-icon {
          font-size: 20px;
        }
        
        span {
          font-size: 11px;
        }
      }
    }
  }
  
  &.mobile-sidebar {
    width: 100%;
    height: auto;
    
    .panel-section {
      .section-title {
        padding: 12px 16px 8px;
        font-size: 13px;
      }
      
      .chart-types, .component-types {
        grid-template-columns: repeat(auto-fit, minmax(60px, 1fr));
        gap: 8px;
        padding: 12px 16px;
      }
      
      .chart-type-item, .component-type-item {
        min-height: 60px;
        padding: 8px 4px;
        gap: 4px;
        
        .el-icon {
          font-size: 20px;
        }
      }
      
      .component-category {
        .category-title {
          padding: 8px 16px 4px;
          font-size: 12px;
        }
        
        .component-types {
          padding: 4px 16px 12px;
          grid-template-columns: repeat(auto-fit, minmax(50px, 1fr));
        }
        
        .component-type-item {
          min-height: 50px;
          padding: 6px 4px;
          
          .el-icon {
            font-size: 16px;
          }
        }
      }
    }
  }
}

// 滚动条美化
.designer-sidebar::-webkit-scrollbar {
  width: 6px;
}

.designer-sidebar::-webkit-scrollbar-track {
  background: #f1f1f1;
}

.designer-sidebar::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
  
  &:hover {
    background: #a8a8a8;
  }
}
</style> 