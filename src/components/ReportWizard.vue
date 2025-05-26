<template>
  <el-dialog
    v-model="visible"
    title="报表创建向导"
    width="900px"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    @close="handleClose"
  >
    <el-steps :active="currentStep" align-center class="wizard-steps">
      <el-step title="基本信息" icon="el-icon-edit" />
      <el-step title="选择数据源" icon="el-icon-database" />
      <el-step title="字段映射" icon="el-icon-menu" />
      <el-step title="报表设计" icon="el-icon-setting" />
    </el-steps>

    <div class="wizard-content">
      <!-- 步骤一：基本信息 -->
      <div v-show="currentStep === 0" class="step-content">
        <el-form :model="reportConfig.basic" :rules="basicRules" ref="basicFormRef" label-width="120px">
          <el-form-item label="报表名称" prop="name" required>
            <el-input
              v-model="reportConfig.basic.name"
              placeholder="请输入报表名称，如：销售统计报表"
              maxlength="50"
              show-word-limit
            />
          </el-form-item>
          
          <el-form-item label="报表说明" prop="description">
            <el-input
              v-model="reportConfig.basic.description"
              type="textarea"
              :rows="3"
              placeholder="请输入报表说明（可选）"
              maxlength="200"
              show-word-limit
            />
          </el-form-item>
          
          <el-form-item label="报表分类" prop="category">
            <el-select
              v-model="reportConfig.basic.category"
              placeholder="请选择报表分类"
              style="width: 100%"
            >
              <el-option label="销售报表" value="sales" />
              <el-option label="财务报表" value="finance" />
              <el-option label="运营报表" value="operation" />
              <el-option label="统计报表" value="statistics" />
              <el-option label="其他" value="other" />
            </el-select>
          </el-form-item>
          
          <el-form-item label="报表模板">
            <el-radio-group v-model="reportConfig.basic.template">
              <el-radio value="blank">空白报表</el-radio>
              <el-radio value="table">表格报表</el-radio>
              <el-radio value="chart">图表报表</el-radio>
              <el-radio value="mixed">混合报表</el-radio>
            </el-radio-group>
          </el-form-item>
        </el-form>
      </div>

      <!-- 步骤二：选择数据源 -->
      <div v-show="currentStep === 1" class="step-content">
        <el-form :model="reportConfig.dataSource" :rules="dataSourceRules" ref="dataSourceFormRef" label-width="120px">
          <el-form-item label="数据源类型" prop="type" required>
            <el-select
              v-model="reportConfig.dataSource.type"
              placeholder="请选择数据源类型"
              style="width: 100%"
              @change="handleDataSourceTypeChange"
            >
              <el-option label="API接口" value="api" />
              <el-option label="数据库表" value="table" />
              <el-option label="SQL查询" value="sql" />
              <el-option label="静态数据" value="static" />
            </el-select>
          </el-form-item>
          
          <el-form-item 
            v-if="reportConfig.dataSource.type === 'api'" 
            label="API地址" 
            prop="apiUrl" 
            required
          >
            <el-input 
              v-model="reportConfig.dataSource.apiUrl" 
              placeholder="请输入API地址，如：http://localhost:4000/api/data"
            />
            <div class="form-tip">支持GET请求，返回JSON格式数据</div>
          </el-form-item>
          
          <el-form-item 
            v-if="reportConfig.dataSource.type === 'table'" 
            label="数据表" 
            prop="tableName" 
            required
          >
            <el-select
              v-model="reportConfig.dataSource.tableName"
              placeholder="请选择数据表"
              style="width: 100%"
              :loading="tableListLoading"
              @change="handleTableChange"
            >
              <el-option 
                v-for="table in tableList" 
                :key="table.name" 
                :label="`${table.name} (${table.comment || '无说明'})`" 
                :value="table.name" 
              />
            </el-select>
          </el-form-item>
          
          <el-form-item 
            v-if="reportConfig.dataSource.type === 'sql'" 
            label="SQL查询" 
            prop="sqlQuery" 
            required
          >
            <el-input 
              v-model="reportConfig.dataSource.sqlQuery" 
              type="textarea" 
              :rows="6" 
              placeholder="请输入SQL查询语句"
            />
            <div class="form-tip">请确保SQL语句的安全性，避免注入攻击</div>
          </el-form-item>
          
          <el-form-item 
            v-if="reportConfig.dataSource.type === 'static'" 
            label="静态数据" 
            prop="staticData" 
            required
          >
            <el-input 
              v-model="reportConfig.dataSource.staticData" 
              type="textarea" 
              :rows="8" 
              placeholder="请输入JSON格式的静态数据"
            />
            <div class="form-tip">数据格式：[{&quot;字段1&quot;: &quot;值1&quot;, &quot;字段2&quot;: &quot;值2&quot;}]</div>
          </el-form-item>
          
          <!-- 数据预览 -->
          <el-form-item v-if="previewData.length > 0" label="数据预览">
            <el-table :data="previewData.slice(0, 5)" border size="small" max-height="200">
              <el-table-column 
                v-for="(value, key) in previewData[0]" 
                :key="key" 
                :prop="key" 
                :label="key" 
                show-overflow-tooltip
              />
            </el-table>
            <div class="preview-info">
              <el-tag type="info" size="small">共 {{ previewData.length }} 条数据</el-tag>
              <el-button size="small" @click="refreshPreview">刷新预览</el-button>
            </div>
          </el-form-item>
        </el-form>
      </div>

      <!-- 步骤三：字段映射 -->
      <div v-show="currentStep === 2" class="step-content">
        <div class="field-mapping">
          <h4>选择要在报表中显示的字段</h4>
          <div class="field-list">
            <el-checkbox-group v-model="reportConfig.fields.selected">
              <div 
                v-for="field in availableFields" 
                :key="field.name" 
                class="field-item"
              >
                <el-checkbox :value="field.name">
                  <div class="field-info">
                    <span class="field-name">{{ field.name }}</span>
                    <span class="field-type">{{ field.type }}</span>
                  </div>
                </el-checkbox>
                <el-input 
                  v-if="reportConfig.fields.selected.includes(field.name)"
                  v-model="field.alias" 
                  placeholder="字段别名" 
                  size="small" 
                  style="width: 120px; margin-left: 10px;"
                />
              </div>
            </el-checkbox-group>
          </div>
          
          <div v-if="reportConfig.fields.selected.length > 0" class="field-preview">
            <h4>字段预览</h4>
            <el-table :data="[{}]" border size="small">
              <el-table-column 
                v-for="fieldName in reportConfig.fields.selected" 
                :key="fieldName" 
                :label="getFieldAlias(fieldName)" 
                :prop="fieldName"
                width="120"
              >
                <template #default>
                  <span class="preview-cell">示例数据</span>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </div>
      </div>

      <!-- 步骤四：报表设计 -->
      <div v-show="currentStep === 3" class="step-content">
        <div class="design-preview">
          <el-alert
            title="即将进入报表设计器"
            description="点击完成后将跳转到报表设计器，您可以进行详细的报表布局和样式设计"
            type="success"
            show-icon
            :closable="false"
          />
          
          <div class="config-summary">
            <h4>配置摘要</h4>
            <el-descriptions :column="2" border>
              <el-descriptions-item label="报表名称">{{ reportConfig.basic.name }}</el-descriptions-item>
              <el-descriptions-item label="报表分类">{{ getCategoryText(reportConfig.basic.category) }}</el-descriptions-item>
              <el-descriptions-item label="数据源类型">{{ getDataSourceTypeText(reportConfig.dataSource.type) }}</el-descriptions-item>
              <el-descriptions-item label="选择字段">{{ reportConfig.fields.selected.length }} 个字段</el-descriptions-item>
            </el-descriptions>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="wizard-footer">
        <el-button v-if="currentStep > 0" @click="prevStep">上一步</el-button>
        <el-button v-if="currentStep < 3" type="primary" @click="nextStep">下一步</el-button>
        <el-button v-if="currentStep === 3" type="primary" @click="finish" :loading="finishing">
          完成创建
        </el-button>
        <el-button @click="handleClose">取消</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'

// Props & Emits
interface Props {
  modelValue: boolean
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'done', config: any): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 响应式数据
const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const currentStep = ref(0)
const finishing = ref(false)
const tableListLoading = ref(false)
const previewData = ref([])

// 表单引用
const basicFormRef = ref<FormInstance>()
const dataSourceFormRef = ref<FormInstance>()

// 数据
const tableList = ref([])
const availableFields = ref([])

// 报表配置数据
const reportConfig = reactive({
  basic: {
    name: '',
    description: '',
    category: '',
    template: 'table'
  },
  dataSource: {
    type: '',
    apiUrl: '',
    tableName: '',
    sqlQuery: '',
    staticData: ''
  },
  fields: {
    selected: [],
    mapping: {}
  }
})

// 表单验证规则
const basicRules: FormRules = {
  name: [
    { required: true, message: '请输入报表名称', trigger: 'blur' },
    { min: 2, max: 50, message: '报表名称长度在 2 到 50 个字符', trigger: 'blur' }
  ]
}

const dataSourceRules: FormRules = {
  type: [
    { required: true, message: '请选择数据源类型', trigger: 'change' }
  ],
  apiUrl: [
    { required: true, message: '请输入API地址', trigger: 'blur' }
  ],
  tableName: [
    { required: true, message: '请选择数据表', trigger: 'change' }
  ],
  sqlQuery: [
    { required: true, message: '请输入SQL查询语句', trigger: 'blur' }
  ],
  staticData: [
    { required: true, message: '请输入静态数据', trigger: 'blur' }
  ]
}

// 方法
const handleDataSourceTypeChange = async () => {
  // 清空之前的配置
  reportConfig.dataSource.apiUrl = ''
  reportConfig.dataSource.tableName = ''
  reportConfig.dataSource.sqlQuery = ''
  reportConfig.dataSource.staticData = ''
  previewData.value = []
  availableFields.value = []
  
  // 如果选择数据表，加载表列表
  if (reportConfig.dataSource.type === 'table') {
    await loadTableList()
  }
}

const loadTableList = async () => {
  tableListLoading.value = true
  try {
    const response = await fetch('http://localhost:4000/api/table-list?db=1')
    const result = await response.json()
    
    if (result.code === 200) {
      tableList.value = result.data
    }
  } catch (error) {
    ElMessage.error('加载数据表失败: ' + error.message)
  } finally {
    tableListLoading.value = false
  }
}

const handleTableChange = async () => {
  if (reportConfig.dataSource.tableName) {
    await loadTableFields()
    await refreshPreview()
  }
}

const loadTableFields = async () => {
  try {
    const response = await fetch(`http://localhost:4000/api/table-structure/${reportConfig.dataSource.tableName}`)
    const result = await response.json()
    
    if (result.code === 200) {
      availableFields.value = result.data.map(field => ({
        name: field.name,
        type: field.type,
        alias: field.name
      }))
    }
  } catch (error) {
    console.error('加载表字段失败:', error)
  }
}

const refreshPreview = async () => {
  try {
    let data = []
    
    if (reportConfig.dataSource.type === 'api' && reportConfig.dataSource.apiUrl) {
      const response = await fetch(reportConfig.dataSource.apiUrl)
      data = await response.json()
    } else if (reportConfig.dataSource.type === 'table' && reportConfig.dataSource.tableName) {
      const response = await fetch(`http://localhost:4000/api/table-data/${reportConfig.dataSource.tableName}?limit=10`)
      const result = await response.json()
      data = result.data || []
    } else if (reportConfig.dataSource.type === 'static' && reportConfig.dataSource.staticData) {
      data = JSON.parse(reportConfig.dataSource.staticData)
    }
    
    if (Array.isArray(data) && data.length > 0) {
      previewData.value = data
      
      // 自动推断字段
      if (availableFields.value.length === 0) {
        const firstRow = data[0]
        availableFields.value = Object.keys(firstRow).map(key => ({
          name: key,
          type: typeof firstRow[key],
          alias: key
        }))
      }
    }
  } catch (error) {
    ElMessage.error('数据预览失败: ' + error.message)
  }
}

const getFieldAlias = (fieldName: string) => {
  const field = availableFields.value.find(f => f.name === fieldName)
  return field?.alias || fieldName
}

const getCategoryText = (category: string) => {
  const categoryMap = {
    sales: '销售报表',
    finance: '财务报表',
    operation: '运营报表',
    statistics: '统计报表',
    other: '其他'
  }
  return categoryMap[category] || category
}

const getDataSourceTypeText = (type: string) => {
  const typeMap = {
    api: 'API接口',
    table: '数据库表',
    sql: 'SQL查询',
    static: '静态数据'
  }
  return typeMap[type] || type
}

const nextStep = async () => {
  if (currentStep.value === 0) {
    // 验证第一步表单
    const valid = await basicFormRef.value?.validate().catch(() => false)
    if (!valid) return
  }
  
  if (currentStep.value === 1) {
    // 验证第二步表单
    const valid = await dataSourceFormRef.value?.validate().catch(() => false)
    if (!valid) return
    
    // 刷新数据预览
    await refreshPreview()
  }
  
  if (currentStep.value === 2) {
    // 验证是否选择了字段
    if (reportConfig.fields.selected.length === 0) {
      ElMessage.warning('请至少选择一个字段')
      return
    }
  }
  
  currentStep.value++
}

const prevStep = () => {
  currentStep.value--
}

const finish = async () => {
  finishing.value = true
  try {
    // 构建字段映射
    const fieldMapping = {}
    availableFields.value.forEach(field => {
      if (reportConfig.fields.selected.includes(field.name)) {
        fieldMapping[field.name] = field.alias
      }
    })
    reportConfig.fields.mapping = fieldMapping
    
    // 调用后端API保存报表配置
    const response = await fetch('http://localhost:4000/api/reports', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: reportConfig.basic.name,
        description: reportConfig.basic.description,
        category: reportConfig.basic.category,
        config: {
          template: reportConfig.basic.template,
          dataSource: reportConfig.dataSource,
          fields: reportConfig.fields,
          tableConfig: {
            rowCount: 20,
            colCount: reportConfig.fields.selected.length,
            height: 600
          }
        },
        status: 'draft'
      })
    })
    
    const result = await response.json()
    
    if (result.code === 200) {
      ElMessage.success('报表创建成功！正在跳转到设计器...')
      
      // 传递创建结果给父组件
      emit('done', {
        ...reportConfig,
        reportId: result.data.id
      })
      
      handleClose()
    } else {
      throw new Error(result.message || '创建失败')
    }
  } catch (error) {
    console.error('创建报表失败:', error)
    ElMessage.error('创建报表失败: ' + error.message)
  } finally {
    finishing.value = false
  }
}

const handleClose = () => {
  visible.value = false
  // 重置表单
  currentStep.value = 0
  Object.assign(reportConfig, {
    basic: { name: '', description: '', category: '', template: 'table' },
    dataSource: { type: '', apiUrl: '', tableName: '', sqlQuery: '', staticData: '' },
    fields: { selected: [], mapping: {} }
  })
  previewData.value = []
  availableFields.value = []
}
</script>

<style scoped lang="scss">
.wizard-steps {
  margin-bottom: 30px;
}

.wizard-content {
  min-height: 400px;
  padding: 20px 0;
}

.step-content {
  .form-tip {
    font-size: 12px;
    color: #909399;
    margin-top: 5px;
  }
}

.field-mapping {
  h4 {
    margin-bottom: 20px;
    color: #303133;
  }
}

.field-list {
  max-height: 300px;
  overflow-y: auto;
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  padding: 16px;
  background: #fafafa;
}

.field-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;
  
  &:last-child {
    border-bottom: none;
  }
  
  .field-info {
    display: flex;
    flex-direction: column;
    
    .field-name {
      font-weight: 500;
      color: #303133;
    }
    
    .field-type {
      font-size: 12px;
      color: #909399;
    }
  }
}

.field-preview {
  margin-top: 20px;
  
  h4 {
    margin-bottom: 15px;
    color: #303133;
  }
  
  .preview-cell {
    color: #909399;
    font-style: italic;
  }
}

.preview-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 10px;
  padding: 8px;
  background: #f8f9fa;
  border-radius: 4px;
}

.design-preview {
  text-align: center;
  
  .config-summary {
    margin-top: 30px;
    text-align: left;
    
    h4 {
      margin-bottom: 15px;
      color: #303133;
    }
  }
}

.wizard-footer {
  text-align: right;
  
  .el-button {
    margin-left: 10px;
  }
}
</style> 