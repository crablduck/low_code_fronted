<template>
  <div class="datasource-manage">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <div class="header-left">
          <h1 class="page-title">
            <el-icon class="icon-database"><DataBoard /></el-icon>
            数据源管理
          </h1>
          <p class="page-description">管理和配置系统中的数据源连接</p>
        </div>
        <div class="header-actions">
          <el-button type="primary" size="large" @click="showCreateDialog = true">
            <el-icon><Plus /></el-icon>
            创建数据源
          </el-button>
        </div>
      </div>
    </div>

    <!-- 主要内容区域 -->
    <div class="main-container">
      <!-- 左侧：数据源列表 -->
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
            <div class="filter-controls">
              <el-select v-model="selectedTypeFilter" placeholder="选择类型" clearable @change="clearTypeFilter" style="width: 140px;" size="small">
                <el-option 
                  v-for="(count, type) in dataSourceTypeCount" 
                  :key="type"
                  :label="`${getTypeLabel(type)} (${count})`"
                  :value="type"
                />
              </el-select>
              
              <el-button-group size="small">
                <el-button 
                  :type="sortBy === 'name' ? 'primary' : ''" 
                  @click="sortDataSources('name')"
                >
                  名称
                  <el-icon v-if="sortBy === 'name'">
                    <SortUp v-if="sortOrder === 'asc'" />
                    <SortDown v-else />
                  </el-icon>
                </el-button>
                <el-button 
                  :type="sortBy === 'id' ? 'primary' : ''" 
                  @click="sortDataSources('id')"
                >
                  时间
                  <el-icon v-if="sortBy === 'id'">
                    <SortUp v-if="sortOrder === 'asc'" />
                    <SortDown v-else />
                  </el-icon>
                </el-button>
              </el-button-group>
            </div>
          </div>
          
          <!-- 统计信息 -->
          <div class="stats-bar">
            <div class="stat-item">
              <span class="stat-label">总计：</span>
              <span class="stat-value">{{ totalCount }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">在线：</span>
              <span class="stat-value success">{{ onlineCount }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">离线：</span>
              <span class="stat-value danger">{{ filteredDataSources.length - onlineCount }}</span>
            </div>
          </div>
        </div>

        <!-- 数据源列表 -->
        <div class="datasource-list-section">
          <div class="list-header">
            <h3 class="section-title">数据源列表</h3>
            <el-text type="info" size="small">{{ filteredDataSources.length }} 个数据源</el-text>
          </div>
          
          <div class="datasource-list" v-loading="loading">
            <div 
              v-for="dataSource in filteredDataSources" 
              :key="dataSource.id"
              class="datasource-item"
              :class="{ active: selectedDataSource?.id === dataSource.id }"
              @click="selectDataSource(dataSource)"
            >
              <div class="datasource-info">
                <div class="datasource-header">
                  <div class="datasource-icon">
                    <el-icon>
                      <component :is="getTypeIcon(dataSource.type)" />
                    </el-icon>
                  </div>
                  <div class="datasource-main">
                    <h4 class="datasource-name">{{ dataSource.name }}</h4>
                    <p class="datasource-description">{{ getConnectionString(dataSource) }}</p>
                  </div>
                  <div class="datasource-status">
                    <el-tag 
                      :type="getConnectionStatus(dataSource) === 'online' ? 'success' : 'danger'" 
                      size="small"
                    >
                      {{ getConnectionStatus(dataSource) === 'online' ? '在线' : '离线' }}
                    </el-tag>
                  </div>
                </div>
                
                <div class="datasource-meta">
                  <div class="meta-item">
                    <el-tag size="small" :type="getTypeTagType(dataSource.type)">
                      {{ getTypeLabel(dataSource.type) }}
                    </el-tag>
                  </div>
                  <div class="meta-item">
                    <el-icon><Link /></el-icon>
                    <span>{{ dataSource.database }}</span>
                  </div>
                  <div class="meta-item">
                    <el-icon><User /></el-icon>
                    <span>{{ dataSource.username }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <el-empty v-if="!loading && filteredDataSources.length === 0" description="暂无数据源" />
        </div>
      </div>

      <!-- 右侧：数据源详情 -->
      <div class="right-panel" v-if="selectedDataSource">
        <!-- Tab导航栏 -->
        <div class="detail-tabs-header">
          <el-tabs v-model="activeTab" @tab-change="handleTabChange" class="detail-tabs-nav">
            <el-tab-pane label="基本信息" name="details"></el-tab-pane>
            <el-tab-pane label="数据字段" name="fields"></el-tab-pane>
            <el-tab-pane label="数据预览" name="preview"></el-tab-pane>
          </el-tabs>
        </div>

        <!-- Tab内容区域 -->
        <div class="detail-content-wrapper">
          <!-- 基本信息 -->
          <div v-if="activeTab === 'details'" class="tab-content">
            <div class="detail-header">
              <div class="detail-title">
                <h2>{{ selectedDataSource.name }}</h2>
                <el-tag 
                  :type="getConnectionStatus(selectedDataSource) === 'online' ? 'success' : 'danger'"
                >
                  {{ getConnectionStatus(selectedDataSource) === 'online' ? '在线' : '离线' }}
                </el-tag>
              </div>
              
              <div class="detail-actions">
                <el-button size="small" @click="editDataSource(selectedDataSource)">
                  <el-icon><Edit /></el-icon>
                  编辑
                </el-button>
                <el-button size="small" type="info" @click="testConnection(selectedDataSource)" :loading="testing">
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
                        :command="`duplicate-${selectedDataSource.id}`"
                        :icon="'CopyDocument'"
                      >
                        复制
                      </el-dropdown-item>
                      <el-dropdown-item 
                        :command="`delete-${selectedDataSource.id}`"
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
                <el-descriptions-item label="数据源名称">
                  {{ selectedDataSource.name }}
                </el-descriptions-item>
                <el-descriptions-item label="数据源类型">
                  <el-tag :type="getTypeTagType(selectedDataSource.type)">
                    {{ getTypeLabel(selectedDataSource.type) }}
                  </el-tag>
                </el-descriptions-item>
                <el-descriptions-item label="连接状态">
                  <el-tag :type="getConnectionStatus(selectedDataSource) === 'online' ? 'success' : 'danger'">
                    {{ getConnectionStatus(selectedDataSource) === 'online' ? '在线' : '离线' }}
                  </el-tag>
                </el-descriptions-item>
                <el-descriptions-item label="主机地址">
                  {{ selectedDataSource.url }}:{{ selectedDataSource.port }}
                </el-descriptions-item>
                <el-descriptions-item label="数据库">
                  {{ selectedDataSource.database }}
                </el-descriptions-item>
                <el-descriptions-item label="用户名">
                  {{ selectedDataSource.username }}
                </el-descriptions-item>
              </el-descriptions>

              <!-- 连接测试结果 -->
              <div v-if="testResult" class="test-result" :class="testResult.success ? 'success' : 'error'">
                <div class="result-icon">
                  <el-icon>
                    <CircleCheck v-if="testResult.success" />
                    <CircleClose v-else />
                  </el-icon>
                </div>
                <div class="result-content">
                  <h4>{{ testResult.success ? '连接成功' : '连接失败' }}</h4>
                  <p>{{ testResult.message }}</p>
                  <small>{{ formatDate(testResult.timestamp) }}</small>
                </div>
              </div>
            </div>
          </div>

          <!-- 数据字段 -->
          <div v-if="activeTab === 'fields'" class="tab-content">
            <div class="detail-content">
              <div class="fields-header">
                <h4>表结构</h4>
                <el-button size="small" @click="loadTables" :loading="loadingTables">
                  <el-icon><Refresh /></el-icon>
                  刷新
                </el-button>
              </div>
              
              <div class="tables-section" v-loading="loadingTables">
                <div v-if="tables.length > 0" class="tables-list">
                  <el-collapse v-model="activeTableName">
                    <el-collapse-item 
                      v-for="table in tables" 
                      :key="table.name"
                      :title="table.name"
                      :name="table.name"
                    >
                      <template #title>
                        <div class="table-header">
                          <el-icon><Grid /></el-icon>
                          <span>{{ table.name }}</span>
                          <el-tag size="small" type="info">表</el-tag>
                        </div>
                      </template>
                      
                      <div class="table-fields" v-loading="loadingFields[table.name]">
                        <el-button 
                          size="small" 
                          @click="loadTableFields(table.name)"
                          v-if="!tableFields[table.name]"
                        >
                          加载字段信息
                        </el-button>
                        
                        <div v-if="tableFields[table.name]" class="fields-table-container">
                          <el-table 
                            :data="tableFields[table.name]"
                            size="small"
                            class="fields-table"
                            :header-cell-style="{ 
                              background: '#f8fafc', 
                              color: '#374151',
                              fontWeight: '600',
                              fontSize: '13px'
                            }"
                          >
                            <el-table-column prop="columnName" label="字段名" min-width="140">
                              <template #default="{ row }">
                                <div class="field-name">
                                  <el-icon v-if="row.isPrimaryKey" class="primary-key-icon">
                                    <Key />
                                  </el-icon>
                                  <span>{{ row.columnName }}</span>
                                </div>
                              </template>
                            </el-table-column>
                            <el-table-column prop="columnType" label="数据类型" min-width="100">
                              <template #default="{ row }">
                                <el-tag 
                                  :type="getColumnTypeTag(row.columnType)" 
                                  size="small"
                                  effect="light"
                                >
                                  {{ row.columnType }}
                                </el-tag>
                              </template>
                            </el-table-column>
                            <el-table-column prop="isPrimaryKey" label="主键" width="80" align="center">
                              <template #default="{ row }">
                                <el-tag 
                                  v-if="row.isPrimaryKey" 
                                  type="danger" 
                                  size="small"
                                  effect="light"
                                >
                                  主键
                                </el-tag>
                                <span v-else class="no-primary">-</span>
                              </template>
                            </el-table-column>
                            <el-table-column prop="columnComment" label="备注" min-width="150">
                              <template #default="{ row }">
                                <span class="column-comment">
                                  {{ row.columnComment || '无备注' }}
                                </span>
                              </template>
                            </el-table-column>
                          </el-table>
                        </div>
                      </div>
                    </el-collapse-item>
                  </el-collapse>
                </div>
                
                <el-empty v-else-if="!loadingTables" description="暂无表信息" />
              </div>
            </div>
          </div>

          <!-- 数据预览 -->
          <div v-if="activeTab === 'preview'" class="tab-content">
            <div class="detail-content">
              <div class="preview-header">
                <h4>数据预览</h4>
                <div class="preview-controls">
                  <el-select v-model="selectedTable" placeholder="选择表" style="width: 200px;" @change="loadPreviewData">
                    <el-option
                      v-for="table in tables"
                      :key="table.name"
                      :label="table.name"
                      :value="table.name"
                    />
                  </el-select>
                  <el-button size="small" @click="loadPreviewData" :loading="loadingPreview">
                    <el-icon><Refresh /></el-icon>
                    刷新
                  </el-button>
                </div>
              </div>
              
              <el-table
                :data="previewData.data"
                style="width: 100%"
                v-loading="loadingPreview"
                max-height="400"
                size="small"
              >
                <el-table-column
                  v-for="column in previewData.columns"
                  :key="column"
                  :prop="column"
                  :label="column"
                  show-overflow-tooltip
                  width="120"
                />
              </el-table>
              
              <div class="preview-footer">
                <el-text type="info">共 {{ previewData.totalCount }} 条记录，显示前 100 条</el-text>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 无选中数据源时的提示 -->
      <div class="right-panel-empty" v-else>
        <div class="empty-content">
          <div class="empty-icon">
            <el-icon><DataBoard /></el-icon>
          </div>
          <h3 class="empty-title">选择数据源</h3>
          <p class="empty-description">从左侧列表中选择一个数据源来查看详细信息，包括基本信息、数据字段和数据预览。</p>
          <div class="empty-actions">
            <el-button type="primary" size="large" @click="showCreateDialog = true">
              <el-icon><Plus /></el-icon>
              创建新数据源
            </el-button>
          </div>
          
          <div class="quick-features">
            <div class="feature-item">
              <el-icon><Edit /></el-icon>
              <span>管理数据源配置</span>
            </div>
            <div class="feature-item">
              <el-icon><Connection /></el-icon>
              <span>测试连接状态</span>
            </div>
            <div class="feature-item">
              <el-icon><Grid /></el-icon>
              <span>浏览数据字段</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 创建/编辑数据源对话框 -->
    <DataSourceForm
      v-model="showCreateDialog"
      :data-source="currentDataSource"
      @success="handleDialogSuccess"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 
  DataBoard, Plus, Search, Edit, Delete, Connection, Refresh, 
  CircleCheck, CircleClose, SortUp, SortDown, Link, User,
  CopyDocument, Grid, Key, ArrowDown
} from '@element-plus/icons-vue'
import DataSourceForm from '../components/datasource/DataSourceForm.vue'
import { dataSourceApi } from '@/api/dataSource'
import { useDatasourceStore } from '@/stores/datasource'
import type { DataSource, TableInfo, FieldInfo } from '@/shared/types/dataManagement'

// 使用数据源 store
const datasourceStore = useDatasourceStore()

// 响应式数据
const loading = ref(false)
const searchKeyword = ref('')
const selectedTypeFilter = ref('')
const sortBy = ref('name')
const sortOrder = ref<'asc' | 'desc'>('asc')
const showCreateDialog = ref(false)
const currentDataSource = ref<DataSource | null>(null)
const selectedDataSource = ref<DataSource | null>(null)
const activeTab = ref('details')

// 分页数据
const totalCount = ref(0)
const currentPage = ref(0)
const pageSize = ref(10)

// 测试连接相关
const testing = ref(false)
const testResult = ref<any>(null)

// 表结构相关
const loadingTables = ref(false)
const tables = ref<TableInfo[]>([])
const activeTableName = ref<string[]>([])
const loadingFields = ref<Record<string, boolean>>({})
const tableFields = ref<Record<string, FieldInfo[]>>({})

// 数据预览相关
const loadingPreview = ref(false)
const selectedTable = ref('')
const previewData = ref<{
  columns: string[]
  data: any[]
  totalCount: number
}>({
  columns: [],
  data: [],
  totalCount: 0
})

// 计算属性
const filteredDataSources = computed(() => {
  // 确保数据源列表是数组
  let filtered = Array.isArray(datasourceStore.dataSources) ? datasourceStore.dataSources : []

  // 关键词搜索
  if (searchKeyword.value) {
    filtered = filtered.filter(ds => 
      ds.name.toLowerCase().includes(searchKeyword.value.toLowerCase()) ||
      (ds.url && ds.url.includes(searchKeyword.value)) ||
      (ds.database && ds.database.toLowerCase().includes(searchKeyword.value.toLowerCase()))
    )
  }

  // 类型筛选
  if (selectedTypeFilter.value) {
    filtered = filtered.filter(ds => ds.type === selectedTypeFilter.value)
  }

  // 排序
  filtered = [...filtered].sort((a, b) => {
    let aValue: any, bValue: any
    
    if (sortBy.value === 'name') {
      aValue = a.name.toLowerCase()
      bValue = b.name.toLowerCase()
    } else if (sortBy.value === 'id') {
      aValue = a.id
      bValue = b.id
    } else {
      return 0
    }

    if (aValue < bValue) return sortOrder.value === 'asc' ? -1 : 1
    if (aValue > bValue) return sortOrder.value === 'asc' ? 1 : -1
    return 0
  })

  return filtered
})

const onlineCount = computed(() => {
  const dataSources = Array.isArray(datasourceStore.dataSources) ? datasourceStore.dataSources : []
  return dataSources.filter(ds => getConnectionStatus(ds) === 'online').length
})

const dataSourceTypeCount = computed(() => {
  const count: Record<string, number> = {}
  const dataSources = Array.isArray(datasourceStore.dataSources) ? datasourceStore.dataSources : []
  dataSources.forEach(ds => {
    count[ds.type] = (count[ds.type] || 0) + 1
  })
  return count
})

// 方法
const loadDataSources = async () => {
  loading.value = true
  try {
    const response = await dataSourceApi.getAllDataSources()
    if (response.code === 200) {
      // 根据实际API返回的数据结构设置数据
      const data = response.data
      datasourceStore.setDataSources(data.content || [])
      totalCount.value = data.totalElements || 0
      currentPage.value = data.currentPage || 0
      pageSize.value = data.pageSize || 10
    }
  } catch (error) {
    console.error('加载数据源失败:', error)
    ElMessage.error('加载数据源失败')
  } finally {
    loading.value = false
  }
}

const sortDataSources = (field: string) => {
  if (sortBy.value === field) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortBy.value = field
    sortOrder.value = 'asc'
  }
}

const filterByType = (type: string) => {
  if (selectedTypeFilter.value === type) {
    selectedTypeFilter.value = ''
  } else {
    selectedTypeFilter.value = type
  }
}

const clearTypeFilter = () => {
  selectedTypeFilter.value = ''
}

const selectDataSource = (dataSource: DataSource) => {
  selectedDataSource.value = dataSource
  datasourceStore.selectDataSource(dataSource.id)
  activeTab.value = 'details'
  
  // 清空之前的数据
  tables.value = []
  tableFields.value = {}
  previewData.value = { columns: [], data: [], totalCount: 0 }
  selectedTable.value = ''
  testResult.value = null
}

const handleTabChange = (tabName: string) => {
  if (tabName === 'fields' && selectedDataSource.value) {
    loadTables()
  }
}

const testConnection = async (dataSource: DataSource) => {
  testing.value = true
  try {
    const result = await dataSourceApi.testConnection({
      url: dataSource.url || '',
      username: dataSource.username || '',
      password: dataSource.password || '',
      port: Number(dataSource.port) || 3306,
      database: dataSource.database || '',
      type: dataSource.type as any
    })
    
    testResult.value = {
      success: result.code === 200,
      message: result.message || (result.code === 200 ? '连接成功' : '连接失败'),
      timestamp: new Date().toISOString()
    }
    
    if (result.code === 200) {
      ElMessage.success('连接测试成功')
    } else {
      ElMessage.error('连接测试失败')
    }
  } catch (error) {
    console.error('连接测试失败:', error)
    testResult.value = {
      success: false,
      message: '连接测试异常',
      timestamp: new Date().toISOString()
    }
    ElMessage.error('连接测试失败')
  } finally {
    testing.value = false
  }
}

const loadTables = async () => {
  if (!selectedDataSource.value) return
  
  loadingTables.value = true
  try {
    const tableList = await dataSourceApi.getTablesBySourceId(
      selectedDataSource.value.id, 
      selectedDataSource.value
    )
    tables.value = tableList
  } catch (error) {
    console.error('加载表列表失败:', error)
    ElMessage.error('加载表列表失败')
  } finally {
    loadingTables.value = false
  }
}

const loadTableFields = async (tableName: string) => {
  if (!selectedDataSource.value) return
  
  loadingFields.value[tableName] = true
  try {
    const response = await dataSourceApi.getFieldsByTable(
      selectedDataSource.value.id, 
      tableName, 
      selectedDataSource.value
    )
    
    if (response.code === 200) {
      tableFields.value[tableName] = response.data || []
    } else {
      ElMessage.error('加载字段信息失败')
    }
  } catch (error) {
    console.error('加载字段信息失败:', error)
    ElMessage.error('加载字段信息失败')
  } finally {
    loadingFields.value[tableName] = false
  }
}

const loadPreviewData = async () => {
  if (!selectedDataSource.value || !selectedTable.value) return
  
  loadingPreview.value = true
  try {
    // 构造简单的SQL查询
    const sql = `SELECT * FROM ${selectedTable.value} LIMIT 100`
    
    // 这里需要调用数据预览API，暂时模拟数据
    const mockData = {
      columns: ['id', 'name', 'type', 'create_time'],
      data: [
        { id: 1, name: '示例数据1', type: 'A', create_time: '2024-01-01' },
        { id: 2, name: '示例数据2', type: 'B', create_time: '2024-01-02' },
      ],
      totalCount: 2
    }
    
    previewData.value = mockData
  } catch (error) {
    console.error('加载预览数据失败:', error)
    ElMessage.error('加载预览数据失败')
  } finally {
    loadingPreview.value = false
  }
}

const editDataSource = (dataSource: DataSource) => {
  currentDataSource.value = dataSource
  showCreateDialog.value = true
}

const handleCommand = (command: string) => {
  const [action, id] = command.split('-')
  
  if (action === 'duplicate') {
    duplicateDataSource(selectedDataSource.value!)
  } else if (action === 'delete') {
    deleteDataSource(selectedDataSource.value!)
  }
}

const duplicateDataSource = async (dataSource: DataSource) => {
  try {
    const newDataSource = {
      ...dataSource,
      name: `${dataSource.name} (副本)`,
      id: undefined
    } as any
    
    await dataSourceApi.createDataSource(newDataSource)
    ElMessage.success('数据源复制成功')
    loadDataSources()
  } catch (error) {
    console.error('复制数据源失败:', error)
    ElMessage.error('复制数据源失败')
  }
}

const deleteDataSource = async (dataSource: DataSource) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除数据源 "${dataSource.name}" 吗？此操作不可撤销。`,
      '确认删除',
      {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'warning',
        confirmButtonClass: 'el-button--danger'
      }
    )
    
    await dataSourceApi.deleteDataSource(dataSource.id)
    datasourceStore.removeDataSource(dataSource.id)
    
    if (selectedDataSource.value?.id === dataSource.id) {
      selectedDataSource.value = null
    }
    
    ElMessage.success('数据源删除成功')
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除数据源失败:', error)
      ElMessage.error('删除数据源失败')
    }
  }
}

const handleDialogSuccess = () => {
  showCreateDialog.value = false
  currentDataSource.value = null
  loadDataSources()
}

// 辅助方法
const getTypeLabel = (type: string) => {
  const labels: Record<string, string> = {
    mysql: 'MySQL',
    postgresql: 'PostgreSQL',
    oracle: 'Oracle',
    sqlserver: 'SQL Server',
    clickhouse: 'ClickHouse',
    sqlite: 'SQLite',
    mongodb: 'MongoDB',
    rest_api: 'REST API'
  }
  return labels[type] || type.toUpperCase()
}

const getTypeTagType = (type: string) => {
  const types: Record<string, string> = {
    mysql: 'primary',
    postgresql: 'success',
    oracle: 'warning',
    sqlserver: 'info',
    clickhouse: 'danger',
    sqlite: 'default',
    mongodb: 'success',
    rest_api: 'info'
  }
  return types[type] || 'default'
}

const getTypeIcon = (type: string) => {
  // 返回图标组件名，这里统一使用 DataBoard
  return 'DataBoard'
}

const getConnectionString = (dataSource: DataSource) => {
  return `${dataSource.url}:${dataSource.port}`
}

const getConnectionStatus = (dataSource: DataSource) => {
  // 模拟连接状态，实际应该根据最后一次连接测试结果
  return Math.random() > 0.3 ? 'online' : 'offline'
}

const formatDate = (dateStr?: string) => {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleString('zh-CN')
}

const getColumnTypeTag = (columnType: string) => {
  const type = columnType?.toUpperCase() || ''
  if (type.includes('INT') || type.includes('DECIMAL') || type.includes('FLOAT') || type.includes('DOUBLE')) {
    return 'warning'
  } else if (type.includes('VARCHAR') || type.includes('CHAR') || type.includes('TEXT')) {
    return 'primary'
  } else if (type.includes('DATE') || type.includes('TIME')) {
    return 'success'
  } else if (type.includes('BLOB') || type.includes('BINARY')) {
    return 'info'
  }
  return ''
}

// 生命周期
onMounted(() => {
  loadDataSources()
})
</script>

<style scoped>
/* 页面基础样式 - 确保左右布局 */
.datasource-manage {
  padding: 20px;
  background: #f8fafc;
  min-height: 100vh;
  width: 100%;
  box-sizing: border-box;
  overflow-x: auto;
}

/* 页面头部样式 */
.page-header {
  margin-bottom: 24px;
  padding: 24px;
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.header-left {
  flex: 1;
}

.page-title {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 0 0 8px 0;
  font-size: 28px;
  font-weight: 600;
  color: #409EFF;
}

.icon-database {
  font-size: 32px;
}

.page-description {
  margin: 0;
  color: #6b7280;
  font-size: 16px;
}

.header-actions {
  display: flex;
  gap: 12px;
}

/* 主容器样式 - 左右布局 */
.main-container {
  display: flex;
  gap: 20px;
  min-height: calc(100vh - 200px);
  align-items: flex-start;
  width: 100%;
}

/* 左侧面板 - 固定宽度 */
.left-panel {
  flex: 0 0 450px;
  width: 450px;
  min-width: 450px;
  max-width: 450px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  height: fit-content;
}

/* 右侧面板 - 自适应宽度 */
.right-panel {
  flex: 1;
  min-width: 600px;
  width: calc(100% - 470px);
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  min-height: 600px;
}

/* 右侧空状态面板 */
.right-panel-empty {
  flex: 1;
  min-width: 600px;
  width: calc(100% - 470px);
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 60px 40px;
  min-height: 600px;
}

.empty-content {
  text-align: center;
  max-width: 400px;
}

.empty-icon {
  width: 80px;
  height: 80px;
  background: linear-gradient(135deg, #409EFF, #66b3ff);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 24px;
  font-size: 40px;
  color: white;
}

.empty-title {
  margin: 0 0 12px 0;
  font-size: 24px;
  font-weight: 600;
  color: #374151;
}

.empty-description {
  margin: 0 0 32px 0;
  font-size: 16px;
  color: #6b7280;
  line-height: 1.6;
}

.empty-actions {
  margin-bottom: 40px;
}

.quick-features {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: #f8fafc;
  border-radius: 8px;
  color: #6b7280;
  font-size: 14px;
}

.feature-item .el-icon {
  color: #409EFF;
  font-size: 18px;
}

/* 响应式样式 */
@media (max-width: 1400px) {
  .left-panel {
    flex: 0 0 400px;
    width: 400px;
    min-width: 400px;
    max-width: 400px;
  }
  
  .right-panel,
  .right-panel-empty {
    min-width: 500px;
    width: calc(100% - 420px);
  }
}

@media (max-width: 1200px) {
  .main-container {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
  }
  
  .left-panel {
    flex: none;
    width: 100%;
    min-width: auto;
    max-width: none;
    order: 1;
  }
  
  .right-panel,
  .right-panel-empty {
    flex: none;
    width: 100%;
    min-width: auto;
    min-height: 500px;
    order: 2;
  }
}

@media (max-width: 768px) {
  .datasource-manage {
    padding: 16px;
  }
  
  .main-container {
    gap: 12px;
  }
}

/* 搜索筛选样式 */
.search-section {
  margin-bottom: 24px;
  padding: 20px;
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.search-bar {
  margin-bottom: 16px;
}

.filter-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;
}

.filter-controls {
  display: flex;
  align-items: center;
  gap: 12px;
}

/* 统计信息栏 */
.stats-bar {
  display: flex;
  gap: 20px;
  padding-top: 12px;
  border-top: 1px solid #e5e7eb;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.stat-label {
  font-size: 13px;
  color: #6b7280;
}

.stat-value {
  font-size: 14px;
  font-weight: 600;
  color: #374151;
}

.stat-value.success {
  color: #67c23a;
}

.stat-value.danger {
  color: #f56c6c;
}

/* 数据源列表样式 */
.datasource-list-section {
  padding: 20px;
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.section-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #374151;
}

.datasource-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.datasource-item {
  padding: 16px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  background: #ffffff;
}

.datasource-item:hover {
  border-color: #409EFF;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.15);
}

.datasource-item.active {
  border-color: #409EFF;
  background: #e1f5fe;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.25);
}

.datasource-info {
  width: 100%;
}

.datasource-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.datasource-icon {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  background: linear-gradient(135deg, #409EFF, #66b3ff);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  flex-shrink: 0;
}

.datasource-main {
  flex: 1;
  min-width: 0;
}

.datasource-name {
  margin: 0 0 2px 0;
  font-size: 16px;
  font-weight: 600;
  color: #374151;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.datasource-description {
  margin: 0;
  font-size: 12px;
  color: #6b7280;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.datasource-status {
  flex-shrink: 0;
}

.datasource-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #6b7280;
}

.meta-item:first-child {
  margin-right: 8px;
}

/* 详情面板样式 */
.detail-tabs-header {
  border-bottom: 1px solid #e5e7eb;
  flex-shrink: 0;
}

.detail-tabs-nav {
  padding: 0 20px;
}

.detail-content-wrapper {
  flex: 1;
  overflow-y: auto;
}

.tab-content {
  padding: 24px;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e5e7eb;
}

.detail-title {
  display: flex;
  align-items: center;
  gap: 12px;
}

.detail-title h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #374151;
}

.detail-actions {
  display: flex;
  gap: 8px;
}

.detail-content {
  flex: 1;
}

/* 测试结果样式 */
.test-result {
  margin-top: 24px;
  padding: 20px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  gap: 16px;
}

.test-result.success {
  background: #f0f9ff;
  border: 1px solid #67c23a;
}

.test-result.error {
  background: #fef2f2;
  border: 1px solid #f56c6c;
}

.result-icon {
  font-size: 32px;
}

.test-result.success .result-icon {
  color: #67c23a;
}

.test-result.error .result-icon {
  color: #f56c6c;
}

.result-content h4 {
  margin: 0 0 8px 0;
  font-size: 16px;
}

.result-content p {
  margin: 0 0 4px 0;
  font-size: 14px;
  color: #6b7280;
}

.result-content small {
  font-size: 12px;
  color: #9ca3af;
}

/* 字段和预览样式 */
.fields-header, .preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.preview-controls {
  display: flex;
  gap: 12px;
  align-items: center;
}

.tables-section {
  min-height: 300px;
}

.tables-list {
  background: #f9fafb;
  border-radius: 8px;
  padding: 16px;
}

.table-header {
  display: flex;
  align-items: center;
  gap: 8px;
}

.table-fields {
  padding: 16px 0;
}

.preview-footer {
  margin-top: 16px;
  text-align: center;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .main-container {
    flex-direction: column;
  }
  
  .right-panel, .right-panel-empty {
    width: 100%;
  }
  
  .stats-cards {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 768px) {
  .header-content {
    flex-direction: column;
    gap: 16px;
  }
  
  .stats-cards {
    grid-template-columns: 1fr;
  }
  
  .datasource-grid {
    grid-template-columns: 1fr;
  }
}

/* Element Plus 样式覆盖 */
:deep(.el-tabs__nav-wrap::after) {
  display: none;
}

:deep(.el-tabs__item) {
  font-weight: 500;
}

:deep(.el-tabs__item.is-active) {
  color: #409EFF;
}

:deep(.el-collapse-item__header) {
  padding-left: 0;
}

:deep(.el-descriptions__label) {
  font-weight: 600;
  color: #374151;
}

/* 数据字段表格优化样式 */
.fields-table-container {
  margin-top: 12px;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.fields-table {
  border-radius: 8px;
  overflow: hidden;
}

:deep(.fields-table .el-table__header) {
  background: #f8fafc;
}

:deep(.fields-table .el-table__row) {
  transition: background-color 0.2s ease;
}

:deep(.fields-table .el-table__row:hover) {
  background: #f9fafb;
}

.field-name {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 500;
}

.primary-key-icon {
  color: #f56c6c;
  font-size: 14px;
}

.column-comment {
  color: #6b7280;
  font-size: 13px;
  font-style: italic;
}

.no-primary {
  color: #d1d5db;
  font-size: 12px;
}

/* 表格单元格内的标签优化 */
:deep(.fields-table .el-tag) {
  font-weight: 500;
  border-radius: 4px;
}

:deep(.fields-table .el-tag--small) {
  padding: 2px 6px;
  font-size: 11px;
}

/* 字段类型标签颜色优化 */
:deep(.fields-table .el-tag--warning.is-light) {
  background: #fef3e2;
  border-color: #f59e0b;
  color: #d97706;
}

:deep(.fields-table .el-tag--primary.is-light) {
  background: #e1f5fe;
  border-color: #409EFF;
  color: #409EFF;
}

:deep(.fields-table .el-tag--success.is-light) {
  background: #f0f9ff;
  border-color: #67c23a;
  color: #67c23a;
}

:deep(.fields-table .el-tag--info.is-light) {
  background: #f3f4f6;
  border-color: #909399;
  color: #909399;
}

:deep(.fields-table .el-tag--danger.is-light) {
  background: #fef2f2;
  border-color: #f56c6c;
  color: #f56c6c;
}
</style>
