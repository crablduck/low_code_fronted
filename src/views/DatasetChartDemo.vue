<template>
  <div class="dataset-chart-demo">
    <el-card class="demo-card">
      <template #header>
        <div class="demo-header">
          <h2>数据集图表渲染演示</h2>
          <p>通过 API <code>api/datasets/{datasetId}/preview</code> 获取数据并渲染图表</p>
        </div>
      </template>

      <!-- 配置区域 -->
      <div class="demo-config">
        <el-form :model="config" label-width="120px" class="config-form">
          <el-form-item label="数据集ID">
            <el-input-number 
              v-model="config.datasetId" 
              :min="1" 
              placeholder="例如：32"
              @change="handleConfigChange"
            />
          </el-form-item>
          
          <el-form-item label="图表类型">
            <el-select v-model="config.chartType" @change="handleConfigChange">
              <el-option label="饼图" value="pie" />
              <el-option label="柱状图" value="bar" />
              <el-option label="折线图" value="line" />
              <el-option label="表格" value="table" />
            </el-select>
          </el-form-item>

          <!-- 饼图配置 -->
          <template v-if="config.chartType === 'pie'">
            <el-form-item label="名称字段">
              <el-select v-model="config.nameField" placeholder="选择名称字段">
                <el-option 
                  v-for="field in availableFields" 
                  :key="field" 
                  :label="field" 
                  :value="field" 
                />
              </el-select>
            </el-form-item>
            <el-form-item label="数值字段">
              <el-select v-model="config.valueField" placeholder="选择数值字段">
                <el-option 
                  v-for="field in availableFields" 
                  :key="field" 
                  :label="field" 
                  :value="field" 
                />
              </el-select>
            </el-form-item>
          </template>

          <!-- 柱状图/折线图配置 -->
          <template v-if="config.chartType === 'bar' || config.chartType === 'line'">
            <el-form-item label="X轴字段">
              <el-select v-model="config.xField" placeholder="选择X轴字段">
                <el-option 
                  v-for="field in availableFields" 
                  :key="field" 
                  :label="field" 
                  :value="field" 
                />
              </el-select>
            </el-form-item>
            <el-form-item label="Y轴字段">
              <el-select v-model="config.yField" placeholder="选择Y轴字段">
                <el-option 
                  v-for="field in availableFields" 
                  :key="field" 
                  :label="field" 
                  :value="field" 
                />
              </el-select>
            </el-form-item>
          </template>

          <!-- 表格配置 -->
          <template v-if="config.chartType === 'table'">
            <el-form-item label="显示字段">
              <el-select 
                v-model="config.tableFields" 
                multiple 
                placeholder="选择要显示的字段"
              >
                <el-option 
                  v-for="field in availableFields" 
                  :key="field" 
                  :label="field" 
                  :value="field" 
                />
              </el-select>
            </el-form-item>
          </template>

          <el-form-item>
            <el-button type="primary" @click="renderChart" :loading="loading">
              渲染图表
            </el-button>
            <el-button @click="refreshData" :loading="loading">
              刷新数据
            </el-button>
          </el-form-item>
        </el-form>
      </div>

      <!-- 数据预览 -->
      <div v-if="rawData" class="data-preview">
        <h3>原始数据预览</h3>
        <el-descriptions :column="3" border>
          <el-descriptions-item label="数据集ID">{{ config.datasetId }}</el-descriptions-item>
          <el-descriptions-item label="字段数量">{{ rawData.columns.length }}</el-descriptions-item>
          <el-descriptions-item label="数据行数">{{ rawData.totalCount }}</el-descriptions-item>
        </el-descriptions>
        
        <div class="raw-data-table">
          <el-table :data="getPreviewTableData()" border size="small">
            <el-table-column 
              v-for="column in rawData.columns" 
              :key="column" 
              :prop="column"
              :label="column" 
              min-width="100"
              show-overflow-tooltip
            />
          </el-table>
          <p class="data-info">显示前5行数据，共 {{ rawData.totalCount }} 行</p>
        </div>
      </div>

      <!-- 图表渲染区域 -->
      <div class="chart-area">
        <h3>图表渲染结果</h3>
        <div v-loading="loading" class="chart-container">
          <!-- ECharts图表 -->
          <div 
            v-if="config.chartType !== 'table'" 
            id="demo-chart" 
            class="chart-content"
          ></div>
          
          <!-- 表格 -->
          <div v-if="config.chartType === 'table'" class="table-content">
            <el-table 
              :data="tableData" 
              border 
              size="small" 
              style="width: 100%"
              max-height="400"
            >
              <el-table-column
                v-for="field in (config.tableFields || availableFields)"
                :key="field"
                :prop="field"
                :label="field"
                min-width="120"
                show-overflow-tooltip
              />
            </el-table>
          </div>
        </div>
      </div>

      <!-- 错误信息 -->
      <el-alert
        v-if="errorMessage"
        :title="errorMessage"
        type="error"
        show-icon
        :closable="false"
        style="margin-top: 20px"
      />
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import * as echarts from 'echarts'
import { previewDatasetData } from '@/api/dataset'
import { 
  getChartData, 
  getTableData, 
  getDatasetFields,
  suggestFieldMapping,
  getDatasetFieldSuggestion
} from '@/services/dashboardDataService'
import { 
  transformToObjectArray,
  type DatasetApiResponse,
  type ChartFieldMapping 
} from '@/utils/chartDataTransform'
import { checkUserInfo, testHeadersAddition } from '@/utils/debug'

// 响应式数据
const loading = ref(false)
const errorMessage = ref('')
const rawData = ref<DatasetApiResponse['data'] | null>(null)
const availableFields = ref<string[]>([])
const tableData = ref<any[]>([])

// 配置
const config = reactive({
  datasetId: 32,
  chartType: 'pie',
  nameField: '',
  valueField: '',
  xField: '',
  yField: '',
  tableFields: [] as string[]
})

// ECharts 实例
let chartInstance: echarts.ECharts | null = null

// 方法
const handleConfigChange = async () => {
  if (config.datasetId && availableFields.value.length === 0) {
    await loadDatasetFields()
  }
}

const loadDatasetFields = async () => {
  if (!config.datasetId) return
  
  try {
    loading.value = true
    availableFields.value = await getDatasetFields(config.datasetId)
    
    // 应用智能推荐
    const suggestion = suggestFieldMapping(config.chartType, availableFields.value)
    
    config.nameField = suggestion.nameField || ''
    config.valueField = suggestion.valueField || ''
    config.xField = suggestion.xField || ''
    config.yField = suggestion.yField || ''
    config.tableFields = suggestion.tableFields || []
    
  } catch (error) {
    console.error('加载字段失败:', error)
    ElMessage.error('加载字段失败')
  } finally {
    loading.value = false
  }
}

const refreshData = async () => {
  if (!config.datasetId) {
    ElMessage.warning('请输入数据集ID')
    return
  }
  
  try {
    loading.value = true
    errorMessage.value = ''
    
    // 获取原始数据
    const response = await previewDatasetData(config.datasetId)
    console.log('API响应:', response)
    
    // 处理不同的响应格式
    let processedData: any = null
    
    if (response.data && (response.data as any).columns && (response.data as any).data) {
      // 直接的数据格式
      processedData = response.data
    } else if (response.data && (response.data as any).content) {
      // 分页格式，需要转换
      const content = (response.data as any).content
      if (content.length > 0) {
        const columns = Object.keys(content[0])
        const data = content.map((item: any) => columns.map(col => item[col]))
        processedData = {
          columns,
          data,
          totalCount: (response.data as any).totalElements || content.length
        }
      }
    } else {
      // 尝试直接使用响应数据
      if ((response as any).columns && (response as any).data) {
        processedData = response
      }
    }
    
    if (processedData && processedData.columns) {
      rawData.value = processedData
      availableFields.value = processedData.columns
      
      // 应用智能推荐（如果字段配置为空）
      if (!config.nameField && !config.valueField && !config.xField && !config.yField) {
        // 获取数据集详细信息以获取字段元数据
        const suggestion = await getDatasetFieldSuggestion(config.datasetId, config.chartType)
        Object.assign(config, suggestion)
      }
      
      ElMessage.success('数据加载成功')
    } else {
      console.error('无法解析的数据格式:', response)
      throw new Error('数据格式不正确，请检查控制台')
    }
    
  } catch (error: any) {
    console.error('获取数据失败:', error)
    errorMessage.value = `获取数据失败: ${error.message || '未知错误'}`
    rawData.value = null
  } finally {
    loading.value = false
  }
}

const renderChart = async () => {
  if (!config.datasetId) {
    ElMessage.warning('请输入数据集ID')
    return
  }
  
  if (!rawData.value) {
    ElMessage.warning('请先获取数据')
    return
  }
  
  try {
    loading.value = true
    errorMessage.value = ''
    
    console.log('开始渲染图表:', {
      chartType: config.chartType,
      nameField: config.nameField,
      valueField: config.valueField,
      rawData: rawData.value
    })
    
    // 构建字段映射
    const fieldMapping: ChartFieldMapping = {
      nameField: config.nameField,
      valueField: config.valueField,
      xField: config.xField,
      yField: config.yField,
      tableFields: config.tableFields
    }
    
    if (config.chartType === 'table') {
      // 获取表格数据
      tableData.value = await getTableData(config.datasetId, fieldMapping)
    } else {
      // 检查必需的字段映射
      if (!config.nameField || !config.valueField) {
        throw new Error('请配置名称字段和数值字段')
      }
      
      // 直接构建简单的图表数据，不依赖后端API
      const chartData = buildSimpleChartData(rawData.value, fieldMapping, config.chartType)
      console.log('构建的图表数据:', chartData)
      
      // 渲染图表
      await nextTick()
      
      if (chartInstance) {
        chartInstance.dispose()
      }
      
      const container = document.getElementById('demo-chart')
      if (container) {
        chartInstance = echarts.init(container)
        chartInstance.setOption(chartData)
        console.log('图表渲染完成')
      } else {
        throw new Error('找不到图表容器')
      }
    }
    
    ElMessage.success('图表渲染成功')
    
  } catch (error: any) {
    console.error('渲染图表失败:', error)
    errorMessage.value = `渲染图表失败: ${error.message || '未知错误'}`
  } finally {
    loading.value = false
  }
}

// 直接构建简单的图表数据
const buildSimpleChartData = (data: any, fieldMapping: ChartFieldMapping, chartType: string) => {
  const { columns, data: rows } = data
  const nameIndex = columns.indexOf(fieldMapping.nameField)
  const valueIndex = columns.indexOf(fieldMapping.valueField)
  
  if (nameIndex === -1 || valueIndex === -1) {
    throw new Error('找不到指定的字段')
  }
  
  const chartData = rows.map((row: any[]) => ({
    name: row[nameIndex],
    value: row[valueIndex]
  }))
  
  if (chartType === 'pie') {
    return {
      title: { text: '饼图示例', left: 'center' },
      tooltip: { trigger: 'item' },
      legend: { orient: 'vertical', left: 'left' },
      series: [{
        name: '数据',
        type: 'pie',
        radius: '50%',
        data: chartData,
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        }
      }]
    }
  } else if (chartType === 'bar') {
    return {
      title: { text: '柱状图示例', left: 'center' },
      tooltip: { trigger: 'axis' },
      xAxis: {
        type: 'category',
        data: chartData.map(item => item.name)
      },
      yAxis: { type: 'value' },
      series: [{
        name: '数据',
        type: 'bar',
        data: chartData.map(item => item.value)
      }]
    }
  } else if (chartType === 'line') {
    return {
      title: { text: '折线图示例', left: 'center' },
      tooltip: { trigger: 'axis' },
      xAxis: {
        type: 'category',
        data: chartData.map(item => item.name)
      },
      yAxis: { type: 'value' },
      series: [{
        name: '数据',
        type: 'line',
        data: chartData.map(item => item.value)
      }]
    }
  }
  
  throw new Error('不支持的图表类型')
}

// 获取预览表格数据
const getPreviewTableData = () => {
  if (!rawData.value || !rawData.value.data) return []
  
  // 转换二维数组为对象数组，只取前5行
  return rawData.value.data.slice(0, 5).map(row => {
    const obj: any = {}
    rawData.value!.columns.forEach((column, index) => {
      obj[column] = row[index]
    })
    return obj
  })
}

// 初始化
onMounted(async () => {
  // 调试：检查用户信息
  checkUserInfo()
  testHeadersAddition()
  
  await refreshData()
})

// 组件卸载时清理图表实例
onUnmounted(() => {
  if (chartInstance) {
    chartInstance.dispose()
  }
})
</script>

<style scoped>
.dataset-chart-demo {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.demo-card {
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.demo-header h2 {
  margin: 0 0 8px 0;
  color: var(--el-text-color-primary);
}

.demo-header p {
  margin: 0;
  color: var(--el-text-color-secondary);
  font-size: 14px;
}

.demo-header code {
  background: var(--el-fill-color-light);
  padding: 2px 6px;
  border-radius: 4px;
  font-family: 'Monaco', 'Consolas', 'Courier New', monospace;
}

.demo-config {
  margin-bottom: 30px;
  padding: 20px;
  background: var(--el-fill-color-lighter);
  border-radius: 8px;
}

.config-form {
  max-width: 600px;
}

.data-preview {
  margin-bottom: 30px;
}

.data-preview h3 {
  margin-bottom: 16px;
  color: var(--el-text-color-primary);
}

.raw-data-table {
  margin-top: 16px;
}

.data-info {
  margin: 8px 0 0 0;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  text-align: center;
}

.chart-area h3 {
  margin-bottom: 16px;
  color: var(--el-text-color-primary);
}

.chart-container {
  border: 1px solid var(--el-border-color);
  border-radius: 8px;
  overflow: hidden;
  background: white;
}

.chart-content {
  width: 100%;
  height: 400px;
}

.table-content {
  padding: 16px;
}
</style> 