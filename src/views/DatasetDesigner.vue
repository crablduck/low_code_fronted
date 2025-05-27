<template>
  <div class="dataset-designer">
    <div class="designer-header">
      <div class="header-left">
        <el-button @click="goBack" :icon="ArrowLeft">返回</el-button>
        <h2>{{ isEdit ? '编辑数据集' : '创建数据集' }} - {{ form.name || '未命名数据集' }}</h2>
      </div>
      <div class="header-right">
        <el-button @click="previewDataAction" :disabled="!canPreview">数据预览</el-button>
        <el-button type="primary" @click="saveDataset" :loading="saving">
          {{ isEdit ? '更新' : '保存' }}
        </el-button>
      </div>
    </div>

    <div class="designer-content">
      <!-- 步骤导航 -->
      <div class="steps-container">
        <el-steps :active="currentStep" finish-status="success">
          <el-step title="基本信息" description="设置数据集名称和数据源" />
          <el-step title="查询设计" description="配置数据查询方式" />
          <el-step title="字段配置" description="设置字段属性和显示" />
          <el-step title="预览确认" description="预览数据并确认配置" />
        </el-steps>
      </div>

      <!-- 步骤内容 -->
      <div class="step-content">
        <!-- 步骤1: 基本信息 -->
        <div v-show="currentStep === 0" class="step-panel">
          <el-card>
            <template #header>
              <h3>基本信息配置</h3>
            </template>
            <el-form :model="form" :rules="rules" ref="basicFormRef" label-width="120px">
              <el-row :gutter="24">
                <el-col :span="12">
                  <el-form-item label="数据集名称" prop="name">
                    <el-input v-model="form.name" placeholder="请输入数据集名称" />
                  </el-form-item>
                </el-col>
                <el-col :span="12">
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
                </el-col>
              </el-row>
              <el-form-item label="描述">
                <el-input 
                  v-model="form.description" 
                  type="textarea" 
                  :rows="3"
                  placeholder="请输入数据集描述（可选）"
                />
              </el-form-item>
            </el-form>
          </el-card>
        </div>

        <!-- 步骤2: 查询设计 -->
        <div v-show="currentStep === 1" class="step-panel">
          <el-card>
            <template #header>
              <div class="query-header">
                <h3>查询设计</h3>
                <el-radio-group v-model="form.queryType" @change="handleQueryTypeChange">
                  <el-radio-button value="single">单表查询</el-radio-button>
                  <el-radio-button value="multi">多表关联</el-radio-button>
                  <el-radio-button value="sql">自定义SQL</el-radio-button>
                </el-radio-group>
              </div>
            </template>

            <!-- 单表查询 -->
            <div v-if="form.queryType === 'single'" class="single-table-panel">
              <el-form-item label="选择数据表">
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
              
              <div v-if="form.tableName" class="table-info">
                <h4>表信息</h4>
                <el-descriptions :column="2" border>
                  <el-descriptions-item label="表名">{{ form.tableName }}</el-descriptions-item>
                  <el-descriptions-item label="记录数">{{ getTableInfo(form.tableName)?.rowCount || 0 }}</el-descriptions-item>
                  <el-descriptions-item label="描述" :span="2">
                    {{ getTableInfo(form.tableName)?.description || '暂无描述' }}
                  </el-descriptions-item>
                </el-descriptions>
              </div>
            </div>

            <!-- 多表关联 -->
            <div v-if="form.queryType === 'multi'" class="multi-table-panel">
              <MultiTableDesigner
                v-model:tables="form.tables"
                v-model:relations="form.relations"
                :available-tables="tables"
                :table-fields="allFields"
                @tables-change="handleTablesChange"
              />
            </div>

            <!-- 自定义SQL -->
            <div v-if="form.queryType === 'sql'" class="sql-panel">
              <SQLEditor
                v-model="form.sqlQuery"
                :data-source-id="form.dataSourceId"
                @validate="handleSQLValidate"
              />
            </div>
          </el-card>
        </div>

        <!-- 步骤3: 字段配置 -->
        <div v-show="currentStep === 2" class="step-panel">
          <el-card>
            <template #header>
              <div class="fields-header">
                <h3>字段配置</h3>
                <div class="fields-actions">
                  <el-button size="small" @click="selectAllFields">全选</el-button>
                  <el-button size="small" @click="clearAllFields">清空</el-button>
                  <el-button size="small" @click="autoConfigFields">智能配置</el-button>
                </div>
              </div>
            </template>

            <FieldsConfig
              v-model="fieldConfigs"
              :available-fields="availableFields"
              :query-type="form.queryType"
            />
          </el-card>
        </div>

        <!-- 步骤4: 预览确认 -->
        <div v-show="currentStep === 3" class="step-panel">
          <el-card>
            <template #header>
              <div class="preview-header">
                <h3>预览确认</h3>
                <el-button @click="refreshPreview" :loading="loadingPreview">刷新预览</el-button>
              </div>
            </template>

            <div class="preview-content">
              <!-- 配置摘要 -->
              <div class="config-summary">
                <h4>配置摘要</h4>
                <el-descriptions :column="2" border>
                  <el-descriptions-item label="数据集名称">{{ form.name }}</el-descriptions-item>
                  <el-descriptions-item label="数据源">{{ getDataSourceName(form.dataSourceId) }}</el-descriptions-item>
                  <el-descriptions-item label="查询类型">{{ getQueryTypeLabel(form.queryType) }}</el-descriptions-item>
                  <el-descriptions-item label="字段数量">{{ fieldConfigs.length }}</el-descriptions-item>
                </el-descriptions>
              </div>

              <!-- 数据预览 -->
              <div class="data-preview">
                <h4>数据预览</h4>
                <el-table
                  :data="previewData.data"
                  style="width: 100%"
                  v-loading="loadingPreview"
                  max-height="400"
                >
                  <el-table-column
                    v-for="column in previewData.columns"
                    :key="column"
                    :prop="column"
                    :label="column"
                    show-overflow-tooltip
                  />
                </el-table>
                <div class="preview-footer">
                  <span>共 {{ previewData.totalCount }} 条记录，显示前 100 条</span>
                </div>
              </div>
            </div>
          </el-card>
        </div>
      </div>

      <!-- 步骤控制 -->
      <div class="step-controls">
        <el-button v-if="currentStep > 0" @click="prevStep">上一步</el-button>
        <el-button v-if="currentStep < 3" type="primary" @click="nextStep">下一步</el-button>
        <el-button v-if="currentStep === 3" type="success" @click="saveDataset" :loading="saving">
          {{ isEdit ? '更新数据集' : '创建数据集' }}
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { ArrowLeft } from '@element-plus/icons-vue'
import { dataSetApi, dataSourceApi } from '@/api/dataSource'
import MultiTableDesigner from '@/components/dataset/MultiTableDesigner.vue'
import SQLEditor from '@/components/dataset/SQLEditor.vue'
import FieldsConfig from '@/components/dataset/FieldsConfig.vue'
import type { 
  DataSet, 
  DataSetCreateRequest, 
  DataSource, 
  TableInfo, 
  FieldInfo,
  TableRelation,
  DataSetFieldConfig,
  DataPreviewDTO
} from '@/types/dataManagement'

const router = useRouter()
const route = useRoute()

// 响应式数据
const currentStep = ref(0)
const saving = ref(false)
const loadingPreview = ref(false)
const basicFormRef = ref<FormInstance>()

const dataSources = ref<DataSource[]>([])
const tables = ref<TableInfo[]>([])
const allFields = ref<Record<string, FieldInfo[]>>({})
const fieldConfigs = ref<DataSetFieldConfig[]>([])
const previewData = ref<DataPreviewDTO>({
  columns: [],
  data: [],
  totalCount: 0
})

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
const isEdit = computed(() => !!route.params.id)

const canPreview = computed(() => {
  if (form.queryType === 'single') {
    return form.dataSourceId && form.tableName
  } else if (form.queryType === 'multi') {
    return form.dataSourceId && form.tables && form.tables.length > 0
  } else if (form.queryType === 'sql') {
    return form.dataSourceId && form.sqlQuery
  }
  return false
})

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
  ]
}

// 方法定义
const goBack = () => {
  router.push('/dataset-manage')
}

const loadDataSources = async () => {
  try {
    dataSources.value = await dataSourceApi.getAllDataSources()
  } catch (error) {
    console.error('加载数据源失败:', error)
    ElMessage.error('加载数据源失败')
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
    console.error('加载数据表失败:', error)
    ElMessage.error('加载数据表失败')
  }
}

const handleQueryTypeChange = () => {
  // 重置相关字段
  form.tableName = ''
  form.tables = []
  form.relations = []
  form.sqlQuery = ''
  allFields.value = {}
  fieldConfigs.value = []
}

const handleTableChange = async (tableName: string) => {
  if (!form.dataSourceId || !tableName) return
  
  try {
    const fields = await dataSourceApi.getFieldsByTable(form.dataSourceId, tableName)
    allFields.value[tableName] = fields
    
    // 自动生成字段配置
    fieldConfigs.value = fields.map(field => ({
      name: field.name,
      displayName: field.description || field.name,
      tableName: tableName,
      type: 'dimension',
      aggregator: null
    }))
  } catch (error) {
    console.error('加载字段信息失败:', error)
    ElMessage.error('加载字段信息失败')
  }
}

const handleTablesChange = async (selectedTables: string[]) => {
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
  initFieldConfigs()
}

const handleSQLValidate = (result: { valid: boolean, error?: string }) => {
  if (!result.valid) {
    ElMessage.error(result.error || 'SQL语法错误')
  }
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

const selectAllFields = () => {
  initFieldConfigs()
}

const clearAllFields = () => {
  fieldConfigs.value = []
}

const autoConfigFields = () => {
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

const getTableInfo = (tableName: string) => {
  return tables.value.find(table => table.name === tableName)
}

const getDataSourceName = (dataSourceId: number) => {
  const dataSource = dataSources.value.find(ds => ds.id === dataSourceId)
  return dataSource ? dataSource.name : `数据源${dataSourceId}`
}

const getQueryTypeLabel = (type: string) => {
  switch (type) {
    case 'single': return '单表查询'
    case 'multi': return '多表关联'
    case 'sql': return '自定义SQL'
    default: return type
  }
}

const nextStep = async () => {
  if (currentStep.value === 0) {
    // 验证基本信息
    if (!basicFormRef.value) return
    try {
      await basicFormRef.value.validate()
    } catch {
      return
    }
  }
  
  if (currentStep.value < 3) {
    currentStep.value++
  }
}

const prevStep = () => {
  if (currentStep.value > 0) {
    currentStep.value--
  }
}

const previewDataAction = async () => {
  if (!canPreview.value) {
    ElMessage.warning('请先完成查询配置')
    return
  }
  
  currentStep.value = 3
  await refreshPreview()
}

const refreshPreview = async () => {
  if (!canPreview.value) return
  
  loadingPreview.value = true
  try {
    if (isEdit.value) {
      previewData.value = await dataSetApi.previewData(Number(route.params.id))
    } else {
      // TODO: 实现新建数据集的预览功能
      ElMessage.info('新建数据集预览功能开发中')
    }
  } catch (error) {
    console.error('预览数据失败:', error)
    ElMessage.error('预览数据失败')
  } finally {
    loadingPreview.value = false
  }
}

const loadDataset = async (id: number) => {
  try {
    const dataset = await dataSetApi.getDatasetById(id)
    
    // 填充表单数据
    form.name = dataset.name
    form.description = dataset.description || ''
    form.dataSourceId = dataset.dataSourceId
    form.queryType = dataset.queryType
    form.tableName = dataset.tableName || ''
    form.tables = dataset.tables || []
    form.relations = dataset.relations || []
    form.sqlQuery = dataset.sqlQuery || ''
    
    // 加载数据表和字段信息
    await handleDataSourceChange(dataset.dataSourceId)
    
    if (dataset.queryType === 'single' && dataset.tableName) {
      await handleTableChange(dataset.tableName)
    } else if (dataset.queryType === 'multi' && dataset.tables) {
      for (const tableName of dataset.tables) {
        const fields = await dataSourceApi.getFieldsByTable(dataset.dataSourceId, tableName)
        allFields.value[tableName] = fields
      }
    }
    
    // 设置字段配置
    fieldConfigs.value = dataset.fields.map(field => ({
      name: field.name,
      displayName: field.displayName,
      tableName: field.tableName,
      type: field.type,
      aggregator: field.aggregator || null
    }))
  } catch (error) {
    console.error('加载数据集失败:', error)
    ElMessage.error('加载数据集失败')
  }
}

const saveDataset = async () => {
  try {
    saving.value = true
    
    const submitData = {
      ...form,
      fields: fieldConfigs.value
    }
    
    if (isEdit.value) {
      await dataSetApi.updateDataset(Number(route.params.id), submitData)
      ElMessage.success('数据集更新成功')
    } else {
      await dataSetApi.createDataset(submitData)
      ElMessage.success('数据集创建成功')
    }
    
    router.push('/dataset-manage')
  } catch (error) {
    console.error(isEdit.value ? '数据集更新失败:' : '数据集创建失败:', error)
    ElMessage.error(isEdit.value ? '数据集更新失败' : '数据集创建失败')
  } finally {
    saving.value = false
  }
}

// 生命周期钩子
onMounted(async () => {
  await loadDataSources()
  
  if (isEdit.value) {
    await loadDataset(Number(route.params.id))
  }
})
</script>

<style scoped>
.dataset-designer {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #f5f7fa;
}

.designer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  background: white;
  border-bottom: 1px solid #e4e7ed;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.header-left h2 {
  margin: 0;
  color: #303133;
}

.header-right {
  display: flex;
  gap: 12px;
}

.designer-content {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
}

.steps-container {
  margin-bottom: 24px;
  background: white;
  padding: 24px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.step-content {
  margin-bottom: 24px;
}

.step-panel {
  min-height: 500px;
}

.query-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.query-header h3 {
  margin: 0;
}

.single-table-panel {
  padding: 20px 0;
}

.table-info {
  margin-top: 20px;
}

.table-info h4 {
  margin: 0 0 16px 0;
  color: #303133;
}

.multi-table-panel {
  min-height: 400px;
}

.sql-panel {
  min-height: 400px;
}

.fields-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.fields-header h3 {
  margin: 0;
}

.fields-actions {
  display: flex;
  gap: 8px;
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.preview-header h3 {
  margin: 0;
}

.preview-content {
  padding: 20px 0;
}

.config-summary {
  margin-bottom: 24px;
}

.config-summary h4 {
  margin: 0 0 16px 0;
  color: #303133;
}

.data-preview h4 {
  margin: 0 0 16px 0;
  color: #303133;
}

.preview-footer {
  margin-top: 16px;
  text-align: center;
  color: #909399;
  font-size: 14px;
}

.step-controls {
  display: flex;
  justify-content: center;
  gap: 16px;
  padding: 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}
</style> 