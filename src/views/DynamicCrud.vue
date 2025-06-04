<template>
  <div class="dynamic-crud">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <h1>{{ pageTitle }}</h1>
        <p>{{ pageDescription }}</p>
      </div>
      <div class="header-right">
        <el-button type="primary" @click="showCreateDialog = true" :icon="Plus">
          新增{{ entityName }}
        </el-button>
        <el-button @click="refreshData" :icon="Refresh">
          刷新
        </el-button>
      </div>
    </div>

    <!-- 搜索区域 -->
    <el-card class="search-card" v-if="searchFields.length > 0">
      <el-form :model="searchForm" :inline="true" @submit.prevent="handleSearch">
        <el-form-item
          v-for="field in searchFields"
          :key="field.name"
          :label="field.label"
        >
          <component
            :is="getSearchComponent(field.type)"
            v-model="searchForm[field.name]"
            :placeholder="`请输入${field.label}`"
            style="width: 200px"
            clearable
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch" :icon="Search">
            搜索
          </el-button>
          <el-button @click="resetSearch" :icon="RefreshRight">
            重置
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 数据表格 -->
    <el-card class="table-card">
      <el-table
        :data="tableData"
        v-loading="tableLoading"
        border
        stripe
        @sort-change="handleSortChange"
      >
        <el-table-column
          v-for="field in tableFields"
          :key="field.name"
          :prop="field.name"
          :label="field.label"
          :width="field.width"
          :sortable="field.sortable ? 'custom' : false"
          show-overflow-tooltip
        >
          <template #default="{ row }">
            <span v-if="field.type === 'switch'">
              <el-tag :type="row[field.name] ? 'success' : 'info'">
                {{ row[field.name] ? '是' : '否' }}
              </el-tag>
            </span>
            <span v-else-if="field.type === 'date'">
              {{ formatDate(row[field.name]) }}
            </span>
            <span v-else>{{ row[field.name] }}</span>
          </template>
        </el-table-column>
        
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row, $index }">
            <el-button size="small" type="primary" @click="editItem(row)">
              编辑
            </el-button>
            <el-button size="small" type="info" @click="viewItem(row)">
              查看
            </el-button>
            <el-button size="small" type="danger" @click="deleteItem(row, $index)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="pagination.current"
          v-model:page-size="pagination.size"
          :total="pagination.total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="loadData"
          @current-change="loadData"
        />
      </div>
    </el-card>

    <!-- 新增/编辑对话框 -->
    <el-dialog
      v-model="showCreateDialog"
      :title="editingItem ? `编辑${entityName}` : `新增${entityName}`"
      width="600px"
      @close="resetForm"
    >
      <el-form
        :model="formData"
        :rules="formRules"
        ref="formRef"
        label-width="120px"
      >
        <el-form-item
          v-for="field in formFields"
          :key="field.name"
          :label="field.label"
          :prop="field.name"
        >
          <component
            :is="getFormComponent(field.type)"
            v-model="formData[field.name]"
            v-bind="getFieldProps(field)"
            style="width: 100%"
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button type="primary" @click="saveItem" :loading="saving">
          {{ editingItem ? '更新' : '创建' }}
        </el-button>
      </template>
    </el-dialog>

    <!-- 查看详情对话框 -->
    <el-dialog
      v-model="showViewDialog"
      :title="`${entityName}详情`"
      width="600px"
    >
      <el-descriptions :column="2" border>
        <el-descriptions-item
          v-for="field in formFields"
          :key="field.name"
          :label="field.label"
        >
          <span v-if="field.type === 'switch'">
            <el-tag :type="viewData[field.name] ? 'success' : 'info'">
              {{ viewData[field.name] ? '是' : '否' }}
            </el-tag>
          </span>
          <span v-else-if="field.type === 'date'">
            {{ formatDate(viewData[field.name]) }}
          </span>
          <span v-else>{{ viewData[field.name] || '-' }}</span>
        </el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Refresh, Search, RefreshRight } from '@element-plus/icons-vue'
import type { FormInstance, FormRules } from 'element-plus'

const route = useRoute()

// 响应式数据
const tableLoading = ref(false)
const saving = ref(false)
const showCreateDialog = ref(false)
const showViewDialog = ref(false)
const editingItem = ref(null)
const formRef = ref<FormInstance>()

// 表单配置数据
const formConfig = ref(null)
const tableData = ref([])
const formData = reactive({})
const searchForm = reactive({})
const viewData = ref({})

// 分页数据
const pagination = reactive({
  current: 1,
  size: 10,
  total: 0
})

// 计算属性
const pageTitle = computed(() => formConfig.value?.page?.pageTitle || '数据管理')
const pageDescription = computed(() => formConfig.value?.basic?.description || '数据列表管理')
const entityName = computed(() => formConfig.value?.basic?.name?.replace('表单', '') || '数据')

const formFields = computed(() => {
  return formConfig.value?.template?.fields || []
})

const tableFields = computed(() => {
  return formFields.value.filter(field => field.showInTable !== false)
})

const searchFields = computed(() => {
  return formFields.value.filter(field => field.showInSearch === true)
})

const formRules = computed(() => {
  const rules: FormRules = {}
  formFields.value.forEach(field => {
    if (field.required) {
      rules[field.name] = [
        { required: true, message: `请输入${field.label}`, trigger: 'blur' }
      ]
    }
  })
  return rules
})

// 方法
const loadFormConfig = async () => {
  try {
    // 从路由获取formId，支持多种方式
    let formId = route.query.formId
    
    // 如果没有query参数，尝试从路径匹配菜单
    if (!formId) {
      const currentPath = route.path
      console.log('当前路径:', currentPath)
      
      // 获取菜单数据，找到匹配的菜单项
      const token = localStorage.getItem('token');
const headers = {
  'x-access-token': token
};
const menuResponse = await fetch('http://localhost:4000/api/menu-list', { headers });
      const menuResult = await menuResponse.json()
      
      if (menuResult.code === 200) {
        const matchedMenu = menuResult.data.find(menu => menu.path === currentPath)
        console.log('匹配的菜单:', matchedMenu)
        
        if (matchedMenu) {
          // 如果是动态生成的菜单，尝试从菜单名称或路径推断表单ID
          // 这里可以根据实际的命名规则来调整
          if (matchedMenu.path.startsWith('/auto_page_')) {
            // 使用菜单ID作为表单ID的参考
            formId = matchedMenu.id.toString()
          }
        }
      }
    }
    
    if (!formId) {
      // 如果仍然没有formId，使用默认配置
      console.warn('未找到表单ID，使用默认配置')
      useDefaultConfig()
      return
    }

    const response = await fetch(`http://localhost:4000/api/form-configs`)
    const result = await response.json()
    
    if (result.code === 200) {
      const config = result.data.find(item => item.id.toString() === formId)
      if (config) {
        formConfig.value = config.config_json
        initializeFormData()
      } else {
        console.warn('未找到表单配置，使用默认配置')
        useDefaultConfig()
      }
    } else {
      throw new Error(result.message || '获取表单配置失败')
    }
  } catch (error) {
    console.error('加载表单配置失败:', error)
    console.warn('使用默认配置')
    useDefaultConfig()
  }
}

// 使用默认配置
const useDefaultConfig = () => {
  formConfig.value = {
    basic: {
      name: '数据管理',
      description: '通用数据管理页面'
    },
    template: {
      fields: [
        { name: 'name', label: '名称', type: 'input', required: true, showInTable: true, showInSearch: true },
        { name: 'description', label: '描述', type: 'textarea', required: false, showInTable: true, showInSearch: false },
        { name: 'status', label: '状态', type: 'select', required: true, showInTable: true, showInSearch: true, options: ['启用', '禁用'] },
        { name: 'created_at', label: '创建时间', type: 'date', required: false, showInTable: true, showInSearch: false }
      ]
    },
    page: {
      pageTitle: '数据管理',
      routePath: route.path
    }
  }
  initializeFormData()
}

const initializeFormData = () => {
  // 初始化表单数据
  formFields.value.forEach(field => {
    formData[field.name] = field.defaultValue || ''
    searchForm[field.name] = ''
  })
}

const loadData = async () => {
  tableLoading.value = true
  try {
    // 模拟API调用 - 实际项目中这里应该调用真实的数据API
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // 生成模拟数据
    const mockData = generateMockData()
    tableData.value = mockData
    pagination.total = mockData.length
    
  } catch (error) {
    console.error('加载数据失败:', error)
    ElMessage.error('加载数据失败')
  } finally {
    tableLoading.value = false
  }
}

const generateMockData = () => {
  const data = []
  for (let i = 1; i <= 20; i++) {
    const item = { id: i }
    formFields.value.forEach(field => {
      switch (field.type) {
        case 'input':
          item[field.name] = `${field.label}${i}`
          break
        case 'number':
          item[field.name] = Math.floor(Math.random() * 1000)
          break
        case 'select':
          item[field.name] = field.options?.[Math.floor(Math.random() * (field.options?.length || 1))] || '选项1'
          break
        case 'switch':
          item[field.name] = Math.random() > 0.5
          break
        case 'date':
          item[field.name] = new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
          break
        default:
          item[field.name] = `${field.label}${i}`
      }
    })
    data.push(item)
  }
  return data
}

const refreshData = () => {
  loadData()
}

const handleSearch = () => {
  console.log('搜索条件:', searchForm)
  loadData()
}

const resetSearch = () => {
  Object.keys(searchForm).forEach(key => {
    searchForm[key] = ''
  })
  loadData()
}

const handleSortChange = ({ prop, order }) => {
  console.log('排序变化:', prop, order)
  // 这里可以实现排序逻辑
}

const editItem = (item) => {
  editingItem.value = item
  Object.keys(formData).forEach(key => {
    formData[key] = item[key] || ''
  })
  showCreateDialog.value = true
}

const viewItem = (item) => {
  viewData.value = { ...item }
  showViewDialog.value = true
}

const deleteItem = async (item, index) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除这条${entityName.value}记录吗？`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )
    
    // 模拟删除API调用
    tableData.value.splice(index, 1)
    ElMessage.success('删除成功')
  } catch {
    ElMessage.info('已取消删除')
  }
}

const saveItem = async () => {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return
  
  saving.value = true
  try {
    // 模拟保存API调用
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    if (editingItem.value) {
      // 更新现有项
      const index = tableData.value.findIndex(item => item.id === editingItem.value.id)
      if (index !== -1) {
        tableData.value[index] = { ...editingItem.value, ...formData }
      }
      ElMessage.success('更新成功')
    } else {
      // 创建新项
      const newItem = {
        id: Date.now(),
        ...formData
      }
      tableData.value.unshift(newItem)
      ElMessage.success('创建成功')
    }
    
    showCreateDialog.value = false
    resetForm()
  } catch (error) {
    ElMessage.error('保存失败')
  } finally {
    saving.value = false
  }
}

const resetForm = () => {
  editingItem.value = null
  Object.keys(formData).forEach(key => {
    formData[key] = ''
  })
  formRef.value?.resetFields()
}

const getSearchComponent = (type) => {
  const componentMap = {
    input: 'el-input',
    number: 'el-input-number',
    select: 'el-select',
    date: 'el-date-picker'
  }
  return componentMap[type] || 'el-input'
}

const getFormComponent = (type) => {
  const componentMap = {
    input: 'el-input',
    textarea: 'el-input',
    number: 'el-input-number',
    select: 'el-select',
    radio: 'el-radio-group',
    checkbox: 'el-checkbox-group',
    date: 'el-date-picker',
    switch: 'el-switch'
  }
  return componentMap[type] || 'el-input'
}

const getFieldProps = (field) => {
  const props: any = {
    placeholder: field.placeholder
  }
  
  if (field.type === 'textarea') {
    props.type = 'textarea'
    props.rows = 3
  }
  
  if (field.type === 'date') {
    props.type = 'date'
    props.format = 'YYYY-MM-DD'
    props.valueFormat = 'YYYY-MM-DD'
  }
  
  return props
}

const formatDate = (dateStr) => {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('zh-CN')
}

// 生命周期
onMounted(async () => {
  await loadFormConfig()
  await loadData()
})
</script>

<style scoped lang="scss">
.dynamic-crud {
  padding: 20px;
  background-color: #f5f7fa;
  min-height: 100vh;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

  .header-left {
    h1 {
      margin: 0 0 5px 0;
      color: #303133;
      font-size: 24px;
    }

    p {
      margin: 0;
      color: #606266;
      font-size: 14px;
    }
  }

  .header-right {
    display: flex;
    gap: 8px;
  }
}

.search-card {
  margin-bottom: 20px;
}

.table-card {
  .pagination-wrapper {
    margin-top: 20px;
    text-align: right;
  }
}
</style>