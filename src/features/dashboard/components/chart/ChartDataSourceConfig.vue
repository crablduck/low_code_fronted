<template>
  <div class="chart-data-source-config">
    <!-- 步骤导航 -->
    <el-steps 
      :active="activeStep" 
      class="config-steps"
      finish-status="success"
      simple
    >
      <el-step title="选择数据集" />
      <el-step title="字段配置" />
      <el-step title="高级配置" />
    </el-steps>

    <!-- 步骤内容 -->
    <div class="step-content">
      <!-- 步骤1：数据集选择 -->
      <div v-if="activeStep === 0" class="step-panel">
        <div class="panel-header">
          <h3>选择数据集</h3>
          <p>选择图表的数据来源</p>
        </div>
        
        <DatasetSelector
          v-model="selectedDatasetId"
          @dataset-change="handleDatasetChange"
          @preview="handlePreview"
        />
      </div>

      <!-- 步骤2：字段配置 -->
      <div v-if="activeStep === 1" class="step-panel">
        <div class="panel-header">
          <h3>字段配置</h3>
          <p>配置图表的X轴、Y轴和其他属性</p>
        </div>

        <div v-if="selectedDataset" class="field-config">
          <!-- 字段分类显示 -->
          <div class="field-groups">
            <!-- 维度字段 -->
            <div class="field-group">
              <h4><el-icon><Grid /></el-icon> 维度字段</h4>
              <div class="field-list">
                <div
                  v-for="field in dimensionFields"
                  :key="field.fieldName"
                  class="field-item"
                  draggable="true"
                  @dragstart="(e) => handleFieldDragStart(e, field)"
                >
                  <el-tag type="info" size="small">
                    <el-icon><Rank /></el-icon>
                    {{ field.displayName || field.fieldName }}
                  </el-tag>
                  <span class="field-description">{{ field.description }}</span>
                </div>
              </div>
            </div>

            <!-- 指标字段 -->
            <div class="field-group">
              <h4><el-icon><TrendCharts /></el-icon> 指标字段</h4>
              <div class="field-list">
                <div
                  v-for="field in metricFields"
                  :key="field.fieldName"
                  class="field-item"
                  draggable="true"
                  @dragstart="(e) => handleFieldDragStart(e, field)"
                >
                  <el-tag type="success" size="small">
                    <el-icon><TrendCharts /></el-icon>
                    {{ field.displayName || field.fieldName }}
                  </el-tag>
                  <span class="field-description">{{ field.description }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- 字段映射配置 -->
          <div class="field-mapping">
            <h4>字段映射</h4>
            
            <!-- X轴配置 -->
            <div class="mapping-item">
              <label>X轴 (维度):</label>
              <div 
                class="drop-zone"
                :class="{ 'drag-over': isDragOver && dragFieldType === 'dimension' }"
                @dragover.prevent="handleDragOver('dimension')"
                @dragleave.prevent="handleDragLeave"
                @drop.prevent="(e) => handleFieldDrop(e, 'x')"
              >
                <el-tag v-if="config.xField" type="info" closable @close="config.xField = ''">
                  {{ getFieldDisplayName(config.xField) }}
                </el-tag>
                <span v-else class="placeholder">拖拽维度字段到此处</span>
              </div>
            </div>

            <!-- Y轴配置 -->
            <div class="mapping-item">
              <label>Y轴 (指标):</label>
              <div 
                class="drop-zone"
                :class="{ 'drag-over': isDragOver && dragFieldType === 'metric' }"
                @dragover.prevent="handleDragOver('metric')"
                @dragleave.prevent="handleDragLeave"
                @drop.prevent="(e) => handleFieldDrop(e, 'y')"
              >
                <el-tag v-if="config.yField" type="success" closable @close="config.yField = ''">
                  {{ getFieldDisplayName(config.yField) }}
                </el-tag>
                <span v-else class="placeholder">拖拽指标字段到此处</span>
              </div>
            </div>

            <!-- 分组字段 (可选) -->
            <div class="mapping-item" v-if="config.type !== 'pie'">
              <label>分组字段 (可选):</label>
              <div 
                class="drop-zone"
                @dragover.prevent="handleDragOver('dimension')"
                @dragleave.prevent="handleDragLeave"
                @drop.prevent="(e) => handleFieldDrop(e, 'group')"
              >
                <el-tag v-if="config.groupField" type="warning" closable @close="config.groupField = ''">
                  {{ getFieldDisplayName(config.groupField) }}
                </el-tag>
                <span v-else class="placeholder">拖拽维度字段到此处</span>
              </div>
            </div>
          </div>
        </div>

        <div v-else class="no-dataset">
          <el-empty description="请先选择数据集" />
        </div>
      </div>

      <!-- 步骤3：高级配置 -->
      <div v-if="activeStep === 2" class="step-panel">
        <div class="panel-header">
          <h3>高级配置</h3>
          <p>配置图表的样式和行为</p>
        </div>

        <el-form :model="config" label-width="120px" class="config-form">
          <el-form-item label="图表标题">
            <el-input v-model="config.title" placeholder="输入图表标题" />
          </el-form-item>

          <el-form-item label="显示图例">
            <el-switch v-model="config.showLegend" />
          </el-form-item>

          <el-form-item label="显示工具箱">
            <el-switch v-model="config.showToolbox" />
          </el-form-item>

          <el-form-item label="数据限制">
            <el-input-number 
              v-model="config.dataLimit" 
              :min="10" 
              :max="1000" 
              :step="10"
            />
          </el-form-item>

          <!-- 筛选条件 -->
          <el-form-item label="筛选条件">
            <div class="filter-config">
              <el-button 
                type="primary" 
                size="small" 
                @click="showFilterDialog = true"
                :disabled="!selectedDataset"
              >
                <el-icon><Search /></el-icon>
                配置筛选条件
              </el-button>
              <span v-if="config.filters && config.filters.length > 0" class="filter-count">
                ({{ config.filters.length }} 个条件)
              </span>
            </div>
          </el-form-item>
        </el-form>
      </div>
    </div>

    <!-- 操作按钮 -->
    <div class="step-actions">
      <el-button v-if="activeStep > 0" @click="previousStep">上一步</el-button>
      <el-button 
        v-if="activeStep < 2" 
        type="primary" 
        @click="nextStep"
        :disabled="!canProceed"
      >
        下一步
      </el-button>
      <el-button 
        v-if="activeStep === 2" 
        type="success" 
        @click="handleConfirm"
        :disabled="!isConfigComplete"
      >
        确认配置
      </el-button>
    </div>

    <!-- 筛选条件配置对话框 -->
    <el-dialog 
      v-model="showFilterDialog" 
      title="配置筛选条件" 
      width="600px"
      @close="handleFilterDialogClose"
    >
      <div class="filter-dialog-content">
        <div v-for="(filter, index) in tempFilters" :key="index" class="filter-item">
          <el-select v-model="filter.field" placeholder="选择字段" style="width: 150px;">
            <el-option
              v-for="field in allFields"
              :key="field.fieldName"
              :label="field.displayName || field.fieldName"
              :value="field.fieldName"
            />
          </el-select>
          
          <el-select v-model="filter.operator" placeholder="条件" style="width: 100px;">
            <el-option label="等于" value="eq" />
            <el-option label="不等于" value="ne" />
            <el-option label="大于" value="gt" />
            <el-option label="小于" value="lt" />
            <el-option label="包含" value="like" />
          </el-select>
          
          <el-input 
            v-model="filter.value" 
            placeholder="筛选值" 
            style="width: 150px;"
          />
          
          <el-button 
            type="danger" 
            size="small" 
            @click="removeFilter(index)"
            :icon="Delete"
          />
        </div>
        
        <el-button 
          type="primary" 
          size="small" 
          @click="addFilter"
          style="margin-top: 10px;"
        >
          添加筛选条件
        </el-button>
      </div>
      
      <template #footer>
        <el-button @click="showFilterDialog = false">取消</el-button>
        <el-button type="primary" @click="confirmFilters">确认</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, emit } from 'vue'
import { ElMessage } from 'element-plus'
import { Grid, Rank, TrendCharts, Search, Delete } from '@element-plus/icons-vue'
import DatasetSelector from '../../../data-management/components/dataset/DatasetSelector.vue'
import type { DataSet, DataSetField } from '@/shared/types/dataManagement'
import type { ChartDataSourceConfig as IChartDataSourceConfig, FilterCondition } from '@/shared/types/dashboard'

interface Props {
  modelValue?: IChartDataSourceConfig
  chartType?: string
}

interface Emits {
  (e: 'update:modelValue', value: IChartDataSourceConfig): void
  (e: 'config-change', config: IChartDataSourceConfig): void
  (e: 'dataset-change', dataset: DataSet | null): void
}

const props = withDefaults(defineProps<Props>(), {
  chartType: 'bar'
})

const emit = defineEmits<Emits>()

// 状态管理
const activeStep = ref(0)
const selectedDatasetId = ref<number | null>(null)
const selectedDataset = ref<DataSet | null>(null)
const showFilterDialog = ref(false)
const isDragOver = ref(false)
const dragFieldType = ref<'dimension' | 'metric' | null>(null)

// 配置对象
const config = ref<IChartDataSourceConfig>({
  datasetId: null,
  type: props.chartType,
  title: '',
  xField: '',
  yField: '',
  groupField: '',
  showLegend: true,
  showToolbox: false,
  dataLimit: 100,
  filters: []
})

// 临时筛选条件
const tempFilters = ref<FilterCondition[]>([])

// 计算属性
const dimensionFields = computed(() => {
  return selectedDataset.value?.fields.filter(f => f.fieldType === 'dimension') || []
})

const metricFields = computed(() => {
  return selectedDataset.value?.fields.filter(f => f.fieldType === 'metric') || []
})

const allFields = computed(() => {
  return selectedDataset.value?.fields || []
})

const canProceed = computed(() => {
  if (activeStep.value === 0) {
    return selectedDatasetId.value !== null
  }
  if (activeStep.value === 1) {
    return config.value.xField && config.value.yField
  }
  return true
})

const isConfigComplete = computed(() => {
  return config.value.datasetId && config.value.xField && config.value.yField
})

// 方法
const handleDatasetChange = (dataset: DataSet | null) => {
  selectedDataset.value = dataset
  config.value.datasetId = dataset?.id || null
  
  // 清空字段配置
  config.value.xField = ''
  config.value.yField = ''
  config.value.groupField = ''
  
  emit('dataset-change', dataset)
}

const handlePreview = (dataset: DataSet) => {
  // 预览数据集
  console.log('预览数据集:', dataset)
}

const handleFieldDragStart = (event: DragEvent, field: DataSetField) => {
  if (event.dataTransfer) {
    event.dataTransfer.setData('field', JSON.stringify(field))
  }
}

const handleDragOver = (fieldType: 'dimension' | 'metric') => {
  isDragOver.value = true
  dragFieldType.value = fieldType
}

const handleDragLeave = () => {
  isDragOver.value = false
  dragFieldType.value = null
}

const handleFieldDrop = (event: DragEvent, targetType: 'x' | 'y' | 'group') => {
  if (!event.dataTransfer) return
  
  const fieldData = JSON.parse(event.dataTransfer.getData('field'))
  const field = fieldData as DataSetField
  
  // 重置拖拽状态
  isDragOver.value = false
  dragFieldType.value = null
  
  // 验证字段类型
  if ((targetType === 'x' || targetType === 'group') && field.fieldType !== 'dimension') {
    ElMessage.warning('该位置只能放置维度字段')
    return
  }
  
  if (targetType === 'y' && field.fieldType !== 'metric') {
    ElMessage.warning('Y轴只能放置指标字段')
    return
  }
  
  // 更新配置
  if (targetType === 'x') {
    config.value.xField = field.fieldName
  } else if (targetType === 'y') {
    config.value.yField = field.fieldName
  } else if (targetType === 'group') {
    config.value.groupField = field.fieldName
  }
  
  updateConfig()
}

const getFieldDisplayName = (fieldName: string) => {
  const field = allFields.value.find(f => f.fieldName === fieldName)
  return field?.displayName || fieldName
}

const nextStep = () => {
  if (canProceed.value && activeStep.value < 2) {
    activeStep.value++
  }
}

const previousStep = () => {
  if (activeStep.value > 0) {
    activeStep.value--
  }
}

const handleConfirm = () => {
  if (isConfigComplete.value) {
    emit('update:modelValue', config.value)
    emit('config-change', config.value)
    ElMessage.success('配置已确认')
  }
}

const addFilter = () => {
  tempFilters.value.push({
    field: '',
    operator: 'eq',
    value: ''
  })
}

const removeFilter = (index: number) => {
  tempFilters.value.splice(index, 1)
}

const confirmFilters = () => {
  config.value.filters = [...tempFilters.value]
  showFilterDialog.value = false
  updateConfig()
}

const handleFilterDialogClose = () => {
  tempFilters.value = [...(config.value.filters || [])]
}

const updateConfig = () => {
  emit('update:modelValue', config.value)
  emit('config-change', config.value)
}

// 监听外部配置变化
watch(() => props.modelValue, (newValue) => {
  if (newValue) {
    config.value = { ...newValue }
    selectedDatasetId.value = newValue.datasetId
  }
}, { immediate: true })

// 初始化临时筛选条件
watch(() => config.value.filters, (newFilters) => {
  tempFilters.value = [...(newFilters || [])]
}, { immediate: true })
</script>

<style scoped>
.chart-data-source-config {
  padding: 20px;
}

.config-steps {
  margin-bottom: 30px;
}

.step-content {
  min-height: 400px;
}

.step-panel {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 20px;
}

.panel-header {
  margin-bottom: 20px;
}

.panel-header h3 {
  margin: 0 0 8px 0;
  color: #303133;
  font-size: 18px;
}

.panel-header p {
  margin: 0;
  color: #909399;
  font-size: 14px;
}

.field-config {
  display: flex;
  gap: 30px;
}

.field-groups {
  flex: 1;
}

.field-group {
  margin-bottom: 20px;
}

.field-group h4 {
  margin: 0 0 12px 0;
  color: #606266;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.field-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.field-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  background: white;
  border-radius: 6px;
  border: 1px solid #e4e7ed;
  cursor: grab;
  transition: all 0.2s;
}

.field-item:hover {
  border-color: #409eff;
  box-shadow: 0 2px 4px rgba(64, 158, 255, 0.12);
}

.field-item:active {
  cursor: grabbing;
}

.field-description {
  font-size: 12px;
  color: #909399;
}

.field-mapping {
  flex: 1;
  background: white;
  border-radius: 8px;
  padding: 20px;
  border: 1px solid #e4e7ed;
}

.field-mapping h4 {
  margin: 0 0 16px 0;
  color: #303133;
}

.mapping-item {
  margin-bottom: 16px;
}

.mapping-item label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #606266;
}

.drop-zone {
  min-height: 40px;
  border: 2px dashed #dcdfe6;
  border-radius: 6px;
  padding: 8px;
  display: flex;
  align-items: center;
  transition: all 0.2s;
}

.drop-zone.drag-over {
  border-color: #409eff;
  background-color: #ecf5ff;
}

.drop-zone .placeholder {
  color: #c0c4cc;
  font-size: 14px;
}

.config-form {
  max-width: 500px;
}

.filter-config {
  display: flex;
  align-items: center;
  gap: 10px;
}

.filter-count {
  color: #909399;
  font-size: 12px;
}

.step-actions {
  margin-top: 30px;
  text-align: center;
  padding-top: 20px;
  border-top: 1px solid #e4e7ed;
}

.step-actions .el-button {
  margin: 0 8px;
}

.no-dataset {
  text-align: center;
  padding: 60px 0;
}

.filter-dialog-content {
  max-height: 300px;
  overflow-y: auto;
}

.filter-item {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

@media (max-width: 768px) {
  .field-config {
    flex-direction: column;
  }
  
  .step-panel {
    padding: 15px;
  }
}
</style> 