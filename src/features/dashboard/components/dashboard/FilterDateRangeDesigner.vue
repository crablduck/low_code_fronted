<template>
  <div class="filter-daterange-designer">
    <div v-if="isDesignMode" class="design-mode">
      <div class="filter-preview">
        <div class="filter-label" v-if="config.label">
          {{ config.label }}
          <span v-if="config.required" class="required">*</span>
        </div>
        <el-date-picker
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          disabled
          style="width: 100%"
        />
      </div>
      <div class="design-overlay">
        <el-icon><Setting /></el-icon>
        <span>点击配置日期范围筛选器</span>
      </div>
    </div>
    
    <div v-else class="runtime-mode">
      <div class="filter-label" v-if="config.label">
        {{ config.label }}
        <span v-if="config.required" class="required">*</span>
      </div>
      <el-date-picker
        v-model="currentValue"
        type="daterange"
        range-separator="至"
        start-placeholder="开始日期"
        end-placeholder="结束日期"
        :clearable="!config.required"
        format="YYYY-MM-DD"
        value-format="YYYY-MM-DD"
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
  placeholder?: string
  required?: boolean
  defaultValue?: [string, string]
  datasetId?: number
  fieldName?: string
}

interface Props {
  config: FilterConfig
  isDesignMode?: boolean
  modelValue?: [string, string]
}

const props = withDefaults(defineProps<Props>(), {
  isDesignMode: false,
  config: () => ({})
})

const emit = defineEmits<{
  'update:config': [config: FilterConfig]
  'update:modelValue': [value: [string, string]]
  'value-change': [value: [string, string]]
}>()

const currentValue = ref<[string, string] | null>(props.modelValue || props.config.defaultValue || null)

watch(
  () => props.modelValue,
  (newValue) => {
    currentValue.value = newValue || null
  }
)

watch(
  () => props.config.defaultValue,
  (newValue) => {
    if (!currentValue.value) {
      currentValue.value = newValue || null
    }
  }
)

const handleValueChange = (value: [string, string] | null) => {
  currentValue.value = value
  emit('update:modelValue', value as [string, string])
  emit('value-change', value as [string, string])
}
</script>

<style scoped>
.filter-daterange-designer {
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

:deep(.el-date-editor) {
  width: 100%;
}

:deep(.el-date-editor.is-disabled .el-input__wrapper) {
  background-color: #f5f7fa;
  border-color: #dcdfe6;
  color: #c0c4cc;
}
</style> 