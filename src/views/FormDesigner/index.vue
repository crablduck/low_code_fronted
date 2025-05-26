<template>
  <div class="form-designer">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <h1>表单设计器</h1>
        <p>快速创建可用表单页面 + 数据结构 + 菜单导航</p>
      </div>
      <div class="header-right">
        <el-button type="primary" @click="showWizard = true" :icon="Star">
          快速创建表单
        </el-button>
        <el-button @click="createFromScratch" :icon="Plus">
          从零开始
        </el-button>
      </div>
    </div>

    <!-- 快速入口卡片 -->
    <div class="quick-start-section" v-if="!hasExistingForms">
      <el-row :gutter="20">
        <el-col :span="8">
          <el-card class="quick-card" @click="showWizard = true" shadow="hover">
            <div class="quick-card-content">
              <el-icon class="quick-icon"><Star /></el-icon>
              <h3>快速创建向导</h3>
              <p>3步完成表单创建，适合快速搭建场景</p>
              <el-tag type="success" size="small">推荐</el-tag>
            </div>
          </el-card>
        </el-col>
        <el-col :span="8">
          <el-card class="quick-card" @click="importFromTemplate" shadow="hover">
            <div class="quick-card-content">
              <el-icon class="quick-icon"><Document /></el-icon>
              <h3>模板导入</h3>
              <p>从现有模板或JSON Schema导入</p>
            </div>
          </el-card>
        </el-col>
        <el-col :span="8">
          <el-card class="quick-card" @click="createFromScratch" shadow="hover">
            <div class="quick-card-content">
              <el-icon class="quick-icon"><Edit /></el-icon>
              <h3>自定义设计</h3>
              <p>完全自定义表单字段和布局</p>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 现有表单列表 -->
    <div class="forms-section" v-if="hasExistingForms">
      <div class="section-header">
        <h2>我的表单</h2>
        <div class="section-actions">
          <el-input
            v-model="searchKeyword"
            placeholder="搜索表单..."
            :prefix-icon="Search"
            style="width: 200px; margin-right: 10px;"
          />
          <el-select v-model="filterStatus" placeholder="状态筛选" style="width: 120px;">
            <el-option label="全部" value="" />
            <el-option label="草稿" value="draft" />
            <el-option label="已发布" value="published" />
          </el-select>
        </div>
      </div>

      <el-table :data="filteredForms" v-loading="formsLoading">
        <el-table-column prop="name" label="表单名称" min-width="150">
          <template #default="{ row }">
            <div class="form-name">
              <span>{{ row.name }}</span>
              <el-tag v-if="row.isTemplate" type="warning" size="small">模板</el-tag>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="说明" min-width="200" show-overflow-tooltip />
        <el-table-column prop="fieldsCount" label="字段数" width="80" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" size="small">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="updatedAt" label="更新时间" width="150">
          <template #default="{ row }">
            {{ formatDate(row.updatedAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="300" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="editForm(row)">
              编辑
            </el-button>
            <el-button size="small" @click="previewForm(row)">
              预览
            </el-button>
            <!-- 发布/取消发布按钮 -->
            <el-button 
              v-if="row.status === 'draft'" 
              type="success" 
              size="small" 
              @click="publishForm(row)"
            >
              发布
            </el-button>
            <el-button 
              v-if="row.status === 'published'" 
              type="warning" 
              size="small" 
              @click="unpublishForm(row)"
            >
              取消发布
            </el-button>
            <el-dropdown @command="handleFormAction">
              <el-button size="small" type="info">
                更多<el-icon class="el-icon--right"><arrow-down /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item :command="{action: 'clone', form: row}">
                    克隆表单
                  </el-dropdown-item>
                  <el-dropdown-item :command="{action: 'export', form: row}">
                    导出配置
                  </el-dropdown-item>
                  <el-dropdown-item :command="{action: 'delete', form: row}" divided>
                    删除表单
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
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
          @size-change="loadForms"
          @current-change="loadForms"
        />
      </div>
    </div>

    <!-- 快速表单生成向导 -->
    <QuickFormWizard
      v-model="showWizard"
      @done="handleWizardDone"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Star, Plus, Document, Edit, Search, ArrowDown } from '@element-plus/icons-vue'
import QuickFormWizard from '@/components/FormWizard/QuickFormWizard.vue'
import { useRouter } from 'vue-router'

// 路由
const router = useRouter()

// 响应式数据
const showWizard = ref(false)
const searchKeyword = ref('')
const filterStatus = ref('')
const formsLoading = ref(false)

// 表单列表数据
const forms = ref([
  {
    id: '1',
    name: '用户注册表单',
    description: '新用户注册信息收集',
    fieldsCount: 8,
    status: 'published',
    isTemplate: false,
    updatedAt: '2024-01-15 10:30:00'
  },
  {
    id: '2',
    name: '商品信息录入',
    description: '商品基础信息管理表单',
    fieldsCount: 12,
    status: 'draft',
    isTemplate: false,
    updatedAt: '2024-01-14 16:45:00'
  },
  {
    id: '3',
    name: '个人信息模板',
    description: '通用个人信息收集模板',
    fieldsCount: 6,
    status: 'published',
    isTemplate: true,
    updatedAt: '2024-01-10 09:15:00'
  }
])

// 分页数据
const pagination = reactive({
  current: 1,
  size: 10,
  total: 0
})

// 计算属性
const hasExistingForms = computed(() => forms.value.length > 0)

const filteredForms = computed(() => {
  let result = forms.value
  
  // 关键词搜索
  if (searchKeyword.value) {
    result = result.filter(form => 
      form.name.toLowerCase().includes(searchKeyword.value.toLowerCase()) ||
      form.description.toLowerCase().includes(searchKeyword.value.toLowerCase())
    )
  }
  
  // 状态筛选
  if (filterStatus.value) {
    result = result.filter(form => form.status === filterStatus.value)
  }
  
  return result
})

// 方法
const loadForms = async () => {
  formsLoading.value = true
  try {
    const response = await fetch('http://localhost:4000/api/form-configs')
    const result = await response.json()
    
    if (result.code === 200) {
      // 转换后端数据格式为前端需要的格式
      forms.value = result.data.map(item => ({
        id: item.id.toString(),
        name: item.name,
        description: item.description || '',
        fieldsCount: item.config_json?.template?.fields?.length || 0,
        status: item.status,
        isTemplate: false,
        updatedAt: item.updated_at
      }))
      pagination.total = forms.value.length
    } else {
      throw new Error(result.message || '获取表单列表失败')
    }
  } catch (error) {
    console.error('加载表单列表失败:', error)
    ElMessage.error('加载表单列表失败: ' + error.message)
  } finally {
    formsLoading.value = false
  }
}

const handleWizardDone = (config: any) => {
  console.log('向导完成，配置数据:', config)
  
  if (config.generatedPage) {
    const { formId, routePath, pageTitle, menuId } = config.generatedPage
    
    ElMessage.success(`表单"${pageTitle}"创建成功！正在跳转到CRUD页面...`)
    
    // 触发菜单更新事件
    window.dispatchEvent(new CustomEvent('menuUpdated'))
    
    // 跳转到动态生成的CRUD页面
    setTimeout(() => {
      router.push({
        path: `/${routePath}`,
        query: { 
          formId: formId.toString(),
          fromWizard: 'true'
        }
      })
    }, 1000)
  } else {
    ElMessage.success('表单创建成功！正在跳转到编辑页面...')
    
    // 模拟跳转到表单编辑页面
    setTimeout(() => {
      router.push({
        path: '/form-designer/edit',
        query: { 
          fromWizard: 'true',
          config: JSON.stringify(config)
        }
      })
    }, 1000)
  }
}

const createFromScratch = () => {
  router.push('/form-designer/edit')
}

const importFromTemplate = () => {
  ElMessage.info('模板导入功能开发中...')
}

const editForm = (form: any) => {
  router.push(`/form-designer/edit/${form.id}`)
}

const previewForm = (form: any) => {
  router.push(`/form-designer/preview/${form.id}`)
}

const publishForm = async (form: any) => {
  try {
    // 获取表单配置
    const response = await fetch(`http://localhost:4000/api/form-configs/${form.id}`)
    const result = await response.json()
    
    if (result.code === 200) {
      const config = result.data.config_json
      
      // 如果表单配置中有菜单信息，直接发布
      if (config.page?.autoGenerateMenu && config.page?.parentMenu) {
        const publishResponse = await fetch(`http://localhost:4000/api/form-configs/${form.id}/publish`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            parentMenuId: config.page.parentMenu,
            routePath: config.page.routePath,
            pageTitle: config.page.pageTitle || form.name
          })
        })
        
        const publishResult = await publishResponse.json()
        if (publishResult.code === 200) {
          ElMessage.success('表单发布成功！菜单已自动创建')
          
          // 触发菜单更新事件
          window.dispatchEvent(new CustomEvent('menuUpdated'))
          
          // 重新加载表单列表
          loadForms()
        } else {
          throw new Error(publishResult.message)
        }
      } else {
        // 如果没有菜单配置，提示用户手动配置
        ElMessageBox.prompt(
          '请输入菜单路径（如：user_management）',
          '发布表单',
          {
            confirmButtonText: '发布',
            cancelButtonText: '取消',
            inputPattern: /^[a-zA-Z0-9_-]+$/,
            inputErrorMessage: '路径只能包含字母、数字、下划线和横线'
          }
        ).then(async ({ value }) => {
          const publishResponse = await fetch(`http://localhost:4000/api/form-configs/${form.id}/publish`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              parentMenuId: 2, // 默认挂载到业务管理下
              routePath: value,
              pageTitle: form.name
            })
          })
          
          const publishResult = await publishResponse.json()
          if (publishResult.code === 200) {
            ElMessage.success('表单发布成功！')
            
            // 触发菜单更新事件
            window.dispatchEvent(new CustomEvent('menuUpdated'))
            
            // 重新加载表单列表
            loadForms()
          } else {
            throw new Error(publishResult.message)
          }
        }).catch(() => {
          ElMessage.info('已取消发布')
        })
      }
    } else {
      throw new Error(result.message)
    }
  } catch (error) {
    ElMessage.error('发布表单失败: ' + error.message)
  }
}

const unpublishForm = async (form: any) => {
  try {
    await ElMessageBox.confirm(
      `确定要取消发布表单"${form.name}"吗？取消发布后菜单中将不再显示该表单。`,
      '确认取消发布',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )
    
    const response = await fetch(`http://localhost:4000/api/form-configs/${form.id}/unpublish`, {
      method: 'POST'
    })
    
    const result = await response.json()
    if (result.code === 200) {
      ElMessage.success('表单取消发布成功！菜单已更新')
      
      // 触发菜单更新事件
      window.dispatchEvent(new CustomEvent('menuUpdated'))
      
      // 重新加载表单列表
      loadForms()
    } else {
      throw new Error(result.message)
    }
  } catch (error) {
    if (error.message) {
      ElMessage.error('取消发布失败: ' + error.message)
    } else {
      ElMessage.info('已取消操作')
    }
  }
}

const handleFormAction = async ({ action, form }: { action: string, form: any }) => {
  switch (action) {
    case 'clone':
      try {
        // 获取原表单配置
        const response = await fetch(`http://localhost:4000/api/form-configs/${form.id}`)
        const result = await response.json()
        
        if (result.code === 200) {
          const originalConfig = result.data.config_json
          
          // 创建克隆配置
          const cloneConfig = {
            ...originalConfig,
            basic: {
              ...originalConfig.basic,
              name: `${originalConfig.basic.name} - 副本`,
              description: `${originalConfig.basic.description || ''} (克隆)`
            }
          }
          
          // 保存克隆的表单
          const saveResponse = await fetch('http://localhost:4000/api/form-configs', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              name: cloneConfig.basic.name,
              description: cloneConfig.basic.description,
              data_source_id: 1,
              config_json: cloneConfig,
              status: 'draft'
            })
          })
          
          const saveResult = await saveResponse.json()
          if (saveResult.code === 200) {
            ElMessage.success(`已克隆表单：${form.name}`)
            loadForms() // 重新加载列表
          } else {
            throw new Error(saveResult.message)
          }
        }
      } catch (error) {
        ElMessage.error('克隆表单失败: ' + error.message)
      }
      break
      
    case 'export':
      try {
        const response = await fetch(`http://localhost:4000/api/form-configs/${form.id}`)
        const result = await response.json()
        
        if (result.code === 200) {
          // 导出配置为JSON文件
          const configData = JSON.stringify(result.data.config_json, null, 2)
          const blob = new Blob([configData], { type: 'application/json' })
          const url = URL.createObjectURL(blob)
          
          const a = document.createElement('a')
          a.href = url
          a.download = `${form.name}-config.json`
          document.body.appendChild(a)
          a.click()
          document.body.removeChild(a)
          URL.revokeObjectURL(url)
          
          ElMessage.success(`正在导出表单配置：${form.name}`)
        }
      } catch (error) {
        ElMessage.error('导出配置失败: ' + error.message)
      }
      break
      
    case 'delete':
      try {
        await ElMessageBox.confirm(
          `确定要删除表单"${form.name}"吗？此操作不可恢复。`,
          '确认删除',
          {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning',
          }
        )
        
        const response = await fetch(`http://localhost:4000/api/form-configs/${form.id}`, {
          method: 'DELETE'
        })
        
        const result = await response.json()
        if (result.code === 200) {
          ElMessage.success('删除成功')
          loadForms() // 重新加载列表
        } else {
          throw new Error(result.message)
        }
      } catch (error) {
        if (error.message) {
          ElMessage.error('删除失败: ' + error.message)
        } else {
          ElMessage.info('已取消删除')
        }
      }
      break
  }
}

const getStatusType = (status: string) => {
  const statusMap: Record<string, string> = {
    draft: 'info',
    published: 'success',
    archived: 'warning'
  }
  return statusMap[status] || 'info'
}

const getStatusText = (status: string) => {
  const statusMap: Record<string, string> = {
    draft: '草稿',
    published: '已发布',
    archived: '已归档'
  }
  return statusMap[status] || '未知'
}

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 生命周期
onMounted(() => {
  loadForms()
})
</script>

<style scoped lang="scss">
.form-designer {
  padding: 20px;
  background-color: #f5f7fa;
  min-height: 100vh;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
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
    .el-button {
      margin-left: 10px;
    }
  }
}

.quick-start-section {
  margin-bottom: 30px;

  .quick-card {
    cursor: pointer;
    transition: all 0.3s;
    height: 160px;

    &:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
    }

    .quick-card-content {
      text-align: center;
      padding: 20px;

      .quick-icon {
        font-size: 40px;
        color: #409eff;
        margin-bottom: 15px;
      }

      h3 {
        margin: 0 0 10px 0;
        color: #303133;
        font-size: 16px;
      }

      p {
        margin: 0 0 15px 0;
        color: #606266;
        font-size: 13px;
        line-height: 1.4;
      }
    }
  }
}

.forms-section {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;

    h2 {
      margin: 0;
      color: #303133;
      font-size: 18px;
    }

    .section-actions {
      display: flex;
      align-items: center;
    }
  }

  .form-name {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .pagination-wrapper {
    margin-top: 20px;
    text-align: right;
  }
}
</style> 