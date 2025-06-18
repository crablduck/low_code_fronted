<template>
  <el-dialog
    v-model="visible"
    title="📊 从数据源计算赋值"
    width="1200px"
    :before-close="handleClose"
    class="cell-computed-dialog"
    draggable
  >
    <div class="dialog-content">
      <!-- 左侧：数据源选择 -->
      <div class="left-panel">
        <div class="panel-header">
          <h3>📋 选择数据集</h3>
          <el-button 
            size="small" 
            @click="refreshDatasets"
            :loading="datasetsLoading"
            circle
          >
            <el-icon><Refresh /></el-icon>
          </el-button>
        </div>
        
        <div class="dataset-list">
          <el-radio-group v-model="selectedDatasetId" @change="onDatasetChange">
            <div
              v-for="dataset in datasets"
              :key="dataset.id"
              class="dataset-item"
              :class="{ active: selectedDatasetId === dataset.id }"
            >
              <el-radio :label="dataset.id" class="dataset-radio">
                <div class="dataset-info">
                  <div class="dataset-name">{{ dataset.name }}</div>
                  <div class="dataset-desc">{{ dataset.description }}</div>
                  <div class="dataset-meta">
                    <el-tag size="small" type="info">{{ dataset.fields?.length || 0 }} 字段</el-tag>
                    <el-tag size="small" type="success">{{ dataset.type }}</el-tag>
                  </div>
                </div>
              </el-radio>
            </div>
          </el-radio-group>
        </div>

        <!-- 字段选择器 -->
        <field-selector
          v-if="selectedDataset"
          :dataset="selectedDataset"
          v-model:selected-field="selectedField"
          @field-change="onFieldChange"
        />
      </div>

      <!-- 中间：配置面板 -->
      <div class="center-panel">
        <div class="config-steps">
          <!-- 步骤1：过滤条件 -->
          <el-card class="config-card">
            <template #header>
              <div class="card-header">
                <span>🔍 过滤条件</span>
                <el-button 
                  size="small" 
                  @click="addFilter"
                  :disabled="!selectedDataset"
                >
                  添加条件
                </el-button>
              </div>
            </template>
            
            <filter-configurator
              v-model:filters="filters"
              :dataset="selectedDataset"
              @filter-change="onFilterChange"
            />
          </el-card>

          <!-- 步骤2：计算函数 -->
          <el-card class="config-card">
            <template #header>
              <span>⚡ 计算函数</span>
            </template>
            
            <function-selector
              v-model:selected-function="selectedFunction"
              :field="selectedField"
              @function-change="onFunctionChange"
            />
          </el-card>

          <!-- 步骤3：参数配置 -->
          <el-card class="config-card" v-if="needsParameters">
            <template #header>
              <span>⚙️ 参数配置</span>
            </template>
            
            <parameter-configurator
              v-model:parameters="parameters"
              :function-type="selectedFunction"
              :dataset="selectedDataset"
            />
          </el-card>
        </div>
      </div>

      <!-- 右侧：预览面板 -->
      <div class="right-panel">
        <div class="panel-header">
          <h3>👁️ 预览结果</h3>
          <el-button 
            size="small" 
            @click="previewResult"
            :loading="previewLoading"
            type="primary"
            :disabled="!canPreview"
          >
            刷新预览
          </el-button>
        </div>

        <preview-table
          :preview-data="previewData"
          :computed-result="computedResult"
          :loading="previewLoading"
          @preview-update="onPreviewUpdate"
        />

        <!-- 计算结果展示 -->
        <div class="result-display" v-if="computedResult !== null">
          <div class="result-label">计算结果：</div>
          <div class="result-value">{{ computedResult }}</div>
          <div class="result-meta">
            <el-tag size="small">{{ selectedFunction }}</el-tag>
            <el-tag size="small" type="info">{{ previewData?.length || 0 }} 条记录</el-tag>
          </div>
        </div>
      </div>
    </div>

    <!-- 底部操作栏 -->
    <template #footer>
      <div class="dialog-footer">
        <div class="footer-left">
          <el-checkbox v-model="autoRefresh">自动刷新</el-checkbox>
          <el-checkbox v-model="saveBinding">保存绑定关系</el-checkbox>
        </div>
        <div class="footer-right">
          <el-button @click="handleCancel">取消</el-button>
          <el-button @click="handleReset">重置</el-button>
          <el-button 
            type="primary" 
            @click="handleConfirm"
            :disabled="!canConfirm"
            :loading="confirmLoading"
          >
            确认赋值
          </el-button>
        </div>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Refresh } from '@element-plus/icons-vue'
import FieldSelector from './FieldSelector.vue'
import FilterConfigurator from './FilterConfigurator.vue'
import FunctionSelector from './FunctionSelector.vue'
import ParameterConfigurator from './ParameterConfigurator.vue'
import PreviewTable from './PreviewTable.vue'
import type { DataSet, DataSetField } from '@/shared/types/dataManagement'
import type { FilterCondition, ComputeConfig } from '@/shared/types/data-compute'
import { mainService } from '@/shared/utils/request'

// Props & Emits
interface Props {
  cellInfo?: {
    row: number
    col: number
    sheetId: string
  }
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'confirmed': [result: {
    value: any
    bindingInfo: ComputeConfig
    cellInfo: Props['cellInfo']
  }]
  'cancelled': []
}>()

// 响应式数据
const visible = ref(false)
const datasetsLoading = ref(false)
const previewLoading = ref(false)
const confirmLoading = ref(false)

// 数据集相关
const datasets = ref<DataSet[]>([])
const selectedDatasetId = ref<string>('')
const selectedDataset = computed(() => 
  datasets.value.find(d => d.id === selectedDatasetId.value)
)

// 字段选择
const selectedField = ref<DataSetField | null>(null)

// 过滤条件
const filters = ref<FilterCondition[]>([])

// 计算函数
const selectedFunction = ref<string>('')

// 参数配置
const parameters = ref<Record<string, any>>({})

// 预览数据
const previewData = ref<any[]>([])
const computedResult = ref<any>(null)

// 配置选项
const autoRefresh = ref(true)
const saveBinding = ref(true)

// 计算属性
const needsParameters = computed(() => {
  return ['CUSTOM', 'PERCENTILE', 'RANK'].includes(selectedFunction.value)
})

const canPreview = computed(() => {
  return selectedDataset.value && selectedField.value && selectedFunction.value
})

const canConfirm = computed(() => {
  return canPreview.value && computedResult.value !== null
})

// 内部状态
const currentCellInfo = ref<Props['cellInfo']>()

// 方法
const show = (cellInfo?: Props['cellInfo']) => {
  visible.value = true
  if (cellInfo) {
    // 设置当前单元格信息
    currentCellInfo.value = cellInfo
  }
  loadDatasets()
}

const hide = () => {
  visible.value = false
}

const handleClose = () => {
  ElMessageBox.confirm('确定要关闭配置面板吗？未保存的配置将丢失。', '确认关闭', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    hide()
    emit('cancelled')
  }).catch(() => {
    // 用户取消关闭
  })
}

const loadDatasets = async () => {
  try {
    datasetsLoading.value = true
    const result = await mainService.get('/api/datasets')
    
    if (result && result.data) {
      datasets.value = result.data
    } else {
      throw new Error('获取数据集失败')
    }
  } catch (error: any) {
    console.error('加载数据集失败:', error)
    ElMessage.error('加载数据集失败: ' + (error.message || '网络错误'))
  } finally {
    datasetsLoading.value = false
  }
}

const refreshDatasets = () => {
  loadDatasets()
}

const onDatasetChange = () => {
  // 清空之前的选择
  selectedField.value = null
  filters.value = []
  selectedFunction.value = ''
  parameters.value = {}
  previewData.value = []
  computedResult.value = null
}

const onFieldChange = () => {
  if (autoRefresh.value) {
    previewResult()
  }
}

const onFilterChange = () => {
  if (autoRefresh.value) {
    previewResult()
  }
}

const onFunctionChange = () => {
  if (autoRefresh.value) {
    previewResult()
  }
}

const addFilter = () => {
  if (!selectedDataset.value) return
  
  filters.value.push({
    id: Date.now().toString(),
    field: '',
    operator: '=',
    value: '',
    dataType: 'string'
  })
}

const previewResult = async () => {
  if (!canPreview.value) return

  try {
    previewLoading.value = true
    
    const computeConfig: ComputeConfig = {
      datasetId: selectedDatasetId.value,
      field: selectedField.value!.fieldName,
      aggregate: selectedFunction.value,
      filters: filters.value,
      parameters: parameters.value
    }

    // 请求预览数据
    const result = await mainService.post('/api/dataset/compute', computeConfig)
    
    if (result && result.data) {
      previewData.value = result.data.preview || []
      computedResult.value = result.data.result
    } else {
      throw new Error('预览计算失败')
    }
  } catch (error) {
    console.error('预览计算失败:', error)
    ElMessage.error('预览计算失败')
  } finally {
    previewLoading.value = false
  }
}

const onPreviewUpdate = () => {
  // 预览数据更新的回调
}

const handleCancel = () => {
  hide()
  emit('cancelled')
}

const handleReset = () => {
  selectedDatasetId.value = ''
  selectedField.value = null
  filters.value = []
  selectedFunction.value = ''
  parameters.value = {}
  previewData.value = []
  computedResult.value = null
}

const handleConfirm = async () => {
  if (!canConfirm.value) return

  try {
    confirmLoading.value = true

    const bindingInfo: ComputeConfig = {
      bindType: 'dataSourceComputed',
      datasetId: selectedDatasetId.value,
      field: selectedField.value!.fieldName,
      aggregate: selectedFunction.value,
      filters: filters.value,
      parameters: parameters.value,
      // 额外信息
      datasetName: selectedDataset.value!.name,
      fieldLabel: selectedField.value!.displayName,
      createdAt: new Date().toISOString()
    }

    emit('confirmed', {
      value: computedResult.value,
      bindingInfo,
      cellInfo: currentCellInfo.value
    })

    ElMessage.success('计算结果已写入单元格')
    hide()
  } catch (error) {
    console.error('确认赋值失败:', error)
    ElMessage.error('确认赋值失败')
  } finally {
    confirmLoading.value = false
  }
}

// 监听自动刷新
watch([selectedField, filters, selectedFunction, parameters], () => {
  if (autoRefresh.value && canPreview.value) {
    previewResult()
  }
}, { deep: true })

// 暴露方法给父组件
defineExpose({
  show,
  hide
})

// 生命周期
onMounted(() => {
  // 监听 Univer 的自定义事件
  window.addEventListener('univer-data-source-compute', handleUniverEvent)
})

onUnmounted(() => {
  window.removeEventListener('univer-data-source-compute', handleUniverEvent)
})

const handleUniverEvent = (event: CustomEvent) => {
  const { cellInfo } = event.detail
  show(cellInfo)
}
</script>

<style scoped>
.cell-computed-dialog {
  .dialog-content {
    display: flex;
    gap: 16px;
    height: 600px;
  }

  .left-panel,
  .right-panel {
    width: 300px;
    flex-shrink: 0;
  }

  .center-panel {
    flex: 1;
    min-width: 400px;
  }

  .panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
    padding: 0 4px;
    
    h3 {
      margin: 0;
      color: #303133;
      font-size: 16px;
    }
  }

  .dataset-list {
    max-height: 200px;
    overflow-y: auto;
    border: 1px solid #e4e7ed;
    border-radius: 6px;
    padding: 8px;
  }

  .dataset-item {
    padding: 8px;
    border-radius: 4px;
    margin-bottom: 8px;
    border: 1px solid transparent;
    transition: all 0.2s;

    &:hover {
      border-color: #409eff;
      background: #f0f9ff;
    }

    &.active {
      border-color: #409eff;
      background: #ecf5ff;
    }

    .dataset-radio {
      width: 100%;
      
      :deep(.el-radio__label) {
        width: 100%;
        padding-left: 8px;
      }
    }

    .dataset-info {
      .dataset-name {
        font-weight: 600;
        color: #303133;
        margin-bottom: 4px;
      }

      .dataset-desc {
        font-size: 12px;
        color: #909399;
        margin-bottom: 6px;
      }

      .dataset-meta {
        display: flex;
        gap: 4px;
      }
    }
  }

  .config-steps {
    display: flex;
    flex-direction: column;
    gap: 16px;
    height: 100%;
  }

  .config-card {
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
  }

  .result-display {
    margin-top: 16px;
    padding: 16px;
    background: #f8f9fa;
    border-radius: 6px;
    border: 1px solid #e9ecef;

    .result-label {
      font-size: 12px;
      color: #666;
      margin-bottom: 8px;
    }

    .result-value {
      font-size: 24px;
      font-weight: 600;
      color: #409eff;
      margin-bottom: 8px;
    }

    .result-meta {
      display: flex;
      gap: 4px;
    }
  }

  .dialog-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .footer-left {
      display: flex;
      gap: 16px;
    }

    .footer-right {
      display: flex;
      gap: 8px;
    }
  }
}

/* 响应式调整 */
@media (max-width: 1024px) {
  .cell-computed-dialog .dialog-content {
    flex-direction: column;
    height: auto;
  }

  .left-panel,
  .right-panel {
    width: 100%;
  }

  .center-panel {
    min-width: auto;
  }
}
</style> 