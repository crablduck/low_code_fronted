/**
 * 图表数据转换工具
 * 将数据集API返回的数据转换为不同图表类型所需的格式
 */

export interface DatasetApiResponse {
  code: number
  message: string
  data: {
    columns: string[]
    data: any[][]
    totalCount: number
  }
}

export interface ChartFieldMapping {
  xField?: string        // 柱状图、折线图的X轴字段
  yField?: string        // 柱状图、折线图的Y轴字段
  nameField?: string     // 饼图的名称字段
  valueField?: string    // 饼图的数值字段
  groupField?: string    // 分组字段
  tableFields?: string[] // 表格显示字段
}

export interface ChartDataResult {
  xAxis?: string[]       // X轴数据
  series?: any[]         // 系列数据
  names?: string[]       // 名称数组（饼图用）
  values?: number[]      // 数值数组
  tableData?: any[]      // 表格数据
}

/**
 * 将原始数据转换为对象数组格式
 * @param apiResponse 数据集API响应
 * @returns 对象数组格式的数据
 */
export const transformToObjectArray = (apiResponse: DatasetApiResponse): any[] => {
  const { columns, data } = apiResponse.data
  
  return data.map(row => {
    const obj: any = {}
    columns.forEach((column, index) => {
      obj[column] = row[index]
    })
    return obj
  })
}

/**
 * 柱状图/折线图数据转换
 * @param apiResponse 数据集API响应
 * @param mapping 字段映射配置
 * @returns 图表数据
 */
export const transformForBarOrLineChart = (
  apiResponse: DatasetApiResponse, 
  mapping: ChartFieldMapping
): ChartDataResult => {
  const objectData = transformToObjectArray(apiResponse)
  
  if (!mapping.xField || !mapping.yField) {
    throw new Error('柱状图/折线图需要配置 xField 和 yField')
  }
  
  const xAxis = objectData.map(item => item[mapping.xField!])
  const values = objectData.map(item => {
    const value = item[mapping.yField!]
    return typeof value === 'number' ? value : parseFloat(value) || 0
  })
  
  return {
    xAxis,
    values,
    series: [{
      type: 'bar', // 或 'line'，由调用方指定
      data: values
    }]
  }
}

/**
 * 饼图数据转换
 * @param apiResponse 数据集API响应
 * @param mapping 字段映射配置
 * @returns 图表数据
 */
export const transformForPieChart = (
  apiResponse: DatasetApiResponse, 
  mapping: ChartFieldMapping
): ChartDataResult => {
  const objectData = transformToObjectArray(apiResponse)
  
  if (!mapping.nameField || !mapping.valueField) {
    throw new Error('饼图需要配置 nameField 和 valueField')
  }
  
  const names = objectData.map(item => item[mapping.nameField!])
  const values = objectData.map(item => {
    const value = item[mapping.valueField!]
    return typeof value === 'number' ? value : parseFloat(value) || 0
  })
  
  const seriesData = names.map((name, index) => ({
    name: name,
    value: values[index]
  }))
  
  return {
    names,
    values,
    series: [{
      type: 'pie',
      data: seriesData
    }]
  }
}

/**
 * 表格数据转换
 * @param apiResponse 数据集API响应
 * @param mapping 字段映射配置
 * @returns 表格数据
 */
export const transformForTable = (
  apiResponse: DatasetApiResponse, 
  mapping: ChartFieldMapping
): ChartDataResult => {
  const objectData = transformToObjectArray(apiResponse)
  
  // 如果指定了要显示的字段，则只显示这些字段
  if (mapping.tableFields && mapping.tableFields.length > 0) {
    const filteredData = objectData.map(item => {
      const filteredItem: any = {}
      mapping.tableFields!.forEach(field => {
        if (item.hasOwnProperty(field)) {
          filteredItem[field] = item[field]
        }
      })
      return filteredItem
    })
    return { tableData: filteredData }
  }
  
  // 否则显示所有字段
  return { tableData: objectData }
}

/**
 * 根据图表类型转换数据
 * @param chartType 图表类型
 * @param apiResponse 数据集API响应
 * @param mapping 字段映射配置
 * @returns 转换后的图表数据
 */
export const transformChartData = (
  chartType: string,
  apiResponse: DatasetApiResponse,
  mapping: ChartFieldMapping
): ChartDataResult => {
  switch (chartType) {
    case 'bar':
    case 'line':
      return transformForBarOrLineChart(apiResponse, mapping)
    
    case 'pie':
      return transformForPieChart(apiResponse, mapping)
    
    case 'table':
      return transformForTable(apiResponse, mapping)
    
    default:
      throw new Error(`不支持的图表类型: ${chartType}`)
  }
}

/**
 * 生成ECharts配置
 * @param chartType 图表类型
 * @param chartData 转换后的图表数据
 * @param title 图表标题
 * @returns ECharts配置对象
 */
export const generateEChartsOption = (
  chartType: string,
  chartData: ChartDataResult,
  title: string = ''
): any => {
  const baseOption = {
    title: {
      text: title,
      left: 'center',
      textStyle: {
        fontSize: 16,
        fontWeight: 'bold'
      }
    },
    tooltip: {
      trigger: 'item'
    },
    legend: {
      show: true,
      bottom: 10
    }
  }
  
  switch (chartType) {
    case 'bar':
      return {
        ...baseOption,
        xAxis: {
          type: 'category',
          data: chartData.xAxis || []
        },
        yAxis: {
          type: 'value'
        },
        series: [{
          type: 'bar',
          data: chartData.values || [],
          itemStyle: {
            color: '#5470c6'
          }
        }]
      }
    
    case 'line':
      return {
        ...baseOption,
        xAxis: {
          type: 'category',
          data: chartData.xAxis || []
        },
        yAxis: {
          type: 'value'
        },
        series: [{
          type: 'line',
          data: chartData.values || [],
          smooth: true,
          itemStyle: {
            color: '#91cc75'
          },
          areaStyle: {
            opacity: 0.3
          }
        }]
      }
    
    case 'pie':
      return {
        ...baseOption,
        tooltip: {
          trigger: 'item',
          formatter: '{a} <br/>{b}: {c} ({d}%)'
        },
        series: [{
          name: title,
          type: 'pie',
          radius: '60%',
          center: ['50%', '50%'],
          data: chartData.series?.[0]?.data || [],
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: 'rgba(0, 0, 0, 0.5)'
            }
          }
        }]
      }
    
    default:
      return baseOption
  }
} 