/**
 * 仪表盘数据服务
 * 处理数据集数据的获取、转换和图表渲染
 */

import { previewDatasetData, smartPreviewDataset } from '@/api/dataset'
import { 
  transformChartData, 
  generateEChartsOption,
  type DatasetApiResponse,
  type ChartFieldMapping,
  type ChartDataResult
} from '@/shared/utils/chartDataTransform'

export interface ChartConfig {
  i: string
  type: 'bar' | 'line' | 'pie' | 'table'
  title: string
  datasetId?: number
  fieldMapping?: ChartFieldMapping
  showLegend?: boolean
  showToolbox?: boolean
  dataLimit?: number
  // 新增：过滤条件支持
  filters?: Array<{
    fieldName: string
    operator: string
    value: any
  }>
}

/**
 * 获取图表数据（支持过滤条件）
 * @param datasetId 数据集ID
 * @param chartType 图表类型
 * @param fieldMapping 字段映射配置
 * @param chartConfig 图表配置
 * @returns ECharts配置选项
 */
export const getChartData = async (
  datasetId: number,
  chartType: string,
  fieldMapping: ChartFieldMapping,
  chartConfig?: Partial<ChartConfig>
): Promise<any> => {
  try {
    // 1. 构建智能预览选项
    const previewOptions = {
      filters: chartConfig?.filters || [],
      selectedFieldNames: getSelectedFieldNames(chartType, fieldMapping),
      limit: chartConfig?.dataLimit || 100
    }

    console.log(`获取图表数据 - 数据集ID: ${datasetId}, 图表类型: ${chartType}`, previewOptions)

    // 2. 使用智能预览接口获取数据
    const apiResponse = await smartPreviewDataset(datasetId, previewOptions)
    
    if (apiResponse.code !== 200) {
      throw new Error(apiResponse.message || '获取数据集数据失败')
    }

    // 3. 转换智能预览响应为标准格式
    const standardResponse = transformSmartPreviewResponse(apiResponse)
    
    // 4. 数据验证
    if (!standardResponse.data || !standardResponse.data.columns || !standardResponse.data.data) {
      throw new Error('数据集返回的数据格式不正确')
    }
    
    // 5. 转换数据为图表格式
    const chartData: ChartDataResult = transformChartData(chartType, standardResponse, fieldMapping)
    
    // 6. 生成ECharts配置
    const echartsOption = generateEChartsOption(
      chartType,
      chartData,
      chartConfig?.title || '图表',
      {
        showLegend: chartConfig?.showLegend,
        showToolbox: chartConfig?.showToolbox,
        theme: 'light'
      }
    )
    
    return echartsOption
    
  } catch (error) {
    console.error(`获取图表数据失败 (datasetId: ${datasetId}):`, error)
    // 降级到原有接口
    console.log('降级使用原有预览接口')
    return getChartDataFallback(datasetId, chartType, fieldMapping, chartConfig)
  }
}

/**
 * 获取表格数据（支持过滤条件）
 * @param datasetId 数据集ID
 * @param fieldMapping 字段映射配置
 * @param filters 过滤条件
 * @returns 表格数据数组
 */
export const getTableData = async (
  datasetId: number,
  fieldMapping?: ChartFieldMapping,
  filters?: Array<{
    fieldName: string
    operator: string
    value: any
  }>
): Promise<any[]> => {
  try {
    // 1. 构建智能预览选项
    const previewOptions = {
      filters: filters || [],
      selectedFieldNames: fieldMapping?.tableFields,
      limit: 1000 // 表格数据限制更大
    }

    console.log(`获取表格数据 - 数据集ID: ${datasetId}`, previewOptions)

    // 2. 使用智能预览接口获取数据
    const apiResponse = await smartPreviewDataset(datasetId, previewOptions)
    
    if (apiResponse.code !== 200) {
      throw new Error(apiResponse.message || '获取数据集数据失败')
    }

    // 3. 转换智能预览响应为标准格式
    const standardResponse = transformSmartPreviewResponse(apiResponse)
    
    const chartData = transformChartData('table', standardResponse, fieldMapping || {})
    return chartData.tableData || []
    
  } catch (error) {
    console.error(`获取表格数据失败 (datasetId: ${datasetId}):`, error)
    // 降级到原有接口
    console.log('降级使用原有预览接口')
    return getTableDataFallback(datasetId, fieldMapping)
  }
}

/**
 * 根据图表类型和字段映射获取所需字段名
 */
const getSelectedFieldNames = (chartType: string, fieldMapping: ChartFieldMapping): string[] | undefined => {
  const fields: string[] = []
  
  switch (chartType) {
    case 'bar':
    case 'line':
      if (fieldMapping.xField || fieldMapping.xAxis) fields.push(fieldMapping.xField || fieldMapping.xAxis!)
      if (fieldMapping.yField || fieldMapping.yAxis) fields.push(fieldMapping.yField || fieldMapping.yAxis!)
      if (fieldMapping.series) fields.push(fieldMapping.series)
      break
    case 'pie':
      if (fieldMapping.nameField) fields.push(fieldMapping.nameField)
      if (fieldMapping.valueField) fields.push(fieldMapping.valueField)
      break
    case 'table':
      if (fieldMapping.tableFields) fields.push(...fieldMapping.tableFields)
      break
  }
  
  return fields.length > 0 ? fields : undefined
}

/**
 * 转换智能预览响应为标准数据格式
 */
const transformSmartPreviewResponse = (smartResponse: any): DatasetApiResponse => {
  const data = smartResponse.data
  
  // 智能预览可能返回不同的数据格式，需要统一转换为二维数组格式
  let columns: string[] = []
  let dataArray: any[][] = []
  
  if (data.columns && data.records) {
    // 格式1: { columns: string[], records: object[] }
    // 需要将对象数组转换为二维数组
    columns = data.columns
    dataArray = data.records.map((record: any) => {
      return columns.map(column => record[column])
    })
    console.log('转换格式1 (对象数组 -> 二维数组):', { columns, recordsCount: data.records.length, dataArrayCount: dataArray.length })
  } else if (data.columns && data.data) {
    // 格式2: { columns: string[], data: any[][] }
    // 已经是二维数组格式，直接使用
    columns = data.columns
    dataArray = data.data
    console.log('使用格式2 (已是二维数组):', { columns, dataArrayCount: dataArray.length })
  } else if (Array.isArray(data) && data.length > 0) {
    // 格式3: 直接是对象数组
    // 需要将对象数组转换为二维数组
    const records = data
    columns = Object.keys(records[0])
    dataArray = records.map((record: any) => {
      return columns.map(column => record[column])
    })
    console.log('转换格式3 (直接对象数组 -> 二维数组):', { columns, recordsCount: records.length, dataArrayCount: dataArray.length })
  } else {
    // 其他格式，尝试智能识别
    if (data.content && Array.isArray(data.content)) {
      const records = data.content
      if (records.length > 0) {
        columns = Object.keys(records[0])
        dataArray = records.map((record: any) => {
          return columns.map(column => record[column])
        })
        console.log('转换其他格式 (content对象数组 -> 二维数组):', { columns, recordsCount: records.length, dataArrayCount: dataArray.length })
      }
    }
  }
  
  return {
    code: smartResponse.code,
    message: smartResponse.message,
    data: {
      columns,
      data: dataArray,  // 始终返回二维数组格式
      totalCount: data.totalCount || dataArray.length
    }
  }
}

/**
 * 降级方案：使用原有预览接口获取图表数据
 */
const getChartDataFallback = async (
  datasetId: number,
  chartType: string,
  fieldMapping: ChartFieldMapping,
  chartConfig?: Partial<ChartConfig>
): Promise<any> => {
  const apiResponse = await previewDatasetData(datasetId) as any
  
  if (apiResponse.code !== 200) {
    throw new Error(apiResponse.message || '获取数据集数据失败')
  }
  
  if (!apiResponse.data || !apiResponse.data.columns || !apiResponse.data.data) {
    throw new Error('数据集返回的数据格式不正确')
  }
  
  const chartData: ChartDataResult = transformChartData(chartType, apiResponse, fieldMapping)
  
  const echartsOption = generateEChartsOption(
    chartType,
    chartData,
    chartConfig?.title || '图表',
    {
      showLegend: chartConfig?.showLegend,
      showToolbox: chartConfig?.showToolbox,
      theme: 'light'
    }
  )
  
  return echartsOption
}

/**
 * 降级方案：使用原有预览接口获取表格数据
 */
const getTableDataFallback = async (
  datasetId: number,
  fieldMapping?: ChartFieldMapping
): Promise<any[]> => {
  const apiResponse = await previewDatasetData(datasetId) as any
  
  if (apiResponse.code !== 200) {
    throw new Error(apiResponse.message || '获取数据集数据失败')
  }
  
  const chartData = transformChartData('table', apiResponse, fieldMapping || {})
  return chartData.tableData || []
}

/**
 * 验证字段映射配置
 * @param chartType 图表类型
 * @param fieldMapping 字段映射配置
 * @param availableFields 可用字段列表
 * @returns 验证结果
 */
export const validateFieldMapping = (
  chartType: string,
  fieldMapping: ChartFieldMapping,
  availableFields: string[]
): { valid: boolean; errors: string[] } => {
  const errors: string[] = []
  
  switch (chartType) {
    case 'bar':
    case 'line':
      // 兼容新旧字段映射格式
      const xField = fieldMapping.xAxis || fieldMapping.xField
      const yField = fieldMapping.yAxis || fieldMapping.yField
      
      if (!xField) {
        errors.push('请配置X轴字段')
      } else if (!availableFields.includes(xField)) {
        errors.push(`X轴字段 "${xField}" 在数据集中不存在`)
      }
      
      if (!yField) {
        errors.push('请配置Y轴字段')
      } else if (!availableFields.includes(yField)) {
        errors.push(`Y轴字段 "${yField}" 在数据集中不存在`)
      }
      break
    
    case 'pie':
      if (!fieldMapping.nameField) {
        errors.push('请配置名称字段')
      } else if (!availableFields.includes(fieldMapping.nameField)) {
        errors.push(`名称字段 "${fieldMapping.nameField}" 在数据集中不存在`)
      }
      
      if (!fieldMapping.valueField) {
        errors.push('请配置数值字段')
      } else if (!availableFields.includes(fieldMapping.valueField)) {
        errors.push(`数值字段 "${fieldMapping.valueField}" 在数据集中不存在`)
      }
      break
    
    case 'table':
      if (fieldMapping.tableFields) {
        fieldMapping.tableFields.forEach(field => {
          if (!availableFields.includes(field)) {
            errors.push(`表格字段 "${field}" 在数据集中不存在`)
          }
        })
      }
      break
  }
  
  return {
    valid: errors.length === 0,
    errors
  }
}

/**
 * 获取字段映射建议（基于字段元数据）
 * @param datasetId 数据集ID
 * @param chartType 图表类型
 * @returns 字段映射建议
 */
export const getDatasetFieldSuggestion = async (
  datasetId: number,
  chartType: string
): Promise<ChartFieldMapping> => {
  try {
    // 获取数据集详细信息（包含字段元数据）
    // TODO: 需要实现数据集详细信息获取接口
    // const response = await get(dataSourceService, `/dataset/${datasetId}`)
    // console.log('数据集详细信息:', response)
    const response = { code: 404, data: null }
    
    if (response.code !== 200 || !response.data) {
      // 如果获取失败，回退到简单的字段名推荐
      const fields = await getDatasetFields(datasetId)
      return suggestFieldMapping(chartType, fields)
    }
    
    const dataset = response.data
    const fields = dataset.fields || []
    
    // 根据 businessType 分类字段
    const dimensionFields = fields
      .filter((field: any) => field.businessType === 'DIMENSION')
      .map((field: any) => field.fieldName)
    
    const metricFields = fields
      .filter((field: any) => field.businessType === 'METRIC')
      .map((field: any) => field.fieldName)
    
    console.log('字段分类:', { dimensionFields, metricFields })
    
    const suggestion: ChartFieldMapping = {}
    
    switch (chartType) {
      case 'bar':
      case 'line':
        // 使用新格式字段映射
        suggestion.xAxis = dimensionFields[0] || fields[0]?.fieldName
        suggestion.yAxis = metricFields[0] || fields[1]?.fieldName
        break
      
      case 'pie':
        suggestion.nameField = dimensionFields[0] || fields[0]?.fieldName
        suggestion.valueField = metricFields[0] || fields[1]?.fieldName
        break
      
      case 'table':
        suggestion.tableFields = fields
          .slice(0, 5)
          .map((field: any) => field.fieldName)
        break
    }
    
    console.log('智能推荐结果:', suggestion)
    return suggestion
    
  } catch (error) {
    console.error('获取字段推荐失败，使用简单推荐:', error)
    // 回退到简单的字段名推荐
    const fields = await getDatasetFields(datasetId)
    return suggestFieldMapping(chartType, fields)
  }
}

/**
 * 获取字段映射建议（基于字段名称）
 * @param chartType 图表类型
 * @param availableFields 可用字段列表
 * @returns 字段映射建议
 */
export const suggestFieldMapping = (
  chartType: string,
  availableFields: string[]
): ChartFieldMapping => {
  const suggestion: ChartFieldMapping = {}
  
  // 简单的字段类型推断规则
  const dimensionKeywords = ['name', 'type', 'category', 'department', 'gender', 'status']
  const metricKeywords = ['count', 'amount', 'total', 'sum', 'value', 'revenue', 'age', 'id']
  
  const dimensionFields = availableFields.filter(field => 
    dimensionKeywords.some(keyword => field.toLowerCase().includes(keyword))
  )
  
  const metricFields = availableFields.filter(field => 
    metricKeywords.some(keyword => field.toLowerCase().includes(keyword))
  )
  
  switch (chartType) {
    case 'bar':
    case 'line':
      suggestion.xField = dimensionFields[0] || availableFields[0]
      suggestion.yField = metricFields[0] || availableFields[1]
      break
    
    case 'pie':
      suggestion.nameField = dimensionFields[0] || availableFields[0]
      suggestion.valueField = metricFields[0] || availableFields[1]
      break
    
    case 'table':
      suggestion.tableFields = availableFields.slice(0, 5) // 默认显示前5个字段
      break
  }
  
  return suggestion
}

/**
 * 获取数据集字段列表
 * @param datasetId 数据集ID
 * @returns 字段列表
 */
export const getDatasetFields = async (datasetId: number): Promise<string[]> => {
  try {
    const apiResponse = await previewDatasetData(datasetId) as any
    
    if (apiResponse.code !== 200) {
      throw new Error(apiResponse.message || '获取数据集数据失败')
    }
    
    return apiResponse.data.columns || []
    
  } catch (error) {
    console.error(`获取数据集字段失败 (datasetId: ${datasetId}):`, error)
    throw error
  }
} 