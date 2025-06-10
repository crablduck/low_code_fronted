import { get, post, put, del } from '@/utils/request'
import { dataSourceService } from '@/utils/request'
import type { 
  DataSource, 
  DataSourceCreateRequest, 
  TableInfo, 
  FieldInfo, 
  DataSet, 
  DataSetField,
  DataSetCreateRequest, 
  DataSetUpdateRequest,
  DataPreviewDTO, 
  PagedResponse
} from '@/types/dataManagement'

// 测试连接请求参数类型
interface TestConnectionRequest {
  url: string
  username: string
  password: string
  port: number
  database: string
  type: 'mysql' | 'postgresql' | 'sqlite' | 'oracle' | 'sqlserver'
}

// 测试连接响应类型
interface TestConnectionResponse {
  code: number
  data: string
  message: string
}

// 数据源 API
export const dataSourceApi = {
  // 获取所有数据源
  getAllDataSources(): Promise<any> {
    return get(dataSourceService, '/api/datasources')
  },

  // 获取数据源下的所有表
  getTablesBySourceId: async (sourceId: number, dataSource?: DataSource): Promise<TableInfo[]> => {
    if (!dataSource) {
      throw new Error('DataSource information is required')
    }

    const response = await post(dataSourceService, '/api/datasources/tables', {
      name: dataSource.name,
      type: dataSource.type,
      url: dataSource.url,
      username: dataSource.username,
      password: dataSource.password,
      database: dataSource.database,
      port: dataSource.port
    })
    
    if (response.code === 200) {
      const responseData = response.data;
      // 如果返回的是字符串数组，转换为TableInfo数组
      if (Array.isArray(responseData)) {
        return responseData.map((item: any) => {
          if (typeof item === 'string') {
            return {
              name: item,
              description: '',
              type: 'table',
              createTime: new Date().toISOString(),
              updateTime: new Date().toISOString()
            } as TableInfo;
          }
          return item;
        });
      }
      // 如果已经是TableInfo数组，直接返回
      return responseData as TableInfo[];
    }
    
    throw new Error((response as any).message || 'Failed to fetch tables');
  },

  // 获取表的字段信息
  getFieldsByTable: async (sourceId: number, tableName: string, dataSource: DataSource): Promise<any> => {
    const response = await post(dataSourceService, `/api/datasources/tables/${tableName}/fields`, {
      name: dataSource.name,
      type: dataSource.type,
      url: dataSource.url,
      username: dataSource.username,
      password: dataSource.password,
      database: dataSource.database,
      port: dataSource.port
    })
    
    // 直接返回完整的响应对象，让调用者处理
    return response
  },

  // 创建数据源
  createDataSource: async (dataSource: DataSourceCreateRequest): Promise<any> => {
    const response = await post(dataSourceService, '/api/datasources', dataSource)
    return (response as any).data
  },

  // 更新数据源
  updateDataSource: async (id: number, updates: Partial<DataSource>): Promise<any> => {
    const response = await put(dataSourceService, `/api/datasources/${id}`, updates)
    return (response as any).data
  },

  // 删除数据源
  deleteDataSource: async (id: number): Promise<void> => {
    await del(dataSourceService, `/api/datasources/${id}`)
  },

  // 测试数据源连接
  testConnection: async (params: TestConnectionRequest): Promise<any> => {
    const response = await post(dataSourceService, '/api/datasources/test-connection', params)
    return response
  },

  // 更新数据源状态
  updateDataSourceStatus: async (id: number, status: string): Promise<any> => {
    const response = await put(dataSourceService, `/api/datasources/${id}/status`, { status })
    return (response as any).data
  }
}

// 数据集API
export const dataSetApi = {
  // 获取数据集列表 - 修改为匹配API文档
  getDatasets: async (params?: { page?: number; pageSize?: number; keyword?: string }): Promise<PagedResponse<DataSet>> => {
    const response = await get(dataSourceService, '/api/datasets')
    
    // 根据API文档，响应格式为 { code, message, data: { content, totalElements, totalPages, currentPage, pageSize } }
    if (response.code === 200) {
      return {
        data: (response.data as any).content || response.data || [],
        total: (response.data as any).totalElements || 0,
        page: (response.data as any).currentPage || 1,
        size: (response.data as any).pageSize || 10
      }
    }
    
    throw new Error(response.message || 'Failed to fetch datasets')
  },

  // 获取单个数据集 - 需要新增API接口
  getDatasetById: async (id: number): Promise<DataSet> => {
    // 注意：这个接口在API文档中不存在，需要后端添加
    const response = await get(dataSourceService, `/api/datasets/${id}`)
    
    if (response.code === 200) {
      return response.data
    }
    
    throw new Error(response.message || 'Failed to fetch dataset')
  },

  // 测试数据源连接
  testConnection: async (id: number): Promise<boolean> => {
    const response = await post(dataSourceService, `/api/datasources/${id}/test-connection`, {})
    return response.data.success
  },

  // 创建数据集
  createDataset: async (dataset: DataSetCreateRequest): Promise<DataSet> => {
    const response = await post(dataSourceService, '/api/datasets', dataset)
    return response.data
  },

  // 更新数据集
  updateDataset: async (id: number, updates: DataSetUpdateRequest): Promise<DataSet> => {
    const response = await put(dataSourceService, `/api/datasets/${id}`, updates)
    return response.data
  },

  // 删除数据集
  deleteDataset: async (id: number): Promise<void> => {
    await del(dataSourceService, `/api/datasets/${id}`)
  },

  // 更新数据集状态
  updateDatasetStatus: async (id: number, status: string): Promise<void> => {
    await put(dataSourceService, `/api/datasets/${id}/status`, { status })
  },

  // 预览数据 - 基于数据集预览
  previewData: async (dataset: DataSet, limit: number = 100): Promise<DataPreviewDTO> => {
    // 注意：这个接口需要后端新增，基于数据集ID预览数据
    // 目前使用 /preview-sql 接口的变通方案
    
    let sql = ''
    if (dataset.queryType === 'single' && dataset.tableName) {
      sql = `SELECT * FROM ${dataset.tableName} LIMIT ${limit}`
    } else if (dataset.sqlQuery) {
      sql = dataset.sqlQuery
    } else {
      throw new Error('无法生成预览SQL')
    }
    
    const response = await post(dataSourceService, '/preview-sql', { sql })
    
    // 处理返回的数据，格式化为标准格式
    const rawData = response.data || response
    
    if (Array.isArray(rawData) && rawData.length > 0) {
      const columns = Object.keys(rawData[0])
      return {
        columns,
        data: rawData,
        totalCount: rawData.length
      }
    }
    
    return { columns: [], data: [], totalCount: 0 }
  },

  // 验证SQL查询
  validateSQL: async (dataSourceId: number, sql: string): Promise<{ valid: boolean; error?: string }> => {
    const response = await post(dataSourceService, `/api/datasources/${dataSourceId}/validate-sql`, { sql })
    return response.data
  },

  // 获取SQL查询结果预览
  previewSQL: async (dataSourceId: number, sql: string, limit: number = 100): Promise<DataPreviewDTO> => {
    const response = await post(dataSourceService, `/api/datasources/${dataSourceId}/preview-sql`, { sql, limit })
    return response.data
  },

  // 获取数据集字段信息 - 新增方法
  getDatasetFields: async (dataset: DataSet): Promise<DataSetField[]> => {
    // 如果数据集已经包含字段信息，直接转换返回
    if (dataset.fields && dataset.fields.length > 0) {
      return dataset.fields.map((field: any, index: number) => ({
        id: index + 1,
        datasetId: dataset.id,
        fieldName: field.fieldName,
        fieldType: field.fieldType?.toLowerCase() === 'varchar' || field.fieldType?.toLowerCase() === 'char' || field.fieldType?.toLowerCase() === 'date' ? 'dimension' : 'metric',
        displayName: field.displayName || field.fieldName,
        description: field.description || '',
        isVisible: field.isVisible !== false,
        sortOrder: field.sortOrder || index,
        tableName: field.tableName || dataset.tableName,
        physicalName: field.fieldName,
        dataType: field.fieldType?.toLowerCase().includes('int') || field.fieldType?.toLowerCase().includes('decimal') || field.fieldType?.toLowerCase().includes('bigint') ? 'number' : 
                  field.fieldType?.toLowerCase().includes('date') ? 'date' : 'string',
        aggregation: field.aggregation
      }))
    }
    
    // 如果没有字段信息，通过预览数据来推断
    try {
      const previewData = await dataSetApi.previewData(dataset, 1)
      
      return previewData.columns.map((column: string, index: number) => ({
        id: index + 1,
        datasetId: dataset.id,
        fieldName: column,
        fieldType: 'dimension' as const, // 默认为维度
        displayName: column,
        description: '',
        isVisible: true,
        sortOrder: index,
        tableName: dataset.tableName,
        physicalName: column,
        dataType: 'string' as const, // 默认类型
        aggregation: undefined
      }))
    } catch (error) {
      console.error('获取数据集字段失败:', error)
      return []
    }
  }
}

// 仪表盘API
export const dashboardApi = {
  // 保存仪表盘
  saveDashboard: async (data: any): Promise<any> => {
    const response = await post(dataSourceService, '/api/dashboards', data)
    return response
  },

  // 获取仪表盘列表
  getDashboards: async (): Promise<any[]> => {
    const response = await get(dataSourceService, '/api/dashboards')
    return response.data
  },

  // 获取仪表盘详情
  getDashboard: async (id: string): Promise<any> => {
    const response = await get(dataSourceService, `/api/dashboards/${id}`)
    return response
  },

  // 更新仪表盘
  updateDashboard: async (id: string, data: any): Promise<any> => {
    const response = await put(dataSourceService, `/api/dashboards/${id}`, data)
    return response
  },

  // 删除仪表盘
  deleteDashboard: async (id: string): Promise<void> => {
    await del(dataSourceService, `/api/dashboards/${id}`)
  }
}