<template>
  <div class="chart-global-filter-binding-panel">
    <el-card class="config-card">
      <template #header>
        <div class="card-header">
          <el-icon><Connection /></el-icon>
          <span>全局筛选器绑定</span>
        </div>
      </template>

      <div class="binding-config">
        <!-- 启用全局筛选器 -->
        <el-form-item label="启用全局筛选器">
          <el-switch 
            v-model="useGlobalFilters" 
            @change="handleUseGlobalFiltersChange"
          />
          <div class="help-text">开启后，此图表将响应全局筛选器的变化</div>
        </el-form-item>

        <!-- 筛选器绑定列表 -->
        <div v-if="useGlobalFilters" class="bindings-section">
          <div class="section-header">
            <h4>绑定配置</h4>
            <el-button 
              size="small" 
              type="primary" 
              @click="addBinding"
              :disabled="availableFilters.length === 0"
            >
              <el-icon><Plus /></el-icon>
              添加绑定
            </el-button>
          </div>

          <div v-if="availableFilters.length === 0" class="empty-state">
            <el-alert
              title="暂无可用的全局筛选器"
              description="请先在仪表盘中配置全局筛选器，然后再进行绑定设置"
              type="info"
              show-icon
              :closable="false"
            />
          </div>

          <div v-else-if="bindings.length === 0" class="empty-bindings">
            <el-empty description="暂无绑定配置">
              <el-button type="primary" @click="addBinding">添加第一个绑定</el-button>
            </el-empty>
          </div>

          <div v-else class="bindings-list">
            <div 
              v-for="(binding, index) in bindings" 
              :key="index"
              class="binding-item"
            >
              <el-card shadow="never" class="binding-card">
                <div class="binding-header">
                  <span class="binding-index">绑定 {{ index + 1 }}</span>
                  <el-button 
                    size="small" 
                    type="danger" 
                    text 
                    @click="removeBinding(index)"
                  >
                    <el-icon><Delete /></el-icon>
                    删除
                  </el-button>
                </div>

                <el-form :model="binding" label-width="100px" size="small">
                  <el-form-item label="全局筛选器" required>
                    <el-select 
                      v-model="binding.filterKey" 
                      placeholder="选择全局筛选器"
                      @change="handleFilterKeyChange(binding, $event)"
                      style="width: 100%"
                    >
                      <el-option
                        v-for="filter in availableFiltersForBinding(binding)"
                        :key="filter.key"
                        :label="`${filter.label} (${filter.key})`"
                        :value="filter.key"
                      >
                        <div class="filter-option">
                          <span class="filter-name">{{ filter.label }}</span>
                          <el-tag 
                            size="small" 
                            :type="getControlTypeColor(filter.controlType)"
                          >
                            {{ getControlTypeLabel(filter.controlType) }}
                          </el-tag>
                        </div>
                      </el-option>
                    </el-select>
                  </el-form-item>

                  <el-form-item label="图表字段" required>
                    <el-select 
                      v-model="binding.chartField" 
                      placeholder="选择图表对应的字段"
                      @change="validateAndEmit"
                      style="width: 100%"
                    >
                      <el-option
                        v-for="field in chartFields"
                        :key="field.fieldName"
                        :label="`${field.displayName} (${field.fieldName})`"
                        :value="field.fieldName"
                      />
                    </el-select>
                    <div class="help-text">
                      选择图表数据集中对应的字段，筛选器的值将作为此字段的过滤条件
                    </div>
                  </el-form-item>

                  <!-- 字段映射预览 -->
                  <el-form-item v-if="binding.filterKey && binding.chartField" label="映射预览">
                    <div class="mapping-preview">
                      <div class="mapping-item">
                        <span class="mapping-label">筛选器：</span>
                        <el-tag>{{ getFilterLabel(binding.filterKey) }}</el-tag>
                      </div>
                      <el-icon class="mapping-arrow"><Right /></el-icon>
                      <div class="mapping-item">
                        <span class="mapping-label">图表字段：</span>
                        <el-tag type="success">{{ binding.chartField }}</el-tag>
                      </div>
                    </div>
                  </el-form-item>
                </el-form>
              </el-card>
            </div>
          </div>
        </div>

        <!-- 配置预览 -->
        <div v-if="useGlobalFilters && bindings.length > 0" class="config-preview">
          <el-divider />
          <h4>配置预览</h4>
          <el-alert
            :title="`已配置 ${bindings.length} 个筛选器绑定`"
            type="success"
            show-icon
            :closable="false"
          >
            <template #default>
              <div class="preview-content">
                <p>当前图表将响应以下全局筛选器的变化：</p>
                <ul class="binding-list">
                  <li v-for="binding in validBindings" :key="binding.filterKey">
                    <strong>{{ getFilterLabel(binding.filterKey) }}</strong> 
                    → {{ binding.chartField }}
                  </li>
                </ul>
              </div>
            </template>
          </el-alert>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Connection, Plus, Delete, Right } from '@element-plus/icons-vue'
import type { 
  GlobalFilterConfig, 
  GlobalFilterBinding,
  ChartConfig 
} from '@/shared/types/dashboard'
import type { DataSetField } from '@/shared/types/dataManagement'

// Props
interface Props {
  modelValue?: ChartConfig
  globalFilters?: GlobalFilterConfig[]
  chartFields?: DataSetField[]
}

const props = withDefaults(defineProps<Props>(), {
  globalFilters: () => [],
  chartFields: () => []
})

// Emits
const emit = defineEmits<{
  'update:modelValue': [value: ChartConfig]
}>()

// 响应式数据
const useGlobalFilters = ref(props.modelValue?.useGlobalFilters || false)
const bindings = ref<GlobalFilterBinding[]>(
  props.modelValue?.globalFilterBindings || []
)

// 计算属性
const availableFilters = computed(() => props.globalFilters || [])

const chartFields = computed(() => props.chartFields || [])

const validBindings = computed(() => 
  bindings.value.filter(binding => 
    binding.filterKey && binding.chartField
  )
)

const currentConfig = computed<ChartConfig>(() => ({
  ...props.modelValue,
  useGlobalFilters: useGlobalFilters.value,
  globalFilterBindings: validBindings.value
} as ChartConfig))

// 监听变化
watch(
  () => props.modelValue,
  (newVal) => {
    if (newVal) {
      useGlobalFilters.value = newVal.useGlobalFilters || false
      bindings.value = newVal.globalFilterBindings || []
    }
  },
  { deep: true }
)

// 方法
const handleUseGlobalFiltersChange = (value: boolean) => {
  useGlobalFilters.value = value
  if (!value) {
    bindings.value = []
  }
  validateAndEmit()
}

const addBinding = () => {
  const newBinding: GlobalFilterBinding = {
    filterKey: '',
    chartField: ''
  }
  bindings.value.push(newBinding)
}

const removeBinding = (index: number) => {
  bindings.value.splice(index, 1)
  validateAndEmit()
}

const handleFilterKeyChange = (binding: GlobalFilterBinding, filterKey: string) => {
  binding.filterKey = filterKey
  validateAndEmit()
}

const validateAndEmit = () => {
  emit('update:modelValue', currentConfig.value)
}

const availableFiltersForBinding = (currentBinding: GlobalFilterBinding) => {
  // 排除已被其他绑定使用的筛选器
  const usedFilterKeys = bindings.value
    .filter(b => b !== currentBinding && b.filterKey)
    .map(b => b.filterKey)
  
  return availableFilters.value.filter(filter => 
    !usedFilterKeys.includes(filter.key)
  )
}

const getFilterLabel = (filterKey: string): string => {
  const filter = availableFilters.value.find(f => f.key === filterKey)
  return filter ? filter.label : filterKey
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
</script>

<style scoped lang="scss">
.chart-global-filter-binding-panel {
  .config-card {
    .card-header {
      display: flex;
      align-items: center;
      gap: 8px;
    }
  }

  .binding-config {
    .help-text {
      font-size: 12px;
      color: #909399;
      margin-top: 4px;
    }

    .bindings-section {
      margin-top: 16px;

      .section-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 16px;

        h4 {
          margin: 0;
          font-size: 14px;
          color: #303133;
        }
      }

      .empty-state,
      .empty-bindings {
        margin: 16px 0;
      }

      .bindings-list {
        .binding-item {
          margin-bottom: 12px;

          .binding-card {
            border: 1px solid #e4e7ed;

            .binding-header {
              display: flex;
              align-items: center;
              justify-content: space-between;
              margin-bottom: 12px;

              .binding-index {
                font-size: 13px;
                font-weight: 500;
                color: #606266;
              }
            }

            .filter-option {
              display: flex;
              align-items: center;
              justify-content: space-between;
              width: 100%;

              .filter-name {
                flex: 1;
              }
            }

            .mapping-preview {
              display: flex;
              align-items: center;
              gap: 12px;
              padding: 12px;
              background: #f5f7fa;
              border-radius: 4px;

              .mapping-item {
                display: flex;
                align-items: center;
                gap: 6px;

                .mapping-label {
                  font-size: 12px;
                  color: #606266;
                }
              }

              .mapping-arrow {
                color: #909399;
              }
            }
          }
        }
      }
    }

    .config-preview {
      h4 {
        margin: 16px 0 12px 0;
        font-size: 14px;
        color: #303133;
      }

      .preview-content {
        p {
          margin: 0 0 8px 0;
          font-size: 13px;
        }

        .binding-list {
          margin: 8px 0 0 16px;
          
          li {
            font-size: 13px;
            line-height: 1.6;
            color: #606266;
          }
        }
      }
    }
  }
}
</style> 