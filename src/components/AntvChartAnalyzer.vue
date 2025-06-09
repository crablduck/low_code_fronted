<template>
  <div class="antv-chart-analyzer">
    <!-- 顶部工具栏 -->
    <div class="analyzer-header">
      <div class="header-left">
        <h3>🏥 医疗数据专业分析平台</h3>
        <span class="subtitle">基于 AntV 的企业级数据可视化</span>
      </div>
      <div class="header-right">
        <el-button-group>
          <el-button @click="exportData" type="primary">
            <el-icon><Download /></el-icon>
            导出数据
          </el-button>
          <el-button @click="toggleFullscreen">
            <el-icon><FullScreen /></el-icon>
            全屏分析
          </el-button>
          <el-button @click="refreshAnalysis">
            <el-icon><Refresh /></el-icon>
            刷新
          </el-button>
        </el-button-group>
      </div>
    </div>

    <!-- 主要内容区域 -->
    <div class="analyzer-content">
      <!-- 左侧数据配置面板 -->
      <div class="left-panel">
        <div class="panel-section">
          <h4>📊 数据源配置</h4>
          <el-select v-model="selectedDataset" @change="onDatasetChange" placeholder="选择数据集">
            <el-option
              v-for="dataset in datasets"
              :key="dataset.id"
              :label="dataset.name"
              :value="dataset.id"
            />
          </el-select>
        </div>

        <div class="panel-section">
          <h4>📈 图表类型</h4>
          <div class="chart-types">
            <div
              v-for="type in chartTypes"
              :key="type.value"
              class="chart-type-card"
              :class="{ active: selectedChartType === type.value }"
              @click="selectChartType(type.value)"
            >
              <div class="type-icon">{{ type.icon }}</div>
              <div class="type-name">{{ type.name }}</div>
              <div class="type-desc">{{ type.description }}</div>
            </div>
          </div>
        </div>

        <div class="panel-section">
          <h4>🎯 字段配置</h4>
          <div class="field-config">
            <div class="field-group" v-if="selectedChartType !== 'table'">
              <label>X轴字段</label>
              <el-select v-model="chartConfig.xField" placeholder="选择维度字段">
                <el-option
                  v-for="field in dimensionFields"
                  :key="field.fieldName"
                  :label="field.displayName"
                  :value="field.fieldName"
                />
              </el-select>
            </div>
            <div class="field-group" v-if="selectedChartType !== 'table'">
              <label>Y轴字段</label>
              <el-select v-model="chartConfig.yField" placeholder="选择指标字段">
                <el-option
                  v-for="field in metricFields"
                  :key="field.fieldName"
                  :label="field.displayName"
                  :value="field.fieldName"
                />
              </el-select>
            </div>
            <div class="field-group" v-if="selectedChartType === 'table'">
              <label>显示字段</label>
              <el-checkbox-group v-model="chartConfig.tableFields">
                <el-checkbox
                  v-for="field in allFields"
                  :key="field.fieldName"
                  :label="field.fieldName"
                >
                  {{ field.displayName }}
                </el-checkbox>
              </el-checkbox-group>
            </div>
          </div>
        </div>

        <div class="panel-section">
          <h4>🎨 样式配置</h4>
          <div class="style-config">
            <el-form label-width="80px" size="small">
              <el-form-item label="图表标题">
                <el-input v-model="chartConfig.title" placeholder="输入图表标题" />
              </el-form-item>
              <el-form-item label="主题色彩">
                <el-select v-model="chartConfig.theme">
                  <el-option label="医疗蓝" value="medical-blue" />
                  <el-option label="科技绿" value="tech-green" />
                  <el-option label="温馨橙" value="warm-orange" />
                  <el-option label="专业灰" value="professional-gray" />
                </el-select>
              </el-form-item>
              <el-form-item label="显示图例">
                <el-switch v-model="chartConfig.showLegend" />
              </el-form-item>
              <el-form-item label="数据标签">
                <el-switch v-model="chartConfig.showLabels" />
              </el-form-item>
            </el-form>
          </div>
        </div>
      </div>

      <!-- 右侧图表显示区域 -->
      <div class="right-panel">
        <!-- 统计概览卡片 -->
        <div class="stats-overview">
          <div class="stat-card">
            <div class="stat-icon">📊</div>
            <div class="stat-content">
              <div class="stat-number">{{ dataStats.totalRecords }}</div>
              <div class="stat-label">总记录数</div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">📈</div>
            <div class="stat-content">
              <div class="stat-number">{{ dataStats.fieldCount }}</div>
              <div class="stat-label">字段数量</div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">🎯</div>
            <div class="stat-content">
              <div class="stat-number">{{ dataStats.metricCount }}</div>
              <div class="stat-label">指标字段</div>
            </div>
          </div>
        </div>

        <!-- 主图表区域 -->
        <div class="main-chart-area">
          <div class="chart-header">
            <h4>{{ chartConfig.title || '数据分析图表' }}</h4>
            <div class="chart-actions">
              <el-button size="small" @click="saveChart">
                <el-icon><DocumentAdd /></el-icon>
                保存图表
              </el-button>
              <el-button size="small" @click="exportChart">
                <el-icon><Picture /></el-icon>
                导出图片
              </el-button>
            </div>
          </div>
          
          <!-- G2 图表容器 -->
          <div
            v-show="selectedChartType !== 'table' && selectedChartType !== 'pivot'"
            ref="g2ChartRef"
            class="g2-chart-container"
          ></div>

          <!-- S2 表格分析容器 -->
          <div
            v-show="selectedChartType === 'table' || selectedChartType === 'pivot'"
            ref="s2TableRef"
            class="s2-table-container"
          ></div>

          <!-- 数据为空的提示 -->
          <div v-show="!currentData.length" class="empty-data">
            <el-empty description="暂无数据，请选择数据源和配置字段">
              <el-button type="primary" @click="loadSampleData">加载示例数据</el-button>
            </el-empty>
          </div>
        </div>

        <!-- 数据洞察面板 -->
        <div class="insights-panel">
          <h4>🔍 数据洞察</h4>
          <div class="insight-list">
            <div v-for="insight in dataInsights" :key="insight.id" class="insight-item">
              <div class="insight-icon">{{ insight.icon }}</div>
              <div class="insight-content">
                <div class="insight-title">{{ insight.title }}</div>
                <div class="insight-desc">{{ insight.description }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Download, FullScreen, Refresh, DocumentAdd, Picture } from '@element-plus/icons-vue'

// 引入 AntV 库
import { Chart } from '@antv/g2'
import { TableSheet } from '@antv/s2'

// 类型定义
interface DatasetInfo {
  id: number
  name: string
  fields: FieldInfo[]
}

interface FieldInfo {
  fieldName: string
  displayName: string
  fieldType: 'dimension' | 'metric'
  description?: string
}

interface ChartConfig {
  title: string
  xField: string
  yField: string
  tableFields: string[]
  theme: string
  showLegend: boolean
  showLabels: boolean
}

interface DataInsight {
  id: string
  icon: string
  title: string
  description: string
}

// 响应式数据
const selectedDataset = ref<number | null>(null)
const selectedChartType = ref('column')
const currentData = ref<any[]>([])
const g2ChartRef = ref<HTMLDivElement>()
const s2TableRef = ref<HTMLDivElement>()

let g2Chart: Chart | null = null
let s2Table: TableSheet | null = null

// 图表配置
const chartConfig = ref<ChartConfig>({
  title: '医疗数据分析',
  xField: '',
  yField: '',
  tableFields: [],
  theme: 'medical-blue',
  showLegend: true,
  showLabels: true
})

// 图表类型配置
const chartTypes = [
  { value: 'column', name: '柱状图', icon: '📊', description: '适合对比分析' },
  { value: 'line', name: '折线图', icon: '📈', description: '适合趋势分析' },
  { value: 'pie', name: '饼图', icon: '🥧', description: '适合占比分析' },
  { value: 'area', name: '面积图', icon: '📊', description: '适合堆叠分析' },
  { value: 'scatter', name: '散点图', icon: '⚫', description: '适合相关性分析' },
  { value: 'heatmap', name: '热力图', icon: '🔥', description: '适合密度分析' },
  { value: 'table', name: '数据表格', icon: '📋', description: '详细数据展示' },
  { value: 'pivot', name: '透视表', icon: '🔀', description: '多维数据分析' }
]

// 医疗示例数据集
const datasets = ref<DatasetInfo[]>([
  {
    id: 1,
    name: '患者统计数据',
    fields: [
      { fieldName: 'department', displayName: '科室', fieldType: 'dimension' },
      { fieldName: 'month', displayName: '月份', fieldType: 'dimension' },
      { fieldName: 'patientCount', displayName: '患者数量', fieldType: 'metric' },
      { fieldName: 'revenue', displayName: '收入(万元)', fieldType: 'metric' },
      { fieldName: 'satisfaction', displayName: '满意度', fieldType: 'metric' }
    ]
  },
  {
    id: 2,
    name: '疾病分析数据',
    fields: [
      { fieldName: 'disease', displayName: '疾病类型', fieldType: 'dimension' },
      { fieldName: 'ageGroup', displayName: '年龄段', fieldType: 'dimension' },
      { fieldName: 'caseCount', displayName: '病例数', fieldType: 'metric' },
      { fieldName: 'treatmentCost', displayName: '治疗费用', fieldType: 'metric' },
      { fieldName: 'recoveryRate', displayName: '康复率', fieldType: 'metric' }
    ]
  }
])

// 计算属性
const currentDataset = computed(() => 
  datasets.value.find(d => d.id === selectedDataset.value)
)

const dimensionFields = computed(() =>
  currentDataset.value?.fields.filter(f => f.fieldType === 'dimension') || []
)

const metricFields = computed(() =>
  currentDataset.value?.fields.filter(f => f.fieldType === 'metric') || []
)

const allFields = computed(() =>
  currentDataset.value?.fields || []
)

const dataStats = computed(() => ({
  totalRecords: currentData.value.length,
  fieldCount: allFields.value.length,
  metricCount: metricFields.value.length
}))

// 数据洞察
const dataInsights = ref<DataInsight[]>([
  {
    id: 'trend',
    icon: '📈',
    title: '增长趋势',
    description: '患者数量呈稳定增长趋势，月增长率约12%'
  },
  {
    id: 'department',
    icon: '🏥',
    title: '科室分析',
    description: '心内科和骨科是主要收入来源，占总收入65%'
  },
  {
    id: 'satisfaction',
    icon: '😊',
    title: '满意度评估',
    description: '整体满意度4.6分，其中妇产科满意度最高'
  }
])

// 主题色彩配置
const themeColors = {
  'medical-blue': ['#1890ff', '#36cfc9', '#52c41a', '#faad14', '#f5222d'],
  'tech-green': ['#52c41a', '#13c2c2', '#1890ff', '#722ed1', '#eb2f96'],
  'warm-orange': ['#fa8c16', '#faad14', '#fadb14', '#a0d911', '#52c41a'],
  'professional-gray': ['#595959', '#8c8c8c', '#bfbfbf', '#d9d9d9', '#f0f0f0']
}

// 方法定义
const selectChartType = (type: string) => {
  selectedChartType.value = type
  nextTick(() => {
    renderChart()
  })
}

const onDatasetChange = (datasetId: number) => {
  const dataset = datasets.value.find(d => d.id === datasetId)
  if (dataset) {
    loadMockData(datasetId)
    // 自动设置默认字段
    if (dimensionFields.value.length > 0) {
      chartConfig.value.xField = dimensionFields.value[0].fieldName
    }
    if (metricFields.value.length > 0) {
      chartConfig.value.yField = metricFields.value[0].fieldName
    }
    chartConfig.value.tableFields = allFields.value.map(f => f.fieldName)
    
    nextTick(() => {
      renderChart()
    })
  }
}

const loadMockData = (datasetId: number) => {
  // 根据数据集ID加载不同的模拟数据
  if (datasetId === 1) {
    currentData.value = [
      { department: '心内科', month: '1月', patientCount: 120, revenue: 45.2, satisfaction: 4.5 },
      { department: '骨科', month: '1月', patientCount: 98, revenue: 52.8, satisfaction: 4.2 },
      { department: '妇产科', month: '1月', patientCount: 156, revenue: 38.6, satisfaction: 4.8 },
      { department: '儿科', month: '1月', patientCount: 203, revenue: 42.1, satisfaction: 4.6 },
      { department: '神经内科', month: '1月', patientCount: 87, revenue: 35.4, satisfaction: 4.4 },
      { department: '心内科', month: '2月', patientCount: 135, revenue: 48.9, satisfaction: 4.6 },
      { department: '骨科', month: '2月', patientCount: 112, revenue: 58.2, satisfaction: 4.3 },
      { department: '妇产科', month: '2月', patientCount: 168, revenue: 41.8, satisfaction: 4.9 },
    ]
  } else if (datasetId === 2) {
    currentData.value = [
      { disease: '高血压', ageGroup: '40-60岁', caseCount: 156, treatmentCost: 3200, recoveryRate: 85 },
      { disease: '糖尿病', ageGroup: '50-70岁', caseCount: 143, treatmentCost: 4500, recoveryRate: 78 },
      { disease: '骨折', ageGroup: '20-40岁', caseCount: 89, treatmentCost: 8900, recoveryRate: 92 },
      { disease: '心脏病', ageGroup: '60-80岁', caseCount: 67, treatmentCost: 12500, recoveryRate: 72 },
      { disease: '肺炎', ageGroup: '0-20岁', caseCount: 234, treatmentCost: 2100, recoveryRate: 95 },
    ]
  }
}

const renderChart = () => {
  if (!currentData.value.length || !chartConfig.value.xField || !chartConfig.value.yField) {
    return
  }

  if (selectedChartType.value === 'table' || selectedChartType.value === 'pivot') {
    renderS2Table()
  } else {
    renderG2Chart()
  }
}

const renderG2Chart = () => {
  if (!g2ChartRef.value) return

  // 清理之前的图表
  if (g2Chart) {
    g2Chart.destroy()
  }

  // 创建新的图表
  g2Chart = new Chart({
    container: g2ChartRef.value,
    autoFit: true,
  })

  // 设置主题色彩
  g2Chart.theme({
    defaultColor: themeColors[chartConfig.value.theme][0],
    colors10: themeColors[chartConfig.value.theme]
  })

  g2Chart.data(currentData.value)

  // 根据图表类型配置
  switch (selectedChartType.value) {
    case 'column':
      g2Chart
        .interval()
        .encode('x', chartConfig.value.xField)
        .encode('y', chartConfig.value.yField)
        .encode('color', chartConfig.value.xField)
      break
    
    case 'line':
      g2Chart
        .line()
        .encode('x', chartConfig.value.xField)
        .encode('y', chartConfig.value.yField)
        .encode('color', () => chartConfig.value.title)
        .style('stroke', themeColors[chartConfig.value.theme][0])
        .style('lineWidth', 3)
      
      g2Chart
        .point()
        .encode('x', chartConfig.value.xField)
        .encode('y', chartConfig.value.yField)
        .style('fill', themeColors[chartConfig.value.theme][0])
        .style('r', 4)
      break
    
    case 'pie':
      g2Chart
        .coordinate({ type: 'theta', outerRadius: 0.8 })
      
      g2Chart
        .interval()
        .transform({ type: 'stackY' })
        .encode('y', chartConfig.value.yField)
        .encode('color', chartConfig.value.xField)
        .legend('color', { position: 'right' })
      break
    
    case 'area':
      g2Chart
        .area()
        .encode('x', chartConfig.value.xField)
        .encode('y', chartConfig.value.yField)
        .encode('color', () => chartConfig.value.title)
        .style('fill', `l(270) 0:${themeColors[chartConfig.value.theme][0]}40 1:${themeColors[chartConfig.value.theme][0]}`)
      break
    
    case 'scatter':
      g2Chart
        .point()
        .encode('x', chartConfig.value.xField)
        .encode('y', chartConfig.value.yField)
        .encode('color', chartConfig.value.xField)
        .encode('size', 10)
      break
  }

  // 通用配置
  if (chartConfig.value.showLabels) {
    g2Chart.interaction('tooltip', {
      shared: true,
      title: chartConfig.value.title
    })
  }

  g2Chart.render()
}

const renderS2Table = () => {
  if (!s2TableRef.value) return

  // 清理之前的表格
  if (s2Table) {
    s2Table.destroy()
  }

  const s2DataConfig = {
    data: currentData.value,
    fields: {
      columns: chartConfig.value.tableFields.length > 0 
        ? chartConfig.value.tableFields 
        : allFields.value.map(f => f.fieldName)
    }
  }

  const s2Options = {
    width: s2TableRef.value.clientWidth,
    height: 400
  }

  s2Table = new TableSheet(s2TableRef.value, s2DataConfig, s2Options)
  s2Table.render()
}

const exportChart = () => {
  if (selectedChartType.value === 'table' || selectedChartType.value === 'pivot') {
    ElMessage.info('表格数据导出功能开发中...')
  } else if (g2Chart) {
    // 简化导出逻辑
    try {
      // 创建导出按钮触发下载
      const canvas = document.querySelector('canvas')
      if (canvas) {
        canvas.toBlob((blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.download = 'chart.png'
            link.href = url
            link.click()
            URL.revokeObjectURL(url)
          }
        })
      }
      ElMessage.success('图表已导出为图片')
    } catch (error) {
      ElMessage.error('导出失败，请稍后再试')
    }
  }
}

const saveChart = () => {
  const chartData = {
    type: selectedChartType.value,
    config: chartConfig.value,
    data: currentData.value,
    timestamp: new Date().toISOString()
  }
  
  localStorage.setItem(`chart_${Date.now()}`, JSON.stringify(chartData))
  ElMessage.success('图表配置已保存到本地')
}

const exportData = () => {
  const csvContent = [
    allFields.value.map(f => f.displayName).join(','),
    ...currentData.value.map(row => 
      allFields.value.map(f => row[f.fieldName]).join(',')
    )
  ].join('\n')
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `医疗数据_${new Date().toISOString().split('T')[0]}.csv`
  link.click()
  ElMessage.success('数据已导出为CSV文件')
}

const loadSampleData = () => {
  if (datasets.value.length > 0) {
    selectedDataset.value = datasets.value[0].id
    onDatasetChange(datasets.value[0].id)
  }
}

const refreshAnalysis = () => {
  if (selectedDataset.value) {
    onDatasetChange(selectedDataset.value)
    ElMessage.success('数据已刷新')
  }
}

const toggleFullscreen = () => {
  ElMessage.info('全屏功能开发中...')
}

// 监听配置变化
watch([() => chartConfig.value.xField, () => chartConfig.value.yField, () => chartConfig.value.theme], () => {
  if (currentData.value.length > 0) {
    nextTick(() => {
      renderChart()
    })
  }
})

// 组件挂载
onMounted(() => {
  // 自动加载示例数据
  loadSampleData()
})

// 组件卸载
onUnmounted(() => {
  if (g2Chart) {
    g2Chart.destroy()
  }
  if (s2Table) {
    s2Table.destroy()
  }
})
</script>

<style scoped lang="scss">
.antv-chart-analyzer {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f5f7fa;
  overflow: hidden;
}

.analyzer-header {
  height: 80px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  
  .header-left {
    h3 {
      margin: 0;
      font-size: 24px;
      font-weight: 600;
    }
    
    .subtitle {
      font-size: 14px;
      opacity: 0.9;
      margin-top: 4px;
      display: block;
    }
  }
  
  .header-right {
    :deep(.el-button) {
      background: rgba(255, 255, 255, 0.2);
      border: 1px solid rgba(255, 255, 255, 0.3);
      color: white;
      
      &:hover {
        background: rgba(255, 255, 255, 0.3);
      }
    }
  }
}

.analyzer-content {
  flex: 1;
  display: flex;
  gap: 24px;
  padding: 24px;
  min-height: 0;
}

.left-panel {
  width: 320px;
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  overflow-y: auto;
  
  .panel-section {
    margin-bottom: 24px;
    
    h4 {
      margin: 0 0 16px 0;
      font-size: 16px;
      font-weight: 600;
      color: #2c3e50;
      display: flex;
      align-items: center;
      gap: 8px;
    }
  }
}

.chart-types {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.chart-type-card {
  padding: 16px 12px;
  border: 2px solid #e1e8ed;
  border-radius: 8px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  background: white;
  
  &:hover {
    border-color: #409eff;
    background: linear-gradient(135deg, #f0f9ff 0%, #e1f0ff 100%);
    transform: translateY(-2px);
    box-shadow: 0 8px 16px rgba(64, 158, 255, 0.1);
  }
  
  &.active {
    border-color: #409eff;
    background: linear-gradient(135deg, #409eff 0%, #337ecc 100%);
    color: white;
    box-shadow: 0 4px 16px rgba(64, 158, 255, 0.3);
  }
  
  .type-icon {
    font-size: 24px;
    margin-bottom: 8px;
  }
  
  .type-name {
    font-weight: 600;
    margin-bottom: 4px;
  }
  
  .type-desc {
    font-size: 12px;
    opacity: 0.8;
  }
}

.field-config {
  .field-group {
    margin-bottom: 16px;
    
    label {
      display: block;
      margin-bottom: 8px;
      font-weight: 500;
      color: #606266;
    }
    
    :deep(.el-select) {
      width: 100%;
    }
  }
  
  :deep(.el-checkbox-group) {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
}

.style-config {
  :deep(.el-form) {
    .el-form-item {
      margin-bottom: 16px;
    }
    
    .el-input,
    .el-select {
      width: 100%;
    }
  }
}

.right-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 20px;
  min-height: 0;
}

.stats-overview {
  display: flex;
  gap: 16px;
  
  .stat-card {
    flex: 1;
    background: white;
    border-radius: 12px;
    padding: 20px;
    display: flex;
    align-items: center;
    gap: 16px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
    
    .stat-icon {
      font-size: 32px;
      width: 60px;
      height: 60px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #409eff 0%, #337ecc 100%);
      border-radius: 12px;
      color: white;
    }
    
    .stat-content {
      flex: 1;
      
      .stat-number {
        font-size: 28px;
        font-weight: 700;
        color: #2c3e50;
        line-height: 1;
      }
      
      .stat-label {
        font-size: 14px;
        color: #7f8c8d;
        margin-top: 4px;
      }
    }
  }
}

.main-chart-area {
  flex: 1;
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
  min-height: 0;
  
  .chart-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    padding-bottom: 16px;
    border-bottom: 1px solid #e1e8ed;
    
    h4 {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
      color: #2c3e50;
    }
    
    .chart-actions {
      display: flex;
      gap: 8px;
    }
  }
  
  .g2-chart-container,
  .s2-table-container {
    flex: 1;
    min-height: 400px;
  }
  
  .empty-data {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
  }
}

.insights-panel {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  
  h4 {
    margin: 0 0 16px 0;
    font-size: 16px;
    font-weight: 600;
    color: #2c3e50;
  }
  
  .insight-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  
  .insight-item {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 12px;
    background: #f8fafe;
    border-radius: 8px;
    border-left: 4px solid #409eff;
    
    .insight-icon {
      font-size: 20px;
      margin-top: 2px;
    }
    
    .insight-content {
      flex: 1;
      
      .insight-title {
        font-weight: 600;
        color: #2c3e50;
        margin-bottom: 4px;
      }
      
      .insight-desc {
        font-size: 13px;
        color: #7f8c8d;
        line-height: 1.4;
      }
    }
  }
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .analyzer-content {
    flex-direction: column;
    
    .left-panel {
      width: 100%;
    }
    
    .stats-overview {
      flex-direction: column;
    }
  }
}

/* 滚动条样式 */
.left-panel::-webkit-scrollbar {
  width: 6px;
}

.left-panel::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.left-panel::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
  
  &:hover {
    background: #a8a8a8;
  }
}
</style> 