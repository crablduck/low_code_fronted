// 数据源相关类型定义
export interface DataSource {
  id: number
  name: string
  type: 'mysql' | 'postgresql' | 'sqlite' | 'oracle' | 'sqlserver' | 'clickhouse'
  // API返回格式
  url?: string
  database?: string
  properties?: string
  createdAt?: string
  updatedAt?: string
  status?: 'online' | 'offline'
  // 表单使用格式
  host?: string
  port?: number
  databaseName?: string
  username?: string
  password?: string
  description?: string
  folderId?: number
  // 用于显示的计算属性
  displayHost?: string
  displayPort?: number
  displayDatabase?: string
  displayUsername?: string
}

export interface DataSourceCreateRequest {
  name: string
  type: 'mysql' | 'postgresql' | 'sqlite' | 'oracle' | 'sqlserver'
  host: string
  port: number
  databaseName: string
  username: string
  password: string
  description?: string
  folderId?: number
}

export interface TableInfo {
  name: string
  description?: string
  rowCount?: number
  createTime?: string
}

export interface FieldInfo {
  name: string
  dataType: string
  isPrimary: boolean
  isNullable: boolean
  description?: string
  defaultValue?: string
  tableName?: string
}

// 表关系定义
export interface TableRelation {
  id?: number
  leftTable: string
  leftField: string
  rightTable: string
  rightField: string
  joinType: 'INNER' | 'LEFT' | 'RIGHT' | 'FULL'
  alias?: string
}

// 数据集定义（支持多表关联）
export interface DataSet {
  id: number
  name: string
  description?: string
  dataSourceId: number
  dataSourceName: string
  // 单表模式
  tableName?: string
  // 多表模式
  tables?: string[]
  relations?: TableRelation[]
  // SQL模式
  sqlQuery?: string
  queryType: 'single' | 'multi' | 'sql'
  status: 'active' | 'inactive'
  createTime: string
  updateTime?: string
  fields: DataSetField[]
}

export interface DataSetCreateRequest {
  name: string
  description?: string
  dataSourceId: number
  queryType: 'single' | 'multi' | 'sql'
  // 单表模式
  tableName?: string
  // 多表模式
  tables?: string[]
  relations?: TableRelation[]
  // SQL模式
  sqlQuery?: string
  // 字段配置
  fields?: DataSetFieldConfig[]
}

export interface DataSetUpdateRequest {
  name?: string
  description?: string
  queryType?: 'single' | 'multi' | 'sql'
  tableName?: string
  tables?: string[]
  relations?: TableRelation[]
  sqlQuery?: string
  status?: 'active' | 'inactive'
  fields?: DataSetFieldConfig[]
}

export interface DataSetField {
  id: number
  datasetId: number
  fieldName: string
  fieldType: 'dimension' | 'metric' | 'date'
  displayName: string
  description?: string
  isVisible: boolean
  sortOrder: number
  // 多表支持
  tableName?: string
  physicalName?: string
  dataType?: string
  aggregation?: 'sum' | 'count' | 'avg' | 'max' | 'min'
  // 计算字段支持
  isCalculated?: boolean
  expression?: string
}

export interface DataSetFieldConfig {
  fieldName: string
  tableName?: string
  fieldType: 'dimension' | 'metric' | 'date'
  displayName: string
  description?: string
  isVisible: boolean
  sortOrder: number
  aggregation?: 'sum' | 'count' | 'avg' | 'max' | 'min'
  isCalculated?: boolean
  expression?: string
}

export interface DataPreviewDTO {
  columns: string[]
  data: any[]
  totalCount: number
}

export interface PagedResponse<T> {
  data: T[]
  total: number
  page: number
  size: number
}

export interface FolderNode {
  id: number
  name: string
  type: 'folder'
  children: (FolderNode | DataSourceNode | DatasetNode)[]
}

export interface DataSourceNode {
  id: number
  name: string
  type: 'datasource'
  source: DataSource
}

export interface DatasetNode {
  id: number
  name: string
  type: 'dataset'
  dataset: DataSet
}

export type TreeNode = FolderNode | DataSourceNode | DatasetNode

// 字段类型定义
export interface DataSetField {
  fieldName: string
  displayName: string
  fieldType: 'dimension' | 'metric' | 'date'
  dataType: 'string' | 'number' | 'date' | 'datetime'
  description?: string
  format?: string
  unit?: string
}

// 数据源类型定义
export interface DataSource {
  id: number
  name: string
  type: string
  config: Record<string, any>
  description?: string
}

// 数据查询参数类型
export interface QueryParams {
  datasetId: number
  dimensions?: string[]
  metrics?: string[]
  filters?: QueryFilter[]
  limit?: number
  offset?: number
}

// 查询过滤条件类型
export interface QueryFilter {
  field: string
  operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'between' | 'like'
  value: any
}

// 数据集查询参数
export interface DataSetQueryParams {
  dimensions?: string[]
  metrics?: string[]
  filters?: {
    field: string
    operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'between'
    value: any
  }[]
  limit?: number
  offset?: number
  orderBy?: {
    field: string
    direction: 'asc' | 'desc'
  }[]
}

// 数据预览结果
export interface DataPreviewResult {
  total: number
  data: any[]
}

// 表结构信息
export interface TableSchema {
  name: string
  type: string
  length?: number
  comment?: string
  nullable?: boolean
  defaultValue?: any
}

// 数据源连接测试结果
export interface ConnectionTestResult {
  success: boolean
  message: string
  error?: string
}

export interface DataSetQuery {
  page: number
  pageSize: number
  keyword?: string
} 