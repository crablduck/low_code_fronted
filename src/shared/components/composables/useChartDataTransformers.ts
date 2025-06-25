import { ref, reactive } from 'vue'
import { 
  transformChartData, 
  generateEChartsOption,
  type DatasetApiResponse,
  type ChartFieldMapping,
  type ChartDataResult
} from '@/shared/utils/chartDataTransform'

// 转换器接口定义
export interface DataTransformer {
  id: string
  name: string
  description: string
  supportedCharts: string[]
  transform: (options: TransformOptions) => Promise<any>
  priority: number
}

export interface TransformOptions {
  rawData: any
  chartType: string
  fieldMapping?: ChartFieldMapping
  config?: Record<string, any>
}

// 转换器注册表
const transformers = reactive<Map<string, DataTransformer>>(new Map())

// 缓存
const transformCache = reactive<Map<string, any>>(new Map())

/**
 * 图表数据转换器组合式函数
 */
export function useChartDataTransformers() {
  
  // 注册默认转换器
  const registerDefaultTransformers = () => {
    // 默认转换器
    registerTransformer({
      id: 'default',
      name: '默认转换器',
      description: '标准数据转换',
      supportedCharts: ['bar', 'line', 'pie', 'table', 'scatter'],
      priority: 1,
      transform: async (options: TransformOptions) => {
        const { rawData, chartType, fieldMapping, config } = options
        
        // 数据预处理
        const processedData = preprocessData(rawData, config)
        
        // 执行转换
        const chartData: ChartDataResult = transformChartData(
          chartType,
          processedData,
          fieldMapping || {}
        )
        
        // 生成图表配置
        const echartsOption = generateEChartsOption(
          chartType,
          chartData,
          '数据图表',
          {
            showLegend: true,
            showToolbox: false,
            theme: 'light'
          }
        )
        
        return {
          chartData,
          echartsOption,
          metadata: {
            transformer: 'default',
            chartType,
            fieldMapping,
            recordCount: getDataRecordCount(chartData)
          }
        }
      }
    })

    // 智能预览转换器
    registerTransformer({
      id: 'smart-preview',
      name: '智能预览转换器', 
      description: '支持智能预览API',
      supportedCharts: ['bar', 'line', 'pie', 'table'],
      priority: 2,
      transform: async (options: TransformOptions) => {
        const { rawData, chartType, fieldMapping, config } = options
        
        // 智能字段选择
        const smartFieldMapping = autoSelectFields(rawData, chartType, fieldMapping)
        
        // 数据采样
        const sampledData = applySampling(rawData, config?.samplingRate || 80)
        
        // 执行转换
        const chartData: ChartDataResult = transformChartData(
          chartType,
          sampledData,
          smartFieldMapping
        )
        
        const echartsOption = generateEChartsOption(
          chartType,
          chartData,
          '智能预览图表'
        )
        
        return {
          chartData,
          echartsOption,
          metadata: {
            transformer: 'smart-preview',
            chartType,
            fieldMapping: smartFieldMapping,
            recordCount: getDataRecordCount(chartData),
            smartFeatures: {
              autoFieldSelection: true,
              samplingApplied: (config?.samplingRate || 80) < 100
            }
          }
        }
      }
    })

    // 医疗数据转换器
    registerTransformer({
      id: 'medical',
      name: '医疗数据转换器',
      description: '医疗行业专用转换器',
      supportedCharts: ['bar', 'line', 'pie', 'table', 'medical-chart'],
      priority: 3,
      transform: async (options: TransformOptions) => {
        const { rawData, chartType, fieldMapping, config } = options
        
        // 数据脱敏
        let processedData = rawData
        if (config?.dataDesensitization) {
          processedData = applyMedicalDesensitization(rawData)
        }
        
        // 年龄分组
        if (config?.ageGrouping) {
          processedData = applyAgeGrouping(processedData)
        }
        
        // 医疗编码转换
        if (config?.medicalCoding?.length > 0) {
          processedData = applyMedicalCoding(processedData, config.medicalCoding)
        }
        
        const chartData: ChartDataResult = transformChartData(
          chartType,
          processedData,
          fieldMapping || {}
        )
        
        const echartsOption = generateEChartsOption(
          chartType,
          chartData,
          '医疗数据图表'
        )
        
        return {
          chartData,
          echartsOption,
          metadata: {
            transformer: 'medical',
            chartType,
            fieldMapping,
            recordCount: getDataRecordCount(chartData),
            medicalFeatures: {
              desensitized: config?.dataDesensitization,
              ageGrouped: config?.ageGrouping,
              codingApplied: config?.medicalCoding?.length > 0
            }
          }
        }
      }
    })
  }

  // 注册转换器
  const registerTransformer = (transformer: DataTransformer) => {
    transformers.set(transformer.id, transformer)
  }

  // 获取转换器
  const getTransformer = (id: string): DataTransformer | undefined => {
    return transformers.get(id)
  }

  // 获取可用转换器列表
  const availableTransformers = ref(
    Array.from(transformers.values()).sort((a, b) => a.priority - b.priority)
  )

  // 执行转换
  const executeTransform = async (transformerId: string, options: TransformOptions) => {
    const transformer = getTransformer(transformerId)
    if (!transformer) {
      throw new Error(`转换器 ${transformerId} 不存在`)
    }

    // 检查图表类型支持
    if (!transformer.supportedCharts.includes(options.chartType)) {
      throw new Error(`转换器 ${transformer.name} 不支持图表类型 ${options.chartType}`)
    }

    // 生成缓存键
    const cacheKey = generateCacheKey(transformerId, options)
    
    // 检查缓存
    if (options.config?.enableCache && transformCache.has(cacheKey)) {
      console.log('使用缓存的转换结果')
      return transformCache.get(cacheKey)
    }

    // 执行转换
    const result = await transformer.transform(options)
    
    // 存储缓存
    if (options.config?.enableCache) {
      transformCache.set(cacheKey, result)
    }

    return result
  }

  // 清空缓存
  const clearTransformCache = () => {
    transformCache.clear()
  }

  // 生成缓存键
  const generateCacheKey = (transformerId: string, options: TransformOptions): string => {
    const key = {
      transformerId,
      chartType: options.chartType,
      fieldMapping: options.fieldMapping,
      dataHash: hashData(options.rawData)
    }
    return JSON.stringify(key)
  }

  // 数据哈希
  const hashData = (data: any): string => {
    return btoa(JSON.stringify(data)).substring(0, 16)
  }

  // 初始化
  if (transformers.size === 0) {
    registerDefaultTransformers()
    availableTransformers.value = Array.from(transformers.values()).sort((a, b) => a.priority - b.priority)
  }

  return {
    transformers,
    availableTransformers,
    registerTransformer,
    getTransformer,
    executeTransform,
    clearTransformCache
  }
}

// 辅助函数

/**
 * 数据预处理
 */
function preprocessData(rawData: any, config?: Record<string, any>): DatasetApiResponse {
  let processedData: DatasetApiResponse
  
  // 确保数据格式正确
  if (rawData.code && rawData.data) {
    processedData = rawData as DatasetApiResponse
  } else {
    processedData = {
      code: 200,
      message: 'success',
      data: {
        columns: rawData.columns || Object.keys(rawData[0] || {}),
        data: Array.isArray(rawData) ? rawData.map(Object.values) : rawData.data || [],
        totalCount: Array.isArray(rawData) ? rawData.length : rawData.data?.length || 0
      }
    }
  }

  // 应用数据限制
  if (config?.dataLimit && processedData.data.data.length > config.dataLimit) {
    processedData.data.data = processedData.data.data.slice(0, config.dataLimit)
    processedData.data.totalCount = config.dataLimit
  }

  return processedData
}

/**
 * 自动字段选择
 */
function autoSelectFields(rawData: any, chartType: string, existingMapping?: ChartFieldMapping): ChartFieldMapping {
  if (existingMapping && Object.keys(existingMapping).length > 0) {
    return existingMapping
  }

  const columns = rawData.data?.columns || []
  const records = rawData.data?.data || []
  
  if (columns.length === 0 || records.length === 0) {
    return {}
  }

  // 分析字段类型
  const fieldTypes = analyzeFieldTypes(columns, records)
  const textFields = fieldTypes.filter(f => f.type === 'text').map(f => f.name)
  const numericFields = fieldTypes.filter(f => f.type === 'numeric').map(f => f.name)

  const mapping: ChartFieldMapping = {}

  switch (chartType) {
    case 'bar':
    case 'line':
      if (textFields.length > 0 && numericFields.length > 0) {
        mapping.xField = textFields[0]
        mapping.yField = numericFields[0]
      }
      break
    case 'pie':
      if (textFields.length > 0 && numericFields.length > 0) {
        mapping.nameField = textFields[0]
        mapping.valueField = numericFields[0]
      }
      break
    case 'table':
      mapping.tableFields = columns.slice(0, 5) // 显示前5个字段
      break
  }

  return mapping
}

/**
 * 分析字段类型
 */
function analyzeFieldTypes(columns: string[], records: any[][]): Array<{name: string, type: 'text' | 'numeric' | 'date'}> {
  return columns.map((column, index) => {
    const sample = records.slice(0, 10).map(row => row[index])
    const numericCount = sample.filter(val => !isNaN(Number(val))).length
    
    return {
      name: column,
      type: numericCount > sample.length * 0.7 ? 'numeric' : 'text'
    }
  })
}

/**
 * 数据采样
 */
function applySampling(data: any, samplingRate: number) {
  if (samplingRate >= 100) return data
  
  const records = data.data?.data || []
  const sampleSize = Math.floor(records.length * samplingRate / 100)
  const sampledRecords = records.slice(0, sampleSize)
  
  return {
    ...data,
    data: {
      ...data.data,
      data: sampledRecords,
      totalCount: sampledRecords.length
    }
  }
}

/**
 * 医疗数据脱敏
 */
function applyMedicalDesensitization(data: any) {
  const sensitiveFields = ['patient_name', 'id_card', 'phone', 'address']
  const columns = data.data?.columns || []
  const records = data.data?.data || []
  
  const sensitiveIndices = columns.map((col: string, index: number) => ({
    index,
    isSensitive: sensitiveFields.some(field => col.toLowerCase().includes(field))
  })).filter(item => item.isSensitive).map(item => item.index)
  
  const desensitizedRecords = records.map((row: any[]) => {
    return row.map((cell, index) => {
      if (sensitiveIndices.includes(index)) {
        return '***' // 简单脱敏
      }
      return cell
    })
  })
  
  return {
    ...data,
    data: {
      ...data.data,
      data: desensitizedRecords
    }
  }
}

/**
 * 年龄分组
 */
function applyAgeGrouping(data: any) {
  const columns = data.data?.columns || []
  const records = data.data?.data || []
  
  const ageColumnIndex = columns.findIndex((col: string) => 
    col.toLowerCase().includes('age') || col.toLowerCase().includes('年龄')
  )
  
  if (ageColumnIndex === -1) return data
  
  const ageGroups = [
    { min: 0, max: 17, label: '未成年' },
    { min: 18, max: 35, label: '青年' },
    { min: 36, max: 59, label: '中年' },
    { min: 60, max: 120, label: '老年' }
  ]
  
  const groupedRecords = records.map((row: any[]) => {
    const newRow = [...row]
    const age = parseInt(row[ageColumnIndex])
    
    if (!isNaN(age)) {
      const group = ageGroups.find(g => age >= g.min && age <= g.max)
      if (group) {
        newRow[ageColumnIndex] = group.label
      }
    }
    
    return newRow
  })
  
  return {
    ...data,
    data: {
      ...data.data,
      data: groupedRecords
    }
  }
}

/**
 * 医疗编码转换
 */
function applyMedicalCoding(data: any, codingTypes: string[]) {
  // 这里可以实现具体的医疗编码转换逻辑
  console.log('应用医疗编码转换:', codingTypes)
  return data
}

/**
 * 获取数据记录数
 */
function getDataRecordCount(chartData: ChartDataResult): number {
  if (chartData.tableData) return chartData.tableData.length
  if (chartData.values) return chartData.values.length
  if (chartData.xAxis) return chartData.xAxis.length
  return 0
} 