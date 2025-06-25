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
import { useRoute, useRouter } from 'vue-router'

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
import type { LayoutItem, ChartConfig } from '@/shared/types/dashboard'
import { DashboardStatus, DashboardType } from '@/shared/types/dashboard'

// 导入API
import { smartPreviewDataset } from '@/api/dataset'
import { createDashboard, updateDashboard, getDashboardDetail } from '@/api/dashboard'
import { serializeLayout } from '@/shared/utils/dashboardPersistence'

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

const route = useRoute()
const router = useRouter()

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
    console.log('🔍 开始应用全局筛选条件:')
    console.log('📝 当前所有筛选器值:', filterValues.value)
    console.log('📝 当前筛选器组件:', filterItems.value.map(f => ({
      id: f.i,
      type: f.chartConfig.type,
      label: f.chartConfig.label,
      fieldName: f.chartConfig.fieldName,
      defaultValue: f.chartConfig.defaultValue
    })))
    
    // 收集有全局筛选器绑定的图表
    const chartsToUpdate = chartLayout.value.filter(chart => 
      chart.chartConfig.globalFilterBindings && 
      chart.chartConfig.globalFilterBindings.length > 0
    )
    
    console.log('📊 找到需要更新的图表:', chartsToUpdate.map(c => ({
      id: c.i,
      title: c.chartConfig.title,
      datasetId: c.chartConfig.datasetId,
      bindings: c.chartConfig.globalFilterBindings?.length || 0,
      bindingDetails: c.chartConfig.globalFilterBindings
    })))
    
    if (chartsToUpdate.length === 0) {
      ElMessage.info('没有图表绑定全局筛选器')
      return
    }
    
    // 并行更新所有绑定了筛选器的图表
    const updatePromises = chartsToUpdate.map(chart => 
      updateChartWithGlobalFilters(chart, filterValues.value)
    )
    
    await Promise.all(updatePromises)
    
    ElMessage.success(`✅ 已应用筛选条件，更新了 ${chartsToUpdate.length} 个图表`)
  } catch (error) {
    console.error('❌ 应用筛选失败:', error)
    ElMessage.error(`应用筛选失败: ${error.message}`)
  } finally {
    queryLoading.value = false
  }
}

// 更新图表数据（使用全局筛选器）
const updateChartWithGlobalFilters = async (chart: LayoutItem, filterValues: Record<string, any>) => {
  if (!chart.chartConfig.datasetId || !chart.chartConfig.globalFilterBindings) {
    console.warn(`图表 ${chart.i} 缺少数据集ID或筛选器绑定配置`)
    return
  }
  
  try {
    console.log(`🔄 更新图表 ${chart.i} 数据:`, {
      title: chart.chartConfig.title,
      datasetId: chart.chartConfig.datasetId,
      bindings: chart.chartConfig.globalFilterBindings
    })
    
    // 构建过滤条件
    const filters: Array<{
      fieldName: string
      operator: string
      value: any
    }> = []
    
    // 遍历图表的全局筛选器绑定
    for (const binding of chart.chartConfig.globalFilterBindings) {
      console.log(`🔗 处理绑定:`, binding)
      
      // 查找对应的筛选器组件
      const filterComponent = filterItems.value.find(item => 
        item.i === binding.filterKey
      )
      
      console.log(`🔍 查找筛选器组件 ${binding.filterKey}:`, filterComponent ? {
        id: filterComponent.i,
        type: filterComponent.chartConfig.type,
        fieldName: filterComponent.chartConfig.fieldName,
        label: filterComponent.chartConfig.label
      } : '未找到')
      
      if (filterComponent && binding.chartField) {
        // 获取筛选器的当前值
        const filterValue = filterValues[binding.filterKey]
        
        if (filterValue !== null && filterValue !== undefined && filterValue !== '') {
          // 操作符映射
          const operatorMapping: Record<string, string> = {
            'equals': 'eq',
            'not_equals': 'ne',
            'contains': 'like',
            'not_contains': 'not_like',
            'greater_than': 'gt',
            'greater_than_or_equal': 'gte',
            'less_than': 'lt',
            'less_than_or_equal': 'lte',
            'is_null': 'is_null',
            'is_not_null': 'is_not_null'
          }
          
          const operator = binding.operator || 'equals'
          const apiOperator = operatorMapping[operator] || 'eq'
          
          filters.push({
            fieldName: binding.chartField,
            operator: apiOperator,
            value: filterValue
          })
        }
      }
    }
    
    // 调用智能预览接口
    const response = await smartPreviewDataset(chart.chartConfig.datasetId, {
      filters,
      limit: chart.chartConfig.dataLimit || 50
    })
    
    console.log(`数据集 ${chart.chartConfig.datasetId} 智能预览响应:`, response)
    
    if (response.code === 200) {
      const chartData = transformSmartPreviewToChartData(response.data, chart.chartConfig)
      console.log(`✅ 图表 ${chart.i} 数据获取成功:`, response.data)
      
      // 强制更新图表数据
      const timestamp = Date.now()
      chart.chartConfig = {
        ...chart.chartConfig,
        chartData: {
          ...chartData,
          _timestamp: timestamp,
          _forceUpdate: Math.random() // 添加随机值强制更新
        }
      }
      
      // 强制更新布局
      layout.value = layout.value.map(item => 
        item.i === chart.i ? chart : item
      )
      
      console.log(`🎨 图表 ${chart.i} 数据更新完成`)
    } else {
      console.error(`❌ 图表 ${chart.i} 数据获取失败:`, response.message)
      throw new Error(response.message)
    }
  } catch (error) {
    console.error(`❌ 更新图表 ${chart.i} 失败:`, error)
    throw error
  }
}

// 数据转换辅助方法
const transformSmartPreviewToChartData = (smartData: any, config: any) => {
  // 处理不同的响应数据格式
  let records: any[] = []
  let columns: string[] = []
  
  if (smartData.records && Array.isArray(smartData.records)) {
    records = smartData.records
    columns = smartData.columns || []
  } else if (smartData.content && Array.isArray(smartData.content)) {
    records = smartData.content
    columns = smartData.columns || []
  } else if (Array.isArray(smartData)) {
    records = smartData
    columns = records.length > 0 ? Object.keys(records[0]) : []
  }
  
  if (!records || records.length === 0) {
    return { series: [], categories: [] }
  }
  
  const { fieldMapping, type } = config
  
  switch (type) {
    case 'bar':
    case 'line':
    case 'area':
      return transformToBarLineData(records, fieldMapping)
    case 'pie':
      return transformToPieData(records, fieldMapping)
    default:
      return { series: records, categories: columns }
  }
}

// 柱状图/折线图数据转换
const transformToBarLineData = (records: any[], fieldMapping: any) => {
  const xField = fieldMapping.xAxis || fieldMapping.xField
  const yField = fieldMapping.yAxis || fieldMapping.yField
  
  if (!xField || !yField) {
    return { series: [], categories: [] }
  }
  
  const categories = [...new Set(records.map(record => record[xField]))].filter(Boolean)
  const seriesData = categories.map(category => {
    const record = records.find(r => r[xField] === category)
    return record ? (record[yField] || 0) : 0
  })
  
  return {
    categories,
    series: [{
      name: yField,
      data: seriesData
    }]
  }
}

// 饼图数据转换
const transformToPieData = (records: any[], fieldMapping: any) => {
  const nameField = fieldMapping.nameField || fieldMapping.name
  const valueField = fieldMapping.valueField || fieldMapping.value
  
  if (!nameField || !valueField) {
    return { series: [] }
  }
  
  const pieData = records.map(record => ({
    name: record[nameField],
    value: record[valueField] || 0
  })).filter(item => item.name && item.value > 0)
  
  return {
    series: [{
      name: '数据',
      type: 'pie',
      data: pieData
    }]
  }
}

// 更新图表数据（应用筛选条件） - 保留原有方法以兼容
const updateChartWithFilters = async (chart: LayoutItem, filterValues: Record<string, any>) => {
  // 重定向到新的全局筛选器更新方法
  return updateChartWithGlobalFilters(chart, filterValues)
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
const saveDashboard = async () => {
  if (!saveForm.name.trim()) {
    ElMessage.warning('请输入仪表盘名称')
    return
  }
  
  try {
    // 序列化布局数据
    const serializedLayout = serializeLayout(layout.value)
    
    const dashboardData = {
      name: saveForm.name,
      description: saveForm.description,
      layout: serializedLayout,
      status: DashboardStatus.DRAFT,
      type: DashboardType.CUSTOM,
      config_json: {
        layout: layout.value
      }
    }
    
    if (route.params.id) {
      // 更新已有仪表盘
      await updateDashboard(String(route.params.id), dashboardData)
      ElMessage.success('仪表盘更新成功')
    } else {
      // 创建新仪表盘
      await createDashboard(dashboardData)
      ElMessage.success('仪表盘创建成功')
    }
    
    showSaveDialog.value = false
    
    // 保存成功后返回列表页
    router.push('/dashboard/list')
  } catch (error: any) {
    ElMessage.error('保存失败：' + error.message)
  }
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

// 加载仪表盘数据
const loadDashboard = async () => {
  if (!route.params.id) return

  try {
    console.log('开始加载仪表盘数据:', route.params.id)
    const res = await getDashboardDetail(String(route.params.id))
    console.log('仪表盘详情响应:', res)
    
    if (res.code === 200 && res.data) {
      // 设置基本信息
      saveForm.name = res.data.name
      saveForm.description = res.data.description || ''

      // 设置布局数据
      if (res.data.layout) {
        layout.value = res.data.layout
      }

      // 恢复过滤器配置
      if (res.data.config?.globalFilters) {
        // 找出所有过滤器组件
        const filterComponents = layout.value.filter(item => 
          item.chartConfig.type.startsWith('filter-')
        )

        // 恢复过滤器的值和配置
        filterComponents.forEach(filter => {
          const filterConfig = res.data.config.globalFilters[filter.i]
          if (filterConfig) {
            // 更新过滤器配置
            filter.chartConfig = {
              ...filter.chartConfig,
              ...filterConfig
            }

            // 恢复过滤器值
            if (filterConfig.value !== undefined) {
              filterValues.value[filter.i] = filterConfig.value
            }
          }
        })
      }

      // 初始化所有图表
      await nextTick()
      // initCharts()
    } else {
      ElMessage.error(res.message || '加载仪表盘失败')
    }
  } catch (error: any) {
    console.error('加载仪表盘失败:', error)
    ElMessage.error('加载仪表盘失败：' + error.message)
  }
}

// 生命周期
onMounted(async () => {
  checkMobile()
  window.addEventListener('resize', checkMobile)
  
  // 监听全屏状态变化
  document.addEventListener('fullscreenchange', handleFullscreenChange)
  
  // 加载数据集
  await loadDatasets()

  // 加载仪表盘数据（如果是编辑模式）
  if (route.params.id) {
    await loadDashboard()
  }
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