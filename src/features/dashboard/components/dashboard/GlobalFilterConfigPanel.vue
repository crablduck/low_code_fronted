<template>
  <div class="global-filter-config-panel">
    <el-card class="config-card">
      <template #header>
        <div class="card-header">
          <el-icon><Filter /></el-icon>
          <span>全局筛选器配置</span>
          <el-button 
            type="primary" 
            size="small" 
            @click="addFilter"
            style="margin-left: auto"
          >
            <el-icon><Plus /></el-icon>
            添加筛选器
          </el-button>
        </div>
      </template>

      <div class="filter-list">
        <div v-if="filters.length === 0" class="empty-state">
          <el-empty description="暂无全局筛选器，点击上方按钮添加">
            <el-button type="primary" @click="addFilter">立即添加</el-button>
          </el-empty>
        </div>

        <el-collapse v-else v-model="activeFilters" accordion>
          <el-collapse-item 
            v-for="(filter, index) in filters" 
            :key="filter.key"
            :title="filter.label || `筛选器${index + 1}`"
            :name="filter.key"
          >
            <template #title>
              <div class="filter-title">
                <el-icon><Filter /></el-icon>
                <span>{{ filter.label || `筛选器${index + 1}` }}</span>
                <el-tag 
                  :type="getControlTypeColor(filter.controlType)" 
                  size="small"
                  style="margin-left: 8px"
                >
                  {{ getControlTypeLabel(filter.controlType) }}
                </el-tag>
                <el-button 
                  type="danger" 
                  size="small" 
                  text 
                  @click.stop="removeFilter(index)"
                  style="margin-left: auto"
                >
                  <el-icon><Delete /></el-icon>
                </el-button>
              </div>
            </template>

            <div class="filter-config">
              <el-form :model="filter" label-width="100px" size="small">
                <!-- 基础配置 -->
                <el-form-item label="筛选器标识" required>
                  <el-input 
                    v-model="filter.key" 
                    placeholder="唯一标识，如：gender"
                    @change="validateAndEmit"
                  />
                </el-form-item>

                <el-form-item label="显示名称" required>
                  <el-input 
                    v-model="filter.label" 
                    placeholder="如：性别"
                    @change="validateAndEmit"
                  />
                </el-form-item>

                <!-- 数据源配置 -->
                <el-form-item label="数据集" required>
                  <el-select 
                    v-model="filter.datasetId" 
                    placeholder="选择数据集"
                    @change="handleDatasetChange(filter, $event)"
                    style="width: 100%"
                  >
                    <el-option
                      v-for="dataset in datasets"
                      :key="dataset.id"
                      :label="dataset.name"
                      :value="dataset.id"
                    />
                  </el-select>
                </el-form-item>

                <el-form-item label="筛选字段" required>
                  <el-select 
                    v-model="filter.fieldName" 
                    placeholder="选择字段"
                    @change="handleFieldChange(filter, $event)"
                    style="width: 100%"
                  >
                    <el-option
                      v-for="field in getDatasetFields(filter.datasetId)"
                      :key="field.fieldName"
                      :label="`${field.displayName} (${field.fieldName})`"
                      :value="field.fieldName"
                    />
                  </el-select>
                </el-form-item>

                <!-- 控件配置 -->
                <el-form-item label="控件类型" required>
                  <el-select 
                    v-model="filter.controlType" 
                    @change="handleControlTypeChange(filter, $event)"
                  >
                    <el-option label="下拉选择" value="select" />
                    <el-option label="多选" value="multiSelect" />
                    <el-option label="日期范围" value="dateRange" />
                    <el-option label="滑块" value="slider" />
                    <el-option label="输入框" value="input" />
                  </el-select>
                </el-form-item>

                <el-form-item label="占位符">
                  <el-input 
                    v-model="filter.placeholder" 
                    placeholder="请输入占位符文本"
                    @change="validateAndEmit"
                  />
                </el-form-item>

                <el-form-item label="是否必填">
                  <el-switch 
                    v-model="filter.required" 
                    @change="validateAndEmit"
                  />
                </el-form-item>

                <!-- 默认值配置 -->
                <el-form-item label="默认值">
                  <div v-if="filter.controlType === 'select'">
                    <el-select 
                      v-model="filter.defaultValue" 
                      placeholder="选择默认值"
                      clearable
                      @change="validateAndEmit"
                    >
                      <el-option
                        v-for="option in filter.options || []"
                        :key="option.value"
                        :label="option.label"
                        :value="option.value"
                      />
                    </el-select>
                  </div>
                  <div v-else-if="filter.controlType === 'multiSelect'">
                    <el-select 
                      v-model="filter.defaultValue" 
                      placeholder="选择默认值"
                      multiple
                      clearable
                      @change="validateAndEmit"
                    >
                      <el-option
                        v-for="option in filter.options || []"
                        :key="option.value"
                        :label="option.label"
                        :value="option.value"
                      />
                    </el-select>
                  </div>
                  <div v-else-if="filter.controlType === 'dateRange'">
                    <el-date-picker
                      v-model="filter.defaultValue"
                      type="daterange"
                      range-separator="至"
                      start-placeholder="开始日期"
                      end-placeholder="结束日期"
                      @change="validateAndEmit"
                    />
                  </div>
                  <div v-else>
                    <el-input 
                      v-model="filter.defaultValue" 
                      placeholder="输入默认值"
                      @change="validateAndEmit"
                    />
                  </div>
                </el-form-item>

                <!-- 选项值配置 -->
                <el-form-item 
                  v-if="filter.controlType === 'select' || filter.controlType === 'multiSelect'"
                  label="选项值"
                >
                  <div class="options-config">
                    <el-button 
                      size="small" 
                      type="primary" 
                      @click="loadFieldOptions(filter)"
                      :loading="loadingOptions"
                    >
                      <el-icon><Refresh /></el-icon>
                      自动加载
                    </el-button>
                    <el-button 
                      size="small" 
                      @click="addManualOption(filter)"
                    >
                      <el-icon><Plus /></el-icon>
                      手动添加
                    </el-button>
                  </div>
                  
                  <div v-if="filter.options && filter.options.length > 0" class="options-list">
                    <div 
                      v-for="(option, optIndex) in filter.options" 
                      :key="optIndex"
                      class="option-item"
                    >
                      <el-input 
                        v-model="option.label" 
                        placeholder="显示名称"
                        size="small"
                        @change="validateAndEmit"
                      />
                      <el-input 
                        v-model="option.value" 
                        placeholder="实际值"
                        size="small"
                        @change="validateAndEmit"
                      />
                      <el-button 
                        size="small" 
                        type="danger" 
                        text
                        @click="removeOption(filter, optIndex)"
                      >
                        <el-icon><Delete /></el-icon>
                      </el-button>
                    </div>
                  </div>
                </el-form-item>
              </el-form>
            </div>
          </el-collapse-item>
        </el-collapse>
      </div>

      <!-- 布局配置 -->
      <el-divider />
      <div class="layout-config">
        <h4>布局配置</h4>
        <el-form :model="layoutConfig" label-width="100px" size="small">
          <el-form-item label="显示位置">
            <el-radio-group v-model="layoutConfig.position" @change="validateAndEmit">
              <el-radio-button label="top">顶部</el-radio-button>
              <el-radio-button label="left">左侧</el-radio-button>
              <el-radio-button label="right">右侧</el-radio-button>
            </el-radio-group>
          </el-form-item>
          <el-form-item label="列数">
            <el-input-number 
              v-model="layoutConfig.columns" 
              :min="1" 
              :max="6" 
              @change="validateAndEmit"
            />
          </el-form-item>
          <el-form-item label="间距">
            <el-input-number 
              v-model="layoutConfig.spacing" 
              :min="0" 
              :max="50" 
              @change="validateAndEmit"
            />
          </el-form-item>
        </el-form>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Filter, Plus, Delete, Refresh } from '@element-plus/icons-vue'
import type { 
  GlobalFilterConfig, 
  DashboardGlobalFilters,
  FilterOption 
} from '@/shared/types/dashboard'
import type { DataSet, DataSetField } from '@/shared/types/dataManagement'
import { dataSetApi } from '@/api/dataSource'
import { previewDatasetData } from '@/api/dataset'

// Props
interface Props {
  modelValue?: DashboardGlobalFilters
  datasets?: DataSet[]
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: () => ({ filters: [] }),
  datasets: () => []
})

// Emits
const emit = defineEmits<{
  'update:modelValue': [value: DashboardGlobalFilters]
}>()

// 响应式数据
const filters = ref<GlobalFilterConfig[]>(props.modelValue?.filters || [])
const layoutConfig = ref({
  position: 'top' as 'top' | 'left' | 'right',
  columns: 3,
  spacing: 16,
  ...props.modelValue?.layout
})
const activeFilters = ref<string[]>([])
const loadingOptions = ref(false)
const datasetFields = ref<Map<number, DataSetField[]>>(new Map())

// 计算属性
const globalFiltersConfig = computed<DashboardGlobalFilters>(() => ({
  filters: filters.value,
  layout: layoutConfig.value
}))

// 监听变化
watch(
  () => props.modelValue,
  (newVal) => {
    if (newVal) {
      filters.value = newVal.filters || []
      layoutConfig.value = { ...layoutConfig.value, ...newVal.layout }
    }
  },
  { deep: true }
)

// 方法
const addFilter = () => {
  const newFilter: GlobalFilterConfig = {
    key: `filter_${Date.now()}`,
    label: '',
    datasetId: 0,
    fieldName: '',
    controlType: 'select',
    options: [],
    required: false
  }
  filters.value.push(newFilter)
  activeFilters.value = [newFilter.key]
  validateAndEmit()
}

const removeFilter = (index: number) => {
  filters.value.splice(index, 1)
  validateAndEmit()
}

const validateAndEmit = () => {
  emit('update:modelValue', globalFiltersConfig.value)
}

const getControlTypeLabel = (type: string) => {
  const labels = {
    select: '下拉选择',
    multiSelect: '多选',
    dateRange: '日期范围',
    slider: '滑块',
    input: '输入框'
  }
  return labels[type as keyof typeof labels] || type
}

const getControlTypeColor = (type: string) => {
  const colors = {
    select: '',
    multiSelect: 'success',
    dateRange: 'warning',
    slider: 'info',
    input: 'danger'
  }
  return colors[type as keyof typeof colors] || ''
}

const handleDatasetChange = async (filter: GlobalFilterConfig, datasetId: number) => {
  filter.datasetId = datasetId
  filter.fieldName = ''
  filter.options = []
  
  // 加载数据集字段
  if (datasetId && !datasetFields.value.has(datasetId)) {
    try {
      const dataset = props.datasets.find(d => d.id === datasetId)
      if (dataset) {
        datasetFields.value.set(datasetId, dataset.fields || [])
      }
    } catch (error) {
      console.error('加载数据集字段失败:', error)
    }
  }
  
  validateAndEmit()
}

const handleFieldChange = (filter: GlobalFilterConfig, fieldName: string) => {
  filter.fieldName = fieldName
  filter.options = []
  validateAndEmit()
}

const handleControlTypeChange = (filter: GlobalFilterConfig, type: string) => {
  filter.controlType = type as any
  filter.defaultValue = undefined
  if (type === 'multiSelect') {
    filter.defaultValue = []
  }
  validateAndEmit()
}

const getDatasetFields = (datasetId: number): DataSetField[] => {
  return datasetFields.value.get(datasetId) || []
}

const loadFieldOptions = async (filter: GlobalFilterConfig) => {
  if (!filter.datasetId || !filter.fieldName) {
    ElMessage.warning('请先选择数据集和字段')
    return
  }

  loadingOptions.value = true
  try {
    // 获取数据集数据
    const response = await previewDatasetData(filter.datasetId)
    const data = response.data?.content || []
    
    // 提取字段的唯一值
    const uniqueValues = new Set()
    data.forEach((item: any) => {
      const value = item[filter.fieldName]
      if (value !== null && value !== undefined && value !== '') {
        uniqueValues.add(value)
      }
    })
    
    // 转换为选项格式
    filter.options = Array.from(uniqueValues).map(value => ({
      label: String(value),
      value: value
    }))
    
    ElMessage.success(`已加载 ${filter.options.length} 个选项`)
    validateAndEmit()
  } catch (error) {
    console.error('加载字段选项失败:', error)
    ElMessage.error('加载字段选项失败')
  } finally {
    loadingOptions.value = false
  }
}

const addManualOption = (filter: GlobalFilterConfig) => {
  if (!filter.options) {
    filter.options = []
  }
  filter.options.push({
    label: '',
    value: ''
  })
  validateAndEmit()
}

const removeOption = (filter: GlobalFilterConfig, index: number) => {
  if (filter.options) {
    filter.options.splice(index, 1)
    validateAndEmit()
  }
}

// 初始化加载数据集字段
onMounted(async () => {
  for (const dataset of props.datasets) {
    if (dataset.fields) {
      datasetFields.value.set(dataset.id, dataset.fields)
    }
  }
})
</script>

<style scoped lang="scss">
.global-filter-config-panel {
  .config-card {
    .card-header {
      display: flex;
      align-items: center;
      gap: 8px;
    }
  }

  .filter-list {
    .empty-state {
      text-align: center;
      padding: 20px;
    }

    .filter-title {
      display: flex;
      align-items: center;
      gap: 8px;
      width: 100%;
    }

    .filter-config {
      padding: 16px 0;
    }
  }

  .options-config {
    display: flex;
    gap: 8px;
    margin-bottom: 12px;
  }

  .options-list {
    .option-item {
      display: flex;
      gap: 8px;
      margin-bottom: 8px;
      align-items: center;

      .el-input {
        flex: 1;
      }
    }
  }

  .layout-config {
    h4 {
      margin: 0 0 16px 0;
      font-size: 14px;
      color: #303133;
    }
  }
}
</style> 