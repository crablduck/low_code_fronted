<template>
  <div class="dataset-designer">
    <div class="designer-header">
      <div class="header-left">
        <el-button @click="goBack" :icon="ArrowLeft">返回</el-button>
        <h2>{{ isEdit ? '编辑数据集' : '创建数据集' }} - {{ form.name || '未命名数据集' }}</h2>
      </div>
      <div class="header-right">
        <el-button @click="previewDataAction" :disabled="!canPreview" :loading="loadingPreview">
          <el-icon><View /></el-icon>
          数据预览
        </el-button>
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
          <el-row :gutter="16">
            <!-- 左侧：字段配置 -->
            <el-col :span="16">
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
                  ref="fieldsConfigRef"
                  v-model="fieldConfigs"
                  :available-fields="availableFields"
                  :query-type="form.queryType"
                  :data-source-id="form.dataSourceId"
                />
              </el-card>
            </el-col>
            
            <!-- 右侧：实时预览 -->
            <el-col :span="8">
              <el-card>
                <template #header>
                  <div class="preview-header">
                    <h4>实时预览</h4>
                    <el-button size="small" @click="refreshPreview" :loading="loadingPreview">
                      <el-icon><Refresh /></el-icon>
                    </el-button>
                  </div>
                </template>
                
                <div class="mini-preview">
                  <DataPreview
                    :data="previewData"
                    :loading="loadingPreview"
                    :limit="10"
                    :max-height="300"
                    @refresh="refreshPreview"
                  />
                </div>
              </el-card>
            </el-col>
          </el-row>
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
                <DataPreview
                  :data="previewData"
                  :loading="loadingPreview"
                  :limit="100"
                  @refresh="refreshPreview"
                  @export="exportPreviewData"
                />
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
import { ArrowLeft, Warning, Plus, View, Refresh } from '@element-plus/icons-vue'
import { dataSetApi, dataSourceApi } from '@/api/dataSource'
import MultiTableDesigner from '../components/dataset/MultiTableDesigner.vue'
import SQLEditor from '../components/dataset/SQLEditor.vue'
import FieldsConfig from '../components/dataset/FieldsConfig.vue'
import EnhancedFieldsConfig from '../components/dataset/EnhancedFieldsConfig.vue'
import DataPreview from '../components/dataset/DataPreview.vue'
import type { 
  DataSet, 
  DataSetCreateRequest, 
  DataSource, 
  TableInfo, 
  FieldInfo,
  TableRelation,
  DataSetFieldConfig,
  DataPreviewDTO
} from '@/shared/types/dataManagement'

const router = useRouter()
const route = useRoute()

// 响应式数据
const currentStep = ref(0)
const saving = ref(false)
const loadingPreview = ref(false)
const loadingDataSources = ref(false)
const basicFormRef = ref<FormInstance>()
const showAddCalculatedField = ref(false)
const fieldsConfigRef = ref()

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
  dataSourceId?: number  // 临时保留用于UI绑定
}>({
  name: '',
  dataSourceId: 0,  // UI绑定用
  dataSourceIds: [], // 实际提交用
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

// 操作符映射函数
const mapOperatorToApiFormat = (operator: string) => {
  const operatorMap = {
    'equals': 'eq',
    'not_equals': 'ne', 
    'contains': 'like',
    'not_contains': 'not_like',
    'greater_than': 'gt',
    'less_than': 'lt',
    'greater_equal': 'gte',
    'less_equal': 'lte',
    'is_null': 'is_null',
    'is_not_null': 'is_not_null'
  }
  return operatorMap[operator] || 'eq'
}



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
  ],
  dataSourceIds: [
    { 
      validator: (rule, value, callback) => {
        if (!value || value.length === 0) {
          callback(new Error('请选择数据源'))
        } else if (value.some((id: any) => !Number.isInteger(id))) {
          callback(new Error('数据源ID格式错误'))
        } else {
          callback()
        }
      }, 
      trigger: 'change' 
    }
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
      // 过滤掉没有有效ID的数据源，彻底避免随机数问题
      const validDataSources = result.data.content.filter(ds => {
        const hasValidId = ds && ds.id && typeof ds.id === 'number' && Number.isInteger(ds.id)
        if (!hasValidId) {
          console.warn('⚠️ 跳过无效数据源:', ds)
        }
        return hasValidId
      })
      
      dataSources.value = validDataSources.map(ds => ({
        ...ds,
        host: ds.url,
        databaseName: ds.database
      }))
      
      console.log('✅ 成功加载有效数据源:', dataSources.value.map(ds => ({ id: ds.id, name: ds.name })))
      
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
    form.dataSourceIds = [] // 清空数组
    allFields.value = {}
    fieldConfigs.value = []
    return
  }
  
  // 验证ID是否为整数
  if (!Number.isInteger(dataSourceId)) {
    console.error('❌ 数据源ID不是整数:', dataSourceId)
    ElMessage.error('数据源ID格式错误，请联系管理员')
    return
  }
  
  console.log('✅ 数据源变更，ID:', dataSourceId)
  
  // 更新数组格式的dataSourceIds
  form.dataSourceIds = [dataSourceId]
  console.log('📝 已更新 dataSourceIds:', form.dataSourceIds)
  
  // 找到选中的数据源对象
  const selectedDataSource = dataSources.value.find(ds => ds.id === dataSourceId)
  if (!selectedDataSource) {
    console.error('❌ 在数据源列表中未找到ID为', dataSourceId, '的数据源')
    console.log('当前数据源列表:', dataSources.value)
    ElMessage.error('数据源未找到')
    return
  }
  
  console.log('✅ 选中的数据源:', selectedDataSource)
  
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
  
  // 数值类型 → 指标
  if (type.includes('int') || type.includes('decimal') || type.includes('float') || 
      type.includes('double') || type.includes('number') || type.includes('bigint') ||
      type.includes('money') || type.includes('currency')) {
    return 'metric'
  }
  
  // 所有其他类型（包括日期时间）→ 维度
  // 根据API使用指南，只有 dimension 和 metric 两种类型
  return 'dimension'
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
    // 获取当前所有有效的字段配置
    const validFields = fieldConfigs.value.filter(field => field.isVisible !== false)
    
    // 从 EnhancedFieldsConfig 组件实例获取计算字段和过滤条件
    const calculatedFields = fieldsConfigRef.value?.calculatedFields || []
    const filterConditions = fieldsConfigRef.value?.filterConditions || []
    
    console.log('🔍 从组件获取的数据:', {
      fieldsConfigRef存在: !!fieldsConfigRef.value,
      calculatedFields: calculatedFields.length,
      filterConditions: filterConditions.length,
      calculatedFieldsDetail: calculatedFields,
      filterConditionsDetail: filterConditions,
      validFields: validFields.map(f => ({ name: f.fieldName, type: f.fieldType }))
    })
    
    // 构建包含计算字段信息的API字段格式
    const apiFields = validFields.map(field => {
      // 查找对应的计算字段
      const calculatedField = calculatedFields.find(cf => cf.name === field.fieldName)
      
      console.log(`🔍 处理字段 ${field.fieldName}:`, {
        原字段: field,
        找到计算字段: !!calculatedField,
        计算字段详情: calculatedField
      })
      
      if (calculatedField) {
        // 这是一个计算字段 - 使用expression，不需要aggregation
        const result = {
          ...field,
          fieldType: field.fieldType === 'date' ? 'dimension' : field.fieldType as 'dimension' | 'metric',
          isCalculated: true,
          expression: calculatedField.formula,
          displayName: calculatedField.displayName || field.displayName
          // 不设置 aggregation，因为 expression 已经包含了聚合逻辑
        }
        console.log(`✅ 生成计算字段配置:`, result)
        return result
      } else {
        // 这是一个普通字段 - 如果是metric类型，使用aggregation
        const result: any = {
          ...field,
          fieldType: field.fieldType === 'date' ? 'dimension' : field.fieldType as 'dimension' | 'metric',
          isCalculated: false
        }
        
        // 只有metric类型的普通字段才需要aggregation
        if (field.fieldType === 'metric' && field.aggregation) {
          result.aggregation = field.aggregation
        }
        
        console.log(`📊 生成普通字段配置:`, result)
        return result
      }
    })
    
    // 转换过滤条件为API格式
    const filters = filterConditions.map(filter => ({
      fieldName: filter.fieldName,
      operator: mapOperatorToApiFormat(filter.operator),
      value: filter.value
    }))
    
    console.log('🔍 增强预览配置:', {
      totalFields: apiFields.length,
      calculatedFieldsCount: apiFields.filter(f => f.isCalculated).length,
      filtersCount: filters.length,
      apiFieldsDetail: apiFields.map(f => ({
        name: f.fieldName,
        type: f.fieldType,
        isCalculated: f.isCalculated,
        expression: f.expression,
        aggregation: f.aggregation
      })),
      filtersDetail: filters
    })
    
    if (isEdit.value) {
      // 编辑模式：使用数据集ID预览
      const response = await dataSetApi.previewDataById(Number(route.params.id))
      previewData.value = response
    } else {
      // 新建模式：根据当前配置动态构建请求
      const { useDatasetPreview } = await import('@/features/dashboard/composables/useDatasetPreview')
      const { previewSingleSource, previewCrossSource } = useDatasetPreview()
      
      let result
      
      if (form.queryType === 'single') {
        // 单表查询 - 使用包含计算字段的配置
        if (!form.dataSourceId || !form.tableName) {
          throw new Error('单表查询需要指定数据源ID和表名')
        }
        
        console.log('🔍 单表预览最终配置:', {
          dataSourceId: form.dataSourceId,
          tableName: form.tableName,
          fields: apiFields.length,
          calculatedFields: apiFields.filter(f => f.isCalculated).length,
          filters: filters.length
        })
        
        result = await previewSingleSource(
          form.dataSourceId,
          form.tableName,
          apiFields, // 使用包含计算字段的配置
          filters,   // 使用转换后的过滤条件
          100
        )
        
      } else if (form.queryType === 'multi') {
        // 多表关联 - 使用包含计算字段的配置
        if (!form.dataSourceId || !form.tables || form.tables.length === 0) {
          throw new Error('多表查询需要指定数据源ID和表配置')
        }
        
        const tables = form.tables.map((tableName, index) => ({
          tableName,
          dataSourceId: form.dataSourceId,
          alias: `t${index + 1}`
        }))
        
        console.log('🔍 多表预览最终配置:', {
          dataSourceIds: [form.dataSourceId],
          tables: tables,
          fields: apiFields.length,
          calculatedFields: apiFields.filter(f => f.isCalculated).length,
          filters: filters.length
        })
        
        result = await previewCrossSource(
          [form.dataSourceId],
          tables,
          form.relations || [],
          apiFields, // 使用包含计算字段的配置
          filters,   // 使用转换后的过滤条件
          100
        )
        
      } else if (form.queryType === 'sql') {
        // SQL模式
        if (!form.dataSourceId || !form.sqlQuery) {
          throw new Error('SQL查询需要指定数据源ID和SQL语句')
        }
        
        console.log('🔍 SQL预览最终配置:', {
          dataSourceId: form.dataSourceId,
          sqlQuery: form.sqlQuery.substring(0, 100) + '...',
          fields: apiFields.length,
          calculatedFields: apiFields.filter(f => f.isCalculated).length
        })
        
        result = await previewSingleSource(
          form.dataSourceId,
          'custom_sql',
          apiFields, // 使用包含计算字段的配置
          filters,
          100
        )
        
      } else {
        throw new Error('不支持的查询类型: ' + form.queryType)
      }
      
      previewData.value = {
        columns: result.columns || [],
        data: result.data || [],
        totalCount: result.totalCount || 0
      }
      
      console.log('✅ 增强预览成功:', {
        queryType: form.queryType,
        requestedFields: apiFields.length,
        calculatedFieldsUsed: apiFields.filter(f => f.isCalculated).length,
        filtersApplied: filters.length,
        returnedColumns: previewData.value.columns.length,
        recordsCount: previewData.value.data.length,
        totalCount: previewData.value.totalCount
      })
      
      if (previewData.value.data.length > 0) {
        const calculatedCount = apiFields.filter(f => f.isCalculated).length
        const filterCount = filters.length
        let message = `预览成功！共查询到 ${previewData.value.totalCount} 条数据`
        if (calculatedCount > 0) {
          message += `，包含 ${calculatedCount} 个计算字段`
        }
        if (filterCount > 0) {
          message += `，应用了 ${filterCount} 个过滤条件`
        }
        ElMessage.success(message)
      } else {
        ElMessage.warning('预览成功，但查询结果为空。请检查数据源或调整查询条件')
      }
    }
    
  } catch (error) {
    console.error('❌ 预览数据失败:', error)
    ElMessage.error('预览数据失败: ' + (error as Error).message)
    
    // 最后的降级方案：基于当前字段配置生成模拟数据
    const mockData = generateMockPreviewData()
    previewData.value = {
      columns: mockData.columns,
      data: mockData.data,
      totalCount: mockData.data.length
    }
    ElMessage.info('已生成模拟数据用于预览界面展示')
  } finally {
    loadingPreview.value = false
  }
}

const exportPreviewData = () => {
  if (!previewData.value.data || previewData.value.data.length === 0) {
    ElMessage.warning('没有可导出的数据')
    return
  }
  
  try {
    // 简单的CSV导出
    const headers = previewData.value.columns
    const csvContent = [
      headers.join(','),
      ...previewData.value.data.map(row => 
        headers.map(header => {
          const value = row[header]
          return typeof value === 'string' && value.includes(',') ? `"${value}"` : value
        }).join(',')
      )
    ].join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `${form.name || 'dataset'}_preview.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    ElMessage.success('数据导出成功')
  } catch (error) {
    console.error('导出失败:', error)
    ElMessage.error('导出失败')
  }
}

// 基于当前字段配置生成模拟预览数据
const generateMockPreviewData = () => {
  const validFields = fieldConfigs.value.filter(field => field.isVisible !== false)
  const columns = validFields.length > 0 
    ? validFields.map(f => f.fieldName)
    : ['id', 'name', 'status', 'create_time']
  
  const mockData = []
  for (let i = 1; i <= 20; i++) {
    const row: Record<string, any> = {}
    validFields.forEach(fieldConfig => {
      const fieldName = fieldConfig.fieldName
      const fieldType = fieldConfig.fieldType
      
      if (fieldConfig.isCalculated && fieldConfig.expression) {
        // 计算字段的模拟值
        row[fieldName] = `计算结果${i}`
      } else if (fieldType === 'metric') {
        // 数值型字段
        if (fieldConfig.aggregation === 'count') {
          row[fieldName] = Math.floor(Math.random() * 1000)
        } else {
          row[fieldName] = Math.floor(Math.random() * 10000) / 100
        }
      } else if (fieldType === 'date') {
        // 日期型字段
        row[fieldName] = new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      } else {
        // 维度型字段
        if (fieldName.includes('id') || fieldName.includes('Id')) {
          row[fieldName] = i
        } else if (fieldName.includes('name') || fieldName.includes('Name')) {
          row[fieldName] = `${fieldConfig.displayName || fieldName}${i}`
        } else if (fieldName.includes('status') || fieldName.includes('Status')) {
          row[fieldName] = ['active', 'inactive', 'pending'][Math.floor(Math.random() * 3)]
        } else {
          row[fieldName] = `${fieldName}_${i}`
        }
      }
    })
    mockData.push(row)
  }
  
  return {
    columns,
    data: mockData
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
      aggregation: field.aggregation,
      isCalculated: field.isCalculated || false,
      expression: field.expression
    }))
    
    // ✅ 加载过滤条件 - 如果数据集包含过滤条件
    if (dataset.filterConditions && Array.isArray(dataset.filterConditions)) {
      // 辅助函数：将后端操作符映射为前端格式
      const mapBackendOperatorToFrontend = (operator: string): string => {
        const operatorMap: Record<string, string> = {
          'eq': 'equals',
          'ne': 'not_equals',
          'gt': 'greater_than',
          'lt': 'less_than',
          'gte': 'greater_equal',
          'lte': 'less_equal',
          'like': 'contains',
          'not_like': 'not_contains',
          'is_null': 'is_null',
          'is_not_null': 'is_not_null'
        }
        return operatorMap[operator] || operator
      }
      
      // 辅助函数：转换后端值格式为前端格式
      const convertBackendValueToFrontend = (operator: string, value: any): string => {
        if (value === null || value === undefined) {
          return ''
        }
        
        // 对于 LIKE 操作，移除百分号
        if (operator === 'like' || operator === 'not_like') {
          if (typeof value === 'string' && value.startsWith('%') && value.endsWith('%')) {
            return value.slice(1, -1)
          }
        }
        
        // 对于数组值，转换为字符串
        if (Array.isArray(value)) {
          return JSON.stringify(value)
        }
        
        return String(value)
      }
      
      // 将后端的过滤条件格式转换为前端格式
      const convertedFilterConditions = dataset.filterConditions.map(filter => ({
        fieldName: filter.fieldName,
        operator: mapBackendOperatorToFrontend(filter.operator),
        value: convertBackendValueToFrontend(filter.operator, filter.value)
      }))
      
      // 设置到字段配置组件中
      if (fieldsConfigRef.value) {
        fieldsConfigRef.value.filterConditions = convertedFilterConditions
      }
      
      console.log('✅ 加载过滤条件:', convertedFilterConditions)
    }
  } catch (error) {
    console.error('加载数据集失败:', error)
    ElMessage.error('加载数据集失败: ' + (error as Error).message)
  }
}

const saveDataset = async () => {
  try {
    saving.value = true
    
    // 确保dataSourceIds有值
    if (!form.dataSourceIds || form.dataSourceIds.length === 0) {
      if (form.dataSourceId) {
        form.dataSourceIds = [form.dataSourceId]
      } else {
        ElMessage.error('请选择数据源')
        return
      }
    }
    
    // 验证dataSourceIds中的ID都是整数
    const invalidIds = form.dataSourceIds.filter(id => !Number.isInteger(id))
    if (invalidIds.length > 0) {
      console.error('❌ 发现无效的数据源ID:', invalidIds)
      ElMessage.error('数据源ID格式错误，请重新选择数据源')
      return
    }
    
    // ✅ 保存前验证并修复字段配置
    if (fieldsConfigRef.value?.validateAndFixFieldConfigs) {
      console.log('🔧 验证并修复字段配置...')
      fieldsConfigRef.value.validateAndFixFieldConfigs()
    }
    
    // ✅ 获取过滤条件并转换操作符格式
    const rawFilterConditions = fieldsConfigRef.value?.filterConditions || []
    console.log('🔍 获取原始过滤条件:', rawFilterConditions)
    
    // 辅助函数：映射操作符到后端格式
    const mapOperatorToBackend = (operator: string): string => {
      const operatorMap: Record<string, string> = {
        'equals': 'eq',
        'not_equals': 'ne',
        'greater_than': 'gt',
        'less_than': 'lt',
        'greater_equal': 'gte',
        'less_equal': 'lte',
        'contains': 'like',
        'not_contains': 'not_like',
        'is_null': 'is_null',
        'is_not_null': 'is_not_null'
      }
      return operatorMap[operator] || operator
    }
    
    // 辅助函数：转换过滤值格式
    const transformFilterValue = (operator: string, value: string): any => {
      // 对于 null 检查操作符，返回 null
      if (operator === 'is_null' || operator === 'is_not_null') {
        return null
      }
      
      // 对于包含操作，转换为 LIKE 格式
      if (operator === 'contains') {
        return `%${value}%`
      }
      
      if (operator === 'not_contains') {
        return `%${value}%`
      }
      
      // 尝试解析为数组（用于 IN 和 BETWEEN 操作符）
      if (value && typeof value === 'string') {
        try {
          // 检查是否是数组格式的字符串
          if (value.startsWith('[') && value.endsWith(']')) {
            return JSON.parse(value)
          }
        } catch (e) {
          // 解析失败，继续使用原值
        }
      }
      
      // 其他情况直接返回原值
      return value
    }
    
    // 转换过滤条件操作符为后端期望的格式
    const transformedFilterConditions = rawFilterConditions.map(filter => ({
      fieldName: filter.fieldName,
      operator: mapOperatorToBackend(filter.operator),
      value: transformFilterValue(filter.operator, filter.value)
    }))
    
    console.log('🔄 转换后的过滤条件:', transformedFilterConditions)
    
    // 验证字段配置的完整性 - 应用正确的配置规则
    const validatedFields = fieldConfigs.value.map((field, index) => {
      const baseConfig = {
        fieldName: field.fieldName,
        tableName: field.tableName,
        displayName: field.displayName || field.fieldName,
        fieldType: field.fieldType || 'dimension',
        isVisible: field.isVisible !== false,
        description: field.description || '',
        sortOrder: field.sortOrder || index
      }
      
      if (field.isCalculated) {
        // ✅ 计算字段的正确配置
        return {
          ...baseConfig,
          isCalculated: true,
          expression: field.expression,
          aggregation: undefined  // 计算字段不设置聚合方式
        }
      } else {
        // ✅ 普通字段的正确配置
        return {
          ...baseConfig,
          isCalculated: false,
          expression: undefined,  // 普通字段不设置表达式
          aggregation: field.fieldType === 'metric' ? (field.aggregation || 'sum') : undefined
        }
      }
    })
    
    const submitData = {
      name: form.name,
      description: form.description,
      dataSourceIds: form.dataSourceIds, // 使用数组格式
      queryType: form.queryType,
      tableName: form.tableName,
      tables: form.tables,
      relations: form.relations,
      sqlQuery: form.sqlQuery,
      fields: validatedFields,
      filterConditions: transformedFilterConditions  // ✅ 添加过滤条件
    }
    
    console.log('📝 提交数据:', submitData)
    console.log('🔍 dataSourceIds:', submitData.dataSourceIds)
    console.log('📊 字段配置详情:', validatedFields.map(f => ({
      fieldName: f.fieldName,
      fieldType: f.fieldType,
      isCalculated: f.isCalculated,
      expression: f.expression,
      aggregation: f.aggregation,
      isVisible: f.isVisible
    })))
    console.log('🔧 过滤条件详情:', transformedFilterConditions)
    
    // ✅ 验证配置正确性
    const calculatedFieldsCount = validatedFields.filter(f => f.isCalculated).length
    const metricFieldsCount = validatedFields.filter(f => f.fieldType === 'metric' && !f.isCalculated).length
    console.log(`✅ 配置验证: 计算字段 ${calculatedFieldsCount} 个, 普通指标字段 ${metricFieldsCount} 个`)
    
    // 检查是否有配置错误的字段
    const errorFields = validatedFields.filter(f => 
      (f.isCalculated && (f.aggregation !== undefined || !f.expression)) ||
      (!f.isCalculated && f.expression !== undefined) ||
      (f.fieldType === 'metric' && !f.isCalculated && !f.aggregation)
    )
    
    if (errorFields.length > 0) {
      console.warn('⚠️ 发现配置错误的字段:', errorFields)
    } else {
      console.log('✅ 所有字段配置正确')
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