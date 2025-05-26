import request from './request'

// 数据源接口
export interface DataSource {
  id: number
  name: string
  type: 'mysql' | 'postgresql' | 'sqlite'
  host?: string
  port?: number
  database: string
  status: 'connected' | 'disconnected'
}

// 数据表接口
export interface DatabaseTable {
  name: string
  comment: string
  columns: TableColumn[]
}

// 表字段接口
export interface TableColumn {
  name: string
  type: string
  comment: string
  nullable: boolean
}

// 表单字段接口
export interface FormFieldFromTable {
  field: string
  label: string
  type: string
  required: boolean
  placeholder?: string
  options?: string[]
}

// 获取数据源列表
export const getDataSources = (): Promise<DataSource[]> => {
  return request.get('/api/data-sources')
}

// 获取指定数据源的表列表
export const getTableList = (dataSourceId: number): Promise<DatabaseTable[]> => {
  return request.get(`/api/table-list?db=${dataSourceId}`)
}

// 根据表结构生成表单字段
export const getTableFields = (tableName: string, dataSourceId: number): Promise<FormFieldFromTable[]> => {
  return request.get(`/api/table-fields/${tableName}?db=${dataSourceId}`)
} 