<template>
  <div class="data-source-config-demo">
    <div class="demo-header">
      <h1>数据源配置组件演示</h1>
      <p>展示数据集选择器和图表数据源配置组件的功能</p>
    </div>

    <el-tabs v-model="activeTab" type="card" class="demo-tabs">
      <!-- 数据集选择器演示 -->
      <el-tab-pane label="数据集选择器" name="dataset-selector">
        <el-card class="demo-card">
          <template #header>
            <h3>DatasetSelector 组件</h3>
          </template>
          
          <div class="demo-content">
            <div class="demo-left">
              <DatasetSelector
                v-model="selectedDataset"
                @change="handleDatasetChange"
                @preview="handleDatasetPreview"
                @edit="handleDatasetEdit"
                @create="handleDatasetCreate"
              />
            </div>
            
            <div class="demo-right">
              <h4>组件状态</h4>
              <el-descriptions :column="1" border>
                <el-descriptions-item label="选中数据集">
                  {{ selectedDataset?.name || '未选择' }}
                </el-descriptions-item>
                <el-descriptions-item label="数据集ID">
                  {{ selectedDataset?.id || '无' }}
                </el-descriptions-item>
                <el-descriptions-item label="查询类型">
                  {{ selectedDataset?.queryType || '无' }}
                </el-descriptions-item>
                <el-descriptions-item label="字段数量">
                  {{ selectedDataset?.fields?.length || 0 }}
                </el-descriptions-item>
              </el-descriptions>
              
              <div class="event-log">
                <h4>事件日志</h4>
                <div class="log-content">
                  <div
                    v-for="(log, index) in eventLogs"
                    :key="index"
                    class="log-item"
                  >
                    <span class="log-time">{{ log.time }}</span>
                    <span class="log-event">{{ log.event }}</span>
                    <span class="log-data">{{ log.data }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </el-card>
      </el-tab-pane>

      <!-- 图表数据源配置演示 -->
      <el-tab-pane label="图表数据源配置" name="chart-config">
        <el-card class="demo-card">
          <template #header>
            <h3>ChartDataSourceConfig 组件</h3>
          </template>
          
          <div class="demo-content">
            <div class="chart-config-demo">
              <div class="config-section">
                <h4>图表类型选择</h4>
                <el-radio-group v-model="chartType" @change="handleChartTypeChange">
                  <el-radio-button value="bar">柱状图</el-radio-button>
                  <el-radio-button value="line">折线图</el-radio-button>
                  <el-radio-button value="pie">饼图</el-radio-button>
                  <el-radio-button value="table">表格</el-radio-button>
                </el-radio-group>
              </div>
              
              <div class="config-component">
                <ChartDataSourceConfig
                  v-model="chartDataSourceConfig"
                  :chart-type="chartType"
                  @change="handleConfigChange"
                  @preview="handleConfigPreview"
                  @save="handleConfigSave"
                />
              </div>
            </div>
          </div>
        </el-card>
      </el-tab-pane>

      <!-- 配置预览 -->
      <el-tab-pane label="配置预览" name="config-preview">
        <el-card class="demo-card">
          <template #header>
            <h3>配置数据预览</h3>
          </template>
          
          <div class="preview-content">
            <el-row :gutter="24">
              <el-col :span="12">
                <h4>数据集选择器配置</h4>
                <el-input
                  v-model="datasetConfigJson"
                  type="textarea"
                  :rows="20"
                  readonly
                  class="config-json"
                />
              </el-col>
              <el-col :span="12">
                <h4>图表数据源配置</h4>
                <el-input
                  v-model="chartConfigJson"
                  type="textarea"
                  :rows="20"
                  readonly
                  class="config-json"
                />
              </el-col>
            </el-row>
          </div>
        </el-card>
      </el-tab-pane>

      <!-- API说明 -->
      <el-tab-pane label="API说明" name="api-docs">
        <el-card class="demo-card">
          <template #header>
            <h3>组件API说明</h3>
          </template>
          
          <div class="api-docs">
            <div class="api-section">
              <h4>DatasetSelector 组件</h4>
              <el-table :data="datasetSelectorAPI" border>
                <el-table-column prop="prop" label="属性" width="150" />
                <el-table-column prop="type" label="类型" width="150" />
                <el-table-column prop="default" label="默认值" width="100" />
                <el-table-column prop="description" label="说明" />
              </el-table>
              
              <h5>事件</h5>
              <el-table :data="datasetSelectorEvents" border>
                <el-table-column prop="event" label="事件名" width="150" />
                <el-table-column prop="params" label="参数" width="200" />
                <el-table-column prop="description" label="说明" />
              </el-table>
            </div>

            <div class="api-section">
              <h4>ChartDataSourceConfig 组件</h4>
              <el-table :data="chartConfigAPI" border>
                <el-table-column prop="prop" label="属性" width="150" />
                <el-table-column prop="type" label="类型" width="150" />
                <el-table-column prop="default" label="默认值" width="100" />
                <el-table-column prop="description" label="说明" />
              </el-table>
              
              <h5>事件</h5>
              <el-table :data="chartConfigEvents" border>
                <el-table-column prop="event" label="事件名" width="150" />
                <el-table-column prop="params" label="参数" width="200" />
                <el-table-column prop="description" label="说明" />
              </el-table>
            </div>
          </div>
        </el-card>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import DatasetSelector from '@/components/dataset/DatasetSelector.vue'
import ChartDataSourceConfig from '@/components/chart/ChartDataSourceConfig.vue'
import type { DataSet } from '@/types/dataManagement'
import type { ChartDataSourceConfig as ChartConfig } from '@/types/dashboard'

// 响应式数据
const activeTab = ref('dataset-selector')
const selectedDataset = ref<DataSet | null>(null)
const chartType = ref('bar')
const chartDataSourceConfig = ref<ChartConfig>({
  dimensions: [],
  metrics: [],
  filters: [],
  advanced: {
    autoRefresh: false,
    refreshInterval: 300,
    enableCache: true,
    cacheTime: 1800,
    dataLimit: 1000,
    sortField: '',
    sortOrder: 'asc'
  }
})

// 事件日志
const eventLogs = ref<Array<{
  time: string
  event: string
  data: string
}>>([])

// 计算属性
const datasetConfigJson = computed(() => {
  return JSON.stringify(selectedDataset.value, null, 2)
})

const chartConfigJson = computed(() => {
  return JSON.stringify(chartDataSourceConfig.value, null, 2)
})

// API文档数据
const datasetSelectorAPI = [
  {
    prop: 'modelValue',
    type: 'DataSet | null',
    default: 'null',
    description: '当前选中的数据集'
  },
  {
    prop: 'multiple',
    type: 'boolean',
    default: 'false',
    description: '是否支持多选'
  },
  {
    prop: 'showPreview',
    type: 'boolean',
    default: 'true',
    description: '是否显示预览功能'
  },
  {
    prop: 'showCreate',
    type: 'boolean',
    default: 'true',
    description: '是否显示创建按钮'
  }
]

const datasetSelectorEvents = [
  {
    event: 'update:modelValue',
    params: 'value: DataSet | null',
    description: '选中数据集变化时触发'
  },
  {
    event: 'change',
    params: 'value: DataSet | null',
    description: '数据集选择变化时触发'
  },
  {
    event: 'preview',
    params: 'dataset: DataSet',
    description: '预览数据集时触发'
  },
  {
    event: 'edit',
    params: 'dataset: DataSet',
    description: '编辑数据集时触发'
  },
  {
    event: 'create',
    params: '无',
    description: '创建数据集时触发'
  }
]

const chartConfigAPI = [
  {
    prop: 'modelValue',
    type: 'ChartDataSourceConfig',
    default: '{}',
    description: '图表数据源配置'
  },
  {
    prop: 'chartType',
    type: 'string',
    default: 'bar',
    description: '图表类型'
  }
]

const chartConfigEvents = [
  {
    event: 'update:modelValue',
    params: 'config: ChartDataSourceConfig',
    description: '配置变化时触发'
  },
  {
    event: 'change',
    params: 'config: ChartDataSourceConfig',
    description: '配置更改时触发'
  },
  {
    event: 'preview',
    params: 'config: ChartDataSourceConfig',
    description: '预览图表时触发'
  },
  {
    event: 'save',
    params: 'config: ChartDataSourceConfig',
    description: '保存配置时触发'
  }
]

// 方法
const addEventLog = (event: string, data?: any) => {
  const now = new Date()
  eventLogs.value.unshift({
    time: now.toLocaleTimeString(),
    event,
    data: data ? JSON.stringify(data, null, 2) : ''
  })
  
  // 只保留最近10条日志
  if (eventLogs.value.length > 10) {
    eventLogs.value.pop()
  }
}

const handleDatasetChange = (dataset: DataSet | null) => {
  addEventLog('数据集选择变化', { id: dataset?.id, name: dataset?.name })
  ElMessage.success(`已选择数据集: ${dataset?.name || '无'}`)
}

const handleDatasetPreview = (dataset: DataSet) => {
  addEventLog('预览数据集', { id: dataset.id, name: dataset.name })
  ElMessage.info(`预览数据集: ${dataset.name}`)
}

const handleDatasetEdit = (dataset: DataSet) => {
  addEventLog('编辑数据集', { id: dataset.id, name: dataset.name })
  ElMessage.info(`编辑数据集: ${dataset.name}`)
}

const handleDatasetCreate = () => {
  addEventLog('创建数据集', {})
  ElMessage.info('创建新数据集')
}

const handleChartTypeChange = (type: string) => {
  addEventLog('图表类型变化', { type })
  chartDataSourceConfig.value = {
    dimensions: [],
    metrics: [],
    filters: [],
    advanced: {
      autoRefresh: false,
      refreshInterval: 300,
      enableCache: true,
      cacheTime: 1800,
      dataLimit: 1000,
      sortField: '',
      sortOrder: 'asc'
    }
  }
}

const handleConfigChange = (config: ChartConfig) => {
  addEventLog('配置变化', {
    dimensions: config.dimensions.length,
    metrics: config.metrics.length,
    filters: config.filters.length
  })
}

const handleConfigPreview = (config: ChartConfig) => {
  addEventLog('预览图表配置', config)
  ElMessage.info('预览图表配置')
}

const handleConfigSave = (config: ChartConfig) => {
  addEventLog('保存图表配置', config)
  ElMessage.success('图表配置已保存')
}

// 生命周期
onMounted(() => {
  addEventLog('组件初始化', {})
})
</script>

<style scoped>
.data-source-config-demo {
  padding: 24px;
  background: #f5f7fa;
  min-height: 100vh;
}

.demo-header {
  text-align: center;
  margin-bottom: 24px;
  padding: 24px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.demo-header h1 {
  margin: 0 0 8px 0;
  color: #303133;
  font-size: 28px;
}

.demo-header p {
  margin: 0;
  color: #606266;
  font-size: 16px;
}

.demo-tabs {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.demo-card {
  border: none;
  box-shadow: none;
}

.demo-content {
  display: flex;
  gap: 24px;
  min-height: 600px;
}

.demo-left {
  flex: 2;
}

.demo-right {
  flex: 1;
  border-left: 1px solid #ebeef5;
  padding-left: 24px;
}

.event-log {
  margin-top: 24px;
}

.event-log h4 {
  margin: 0 0 16px 0;
  color: #303133;
}

.log-content {
  max-height: 300px;
  overflow-y: auto;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  padding: 12px;
  background: #fafafa;
}

.log-item {
  display: block;
  margin-bottom: 8px;
  padding: 8px;
  background: white;
  border-radius: 4px;
  font-size: 12px;
  border-left: 3px solid #409eff;
}

.log-time {
  color: #909399;
  margin-right: 8px;
}

.log-event {
  color: #409eff;
  font-weight: 500;
  margin-right: 8px;
}

.log-data {
  color: #606266;
}

.chart-config-demo {
  width: 100%;
}

.config-section {
  margin-bottom: 24px;
  padding: 16px;
  background: #f9f9f9;
  border-radius: 8px;
}

.config-section h4 {
  margin: 0 0 16px 0;
  color: #303133;
}

.config-component {
  min-height: 600px;
}

.preview-content {
  padding: 16px;
}

.preview-content h4 {
  margin: 0 0 16px 0;
  color: #303133;
}

.config-json {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 12px;
}

.api-docs {
  padding: 16px;
}

.api-section {
  margin-bottom: 32px;
}

.api-section h4 {
  margin: 0 0 16px 0;
  color: #303133;
  font-size: 18px;
}

.api-section h5 {
  margin: 24px 0 16px 0;
  color: #606266;
  font-size: 16px;
}
</style> 