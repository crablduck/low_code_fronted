<template>
  <div class="dashboard-designer" :class="{ 'mobile-layout': isMobile }">
    <!-- 顶部工具栏 -->
    <DesignerToolbar
      :is-preview="isPreview"
      :show-grid-helper="showGridHelper"
      :is-mobile="isMobile"
      :is-fullscreen="isFullscreen"
      :has-charts="hasCharts"
      @toggle-preview="togglePreview"
      @toggle-grid-helper="toggleGridHelper"
      @toggle-fullscreen="toggleFullscreen"
      @export-dashboard="exportDashboard"
      @save-dashboard="() => showSaveDialog = true"
      @clear-all="clearAllCharts"
      @auto-layout="autoLayout"
    />
    
    <div class="designer-body">
      <!-- 左侧组件面板 -->
      <DesignerSidebar
        :is-mobile="isMobile"
        @component-drag-start="handleComponentDragStart"
        @chart-drag-start="handleDragStart"
      />
      
      <!-- 中间画布区域 -->
      <div class="canvas-area">
        <!-- 筛选器容器 -->
        <div class="filters-container" 
             v-if="filterItems.length > 0 || !isPreview"
             @drop="handleFilterContainerDrop"
             @dragover.prevent
             @dragenter.prevent>
          <div class="filter-list">
            <div 
              v-for="filter in filterItems" 
              :key="filter.i"
              class="filter-item"
              :draggable="!isPreview"
              @dragstart="handleFilterDragStart($event, filter)"
              @dragover.prevent
              @drop="handleFilterDrop($event, filter)"
            >
              <FilterComponent 
                :config="filter.chartConfig"
                :is-preview="isPreview"
                @value-change="(value) => handleFilterChange(filter.i, value)"
                @remove="() => removeFilter(filter.i)"
              />
          </div>
          
          <!-- 空状态提示 -->
            <div v-if="filterItems.length === 0 && !isPreview" class="filter-placeholder">
            <el-icon><Filter /></el-icon>
              <span>拖拽筛选器组件到此区域</span>
          </div>
        </div>
        
          <div class="filter-actions" v-if="filterItems.length > 0">
            <el-button type="primary" @click="applyFilters" :loading="queryLoading">
              <el-icon><Search /></el-icon>
              查询
            </el-button>
          </div>
        </div>
        
        <div class="canvas-container" @click="handleCanvasBackgroundClick">
          <!-- 画布组件 -->
          <DesignerCanvas
            :layout="layout"
            :is-preview="isPreview"
            :show-grid-helper="showGridHelper"
            :has-charts="hasCharts"
            @update:layout="updateLayout"
            @drop="handleDrop"
            @chart-context-menu="handleChartContextMenu"
            @update-config="updateItemConfig"
            @delete-chart="deleteChart"
            @copy-chart="copyChart"
            @resize="onResize"
            @resized="onResized"
            @move="onMove"
            @moved="onMoved"
            @item-click="handleItemClick"
          />
        </div>
      </div>
      
      <!-- 右侧面板 -->
      <div class="right-panels" :class="{ 'mobile-panels': isMobile }">
        <!-- 属性配置面板 -->
        <DesignerPropertiesPanel
          v-if="showPropertiesPanel"
          :selected-item="selectedItem"
          :datasets="datasets"
          :layout="layout"
          :is-mobile="isMobile"
          @update="updateSelectedItem"
          @close="clearSelection"
        />
        
        <!-- 默认信息面板 -->
        <div v-else class="panels-container">
          <!-- 提示信息 -->
          <div class="info-panel">
            <div class="info-content">
              <div class="hint-icon-wrapper">
                <el-icon class="hint-icon"><DataBoard /></el-icon>
              </div>
              <h4>仪表盘设计器</h4>
              <p>从左侧拖拽组件到画布进行设计</p>
              <div class="stats">
                <div class="stat-item">
                  <span class="stat-number">{{ layout.filter(item => isChartType(item.chartConfig.type)).length }}</span>
                  <span class="stat-label">图表组件</span>
                </div>
                <div class="stat-item">
                  <span class="stat-number">{{ layout.filter(item => isFilterType(item.chartConfig.type)).length }}</span>
                  <span class="stat-label">筛选器</span>
                </div>
              </div>
            </div>
          </div>
            </div>
      </div>
    </div>
    
    <!-- 保存对话框 -->
    <el-dialog 
      v-model="showSaveDialog" 
      title="保存仪表盘"
      width="500px"
      :before-close="() => showSaveDialog = false"
    >
      <el-form :model="saveForm" label-width="80px">
        <el-form-item label="名称" required>
          <el-input v-model="saveForm.name" placeholder="请输入仪表盘名称" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input 
            v-model="saveForm.description" 
            type="textarea" 
            :rows="3"
            placeholder="请输入仪表盘描述"
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
          <el-button @click="showSaveDialog = false">取消</el-button>
        <el-button type="primary" @click="saveDashboard">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick, toRaw, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { 
  Setting, 
  DataAnalysis, 
  Grid, 
  Menu, 
  CirclePlus, 
  DataBoard,
  Filter,
  Document,
  Picture,
  Search
} from '@element-plus/icons-vue'

// 导入组件
import DesignerToolbar from '../components/designer/DesignerToolbar.vue'
import DesignerSidebar from '../components/designer/DesignerSidebar.vue'
import DesignerCanvas from '../components/designer/DesignerCanvas.vue'
import ChartItem from '../components/designer/ChartItem.vue'
import FilterComponent from '../components/designer/FilterComponent.vue'
import DesignerPropertiesPanel from '../components/designer/DesignerPropertiesPanel.vue'

// 导入组合式函数
import { useDashboardState } from '../composables/useDashboardState'
import { useDragAndDrop } from '../composables/useDragAndDrop'

// 导入类型
import type { LayoutItem } from '@/shared/types/dashboard'

const {
  // 状态
  layout,
  chartInstances,
  datasets,
  selectedDataset,
  datasetFields,
  isPreview,
  showGridHelper,
  isMobile,
  isFullscreen,
  showSaveDialog,
  saveForm,
  selectedItem,
  showPropertiesPanel,
  
  // 计算属性
  dimensionFields,
  metricFields,
  hasCharts,
  
  // 方法
  checkMobile,
  loadDatasets,
  loadDatasetFields,
  handleDatasetChange,
  deleteChart,
  copyChart,
  selectItem,
  clearSelection,
  updateSelectedItem,
  handleFilterBindingChange,
  clearAllCharts,
  selectAllCharts,
  autoLayout,
  togglePreview,
  toggleGridHelper,
  toggleFullscreen,
  handleFullscreenChange,
  exportDashboard,
  applySmartLayout
} = useDashboardState()

// 模拟数据源数据（暂时不联动，避免错误）
const dataSources = ref([
  { id: 1, name: '默认数据源', type: 'mysql' },
  { id: 2, name: '用户数据库', type: 'postgresql' },
  { id: 3, name: '业务数据库', type: 'oracle' }
])

const {
  // 拖拽处理
  handleDragStart,
  handleComponentDragStart,
  handleCanvasDrop,
  isChartType,
  isFilterType,
  isTextType,
  setDefaultValueFunctions,
  getFilterDefaultOptions: getDragDropFilterOptions,
  getDefaultFilterValue: getDragDropFilterValue,
  getFilterPlaceholder: getDragDropFilterPlaceholder
} = useDragAndDrop()

// 拖拽处理
const handleDrop = (event: DragEvent) => {
  event.preventDefault()
  
  // 调用useDragAndDrop中的handleCanvasDrop函数
  const result = handleCanvasDrop(
    event, 
    layout.value, 
    selectedDataset.value, 
    datasetFields.value, 
    (chartId: string, config: any) => {
      // 初始化图表的回调函数
      console.log('初始化图表:', chartId, config)
      
      // 如果是图表类型，可以在这里初始化echarts实例
      if (isChartType(config.type)) {
    nextTick(() => {
          // 图表初始化逻辑
          console.log('图表初始化完成:', chartId)
        })
      }
    }
  )
  
  if (result) {
    console.log('成功添加组件到画布:', result)
  }
}

// ========== 筛选器相关逻辑 ==========

// 筛选器布局分离
const filterItems = computed(() => 
  layout.value
    .filter(item => isFilterType(item.chartConfig.type))
    .sort((a, b) => (a.chartConfig.position || 0) - (b.chartConfig.position || 0))
)

const chartLayout = computed(() => 
  layout.value.filter(item => !isFilterType(item.chartConfig.type))
)

// 筛选器状态管理
const filterValues = ref<Record<string, any>>({})
const queryLoading = ref(false)

// 筛选器值变化处理
const handleFilterChange = (filterId: string, value: any) => {
  filterValues.value[filterId] = value
  console.log(`筛选器 ${filterId} 值变化:`, value)
}

// 筛选器容器拖拽处理
const handleFilterContainerDrop = (event: DragEvent) => {
  event.preventDefault()
  
  const componentTypeData = event.dataTransfer?.getData('componentType')
  if (!componentTypeData) return
  
  try {
    const component = JSON.parse(componentTypeData)
    
    // 只允许筛选器组件 - 修复类型检查问题
    const componentType = component.type || component.value
    if (!isFilterType(componentType)) {
      ElMessage.warning('只能拖拽筛选器组件到此区域')
    return
  }
  
    // 创建新的筛选器项
    const newFilter: LayoutItem = {
      x: 0, y: 0, w: 3, h: 1, // 筛选器不需要实际的网格位置
      i: `filter-${Date.now()}`,
      chartConfig: {
        i: `filter-${Date.now()}`,
        id: `filter-${Date.now()}`,
        type: componentType,
        title: component.name || component.label,
        label: component.name || component.label,
        options: getDragDropFilterOptions(componentType),
        defaultValue: getDragDropFilterValue(componentType),
        placeholder: getDragDropFilterPlaceholder(componentType),
        position: filterItems.value.length // 设置到末尾
      }
    }
    
    // 添加到布局中
    layout.value.push(newFilter)
    
    ElMessage.success(`已添加筛选器：${component.name || component.label}`)
  } catch (error) {
    console.error('筛选器拖拽处理失败:', error)
    ElMessage.error('添加筛选器失败')
  }
}

// 筛选器拖拽处理
const handleFilterDragStart = (event: DragEvent, filter: LayoutItem) => {
  if (!event.dataTransfer) return
  
  event.dataTransfer.setData('text/plain', JSON.stringify({
    type: 'filterReorder',
    filterId: filter.i,
    fromIndex: filterItems.value.findIndex(f => f.i === filter.i)
  }))
  event.dataTransfer.effectAllowed = 'move'
}

const handleFilterDrop = (event: DragEvent, targetFilter: LayoutItem) => {
  event.preventDefault()
  
  const dragData = event.dataTransfer?.getData('text/plain')
  if (!dragData) return
  
  try {
    const data = JSON.parse(dragData)
    
    if (data.type === 'filterReorder') {
      const fromIndex = data.fromIndex
      const toIndex = filterItems.value.findIndex(f => f.i === targetFilter.i)
      
      if (fromIndex !== toIndex) {
        // 重新排序筛选器
        const filters = [...filterItems.value]
        const [movedFilter] = filters.splice(fromIndex, 1)
        filters.splice(toIndex, 0, movedFilter)
        
        // 更新position
        filters.forEach((filter, index) => {
          filter.chartConfig.position = index
        })
        
        // 触发响应式更新
        layout.value = [...layout.value]
        
        ElMessage.success('筛选器顺序已调整')
      }
    }
  } catch (error) {
    console.error('筛选器拖拽处理失败:', error)
  }
}

// 移除筛选器
const removeFilter = (filterId: string) => {
  const index = layout.value.findIndex(item => item.i === filterId)
  if (index !== -1) {
    layout.value.splice(index, 1)
    delete filterValues.value[filterId]
    ElMessage.success('筛选器已删除')
  }
}

// 应用筛选
const applyFilters = async () => {
  queryLoading.value = true
  
  try {
    console.log('应用筛选条件:', filterValues.value)
    
    // 收集有绑定关系的图表
    const chartsToUpdate = chartLayout.value.filter(chart => 
      chart.chartConfig.filterBindings?.length
    )
    
    // 更新每个绑定了筛选器的图表
    for (const chart of chartsToUpdate) {
      await updateChartWithFilters(chart, filterValues.value)
    }
    
    ElMessage.success(`已应用筛选条件，更新了 ${chartsToUpdate.length} 个图表`)
  } catch (error) {
    console.error('应用筛选失败:', error)
    ElMessage.error('应用筛选失败')
  } finally {
    queryLoading.value = false
  }
}

// 更新图表数据（应用筛选条件）
const updateChartWithFilters = async (chart: LayoutItem, filterValues: Record<string, any>) => {
  // 这里实现具体的图表数据更新逻辑
  console.log(`更新图表 ${chart.i} 的数据，筛选条件:`, filterValues)
  
  // TODO: 调用实际的数据查询API
  // const filteredData = await getChartData(chart.chartConfig, filterValues)
  // 更新图表数据...
}



// ========== 原有逻辑 ==========

// 布局更新处理
const updateLayout = (newLayout: LayoutItem[]) => {
  layout.value = newLayout
}

// 更新项目配置
const updateItemConfig = (itemId: string, config: any) => {
  const item = layout.value.find(item => item.i === itemId)
  if (item) {
    console.log(`更新组件 ${itemId} 配置:`, config)
    
    // 确保字段映射对象存在
    if (!item.chartConfig.fieldMapping) {
      item.chartConfig.fieldMapping = {}
    }
    
    // 更新配置并触发响应性
    item.chartConfig = {
      ...item.chartConfig,
      ...config,
      fieldMapping: {
        ...item.chartConfig.fieldMapping,
        ...(config.fieldMapping || {})
      }
    }
    
    // 强制触发布局更新，确保组件重新渲染
    layout.value = [...layout.value]
    
    console.log(`组件 ${itemId} 配置更新完成:`, item.chartConfig)
  }
}

// 右键菜单处理
const handleChartContextMenu = (event: MouseEvent, item: any) => {
  event.preventDefault()
}

// 画布背景点击处理
const handleCanvasBackgroundClick = (event: Event) => {
  // 确保点击的是背景而不是子元素
  if (event.target === event.currentTarget) {
    try {
      clearSelection()
    } catch (error) {
      console.error('清除选中状态失败:', error)
    }
  }
}

// 组件点击处理
const handleItemClick = (item: LayoutItem) => {
  try {
    selectItem(item)
  } catch (error) {
    console.error('选中组件失败:', error)
  }
}

// 保存仪表盘
const saveDashboard = () => {
  if (!saveForm.name.trim()) {
    ElMessage.warning('请输入仪表盘名称')
    return
  }
  
  // TODO: 调用保存API
  console.log('保存仪表盘:', {
    name: saveForm.name,
    description: saveForm.description,
    layout: layout.value
  })
  
  showSaveDialog.value = false
  ElMessage.success('仪表盘保存成功')
}

// 网格布局事件处理
const onResize = (i: string, newH: number, newW: number, newHPx: number, newWPx: number) => {
  console.log('组件调整大小:', i, { newH, newW, newHPx, newWPx })
}

const onResized = (i: string, newH: number, newW: number, newHPx: number, newWPx: number) => {
  console.log('组件调整大小完成:', i, { newH, newW, newHPx, newWPx })
}

const onMove = (i: string, newX: number, newY: number) => {
  console.log('组件移动:', i, { newX, newY })
}

const onMoved = (i: string, newX: number, newY: number) => {
  console.log('组件移动完成:', i, { newX, newY })
}

// 生命周期
onMounted(async () => {
  checkMobile()
  window.addEventListener('resize', checkMobile)
  
  // 监听全屏状态变化
  document.addEventListener('fullscreenchange', handleFullscreenChange)
  
  // 加载数据集
  await loadDatasets()
})

onUnmounted(() => {
  window.removeEventListener('resize', checkMobile)
  document.removeEventListener('fullscreenchange', handleFullscreenChange)
  
  // 销毁所有图表实例
  chartInstances.value.forEach(chart => chart.dispose())
  chartInstances.value.clear()
})
</script>

<style scoped lang="scss">
.dashboard-designer {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f5f7fa;
  overflow: hidden;
  
  .designer-body {
    flex: 1;
    display: flex;
    overflow: hidden;
  }
    
    .canvas-area {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      
    // 筛选器容器样式
      .filters-container {
      background: #ffffff;
        border-bottom: 1px solid #e4e7ed;
        padding: 12px 16px;
      min-height: 60px;
      
      .filter-list {
          display: flex;
        flex-wrap: wrap;
        gap: 12px;
          align-items: center;
        min-height: 36px;
      }
      
      .filter-placeholder {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #909399;
          font-size: 14px;
        padding: 8px 16px;
        border: 2px dashed #dcdfe6;
        border-radius: 6px;
        background: #fafafa;
          
          .el-icon {
          font-size: 16px;
        }
      }
      
      .filter-actions {
        margin-top: 12px;
        padding-top: 12px;
        border-top: 1px solid #f0f2f5;
        
        .el-button {
          font-size: 14px;
        }
        }
      }
      
      .canvas-container {
        flex: 1;
      background: #f8f9fa;
        overflow: hidden;
      }
    }
    
    .right-panels {
    width: 300px;
    background: #fff;
      border-left: 1px solid #e4e7ed;
          display: flex;
    flex-direction: column;
    
    .panels-container {
                    flex: 1;
      padding: 16px;
      
      .info-panel {
        .info-content {
          text-align: center;
          
          .hint-icon-wrapper {
            margin-bottom: 16px;
            
            .hint-icon {
              font-size: 48px;
              color: #409eff;
            }
          }
          
          h4 {
            margin: 0 0 8px 0;
            color: #303133;
            font-size: 16px;
            font-weight: 600;
          }
          
          p {
            margin: 0 0 24px 0;
            color: #606266;
            font-size: 14px;
            line-height: 1.5;
          }
          
          .stats {
              display: flex;
            gap: 24px;
              justify-content: center;
            
            .stat-item {
              text-align: center;
              
              .stat-number {
                display: block;
                font-size: 24px;
                font-weight: bold;
                color: #409eff;
                margin-bottom: 4px;
              }
              
              .stat-label {
                font-size: 12px;
                color: #909399;
              }
              }
            }
          }
        }
      }
      
      &.mobile-panels {
        position: fixed;
        right: 0;
      top: 0;
      height: 100vh;
        z-index: 1000;
      width: 100vw;
      max-width: 300px;
      box-shadow: -2px 0 8px rgba(0, 0, 0, 0.1);
    }
  }
  
  &.mobile-layout {
    .designer-body {
      flex-direction: column;
    }
      
      .right-panels {
      width: 100%;
      height: 200px;
        border-left: none;
        border-top: 1px solid #e4e7ed;
    }
  }
}

// 响应式设计
@media (max-width: 768px) {
  .dashboard-designer {
    .right-panels {
      position: fixed;
      right: 0;
      top: 0;
      height: 100vh;
      z-index: 1000;
      width: 100vw;
      max-width: 280px;
      box-shadow: -2px 0 8px rgba(0, 0, 0, 0.1);
    }
  }
}
</style> 