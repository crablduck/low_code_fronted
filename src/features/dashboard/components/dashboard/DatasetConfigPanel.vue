<template>
  <div class="dataset-config-panel">
    <el-card class="config-card">
      <template #header>
        <div class="card-header">
                      <el-icon><DataBoard /></el-icon>
          <span>数据集配置</span>
          <el-tag v-if="props.chartType" size="small" type="primary">{{ getChartTypeLabel(props.chartType) }}</el-tag>
        </div>
      </template>

      <!-- 数据集选择 -->
      <div class="config-section">
        <div class="section-header">
          <h4 class="section-title">
            <el-icon><Collection /></el-icon>
            <span>选择数据集</span>
          </h4>
        </div>
        
        <el-select
          v-model="localConfig.datasetId"
          placeholder="请选择数据集"
          style="width: 100%"
          :loading="datasetsLoading"
          @change="handleDatasetChange"
          filterable
        >
          <el-option
            v-for="dataset in datasets"
            :key="dataset.id"
            :label="dataset.name"
            :value="dataset.id"
          >
            <div class="dataset-option">
              <div class="dataset-name">{{ dataset.name }}</div>
              <div class="dataset-desc">{{ dataset.description || '暂无描述' }}</div>
            </div>
          </el-option>
        </el-select>
      </div>

      <!-- 过滤条件配置 -->
      <div v-if="selectedDataset" class="config-section">
        <div class="section-header">
          <h4 class="section-title">
            <el-icon><Filter /></el-icon>
            <span>过滤条件</span>
            <span class="record-count" v-if="localConfig.filters && localConfig.filters.length > 0">
              ({{ localConfig.filters.length }} 个条件)
            </span>
          </h4>
          <el-button 
            size="small" 
            type="primary"
            @click="showAddFilter = true"
            icon="Plus"
          >
            添加过滤
          </el-button>
        </div>
        
        <!-- 过滤条件列表 -->
        <div v-if="localConfig.filters && localConfig.filters.length > 0" class="filter-conditions">
          <div
            v-for="(filter, index) in localConfig.filters"
            :key="index"
            class="filter-item"
          >
            <div class="filter-content">
              <div class="filter-info">
                <span class="filter-field">{{ getFieldDisplayName(filter.fieldName) }}</span>
                <span class="filter-operator">{{ getOperatorLabel(filter.operator) }}</span>
                <span class="filter-value">{{ formatFilterValue(filter.value) }}</span>
              </div>
              <el-button
                size="small"
                type="danger"
                @click="removeFilter(index)"
                icon="Delete"
                circle
              />
            </div>
          </div>
        </div>
        
        <el-empty v-else description="暂无过滤条件" :image-size="60" />
      </div>

      <!-- 数据预览 -->
      <div v-if="selectedDataset" class="config-section">
        <div class="section-header">
          <h4 class="section-title">
            <el-icon><View /></el-icon>
            <span>数据预览</span>
            <span class="record-count" v-if="previewData.length > 0">({{ previewData.length }} 条记录)</span>
          </h4>
          <el-button 
            size="small" 
            @click="loadDatasetPreview" 
            :loading="previewLoading"
            icon="Refresh"
          >
            刷新
          </el-button>
        </div>
        
        <!-- 预览表格 -->
        <div class="preview-container">
          <el-table
            :data="previewData.slice(0, 10)"
            size="small"
            height="200"
            :loading="previewLoading"
            empty-text="暂无数据"
          >
            <el-table-column
              v-for="column in previewColumns"
              :key="column"
              :prop="column"
              :label="getFieldDisplayName(column)"
              min-width="120"
              show-overflow-tooltip
            >
              <template #default="{ row }">
                <span class="cell-content">{{ formatCellValue(row[column]) }}</span>
              </template>
            </el-table-column>
          </el-table>
          
          <!-- 显示更多数据提示 -->
          <div v-if="previewData.length > 10" class="more-data-hint">
            <el-text type="info" size="small">
              仅显示前10条数据，共{{ previewData.length }}条记录
            </el-text>
          </div>
        </div>
      </div>

      <!-- 字段映射配置 -->
      <div v-if="selectedDataset && datasetFields.length > 0" class="config-section">
        <div class="section-header">
          <h4 class="section-title">
            <el-icon><Link /></el-icon>
            <span>字段映射</span>
          </h4>
        </div>
        
        <div class="field-mapping-config">
          <!-- 柱状图/折线图字段映射 -->
          <template v-if="props.chartType === 'bar' || props.chartType === 'line'">
            <el-form-item label="X轴字段" required>
              <el-select
                v-model="localConfig.fieldMapping.xField"
                placeholder="选择X轴字段"
                style="width: 100%"
                @change="handleFieldMappingChange"
              >
                <el-option
                  v-for="field in dimensionFields"
                  :key="field.fieldName"
                  :value="field.fieldName"
                >
                  <div class="field-option">
                    <span class="field-name">{{ field.displayName || field.fieldName }}</span>
                    <el-tag size="small" type="info">{{ field.fieldType }}</el-tag>
                  </div>
                </el-option>
              </el-select>
              <div v-if="localConfig.fieldMapping.xField" class="field-sample">
                样本: {{ getFieldSample('xField') }}
              </div>
            </el-form-item>
            
            <el-form-item label="Y轴字段" required>
              <el-select
                v-model="localConfig.fieldMapping.yField"
                placeholder="选择Y轴字段"
                style="width: 100%"
                @change="handleFieldMappingChange"
              >
                <el-option
                  v-for="field in metricFields"
                  :key="field.fieldName"
                  :value="field.fieldName"
                >
                  <div class="field-option">
                    <span class="field-name">{{ field.displayName || field.fieldName }}</span>
                    <el-tag size="small" type="success">{{ field.fieldType }}</el-tag>
                  </div>
                </el-option>
              </el-select>
              <div v-if="localConfig.fieldMapping.yField" class="field-sample">
                样本: {{ getFieldSample('yField') }}
              </div>
            </el-form-item>
            
                         <el-form-item label="分组字段">
               <el-select
                 v-model="localConfig.fieldMapping.groupField"
                 placeholder="选择分组字段（可选）"
                 style="width: 100%"
                 @change="handleFieldMappingChange"
                 clearable
               >
                <el-option
                  v-for="field in dimensionFields"
                  :key="field.fieldName"
                  :value="field.fieldName"
                >
                  <div class="field-option">
                    <span class="field-name">{{ field.displayName || field.fieldName }}</span>
                    <el-tag size="small" type="info">{{ field.fieldType }}</el-tag>
                  </div>
                </el-option>
              </el-select>
            </el-form-item>
          </template>

          <!-- 饼图字段映射 -->
          <template v-else-if="props.chartType === 'pie'">
            <el-form-item label="名称字段" required>
              <el-select
                v-model="localConfig.fieldMapping.nameField"
                placeholder="选择名称字段"
                style="width: 100%"
                @change="handleFieldMappingChange"
              >
                <el-option
                  v-for="field in dimensionFields"
                  :key="field.fieldName"
                  :value="field.fieldName"
                >
                  <div class="field-option">
                    <span class="field-name">{{ field.displayName || field.fieldName }}</span>
                    <el-tag size="small" type="info">{{ field.fieldType }}</el-tag>
                  </div>
                </el-option>
              </el-select>
              <div v-if="localConfig.fieldMapping.nameField" class="field-sample">
                样本: {{ getFieldSample('nameField') }}
              </div>
            </el-form-item>
            
            <el-form-item label="数值字段" required>
              <el-select
                v-model="localConfig.fieldMapping.valueField"
                placeholder="选择数值字段"
                style="width: 100%"
                @change="handleFieldMappingChange"
              >
                <el-option
                  v-for="field in metricFields"
                  :key="field.fieldName"
                  :value="field.fieldName"
                >
                  <div class="field-option">
                    <span class="field-name">{{ field.displayName || field.fieldName }}</span>
                    <el-tag size="small" type="success">{{ field.fieldType }}</el-tag>
                  </div>
                </el-option>
              </el-select>
              <div v-if="localConfig.fieldMapping.valueField" class="field-sample">
                样本: {{ getFieldSample('valueField') }}
              </div>
            </el-form-item>
          </template>

          <!-- 表格字段映射 -->
          <template v-else-if="props.chartType === 'table'">
            <el-form-item label="显示字段" required>
              <el-select
                v-model="localConfig.fieldMapping.tableFields"
                placeholder="选择要显示的字段"
                style="width: 100%"
                @change="handleFieldMappingChange"
                multiple
                collapse-tags
                collapse-tags-tooltip
              >
                <el-option
                  v-for="field in allFields"
                  :key="field.fieldName"
                  :value="field.fieldName"
                >
                  <div class="field-option">
                    <span class="field-name">{{ field.displayName || field.fieldName }}</span>
                    <el-tag 
                      size="small" 
                      :type="field.fieldType === 'metric' ? 'success' : 'info'"
                    >
                      {{ field.fieldType }}
                    </el-tag>
                  </div>
                </el-option>
              </el-select>
            </el-form-item>
          </template>
        </div>
      </div>

      <!-- 数据转换器 -->
      <div v-if="selectedDataset && previewData.length > 0" class="config-section">
        <div class="section-header">
          <h4 class="section-title">
            <el-icon><Operation /></el-icon>
            <span>数据转换</span>
          </h4>
        </div>
        
        <ChartDataTransformer
          :raw-data="transformerData"
          :chart-type="props.chartType"
          :field-mapping="localConfig.fieldMapping"
          :transformer-type="selectedTransformerType"
          :show-selector="true"
          :auto-transform="false"
          @transform="handleTransformResult"
          @error="handleTransformError"
          @transformer-change="handleTransformerChange"
        />
      </div>
      
      <!-- 图表预览 -->
      <div v-if="chartPreviewData" class="config-section">
        <div class="section-header">
          <h4 class="section-title">
            <el-icon><PieChart /></el-icon>
            <span>图表预览</span>
          </h4>
          <el-button 
            size="small" 
            @click="renderChart"
            :loading="renderingChart"
            type="primary"
            icon="View"
          >
            渲染图表
          </el-button>
        </div>
        
        <div class="chart-preview-container">
          <div
            ref="chartContainer"
            class="chart-preview"
            style="width: 100%; height: 300px;"
          />
        </div>
      </div>

      <!-- 操作按钮 -->
      <div v-if="selectedDataset" class="config-actions">
        <el-button 
          @click="previewChart" 
          :disabled="!isConfigValid"
          type="primary"
        >
          预览图表
        </el-button>
        <el-button 
          @click="applyConfig" 
          :disabled="!isConfigValid"
        >
          应用配置
        </el-button>
      </div>
    </el-card>

    <!-- 添加过滤条件对话框 -->
    <el-dialog
      v-model="showAddFilter"
      title="添加过滤条件"
      width="500px"
      @close="resetFilterForm"
    >
      <el-form :model="filterForm" label-width="80px">
        <el-form-item label="字段" required>
          <el-select v-model="filterForm.fieldName" placeholder="选择字段" style="width: 100%">
            <el-option
              v-for="field in datasetFields"
              :key="field.fieldName"
              :label="field.displayName || field.fieldName"
              :value="field.fieldName"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="条件" required>
          <el-select v-model="filterForm.operator" placeholder="选择条件" style="width: 100%">
            <el-option label="等于" value="eq" />
            <el-option label="不等于" value="ne" />
            <el-option label="包含" value="like" />
            <el-option label="不包含" value="not_like" />
            <el-option label="大于" value="gt" />
            <el-option label="小于" value="lt" />
            <el-option label="大于等于" value="gte" />
            <el-option label="小于等于" value="lte" />
            <el-option label="为空" value="is_null" />
            <el-option label="不为空" value="is_not_null" />
          </el-select>
        </el-form-item>
        <el-form-item label="值" v-if="!isNullOperator(filterForm.operator)">
          <el-input v-model="filterForm.value" placeholder="输入过滤值" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddFilter = false">取消</el-button>
        <el-button type="primary" @click="addFilterCondition">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, reactive, onUnmounted, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { 
  DataBoard, 
  Collection, 
  View, 
  Link, 
  Refresh,
  Filter,
  Plus,
  Delete,
  Operation,
  PieChart
} from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import type { DataSet, DataSetField } from '@/shared/types/dataManagement'
import type { ChartFieldMapping } from '@/shared/types/dashboard'
import { dataSetApi } from '@/api/dataSource'
import { previewDatasetData, smartPreviewDataset } from '@/api/dataset'
import ChartDataTransformer from '@/shared/components/ChartDataTransformer.vue'

// Props定义
interface Props {
  chartType: 'bar' | 'line' | 'pie' | 'table' | 'scatter' | 'area'
  initialConfig: {
    datasetId?: number
    fieldMapping?: ChartFieldMapping
    filters?: Array<{
      fieldName: string
      operator: string
      value: any
    }>
  }
}

const props = withDefaults(defineProps<Props>(), {
  chartType: 'bar',
  initialConfig: () => ({})
})

// Emits定义
const emit = defineEmits<{
  'config-change': [{
    datasetId: number
    fieldMapping: ChartFieldMapping
    filters?: Array<{
      fieldName: string
      operator: string
      value: any
    }>
    isValid: boolean
  }]
  'preview-chart': [any]
}>()

// 响应式数据
const datasets = ref<DataSet[]>([])
const datasetsLoading = ref(false)
const selectedDataset = ref<DataSet | null>(null)
const datasetFields = ref<DataSetField[]>([])

// 数据预览相关
const previewData = ref<any[]>([])
const previewColumns = ref<string[]>([])
const previewLoading = ref(false)

// 过滤条件相关
const showAddFilter = ref(false)
const filterForm = reactive({
  fieldName: '',
  operator: '',
  value: ''
})

// 本地配置状态
const localConfig = ref<{
  datasetId?: number
  fieldMapping: ChartFieldMapping
  filters: Array<{
    fieldName: string
    operator: string
    value: any
  }>
}>({
  datasetId: props.initialConfig.datasetId,
  fieldMapping: props.initialConfig.fieldMapping || {},
  filters: props.initialConfig.filters || []
})

// 转换器相关状态
const selectedTransformerType = ref('default')
const chartPreviewData = ref<any>(null)
const renderingChart = ref(false)
const chartContainer = ref<HTMLElement>()
const chartInstance = ref<echarts.ECharts | null>(null)

// 计算属性
const dimensionFields = computed(() => 
  datasetFields.value.filter(field => field.fieldType === 'dimension')
)

const metricFields = computed(() => 
  datasetFields.value.filter(field => field.fieldType === 'metric')
)

const allFields = computed(() => datasetFields.value)

// 转换器数据格式
const transformerData = computed(() => {
  if (!previewData.value || previewData.value.length === 0) return null
  
  return {
    code: 200,
    message: 'success',
    data: {
      columns: previewColumns.value,
      data: previewData.value.map(row => 
        previewColumns.value.map(col => row[col])
      ),
      totalCount: previewData.value.length
    }
  }
})

// 配置有效性验证
const isConfigValid = computed(() => {
  if (!localConfig.value.datasetId) return false
  
  const { fieldMapping } = localConfig.value
  
  switch (props.chartType) {
    case 'bar':
    case 'line':
      return !!(fieldMapping.xField && fieldMapping.yField)
    case 'pie':
      return !!(fieldMapping.nameField && fieldMapping.valueField)
    case 'table':
      return !!(fieldMapping.tableFields && fieldMapping.tableFields.length > 0)
    case 'scatter':
      return !!(fieldMapping.xField && fieldMapping.yField)
    default:
      return false
  }
})

// 方法定义
const loadDatasets = async () => {
  try {
    datasetsLoading.value = true
         const response = await dataSetApi.getDatasets()
     datasets.value = response.data || []
  } catch (error) {
    console.error('加载数据集列表失败:', error)
    ElMessage.error('加载数据集列表失败')
    datasets.value = []
  } finally {
    datasetsLoading.value = false
  }
}

const handleDatasetChange = async (datasetId: number) => {
  try {
    // 重置配置
    localConfig.value.fieldMapping = {}
    localConfig.value.filters = []
    previewData.value = []
    previewColumns.value = []
    datasetFields.value = []
    
         // 加载数据集详情
     const response = await dataSetApi.getDatasetById(datasetId)
     selectedDataset.value = response
    
    // 加载字段信息
    if (selectedDataset.value?.fields) {
      datasetFields.value = selectedDataset.value.fields
    }
    
    // 自动加载预览数据
    await loadDatasetPreview()
    
    // 发送配置变更事件
    emitConfigChange()
  } catch (error) {
    console.error('加载数据集详情失败:', error)
    ElMessage.error('加载数据集详情失败')
  }
}

const loadDatasetPreview = async () => {
  if (!selectedDataset.value) return
  
  try {
    previewLoading.value = true
    console.log(`加载数据集预览: ${selectedDataset.value.name} (ID: ${selectedDataset.value.id})`)
    
    // 使用智能预览接口
    const previewOptions = {
      filters: localConfig.value.filters,
      limit: 50 // 预览数据限制
    }
    
    const response = await smartPreviewDataset(selectedDataset.value.id, previewOptions)
    
    if (response.code === 200 && response.data) {
             // 处理智能预览响应
       const data = response.data as any
       
       if (data.records && Array.isArray(data.records)) {
         // 格式1: { columns: string[], records: any[] }
         previewData.value = data.records
         previewColumns.value = data.columns || []
       } else if (data.columns && data.data) {
         // 格式2: { columns: string[], data: any[][] }
         previewColumns.value = data.columns
         previewData.value = data.data.map((row: any[]) => {
           const obj: Record<string, any> = {}
           data.columns.forEach((column: string, index: number) => {
             obj[column] = row[index]
           })
           return obj
         })
       } else if (data.content && Array.isArray(data.content)) {
        // 格式3: 分页格式 { content: any[], totalElements: number, ... }
        previewData.value = data.content
        if (previewData.value.length > 0) {
          previewColumns.value = Object.keys(previewData.value[0])
        } else {
          previewColumns.value = []
        }
      } else {
        previewData.value = []
        previewColumns.value = []
      }
      
      console.log('智能预览加载成功:', previewData.value.length, '条记录')
    } else {
      throw new Error(response.message || '获取预览数据失败')
    }
  } catch (error) {
    console.error('加载数据预览失败:', error)
    ElMessage.warning('智能预览失败，尝试使用普通预览')
    
    // 降级到普通预览
    try {
      const response = await previewDatasetData(selectedDataset.value.id)
      if (response.code === 200 && response.data) {
        if (response.data.content && Array.isArray(response.data.content)) {
          previewData.value = response.data.content
          if (previewData.value.length > 0) {
            previewColumns.value = Object.keys(previewData.value[0])
          }
        } else {
          previewData.value = []
          previewColumns.value = []
        }
      }
    } catch (fallbackError) {
      console.error('普通预览也失败:', fallbackError)
      ElMessage.error('加载数据预览失败')
      previewData.value = []
      previewColumns.value = []
    }
  } finally {
    previewLoading.value = false
  }
}

// 过滤条件相关方法
const addFilterCondition = () => {
  if (!filterForm.fieldName || !filterForm.operator) {
    ElMessage.warning('请填写完整的过滤条件')
    return
  }

  if (!isNullOperator(filterForm.operator) && !filterForm.value) {
    ElMessage.warning('请输入过滤值')
    return
  }

  // 格式化过滤值
  let formattedValue = filterForm.value
  if (filterForm.operator === 'like' && formattedValue && !formattedValue.includes('%')) {
    formattedValue = `%${formattedValue}%`
  }

  localConfig.value.filters.push({
    fieldName: filterForm.fieldName,
    operator: filterForm.operator,
    value: isNullOperator(filterForm.operator) ? null : formattedValue
  })

  showAddFilter.value = false
  resetFilterForm()
  
  // 重新加载预览数据
  loadDatasetPreview()
  
  // 发送配置变更事件
  emitConfigChange()
  
  ElMessage.success('过滤条件添加成功')
}

const removeFilter = (index: number) => {
  localConfig.value.filters.splice(index, 1)
  
  // 重新加载预览数据
  loadDatasetPreview()
  
  // 发送配置变更事件
  emitConfigChange()
  
  ElMessage.success('过滤条件删除成功')
}

const resetFilterForm = () => {
  filterForm.fieldName = ''
  filterForm.operator = ''
  filterForm.value = ''
}

const isNullOperator = (operator: string) => {
  return operator === 'is_null' || operator === 'is_not_null'
}

const getOperatorLabel = (operator: string) => {
  const operatorMap: Record<string, string> = {
    'eq': '等于',
    'ne': '不等于',
    'like': '包含',
    'not_like': '不包含',
    'gt': '大于',
    'lt': '小于',
    'gte': '大于等于',
    'lte': '小于等于',
    'is_null': '为空',
    'is_not_null': '不为空'
  }
  return operatorMap[operator] || operator
}

const formatFilterValue = (value: any) => {
  if (value === null || value === undefined) return '空值'
  if (typeof value === 'string' && value.includes('%')) {
    return value.replace(/%/g, '')
  }
  return String(value)
}

// 获取图表类型标签
const getChartTypeLabel = (chartType: string) => {
  const typeMap: Record<string, string> = {
    'bar': '柱状图',
    'line': '折线图',
    'pie': '饼图',
    'table': '表格',
    'scatter': '散点图',
    'area': '面积图'
  }
  return typeMap[chartType] || chartType
}

// 获取字段显示名称
const getFieldDisplayName = (fieldName: string) => {
  const field = datasetFields.value.find(f => f.fieldName === fieldName)
  return field?.displayName || field?.fieldName || fieldName
}

// 格式化单元格值
const formatCellValue = (value: any) => {
  if (value === null || value === undefined) return '-'
  if (typeof value === 'number') {
    return value.toLocaleString()
  }
  return String(value)
}

// 处理字段映射变更
const handleFieldMappingChange = () => {
  emitConfigChange()
}

// 发送配置变更事件
const emitConfigChange = () => {
  if (localConfig.value.datasetId) {
    emit('config-change', {
      datasetId: localConfig.value.datasetId,
      fieldMapping: localConfig.value.fieldMapping,
      filters: localConfig.value.filters,
      isValid: isConfigValid.value
    })
  }
}

// 预览图表
const previewChart = () => {
  if (!isConfigValid.value) {
    ElMessage.warning('请完成字段映射配置')
    return
  }
  
  emit('preview-chart', {
    datasetId: localConfig.value.datasetId,
    fieldMapping: localConfig.value.fieldMapping,
    filters: localConfig.value.filters,
    chartType: props.chartType
  })
}

// 应用配置
const applyConfig = () => {
  if (!isConfigValid.value) {
    ElMessage.warning('请完成字段映射配置')
    return
  }
  
  emitConfigChange()
  ElMessage.success('配置已应用')
}

// 获取字段样本数据
const getFieldSample = (fieldType: 'nameField' | 'valueField' | 'xField' | 'yField' | 'groupField' | 'sizeField') => {
  const fieldName = localConfig.value.fieldMapping[fieldType]
  if (!fieldName || previewData.value.length === 0) {
    return '无'
  }
  
  const sampleValues = previewData.value.slice(0, 3).map(row => row[fieldName])
  return sampleValues.join(', ')
}

// 转换器相关方法
const handleTransformResult = (result: any) => {
  console.log('转换结果:', result)
  chartPreviewData.value = result
  
  // 自动渲染图表
  nextTick(() => {
    if (result.echartsOption) {
      renderChart()
    }
  })
}

const handleTransformError = (error: Error) => {
  console.error('转换失败:', error)
  ElMessage.error(`数据转换失败: ${error.message}`)
  chartPreviewData.value = null
}

const handleTransformerChange = (transformerId: string) => {
  selectedTransformerType.value = transformerId
  console.log('转换器已切换:', transformerId)
}

const renderChart = async () => {
  if (!chartPreviewData.value?.echartsOption || !chartContainer.value) {
    return
  }
  
  renderingChart.value = true
  
  try {
    // 初始化或获取图表实例
    if (!chartInstance.value) {
      chartInstance.value = echarts.init(chartContainer.value)
    }
    
    // 设置图表配置
    chartInstance.value.setOption(chartPreviewData.value.echartsOption, true)
    
    // 监听窗口大小变化
    const resizeHandler = () => {
      chartInstance.value?.resize()
    }
    window.addEventListener('resize', resizeHandler)
    
    ElMessage.success('图表渲染完成')
  } catch (error) {
    console.error('图表渲染失败:', error)
    ElMessage.error('图表渲染失败')
  } finally {
    renderingChart.value = false
  }
}

// 清理图表实例
const cleanupChart = () => {
  if (chartInstance.value) {
    chartInstance.value.dispose()
    chartInstance.value = null
  }
}

// 组件挂载时加载数据
onMounted(() => {
  loadDatasets()
})

// 监听图表类型变化，重置字段映射
watch(() => props.chartType, () => {
  localConfig.value.fieldMapping = {}
  emitConfigChange()
})

// 监听过滤条件变化，重新加载预览
watch(() => localConfig.value.filters, () => {
  if (selectedDataset.value) {
    loadDatasetPreview()
  }
}, { deep: true })

// 生命周期钩子
onUnmounted(() => {
  cleanupChart()
})
</script>

<style lang="scss" scoped>
.dataset-config-panel {
  padding: 16px;
  
  .config-card {
    height: 100%;
  }

  .card-header {
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 600;
  }

  .config-section {
    margin-bottom: 24px;
    
    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }
    
    .section-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
      font-weight: 600;
      color: #303133;
      margin: 0 0 12px 0;
      
      .record-count {
        font-size: 12px;
        color: #909399;
        font-weight: normal;
      }
    }
  }
  
  .dataset-option {
    .dataset-name {
      font-weight: 500;
      color: #303133;
    }
    
    .dataset-desc {
      font-size: 12px;
      color: #909399;
      margin-top: 2px;
    }
  }

  // 过滤条件样式
  .filter-conditions {
    .filter-item {
      margin-bottom: 12px;
      
      .filter-content {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px;
        background: #f8f9fa;
        border: 1px solid #e9ecef;
        border-radius: 6px;
        
        .filter-info {
          display: flex;
          gap: 8px;
          align-items: center;
          flex: 1;
          
          .filter-field {
            font-weight: 500;
            color: #409eff;
          }
          
          .filter-operator {
            color: #909399;
            font-size: 12px;
          }
          
          .filter-value {
            color: #303133;
            font-family: monospace;
            background: #fff;
            padding: 2px 6px;
            border-radius: 3px;
            border: 1px solid #dcdfe6;
          }
        }
      }
    }
  }
  
  .preview-container {
    border: 1px solid #e4e7ed;
    border-radius: 4px;
    overflow: hidden;
    
    .more-data-hint {
      padding: 8px 12px;
      background: #f5f7fa;
      border-top: 1px solid #e4e7ed;
      text-align: center;
    }
  }
  
  .field-mapping-config {
    .field-option {
      display: flex;
      justify-content: space-between;
      align-items: center;
      width: 100%;
      
      .field-name {
        flex: 1;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
    }
    
    .field-sample {
      font-size: 12px;
      color: #909399;
      margin-top: 4px;
      font-style: italic;
    }
  }
  
  .config-actions {
    display: flex;
    gap: 12px;
    justify-content: center;
    padding-top: 16px;
    border-top: 1px solid #e4e7ed;
  }
  
  // 图表预览样式
  .chart-preview-container {
    margin-top: 16px;
    border: 1px solid #e4e7ed;
    border-radius: 4px;
    padding: 16px;
    
    .chart-preview {
      border: 1px dashed #d9d9d9;
      border-radius: 4px;
      background-color: #fafafa;
    }
  }
}

:deep(.el-form-item) {
  margin-bottom: 16px;
  
  .el-form-item__label {
    font-size: 13px;
    font-weight: 500;
  }
}

:deep(.el-transfer) {
  .el-transfer-panel {
    width: 180px;
  }
}

:deep(.el-table) {
  font-size: 12px;
  
  .el-table__header {
    th {
      background: #f5f7fa;
      font-weight: 600;
    }
  }
  
  .el-table__body {
    td {
      padding: 8px 0;
    }
  }
}
</style> 