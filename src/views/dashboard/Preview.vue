<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Refresh, Edit } from '@element-plus/icons-vue'
import { GridLayout, GridItem } from 'vue3-grid-layout-next'
import * as echarts from 'echarts'
import type { DashboardDetail, LayoutItem, ChartConfig } from '@/types/dashboard'
import { getDashboardDetail } from '@/api/dashboard'
import { previewDatasetData } from '@/api/dataset'

const route = useRoute()
const router = useRouter()
const loading = ref(true)
const hasEditPermission = ref(true)
const dashboard = ref<DashboardDetail | null>(null)
const layout = ref<LayoutItem[]>([])
const charts = ref<ChartConfig[]>([])
const chartInstances = ref<Map<string, echarts.ECharts>>(new Map())
const chartDataCache = ref<Map<string, any[]>>(new Map())

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
      if (res.data.charts) {
        try {
          parsedCharts = typeof res.data.charts === 'string' 
            ? JSON.parse(res.data.charts) 
            : res.data.charts
        } catch (error) {
          console.warn('解析charts失败:', error)
          parsedCharts = []
        }
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
      charts.value = parsedCharts

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
    ElMessage.error('加载仪表盘失败：' + (error.message || '未知错误'))
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
  chartDataCache.value.clear()
}

// 初始化所有图表
const initAllCharts = async () => {
  console.log('开始初始化图表，布局数量:', layout.value.length)
  
  // 并行加载所有图表的数据
  const dataPromises = layout.value.map(async (item) => {
    const chartConfig = item.chartConfig
    if (chartConfig && chartConfig.datasetId) {
      try {
        console.log(`加载数据集 ${chartConfig.datasetId} 的数据`)
        const dataResponse = await previewDatasetData(chartConfig.datasetId)
        console.log(`数据集 ${chartConfig.datasetId} 响应:`, dataResponse)
        
        if (dataResponse.code === 200 && dataResponse.data) {
          // 检查数据格式：支持 data.content 或 data.data 两种格式
          const chartData = dataResponse.data.content || dataResponse.data.data || []
          chartDataCache.value.set(item.i, chartData)
          console.log(`数据集 ${chartConfig.datasetId} 数据缓存成功:`, chartData.length, '条记录')
          console.log(`数据集 ${chartConfig.datasetId} 数据样本:`, chartData.slice(0, 3))
        } else {
          console.warn(`数据集 ${chartConfig.datasetId} 无数据`)
          chartDataCache.value.set(item.i, [])
        }
      } catch (error) {
        console.error(`加载数据集 ${chartConfig.datasetId} 失败:`, error)
        chartDataCache.value.set(item.i, [])
        ElMessage.warning(`数据集 ${chartConfig.datasetId} 加载失败`)
      }
    } else {
      console.log(`图表 ${item.i} 没有配置数据集`)
      chartDataCache.value.set(item.i, [])
    }
  })

  // 等待所有数据加载完成
  await Promise.all(dataPromises)
  console.log('所有数据加载完成，开始初始化图表实例')

  // 初始化所有图表实例
  layout.value.forEach(item => {
    initSingleChart(item)
  })
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
  const option = generateChartOption(item.chartConfig, item.i)
  chartInstance.setOption(option, true)
  
  console.log(`图表 ${item.i} 初始化完成`)
}

// 生成图表配置
const generateChartOption = (config: ChartConfig, itemId: string) => {
  const data = chartDataCache.value.get(itemId) || []
  console.log(`生成图表配置 ${itemId}:`, config)
  console.log(`图表 ${itemId} 原始数据:`, data)
  console.log(`图表 ${itemId} 数据量:`, data.length)
  console.log(`图表 ${itemId} 数据样例:`, data.slice(0, 3))

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

  if (!data || data.length === 0) {
    console.warn(`图表 ${itemId} 没有数据，显示空状态`)
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

  console.log(`图表 ${itemId} 开始生成 ${config.type} 类型配置`)

  // 根据图表类型生成配置
  switch (config.type) {
    case 'line':
    case 'bar':
      return generateLineBarOption(baseOption, config, data)
    case 'pie':
      return generatePieOption(baseOption, config, data)
    case 'table':
      return generateTableOption(baseOption, config, data)
    default:
      return generateLineBarOption(baseOption, config, data)
  }
}

// 生成折线图/柱状图配置
const generateLineBarOption = (baseOption: any, config: ChartConfig, data: any[]) => {
  const xData: string[] = []
  const yData: number[] = []

  // 处理数据 - 优先使用fieldMapping，如果没有则使用原始字段
  const xField = config.fieldMapping?.xField || config.xField
  const yField = config.fieldMapping?.yField || config.yField
  
  console.log(`折线图/柱状图配置 ${config.id}:`, { xField, yField, fieldMapping: config.fieldMapping })

  // 处理数据
  data.forEach(item => {
    if (xField && yField) {
      xData.push(String(item[xField] || ''))
      yData.push(Number(item[yField]) || 0)
    }
  })

  console.log(`图表 ${config.id} 数据处理结果:`, { xData: xData.slice(0, 5), yData: yData.slice(0, 5) })

  return {
    ...baseOption,
    xAxis: {
      type: 'category',
      data: xData,
      axisLabel: {
        rotate: xData.some(x => x.length > 4) ? 45 : 0
      }
    },
    yAxis: {
      type: 'value'
    },
    series: [{
      name: config.title || '数据',
      type: config.type,
      data: yData,
      smooth: config.type === 'line'
    }]
  }
}

// 生成饼图配置
const generatePieOption = (baseOption: any, config: ChartConfig, data: any[]) => {
  const pieData: Array<{ name: string; value: number }> = []

  // 处理数据 - 优先使用fieldMapping，如果没有则使用原始字段
  const nameField = config.fieldMapping?.nameField || config.nameField
  const valueField = config.fieldMapping?.valueField || config.valueField
  
  console.log(`饼图配置 ${config.id}:`, { nameField, valueField, fieldMapping: config.fieldMapping })

  data.forEach(item => {
    if (nameField && valueField) {
      pieData.push({
        name: String(item[nameField] || ''),
        value: Number(item[valueField]) || 0
      })
    }
  })

  console.log(`饼图 ${config.id} 数据处理结果:`, pieData.slice(0, 10))

  return {
    ...baseOption,
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c} ({d}%)'
    },
    series: [{
      name: config.title || '数据',
      type: 'pie',
      radius: ['20%', '60%'],
      center: ['50%', '50%'],
      data: pieData,
      emphasis: {
        itemStyle: {
          shadowBlur: 10,
          shadowOffsetX: 0,
          shadowColor: 'rgba(0, 0, 0, 0.5)'
        }
      }
    }]
  }
}

// 生成表格配置（使用简单的数据展示）
const generateTableOption = (baseOption: any, config: ChartConfig, data: any[]) => {
  // 对于表格类型，我们显示一个简单的文本说明
  return {
    ...baseOption,
    graphic: {
      type: 'text',
      left: 'center',
      top: 'middle',
      style: {
        text: `表格数据 (${data.length} 条记录)`,
        fontSize: 16,
        fill: '#666'
      }
    }
  }
}

// 刷新数据
const handleRefresh = () => {
  ElMessage.info('正在刷新数据...')
  loadDashboard()
}

// 编辑仪表盘
const handleEdit = () => {
  router.push(`/dashboard/designer/${route.params.id}`)
}

// 窗口大小变化处理
const handleResize = () => {
  chartInstances.value.forEach(instance => {
    try {
      instance.resize()
    } catch (error) {
      console.warn('图表resize失败:', error)
    }
  })
}

// 组件挂载时初始化
onMounted(() => {
  console.log('预览页面挂载，开始加载数据')
  loadDashboard()
  window.addEventListener('resize', handleResize)
})

// 组件卸载时清理
onUnmounted(() => {
  console.log('预览页面卸载，清理资源')
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

    <!-- 内容区域 -->
    <div class="preview-content" v-loading="loading" element-loading-text="正在加载仪表盘...">
      <template v-if="!loading">
        <div v-if="layout.length > 0" class="grid-container">
          <grid-layout
            :layout="layout"
            :col-num="12"
            :row-height="30"
            :margin="[10, 10]"
            :is-draggable="false"
            :is-resizable="false"
            :vertical-compact="false"
            :use-css-transforms="true"
          >
            <grid-item
              v-for="item in layout"
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