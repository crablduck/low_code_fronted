<template>
  <div class="transformer-test-page">
    <h2>📊 数据转换器测试</h2>
    
    <el-row :gutter="20">
      <el-col :span="12">
        <el-card title="测试数据">
          <template #header>
            <span>测试数据</span>
          </template>
          
          <div class="test-data-section">
            <el-button @click="loadTestData('medical')" type="primary">加载医疗数据</el-button>
            <el-button @click="loadTestData('sales')" type="success">加载销售数据</el-button>
            <el-button @click="loadTestData('user')" type="info">加载用户数据</el-button>
          </div>
          
          <div v-if="testData" class="data-preview">
            <h4>数据预览 ({{ testData.data.data.length }} 条记录)</h4>
            <el-table :data="testData.data.data.slice(0, 5)" size="small" border>
              <el-table-column
                v-for="(column, index) in testData.data.columns"
                :key="column"
                :prop="index"
                :label="column"
                min-width="100"
              >
                <template #default="{ row }">
                  {{ row[index] }}
                </template>
              </el-table-column>
            </el-table>
          </div>
        </el-card>
      </el-col>
      
      <el-col :span="12">
        <el-card title="图表配置">
          <template #header>
            <span>图表配置</span>
          </template>
          
          <el-form :model="chartConfig" label-width="80px">
            <el-form-item label="图表类型">
              <el-select v-model="chartConfig.type" @change="handleChartTypeChange">
                <el-option label="柱状图" value="bar" />
                <el-option label="折线图" value="line" />
                <el-option label="饼图" value="pie" />
                <el-option label="表格" value="table" />
              </el-select>
            </el-form-item>
            
            <template v-if="chartConfig.type === 'bar' || chartConfig.type === 'line'">
              <el-form-item label="X轴字段">
                <el-select v-model="chartConfig.fieldMapping.xField">
                  <el-option
                    v-for="column in availableColumns"
                    :key="column"
                    :label="column"
                    :value="column"
                  />
                </el-select>
              </el-form-item>
              <el-form-item label="Y轴字段">
                <el-select v-model="chartConfig.fieldMapping.yField">
                  <el-option
                    v-for="column in availableColumns"
                    :key="column"
                    :label="column"
                    :value="column"
                  />
                </el-select>
              </el-form-item>
            </template>
            
            <template v-else-if="chartConfig.type === 'pie'">
              <el-form-item label="名称字段">
                <el-select v-model="chartConfig.fieldMapping.nameField">
                  <el-option
                    v-for="column in availableColumns"
                    :key="column"
                    :label="column"
                    :value="column"
                  />
                </el-select>
              </el-form-item>
              <el-form-item label="数值字段">
                <el-select v-model="chartConfig.fieldMapping.valueField">
                  <el-option
                    v-for="column in availableColumns"
                    :key="column"
                    :label="column"
                    :value="column"
                  />
                </el-select>
              </el-form-item>
            </template>
          </el-form>
        </el-card>
      </el-col>
    </el-row>
    
    <el-row style="margin-top: 20px;">
      <el-col :span="24">
        <el-card title="数据转换器">
          <template #header>
            <span>数据转换器</span>
          </template>
          
          <ChartDataTransformer
            v-if="testData"
            :raw-data="testData"
            :chart-type="chartConfig.type"
            :field-mapping="chartConfig.fieldMapping"
            :transformer-type="selectedTransformer"
            :show-selector="true"
            :auto-transform="true"
            @transform="handleTransformResult"
            @error="handleTransformError"
            @transformer-change="handleTransformerChange"
          />
        </el-card>
      </el-col>
    </el-row>
    
    <el-row v-if="transformResult" style="margin-top: 20px;">
      <el-col :span="24">
        <el-card title="转换结果">
          <template #header>
            <span>转换结果</span>
          </template>
          
          <div class="result-section">
            <h4>元数据</h4>
            <pre>{{ JSON.stringify(transformResult.metadata, null, 2) }}</pre>
            
            <h4 style="margin-top: 20px;">图表渲染</h4>
            <div
              ref="chartContainer"
              style="width: 100%; height: 400px; border: 1px solid #ddd;"
            />
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import * as echarts from 'echarts'
import ChartDataTransformer from '@/shared/components/ChartDataTransformer.vue'

// 响应式数据
const testData = ref<any>(null)
const selectedTransformer = ref('default')
const transformResult = ref<any>(null)
const chartContainer = ref<HTMLElement>()
const chartInstance = ref<echarts.ECharts | null>(null)

const chartConfig = ref({
  type: 'bar',
  fieldMapping: {
    xField: '',
    yField: '',
    nameField: '',
    valueField: ''
  }
})

// 计算属性
const availableColumns = computed(() => {
  return testData.value?.data?.columns || []
})

// 测试数据集
const testDataSets = {
  medical: {
    code: 200,
    message: 'success',
    data: {
      columns: ['患者ID', '姓名', '年龄', '性别', '科室', '诊断', '费用'],
      data: [
        ['P001', '张三', 35, '男', '内科', '高血压', 1200],
        ['P002', '李四', 28, '女', '外科', '阑尾炎', 3500],
        ['P003', '王五', 45, '男', '内科', '糖尿病', 2800],
        ['P004', '赵六', 52, '女', '心内科', '冠心病', 4200],
        ['P005', '钱七', 38, '男', '外科', '胆结石', 2600],
        ['P006', '孙八', 29, '女', '妇科', '子宫肌瘤', 3800],
        ['P007', '周九', 41, '男', '内科', '高血压', 1500],
        ['P008', '吴十', 33, '女', '内科', '糖尿病', 2200]
      ],
      totalCount: 8
    }
  },
  sales: {
    code: 200,
    message: 'success',
    data: {
      columns: ['产品名称', '销售额', '销量', '月份', '区域'],
      data: [
        ['产品A', 12000, 120, '2024-01', '华北'],
        ['产品B', 15000, 150, '2024-01', '华东'],
        ['产品C', 8000, 80, '2024-01', '华南'],
        ['产品A', 13500, 135, '2024-02', '华北'],
        ['产品B', 16200, 162, '2024-02', '华东'],
        ['产品C', 9500, 95, '2024-02', '华南'],
        ['产品A', 14800, 148, '2024-03', '华北'],
        ['产品B', 17600, 176, '2024-03', '华东']
      ],
      totalCount: 8
    }
  },
  user: {
    code: 200,
    message: 'success',
    data: {
      columns: ['用户ID', '姓名', '年龄', '城市', '注册时间', '活跃度'],
      data: [
        ['U001', '用户A', 25, '北京', '2024-01-15', 85],
        ['U002', '用户B', 30, '上海', '2024-01-20', 92],
        ['U003', '用户C', 28, '广州', '2024-02-01', 78],
        ['U004', '用户D', 35, '深圳', '2024-02-10', 88],
        ['U005', '用户E', 27, '杭州', '2024-02-15', 95],
        ['U006', '用户F', 32, '成都', '2024-03-01', 82],
        ['U007', '用户G', 29, '武汉', '2024-03-10', 90],
        ['U008', '用户H', 31, '西安', '2024-03-15', 87]
      ],
      totalCount: 8
    }
  }
}

// 方法
const loadTestData = (type: 'medical' | 'sales' | 'user') => {
  testData.value = testDataSets[type]
  
  // 自动设置字段映射
  const columns = testData.value.data.columns
  if (type === 'medical') {
    chartConfig.value.fieldMapping.xField = '科室'
    chartConfig.value.fieldMapping.yField = '费用'
    chartConfig.value.fieldMapping.nameField = '科室'
    chartConfig.value.fieldMapping.valueField = '费用'
  } else if (type === 'sales') {
    chartConfig.value.fieldMapping.xField = '产品名称'
    chartConfig.value.fieldMapping.yField = '销售额'
    chartConfig.value.fieldMapping.nameField = '产品名称'
    chartConfig.value.fieldMapping.valueField = '销售额'
  } else if (type === 'user') {
    chartConfig.value.fieldMapping.xField = '城市'
    chartConfig.value.fieldMapping.yField = '活跃度'
    chartConfig.value.fieldMapping.nameField = '城市'
    chartConfig.value.fieldMapping.valueField = '活跃度'
  }
  
  ElMessage.success(`已加载${type === 'medical' ? '医疗' : type === 'sales' ? '销售' : '用户'}数据`)
}

const handleChartTypeChange = () => {
  transformResult.value = null
  cleanupChart()
}

const handleTransformResult = (result: any) => {
  transformResult.value = result
  console.log('转换结果:', result)
  
  nextTick(() => {
    renderChart(result.echartsOption)
  })
}

const handleTransformError = (error: Error) => {
  ElMessage.error(`转换失败: ${error.message}`)
  transformResult.value = null
}

const handleTransformerChange = (transformerId: string) => {
  selectedTransformer.value = transformerId
  ElMessage.info(`已切换到转换器: ${transformerId}`)
}

const renderChart = (option: any) => {
  if (!chartContainer.value || !option) return
  
  try {
    if (!chartInstance.value) {
      chartInstance.value = echarts.init(chartContainer.value)
    }
    
    chartInstance.value.setOption(option, true)
    ElMessage.success('图表渲染完成')
  } catch (error) {
    console.error('图表渲染失败:', error)
    ElMessage.error('图表渲染失败')
  }
}

const cleanupChart = () => {
  if (chartInstance.value) {
    chartInstance.value.dispose()
    chartInstance.value = null
  }
}

// 生命周期
onMounted(() => {
  loadTestData('medical') // 默认加载医疗数据
})

onUnmounted(() => {
  cleanupChart()
})
</script>

<style scoped lang="scss">
.transformer-test-page {
  padding: 20px;
  
  h2 {
    margin-bottom: 20px;
    color: #303133;
  }
  
  .test-data-section {
    margin-bottom: 16px;
    
    .el-button {
      margin-right: 8px;
    }
  }
  
  .data-preview {
    h4 {
      margin: 16px 0 8px 0;
      color: #606266;
    }
  }
  
  .result-section {
    h4 {
      margin: 16px 0 8px 0;
      color: #606266;
    }
    
    pre {
      background: #f5f7fa;
      padding: 12px;
      border-radius: 4px;
      font-size: 12px;
      max-height: 200px;
      overflow-y: auto;
    }
  }
}
</style> 