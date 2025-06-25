import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { 
  datasetPreview, 
  crossSourcePreview,
  previewCalculatedField,
  type DatasetPreviewRequest,
  type CrossSourcePreviewRequest,
  type CalculatedFieldPreviewRequest 
} from '@/api/dataset'
import type { DataPreviewDTO, DataSetFieldConfig } from '@/shared/types/dataManagement'

/**
 * 数据集预览功能的组合式函数
 * 根据API使用指南文档规范实现
 */
export function useDatasetPreview() {
  const loading = ref(false)
  const previewData = ref<DataPreviewDTO>({
    data: [],
    columns: [],
    totalCount: 0
  })

  // 单数据源预览 - 根据文档规范
  const previewSingleSource = async (
    dataSourceId: number,
    tableName: string,
    fields: DataSetFieldConfig[],
    filters: any[] = [],
    limit: number = 100
  ) => {
    loading.value = true
    
    try {
      const request: DatasetPreviewRequest = {
        dataSourceId,
        tableName,
        fields: fields.map(field => ({
          fieldName: field.fieldName,
          fieldType: field.fieldType,
          isCalculated: field.isCalculated || false,
          expression: field.expression,
          aggregation: field.aggregation
        })),
        filters: filters.map(filter => ({
          fieldName: filter.field || filter.fieldName,
          operator: filter.operator,
          value: filter.value
        })),
        limit
      }

      console.log('单数据源预览请求:', request)
      const response = await datasetPreview(request)
      const result = response.data
      
      // 智能处理不同的数据格式
      let transformedData: any[] = []
      
      if (result.records && Array.isArray(result.records)) {
        // 如果返回的是对象数组格式，直接使用
        transformedData = result.records
      } else if (result.data && Array.isArray(result.data)) {
        // 如果返回的是二维数组格式，转换为对象数组
        transformedData = result.data.map((row: any[]) => {
          const obj: Record<string, any> = {}
          result.columns.forEach((column: string, index: number) => {
            obj[column] = row[index]
          })
          return obj
        })
      }
      
      previewData.value = {
        data: transformedData,
        columns: result.columns || [],
        totalCount: result.totalCount || 0
      }
      
      console.log('单数据源预览结果:', {
        recordCount: previewData.value.data.length,
        columnCount: previewData.value.columns.length,
        totalCount: previewData.value.totalCount,
        executionTime: result.executionTime,
        queryType: result.queryType
      })
      
      return previewData.value
    } catch (error) {
      ElMessage.error('单数据源预览失败')
      console.error('单数据源预览错误:', error)
      
      // 优雅降级：使用模拟数据
      const mockData = generateMockPreviewData(fields, limit)
      previewData.value = mockData
      ElMessage.info('使用模拟数据进行预览')
      return mockData
    } finally {
      loading.value = false
    }
  }

  // 跨数据源预览 - 根据文档规范
  const previewCrossSource = async (
    dataSourceIds: number[],
    tables: Array<{ tableName: string; dataSourceId: number; alias: string }>,
    relations: any[],
    fields: DataSetFieldConfig[],
    filters: any[] = [],
    limit: number = 100
  ) => {
    loading.value = true
    
    try {
      const request: CrossSourcePreviewRequest = {
        dataSourceIds,
        tables,
        relations,
        fields: fields.map(field => ({
          fieldName: field.fieldName,
          tableName: field.tableName || '',
          fieldType: field.fieldType,
          aggregation: field.aggregation
        })),
        filters: filters.map(filter => ({
          fieldName: filter.field || filter.fieldName,
          operator: filter.operator,
          value: filter.value
        })),
        limit
      }

      console.log('跨数据源预览请求:', request)
      const response = await crossSourcePreview(request)
      const result = response.data
      
      // 智能处理不同的数据格式
      let transformedData: any[] = []
      
      if (result.records && Array.isArray(result.records)) {
        // 如果返回的是对象数组格式，直接使用
        transformedData = result.records
      } else if (result.data && Array.isArray(result.data)) {
        // 如果返回的是二维数组格式，转换为对象数组
        transformedData = result.data.map((row: any[]) => {
          const obj: Record<string, any> = {}
          result.columns.forEach((column: string, index: number) => {
            obj[column] = row[index]
          })
          return obj
        })
      }
      
      previewData.value = {
        data: transformedData,
        columns: result.columns || [],
        totalCount: result.totalCount || 0
      }
      
      console.log('跨数据源预览结果:', {
        recordCount: previewData.value.data.length,
        columnCount: previewData.value.columns.length,
        totalCount: previewData.value.totalCount,
        executionTime: result.executionTime,
        queryType: result.queryType || '跨数据源查询'
      })
      
      return previewData.value
    } catch (error) {
      ElMessage.error('跨数据源预览失败')
      console.error('跨数据源预览错误:', error)
      
      // 优雅降级：使用模拟数据
      const mockData = generateMockPreviewData(fields, limit)
      previewData.value = mockData
      ElMessage.info('使用模拟数据进行预览')
      return mockData
    } finally {
      loading.value = false
    }
  }

  // 计算字段预览 - 根据文档规范
  const previewCalculatedFieldResult = async (
    expression: string,
    fieldName: string,
    tableName: string,
    dataSourceId: number,
    limit: number = 10
  ) => {
    loading.value = true
    
    try {
      const request: CalculatedFieldPreviewRequest = {
        expression,
        fieldName,
        tableName,
        dataSourceId,
        limit
      }

      console.log('计算字段预览请求:', request)
      const response = await previewCalculatedField(request)
      const result = response.data
      
      // 转换二维数组为对象数组格式（如果是二维数组的话）
      let transformedData = result.records || result.data || []
      if (Array.isArray(transformedData) && transformedData.length > 0 && Array.isArray(transformedData[0])) {
        transformedData = transformedData.map((row: any[]) => {
          const obj: Record<string, any> = {}
          result.columns.forEach((column: string, index: number) => {
            obj[column] = row[index]
          })
          return obj
        })
      }
      
      const previewResult = {
        data: transformedData,
        columns: result.columns || [fieldName],
        totalCount: transformedData.length || 0,
        statistics: result.statistics || {},
        executionTime: result.executionTime
      }
      
      console.log('计算字段预览结果:', previewResult)
      return previewResult
    } catch (error) {
      ElMessage.error('计算字段预览失败')
      console.error('计算字段预览错误:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  // 基于配置的智能预览 - 根据文档规范
  const previewByConfig = async (config: {
    queryType: 'single' | 'multi' | 'sql'
    dataSourceId?: number
    dataSourceIds?: number[]
    tableName?: string
    tables?: string[]
    fields: DataSetFieldConfig[]
    relations?: any[]
    filters?: any[]
    limit?: number
  }) => {
    const { queryType, limit = 100, filters = [] } = config

    switch (queryType) {
      case 'single':
        if (!config.dataSourceId || !config.tableName) {
          throw new Error('单表查询需要指定数据源ID和表名')
        }
        return await previewSingleSource(
          config.dataSourceId,
          config.tableName,
          config.fields,
          filters,
          limit
        )

      case 'multi':
        if (!config.dataSourceIds || !config.tables) {
          throw new Error('多表查询需要指定数据源IDs和表配置')
        }
        const tables = config.tables.map((tableName, index) => ({
          tableName,
          dataSourceId: config.dataSourceIds![index] || config.dataSourceIds![0],
          alias: `t${index + 1}`
        }))
        return await previewCrossSource(
          config.dataSourceIds,
          tables,
          config.relations || [],
          config.fields,
          filters,
          limit
        )

      case 'sql':
        // SQL模式使用单数据源预览
        if (!config.dataSourceId) {
          throw new Error('SQL查询需要指定数据源ID')
        }
        return await previewSingleSource(
          config.dataSourceId,
          'custom_sql',
          config.fields,
          filters,
          limit
        )

      default:
        throw new Error('不支持的查询类型')
    }
  }

  // 刷新预览数据
  const refreshPreview = async (config: any) => {
    return await previewByConfig(config)
  }

  // 生成模拟预览数据
  const generateMockPreviewData = (fields: DataSetFieldConfig[], limit: number = 10): DataPreviewDTO => {
    const mockRecords = []
    const columns = fields.map(f => f.fieldName)
    
    for (let i = 0; i < Math.min(limit, 10); i++) {
      const record: any = {}
      fields.forEach(field => {
        switch (field.fieldType) {
          case 'dimension':
            if (field.fieldName.includes('name') || field.fieldName.includes('姓名')) {
              record[field.fieldName] = `用户${i + 1}`
            } else if (field.fieldName.includes('id') || field.fieldName.includes('编号')) {
              record[field.fieldName] = 1000 + i
            } else if (field.fieldName.includes('status') || field.fieldName.includes('状态')) {
              record[field.fieldName] = i % 2 === 0 ? '正常' : '异常'
            } else {
              record[field.fieldName] = `示例数据${i + 1}`
            }
            break
          case 'metric':
            if (field.fieldName.includes('count') || field.fieldName.includes('数量')) {
              record[field.fieldName] = Math.floor(Math.random() * 100) + 1
            } else if (field.fieldName.includes('amount') || field.fieldName.includes('金额')) {
              record[field.fieldName] = (Math.random() * 10000).toFixed(2)
            } else {
              record[field.fieldName] = Math.floor(Math.random() * 1000)
            }
            break
          default:
            record[field.fieldName] = `数据${i + 1}`
        }
      })
      mockRecords.push(record)
    }
    
    return {
      data: mockRecords,
      columns,
      totalCount: mockRecords.length
    }
  }

  // 导出预览数据
  const exportPreviewData = (filename?: string) => {
    if (!previewData.value.data || previewData.value.data.length === 0) {
      ElMessage.warning('没有可导出的数据')
      return
    }

    try {
      const headers = previewData.value.columns
      const csvContent = [
        headers.join(','),
        ...previewData.value.data.map(row => 
          headers.map(col => {
            const value = row[col]
            const formattedValue = value === null || value === undefined ? '' : String(value)
            return formattedValue.includes(',') || formattedValue.includes('"') 
              ? `"${formattedValue.replace(/"/g, '""')}"` 
              : formattedValue
          }).join(',')
        )
      ].join('\n')
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      
      link.setAttribute('href', url)
      link.setAttribute('download', filename || `数据预览_${new Date().getTime()}.csv`)
      link.style.visibility = 'hidden'
      
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      ElMessage.success('数据导出成功')
    } catch (error) {
      console.error('导出失败:', error)
      ElMessage.error('数据导出失败')
    }
  }

  // 计算属性
  const hasData = computed(() => previewData.value.data.length > 0)
  const columnCount = computed(() => previewData.value.columns.length)
  const recordCount = computed(() => previewData.value.data.length)

  return {
    // 状态
    loading,
    previewData,
    hasData,
    columnCount,
    recordCount,
    
    // 方法 - 根据文档规范
    previewSingleSource,
    previewCrossSource,
    previewCalculatedFieldResult,
    previewByConfig,
    refreshPreview,
    exportPreviewData
  }
}

// 全局数据集预览功能（保持兼容性）
export function useGlobalDatasetPreview() {
  const { previewSingleSource, previewCrossSource } = useDatasetPreview()
  
  return {
    previewSingleSource,
    previewCrossSource
  }
} 