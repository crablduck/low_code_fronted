<template>
  <div class="dataset-manage">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <div class="header-left">
          <h1 class="page-title">
            <el-icon class="icon-database"><Grid /></el-icon>
            数据集管理
          </h1>
          <p class="page-description">管理和配置数据集</p>
        </div>
          <div class="header-actions">
          <el-button type="primary" size="large" @click="goToDesigner()">
              <el-icon><Plus /></el-icon>
            创建数据集
            </el-button>
          </div>
        </div>
    </div>
      
    <!-- 主要内容区域 -->
    <div class="main-container">
      <!-- 左侧：数据集列表和统计 -->
      <div class="left-panel">
        <!-- 搜索和筛选区域 -->
        <div class="search-section">
          <div class="search-bar">
            <el-input
              v-model="searchKeyword"
              placeholder="搜索数据集名称..."
              prefix-icon="Search"
              clearable
              @clear="loadDatasets"
              @keyup.enter="loadDatasets"
            >
              <template #append>
                <el-button @click="loadDatasets" type="primary">搜索</el-button>
              </template>
            </el-input>
          </div>
          
          <div class="filter-bar">
            <div class="sort-controls">
              <span class="sort-label">排序：</span>
              <el-button-group size="small">
                <el-button 
                  :type="sortBy === 'name' ? 'primary' : ''" 
                  @click="sortDatasets('name')"
                >
                  名称
                  <el-icon v-if="sortBy === 'name'">
                    <SortUp v-if="sortOrder === 'asc'" />
                    <SortDown v-else />
                  </el-icon>
                  </el-button>
                <el-button 
                  :type="sortBy === 'createTime' ? 'primary' : ''" 
                  @click="sortDatasets('createTime')"
                >
                  时间
                  <el-icon v-if="sortBy === 'createTime'">
                    <SortUp v-if="sortOrder === 'asc'" />
                    <SortDown v-else />
                  </el-icon>
                  </el-button>
              </el-button-group>
            </div>
          </div>
          
          <!-- 过滤状态显示 -->
          <div v-if="selectedDataSourceFilter" class="filter-status">
            <el-tag 
              type="info" 
              closable 
              @close="clearDataSourceFilter"
              size="small"
            >
              数据源：{{ getDataSourceName(selectedDataSourceFilter) }}
            </el-tag>
            </div>
              </div>

        <!-- 统计卡片 -->
        <div class="stats-section">
          <div class="stats-cards">
            <div class="stat-card total">
              <div class="stat-icon">
                <el-icon><DataBoard /></el-icon>
              </div>
              <div class="stat-content">
                <div class="stat-value">{{ filteredDatasets.length }}</div>
                <div class="stat-label">总数量</div>
              </div>
            </div>
            
            <div class="stat-card active">
              <div class="stat-icon">
                <el-icon><CircleCheck /></el-icon>
              </div>
              <div class="stat-content">
                <div class="stat-value">{{ activeCount }}</div>
                <div class="stat-label">启用</div>
            </div>
          </div>
          
            <div class="stat-card inactive">
              <div class="stat-icon">
                <el-icon><CircleClose /></el-icon>
              </div>
              <div class="stat-content">
                <div class="stat-value">{{ inactiveCount }}</div>
                <div class="stat-label">禁用</div>
              </div>
            </div>
          </div>
          </div>
          
        <!-- 数据源分布 -->
        <div class="datasource-section">
          <h3 class="section-title">数据源分布</h3>
          <div class="datasource-list">
            <div 
              v-for="(count, sourceId) in dataSourceCount" 
              :key="sourceId" 
              class="datasource-item"
              :class="{ active: selectedDataSourceFilter === Number(sourceId) }"
              @click="filterByDataSource(Number(sourceId))"
            >
              <div class="datasource-info">
                <el-tag size="small" type="info">{{ getDataSourceName(Number(sourceId)) }}</el-tag>
                <span class="datasource-count">{{ count }} 个</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 数据集列表 -->
        <div class="dataset-list-section">
          <h3 class="section-title">数据集列表</h3>
          <div class="dataset-grid" v-loading="loading">
            <div 
              v-for="dataset in filteredDatasets" 
              :key="dataset.id"
              class="dataset-card"
              :class="{ active: selectedDataset?.id === dataset.id }"
              @click="selectDataset(dataset)"
            >
              <div class="dataset-header">
                <div class="dataset-icon">
                  <el-icon><Document /></el-icon>
                </div>
                <div class="dataset-status">
                  <el-tag 
                    :type="dataset.status === 'active' ? 'success' : 'danger'" 
                    size="small"
                  >
                    {{ dataset.status === 'active' ? '启用' : '禁用' }}
                  </el-tag>
                </div>
              </div>
              
              <div class="dataset-content">
                <h4 class="dataset-name">{{ dataset.name }}</h4>
                <p class="dataset-description">{{ dataset.description || '暂无描述' }}</p>
                
                <div class="dataset-meta">
                  <div class="meta-item">
                    <el-icon><Database /></el-icon>
                    <span>{{ dataset.dataSourceName }}</span>
                  </div>
                  <div class="meta-item">
                    <el-icon><Calendar /></el-icon>
                    <span>{{ formatDate(dataset.createTime) }}</span>
                  </div>
                </div>
                
                <div class="dataset-type">
                  <el-tag 
                    :type="getQueryTypeTag(dataset.queryType)" 
                    size="small"
                  >
                    {{ getQueryTypeLabel(dataset.queryType) }}
                  </el-tag>
                </div>
              </div>
            </div>
          </div>
          
          <el-empty v-if="!loading && filteredDatasets.length === 0" description="暂无数据集" />
        </div>
      </div>

      <!-- 右侧：数据集详情 -->
      <div class="right-panel" v-if="selectedDataset">
        <!-- Tab导航栏 - 放在最顶部 -->
        <div class="detail-tabs-header">
          <el-tabs v-model="activeTab" @tab-change="handleTabChange" class="detail-tabs-nav">
            <el-tab-pane label="基本信息" name="details"></el-tab-pane>
            <el-tab-pane label="字段结构" name="fields"></el-tab-pane>
            <el-tab-pane label="数据预览" name="preview"></el-tab-pane>
          </el-tabs>
        </div>

        <!-- Tab内容区域 -->
        <div class="detail-content-wrapper">
          <!-- 基本信息内容 -->
          <div v-if="activeTab === 'details'" class="tab-content">
            <div class="detail-header">
              <div class="detail-title">
                <h2>{{ selectedDataset.name }}</h2>
                <el-tag 
                  :type="selectedDataset.status === 'active' ? 'success' : 'danger'"
                >
                  {{ selectedDataset.status === 'active' ? '启用' : '禁用' }}
                </el-tag>
              </div>
              
              <div class="detail-actions">
                <el-button size="small" @click="editDataset(selectedDataset)">
                  <el-icon><Edit /></el-icon>
                  编辑
                </el-button>
                <el-button size="small" type="info" @click="previewDataset(selectedDataset.id)">
                  <el-icon><View /></el-icon>
                  预览
                </el-button>
                <el-dropdown @command="handleCommand">
                  <el-button size="small">
                    更多操作<el-icon class="el-icon--right"><ArrowDown /></el-icon>
                  </el-button>
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item 
                        :command="`toggle-${selectedDataset.id}`"
                        :icon="selectedDataset.status === 'active' ? 'CircleClose' : 'CircleCheck'"
                      >
                        {{ selectedDataset.status === 'active' ? '禁用' : '启用' }}
                      </el-dropdown-item>
                      <el-dropdown-item 
                        :command="`delete-${selectedDataset.id}`"
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
                    <el-descriptions-item label="数据集名称">
                      {{ selectedDataset.name }}
                    </el-descriptions-item>
                    <el-descriptions-item label="数据源">
                  <el-tag type="info">{{ selectedDataset.dataSourceName }}</el-tag>
                    </el-descriptions-item>
                    <el-descriptions-item label="查询类型">
                      <el-tag :type="getQueryTypeTag(selectedDataset.queryType)">
                        {{ getQueryTypeLabel(selectedDataset.queryType) }}
                      </el-tag>
                    </el-descriptions-item>
                    <el-descriptions-item label="创建时间">
                      {{ formatDate(selectedDataset.createTime) }}
                    </el-descriptions-item>
                    <el-descriptions-item label="更新时间">
                      {{ selectedDataset.updateTime ? formatDate(selectedDataset.updateTime) : '-' }}
                    </el-descriptions-item>
                <el-descriptions-item label="描述">
                      {{ selectedDataset.description || '暂无描述' }}
                    </el-descriptions-item>
                  </el-descriptions>

              <!-- 查询详情 -->
              <div class="query-details" v-if="selectedDataset.queryType">
                <h4>查询配置</h4>
                
                <!-- 单表模式 -->
                <div v-if="selectedDataset.queryType === 'single'" class="query-config">
                    <el-descriptions :column="1" border>
                    <el-descriptions-item label="数据表">
                      <el-tag>{{ selectedDataset.tableName }}</el-tag>
                      </el-descriptions-item>
                    </el-descriptions>
                  </div>

                <!-- 多表模式 -->
                <div v-if="selectedDataset.queryType === 'multi'" class="query-config">
                  <div class="tables-section">
                      <h5>关联表</h5>
                    <div class="table-tags">
                      <el-tag 
                        v-for="table in selectedDataset.tables" 
                        :key="table" 
                        style="margin-right: 8px; margin-bottom: 8px;"
                      >
                        {{ table }}
                      </el-tag>
                    </div>
                    </div>
                    
                  <div v-if="selectedDataset.relations && selectedDataset.relations.length > 0" class="relations-section">
                      <h5>关联关系</h5>
                    <el-table :data="selectedDataset.relations" size="small">
                      <el-table-column prop="leftTable" label="左表" width="100" />
                      <el-table-column prop="leftField" label="左字段" width="100" />
                      <el-table-column prop="joinType" label="关联类型" width="80">
                          <template #default="{ row }">
                            <el-tag size="small">{{ row.joinType }}</el-tag>
                          </template>
                        </el-table-column>
                      <el-table-column prop="rightTable" label="右表" width="100" />
                      <el-table-column prop="rightField" label="右字段" width="100" />
                      </el-table>
                    </div>
                  </div>

                <!-- SQL模式 -->
                <div v-if="selectedDataset.queryType === 'sql'" class="query-config">
                  <h5>SQL查询语句</h5>
                  <div class="sql-editor">
                    <pre><code>{{ selectedDataset.sqlQuery }}</code></pre>
                  </div>
                </div>
              </div>
                  </div>
                </div>
                
          <!-- 字段结构内容 -->
          <div v-if="activeTab === 'fields'" class="tab-content">
            <div class="detail-content">
              <el-table :data="selectedDataset.fields" style="width: 100%" size="small">
                <el-table-column prop="fieldName" label="字段名" width="120" />
                <el-table-column prop="displayName" label="显示名称" width="120" />
                <el-table-column prop="fieldType" label="数据类型" width="100" />
                    <el-table-column prop="description" label="描述" />
                <el-table-column prop="isVisible" label="可见性" width="80">
                      <template #default="{ row }">
                    <el-tag :type="row.isVisible ? 'success' : 'info'" size="small">
                          {{ row.isVisible ? '可见' : '隐藏' }}
                        </el-tag>
                      </template>
                    </el-table-column>
                  </el-table>
            </div>
                </div>
                
          <!-- 数据预览内容 -->
          <div v-if="activeTab === 'preview'" class="tab-content">
            <div class="detail-content">
                  <div class="preview-header">
                <h4>数据预览</h4>
                <el-button size="small" @click="refreshPreview" :loading="loadingPreview">
                  <el-icon><Refresh /></el-icon>
                  刷新
                </el-button>
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

      <!-- 右侧空状态 -->
      <div class="right-panel-empty" v-else>
        <el-empty description="请选择一个数据集查看详情">
          <el-button type="primary" @click="goToDesigner()">创建新数据集</el-button>
        </el-empty>
      </div>
    </div>

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
import { Search, SortUp, SortDown, Folder, Document, Plus, Edit, View, ArrowDown, Refresh, DataBoard, CircleCheck, CircleClose, Calendar, Grid } from '@element-plus/icons-vue'
import { useRouter } from 'vue-router'
import { dataSetApi, dataSourceApi } from '@/api/dataSource'
import DatasetForm from '@/components/dataset/DatasetForm.vue'
import type { DataSet, DataSource, DataPreviewDTO, TreeNode } from '@/types/dataManagement'

// 路由
const router = useRouter()

// 响应式数据
const datasets = ref<DataSet[]>([])
const dataSources = ref<DataSource[]>([])
const loading = ref(false)
const searchKeyword = ref('')
const sortBy = ref<'name' | 'createTime' | 'updateTime'>('createTime')
const sortOrder = ref<'asc' | 'desc'>('desc')
const selectedDataset = ref<DataSet | null>(null)
const activeTab = ref('details')
const previewData = ref<DataPreviewDTO>({ data: [], columns: [], totalCount: 0 })
const loadingPreview = ref(false)
const selectedDataSourceFilter = ref<number | null>(null)

// 对话框状态
const showCreateFolderDialog = ref(false)

// 表单数据
const folderForm = reactive({
  name: ''
})

// 计算属性 - 过滤后的数据集
const filteredDatasets = computed(() => {
  let result = datasets.value
  
  // 按数据源过滤
  if (selectedDataSourceFilter.value) {
    result = result.filter(ds => ds.dataSourceId === selectedDataSourceFilter.value)
  }
  
  // 按关键词过滤
  if (searchKeyword.value) {
    result = result.filter(ds => 
      ds.name.toLowerCase().includes(searchKeyword.value.toLowerCase()) ||
      (ds.description && ds.description.toLowerCase().includes(searchKeyword.value.toLowerCase()))
    )
  }
  
  return result
})

const activeCount = computed(() => 
  filteredDatasets.value.filter(ds => ds.status === 'active').length
)

const inactiveCount = computed(() => 
  filteredDatasets.value.filter(ds => ds.status === 'inactive').length
)

const dataSourceCount = computed(() => {
  const counts: Record<number, number> = {}
  datasets.value.forEach(ds => {
    counts[ds.dataSourceId] = (counts[ds.dataSourceId] || 0) + 1
  })
  return counts
})

const treeData = ref<TreeNode[]>([])

// 数据源过滤方法
const filterByDataSource = (dataSourceId: number) => {
  if (selectedDataSourceFilter.value === dataSourceId) {
    // 如果点击的是当前选中的数据源，则取消过滤
    selectedDataSourceFilter.value = null
  } else {
    selectedDataSourceFilter.value = dataSourceId
  }
}

const clearDataSourceFilter = () => {
  selectedDataSourceFilter.value = null
}

// 方法定义
const loadDatasets = async () => {
  loading.value = true;
  try {
    const response = await dataSetApi.getDatasets({
      page: 1,
      pageSize: 100,
      keyword: searchKeyword.value
    });
    
    datasets.value = response.items;
    treeData.value = datasets.value.map(dataset => ({
      id: dataset.id,
      name: dataset.name,
      type: 'dataset' as const,
      dataset
    }));
  } catch (error) {
    console.error('加载数据集列表失败:', error);
    ElMessage.error('加载数据集列表失败');
  } finally {
    loading.value = false;
  }
}

const loadDataSources = async () => {
  try {
    dataSources.value = await dataSourceApi.getAllDataSources()
  } catch (error) {
    console.error('加载数据源失败:', error)
  }
}

const getDataSourceName = (dataSourceId: number) => {
  const dataSource = dataSources.value.find(ds => ds.id === dataSourceId)
  return dataSource ? dataSource.name : `数据源${dataSourceId}`
}

const sortDatasets = (type: 'name' | 'createTime' | 'updateTime') => {
  if (sortBy.value === type) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortBy.value = type
    sortOrder.value = 'asc'
  }
  
  datasets.value.sort((a, b) => {
    let comparison = 0
    if (type === 'name') {
      comparison = a.name.localeCompare(b.name)
    } else if (type === 'createTime') {
      comparison = new Date(a.createTime).getTime() - new Date(b.createTime).getTime()
    } else {
      comparison = new Date(a.updateTime).getTime() - new Date(b.updateTime).getTime()
    }
    return sortOrder.value === 'asc' ? comparison : -comparison
  })
}

const handleNodeClick = (data: TreeNode) => {
  if (data.type === 'dataset') {
    selectedDataset.value = data.dataset
    loadPreviewData(data.dataset.id)
  }
}

const loadPreviewData = async (datasetId: number) => {
  if (activeTab.value === 'preview') {
    loadingPreview.value = true
    try {
      previewData.value = await dataSetApi.previewData(datasetId, 100)
    } catch (error) {
      ElMessage.error('加载预览数据失败')
      console.error(error)
    } finally {
      loadingPreview.value = false
    }
  }
}

const refreshPreview = () => {
  if (selectedDataset.value) {
    loadPreviewData(selectedDataset.value.id)
  }
}

const editDataset = (dataset: DataSet) => {
  goToDesigner(dataset.id)
}

const previewDataset = (datasetId: number) => {
  activeTab.value = 'preview'
  loadPreviewData(datasetId)
}

const toggleDatasetStatus = async (dataset: DataSet) => {
  try {
    const newStatus = dataset.status === 'active' ? 'inactive' : 'active'
    await dataSetApi.updateDatasetStatus(dataset.id, newStatus)
    dataset.status = newStatus
    ElMessage.success(`数据集已${newStatus === 'active' ? '启用' : '禁用'}`)
  } catch (error) {
    ElMessage.error('状态更新失败')
    console.error(error)
  }
}

const confirmDelete = async (id: number) => {
  try {
    await ElMessageBox.confirm('确定要删除这个数据集吗？', '确认删除', {
      type: 'warning'
    })
    
    await dataSetApi.deleteDataset(id)
    ElMessage.success('删除成功')
    loadDatasets()
    
    if (selectedDataset.value?.id === id) {
      selectedDataset.value = null
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
      console.error(error)
    }
  }
}

const handleDatasetSuccess = () => {
  showCreateFolderDialog.value = false
  folderForm.name = ''
  loadDatasets()
}

const createFolder = () => {
  // TODO: 实现文件夹创建逻辑
  ElMessage.info('文件夹功能待实现')
  showCreateFolderDialog.value = false
  folderForm.name = ''
}

const formatDate = (dateString?: string) => {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleString()
}

// 监听标签页切换
const handleTabChange = (tabName: string) => {
  if (tabName === 'preview' && selectedDataset.value) {
    loadPreviewData(selectedDataset.value.id)
  }
}

// 获取查询类型标签样式
const getQueryTypeTag = (type: string) => {
  switch (type) {
    case 'single':
      return 'success'
    case 'multi':
      return 'warning'
    case 'sql':
      return 'info'
    default:
      return 'info'
  }
}

// 获取查询类型显示文本
const getQueryTypeLabel = (type: string) => {
  switch (type) {
    case 'single':
      return '单表查询'
    case 'multi':
      return '多表关联'
    case 'sql':
      return '自定义SQL'
    default:
      return type
  }
}

// 获取字段类型标签样式
const getFieldTypeTag = (type: string) => {
  switch (type) {
    case 'dimension':
      return 'success';
    case 'metric':
      return 'warning';
    case 'maintain':
      return 'info';
    default:
      return 'info';
  }
};

// 获取字段类型显示文本
const getFieldTypeLabel = (type: string) => {
  switch (type) {
    case 'dimension':
      return '维度';
    case 'metric':
      return '指标';
    case 'maintain':
      return '维护';
    default:
      return type;
  }
};

// 获取聚合方式显示文本
const getAggregatorLabel = (type: string) => {
  switch (type) {
    case 'sum':
      return '求和';
    case 'count':
      return '计数';
    case 'avg':
      return '平均值';
    case 'max':
      return '最大值';
    case 'min':
      return '最小值';
    default:
      return type;
  }
};

// 生命周期
onMounted(() => {
  loadDatasets()
  loadDataSources()
})

const goToDesigner = (id?: number) => {
  if (id) {
    // 编辑现有数据集
    router.push(`/dataset-designer/${id}`)
  } else {
    // 创建新数据集
    router.push('/dataset-designer')
  }
}

// 选择数据集
const selectDataset = (dataset: any) => {
  selectedDataset.value = dataset
  // 如果选中了数据集，默认显示详情标签页
  if (activeTab.value !== 'details' && activeTab.value !== 'fields' && activeTab.value !== 'preview') {
    activeTab.value = 'details'
  }
}

// 处理下拉菜单命令
const handleCommand = (command: string) => {
  const [action, id] = command.split('-')
  const datasetId = Number(id)
  
  switch (action) {
    case 'toggle':
      toggleDatasetStatus(selectedDataset.value)
      break
    case 'delete':
      confirmDelete(datasetId)
      break
  }
}
</script>

<style scoped lang="scss">
.dataset-manage {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f5f7fa;
  overflow: hidden;
}

/* 页面头部 */
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
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 0;
      font-size: 20px;
      
      .icon-database {
        font-size: 20px;
        color: #fff;
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

/* 主容器 */
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

/* 左侧面板 */
.left-panel {
  width: 380px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-height: 0;
}

/* 搜索区域 */
.search-section {
  background: white;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  
  .search-bar {
    margin-bottom: 12px;
    
    .el-input {
      .el-input__wrapper {
        border-radius: 8px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
      }
    }
  }
  
  .filter-bar {
    .sort-controls {
      display: flex;
      align-items: center;
      gap: 8px;
      
      .sort-label {
        font-size: 13px;
        color: #666;
        font-weight: 500;
      }
      
      .el-button-group {
        .el-button {
          padding: 6px 12px;
          font-size: 12px;
          
          .el-icon {
            margin-left: 4px;
            font-size: 12px;
          }
        }
      }
    }
  }
  
  .filter-status {
    margin-top: 12px;
    padding-top: 12px;
    border-top: 1px solid #f0f0f0;
    
    .el-tag {
      margin-right: 8px;
}
  }
}

/* 统计卡片区域 */
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
  
  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
  
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
  
  &.total {
    .stat-icon {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }
    .stat-value {
      color: #667eea;
    }
  }
  
  &.active {
    .stat-icon {
      background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
      color: white;
    }
    .stat-value {
      color: #4facfe;
    }
  }
  
  &.inactive {
    .stat-icon {
      background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
      color: white;
    }
    .stat-value {
      color: #fa709a;
    }
  }
}

/* 数据源分布 */
.datasource-section {
  background: white;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  
  .section-title {
  margin: 0 0 12px 0;
    font-size: 14px;
    font-weight: 600;
  color: #303133;
}

  .datasource-list {
  display: flex;
    flex-direction: column;
    gap: 8px;
  }
  
  .datasource-item {
    cursor: pointer;
    transition: all 0.3s ease;
    border-radius: 6px;
    
    &:hover {
      transform: translateY(-1px);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

    &.active {
      .datasource-info {
        background: linear-gradient(135deg, #ecf5ff 0%, #e1f0ff 100%);
        border: 1px solid #409eff;
      }
}

    .datasource-info {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 6px 10px;
      background: #f8f9fa;
      border-radius: 6px;
      border: 1px solid transparent;
      transition: all 0.3s ease;
      
      .datasource-count {
  font-size: 12px;
        color: #666;
        font-weight: 500;
}
    }
  }
}

/* 数据集列表 */
.dataset-list-section {
  flex: 1;
  background: white;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  display: flex;
  flex-direction: column;
  min-height: 0;
  max-height: 400px; // 限制最大高度
  
  .section-title {
    margin: 0 0 12px 0;
    font-size: 14px;
    font-weight: 600;
    color: #303133;
  }
  
  .dataset-grid {
    flex: 1;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
  gap: 8px;
    
    &::-webkit-scrollbar {
      width: 4px;
    }
    
    &::-webkit-scrollbar-track {
      background: #f1f1f1;
      border-radius: 2px;
    }
    
    &::-webkit-scrollbar-thumb {
      background: #c1c1c1;
      border-radius: 2px;
      
      &:hover {
        background: #a8a8a8;
      }
    }
  }
}

.dataset-card {
  background: white;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  padding: 12px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  
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
  
  .dataset-header {
  display: flex;
    justify-content: space-between;
  align-items: center;
    margin-bottom: 8px;
    
    .dataset-icon {
      width: 24px;
      height: 24px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      
      .el-icon {
  font-size: 12px;
      }
    }
  }
  
  .dataset-content {
    .dataset-name {
      margin: 0 0 6px 0;
      font-size: 14px;
      font-weight: 600;
      color: #303133;
      line-height: 1.4;
}

    .dataset-description {
      margin: 0 0 8px 0;
      font-size: 12px;
      color: #666;
      line-height: 1.4;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
}

    .dataset-meta {
      display: flex;
      flex-direction: column;
      gap: 4px;
      margin-bottom: 8px;
      
      .meta-item {
  display: flex;
  align-items: center;
        gap: 4px;
        font-size: 11px;
        color: #666;
        
        .el-icon {
          font-size: 12px;
          color: #999;
        }
      }
}

    .dataset-type {
      display: flex;
      justify-content: flex-end;
    }
  }
}

/* 右侧面板 */
.right-panel {
  flex: 1;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  display: flex;
  flex-direction: column;
  min-height: 0;
  
  .detail-tabs-header {
    background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
    border-radius: 12px 12px 0 0;
    border-bottom: 1px solid #e4e7ed;
    
    .detail-tabs-nav {
      :deep(.el-tabs__header) {
        margin: 0;
        padding: 0 20px;
        background: transparent;
        border-bottom: none;
      }
      
      :deep(.el-tabs__nav-wrap) {
        padding: 12px 0;
      }
      
      :deep(.el-tabs__item) {
        font-weight: 500;
        color: #606266;
        font-size: 14px;
        
        &.is-active {
          color: #409eff;
          font-weight: 600;
        }
      }
      
      :deep(.el-tabs__active-bar) {
        background-color: #409eff;
        height: 3px;
      }
      
      :deep(.el-tabs__content) {
        display: none; // 隐藏默认的内容区域
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
        background: #c1c1c1;
        border-radius: 3px;
        
        &:hover {
          background: #a8a8a8;
        }
      }
    }
  }
  
  .detail-header {
    padding: 20px 20px 16px 20px;
    border-bottom: 1px solid #f0f0f0;

    .detail-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
      margin-bottom: 12px;
      
      h2 {
        margin: 0;
        font-size: 18px;
        font-weight: 600;
        color: #303133;
      }
}

    .detail-actions {
      display: flex;
      gap: 8px;
    }
  }
  
  .detail-content {
    padding: 20px;
    
    &::-webkit-scrollbar {
      width: 6px;
    }
    
    &::-webkit-scrollbar-track {
      background: #f1f1f1;
      border-radius: 3px;
}

    &::-webkit-scrollbar-thumb {
      background: #c1c1c1;
      border-radius: 3px;
      
      &:hover {
        background: #a8a8a8;
      }
    }
  }
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

/* 查询详情样式 */
.query-details {
  margin-top: 20px;
  
  h4 {
    margin: 0 0 12px 0;
    font-size: 14px;
    font-weight: 600;
  color: #303133;
}
}

.query-config {
  .tables-section,
  .relations-section {
    margin-bottom: 16px;
    
    h5 {
      margin: 0 0 8px 0;
      font-size: 13px;
      font-weight: 600;
  color: #606266;
    }
}

  .table-tags {
  display: flex;
    flex-wrap: wrap;
    gap: 6px;
}

  .sql-editor {
    background: #f8f9fa;
    border: 1px solid #e4e7ed;
    border-radius: 8px;
    padding: 12px;
    
    pre {
      margin: 0;
      font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
      font-size: 12px;
      line-height: 1.5;
      color: #2c3e50;
      white-space: pre-wrap;
      word-break: break-all;
    }
  }
}

/* 预览区域 */
.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;

  h4 {
  margin: 0;
    font-size: 14px;
    font-weight: 600;
  color: #303133;
  }
}

.preview-footer {
  margin-top: 12px;
  text-align: center;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .main-container {
    padding: 16px 20px;
    gap: 16px;
  }
  
  .left-panel {
    width: 350px;
  }
  
  .page-header {
    padding: 16px 24px;
    
    .page-title {
      font-size: 20px;
    }
  }
}

@media (max-width: 768px) {
  .main-container {
    flex-direction: column;
    padding: 12px 16px;
  }
  
  .left-panel {
    width: 100%;
    order: 2;
  }
  
  .right-panel,
  .right-panel-empty {
    order: 1;
    margin-bottom: 16px;
  }
  
  .page-header {
    padding: 12px 16px;
    
    .header-content {
      flex-direction: column;
      gap: 12px;
      text-align: center;
    }
    
    .page-title {
      font-size: 18px;
    }
    
    .page-description {
      font-size: 13px;
    }
  }
  
  .stats-cards {
    grid-template-columns: 1fr;
  }
  
  .stat-card {
    padding: 12px;
    
    .stat-icon {
      width: 32px;
      height: 32px;
      
      .el-icon {
        font-size: 16px;
      }
    }
    
    .stat-value {
      font-size: 16px;
    }
  }
}

@media (max-width: 480px) {
  .page-header {
    padding: 10px 12px;
  }
  
  .main-container {
    padding: 8px 12px;
  }
  
  .dataset-card {
    padding: 10px;
    
    .dataset-name {
      font-size: 13px;
    }
    
    .dataset-description {
      font-size: 11px;
    }
  }
  
  .detail-header {
    padding: 16px 16px 12px 16px;
    
    .detail-title h2 {
      font-size: 16px;
    }
    
    .detail-actions {
      flex-wrap: wrap;
    }
  }
  
  .detail-content {
    padding: 16px;
  }
}
</style> 