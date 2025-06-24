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

    <!-- 计算字段对话框 - 优化版本 -->
    <el-dialog
      v-model="showAddCalculated"
      title="添加计算字段"
      width="800px"
      @close="resetCalculatedForm"
    >
      <div class="calculated-field-editor">
        <!-- 基本信息 -->
        <el-form :model="calculatedForm" label-width="100px" size="small">
          <el-row :gutter="16">
            <el-col :span="12">
              <el-form-item label="字段名称" required>
                <el-input v-model="calculatedForm.name" placeholder="如：patient_age" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="显示名称" required>
                <el-input v-model="calculatedForm.displayName" placeholder="如：患者年龄" />
              </el-form-item>
            </el-col>
          </el-row>
          
          <el-form-item label="数据类型">
            <el-radio-group v-model="calculatedForm.dataType">
              <el-radio value="number">数字</el-radio>
              <el-radio value="string">文本</el-radio>
              <el-radio value="date">日期</el-radio>
            </el-radio-group>
          </el-form-item>
        </el-form>

        <!-- 计算方式选择 -->
        <div class="calculation-mode">
          <el-segmented v-model="calculationMode" :options="[
            { label: '简单计算', value: 'simple' },
            { label: '函数计算', value: 'function' },
            { label: '高级表达式', value: 'advanced' }
          ]" />
        </div>

                 <!-- 简单计算模式 -->
         <div v-if="calculationMode === 'simple'" class="simple-mode">
           <div class="calculation-builder">
             <div class="builder-row">
               <!-- 第一个字段选择 -->
               <el-select 
                 v-model="simpleCalc.field1" 
                 placeholder="选择字段" 
                 style="width: 150px"
                 @change="simpleCalc.operator = ''; simpleCalc.field2 = ''; simpleCalc.customValue = ''"
               >
                 <el-option
                   v-for="field in props.availableFields"
                   :key="field.name"
                   :label="field.name"
                   :value="field.name"
                 >
                   <span>{{ field.name }}</span>
                   <el-tag 
                     size="small" 
                     :type="getFieldDataType(field.name) === 'number' ? 'success' : 
                           getFieldDataType(field.name) === 'date' ? 'warning' : 'info'"
                     style="margin-left: 8px"
                   >
                     {{ getFieldDataType(field.name) === 'number' ? '数字' : 
                         getFieldDataType(field.name) === 'date' ? '日期' : '文本' }}
                   </el-tag>
                 </el-option>
               </el-select>
               
               <!-- 操作符选择 -->
               <el-select 
                 v-model="simpleCalc.operator" 
                 placeholder="选择操作" 
                 style="width: 120px"
                 :disabled="!simpleCalc.field1"
                 @change="simpleCalc.field2 = ''; simpleCalc.customValue = ''"
               >
                 <el-option
                   v-for="op in availableOperators"
                   :key="op.value"
                   :label="op.label"
                   :value="op.value"
                 />
               </el-select>
               
               <!-- 第二个字段选择（需要时显示） -->
               <el-select 
                 v-if="needsSecondInput(simpleCalc.operator)"
                 v-model="simpleCalc.field2" 
                 placeholder="选择字段" 
                 style="width: 150px"
               >
                 <el-option
                   v-for="field in fieldsForSecondInput"
                   :key="field.name"
                   :label="field.name"
                   :value="field.name"
                 />
               </el-select>
               
               <!-- 自定义值输入（需要时显示） -->
               <el-input
                 v-if="needsCustomValue(simpleCalc.operator)"
                 v-model="simpleCalc.customValue"
                 :placeholder="simpleCalc.operator === 'PREFIX' ? '输入前缀' : 
                              simpleCalc.operator === 'SUFFIX' ? '输入后缀' : '输入天数'"
                 style="width: 120px"
               />
               
               <span class="equals">=</span>
               <span class="result">{{ getSimpleCalcPreview() }}</span>
             </div>
           </div>
         </div>

        <!-- 函数计算模式 -->
        <div v-if="calculationMode === 'function'" class="function-mode">
          <div class="function-builder">
            <div class="builder-row">
              <el-select v-model="functionCalc.function" placeholder="选择函数" style="width: 120px">
                <el-option label="求和(SUM)" value="SUM" />
                <el-option label="平均(AVG)" value="AVG" />
                <el-option label="计数(COUNT)" value="COUNT" />
                <el-option label="最大(MAX)" value="MAX" />
                <el-option label="最小(MIN)" value="MIN" />
                <el-option label="年龄计算" value="AGE" />
                <el-option label="日期差" value="DATEDIFF" />
              </el-select>
              
              <span>(</span>
              
              <el-select v-model="functionCalc.field" placeholder="选择字段" style="width: 150px">
                <el-option
                  v-for="field in getFieldsForFunction(functionCalc.function)"
                  :key="field.name"
                  :label="field.name"
                  :value="field.name"
                />
              </el-select>
              
              <!-- 特殊函数需要额外参数 -->
              <template v-if="needsSecondField(functionCalc.function)">
                <span>,</span>
                <el-select v-model="functionCalc.field2" placeholder="第二个字段" style="width: 150px">
                  <el-option
                    v-for="field in getFieldsForFunction(functionCalc.function)"
                    :key="field.name"
                    :label="field.name"
                    :value="field.name"
                  />
                </el-select>
              </template>
              
              <span>)</span>
              <span class="equals">=</span>
              <span class="result">{{ getFunctionCalcPreview() }}</span>
            </div>
          </div>
        </div>

        <!-- 高级表达式模式 -->
        <div v-if="calculationMode === 'advanced'" class="advanced-mode">
          <div class="formula-editor">
            <el-input
              v-model="calculatedForm.formula"
              type="textarea"
              :rows="4"
              placeholder="输入计算表达式，如: YEAR(CURDATE()) - YEAR(birth_date)"
              @input="validateExpression"
            />
            
            <!-- 表达式验证结果 -->
            <div v-if="validationResult" class="validation-result">
              <el-alert
                :type="validationResult.isValid ? 'success' : 'error'"
                :title="validationResult.isValid ? '表达式验证通过' : '表达式验证失败'"
                :description="validationResult.message"
                show-icon
                :closable="false"
              />
            </div>
            
            <!-- 快捷工具栏 -->
            <div class="formula-tools">
              <div class="tool-section">
                <span class="tool-label">字段：</span>
                <el-button
                  v-for="field in availableFields.slice(0, 6)"
                  :key="field.name"
                  size="small"
                  @click="insertToFormula(field.name)"
                >
                  {{ field.name }}
                </el-button>
                <el-popover placement="bottom" width="300" trigger="click">
                  <template #reference>
                    <el-button size="small">更多...</el-button>
                  </template>
                  <div class="more-fields">
                    <el-button
                      v-for="field in availableFields"
                      :key="field.name"
                      size="small"
                      @click="insertToFormula(field.name)"
                      style="margin: 2px;"
                    >
                      {{ field.name }}
                    </el-button>
                  </div>
                </el-popover>
              </div>
              
              <div class="tool-section">
                <span class="tool-label">函数：</span>
                <el-button size="small" @click="insertToFormula('SUM()')">SUM</el-button>
                <el-button size="small" @click="insertToFormula('AVG()')">AVG</el-button>
                <el-button size="small" @click="insertToFormula('COUNT()')">COUNT</el-button>
                <el-button size="small" @click="insertToFormula('YEAR()')">YEAR</el-button>
                <el-button size="small" @click="insertToFormula('DATEDIFF()')">DATEDIFF</el-button>
              </div>
            </div>
          </div>
        </div>

        <!-- 预览结果 -->
        <div class="preview-section">
          <h4>生成的表达式：</h4>
          <div class="expression-preview">
            <code>{{ getGeneratedExpression() }}</code>
          </div>
        </div>
      </div>

      <template #footer>
        <el-button @click="showAddCalculated = false">取消</el-button>
        <el-button type="primary" @click="addCalculatedField" :disabled="!canAddField">
          确定
        </el-button>
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
  tableName?: string
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

// 新增：计算方式选择
const calculationMode = ref('simple')

// 简单计算
const simpleCalc = reactive({
  field1: '',
  field1Type: '',
  operator: '+',
  field2: '',
  customValue: '', // 用于前缀、后缀等自定义值
  operationType: 'math' // 'math', 'string', 'date'
})

// 函数计算
const functionCalc = reactive({
  function: '',
  field: '',
  field2: ''
})

// 表达式验证相关
const validationResult = ref<{
  isValid: boolean
  message: string
} | null>(null)

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

// 新增计算属性
const numericFields = computed(() => {
  return props.availableFields.filter(field => {
    const type = field.dataType?.toLowerCase()
    return type?.includes('int') || type?.includes('decimal') || type?.includes('float') || type?.includes('number')
  })
})

const dateFields = computed(() => {
  return props.availableFields.filter(field => {
    const type = field.dataType?.toLowerCase()
    return type?.includes('date') || type?.includes('time')
  })
})

const canAddField = computed(() => {
  return calculatedForm.name && calculatedForm.displayName && getGeneratedExpression()
})

const availableOperators = computed(() => {
  if (!simpleCalc.field1) return []
  const fieldType = getFieldDataType(simpleCalc.field1)
  return getAvailableOperators(fieldType)
})

const fieldsForSecondInput = computed(() => {
  if (!simpleCalc.operator) return props.availableFields
  
  const fieldType = getFieldDataType(simpleCalc.field1)
  if (fieldType === 'number' && ['+', '-', '*', '/', '%'].includes(simpleCalc.operator)) {
    return numericFields.value
  } else if (fieldType === 'date' && simpleCalc.operator === 'DATEDIFF') {
    return dateFields.value
  }
  return props.availableFields
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
    // 添加字段 - 正确配置普通字段
    const fieldType = getFieldTypeFromDataType(field.dataType)
    const newConfig: DataSetFieldConfig = {
      fieldName: field.name,
      displayName: field.description || field.name,
      tableName: field.tableName || '',
      fieldType: fieldType,
      isVisible: true,
      description: field.description || '',
      sortOrder: fieldConfigs.value.length,
      // ✅ 普通字段的正确配置
      isCalculated: false,          // 普通字段必须为 false
      expression: undefined,        // 普通字段不设置表达式
      aggregation: fieldType === 'metric' ? 'sum' : undefined  // 只有指标字段设置聚合方式
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
    const config = fieldConfigs.value[index]
    ;(config as any)[key] = value
    
    // ✅ 确保字段类型变化时正确处理聚合配置
    if (key === 'fieldType') {
      if (value === 'dimension') {
        // 维度字段：清除聚合方式，确保不是计算字段
        config.aggregation = undefined
        if (!config.isCalculated) {
          config.expression = undefined
        }
      } else if (value === 'metric') {
        // 指标字段：如果不是计算字段，设置默认聚合方式
        if (!config.isCalculated && !config.aggregation) {
          config.aggregation = 'sum'
        }
        if (!config.isCalculated) {
          config.expression = undefined
        }
      }
    }
  }
}

// 计算字段方法
const addCalculatedField = () => {
  if (!calculatedForm.name || !calculatedForm.displayName) {
    ElMessage.warning('请填写字段名称和显示名称')
    return
  }
  
  const expression = getGeneratedExpression()
  if (!expression) {
    ElMessage.warning('请完成计算表达式配置')
    return
  }

  // 添加到计算字段数组
  calculatedFields.value.push({
    name: calculatedForm.name,
    displayName: calculatedForm.displayName,
    formula: expression,
    dataType: calculatedForm.dataType
  })

  // 添加到字段配置 - 正确配置计算字段
  const newConfig: DataSetFieldConfig = {
    fieldName: calculatedForm.name,
    displayName: calculatedForm.displayName,
    tableName: '',
    fieldType: getCalculatedFieldType(expression, calculatedForm.dataType),
    isVisible: true,
    description: `计算字段: ${expression}`,
    sortOrder: fieldConfigs.value.length,
    // ✅ 计算字段的正确配置
    isCalculated: true,           // 必须设置为 true
    expression: expression,       // 必须设置表达式
    aggregation: undefined        // 必须为 undefined/null，不设置聚合方式
  }
  fieldConfigs.value.push(newConfig)

  showAddCalculated.value = false
  resetCalculatedForm()
  ElMessage.success('计算字段添加成功')
}

// 新增：智能判断计算字段类型
const getCalculatedFieldType = (expression: string, dataType: string): 'dimension' | 'metric' => {
  // 检查表达式是否包含聚合函数
  const aggregateFunctions = ['SUM', 'COUNT', 'AVG', 'MAX', 'MIN', 'STDDEV', 'VARIANCE']
  const upperExpression = expression.toUpperCase()
  
  // 如果包含聚合函数，自动设置为 metric
  if (aggregateFunctions.some(func => upperExpression.includes(func + '('))) {
    return 'metric'
  }
  
  // 如果用户明确选择了数字类型，也设置为 metric
  if (dataType === 'number') {
    return 'metric'
  }
  
  // 其他情况设置为 dimension
  return 'dimension'
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
  
  // 重置计算模式数据
  calculationMode.value = 'simple'
  simpleCalc.field1 = ''
  simpleCalc.field1Type = ''
  simpleCalc.operator = '+'
  simpleCalc.field2 = ''
  simpleCalc.customValue = ''
  simpleCalc.operationType = 'math'
  functionCalc.function = ''
  functionCalc.field = ''
  functionCalc.field2 = ''
}

const insertField = (fieldName: string) => {
  calculatedForm.formula += ` ${fieldName} `
}

const insertFunction = (funcName: string) => {
  calculatedForm.formula += ` ${funcName}() `
}

// 新增方法
const getFieldDataType = (fieldName: string) => {
  const field = props.availableFields.find(f => f.name === fieldName)
  if (!field) return 'string'
  
  const type = field.dataType?.toLowerCase() || ''
  if (type.includes('int') || type.includes('decimal') || type.includes('float') || type.includes('number')) {
    return 'number'
  } else if (type.includes('date') || type.includes('time')) {
    return 'date'
  }
  return 'string'
}

const getAvailableOperators = (fieldType: string) => {
  switch (fieldType) {
    case 'number':
      return [
        { label: '+', value: '+', type: 'math' },
        { label: '-', value: '-', type: 'math' },
        { label: '×', value: '*', type: 'math' },
        { label: '÷', value: '/', type: 'math' },
        { label: '%', value: '%', type: 'math' }
      ]
    case 'string':
      return [
        { label: '连接', value: 'CONCAT', type: 'string' },
        { label: '添加前缀', value: 'PREFIX', type: 'string' },
        { label: '添加后缀', value: 'SUFFIX', type: 'string' },
        { label: '转大写', value: 'UPPER', type: 'string' },
        { label: '转小写', value: 'LOWER', type: 'string' },
        { label: '去空格', value: 'TRIM', type: 'string' }
      ]
    case 'date':
      return [
        { label: '加天数', value: 'DATE_ADD', type: 'date' },
        { label: '减天数', value: 'DATE_SUB', type: 'date' },
        { label: '日期差', value: 'DATEDIFF', type: 'date' }
      ]
    default:
      return [
        { label: '连接', value: 'CONCAT', type: 'string' }
      ]
  }
}

const needsSecondInput = (operator: string) => {
  return ['CONCAT', 'DATEDIFF', '+', '-', '*', '/', '%'].includes(operator)
}

const needsCustomValue = (operator: string) => {
  return ['PREFIX', 'SUFFIX', 'DATE_ADD', 'DATE_SUB'].includes(operator)
}

const getFieldsForFunction = (functionName: string) => {
  switch (functionName) {
    case 'SUM':
    case 'AVG':
    case 'MAX':
    case 'MIN':
      return numericFields.value
    case 'COUNT':
      return props.availableFields
    case 'AGE':
    case 'DATEDIFF':
      return dateFields.value
    default:
      return props.availableFields
  }
}

const needsSecondField = (functionName: string) => {
  return ['DATEDIFF'].includes(functionName)
}

const getSimpleCalcPreview = () => {
  if (!simpleCalc.field1 || !simpleCalc.operator) {
    return '请选择字段和操作'
  }
  
  const operator = simpleCalc.operator
  const field1 = simpleCalc.field1
  
  switch (operator) {
    case '+':
    case '-':
    case '*':
    case '/':
    case '%':
      if (!simpleCalc.field2) return '请选择第二个字段'
      return `${field1} ${operator} ${simpleCalc.field2}`
    
    case 'CONCAT':
      if (!simpleCalc.field2) return '请选择第二个字段'
      return `CONCAT(${field1}, ${simpleCalc.field2})`
    
    case 'PREFIX':
      if (!simpleCalc.customValue) return '请输入前缀内容'
      return `CONCAT('${simpleCalc.customValue}', ${field1})`
    
    case 'SUFFIX':
      if (!simpleCalc.customValue) return '请输入后缀内容'
      return `CONCAT(${field1}, '${simpleCalc.customValue}')`
    
    case 'UPPER':
      return `UPPER(${field1})`
    
    case 'LOWER':
      return `LOWER(${field1})`
    
    case 'TRIM':
      return `TRIM(${field1})`
    
    case 'DATE_ADD':
      if (!simpleCalc.customValue) return '请输入天数'
      return `DATE_ADD(${field1}, INTERVAL ${simpleCalc.customValue} DAY)`
    
    case 'DATE_SUB':
      if (!simpleCalc.customValue) return '请输入天数'
      return `DATE_SUB(${field1}, INTERVAL ${simpleCalc.customValue} DAY)`
    
    case 'DATEDIFF':
      if (!simpleCalc.field2) return '请选择第二个日期字段'
      return `DATEDIFF(${field1}, ${simpleCalc.field2})`
    
    default:
      return '未知操作'
  }
}

const getFunctionCalcPreview = () => {
  if (!functionCalc.function || !functionCalc.field) {
    return '请选择函数和字段'
  }
  
  let preview = `${functionCalc.function}(${functionCalc.field}`
  if (needsSecondField(functionCalc.function) && functionCalc.field2) {
    preview += `, ${functionCalc.field2}`
  }
  preview += ')'
  
  // 特殊函数的友好显示
  if (functionCalc.function === 'AGE') {
    preview = `YEAR(CURDATE()) - YEAR(${functionCalc.field})`
  }
  
  return preview
}

const getGeneratedExpression = () => {
  switch (calculationMode.value) {
    case 'simple':
      return getSimpleCalcPreview() !== '请选择字段和操作' && 
             !getSimpleCalcPreview().startsWith('请') ? 
             getSimpleCalcPreview() : ''
      break
    case 'function':
      if (functionCalc.function && functionCalc.field) {
        if (functionCalc.function === 'AGE') {
          return `YEAR(CURDATE()) - YEAR(${functionCalc.field})`
        } else if (functionCalc.function === 'DATEDIFF' && functionCalc.field2) {
          return `DATEDIFF(${functionCalc.field}, ${functionCalc.field2})`
        } else {
          return `${functionCalc.function}(${functionCalc.field})`
        }
      }
      break
    case 'advanced':
      return calculatedForm.formula
  }
  return ''
}

const insertToFormula = (text: string) => {
  calculatedForm.formula += text
}

// 表达式验证方法
const validateExpression = async () => {
  if (!calculatedForm.formula.trim()) {
    validationResult.value = null
    return
  }

  try {
    // 调用后端验证接口 - 根据API使用指南文档规范
    const { validateCalculatedField } = await import('@/api/dataset')
    const availableFieldNames = props.availableFields.map(f => f.name)
    
    console.log('调用计算字段验证接口:', {
      expression: calculatedForm.formula,
      availableFields: availableFieldNames,
      dataSourceId: props.dataSourceId,
      tableName: props.tableName
    })
    
    const response = await validateCalculatedField({
      expression: calculatedForm.formula,
      availableFields: availableFieldNames,
      dataSourceId: props.dataSourceId || 1,
      tableName: props.tableName // 根据文档规范添加tableName参数
    })

    // 根据API文档规范处理响应
    const result = response.data as any
    console.log('计算字段验证结果:', result)
    
    if (result && result.isValid) {
      validationResult.value = {
        isValid: true,
        message: `表达式验证通过 - 返回类型: ${result.returnType || 'unknown'}`
      }
      
      // 如果有依赖字段信息，显示出来
      if (result.dependentFields && Array.isArray(result.dependentFields) && result.dependentFields.length > 0) {
        validationResult.value.message += ` | 依赖字段: ${result.dependentFields.join(', ')}`
      }
      
      // 如果有性能提示，显示出来
      if (result.performanceHint) {
        validationResult.value.message += ` | ${result.performanceHint}`
      }
    } else {
      validationResult.value = {
        isValid: false,
        message: (result && (result.message || result.error)) || '表达式验证失败'
      }
    }
  } catch (error) {
    console.warn('API验证失败，使用客户端验证:', error)
    
    // 降级到客户端验证
    const isValid = validateExpressionLocally(calculatedForm.formula)
    validationResult.value = {
      isValid,
      message: isValid 
        ? '表达式语法正确（客户端验证）' 
        : '表达式可能存在语法错误（客户端验证）'
    }
    
    if (!isValid) {
      validationResult.value.message += ' | API验证失败，建议检查后端连接'
    }
  }
}

// 简单的客户端表达式验证
const validateExpressionLocally = (expression: string): boolean => {
  // 基本的语法检查
  const trimmed = expression.trim()
  if (!trimmed) return false
  
  // 检查括号匹配
  let parenthesesCount = 0
  for (const char of trimmed) {
    if (char === '(') parenthesesCount++
    if (char === ')') parenthesesCount--
    if (parenthesesCount < 0) return false
  }
  
  return parenthesesCount === 0
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

// 验证并修复字段配置
const validateAndFixFieldConfigs = () => {
  fieldConfigs.value.forEach(config => {
    if (config.isCalculated) {
      // ✅ 计算字段：必须有表达式，不能有聚合方式
      if (!config.expression) {
        console.warn(`计算字段 ${config.fieldName} 缺少表达式，将从计算字段列表中查找`)
        const calculatedField = calculatedFields.value.find(cf => cf.name === config.fieldName)
        if (calculatedField) {
          config.expression = calculatedField.formula
        }
      }
      config.aggregation = undefined
    } else {
      // ✅ 普通字段：不能有表达式，指标字段必须有聚合方式
      config.expression = undefined
      if (config.fieldType === 'metric' && !config.aggregation) {
        config.aggregation = 'sum'
      } else if (config.fieldType === 'dimension') {
        config.aggregation = undefined
      }
    }
  })
}

// 暴露给父组件的方法和数据
defineExpose({
  calculatedFields,
  filterConditions,
  validateAndFixFieldConfigs
})
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
      
      .tool-section {
        margin-bottom: 8px;
        
        .tool-label {
          display: inline-block;
          min-width: 60px;
          font-weight: 500;
          color: #606266;
        }
        
        .more-fields {
          max-height: 200px;
          overflow-y: auto;
        }
      }
      
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
  
  // 新增：计算字段编辑器样式
  .calculated-field-editor {
    .calculation-mode {
      margin: 20px 0;
      text-align: center;
    }
    
    .simple-mode,
    .function-mode {
      margin: 20px 0;
      
      .calculation-builder,
      .function-builder {
        padding: 20px;
        background: #f8f9fa;
        border-radius: 8px;
        border: 1px solid #e9ecef;
        
                 .builder-row {
           display: flex;
           align-items: center;
           gap: 12px;
           flex-wrap: wrap;
           min-height: 40px;
          
          .equals {
            font-size: 18px;
            font-weight: bold;
            color: #409eff;
            margin: 0 8px;
          }
          
                     .result {
             padding: 8px 12px;
             background: #ecf5ff;
             border: 1px solid #b3d8ff;
             border-radius: 4px;
             color: #409eff;
             font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
             font-size: 13px;
             min-width: 200px;
             max-width: 300px;
             overflow: hidden;
             text-overflow: ellipsis;
             white-space: nowrap;
           }
           
           // 字段选择器中的标签样式
           .el-select-dropdown__item {
             .el-tag {
               font-size: 10px;
               height: 18px;
               line-height: 16px;
             }
           }
        }
      }
    }
    
    .advanced-mode {
      margin: 20px 0;
    }
    
    .preview-section {
      margin-top: 20px;
      padding: 16px;
      background: #f8f9fa;
      border-radius: 8px;
      border: 1px solid #e9ecef;
      
      h4 {
        margin: 0 0 12px 0;
        font-size: 14px;
        color: #606266;
      }
      
      .expression-preview {
        padding: 12px;
        background: #fff;
        border: 1px solid #dcdfe6;
        border-radius: 4px;
        
        code {
          font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
          font-size: 13px;
          color: #e6a23c;
          background: none;
        }
      }
    }
  }
}
</style> 