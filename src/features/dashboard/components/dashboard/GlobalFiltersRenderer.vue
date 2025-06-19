<template>
  <div class="global-filters-renderer" :class="positionClass">
    <div 
      v-if="filters.length > 0" 
      class="filters-container"
      :style="containerStyle"
    >
      <div class="filters-title" v-if="showTitle">
        <el-icon><Filter /></el-icon>
        <span>筛选条件</span>
        <el-button 
          v-if="hasFilterValues" 
          size="small" 
          type="info" 
          link 
          @click="clearAllFilters"
        >
          清空
        </el-button>
      </div>

      <div class="filters-grid" :style="gridStyle">
        <div 
          v-for="filter in filters" 
          :key="filter.key"
          class="filter-item"
          :class="{ 'required': filter.required }"
        >
          <label class="filter-label">
            {{ filter.label }}
            <span v-if="filter.required" class="required-mark">*</span>
          </label>

          <!-- 下拉选择器 -->
          <el-select
            v-if="filter.controlType === 'select'"
            v-model="filterValues[filter.key]"
            :placeholder="filter.placeholder || `请选择${filter.label}`"
            clearable
            filterable
            @change="handleFilterChange(filter.key, $event)"
            class="filter-control"
          >
            <el-option
              v-for="option in filter.options"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </el-select>

          <!-- 多选选择器 -->
          <el-select
            v-else-if="filter.controlType === 'multiSelect'"
            v-model="filterValues[filter.key]"
            :placeholder="filter.placeholder || `请选择${filter.label}`"
            clearable
            filterable
            multiple
            collapse-tags
            collapse-tags-tooltip
            @change="handleFilterChange(filter.key, $event)"
            class="filter-control"
          >
            <el-option
              v-for="option in filter.options"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </el-select>

          <!-- 日期范围选择器 -->
          <el-date-picker
            v-else-if="filter.controlType === 'dateRange'"
            v-model="filterValues[filter.key]"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            @change="handleFilterChange(filter.key, $event)"
            class="filter-control"
          />

          <!-- 滑块 -->
          <div v-else-if="filter.controlType === 'slider'" class="slider-container">
            <el-slider
              v-model="filterValues[filter.key]"
              :min="getSliderMin(filter)"
              :max="getSliderMax(filter)"
              :step="getSliderStep(filter)"
              show-input
              @change="handleFilterChange(filter.key, $event)"
              class="filter-control"
            />
          </div>

          <!-- 输入框 -->
          <el-input
            v-else-if="filter.controlType === 'input'"
            v-model="filterValues[filter.key]"
            :placeholder="filter.placeholder || `请输入${filter.label}`"
            clearable
            @change="handleFilterChange(filter.key, $event)"
            class="filter-control"
          />
        </div>
      </div>

      <!-- 快捷操作 -->
      <div v-if="showQuickActions" class="quick-actions">
        <el-button size="small" @click="applyFilters">
          <el-icon><Check /></el-icon>
          应用筛选
        </el-button>
        <el-button size="small" @click="resetFilters">
          <el-icon><RefreshLeft /></el-icon>
          重置
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Filter, Check, RefreshLeft } from '@element-plus/icons-vue'
import type { 
  GlobalFilterConfig, 
  DashboardGlobalFilters 
} from '@/shared/types/dashboard'
import { previewDatasetData } from '@/api/dataset'

// Props
interface Props {
  filters: GlobalFilterConfig[]
  layout?: {
    position?: 'top' | 'left' | 'right'
    columns?: number
    spacing?: number
  }
  showTitle?: boolean
  showQuickActions?: boolean
  autoApply?: boolean // 是否自动应用筛选（值变化时立即触发）
}

const props = withDefaults(defineProps<Props>(), {
  filters: () => [],
  layout: () => ({ position: 'top', columns: 3, spacing: 16 }),
  showTitle: true,
  showQuickActions: false,
  autoApply: true
})

// Emits
const emit = defineEmits<{
  'filter-change': [filters: Record<string, any>]
  'apply-filters': [filters: Record<string, any>]
}>()

// 响应式数据
const filterValues = ref<Record<string, any>>({})
const loadingStates = ref<Record<string, boolean>>({})

// 计算属性
const positionClass = computed(() => `position-${props.layout?.position || 'top'}`)

const containerStyle = computed(() => ({
  '--spacing': `${props.layout?.spacing || 16}px`
}))

const gridStyle = computed(() => {
  const columns = props.layout?.columns || 3
  return {
    gridTemplateColumns: `repeat(${columns}, 1fr)`,
    gap: `${props.layout?.spacing || 16}px`
  }
})

const hasFilterValues = computed(() => {
  return Object.values(filterValues.value).some(value => 
    value !== null && value !== undefined && value !== '' && 
    (!Array.isArray(value) || value.length > 0)
  )
})

// 监听筛选器配置变化
watch(
  () => props.filters,
  (newFilters) => {
    initializeFilterValues(newFilters)
  },
  { immediate: true, deep: true }
)

// 方法
const initializeFilterValues = (filters: GlobalFilterConfig[]) => {
  const values: Record<string, any> = {}
  
  filters.forEach(filter => {
    // 设置默认值
    if (filter.defaultValue !== undefined) {
      values[filter.key] = filter.defaultValue
    } else {
      // 根据控件类型设置初始值
      switch (filter.controlType) {
        case 'multiSelect':
          values[filter.key] = []
          break
        case 'dateRange':
          values[filter.key] = null
          break
        case 'slider':
          values[filter.key] = getSliderMin(filter)
          break
        default:
          values[filter.key] = null
      }
    }
    
    // 加载选项值（如果尚未加载）
    if ((filter.controlType === 'select' || filter.controlType === 'multiSelect') && 
        (!filter.options || filter.options.length === 0)) {
      loadFilterOptions(filter)
    }
  })
  
  filterValues.value = values
}

const handleFilterChange = (key: string, value: any) => {
  filterValues.value[key] = value
  
  // 处理级联筛选
  handleCascadeFilters(key, value)
  
  if (props.autoApply) {
    emit('filter-change', { ...filterValues.value })
  }
}

const handleCascadeFilters = async (changedKey: string, value: any) => {
  // 查找依赖于当前筛选器的其他筛选器
  const dependentFilters = props.filters.filter(filter => 
    filter.cascadeFilters?.some(cascade => cascade.dependsOn === changedKey)
  )
  
  for (const dependentFilter of dependentFilters) {
    // 清空依赖筛选器的值
    filterValues.value[dependentFilter.key] = 
      dependentFilter.controlType === 'multiSelect' ? [] : null
    
    // 重新加载依赖筛选器的选项
    await loadFilterOptions(dependentFilter, { [changedKey]: value })
  }
}

const loadFilterOptions = async (filter: GlobalFilterConfig, cascadeValues?: Record<string, any>) => {
  if (!filter.datasetId || !filter.fieldName) return
  
  const loadingKey = filter.key
  loadingStates.value[loadingKey] = true
  
  try {
    // 构建查询参数（包含级联筛选条件）
    const queryParams: any = {}
    if (cascadeValues) {
      Object.assign(queryParams, cascadeValues)
    }
    
    // 获取数据集数据
    const response = await previewDatasetData(filter.datasetId)
    let data = response.data?.content || []
    
    // 应用级联筛选
    if (filter.cascadeFilters && cascadeValues) {
      for (const cascade of filter.cascadeFilters) {
        const cascadeValue = cascadeValues[cascade.dependsOn]
        if (cascadeValue !== null && cascadeValue !== undefined) {
          data = data.filter((item: any) => item[cascade.targetField] === cascadeValue)
        }
      }
    }
    
    // 提取字段的唯一值
    const uniqueValues = new Set()
    data.forEach((item: any) => {
      const value = item[filter.fieldName]
      if (value !== null && value !== undefined && value !== '') {
        uniqueValues.add(value)
      }
    })
    
    // 更新选项
    const currentFilter = props.filters.find(f => f.key === filter.key)
    if (currentFilter) {
      currentFilter.options = Array.from(uniqueValues).map(value => ({
        label: String(value),
        value: value
      }))
    }
  } catch (error) {
    console.error('加载筛选器选项失败:', error)
  } finally {
    loadingStates.value[loadingKey] = false
  }
}

const getSliderMin = (filter: GlobalFilterConfig): number => {
  // 可以从筛选器配置或数据中动态获取
  return 0
}

const getSliderMax = (filter: GlobalFilterConfig): number => {
  // 可以从筛选器配置或数据中动态获取
  return 100
}

const getSliderStep = (filter: GlobalFilterConfig): number => {
  return 1
}

const clearAllFilters = () => {
  const clearedValues: Record<string, any> = {}
  
  props.filters.forEach(filter => {
    switch (filter.controlType) {
      case 'multiSelect':
        clearedValues[filter.key] = []
        break
      default:
        clearedValues[filter.key] = null
    }
  })
  
  filterValues.value = clearedValues
  
  if (props.autoApply) {
    emit('filter-change', { ...filterValues.value })
  }
}

const resetFilters = () => {
  initializeFilterValues(props.filters)
  
  if (props.autoApply) {
    emit('filter-change', { ...filterValues.value })
  }
}

const applyFilters = () => {
  emit('apply-filters', { ...filterValues.value })
}

// 暴露方法给父组件
defineExpose({
  getFilterValues: () => filterValues.value,
  setFilterValues: (values: Record<string, any>) => {
    filterValues.value = { ...values }
  },
  clearFilters: clearAllFilters,
  resetFilters,
  applyFilters
})

// 初始化
onMounted(() => {
  if (props.filters.length > 0) {
    initializeFilterValues(props.filters)
  }
})
</script>

<style scoped lang="scss">
.global-filters-renderer {
  width: 100%;

  .filters-container {
    padding: var(--spacing, 16px);
    background: #fff;
    border-radius: 6px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);

    .filters-title {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 16px;
      font-size: 14px;
      font-weight: 500;
      color: #303133;

      .el-icon {
        color: #409eff;
      }

      .el-button {
        margin-left: auto;
      }
    }

    .filters-grid {
      display: grid;
      align-items: start;

      .filter-item {
        display: flex;
        flex-direction: column;
        gap: 6px;

        &.required .filter-label {
          .required-mark {
            color: #f56c6c;
          }
        }

        .filter-label {
          font-size: 13px;
          color: #606266;
          font-weight: 500;
          
          .required-mark {
            margin-left: 2px;
          }
        }

        .filter-control {
          width: 100%;
        }

        .slider-container {
          padding: 8px 0;
        }
      }
    }

    .quick-actions {
      display: flex;
      gap: 8px;
      margin-top: 16px;
      padding-top: 16px;
      border-top: 1px solid #ebeef5;
    }
  }

  // 不同位置的样式
  &.position-top {
    .filters-container {
      .filters-grid {
        @media (max-width: 768px) {
          grid-template-columns: 1fr !important;
        }
      }
    }
  }

  &.position-left,
  &.position-right {
    .filters-container {
      .filters-grid {
        grid-template-columns: 1fr !important;
      }
    }
  }
}

// 响应式设计
@media (max-width: 992px) {
  .global-filters-renderer .filters-container .filters-grid {
    grid-template-columns: repeat(2, 1fr) !important;
  }
}

@media (max-width: 576px) {
  .global-filters-renderer .filters-container .filters-grid {
    grid-template-columns: 1fr !important;
  }
}
</style> 