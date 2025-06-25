<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Edit, View, Delete, Search, Refresh } from '@element-plus/icons-vue'
import { DashboardStatus, DashboardType, type DashboardItem, type DashboardQuery } from '@/shared/types/dashboard'
import {
  getDashboardList,
  deleteDashboard,
  publishDashboard
} from '@/api/dashboard'
import { useUserStore } from '@/stores/user'

const router = useRouter()

// 搜索表单
const searchForm = ref<DashboardQuery>({
  name: '',
  status: undefined,
  type: undefined
})

// 状态选项
const statusOptions = [
  { label: '草稿', value: DashboardStatus.DRAFT },
  { label: '已发布', value: DashboardStatus.PUBLISHED }
]

// 类型选项
const typeOptions = [
  { label: '自定义', value: DashboardType.CUSTOM },
  { label: '模板', value: DashboardType.TEMPLATE },
  { label: '分析型', value: DashboardType.ANALYTICS },
  { label: '运营型', value: DashboardType.OPERATIONAL },
  { label: '管理层', value: DashboardType.EXECUTIVE },
  { label: '实时监控', value: DashboardType.REALTIME },
  { label: '医疗专用', value: DashboardType.MEDICAL },
  { label: '财务报表', value: DashboardType.FINANCIAL }
]

// 表格数据
const loading = ref(false)
const tableData = ref<DashboardItem[]>([])

// 分页信息
const pagination = ref({
  page: 1,
  pageSize: 10,
  total: 0
})

// 获取状态标签类型
const getStatusType = (status: DashboardStatus) => {
  const map: Record<DashboardStatus, string> = {
    [DashboardStatus.DRAFT]: 'warning',
    [DashboardStatus.PUBLISHED]: 'success'
  }
  return map[status]
}

// 获取状态标签文本
const getStatusLabel = (status: DashboardStatus) => {
  const map: Record<DashboardStatus, string> = {
    [DashboardStatus.DRAFT]: '草稿',
    [DashboardStatus.PUBLISHED]: '已发布'
  }
  return map[status]
}

// 获取类型标签类型
const getTypeType = (type: DashboardType) => {
  const map: Record<DashboardType, string> = {
    [DashboardType.CUSTOM]: 'primary',
    [DashboardType.TEMPLATE]: 'success',
    [DashboardType.ANALYTICS]: 'info',
    [DashboardType.OPERATIONAL]: 'warning',
    [DashboardType.EXECUTIVE]: 'danger',
    [DashboardType.REALTIME]: '',
    [DashboardType.MEDICAL]: 'success',
    [DashboardType.FINANCIAL]: 'warning'
  }
  return map[type] || 'info'
}

// 获取类型标签文本
const getTypeLabel = (type: DashboardType) => {
  const map: Record<DashboardType, string> = {
    [DashboardType.CUSTOM]: '自定义',
    [DashboardType.TEMPLATE]: '模板',
    [DashboardType.ANALYTICS]: '分析型',
    [DashboardType.OPERATIONAL]: '运营型',
    [DashboardType.EXECUTIVE]: '管理层',
    [DashboardType.REALTIME]: '实时监控',
    [DashboardType.MEDICAL]: '医疗专用',
    [DashboardType.FINANCIAL]: '财务报表'
  }
  return map[type] || '未知类型'
}

// 格式化时间显示
const formatDateTime = (dateTime: any) => {
  if (!dateTime) return '-'
  
  try {
    let date: Date
    
    if (typeof dateTime === 'string') {
      date = new Date(dateTime)
    } else if (typeof dateTime === 'object' && dateTime instanceof Date) {
      date = dateTime
    } else if (typeof dateTime === 'object') {
      // 处理可能的时间戳对象
      date = new Date(dateTime.toString())
    } else {
      date = new Date(dateTime)
    }
    
    if (isNaN(date.getTime())) {
      return '-'
    }
    
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    })
  } catch (error) {
    console.warn('时间格式化失败:', error)
    return '-'
  }
}

// 加载表格数据
const loadTableData = async () => {
  try {
    loading.value = true
    const result = await getDashboardList({
      page: pagination.value.page,
      pageSize: pagination.value.pageSize,
      name: searchForm.value.name,
      status: searchForm.value.status,
      type: searchForm.value.type
    })
    
    if (result.code === 200) {
      tableData.value = result.data.list
      pagination.value.total = result.data.total
    } else {
      throw new Error(result.message)
    }
  } catch (error) {
    console.error('加载仪表盘列表失败:', error)
    ElMessage.error('加载仪表盘列表失败')
  } finally {
    loading.value = false
  }
}

// 搜索
const handleSearch = () => {
  pagination.value.page = 1
  loadTableData()
}

// 重置搜索
const handleReset = () => {
  searchForm.value = {
    name: '',
    status: undefined,
    type: undefined
  }
  handleSearch()
}

// 新建仪表盘
const handleCreate = () => {
  router.push('/dashboard/designer')
}

// 编辑仪表盘
const handleEdit = (row: DashboardItem) => {
  router.push(`/dashboard/designer/${row.id}`)
}

// 预览仪表盘
const handlePreview = (row: DashboardItem) => {
  router.push(`/dashboard/preview/${row.id}`)
}

// 删除仪表盘
const handleDelete = async (row: DashboardItem) => {
  try {
    await ElMessageBox.confirm('确定要删除该仪表盘吗？', '提示', {
      type: 'warning'
    })
    
    const result = await deleteDashboard(row.id)
    if (result.code === 200) {
      ElMessage.success('删除成功')
      loadTableData()
    } else {
      throw new Error(result.message)
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除仪表盘失败:', error)
      ElMessage.error('删除仪表盘失败')
    }
  }
}

// 处理分页大小变化
const handleSizeChange = (val: number) => {
  pagination.value.pageSize = val
  loadTableData()
}

// 处理页码变化
const handleCurrentChange = (val: number) => {
  pagination.value.page = val
  loadTableData()
}

// 发布/取消发布
const handlePublish = async (row: DashboardItem) => {
  try {
    await publishDashboard(row.id)
    ElMessage.success(row.status === 'published' ? '取消发布成功' : '发布成功')
    loadTableData()
  } catch (error: any) {
    ElMessage.error((row.status === 'published' ? '取消发布' : '发布') + '失败：' + error.message)
  }
}

// 组件挂载时加载数据
onMounted(() => {
  loadTableData()
})
</script>

<template>
  <div class="dashboard-list">
    <div class="page-header">
      <h2>仪表盘管理</h2>
      <el-button type="primary" @click="handleCreate">
        <el-icon><Plus /></el-icon>新建仪表盘
      </el-button>
    </div>

    <!-- 搜索栏 -->
    <div class="search-bar">
      <el-form :inline="true" :model="searchForm">
        <el-form-item label="名称">
          <el-input v-model="searchForm.name" placeholder="请输入仪表盘名称" clearable @keyup.enter="handleSearch" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="请选择状态" clearable>
            <el-option
              v-for="item in statusOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="类型">
          <el-select v-model="searchForm.type" placeholder="请选择类型" clearable>
            <el-option
              v-for="item in typeOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">
            <el-icon><Search /></el-icon>搜索
          </el-button>
          <el-button @click="handleReset">
            <el-icon><Refresh /></el-icon>重置
          </el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 数据表格 -->
    <el-table
      v-loading="loading"
      :data="tableData"
      border
      style="width: 100%"
    >
      <el-table-column prop="name" label="名称" min-width="200" show-overflow-tooltip />
      <el-table-column prop="description" label="描述" min-width="200" show-overflow-tooltip />
      <el-table-column prop="status" label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="getStatusType(row.status)">{{ getStatusLabel(row.status) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="type" label="类型" width="100">
        <template #default="{ row }">
          <el-tag :type="getTypeType(row.type)">{{ getTypeLabel(row.type) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="createTime" label="创建时间" width="180">
        <template #default="{ row }">
          {{ formatDateTime(row.createTime) }}
        </template>
      </el-table-column>
      <el-table-column prop="updateTime" label="更新时间" width="180">
        <template #default="{ row }">
          {{ formatDateTime(row.updateTime) }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="200" fixed="right">
        <template #default="{ row }">
          <el-button-group>
            <el-button type="primary" link @click="handleEdit(row)">
              <el-icon><Edit /></el-icon>编辑
            </el-button>
            <el-button type="primary" link @click="handlePreview(row)">
              <el-icon><View /></el-icon>预览
            </el-button>
            <el-button type="danger" link @click="handleDelete(row)">
              <el-icon><Delete /></el-icon>删除
            </el-button>
          </el-button-group>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页器 -->
    <div class="pagination">
      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.pageSize"
        :total="pagination.total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>
  </div>
</template>

<style scoped>
.dashboard-list {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-header h2 {
  margin: 0;
  font-size: 24px;
  color: var(--el-text-color-primary);
}

.search-bar {
  margin-bottom: 20px;
  padding: 20px;
  background-color: var(--el-bg-color);
  border-radius: 4px;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

:deep(.el-button-group .el-button--link) {
  border: none;
  padding: 0 8px;
}

:deep(.el-tag) {
  text-transform: capitalize;
}
</style> 