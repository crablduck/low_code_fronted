<template>
  <el-dialog
    v-model="visible"
    :title="isEdit ? '编辑数据集' : '新建数据集'"
    width="900px"
    :before-close="handleClose"
  >
    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-width="120px"
    >
      <el-form-item label="数据集名称" prop="name">
        <el-input v-model="form.name" placeholder="请输入数据集名称" />
      </el-form-item>
      
      <el-form-item label="数据源" prop="dataSourceId">
        <el-select 
          v-model="form.dataSourceId" 
          placeholder="请选择数据源" 
          style="width: 100%"
          @change="handleDataSourceChange"
        >
          <el-option
            v-for="dataSource in dataSources"
            :key="dataSource.id"
            :label="dataSource.name"
            :value="dataSource.id"
          />
        </el-select>
      </el-form-item>

      <el-form-item label="查询类型" prop="queryType">
        <el-radio-group v-model="form.queryType" @change="handleQueryTypeChange">
          <el-radio value="single">单表查询</el-radio>
          <el-radio value="multi">多表关联</el-radio>
          <el-radio value="sql">自定义SQL</el-radio>
        </el-radio-group>
      </el-form-item>
      
      <!-- 单表模式 -->
      <el-form-item 
        v-if="form.queryType === 'single'" 
        label="数据表" 
        prop="tableName"
      >
        <el-select 
          v-model="form.tableName" 
          placeholder="请选择数据表" 
          style="width: 100%"
          @change="handleTableChange"
        >
          <el-option
            v-for="table in tables"
            :key="table.name"
            :label="`${table.name} ${table.description ? '- ' + table.description : ''}`"
            :value="table.name"
          />
        </el-select>
      </el-form-item>

      <!-- 多表模式 -->
      <div v-if="form.queryType === 'multi'">
        <el-form-item label="选择数据表">
          <el-transfer
            v-model="form.tables"
            :data="tableOptions"
            :titles="['可选表', '已选表']"
            :button-texts="['移除', '添加']"
            @change="handleTablesChange"
          />
        </el-form-item>

        <el-form-item label="表关联关系" v-if="form.tables && form.tables.length > 1">
          <div class="relations-container">
            <div 
              v-for="(relation, index) in form.relations" 
              :key="index"
              class="relation-item"
            >
              <el-row :gutter="10" align="middle">
                <el-col :span="5">
                  <el-select v-model="relation.leftTable" placeholder="左表">
                    <el-option
                      v-for="table in selectedTables"
                      :key="table"
                      :label="table"
                      :value="table"
                    />
                  </el-select>
                </el-col>
                <el-col :span="4">
                  <el-select v-model="relation.leftField" placeholder="左字段">
                    <el-option
                      v-for="field in getTableFields(relation.leftTable)"
                      :key="field.name"
                      :label="field.name"
                      :value="field.name"
                    />
                  </el-select>
                </el-col>
                <el-col :span="3">
                  <el-select v-model="relation.joinType" placeholder="关联类型">
                    <el-option label="INNER" value="INNER" />
                    <el-option label="LEFT" value="LEFT" />
                    <el-option label="RIGHT" value="RIGHT" />
                    <el-option label="FULL" value="FULL" />
                  </el-select>
                </el-col>
                <el-col :span="5">
                  <el-select v-model="relation.rightTable" placeholder="右表">
                    <el-option
                      v-for="table in selectedTables"
                      :key="table"
                      :label="table"
                      :value="table"
                    />
                  </el-select>
                </el-col>
                <el-col :span="4">
                  <el-select v-model="relation.rightField" placeholder="右字段">
                    <el-option
                      v-for="field in getTableFields(relation.rightTable)"
                      :key="field.name"
                      :label="field.name"
                      :value="field.name"
                    />
                  </el-select>
                </el-col>
                <el-col :span="3">
                  <el-button 
                    type="danger" 
                    size="small" 
                    @click="removeRelation(index)"
                    :icon="Delete"
                  />
                </el-col>
              </el-row>
            </div>
            <el-button 
              type="primary" 
              size="small" 
              @click="addRelation"
              :icon="Plus"
            >
              添加关联
            </el-button>
          </div>
        </el-form-item>
      </div>

      <!-- SQL模式 -->
      <el-form-item 
        v-if="form.queryType === 'sql'" 
        label="SQL查询" 
        prop="sqlQuery"
      >
        <el-input
          v-model="form.sqlQuery"
          type="textarea"
          :rows="8"
          placeholder="请输入SQL查询语句"
          style="font-family: 'Courier New', monospace;"
        />
        <div class="sql-actions">
          <el-button size="small" @click="formatSQL">格式化</el-button>
          <el-button size="small" @click="validateSQL">验证语法</el-button>
        </div>
      </el-form-item>
      
      <el-form-item label="描述">
        <el-input 
          v-model="form.description" 
          type="textarea" 
          :rows="3"
          placeholder="请输入数据集描述（可选）"
        />
      </el-form-item>
      
      <!-- 字段配置 -->
      <el-form-item 
        label="字段配置" 
        v-if="availableFields.length > 0"
      >
        <div class="fields-config">
          <div class="fields-header">
            <el-button size="small" @click="selectAllFields">全选</el-button>
            <el-button size="small" @click="clearAllFields">清空</el-button>
            <el-button size="small" @click="autoConfigFields">智能配置</el-button>
          </div>
          
          <el-table 
            :data="availableFields" 
            style="width: 100%" 
            max-height="400"
            @selection-change="handleFieldSelection"
          >
            <el-table-column type="selection" width="55" />
            <el-table-column prop="name" label="字段名" width="150" />
            <el-table-column prop="dataType" label="数据类型" width="100" />
            <el-table-column label="显示名称" width="150">
              <template #default="{ row, $index }">
                <el-input 
                  v-model="fieldConfigs[$index].displayName" 
                  placeholder="显示名称"
                  size="small"
                />
              </template>
            </el-table-column>
            <el-table-column label="字段类型" width="120">
              <template #default="{ row, $index }">
                <el-select 
                  v-model="fieldConfigs[$index].fieldType" 
                  placeholder="类型"
                  size="small"
                >
                  <el-option label="维度" value="dimension" />
                  <el-option label="指标" value="metric" />
                </el-select>
              </template>
            </el-table-column>
            <el-table-column label="聚合方式" width="120">
              <template #default="{ row, $index }">
                <el-select 
                  v-model="fieldConfigs[$index].aggregation" 
                  placeholder="聚合"
                  size="small"
                  :disabled="fieldConfigs[$index].fieldType !== 'metric'"
                >
                  <el-option label="求和" value="sum" />
                  <el-option label="计数" value="count" />
                  <el-option label="平均" value="avg" />
                  <el-option label="最大" value="max" />
                  <el-option label="最小" value="min" />
                </el-select>
              </template>
            </el-table-column>
            <el-table-column label="是否可见" width="100">
              <template #default="{ row, $index }">
                <el-switch v-model="fieldConfigs[$index].isVisible" />
              </template>
            </el-table-column>
            <el-table-column label="描述">
              <template #default="{ row, $index }">
                <el-input 
                  v-model="fieldConfigs[$index].description" 
                  placeholder="字段描述"
                  size="small"
                />
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-form-item>
    </el-form>
    
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitting">
          {{ isEdit ? '更新' : '创建' }}
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { Plus, Delete } from '@element-plus/icons-vue'
import { dataSetApi, dataSourceApi } from '@/api/dataSource'
import type { 
  DataSet, 
  DataSetCreateRequest, 
  DataSource, 
  TableInfo, 
  FieldInfo,
  TableRelation,
  DataSetFieldConfig
} from '@/types/dataManagement'

// Props
interface Props {
  modelValue: boolean
  dataset?: DataSet | null
}

const props = withDefaults(defineProps<Props>(), {
  dataset: null
})

// Emits
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  success: []
}>()

// 响应式数据
const formRef = ref<FormInstance>()
const submitting = ref(false)
const dataSources = ref<DataSource[]>([])
const tables = ref<TableInfo[]>([])
const allFields = ref<Record<string, FieldInfo[]>>({}) // 存储每个表的字段
const fieldConfigs = ref<DataSetFieldConfig[]>([])

// 表单数据
const form = reactive<DataSetCreateRequest>({
  name: '',
  dataSourceId: 0,
  queryType: 'single',
  tableName: '',
  tables: [],
  relations: [],
  sqlQuery: '',
  description: '',
  fields: []
})

// 计算属性
const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const isEdit = computed(() => !!props.dataset)

// 表格选项（用于穿梭框）
const tableOptions = computed(() => {
  return tables.value.map(table => ({
    key: table.name,
    label: `${table.name} ${table.description ? '- ' + table.description : ''}`,
    value: table.name
  }))
})

// 已选择的表
const selectedTables = computed(() => {
  return form.tables || []
})

// 可用字段列表
const availableFields = computed(() => {
  const fields: FieldInfo[] = []
  
  if (form.queryType === 'single' && form.tableName) {
    const tableFields = allFields.value[form.tableName] || []
    fields.push(...tableFields.map(field => ({
      ...field,
      tableName: form.tableName
    })))
  } else if (form.queryType === 'multi' && form.tables) {
    form.tables.forEach(tableName => {
      const tableFields = allFields.value[tableName] || []
      fields.push(...tableFields.map(field => ({
        ...field,
        tableName
      })))
    })
  }
  
  return fields
})

// 表单验证规则
const rules: FormRules = {
  name: [
    { required: true, message: '请输入数据集名称', trigger: 'blur' },
    { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  dataSourceId: [
    { required: true, message: '请选择数据源', trigger: 'change' }
  ],
  queryType: [
    { required: true, message: '请选择查询类型', trigger: 'change' }
  ],
  tableName: [
    { 
      required: true, 
      message: '请选择数据表', 
      trigger: 'change',
      validator: (rule, value, callback) => {
        if (form.queryType === 'single' && !value) {
          callback(new Error('请选择数据表'))
        } else {
          callback()
        }
      }
    }
  ],
  sqlQuery: [
    { 
      required: true, 
      message: '请输入SQL查询语句', 
      trigger: 'blur',
      validator: (rule, value, callback) => {
        if (form.queryType === 'sql' && !value) {
          callback(new Error('请输入SQL查询语句'))
        } else {
          callback()
        }
      }
    }
  ]
}

// 方法定义
const resetForm = () => {
  Object.assign(form, {
    name: '',
    dataSourceId: 0,
    queryType: 'single',
    tableName: '',
    tables: [],
    relations: [],
    sqlQuery: '',
    description: '',
    fields: []
  })
  tables.value = []
  allFields.value = {}
  fieldConfigs.value = []
  formRef.value?.clearValidate()
}

const loadDataSources = async () => {
  try {
    dataSources.value = await dataSourceApi.getAllDataSources()
  } catch (error) {
    console.error('加载数据源失败:', error)
  }
}

const handleDataSourceChange = async (dataSourceId: number) => {
  if (!dataSourceId) return
  
  try {
    tables.value = await dataSourceApi.getTablesBySourceId(dataSourceId)
    form.tableName = ''
    form.tables = []
    form.relations = []
    allFields.value = {}
    fieldConfigs.value = []
  } catch (error) {
    ElMessage.error('加载数据表失败')
    console.error(error)
  }
}

const handleQueryTypeChange = () => {
  form.tableName = ''
  form.tables = []
  form.relations = []
  form.sqlQuery = ''
  allFields.value = {}
  fieldConfigs.value = []
}

const handleTableChange = async (tableName: string) => {
  if (!tableName || !form.dataSourceId) return
  
  try {
    const fields = await dataSourceApi.getFieldsByTable(form.dataSourceId, tableName)
    allFields.value[tableName] = fields
    initFieldConfigs()
  } catch (error) {
    ElMessage.error('加载字段信息失败')
    console.error(error)
  }
}

const handleTablesChange = async (selectedTables: string[]) => {
  // 加载新选择表的字段信息
  for (const tableName of selectedTables) {
    if (!allFields.value[tableName]) {
      try {
        const fields = await dataSourceApi.getFieldsByTable(form.dataSourceId, tableName)
        allFields.value[tableName] = fields
      } catch (error) {
        console.error(`加载表 ${tableName} 字段失败:`, error)
      }
    }
  }
  
  // 清理不再使用的表的关联关系
  form.relations = form.relations?.filter(relation => 
    selectedTables.includes(relation.leftTable) && 
    selectedTables.includes(relation.rightTable)
  ) || []
  
  initFieldConfigs()
}

const getTableFields = (tableName: string): FieldInfo[] => {
  return allFields.value[tableName] || []
}

const addRelation = () => {
  if (!form.relations) form.relations = []
  form.relations.push({
    leftTable: '',
    leftField: '',
    rightTable: '',
    rightField: '',
    joinType: 'INNER'
  })
}

const removeRelation = (index: number) => {
  form.relations?.splice(index, 1)
}

const initFieldConfigs = () => {
  fieldConfigs.value = availableFields.value.map(field => ({
    fieldName: field.name,
    tableName: field.tableName,
    displayName: field.name,
    fieldType: getFieldTypeFromDataType(field.dataType),
    isVisible: true,
    description: field.description || '',
    sortOrder: 0,
    aggregation: getFieldTypeFromDataType(field.dataType) === 'metric' ? 'sum' : undefined
  }))
}

const getFieldTypeFromDataType = (dataType: string): 'dimension' | 'metric' => {
  const type = dataType.toLowerCase()
  if (type.includes('int') || type.includes('decimal') || type.includes('float') || type.includes('double')) {
    return 'metric'
  } else {
    return 'dimension'
  }
}

const handleFieldSelection = (selection: FieldInfo[]) => {
  // 根据选择更新字段配置
  const selectedFieldNames = selection.map(field => field.name)
  fieldConfigs.value = fieldConfigs.value.filter(config => 
    selectedFieldNames.includes(config.fieldName)
  )
}

const selectAllFields = () => {
  initFieldConfigs()
}

const clearAllFields = () => {
  fieldConfigs.value = []
}

const autoConfigFields = () => {
  // 智能配置：自动设置字段类型和聚合方式
  fieldConfigs.value.forEach(config => {
    config.fieldType = getFieldTypeFromDataType(
      availableFields.value.find(f => f.name === config.fieldName)?.dataType || ''
    )
    if (config.fieldType === 'metric') {
      config.aggregation = 'sum'
    }
  })
  ElMessage.success('字段配置已自动优化')
}

const formatSQL = () => {
  // 简单的SQL格式化
  if (form.sqlQuery) {
    form.sqlQuery = form.sqlQuery
      .replace(/\s+/g, ' ')
      .replace(/\s*,\s*/g, ',\n  ')
      .replace(/\s+(FROM|WHERE|GROUP BY|ORDER BY|HAVING)\s+/gi, '\n$1 ')
      .replace(/\s+(INNER|LEFT|RIGHT|FULL)\s+JOIN\s+/gi, '\n$1 JOIN ')
      .trim()
  }
}

const validateSQL = () => {
  if (!form.sqlQuery) {
    ElMessage.warning('请先输入SQL语句')
    return
  }
  
  // 简单的SQL语法检查
  const sql = form.sqlQuery.trim().toUpperCase()
  if (!sql.startsWith('SELECT')) {
    ElMessage.error('SQL语句必须以SELECT开头')
    return
  }
  
  ElMessage.success('SQL语法检查通过')
}

const handleSubmit = async () => {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
    submitting.value = true
    
    // 准备提交数据
    const submitData = {
      ...form,
      fields: fieldConfigs.value
    }
    
    if (isEdit.value && props.dataset) {
      // 编辑模式
      await dataSetApi.updateDataset(props.dataset.id, submitData)
      ElMessage.success('数据集更新成功')
    } else {
      // 新建模式
      await dataSetApi.createDataset(submitData)
      ElMessage.success('数据集创建成功')
    }
    
    emit('success')
  } catch (error) {
    if (error !== false) { // 不是表单验证错误
      ElMessage.error(isEdit.value ? '数据集更新失败' : '数据集创建失败')
      console.error(error)
    }
  } finally {
    submitting.value = false
  }
}

const handleClose = () => {
  if (!submitting.value) {
    visible.value = false
    resetForm()
  }
}

// 监听编辑数据集变化
watch(() => props.dataset, (dataset) => {
  if (dataset) {
    Object.assign(form, {
      name: dataset.name,
      dataSourceId: dataset.dataSourceId,
      queryType: dataset.queryType || 'single',
      tableName: dataset.tableName || '',
      tables: dataset.tables || [],
      relations: dataset.relations || [],
      sqlQuery: dataset.sqlQuery || '',
      description: dataset.description || ''
    })
    
    if (dataset.dataSourceId) {
      handleDataSourceChange(dataset.dataSourceId)
    }
  } else {
    resetForm()
  }
}, { immediate: true })

// 监听对话框打开
watch(visible, (isVisible) => {
  if (isVisible) {
    loadDataSources()
  }
})
</script>

<style scoped>
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.relations-container {
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  padding: 16px;
  background-color: #fafafa;
}

.relation-item {
  margin-bottom: 12px;
  padding: 12px;
  background-color: white;
  border-radius: 4px;
  border: 1px solid #e4e7ed;
}

.relation-item:last-child {
  margin-bottom: 12px;
}

.fields-config {
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  overflow: hidden;
}

.fields-header {
  padding: 12px;
  background-color: #f5f7fa;
  border-bottom: 1px solid #dcdfe6;
  display: flex;
  gap: 8px;
}

.sql-actions {
  margin-top: 8px;
  display: flex;
  gap: 8px;
}
</style> 