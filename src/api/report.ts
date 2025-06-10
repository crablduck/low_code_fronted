/*
 * @Author: Mr.Crab wei17306927526@gmail.com
 * @Date: 2025-01-14 10:00:00
 * @LastEditors: Mr.Crab wei17306927526@gmail.com
 * @LastEditTime: 2025-06-10 12:51:40
 * @FilePath: /workflow-system/src/api/report.ts
 * @Description: 报表管理API接口
 */
import { get, post, put, del } from '@/utils/request'
import { mainService } from '@/utils/request'
import request from '@/utils/request'

// 报表相关类型定义
export interface Report {
  id: number
  name: string
  description?: string
  category: 'sales' | 'finance' | 'operation' | 'statistics' | 'other'
  status: 'draft' | 'published'
  config: {
    template: string
    dataSource: {
      type: 'api' | 'table' | 'sql' | 'static'
      apiUrl?: string
      tableName?: string
      sqlQuery?: string
      staticData?: string
    }
    fields: {
      selected: string[]
      mapping: Record<string, string>
    }
    tableConfig?: {
      rowCount?: number
      colCount?: number
      height?: number
    }
  }
  createTime: string
  updateTime?: string
  createdBy?: number
}

export interface ReportCreateRequest {
  name: string
  description?: string
  category: 'sales' | 'finance' | 'operation' | 'statistics' | 'other'
  status?: 'draft' | 'published'
  config: Report['config']
}

export interface ReportListParams {
  page: number
  size: number
  keyword?: string
  category?: string
  status?: string
  startDate?: string
  endDate?: string
}

// 修正API响应类型定义
export interface StandardApiResponse<T = any> {
  code: number
  message: string
  data: T
}

// 报表列表响应
export interface ReportListResponse {
  code: number
  message: string
  data: {
    list: Report[]
    total: number
  }
}

export interface TableInfo {
  name: string
  comment?: string
  type: 'table' | 'view'
}

export interface TableField {
  name: string
  type: string
  comment?: string
  nullable?: boolean
  defaultValue?: string
}

// 适配器函数：处理分页数据格式差异
const adaptPagedResponse = (response: any): ReportListResponse => {
  // 处理嵌套的响应格式 response.data.data.list
  const innerData = response.data?.data || response.data || {}
  
  return {
    code: response.code || 200,
    message: response.message || 'success',
    data: {
      list: innerData.list || innerData.content || [],
      total: innerData.total || innerData.totalElements || 0
    }
  }
}

// 适配器函数：处理标准响应格式
const adaptStandardResponse = <T>(response: any): StandardApiResponse<T> => {
  // 处理嵌套的响应格式，优先使用内层data
  const actualData = response.data?.data || response.data
  
  return {
    code: response.code || 200,
    message: response.message || 'success',
    data: actualData
  }
}

// 报表API
export const reportApi = {
  // 获取报表列表
  getReports: async (params: ReportListParams): Promise<ReportListResponse> => {
    const queryParams = new URLSearchParams({
      page: params.page.toString(),
      size: params.size.toString(),
      ...(params.keyword && { keyword: params.keyword }),
      ...(params.category && { category: params.category }),
      ...(params.status && { status: params.status }),
      ...(params.startDate && { startDate: params.startDate }),
      ...(params.endDate && { endDate: params.endDate })
    }).toString()
    
    const response = await get(mainService, `/api/reports?${queryParams}`)
    return adaptPagedResponse(response)
  },

  // 获取单个报表
  getReport: async (id: number): Promise<StandardApiResponse<Report>> => {
    const response = await get(mainService, `/api/reports/${id}`)
    return adaptStandardResponse<Report>(response)
  },

  // 创建报表
  createReport: async (report: ReportCreateRequest): Promise<StandardApiResponse<Report>> => {
    const response = await post(mainService, '/api/reports', report)
    return adaptStandardResponse<Report>(response)
  },

  // 更新报表
  updateReport: async (id: number, updates: Partial<ReportCreateRequest>): Promise<StandardApiResponse<Report>> => {
    const response = await put(mainService, `/api/reports/${id}`, updates)
    return adaptStandardResponse<Report>(response)
  },

  // 删除报表
  deleteReport: async (id: number): Promise<StandardApiResponse<void>> => {
    const response = await del(mainService, `/api/reports/${id}`)
    return adaptStandardResponse<void>(response)
  },

  // 发布报表
  publishReport: async (id: number): Promise<StandardApiResponse<void>> => {
    const response = await post(mainService, `/api/reports/${id}/publish`, {})
    return adaptStandardResponse<void>(response)
  },

  // 取消发布
  unpublishReport: async (id: number): Promise<StandardApiResponse<void>> => {
    const response = await post(mainService, `/api/reports/${id}/unpublish`, {})
    return adaptStandardResponse<void>(response)
  },

  // 复制报表
  copyReport: async (id: number, newName?: string): Promise<StandardApiResponse<Report>> => {
    const response = await post(mainService, `/api/reports/${id}/copy`, { name: newName })
    return adaptStandardResponse<Report>(response)
  },

  // 批量删除报表
  batchDeleteReports: async (ids: number[]): Promise<StandardApiResponse<void>> => {
    const response = await post(mainService, '/api/reports/batch-delete', { ids })
    return adaptStandardResponse<void>(response)
  },

  // 批量发布报表
  batchPublishReports: async (ids: number[]): Promise<StandardApiResponse<void>> => {
    const response = await post(mainService, '/api/reports/batch-publish', { ids })
    return adaptStandardResponse<void>(response)
  },

  // 导出报表配置
  exportReport: async (id: number): Promise<StandardApiResponse<Report>> => {
    const response = await get(mainService, `/api/reports/${id}/export`)
    return adaptStandardResponse<Report>(response)
  },

  // 导入报表配置
  importReport: async (configData: any): Promise<StandardApiResponse<Report[]>> => {
    const response = await post(mainService, '/api/reports/import', configData)
    return adaptStandardResponse<Report[]>(response)
  }
}

// 数据源相关API
export const reportDataSourceApi = {
  // 获取数据表列表
  getTableList: async (dataSourceId?: number): Promise<StandardApiResponse<TableInfo[]>> => {
    const url = dataSourceId ? `/api/tables?dataSourceId=${dataSourceId}` : '/api/tables'
    const response = await get(mainService, url)
    return adaptStandardResponse<TableInfo[]>(response)
  },

  // 获取表结构
  getTableStructure: async (tableName: string): Promise<StandardApiResponse<TableField[]>> => {
    const response = await get(mainService, `/api/tables/${tableName}/structure`)
    return adaptStandardResponse<TableField[]>(response)
  },

  // 获取表数据预览
  getTableData: async (tableName: string, limit: number = 10): Promise<StandardApiResponse<any[]>> => {
    const response = await get(mainService, `/api/tables/${tableName}/data?limit=${limit}`)
    return adaptStandardResponse<any[]>(response)
  },

  // 测试API接口
  testApiUrl: async (url: string): Promise<StandardApiResponse<any>> => {
    const response = await post(mainService, '/api/test-api', { url })
    return adaptStandardResponse<any>(response)
  },

  // 验证SQL查询
  validateSqlQuery: async (sql: string, dataSourceId?: number): Promise<StandardApiResponse<{ valid: boolean; error?: string }>> => {
    const response = await post(mainService, '/api/validate-sql', { sql, dataSourceId })
    return adaptStandardResponse<{ valid: boolean; error?: string }>(response)
  },

  // 执行SQL查询预览
  previewSqlQuery: async (sql: string, dataSourceId?: number, limit: number = 10): Promise<StandardApiResponse<any[]>> => {
    const response = await post(mainService, '/api/preview-sql', { sql, dataSourceId, limit })
    return adaptStandardResponse<any[]>(response)
  }
}

// 报表统计API
export const reportStatsApi = {
  // 获取报表统计概览
  getReportStats: async (): Promise<StandardApiResponse<{
    totalReports: number
    publishedReports: number
    draftReports: number
    categoryStats: Record<string, number>
  }>> => {
    const response = await get(mainService, '/api/reports/stats')
    return adaptStandardResponse<{
      totalReports: number
      publishedReports: number
      draftReports: number
      categoryStats: Record<string, number>
    }>(response)
  },

  // 获取报表使用情况
  getReportUsage: async (id: number, days: number = 30): Promise<StandardApiResponse<{
    viewCount: number
    exportCount: number
    dailyStats: Array<{ date: string; views: number; exports: number }>
  }>> => {
    const response = await get(mainService, `/api/reports/${id}/usage?days=${days}`)
    return adaptStandardResponse<{
      viewCount: number
      exportCount: number
      dailyStats: Array<{ date: string; views: number; exports: number }>
    }>(response)
  }
}

// Univer 报表接口
export const getUniverReports = async (params: any) => {
  return request({
    url: '/api/univer-reports',
    method: 'get',
    params
  })
}

export const getUniverReport = async (id: string) => {
  return request({
    url: `/api/univer-reports/${id}`,
    method: 'get'
  })
}

export const createUniverReport = async (data: any) => {
  return request({
    url: '/api/univer-reports',
    method: 'post',
    data
  })
}

export const updateUniverReport = async (data: any) => {
  return request({
    url: `/api/univer-reports/${data.id}`,
    method: 'put',
    data
  })
}

export const saveUniverReportData = async (id: string, data: any) => {
  return request({
    url: `/api/univer-reports/${id}/data`,
    method: 'put',
    data
  })
}

export const deleteUniverReport = async (id: string) => {
  return request({
    url: `/api/univer-reports/${id}`,
    method: 'delete'
  })
}

export const copyUniverReport = async (id: string) => {
  return request({
    url: `/api/univer-reports/${id}/copy`,
    method: 'post'
  })
}

export const exportUniverReport = async (id: string) => {
  return request({
    url: `/api/univer-reports/${id}/export`,
    method: 'get'
  })
}

export const publishUniverReport = async (id: string, data: any) => {
  return request({
    url: `/api/univer-reports/${id}/publish`,
    method: 'post',
    data
  })
}

export const getUniverReportTemplate = async (templateKey: string) => {
  return request({
    url: `/api/univer-report-templates/${templateKey}`,
    method: 'get'
  })
}

// 数据集查询接口 - 用于数据源计算
export const queryDatasetForReport = async (datasetId: string, config: any) => {
  return request({
    url: `/api/datasets/${datasetId}/query`,
    method: 'post',
    data: config
  })
}

// 预览数据集数据
export const previewDatasetData = async (datasetId: string, config: any) => {
  return request({
    url: `/api/datasets/${datasetId}/preview`,
    method: 'post',
    data: config
  })
}

export default reportApi 