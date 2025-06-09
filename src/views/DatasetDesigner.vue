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
          <el-step title="基本信息" description="设置数据集名称和基本属性" />
          <el-step title="查询设计" description="选择数据源和配置查询方式" />
          <el-step title="字段配置" description="配置字段属性、计算字段和过滤" />
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
                  <el-form-item label="数据集分类">
                    <el-select 
                      v-model="form.category" 
                      placeholder="请选择数据集分类" 
                      style="width: 100%"
                      clearable
                    >
                      <el-option label="业务数据" value="business" />
                      <el-option label="统计报表" value="report" />
                      <el-option label="实时监控" value="monitor" />
                      <el-option label="其他" value="other" />
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
              
              <!-- 添加数据集属性配置 -->
              <el-row :gutter="24">
                <el-col :span="12">
                  <el-form-item label="刷新频率">
                    <el-select v-model="form.refreshRate" placeholder="选择刷新频率">
                      <el-option label="实时" value="realtime" />
                      <el-option label="每分钟" value="minute" />
                      <el-option label="每小时" value="hour" />
                      <el-option label="每天" value="day" />
                      <el-option label="手动" value="manual" />
                    </el-select>
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="缓存设置">
                    <el-switch v-model="form.enableCache" active-text="启用缓存" />
                  </el-form-item>
                </el-col>
              </el-row>
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

            <!-- 数据源选择 -->
            <div class="datasource-selection">
              <el-form-item label="选择数据源" prop="dataSourceId">
                    <el-select 
                      v-model="form.dataSourceId" 
                      placeholder="请选择数据源" 
                      style="width: 100%"
                      @change="handleDataSourceChange"
                      :loading="loadingDataSources"
                      clearable
                    >
                      <el-option
                        v-for="dataSource in dataSources"
                        :key="dataSource.id"
                        :label="dataSource.name"
                        :value="dataSource.id"
                      >
                        <span style="float: left">{{ dataSource.name }}</span>
                        <span style="float: right; color: #8492a6; font-size: 13px">
                          {{ dataSource.type }}
                        </span>
                      </el-option>
                    </el-select>
                    
                    <!-- 空状态提示 -->
                    <div v-if="!loadingDataSources && dataSources.length === 0" class="empty-datasource-tip">
                      <el-text type="warning" size="small">
                        <el-icon><Warning /></el-icon>
                        暂无可用数据源，请先
                        <el-link type="primary" @click="goToDataSourceManage">创建数据源</el-link>
                      </el-text>
                    </div>
                    
                    <!-- 数据源信息提示 -->
                    <div v-else-if="!loadingDataSources && dataSources.length > 0" class="datasource-info-tip">
                      <el-text type="info" size="small">
                        共 {{ dataSources.length }} 个可用数据源
                      </el-text>
                    </div>
                  </el-form-item>
        </div>

            <!-- 单表查询 -->
            <div v-if="form.queryType === 'single' && form.dataSourceId" class="single-table-panel">
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
            <div v-if="form.queryType === 'multi' && form.dataSourceId" class="multi-table-panel">
              <MultiTableDesigner
                v-model:tables="form.tables"
                v-model:relations="form.relations"
                :available-tables="tables"
                :table-fields="allFields"
                @tables-change="handleTablesChange"
              />
            </div>

            <!-- 自定义SQL -->
            <div v-if="form.queryType === 'sql' && form.dataSourceId" class="sql-panel">
              <SQLEditor
                v-model="form.sqlQuery"
                :data-source-id="form.dataSourceId"
                @validate="handleSQLValidate"
              />
            </div>

            <!-- 数据源未选择时的提示 -->
            <div v-if="!form.dataSourceId" class="no-datasource-tip">
              <el-empty description="请先选择数据源">
                <el-button type="primary" @click="goToDataSourceManage">创建数据源</el-button>
              </el-empty>
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
                  <el-button size="small" type="primary" @click="showAddCalculatedField = true">
                    <el-icon><Plus /></el-icon>
                    添加计算字段
                  </el-button>
                </div>
              </div>
            </template>

            <EnhancedFieldsConfig
              v-model="fieldConfigs"
              :available-fields="availableFields"
              :query-type="form.queryType"
              :data-source-id="form.dataSourceId"
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
import { ArrowLeft, Warning, Plus } from '@element-plus/icons-vue'
import { dataSetApi, dataSourceApi } from '@/api/dataSource'
import MultiTableDesigner from '@/components/dataset/MultiTableDesigner.vue'
import SQLEditor from '@/components/dataset/SQLEditor.vue'
import FieldsConfig from '@/components/dataset/FieldsConfig.vue'
import EnhancedFieldsConfig from '@/components/dataset/EnhancedFieldsConfig.vue'
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
const loadingDataSources = ref(false)
const basicFormRef = ref<FormInstance>()
const showAddCalculatedField = ref(false)

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
const form = reactive<DataSetCreateRequest & {
  category?: string
  refreshRate?: string
  enableCache?: boolean
}>({
  name: '',
  dataSourceId: 0,
  queryType: 'single',
  tableName: '',
  tables: [],
  relations: [],
  sqlQuery: '',
  description: '',
  fields: [],
  category: 'business',
  refreshRate: 'realtime',
  enableCache: true
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
    const tableFields = allFields.value[form.tableName]
    if (Array.isArray(tableFields)) {
      fields.push(...tableFields.map(field => ({
        ...field,
        tableName: form.tableName
      })))
    }
  } else if (form.queryType === 'multi' && form.tables) {
    form.tables.forEach(tableName => {
      const tableFields = allFields.value[tableName]
      if (Array.isArray(tableFields)) {
        fields.push(...tableFields.map(field => ({
          ...field,
          tableName
        })))
      }
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

const goToDataSourceManage = () => {
  router.push('/datasource-manage')
}

const loadDataSources = async () => {
  try {
    loadingDataSources.value = true
    console.log('开始加载数据源列表...')
    
    const result = await dataSourceApi.getAllDataSources()
    console.log('数据源API返回结果:', result)
    
    if (result.code === 200 && result.data?.content) {
      dataSources.value = result.data.content.map(ds => ({
        ...ds,
        id: ds.id || Math.random(),
        host: ds.url,
        databaseName: ds.database
      }))
      
      if (dataSources.value.length === 0) {
        ElMessage.warning('暂无可用的数据源，请先创建数据源')
      } else {
        console.log(`成功加载 ${dataSources.value.length} 个数据源`)
      }
    } else {
      console.error('数据源API返回的数据结构不正确:', result)
      dataSources.value = []
      ElMessage.error('加载数据源失败: ' + (result.message || '数据格式错误'))
    }
  } catch (error) {
    console.error('加载数据源失败:', error)
    ElMessage.error('加载数据源失败: ' + (error as Error).message)
    dataSources.value = []
  } finally {
    loadingDataSources.value = false
  }
}

const handleDataSourceChange = async (dataSourceId: number) => {
  if (!dataSourceId) {
    console.log('数据源ID为空，清空相关数据')
    tables.value = []
    form.tableName = ''
    form.tables = []
    form.relations = []
    allFields.value = {}
    fieldConfigs.value = []
    return
  }
  
  console.log('数据源变更，ID:', dataSourceId)
  
  // 找到选中的数据源对象
  const selectedDataSource = dataSources.value.find(ds => ds.id === dataSourceId)
  if (!selectedDataSource) {
    console.error('在数据源列表中未找到ID为', dataSourceId, '的数据源')
    console.log('当前数据源列表:', dataSources.value)
    ElMessage.error('数据源未找到')
    return
  }
  
  console.log('选中的数据源:', selectedDataSource)
  
  try {
    console.log('开始加载数据表列表...')
 
    // 传递数据源对象给API调用
    const tablesList = await dataSourceApi.getTablesBySourceId(dataSourceId, selectedDataSource)
    console.log('数据表API返回结果:', tablesList)
    
    if (Array.isArray(tablesList)) {
      tables.value = tablesList
      console.log(`成功加载 ${tablesList.length} 个数据表`)
      
      if (tablesList.length === 0) {
        ElMessage.warning('该数据源暂无可用的数据表')
      }
    } else {
      console.error('数据表API返回的不是数组格式:', tablesList)
      tables.value = []
      ElMessage.error('数据表数据格式错误')
    }
    
    // 重置相关字段
    form.tableName = ''
    form.tables = []
    form.relations = []
    allFields.value = {}
    fieldConfigs.value = []
    
  } catch (error) {
    console.error('加载数据表失败:', error)
    ElMessage.error('加载数据表失败: ' + (error as Error).message)
    tables.value = []
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
  
  // 找到选中的数据源对象
  const selectedDataSource = dataSources.value.find(ds => ds.id === form.dataSourceId)
  if (!selectedDataSource) {
    ElMessage.error('数据源未找到')
    return
  }
  
  try {
    const response = await dataSourceApi.getFieldsByTable(form.dataSourceId, tableName, selectedDataSource)
    console.log('获取到的字段信息:', response)
    
    if (response.code === 200 && Array.isArray(response.data)) {
      // 映射字段结构
      allFields.value[tableName] = response.data.map(field => ({
        name: field.columnName,
        dataType: field.columnType,
        isPrimary: field.isPrimaryKey,
        isNullable: true, // 默认可为空，因为API未提供此信息
        description: field.columnComment || '',
        tableName: tableName
      }))
      
      // 自动生成字段配置
      fieldConfigs.value = allFields.value[tableName].map(field => ({
        fieldName: field.name,
        displayName: field.description || field.name,
        tableName: tableName,
        fieldType: getFieldTypeFromDataType(field.dataType),
        isVisible: true,
        description: field.description || '',
        sortOrder: 0,
        aggregation: getFieldTypeFromDataType(field.dataType) === 'metric' ? 'sum' : undefined
      }))
    } else {
      throw new Error('字段数据格式不正确')
    }
  } catch (error) {
    console.error('加载字段信息失败:', error)
    ElMessage.error('加载字段信息失败: ' + (error as Error).message)
    allFields.value[tableName] = []
    fieldConfigs.value = []
  }
}

const handleTablesChange = async (selectedTables: string[]) => {
  // 找到选中的数据源对象
  const selectedDataSource = dataSources.value.find(ds => ds.id === form.dataSourceId)
  if (!selectedDataSource) {
    ElMessage.error('数据源未找到')
    return
  }
  
  for (const tableName of selectedTables) {
    if (!allFields.value[tableName]) {
      try {
        const response = await dataSourceApi.getFieldsByTable(form.dataSourceId, tableName, selectedDataSource)
        console.log(`获取表 ${tableName} 的字段信息:`, response)
        
        if (response.code === 200 && Array.isArray(response.data)) {
          // 映射字段结构
          allFields.value[tableName] = response.data.map(field => ({
            name: field.columnName,
            dataType: field.columnType,
            isPrimary: field.isPrimaryKey,
            isNullable: true, // 默认可为空，因为API未提供此信息
            description: field.columnComment || '',
            tableName: tableName
          }))
        } else {
          console.error(`表 ${tableName} 字段数据格式不正确:`, response)
          allFields.value[tableName] = []
        }
      } catch (error) {
        console.error(`加载表 ${tableName} 字段失败:`, error)
        allFields.value[tableName] = []
      }
    }
  }
  
  // 重新生成字段配置
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
      // 找到选中的数据源对象
      const selectedDataSource = dataSources.value.find(ds => ds.id === dataset.dataSourceId)
      if (selectedDataSource) {
        for (const tableName of dataset.tables) {
          try {
            const response = await dataSourceApi.getFieldsByTable(dataset.dataSourceId, tableName, selectedDataSource)
            console.log(`加载数据集时获取表 ${tableName} 的字段信息:`, response)
            
            if (response.code === 200 && Array.isArray(response.data)) {
              // 映射字段结构
              allFields.value[tableName] = response.data.map(field => ({
                name: field.columnName,
                dataType: field.columnType,
                isPrimary: field.isPrimaryKey,
                isNullable: true, // 默认可为空，因为API未提供此信息
                description: field.columnComment || '',
                tableName: tableName
              }))
            } else {
              console.error(`表 ${tableName} 字段数据格式不正确:`, response)
              allFields.value[tableName] = []
            }
          } catch (error) {
            console.error(`加载表 ${tableName} 字段失败:`, error)
            allFields.value[tableName] = []
          }
        }
      }
    }
    
    // 设置字段配置 - 修复属性映射
    fieldConfigs.value = dataset.fields.map(field => ({
      fieldName: field.fieldName,
      displayName: field.displayName,
      tableName: field.tableName || '',
      fieldType: field.fieldType,
      isVisible: field.isVisible,
      description: field.description || '',
      sortOrder: field.sortOrder,
      aggregation: field.aggregation
    }))
  } catch (error) {
    console.error('加载数据集失败:', error)
    ElMessage.error('加载数据集失败: ' + (error as Error).message)
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

.datasource-selection {
  margin-bottom: 20px;
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

.empty-datasource-tip {
  margin-top: 8px;
  padding: 8px 12px;
  text-align: center;
  background: #fdf6ec;
  border: 1px solid #fad4a3;
  border-radius: 4px;
}

.empty-datasource-tip .el-text {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
}

.datasource-info-tip {
  margin-top: 8px;
  padding: 6px 12px;
  text-align: center;
  background: #f0f9ff;
  border: 1px solid #bae6fd;
  border-radius: 4px;
}

.no-datasource-tip {
  margin-top: 20px;
  padding: 20px;
  text-align: center;
  background: white;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
}
</style> 