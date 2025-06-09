<template>
  <div class="field-selector">
    <div class="selector-header">
      <h4>🏷️ 选择字段</h4>
      <div class="field-search">
        <el-input
          v-model="searchText"
          placeholder="搜索字段..."
          size="small"
          clearable
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
      </div>
    </div>

    <div class="field-list">
      <el-scrollbar max-height="300px">
        <div
          v-for="field in filteredFields"
          :key="field.fieldName"
          class="field-item"
          :class="{ 
            active: selectedField?.fieldName === field.fieldName,
            disabled: !isFieldSupported(field)
          }"
          @click="selectField(field)"
        >
          <div class="field-info">
            <div class="field-header">
              <el-icon class="field-icon">
                <component :is="getFieldIcon(field.dataType)" />
              </el-icon>
              <span class="field-name">{{ field.displayName || field.fieldName }}</span>
              <el-tag 
                size="small" 
                :type="getFieldTypeColor(field.dataType)"
                class="field-type"
              >
                {{ field.dataType }}
              </el-tag>
            </div>
            
            <div class="field-meta">
              <span class="field-description">{{ field.description || '无描述' }}</span>
            </div>

            <!-- 字段统计信息 -->
            <div class="field-stats" v-if="(field as any).statistics">
              <div class="stat-item" v-if="(field as any).statistics.count">
                <span class="stat-label">记录数:</span>
                <span class="stat-value">{{ (field as any).statistics.count }}</span>
              </div>
              <div class="stat-item" v-if="(field as any).statistics.uniqueCount">
                <span class="stat-label">唯一值:</span>
                <span class="stat-value">{{ (field as any).statistics.uniqueCount }}</span>
              </div>
              <div class="stat-item" v-if="field.dataType === 'number' && (field as any).statistics.range">
                <span class="stat-label">范围:</span>
                <span class="stat-value">{{ (field as any).statistics.range.min }} ~ {{ (field as any).statistics.range.max }}</span>
              </div>
            </div>

            <!-- 支持的聚合函数 -->
            <div class="supported-functions" v-if="getSupportedFunctions(field).length > 0">
              <span class="functions-label">支持函数:</span>
              <div class="functions-tags">
                <el-tag
                  v-for="func in getSupportedFunctions(field).slice(0, 3)"
                  :key="func"
                  size="small"
                  type="info"
                  class="function-tag"
                >
                  {{ func }}
                </el-tag>
                <el-tag
                  v-if="getSupportedFunctions(field).length > 3"
                  size="small"
                  type="info"
                  class="function-tag"
                >
                  +{{ getSupportedFunctions(field).length - 3 }}
                </el-tag>
              </div>
            </div>
          </div>

          <!-- 选中标记 -->
          <div class="field-check" v-if="selectedField?.fieldName === field.fieldName">
            <el-icon><Check /></el-icon>
          </div>
        </div>
      </el-scrollbar>
    </div>

    <!-- 字段信息面板 -->
    <el-card 
      v-if="selectedField" 
      class="field-detail-card"
      shadow="never"
    >
      <template #header>
        <span>字段详情</span>
      </template>
      
      <div class="field-detail">
        <div class="detail-row">
          <span class="detail-label">字段名:</span>
          <span class="detail-value">{{ selectedField.fieldName }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">显示名:</span>
          <span class="detail-value">{{ selectedField.displayName }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">数据类型:</span>
          <el-tag size="small" :type="getFieldTypeColor(selectedField.dataType)">
            {{ selectedField.dataType }}
          </el-tag>
        </div>
        <div class="detail-row" v-if="selectedField.description">
          <span class="detail-label">描述:</span>
          <span class="detail-value">{{ selectedField.description }}</span>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Search, Check } from '@element-plus/icons-vue'
import { 
  Calendar, 
  Document, 
  Connection, 
  Switch,
  Histogram
} from '@element-plus/icons-vue'
import type { DataSet, DataSetField } from '@/types/dataManagement'

// Props & Emits
interface Props {
  dataset: DataSet | null
  selectedField?: DataSetField | null
}

const props = withDefaults(defineProps<Props>(), {
  selectedField: null
})

const emit = defineEmits<{
  'update:selectedField': [field: DataSetField | null]
  'fieldChange': [field: DataSetField | null]
}>()

// 响应式数据
const searchText = ref('')

// 计算属性
const filteredFields = computed(() => {
  if (!props.dataset?.fields) return []
  
  const fields = props.dataset.fields
  if (!searchText.value.trim()) return fields
  
  const searchTerm = searchText.value.toLowerCase()
  return fields.filter(field => 
    (field.fieldName?.toLowerCase().includes(searchTerm)) ||
    (field.displayName?.toLowerCase().includes(searchTerm)) ||
    (field.description?.toLowerCase().includes(searchTerm))
  )
})

// 方法
const selectField = (field: DataSetField) => {
  if (!isFieldSupported(field)) return
  
  emit('update:selectedField', field)
  emit('fieldChange', field)
}

const isFieldSupported = (field: DataSetField): boolean => {
  // 检查字段是否支持聚合计算
  const supportedTypes = ['number', 'integer', 'decimal', 'date', 'datetime', 'string']
  return supportedTypes.includes(field.dataType?.toLowerCase() || '')
}

const getFieldIcon = (dataType?: string) => {
  const iconMap: Record<string, any> = {
    'number': Histogram,
    'integer': Histogram,
    'decimal': Histogram,
    'string': Document,
    'text': Document,
    'date': Calendar,
    'datetime': Calendar,
    'boolean': Switch,
    'json': Connection
  }
  
  return iconMap[dataType?.toLowerCase() || ''] || Document
}

const getFieldTypeColor = (dataType?: string): string => {
  const colorMap: Record<string, string> = {
    'number': 'success',
    'integer': 'success',
    'decimal': 'success',
    'string': 'info',
    'text': 'info',
    'date': 'warning',
    'datetime': 'warning',
    'boolean': 'danger',
    'json': 'primary'
  }
  
  return colorMap[dataType?.toLowerCase() || ''] || 'info'
}

const getSupportedFunctions = (field: DataSetField): string[] => {
  const dataType = field.dataType?.toLowerCase()
  
  switch (dataType) {
    case 'number':
    case 'integer':
    case 'decimal':
      return ['SUM', 'AVG', 'COUNT', 'MAX', 'MIN', 'MEDIAN', 'STDDEV']
    
    case 'date':
    case 'datetime':
      return ['COUNT', 'MAX', 'MIN', 'FIRST', 'LAST']
    
    case 'string':
    case 'text':
      return ['COUNT', 'DISTINCT', 'FIRST', 'LAST', 'MODE']
    
    case 'boolean':
      return ['COUNT', 'SUM']
    
    default:
      return ['COUNT']
  }
}

// 监听 dataset 变化，清空选择
watch(() => props.dataset, () => {
  emit('update:selectedField', null)
  searchText.value = ''
}, { deep: true })
</script>

<style scoped>
.field-selector {
  .selector-header {
    margin-bottom: 16px;
    
    h4 {
      margin: 0 0 8px 0;
      color: #303133;
      font-size: 14px;
    }
    
    .field-search {
      :deep(.el-input) {
        --el-input-border-radius: 6px;
      }
    }
  }

  .field-list {
    border: 1px solid #e4e7ed;
    border-radius: 6px;
    background: #fafafa;
  }

  .field-item {
    padding: 12px;
    border-bottom: 1px solid #f0f0f0;
    cursor: pointer;
    transition: all 0.2s;
    position: relative;
    background: white;
    margin: 4px;
    border-radius: 4px;

    &:hover {
      background: #f0f9ff;
      border-color: #409eff;
    }

    &.active {
      background: #ecf5ff;
      border-color: #409eff;
      box-shadow: 0 0 0 1px #409eff;
    }

    &.disabled {
      opacity: 0.5;
      cursor: not-allowed;
      
      &:hover {
        background: white;
        border-color: #f0f0f0;
      }
    }

    &:last-child {
      border-bottom: none;
    }

    .field-info {
      .field-header {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 6px;

        .field-icon {
          font-size: 16px;
          color: #909399;
        }

        .field-name {
          font-weight: 600;
          color: #303133;
          flex: 1;
        }

        .field-type {
          font-size: 10px;
        }
      }

      .field-meta {
        margin-bottom: 8px;

        .field-description {
          font-size: 12px;
          color: #666;
          line-height: 1.4;
        }
      }

      .field-stats {
        display: flex;
        gap: 12px;
        margin-bottom: 8px;
        font-size: 11px;

        .stat-item {
          .stat-label {
            color: #909399;
          }

          .stat-value {
            color: #303133;
            font-weight: 500;
            margin-left: 4px;
          }
        }
      }

      .supported-functions {
        .functions-label {
          font-size: 11px;
          color: #909399;
          display: block;
          margin-bottom: 4px;
        }

        .functions-tags {
          display: flex;
          gap: 4px;
          flex-wrap: wrap;

          .function-tag {
            font-size: 10px;
            height: 18px;
            line-height: 18px;
            padding: 0 6px;
          }
        }
      }
    }

    .field-check {
      position: absolute;
      top: 8px;
      right: 8px;
      color: #409eff;
      font-size: 18px;
    }
  }

  .field-detail-card {
    margin-top: 16px;
    
    :deep(.el-card__header) {
      padding: 12px 16px;
      background: #f8f9fa;
      
      span {
        font-size: 13px;
        font-weight: 600;
        color: #303133;
      }
    }

    :deep(.el-card__body) {
      padding: 12px 16px;
    }

    .field-detail {
      .detail-row {
        display: flex;
        align-items: center;
        margin-bottom: 8px;
        font-size: 12px;

        &:last-child {
          margin-bottom: 0;
        }

        .detail-label {
          width: 60px;
          color: #909399;
          flex-shrink: 0;
        }

        .detail-value {
          color: #303133;
          font-weight: 500;
        }
      }
    }
  }
}

/* 空状态 */
.field-list:empty::after {
  content: '暂无可用字段';
  display: block;
  text-align: center;
  color: #909399;
  padding: 40px 20px;
  font-size: 14px;
}
</style> 