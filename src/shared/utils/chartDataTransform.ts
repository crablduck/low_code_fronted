/**
 * 图表数据转换工具
 * 将数据集API返回的数据转换为不同图表类型所需的格式
 */

export interface DatasetApiResponse {
  code: number
  message: string
  data: {
    columns: string[]
    data?: any[][]           // 旧格式：二维数组
    records?: any[]          // 新格式：对象数组
    totalCount: number
  }
}

export interface ChartFieldMapping {
  // 新格式字段映射（推荐使用）
  xAxis?: string         // 柱状图、折线图的X轴字段
  yAxis?: string         // 柱状图、折线图的Y轴字段
  series?: string        // 系列字段
  
  // 旧格式字段映射（向后兼容）
  xField?: string        // 柱状图、折线图的X轴字段（已废弃，使用xAxis）
  yField?: string        // 柱状图、折线图的Y轴字段（已废弃，使用yAxis）
  
  // 饼图字段映射
  nameField?: string     // 饼图的名称字段（已废弃，使用categoryField）
  categoryField?: string // 饼图的类别字段
  valueField?: string    // 饼图的数值字段
  value?: string         // 饼图的数值字段（新格式）
  
  // 其他字段映射
  groupField?: string    // 分组字段
  tableFields?: string[] // 表格显示字段
  sizeField?: string     // 散点图气泡大小字段
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
  const responseData = apiResponse.data
  
  // 🆕 新格式：如果有 records 字段，直接使用（对象数组格式）
  if (responseData.records && Array.isArray(responseData.records)) {
    console.log('✅ 使用新格式数据 (records):', responseData.records.length, '条记录')
    console.log('📊 数据样本:', responseData.records.slice(0, 2))
    return responseData.records
  }
  
  // 🔄 旧格式：转换二维数组为对象数组（保持原有逻辑）
  if (responseData.data && Array.isArray(responseData.data)) {
    const { columns, data } = responseData
    console.log('✅ 转换旧格式数据 (data):', data.length, '条记录')
    console.log('📊 列名:', columns)
    console.log('📊 数据样本:', data.slice(0, 2))
    
    return data.map(row => {
      const obj: any = {}
      columns.forEach((column, index) => {
        obj[column] = row[index]
      })
      return obj
    })
  }
  
  // ❌ 错误处理
  console.error('❌ 数据格式不正确:', responseData)
  console.error('期望格式1 (新):', { columns: ['col1', 'col2'], records: [{col1: 'val1', col2: 'val2'}] })
  console.error('期望格式2 (旧):', { columns: ['col1', 'col2'], data: [['val1', 'val2']] })
  throw new Error('数据格式不正确：缺少 records 或 data 字段')
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
  
  // 兼容新旧字段映射格式
  const xField = mapping.xAxis || mapping.xField
  const yField = mapping.yAxis || mapping.yField
  
  if (!xField || !yField) {
    console.error('字段映射配置:', mapping)
    throw new Error('柱状图/折线图需要配置 X轴字段和Y轴字段。请检查字段映射配置：xAxis/xField 和 yAxis/yField')
  }
  
  console.log(`柱状图/折线图数据转换: xField="${xField}", yField="${yField}"`)
  console.log('数据样本:', objectData.slice(0, 3))
  
  const xAxis = objectData.map(item => item[xField])
  const values = objectData.map(item => {
    const value = item[yField]
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
  
  // 兼容新旧字段映射格式
  const nameField = mapping.nameField || mapping.categoryField
  const valueField = mapping.valueField || mapping.value
  
  if (!nameField || !valueField) {
    console.error('饼图字段映射配置:', mapping)
    console.error('转换后的数据样本:', objectData.slice(0, 2))
    throw new Error('饼图需要配置名称字段和数值字段。请检查字段映射配置：nameField/categoryField 和 valueField/value')
  }
  
  console.log(`饼图数据转换: nameField="${nameField}", valueField="${valueField}"`)
  console.log('数据样本:', objectData.slice(0, 3))
  
  const names = objectData.map(item => {
    const name = item[nameField]
    return name !== undefined ? String(name) : '未知'
  })
  
  const values = objectData.map(item => {
    const value = item[valueField]
    if (typeof value === 'number') {
      return value
    }
    const parsed = parseFloat(String(value))
    return isNaN(parsed) ? 0 : parsed
  })
  
  const seriesData = names.map((name, index) => ({
    name: name,
    value: values[index]
  }))
  
  console.log('饼图转换结果:', {
    names: names.slice(0, 3),
    values: values.slice(0, 3),
    seriesData: seriesData.slice(0, 3)
  })
  
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
 * 散点图数据转换
 * @param apiResponse 数据集API响应
 * @param mapping 字段映射配置
 * @returns 图表数据
 */
export const transformForScatterChart = (
  apiResponse: DatasetApiResponse, 
  mapping: ChartFieldMapping
): ChartDataResult => {
  const objectData = transformToObjectArray(apiResponse)
  
  // 兼容新旧字段映射格式
  const xField = mapping.xAxis || mapping.xField
  const yField = mapping.yAxis || mapping.yField
  
  if (!xField || !yField) {
    console.error('字段映射配置:', mapping)
    throw new Error('散点图需要配置 X轴字段和Y轴字段。请检查字段映射配置：xAxis/xField 和 yAxis/yField')
  }
  
  console.log(`散点图数据转换: xField="${xField}", yField="${yField}"`)
  
  const scatterData = objectData.map(item => {
    const xValue = typeof item[xField] === 'number' ? 
      item[xField] : parseFloat(item[xField]) || 0
    const yValue = typeof item[yField] === 'number' ? 
      item[yField] : parseFloat(item[yField]) || 0
    
    // 如果有size字段，添加气泡大小
    if (mapping.sizeField && item[mapping.sizeField]) {
      const sizeValue = typeof item[mapping.sizeField] === 'number' ? 
        item[mapping.sizeField] : parseFloat(item[mapping.sizeField]) || 5
      return [xValue, yValue, sizeValue]
    }
    
    return [xValue, yValue]
  })
  
  return {
    series: [{
      type: 'scatter',
      data: scatterData
    }]
  }
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
    case 'area':
      return transformForBarOrLineChart(apiResponse, mapping)
    
    case 'pie':
      return transformForPieChart(apiResponse, mapping)
    
    case 'scatter':
      return transformForScatterChart(apiResponse, mapping)
    
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
 * @param options 额外配置选项
 * @returns ECharts配置对象
 */
export const generateEChartsOption = (
  chartType: string,
  chartData: ChartDataResult,
  title: string = '',
  options: {
    showLegend?: boolean
    showToolbox?: boolean
    theme?: 'light' | 'dark'
  } = {}
): any => {
  const { showLegend = true, showToolbox = false, theme = 'light' } = options
  
  const baseOption = {
    title: {
      text: title,
      left: 'center',
      textStyle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: theme === 'dark' ? '#fff' : '#303133'
      }
    },
    tooltip: {
      trigger: 'item',
      backgroundColor: theme === 'dark' ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.9)',
      borderColor: theme === 'dark' ? '#333' : '#ddd',
      textStyle: {
        color: theme === 'dark' ? '#fff' : '#333'
      }
    },
    legend: {
      show: showLegend,
      bottom: 10,
      textStyle: {
        color: theme === 'dark' ? '#fff' : '#666'
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: showLegend ? '15%' : '3%',
      containLabel: true
    }
  }

  // 添加工具栏
  if (showToolbox) {
    baseOption.toolbox = {
      show: true,
      feature: {
        dataView: { show: true, readOnly: false },
        magicType: { show: true, type: ['line', 'bar'] },
        restore: { show: true },
        saveAsImage: { show: true }
      },
      iconStyle: {
        borderColor: theme === 'dark' ? '#fff' : '#666'
      }
    }
  }
  
  switch (chartType) {
    case 'bar':
      return {
        ...baseOption,
        tooltip: {
          ...baseOption.tooltip,
          trigger: 'axis',
          axisPointer: {
            type: 'shadow'
          }
        },
        xAxis: {
          type: 'category',
          data: chartData.xAxis || [],
          axisLabel: {
            rotate: (chartData.xAxis?.length || 0) > 10 ? 45 : 0,
            color: theme === 'dark' ? '#fff' : '#666'
          },
          axisLine: {
            lineStyle: {
              color: theme === 'dark' ? '#666' : '#e6e6e6'
            }
          }
        },
        yAxis: {
          type: 'value',
          axisLabel: {
            color: theme === 'dark' ? '#fff' : '#666'
          },
          axisLine: {
            lineStyle: {
              color: theme === 'dark' ? '#666' : '#e6e6e6'
            }
          },
          splitLine: {
            lineStyle: {
              color: theme === 'dark' ? '#333' : '#f0f0f0'
            }
          }
        },
        series: [{
          type: 'bar',
          data: chartData.values || [],
          itemStyle: {
            color: {
              type: 'linear',
              x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: '#83bff6' },
                { offset: 0.5, color: '#188df0' },
                { offset: 1, color: '#188df0' }
              ]
            }
          },
          emphasis: {
            itemStyle: {
              color: {
                type: 'linear',
                x: 0, y: 0, x2: 0, y2: 1,
                colorStops: [
                  { offset: 0, color: '#2378f7' },
                  { offset: 0.7, color: '#2378f7' },
                  { offset: 1, color: '#83bff6' }
                ]
              }
            }
          }
        }]
      }
    
    case 'line':
      return {
        ...baseOption,
        tooltip: {
          ...baseOption.tooltip,
          trigger: 'axis'
        },
        xAxis: {
          type: 'category',
          data: chartData.xAxis || [],
          boundaryGap: false,
          axisLabel: {
            color: theme === 'dark' ? '#fff' : '#666'
          },
          axisLine: {
            lineStyle: {
              color: theme === 'dark' ? '#666' : '#e6e6e6'
            }
          }
        },
        yAxis: {
          type: 'value',
          axisLabel: {
            color: theme === 'dark' ? '#fff' : '#666'
          },
          axisLine: {
            lineStyle: {
              color: theme === 'dark' ? '#666' : '#e6e6e6'
            }
          },
          splitLine: {
            lineStyle: {
              color: theme === 'dark' ? '#333' : '#f0f0f0'
            }
          }
        },
        series: [{
          type: 'line',
          data: chartData.values || [],
          smooth: true,
          lineStyle: {
            color: '#5470c6',
            width: 3
          },
          itemStyle: {
            color: '#5470c6'
          },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(84, 112, 198, 0.3)' },
                { offset: 1, color: 'rgba(84, 112, 198, 0.1)' }
              ]
            }
          }
        }]
      }
    
    case 'area':
      return {
        ...baseOption,
        tooltip: {
          ...baseOption.tooltip,
          trigger: 'axis'
        },
        xAxis: {
          type: 'category',
          data: chartData.xAxis || [],
          boundaryGap: false,
          axisLabel: {
            color: theme === 'dark' ? '#fff' : '#666'
          }
        },
        yAxis: {
          type: 'value',
          axisLabel: {
            color: theme === 'dark' ? '#fff' : '#666'
          }
        },
        series: [{
          type: 'line',
          data: chartData.values || [],
          smooth: true,
          areaStyle: {
            color: {
              type: 'linear',
              x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(91, 204, 117, 0.6)' },
                { offset: 1, color: 'rgba(91, 204, 117, 0.1)' }
              ]
            }
          },
          lineStyle: {
            color: '#5bcc75',
            width: 2
          },
          itemStyle: {
            color: '#5bcc75'
          }
        }]
      }
    
    case 'pie':
      return {
        ...baseOption,
        tooltip: {
          trigger: 'item',
          formatter: '{a} <br/>{b}: {c} ({d}%)',
          backgroundColor: theme === 'dark' ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.9)',
          borderColor: theme === 'dark' ? '#333' : '#ddd',
          textStyle: {
            color: theme === 'dark' ? '#fff' : '#333'
          }
        },
        series: [{
          name: title,
          type: 'pie',
          radius: ['20%', '60%'],
          center: ['50%', '50%'],
          data: chartData.series?.[0]?.data || [],
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: 'rgba(0, 0, 0, 0.5)'
            }
          },
          label: {
            color: theme === 'dark' ? '#fff' : '#333'
          },
          labelLine: {
            lineStyle: {
              color: theme === 'dark' ? '#666' : '#999'
            }
          }
        }]
      }
    
    case 'scatter':
      return {
        ...baseOption,
        tooltip: {
          ...baseOption.tooltip,
          trigger: 'item'
        },
        xAxis: {
          type: 'value',
          axisLabel: {
            color: theme === 'dark' ? '#fff' : '#666'
          },
          splitLine: {
            lineStyle: {
              color: theme === 'dark' ? '#333' : '#f0f0f0'
            }
          }
        },
        yAxis: {
          type: 'value',
          axisLabel: {
            color: theme === 'dark' ? '#fff' : '#666'
          },
          splitLine: {
            lineStyle: {
              color: theme === 'dark' ? '#333' : '#f0f0f0'
            }
          }
        },
        series: [{
          type: 'scatter',
          data: chartData.series?.[0]?.data || [],
          symbolSize: 8,
          itemStyle: {
            color: '#fac858'
          }
        }]
      }
    
    default:
      return baseOption
  }
} 