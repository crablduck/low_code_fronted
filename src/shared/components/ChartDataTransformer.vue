<template>
  <div class="chart-data-transformer">
    <el-card>
      <template #header>
        <div class="transformer-header">
          <el-icon><Operation /></el-icon>
          <span>数据转换器</span>
          <el-tag v-if="currentTransformer" size="small" type="primary">
            {{ currentTransformer.name }}
          </el-tag>
        </div>
      </template>

      <!-- 转换器选择 -->
      <div v-if="showSelector" class="transformer-selector">
        <el-select
          v-model="selectedTransformerId"
          placeholder="选择转换器"
          @change="handleTransformerChange"
        >
          <el-option
            v-for="transformer in availableTransformers"
            :key="transformer.id"
            :label="transformer.name"
            :value="transformer.id"
          >
            <div class="transformer-option">
              <span>{{ transformer.name }}</span>
              <el-tag size="small" type="info">{{ transformer.description }}</el-tag>
            </div>
          </el-option>
        </el-select>
      </div>

      <!-- 转换配置 -->
      <div class="transformer-config">
        <el-form :model="config" size="small" label-width="100px">
          <el-form-item label="数据限制">
            <el-input-number
              v-model="config.dataLimit"
              :min="1"
              :max="10000"
              placeholder="最大记录数"
            />
          </el-form-item>
          
          <el-form-item label="启用缓存">
            <el-switch v-model="config.enableCache" />
          </el-form-item>
        </el-form>
      </div>

      <!-- 操作按钮 -->
      <div class="transformer-actions">
        <el-button 
          type="primary" 
          :loading="transforming"
          @click="performTransform"
          icon="Refresh"
        >
          执行转换
        </el-button>
        
        <el-button 
          @click="clearCache"
          icon="Delete"
        >
          清空缓存
        </el-button>
      </div>

      <!-- 转换结果统计 -->
      <div v-if="lastResult" class="transform-stats">
        <el-descriptions :column="2" size="small" border>
          <el-descriptions-item label="转换器">{{ lastResult.transformer }}</el-descriptions-item>
          <el-descriptions-item label="记录数">{{ lastResult.recordCount }}</el-descriptions-item>
          <el-descriptions-item label="耗时">{{ lastResult.duration }}ms</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="lastResult.success ? 'success' : 'danger'">
              {{ lastResult.success ? '成功' : '失败' }}
            </el-tag>
          </el-descriptions-item>
        </el-descriptions>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { useChartDataTransformers } from './composables/useChartDataTransformers'

// Props 定义
interface Props {
  rawData?: any
  chartType: string
  fieldMapping?: Record<string, any>
  transformerType?: string
  showSelector?: boolean
  autoTransform?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  transformerType: 'default',
  showSelector: true,
  autoTransform: true
})

// Emits 定义
interface Emits {
  (e: 'transform', result: any): void
  (e: 'error', error: Error): void
  (e: 'transformer-change', transformerId: string): void
}

const emit = defineEmits<Emits>()

// 使用转换器组合式函数
const {
  availableTransformers,
  getTransformer,
  executeTransform,
  clearTransformCache
} = useChartDataTransformers()

// 响应式数据
const selectedTransformerId = ref(props.transformerType)
const transforming = ref(false)
const config = ref({
  dataLimit: 1000,
  enableCache: true
})
const lastResult = ref<any>(null)

// 计算属性
const currentTransformer = computed(() => {
  return getTransformer(selectedTransformerId.value)
})

// 方法
const handleTransformerChange = (transformerId: string) => {
  selectedTransformerId.value = transformerId
  emit('transformer-change', transformerId)
  
  if (props.autoTransform && props.rawData) {
    performTransform()
  }
}

const performTransform = async () => {
  if (!props.rawData || !currentTransformer.value || transforming.value) {
    return
  }

  transforming.value = true
  const startTime = Date.now()

  try {
    const result = await executeTransform(
      selectedTransformerId.value,
      {
        rawData: props.rawData,
        chartType: props.chartType,
        fieldMapping: props.fieldMapping,
        config: config.value
      }
    )

    const duration = Date.now() - startTime
    
    lastResult.value = {
      transformer: currentTransformer.value.name,
      recordCount: getRecordCount(result),
      duration,
      success: true,
      timestamp: new Date()
    }

    emit('transform', result)
    ElMessage.success('数据转换完成')

  } catch (error) {
    const duration = Date.now() - startTime
    
    lastResult.value = {
      transformer: currentTransformer.value?.name || '未知',
      recordCount: 0,
      duration,
      success: false,
      error: (error as Error).message,
      timestamp: new Date()
    }

    console.error('数据转换失败:', error)
    emit('error', error as Error)
    ElMessage.error(`转换失败: ${(error as Error).message}`)
  } finally {
    transforming.value = false
  }
}

const clearCache = () => {
  clearTransformCache()
  ElMessage.info('缓存已清空')
}

const getRecordCount = (result: any): number => {
  if (result?.chartData?.tableData) {
    return result.chartData.tableData.length
  }
  if (result?.chartData?.values) {
    return result.chartData.values.length
  }
  if (result?.transformedData?.data?.data) {
    return result.transformedData.data.data.length
  }
  return 0
}

// 监听数据变化
watch(
  () => [props.rawData, props.chartType, props.fieldMapping],
  () => {
    if (props.autoTransform && props.rawData) {
      performTransform()
    }
  },
  { deep: true }
)

// 监听转换器类型变化
watch(
  () => props.transformerType,
  (newType) => {
    if (newType && newType !== selectedTransformerId.value) {
      selectedTransformerId.value = newType
    }
  }
)

// 生命周期
onMounted(() => {
  if (props.autoTransform && props.rawData) {
    performTransform()
  }
})

// 暴露方法
defineExpose({
  transform: performTransform,
  getResult: () => lastResult.value,
  setTransformer: (id: string) => {
    selectedTransformerId.value = id
  }
})
</script>

<style scoped lang="scss">
.chart-data-transformer {
  .transformer-header {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .transformer-selector {
    margin-bottom: 16px;
    
    .transformer-option {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
  }

  .transformer-config {
    margin-bottom: 16px;
  }

  .transformer-actions {
    display: flex;
    gap: 8px;
    margin-bottom: 16px;
  }

  .transform-stats {
    margin-top: 16px;
  }
}
</style> 