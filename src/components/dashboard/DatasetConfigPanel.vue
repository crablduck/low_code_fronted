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
        <h4>选择数据集</h4>
        <el-select
          v-model="selectedDatasetId"
          placeholder="请选择数据集"
          clearable
          filterable
          @change="handleDatasetChange"
          style="width: 100%"
        >
          <el-option
            v-for="dataset in datasets"
            :key="dataset.id"
            :label="dataset.name"
            :value="dataset.id"
          >
            <div class="dataset-option">
              <span class="dataset-name">{{ dataset.name }}</span>
              <el-tag 
                :type="dataset.status === 'active' ? 'success' : 'info'" 
                size="small"
              >
                {{ dataset.status === 'active' ? '活跃' : '非活跃' }}
              </el-tag>
            </div>
          </el-option>
        </el-select>
        
        <!-- 数据集信息展示 -->
        <div v-if="selectedDataset" class="dataset-info">
          <el-descriptions :column="1" size="small">
            <el-descriptions-item label="描述">
              {{ selectedDataset.description || '无' }}
            </el-descriptions-item>
            <el-descriptions-item label="数据源">
              {{ selectedDataset.dataSourceName }}
            </el-descriptions-item>
            <el-descriptions-item label="查询类型">
              <el-tag :type="getQueryTypeStyle(selectedDataset.queryType)">
                {{ getQueryTypeLabel(selectedDataset.queryType) }}
              </el-tag>
            </el-descriptions-item>
          </el-descriptions>
        </div>
      </div>

      <!-- 字段映射配置 -->
      <div v-if="selectedDataset && availableFields.length > 0" class="config-section">
        <div class="section-header">
          <h4>字段映射</h4>
          <el-button 
            size="small" 
            type="primary" 
            link 
            @click="applySuggestedMapping"
          >
            智能推荐
          </el-button>
        </div>

        <!-- 柱状图/折线图配置 -->
        <div v-if="chartType === 'bar' || chartType === 'line'" class="mapping-config">
          <el-form-item label="X轴字段" required>
            <el-select 
              v-model="fieldMapping.xField" 
              placeholder="选择X轴字段"
              @change="validateAndEmit"
            >
              <el-option
                v-for="field in availableFields"
                :key="field"
                :label="field"
                :value="field"
              />
            </el-select>
          </el-form-item>
          
          <el-form-item label="Y轴字段" required>
            <el-select 
              v-model="fieldMapping.yField" 
              placeholder="选择Y轴字段"
              @change="validateAndEmit"
            >
              <el-option
                v-for="field in availableFields"
                :key="field"
                :label="field"
                :value="field"
              />
            </el-select>
          </el-form-item>
        </div>

        <!-- 饼图配置 -->
        <div v-else-if="chartType === 'pie'" class="mapping-config">
          <el-form-item label="名称字段" required>
            <el-select 
              v-model="fieldMapping.nameField" 
              placeholder="选择名称字段"
              @change="validateAndEmit"
            >
              <el-option
                v-for="field in availableFields"
                :key="field"
                :label="field"
                :value="field"
              />
            </el-select>
          </el-form-item>
          
          <el-form-item label="数值字段" required>
            <el-select 
              v-model="fieldMapping.valueField" 
              placeholder="选择数值字段"
              @change="validateAndEmit"
            >
              <el-option
                v-for="field in availableFields"
                :key="field"
                :label="field"
                :value="field"
              />
            </el-select>
          </el-form-item>
        </div>

        <!-- 表格配置 -->
        <div v-else-if="chartType === 'table'" class="mapping-config">
          <el-form-item label="显示字段">
            <el-select 
              v-model="fieldMapping.tableFields" 
              placeholder="选择要显示的字段"
              multiple
              @change="validateAndEmit"
            >
              <el-option
                v-for="field in availableFields"
                :key="field"
                :label="field"
                :value="field"
              />
            </el-select>
          </el-form-item>
        </div>
      </div>

      <!-- 预览区域 -->
      <div v-if="selectedDataset" class="config-section">
        <div class="section-header">
          <h4>数据预览</h4>
          <el-button 
            size="small" 
            type="primary" 
            link 
            @click="refreshPreview"
            :loading="previewLoading"
          >
            刷新
          </el-button>
        </div>
        
        <div class="preview-area" v-loading="previewLoading">
          <el-table 
            :data="previewData.slice(0, 5)" 
            border 
            size="small" 
            max-height="200"
          >
            <el-table-column
              v-for="column in availableFields"
              :key="column"
              :prop="column"
              :label="column"
              min-width="100"
              show-overflow-tooltip
            />
          </el-table>
          <div class="preview-info">
            显示前5条数据，共 {{ previewData.length }} 条
          </div>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="config-actions">
        <el-button 
          type="primary" 
          @click="applyConfig"
          :disabled="!isConfigValid"
        >
          应用配置
        </el-button>
        <el-button @click="resetConfig">重置</el-button>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { DataBoard } from '@element-plus/icons-vue'
import { dataSetApi } from '@/api/dataSource'
import { 
  getDatasetFields, 
  suggestFieldMapping, 
  validateFieldMapping,
  type ChartConfig 
} from '@/services/dashboardDataService'
import { transformToObjectArray, type DatasetApiResponse, type ChartFieldMapping } from '@/utils/chartDataTransform'
import { previewDatasetData } from '@/api/dataset'
import type { DataSet } from '@/types/dataManagement'

interface Props {
  chartType: 'bar' | 'line' | 'pie' | 'table'
  initialConfig?: Partial<ChartConfig>
}

interface Emits {
  (e: 'configChange', config: {
    datasetId: number
    fieldMapping: ChartFieldMapping
    isValid: boolean
  }): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 响应式数据
const datasets = ref<DataSet[]>([])
const selectedDatasetId = ref<number | null>(props.initialConfig?.datasetId || null)
const selectedDataset = ref<DataSet | null>(null)
const availableFields = ref<string[]>([])
const fieldMapping = ref<ChartFieldMapping>({})
const previewData = ref<any[]>([])
const previewLoading = ref(false)
const loading = ref(false)

// 计算属性
const isConfigValid = computed(() => {
  if (!selectedDatasetId.value || availableFields.value.length === 0) {
    return false
  }
  
  const validation = validateFieldMapping(props.chartType, fieldMapping.value, availableFields.value)
  return validation.valid
})

// 方法
const loadDatasets = async () => {
  try {
    loading.value = true
    const response = await dataSetApi.getDatasets()
    datasets.value = response.data || []
  } catch (error) {
    console.error('加载数据集失败:', error)
    ElMessage.error('加载数据集失败')
  } finally {
    loading.value = false
  }
}

const handleDatasetChange = async (datasetId: number | null) => {
  if (!datasetId) {
    selectedDataset.value = null
    availableFields.value = []
    fieldMapping.value = {}
    previewData.value = []
    return
  }

  try {
    // 找到选中的数据集
    selectedDataset.value = datasets.value.find(ds => ds.id === datasetId) || null
    
    if (!selectedDataset.value) {
      throw new Error('找不到选中的数据集')
    }

    // 获取字段列表
    availableFields.value = await getDatasetFields(datasetId)
    
    // 应用智能推荐
    fieldMapping.value = suggestFieldMapping(props.chartType, availableFields.value)
    
    // 加载预览数据
    await refreshPreview()
    
    // 触发配置变化事件
    validateAndEmit()
    
  } catch (error) {
    console.error('处理数据集变化失败:', error)
    ElMessage.error('处理数据集变化失败')
  }
}

const applySuggestedMapping = () => {
  if (availableFields.value.length === 0) {
    ElMessage.warning('请先选择数据集')
    return
  }
  
  fieldMapping.value = suggestFieldMapping(props.chartType, availableFields.value)
  validateAndEmit()
  ElMessage.success('已应用智能推荐配置')
}

const refreshPreview = async () => {
  if (!selectedDatasetId.value) return
  
  try {
    previewLoading.value = true
    const response = await previewDatasetData(selectedDatasetId.value)
    
    // 直接使用响应数据，因为拦截器已经处理了格式
    if (response.data && response.data.columns && response.data.data) {
      const apiResponse: DatasetApiResponse = {
        code: 200,
        message: '成功',
        data: response.data
      }
      previewData.value = transformToObjectArray(apiResponse)
    } else {
      throw new Error('数据格式不正确')
    }
  } catch (error) {
    console.error('刷新预览数据失败:', error)
    ElMessage.error('刷新预览数据失败')
  } finally {
    previewLoading.value = false
  }
}

const validateAndEmit = () => {
  if (!selectedDatasetId.value) return
  
  emit('configChange', {
    datasetId: selectedDatasetId.value,
    fieldMapping: fieldMapping.value,
    isValid: isConfigValid.value
  })
}

const applyConfig = () => {
  if (!isConfigValid.value) {
    ElMessage.warning('请完善配置信息')
    return
  }
  
  ElMessage.success('配置已应用')
}

const resetConfig = () => {
  selectedDatasetId.value = null
  selectedDataset.value = null
  availableFields.value = []
  fieldMapping.value = {}
  previewData.value = []
}

const getQueryTypeLabel = (type: string) => {
  const labels = {
    'single': '单表',
    'multi': '多表',
    'sql': 'SQL'
  }
  return labels[type] || type
}

const getQueryTypeStyle = (type: string) => {
  const styles = {
    'single': 'success',
    'multi': 'warning',
    'sql': 'info'
  }
  return styles[type] || 'info'
}

// 监听图表类型变化
watch(() => props.chartType, (newType) => {
  if (availableFields.value.length > 0) {
    fieldMapping.value = suggestFieldMapping(newType, availableFields.value)
    validateAndEmit()
  }
})

// 初始化
onMounted(async () => {
  await loadDatasets()
  
  // 如果有初始配置，应用它
  if (props.initialConfig?.datasetId) {
    selectedDatasetId.value = props.initialConfig.datasetId
    await handleDatasetChange(props.initialConfig.datasetId)
    
    if (props.initialConfig.fieldMapping) {
      fieldMapping.value = { ...props.initialConfig.fieldMapping }
      validateAndEmit()
    }
  }
})
</script>

<style scoped>
.dataset-config-panel {
  height: 100%;
}

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
}

.config-section h4 {
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.dataset-option {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.dataset-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dataset-info {
  margin-top: 12px;
  padding: 12px;
  background: var(--el-fill-color-lighter);
  border-radius: 4px;
}

.mapping-config {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.preview-area {
  border: 1px solid var(--el-border-color);
  border-radius: 4px;
  overflow: hidden;
}

.preview-info {
  padding: 8px 12px;
  background: var(--el-fill-color-light);
  font-size: 12px;
  color: var(--el-text-color-secondary);
  text-align: center;
}

.config-actions {
  display: flex;
  gap: 12px;
  padding-top: 16px;
  border-top: 1px solid var(--el-border-color-lighter);
}

.config-actions .el-button {
  flex: 1;
}
</style> 