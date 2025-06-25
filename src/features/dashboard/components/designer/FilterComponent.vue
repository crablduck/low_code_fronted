<template>
  <div class="filter-component" :class="{ 'preview-mode': isPreview }">
    <div class="filter-content">
      <!-- 筛选器标签 -->
      <div class="filter-label">
        {{ config.label || config.title || '筛选器' }}
      </div>
      
      <!-- 下拉选择器 -->
      <el-select
        v-if="config.type === 'filter-select'"
        v-model="currentValue"
        :placeholder="config.placeholder || '请选择'"
        clearable
        style="width: 200px"
        @change="handleValueChange"
      >
        <el-option
          v-for="option in options"
          :key="option.value"
          :label="option.label"
          :value="option.value"
        />
      </el-select>

      <!-- 多选下拉 -->
      <el-select
        v-else-if="config.type === 'filter-multiselect'"
        v-model="currentValue"
        :placeholder="config.placeholder || '请选择'"
        multiple
        clearable
        style="width: 200px"
        @change="handleValueChange"
      >
        <el-option
          v-for="option in options"
          :key="option.value"
          :label="option.label"
          :value="option.value"
        />
      </el-select>

      <!-- 日期选择器 -->
      <el-date-picker
        v-else-if="config.type === 'filter-date'"
        v-model="currentValue"
        type="date"
        :placeholder="config.placeholder || '选择日期'"
        style="width: 200px"
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
        style="width: 240px"
        @change="handleValueChange"
      />

      <!-- 滑块选择器 -->
      <div v-else-if="config.type === 'filter-slider'" class="slider-container">
        <el-slider
          v-model="currentValue"
          :min="config.min || 0"
          :max="config.max || 100"
          :step="config.step || 1"
          style="width: 160px"
          @change="handleValueChange"
        />
        <span class="slider-value">{{ currentValue }}</span>
      </div>

      <!-- 文本输入框 -->
      <el-input
        v-else-if="config.type === 'filter-input'"
        v-model="currentValue"
        :placeholder="config.placeholder || '请输入'"
        style="width: 200px"
        @input="handleValueChange"
      />
    </div>

    <!-- 操作按钮 -->
    <div class="filter-actions" v-if="!isPreview">
      <el-button
        type="text"
        size="small"
        @click="$emit('remove')"
        class="remove-btn"
      >
        <el-icon><Close /></el-icon>
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Close } from '@element-plus/icons-vue'
import type { ChartConfig } from '@/shared/types/dashboard'

interface Props {
  config: ChartConfig
  isPreview?: boolean
}

interface Emits {
  (e: 'value-change', value: any): void
  (e: 'remove'): void
}

const props = withDefaults(defineProps<Props>(), {
  isPreview: false
})

const emit = defineEmits<Emits>()

// 当前值
const currentValue = ref(props.config.defaultValue)

// 选项数据
const options = computed(() => {
  return props.config.options || [
    { label: '选项1', value: 'option1' },
    { label: '选项2', value: 'option2' },
    { label: '选项3', value: 'option3' }
  ]
})

// 值变化处理
const handleValueChange = (value: any) => {
  currentValue.value = value
  emit('value-change', value)
}

// 监听默认值变化
watch(
  () => props.config.defaultValue,
  (newValue) => {
    currentValue.value = newValue
  }
)
</script>

<style scoped lang="scss">
.filter-component {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: #ffffff;
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  transition: all 0.2s ease;
  position: relative;
  
  &:hover {
    border-color: #409eff;
    box-shadow: 0 2px 8px rgba(64, 158, 255, 0.1);
    
    .filter-actions {
      opacity: 1;
    }
  }
  
  &.preview-mode {
    border-color: #dcdfe6;
    
    &:hover {
      border-color: #dcdfe6;
      box-shadow: none;
    }
  }
  
  .filter-content {
    display: flex;
    align-items: center;
    gap: 12px;
    flex: 1;
  }
  
  .filter-label {
    font-size: 14px;
    color: #606266;
    white-space: nowrap;
    min-width: 0;
    flex-shrink: 0;
    font-weight: 500;
  }
  
  .slider-container {
    display: flex;
    align-items: center;
    gap: 12px;
    
    .slider-value {
      font-size: 12px;
      color: #409eff;
      font-weight: 500;
      min-width: 30px;
      text-align: center;
    }
  }
  
  .filter-actions {
    opacity: 0;
    transition: opacity 0.2s ease;
    
    .remove-btn {
      padding: 4px;
      min-height: auto;
      
      .el-icon {
        font-size: 14px;
        color: #f56c6c;
      }
      
      &:hover {
        background: #fef0f0;
      }
    }
  }
}
</style> 