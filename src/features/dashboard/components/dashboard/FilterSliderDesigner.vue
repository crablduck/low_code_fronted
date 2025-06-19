<template>
  <div class="filter-slider-designer">
    <div v-if="isDesignMode" class="design-mode">
      <div class="filter-preview">
        <div class="filter-label" v-if="config.label">
          {{ config.label }}
          <span v-if="config.required" class="required">*</span>
        </div>
        <el-slider
          :min="config.min || 0"
          :max="config.max || 100"
          :step="config.step || 1"
          disabled
          style="width: 100%"
        />
      </div>
      <div class="design-overlay">
        <el-icon><Setting /></el-icon>
        <span>点击配置滑块筛选器</span>
      </div>
    </div>
    
    <div v-else class="runtime-mode">
      <div class="filter-label" v-if="config.label">
        {{ config.label }}
        <span v-if="config.required" class="required">*</span>
        <span class="value-display">{{ currentValue }}</span>
      </div>
      <el-slider
        v-model="currentValue"
        :min="config.min || 0"
        :max="config.max || 100"
        :step="config.step || 1"
        :show-tooltip="true"
        style="width: 100%"
        @change="handleValueChange"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { Setting } from '@element-plus/icons-vue'

interface FilterConfig {
  label?: string
  required?: boolean
  defaultValue?: number
  min?: number
  max?: number
  step?: number
  datasetId?: number
  fieldName?: string
}

interface Props {
  config: FilterConfig
  isDesignMode?: boolean
  modelValue?: number
}

const props = withDefaults(defineProps<Props>(), {
  isDesignMode: false,
  config: () => ({})
})

const emit = defineEmits<{
  'update:config': [config: FilterConfig]
  'update:modelValue': [value: number]
  'value-change': [value: number]
}>()

const currentValue = ref(props.modelValue || props.config.defaultValue || 0)

watch(
  () => props.modelValue,
  (newValue) => {
    currentValue.value = newValue || 0
  }
)

watch(
  () => props.config.defaultValue,
  (newValue) => {
    if (currentValue.value === undefined || currentValue.value === null) {
      currentValue.value = newValue || 0
    }
  }
)

const handleValueChange = (value: number) => {
  currentValue.value = value
  emit('update:modelValue', value)
  emit('value-change', value)
}
</script>

<style scoped>
.filter-slider-designer {
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
  padding: 8px 0;
}

.filter-label {
  font-size: 14px;
  font-weight: 500;
  color: #606266;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 2px;
}

.value-display {
  color: #409eff;
  font-weight: 600;
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
  padding: 8px 0;
}

:deep(.el-slider.is-disabled .el-slider__runway) {
  background-color: #f5f7fa;
  border-color: #dcdfe6;
}

:deep(.el-slider.is-disabled .el-slider__button) {
  background-color: #c0c4cc;
  border-color: #c0c4cc;
}
</style> 