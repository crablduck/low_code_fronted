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
              @clear="handleSearch"
              @keyup.enter="handleSearch"
            >
              <template #append>
                <el-button @click="handleSearch" type="primary">搜索</el-button>
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
          <div class="section-header">
            <h3 class="section-title">数据源列表</h3>
            <div class="list-controls">
              <el-select 
                v-model="pageSize" 
                size="small" 
                style="width: 100px"
                @change="handlePageSizeChange"
              >
                <el-option label="10" :value="10" />
                <el-option label="20" :value="20" />
                <el-option label="50" :value="50" />
                <el-option label="全部" :value="0" />
              </el-select>
              <span class="total-count">共 {{ filteredDataSources.length }} 项</span>
            </div>
          </div>
          
          <div 
            class="datasource-grid" 
            v-loading="loading"
            :style="{ height: listContainerHeight }"
          >
            <div 
              v-for="datasource in paginatedDataSources" 
              :key="datasource?.id || Math.random()"
              class="datasource-card"
              :class="{ active: selectedDataSource?.id === datasource?.id }"
              @click.stop="selectDataSource(datasource)"
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
          
          <!-- 分页控件 -->
          <div v-if="pageSize > 0 && filteredDataSources.length > pageSize" class="pagination-container">
            <el-pagination
              v-model:current-page="currentPage"
              :page-size="pageSize"
              :total="filteredDataSources.length"
              layout="prev, pager, next, jumper"
              small
              @current-change="handleCurrentPageChange"
            />
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

// 分页相关
const pageSize = ref(10)
const currentPage = ref(1)

// 动态计算列表容器高度
const listContainerHeight = computed(() => {
  const dataLength = filteredDataSources.value.length
  const itemHeight = 120 // 每个卡片约120px高度
  const maxHeight = 400 // 最大高度400px
  const minHeight = 200 // 最小高度200px
  
  if (pageSize.value === 0) {
    // 显示全部时，根据数据量动态调整
    const calculatedHeight = Math.min(dataLength * itemHeight + 40, maxHeight)
    return `${Math.max(calculatedHeight, minHeight)}px`
  } else {
    // 分页模式时，根据每页显示数量调整
    const calculatedHeight = Math.min(pageSize.value * itemHeight + 40, maxHeight)
    return `${Math.max(calculatedHeight, minHeight)}px`
  }
})

const paginatedDataSources = computed(() => {
  const sources = Array.isArray(filteredDataSources.value) ? filteredDataSources.value : []
  
  // 如果 pageSize 为 0，显示全部数据
  if (pageSize.value === 0) {
    return sources
  }
  
  // 分页显示
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return sources.slice(start, end)
})

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
  resetPagination() // 过滤时重置分页
}

const clearTypeFilter = () => {
  selectedTypeFilter.value = null
  resetPagination() // 清除过滤时重置分页
}

// 搜索处理
const handleSearch = () => {
  resetPagination() // 搜索时重置分页
  loadDataSources()
}

// 方法
const loadDataSources = async () => {
  loading.value = true
  try {
    const result = await dataSourceApi.getAllDataSources()
    console.log('Loaded data sources:', result)
    
    // 正确处理分页数据结构
    if (result && result.code === 200 && result.data?.content) {
      dataSources.value = result.data.content.map(ds => ({
        ...ds,
        id: ds.id || Math.random(),
        host: ds.url,
        databaseName: ds.database,
        status: ds.status || 'offline' // 默认状态
      })).filter(ds => ds && typeof ds === 'object')
      
      console.log(`成功加载 ${dataSources.value.length} 个数据源`)
    } else {
      console.error('数据源API返回的数据结构不正确:', result)
      dataSources.value = []
      ElMessage.error('加载数据源失败: ' + (result?.message || '数据格式错误'))
    }
    
    resetPagination() // 重新加载数据时重置分页
  } catch (error) {
    console.error('加载数据源失败:', error)
    ElMessage.error('加载数据源失败: ' + (error as Error).message)
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
    const response = await dataSourceApi.getFieldsByTable(
      selectedDataSource.value.id, 
      table.name,
      selectedDataSource.value
    )
    
    // 处理API返回的数据格式：response.data 是数组格式
    if (response && Array.isArray(response.data)) {
      fields.value = response.data.map((column: any) => ({
        name: column.columnName,
        dataType: column.columnType,
        isPrimary: column.isPrimaryKey,
        isNullable: true, // API未返回此信息，默认为true
        description: column.columnComment || '-',
        tableName: table.name
      }))
    } else {
      fields.value = []
    }
  } catch (error) {
    ElMessage.error('加载字段信息失败')
    console.error('Failed to load table fields:', error)
    fields.value = []
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

const handlePageSizeChange = () => {
  currentPage.value = 1
  // 如果切换到显示全部模式，确保没有分页限制
  if (pageSize.value === 0) {
    currentPage.value = 1
  }
}

const handleCurrentPageChange = (newPage: number) => {
  currentPage.value = newPage
}

// 搜索时重置分页
const resetPagination = () => {
  currentPage.value = 1
}

// 生命周期
onMounted(() => {
  loadDataSources()
})
</script>

<style scoped lang="scss">
.datasource-manage {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  overflow: hidden;
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 200px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    opacity: 0.1;
    z-index: 0;
  }
}

/* 页面头部 - 现代化设计 */
.page-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: -50%;
    right: -20%;
    width: 50%;
    height: 200%;
    background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
    transform: rotate(15deg);
  }
  
  .header-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    max-width: 1400px;
    margin: 0 auto;
    padding: 32px;
    position: relative;
    z-index: 1;
  }

  .header-left {
    .page-title {
      margin: 0 0 8px 0;
      font-size: 28px;
      font-weight: 800;
      display: flex;
      align-items: center;
      gap: 16px;
      color: white;
      text-shadow: 0 2px 4px rgba(0,0,0,0.1);
      
      .el-icon {
        font-size: 32px;
        filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2));
      }
    }
    
    .page-description {
      margin: 0;
      font-size: 16px;
      opacity: 0.9;
      font-weight: 400;
      color: rgba(255,255,255,0.9);
    }
  }

  .header-actions {
    .el-button {
      background: rgba(255, 255, 255, 0.15);
      border: 2px solid rgba(255, 255, 255, 0.2);
      color: white;
      backdrop-filter: blur(10px);
      padding: 12px 24px;
      border-radius: 12px;
      font-weight: 600;
      font-size: 14px;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      
      &:hover {
        background: rgba(255, 255, 255, 0.25);
        border-color: rgba(255, 255, 255, 0.4);
        transform: translateY(-2px);
        box-shadow: 0 8px 25px rgba(0,0,0,0.15);
      }
      
      .el-icon {
        margin-right: 8px;
      }
    }
  }
}

/* 主容器 - 优化布局 */
.main-container {
  display: flex;
  min-height: calc(100vh - 120px);
  max-width: 1400px;
  margin: 0 auto;
  width: 100%;
  gap: 24px;
  padding: 24px 32px;
  position: relative;
  z-index: 1;
}

/* 左侧面板 - 卡片化设计 */
.left-panel {
  width: 400px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* 搜索区域 - 现代化输入框 */
.search-section {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  transition: all 0.3s ease;
  
  &:hover {
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
    transform: translateY(-2px);
  }
  
  .search-bar {
    margin-bottom: 16px;
    
    :deep(.el-input) {
      .el-input__wrapper {
        border-radius: 12px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
        border: 1px solid #e4e7ed;
        transition: all 0.3s ease;
        
        &:hover {
          border-color: #409eff;
          box-shadow: 0 4px 16px rgba(64, 158, 255, 0.2);
        }
        
        &.is-focus {
          border-color: #409eff;
          box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2);
        }
      }
      
      .el-input-group__append {
        .el-button {
          border-radius: 0 12px 12px 0;
          background: linear-gradient(135deg, #409eff 0%, #1890ff 100%);
          border: none;
          font-weight: 600;
          
          &:hover {
            background: linear-gradient(135deg, #66b1ff 0%, #409eff 100%);
            transform: translateY(-1px);
          }
        }
      }
    }
  }
  
  .filter-bar {
    .sort-controls {
      display: flex;
      align-items: center;
      gap: 12px;
      
      .sort-label {
        font-size: 14px;
        color: #606266;
        font-weight: 600;
      }
      
      :deep(.el-button-group) {
        .el-button {
          padding: 8px 16px;
          font-size: 13px;
          border-radius: 8px;
          transition: all 0.3s ease;
          
          &:first-child {
            border-radius: 8px 0 0 8px;
          }
          
          &:last-child {
            border-radius: 0 8px 8px 0;
          }
          
          &.is-active {
            background: linear-gradient(135deg, #409eff 0%, #1890ff 100%);
            border-color: #409eff;
            color: white;
            box-shadow: 0 2px 8px rgba(64, 158, 255, 0.3);
          }
          
          .el-icon {
            margin-left: 6px;
            font-size: 12px;
          }
        }
      }
    }
  }
  
  .filter-status {
    margin-top: 16px;
    padding-top: 16px;
    border-top: 1px solid #f0f0f0;
    
    .el-tag {
      margin-right: 8px;
      border-radius: 20px;
      padding: 4px 12px;
    }
  }
}

/* 统计卡片 - 3D效果 */
.stats-section {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
  }
}

.stats-cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.stat-card {
  background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
  border-radius: 12px;
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid rgba(255, 255, 255, 0.5);
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: linear-gradient(90deg, transparent, rgba(64, 158, 255, 0.5), transparent);
    transform: translateX(-100%);
    transition: transform 0.6s ease;
  }
  
  &:hover {
    transform: translateY(-4px) scale(1.02);
    box-shadow: 0 12px 25px rgba(0, 0, 0, 0.15);
    
    &::before {
      transform: translateX(100%);
    }
  }
  
  .stat-icon {
    width: 44px;
    height: 44px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    
    &::after {
      content: '';
      position: absolute;
      inset: 0;
      border-radius: 12px;
      padding: 2px;
      background: linear-gradient(135deg, rgba(255,255,255,0.3), rgba(255,255,255,0.1));
      mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
      mask-composite: xor;
    }
    
    .el-icon {
      font-size: 20px;
      filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2));
    }
  }
  
  .stat-content {
    flex: 1;
    
    .stat-value {
      font-size: 20px;
      font-weight: 800;
      line-height: 1;
      margin-bottom: 4px;
      background: linear-gradient(135deg, #333 0%, #666 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    
    .stat-label {
      font-size: 12px;
      color: #666;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
  }
  
  &.total {
    .stat-icon {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }
    .stat-value {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
  }
  
  &.active {
    .stat-icon {
      background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
      color: white;
    }
    .stat-value {
      background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
  }
  
  &.inactive {
    .stat-icon {
      background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
      color: white;
    }
    .stat-value {
      background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
  }
}

/* 数据源分布 - 交互式卡片 */
.datasource-section {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
  }
  
  .section-title {
    margin: 0 0 16px 0;
    font-size: 16px;
    font-weight: 700;
    color: #303133;
    display: flex;
    align-items: center;
    gap: 8px;
    
    &::before {
      content: '';
      width: 4px;
      height: 16px;
      background: linear-gradient(135deg, #409eff 0%, #1890ff 100%);
      border-radius: 2px;
    }
  }

  .datasource-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  
  .datasource-item {
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    border-radius: 10px;
    
    &:hover {
      transform: translateX(4px);
    }

    &.active {
      .datasource-info {
        background: linear-gradient(135deg, #e6f7ff 0%, #f0f9ff 100%);
        border: 1px solid #409eff;
        box-shadow: 0 4px 12px rgba(64, 158, 255, 0.2);
      }
    }

    .datasource-info {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 16px;
      background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
      border-radius: 10px;
      border: 1px solid #e4e7ed;
      transition: all 0.3s ease;
      
      &:hover {
        border-color: #409eff;
        box-shadow: 0 4px 12px rgba(64, 158, 255, 0.15);
        transform: translateY(-1px);
      }
      
      .el-tag {
        border-radius: 6px;
        font-weight: 600;
      }
      
      .datasource-count {
        font-size: 13px;
        color: #666;
        font-weight: 600;
        background: linear-gradient(135deg, #409eff 0%, #1890ff 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
      }
    }
  }
}

/* 数据源列表 - 高级卡片设计 */
.datasource-list-section {
  flex: 1;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  display: flex;
  flex-direction: column;
  min-height: 0;
  transition: all 0.3s ease;
  
  &:hover {
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
  }
  
  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
    padding-bottom: 16px;
    border-bottom: 2px solid #f0f0f0;
    
    .section-title {
      margin: 0;
      font-size: 18px;
      font-weight: 700;
      color: #303133;
      display: flex;
      align-items: center;
      gap: 10px;
      
      &::before {
        content: '';
        width: 4px;
        height: 18px;
        background: linear-gradient(135deg, #409eff 0%, #1890ff 100%);
        border-radius: 2px;
      }
    }
    
    .list-controls {
      display: flex;
      align-items: center;
      gap: 16px;
      
      :deep(.el-select) {
        .el-input__wrapper {
          border-radius: 8px;
          border: 1px solid #dcdfe6;
          transition: all 0.3s ease;
          
          &:hover {
            border-color: #409eff;
          }
        }
      }
      
      .total-count {
        font-size: 13px;
        color: #666;
        font-weight: 600;
        padding: 6px 12px;
        background: linear-gradient(135deg, #f0f9ff 0%, #e6f7ff 100%);
        border-radius: 16px;
        white-space: nowrap;
      }
    }
  }
  
  .datasource-grid {
    flex: 1;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 12px;
    transition: height 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    padding-right: 4px;
    
    &::-webkit-scrollbar {
      width: 6px;
    }
    
    &::-webkit-scrollbar-track {
      background: #f1f1f1;
      border-radius: 3px;
    }
    
    &::-webkit-scrollbar-thumb {
      background: linear-gradient(135deg, #c1c1c1 0%, #a8a8a8 100%);
      border-radius: 3px;
      transition: background 0.3s ease;
      
      &:hover {
        background: linear-gradient(135deg, #a8a8a8 0%, #909090 100%);
      }
    }
  }
  
  .pagination-container {
    margin-top: 16px;
    display: flex;
    justify-content: center;
    border-top: 2px solid #f0f0f0;
    padding-top: 16px;
    
    :deep(.el-pagination) {
      .el-pager li {
        min-width: 28px;
        height: 28px;
        line-height: 28px;
        font-size: 13px;
        border-radius: 6px;
        margin: 0 2px;
        transition: all 0.3s ease;
        
        &.is-active {
          background: linear-gradient(135deg, #409eff 0%, #1890ff 100%);
          border-color: #409eff;
        }
      }
      
      .btn-prev, .btn-next {
        width: 28px;
        height: 28px;
        line-height: 28px;
        border-radius: 6px;
        margin: 0 4px;
      }
    }
  }
}

/* 数据源卡片 - 专业级设计 */
.datasource-card {
  background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
  border: 1px solid #e4e7ed;
  border-radius: 12px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: linear-gradient(90deg, #409eff, #1890ff, #409eff);
    transform: translateX(-100%);
    transition: transform 0.6s ease;
  }
  
  &:hover {
    border-color: #409eff;
    transform: translateY(-4px) scale(1.02);
    box-shadow: 0 16px 32px rgba(64, 158, 255, 0.2);
    
    &::before {
      transform: translateX(100%);
    }
    
    .datasource-icon {
      transform: scale(1.1) rotate(5deg);
    }
    
    .datasource-name {
      color: #409eff;
    }
  }
  
  &.active {
    border-color: #409eff;
    background: linear-gradient(135deg, #e6f7ff 0%, #f0f9ff 100%);
    box-shadow: 0 8px 25px rgba(64, 158, 255, 0.25);
    
    &::before {
      transform: translateX(0);
    }
    
    .datasource-name {
      color: #409eff;
    }
  }
  
  .datasource-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
    
    .datasource-icon {
      width: 32px;
      height: 32px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      
      .el-icon {
        font-size: 16px;
        filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2));
      }
    }
    
    .datasource-status {
      .el-tag {
        border-radius: 12px;
        font-weight: 600;
        padding: 4px 10px;
        font-size: 11px;
        border: none;
        
        &.el-tag--success {
          background: linear-gradient(135deg, #67c23a 0%, #85ce61 100%);
          color: white;
        }
        
        &.el-tag--danger {
          background: linear-gradient(135deg, #f56c6c 0%, #f78989 100%);
          color: white;
        }
      }
    }
  }
  
  .datasource-content {
    .datasource-name {
      margin: 0 0 8px 0;
      font-size: 16px;
      font-weight: 700;
      color: #303133;
      line-height: 1.4;
      transition: all 0.3s ease;
    }

    .datasource-description {
      margin: 0 0 12px 0;
      font-size: 13px;
      color: #666;
      line-height: 1.4;
      font-weight: 500;
    }

    .datasource-meta {
      display: flex;
      flex-direction: column;
      gap: 6px;
      margin-bottom: 12px;
      
      .meta-item {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 12px;
        color: #666;
        
        .el-icon {
          font-size: 14px;
          color: #999;
        }
      }
    }

    .datasource-type {
      display: flex;
      justify-content: flex-end;
      
      .el-tag {
        border-radius: 8px;
        font-weight: 600;
        border: none;
        
        &.el-tag--success {
          background: linear-gradient(135deg, #67c23a 0%, #85ce61 100%);
          color: white;
        }
        
        &.el-tag--primary {
          background: linear-gradient(135deg, #409eff 0%, #66b1ff 100%);
          color: white;
        }
        
        &.el-tag--warning {
          background: linear-gradient(135deg, #e6a23c 0%, #f0a020 100%);
          color: white;
        }
        
        &.el-tag--info {
          background: linear-gradient(135deg, #909399 0%, #a6a9ad 100%);
          color: white;
        }
      }
    }
  }
}

/* 右侧面板 - 高端设计 */
.right-panel {
  flex: 1;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
  transition: all 0.3s ease;
  
  &:hover {
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
  }
  
  .detail-tabs-header {
    background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
    border-radius: 16px 16px 0 0;
    border-bottom: 2px solid #f0f0f0;
    
    :deep(.detail-tabs-nav) {
      .el-tabs__header {
        margin: 0;
        padding: 0 24px;
        background: transparent;
        border-bottom: none;
      }
      
      .el-tabs__nav-wrap {
        padding: 16px 0;
      }
      
      .el-tabs__item {
        font-weight: 600;
        color: #606266;
        font-size: 15px;
        padding: 0 24px;
        transition: all 0.3s ease;
        
        &:hover {
          color: #409eff;
        }
        
        &.is-active {
          color: #409eff;
          font-weight: 700;
        }
      }
      
      .el-tabs__active-bar {
        background: linear-gradient(135deg, #409eff 0%, #1890ff 100%);
        height: 3px;
        border-radius: 2px;
      }
    }
  }
  
  .detail-content-wrapper {
    flex: 1;
    overflow: hidden;

    .tab-content {
      height: 100%;
      overflow-y: auto;
      
      &::-webkit-scrollbar {
        width: 6px;
      }
      
      &::-webkit-scrollbar-track {
        background: #f1f1f1;
        border-radius: 3px;
      }
      
      &::-webkit-scrollbar-thumb {
        background: linear-gradient(135deg, #c1c1c1 0%, #a8a8a8 100%);
        border-radius: 3px;
        
        &:hover {
          background: linear-gradient(135deg, #a8a8a8 0%, #909090 100%);
        }
      }
    }
  }
  
  .detail-header {
    padding: 24px 24px 20px 24px;
    border-bottom: 2px solid #f0f0f0;
    background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);

    .detail-title {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
      
      h2 {
        margin: 0;
        font-size: 20px;
        font-weight: 700;
        color: #303133;
        background: linear-gradient(135deg, #303133 0%, #606266 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
      }
      
      .el-tag {
        border-radius: 12px;
        font-weight: 600;
        padding: 6px 12px;
        border: none;
      }
    }
    
    .detail-actions {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
      
      .el-button {
        border-radius: 8px;
        font-weight: 600;
        transition: all 0.3s ease;
        
        &:hover {
          transform: translateY(-2px);
        }
        
        &.el-button--primary {
          background: linear-gradient(135deg, #409eff 0%, #1890ff 100%);
          border: none;
        }
        
        &.el-button--success {
          background: linear-gradient(135deg, #67c23a 0%, #85ce61 100%);
          border: none;
        }
      }
    }
  }
  
  .detail-content {
    padding: 24px;
    
    :deep(.el-descriptions) {
      .el-descriptions__header {
        margin-bottom: 20px;
      }
      
      .el-descriptions__table {
        border-radius: 8px;
        overflow: hidden;
      }
      
      .el-descriptions__cell {
        border-color: #f0f0f0;
      }
      
      .el-descriptions__label {
        background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
        font-weight: 600;
        color: #303133;
      }
    }
    
    :deep(.el-table) {
      border-radius: 8px;
      overflow: hidden;
      
      .el-table__header {
        background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
        
        th {
          background: transparent;
          border-color: #f0f0f0;
          font-weight: 600;
        }
      }
      
      .el-table__body {
        tr:hover {
          background: #f5f7fa;
        }
        
        td {
          border-color: #f0f0f0;
        }
      }
    }
  }
}

.right-panel-empty {
  flex: 1;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  
  &:hover {
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
  }
  
  :deep(.el-empty) {
    .el-empty__description {
      font-weight: 600;
      color: #666;
    }
    
    .el-button {
      background: linear-gradient(135deg, #409eff 0%, #1890ff 100%);
      border: none;
      border-radius: 8px;
      font-weight: 600;
      
      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 20px rgba(64, 158, 255, 0.3);
      }
    }
  }
}

/* 对话框优化 */
:deep(.el-dialog) {
  border-radius: 16px;
  overflow: hidden;
  
  .el-dialog__header {
    background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
    padding: 20px 24px;
    border-bottom: 2px solid #f0f0f0;
    
    .el-dialog__title {
      font-weight: 700;
      font-size: 18px;
      color: #303133;
    }
  }
  
  .el-dialog__body {
    padding: 24px;
  }
  
  .el-dialog__footer {
    padding: 16px 24px;
    border-top: 2px solid #f0f0f0;
    background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
  }
}

/* 响应式设计优化 */
@media (max-width: 1200px) {
  .main-container {
    padding: 20px 24px;
    gap: 20px;
  }
  
  .left-panel {
    width: 380px;
  }
  
  .page-header .header-content {
    padding: 24px;
  }
}

@media (max-width: 768px) {
  .main-container {
    flex-direction: column;
    padding: 16px 20px;
  }
  
  .left-panel {
    width: 100%;
    order: 2;
  }
  
  .right-panel,
  .right-panel-empty {
    order: 1;
    margin-bottom: 20px;
  }
  
  .page-header .header-content {
    flex-direction: column;
    gap: 16px;
    text-align: center;
    padding: 20px;
  }
  
  .stats-cards {
    grid-template-columns: 1fr;
    gap: 12px;
  }
  
  .datasource-card {
    margin-bottom: 12px;
  }
}

@media (max-width: 480px) {
  .page-header .header-content {
    padding: 16px;
  }
  
  .main-container {
    padding: 12px 16px;
  }
  
  .section-header {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start !important;
  }
}

/* 加载动画优化 */
:deep(.el-loading-mask) {
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(4px);
}

/* 动画效果 */
@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.datasource-card,
.stat-card,
.search-section,
.stats-section,
.datasource-section,
.datasource-list-section {
  animation: slideInUp 0.6s ease-out;
}

.stat-card:nth-child(1) { animation-delay: 0.1s; }
.stat-card:nth-child(2) { animation-delay: 0.2s; }
.stat-card:nth-child(3) { animation-delay: 0.3s; }
</style> 