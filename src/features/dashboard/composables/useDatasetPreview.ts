import { ref, computed, readonly } from 'vue'
import { ElMessage } from 'element-plus'
import { previewDatasetData } from '@/api/dataset'
import type { DataSet, DataSetField } from '@/shared/types/dataManagement'

/**
 * 数据集预览功能的组合式函数
 * 提供数据集预览数据的获取、处理和状态管理
 */
export function useDatasetPreview() {
  // 响应式状态
  const previewData = ref<any[]>([])
  const previewColumns = ref<string[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const lastDatasetId = ref<number | null>(null)

  // 计算属性
  const hasData = computed(() => previewData.value.length > 0)
  const isEmpty = computed(() => !isLoading.value && previewData.value.length === 0)
  const dataCount = computed(() => previewData.value.length)

  /**
   * 加载数据集预览数据
   * @param datasetId 数据集ID
   * @param forceRefresh 是否强制刷新（忽略缓存）
   */
  const loadPreviewData = async (datasetId: number, forceRefresh = false) => {
    // 如果是相同的数据集且不强制刷新，直接返回
    if (!forceRefresh && lastDatasetId.value === datasetId && hasData.value) {
      console.log(`数据集 ${datasetId} 预览数据已缓存，直接使用`)
      return { success: true, data: previewData.value }
    }

    isLoading.value = true
    error.value = null

    try {
      console.log(`📊 开始加载数据集预览数据: ID=${datasetId}`)
      
      const response = await previewDatasetData(datasetId)
      
      if (response.code !== 200) {
        throw new Error(response.message || '获取预览数据失败')
      }

      if (!response.data) {
        throw new Error('API返回的数据为空')
      }

      // 处理不同的API响应格式
      const processedData = processApiResponse(response.data)
      
      previewData.value = processedData.data
      previewColumns.value = processedData.columns
      lastDatasetId.value = datasetId

      console.log(`✅ 数据集 ${datasetId} 预览加载成功: ${previewData.value.length} 条记录`)
      
      return { 
        success: true, 
        data: previewData.value,
        columns: previewColumns.value
      }

    } catch (err: any) {
      console.error(`❌ 数据集 ${datasetId} 预览加载失败:`, err)
      error.value = err.message || '未知错误'
      
      // 清空数据
      previewData.value = []
      previewColumns.value = []
      
      ElMessage.error(`数据预览加载失败: ${error.value}`)
      
      return { 
        success: false, 
        error: error.value 
      }
      
    } finally {
      isLoading.value = false
    }
  }

  /**
   * 处理不同格式的API响应数据
   * @param apiData API返回的数据
   */
  const processApiResponse = (apiData: any): { data: any[], columns: string[] } => {
    let processedData: any[] = []
    let columns: string[] = []

    if (apiData.columns && apiData.data) {
      // 格式1：{ columns: string[], data: any[][] }
      // 例如：{ columns: ['name', 'age'], data: [['张三', 25], ['李四', 30]] }
      columns = apiData.columns
      processedData = apiData.data.map((row: any[]) => {
        const obj: Record<string, any> = {}
        columns.forEach((column: string, index: number) => {
          obj[column] = row[index]
        })
        return obj
      })
      console.log(`📋 处理列-行格式数据: ${columns.length} 列, ${processedData.length} 行`)
      
    } else if (apiData.content && Array.isArray(apiData.content)) {
      // 格式2：{ content: any[], totalCount?: number }
      // 例如：{ content: [{name: '张三', age: 25}], totalCount: 100 }
      processedData = apiData.content
      if (processedData.length > 0) {
        columns = Object.keys(processedData[0])
      }
      console.log(`📋 处理内容格式数据: ${processedData.length} 条记录`)
      
    } else if (Array.isArray(apiData)) {
      // 格式3：直接的数组格式
      // 例如：[{name: '张三', age: 25}, {name: '李四', age: 30}]
      processedData = apiData
      if (processedData.length > 0) {
        columns = Object.keys(processedData[0])
      }
      console.log(`📋 处理数组格式数据: ${processedData.length} 条记录`)
      
    } else {
      // 未知格式
      console.warn('⚠️ 未知的API数据格式:', apiData)
      throw new Error('不支持的数据格式')
    }

    return { data: processedData, columns }
  }

  /**
   * 获取字段的显示名称
   * @param fieldName 字段名称
   * @param datasetFields 数据集字段配置（可选）
   */
  const getFieldDisplayName = (fieldName: string, datasetFields?: DataSetField[]) => {
    if (datasetFields) {
      const field = datasetFields.find(f => f.fieldName === fieldName)
      return field?.displayName || field?.fieldName || fieldName
    }
    return fieldName
  }

  /**
   * 格式化单元格值
   * @param value 原始值
   * @param fieldType 字段类型（可选）
   */
  const formatCellValue = (value: any, fieldType?: string) => {
    if (value === null || value === undefined) {
      return '-'
    }

    if (typeof value === 'number') {
      // 数字格式化
      if (fieldType === 'metric') {
        return value.toLocaleString()
      }
      return value.toString()
    }

    if (value instanceof Date) {
      // 日期格式化
      return value.toLocaleDateString()
    }

    if (typeof value === 'string') {
      // 字符串长度限制
      if (value.length > 50) {
        return value.substring(0, 50) + '...'
      }
      return value
    }

    return String(value)
  }

  /**
   * 获取预览数据的分页子集
   * @param page 页码（从1开始）
   * @param pageSize 每页大小
   */
  const getPagedData = (page = 1, pageSize = 10) => {
    const start = (page - 1) * pageSize
    const end = start + pageSize
    return {
      data: previewData.value.slice(start, end),
      total: previewData.value.length,
      hasMore: end < previewData.value.length
    }
  }

  /**
   * 根据字段搜索数据
   * @param searchText 搜索文本
   * @param searchFields 搜索的字段列表（默认搜索所有字段）
   */
  const searchData = (searchText: string, searchFields?: string[]) => {
    if (!searchText.trim()) {
      return previewData.value
    }

    const searchLower = searchText.toLowerCase()
    const fieldsToSearch = searchFields || previewColumns.value

    return previewData.value.filter(row => {
      return fieldsToSearch.some(field => {
        const value = row[field]
        if (value === null || value === undefined) return false
        return String(value).toLowerCase().includes(searchLower)
      })
    })
  }

  /**
   * 获取字段的统计信息
   * @param fieldName 字段名称
   */
  const getFieldStats = (fieldName: string) => {
    if (!hasData.value || !previewColumns.value.includes(fieldName)) {
      return null
    }

    const values = previewData.value.map(row => row[fieldName]).filter(v => v !== null && v !== undefined)
    const uniqueValues = [...new Set(values)]

    const stats = {
      fieldName,
      totalCount: previewData.value.length,
      nonNullCount: values.length,
      nullCount: previewData.value.length - values.length,
      uniqueCount: uniqueValues.length,
      dataType: detectDataType(values),
      sampleValues: uniqueValues.slice(0, 10)
    }

    // 数值字段的额外统计
    if (stats.dataType === 'number') {
      const numericValues = values.filter(v => typeof v === 'number')
      if (numericValues.length > 0) {
        Object.assign(stats, {
          min: Math.min(...numericValues),
          max: Math.max(...numericValues),
          avg: numericValues.reduce((a, b) => a + b, 0) / numericValues.length
        })
      }
    }

    return stats
  }

  /**
   * 检测数据类型
   * @param values 值数组
   */
  const detectDataType = (values: any[]): 'string' | 'number' | 'date' | 'boolean' | 'mixed' => {
    if (values.length === 0) return 'string'

    const types = new Set(values.map(v => typeof v))
    
    if (types.size === 1) {
      const type = types.values().next().value
      if (['string', 'number', 'boolean'].includes(type)) {
        return type
      }
    }

    // 检查是否为日期
    const datePattern = /^\d{4}-\d{2}-\d{2}/ // 简单的日期模式
    if (values.every(v => typeof v === 'string' && datePattern.test(v))) {
      return 'date'
    }

    return 'mixed'
  }

  /**
   * 清空预览数据
   */
  const clearData = () => {
    previewData.value = []
    previewColumns.value = []
    error.value = null
    lastDatasetId.value = null
  }

  /**
   * 重新加载当前数据集的预览数据
   */
  const refreshData = async () => {
    if (lastDatasetId.value) {
      return await loadPreviewData(lastDatasetId.value, true)
    }
    return { success: false, error: '没有可刷新的数据集' }
  }

  return {
    // 状态
    previewData: readonly(previewData),
    previewColumns: readonly(previewColumns),
    isLoading: readonly(isLoading),
    error: readonly(error),
    
    // 计算属性
    hasData,
    isEmpty,
    dataCount,
    
    // 方法
    loadPreviewData,
    getFieldDisplayName,
    formatCellValue,
    getPagedData,
    searchData,
    getFieldStats,
    clearData,
    refreshData
  }
}

// 创建全局实例（如果需要在多个组件间共享）
let globalPreviewInstance: ReturnType<typeof useDatasetPreview> | null = null

export function useGlobalDatasetPreview() {
  if (!globalPreviewInstance) {
    globalPreviewInstance = useDatasetPreview()
  }
  return globalPreviewInstance
} 