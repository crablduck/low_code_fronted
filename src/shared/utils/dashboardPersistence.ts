/**
 * 仪表盘持久化工具
 * 用于确保仪表盘配置的完整保存和恢复
 */
import type { LayoutItem, ChartConfig } from '@/shared/types/dashboard'

/**
 * 验证图表配置的完整性
 * @param chartConfig 图表配置
 * @returns 验证结果
 */
export const validateChartConfig = (chartConfig: ChartConfig): boolean => {
  const required = ['i', 'id', 'type']
  const missing = required.filter(field => !chartConfig[field as keyof ChartConfig])
  
  if (missing.length > 0) {
    console.warn('图表配置缺少必需字段:', missing, chartConfig)
    return false
  }
  
  return true
}

/**
 * 序列化布局数据以供保存
 * @param layout 布局数据
 * @returns 序列化后的字符串
 */
export const serializeLayout = (layout: LayoutItem[]): string => {
  try {
    const serialized = layout.map(item => {
      // 深拷贝 chartConfig，排除 runtime 数据
      const { chartData, ...persistConfig } = item.chartConfig

      return {
        x: item.x,
        y: item.y,
        w: item.w,
        h: item.h,
        i: item.i,
        // 直接保存完整配置（内含 useGlobalFilters / globalFilterBindings 等）
        chartConfig: persistConfig
      }
    })
    
    console.log('序列化布局数据:', serialized)
    return JSON.stringify(serialized)
  } catch (error) {
    console.error('序列化布局数据失败:', error)
    throw new Error('序列化布局数据失败')
  }
}

/**
 * 反序列化布局数据
 * @param layoutString 序列化的布局字符串
 * @returns 布局数据
 */
export const deserializeLayout = (layoutString: string): LayoutItem[] => {
  try {
    let layoutData
    
    if (typeof layoutString === 'string') {
      layoutData = JSON.parse(layoutString)
    } else {
      layoutData = layoutString
    }
    
    const layout = layoutData.map((item: any) => ({
      x: item.x || 0,
      y: item.y || 0,
      w: item.w || 4,
      h: item.h || 4,
      i: item.i,
      // 直接使用完整的chartConfig配置
      chartConfig: {
        i: item.i,
        id: item.chartConfig?.id || item.i,
        type: item.chartConfig?.type || 'bar',
        ...item.chartConfig
      }
    }))
    
    console.log('反序列化布局数据:', layout)
    return layout
  } catch (error) {
    console.error('反序列化布局数据失败:', error)
    throw new Error('反序列化布局数据失败')
  }
}

/**
 * 获取保存状态摘要
 * @param layout 布局数据
 * @returns 保存状态摘要
 */
export const getSaveSummary = (layout: LayoutItem[]) => {
  const summary = {
    totalCharts: layout.length,
    chartTypes: {} as Record<string, number>,
    chartsWithDataset: 0,
    chartsWithFieldMapping: 0
  }
  
  layout.forEach(item => {
    const config = item.chartConfig
    
    // 统计图表类型
    summary.chartTypes[config.type] = (summary.chartTypes[config.type] || 0) + 1
    
    // 统计有数据源的图表
    if (config.datasetId) {
      summary.chartsWithDataset++
    }
    
    // 统计有字段映射的图表
    if (config.fieldMapping || config.xField || config.yField || config.nameField || config.valueField) {
      summary.chartsWithFieldMapping++
    }
  })
  
  return summary
} 