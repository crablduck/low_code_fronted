<template>
  <div class="enhanced-fields-config">
    <!-- 配置选项卡 -->
    <el-tabs v-model="activeTab" @tab-change="handleTabChange">
      <!-- 字段选择 -->
      <el-tab-pane label="字段选择" name="selection">
        <div class="field-selection-panel">
          <div class="selection-header">
            <div class="header-info">
              <span>共 {{ availableFields.length }} 个字段，已选择 {{ selectedFields.length }} 个</span>
            </div>
            <div class="header-actions">
              <el-button size="small" @click="selectAll">全选</el-button>
              <el-button size="small" @click="clearAll">清空</el-button>
              <el-button size="small" @click="smartConfig">智能配置</el-button>
            </div>
          </div>

          <!-- 搜索框 -->
          <el-input
            v-model="searchKeyword"
            placeholder="搜索字段名"
            prefix-icon="Search"
            size="small"
            clearable
            style="margin-bottom: 12px;"
          />
          
          <!-- 字段卡片 -->
          <div class="fields-grid">
            <div
              v-for="field in filteredFields"
              :key="`${field.tableName}-${field.name}`"
              class="field-card"
              :class="{ 
                selected: isFieldSelected(field),
                primary: field.isPrimary
              }"
              @click="toggleField(field)"
            >
              <div class="field-header">
                <el-checkbox
                  :model-value="isFieldSelected(field)"
                  @change="toggleField(field)"
                  @click.stop
                />
                <div class="field-info">
                  <div class="field-name">
                    <el-icon v-if="field.isPrimary"><Key /></el-icon>
                    {{ field.name }}
                  </div>
                  <div class="field-meta">
                    <el-tag v-if="queryType === 'multi'" size="small" type="info">
                      {{ field.tableName }}
                    </el-tag>
                    <el-tag size="small" :type="getDataTypeColor(field.dataType)">
                      {{ field.dataType }}
                    </el-tag>
                  </div>
                </div>
              </div>
              
              <div v-if="field.description" class="field-description">
                {{ field.description }}
              </div>
            </div>
          </div>

          <!-- 字段配置表格 -->
          <div v-if="selectedFields.length > 0" class="fields-configuration">
            <h4>字段配置</h4>
            
            <el-table :data="fieldConfigs" style="width: 100%" max-height="400">
              <el-table-column prop="fieldName" label="字段名" width="150" />
              <el-table-column prop="displayName" label="显示名称" width="150">
                <template #default="{ row, $index }">
                  <el-input
                    v-model="row.displayName"
                    size="small"
                    @change="updateFieldConfig($index, 'displayName', row.displayName)"
                  />
                </template>
              </el-table-column>
              <el-table-column prop="fieldType" label="字段类型" width="120">
                <template #default="{ row, $index }">
                  <el-select
                    v-model="row.fieldType"
                    size="small"
                    @change="updateFieldConfig($index, 'fieldType', row.fieldType)"
                  >
                    <el-option label="维度" value="dimension" />
                    <el-option label="指标" value="metric" />
                  </el-select>
                </template>
              </el-table-column>
              <el-table-column prop="aggregation" label="聚合方式" width="120">
                <template #default="{ row, $index }">
                  <el-select
                    v-model="row.aggregation"
                    size="small"
                    :disabled="row.fieldType !== 'metric'"
                    @change="updateFieldConfig($index, 'aggregation', row.aggregation)"
                  >
                    <el-option label="求和" value="sum" />
                    <el-option label="计数" value="count" />
                    <el-option label="平均" value="avg" />
                    <el-option label="最大" value="max" />
                    <el-option label="最小" value="min" />
                  </el-select>
                </template>
              </el-table-column>
              <el-table-column prop="isVisible" label="是否可见" width="100">
                <template #default="{ row, $index }">
                  <el-switch
                    v-model="row.isVisible"
                    @change="updateFieldConfig($index, 'isVisible', row.isVisible)"
                  />
                </template>
              </el-table-column>
            </el-table>
          </div>
        </div>
      </el-tab-pane>

      <!-- 计算字段 -->
      <el-tab-pane label="计算字段" name="calculated">
        <div class="calculated-fields-panel">
          <div class="panel-header">
            <h4>计算字段配置</h4>
            <el-button type="primary" size="small" @click="showAddCalculated = true">
              <el-icon><Plus /></el-icon>
              添加计算字段
            </el-button>
          </div>

          <!-- 计算字段列表 -->
          <el-table :data="calculatedFields" style="width: 100%">
            <el-table-column prop="name" label="字段名称" width="150" />
            <el-table-column prop="displayName" label="显示名称" width="150" />
            <el-table-column prop="formula" label="计算公式" min-width="200" />
            <el-table-column prop="dataType" label="数据类型" width="100" />
            <el-table-column label="操作" width="150">
              <template #default="{ row, $index }">
                <el-button size="small" @click="editCalculatedField($index)">编辑</el-button>
                <el-button size="small" type="danger" @click="removeCalculatedField($index)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>

          <el-empty v-if="calculatedFields.length === 0" description="暂无计算字段" />
        </div>
      </el-tab-pane>

      <!-- 字段过滤 -->
      <el-tab-pane label="字段过滤" name="filter">
        <div class="field-filter-panel">
          <div class="panel-header">
            <h4>字段过滤配置</h4>
            <el-button type="primary" size="small" @click="showAddFilter = true">
              <el-icon><Plus /></el-icon>
              添加过滤条件
            </el-button>
          </div>

          <!-- 过滤条件列表 -->
          <div class="filter-conditions">
            <div
              v-for="(filter, index) in filterConditions"
              :key="index"
              class="filter-item"
            >
              <div class="filter-content">
                <div class="filter-field">
                  <el-select v-model="filter.fieldName" placeholder="选择字段" size="small">
                    <el-option
                      v-for="field in allFieldsForFilter"
                      :key="`${field.tableName}-${field.name}`"
                      :label="field.name"
                      :value="field.name"
                    />
                  </el-select>
                </div>
                <div class="filter-operator">
                  <el-select v-model="filter.operator" placeholder="选择条件" size="small">
                    <el-option label="等于" value="equals" />
                    <el-option label="不等于" value="not_equals" />
                    <el-option label="包含" value="contains" />
                    <el-option label="不包含" value="not_contains" />
                    <el-option label="大于" value="greater_than" />
                    <el-option label="小于" value="less_than" />
                    <el-option label="大于等于" value="greater_equal" />
                    <el-option label="小于等于" value="less_equal" />
                    <el-option label="为空" value="is_null" />
                    <el-option label="不为空" value="is_not_null" />
                  </el-select>
                </div>
                <div class="filter-value" v-if="!isNullOperator(filter.operator)">
                  <el-input v-model="filter.value" placeholder="输入值" size="small" />
                </div>
                <div class="filter-actions">
                  <el-button size="small" type="danger" @click="removeFilter(index)">
                    <el-icon><Delete /></el-icon>
                  </el-button>
                </div>
              </div>
            </div>

            <el-empty v-if="filterConditions.length === 0" description="暂无过滤条件" />
          </div>
        </div>
      </el-tab-pane>
    </el-tabs>

    <!-- 计算字段对话框 -->
    <el-dialog
      v-model="showAddCalculated"
      title="添加计算字段"
      width="700px"
      @close="resetCalculatedForm"
    >
      <el-form :model="calculatedForm" label-width="100px">
        <el-form-item label="字段名称" required>
          <el-input v-model="calculatedForm.name" placeholder="请输入字段名称" />
        </el-form-item>
        <el-form-item label="显示名称" required>
          <el-input v-model="calculatedForm.displayName" placeholder="请输入显示名称" />
        </el-form-item>
        <el-form-item label="数据类型" required>
          <el-select v-model="calculatedForm.dataType" placeholder="选择数据类型">
            <el-option label="字符串" value="string" />
            <el-option label="数字" value="number" />
            <el-option label="日期" value="date" />
            <el-option label="布尔" value="boolean" />
          </el-select>
        </el-form-item>
        <el-form-item label="计算公式" required>
          <div class="formula-editor">
            <el-input
              v-model="calculatedForm.formula"
              type="textarea"
              :rows="4"
              placeholder="请输入计算公式，如: field1 + field2"
            />
            <div class="formula-tools">
              <div class="available-fields">
                <span class="tool-label">可用字段：</span>
                <el-button
                  v-for="field in availableFields"
                  :key="`${field.tableName}-${field.name}`"
                  size="small"
                  type="info"
                  @click="insertField(field.name)"
                >
                  {{ field.name }}
                </el-button>
              </div>
              <div class="formula-functions">
                <span class="tool-label">函数：</span>
                <el-button size="small" type="info" @click="insertFunction('SUM')">SUM</el-button>
                <el-button size="small" type="info" @click="insertFunction('AVG')">AVG</el-button>
                <el-button size="small" type="info" @click="insertFunction('COUNT')">COUNT</el-button>
                <el-button size="small" type="info" @click="insertFunction('MAX')">MAX</el-button>
                <el-button size="small" type="info" @click="insertFunction('MIN')">MIN</el-button>
              </div>
            </div>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddCalculated = false">取消</el-button>
        <el-button type="primary" @click="addCalculatedField">确定</el-button>
      </template>
    </el-dialog>

    <!-- 过滤条件对话框 -->
    <el-dialog
      v-model="showAddFilter"
      title="添加过滤条件"
      width="500px"
      @close="resetFilterForm"
    >
      <el-form :model="filterForm" label-width="80px">
        <el-form-item label="字段" required>
          <el-select v-model="filterForm.fieldName" placeholder="选择字段">
            <el-option
              v-for="field in allFieldsForFilter"
              :key="`${field.tableName}-${field.name}`"
              :label="field.name"
              :value="field.name"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="条件" required>
          <el-select v-model="filterForm.operator" placeholder="选择条件">
            <el-option label="等于" value="equals" />
            <el-option label="不等于" value="not_equals" />
            <el-option label="包含" value="contains" />
            <el-option label="不包含" value="not_contains" />
            <el-option label="大于" value="greater_than" />
            <el-option label="小于" value="less_than" />
            <el-option label="大于等于" value="greater_equal" />
            <el-option label="小于等于" value="less_equal" />
            <el-option label="为空" value="is_null" />
            <el-option label="不为空" value="is_not_null" />
          </el-select>
        </el-form-item>
        <el-form-item label="值" v-if="!isNullOperator(filterForm.operator)">
          <el-input v-model="filterForm.value" placeholder="输入过滤值" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddFilter = false">取消</el-button>
        <el-button type="primary" @click="addFilterCondition">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Key, Plus, Delete, Search } from '@element-plus/icons-vue'
import type { FieldInfo, DataSetFieldConfig } from '@/shared/types/dataManagement'

// Props
interface Props {
  modelValue: DataSetFieldConfig[]
  availableFields: FieldInfo[]
  queryType: 'single' | 'multi' | 'sql'
  dataSourceId?: number
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: () => [],
  availableFields: () => [],
  queryType: 'single'
})

// Emits
const emit = defineEmits<{
  'update:modelValue': [value: DataSetFieldConfig[]]
}>()

// 响应式数据
const activeTab = ref('selection')
const searchKeyword = ref('')
const showAddCalculated = ref(false)
const showAddFilter = ref(false)

// 计算字段相关
const calculatedFields = ref<Array<{
  name: string
  displayName: string
  formula: string
  dataType: string
}>>([])

const calculatedForm = reactive({
  name: '',
  displayName: '',
  formula: '',
  dataType: 'string'
})

// 过滤条件相关
const filterConditions = ref<Array<{
  fieldName: string
  operator: string
  value: string
}>>([])

const filterForm = reactive({
  fieldName: '',
  operator: '',
  value: ''
})

// 计算属性
const fieldConfigs = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const filteredFields = computed(() => {
  if (!searchKeyword.value) return props.availableFields
  return props.availableFields.filter(field =>
    field.name.toLowerCase().includes(searchKeyword.value.toLowerCase()) ||
    (field.description && field.description.toLowerCase().includes(searchKeyword.value.toLowerCase()))
  )
})

const selectedFields = computed(() => {
  return props.availableFields.filter(field => 
    fieldConfigs.value.some(config => 
      config.fieldName === field.name && 
      (props.queryType === 'single' || config.tableName === field.tableName)
    )
  )
})

const allFieldsForFilter = computed(() => {
  return [...props.availableFields, ...calculatedFields.value.map(cf => ({
    name: cf.name,
    tableName: '',
    dataType: cf.dataType,
    isPrimary: false,
    isNullable: true,
    description: cf.displayName
  }))]
})

// 方法
const handleTabChange = (tabName: string) => {
  console.log('切换到标签页:', tabName)
}

const isFieldSelected = (field: FieldInfo) => {
  return fieldConfigs.value.some(config => 
    config.fieldName === field.name && 
    (props.queryType === 'single' || config.tableName === field.tableName)
  )
}

const toggleField = (field: FieldInfo) => {
  const existingIndex = fieldConfigs.value.findIndex(config => 
    config.fieldName === field.name && 
    (props.queryType === 'single' || config.tableName === field.tableName)
  )

  if (existingIndex >= 0) {
    // 移除字段
    fieldConfigs.value.splice(existingIndex, 1)
  } else {
    // 添加字段
    const newConfig: DataSetFieldConfig = {
      fieldName: field.name,
      displayName: field.description || field.name,
      tableName: field.tableName || '',
      fieldType: getFieldTypeFromDataType(field.dataType),
      isVisible: true,
      description: field.description || '',
      sortOrder: fieldConfigs.value.length,
      aggregation: getFieldTypeFromDataType(field.dataType) === 'metric' ? 'sum' : undefined
    }
    fieldConfigs.value.push(newConfig)
  }
}

const getFieldTypeFromDataType = (dataType: string): 'dimension' | 'metric' => {
  const type = dataType.toLowerCase()
  if (type.includes('int') || type.includes('decimal') || type.includes('float') || type.includes('double')) {
    return 'metric'
  }
  return 'dimension'
}

const getDataTypeColor = (dataType: string) => {
  const type = dataType.toLowerCase()
  if (type.includes('int') || type.includes('decimal') || type.includes('float') || type.includes('double')) {
    return 'success'
  } else if (type.includes('char') || type.includes('text') || type.includes('varchar')) {
    return 'info'
  } else if (type.includes('date') || type.includes('time')) {
    return 'warning'
  }
  return ''
}

const selectAll = () => {
  props.availableFields.forEach(field => {
    if (!isFieldSelected(field)) {
      toggleField(field)
    }
  })
}

const clearAll = () => {
  fieldConfigs.value.splice(0)
}

const smartConfig = () => {
  clearAll()
  props.availableFields.forEach(field => {
    const fieldType = getFieldTypeFromDataType(field.dataType)
    if (fieldType === 'dimension' || field.isPrimary) {
      toggleField(field)
    }
  })
  ElMessage.success('智能配置完成')
}

const updateFieldConfig = (index: number, key: string, value: any) => {
  if (fieldConfigs.value[index]) {
    ;(fieldConfigs.value[index] as any)[key] = value
  }
}

// 计算字段方法
const addCalculatedField = () => {
  if (!calculatedForm.name || !calculatedForm.displayName || !calculatedForm.formula) {
    ElMessage.warning('请填写完整的计算字段信息')
    return
  }

  calculatedFields.value.push({
    name: calculatedForm.name,
    displayName: calculatedForm.displayName,
    formula: calculatedForm.formula,
    dataType: calculatedForm.dataType
  })

  // 添加到字段配置
  const newConfig: DataSetFieldConfig = {
    fieldName: calculatedForm.name,
    displayName: calculatedForm.displayName,
    tableName: '',
    fieldType: calculatedForm.dataType === 'number' ? 'metric' : 'dimension',
    isVisible: true,
    description: `计算字段: ${calculatedForm.formula}`,
    sortOrder: fieldConfigs.value.length,
    aggregation: calculatedForm.dataType === 'number' ? 'sum' : undefined
  }
  fieldConfigs.value.push(newConfig)

  showAddCalculated.value = false
  resetCalculatedForm()
  ElMessage.success('计算字段添加成功')
}

const editCalculatedField = (index: number) => {
  const field = calculatedFields.value[index]
  calculatedForm.name = field.name
  calculatedForm.displayName = field.displayName
  calculatedForm.formula = field.formula
  calculatedForm.dataType = field.dataType
  showAddCalculated.value = true
}

const removeCalculatedField = (index: number) => {
  const field = calculatedFields.value[index]
  calculatedFields.value.splice(index, 1)
  
  // 从字段配置中移除
  const configIndex = fieldConfigs.value.findIndex(config => config.fieldName === field.name)
  if (configIndex >= 0) {
    fieldConfigs.value.splice(configIndex, 1)
  }
  
  ElMessage.success('计算字段删除成功')
}

const resetCalculatedForm = () => {
  calculatedForm.name = ''
  calculatedForm.displayName = ''
  calculatedForm.formula = ''
  calculatedForm.dataType = 'string'
}

const insertField = (fieldName: string) => {
  calculatedForm.formula += ` ${fieldName} `
}

const insertFunction = (funcName: string) => {
  calculatedForm.formula += ` ${funcName}() `
}

// 过滤条件方法
const addFilterCondition = () => {
  if (!filterForm.fieldName || !filterForm.operator) {
    ElMessage.warning('请填写完整的过滤条件')
    return
  }

  if (!isNullOperator(filterForm.operator) && !filterForm.value) {
    ElMessage.warning('请输入过滤值')
    return
  }

  filterConditions.value.push({
    fieldName: filterForm.fieldName,
    operator: filterForm.operator,
    value: filterForm.value
  })

  showAddFilter.value = false
  resetFilterForm()
  ElMessage.success('过滤条件添加成功')
}

const removeFilter = (index: number) => {
  filterConditions.value.splice(index, 1)
}

const resetFilterForm = () => {
  filterForm.fieldName = ''
  filterForm.operator = ''
  filterForm.value = ''
}

const isNullOperator = (operator: string) => {
  return operator === 'is_null' || operator === 'is_not_null'
}

// 监听props变化
watch(() => props.availableFields, () => {
  // 当可用字段变化时，清理无效的字段配置
  fieldConfigs.value = fieldConfigs.value.filter(config =>
    props.availableFields.some(field => 
      field.name === config.fieldName && 
      (props.queryType === 'single' || field.tableName === config.tableName)
    )
  )
}, { deep: true })
</script>

<style scoped lang="scss">
.enhanced-fields-config {
  .field-selection-panel {
    .selection-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
      
      .header-info {
        font-size: 14px;
        color: #666;
      }
      
      .header-actions {
        display: flex;
        gap: 8px;
      }
    }
    
    .fields-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 12px;
      margin-bottom: 20px;
      max-height: 300px;
      overflow-y: auto;
      
      .field-card {
        border: 1px solid #e4e7ed;
        border-radius: 8px;
        padding: 12px;
        cursor: pointer;
        transition: all 0.3s;
        
        &:hover {
          border-color: #409eff;
          box-shadow: 0 2px 8px rgba(64, 158, 255, 0.15);
        }
        
        &.selected {
          border-color: #409eff;
          background-color: #ecf5ff;
        }
        
        &.primary {
          border-left: 4px solid #f56c6c;
        }
        
        .field-header {
          display: flex;
          align-items: center;
          gap: 8px;
          
          .field-info {
            flex: 1;
            
            .field-name {
              display: flex;
              align-items: center;
              gap: 4px;
              font-weight: 500;
              color: #303133;
            }
            
            .field-meta {
              display: flex;
              gap: 4px;
              margin-top: 4px;
            }
          }
        }
        
        .field-description {
          margin-top: 8px;
          font-size: 12px;
          color: #666;
        }
      }
    }
    
    .fields-configuration {
      h4 {
        margin: 0 0 16px 0;
        color: #303133;
      }
    }
  }
  
  .calculated-fields-panel,
  .field-filter-panel {
    .panel-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
      
      h4 {
        margin: 0;
        color: #303133;
      }
    }
  }
  
  .filter-conditions {
    .filter-item {
      margin-bottom: 12px;
      
      .filter-content {
        display: flex;
        gap: 12px;
        align-items: center;
        padding: 12px;
        border: 1px solid #e4e7ed;
        border-radius: 8px;
        
        .filter-field,
        .filter-operator,
        .filter-value {
          min-width: 150px;
        }
        
        .filter-actions {
          flex-shrink: 0;
        }
      }
    }
  }
  
  .formula-editor {
    .formula-tools {
      margin-top: 12px;
      
      .available-fields,
      .formula-functions {
        margin-bottom: 8px;
        
        .tool-label {
          display: inline-block;
          margin-right: 8px;
          font-size: 12px;
          color: #666;
          font-weight: 500;
        }
        
        .el-button {
          margin-right: 4px;
          margin-bottom: 4px;
        }
      }
    }
  }
}
</style> 