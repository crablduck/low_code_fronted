<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Refresh, Edit } from '@element-plus/icons-vue'
import { GridLayout, GridItem } from 'vue3-grid-layout-next'
import * as echarts from 'echarts'
import type { DashboardDetail, LayoutItem, DashboardResponse, ChartConfig } from '@/types/dashboard'
import type { DatasetData } from '@/types/dataset'
import { getDashboardDetail } from '@/api/dashboard'
import { getDatasetData } from '@/api/dataset'

const route = useRoute()
const router = useRouter()
const loading = ref(true)
const hasEditPermission = ref(true) // 这里可以根据实际权限控制
const dashboard = ref<DashboardDetail | null>(null)
const layout = ref<LayoutItem[]>([])
const chartInstances = ref<Map<string, echarts.ECharts>>(new Map())

// 加载仪表盘数据
const loadDashboard = async () => {
  try {
    loading.value = true
    const res = await getDashboardDetail(route.params.id as string)
    if (res.code === 200) {
      // 解析布局数据
      const parsedLayout = res.data.layout ? JSON.parse(res.data.layout) : []
      
      // 解析图表配置
      const parsedConfig = res.data.config ? JSON.parse(res.data.config) : { charts: [] }
      
      dashboard.value = {
        ...res.data,
        layout: parsedLayout,
        config: parsedConfig
      }
      layout.value = parsedLayout

      // 清除图表缓存
      chartDataCache.value.clear()
      chartInstances.value.clear()
      
      // 初始化图表
      await initCharts()
    }
  } catch (error) {
    ElMessage.error('加载仪表盘失败：' + error.message)
  } finally {
    loading.value = false
  }
}

// 初始化所有图表
const chartDataCache = ref<Map<string, any[]>>(new Map())

const initCharts = async () => {
  // 首先获取所有需要的数据集数据
  const datasetPromises = layout.value.map(async (item) => {
    const chartConfig = item.chartConfig
    if (chartConfig.datasetId) {
      try {
        const dataResponse = await getDatasetData(chartConfig.datasetId, {
          limit: chartConfig.dataLimit || 100,
          xField: chartConfig.xField,
          yField: chartConfig.yField,
          nameField: chartConfig.nameField,
          valueField: chartConfig.valueField
        })
        if (dataResponse.data) {
          chartDataCache.value.set(item.i, dataResponse.data)
        }
      } catch (error) {
        console.error(`加载数据集 ${chartConfig.datasetId} 失败:`, error)
        ElMessage.error(`加载数据集 ${chartConfig.datasetId} 失败`)
      }
    }
  })

  // 等待所有数据集加载完成
  await Promise.all(datasetPromises)

  // 初始化所有图表
  layout.value.forEach(item => {
    initChartInstance(item)
  })
}

// 初始化单个图表实例
const initChartInstance = (item: LayoutItem) => {
  const container = document.getElementById(`chart-${item.i}`)
  if (!container) return

  let chartInstance = chartInstances.value.get(item.i)
  if (chartInstance) {
    chartInstance.dispose()
  }

  chartInstance = echarts.init(container)
  chartInstances.value.set(item.i, chartInstance)

  const option = getChartOption(item.chartConfig)
  chartInstance.setOption(option)
}

// 获取图表配置
const getChartOption = (config: ChartConfig) => {
  const baseOption = {
    title: {
      text: config.title || '未命名图表',
      left: 'center'
    },
    tooltip: {
      trigger: 'axis'
    },
    legend: {
      show: config.showLegend || false,
      bottom: 0
    },
    grid: {
      top: config.title ? 60 : 30,
      bottom: config.showLegend ? 60 : 30,
      left: '3%',
      right: '4%',
      containLabel: true
    }
  }

  // 从缓存中获取数据
  const rawData = chartDataCache.value.get(config.id)
  
  if (!rawData || rawData.length === 0) {
    return {
      ...baseOption,
      series: [
        {
          name: config.title || '数据',
          type: config.type
        }
      ]
    }
  }

  // 处理数据
  const processedData = rawData.reduce((acc: any, item: any) => {
    if (config.xField && config.yField) {
      acc.xAxis.push(item[config.xField])
      acc.values.push(item[config.yField])
    }
    if (config.nameField && config.valueField) {
      acc.names.push(item[config.nameField])
      acc.values.push(item[config.valueField])
    }
    return acc
  }, { xAxis: [], values: [], names: [] })

  switch (config.type) {
    case 'bar':
    case 'line':
      return {
        ...baseOption,
        xAxis: {
          type: 'category',
          data: processedData.xAxis
        },
        yAxis: {
          type: 'value'
        },
        series: [
          {
            name: config.title || '数据',
            type: config.type,
            data: processedData.values
          }
        ]
      }

    case 'pie':
      return {
        ...baseOption,
        series: [
          {
            name: config.title || '数据',
            type: 'pie',
            radius: '50%',
            data: processedData.names?.map((name, index) => ({
              name,
              value: processedData.values[index]
            })) || [],
            emphasis: {
              itemStyle: {
                shadowBlur: 10,
                shadowOffsetX: 0,
                shadowColor: 'rgba(0, 0, 0, 0.5)'
              }
            }
          }
        ]
      }

    case 'table':
      return {
        ...baseOption,
        dataset: {
          source: rawData
        },
        grid: {
          left: 10,
          right: 10,
          bottom: 10,
          top: 10
        },
        xAxis: { type: 'value' },
        yAxis: { type: 'value' }
      }

    default:
      return {
        ...baseOption,
        series: [
          {
            name: config.title || '数据',
            type: config.type
          }
        ]
      }
  }
}

// 刷新数据
const handleRefresh = () => {
  loadDashboard()
}

// 编辑仪表盘
const handleEdit = () => {
  router.push(`/dashboard/edit/${route.params.id}`)
}

// 窗口大小变化处理
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
  chartInstances.value.forEach(instance => {
    instance.dispose()
  })
  chartInstances.value.clear()
  window.removeEventListener('resize', handleResize)
})
</script>

<template>
  <div class="dashboard-preview">
    <div class="preview-header">
      <div class="header-content">
        <h2>{{ dashboard?.name || '仪表盘预览' }}</h2>
        <p class="description" v-if="dashboard?.description">{{ dashboard.description }}</p>
      </div>
      <div class="header-actions">
        <el-button-group>
          <el-button type="primary" @click="handleRefresh">
            <el-icon><Refresh /></el-icon>
            刷新数据
          </el-button>
          <el-button @click="handleEdit" v-if="hasEditPermission">
            <el-icon><Edit /></el-icon>
            编辑
          </el-button>
        </el-button-group>
      </div>
    </div>

    <div class="preview-content" v-loading="loading">
      <template v-if="layout.length">
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
                <span class="chart-title">{{ item.chartConfig.title || '未命名图表' }}</span>
              </div>
              <div class="chart-content" :id="`chart-${item.i}`"></div>
            </div>
          </grid-item>
        </grid-layout>
      </template>
      <el-empty v-else description="暂无图表数据" />
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
}

.preview-header {
  background: white;
  padding: 20px;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: flex-start;

  .header-content {
    h2 {
      margin: 0;
      font-size: 20px;
      color: #303133;
    }

    .description {
      margin: 8px 0 0;
      color: #606266;
      font-size: 14px;
    }
  }
}

.preview-content {
  flex: 1;
  min-height: 0;
  background: white;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  padding: 20px;
  overflow: auto;
}

.chart-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: white;
  border-radius: 4px;
  overflow: hidden;
}

.chart-header {
  height: 40px;
  padding: 0 16px;
  display: flex;
  align-items: center;
  background: #f5f7fa;
  border-bottom: 1px solid #e4e7ed;

  .chart-title {
    font-size: 14px;
    color: #606266;
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.chart-content {
  flex: 1;
  min-height: 0;
}
</style> 