import { ref, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import * as echarts from 'echarts'
import type { LayoutItem, ChartConfig } from '@/shared/types/dashboard'
import type { DataSetField } from '@/shared/types/dataManagement'

// 图表类型定义
export const chartTypes = [
  { value: 'bar', label: '柱状图', icon: 'TrendCharts' },
  { value: 'line', label: '折线图', icon: 'TrendCharts' },
  { value: 'pie', label: '饼图', icon: 'PieChart' },
  { value: 'scatter', label: '散点图', icon: 'TrendCharts' },
  { value: 'area', label: '面积图', icon: 'TrendCharts' },
  { value: 'table', label: '表格', icon: 'Grid' },
  { value: 'image', label: '图片', icon: 'Picture' }
]

// 组件类型定义
export const componentTypes = [
  // 筛选器组件
  { value: 'filter-select', label: '下拉选择', icon: 'ArrowDown', category: 'filter' },
  { value: 'filter-multiselect', label: '多选下拉', icon: 'Menu', category: 'filter' },
  { value: 'filter-date', label: '日期选择', icon: 'Calendar', category: 'filter' },
  { value: 'filter-daterange', label: '日期范围', icon: 'Calendar', category: 'filter' },
  { value: 'filter-slider', label: '滑块选择', icon: 'Operation', category: 'filter' },
  { value: 'filter-input', label: '文本输入', icon: 'Edit', category: 'filter' },
  
  // 文本组件
  { value: 'text-title', label: '标题文本', icon: 'EditPen', category: 'text' },
  { value: 'text-content', label: '内容文本', icon: 'Document', category: 'text' }
]

export interface DragDropState {
  isDragging: boolean
  draggedItem: string | null
  isDragOver: boolean
  dragFieldType: string | null
}

export function useDragAndDrop() {
  // 拖拽状态
  const isDragging = ref(false)
  const draggedItem = ref<string | null>(null)
  const isDragOver = ref(false)
  const dragFieldType = ref<string | null>(null)
  
  // 外部函数引用（可以被外部设置）
  let externalGetDefaultFilterOptions: ((filterType: string) => any[]) | null = null
  let externalGetDefaultFilterValue: ((filterType: string) => any) | null = null
  
  // 判断是否为图表类型
  const isChartType = (type: string) => {
    return chartTypes.some(chart => chart.value === type)
  }
  
  // 判断是否为筛选器类型
  const isFilterType = (type: string) => {
    return componentTypes.some(comp => comp.value === type && comp.category === 'filter')
  }
  
  // 判断是否为文本类型
  const isTextType = (type: string) => {
    return componentTypes.some(comp => comp.value === type && comp.category === 'text')
  }
  
  // 获取筛选器组件
  const getFilterComponent = (type: string) => {
    const componentMap = {
      'filter-select': 'FilterSelectDesigner',
      'filter-multiselect': 'FilterMultiSelectDesigner',
      'filter-date': 'FilterDateDesigner',
      'filter-daterange': 'FilterDateRangeDesigner',
      'filter-slider': 'FilterSliderDesigner',
      'filter-input': 'FilterInputDesigner'
    }
    return componentMap[type as keyof typeof componentMap] || 'FilterSelectDesigner'
  }
  
  // 获取文本组件
  const getTextComponent = (type: string) => {
    const componentMap = {
      'text-title': 'TextTitleDesigner',
      'text-content': 'TextContentDesigner'
    }
    return componentMap[type as keyof typeof componentMap] || 'TextTitleDesigner'
  }
  
  // 获取默认筛选器选项
  const getDefaultFilterOptions = (filterType: string) => {
    // 优先使用外部函数
    if (externalGetDefaultFilterOptions) {
      return externalGetDefaultFilterOptions(filterType)
    }
    
    switch (filterType) {
      case 'filter-select':
        return [
          { label: '北京', value: 'beijing' },
          { label: '上海', value: 'shanghai' },
          { label: '广州', value: 'guangzhou' },
          { label: '深圳', value: 'shenzhen' },
          { label: '杭州', value: 'hangzhou' }
        ]
      case 'filter-multiselect':
        return [
          { label: '销售部', value: 'sales' },
          { label: '技术部', value: 'tech' },
          { label: '市场部', value: 'marketing' },
          { label: '财务部', value: 'finance' },
          { label: '人事部', value: 'hr' }
        ]
      default:
        return []
    }
  }
  
  // 获取默认筛选器值
  const getDefaultFilterValue = (filterType: string) => {
    // 优先使用外部函数
    if (externalGetDefaultFilterValue) {
      return externalGetDefaultFilterValue(filterType)
    }
    
    switch (filterType) {
      case 'filter-select':
        return null
      case 'filter-multiselect':
        return []
      case 'filter-date':
      case 'filter-daterange':
        return null
      case 'filter-slider':
        return 50
      case 'filter-input':
        return ''
      default:
        return null
    }
  }
  
  // 设置默认值函数
  const setDefaultValueFunctions = (
    getDefaultFilterOptionsFn: (filterType: string) => any[],
    getDefaultFilterValueFn: (filterType: string) => any
  ) => {
    externalGetDefaultFilterOptions = getDefaultFilterOptionsFn
    externalGetDefaultFilterValue = getDefaultFilterValueFn
  }
  
  // 智能推荐字段配置
  const autoConfigureChartFields = (chartConfig: ChartConfig, datasetFields: DataSetField[]) => {
    if (!datasetFields || datasetFields.length === 0) return
    
    const dimensionFields = datasetFields.filter(field => field.fieldType === 'dimension')
    const metricFields = datasetFields.filter(field => field.fieldType === 'metric')
    
    // 根据图表类型智能配置字段
    switch (chartConfig.type) {
      case 'bar':
      case 'line':
      case 'area':
        if (dimensionFields.length > 0) {
          chartConfig.xField = dimensionFields[0].fieldName
        }
        if (metricFields.length > 0) {
          chartConfig.yField = metricFields[0].fieldName
        }
        break
        
      case 'pie':
        if (dimensionFields.length > 0) {
          chartConfig.nameField = dimensionFields[0].fieldName
        }
        if (metricFields.length > 0) {
          chartConfig.valueField = metricFields[0].fieldName
        }
        break
        
      case 'scatter':
        if (metricFields.length >= 2) {
          chartConfig.xField = metricFields[0].fieldName
          chartConfig.yField = metricFields[1].fieldName
        }
        break
        
      case 'table':
        // 表格显示所有字段
        chartConfig.tableFields = datasetFields.map(field => field.fieldName)
        break
    }
  }
  
  // 智能布局算法：筛选器在顶部，图表在下方
  const calculateSmartPosition = (
    layout: LayoutItem[], 
    isFilter: boolean = false,
    defaultSize: { w: number, h: number }
  ) => {
    if (isFilter) {
      // 筛选器放在顶部
      const existingFilters = layout.filter(item => 
        componentTypes.some(comp => comp.value === item.chartConfig.type && comp.category === 'filter')
      )
      
      let x = 0
      let y = 0
      const filterWidth = 4  // 筛选器默认宽度
      const filterHeight = 3 // 筛选器默认高度
      
      // 计算当前行已占用的宽度
      existingFilters.forEach(filter => {
        if (filter.y === y) {
          x = Math.max(x, filter.x + filter.w)
        }
      })
      
      // 如果当前行放不下，换行
      if (x + filterWidth > 12) {
        x = 0
        y = Math.max(...existingFilters.map(f => f.y + f.h), 0)
      }
      
      return { x, y, w: filterWidth, h: filterHeight }
    } else {
      // 图表放在筛选器下方
      const existingFilters = layout.filter(item => 
        componentTypes.some(comp => comp.value === item.chartConfig.type && comp.category === 'filter')
      )
      const existingCharts = layout.filter(item => 
        !componentTypes.some(comp => comp.value === item.chartConfig.type && comp.category === 'filter')
      )
      
      // 计算筛选器区域的最大Y坐标
      const filterMaxY = existingFilters.length > 0 
        ? Math.max(...existingFilters.map(f => f.y + f.h)) 
        : 0
      
      // 在现有图表中找到合适位置
      let x = 0
      let y = filterMaxY
      
      // 简单的布局算法：从左到右，从上到下
      while (true) {
        const hasCollision = existingCharts.some(chart => 
          !(x >= chart.x + chart.w || x + defaultSize.w <= chart.x || 
            y >= chart.y + chart.h || y + defaultSize.h <= chart.y)
        )
        
        if (!hasCollision) {
          break
        }
        
        x += defaultSize.w
        if (x + defaultSize.w > 12) {
          x = 0
          y += defaultSize.h
        }
      }
      
      return { x, y, w: defaultSize.w, h: defaultSize.h }
    }
  }
  
  // 处理图表类型拖拽开始
  const handleDragStart = (event: DragEvent, chart: any) => {
    if (event.dataTransfer) {
      event.dataTransfer.setData('chartType', JSON.stringify(chart))
    }
  }
  
  // 处理组件类型拖拽开始
  const handleComponentDragStart = (event: DragEvent, component: any) => {
    if (event.dataTransfer) {
      event.dataTransfer.setData('componentType', JSON.stringify(component))
    }
  }
  
  // 处理字段拖拽开始
  const handleFieldDragStart = (event: DragEvent, field: DataSetField) => {
    if (event.dataTransfer) {
      event.dataTransfer.setData('field', JSON.stringify(field))
    }
  }
  
  // 处理字段拖拽结束
  const handleFieldDragEnd = () => {
    isDragOver.value = false
    dragFieldType.value = null
  }
  
  // 处理字段拖拽覆盖
  const handleFieldDragOver = (event: DragEvent, fieldType: string) => {
    event.preventDefault()
    isDragOver.value = true
    dragFieldType.value = fieldType
  }
  
  // 处理字段拖拽离开
  const handleFieldDragLeave = () => {
    isDragOver.value = false
    dragFieldType.value = null
  }
  
  // 处理字段拖拽放下
  const handleFieldDrop = (
    event: DragEvent,
    targetType: 'x' | 'y' | 'name' | 'value',
    selectedChart: ChartConfig | null,
    updateCallback: () => void
  ) => {
    if (!event.dataTransfer || !selectedChart) return
    
    const fieldData = JSON.parse(event.dataTransfer.getData('field'))
    const field = fieldData as DataSetField
    
    // 重置拖拽状态
    isDragOver.value = false
    dragFieldType.value = null
    
    // 验证字段类型
    if ((targetType === 'x' || targetType === 'name') && field.fieldType !== 'dimension') {
      ElMessage.warning('X轴/名称字段必须是维度字段')
      return
    }
    
    if ((targetType === 'y' || targetType === 'value') && field.fieldType !== 'metric') {
      ElMessage.warning('Y轴/数值字段必须是指标字段')
      return
    }
    
    // 更新字段
    if (targetType === 'x') {
      selectedChart.xField = field.fieldName
    } else if (targetType === 'y') {
      selectedChart.yField = field.fieldName
    } else if (targetType === 'name') {
      selectedChart.nameField = field.fieldName
    } else if (targetType === 'value') {
      selectedChart.valueField = field.fieldName
    }
    
    updateCallback()
  }
  
  // 处理画布拖拽放下
  const handleCanvasDrop = (
    event: DragEvent,
    layout: LayoutItem[],
    selectedDataset: any,
    datasetFields: DataSetField[],
    initChartCallback: (chartId: string, config: ChartConfig) => void
  ) => {
    if (!event.dataTransfer) return null

    const chartTypeData = event.dataTransfer.getData('chartType')
    const componentTypeData = event.dataTransfer.getData('componentType')
    
    let itemConfig: any
    let isFilter = false
    let defaultSize = { w: 6, h: 7 }
    
    if (chartTypeData) {
      // 处理图表类型
      const chart = JSON.parse(chartTypeData)
      const position = calculateSmartPosition(layout, false, defaultSize)
      
      itemConfig = {
        i: `chart-${Date.now()}`,
        x: position.x,
        y: position.y,
        w: position.w,
        h: position.h,
        chartConfig: {
          type: chart.value,
          title: chart.label,
          showLegend: true,
          showToolbox: false,
          dataLimit: 100
        }
      }
      
      // 应用智能推荐字段配置
      if (selectedDataset && datasetFields.length > 0) {
        autoConfigureChartFields(itemConfig.chartConfig, datasetFields)
      }
    } else if (componentTypeData) {
      // 处理组件类型
      const component = JSON.parse(componentTypeData)
      isFilter = component.category === 'filter'
      
      // 筛选器使用较小的默认尺寸
      const componentSize = isFilter ? { w: 4, h: 3 } : { w: 6, h: 4 }
      const position = calculateSmartPosition(layout, isFilter, componentSize)
      
      itemConfig = {
        i: `${component.category}-${Date.now()}`,
        x: position.x,
        y: position.y,
        w: position.w,
        h: position.h,
        chartConfig: {
          type: component.value,
          title: component.label,
          label: component.label,
          // 筛选器特有配置
          ...(isFilter && {
            options: getDefaultFilterOptions(component.value) || [],
            value: getDefaultFilterValue(component.value),
            placeholder: `请选择${component.label}`
          }),
          // 文本组件特有配置
          ...(component.category === 'text' && {
            content: component.value === 'text-title' ? '标题文本' : '内容文本',
            fontSize: component.value === 'text-title' ? 24 : 14,
            color: '#303133',
            textAlign: 'left'
          })
        }
      }
    } else {
      return null
    }
    
    // 创建一个新的布局项
    const newItem: LayoutItem = {
      x: itemConfig.x,
      y: itemConfig.y,
      w: itemConfig.w,
      h: itemConfig.h,
      i: itemConfig.i,
      chartConfig: itemConfig.chartConfig
    }
    
    layout.push(newItem)
    
    nextTick(() => {
      if (isChartType(itemConfig.chartConfig.type)) {
        initChartCallback(newItem.i, itemConfig.chartConfig)
      }
      ElMessage.success(`已添加新的${itemConfig.chartConfig.title}，请配置相关属性`)
    })
    
    // 重置拖拽状态
    isDragging.value = false
    draggedItem.value = null
    
    return itemConfig
  }
  
  // 拖拽结束处理
  const handleDragEnd = () => {
    isDragging.value = false
    draggedItem.value = null
  }
  
  return {
    // 常量
    chartTypes,
    componentTypes,
    
    // 响应式状态
    isDragging,
    draggedItem,
    isDragOver,
    dragFieldType,
    
    // 工具函数
    isChartType,
    isFilterType,
    isTextType,
    getFilterComponent,
    getTextComponent,
    getDefaultFilterOptions,
    getDefaultFilterValue,
    setDefaultValueFunctions,
    autoConfigureChartFields,
    
    // 拖拽处理函数
    handleDragStart,
    handleComponentDragStart,
    handleFieldDragStart,
    handleFieldDragEnd,
    handleFieldDragOver,
    handleFieldDragLeave,
    handleFieldDrop,
    handleCanvasDrop,
    handleDragEnd
  }
} 