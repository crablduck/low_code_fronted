<template>
  <div class="preview-table">
    <div class="table-header">
      <div class="header-left">
        <span class="table-title">数据预览</span>
        <el-tag v-if="previewData.length > 0" size="small" type="info">
          {{ previewData.length }} 条记录
        </el-tag>
      </div>
      <div class="header-right">
        <el-button-group size="small">
          <el-button 
            :icon="Refresh" 
            @click="refreshPreview"
            :loading="loading"
          >
            刷新
          </el-button>
          <el-button 
            :icon="Download" 
            @click="exportPreview"
            :disabled="previewData.length === 0"
          >
            导出
          </el-button>
        </el-button-group>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading-state">
      <el-skeleton :rows="5" animated />
    </div>

    <!-- 数据表格 -->
    <div v-else-if="previewData.length > 0" class="table-content">
      <el-table
        :data="displayData"
        :max-height="300"
        size="small"
        stripe
        border
        class="preview-data-table"
      >
        <el-table-column
          v-for="column in columns"
          :key="column.key"
          :prop="column.key"
          :label="column.label"
          :width="column.width"
          :min-width="column.minWidth"
          show-overflow-tooltip
        >
          <template #default="{ row }">
            <span :class="getValueClass(row[column.key], column.type)">
              {{ formatValue(row[column.key], column.type) }}
            </span>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <el-pagination
        v-if="previewData.length > pageSize"
        v-model:current-page="currentPage"
        :page-size="pageSize"
        :total="previewData.length"
        layout="prev, pager, next, jumper"
        class="table-pagination"
        small
      />
    </div>

    <!-- 空状态 -->
    <div v-else class="empty-state">
      <el-empty description="暂无预览数据" :image-size="80">
        <el-button type="primary" @click="refreshPreview">
          加载数据
        </el-button>
      </el-empty>
    </div>

    <!-- 统计信息 -->
    <div v-if="computedResult !== null" class="stats-panel">
      <div class="stats-header">
        <el-icon><TrendCharts /></el-icon>
        <span>计算统计</span>
      </div>
      <div class="stats-content">
        <div class="main-result">
          <span class="result-label">计算结果:</span>
          <span class="result-value" :class="getResultValueClass()">
            {{ formatComputedResult() }}
          </span>
        </div>
        <div class="stats-details">
          <div class="stat-item">
            <span class="stat-label">数据行数:</span>
            <span class="stat-value">{{ previewData.length }}</span>
          </div>
          <div class="stat-item" v-if="getValidCount() !== previewData.length">
            <span class="stat-label">有效数据:</span>
            <span class="stat-value">{{ getValidCount() }}</span>
          </div>
          <div class="stat-item" v-if="getNullCount() > 0">
            <span class="stat-label">空值数量:</span>
            <span class="stat-value text-warning">{{ getNullCount() }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Refresh, Download, TrendCharts } from '@element-plus/icons-vue'

// Props & Emits
interface Props {
  previewData: any[]
  computedResult: any
  loading: boolean
}

const props = withDefaults(defineProps<Props>(), {
  previewData: () => [],
  computedResult: null,
  loading: false
})

const emit = defineEmits<{
  'previewUpdate': []
}>()

// 响应式数据
const currentPage = ref(1)
const pageSize = ref(10)

// 计算属性
const columns = computed(() => {
  if (props.previewData.length === 0) return []
  
  const firstRow = props.previewData[0]
  return Object.keys(firstRow).map(key => ({
    key,
    label: key,
    type: inferColumnType(props.previewData, key),
    width: getColumnWidth(key),
    minWidth: getMinColumnWidth(key)
  }))
})

const displayData = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return props.previewData.slice(start, end)
})

// 方法
const refreshPreview = () => {
  emit('previewUpdate')
}

const exportPreview = () => {
  try {
    // 简单的CSV导出
    const csvContent = generateCSV()
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `预览数据_${new Date().getTime()}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
    
    ElMessage.success('数据导出成功')
  } catch (error) {
    console.error('导出失败:', error)
    ElMessage.error('数据导出失败')
  }
}

const generateCSV = (): string => {
  if (props.previewData.length === 0) return ''
  
  const headers = columns.value.map(col => col.label).join(',')
  const rows = props.previewData.map(row => 
    columns.value.map(col => {
      const value = row[col.key]
      // 处理包含逗号或引号的值
      if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
        return `"${value.replace(/"/g, '""')}"`
      }
      return value || ''
    }).join(',')
  ).join('\n')
  
  return `${headers}\n${rows}`
}

const inferColumnType = (data: any[], columnKey: string): string => {
  if (data.length === 0) return 'string'
  
  // 检查前几行数据来推断类型
  const samples = data.slice(0, Math.min(10, data.length))
  let types = new Set()
  
  for (const row of samples) {
    const value = row[columnKey]
    if (value === null || value === undefined) continue
    
    if (typeof value === 'number') {
      types.add('number')
    } else if (typeof value === 'boolean') {
      types.add('boolean')
    } else if (typeof value === 'string') {
      // 尝试判断是否是日期
      if (isValidDate(value)) {
        types.add('date')
      } else {
        types.add('string')
      }
    }
  }
  
  // 返回最可能的类型
  if (types.has('number')) return 'number'
  if (types.has('date')) return 'date'
  if (types.has('boolean')) return 'boolean'
  return 'string'
}

const isValidDate = (value: string): boolean => {
  const date = new Date(value)
  return !isNaN(date.getTime()) && !!value.match(/^\d{4}-\d{2}-\d{2}/)
}

const getColumnWidth = (columnKey: string): number => {
  const baseWidth = 120
  const keyLength = columnKey.length
  return Math.max(baseWidth, keyLength * 8 + 40)
}

const getMinColumnWidth = (columnKey: string): number => {
  return Math.max(80, columnKey.length * 6 + 20)
}

const formatValue = (value: any, type: string): string => {
  if (value === null || value === undefined) return '-'
  
  switch (type) {
    case 'number':
      return typeof value === 'number' ? value.toLocaleString() : value.toString()
    case 'date':
      try {
        return new Date(value).toLocaleDateString()
      } catch {
        return value.toString()
      }
    case 'boolean':
      return value ? '是' : '否'
    default:
      return value.toString()
  }
}

const getValueClass = (value: any, type: string): string => {
  if (value === null || value === undefined) return 'text-muted'
  
  switch (type) {
    case 'number':
      return 'text-number'
    case 'date':
      return 'text-date'
    case 'boolean':
      return value ? 'text-success' : 'text-warning'
    default:
      return ''
  }
}

const formatComputedResult = (): string => {
  if (props.computedResult === null || props.computedResult === undefined) {
    return '-'
  }
  
  if (typeof props.computedResult === 'number') {
    return props.computedResult.toLocaleString()
  }
  
  return props.computedResult.toString()
}

const getResultValueClass = (): string => {
  if (typeof props.computedResult === 'number') {
    return props.computedResult > 0 ? 'text-success' : 'text-info'
  }
  return 'text-primary'
}

const getValidCount = (): number => {
  if (props.previewData.length === 0) return 0
  
  const firstKey = Object.keys(props.previewData[0])[0]
  if (!firstKey) return 0
  
  return props.previewData.filter(row => 
    row[firstKey] !== null && row[firstKey] !== undefined && row[firstKey] !== ''
  ).length
}

const getNullCount = (): number => {
  return props.previewData.length - getValidCount()
}

// 监听数据变化，重置分页
watch(() => props.previewData, () => {
  currentPage.value = 1
}, { deep: true })
</script>

<style scoped>
.preview-table {
  .table-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
    padding: 8px 0;
    
    .header-left {
      display: flex;
      align-items: center;
      gap: 8px;
      
      .table-title {
        font-weight: 600;
        color: #303133;
        font-size: 14px;
      }
    }
  }

  .loading-state {
    padding: 20px;
  }

  .table-content {
    .preview-data-table {
      border-radius: 6px;
      overflow: hidden;
      
      :deep(.el-table__header) {
        background: #f8f9fa;
        
        th {
          background: #f8f9fa !important;
          color: #303133;
          font-weight: 600;
          font-size: 12px;
        }
      }
      
      :deep(.el-table__body) {
        tr {
          &:nth-child(even) {
            background: #fafafa;
          }
          
          td {
            padding: 6px 8px;
            font-size: 12px;
          }
        }
      }
    }
    
    .table-pagination {
      margin-top: 16px;
      text-align: center;
    }
  }

  .empty-state {
    text-align: center;
    padding: 40px 20px;
  }

  .stats-panel {
    margin-top: 16px;
    padding: 16px;
    background: #f8f9fa;
    border-radius: 6px;
    border: 1px solid #e4e7ed;
    
    .stats-header {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-bottom: 12px;
      color: #303133;
      font-weight: 600;
      font-size: 13px;
    }
    
    .stats-content {
      .main-result {
        margin-bottom: 12px;
        padding: 12px;
        background: white;
        border-radius: 4px;
        border-left: 3px solid #409eff;
        
        .result-label {
          color: #909399;
          font-size: 12px;
          margin-right: 8px;
        }
        
        .result-value {
          font-size: 18px;
          font-weight: 600;
        }
      }
      
      .stats-details {
        display: flex;
        gap: 16px;
        flex-wrap: wrap;
        
        .stat-item {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 12px;
          
          .stat-label {
            color: #909399;
          }
          
          .stat-value {
            color: #303133;
            font-weight: 500;
          }
        }
      }
    }
  }
}

/* 值类型样式 */
.text-number {
  color: #67c23a;
  font-family: monospace;
}

.text-date {
  color: #e6a23c;
}

.text-success {
  color: #67c23a;
}

.text-warning {
  color: #e6a23c;
}

.text-info {
  color: #409eff;
}

.text-primary {
  color: #303133;
  font-weight: 600;
}

.text-muted {
  color: #c0c4cc;
  font-style: italic;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .preview-table {
    .table-header {
      flex-direction: column;
      gap: 8px;
      align-items: stretch;
    }
    
    .stats-content .stats-details {
      flex-direction: column;
      gap: 8px;
    }
  }
}
</style> 