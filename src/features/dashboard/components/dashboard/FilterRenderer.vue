<template>
  <div class="filter-renderer" :class="`filter-${config.type}`">
    <!-- 日期选择器 -->
    <el-date-picker
      v-if="config.type === 'filter-date'"
      v-model="currentValue"
      type="date"
      :placeholder="config.placeholder || '请选择日期'"
      size="default"
      style="width: 100%"
      @change="handleValueChange"
    />
    
    <!-- 日期范围选择器 -->
    <el-date-picker
      v-else-if="config.type === 'filter-daterange'"
      v-model="currentValue"
      type="daterange"
      range-separator="至"
      start-placeholder="开始日期"
      end-placeholder="结束日期"
      size="default"
      style="width: 100%"
      @change="handleValueChange"
    />
    
    <!-- 下拉选择器 -->
    <el-select
      v-else-if="config.type === 'filter-select'"
      v-model="currentValue"
      :placeholder="config.placeholder || '请选择'"
      size="default"
      style="width: 100%"
      @change="handleValueChange"
    >
      <el-option
        v-for="option in config.options || []"
        :key="option.value"
        :label="option.label"
        :value="option.value"
      />
    </el-select>
    
    <!-- 多选下拉器 -->
    <el-select
      v-else-if="config.type === 'filter-multiselect'"
      v-model="currentValue"
      multiple
      :placeholder="config.placeholder || '请选择'"
      size="default"
      style="width: 100%"
      @change="handleValueChange"
    >
      <el-option
        v-for="option in config.options || []"
        :key="option.value"
        :label="option.label"
        :value="option.value"
      />
    </el-select>
    
    <!-- 级联选择器 -->
    <el-cascader
      v-else-if="config.type === 'filter-cascade'"
      v-model="currentValue"
      :options="cascadeOptions"
      :placeholder="config.placeholder || '请选择地区'"
      size="default"
      style="width: 100%"
      @change="handleValueChange"
    />
    
    <!-- 快捷时间选择器 -->
    <el-select
      v-else-if="config.type === 'filter-quicktime'"
      v-model="currentValue"
      :placeholder="config.placeholder || '请选择时间范围'"
      size="default"
      style="width: 100%"
      @change="handleQuickTimeChange"
    >
      <el-option label="最近1个月" value="1month" />
      <el-option label="最近1季度" value="1quarter" />
      <el-option label="最近1年" value="1year" />
    </el-select>
    
    <!-- 滑块选择器 -->
    <div v-else-if="config.type === 'filter-slider'" class="slider-container">
      <el-slider
        v-model="currentValue"
        :min="config.min || 0"
        :max="config.max || 100"
        :step="config.step || 1"
        show-input
        @change="handleValueChange"
      />
    </div>
    
    <!-- 输入框过滤器 -->
    <el-input
      v-else-if="config.type === 'filter-input'"
      v-model="currentValue"
      :placeholder="config.placeholder || '请输入'"
      size="default"
      style="width: 100%"
      @input="handleValueChange"
      @change="handleValueChange"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'

interface Props {
  config: {
    type: string
    title?: string
    label?: string
    placeholder?: string
    options?: Array<{ label: string; value: any }>
    value?: any
    min?: number
    max?: number
    step?: number
  }
}

interface Emits {
  (e: 'value-change', value: any): void
  (e: 'filter-apply', data: any): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 当前值
const currentValue = ref(props.config.value)

// 级联选择器选项
const cascadeOptions = [
  {
    value: 'beijing',
    label: '北京',
    children: [
      { value: 'dongcheng', label: '东城区' },
      { value: 'xicheng', label: '西城区' },
      { value: 'chaoyang', label: '朝阳区' },
      { value: 'haidian', label: '海淀区' }
    ]
  },
  {
    value: 'shanghai',
    label: '上海',
    children: [
      { value: 'huangpu', label: '黄浦区' },
      { value: 'xuhui', label: '徐汇区' },
      { value: 'changning', label: '长宁区' },
      { value: 'jingan', label: '静安区' }
    ]
  },
  {
    value: 'guangdong',
    label: '广东省',
    children: [
      { value: 'guangzhou', label: '广州市' },
      { value: 'shenzhen', label: '深圳市' },
      { value: 'dongguan', label: '东莞市' },
      { value: 'foshan', label: '佛山市' }
    ]
  }
]

// 监听配置变化
watch(() => props.config.value, (newValue) => {
  currentValue.value = newValue
}, { immediate: true })

// 处理值变化
const handleValueChange = (value: any) => {
  currentValue.value = value
  emit('value-change', value)
  emit('filter-apply', {
    type: props.config.type,
    value: value,
    label: props.config.label
  })
}

// 处理快捷时间变化
const handleQuickTimeChange = (value: string) => {
  const now = new Date()
  let startDate: Date
  
  switch (value) {
    case '1month':
      startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate())
      break
    case '1quarter':
      startDate = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate())
      break
    case '1year':
      startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate())
      break
    default:
      startDate = now
  }
  
  const dateRange = [startDate, now]
  currentValue.value = value
  
  emit('value-change', value)
  emit('filter-apply', {
    type: props.config.type,
    value: value,
    dateRange: dateRange,
    label: props.config.label
  })
}
</script>

<style lang="scss" scoped>
.filter-renderer {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  padding: 8px;
  
  .slider-container {
    width: 100%;
    padding: 0 12px;
  }
  
  // 紧凑样式
  :deep(.el-input) {
    height: 32px;
    
    .el-input__wrapper {
      padding: 0 8px;
    }
  }
  
  :deep(.el-select) {
    .el-input {
      height: 32px;
    }
  }
  
  :deep(.el-date-editor) {
    height: 32px;
    
    .el-input__wrapper {
      padding: 0 8px;
    }
  }
  
  :deep(.el-cascader) {
    .el-input {
      height: 32px;
    }
  }
}
</style> 