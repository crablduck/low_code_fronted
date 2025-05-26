<template>
  <div class="report-designer">
    <div class="page-header">
      <div class="header-left">
        <h1>报表设计器</h1>
        <p>创建和管理各种数据报表</p>
      </div>
      <div class="header-right">
        <el-button type="primary" @click="showWizard = true" :icon="Plus">
          创建报表
        </el-button>
        <el-button @click="refreshReports" :icon="Refresh">刷新</el-button>
      </div>
    </div>

    <!-- 筛选和搜索 -->
    <el-card class="filter-card">
      <el-row :gutter="20">
        <el-col :span="6">
          <el-input
            v-model="searchForm.keyword"
            placeholder="搜索报表名称"
            :prefix-icon="Search"
            clearable
            @input="handleSearch"
          />
        </el-col>
        <el-col :span="4">
          <el-select
            v-model="searchForm.category"
            placeholder="报表分类"
            clearable
            @change="handleSearch"
          >
            <el-option label="全部" value="" />
            <el-option label="销售报表" value="sales" />
            <el-option label="财务报表" value="finance" />
            <el-option label="运营报表" value="operation" />
            <el-option label="统计报表" value="statistics" />
            <el-option label="其他" value="other" />
          </el-select>
        </el-col>
        <el-col :span="4">
          <el-select
            v-model="searchForm.status"
            placeholder="报表状态"
            clearable
            @change="handleSearch"
          >
            <el-option label="全部" value="" />
            <el-option label="草稿" value="draft" />
            <el-option label="已发布" value="published" />
          </el-select>
        </el-col>
        <el-col :span="6">
          <el-date-picker
            v-model="searchForm.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            @change="handleSearch"
          />
        </el-col>
        <el-col :span="4">
          <el-button @click="resetSearch">重置</el-button>
        </el-col>
      </el-row>
    </el-card>

    <!-- 报表列表 -->
    <el-card class="table-card">
      <el-table
        :data="reportList"
        v-loading="tableLoading"
        stripe
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        
        <el-table-column prop="name" label="报表名称" min-width="200">
          <template #default="{ row }">
            <div class="report-name">
              <el-icon class="report-icon"><DataAnalysis /></el-icon>
              <div>
                <div class="name">{{ row.name }}</div>
                <div class="description">{{ row.description || '暂无说明' }}</div>
              </div>
            </div>
          </template>
        </el-table-column>
        
        <el-table-column prop="category" label="分类" width="120">
          <template #default="{ row }">
            <el-tag :type="getCategoryTagType(row.category)" size="small">
              {{ getCategoryText(row.category) }}
            </el-tag>
          </template>
        </el-table-column>
        
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 'published' ? 'success' : 'info'" size="small">
              {{ row.status === 'published' ? '已发布' : '草稿' }}
            </el-tag>
          </template>
        </el-table-column>
        
        <el-table-column prop="creator" label="创建人" width="120" />
        
        <el-table-column prop="created_at" label="创建时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.created_at) }}
          </template>
        </el-table-column>
        
        <el-table-column prop="updated_at" label="更新时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.updated_at) }}
          </template>
        </el-table-column>
        
        <el-table-column label="操作" width="300" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="editReport(row)">
              设计
            </el-button>
            <el-button size="small" @click="previewReport(row)">
              预览
            </el-button>
            <el-button size="small" @click="exportReport(row)" :icon="Download">
              导出
            </el-button>
            <el-dropdown @command="(command) => handleMoreAction(command, row)">
              <el-button size="small">
                更多<el-icon class="el-icon--right"><arrow-down /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="copy">复制</el-dropdown-item>
                  <el-dropdown-item command="publish" v-if="row.status === 'draft'">发布</el-dropdown-item>
                  <el-dropdown-item command="unpublish" v-if="row.status === 'published'">取消发布</el-dropdown-item>
                  <el-dropdown-item command="delete" divided>删除</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.size"
          :page-sizes="[10, 20, 50, 100]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="loadReports"
          @current-change="loadReports"
        />
      </div>
    </el-card>

    <!-- 批量操作 -->
    <div v-if="selectedReports.length > 0" class="batch-actions">
      <el-card>
        <div class="batch-content">
          <span>已选择 {{ selectedReports.length }} 个报表</span>
          <div class="batch-buttons">
            <el-button @click="batchExport">批量导出</el-button>
            <el-button @click="batchPublish">批量发布</el-button>
            <el-button type="danger" @click="batchDelete">批量删除</el-button>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 报表创建向导 -->
    <ReportWizard
      v-model="showWizard"
      @done="handleWizardDone"
    />

    <!-- 报表预览对话框 -->
    <el-dialog
      v-model="showPreview"
      :title="`预览报表：${currentReport?.name}`"
      width="90%"
      top="5vh"
    >
      <ReportDesignerComponent
        v-if="showPreview && currentReport"
        :mode="'preview'"
        :report-data="currentReport"
        @back="showPreview = false"
      />
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Plus,
  Refresh,
  Search,
  Download,
  DataAnalysis,
  ArrowDown
} from '@element-plus/icons-vue'
import ReportWizard from '../components/ReportWizard.vue'
import ReportDesignerComponent from '../components/ReportDesigner.vue'

// 定义组件的 props 和 emits
defineProps<{
  mode?: string
}>()

defineEmits<{
  (e: 'update:current-page', page: number): void
  (e: 'update:page-size', size: number): void
  (e: 'size-change'): void
  (e: 'current-change'): void
  (e: 'back'): void
}>()

const router = useRouter()

// 响应式数据
const showWizard = ref(false)
const showPreview = ref(false)
const tableLoading = ref(false)
const reportList = ref([])
const selectedReports = ref([])
const currentReport = ref(null)

// 搜索表单
const searchForm = reactive({
  keyword: '',
  category: '',
  status: '',
  dateRange: null
})

// 分页数据
const pagination = reactive({
  page: 1,
  size: 20,
  total: 0
})

// 方法
const loadReports = async () => {
  tableLoading.value = true
  try {
    const params = new URLSearchParams({
      page: pagination.page.toString(),
      size: pagination.size.toString(),
      ...searchForm
    })
    
    if (searchForm.dateRange) {
      params.append('startDate', searchForm.dateRange[0])
      params.append('endDate', searchForm.dateRange[1])
    }
    
    const response = await fetch(`http://localhost:4000/api/reports?${params}`)
    const result = await response.json()
    
    if (result.code === 200) {
      reportList.value = result.data.list || []
      pagination.total = result.data.total || 0
    } else {
      throw new Error(result.message)
    }
  } catch (error) {
    ElMessage.error('加载报表列表失败: ' + error.message)
  } finally {
    tableLoading.value = false
  }
}

const refreshReports = () => {
  pagination.page = 1
  loadReports()
}

const handleSearch = () => {
  pagination.page = 1
  loadReports()
}

const resetSearch = () => {
  Object.assign(searchForm, {
    keyword: '',
    category: '',
    status: '',
    dateRange: null
  })
  handleSearch()
}

const handleSelectionChange = (selection: any[]) => {
  selectedReports.value = selection
}

const editReport = (report: any) => {
  // 跳转到报表设计器编辑页面
  router.push({
    path: '/report-designer/edit',
    query: { id: report.id, mode: 'edit' }
  })
}

const previewReport = (report: any) => {
  currentReport.value = report
  showPreview.value = true
}

const exportReport = async (report: any) => {
  try {
    // 导出报表配置
    const exportData = {
      name: report.name,
      description: report.description,
      category: report.category,
      config: report.config,
      exportTime: new Date().toISOString()
    }
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
      type: 'application/json' 
    })
    const url = URL.createObjectURL(blob)
    
    const a = document.createElement('a')
    a.href = url
    a.download = `${report.name}_报表配置.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    ElMessage.success('报表导出成功！')
  } catch (error) {
    ElMessage.error('导出失败: ' + error.message)
  }
}

const handleMoreAction = async (command: string, report: any) => {
  switch (command) {
    case 'copy':
      await copyReport(report)
      break
    case 'publish':
      await publishReport(report)
      break
    case 'unpublish':
      await unpublishReport(report)
      break
    case 'delete':
      await deleteReport(report)
      break
  }
}

const copyReport = async (report: any) => {
  try {
    const response = await fetch('http://localhost:4000/api/reports', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: `${report.name}_副本`,
        description: report.description,
        category: report.category,
        config: report.config,
        status: 'draft'
      })
    })
    
    const result = await response.json()
    if (result.code === 200) {
      ElMessage.success('报表复制成功！')
      loadReports()
    } else {
      throw new Error(result.message)
    }
  } catch (error) {
    ElMessage.error('复制失败: ' + error.message)
  }
}

const publishReport = async (report: any) => {
  try {
    await ElMessageBox.confirm(
      `确定要发布报表"${report.name}"吗？`,
      '确认发布',
      { type: 'warning' }
    )
    
    const response = await fetch(`http://localhost:4000/api/reports/${report.id}/publish`, {
      method: 'POST'
    })
    
    const result = await response.json()
    if (result.code === 200) {
      ElMessage.success('报表发布成功！')
      loadReports()
    } else {
      throw new Error(result.message)
    }
  } catch (error) {
    if (error.message) {
      ElMessage.error('发布失败: ' + error.message)
    }
  }
}

const unpublishReport = async (report: any) => {
  try {
    await ElMessageBox.confirm(
      `确定要取消发布报表"${report.name}"吗？`,
      '确认取消发布',
      { type: 'warning' }
    )
    
    const response = await fetch(`http://localhost:4000/api/reports/${report.id}/unpublish`, {
      method: 'POST'
    })
    
    const result = await response.json()
    if (result.code === 200) {
      ElMessage.success('取消发布成功！')
      loadReports()
    } else {
      throw new Error(result.message)
    }
  } catch (error) {
    if (error.message) {
      ElMessage.error('取消发布失败: ' + error.message)
    }
  }
}

const deleteReport = async (report: any) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除报表"${report.name}"吗？此操作不可恢复！`,
      '确认删除',
      { type: 'error' }
    )
    
    const response = await fetch(`http://localhost:4000/api/reports/${report.id}`, {
      method: 'DELETE'
    })
    
    const result = await response.json()
    if (result.code === 200) {
      ElMessage.success('报表删除成功！')
      loadReports()
    } else {
      throw new Error(result.message)
    }
  } catch (error) {
    if (error.message) {
      ElMessage.error('删除失败: ' + error.message)
    }
  }
}

const batchExport = async () => {
  try {
    const exportData = selectedReports.value.map(report => ({
      name: report.name,
      description: report.description,
      category: report.category,
      config: report.config
    }))
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
      type: 'application/json' 
    })
    const url = URL.createObjectURL(blob)
    
    const a = document.createElement('a')
    a.href = url
    a.download = `批量报表导出_${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    ElMessage.success('批量导出成功！')
  } catch (error) {
    ElMessage.error('批量导出失败: ' + error.message)
  }
}

const batchPublish = async () => {
  try {
    await ElMessageBox.confirm(
      `确定要发布选中的 ${selectedReports.value.length} 个报表吗？`,
      '确认批量发布',
      { type: 'warning' }
    )
    
    const promises = selectedReports.value.map(report => 
      fetch(`http://localhost:4000/api/reports/${report.id}/publish`, {
        method: 'POST'
      })
    )
    
    await Promise.all(promises)
    ElMessage.success('批量发布成功！')
    loadReports()
  } catch (error) {
    ElMessage.error('批量发布失败: ' + error.message)
  }
}

const batchDelete = async () => {
  try {
    await ElMessageBox.confirm(
      `确定要删除选中的 ${selectedReports.value.length} 个报表吗？此操作不可恢复！`,
      '确认批量删除',
      { type: 'error' }
    )
    
    const promises = selectedReports.value.map(report => 
      fetch(`http://localhost:4000/api/reports/${report.id}`, {
        method: 'DELETE'
      })
    )
    
    await Promise.all(promises)
    ElMessage.success('批量删除成功！')
    selectedReports.value = []
    loadReports()
  } catch (error) {
    ElMessage.error('批量删除失败: ' + error.message)
  }
}

const handleWizardDone = (config: any) => {
  // 向导完成后跳转到设计器
  router.push({
    path: '/report-designer/edit',
    query: { id: config.reportId, mode: 'edit' }
  })
}

// 工具函数
const getCategoryText = (category: string) => {
  const categoryMap = {
    sales: '销售',
    finance: '财务',
    operation: '运营',
    statistics: '统计',
    other: '其他'
  }
  return categoryMap[category] || category
}

const getCategoryTagType = (category: string) => {
  const typeMap = {
    sales: 'success',
    finance: 'warning',
    operation: 'info',
    statistics: 'primary',
    other: ''
  }
  return typeMap[category] || ''
}

const formatDate = (dateString: string) => {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleString('zh-CN')
}

// 生命周期
onMounted(() => {
  loadReports()
})
</script>

<style scoped lang="scss">
.report-designer {
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
      font-size: 24px;
      color: #303133;
    }

    p {
      margin: 0;
      color: #909399;
      font-size: 14px;
    }
  }

  .header-right {
    display: flex;
    gap: 12px;
  }
}

.filter-card {
  margin-bottom: 20px;
}

.table-card {
  margin-bottom: 20px;
}

.report-name {
  display: flex;
  align-items: center;
  gap: 12px;

  .report-icon {
    font-size: 20px;
    color: #409eff;
  }

  .name {
    font-weight: 500;
    color: #303133;
    margin-bottom: 4px;
  }

  .description {
    font-size: 12px;
    color: #909399;
  }
}

.pagination-wrapper {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

.batch-actions {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1000;

  .batch-content {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 20px;
    padding: 12px 20px;
    background: white;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);

    .batch-buttons {
      display: flex;
      gap: 8px;
    }
  }
}
</style> 