export enum DashboardStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published'
}

export enum DashboardType {
  CUSTOM = 'custom',
  TEMPLATE = 'template',
  ANALYTICS = 'analytics',
  OPERATIONAL = 'operational',
  EXECUTIVE = 'executive',
  REALTIME = 'realtime',
  MEDICAL = 'medical',
  FINANCIAL = 'financial'
}

// 图表数据源配置接口
export interface ChartDataSourceConfig {
  datasetId?: number | null
  type: string
  title: string
  xField: string
  yField: string
  groupField?: string
  showLegend: boolean
  showToolbox: boolean
  dataLimit: number
  filters?: FilterCondition[]
}

export interface FieldMapping {
  fieldName: string
  displayName: string
  fieldType: 'dimension' | 'metric'
  aggregation?: string
}

export interface FilterCondition {
  field: string
  operator: string
  value: string
}

export interface FilterConfig {
  field: string
  operator: string
  value: string
}

export interface AdvancedConfig {
  autoRefresh: boolean
  refreshInterval: number
  enableCache: boolean
  cacheTime: number
  dataLimit: number
  sortField: string
  sortOrder: 'asc' | 'desc'
}

// 字段映射接口
export interface ChartFieldMapping {
  xAxis?: string
  yAxis?: string
  series?: string
  value?: string
  xField?: string
  yField?: string
  nameField?: string
  valueField?: string
  groupField?: string
  tableFields?: string[]
  sizeField?: string
}

// 全局筛选器相关类型定义
export interface GlobalFilterConfig {
  key: string
  label: string
  datasetId: number
  fieldName: string
  controlType: 'select' | 'multiSelect' | 'dateRange' | 'date' | 'month' | 'year' | 'input' | 'number' | 'slider' | 'cascade'
  defaultValue?: any
  options?: FilterOption[]
  cascadeFilters?: CascadeFilterConfig[]
  required?: boolean
  placeholder?: string
  sliderConfig?: {
    min?: number
    max?: number
    step?: number
  }
}

export interface FilterOption {
  label: string
  value: any
  children?: FilterOption[]
}

export interface CascadeFilterConfig {
  dependsOn: string // 依赖的筛选器key
  targetField: string // 联动字段名
}

export interface GlobalFilterBinding {
  filterKey: string
  chartField: string
  operator?: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'greater_than' | 'greater_than_or_equal' | 'less_than' | 'less_than_or_equal' | 'is_null' | 'is_not_null'
}

export interface DashboardGlobalFilters {
  filters: GlobalFilterConfig[]
  layout?: {
    position: 'top' | 'left' | 'right'
    columns?: number
    spacing?: number
  }
}

// 图表配置接口
export interface ChartConfig {
  i: string
  id: string
  type: 'bar' | 'line' | 'pie' | 'table' | 'area' | 'scatter' | 'radar' | 'gauge' | 'funnel' | 'heatmap' | 'treemap' | 'liquidfill' | 'image' | 
        'filter-select' | 'filter-multiselect' | 'filter-date' | 'filter-daterange' | 'filter-slider' | 'filter-input' | 
        'text-title' | 'text-content'
  title?: string
  label?: string // 用于筛选器组件
  description?: string
  xField?: string
  yField?: string
  nameField?: string
  valueField?: string
  tableFields?: string[]
  showLegend?: boolean
  showToolbox?: boolean
  dataLimit?: number
  datasetId?: number | null
  fieldMapping?: ChartFieldMapping
  dataSourceConfig?: ChartDataSourceConfig
  imageUrl?: string
  
  // 新增全局筛选器绑定配置
  useGlobalFilters?: boolean
  globalFilterBindings?: GlobalFilterBinding[]
  
  // 筛选器关联配置
  filterBindings?: FilterBinding[]
  
  // 筛选器组件专用属性
  fieldName?: string
  placeholder?: string
  required?: boolean
  multiple?: boolean
  options?: FilterOption[]
  defaultValue?: any
  min?: number
  max?: number
  step?: number
  position?: number // 筛选器排序位置
  
  // 图表筛选器配置
  enableFilters?: boolean
  filterFields?: string[]
  filterType?: 'select' | 'multiselect' | 'daterange' | 'range' | 'search'
  filterPosition?: 'top' | 'bottom' | 'left' | 'right'
  filterDefaults?: Record<string, any>
  
  // 文本组件专用属性
  content?: string
  fontSize?: number
  fontWeight?: string
  color?: string
  textAlign?: string
  
  // 样式配置
  showTitle?: boolean
  titlePosition?: 'left' | 'center' | 'right'
  titleFontSize?: number
  titleColor?: string
  backgroundColor?: string
  borderColor?: string
  borderWidth?: number
  borderRadius?: number
  padding?: number
  legendPosition?: 'top' | 'bottom' | 'left' | 'right'
  showGrid?: boolean
  themeColor?: string
  enableAnimation?: boolean
  
  // 高级配置
  zIndex?: number
  opacity?: number
  responsive?: boolean
  draggable?: boolean
  resizable?: boolean
  
  // 数据配置
  autoRefresh?: boolean
  refreshInterval?: number
  enableCache?: boolean
  cacheTime?: number
  
  // 图表数据
  chartData?: {
    series?: any[]
    categories?: any[]
    [key: string]: any
  }
}

// 筛选器绑定接口
export interface FilterBinding {
  filterId: string
  filterType: string
  filterLabel: string
  targetField: string
  enabled: boolean
}

// 布局项接口
export interface LayoutItem {
  x: number
  y: number
  w: number
  h: number
  i: string
  chartConfig: ChartConfig
}

// 仪表盘表单接口
export interface DashboardForm {
  name: string
  description?: string
  layout: string
  status: DashboardStatus
  type: DashboardType
  menuId?: string
  category?: string
  config_json?: {
    layout?: LayoutItem[]
  }
}

// 仪表盘列表项接口
export interface DashboardItem {
  id: string
  name: string
  description?: string
  layout: string
  status: DashboardStatus
  type: DashboardType
  menuId?: string
  createTime?: string
  updateTime?: string
}

// 仪表盘查询参数接口
export interface DashboardQuery {
  page?: number
  pageSize?: number
  name?: string
  status?: DashboardStatus
  type?: DashboardType
}

// 仪表盘列表响应接口
export interface DashboardListResponse {
  code: number
  data: {
    list: DashboardItem[]
    total: number
  }
  message: string
}

// 仪表盘详情响应接口
export interface DashboardResponse {
  code: number
  data: {
    id: string
    name: string
    description?: string
    layout: string
    status: DashboardStatus
    type: DashboardType
    menuId?: string
    createdAt: string
    updatedAt: string
    createdBy?: string
    config: {
      charts: Array<{
        id: string
        type: string
        config: ChartConfig
        datasetId: number
      }>
    }
  }
  message: string
}

// 仪表盘详情接口
export interface DashboardDetail {
  id: string
  name: string
  description?: string
  layout: string | LayoutItem[]
  charts?: string | ChartConfig[]
  status: DashboardStatus
  type: DashboardType
  menuId?: string
  createdAt: string | object
  updatedAt: string | object
  createdBy?: string
  creator?: string
  tenantId?: string | null
  config?: {
    layout?: LayoutItem[]
    charts?: ChartConfig[]
    renderState?: boolean
    autoRender?: boolean
    globalFilters?: DashboardGlobalFilters
  }
}