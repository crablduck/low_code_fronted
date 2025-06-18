// 过滤条件接口
export interface FilterCondition {
  id: string
  field: string
  operator: '=' | '!=' | '>' | '>=' | '<' | '<=' | 'in' | 'not_in' | 'like' | 'between' | 'is_null' | 'is_not_null'
  value: any
  dataType: 'string' | 'number' | 'integer' | 'decimal' | 'date' | 'datetime' | 'boolean' | 'text' | 'json'
  logicalOperator?: 'AND' | 'OR'
}

// 计算配置接口
export interface ComputeConfig {
  bindType?: 'dataSourceComputed'
  datasetId: string
  field: string
  aggregate: string
  filters: FilterCondition[]
  parameters?: Record<string, any>
  // 额外信息
  datasetName?: string
  fieldLabel?: string
  createdAt?: string
}

// 聚合函数类型
export type AggregateFunction = 
  | 'SUM'      // 求和
  | 'AVG'      // 平均值
  | 'COUNT'    // 计数
  | 'MAX'      // 最大值
  | 'MIN'      // 最小值
  | 'MEDIAN'   // 中位数
  | 'MODE'     // 众数
  | 'STDDEV'   // 标准差
  | 'VARIANCE' // 方差
  | 'PERCENTILE' // 百分位数
  | 'RANK'     // 排名
  | 'DISTINCT' // 去重计数
  | 'FIRST'    // 第一个值
  | 'LAST'     // 最后一个值
  | 'CUSTOM'   // 自定义函数

// 函数定义
export interface FunctionDefinition {
  id: AggregateFunction
  name: string
  description: string
  supportedTypes: string[]
  requiresParameters: boolean
  parameters?: ParameterDefinition[]
}

// 参数定义
export interface ParameterDefinition {
  name: string
  label: string
  type: 'number' | 'string' | 'select' | 'multiSelect'
  required: boolean
  defaultValue?: any
  options?: { label: string; value: any }[]
  min?: number
  max?: number
}

// 预览数据接口
export interface PreviewData {
  preview: any[]
  result: any
  totalCount: number
  message?: string
}

// 计算请求接口
export interface ComputeRequest {
  datasetId: string
  field: string
  aggregate: AggregateFunction
  filters: FilterCondition[]
  parameters?: Record<string, any>
  limit?: number
  preview?: boolean
}

// 计算响应接口
export interface ComputeResponse {
  code: number
  message: string
  data: PreviewData
}

// 数据源绑定信息
export interface DataSourceBinding {
  id: string
  cellAddress: string  // 如: "A1"
  sheetId: string
  config: ComputeConfig
  lastUpdated: string
  autoRefresh: boolean
  status: 'active' | 'error' | 'pending'
  errorMessage?: string
} 