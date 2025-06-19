<template>
  <div class="filter-select-designer">
    <div v-if="isDesignMode" class="design-mode">
      <div class="filter-preview">
        <div class="filter-label" v-if="config.label">
          {{ config.label }}
          <span v-if="config.required" class="required">*</span>
        </div>
        <el-select 
          :placeholder="config.placeholder || '请选择'"
          disabled
          style="width: 100%"
        >
          <el-option 
            v-for="option in (config.options || [])" 
            :key="option.value"
            :label="option.label"
            :value="option.value"
          />
        </el-select>
      </div>
      <div class="design-overlay">
        <el-icon><Setting /></el-icon>
        <span>点击配置筛选器</span>
      </div>
    </div>
    
    <div v-else class="runtime-mode">
      <div class="filter-label" v-if="config.label">
        {{ config.label }}
        <span v-if="config.required" class="required">*</span>
      </div>
      <el-select 
        v-model="currentValue"
        :placeholder="config.placeholder || '请选择'"
        :clearable="!config.required"
        style="width: 100%"
        @change="handleValueChange"
      >
        <el-option 
          v-for="option in (config.options || [])" 
          :key="option.value"
          :label="option.label"
          :value="option.value"
        />
      </el-select>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Setting } from '@element-plus/icons-vue'

interface FilterOption {
  label: string
  value: any
}

interface FilterConfig {
  label?: string
  placeholder?: string
  required?: boolean
  options?: FilterOption[]
  defaultValue?: any
  datasetId?: number
  fieldName?: string
}

interface Props {
  config: FilterConfig
  isDesignMode?: boolean
  modelValue?: any
}

const props = withDefaults(defineProps<Props>(), {
  isDesignMode: false,
  config: () => ({})
})

const emit = defineEmits<{
  'update:config': [config: FilterConfig]
  'update:modelValue': [value: any]
  'value-change': [value: any]
}>()

const currentValue = ref(props.modelValue || props.config.defaultValue)

watch(
  () => props.modelValue,
  (newValue) => {
    currentValue.value = newValue
  }
)

watch(
  () => props.config.defaultValue,
  (newValue) => {
    if (currentValue.value === undefined || currentValue.value === null) {
      currentValue.value = newValue
    }
  }
)

const handleValueChange = (value: any) => {
  currentValue.value = value
  emit('update:modelValue', value)
  emit('value-change', value)
}
</script>

<style scoped>
.filter-select-designer {
  position: relative;
  width: 100%;
  height: 100%;
  padding: 8px;
}

.design-mode {
  position: relative;
  width: 100%;
  height: 100%;
  max-width: 100%;
  max-height: 100%;
  overflow: hidden;
}

.filter-preview {
  width: 100%;
}

.filter-label {
  font-size: 14px;
  font-weight: 500;
  color: #606266;
  margin-bottom: 4px;
  display: flex;
  align-items: center;
  gap: 2px;
}

.required {
  color: #f56c6c;
}

.design-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(64, 158, 255, 0.05);
  border: 2px dashed #409eff;
  border-radius: 4px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  font-size: 12px;
  color: #409eff;
  cursor: pointer;
  transition: all 0.2s ease;
  opacity: 0;
}

.design-mode:hover .design-overlay {
  opacity: 1;
}

.runtime-mode {
  width: 100%;
  height: 100%;
  padding: 4px 0;
}

:deep(.el-select) {
  width: 100%;
}

:deep(.el-select .el-input.is-disabled .el-input__wrapper) {
  background-color: #f5f7fa;
  border-color: #dcdfe6;
  color: #c0c4cc;
}
</style> 