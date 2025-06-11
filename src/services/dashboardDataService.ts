/**
 * 仪表盘数据服务
 * 处理数据集数据的获取、转换和图表渲染
 */

import { previewDatasetData } from '@/api/dataset'
import { 
  transformChartData, 
  generateEChartsOption,
  type DatasetApiResponse,
  type ChartFieldMapping,
  type ChartDataResult
} from '@/utils/chartDataTransform'

export interface ChartConfig {
  i: string
  type: 'bar' | 'line' | 'pie' | 'table'
  title: string
  datasetId?: number
  fieldMapping?: ChartFieldMapping
  showLegend?: boolean
  showToolbox?: boolean
  dataLimit?: number
}

/**
 * 获取图表数据
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
    // 1. 获取数据集数据
    const apiResponse: DatasetApiResponse = await previewDatasetData(datasetId)
    
    if (apiResponse.code !== 200) {
      throw new Error(apiResponse.message || '获取数据集数据失败')
    }
    
    // 2. 数据验证
    if (!apiResponse.data || !apiResponse.data.columns || !apiResponse.data.data) {
      throw new Error('数据集返回的数据格式不正确')
    }
    
    // 3. 转换数据为图表格式
    const chartData: ChartDataResult = transformChartData(chartType, apiResponse, fieldMapping)
    
    // 4. 生成ECharts配置
    const echartsOption = generateEChartsOption(
      chartType,
      chartData,
      chartConfig?.title || '图表'
    )
    
    // 5. 应用额外配置
    if (chartConfig?.showLegend !== undefined) {
      echartsOption.legend.show = chartConfig.showLegend
    }
    
    if (chartConfig?.showToolbox) {
      echartsOption.toolbox = {
        show: true,
        feature: {
          dataView: { show: true, readOnly: false },
          magicType: { show: true, type: ['line', 'bar'] },
          restore: { show: true },
          saveAsImage: { show: true }
        }
      }
    }
    
    return echartsOption
    
  } catch (error) {
    console.error(`获取图表数据失败 (datasetId: ${datasetId}):`, error)
    throw error
  }
}

/**
 * 获取表格数据
 * @param datasetId 数据集ID
 * @param fieldMapping 字段映射配置
 * @returns 表格数据数组
 */
export const getTableData = async (
  datasetId: number,
  fieldMapping?: ChartFieldMapping
): Promise<any[]> => {
  try {
    const apiResponse: DatasetApiResponse = await previewDatasetData(datasetId)
    
    if (apiResponse.code !== 200) {
      throw new Error(apiResponse.message || '获取数据集数据失败')
    }
    
    const chartData = transformChartData('table', apiResponse, fieldMapping || {})
    return chartData.tableData || []
    
  } catch (error) {
    console.error(`获取表格数据失败 (datasetId: ${datasetId}):`, error)
    throw error
  }
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
      if (!fieldMapping.xField) {
        errors.push('请配置X轴字段')
      } else if (!availableFields.includes(fieldMapping.xField)) {
        errors.push(`X轴字段 "${fieldMapping.xField}" 在数据集中不存在`)
      }
      
      if (!fieldMapping.yField) {
        errors.push('请配置Y轴字段')
      } else if (!availableFields.includes(fieldMapping.yField)) {
        errors.push(`Y轴字段 "${fieldMapping.yField}" 在数据集中不存在`)
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
    const response = await get(dataSourceService, `/dataset/${datasetId}`)
    console.log('数据集详细信息:', response)
    
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
        suggestion.xField = dimensionFields[0] || fields[0]?.fieldName
        suggestion.yField = metricFields[0] || fields[1]?.fieldName
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
    const apiResponse: DatasetApiResponse = await previewDatasetData(datasetId)
    
    if (apiResponse.code !== 200) {
      throw new Error(apiResponse.message || '获取数据集数据失败')
    }
    
    return apiResponse.data.columns || []
    
  } catch (error) {
    console.error(`获取数据集字段失败 (datasetId: ${datasetId}):`, error)
    throw error
  }
} 