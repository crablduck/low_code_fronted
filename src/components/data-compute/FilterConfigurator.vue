<template>
  <div class="filter-configurator">
    <div class="filter-list">
      <div
        v-for="(filter, index) in filters"
        :key="filter.id"
        class="filter-item"
      >
        <div class="filter-row">
          <!-- 逻辑操作符 -->
          <div class="logical-operator" v-if="index > 0">
            <el-select
              v-model="filter.logicalOperator"
              size="small"
              style="width: 60px"
              @change="onFilterChange"
            >
              <el-option label="AND" value="AND" />
              <el-option label="OR" value="OR" />
            </el-select>
          </div>

          <!-- 字段选择 -->
          <div class="field-select">
            <el-select
              v-model="filter.field"
              placeholder="选择字段"
              size="small"
              style="width: 120px"
              @change="onFieldSelect(filter, $event)"
              filterable
            >
              <el-option
                v-for="field in availableFields"
                :key="field.fieldName"
                :label="field.displayName || field.fieldName"
                :value="field.fieldName"
              >
                <div class="field-option">
                  <span>{{ field.displayName || field.fieldName }}</span>
                  <el-tag size="small" :type="getFieldTypeColor(field.dataType)">
                    {{ field.dataType }}
                  </el-tag>
                </div>
              </el-option>
            </el-select>
          </div>

          <!-- 操作符选择 -->
          <div class="operator-select">
            <el-select
              v-model="filter.operator"
              placeholder="操作符"
              size="small"
              style="width: 100px"
              @change="onOperatorChange(filter)"
            >
              <el-option
                v-for="op in getAvailableOperators(filter.dataType)"
                :key="op.value"
                :label="op.label"
                :value="op.value"
              />
            </el-select>
          </div>

          <!-- 值输入 -->
          <div class="value-input">
            <!-- 字符串类型 -->
            <el-input
              v-if="filter.dataType === 'string' && !isMultipleValueOperator(filter.operator)"
              v-model="filter.value"
              placeholder="输入值"
              size="small"
              style="width: 120px"
              @change="onFilterChange"
            />

            <!-- 数字类型 -->
            <el-input-number
              v-else-if="filter.dataType === 'number' && !isMultipleValueOperator(filter.operator)"
              v-model="filter.value"
              placeholder="输入数字"
              size="small"
              style="width: 120px"
              @change="onFilterChange"
            />

            <!-- 日期类型 -->
            <el-date-picker
              v-else-if="filter.dataType === 'date' && filter.operator !== 'between'"
              v-model="filter.value"
              type="date"
              placeholder="选择日期"
              size="small"
              style="width: 120px"
              format="YYYY-MM-DD"
              value-format="YYYY-MM-DD"
              @change="onFilterChange"
            />

            <!-- 日期时间类型 -->
            <el-date-picker
              v-else-if="(filter.dataType as string) === 'datetime' && filter.operator !== 'between'"
              v-model="filter.value"
              type="datetime"
              placeholder="选择日期时间"
              size="small"
              style="width: 150px"
              format="YYYY-MM-DD HH:mm:ss"
              value-format="YYYY-MM-DD HH:mm:ss"
              @change="onFilterChange"
            />

            <!-- 布尔类型 -->
            <el-select
              v-else-if="filter.dataType === 'boolean'"
              v-model="filter.value"
              placeholder="选择值"
              size="small"
              style="width: 120px"
              @change="onFilterChange"
            >
              <el-option label="是" :value="true" />
              <el-option label="否" :value="false" />
            </el-select>

            <!-- between 操作符 -->
            <div v-else-if="filter.operator === 'between'" class="between-input">
              <template v-if="filter.dataType === 'date'">
                <el-date-picker
                  v-model="filter.value[0]"
                  type="date"
                  placeholder="开始日期"
                  size="small"
                  style="width: 110px"
                  format="YYYY-MM-DD"
                  value-format="YYYY-MM-DD"
                  @change="onFilterChange"
                />
                <span class="between-separator">-</span>
                <el-date-picker
                  v-model="filter.value[1]"
                  type="date"
                  placeholder="结束日期"
                  size="small"
                  style="width: 110px"
                  format="YYYY-MM-DD"
                  value-format="YYYY-MM-DD"
                  @change="onFilterChange"
                />
              </template>
              <template v-else-if="filter.dataType === 'number'">
                <el-input-number
                  v-model="filter.value[0]"
                  placeholder="最小值"
                  size="small"
                  style="width: 110px"
                  @change="onFilterChange"
                />
                <span class="between-separator">-</span>
                <el-input-number
                  v-model="filter.value[1]"
                  placeholder="最大值"
                  size="small"
                  style="width: 110px"
                  @change="onFilterChange"
                />
              </template>
            </div>

            <!-- in/not_in 操作符 -->
            <el-select
              v-else-if="['in', 'not_in'].includes(filter.operator)"
              v-model="filter.value"
              placeholder="选择多个值"
              size="small"
              style="width: 180px"
              multiple
              filterable
              allow-create
              @change="onFilterChange"
            >
              <el-option
                v-for="option in getFieldOptions(filter.field)"
                :key="option"
                :label="option"
                :value="option"
              />
            </el-select>

            <!-- 空值操作符不需要输入值 -->
            <span v-else-if="['is_null', 'is_not_null'].includes(filter.operator)" class="no-value">
              无需输入值
            </span>
          </div>

          <!-- 操作按钮 -->
          <div class="filter-actions">
            <el-button
              size="small"
              type="danger"
              :icon="Delete"
              circle
              @click="removeFilter(index)"
            />
          </div>
        </div>

        <!-- 预览 -->
        <div class="filter-preview" v-if="filter.field && filter.operator">
          <span class="preview-text">{{ getFilterPreview(filter) }}</span>
        </div>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-if="filters.length === 0" class="empty-state">
      <el-empty description="暂无过滤条件" :image-size="80">
        <el-button type="primary" @click="addFilter">添加过滤条件</el-button>
      </el-empty>
    </div>

    <!-- 底部操作 -->
    <div class="footer-actions" v-if="filters.length > 0">
      <el-button size="small" @click="addFilter">
        <el-icon><Plus /></el-icon>
        添加条件
      </el-button>
      <el-button size="small" @click="clearFilters">
        <el-icon><Delete /></el-icon>
        清空全部
      </el-button>
      <div class="filter-summary">
        <span>共 {{ filters.length }} 个条件</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Plus, Delete } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import type { DataSet } from '@/types/dataManagement'
import type { FilterCondition } from '@/types/data-compute'

// Props & Emits
interface Props {
  filters: FilterCondition[]
  dataset: DataSet | null
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:filters': [filters: FilterCondition[]]
  'filterChange': []
}>()

// 计算属性
const availableFields = computed(() => props.dataset?.fields || [])

// 方法
const addFilter = () => {
  const newFilter: FilterCondition = {
    id: Date.now().toString(),
    field: '',
    operator: '=',
    value: '',
    dataType: 'string',
    logicalOperator: props.filters.length > 0 ? 'AND' : undefined
  }
  
  const updatedFilters = [...props.filters, newFilter]
  emit('update:filters', updatedFilters)
  emit('filterChange')
}

const removeFilter = (index: number) => {
  const updatedFilters = [...props.filters]
  updatedFilters.splice(index, 1)
  
  // 如果删除的是第一个条件，移除第二个条件的逻辑操作符
  if (index === 0 && updatedFilters.length > 0) {
    updatedFilters[0].logicalOperator = undefined
  }
  
  emit('update:filters', updatedFilters)
  emit('filterChange')
}

const clearFilters = () => {
  emit('update:filters', [])
  emit('filterChange')
  ElMessage.success('已清空所有过滤条件')
}

const onFieldSelect = (filter: FilterCondition, fieldName: string) => {
  const field = availableFields.value.find(f => f.fieldName === fieldName)
  if (field) {
    filter.dataType = field.dataType as any || 'string'
    filter.operator = '='
    filter.value = getDefaultValue(filter.dataType, filter.operator)
  }
  onFilterChange()
}

const onOperatorChange = (filter: FilterCondition) => {
  filter.value = getDefaultValue(filter.dataType, filter.operator)
  onFilterChange()
}

const onFilterChange = () => {
  emit('filterChange')
}

const getAvailableOperators = (dataType: string) => {
  const operators = [
    { label: '等于', value: '=' },
    { label: '不等于', value: '!=' },
    { label: '为空', value: 'is_null' },
    { label: '不为空', value: 'is_not_null' }
  ]

  if (['number', 'date', 'datetime'].includes(dataType)) {
    operators.push(
      { label: '大于', value: '>' },
      { label: '大于等于', value: '>=' },
      { label: '小于', value: '<' },
      { label: '小于等于', value: '<=' },
      { label: '范围', value: 'between' }
    )
  }

  if (['string', 'number'].includes(dataType)) {
    operators.push(
      { label: '包含', value: 'in' },
      { label: '不包含', value: 'not_in' }
    )
  }

  if (dataType === 'string') {
    operators.push(
      { label: '模糊匹配', value: 'like' }
    )
  }

  return operators
}

const isMultipleValueOperator = (operator: string) => {
  return ['in', 'not_in', 'between'].includes(operator)
}

const getDefaultValue = (dataType: string, operator: string) => {
  if (['is_null', 'is_not_null'].includes(operator)) {
    return null
  }
  
  if (['in', 'not_in'].includes(operator)) {
    return []
  }
  
  if (operator === 'between') {
    return ['', '']
  }
  
  switch (dataType) {
    case 'number':
      return 0
    case 'boolean':
      return true
    case 'date':
    case 'datetime':
      return ''
    default:
      return ''
  }
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
    'boolean': 'danger'
  }
  
  return colorMap[dataType?.toLowerCase() || ''] || 'info'
}

const getFieldOptions = (fieldName: string) => {
  // 这里可以根据字段名称返回预设的选项
  // 在实际项目中，可能需要从后端获取字段的唯一值
  return []
}

const getFilterPreview = (filter: FilterCondition): string => {
  const field = availableFields.value.find(f => f.fieldName === filter.field)
  const fieldLabel = field?.displayName || filter.field
  
  if (!filter.field || !filter.operator) return ''
  
  const operatorMap: Record<string, string> = {
    '=': '等于',
    '!=': '不等于',
    '>': '大于',
    '>=': '大于等于',
    '<': '小于',
    '<=': '小于等于',
    'like': '包含',
    'in': '包含于',
    'not_in': '不包含于',
    'between': '范围',
    'is_null': '为空',
    'is_not_null': '不为空'
  }
  
  const operatorText = operatorMap[filter.operator] || filter.operator
  
  if (['is_null', 'is_not_null'].includes(filter.operator)) {
    return `${fieldLabel} ${operatorText}`
  }
  
  if (filter.operator === 'between' && Array.isArray(filter.value)) {
    return `${fieldLabel} ${operatorText} ${filter.value[0]} 和 ${filter.value[1]}`
  }
  
  if (['in', 'not_in'].includes(filter.operator) && Array.isArray(filter.value)) {
    return `${fieldLabel} ${operatorText} [${filter.value.join(', ')}]`
  }
  
  return `${fieldLabel} ${operatorText} ${filter.value}`
}
</script>

<style scoped>
.filter-configurator {
  .filter-list {
    .filter-item {
      margin-bottom: 12px;
      padding: 12px;
      border: 1px solid #e4e7ed;
      border-radius: 6px;
      background: #fafafa;
      
      .filter-row {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 8px;
        
        .logical-operator {
          flex-shrink: 0;
        }
        
        .field-select {
          flex-shrink: 0;
        }
        
        .operator-select {
          flex-shrink: 0;
        }
        
        .value-input {
          flex: 1;
          min-width: 120px;
          
          .between-input {
            display: flex;
            align-items: center;
            gap: 4px;
            
            .between-separator {
              color: #909399;
              font-weight: 600;
            }
          }
          
          .no-value {
            color: #909399;
            font-size: 12px;
            font-style: italic;
          }
        }
        
        .filter-actions {
          flex-shrink: 0;
        }
      }
      
      .filter-preview {
        padding: 6px 8px;
        background: #f0f9ff;
        border: 1px solid #b3d8ff;
        border-radius: 4px;
        font-size: 12px;
        
        .preview-text {
          color: #409eff;
          font-weight: 500;
        }
      }
    }
  }
  
  .empty-state {
    text-align: center;
    padding: 40px 20px;
  }
  
  .footer-actions {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 0;
    border-top: 1px solid #e4e7ed;
    margin-top: 16px;
    
    .filter-summary {
      margin-left: auto;
      font-size: 12px;
      color: #909399;
    }
  }
}

/* 字段选项样式 */
.field-option {
  display: flex;
  justify-content: space-between;
  align-items: center;
  
  span {
    flex: 1;
  }
}

/* 深层样式覆盖 */
:deep(.el-select .el-input.is-focus .el-input__wrapper) {
  border-color: #409eff;
}

:deep(.el-date-editor.el-input) {
  width: 100% !important;
}
</style> 