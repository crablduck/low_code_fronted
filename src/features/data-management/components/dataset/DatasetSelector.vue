<template>
  <div class="dataset-selector">
    <!-- 数据集选择器 -->
    <el-card class="selector-card">
      <template #header>
        <div class="card-header">
          <el-button-group>
            <el-button 
              size="small" 
              @click="refreshDatasets"
              :loading="loading"
            >
              <el-icon><Refresh /></el-icon>
              刷新
            </el-button>
            <el-button 
              size="small" 
              type="primary"
              @click="showCreateDataset"
            >
              <el-icon><Plus /></el-icon>
              新建
            </el-button>
          </el-button-group>
        </div>
      </template>

      <!-- 搜索和筛选 -->
      <div class="filter-section">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-input
              v-model="searchKeyword"
              placeholder="搜索数据集名称"
              clearable
              @input="handleSearch"
            >
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>
          </el-col>
          <el-col :span="6">
            <el-select
              v-model="categoryFilter"
              placeholder="分类筛选"
              clearable
              @change="handleCategoryChange"
            >
              <el-option label="全部" value="" />
              <el-option label="业务数据" value="business" />
              <el-option label="统计报表" value="report" />
              <el-option label="实时监控" value="monitor" />
              <el-option label="其他" value="other" />
            </el-select>
          </el-col>
          <el-col :span="6">
            <el-select
              v-model="typeFilter"
              placeholder="查询类型"
              clearable
              @change="handleTypeChange"
            >
              <el-option label="全部" value="" />
              <el-option label="单表查询" value="single" />
              <el-option label="多表关联" value="multi" />
              <el-option label="自定义SQL" value="sql" />
            </el-select>
          </el-col>
        </el-row>
      </div>

      <!-- 数据集列表 -->
      <div class="dataset-list" v-loading="loading">
        <el-empty v-if="filteredDatasets.length === 0" description="暂无数据集">
          <el-button type="primary" @click="showCreateDataset">创建第一个数据集</el-button>
        </el-empty>
        
        <div v-else class="dataset-grid">
          <div
            v-for="dataset in filteredDatasets"
            :key="dataset.id"
            class="dataset-item"
            :class="{ 'selected': selectedDataset?.id === dataset.id }"
            @click="handleDatasetSelect(dataset)"
          >
            <div class="dataset-header">
              <div class="dataset-title">
                <el-icon class="dataset-icon"><DataBoard /></el-icon>
                <span class="dataset-name">{{ dataset.name }}</span>
              </div>
              <div class="dataset-actions">
                <el-button
                  size="small"
                  text
                  @click.stop="previewDataset(dataset)"
                  title="预览数据"
                >
                  <el-icon><View /></el-icon>
                </el-button>
                <el-button
                  size="small"
                  text
                  @click.stop="editDataset(dataset)"
                  title="编辑数据集"
                >
                  <el-icon><Edit /></el-icon>
                </el-button>
              </div>
            </div>
            
            <div class="dataset-info">
              <p class="dataset-description">{{ dataset.description || '暂无描述' }}</p>
              <div class="dataset-meta">
                <el-tag size="small" :type="getQueryTypeTag(dataset.queryType)">
                  {{ getQueryTypeLabel(dataset.queryType) }}
                </el-tag>
                <el-tag size="small" type="info">
                  {{ dataset.dataSourceName || '未知数据源' }}
                </el-tag>
                <span class="dataset-time">{{ formatTime(dataset.createTime) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 分页 -->
      <el-pagination
        v-if="filteredDatasets.length > pageSize"
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :total="totalCount"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </el-card>



    <!-- 数据预览对话框 -->
    <el-dialog
      v-model="previewVisible"
      title="数据预览"
      width="80%"
      :before-close="closePreview"
    >
      <div v-loading="previewLoading">
        <el-table
          :data="previewData.data"
          stripe
          border
          max-height="400"
          style="width: 100%"
        >
          <el-table-column
            v-for="column in previewData.columns"
            :key="column"
            :prop="column"
            :label="column"
            show-overflow-tooltip
            min-width="120"
          />
        </el-table>
        <div class="preview-footer">
          <span>显示前 {{ previewData.data.length }} 条记录，共 {{ previewData.totalCount }} 条</span>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 
  Search, 
  Refresh, 
  Plus, 
  DataBoard, 
  View, 
  Edit, 
  Check 
} from '@element-plus/icons-vue'
import { dataSetApi } from '@/api/dataSource'
import type { DataSet, DataPreviewDTO } from '@/shared/types/dataManagement'

// Props
interface Props {
  modelValue?: DataSet | null
  multiple?: boolean
  showPreview?: boolean
  showCreate?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: null,
  multiple: false,
  showPreview: true,
  showCreate: true
})

// Emits
interface Emits {
  (e: 'update:modelValue', value: DataSet | null): void
  (e: 'change', value: DataSet | null): void
  (e: 'preview', dataset: DataSet): void
  (e: 'edit', dataset: DataSet): void
  (e: 'create'): void
}

const emit = defineEmits<Emits>()

// 响应式数据
const loading = ref(false)
const datasets = ref<DataSet[]>([])
const selectedDataset = ref<DataSet | null>(props.modelValue)
const searchKeyword = ref('')
const categoryFilter = ref('')
const typeFilter = ref('')
const currentPage = ref(1)
const pageSize = ref(20)
const totalCount = ref(0)

// 预览相关
const previewVisible = ref(false)
const previewLoading = ref(false)
const previewData = ref<DataPreviewDTO>({
  columns: [],
  data: [],
  totalCount: 0
})

// 计算属性
const filteredDatasets = computed(() => {
  let result = datasets.value

  // 关键字搜索
  if (searchKeyword.value) {
    result = result.filter(dataset => 
      dataset.name.toLowerCase().includes(searchKeyword.value.toLowerCase()) ||
      (dataset.description && dataset.description.toLowerCase().includes(searchKeyword.value.toLowerCase()))
    )
  }

  // 分类筛选 (暂时注释掉，因为 DataSet 类型中没有 category 属性)
  // if (categoryFilter.value) {
  //   result = result.filter(dataset => dataset.category === categoryFilter.value)
  // }

  // 类型筛选
  if (typeFilter.value) {
    result = result.filter(dataset => dataset.queryType === typeFilter.value)
  }

  return result
})

// 方法
const loadDatasets = async () => {
  loading.value = true
  try {
    const response = await dataSetApi.getDatasets({
      page: currentPage.value,
      pageSize: pageSize.value
    })
    
    console.log('数据集API响应:', response)
    datasets.value = response.data || []
    totalCount.value = response.total || 0
  } catch (error) {
    console.error('加载数据集列表失败:', error)
    ElMessage.error('加载数据集列表失败')
  } finally {
    loading.value = false
  }
}

const refreshDatasets = () => {
  currentPage.value = 1
  loadDatasets()
}

const handleSearch = () => {
  currentPage.value = 1
}

const handleCategoryChange = () => {
  currentPage.value = 1
}

const handleTypeChange = () => {
  currentPage.value = 1
}

const handleSizeChange = (newSize: number) => {
  pageSize.value = newSize
  loadDatasets()
}

const handleCurrentChange = (newPage: number) => {
  currentPage.value = newPage
  loadDatasets()
}

const handleDatasetSelect = (dataset: DataSet) => {
  selectedDataset.value = dataset
  emit('update:modelValue', dataset)
  emit('change', dataset)
}

const confirmSelection = () => {
  if (selectedDataset.value) {
    ElMessage.success(`已选择数据集：${selectedDataset.value.name}`)
  }
}

const previewDataset = async (dataset: DataSet) => {
  if (!props.showPreview) {
    emit('preview', dataset)
    return
  }

  previewVisible.value = true
  previewLoading.value = true
  
  try {
    previewData.value = await dataSetApi.previewData(dataset, 100)
  } catch (error) {
    console.error('预览数据失败:', error)
    ElMessage.error('预览数据失败')
  } finally {
    previewLoading.value = false
  }
}

const editDataset = (dataset: DataSet) => {
  emit('edit', dataset)
}

const showCreateDataset = () => {
  emit('create')
}

const closePreview = () => {
  previewVisible.value = false
  previewData.value = { columns: [], data: [], totalCount: 0 }
}

const loadFields = async () => {
  if (!selectedDataset.value) return
  
  try {
    const updated = await dataSetApi.getDatasetById(selectedDataset.value.id)
    selectedDataset.value = updated
    emit('update:modelValue', updated)
    ElMessage.success('字段信息已刷新')
  } catch (error) {
    console.error('刷新字段失败:', error)
    ElMessage.error('刷新字段失败')
  }
}

// 辅助方法
const getQueryTypeTag = (type: string) => {
  switch (type) {
    case 'single': return 'success'
    case 'multi': return 'warning'
    case 'sql': return 'danger'
    default: return 'info'
  }
}

const getQueryTypeLabel = (type: string) => {
  switch (type) {
    case 'single': return '单表查询'
    case 'multi': return '多表关联'
    case 'sql': return '自定义SQL'
    default: return type
  }
}

const getCategoryLabel = (category: string) => {
  switch (category) {
    case 'business': return '业务数据'
    case 'report': return '统计报表'
    case 'monitor': return '实时监控'
    case 'other': return '其他'
    default: return category
  }
}

const getFieldTypeTag = (type: string) => {
  switch (type) {
    case 'dimension': return 'success'
    case 'metric': return 'warning'
    default: return 'info'
  }
}

const getFieldTypeLabel = (type: string) => {
  switch (type) {
    case 'dimension': return '维度'
    case 'metric': return '指标'
    default: return type
  }
}

const getAggregationLabel = (agg: string) => {
  switch (agg) {
    case 'sum': return '求和'
    case 'count': return '计数'
    case 'avg': return '平均'
    case 'max': return '最大'
    case 'min': return '最小'
    default: return agg
  }
}

const formatTime = (time: string) => {
  return new Date(time).toLocaleDateString()
}

const formatFullTime = (time: string) => {
  return new Date(time).toLocaleString()
}



// 监听器
watch(() => props.modelValue, (newValue) => {
  selectedDataset.value = newValue
})

// 生命周期
onMounted(() => {
  loadDatasets()
})
</script>

<style scoped>
.dataset-selector {
  display: flex;
  flex-direction: column;
  gap: 0;
  background: transparent;
  height: 100%;
}

.selector-card {
  flex: 1;
  border: 2px solid #e2e8f0;
  border-radius: 16px;
  box-shadow: 
    0 4px 12px rgba(0, 0, 0, 0.05),
    0 2px 6px rgba(0, 0, 0, 0.03);
  height: 100%;
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, #ffffff 0%, #fafbfc 100%);
  overflow: hidden;
  transition: all 0.3s ease;
  
  &:hover {
    box-shadow: 
      0 8px 24px rgba(0, 0, 0, 0.08),
      0 4px 12px rgba(0, 0, 0, 0.05);
    transform: translateY(-1px);
  }
}

.selector-card :deep(.el-card__header) {
  padding: 10px 12px;
  border-bottom: 1px solid #f1f5f9;
  flex-shrink: 0;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
}

.selector-card :deep(.el-card__body) {
  padding: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: transparent;
  min-height: 0;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header h4 {
  margin: 0;
  color: #1e293b;
  font-size: 16px;
  font-weight: 700;
  letter-spacing: -0.01em;
  display: flex;
  align-items: center;
  gap: 8px;
  
  &::before {
    content: '';
    width: 4px;
    height: 16px;
    background: linear-gradient(135deg, #3b82f6, #8b5cf6);
    border-radius: 2px;
  }
}

.filter-section {
  margin-bottom: 6px;
  padding: 10px 12px;
  flex-shrink: 0;
  background: #fafbfc;
  border-bottom: 1px solid #f1f5f9;
  position: relative;
  z-index: 10;
  
  :deep(.el-form-item) {
    margin-bottom: 6px;
    
    &:last-child {
      margin-bottom: 0;
    }
  }
  
  :deep(.el-input__wrapper) {
    border-radius: 6px;
    border: 1px solid #e2e8f0;
    background: #ffffff;
    transition: all 0.3s ease;
    box-shadow: none;
    
    &:hover {
      border-color: #cbd5e1;
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
    }
    
    &.is-focus {
      border-color: #3b82f6;
      box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
    }
  }
  
  :deep(.el-select) {
    .el-select__wrapper {
      border-radius: 6px;
      border: 1px solid #e2e8f0;
      background: #ffffff;
      transition: all 0.3s ease;
      box-shadow: none;
      
      &:hover {
        border-color: #cbd5e1;
        box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
      }
      
      &.is-focus {
        border-color: #3b82f6;
        box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
      }
    }
  }
}

.dataset-list {
  flex: 1;
  padding: 8px;
  overflow-y: auto;
  min-height: 0;
  
  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: #f8fafc;
    border-radius: 3px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: linear-gradient(135deg, #cbd5e1, #94a3b8);
    border-radius: 3px;
    
    &:hover {
      background: linear-gradient(135deg, #94a3b8, #64748b);
    }
  }
}

.dataset-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-content: flex-start;
}

.dataset-item {
  flex: 0 0 auto;
  width: 160px;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  padding: 8px 12px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  background: linear-gradient(135deg, #ffffff 0%, #fafbfc 100%);
  box-shadow: 
    0 2px 8px rgba(0, 0, 0, 0.04),
    inset 0 1px 2px rgba(255, 255, 255, 0.8);
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 4px;
    background: linear-gradient(135deg, #e2e8f0, #cbd5e1);
    transition: all 0.3s ease;
  }
}

.dataset-item:hover {
  border-color: #3b82f6;
  box-shadow: 
    0 8px 24px rgba(59, 130, 246, 0.15),
    0 4px 12px rgba(0, 0, 0, 0.08),
    inset 0 1px 2px rgba(255, 255, 255, 0.9);
  transform: translateY(-2px);
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  
  &::before {
    background: linear-gradient(135deg, #3b82f6, #8b5cf6);
  }
}

.dataset-item.selected {
  border-color: #3b82f6;
  background: linear-gradient(135deg, #dbeafe 0%, #f0f9ff 100%);
  box-shadow: 
    0 6px 20px rgba(59, 130, 246, 0.2),
    0 2px 8px rgba(0, 0, 0, 0.06),
    inset 0 1px 2px rgba(255, 255, 255, 0.9);
  
  &::before {
    background: linear-gradient(135deg, #3b82f6, #1d4ed8);
    width: 6px;
  }
}

.dataset-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(226, 232, 240, 0.6);
}

.dataset-title {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
}

.dataset-icon {
  color: #3b82f6;
  font-size: 18px;
  padding: 4px;
  background: rgba(59, 130, 246, 0.1);
  border-radius: 6px;
  transition: all 0.2s ease;
}

.dataset-item:hover .dataset-icon {
  background: rgba(59, 130, 246, 0.2);
  transform: scale(1.1);
}

.dataset-name {
  font-weight: 600;
  color: #1e293b;
  font-size: 14px;
  letter-spacing: -0.01em;
}

.dataset-actions {
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  
  .el-button {
    border-radius: 6px;
    padding: 4px 8px;
    font-size: 12px;
    
    &:hover {
      transform: translateY(-1px);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    }
  }
}

.dataset-item:hover .dataset-actions {
  opacity: 1;
}

.dataset-info {
  margin-top: 8px;
}

.dataset-description {
  margin: 0 0 8px 0;
  color: #64748b;
  font-size: 12px;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  font-weight: 400;
}

.dataset-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  
  .el-tag {
    font-size: 10px;
    font-weight: 600;
    padding: 2px 6px;
    border-radius: 4px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
}

.dataset-time {
  font-size: 11px;
  color: #94a3b8;
  margin-left: auto;
  font-weight: 500;
  background: rgba(148, 163, 184, 0.1);
  padding: 2px 6px;
  border-radius: 4px;
}

.preview-footer {
  margin-top: 16px;
  text-align: center;
  color: #909399;
  font-size: 12px;
}
</style> 