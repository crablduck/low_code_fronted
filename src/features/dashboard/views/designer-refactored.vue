<template>
  <div class="dashboard-designer-refactored">
    <!-- 工具栏 -->
    <DesignerToolbar
      :is-preview="isPreview"
      :show-grid-helper="showGridHelper"
      :is-mobile="isMobile"
      :has-charts="hasCharts"
      @toggle-preview="togglePreview"
      @toggle-grid-helper="toggleGridHelper"
      @smart-layout="applySmartLayout"
      @select-all="selectAllCharts"
      @clear-all="clearAllCharts"
      @export-dashboard="exportDashboard"
      @save-dashboard="showSaveDialog = true"
    />
    
    <div class="main-content">
      <!-- 左侧面板 -->
      <DesignerSidebar
        :is-mobile="isMobile"
        @chart-drag-start="handleDragStart"
        @component-drag-start="handleComponentDragStart"
      />
      
      <!-- 中间画布区域 -->
      <div class="canvas-area">
        <!-- 筛选器容器 - 固定在顶部 -->
        <div class="filters-container" 
             :class="{ 'drag-over': isFilterDragOver }"
             @dragover="handleFilterContainerDragOver" 
             @dragleave="handleFilterContainerDragLeave"
             @drop="handleFilterContainerDrop">
          <div class="filters-header">
            <el-icon><Filter /></el-icon>
            <span>筛选器</span>
            <el-tag size="small" type="info" v-if="filterItems.length > 0">{{ filterItems.length }} 个</el-tag>
          </div>
          
          <!-- 筛选器内容区域 -->
          <div v-if="filterItems.length > 0" class="filters-content" 
               @dragover="handleFilterDragOver" 
               @drop="handleFilterDrop">
            <div 
              v-for="(filter, index) in filterItems" 
              :key="filter.i"
              class="filter-item-wrapper"
              :class="{ selected: selectedChart?.i === filter.i }"
              draggable="true"
              @dragstart="handleFilterDragStart($event, filter, index)"
              @dragend="handleFilterDragEnd"
              @click="selectChart(filter.i)"
            >
              <div class="filter-drag-handle">
                <el-icon><Grid /></el-icon>
              </div>
              <div class="filter-label">{{ filter.chartConfig.title || filter.chartConfig.label || '筛选器' }}</div>
              <FilterRenderer
                :config="filter.chartConfig"
                @value-change="handleFilterValueChange"
                @filter-apply="handleFilterApply"
              />
            </div>
          </div>
          
          <!-- 空状态提示 -->
          <div v-else class="filters-empty-state">
            <el-icon><Filter /></el-icon>
            <span>将筛选器组件拖拽到此处添加筛选器</span>
          </div>
        </div>
        
        <!-- 画布区域 -->
        <div class="canvas-container" @click="handleCanvasBackgroundClick">
          <!-- 画布组件 - 只显示图表，不显示筛选器 -->
          <DesignerCanvas
            :layout="chartLayout"
            :selected-chart="selectedChart"
            :is-preview="isPreview"
            :show-grid-helper="showGridHelper"
            :has-charts="chartLayout.length > 0"
            @update:layout="updateChartLayout"
            @drop="handleDrop"
            @chart-click="selectChart"
            @canvas-click="deselectChart"
            @chart-context-menu="handleChartContextMenu"
            @update-config="updateItemConfig"
            @delete-chart="deleteChart"
            @copy-chart="copyChart"
            @select-all="selectAllCharts"
            @clear-all="clearAllCharts"
            @auto-layout="autoLayout"
            @export="exportDashboard"
            @resize="onResize"
            @resized="onResized"
            @move="onMove"
            @moved="onMoved"
          />
        </div>
      </div>
      
      <!-- 右侧配置面板 -->
      <div class="right-panels" :class="{ 'mobile-panels': isMobile }">
        <div class="panels-container">
          <!-- 无选中图表时的提示 -->
          <div v-if="!selectedChart" class="no-chart-selected">
            <div class="no-chart-content">
              <div class="hint-icon-wrapper">
                <el-icon class="hint-icon"><DataBoard /></el-icon>
              </div>
              <h4>请选择一个图表</h4>
              <p>点击画布中的图表来配置其数据源和样式属性</p>
              <div class="hint-steps">
                <div class="step-item">
                  <span class="step-number">1</span>
                  <span>从左侧拖拽图表类型到画布</span>
                </div>
                <div class="step-item">
                  <span class="step-number">2</span>
                  <span>点击图表进行配置</span>
                </div>
              </div>
            </div>
          </div>
          
          <!-- 图表配置面板 -->
          <div class="config-panel" v-if="selectedChart">
            <div class="panel-header">
              <h3>图表配置</h3>
              <el-button v-if="isMobile" @click="showConfigPanel = false" type="text" size="small">
                <el-icon><Close /></el-icon>
              </el-button>
            </div>

            <!-- 配置标签页 -->
            <el-tabs v-model="activeConfigTab" class="config-tabs" type="card">
              <!-- 数据源配置标签页 -->
              <el-tab-pane name="dataset" v-if="selectedChart">
                <template #label>
                  <div class="tab-label">
                    <el-icon><DataAnalysis /></el-icon>
                    <span>数据源</span>
                  </div>
                </template>
                
                <!-- 基础图表配置 -->
                <div class="basic-chart-config">
                  <el-form label-width="80px" size="small" v-if="localConfig">
                    <el-form-item label="图表标题">
                      <el-input
                        v-model="localConfig.title"
                        @change="handleConfigChange"
                        placeholder="请输入图表标题"
                      />
                    </el-form-item>
                    
                    <el-form-item label="数据集">
                      <el-select
                        v-model="localConfig.datasetId"
                        @change="(datasetId) => handleDatasetChange(datasetId as number)"
                        placeholder="请选择数据集"
                        style="width: 100%"
                      >
                        <el-option
                          v-for="dataset in datasets"
                          :key="dataset.id"
                          :label="dataset.name"
                          :value="dataset.id"
                        />
                      </el-select>
                    </el-form-item>
                    
                    <!-- 字段映射配置 -->
                    <template v-if="selectedDataset && isChartType(localConfig.type)">
                      <el-form-item label="X轴字段" v-if="['bar', 'line', 'area'].includes(localConfig.type)">
                        <el-select
                          v-model="localConfig.fieldMapping.xField"
                          @change="handleConfigChange"
                          placeholder="请选择X轴字段"
                          style="width: 100%"
                        >
                          <el-option
                            v-for="field in dimensionFields"
                            :key="field.fieldName"
                            :label="field.displayName || field.fieldName"
                            :value="field.fieldName"
                          />
                        </el-select>
                      </el-form-item>
                      
                      <el-form-item label="Y轴字段" v-if="['bar', 'line', 'area'].includes(localConfig.type)">
                        <el-select
                          v-model="localConfig.fieldMapping.yField"
                          @change="handleConfigChange"
                          placeholder="请选择Y轴字段"
                          style="width: 100%"
                        >
                          <el-option
                            v-for="field in metricFields"
                            :key="field.fieldName"
                            :label="field.displayName || field.fieldName"
                            :value="field.fieldName"
                          />
                        </el-select>
                      </el-form-item>
                      
                      <el-form-item label="名称字段" v-if="localConfig.type === 'pie'">
                        <el-select
                          v-model="localConfig.fieldMapping.nameField"
                          @change="handleConfigChange"
                          placeholder="请选择名称字段"
                          style="width: 100%"
                        >
                          <el-option
                            v-for="field in dimensionFields"
                            :key="field.fieldName"
                            :label="field.displayName || field.fieldName"
                            :value="field.fieldName"
                          />
                        </el-select>
                      </el-form-item>
                      
                      <el-form-item label="数值字段" v-if="localConfig.type === 'pie'">
                        <el-select
                          v-model="localConfig.fieldMapping.valueField"
                          @change="handleConfigChange"
                          placeholder="请选择数值字段"
                          style="width: 100%"
                        >
                          <el-option
                            v-for="field in metricFields"
                            :key="field.fieldName"
                            :label="field.displayName || field.fieldName"
                            :value="field.fieldName"
                          />
                        </el-select>
                      </el-form-item>
                    </template>

                    <!-- 字段展示区域 -->
                    <div v-if="selectedDataset" class="fields-display-section">
                      <div class="section-header">
                        <el-icon><Grid /></el-icon>
                        <span>字段信息</span>
                        <el-tag size="small" type="info" class="field-count">
                          共 {{ datasetFields.length || 0 }} 个字段
                        </el-tag>
                      </div>
                      
                      <div class="fields-container">
                        <!-- 维度字段 -->
                        <div class="field-group">
                          <div class="field-group-header">
                            <el-icon><Menu /></el-icon>
                            <span>维度字段</span>
                            <el-tag size="small" type="primary">{{ dimensionFields.length }}</el-tag>
                          </div>
                          <div class="field-list">
                            <div 
                              v-for="field in dimensionFields" 
                              :key="field.fieldName"
                              class="field-item dimension-field"
                            >
                              <el-icon class="field-icon"><CirclePlus /></el-icon>
                              <span class="field-name">{{ field.displayName || field.fieldName }}</span>
                              <el-tag size="small" type="info">{{ field.fieldType }}</el-tag>
                            </div>
                            <div v-if="dimensionFields.length === 0" class="empty-fields">
                              <el-icon><InfoFilled /></el-icon>
                              <span>暂无维度字段</span>
                            </div>
                          </div>
                        </div>
                        
                        <!-- 指标字段 -->
                        <div class="field-group">
                          <div class="field-group-header">
                            <el-icon><DataAnalysis /></el-icon>
                            <span>指标字段</span>
                            <el-tag size="small" type="success">{{ metricFields.length }}</el-tag>
                          </div>
                          <div class="field-list">
                            <div 
                              v-for="field in metricFields" 
                              :key="field.fieldName"
                              class="field-item metric-field"
                            >
                              <el-icon class="field-icon"><TrendCharts /></el-icon>
                              <span class="field-name">{{ field.displayName || field.fieldName }}</span>
                              <el-tag size="small" type="success">{{ field.aggregation || '指标' }}</el-tag>
                            </div>
                            <div v-if="metricFields.length === 0" class="empty-fields">
                              <el-icon><InfoFilled /></el-icon>
                              <span>暂无指标字段</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </el-form>
                </div>
              </el-tab-pane>

              <!-- 图表样式配置标签页 -->
              <el-tab-pane name="style" v-if="selectedChart && isChartType(selectedChart.type)">
                <template #label>
                  <div class="tab-label">
                    <el-icon><Setting /></el-icon>
                    <span>样式配置</span>
                  </div>
                </template>
                <div class="style-config-container" v-if="localConfig">
                  <el-form label-width="80px" size="small">
                    <el-form-item label="显示图例" v-if="['bar', 'line', 'pie', 'area'].includes(localConfig.type)">
                      <el-switch
                        v-model="localConfig.showLegend"
                        @change="handleConfigChange"
                      />
                    </el-form-item>
                    
                    <el-form-item label="显示工具栏" v-if="['bar', 'line', 'pie', 'area'].includes(localConfig.type)">
                      <el-switch
                        v-model="localConfig.showToolbox"
                        @change="handleConfigChange"
                      />
                    </el-form-item>
                    
                    <el-form-item label="数据限制">
                      <el-input-number
                        v-model="localConfig.dataLimit"
                        @change="handleConfigChange"
                        :min="10"
                        :max="10000"
                        :step="10"
                      />
                    </el-form-item>
                  </el-form>
                </div>
              </el-tab-pane>
              
              <!-- 筛选器关联标签页 -->
              <el-tab-pane name="filters" v-if="selectedChart && isChartType(selectedChart.type) && availableFilters.length > 0">
                <template #label>
                  <div class="tab-label">
                    <el-icon><Filter /></el-icon>
                    <span>筛选器关联</span>
                  </div>
                </template>
                <div class="filter-binding-container">
                  <div class="section-header">
                    <el-icon><Filter /></el-icon>
                    <span>可用筛选器</span>
                    <el-tag size="small" type="info">{{ availableFilters.length }} 个</el-tag>
                  </div>
                  
                  <div class="filter-list">
                    <div v-for="filter in availableFilters" :key="filter.i" class="filter-item">
                      <div class="filter-header">
                        <el-checkbox 
                          :model-value="isFilterBound(filter.i)"
                          @change="(checked) => toggleFilterBinding(filter.i, checked)"
                        >
                          <span class="filter-name">{{ filter.chartConfig.title || filter.chartConfig.label }}</span>
                        </el-checkbox>
                        <el-tag size="small" :type="getFilterTypeColor(filter.chartConfig.type)">
                          {{ getFilterTypeLabel(filter.chartConfig.type) }}
                        </el-tag>
                      </div>
                      
                      <!-- 字段选择 -->
                      <div v-if="isFilterBound(filter.i)" class="field-selection">
                        <el-form-item label="关联字段" size="small">
                          <el-select 
                            :model-value="getFilterBinding(filter.i)?.targetField"
                            @change="(field) => updateFilterBinding(filter.i, field)"
                            placeholder="选择要关联的字段"
                            style="width: 100%"
                          >
                            <el-option
                              v-for="field in getCompatibleFields(filter.chartConfig.type)"
                              :key="field.fieldName"
                              :label="field.displayName || field.fieldName"
                              :value="field.fieldName"
                            >
                              <span>{{ field.displayName || field.fieldName }}</span>
                              <el-tag size="small" style="margin-left: 8px">{{ field.fieldType }}</el-tag>
                            </el-option>
                          </el-select>
                        </el-form-item>
                      </div>
                    </div>
                    
                    <div v-if="availableFilters.length === 0" class="empty-filters">
                      <el-icon><InfoFilled /></el-icon>
                      <span>当前画布中没有筛选器组件</span>
                      <p>请先从左侧组件面板拖拽筛选器到画布</p>
                    </div>
                  </div>
                </div>
              </el-tab-pane>
            </el-tabs>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 保存对话框 -->
    <el-dialog 
      v-model="showSaveDialog" 
      :title="dashboardId ? '更新仪表盘' : '保存仪表盘'" 
      width="500px"
    >
      <el-form :model="saveForm" label-width="80px">
        <el-form-item label="名称" required>
          <el-input v-model="saveForm.name" placeholder="请输入仪表盘名称" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input 
            v-model="saveForm.description" 
            type="textarea" 
            placeholder="请输入仪表盘描述"
            :rows="3"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showSaveDialog = false">取消</el-button>
          <el-button type="primary" @click="handleSaveDashboard">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, nextTick, ref, computed, watch, toRaw } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 
  Setting, 
  DataAnalysis, 
  Grid, 
  Menu, 
  CirclePlus, 
  InfoFilled, 
  TrendCharts, 
  Close, 
  Filter 
} from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import { getDashboardDetail } from '@/api/dashboard'
import { DashboardStatus, DashboardType, ChartConfig } from '@/shared/types/dashboard'

// 组件导入
import DesignerToolbar from '../components/designer/DesignerToolbar.vue'
import DesignerSidebar from '../components/designer/DesignerSidebar.vue'
import DesignerCanvas from '../components/designer/DesignerCanvas.vue'
import FilterRenderer from '../components/dashboard/FilterRenderer.vue'

// 组合式函数
import { useDashboardState } from '../composables/useDashboardState'
import { useDragAndDrop } from '../composables/useDragAndDrop'

// 路由
const route = useRoute()
const router = useRouter()
const dashboardId = route.params.id as string

// 使用组合式函数
const {
  // 状态
  layout,
  selectedChart,
  chartInstances,
  datasets,
  selectedDataset,
  datasetFields,
  isPreview,
  showGridHelper,
  isMobile,
  globalFiltersConfig,
  activeConfigTab,
  showConfigPanel,
  showSaveDialog,
  saveForm,
  
  // 计算属性
  dimensionFields,
  metricFields,
  hasCharts,
  
  // 方法
  checkMobile,
  loadDatasets,
  loadDatasetFields,
  handleDatasetChange,
  selectChart,
  deselectChart,
  deleteChart,
  copyChart,
  clearAllCharts,
  selectAllCharts,
  autoLayout,
  updateSelectedChart,
  togglePreview,
  toggleGridHelper,
  exportDashboard,
  applySmartLayout,
  getDefaultFilterOptions
} = useDashboardState()

// 本地配置副本，用于表单绑定
const localConfig = ref<ChartConfig | null>(null)

// 侦听 selectedChart 的变化，更新本地副本
watch(selectedChart, (newChart) => {
  if (newChart) {
    // 使用深拷贝，避免直接修改全局状态
    localConfig.value = JSON.parse(JSON.stringify(toRaw(newChart)))
  } else {
    localConfig.value = null
  }
}, { deep: true })

// 配置变更处理器
const handleConfigChange = () => {
  if (localConfig.value && selectedChart.value) {
    // 1. 将本地副本的更改同步回全局 selectedChart
    Object.assign(selectedChart.value, localConfig.value)
    // 2. 调用核心更新方法，将更改持久化到 layout
    updateSelectedChart()
  }
}

// 获取默认筛选器值
const getDefaultFilterValue = (filterType: string) => {
  const defaultValueMap: Record<string, any> = {
    'filter-select': null,
    'filter-multiselect': [],
    'filter-date': null,
    'filter-daterange': null,
    'filter-slider': 50,
    'filter-input': ''
  }
  return defaultValueMap[filterType] || null
}

const {
  // 拖拽处理
  handleDragStart,
  handleComponentDragStart,
  handleCanvasDrop,
  isChartType,
  isFilterType,
  isTextType,
  setDefaultValueFunctions
} = useDragAndDrop()

// 设置默认值函数
setDefaultValueFunctions(getDefaultFilterOptions, getDefaultFilterValue)

// 过滤器相关的响应式变量
const filterItems = computed(() => {
  return layout.value.filter(item => isFilterType(item.chartConfig.type))
})

const chartLayout = computed(() => {
  return layout.value.filter(item => !isFilterType(item.chartConfig.type))
})

const hasFilters = computed(() => {
  return filterItems.value.length > 0
})

// 过滤器事件处理
const handleFilterValueChange = (value: any) => {
  console.log('过滤器值变化:', value)
}

const handleFilterApply = (filterData: any) => {
  console.log('应用过滤器:', filterData)
}

// 更新图表布局
const updateChartLayout = (newLayout: any[]) => {
  // 只更新图表部分，保持筛选器不变
  const filterItems = layout.value.filter(item => isFilterType(item.chartConfig.type))
  layout.value = [...filterItems, ...newLayout]
}

// 处理拖拽放下
const handleDrop = (event: DragEvent) => {
  const newChart = handleCanvasDrop(
    event, 
    layout.value, 
    selectedDataset.value, 
    datasetFields.value, 
    initChartInstance
  )
  
  if (newChart) {
    // 如果是筛选器类型，确保它被正确添加到布局中
    if (isFilterType(newChart.type)) {
      // 筛选器会在顶部显示，但仍需要在layout中管理
      console.log('添加筛选器到布局:', newChart)
    }
    
    // 立即选中新添加的图表/筛选器
    selectedChart.value = newChart
    
    // 确保配置面板显示并打开到数据源标签页
    showConfigPanel.value = true
    activeConfigTab.value = 'dataset'
    
    // 延迟一下确保DOM更新后再次设置选中状态
    nextTick(() => {
      selectChart(newChart.i)
    })
    
    console.log('已添加并选中组件:', newChart)
  }
}

// 初始化图表实例（废弃，现在由ChartItem组件自己管理）
const initChartInstance = async (chartId: string, config: any) => {
  // 注意：图表实例现在由ChartItem组件自己管理，避免重复初始化
  console.log(`图表 ${chartId} 实例管理已移交给ChartItem组件`)
}

// 更新项目配置
const updateItemConfig = (itemId: string, config: any) => {
  const item = layout.value.find(item => item.i === itemId)
  if (item) {
    console.log(`更新图表 ${itemId} 配置:`, config)
    
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
    
    if (selectedChart.value?.i === itemId) {
      selectedChart.value = {
        ...selectedChart.value,
        ...config,
        fieldMapping: {
          ...selectedChart.value.fieldMapping,
          ...(config.fieldMapping || {})
        }
      }
    }
    
    // 强制触发布局更新，确保 ChartItem 重新渲染
    layout.value = [...layout.value]
    
    console.log(`图表 ${itemId} 配置更新完成:`, item.chartConfig)
  }
}

// 右键菜单处理
const handleChartContextMenu = (event: MouseEvent, item: any) => {
  event.preventDefault()
}

// 画布背景点击处理
const handleCanvasBackgroundClick = () => {
  deselectChart()
}

// 全局过滤器变化处理
const handleGlobalFilterChange = (filterValues: Record<string, any>) => {
  console.log('全局过滤器值变化:', filterValues)
  // TODO: 应用过滤器到图表数据
}

// 保存仪表盘
const handleSaveDashboard = async () => {
  if (!saveForm.name.trim()) {
    ElMessage.warning('请输入仪表盘名称')
    return
  }
  
  try {
    const dashboardData = {
      name: saveForm.name,
      description: saveForm.description,
      layout: JSON.stringify(layout.value),
      status: DashboardStatus.DRAFT,
      type: DashboardType.CUSTOM
    }
    
    if (dashboardId) {
      // 更新现有仪表盘
      const { updateDashboard } = await import('@/api/dashboard')
      const result = await updateDashboard(dashboardId, dashboardData)
      
      if (result.code === 200) {
        ElMessage.success('更新成功')
      } else {
        throw new Error(result.message || '更新失败')
      }
    } else {
      // 创建新仪表盘
      const { createDashboard } = await import('@/api/dashboard')
      const result = await createDashboard(dashboardData)
      
      if (result.code === 200) {
        ElMessage.success('保存成功')
      } else {
        throw new Error(result.message || '保存失败')
      }
    }
    
    showSaveDialog.value = false
  } catch (error) {
    console.error('保存仪表盘失败:', error)
    ElMessage.error(dashboardId ? '更新失败' : '保存失败')
  }
}

// 布局事件处理
const onMove = (i: string, newX: number, newY: number) => {
  // 移动中的逻辑
  console.log(`图表 ${i} 移动中: (${newX}, ${newY})`)
}

const onMoved = (i: string, newX: number, newY: number) => {
  // 移动完成的逻辑
  console.log(`图表 ${i} 移动完成: (${newX}, ${newY})`)
}

const onResize = (i: string, newH: number, newW: number) => {
  // 调整大小中的逻辑
  console.log(`图表 ${i} 调整大小中: ${newW}x${newH}`)
}

const onResized = (i: string, newH: number, newW: number, newHPx: number, newWPx: number) => {
  // 调整大小完成的逻辑
  console.log(`图表 ${i} 调整大小完成: ${newW}x${newH} (${newWPx}x${newHPx}px)`)
  
  // 更新布局中的尺寸信息
  const item = layout.value.find(item => item.i === i)
  if (item) {
    item.w = newW
    item.h = newH
    
    // 触发布局更新，这会导致 ChartItem 重新渲染（因为 key 包含了 w 和 h）
    layout.value = [...layout.value]
    
    console.log(`图表 ${i} 布局信息已更新，ChartItem 将重新渲染`)
  }
}

// 加载仪表盘数据
const loadDashboardData = async () => {
  if (!dashboardId) return
  
  try {
    console.log('加载仪表盘数据，ID:', dashboardId)
    const result = await getDashboardDetail(dashboardId)
    
    if (result.code === 200 && result.data) {
      const dashboardData = result.data
      console.log('获取到的仪表盘数据:', dashboardData)
      
      // 恢复布局数据
      if (dashboardData.layout && Array.isArray(dashboardData.layout)) {
        layout.value = dashboardData.layout
        console.log('恢复的布局数据:', layout.value)
        
        // 如果有选中的第一个图表，自动选中它
        if (layout.value.length > 0) {
          const firstChart = layout.value[0]
          if (firstChart.chartConfig) {
            selectedChart.value = { ...firstChart.chartConfig, i: firstChart.i }
            console.log('自动选中第一个图表:', selectedChart.value)
          }
        }
      }
      
      // 恢复保存表单数据
      if (dashboardData.name) {
        saveForm.name = dashboardData.name
      }
      if (dashboardData.description) {
        saveForm.description = dashboardData.description
      }
      
      ElMessage.success('仪表盘数据加载成功')
      
      // 图表实例现在由ChartItem组件自己管理，不需要在这里初始化
      console.log('仪表盘布局恢复完成，图表将由各自的ChartItem组件负责渲染')
      
    } else {
      throw new Error(result.message || '获取仪表盘数据失败')
    }
  } catch (error) {
    console.error('加载仪表盘数据失败:', error)
    ElMessage.error('加载仪表盘数据失败')
  }
}

// 筛选器关联相关功能
// 获取画布中可用的筛选器
const availableFilters = computed(() => {
  return layout.value.filter(item => isFilterType(item.chartConfig.type))
})

// 获取筛选器类型对应的颜色
const getFilterTypeColor = (filterType: string) => {
  const colorMap: Record<string, string> = {
    'filter-select': 'primary',
    'filter-multiselect': 'success',
    'filter-date': 'warning',
    'filter-daterange': 'warning',
    'filter-slider': 'info',
    'filter-input': 'default'
  }
  return colorMap[filterType] || 'default'
}

// 获取筛选器类型标签
const getFilterTypeLabel = (filterType: string) => {
  const labelMap: Record<string, string> = {
    'filter-select': '下拉选择',
    'filter-multiselect': '多选下拉',
    'filter-date': '日期选择',
    'filter-daterange': '日期范围',
    'filter-slider': '滑块',
    'filter-input': '输入框'
  }
  return labelMap[filterType] || '筛选器'
}

// 检查筛选器是否已绑定
const isFilterBound = (filterId: string) => {
  if (!selectedChart.value?.filterBindings) return false
  return selectedChart.value.filterBindings.some(binding => binding.filterId === filterId)
}

// 获取筛选器绑定配置
const getFilterBinding = (filterId: string) => {
  if (!selectedChart.value?.filterBindings) return null
  return selectedChart.value.filterBindings.find(binding => binding.filterId === filterId)
}

// 切换筛选器绑定
const toggleFilterBinding = (filterId: string, enabled: boolean) => {
  if (!selectedChart.value) return
  
  if (!selectedChart.value.filterBindings) {
    selectedChart.value.filterBindings = []
  }
  
  const filterItem = layout.value.find(item => item.i === filterId)
  if (!filterItem) return
  
  if (enabled) {
    // 添加绑定
    const binding = {
      filterId,
      filterType: filterItem.chartConfig.type,
      filterLabel: filterItem.chartConfig.title || filterItem.chartConfig.label || '筛选器',
      targetField: '',
      enabled: true
    }
    selectedChart.value.filterBindings.push(binding)
  } else {
    // 移除绑定
    selectedChart.value.filterBindings = selectedChart.value.filterBindings.filter(
      binding => binding.filterId !== filterId
    )
  }
  
  updateSelectedChart()
}

// 更新筛选器绑定的目标字段
const updateFilterBinding = (filterId: string, targetField: string) => {
  if (!selectedChart.value?.filterBindings) return
  
  const binding = selectedChart.value.filterBindings.find(b => b.filterId === filterId)
  if (binding) {
    binding.targetField = targetField
    updateSelectedChart()
  }
}

// 获取与筛选器类型兼容的字段
const getCompatibleFields = (filterType: string) => {
  if (!datasetFields.value) return []
  
  // 筛选器类型与字段类型的匹配规则
  const compatibilityMap: Record<string, (field: any) => boolean> = {
    'filter-date': (field) => ['date', 'datetime', 'timestamp'].includes(field.dataType?.toLowerCase()) || field.fieldType === 'dimension',
    'filter-daterange': (field) => ['date', 'datetime', 'timestamp'].includes(field.dataType?.toLowerCase()) || field.fieldType === 'dimension',
    'filter-select': (field) => field.fieldType === 'dimension',
    'filter-multiselect': (field) => field.fieldType === 'dimension',
    'filter-slider': (field) => field.fieldType === 'metric' || ['number', 'int', 'float', 'decimal'].includes(field.dataType?.toLowerCase()),
    'filter-input': (field) => field.fieldType === 'dimension' || ['string', 'text', 'varchar'].includes(field.dataType?.toLowerCase())
  }
  
  const filterFn = compatibilityMap[filterType]
  if (!filterFn) return datasetFields.value
  
  return datasetFields.value.filter(filterFn)
}

// 筛选器拖拽排序相关
let draggedFilterIndex = -1
const isFilterDragOver = ref(false)

const handleFilterDragStart = (event: DragEvent, filter: any, index: number) => {
  draggedFilterIndex = index
  event.dataTransfer!.effectAllowed = 'move'
  event.dataTransfer!.setData('text/html', '')
}

const handleFilterDragEnd = () => {
  draggedFilterIndex = -1
}

const handleFilterDragOver = (event: DragEvent) => {
  event.preventDefault()
  event.dataTransfer!.dropEffect = 'move'
}

const handleFilterDrop = (event: DragEvent) => {
  event.preventDefault()
  
  const target = event.target as HTMLElement
  const filterWrapper = target.closest('.filter-item-wrapper')
  
  if (!filterWrapper || draggedFilterIndex === -1) return
  
  // 获取目标位置的索引
  const allFilters = Array.from(filterWrapper.parentElement!.children)
  const targetIndex = allFilters.indexOf(filterWrapper)
  
  if (targetIndex === -1 || targetIndex === draggedFilterIndex) return
  
  // 重新排序筛选器
  const filters = [...filterItems.value]
  const draggedFilter = filters.splice(draggedFilterIndex, 1)[0]
  filters.splice(targetIndex, 0, draggedFilter)
  
  // 更新布局中的筛选器顺序
  const chartItems = layout.value.filter(item => !isFilterType(item.chartConfig.type))
  layout.value = [...filters, ...chartItems]
  
  console.log('筛选器重新排序完成')
}

// 筛选器容器拖拽处理
const handleFilterContainerDragOver = (event: DragEvent) => {
  event.preventDefault()
  
  // 检查是否是从侧边栏拖拽的组件
  const componentData = event.dataTransfer?.getData('componentType')
  if (componentData) {
    try {
      const component = JSON.parse(componentData)
      if (isFilterType(component.type)) {
        isFilterDragOver.value = true
        event.dataTransfer!.dropEffect = 'copy'
      }
    } catch (e) {
      // 忽略解析错误
    }
  }
}

const handleFilterContainerDragLeave = (event: DragEvent) => {
  // 检查是否真的离开了容器
  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect()
  const x = event.clientX
  const y = event.clientY
  
  if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
    isFilterDragOver.value = false
  }
}

const handleFilterContainerDrop = (event: DragEvent) => {
  event.preventDefault()
  isFilterDragOver.value = false
  
  const componentData = event.dataTransfer?.getData('componentType')
  if (componentData) {
    try {
      const component = JSON.parse(componentData)
      if (isFilterType(component.type)) {
        // 创建新的筛选器
        const newFilter = handleCanvasDrop(
          event,
          layout.value,
          selectedDataset.value,
          datasetFields.value,
          initChartInstance
        )
        
        if (newFilter) {
          // 立即选中新添加的筛选器
          selectedChart.value = newFilter
          
          // 确保配置面板显示并打开到数据源标签页
          showConfigPanel.value = true
          activeConfigTab.value = 'dataset'
          
          // 延迟一下确保DOM更新后再次设置选中状态
          nextTick(() => {
            selectChart(newFilter.i)
          })
          
          console.log('添加筛选器到筛选器栏:', newFilter)
        }
      }
    } catch (e) {
      console.error('解析拖拽数据失败:', e)
    }
  }
}

// 生命周期
onMounted(async () => {
  checkMobile()
  await loadDatasets()
  
  // 如果有仪表盘ID，加载现有配置
  if (dashboardId) {
    try {
      const { getDashboardDetail } = await import('@/api/dashboard')
      const result = await getDashboardDetail(dashboardId)
      if (result.code === 200 && result.data) {
        const dashboard = result.data
        if (dashboard.layout) {
          try {
            layout.value = JSON.parse(dashboard.layout)
          } catch (error) {
            console.error('解析仪表盘布局失败:', error)
          }
        }
        saveForm.name = dashboard.name || ''
        saveForm.description = dashboard.description || ''
      }
    } catch (error) {
      console.error('加载仪表盘详情失败:', error)
      ElMessage.warning('加载仪表盘配置失败，将使用默认配置')
    }
  }
  
  window.addEventListener('resize', checkMobile)
})

onUnmounted(() => {
  window.removeEventListener('resize', checkMobile)
  
  // 清理图表实例
  chartInstances.value.forEach(chart => chart.dispose())
  chartInstances.value.clear()
})
</script>

<style lang="scss" scoped>
.dashboard-designer-refactored {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  
  .main-content {
    display: flex;
    flex: 1;
    height: calc(100vh - 60px);
    
    .canvas-area {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      
      .filters-container {
        background: white;
        border-bottom: 1px solid #e4e7ed;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        padding: 12px 16px;
        flex-shrink: 0;
        transition: all 0.3s ease;
        
        &.drag-over {
          background: #f0f9ff;
          border-bottom-color: #409eff;
          box-shadow: 0 2px 8px rgba(64, 158, 255, 0.2);
        }
        
        .filters-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 12px;
          font-size: 14px;
          font-weight: 500;
          color: #303133;
          
          .el-icon {
            color: #409eff;
            font-size: 16px;
          }
        }
        
        .filters-empty-state {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 24px;
          border: 2px dashed #e4e7ed;
          border-radius: 8px;
          color: #909399;
          font-size: 14px;
          transition: all 0.3s ease;
          
          .el-icon {
            font-size: 24px;
            color: #c0c4cc;
          }
          
          &:hover {
            border-color: #409eff;
            color: #409eff;
            background: #f0f9ff;
            
            .el-icon {
              color: #409eff;
            }
          }
        }
        
        .filters-content {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          align-items: center;
          
          .filter-item-wrapper {
            display: flex;
            flex-direction: column;
            gap: 4px;
            min-width: 180px;
            max-width: 240px;
            padding: 8px;
            border: 1px solid #e4e7ed;
            border-radius: 6px;
            background: #fafbfc;
            cursor: pointer;
            transition: all 0.2s ease;
            position: relative;
            
            &:hover {
              border-color: #409eff;
              background: #ecf5ff;
              transform: translateY(-1px);
              box-shadow: 0 2px 8px rgba(64, 158, 255, 0.15);
            }
            
            &.selected {
              border-color: #409eff;
              background: #ecf5ff;
              box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2);
            }
            
            &[draggable="true"] {
              cursor: move;
              
              &:active {
                opacity: 0.8;
                transform: scale(1.02);
              }
            }
            
            .filter-drag-handle {
              position: absolute;
              top: 4px;
              right: 4px;
              padding: 2px;
              border-radius: 3px;
              background: rgba(64, 158, 255, 0.1);
              color: #409eff;
              cursor: grab;
              opacity: 0.7;
              transition: opacity 0.2s ease;
              
              &:hover {
                opacity: 1;
                background: rgba(64, 158, 255, 0.2);
              }
              
              &:active {
                cursor: grabbing;
              }
              
              .el-icon {
                font-size: 12px;
              }
            }
            
            .filter-label {
              font-size: 12px;
              color: #606266;
              font-weight: 500;
              text-align: center;
              margin-bottom: 4px;
              padding-right: 20px; // 为拖拽手柄留出空间
            }
          }
        }
      }
      
      .canvas-container {
        flex: 1;
        display: flex;
        flex-direction: column;
        overflow: hidden;
      }
    }
    
    .right-panels {
      width: 380px;
      background: white;
      border-left: 1px solid #e4e7ed;
      overflow-y: auto;
      flex-shrink: 0;
      box-shadow: -2px 0 8px rgba(0, 0, 0, 0.1);
      
      .panels-container {
        height: 100%;
      }
      
      .config-panel {
        padding: 0;
        height: 100%;
        
        .panel-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 20px;
          background: linear-gradient(135deg, #f8fbff 0%, #e8f5e8 100%);
          border-bottom: 1px solid #e3f2fd;
          position: relative;
          
          &::before {
            content: '';
            position: absolute;
            left: 0;
            top: 0;
            bottom: 0;
            width: 4px;
            background: linear-gradient(180deg, #2196f3 0%, #4caf50 100%);
            border-radius: 0 2px 2px 0;
          }
          
          h3 {
            margin: 0;
            font-size: 15px;
            font-weight: 500;
            color: #1976d2;
            display: flex;
            align-items: center;
            gap: 8px;
            
            &::before {
              content: '';
              width: 6px;
              height: 6px;
              background: #2196f3;
              border-radius: 50%;
              flex-shrink: 0;
            }
          }
          
          .el-button {
            background: transparent;
            border: 1px solid #e3f2fd;
            color: #1976d2;
            padding: 4px 8px;
            font-size: 12px;
            border-radius: 4px;
            
            &:hover {
              background: rgba(33, 150, 243, 0.08);
              border-color: #bbdefb;
            }
          }
        }
        
        .config-tabs {
          height: calc(100% - 70px);
          
          :deep(.el-tabs__header) {
            margin: 0;
            background: #f8fbff;
            border-bottom: 1px solid #e3f2fd;
            
            .el-tabs__nav-wrap {
              padding: 0 20px;
            }
            
            .el-tabs__item {
              color: #78909c;
              border: none;
              font-weight: 400;
              transition: all 0.2s ease;
              
              &:hover {
                color: #1976d2;
              }
              
              &.is-active {
                color: #1976d2;
                background: white;
                border-bottom: 2px solid #2196f3;
                font-weight: 500;
              }
              
              .tab-label {
                display: flex;
                align-items: center;
                gap: 6px;
                font-size: 13px;
                
                .el-icon {
                  font-size: 14px;
                }
              }
            }
          }
          
          :deep(.el-tabs__content) {
            padding: 20px;
            height: calc(100% - 60px);
            overflow-y: auto;
          }
        }
        
        .basic-chart-config {
          .el-form-item {
            margin-bottom: 20px;
            
            .el-form-item__label {
              color: #303133;
              font-weight: 500;
            }
          }
        }
        
        .style-config-container {
          .el-form-item {
            margin-bottom: 16px;
          }
        }
        
        // 字段展示区域样式
        .fields-display-section {
          margin-top: 20px;
          border-top: 1px solid #f0f2f5;
          padding-top: 20px;
          
          .section-header {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 16px;
            
            .el-icon {
              color: #409eff;
              font-size: 16px;
            }
            
            span {
              font-size: 14px;
              font-weight: 600;
              color: #303133;
            }
            
            .field-count {
              margin-left: auto;
            }
          }
          
          .fields-container {
            .field-group {
              margin-bottom: 16px;
              
              .field-group-header {
                display: flex;
                align-items: center;
                gap: 8px;
                margin-bottom: 8px;
                padding: 8px 12px;
                background: #f5f7fa;
                border-radius: 4px;
                
                .el-icon {
                  color: #606266;
                  font-size: 14px;
                }
                
                span {
                  font-size: 13px;
                  font-weight: 500;
                  color: #606266;
                }
                
                .el-tag {
                  margin-left: auto;
                }
              }
              
              .field-list {
                .field-item {
                  display: flex;
                  align-items: center;
                  gap: 8px;
                  padding: 8px 12px;
                  margin-bottom: 4px;
                  background: white;
                  border: 1px solid #e4e7ed;
                  border-radius: 4px;
                  transition: all 0.2s ease;
                  
                  &:hover {
                    border-color: #c0c4cc;
                    background: #f8f9fa;
                  }
                  
                  .field-icon {
                    color: #909399;
                    font-size: 14px;
                  }
                  
                  .field-name {
                    flex: 1;
                    font-size: 13px;
                    color: #606266;
                  }
                  
                  .el-tag {
                    font-size: 11px;
                  }
                  
                  &.dimension-field {
                    .field-icon {
                      color: #409eff;
                    }
                  }
                  
                  &.metric-field {
                    .field-icon {
                      color: #67c23a;
                    }
                  }
                }
                
                .empty-fields {
                  display: flex;
                  align-items: center;
                  gap: 8px;
                  padding: 16px 12px;
                  color: #c0c4cc;
                  font-size: 13px;
                  text-align: center;
                  
                  .el-icon {
                    font-size: 16px;
                  }
                }
              }
            }
          }
        }
      }
      
      .no-chart-selected {
        display: flex;
        align-items: center;
        justify-content: center;
        height: 100%;
        padding: 40px 20px;
        background: linear-gradient(135deg, #e3f2fd 0%, #f5f9ff 100%);
        color: #546e7a;
        
        .no-chart-content {
          text-align: center;
          
          .hint-icon-wrapper {
            margin-bottom: 20px;
            
            .hint-icon {
              font-size: 64px;
              color: #90caf9;
            }
          }
          
          h4 {
            margin: 0 0 12px 0;
            font-size: 20px;
            font-weight: 600;
            color: #37474f;
          }
          
          p {
            margin: 0 0 24px 0;
            font-size: 14px;
            line-height: 1.6;
            color: #546e7a;
          }
          
          .hint-steps {
            .step-item {
              display: flex;
              align-items: center;
              justify-content: center;
              gap: 12px;
              margin-bottom: 12px;
              
              .step-number {
                display: flex;
                align-items: center;
                justify-content: center;
                width: 24px;
                height: 24px;
                background: #bbdefb;
                border-radius: 50%;
                font-size: 12px;
                font-weight: bold;
                color: #1976d2;
              }
              
              span:last-child {
                font-size: 13px;
                color: #546e7a;
              }
            }
          }
        }
      }
      
      &.mobile-panels {
        position: fixed;
        top: 60px;
        right: 0;
        width: 100%;
        height: calc(100vh - 60px);
        z-index: 1000;
        transform: translateX(100%);
        transition: transform 0.3s ease;
        
        &.show {
          transform: translateX(0);
        }
      }
    }
  }
}

// 响应式设计
@media (max-width: 768px) {
  .dashboard-designer-refactored {
    .main-content {
      flex-direction: column;
      height: auto;
      
      .right-panels {
        width: 100% !important;
        border-left: none;
        border-top: 1px solid #e4e7ed;
        box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.1);
      }
    }
  }
}

// 全局筛选器在顶部的特殊样式
:deep(.vue-grid-layout) {
  .vue-grid-item {
    transition: all 0.3s ease;
    
    // 筛选器样式
    &[data-filter="true"] {
      .chart-container {
        background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);
        border: 2px solid #e91e63;
        
        .chart-drag-handler {
          background: linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%);
          color: #e91e63;
          
          .chart-type-badge {
            background: rgba(233, 30, 99, 0.1);
            color: #e91e63;
          }
        }
      }
    }
    
    // 图表样式
    &[data-chart="true"] {
      .chart-container {
        background: white;
        border: 1px solid #e4e7ed;
        
        &:hover {
          border-color: #409eff;
          box-shadow: 0 4px 12px rgba(64, 158, 255, 0.15);
        }
      }
    }
    
    // 选中状态
    &.selected {
      .chart-container {
        border-color: #409eff !important;
        box-shadow: 0 0 0 3px rgba(64, 158, 255, 0.2) !important;
        transform: translateY(-2px);
      }
    }
  }
}

// 筛选器关联面板样式
.filter-binding-container {
  padding: 16px;
  
  .section-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 16px;
    font-weight: 500;
    color: #303133;
  }
  
  .filter-list {
    .filter-item {
      border: 1px solid #e4e7ed;
      border-radius: 6px;
      margin-bottom: 12px;
      background: #fafafa;
      
      .filter-header {
        padding: 12px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        
        .filter-name {
          font-weight: 500;
          color: #303133;
        }
      }
      
      .field-selection {
        padding: 0 12px 12px;
        border-top: 1px solid #e4e7ed;
        background: white;
        
        .el-form-item {
          margin-bottom: 0;
        }
      }
    }
    
    .empty-filters {
      text-align: center;
      padding: 40px 20px;
      color: #909399;
      
      .el-icon {
        font-size: 48px;
        margin-bottom: 16px;
        color: #c0c4cc;
      }
      
      p {
        margin: 8px 0 0;
        font-size: 12px;
      }
    }
  }
}

.mobile-layout {
}
</style> 