<template>
  <div class="parameter-configurator">
    <div v-if="!needsParameters" class="no-parameters">
      <el-alert
        title="此函数无需配置参数"
        type="info"
        :closable="false"
        show-icon
      />
    </div>
    
    <div v-else class="parameter-form">
      <!-- 百分位数参数 -->
      <div v-if="functionType === 'PERCENTILE'" class="param-group">
        <label class="param-label">百分位数 (0-100):</label>
        <el-input-number
          v-model="parameters.percentile"
          :min="0"
          :max="100"
          :step="1"
          placeholder="50"
          size="small"
          style="width: 120px"
          @change="onParameterChange"
        />
        <span class="param-unit">%</span>
      </div>
      
      <!-- 排名参数 -->
      <div v-if="functionType === 'RANK'" class="param-group">
        <label class="param-label">排序方式:</label>
        <el-select
          v-model="parameters.order"
          placeholder="选择排序方式"
          size="small"
          style="width: 150px"
          @change="onParameterChange"
        >
          <el-option label="降序(大到小)" value="desc" />
          <el-option label="升序(小到大)" value="asc" />
        </el-select>
      </div>
      
      <!-- 自定义函数参数 -->
      <div v-if="functionType === 'CUSTOM'" class="param-group">
        <label class="param-label">自定义表达式:</label>
        <el-input
          v-model="parameters.expression"
          type="textarea"
          :rows="3"
          placeholder="输入自定义计算表达式，如：SUM(field1) / COUNT(*)"
          @change="onParameterChange"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue'

// Props & Emits
interface Props {
  parameters: Record<string, any>
  functionType: string
  dataset: any
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:parameters': [parameters: Record<string, any>]
}>()

// 计算属性
const needsParameters = computed(() => {
  return ['PERCENTILE', 'RANK', 'CUSTOM'].includes(props.functionType)
})

// 方法
const onParameterChange = () => {
  emit('update:parameters', props.parameters)
}

// 监听函数类型变化，设置默认参数
watch(() => props.functionType, (newType) => {
  const defaultParams: Record<string, any> = {}
  
  switch (newType) {
    case 'PERCENTILE':
      defaultParams.percentile = 50
      break
    case 'RANK':
      defaultParams.order = 'desc'
      break
    case 'CUSTOM':
      defaultParams.expression = ''
      break
  }
  
  emit('update:parameters', defaultParams)
}, { immediate: true })
</script>

<style scoped>
.parameter-configurator {
  .no-parameters {
    padding: 12px 0;
  }
  
  .parameter-form {
    .param-group {
      margin-bottom: 16px;
      
      &:last-child {
        margin-bottom: 0;
      }
      
      .param-label {
        display: block;
        margin-bottom: 6px;
        font-size: 13px;
        font-weight: 500;
        color: #606266;
      }
      
      .param-unit {
        margin-left: 8px;
        color: #909399;
        font-size: 12px;
      }
    }
  }
}
</style> 