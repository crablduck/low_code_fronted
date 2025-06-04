<template>
  <div class="datasource-manage">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <div class="header-left">
          <h1 class="page-title">
            <el-icon><DataAnalysis /></el-icon>
            数据源管理
          </h1>
          <p class="page-description">管理和配置数据源连接</p>
        </div>
        <div class="header-actions">
          <el-button type="primary" size="large" @click="showAddDataSource = true">
            <el-icon><Plus /></el-icon>
            创建数据源
          </el-button>
        </div>
      </div>
    </div>

    <!-- 主要内容区域 -->
    <div class="main-container">
      <!-- 左侧：数据源列表和统计 -->
      <div class="left-panel">
        <!-- 搜索和筛选区域 -->
        <div class="search-section">
          <div class="search-bar">
            <el-input
              v-model="searchKeyword"
              placeholder="搜索数据源名称..."
              prefix-icon="Search"
              clearable
              @clear="loadDataSources"
              @keyup.enter="loadDataSources"
            >
              <template #append>
                <el-button @click="loadDataSources" type="primary">搜索</el-button>
              </template>
            </el-input>
          </div>
          
          <div class="filter-bar">
            <div class="sort-controls">
              <span class="sort-label">排序：</span>
              <el-button-group size="small">
                <el-button 
                  :type="sortType === 'name' ? 'primary' : ''" 
                  @click="sortBy('name')"
                >
                  名称
                  <el-icon v-if="sortType === 'name'">
                    <SortUp v-if="sortOrder === 'asc'" />
                    <SortDown v-else />
                  </el-icon>
                </el-button>
                <el-button 
                  :type="sortType === 'time' ? 'primary' : ''" 
                  @click="sortBy('time')"
                >
                  时间
                  <el-icon v-if="sortType === 'time'">
                    <SortUp v-if="sortOrder === 'asc'" />
                    <SortDown v-else />
                  </el-icon>
                </el-button>
              </el-button-group>
            </div>
          </div>
          
          <!-- 过滤状态显示 -->
          <div v-if="selectedTypeFilter" class="filter-status">
            <el-tag 
              type="info" 
              closable 
              @close="clearTypeFilter"
              size="small"
            >
              类型：{{ selectedTypeFilter }}
            </el-tag>
          </div>
        </div>

        <!-- 统计卡片 -->
        <div class="stats-section">
          <div class="stats-cards">
            <div class="stat-card total">
              <div class="stat-icon">
                <el-icon><DataAnalysis /></el-icon>
              </div>
              <div class="stat-content">
                <div class="stat-value">{{ filteredDataSources.length }}</div>
                <div class="stat-label">总数量</div>
              </div>
            </div>
            
            <div class="stat-card active">
              <div class="stat-icon">
                <el-icon><CircleCheck /></el-icon>
              </div>
              <div class="stat-content">
                <div class="stat-value">{{ onlineCount }}</div>
                <div class="stat-label">在线</div>
              </div>
            </div>
            
            <div class="stat-card inactive">
              <div class="stat-icon">
                <el-icon><CircleClose /></el-icon>
              </div>
              <div class="stat-content">
                <div class="stat-value">{{ offlineCount }}</div>
                <div class="stat-label">离线</div>
              </div>
            </div>
          </div>
        </div>
          
        <!-- 数据源类型分布 -->
        <div class="datasource-section">
          <h3 class="section-title">类型分布</h3>
          <div class="datasource-list">
            <div 
              v-for="(count, type) in dataSourceTypeCount" 
              :key="type" 
              class="datasource-item"
              :class="{ active: selectedTypeFilter === type }"
              @click="filterByType(type)"
            >
              <div class="datasource-info">
                <el-tag size="small" type="info">{{ type }}</el-tag>
                <span class="datasource-count">{{ count }} 个</span>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 数据源列表 -->
        <div class="datasource-list-section">
          <h3 class="section-title">数据源列表</h3>
          <div class="datasource-grid" v-loading="loading">
            <div 
              v-for="datasource in filteredDataSources" 
              :key="datasource?.id || Math.random()"
              class="datasource-card"
              :class="{ active: selectedDataSource?.id === datasource?.id }"
              @click="selectDataSource(datasource)"
            >
              <div class="datasource-header">
                <div class="datasource-icon">
                  <el-icon><DataAnalysis /></el-icon>
                </div>
                <div class="datasource-status">
                  <el-tag 
                    :type="datasource?.status === 'online' ? 'success' : 'danger'" 
                    size="small"
                  >
                    {{ datasource?.status === 'online' ? '在线' : '离线' }}
                  </el-tag>
                </div>
              </div>
                  
              <div class="datasource-content">
                <h4 class="datasource-name">{{ datasource?.name || '' }}</h4>
                <p class="datasource-description">{{ datasource?.type || '' }} 数据库</p>
                
                <div class="datasource-meta">
                  <div class="meta-item">
                    <el-icon><Monitor /></el-icon>
                    <span>{{ datasource?.host }}:{{ datasource?.port }}</span>
                  </div>
                  <div class="meta-item">
                    <el-icon><Calendar /></el-icon>
                    <span>{{ formatDate(datasource?.createdAt) }}</span>
                  </div>
                </div>
                
                <div class="datasource-type">
                  <el-tag 
                    :type="getTypeTag(datasource?.type)" 
                    size="small"
                  >
                    {{ datasource?.type || '' }}
                  </el-tag>
                </div>
              </div>
            </div>
          </div>
          
          <el-empty v-if="!loading && filteredDataSources.length === 0" description="暂无数据源">
          </el-empty>
        </div>
      </div>

      <!-- 右侧：数据源详情 -->
      <div class="right-panel" v-if="selectedDataSource">
        <!-- Tab导航栏 -->
        <div class="detail-tabs-header">
          <el-tabs v-model="activeTab" @tab-change="handleTabChange" class="detail-tabs-nav">
            <el-tab-pane label="基本信息" name="details"></el-tab-pane>
            <el-tab-pane label="数据表列表" name="tables"></el-tab-pane>
          </el-tabs>
        </div>

        <!-- Tab内容区域 -->
        <div class="detail-content-wrapper">
          <!-- 基本信息内容 -->
          <div v-if="activeTab === 'details'" class="tab-content">
            <div class="detail-header">
              <div class="detail-title">
                <h2>{{ selectedDataSource?.name }}</h2>
                <el-tag 
                  :type="selectedDataSource?.status === 'online' ? 'success' : 'danger'"
                >
                  {{ selectedDataSource?.status === 'online' ? '在线' : '离线' }}
                </el-tag>
              </div>
              
              <div class="detail-actions">
                <el-button size="small" @click="editDataSource(selectedDataSource)">
                  <el-icon><Edit /></el-icon>
                  编辑
                </el-button>
                <el-button size="small" type="success" @click="testConnection(selectedDataSource)">
                  <el-icon><Connection /></el-icon>
                  测试连接
                </el-button>
                <el-dropdown @command="handleCommand">
                  <el-button size="small">
                    更多操作<el-icon class="el-icon--right"><ArrowDown /></el-icon>
                  </el-button>
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item 
                        :command="`toggle-${selectedDataSource?.id}`"
                        :icon="selectedDataSource?.status === 'online' ? 'CircleClose' : 'CircleCheck'"
                      >
                        {{ selectedDataSource?.status === 'online' ? '设为离线' : '设为在线' }}
                      </el-dropdown-item>
                      <el-dropdown-item 
                        :command="`delete-${selectedDataSource?.id}`"
                        :icon="'Delete'"
                        divided
                      >
                        删除
                      </el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
              </div>
            </div>
                
            <div class="detail-content">
              <el-descriptions :column="1" border>
                <el-descriptions-item label="数据源ID">
                  {{ selectedDataSource?.id }}
                </el-descriptions-item>
                <el-descriptions-item label="数据源名称">
                  {{ selectedDataSource?.name }}
                </el-descriptions-item>
                <el-descriptions-item label="数据源类型">
                  <el-tag :type="getTypeTag(selectedDataSource?.type)">{{ selectedDataSource?.type }}</el-tag>
                </el-descriptions-item>
                <el-descriptions-item label="主机地址">
                  {{ getDisplayValue(selectedDataSource, 'host') }}
                </el-descriptions-item>
                <el-descriptions-item label="端口">
                  {{ getDisplayValue(selectedDataSource, 'port') }}
                </el-descriptions-item>
                <el-descriptions-item label="数据库名称">
                  {{ getDisplayValue(selectedDataSource, 'databaseName') }}
                </el-descriptions-item>
                <el-descriptions-item label="用户名">
                  {{ getDisplayValue(selectedDataSource, 'username') }}
                </el-descriptions-item>
                <el-descriptions-item label="创建时间">
                  {{ formatDate(selectedDataSource?.createdAt) }}
                </el-descriptions-item>
                <el-descriptions-item label="状态">
                  <el-tag :type="selectedDataSource?.status === 'online' ? 'success' : 'danger'">
                    {{ selectedDataSource?.status === 'online' ? '在线' : '离线' }}
                  </el-tag>
                </el-descriptions-item>
              </el-descriptions>
            </div>
          </div>
          
          <!-- 数据表列表内容 -->
          <div v-if="activeTab === 'tables'" class="tab-content">
            <div class="detail-content">
              <div class="table-search-container">
                <el-input
                  v-model="tableSearchKeyword"
                  placeholder="搜索表名..."
                  prefix-icon="Search"
                  clearable
                  style="max-width: 300px; margin-bottom: 15px;"
                />
              </div>
              
              <el-table
                :data="filteredTables"
                style="width: 100%"
                v-loading="loadingTables"
                size="small"
              >
                <el-table-column prop="name" label="表名" />
                <el-table-column prop="description" label="描述" />
                <el-table-column label="操作" width="200">
                  <template #default="{ row }">
                    <el-button size="small" @click="viewTableFields(row)">
                      <el-icon><View /></el-icon>
                      查看字段
                    </el-button>
                    <el-button size="small" type="primary" @click="createDataSetFromTable(row)">
                      <el-icon><Plus /></el-icon>
                      创建数据集
                    </el-button>
                  </template>
                </el-table-column>
              </el-table>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧空状态 -->
      <div class="right-panel-empty" v-else>
        <el-empty description="请选择一个数据源查看详情">
          <el-button type="primary" @click="showAddDataSource = true">创建新数据源</el-button>
        </el-empty>
      </div>
    </div>

    <!-- 字段查看对话框 -->
    <el-dialog
      v-model="showFieldsDialog"
      :title="`表 ${selectedTable?.name || ''} 的字段信息`"
      width="70%"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
      :show-close="true"
      destroy-on-close
    >
      <div v-loading="loadingFields">
        <div v-if="selectedTable?.description" class="table-description" style="margin-bottom: 15px;">
          <el-text type="info">{{ selectedTable.description }}</el-text>
        </div>
        
        <el-table
          :data="fields"
          style="width: 100%"
          border
          stripe
          highlight-current-row
          height="400"
        >
          <el-table-column prop="name" label="字段名" width="180" />
          <el-table-column prop="dataType" label="数据类型" width="120" />
          <el-table-column prop="isPrimary" label="主键" width="80" align="center">
            <template #default="{ row }">
              <el-tag v-if="row.isPrimary" type="danger" size="small">是</el-tag>
              <span v-else>-</span>
            </template>
          </el-table-column>
          <el-table-column prop="description" label="描述" show-overflow-tooltip />
        </el-table>
      </div>
      
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="showFieldsDialog = false">关闭</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 新建数据源对话框 -->
    <DataSourceForm
      v-model="showAddDataSource"
      :data-source="editingDataSource"
      @success="handleDataSourceSuccess"
    />

    <!-- 创建文件夹对话框 -->
    <el-dialog v-model="showCreateFolderDialog" title="创建文件夹" width="400px">
      <el-form :model="folderForm" label-width="80px">
        <el-form-item label="文件夹名">
          <el-input v-model="folderForm.name" placeholder="请输入文件夹名称" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreateFolderDialog = false">取消</el-button>
        <el-button type="primary" @click="createFolder">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { DataSource, TableInfo, FieldInfo } from '@/types/dataManagement'
import { dataSourceApi } from '@/api/dataSource'
import DataSourceForm from '@/components/datasource/DataSourceForm.vue'
import {
  Search,
  SortUp,
  SortDown,
  Edit,
  View,
  ArrowDown,
  Connection,
  DataAnalysis,
  CircleCheck,
  CircleClose,
  Monitor,
  Calendar,
  Plus
} from '@element-plus/icons-vue'

// 响应式数据
const dataSources = ref<DataSource[]>([])
const selectedDataSource = ref<DataSource | null>(null)
const selectedTable = ref<TableInfo | null>(null)
const tables = ref<TableInfo[]>([])
const fields = ref<FieldInfo[]>([])

// 搜索和排序
const searchKeyword = ref('')
const tableSearchKeyword = ref('')
const sortType = ref<'name' | 'time'>('name')
const sortOrder = ref<'asc' | 'desc'>('desc')
const selectedTypeFilter = ref<string | null>(null)

// 加载状态
const loading = ref(false)
const loadingTables = ref(false)
const loadingFields = ref(false)

// 对话框状态
const showAddDataSource = ref(false)
const showCreateFolderDialog = ref(false)
const showFieldsDialog = ref(false)
const editingDataSource = ref<DataSource | null>(null)

// 表单数据
const folderForm = reactive({
  name: ''
})

// 当前激活的标签页
const activeTab = ref('details')

// 计算属性 - 过滤后的数据源
const filteredDataSources = computed(() => {
  const sources = Array.isArray(dataSources.value) ? dataSources.value : []
  let result = sources

  // 按类型过滤
  if (selectedTypeFilter.value) {
    result = result.filter(ds => ds && ds.type === selectedTypeFilter.value)
  }

  // 按关键词过滤
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    result = result.filter(ds => 
      ds && (
        ds.name?.toLowerCase().includes(keyword) ||
        ds.description?.toLowerCase().includes(keyword) ||
        ds.type?.toLowerCase().includes(keyword)
      )
    )
  }

  return result
})

const onlineCount = computed(() => {
  const sources = Array.isArray(filteredDataSources.value) ? filteredDataSources.value : []
  return sources.filter(ds => ds && ds.status === 'online').length
})

const offlineCount = computed(() => {
  const sources = Array.isArray(filteredDataSources.value) ? filteredDataSources.value : []
  return sources.filter(ds => ds && ds.status === 'offline').length
})

const dataSourceTypeCount = computed(() => {
  if (!dataSources.value) return {}
  
  const counts: Record<string, number> = {}
  dataSources.value.forEach(ds => {
    if (ds && ds.type) {
      counts[ds.type] = (counts[ds.type] || 0) + 1
    }
  })
  return counts
})

const filteredTables = computed(() => {
  if (!tables.value) return []
  
  let result = tables.value
  if (tableSearchKeyword.value) {
    const keyword = tableSearchKeyword.value.toLowerCase()
    result = result.filter(table => 
      table && (
        table.name?.toLowerCase().includes(keyword) ||
        table.description?.toLowerCase().includes(keyword)
      )
    )
  }
  
  return result
})

// 类型过滤方法
const filterByType = (type: string) => {
  if (selectedTypeFilter.value === type) {
    selectedTypeFilter.value = null
  } else {
    selectedTypeFilter.value = type
  }
}

const clearTypeFilter = () => {
  selectedTypeFilter.value = null
}

// 方法
const loadDataSources = async () => {
  loading.value = true
  try {
    const result = await dataSourceApi.getAllDataSources()
    console.log('Loaded data sources:', result)
    dataSources.value = Array.isArray(result) ? result.filter(ds => ds && typeof ds === 'object') : []
  } catch (error) {
    console.error('加载数据源失败:', error)
    ElMessage.error('加载数据源失败')
    dataSources.value = []
  } finally {
    loading.value = false
  }
}

const sortBy = (type: 'name' | 'time') => {
  if (sortType.value === type) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortType.value = type
    sortOrder.value = 'asc'
  }
  
  dataSources.value.sort((a, b) => {
    let comparison = 0
    if (type === 'name') {
      comparison = (a?.name || '').localeCompare(b?.name || '')
    } else {
      const dateA = a?.createdAt ? new Date(a.createdAt).getTime() : 0
      const dateB = b?.createdAt ? new Date(b.createdAt).getTime() : 0
      comparison = dateA - dateB
    }
    return sortOrder.value === 'asc' ? comparison : -comparison
  })
}

const selectDataSource = (datasource: DataSource | null) => {
  if (!datasource) return
  selectedDataSource.value = datasource
  selectedTable.value = null
  loadTables(datasource.id)
  if (activeTab.value !== 'details' && activeTab.value !== 'tables') {
    activeTab.value = 'details'
  }
}

const loadTables = async (sourceId: number) => {
  try {
    loadingTables.value = true
    const dataSource = dataSources.value.find(ds => ds?.id === sourceId)
    if (!dataSource) {
      ElMessage.error('数据源未找到')
      return
    }
    
    const tablesData = await dataSourceApi.getTablesBySourceId(sourceId, dataSource)
    tables.value = tablesData
    ElMessage.success('获取表列表成功')
  } catch (error) {
    console.error('获取表列表错误:', error)
    ElMessage.error('获取表列表失败：' + (error as Error).message)
  } finally {
    loadingTables.value = false
  }
}

const viewTableFields = async (table: TableInfo) => {
  if (!selectedDataSource.value) return
  
  selectedTable.value = table
  showFieldsDialog.value = true
  loadingFields.value = true
  
  try {
    fields.value = await dataSourceApi.getFieldsByTable(
      selectedDataSource.value.id, 
      table.name,
      selectedDataSource.value
    )
  } catch (error) {
    ElMessage.error('加载字段信息失败')
    console.error('Failed to load table fields:', error)
  } finally {
    loadingFields.value = false
  }
}

const createDataSetFromTable = (table: TableInfo) => {
  ElMessage.info(`将为表 ${table.name} 创建数据集`)
}

const editDataSource = (dataSource: DataSource | null) => {
  if (!dataSource) return
  editingDataSource.value = dataSource
  showAddDataSource.value = true
}

const testConnection = async (dataSource: DataSource | null) => {
  if (!dataSource) return
  
  try {
    const result = await dataSourceApi.testConnection({
      url: dataSource.url,
      username: dataSource.username,
      password: dataSource.password,
      port: dataSource.port,
      database: dataSource.database,
      type: dataSource.type as 'mysql' | 'postgresql' | 'sqlite' | 'oracle' | 'sqlserver'
    })
    
    if (result.code === 200) {
      ElMessage.success('连接测试成功')
    } else {
      ElMessage.error('连接测试失败')
    }
  } catch (error) {
    ElMessage.error('连接测试失败')
    console.error(error)
  }
}

const toggleDataSourceStatus = async (dataSource: DataSource | null) => {
  if (!dataSource) return
  
  try {
    const newStatus = dataSource.status === 'online' ? 'offline' : 'online'
    await dataSourceApi.updateDataSourceStatus(dataSource.id, newStatus)
    dataSource.status = newStatus
    ElMessage.success(`数据源已设为${newStatus === 'online' ? '在线' : '离线'}`)
  } catch (error) {
    ElMessage.error('状态更新失败')
    console.error(error)
  }
}

const confirmDelete = async (id: number) => {
  try {
    await ElMessageBox.confirm('确定要删除这个数据源吗？', '确认删除', {
      type: 'warning'
    })
    
    await dataSourceApi.deleteDataSource(id)
    ElMessage.success('删除成功')
    loadDataSources()
    
    if (selectedDataSource.value?.id === id) {
      selectedDataSource.value = null
      selectedTable.value = null
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
      console.error(error)
    }
  }
}

const handleDataSourceSuccess = () => {
  showAddDataSource.value = false
  editingDataSource.value = null
  loadDataSources()
}

const createFolder = () => {
  ElMessage.info('文件夹功能待实现')
  showCreateFolderDialog.value = false
  folderForm.name = ''
}

const formatDate = (dateString?: string) => {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleString()
}

const getDisplayValue = (datasource: DataSource | null, key: string) => {
  if (!datasource) return '-'
  
  if (key === 'database') return datasource.database || '-'
  if (key === 'url') return datasource.url || '-'
  if (key === 'host') return datasource.host || '-'
  if (key === 'port') return datasource.port || '-'
  if (key === 'databaseName') return datasource.databaseName || '-'
  if (key === 'username') return datasource.username || '-'
  
  if (datasource.url) {
    try {
      const urlParts = datasource.url.split(':')
      if (key === 'host') return urlParts[1]?.split('//')[1] || '-'
      if (key === 'port') return Number(urlParts[2]?.split('/')[0]) || '-'
    } catch (error) {
      console.error('解析URL失败:', error)
    }
  }
  
  return '-'
}

const handleTabChange = (tab: string) => {
  if (tab === 'tables' && selectedDataSource.value) {
    loadTables(selectedDataSource.value.id)
  }
}

const getTypeTag = (type: string | undefined | null) => {
  if (!type) return 'info'
  switch (type.toLowerCase()) {
    case 'mysql':
      return 'success'
    case 'postgresql':
      return 'primary'
    case 'oracle':
      return 'warning'
    case 'sqlserver':
      return 'info'
    default:
      return 'info'
  }
}

const handleCommand = (command: string) => {
  const [action, id] = command.split('-')
  const dataSourceId = Number(id)
  
  switch (action) {
    case 'toggle':
      toggleDataSourceStatus(selectedDataSource.value)
      break
    case 'delete':
      confirmDelete(dataSourceId)
      break
  }
}

// 生命周期
onMounted(() => {
  loadDataSources()
})
</script>

<style scoped lang="scss">
// 样式保持不变 - 这里只是修复了模板结构问题
.datasource-manage {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f5f7fa;
  overflow: hidden;
}

.page-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 20px 32px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  
  .header-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    max-width: 1400px;
    margin: 0 auto;
  }

  .header-left {
    .page-title {
      margin: 0 0 6px 0;
      font-size: 24px;
      font-weight: 700;
      display: flex;
      align-items: center;
      gap: 12px;
      
      .el-icon {
        font-size: 28px;
      }
    }
    
    .page-description {
      margin: 0;
      font-size: 14px;
      opacity: 0.9;
      font-weight: 300;
    }
  }

  .header-actions {
    .el-button {
      background: rgba(255, 255, 255, 0.2);
      border: 1px solid rgba(255, 255, 255, 0.3);
      color: white;
      backdrop-filter: blur(10px);
      
      &:hover {
        background: rgba(255, 255, 255, 0.3);
        border-color: rgba(255, 255, 255, 0.5);
      }
    }
  }
}

.main-container {
  flex: 1;
  display: flex;
  min-height: 0;
  max-width: 1400px;
  margin: 0 auto;
  width: 100%;
  gap: 20px;
  padding: 20px 32px;
}

.left-panel {
  width: 380px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-height: 0;
}

.search-section {
  background: white;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.stats-section {
  background: white;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.stats-cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}

.stat-card {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 12px;
  display: flex;
  align-items: center;
  gap: 10px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  
  .stat-icon {
    width: 36px;
    height: 36px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    
    .el-icon {
      font-size: 18px;
    }
  }
  
  .stat-content {
    flex: 1;
    
    .stat-value {
      font-size: 18px;
      font-weight: 700;
      line-height: 1;
      margin-bottom: 2px;
    }
    
    .stat-label {
      font-size: 11px;
      color: #666;
      font-weight: 500;
    }
  }
  
  &.total .stat-icon {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
  }
  
  &.active .stat-icon {
    background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
    color: white;
  }
  
  &.inactive .stat-icon {
    background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
    color: white;
  }
}

.datasource-section {
  background: white;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.datasource-list-section {
  flex: 1;
  background: white;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  display: flex;
  flex-direction: column;
  min-height: 0;
  max-height: 400px;
}

.datasource-card {
  background: white;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  padding: 12px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  margin-bottom: 8px;
  
  &:hover {
    border-color: #409eff;
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(64, 158, 255, 0.15);
  }
  
  &.active {
    border-color: #409eff;
    background: linear-gradient(135deg, #ecf5ff 0%, #e1f0ff 100%);
    box-shadow: 0 2px 8px rgba(64, 158, 255, 0.2);
  }
}

.right-panel {
  flex: 1;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.right-panel-empty {
  flex: 1;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  display: flex;
  align-items: center;
  justify-content: center;
}
</style> 