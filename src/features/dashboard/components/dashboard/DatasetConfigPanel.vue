<template>
  <div class="dataset-config-panel">
    <el-card class="config-card">
      <template #header>
        <div class="card-header">
          <el-icon><DataBoard /></el-icon>
          <span>数据源配置</span>
        </div>
      </template>

      <!-- 数据集选择 -->
      <div class="config-section">
              <h4 class="section-title">
        <span>📊 数据集选择</span>
      </h4>
        <el-select
          v-model="localConfig.datasetId"
          @change="handleDatasetChange"
          placeholder="请选择数据集"
          style="width: 100%"
          :loading="datasetsLoading"
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
        <h4 class="section-title">
          <el-icon><Connection /></el-icon>
          <span>字段映射</span>
        </h4>
        
        <!-- 图表类型特定的字段配置 -->
        <div class="field-mapping-config">
          <!-- 柱状图、折线图、面积图 -->
          <template v-if="['bar', 'line', 'area'].includes(chartType)">
            <el-form-item label="X轴字段（维度）" required>
              <el-select
                v-model="localConfig.fieldMapping.xField"
                @change="handleFieldMappingChange"
                :placeholder="placeholderTexts.xField"
                style="width: 100%"
              >
                <el-option
                  v-for="field in dimensionFields"
                  :key="field.fieldName"
                  :label="field.displayName || field.fieldName"
                  :value="field.fieldName"
                >
                  <div class="field-option">
                    <span class="field-name">{{ field.displayName || field.fieldName }}</span>
                    <el-tag size="small" type="success">{{ field.dataType }}</el-tag>
                  </div>
                </el-option>
              </el-select>
            </el-form-item>
            
            <el-form-item label="Y轴字段（指标）" required>
              <el-select
                v-model="localConfig.fieldMapping.yField"
                @change="handleFieldMappingChange"
                :placeholder="placeholderTexts.yField"
                style="width: 100%"
              >
                <el-option
                  v-for="field in metricFields"
                  :key="field.fieldName"
                  :label="field.displayName || field.fieldName"
                  :value="field.fieldName"
                >
                  <div class="field-option">
                    <span class="field-name">{{ field.displayName || field.fieldName }}</span>
                    <el-tag size="small" type="warning">{{ field.aggregation || 'sum' }}</el-tag>
                  </div>
                </el-option>
              </el-select>
            </el-form-item>
            
            <!-- 分组字段（可选） -->
            <el-form-item label="分组字段（可选）">
              <el-select
                v-model="localConfig.fieldMapping.groupField"
                @change="handleFieldMappingChange"
                :placeholder="placeholderTexts.groupField"
                style="width: 100%"
                clearable
              >
                <el-option
                  v-for="field in dimensionFields"
                  :key="field.fieldName"
                  :label="field.displayName || field.fieldName"
                  :value="field.fieldName"
                >
                  <div class="field-option">
                    <span class="field-name">{{ field.displayName || field.fieldName }}</span>
                    <el-tag size="small" type="success">{{ field.dataType }}</el-tag>
                  </div>
                </el-option>
              </el-select>
            </el-form-item>
            
            <!-- 数据预览提示 -->
            <div v-if="previewData.length > 0" class="field-preview-hint">
              <el-text type="info" size="small">
                数据预览：{{ previewData.length }}条记录，
                X轴示例：{{ getFieldSample('xField') }}，
                Y轴示例：{{ getFieldSample('yField') }}
                <span v-if="localConfig.fieldMapping.groupField">，分组示例：{{ getFieldSample('groupField') }}</span>
              </el-text>
            </div>
          </template>
          
                  <!-- 饼图 -->
        <template v-else-if="chartType === 'pie'">
          <el-form-item label="名称字段（维度）" required>
            <el-select
              v-model="localConfig.fieldMapping.nameField"
              @change="handleFieldMappingChange"
              :placeholder="placeholderTexts.nameField"
              style="width: 100%"
            >
              <el-option
                v-for="field in dimensionFields"
                :key="field.fieldName"
                :label="field.displayName || field.fieldName"
                :value="field.fieldName"
              >
                <div class="field-option">
                  <span class="field-name">{{ field.displayName || field.fieldName }}</span>
                  <el-tag size="small" type="success">{{ field.dataType }}</el-tag>
                </div>
              </el-option>
            </el-select>
          </el-form-item>
          
          <el-form-item label="数值字段（指标）" required>
            <el-select
              v-model="localConfig.fieldMapping.valueField"
              @change="handleFieldMappingChange"
              :placeholder="placeholderTexts.valueField"
              style="width: 100%"
            >
              <el-option
                v-for="field in metricFields"
                :key="field.fieldName"
                :label="field.displayName || field.fieldName"
                :value="field.fieldName"
              >
                <div class="field-option">
                  <span class="field-name">{{ field.displayName || field.fieldName }}</span>
                  <el-tag size="small" type="warning">{{ field.aggregation || 'sum' }}</el-tag>
                </div>
              </el-option>
            </el-select>
          </el-form-item>
          
          <!-- 数据预览提示 -->
          <div v-if="previewData.length > 0" class="field-preview-hint">
            <el-text type="info" size="small">
              数据预览：{{ previewData.length }}条记录，
              名称示例：{{ getFieldSample('nameField') }}，
              数值示例：{{ getFieldSample('valueField') }}
            </el-text>
          </div>
        </template>
          
          <!-- 表格 -->
          <template v-else-if="chartType === 'table'">
            <el-form-item label="显示字段">
              <el-transfer
                v-model="localConfig.fieldMapping.tableFields"
                @change="handleFieldMappingChange"
                :data="allFieldsForTransfer"
                :titles="['可用字段', '显示字段']"
                style="width: 100%"
              />
            </el-form-item>
          </template>
          
          <!-- 散点图 -->
          <template v-else-if="chartType === 'scatter'">
            <el-form-item label="X轴字段（支持维度和指标）" required>
              <el-select
                v-model="localConfig.fieldMapping.xField"
                @change="handleFieldMappingChange"
                :placeholder="placeholderTexts.xField"
                style="width: 100%"
              >
                <el-option
                  v-for="field in allFields"
                  :key="field.fieldName"
                  :label="field.displayName || field.fieldName"
                  :value="field.fieldName"
                >
                  <div class="field-option">
                    <span class="field-name">{{ field.displayName || field.fieldName }}</span>
                    <el-tag size="small" :type="field.fieldType === 'dimension' ? 'success' : 'warning'">
                      {{ field.fieldType === 'dimension' ? field.dataType : (field.aggregation || 'sum') }}
                    </el-tag>
                  </div>
                </el-option>
              </el-select>
            </el-form-item>
            
            <el-form-item label="Y轴字段（支持维度和指标）" required>
              <el-select
                v-model="localConfig.fieldMapping.yField"
                @change="handleFieldMappingChange"
                :placeholder="placeholderTexts.yField"
                style="width: 100%"
              >
                <el-option
                  v-for="field in allFields"
                  :key="field.fieldName"
                  :label="field.displayName || field.fieldName"
                  :value="field.fieldName"
                >
                  <div class="field-option">
                    <span class="field-name">{{ field.displayName || field.fieldName }}</span>
                    <el-tag size="small" :type="field.fieldType === 'dimension' ? 'success' : 'warning'">
                      {{ field.fieldType === 'dimension' ? field.dataType : (field.aggregation || 'sum') }}
                    </el-tag>
                  </div>
                </el-option>
              </el-select>
            </el-form-item>
            
            <!-- 气泡大小字段（可选） -->
            <el-form-item label="气泡大小字段（可选）">
              <el-select
                v-model="localConfig.fieldMapping.sizeField"
                @change="handleFieldMappingChange"
                :placeholder="placeholderTexts.sizeField"
                style="width: 100%"
                clearable
              >
                <el-option
                  v-for="field in metricFields"
                  :key="field.fieldName"
                  :label="field.displayName || field.fieldName"
                  :value="field.fieldName"
                >
                  <div class="field-option">
                    <span class="field-name">{{ field.displayName || field.fieldName }}</span>
                    <el-tag size="small" type="warning">{{ field.aggregation || 'sum' }}</el-tag>
                  </div>
                </el-option>
              </el-select>
            </el-form-item>
            
            <!-- 数据预览提示 -->
            <div v-if="previewData.length > 0" class="field-preview-hint">
              <el-text type="info" size="small">
                数据预览：{{ previewData.length }}条记录，
                X轴示例：{{ getFieldSample('xField') }}，
                Y轴示例：{{ getFieldSample('yField') }}
                <span v-if="localConfig.fieldMapping.sizeField">，气泡大小示例：{{ getFieldSample('sizeField') }}</span>
              </el-text>
            </div>
          </template>
        </div>
      </div>

      <!-- 配置预览和应用 -->
      <div v-if="selectedDataset" class="config-actions">
        <el-button 
          @click="previewChart" 
          :disabled="!isConfigValid"
          :loading="previewLoading"
          type="primary"
          icon="View"
        >
          预览图表
        </el-button>
        <el-button 
          @click="applyConfig" 
          :disabled="!isConfigValid"
          type="success"
          icon="Check"
        >
          应用配置
        </el-button>
      </div>

      <!-- 配置状态提示 -->
      <div v-if="selectedDataset" class="config-status">
        <el-alert
          v-if="!isConfigValid"
          title="配置不完整"
          description="请完成必要的字段映射配置"
          type="warning"
          :closable="false"
          show-icon
        />
        <el-alert
          v-else
          title="配置有效"
          description="字段映射配置完成，可以预览或应用"
          type="success"
          :closable="false"
          show-icon
        />
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { 
  View, 
  Connection, 
  Refresh, 
  Check
} from '@element-plus/icons-vue'
import type { DataSet, DataSetField } from '@/shared/types/dataManagement'
import type { ChartFieldMapping } from '@/shared/types/dashboard'
import { dataSetApi } from '@/api/dataSource'
import { previewDatasetData } from '@/api/dataset'

// Props定义
interface Props {
  chartType: 'bar' | 'line' | 'pie' | 'table' | 'image' | 'scatter' | 'area'
  initialConfig?: {
    datasetId?: number
    fieldMapping?: ChartFieldMapping
  }
}

const props = withDefaults(defineProps<Props>(), {
  initialConfig: () => ({ datasetId: undefined, fieldMapping: {} })
})

// Emits定义
const emit = defineEmits<{
  'config-change': [{
    datasetId: number
    fieldMapping: ChartFieldMapping
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

// 本地配置状态
const localConfig = ref<{
  datasetId?: number
  fieldMapping: ChartFieldMapping
}>({
  datasetId: props.initialConfig.datasetId,
  fieldMapping: props.initialConfig.fieldMapping || {}
})

// 计算属性
const dimensionFields = computed(() => 
  datasetFields.value.filter(field => field.fieldType === 'dimension')
)

const metricFields = computed(() => 
  datasetFields.value.filter(field => field.fieldType === 'metric')
)

const allFields = computed(() => datasetFields.value)

// 动态placeholder文本
const placeholderTexts = computed(() => {
  // 基础提示文本
  const baseTexts = {
    xField: '请选择X轴字段',
    yField: '请选择Y轴字段', 
    nameField: '请选择名称字段',
    valueField: '请选择数值字段',
    groupField: '请选择分组字段',
    sizeField: '请选择气泡大小字段'
  }

  // 如果没有数据集或字段数据，返回基础文本
  if (!selectedDataset.value || datasetFields.value.length === 0) {
    return baseTexts
  }

  // 如果有字段但没有预览数据，返回基础文本
  if (previewData.value.length === 0) {
    return baseTexts
  }

  // 从接口预览数据中获取字段示例值
  const getFieldExample = (fieldType: 'dimension' | 'metric', index = 0) => {
    const fields = fieldType === 'dimension' ? dimensionFields.value : metricFields.value
    if (fields.length <= index) return null
    
    const field = fields[index]
    const fieldName = field.fieldName
    const displayName = field.displayName || field.fieldName
    
    // 从预览数据中获取实际示例值
    if (previewData.value.length > 0) {
      const sampleValues = previewData.value.slice(0, 2).map(row => row[fieldName]).filter(v => v !== null && v !== undefined)
      if (sampleValues.length > 0) {
        const examples = sampleValues.join('、')
        return `选择${displayName}（如：${examples}）`
      }
    }
    
    return `选择${displayName}`
  }

  return {
    xField: getFieldExample('dimension', 0) || baseTexts.xField,
    yField: getFieldExample('metric', 0) || baseTexts.yField,
    nameField: getFieldExample('dimension', 0) || baseTexts.nameField,
    valueField: getFieldExample('metric', 0) || baseTexts.valueField,
    groupField: getFieldExample('dimension', 1) || baseTexts.groupField,
    sizeField: getFieldExample('metric', 1) || baseTexts.sizeField
  }
})

const allFieldsForTransfer = computed(() => 
  allFields.value.map(field => ({
    key: field.fieldName,
    label: field.displayName || field.fieldName,
    disabled: false
  }))
)

// 验证配置是否有效
const isConfigValid = computed(() => {
  if (!localConfig.value.datasetId) return false
  
  const mapping = localConfig.value.fieldMapping
  
  switch (props.chartType) {
    case 'bar':
    case 'line':
    case 'area':
      return !!(mapping.xField && mapping.yField)
    case 'pie':
      return !!(mapping.nameField && mapping.valueField)
    case 'scatter':
      return !!(mapping.xField && mapping.yField)
    case 'table':
      return !!(mapping.tableFields && mapping.tableFields.length > 0)
    default:
      return true
  }
})

// 加载数据集列表
const loadDatasets = async () => {
  try {
    datasetsLoading.value = true
    const response = await dataSetApi.getDatasets()
    datasets.value = response.data || []
    
    console.log('数据集配置面板：加载数据集列表成功', datasets.value.length)
    
    // 如果有初始数据集ID，自动选择
    if (localConfig.value.datasetId) {
      const dataset = datasets.value.find(d => d.id === localConfig.value.datasetId)
      if (dataset) {
        selectedDataset.value = dataset
        await loadDatasetFields(dataset)
        await loadDatasetPreview()
      }
    }
  } catch (error) {
    console.error('加载数据集列表失败:', error)
    ElMessage.error('加载数据集列表失败')
  } finally {
    datasetsLoading.value = false
  }
}

// 处理数据集变更
const handleDatasetChange = async (datasetId: number) => {
  const dataset = datasets.value.find(d => d.id === datasetId)
  if (!dataset) return
  
  selectedDataset.value = dataset
  localConfig.value.datasetId = datasetId
  
  // 立即重置字段映射，清空所有字段选择
  localConfig.value.fieldMapping = {
    xField: '',
    yField: '',
    nameField: '',
    valueField: '',
    groupField: '',
    sizeField: '',
    tableFields: []
  }
  
  // 先清空数据相关状态
  datasetFields.value = []
  previewData.value = []
  previewColumns.value = []
  
  // 加载数据集字段和预览数据
  await loadDatasetFields(dataset)
  await loadDatasetPreview()
  
  // 触发配置变更事件
  emitConfigChange()
}

// 加载数据集字段
const loadDatasetFields = async (dataset: DataSet) => {
  try {
    if (dataset.fields && dataset.fields.length > 0) {
      datasetFields.value = dataset.fields
    } else {
      const fields = await dataSetApi.getDatasetFields(dataset)
      datasetFields.value = fields || []
      
      // 更新数据集对象中的字段
      dataset.fields = datasetFields.value
    }
    
    console.log('加载数据集字段成功:', datasetFields.value.length)
  } catch (error) {
    console.error('加载数据集字段失败:', error)
    ElMessage.error('加载数据集字段失败')
    datasetFields.value = []
  }
}

// 加载数据集预览数据
const loadDatasetPreview = async () => {
  if (!selectedDataset.value) return
  
  try {
    previewLoading.value = true
    console.log(`加载数据集预览: ${selectedDataset.value.name} (ID: ${selectedDataset.value.id})`)
    
    const response = await previewDatasetData(selectedDataset.value.id)
    
    if (response.code === 200 && response.data) {
      // 处理分页数据结构：{ content: any[], totalElements: number, ... }
      if (response.data.content && Array.isArray(response.data.content)) {
        previewData.value = response.data.content
        if (previewData.value.length > 0) {
          previewColumns.value = Object.keys(previewData.value[0])
        } else {
          previewColumns.value = []
        }
      } else {
        previewData.value = []
        previewColumns.value = []
      }
      
      console.log('数据预览加载成功:', previewData.value.length, '条记录')
    } else {
      throw new Error(response.message || '获取预览数据失败')
    }
  } catch (error) {
    console.error('加载数据预览失败:', error)
    ElMessage.error(`加载数据预览失败: ${error.message}`)
    previewData.value = []
    previewColumns.value = []
  } finally {
    previewLoading.value = false
  }
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

// 组件挂载时加载数据
onMounted(() => {
  loadDatasets()
})

// 监听图表类型变化，重置字段映射
watch(() => props.chartType, () => {
  localConfig.value.fieldMapping = {}
  emitConfigChange()
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
  }
  
  .config-actions {
    display: flex;
    gap: 12px;
    margin-bottom: 16px;
  }
  
  .config-status {
    .el-alert {
      margin-bottom: 0;
    }
  }
  
  .cell-content {
    font-size: 12px;
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