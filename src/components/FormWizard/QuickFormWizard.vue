<template>
  <el-dialog
    v-model="visible"
    title="快速表单生成向导"
    width="800px"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    @close="handleClose"
  >
    <el-steps :active="currentStep" align-center class="wizard-steps">
      <el-step title="基本信息" icon="el-icon-edit" />
      <el-step title="字段模板" icon="el-icon-menu" />
      <el-step title="页面配置" icon="el-icon-setting" />
    </el-steps>

    <div class="wizard-content">
      <!-- 步骤一：基本信息 -->
      <div v-show="currentStep === 0" class="step-content">
        <el-form :model="formConfig.basic" :rules="basicRules" ref="basicFormRef" label-width="120px">
          <el-form-item label="表单名称" prop="name" required>
            <el-input
              v-model="formConfig.basic.name"
              placeholder="请输入表单名称，如：用户注册表"
              maxlength="50"
              show-word-limit
            />
          </el-form-item>
          
          <el-form-item label="表单说明" prop="description">
            <el-input
              v-model="formConfig.basic.description"
              type="textarea"
              :rows="3"
              placeholder="请输入表单说明（可选）"
              maxlength="200"
              show-word-limit
            />
          </el-form-item>
          
          <el-form-item label="数据源" prop="dataSource" required>
            <el-select
              v-model="formConfig.basic.dataSource"
              placeholder="请选择数据源"
              style="width: 100%"
              @change="handleDataSourceChange"
              :loading="dataSourceLoading"
            >
              <el-option
                v-for="item in dataSources"
                :key="item.id"
                :label="item.name"
                :value="item.id"
              />
            </el-select>
          </el-form-item>
          
          <el-form-item label="选择数据表" prop="existingTable">
            <el-select
              v-model="formConfig.basic.existingTable"
              placeholder="选择已有表（可选，不选择将自动生成新表）"
              style="width: 100%"
              clearable
              :loading="tableListLoading"
              :disabled="!formConfig.basic.dataSource"
            >
              <el-option
                v-for="item in tableList"
                :key="item.name"
                :label="`${item.name} (${item.comment || '无说明'})`"
                :value="item.name"
              />
            </el-select>
          </el-form-item>
        </el-form>
      </div>

      <!-- 步骤二：字段模板 -->
      <div v-show="currentStep === 1" class="step-content">
        <div class="template-selection">
          <h4>选择字段模板</h4>
          <el-row :gutter="20">
            <el-col :span="8" v-for="template in fieldTemplates" :key="template.id">
              <el-card
                :class="['template-card', { active: formConfig.template.selectedTemplate === template.id }]"
                @click="selectTemplate(template)"
                shadow="hover"
              >
                <div class="template-header">
                  <el-icon><component :is="template.icon" /></el-icon>
                  <span class="template-name">{{ template.name }}</span>
                </div>
                <div class="template-description">{{ template.description }}</div>
                <div class="template-fields">
                  <el-tag
                    v-for="field in template.fields.slice(0, 3)"
                    :key="field.name"
                    size="small"
                    type="info"
                  >
                    {{ field.label }}
                  </el-tag>
                  <span v-if="template.fields.length > 3" class="more-fields">
                    +{{ template.fields.length - 3 }}个字段
                  </span>
                </div>
              </el-card>
            </el-col>
          </el-row>
        </div>

        <div v-if="formConfig.template.selectedTemplate" class="field-preview">
          <h4>字段预览 <small>（可在后续步骤中修改）</small></h4>
          <el-table :data="selectedTemplateFields" border size="small">
            <el-table-column prop="label" label="字段名称" width="120" />
            <el-table-column prop="name" label="字段标识" width="120" />
            <el-table-column prop="type" label="字段类型" width="100" />
            <el-table-column prop="required" label="必填" width="80">
              <template #default="{ row }">
                <el-tag :type="row.required ? 'danger' : 'info'" size="small">
                  {{ row.required ? '是' : '否' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="placeholder" label="提示信息" />
          </el-table>
        </div>
      </div>

      <!-- 步骤三：页面配置 -->
      <div v-show="currentStep === 2" class="step-content">
        <el-form :model="formConfig.page" :rules="pageRules" ref="pageFormRef" label-width="140px">
          <el-form-item label="自动生成菜单">
            <el-switch v-model="formConfig.page.autoGenerateMenu" />
            <div class="form-tip">开启后将自动在系统菜单中创建对应的菜单项</div>
          </el-form-item>
          
          <el-form-item
            v-if="formConfig.page.autoGenerateMenu"
            label="菜单挂载位置"
            prop="parentMenu"
            required
          >
            <div class="menu-selector">
              <div class="menu-cards">
                <div
                  v-for="menu in topLevelMenus"
                  :key="menu.id"
                  class="menu-card"
                  :class="{ active: formConfig.page.parentMenu === menu.id }"
                  @click="selectParentMenu(menu)"
                >
                  <div class="menu-card-header">
                    <el-icon><component :is="getMenuIcon(menu.icon)" /></el-icon>
                    <span class="menu-name">{{ menu.name }}</span>
                  </div>
                  <div class="menu-card-desc">
                    {{ getMenuDescription(menu.id) }}
                  </div>
                  <div class="menu-card-check">
                    <el-icon v-if="formConfig.page.parentMenu === menu.id"><Check /></el-icon>
                  </div>
                </div>
              </div>
            </div>
            <div class="form-tip">新创建的菜单将作为子菜单添加到选中的菜单下</div>
          </el-form-item>
          
          <el-form-item label="路由路径" prop="routePath" required>
            <el-input
              v-model="formConfig.page.routePath"
              placeholder="页面访问路径"
              :prefix-icon="Link"
            >
              <template #prepend>/</template>
            </el-input>
            <div class="form-tip">建议使用英文和下划线，如：user_register</div>
          </el-form-item>
          
          <el-form-item label="页面标题" prop="pageTitle">
            <el-input
              v-model="formConfig.page.pageTitle"
              placeholder="页面显示标题（默认使用表单名称）"
            />
          </el-form-item>
        </el-form>
      </div>
    </div>

    <template #footer>
      <div class="wizard-footer">
        <el-button v-if="currentStep > 0" @click="prevStep">上一步</el-button>
        <el-button v-if="currentStep < 2" type="primary" @click="nextStep">下一步</el-button>
        <el-button v-if="currentStep === 2" type="primary" @click="finish" :loading="finishing">
          完成创建
        </el-button>
        <el-button @click="handleClose">取消</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { User, ShoppingBag, Document, Link, Check } from '@element-plus/icons-vue'
import type { FormInstance, FormRules } from 'element-plus'

// 接口类型定义
interface DataSource {
  id: string
  name: string
  type: string
}

interface TableInfo {
  name: string
  comment?: string
}

interface MenuItem {
  id: number
  name: string
  path: string
  parent_id: number | null
  icon: string
  sort_order: number
}

interface FieldTemplate {
  id: string
  name: string
  description: string
  icon: any
  fields: Array<{
    name: string
    label: string
    type: string
    required: boolean
    placeholder?: string
    options?: string[]
  }>
}

interface FormConfig {
  basic: {
    name: string
    description: string
    dataSource: string
    existingTable: string
  }
  template: {
    selectedTemplate: string
    fields: any[]
  }
  page: {
    autoGenerateMenu: boolean
    parentMenu: string
    routePath: string
    pageTitle: string
  }
  generatedPage?: any
}

// Props & Emits
interface Props {
  modelValue: boolean
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'done', config: FormConfig): void
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

// 表单引用
const basicFormRef = ref<FormInstance>()
const pageFormRef = ref<FormInstance>()

// 表单配置数据
const formConfig = reactive<FormConfig>({
  basic: {
    name: '',
    description: '',
    dataSource: '',
    existingTable: ''
  },
  template: {
    selectedTemplate: '',
    fields: []
  },
  page: {
    autoGenerateMenu: true,
    parentMenu: '',
    routePath: '',
    pageTitle: ''
  }
})

// 数据源相关
const dataSources = ref<DataSource[]>([])
const dataSourceLoading = ref(false)
const tableList = ref<TableInfo[]>([])
const tableListLoading = ref(false)
const menuList = ref<MenuItem[]>([])
const menuListLoading = ref(false)

// 字段模板数据
const fieldTemplates = ref<FieldTemplate[]>([
  {
    id: 'personal',
    name: '个人信息模板',
    description: '适用于用户注册、个人资料等场景',
    icon: User,
    fields: [
      { name: 'name', label: '姓名', type: 'input', required: true, placeholder: '请输入姓名' },
      { name: 'gender', label: '性别', type: 'select', required: false, options: ['男', '女'] },
      { name: 'birthday', label: '出生日期', type: 'date', required: false },
      { name: 'phone', label: '手机号', type: 'input', required: true, placeholder: '请输入手机号' },
      { name: 'email', label: '邮箱', type: 'input', required: false, placeholder: '请输入邮箱地址' }
    ]
  },
  {
    id: 'product',
    name: '商品信息模板',
    description: '适用于商品管理、库存管理等场景',
    icon: ShoppingBag,
    fields: [
      { name: 'product_name', label: '商品名称', type: 'input', required: true, placeholder: '请输入商品名称' },
      { name: 'price', label: '价格', type: 'number', required: true, placeholder: '请输入价格' },
      { name: 'stock', label: '库存数量', type: 'number', required: true, placeholder: '请输入库存数量' },
      { name: 'category', label: '商品分类', type: 'select', required: true },
      { name: 'description', label: '商品描述', type: 'textarea', required: false, placeholder: '请输入商品描述' }
    ]
  },
  {
    id: 'empty',
    name: '空模板',
    description: '从零开始手动创建字段',
    icon: Document,
    fields: []
  }
])

// 表单验证规则
const basicRules: FormRules = {
  name: [
    { required: true, message: '请输入表单名称', trigger: 'blur' },
    { min: 2, max: 50, message: '表单名称长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  dataSource: [
    { required: true, message: '请选择数据源', trigger: 'change' }
  ]
}

const pageRules: FormRules = {
  parentMenu: [
    { required: true, message: '请选择菜单挂载位置', trigger: 'change' }
  ],
  routePath: [
    { required: true, message: '请输入路由路径', trigger: 'blur' },
    { pattern: /^[a-zA-Z0-9_-]+$/, message: '路由路径只能包含字母、数字、下划线和横线', trigger: 'blur' }
  ]
}

// 计算属性
const selectedTemplateFields = computed(() => {
  const template = fieldTemplates.value.find(t => t.id === formConfig.template.selectedTemplate)
  return template?.fields || []
})

// 构建菜单树形数据
const menuTreeData = computed(() => {
  const buildTree = (parentId: number | null = null): any[] => {
    return menuList.value
      .filter(menu => menu.parent_id === parentId)
      .map(menu => ({
        id: menu.id,
        name: menu.name,
        path: menu.path,
        icon: menu.icon,
        children: buildTree(menu.id)
      }))
  }
  return buildTree()
})

// 获取顶级菜单
const topLevelMenus = computed(() => {
  return menuList.value
    .filter(menu => menu.parent_id === null)
    .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
})

// 图标映射
const iconMap: Record<string, any> = {
  'Setting': 'Setting',
  'Management': 'Management', 
  'DataBoard': 'DataBoard',
  'Document': Document,
  'User': User,
  'UserFilled': 'UserFilled',
  'Lock': 'Lock',
  'Connection': 'Connection',
  'Edit': 'Edit',
  'Database': 'Database',
  'Grid': 'Grid'
}

// 获取菜单图标
const getMenuIcon = (iconName: string) => {
  return iconMap[iconName] || Document
}

// 获取菜单描述
const getMenuDescription = (menuId: number) => {
  const descriptions: Record<number, string> = {
    1: '用户、角色、权限等系统基础功能管理',
    2: '业务流程、表单等核心业务功能管理', 
    3: '数据源、数据表等数据相关功能管理',
    4: '各类报表和统计分析功能管理'
  }
  return descriptions[menuId] || '功能模块管理'
}

// 选择父菜单
const selectParentMenu = (menu: MenuItem) => {
  formConfig.page.parentMenu = menu.id.toString()
}

// 监听表单名称变化，自动生成路由路径
watch(() => formConfig.basic.name, (newName) => {
  if (newName && !formConfig.page.routePath) {
    // 将中文转为拼音或英文，这里简化处理
    const routePath = newName
      .toLowerCase()
      .replace(/\s+/g, '_')
      .replace(/[^\w_-]/g, '')
    formConfig.page.routePath = `auto_page_${routePath}`
  }
  
  if (newName && !formConfig.page.pageTitle) {
    formConfig.page.pageTitle = newName
  }
})

// 方法
const loadDataSources = async () => {
  dataSourceLoading.value = true
  try {
    const response = await fetch('http://localhost:4000/api/data-sources')
    const result = await response.json()
    
    if (result.code === 200) {
      dataSources.value = result.data
    } else {
      throw new Error(result.message || '获取数据源失败')
    }
  } catch (error) {
    console.error('加载数据源失败:', error)
    ElMessage.error('加载数据源失败: ' + error.message)
  } finally {
    dataSourceLoading.value = false
  }
}

const handleDataSourceChange = async (dataSourceId: string) => {
  if (!dataSourceId) return
  
  tableListLoading.value = true
  try {
    const response = await fetch(`http://localhost:4000/api/table-list?db=${dataSourceId}`)
    const result = await response.json()
    
    if (result.code === 200) {
      tableList.value = result.data
    } else {
      throw new Error(result.message || '获取数据表失败')
    }
  } catch (error) {
    console.error('加载数据表失败:', error)
    ElMessage.error('加载数据表失败: ' + error.message)
  } finally {
    tableListLoading.value = false
  }
}

const loadMenuList = async () => {
  menuListLoading.value = true
  try {
    const response = await fetch('http://localhost:4000/api/menu-list')
    const result = await response.json()
    
    if (result.code === 200) {
      menuList.value = result.data
    } else {
      throw new Error(result.message || '获取菜单列表失败')
    }
  } catch (error) {
    console.error('加载菜单列表失败:', error)
    ElMessage.error('加载菜单列表失败: ' + error.message)
  } finally {
    menuListLoading.value = false
  }
}

const selectTemplate = (template: FieldTemplate) => {
  formConfig.template.selectedTemplate = template.id
  formConfig.template.fields = [...template.fields]
}

const nextStep = async () => {
  if (currentStep.value === 0) {
    // 验证第一步表单
    const valid = await basicFormRef.value?.validate().catch(() => false)
    if (!valid) return
  }
  
  if (currentStep.value === 1) {
    // 验证是否选择了模板
    if (!formConfig.template.selectedTemplate) {
      ElMessage.warning('请选择一个字段模板')
      return
    }
    // 加载菜单列表
    await loadMenuList()
  }
  
  currentStep.value++
}

const prevStep = () => {
  currentStep.value--
}

const finish = async () => {
  // 验证第三步表单
  const valid = await pageFormRef.value?.validate().catch(() => false)
  if (!valid) return
  
  finishing.value = true
  try {
    // 调用后端API保存表单配置并生成页面
    const response = await fetch('http://localhost:4000/api/form-configs/create-with-page', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        formConfig: { ...formConfig }
      })
    })
    
    const result = await response.json()
    
    if (result.code === 200) {
      ElMessage.success('表单和页面创建成功！')
      
      // 传递创建结果给父组件
      emit('done', {
        ...formConfig,
        generatedPage: result.data
      })
      
      handleClose()
    } else {
      throw new Error(result.message || '创建失败')
    }
  } catch (error) {
    console.error('创建表单失败:', error)
    ElMessage.error('创建表单失败: ' + error.message)
  } finally {
    finishing.value = false
  }
}

const handleClose = () => {
  visible.value = false
  // 重置表单
  currentStep.value = 0
  Object.assign(formConfig, {
    basic: { name: '', description: '', dataSource: '', existingTable: '' },
    template: { selectedTemplate: '', fields: [] },
    page: { autoGenerateMenu: true, parentMenu: '', routePath: '', pageTitle: '' }
  })
}

// 生命周期
onMounted(() => {
  loadDataSources()
})
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

.template-selection {
  h4 {
    margin-bottom: 20px;
    color: #303133;
  }
}

.template-card {
  cursor: pointer;
  transition: all 0.3s;
  margin-bottom: 20px;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
  
  &.active {
    border-color: #409eff;
    box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2);
  }
  
  .template-header {
    display: flex;
    align-items: center;
    margin-bottom: 10px;
    
    .el-icon {
      font-size: 20px;
      margin-right: 8px;
      color: #409eff;
    }
    
    .template-name {
      font-weight: 600;
      color: #303133;
    }
  }
  
  .template-description {
    font-size: 13px;
    color: #606266;
    margin-bottom: 15px;
    line-height: 1.4;
  }
  
  .template-fields {
    .el-tag {
      margin-right: 5px;
      margin-bottom: 5px;
    }
    
    .more-fields {
      font-size: 12px;
      color: #909399;
    }
  }
}

.field-preview {
  margin-top: 30px;
  
  h4 {
    margin-bottom: 15px;
    color: #303133;
    
    small {
      font-weight: normal;
      color: #909399;
    }
  }
}

.wizard-footer {
  text-align: right;
  
  .el-button {
    margin-left: 10px;
  }
}

.menu-selector {
  margin-bottom: 20px;
}

.menu-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
}

.menu-card {
  position: relative;
  cursor: pointer;
  transition: all 0.3s;
  padding: 16px;
  border: 2px solid #e4e7ed;
  border-radius: 8px;
  background: white;
  min-height: 100px;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    border-color: #c6d1f0;
  }
  
  &.active {
    border-color: #409eff;
    background: #f0f9ff;
    box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2);
  }
  
  .menu-card-header {
    display: flex;
    align-items: center;
    margin-bottom: 8px;
    
    .el-icon {
      font-size: 24px;
      margin-right: 10px;
      color: #409eff;
    }
    
    .menu-name {
      font-weight: 600;
      font-size: 16px;
      color: #303133;
    }
  }
  
  .menu-card-desc {
    font-size: 12px;
    color: #909399;
    line-height: 1.4;
    margin-bottom: 8px;
  }
  
  .menu-card-check {
    position: absolute;
    top: 12px;
    right: 12px;
    
    .el-icon {
      font-size: 18px;
      color: #67c23a;
    }
  }
}
</style> 