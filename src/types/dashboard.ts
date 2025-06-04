export enum DashboardStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published'
}

export enum DashboardType {
  CUSTOM = 'custom',
  TEMPLATE = 'template'
}

// 图表配置接口
export interface ChartConfig {
  i: string
  id: string
  type: 'bar' | 'line' | 'pie' | 'table'
  title?: string
  xField?: string
  yField?: string
  nameField?: string
  valueField?: string
  tableFields?: string[]
  showLegend?: boolean
  showToolbox?: boolean
  dataLimit?: number
  datasetId?: number
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