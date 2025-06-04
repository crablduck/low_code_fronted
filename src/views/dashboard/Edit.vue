<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import type { DashboardForm, DashboardDetail, LayoutItem, ChartConfig } from '@/types/dashboard'
import { DashboardStatus, DashboardType } from '@/types/dashboard'
import { getDashboardDetail, createDashboard, updateDashboard } from '@/api/dashboard'

import * as echarts from 'echarts'

const route = useRoute()
const router = useRouter()
const isEdit = ref(!!route.params.id)

// 表单数据
const form = ref<DashboardForm>({
  name: '',
  description: '',
  layout: '',
  status: DashboardStatus.DRAFT,
  type: DashboardType.CUSTOM,
  menuId: ''
})

// 图表相关数据
const layout = ref<LayoutItem[]>([])
const chartInstances = ref<Map<string, echarts.ECharts>>(new Map())
const chartDataCache = ref<Map<string, any[]>>(new Map())

const loading = ref(false)

// 获取详情
const fetchDetail = async () => {
  try {
    loading.value = true
    const res = await getDashboardDetail(route.params.id as string)
    
    // 解析布局数据
    if (res.data.layout) {
      try {
        layout.value = typeof res.data.layout === 'string' 
          ? JSON.parse(res.data.layout) as LayoutItem[]
          : []
      } catch (e) {
        console.error('解析布局数据失败:', e)
        ElMessage.error('仪表盘布局数据格式错误')
        return
      }
    }

    // 解析图表配置
    if (res.data.config && typeof res.data.config === 'string') {
      try {
        const configData = JSON.parse(res.data.config)
        // 更新图表配置
        layout.value.forEach(item => {
          const chartConfig = configData.charts.find(c => c.id === item.i)
          if (chartConfig) {
            item.chartConfig = {
              ...chartConfig.config,
              datasetId: chartConfig.datasetId
            }
          }
        })
      } catch (e) {
        console.error('解析图表配置失败:', e)
        ElMessage.error('仪表盘配置数据格式错误')
      }
    }

    form.value = {
      name: res.data.name,
      description: res.data.description,
      layout: res.data.layout,
      status: res.data.status,
      type: res.data.type,
      menuId: res.data.menuId || ''
    }
    
    // 初始化图表
    await initCharts()
  } catch (error: any) {
    ElMessage.error('获取详情失败：' + error.message)
  } finally {
    loading.value = false
  }
}

// 保存
const handleSave = async () => {
  try {
    loading.value = true
    if (isEdit.value) {
      await updateDashboard(Number(route.params.id), form.value)
      ElMessage.success('更新成功')
    } else {
      await createDashboard(form.value)
      ElMessage.success('创建成功')
    }
    router.push('/dashboard/list')
  } catch (error: any) {
    ElMessage.error((isEdit.value ? '更新' : '创建') + '失败：' + error.message)
  } finally {
    loading.value = false
  }
}

// 返回列表
const handleBack = () => {
  router.push('/dashboard/list')
}

// 打开设计器
const openDesigner = () => {
  if (!isEdit.value) {
    ElMessage.warning('请先保存基本信息')
    return
  }
  
  // 直接进入设计器
  router.push(`/dashboard/designer/${route.params.id}`)
}

// 初始化所有图表
const initCharts = async () => {
  // 清除图表缓存
  chartDataCache.value.clear()
  chartInstances.value.clear()

  // 初始化所有图表实例
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

  const chartConfig = item.chartConfig as ChartConfig
  const option = getChartOption(chartConfig)
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
  const processedChart = chartData.reduce((acc: any, item: any) => {
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
          data: processedChart.xAxis
        },
        yAxis: {
          type: 'value'
        },
        series: [
          {
            name: config.title || '数据',
            type: config.type,
            data: processedChart.values
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
            data: processedChart.names?.map((name, index) => ({
              name,
              value: processedChart.values[index]
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
          source: chartData
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

// 预览仪表盘
const previewDashboard = async () => {
  try {
    // 保存当前编辑内容
    await handleSave()
    // 重新加载仪表盘数据以确保最新配置
    await fetchDetail()
    // 打开预览页面
    window.open(`/dashboard/preview/${route.params.id}`, '_blank')
  } catch (error: any) {
    ElMessage.error('预览失败：' + error.message)
  }
}

onMounted(() => {
  if (isEdit.value) {
    fetchDetail()
  }
})
</script>

<template>
  <div class="dashboard-container" v-loading="loading">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>{{ isEdit ? '编辑' : '新建' }}仪表盘</span>
        </div>
      </template>

      <el-form
        ref="formRef"
        :model="form"
        label-width="100px"
        class="dashboard-form"
      >
        <el-form-item label="名称" required>
          <el-input v-model="form.name" placeholder="请输入仪表盘名称" />
        </el-form-item>

        <el-form-item label="描述">
          <el-input
            v-model="form.description"
            type="textarea"
            placeholder="请输入仪表盘描述"
          />
        </el-form-item>

        <el-form-item label="分类" required>
          <el-select v-model="form.category" placeholder="请选择分类">
            <el-option label="业务分析" value="business" />
            <el-option label="运营分析" value="operation" />
            <el-option label="系统监控" value="monitor" />
          </el-select>
        </el-form-item>

        <el-form-item label="布局配置">
          <div class="layout-container">
            <div class="designer-actions">
              <el-button type="primary" @click="openDesigner">
                打开设计器
              </el-button>
              <el-button v-if="form.config_json?.layout?.length" type="success" @click="previewDashboard">
                预览
              </el-button>
            </div>
            <div v-if="form.config_json?.layout?.length" class="layout-preview">
              <!-- 这里可以展示简单的布局预览 -->
              <el-descriptions :column="1" border>
                <el-descriptions-item label="布局信息">
                  已配置 {{ form.config_json.layout.length }} 个组件
                </el-descriptions-item>
                <el-descriptions-item label="最后修改">
                  {{ new Date().toLocaleString() }}
                </el-descriptions-item>
              </el-descriptions>
            </div>
            <el-empty v-else description="未配置布局，请使用设计器进行配置" />
          </div>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="handleSave">保存</el-button>
          <el-button @click="handleBack">返回</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<style scoped>
.dashboard-container {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.dashboard-form {
  max-width: 800px;
  margin: 0 auto;
}

.layout-container {
  border: 1px dashed #dcdfe6;
  border-radius: 4px;
  min-height: 400px;
  padding: 20px;
  background-color: #f5f7fa;
}

.designer-actions {
  margin-bottom: 20px;
  display: flex;
  gap: 10px;
}

.layout-preview {
  background: #fff;
  padding: 20px;
  border-radius: 4px;
}
</style> 