<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Refresh, Edit, Search } from '@element-plus/icons-vue'
import { GridLayout, GridItem } from 'vue3-grid-layout-next'
import * as echarts from 'echarts'
import type { DashboardDetail, LayoutItem, ChartConfig } from '@/shared/types/dashboard'
import { getDashboardDetail } from '@/api/dashboard'
import { smartPreviewDataset } from '@/api/dataset'
import FilterComponent from '@/features/dashboard/components/designer/FilterComponent.vue'
import ChartItem from '@/features/dashboard/components/designer/ChartItem.vue'

const route = useRoute()
const router = useRouter()
const loading = ref(true)
const queryLoading = ref(false)
const hasEditPermission = ref(true)
const dashboard = ref<DashboardDetail | null>(null)
const layout = ref<LayoutItem[]>([])
const chartInstances = ref<Map<string, echarts.ECharts>>(new Map())
// 筛选器值
const filterValues = ref<Record<string, any>>({})

// 从布局中计算出筛选器项
const filterItems = computed(() => {
  return layout.value.filter(item => item.chartConfig?.type?.startsWith('filter-'))
})

// 从布局中计算出图表项
const chartItems = computed(() => {
  return layout.value.filter(item => !item.chartConfig?.type?.startsWith('filter-'))
})

// 加载仪表盘数据
const loadDashboard = async () => {
  try {
    loading.value = true
    const dashboardId = route.params.id as string
    console.log('加载仪表盘预览，ID:', dashboardId)
    
    const res = await getDashboardDetail(dashboardId)
    console.log('仪表盘详情响应:', res)
    
    if (res.code === 200 && res.data) {
      dashboard.value = res.data

      // 解析布局数据
      let parsedLayout: LayoutItem[] = []
      if (res.data.layout) {
        try {
          parsedLayout = typeof res.data.layout === 'string' 
            ? JSON.parse(res.data.layout) 
            : res.data.layout
        } catch (error) {
          console.warn('解析layout失败:', error)
          parsedLayout = []
        }
      }

      // 解析图表配置
      let parsedCharts: ChartConfig[] = []
      if (res.data.config?.charts) {
        parsedCharts = res.data.config.charts
      }
      
      console.log('解析后的布局:', parsedLayout)
      console.log('解析后的图表:', parsedCharts)

      // 合并布局和图表配置
      const mergedLayout = parsedLayout.map(layoutItem => {
        const chartConfig = parsedCharts.find(chart => chart.id === layoutItem.i)
        return {
          ...layoutItem,
          chartConfig: chartConfig || {
            id: layoutItem.i,
            i: layoutItem.i,
            type: 'bar',
            title: '未配置图表'
          }
        }
      })

      layout.value = mergedLayout

      // 清除旧的图表实例
      destroyAllCharts()
      
      // 延迟初始化图表，确保DOM已渲染
      await nextTick()
      setTimeout(() => {
        initAllCharts()
      }, 100)
    } else {
      ElMessage.error(res.message || '加载仪表盘失败')
    }
  } catch (error) {
    console.error('加载仪表盘失败:', error)
    ElMessage.error('加载仪表盘失败：' + (error as Error).message || '未知错误')
  } finally {
    loading.value = false
  }
}

// 销毁所有图表实例
const destroyAllCharts = () => {
  chartInstances.value.forEach(instance => {
    try {
      instance.dispose()
    } catch (error) {
      console.warn('销毁图表实例失败:', error)
    }
  })
  chartInstances.value.clear()
}

// 初始化所有图表
const initAllCharts = async () => {
  console.log('开始初始化图表，布局数量:', layout.value.length)
  
  await nextTick()

  // 初始化所有图表实例
  chartItems.value.forEach(item => {
    initSingleChart(item)
  })

  // 加载所有图表数据
  await loadAllChartsData()
}

// 加载所有图表数据
const loadAllChartsData = async () => {
  queryLoading.value = true
  try {
    const chartDataPromises = chartItems.value.map(item => fetchChartData(item))
    await Promise.all(chartDataPromises)
    console.log('所有图表数据加载完成')
  } catch (error) {
    console.error('加载全部图表数据失败:', error)
    ElMessage.error('部分图表数据加载失败')
  } finally {
    queryLoading.value = false
  }
}

// 获取单个图表的数据
const fetchChartData = async (chart: LayoutItem, filters: any[] = []) => {
  const config = chart.chartConfig
  if (!config || !config.datasetId) {
    console.warn(`图表 ${chart.i} 缺少数据集配置`)
    return
  }
  
  try {
    console.log(`获取图表 ${chart.i} 数据，数据集ID: ${config.datasetId}`, filters)
    const previewOptions = {
      filters: filters.length > 0 ? filters : undefined,
      limit: config.dataLimit || 1000
    }
    const response = await smartPreviewDataset(config.datasetId, previewOptions)
    
    if (response.code === 200) {
      const chartData = transformSmartPreviewToChartData(response.data, config)
      chart.chartConfig.chartData = chartData
      updateChartOption(chart)
    } else {
      console.error(`图表 ${chart.i} 数据获取失败:`, response.message)
      ElMessage.error(`图表 "${config.title}" 数据加载失败: ${response.message}`)
      chart.chartConfig.chartData = { series: [], categories: [] } // 设置空数据
      updateChartOption(chart)
    }
  } catch (error) {
    console.error(`获取图表 ${chart.i} 数据时出错:`, error)
    ElMessage.error(`图表 "${config.title}" 数据加载出错`)
    chart.chartConfig.chartData = { series: [], categories: [] } // 设置空数据
    updateChartOption(chart)
  }
}

// 初始化单个图表
const initSingleChart = (item: LayoutItem) => {
  const chartId = `chart-${item.i}`
  const container = document.getElementById(chartId)
  
  if (!container) {
    console.warn(`图表容器 ${chartId} 不存在`)
    return
  }

  console.log(`初始化图表 ${item.i}`)

  // 销毁已存在的实例
  const existingInstance = chartInstances.value.get(item.i)
  if (existingInstance) {
    try {
      existingInstance.dispose()
    } catch (error) {
      console.warn('销毁已存在图表实例失败:', error)
    }
  }

  // 创建新实例
  const chartInstance = echarts.init(container)
  chartInstances.value.set(item.i, chartInstance)

  // 设置图表配置
  updateChartOption(item)
  
  console.log(`图表 ${item.i} 初始化完成`)
}

// 更新图表配置
const updateChartOption = (item: LayoutItem) => {
  const chartInstance = chartInstances.value.get(item.i)
  if (chartInstance) {
    const option = generateChartOption(item.chartConfig)
    chartInstance.setOption(option, true)
  }
}

// 生成图表配置
const generateChartOption = (config: ChartConfig) => {
  const data = config.chartData || { series: [], categories: [] }

  const baseOption = {
    title: {
      text: config.title || '未命名图表',
      left: 'center',
      textStyle: {
        fontSize: 14
      }
    },
    tooltip: {
      trigger: 'axis',
      confine: true
    },
    legend: {
      show: config.showLegend !== false,
      bottom: 0,
      type: 'scroll'
    },
    grid: {
      top: config.title ? 50 : 20,
      bottom: config.showLegend !== false ? 50 : 20,
      left: '10%',
      right: '10%',
      containLabel: true
    }
  }

  const noData = !data || !data.series || data.series.length === 0 || 
                (data.series[0] && data.series[0].data && data.series[0].data.length === 0);

  if (noData) {
    return {
      ...baseOption,
      series: [{
        name: '暂无数据',
        type: config.type || 'bar',
        data: []
      }],
      xAxis: { type: 'category', data: [] },
      yAxis: { type: 'value' }
    }
  }
  
  switch (config.type) {
    case 'line':
    case 'bar':
    case 'area':
      return {
        ...baseOption,
        xAxis: {
          type: 'category',
          data: data.categories,
          axisLabel: {
            rotate: 30
          }
        },
        yAxis: {
          type: 'value'
        },
        series: data.series
      }
    case 'pie':
      return {
        ...baseOption,
        tooltip: {
          trigger: 'item'
        },
        series: data.series.map(s => ({
          ...s,
          type: 'pie',
          radius: '60%',
        }))
      }
    case 'table':
      // 表格由 ChartItem 组件自行渲染，这里不生成 ECharts 配置
      return {}
    default:
      return baseOption
  }
}

// 数据转换逻辑
const transformSmartPreviewToChartData = (smartData: any, config: any) => {
  let records: any[] = []
  if (smartData.records && Array.isArray(smartData.records)) {
    records = smartData.records
  } else if (smartData.content && Array.isArray(smartData.content)) {
    records = smartData.content
  } else if (Array.isArray(smartData)) {
    records = smartData
  }

  if (!records || records.length === 0) {
    return { series: [], categories: [] }
  }
  
  const { fieldMapping, type } = config
  if (!fieldMapping) {
    console.warn(`图表 ${config.id} 缺少 fieldMapping 配置`)
    return { series: [], categories: [] }
  }

  switch (type) {
    case 'bar':
    case 'line':
    case 'area':
      return transformToBarLineData(records, fieldMapping)
    case 'pie':
      return transformToPieData(records, fieldMapping)
    default:
      return { 
        series: [{ data: records }], 
        categories: smartData.columns || (records.length > 0 ? Object.keys(records[0]) : [])
      }
  }
}

const transformToBarLineData = (records: any[], fieldMapping: any) => {
  const xField = fieldMapping.xAxis || fieldMapping.xField || fieldMapping.category
  const yField = fieldMapping.yAxis || fieldMapping.yField || fieldMapping.value
  const seriesField = fieldMapping.series || fieldMapping.legend
  
  if (!xField || !yField) return { series: [], categories: [] }

  const categories = [...new Set(records.map(r => r[xField]))].sort()

  if (seriesField) {
    const seriesNames = [...new Set(records.map(r => r[seriesField]))]
    const series = seriesNames.map(name => {
      const data = categories.map(cat => {
        const record = records.find(r => r[xField] === cat && r[seriesField] === name)
        return record ? record[yField] : 0
      })
      return { name, data, type: fieldMapping.type || 'bar' }
    })
    return { categories, series }
  } else {
    const data = categories.map(cat => {
      const record = records.find(r => r[xField] === cat)
      return record ? record[yField] : 0
    })
    return { categories, series: [{ name: yField, data, type: fieldMapping.type || 'bar' }] }
  }
}

const transformToPieData = (records: any[], fieldMapping: any) => {
  const nameField = fieldMapping.nameField || fieldMapping.name || fieldMapping.label
  const valueField = fieldMapping.valueField || fieldMapping.value
  
  if (!nameField || !valueField) return { series: [] }

  const data = records.map(record => ({
    name: record[nameField],
    value: record[valueField] || 0
  })).filter(item => item.name && item.value > 0)
  
  return { series: [{ data, type: 'pie' }] }
}

// 处理筛选器值变化
const handleFilterChange = (filterId: string, value: any) => {
  console.log(`筛选器 ${filterId} 值变化:`, value)
  filterValues.value[filterId] = value
}

// 应用筛选器
const applyFilters = async () => {
  queryLoading.value = true
  try {
    console.log('应用筛选器，当前筛选器值:', filterValues.value)
    
    // 找出所有需要更新的图表
    const chartsToUpdate = chartItems.value.filter(chart => {
      return chart.chartConfig.useGlobalFilters && 
             chart.chartConfig.globalFilterBindings && 
             chart.chartConfig.globalFilterBindings.length > 0
    })
    
    if (chartsToUpdate.length === 0) {
      console.log('没有找到需要更新的图表')
      ElMessage.info('没有找到使用全局筛选器的图表')
      return
    }
    
    console.log(`找到 ${chartsToUpdate.length} 个需要更新的图表`)
    
    // 为每个图表构建筛选条件并更新数据
    const updatePromises = chartsToUpdate.map(chart => {
      const bindings = chart.chartConfig.globalFilterBindings || []
      const filters: any[] = []
      
      bindings.forEach(binding => {
        const filterValue = filterValues.value[binding.filterKey]
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
            'is_not_null': 'is_not_null',
          }
          
          const operator = binding.operator || 'equals'
          const apiOperator = operatorMapping[operator] || 'eq'
          
          filters.push({
            fieldName: binding.chartField,
            operator: apiOperator,
            value: filterValue
          })
        }
      })
      
      console.log(`为图表 ${chart.i} 构建筛选条件:`, filters)
      return fetchChartData(chart, filters)
    })
    
    await Promise.all(updatePromises)
    ElMessage.success('筛选条件已应用')
    
  } catch (error) {
    console.error('应用筛选器失败:', error)
    ElMessage.error('应用筛选器失败')
  } finally {
    queryLoading.value = false
  }
}

// 重置筛选器
const resetFilters = () => {
  // 清空所有筛选器的值
  filterValues.value = {}
  
  // 重新加载所有图表数据（不带筛选条件）
  loadAllChartsData()
  
  ElMessage.success('筛选条件已重置')
}

// 刷新数据
const handleRefresh = () => {
  loadDashboard()
}

// 编辑仪表盘
const handleEdit = () => {
  router.push(`/dashboard/designer/${route.params.id}`)
}

// 窗口大小调整处理
const handleResize = () => {
  chartInstances.value.forEach(instance => {
    instance.resize()
  })
}

onMounted(() => {
  loadDashboard()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  destroyAllCharts()
  window.removeEventListener('resize', handleResize)
})
</script>

<template>
  <div class="dashboard-preview">
    <!-- 头部区域 -->
    <div class="preview-header">
      <div class="header-content">
        <h2>{{ dashboard?.name || '仪表盘预览' }}</h2>
        <p class="description" v-if="dashboard?.description">
          {{ dashboard.description }}
        </p>
      </div>
      <div class="header-actions">
        <el-button type="primary" @click="handleRefresh" :loading="loading">
          <el-icon><Refresh /></el-icon>
          刷新数据
        </el-button>
        <el-button @click="handleEdit" v-if="hasEditPermission">
          <el-icon><Edit /></el-icon>
          编辑
        </el-button>
      </div>
    </div>

    <!-- 全局筛选器区域 - 使用sticky定位 -->
    <div v-if="filterItems.length > 0" class="filters-container">
      <div class="filter-list">
        <div v-for="filter in filterItems" :key="filter.i" class="filter-item">
          <FilterComponent 
            :config="filter.chartConfig" 
            :is-preview="true"
            @value-change="(value) => handleFilterChange(filter.i, value)"
          />
        </div>
      </div>
      <div class="filter-actions">
        <el-button type="primary" @click="applyFilters" :loading="queryLoading" :icon="Search">
          查询
        </el-button>
        <el-button @click="resetFilters" :disabled="queryLoading">
          重置
        </el-button>
      </div>
    </div>

    <!-- 内容区域 -->
    <div class="preview-content" v-loading="loading" element-loading-text="正在加载仪表盘...">
      <template v-if="!loading">
        <div v-if="chartItems.length > 0" class="grid-container">
          <grid-layout
            :layout="chartItems"
            :col-num="12"
            :row-height="30"
            :margin="[10, 10]"
            :is-draggable="false"
            :is-resizable="false"
            :vertical-compact="false"
            :use-css-transforms="true"
          >
            <grid-item
              v-for="item in chartItems"
              :key="item.i"
              :x="item.x"
              :y="item.y"
              :w="item.w"
              :h="item.h"
              :i="item.i"
            >
              <div class="chart-container">
                <div class="chart-header">
                  <span class="chart-title">
                    {{ item.chartConfig?.title || '未配置图表' }}
                  </span>
                  <span class="chart-type">
                    {{ item.chartConfig?.type || 'bar' }}
                  </span>
                </div>
                <div 
                  class="chart-content" 
                  :id="`chart-${item.i}`"
                ></div>
              </div>
            </grid-item>
          </grid-layout>
        </div>
        <el-empty v-else description="暂无图表数据，请先配置仪表盘" />
      </template>
    </div>
  </div>
</template>

<style scoped lang="scss">
.dashboard-preview {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f5f7fa;
  padding: 20px;
  gap: 20px;
  overflow: hidden;
}

.preview-header {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: flex-start;

  .header-content {
    flex: 1;
    
    h2 {
      margin: 0;
      font-size: 20px;
      color: #303133;
      font-weight: 600;
    }

    .description {
      margin: 8px 0 0;
      color: #606266;
      font-size: 14px;
      line-height: 1.5;
    }
  }

  .header-actions {
    display: flex;
    gap: 12px;
  }
}

/* 筛选器容器样式 - 使用sticky定位 */
.filters-container {
  position: sticky;
  top: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background-color: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(8px);
  border-radius: 8px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  flex-wrap: wrap;
}

.filter-list {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  flex-grow: 1;
}

.filter-item {
  min-width: 200px;
}

.filter-actions {
  flex-shrink: 0;
  display: flex;
  align-items: center;
}

.preview-content {
  flex: 1;
  min-height: 0;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  padding: 20px;
  overflow: auto;

  .grid-container {
    min-height: 100%;
  }
}

.chart-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: white;
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.chart-header {
  height: 40px;
  padding: 0 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #f8f9fa;
  border-bottom: 1px solid #e4e7ed;

  .chart-title {
    font-size: 14px;
    color: #303133;
    font-weight: 500;
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .chart-type {
    font-size: 12px;
    color: #909399;
    background: #f0f2f5;
    padding: 2px 6px;
    border-radius: 3px;
    text-transform: uppercase;
  }
}

.chart-content {
  flex: 1;
  min-height: 200px;
  overflow: hidden;
}

// 响应式设计
@media (max-width: 768px) {
  .dashboard-preview {
    padding: 10px;
  }
  
  .preview-header {
    flex-direction: column;
    gap: 15px;
    align-items: stretch;
    
    .header-actions {
      justify-content: flex-end;
    }
  }
}
</style> 