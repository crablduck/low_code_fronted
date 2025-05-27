<template>
  <div class="data-preview">
    <div class="preview-header">
      <div class="header-info">
        <h4>数据预览</h4>
        <span v-if="data.totalCount > 0" class="record-count">
          共 {{ data.totalCount }} 条记录，显示前 {{ Math.min(limit, data.totalCount) }} 条
        </span>
      </div>
      <div class="header-actions">
        <el-button size="small" @click="refreshData" :loading="loading">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
        <el-button size="small" @click="exportData">
          <el-icon><Download /></el-icon>
          导出
        </el-button>
      </div>
    </div>

    <div class="preview-content">
      <el-table
        :data="data.data"
        v-loading="loading"
        style="width: 100%"
        :max-height="maxHeight"
        stripe
        border
        :empty-text="emptyText"
      >
        <el-table-column
          v-for="column in visibleColumns"
          :key="column"
          :prop="column"
          :label="getColumnLabel(column)"
          :width="getColumnWidth(column)"
          show-overflow-tooltip
        >
          <template #default="{ row }">
            <span :class="getValueClass(row[column])">
              {{ formatValue(row[column]) }}
            </span>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <div v-if="data.totalCount > limit" class="preview-footer">
      <el-alert
        :title="`数据量较大，仅显示前 ${limit} 条记录。如需查看更多数据，请调整查询条件或导出完整数据。`"
        type="info"
        :closable="false"
        show-icon
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { ElMessage } from 'element-plus'
import { Refresh, Download } from '@element-plus/icons-vue'
import type { DataPreviewDTO } from '@/types/dataManagement'

// Props
interface Props {
  data: DataPreviewDTO
  loading?: boolean
  limit?: number
  maxHeight?: number | string
  emptyText?: string
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  limit: 100,
  maxHeight: 400,
  emptyText: '暂无数据'
})

// Emits
const emit = defineEmits<{
  refresh: []
  export: []
}>()

// 计算属性
const visibleColumns = computed(() => {
  return props.data.columns || []
})

// 方法定义
const getColumnLabel = (column: string): string => {
  // 简单的列名美化
  const labelMap: Record<string, string> = {
    'id': 'ID',
    'patient_id': '患者ID',
    'patient_name': '患者姓名',
    'doctor_id': '医生ID',
    'doctor_name': '医生姓名',
    'department_name': '科室名称',
    'age': '年龄',
    'gender': '性别',
    'phone': '电话',
    'address': '地址',
    'create_time': '创建时间',
    'update_time': '更新时间',
    'total_amount': '总金额',
    'status': '状态'
  }
  
  return labelMap[column.toLowerCase()] || column
}

const getColumnWidth = (column: string): number | undefined => {
  // 根据列名设置合适的宽度
  const widthMap: Record<string, number> = {
    'id': 80,
    'patient_id': 100,
    'doctor_id': 100,
    'age': 80,
    'gender': 80,
    'phone': 120,
    'status': 100,
    'create_time': 160,
    'update_time': 160
  }
  
  return widthMap[column.toLowerCase()]
}

const getValueClass = (value: any): string => {
  if (value === null || value === undefined || value === '') {
    return 'null-value'
  }
  
  if (typeof value === 'number') {
    return 'number-value'
  }
  
  if (typeof value === 'boolean') {
    return 'boolean-value'
  }
  
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) {
    return 'date-value'
  }
  
  return 'text-value'
}

const formatValue = (value: any): string => {
  if (value === null || value === undefined) {
    return '-'
  }
  
  if (value === '') {
    return '(空)'
  }
  
  if (typeof value === 'boolean') {
    return value ? '是' : '否'
  }
  
  if (typeof value === 'number') {
    // 如果是整数，直接显示；如果是小数，保留2位小数
    return Number.isInteger(value) ? value.toString() : value.toFixed(2)
  }
  
  if (typeof value === 'string') {
    // 如果是日期时间格式，进行格式化
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) {
      return new Date(value).toLocaleString()
    }
    
    // 如果是日期格式
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return new Date(value).toLocaleDateString()
    }
  }
  
  return String(value)
}

const refreshData = () => {
  emit('refresh')
}

const exportData = () => {
  if (!props.data.data || props.data.data.length === 0) {
    ElMessage.warning('没有可导出的数据')
    return
  }
  
  try {
    // 简单的CSV导出
    const headers = props.data.columns.map(col => getColumnLabel(col))
    const csvContent = [
      headers.join(','),
      ...props.data.data.map(row => 
        props.data.columns.map(col => {
          const value = row[col]
          const formattedValue = formatValue(value)
          // 如果值包含逗号或引号，需要用引号包围并转义
          return formattedValue.includes(',') || formattedValue.includes('"') 
            ? `"${formattedValue.replace(/"/g, '""')}"` 
            : formattedValue
        }).join(',')
      )
    ].join('\n')
    
    // 创建下载链接
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `数据预览_${new Date().toISOString().slice(0, 10)}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    ElMessage.success('数据导出成功')
  } catch (error) {
    ElMessage.error('数据导出失败')
    console.error('导出错误:', error)
  }
}
</script>

<style scoped>
.data-preview {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 0;
  border-bottom: 1px solid #e4e7ed;
}

.header-info h4 {
  margin: 0 0 4px 0;
  color: #303133;
}

.record-count {
  font-size: 12px;
  color: #909399;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.preview-content {
  flex: 1;
  overflow: hidden;
}

.preview-footer {
  padding: 16px 0;
}

/* 值类型样式 */
.null-value {
  color: #c0c4cc;
  font-style: italic;
}

.number-value {
  color: #e6a23c;
  font-family: 'Courier New', monospace;
}

.boolean-value {
  color: #67c23a;
  font-weight: 500;
}

.date-value {
  color: #409eff;
  font-family: 'Courier New', monospace;
}

.text-value {
  color: #303133;
}
</style> 