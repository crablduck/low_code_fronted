<template>
  <div class="traditional-global-filters">
    <div v-if="filters.length > 0" class="filters-wrapper">
      <!-- 过滤器标题栏 -->
      <div class="filters-header">
        <div class="header-left">
          <span class="filters-title">筛选条件</span>
        </div>
        <div class="header-right">
          <el-button 
            v-if="hasFilterValues" 
            size="small" 
            type="info" 
            text
            @click="clearAllFilters"
          >
            清空筛选
          </el-button>
          <el-button 
            v-if="showQuickActions && !autoApply"
            size="small" 
            type="primary"
            @click="applyFilters"
          >
            查询
          </el-button>
        </div>
      </div>

      <!-- 过滤器表单区域 -->
      <div class="filters-form">
        <el-form 
          :model="filterValues" 
          :inline="true" 
          class="filter-form"
          size="default"
        >
          <template v-for="filter in filters" :key="filter.key">
            <el-form-item 
              :label="filter.label + '：'"
              :class="{ 'required-field': filter.required }"
              class="filter-form-item"
            >
              <!-- 下拉选择器 -->
              <el-select
                v-if="filter.controlType === 'select'"
                v-model="filterValues[filter.key]"
                :placeholder="filter.placeholder || '全部'"
                clearable
                filterable
                @change="handleFilterChange(filter.key, $event)"
                class="filter-control"
                size="small"
                style="width: 120px"
              >
                <el-option label="全部" value="" />
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
                :placeholder="filter.placeholder || '请选择'"
                clearable
                filterable
                multiple
                collapse-tags
                collapse-tags-tooltip
                @change="handleFilterChange(filter.key, $event)"
                class="filter-control"
                size="small"
                style="width: 150px"
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
                format="YYYY-MM-DD"
                value-format="YYYY-MM-DD"
                @change="handleFilterChange(filter.key, $event)"
                class="filter-control date-control"
                size="small"
                style="width: 180px"
              />

              <!-- 日期选择器 -->
              <el-date-picker
                v-else-if="filter.controlType === 'date'"
                v-model="filterValues[filter.key]"
                type="date"
                placeholder="选择日期"
                format="YYYY-MM-DD"
                value-format="YYYY-MM-DD"
                @change="handleFilterChange(filter.key, $event)"
                class="filter-control date-control"
                size="small"
                style="width: 110px"
              />

              <!-- 月份选择器 -->
              <el-date-picker
                v-else-if="filter.controlType === 'month'"
                v-model="filterValues[filter.key]"
                type="month"
                placeholder="选择月份"
                format="YYYY-MM"
                value-format="YYYY-MM"
                @change="handleFilterChange(filter.key, $event)"
                class="filter-control date-control"
                size="small"
                style="width: 90px"
                :clearable="true"
              />

              <!-- 年份选择器 -->
              <el-date-picker
                v-else-if="filter.controlType === 'year'"
                v-model="filterValues[filter.key]"
                type="year"
                placeholder="选择年份"
                format="YYYY"
                value-format="YYYY"
                @change="handleFilterChange(filter.key, $event)"
                class="filter-control date-control"
                size="small"
                style="width: 75px"
                :clearable="true"
              />

              <!-- 省市联动选择器 -->
              <template v-else-if="filter.controlType === 'cascade'">
                <el-cascader
                  v-model="filterValues[filter.key]"
                  :options="cascadeOptions"
                  :placeholder="filter.placeholder || '请选择'"
                  clearable
                  filterable
                  @change="handleFilterChange(filter.key, $event)"
                  class="filter-control"
                  size="small"
                  style="width: 130px"
                />
              </template>

              <!-- 输入框 -->
              <el-input
                v-else-if="filter.controlType === 'input'"
                v-model="filterValues[filter.key]"
                :placeholder="filter.placeholder || '请输入'"
                clearable
                @change="handleFilterChange(filter.key, $event)"
                class="filter-control"
                size="small"
                style="width: 120px"
              />

              <!-- 数字输入框 -->
              <el-input-number
                v-else-if="filter.controlType === 'number'"
                v-model="filterValues[filter.key]"
                :placeholder="filter.placeholder || '请输入数字'"
                @change="handleFilterChange(filter.key, $event)"
                class="filter-control"
                size="small"
                style="width: 120px"
              />

              <!-- 滑块 -->
              <div v-else-if="filter.controlType === 'slider'" class="slider-wrapper">
                <el-slider
                  v-model="filterValues[filter.key]"
                  :min="getSliderMin(filter)"
                  :max="getSliderMax(filter)"  
                  :step="getSliderStep(filter)"
                  show-input
                  :show-input-controls="false"
                  @change="handleFilterChange(filter.key, $event)"
                  class="filter-control compact-slider"
                  style="width: 160px"
                />
              </div>
            </el-form-item>
          </template>
        </el-form>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-else class="empty-filters">
      <el-empty 
        description="暂无筛选条件" 
        :image-size="80"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import type { 
  GlobalFilterConfig, 
  DashboardGlobalFilters 
} from '@/shared/types/dashboard'
import { previewDatasetData } from '@/api/dataset'

// Props
interface Props {
  filters: GlobalFilterConfig[]
  showTitle?: boolean
  showQuickActions?: boolean
  autoApply?: boolean // 是否自动应用筛选（值变化时立即触发）
}

const props = withDefaults(defineProps<Props>(), {
  filters: () => [],
  showTitle: true,
  showQuickActions: true,
  autoApply: false
})

// Emits
const emit = defineEmits<{
  'filter-change': [filters: Record<string, any>]
  'apply-filters': [filters: Record<string, any>]
}>()

// 响应式数据
const filterValues = ref<Record<string, any>>({})
const loadingStates = ref<Record<string, boolean>>({})

// 省市联动数据
const cascadeOptions = ref([
  {
    value: 'beijing',
    label: '北京市',
    children: [
      { value: 'dongcheng', label: '东城区' },
      { value: 'xicheng', label: '西城区' },
      { value: 'chaoyang', label: '朝阳区' },
      { value: 'fengtai', label: '丰台区' },
      { value: 'shijingshan', label: '石景山区' },
      { value: 'haidian', label: '海淀区' }
    ]
  },
  {
    value: 'shanghai',
    label: '上海市',
    children: [
      { value: 'huangpu', label: '黄浦区' },
      { value: 'xuhui', label: '徐汇区' },
      { value: 'changning', label: '长宁区' },
      { value: 'jingan', label: '静安区' },
      { value: 'putuo', label: '普陀区' },
      { value: 'hongkou', label: '虹口区' }
    ]
  },
  {
    value: 'guangdong',
    label: '广东省',
    children: [
      { 
        value: 'guangzhou',
        label: '广州市',
        children: [
          { value: 'tianhe', label: '天河区' },
          { value: 'yuexiu', label: '越秀区' },
          { value: 'liwan', label: '荔湾区' }
        ]
      },
      { 
        value: 'shenzhen',
        label: '深圳市',
        children: [
          { value: 'futian', label: '福田区' },
          { value: 'luohu', label: '罗湖区' },
          { value: 'nanshan', label: '南山区' }
        ]
      }
    ]
  }
])

// 计算属性
const hasFilterValues = computed(() => {
  return Object.values(filterValues.value).some(value => 
    value !== null && value !== undefined && value !== '' && 
    (!Array.isArray(value) || value.length > 0)
  )
})

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
          values[filter.key] = ''
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
      dependentFilter.controlType === 'multiSelect' ? [] : ''
    
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
  return filter.sliderConfig?.min ?? 0
}

const getSliderMax = (filter: GlobalFilterConfig): number => {
  return filter.sliderConfig?.max ?? 100
}

const getSliderStep = (filter: GlobalFilterConfig): number => {
  return filter.sliderConfig?.step ?? 1
}

const clearAllFilters = () => {
  const clearedValues: Record<string, any> = {}
  
  props.filters.forEach(filter => {
    switch (filter.controlType) {
      case 'multiSelect':
        clearedValues[filter.key] = []
        break
      default:
        clearedValues[filter.key] = ''
    }
  })
  
  filterValues.value = clearedValues
  
  if (props.autoApply) {
    emit('filter-change', { ...filterValues.value })
  }
  
  ElMessage.success('筛选条件已清空')
}

const resetFilters = () => {
  initializeFilterValues(props.filters)
  
  if (props.autoApply) {
    emit('filter-change', { ...filterValues.value })
  }
  
  ElMessage.success('筛选条件已重置')
}

const applyFilters = () => {
  emit('apply-filters', { ...filterValues.value })
  ElMessage.success('筛选条件已应用')
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

// 监听筛选器配置变化
watch(
  () => props.filters,
  (newFilters) => {
    initializeFilterValues(newFilters)
  },
  { immediate: true, deep: true }
)

// 初始化
onMounted(() => {
  if (props.filters.length > 0) {
    initializeFilterValues(props.filters)
  }
})
</script>

<style scoped>
.traditional-filters-container {
  background: #fff;
  border-radius: 4px;
  border: 1px solid #e4e7ed;
}

.filters-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 8px 16px;
  
  .header-content {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  
  .title {
    font-size: 14px;
    font-weight: 500;
    margin: 0;
    display: flex;
    align-items: center;
  }
  
  .quick-actions {
    display: flex;
    gap: 8px;
  }
}

.filters-form-container {
  padding: 12px 16px;
  background: #fafbfc;
}

.empty-filters {
  padding: 20px;
  text-align: center;
}
</style> 