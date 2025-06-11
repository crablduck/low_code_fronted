<template>
  <div class="fields-config">
    <div class="config-header">
      <div class="header-info">
        <span>共 {{ availableFields.length }} 个字段，已选择 {{ selectedFields.length }} 个</span>
      </div>
      <div class="header-actions">
        <el-button size="small" @click="selectAll">全选</el-button>
        <el-button size="small" @click="clearAll">清空</el-button>
        <el-button size="small" @click="smartConfig">智能配置</el-button>
        <el-button size="small" @click="showFieldTypes = !showFieldTypes">
          {{ showFieldTypes ? '隐藏' : '显示' }}字段类型
        </el-button>
      </div>
    </div>

    <div class="config-content">
      <!-- 字段选择区域 -->
      <div class="fields-selection">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索字段名"
          prefix-icon="Search"
          size="small"
          clearable
          style="margin-bottom: 12px;"
        />
        
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
      </div>

      <!-- 字段配置区域 -->
      <div v-if="selectedFields.length > 0" class="fields-configuration">
        <h4>字段配置</h4>
        
        <el-table
          :data="fieldConfigs"
          style="width: 100%"
          max-height="400"
          @selection-change="handleSelectionChange"
        >
          <el-table-column type="selection" width="55" />
          
          <el-table-column prop="fieldName" label="字段名" width="150">
            <template #default="{ row }">
              <div class="field-name-cell">
                <el-icon v-if="getOriginalField(row.fieldName)?.isPrimary"><Key /></el-icon>
                {{ row.fieldName }}
              </div>
            </template>
          </el-table-column>
          
          <el-table-column v-if="queryType === 'multi'" prop="tableName" label="所属表" width="120">
            <template #default="{ row }">
              <el-tag size="small" type="info">{{ row.tableName }}</el-tag>
            </template>
          </el-table-column>
          
          <el-table-column prop="displayName" label="显示名称" width="150">
            <template #default="{ row, $index }">
              <el-input
                v-model="row.displayName"
                size="small"
                placeholder="显示名称"
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
                <el-option label="维度" value="dimension">
                  <div class="option-content">
                    <el-icon><Grid /></el-icon>
                    <span>维度</span>
                  </div>
                </el-option>
                <el-option label="指标" value="metric">
                  <div class="option-content">
                    <el-icon><TrendCharts /></el-icon>
                    <span>指标</span>
                  </div>
                </el-option>
                <el-option label="日期" value="date">
                  <div class="option-content">
                    <el-icon><Calendar /></el-icon>
                    <span>日期</span>
                  </div>
                </el-option>
              </el-select>
            </template>
          </el-table-column>
          
          <el-table-column prop="aggregation" label="聚合方式" width="120">
            <template #default="{ row, $index }">
              <el-select
                v-model="row.aggregation"
                size="small"
                :disabled="row.fieldType !== 'metric'"
                placeholder="选择聚合"
                clearable
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
          
          <el-table-column prop="description" label="描述" min-width="150">
            <template #default="{ row, $index }">
              <el-input
                v-model="row.description"
                size="small"
                placeholder="字段描述"
                @change="updateFieldConfig($index, 'description', row.description)"
              />
            </template>
          </el-table-column>
          
          <el-table-column label="操作" width="100">
            <template #default="{ row, $index }">
              <el-button
                type="danger"
                size="small"
                circle
                @click="removeField($index)"
              >
                <el-icon><Delete /></el-icon>
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- 字段类型说明 -->
      <div v-if="showFieldTypes" class="field-types-help">
        <h4>字段类型说明</h4>
        <div class="types-grid">
          <div class="type-item">
            <div class="type-header">
              <el-icon><Grid /></el-icon>
              <span>维度字段</span>
            </div>
            <div class="type-desc">
              用于分组和筛选的字段，如姓名、部门、日期等分类信息
            </div>
            <div class="type-examples">
              <el-tag size="small" v-for="example in dimensionExamples" :key="example">
                {{ example }}
              </el-tag>
            </div>
          </div>
          
          <div class="type-item">
            <div class="type-header">
              <el-icon><TrendCharts /></el-icon>
              <span>指标字段</span>
            </div>
            <div class="type-desc">
              用于计算和统计的数值字段，如金额、数量、分数等
            </div>
            <div class="type-examples">
              <el-tag size="small" v-for="example in metricExamples" :key="example">
                {{ example }}
              </el-tag>
            </div>
          </div>
          
          <div class="type-item">
            <div class="type-header">
              <el-icon><Calendar /></el-icon>
              <span>日期字段</span>
            </div>
            <div class="type-desc">
              时间相关的字段，用于时间序列分析和按时间分组
            </div>
            <div class="type-examples">
              <el-tag size="small" v-for="example in dateExamples" :key="example">
                {{ example }}
              </el-tag>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Key, Grid, TrendCharts, Delete, Calendar } from '@element-plus/icons-vue'
import type { FieldInfo, DataSetFieldConfig } from '@/types/dataManagement'

// Props
interface Props {
  modelValue: DataSetFieldConfig[]
  availableFields: FieldInfo[]
  queryType: 'single' | 'multi' | 'sql'
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
const searchKeyword = ref('')
const showFieldTypes = ref(false)
const selectedFieldKeys = ref<Set<string>>(new Set())

// 示例数据
const dimensionExamples = ['患者姓名', '科室名称', '医生职称', '性别', '地区', '状态']
const metricExamples = ['费用金额', '患者数量', '检查次数', '药品用量', '评分', '时长']
const dateExamples = ['创建时间', '就诊日期', '出院日期', '更新时间', '生日', '预约时间']

// 计算属性
const fieldConfigs = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const filteredFields = computed(() => {
  if (!searchKeyword.value) return props.availableFields
  return props.availableFields.filter(field =>
    field.name.toLowerCase().includes(searchKeyword.value.toLowerCase()) ||
    (field.description && field.description.toLowerCase().includes(searchKeyword.value.toLowerCase())) ||
    (field.tableName && field.tableName.toLowerCase().includes(searchKeyword.value.toLowerCase()))
  )
})

const selectedFields = computed(() => {
  return props.availableFields.filter(field => isFieldSelected(field))
})

// 方法定义
const getFieldKey = (field: FieldInfo) => {
  return `${field.tableName || 'default'}-${field.name}`
}

const isFieldSelected = (field: FieldInfo) => {
  return selectedFieldKeys.value.has(getFieldKey(field))
}

const toggleField = (field: FieldInfo) => {
  const key = getFieldKey(field)
  if (selectedFieldKeys.value.has(key)) {
    // 移除字段
    selectedFieldKeys.value.delete(key)
    const index = fieldConfigs.value.findIndex(config => 
      config.fieldName === field.name && config.tableName === field.tableName
    )
    if (index !== -1) {
      fieldConfigs.value.splice(index, 1)
    }
  } else {
    // 添加字段
    selectedFieldKeys.value.add(key)
    const newConfig: DataSetFieldConfig = {
      fieldName: field.name,
      tableName: field.tableName,
      displayName: field.name,
      fieldType: getFieldTypeFromDataType(field.dataType),
      isVisible: true,
      description: field.description || '',
      sortOrder: fieldConfigs.value.length,
      aggregation: getFieldTypeFromDataType(field.dataType) === 'metric' ? 'sum' : undefined
    }
    fieldConfigs.value.push(newConfig)
  }
}

const getFieldTypeFromDataType = (dataType: string): 'dimension' | 'metric' | 'date' => {
  const type = dataType.toLowerCase()
  
  // 数值类型 → 指标
  if (type.includes('int') || type.includes('decimal') || type.includes('float') || 
      type.includes('double') || type.includes('number') || type.includes('bigint') ||
      type.includes('money') || type.includes('currency')) {
    return 'metric'
  }
  
  // 日期时间类型 → 日期
  if (type.includes('date') || type.includes('time') || type.includes('timestamp')) {
    return 'date'
  }
  
  // 其他类型 → 维度
  return 'dimension'
}

const getDataTypeColor = (dataType: string) => {
  const type = dataType.toLowerCase()
  if (type.includes('int') || type.includes('decimal') || type.includes('float')) {
    return 'warning'
  } else if (type.includes('varchar') || type.includes('text') || type.includes('char')) {
    return 'success'
  } else if (type.includes('date') || type.includes('time')) {
    return 'info'
  } else {
    return 'info'
  }
}

const getOriginalField = (fieldName: string) => {
  return props.availableFields.find(field => field.name === fieldName)
}

const updateFieldConfig = (index: number, key: keyof DataSetFieldConfig, value: any) => {
  if (fieldConfigs.value[index]) {
    (fieldConfigs.value[index] as any)[key] = value
    
    // 根据字段类型处理聚合方式
    if (key === 'fieldType') {
      if (value === 'dimension' || value === 'date') {
        // 维度和日期字段不需要聚合
        fieldConfigs.value[index].aggregation = undefined
      } else if (value === 'metric' && !fieldConfigs.value[index].aggregation) {
        // 指标字段设置默认聚合方式
        fieldConfigs.value[index].aggregation = 'sum'
      }
    }
  }
}

const removeField = (index: number) => {
  const config = fieldConfigs.value[index]
  if (config) {
    const key = getFieldKey({ 
      name: config.fieldName, 
      tableName: config.tableName,
      dataType: '',
      isPrimary: false,
      isNullable: true
    })
    selectedFieldKeys.value.delete(key)
    fieldConfigs.value.splice(index, 1)
  }
}

const selectAll = () => {
  props.availableFields.forEach(field => {
    const key = getFieldKey(field)
    if (!selectedFieldKeys.value.has(key)) {
      selectedFieldKeys.value.add(key)
      const newConfig: DataSetFieldConfig = {
        fieldName: field.name,
        tableName: field.tableName,
        displayName: field.name,
        fieldType: getFieldTypeFromDataType(field.dataType),
        isVisible: true,
        description: field.description || '',
        sortOrder: fieldConfigs.value.length,
        aggregation: getFieldTypeFromDataType(field.dataType) === 'metric' ? 'sum' : undefined
      }
      fieldConfigs.value.push(newConfig)
    }
  })
  ElMessage.success(`已选择 ${props.availableFields.length} 个字段`)
}

const clearAll = () => {
  selectedFieldKeys.value.clear()
  fieldConfigs.value.splice(0)
  ElMessage.success('已清空所有字段')
}

const smartConfig = () => {
  // 智能配置：自动设置字段类型和聚合方式
  fieldConfigs.value.forEach(config => {
    const originalField = getOriginalField(config.fieldName)
    if (originalField) {
      config.fieldType = getFieldTypeFromDataType(originalField.dataType)
      if (config.fieldType === 'metric') {
        config.aggregation = config.aggregation || 'sum'
      } else {
        config.aggregation = undefined
      }
      
      // 智能设置显示名称
      if (config.displayName === config.fieldName) {
        config.displayName = getSmartDisplayName(config.fieldName)
      }
    }
  })
  ElMessage.success('字段配置已智能优化')
}

const getSmartDisplayName = (fieldName: string): string => {
  // 简单的智能命名规则
  const nameMap: Record<string, string> = {
    'id': 'ID',
    'name': '名称',
    'patient_name': '患者姓名',
    'doctor_name': '医生姓名',
    'department_name': '科室名称',
    'age': '年龄',
    'gender': '性别',
    'phone': '电话',
    'phone_number': '联系电话',
    'address': '地址',
    'create_time': '创建时间',
    'update_time': '更新时间',
    'total_amount': '总金额',
    'count': '数量',
    'status': '状态'
  }
  
  return nameMap[fieldName.toLowerCase()] || fieldName
}

const handleSelectionChange = (selection: DataSetFieldConfig[]) => {
  // 处理表格选择变化
  console.log('选择变化:', selection)
}

// 监听可用字段变化，同步选中状态
watch(() => props.availableFields, (newFields) => {
  // 清理不存在的字段
  const validKeys = new Set(newFields.map(field => getFieldKey(field)))
  const keysToRemove: string[] = []
  
  selectedFieldKeys.value.forEach(key => {
    if (!validKeys.has(key)) {
      keysToRemove.push(key)
    }
  })
  
  keysToRemove.forEach(key => {
    selectedFieldKeys.value.delete(key)
  })
  
  // 清理配置中不存在的字段
  fieldConfigs.value = fieldConfigs.value.filter(config => {
    const field = newFields.find(f => 
      f.name === config.fieldName && f.tableName === config.tableName
    )
    return !!field
  })
}, { immediate: true })

// 监听modelValue变化，同步选中状态
watch(() => props.modelValue, (newConfigs) => {
  selectedFieldKeys.value.clear()
  newConfigs.forEach(config => {
    const key = getFieldKey({
      name: config.fieldName,
      tableName: config.tableName,
      dataType: '',
      isPrimary: false,
      isNullable: true
    })
    selectedFieldKeys.value.add(key)
  })
}, { immediate: true })
</script>

<style scoped>
.fields-config {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.config-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 0;
  border-bottom: 1px solid #e4e7ed;
}

.header-info {
  color: #606266;
  font-size: 14px;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.config-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px 0;
}

.fields-selection {
  margin-bottom: 24px;
}

.fields-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 12px;
  max-height: 300px;
  overflow-y: auto;
  padding: 8px;
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  background: #fafafa;
}

.field-card {
  padding: 12px;
  background: white;
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s;
}

.field-card:hover {
  border-color: #409eff;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.2);
}

.field-card.selected {
  border-color: #409eff;
  background: #ecf5ff;
}

.field-card.primary {
  border-left: 4px solid #e6a23c;
}

.field-header {
  display: flex;
  align-items: flex-start;
  gap: 8px;
}

.field-info {
  flex: 1;
}

.field-name {
  display: flex;
  align-items: center;
  gap: 4px;
  font-weight: 500;
  color: #303133;
  margin-bottom: 4px;
}

.field-meta {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.field-description {
  margin-top: 8px;
  font-size: 12px;
  color: #909399;
  line-height: 1.4;
}

.fields-configuration {
  margin-bottom: 24px;
}

.fields-configuration h4 {
  margin: 0 0 16px 0;
  color: #303133;
}

.field-name-cell {
  display: flex;
  align-items: center;
  gap: 4px;
}

.option-content {
  display: flex;
  align-items: center;
  gap: 8px;
}

.field-types-help {
  padding: 16px;
  background: #f8f9fa;
  border-radius: 6px;
  border: 1px solid #e4e7ed;
}

.field-types-help h4 {
  margin: 0 0 16px 0;
  color: #303133;
}

.types-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 16px;
}

.type-item {
  padding: 16px;
  background: white;
  border-radius: 6px;
  border: 1px solid #e4e7ed;
}

.type-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  font-weight: 500;
  color: #303133;
}

.type-desc {
  margin-bottom: 12px;
  color: #606266;
  font-size: 14px;
  line-height: 1.5;
}

.type-examples {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
</style> 