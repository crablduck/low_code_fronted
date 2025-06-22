<template>
  <div class="designer-sidebar" :class="{ 'mobile-sidebar': isMobile }">
    <!-- 组件搜索 -->
    <div class="search-section">
      <el-input
        v-model="searchKeyword"
        placeholder="搜索组件..."
        clearable
        size="small"
        @input="handleSearch"
      >
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
      </el-input>
    </div>

    <!-- 搜索结果 -->
    <div v-if="searchKeyword && searchResults.length > 0" class="panel-section">
      <h3 class="section-title">
        <el-icon><Search /></el-icon>
        搜索结果 ({{ searchResults.length }})
      </h3>
      <div class="search-results">
        <div 
          class="search-result-item" 
          v-for="item in searchResults" 
          :key="`${item.type}-${item.value}`"
          draggable="true"
          @dragstart="handleSearchResultDragStart($event, item)"
          :title="item.description"
        >
          <el-icon>
            <component :is="item.icon" />
          </el-icon>
          <span v-if="!isMobile">{{ item.name }}</span>
          <div class="item-category">{{ item.category }}</div>
        </div>
      </div>
    </div>

    <!-- 无搜索结果 -->
    <div v-if="searchKeyword && searchResults.length === 0" class="panel-section">
      <div class="no-results">
        <el-icon><Search /></el-icon>
        <p>未找到相关组件</p>
      </div>
    </div>

    <!-- 常用组件 -->
    <div class="panel-section" v-if="!searchKeyword">
      <h3 class="section-title">
        <el-icon><Star /></el-icon>
        常用组件
      </h3>
      <div class="common-components">
        <div 
          class="common-component-item" 
          v-for="component in commonComponents" 
          :key="component.key"
          draggable="true"
          @dragstart="handleCommonComponentDragStart($event, component)"
          :title="component.description"
        >
          <el-icon>
            <component :is="component.icon" />
          </el-icon>
          <span v-if="!isMobile">{{ component.name }}</span>
        </div>
      </div>
    </div>

    <!-- 图表类型选择 -->
    <div class="panel-section" v-if="!searchKeyword">
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
    <div class="panel-section" v-if="!searchKeyword">
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
            :key="type.type"
            draggable="true"
            @dragstart="handleComponentDragStart($event, type)"
            :title="type.name"
          >
            <el-icon>
              <component :is="type.icon" />
            </el-icon>
            <span v-if="!isMobile">{{ type.name }}</span>
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
import { computed, ref } from 'vue'
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
  Reading,
  ArrowDown,
  Share,
  Timer,
  Operation,
  Star,
  Search
} from '@element-plus/icons-vue'
import { chartTypes, componentTypes, filterTypes } from '../../composables/useDragAndDrop'

interface Props {
  isMobile: boolean
}

interface Emits {
  (e: 'chart-drag-start', event: DragEvent, chartType: any): void
  (e: 'component-drag-start', event: DragEvent, componentType: any): void
}

defineProps<Props>()
const emit = defineEmits<Emits>()

// 文本组件类型
const textTypes = computed(() => 
  componentTypes.filter(type => type.category === 'text')
)

// 常用组件定义
const commonComponents = [
  { 
    key: 'bar-chart', 
    name: '柱状图', 
    icon: 'TrendCharts', 
    type: 'chart',
    value: 'bar',
    description: '快速创建柱状图' 
  },
  { 
    key: 'line-chart', 
    name: '折线图', 
    icon: 'TrendCharts', 
    type: 'chart',
    value: 'line',
    description: '快速创建折线图' 
  },
  { 
    key: 'pie-chart', 
    name: '饼图', 
    icon: 'PieChart', 
    type: 'chart',
    value: 'pie',
    description: '快速创建饼图' 
  },
  { 
    key: 'date-filter', 
    name: '日期筛选', 
    icon: 'Calendar', 
    type: 'component',
    value: 'filter-date',
    description: '快速创建日期筛选器' 
  },
  { 
    key: 'select-filter', 
    name: '下拉筛选', 
    icon: 'ArrowDown', 
    type: 'component',
    value: 'filter-select',
    description: '快速创建下拉筛选器' 
  },
  { 
    key: 'title-text', 
    name: '标题', 
    icon: 'Edit', 
    type: 'component',
    value: 'text-title',
    description: '快速创建标题文本' 
  }
]

const handleChartDragStart = (event: DragEvent, chartType: any) => {
  emit('chart-drag-start', event, chartType)
}

const handleComponentDragStart = (event: DragEvent, componentType: any) => {
  emit('component-drag-start', event, componentType)
}

const handleCommonComponentDragStart = (event: DragEvent, component: any) => {
  if (component.type === 'chart') {
    // 对于图表类型，调用图表拖拽处理
    const chartType = chartTypes.find(chart => chart.value === component.value)
    if (chartType) {
      emit('chart-drag-start', event, chartType)
    }
  } else {
    // 对于组件类型，调用组件拖拽处理
    // 先在 componentTypes 中查找
    let componentType = componentTypes.find(comp => comp.value === component.value)
    
    // 如果没找到，在 filterTypes 中查找
    if (!componentType) {
      const filterType = filterTypes.find(filter => filter.type === component.value)
      if (filterType) {
        // 转换 filterType 格式为 componentType 格式
        componentType = {
          value: filterType.type,
          label: filterType.name,
          icon: filterType.icon,
          category: 'filter'
        }
      }
    }
    
    if (componentType) {
      emit('component-drag-start', event, componentType)
    }
  }
}

// ========== 搜索功能 ==========

// 搜索关键词
const searchKeyword = ref('')

// 搜索结果
const searchResults = computed(() => {
  if (!searchKeyword.value.trim()) {
    return []
  }
  
  const keyword = searchKeyword.value.toLowerCase()
  const results: any[] = []
  
  // 搜索图表类型
  chartTypes.forEach(chart => {
    if (chart.label.toLowerCase().includes(keyword) || 
        chart.value.toLowerCase().includes(keyword)) {
      results.push({
        type: 'chart',
        value: chart.value,
        name: chart.label,
        icon: chart.icon,
        category: '图表',
        description: `创建${chart.label}`
      })
    }
  })
  
  // 搜索筛选器组件
  filterTypes.forEach(filter => {
    if (filter.name.toLowerCase().includes(keyword) || 
        filter.type.toLowerCase().includes(keyword)) {
      results.push({
        type: 'component',
        value: filter.type,
        name: filter.name,
        icon: filter.icon,
        category: '筛选器',
        description: `创建${filter.name}`
      })
    }
  })
  
  // 搜索文本组件
  textTypes.value.forEach(text => {
    if (text.label.toLowerCase().includes(keyword) || 
        text.value.toLowerCase().includes(keyword)) {
      results.push({
        type: 'component',
        value: text.value,
        name: text.label,
        icon: text.icon,
        category: '文本',
        description: `创建${text.label}`
      })
    }
  })
  
  return results
})

// 搜索处理
const handleSearch = (value: string) => {
  searchKeyword.value = value
}

// 搜索结果拖拽处理
const handleSearchResultDragStart = (event: DragEvent, item: any) => {
  if (item.type === 'chart') {
    const chartType = chartTypes.find(chart => chart.value === item.value)
    if (chartType) {
      emit('chart-drag-start', event, chartType)
    }
  } else {
    // 构造组件类型数据 - 修复type字段问题
    const componentType = {
      type: item.value,         // 使用type字段而不是value字段
      value: item.value,        // 保持value字段兼容性
      name: item.name,          // 使用name字段而不是label字段
      label: item.name,         // 保持label字段兼容性
      icon: item.icon,
      category: item.category.toLowerCase()
    }
    emit('component-drag-start', event, componentType)
  }
}
</script>

<style lang="scss" scoped>
.designer-sidebar {
  width: 280px;
  background: #fafbfc;
  border-right: 1px solid #e4e7ed;
  overflow-y: auto;
  height: 100%;
  
  // 搜索区域样式
  .search-section {
    padding: 16px 20px 12px;
    background: #ffffff;
    border-bottom: 1px solid #f0f2f5;
    
    .el-input {
      :deep(.el-input__wrapper) {
        border-radius: 20px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
        
        &:hover {
          box-shadow: 0 2px 12px rgba(64, 158, 255, 0.15);
        }
        
        &.is-focus {
          box-shadow: 0 2px 12px rgba(64, 158, 255, 0.25);
        }
      }
      
      :deep(.el-input__prefix) {
        color: #909399;
      }
    }
  }
  
  // 搜索结果样式
  .search-results {
    display: grid;
    grid-template-columns: 1fr;
    gap: 8px;
    padding: 16px 20px;
  }
  
  .search-result-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 16px;
    background: white;
    border: 1px solid #e4e7ed;
    border-radius: 8px;
    cursor: grab;
    transition: all 0.3s ease;
    position: relative;
    
    &:hover {
      border-color: #409eff;
      background: #ecf5ff;
      transform: translateX(4px);
      box-shadow: 0 2px 8px rgba(64, 158, 255, 0.15);
    }
    
    &:active {
      cursor: grabbing;
      transform: translateX(2px);
    }
    
    .el-icon {
      font-size: 20px;
      color: #606266;
      transition: color 0.3s ease;
      flex-shrink: 0;
    }
    
    span {
      font-size: 14px;
      color: #303133;
      font-weight: 500;
      flex: 1;
    }
    
    .item-category {
      font-size: 11px;
      color: #909399;
      background: #f5f7fa;
      padding: 2px 8px;
      border-radius: 10px;
      flex-shrink: 0;
    }
    
    &:hover {
      .el-icon {
        color: #409eff;
      }
      
      span {
        color: #409eff;
      }
      
      .item-category {
        background: #409eff;
        color: white;
      }
    }
  }
  
  // 无搜索结果样式
  .no-results {
    text-align: center;
    padding: 40px 20px;
    color: #909399;
    
    .el-icon {
      font-size: 48px;
      margin-bottom: 12px;
      opacity: 0.5;
    }
    
    p {
      margin: 0;
      font-size: 14px;
    }
  }
  
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
    
    .chart-types, .component-types, .common-components {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(80px, 1fr));
      gap: 12px;
      padding: 16px 20px;
    }
    
    .chart-type-item, .component-type-item, .common-component-item {
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
    
    // 常用组件特殊样式
    .common-component-item {
      border-color: #ffd04b;
      background: linear-gradient(135deg, #fff9e6 0%, #fff5cc 100%);
      
      &:hover {
        border-color: #f7ba2a;
        background: linear-gradient(135deg, #fff5cc 0%, #ffec99 100%);
        box-shadow: 0 4px 12px rgba(247, 186, 42, 0.15);
      }
      
      .el-icon {
        color: #e6a23c;
      }
      
      span {
        color: #e6a23c;
        font-weight: 600;
      }
      
      &:hover {
        .el-icon {
          color: #d48806;
        }
        
        span {
          color: #d48806;
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