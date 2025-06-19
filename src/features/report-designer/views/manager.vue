<template>
  <div class="univer-report-manager">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <h2>📊 Univer 报表管理</h2>
        <span class="subtitle">专业的医疗数据报表管理平台</span>
      </div>
      <div class="header-right">
        <el-button type="primary" @click="createReport">
          <el-icon><Plus /></el-icon>
          新建报表
        </el-button>
      </div>
    </div>

    <!-- 搜索和筛选栏 -->
    <div class="search-bar">
      <el-row :gutter="16">
        <el-col :span="6">
          <el-input
            v-model="searchForm.keyword"
            placeholder="搜索报表名称或描述"
            clearable
            @keyup.enter="handleSearch"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </el-col>
        <el-col :span="4">
          <el-select v-model="searchForm.category" placeholder="选择分类" clearable>
            <el-option label="🩺 患者统计" value="patient" />
            <el-option label="💰 财务报表" value="finance" />
            <el-option label="💊 药品管理" value="medicine" />
            <el-option label="👨‍⚕️ 医生工作量" value="workload" />
            <el-option label="🏥 床位管理" value="bed" />
            <el-option label="📊 其他" value="other" />
          </el-select>
        </el-col>
        <el-col :span="4">
          <el-select v-model="searchForm.status" placeholder="选择状态" clearable>
            <el-option label="草稿" value="draft" />
            <el-option label="已发布" value="published" />
            <el-option label="已归档" value="archived" />
          </el-select>
        </el-col>
        <el-col :span="6">
          <el-button type="primary" @click="handleSearch">
            <el-icon><Search /></el-icon>
            搜索
          </el-button>
          <el-button @click="handleReset">
            <el-icon><Refresh /></el-icon>
            重置
          </el-button>
        </el-col>
      </el-row>
    </div>

    <!-- 报表列表 -->
    <div class="report-list">
      <el-row :gutter="24">
        <el-col :xs="24" :sm="12" :md="8" :lg="6" v-for="report in reportList" :key="report.id">
          <div class="report-card">
            <div class="card-header">
              <div class="report-icon">
                <el-icon size="32" :color="getCategoryColor(report.category)">
                  <component :is="getCategoryIcon(report.category)" />
                </el-icon>
              </div>
              <div class="report-actions">
                <el-dropdown @command="handleReportAction">
                  <el-button type="text" size="small">
                    <el-icon><More /></el-icon>
                  </el-button>
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item :command="{ action: 'edit', report }">
                        <el-icon><Edit /></el-icon>
                        编辑
                      </el-dropdown-item>
                      <el-dropdown-item :command="{ action: 'copy', report }">
                        <el-icon><CopyDocument /></el-icon>
                        复制
                      </el-dropdown-item>
                      <el-dropdown-item :command="{ action: 'export', report }">
                        <el-icon><Download /></el-icon>
                        导出
                      </el-dropdown-item>
                      <el-dropdown-item :command="{ action: 'delete', report }" divided>
                        <el-icon><Delete /></el-icon>
                        删除
                      </el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
              </div>
            </div>
            
            <div class="card-content" @click="openReport(report)">
              <h3 class="report-title">{{ report.name }}</h3>
              <p class="report-description">{{ report.description || '暂无描述' }}</p>
              
              <div class="report-meta">
                <el-tag :type="getStatusType(report.status)" size="small">
                  {{ getStatusText(report.status) }}
                </el-tag>
                <el-tag type="info" size="small">
                  {{ getCategoryText(report.category) }}
                </el-tag>
              </div>
              
              <div class="report-stats">
                <div class="stat-item">
                  <span class="stat-label">最后修改</span>
                  <span class="stat-value">{{ formatTime(report.updatedAt) }}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">创建时间</span>
                  <span class="stat-value">{{ formatTime(report.createdAt) }}</span>
                </div>
              </div>
            </div>
          </div>
        </el-col>
      </el-row>

      <!-- 空状态 -->
      <el-empty v-if="reportList.length === 0" description="暂无报表数据">
        <el-button type="primary" @click="createReport">创建第一个报表</el-button>
      </el-empty>

      <!-- 分页 -->
      <div class="pagination-wrapper" v-if="pagination.total > 0">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :total="pagination.total"
          :page-sizes="[12, 24, 48, 96]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </div>

    <!-- 创建/编辑报表对话框 -->
    <el-dialog
      v-model="showReportDialog"
      :title="isEdit ? '编辑报表' : '新建报表'"
      width="600px"
      @close="resetReportForm"
    >
      <el-form :model="reportForm" :rules="reportRules" ref="reportFormRef" label-width="100px">
        <el-form-item label="报表名称" prop="name">
          <el-input v-model="reportForm.name" placeholder="请输入报表名称" />
        </el-form-item>
        <el-form-item label="报表描述" prop="description">
          <el-input
            v-model="reportForm.description"
            type="textarea"
            rows="3"
            placeholder="请输入报表描述"
          />
        </el-form-item>
        <el-form-item label="报表分类" prop="category">
          <el-select v-model="reportForm.category" placeholder="选择分类" style="width: 100%;">
            <el-option label="🩺 患者统计" value="patient" />
            <el-option label="💰 财务报表" value="finance" />
            <el-option label="💊 药品管理" value="medicine" />
            <el-option label="👨‍⚕️ 医生工作量" value="workload" />
            <el-option label="🏥 床位管理" value="bed" />
            <el-option label="📊 其他" value="other" />
          </el-select>
        </el-form-item>
        <el-form-item label="选择模板" prop="template" v-if="!isEdit">
          <el-select v-model="reportForm.template" placeholder="选择初始模板" style="width: 100%;">
            <el-option label="🩺 患者统计报表" value="patient-stats" />
            <el-option label="💰 科室收入报表" value="department-revenue" />
            <el-option label="💊 药品库存报表" value="medicine-inventory" />
            <el-option label="👨‍⚕️ 医生工作量报表" value="doctor-workload" />
            <el-option label="🏥 床位占用统计" value="bed-occupancy" />
            <el-option label="📋 检查项目统计" value="examination-stats" />
            <el-option label="📄 空白报表" value="blank" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showReportDialog = false">取消</el-button>
        <el-button type="primary" @click="handleSubmitReport" :loading="submitting">
          {{ isEdit ? '保存' : '创建' }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Plus,
  Search,
  Refresh,
  Edit,
  Delete,
  CopyDocument,
  Download,
  More,
  Document,
  Money,
  MedicineBox,
  User,
  OfficeBuilding,
  DataAnalysis,
  Collection
} from '@element-plus/icons-vue'
import { 
  getUniverReports, 
  createUniverReport, 
  updateUniverReport, 
  deleteUniverReport,
  copyUniverReport,
  exportUniverReport
} from '@/api/report'

// 类型定义
interface UniverReport {
  id: string
  name: string
  description?: string
  category: string
  status: 'draft' | 'published' | 'archived'
  template: string
  data: any
  createdAt: string
  updatedAt: string
  createdBy: string
}

interface SearchForm {
  keyword: string
  category: string
  status: string
}

interface ReportForm {
  name: string
  description: string
  category: string
  template: string
}

const router = useRouter()

// 响应式数据
const reportList = ref<UniverReport[]>([])
const loading = ref(false)
const showReportDialog = ref(false)
const isEdit = ref(false)
const submitting = ref(false)
const reportFormRef = ref()

// 搜索表单
const searchForm = reactive<SearchForm>({
  keyword: '',
  category: '',
  status: ''
})

// 分页信息
const pagination = reactive({
  page: 1,
  pageSize: 12,
  total: 0
})

// 报表表单
const reportForm = reactive<ReportForm>({
  name: '',
  description: '',
  category: '',
  template: 'patient-stats'
})

// 表单验证规则
const reportRules = {
  name: [
    { required: true, message: '请输入报表名称', trigger: 'blur' },
    { min: 2, max: 50, message: '报表名称长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  category: [
    { required: true, message: '请选择报表分类', trigger: 'change' }
  ],
  template: [
    { required: true, message: '请选择初始模板', trigger: 'change' }
  ]
}

// 计算属性
const filteredReports = computed(() => {
  return reportList.value.filter(report => {
    let match = true
    
    if (searchForm.keyword) {
      const keyword = searchForm.keyword.toLowerCase()
      match = match && (
        report.name.toLowerCase().includes(keyword) ||
        (report.description && report.description.toLowerCase().includes(keyword))
      )
    }
    
    if (searchForm.category) {
      match = match && report.category === searchForm.category
    }
    
    if (searchForm.status) {
      match = match && report.status === searchForm.status
    }
    
    return match
  })
})

// 方法定义
const loadReports = async () => {
  try {
    loading.value = true
    const params = {
      page: pagination.page,
      pageSize: pagination.pageSize,
      keyword: searchForm.keyword,
      category: searchForm.category,
      status: searchForm.status
    }
    
    const result = await getUniverReports(params)
    if (result.code === 200) {
      reportList.value = result.data.list
      pagination.total = result.data.total
    }
  } catch (error) {
    ElMessage.error('获取报表列表失败')
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pagination.page = 1
  loadReports()
}

const handleReset = () => {
  searchForm.keyword = ''
  searchForm.category = ''
  searchForm.status = ''
  handleSearch()
}

const createReport = () => {
  isEdit.value = false
  showReportDialog.value = true
  resetReportForm()
}

const openReport = (report: UniverReport) => {
  // 跳转到 Univer 报表设计器，并传递报表ID
  router.push(`/univer-report-designer/${report.id}`)
}

const handleReportAction = async ({ action, report }: { action: string, report: UniverReport }) => {
  switch (action) {
    case 'edit':
      editReport(report)
      break
    case 'copy':
      await copyReport(report)
      break
    case 'export':
      await exportReport(report)
      break
    case 'delete':
      await deleteReport(report)
      break
  }
}

const editReport = (report: UniverReport) => {
  isEdit.value = true
  reportForm.name = report.name
  reportForm.description = report.description || ''
  reportForm.category = report.category
  reportForm.template = report.template
  showReportDialog.value = true
}

const copyReport = async (report: UniverReport) => {
  try {
    const result = await copyUniverReport(report.id)
    if (result.code === 200) {
      ElMessage.success('报表复制成功')
      loadReports()
    }
  } catch (error) {
    ElMessage.error('报表复制失败')
  }
}

const exportReport = async (report: UniverReport) => {
  try {
    const result = await exportUniverReport(report.id)
    if (result.code === 200) {
      ElMessage.success('报表导出成功')
      // 触发下载
      const link = document.createElement('a')
      link.href = result.data.downloadUrl
      link.download = `${report.name}.xlsx`
      link.click()
    }
  } catch (error) {
    ElMessage.error('报表导出失败')
  }
}

const deleteReport = async (report: UniverReport) => {
  try {
    await ElMessageBox.confirm('确定要删除该报表吗？', '提示', {
      type: 'warning'
    })
    
    const result = await deleteUniverReport(report.id)
    if (result.code === 200) {
      ElMessage.success('删除成功')
      loadReports()
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

const handleSubmitReport = async () => {
  try {
    await reportFormRef.value.validate()
    submitting.value = true
    
    if (isEdit.value) {
      // 编辑报表
      const result = await updateUniverReport(reportForm)
      if (result.code === 200) {
        ElMessage.success('报表更新成功')
        showReportDialog.value = false
        loadReports()
      }
    } else {
      // 创建报表
      const result = await createUniverReport(reportForm)
      if (result.code === 200) {
        ElMessage.success('报表创建成功')
        showReportDialog.value = false
        
        // 跳转到编辑页面
        router.push(`/univer-report-designer/${result.data.id}`)
      }
    }
  } catch (error) {
    ElMessage.error(isEdit.value ? '更新失败' : '创建失败')
  } finally {
    submitting.value = false
  }
}

const resetReportForm = () => {
  reportForm.name = ''
  reportForm.description = ''
  reportForm.category = ''
  reportForm.template = 'patient-stats'
  
  if (reportFormRef.value) {
    reportFormRef.value.clearValidate()
  }
}

const handleSizeChange = (size: number) => {
  pagination.pageSize = size
  loadReports()
}

const handleCurrentChange = (page: number) => {
  pagination.page = page
  loadReports()
}

// 工具函数
const getCategoryIcon = (category: string) => {
  const iconMap = {
    patient: User,
    finance: Money,
    medicine: MedicineBox,
    workload: User,
    bed: OfficeBuilding,
    other: DataAnalysis
  }
  return iconMap[category] || Document
}

const getCategoryColor = (category: string) => {
  const colorMap = {
    patient: '#409eff',
    finance: '#67c23a',
    medicine: '#e6a23c',
    workload: '#f56c6c',
    bed: '#909399',
    other: '#606266'
  }
  return colorMap[category] || '#606266'
}

const getCategoryText = (category: string) => {
  const textMap = {
    patient: '患者统计',
    finance: '财务报表',
    medicine: '药品管理',
    workload: '医生工作量',
    bed: '床位管理',
    other: '其他'
  }
  return textMap[category] || '其他'
}

const getStatusType = (status: string) => {
  const typeMap = {
    draft: 'warning',
    published: 'success',
    archived: 'info'
  }
  return typeMap[status] || 'info'
}

const getStatusText = (status: string) => {
  const textMap = {
    draft: '草稿',
    published: '已发布',
    archived: '已归档'
  }
  return textMap[status] || '未知'
}

const formatTime = (time: string) => {
  return new Date(time).toLocaleString('zh-CN')
}

// 生命周期
onMounted(() => {
  loadReports()
})
</script>

<style scoped lang="scss">
.univer-report-manager {
  padding: 24px;
  background: #f5f7fa;
  min-height: 100vh;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding: 24px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);

  .header-left {
    h2 {
      margin: 0;
      color: #303133;
      font-size: 24px;
      font-weight: 600;
    }

    .subtitle {
      color: #606266;
      font-size: 14px;
      margin-top: 4px;
      display: block;
    }
  }
}

.search-bar {
  background: white;
  padding: 24px;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  margin-bottom: 24px;
}

.report-list {
  background: white;
  padding: 24px;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.report-card {
  background: white;
  border: 1px solid #e4e7ed;
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.3s ease;
  margin-bottom: 24px;
  cursor: pointer;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
    border-color: #409eff;
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px;
    background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);

    .report-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 48px;
      height: 48px;
      border-radius: 12px;
      background: white;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }
  }

  .card-content {
    padding: 20px;

    .report-title {
      margin: 0 0 8px 0;
      font-size: 18px;
      font-weight: 600;
      color: #303133;
    }

    .report-description {
      margin: 0 0 16px 0;
      color: #606266;
      font-size: 14px;
      line-height: 1.5;
      height: 42px;
      overflow: hidden;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
    }

    .report-meta {
      display: flex;
      gap: 8px;
      margin-bottom: 16px;
    }

    .report-stats {
      border-top: 1px solid #f0f2f5;
      padding-top: 16px;
      display: flex;
      justify-content: space-between;

      .stat-item {
        text-align: center;

        .stat-label {
          display: block;
          font-size: 12px;
          color: #909399;
          margin-bottom: 4px;
        }

        .stat-value {
          font-size: 14px;
          color: #303133;
          font-weight: 500;
        }
      }
    }
  }
}

.pagination-wrapper {
  display: flex;
  justify-content: center;
  margin-top: 24px;
}

// 响应式设计
@media (max-width: 768px) {
  .univer-report-manager {
    padding: 16px;
  }

  .page-header {
    flex-direction: column;
    gap: 16px;
    text-align: center;
  }

  .search-bar {
    .el-row {
      .el-col {
        margin-bottom: 16px;
      }
    }
  }
}
</style> 