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

    <!-- Excel风格报表设计器 -->
    <el-dialog
      v-model="showDesigner"
      :title="`设计报表：${currentReport?.name}`"
      width="95%"
      top="2vh"
      :show-close="false"
      :close-on-click-modal="false"
      custom-class="designer-dialog"
    >
      <ReportDesignerComponent
        v-if="showDesigner && currentReport"
        :mode="'edit'"
        :report-data="currentReport"
        @back="showDesigner = false"
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
// 导入我们创建的报表API
import { reportApi } from '@/api/report'
import type { Report, ReportListParams } from '@/api/report'

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
const showDesigner = ref(false)
const tableLoading = ref(false)
const reportList = ref<Report[]>([])
const selectedReports = ref<Report[]>([])
const currentReport = ref<Report | null>(null)

// 搜索表单
const searchForm = reactive({
  keyword: '',
  category: '',
  status: '',
  dateRange: null as string[] | null
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
    const params: ReportListParams = {
      page: pagination.page,
      size: pagination.size,
      keyword: searchForm.keyword || undefined,
      category: searchForm.category || undefined,
      status: searchForm.status || undefined
    }
    
    if (searchForm.dateRange && searchForm.dateRange.length === 2) {
      params.startDate = searchForm.dateRange[0]
      params.endDate = searchForm.dateRange[1]
    }
    
    const result = await reportApi.getReports(params)
    
    if (result.code === 200) {
      reportList.value = result.data.list || []
      pagination.total = result.data.total || 0
    } else {
      throw new Error(result.message)
    }
  } catch (error: any) {
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

const handleSelectionChange = (selection: Report[]) => {
  selectedReports.value = selection
}

const editReport = (report: Report) => {
  // 跳转到全屏Excel风格报表设计器页面
  router.push({
    path: '/report/design',
    query: {
      id: report.id,
      name: report.name
    }
  })
}

const previewReport = (report: Report) => {
  currentReport.value = report
  showPreview.value = true
}

const exportReport = async (report: Report) => {
  try {
    const result = await reportApi.exportReport(report.id)
    
    if (result.code === 200) {
      // 使用API返回的数据创建下载文件
      const exportData = {
        ...result.data,
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
    } else {
      throw new Error(result.message)
    }
  } catch (error: any) {
    ElMessage.error('导出失败: ' + error.message)
  }
}

const handleMoreAction = async (command: string, report: Report) => {
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

const copyReport = async (report: Report) => {
  try {
    const result = await reportApi.copyReport(report.id, `${report.name}_副本`)
    
    if (result.code === 200) {
      ElMessage.success('报表复制成功！')
      loadReports()
    } else {
      throw new Error(result.message)
    }
  } catch (error: any) {
    ElMessage.error('复制失败: ' + error.message)
  }
}

const publishReport = async (report: Report) => {
  try {
    await ElMessageBox.confirm(
      `确定要发布报表"${report.name}"吗？`,
      '确认发布',
      { type: 'warning' }
    )
    
    const result = await reportApi.publishReport(report.id)
    
    if (result.code === 200) {
      ElMessage.success('报表发布成功！')
      loadReports()
    } else {
      throw new Error(result.message)
    }
  } catch (error: any) {
    if (error.message && error.message !== 'cancel') {
      ElMessage.error('发布失败: ' + error.message)
    }
  }
}

const unpublishReport = async (report: Report) => {
  try {
    await ElMessageBox.confirm(
      `确定要取消发布报表"${report.name}"吗？`,
      '确认取消发布',
      { type: 'warning' }
    )
    
    const result = await reportApi.unpublishReport(report.id)
    
    if (result.code === 200) {
      ElMessage.success('取消发布成功！')
      loadReports()
    } else {
      throw new Error(result.message)
    }
  } catch (error: any) {
    if (error.message && error.message !== 'cancel') {
      ElMessage.error('取消发布失败: ' + error.message)
    }
  }
}

const deleteReport = async (report: Report) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除报表"${report.name}"吗？此操作不可恢复！`,
      '确认删除',
      { type: 'error' }
    )
    
    const result = await reportApi.deleteReport(report.id)
    
    if (result.code === 200) {
      ElMessage.success('报表删除成功！')
      loadReports()
    } else {
      throw new Error(result.message)
    }
  } catch (error: any) {
    if (error.message && error.message !== 'cancel') {
      ElMessage.error('删除失败: ' + error.message)
    }
  }
}

// 批量操作方法
const batchExport = async () => {
  try {
    const exportPromises = selectedReports.value.map(report => 
      reportApi.exportReport(report.id)
    )
    
    const results = await Promise.all(exportPromises)
    
    // 创建批量导出的ZIP文件（简化版本，这里生成单个JSON）
    const exportData = {
      reports: results.map(result => result.data),
      exportTime: new Date().toISOString(),
      total: results.length
    }
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
      type: 'application/json' 
    })
    const url = URL.createObjectURL(blob)
    
    const a = document.createElement('a')
    a.href = url
    a.download = `批量报表导出_${new Date().getTime()}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    ElMessage.success(`成功导出 ${selectedReports.value.length} 个报表！`)
  } catch (error: any) {
    ElMessage.error('批量导出失败: ' + error.message)
  }
}

const batchPublish = async () => {
  try {
    await ElMessageBox.confirm(
      `确定要批量发布 ${selectedReports.value.length} 个报表吗？`,
      '确认批量发布',
      { type: 'warning' }
    )
    
    const ids = selectedReports.value.map(report => report.id)
    const result = await reportApi.batchPublishReports(ids)
    
    if (result.code === 200) {
      ElMessage.success('批量发布成功！')
      loadReports()
      selectedReports.value = []
    } else {
      throw new Error(result.message)
    }
  } catch (error: any) {
    if (error.message && error.message !== 'cancel') {
      ElMessage.error('批量发布失败: ' + error.message)
    }
  }
}

const batchDelete = async () => {
  try {
    await ElMessageBox.confirm(
      `确定要批量删除 ${selectedReports.value.length} 个报表吗？此操作不可恢复！`,
      '确认批量删除',
      { type: 'error' }
    )
    
    const ids = selectedReports.value.map(report => report.id)
    const result = await reportApi.batchDeleteReports(ids)
    
    if (result.code === 200) {
      ElMessage.success('批量删除成功！')
      loadReports()
      selectedReports.value = []
    } else {
      throw new Error(result.message)
    }
  } catch (error: any) {
    if (error.message && error.message !== 'cancel') {
      ElMessage.error('批量删除失败: ' + error.message)
    }
  }

}

const handleWizardDone = () => {
  showWizard.value = false
  loadReports()
}

// 工具方法
const getCategoryTagType = (category: string) => {
  const typeMap: Record<string, string> = {
    'sales': 'success',
    'finance': 'warning', 
    'operation': 'info',
    'statistics': 'primary',
    'other': 'default'
  }
  return typeMap[category] || 'default'
}

const getCategoryText = (category: string) => {
  const textMap: Record<string, string> = {
    'sales': '销售报表',
    'finance': '财务报表',
    'operation': '运营报表', 
    'statistics': '统计报表',
    'other': '其他'
  }
  return textMap[category] || '未知'
}

const formatDate = (dateStr: string | object) => {
  // 处理空对象、null、undefined或空字符串的情况
  if (!dateStr || typeof dateStr === 'object' || dateStr === '') return '-'
  
  try {
    return new Date(dateStr as string).toLocaleString('zh-CN')
  } catch (error) {
    return '-'
  }
}

// 组件挂载时加载数据
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

<style>
/* 设计器弹窗样式 - 全局样式 */
.designer-dialog .el-dialog {
  margin: 0 !important;
  height: 98vh !important;
  max-height: 98vh !important;
  display: flex !important;
  flex-direction: column !important;
}

.designer-dialog .el-dialog__header {
  padding: 10px 20px !important;
  background: #107c41 !important;
  color: white !important;
  margin: 0 !important;
}

.designer-dialog .el-dialog__title {
  color: white !important;
  font-weight: 600 !important;
}

.designer-dialog .el-dialog__body {
  padding: 0 !important;
  flex: 1 !important;
  overflow: hidden !important;
  display: flex !important;
  flex-direction: column !important;
}

.designer-dialog .el-dialog__close {
  color: white !important;
}

.designer-dialog .el-dialog__close:hover {
  color: #ffd04b !important;
}
</style> 