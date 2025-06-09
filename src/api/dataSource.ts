import { get, post, put, del } from '@/utils/request'
import { dataSourceService } from '@/utils/request'
import type { 
  DataSource, 
  DataSourceCreateRequest, 
  TableInfo, 
  FieldInfo, 
  DataSet, 
  DataSetCreateRequest, 
  DataSetUpdateRequest,
  DataPreviewDTO, 
  PagedResponse,
  ApiResponse
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
  getAllDataSources(): Promise<ApiResponse<DataSource>> {
    return get(dataSourceService, '/api/datasources')
  },

  // 获取数据源下的所有表
  getTablesBySourceId: async (sourceId: number, dataSource?: DataSource): Promise<TableInfo[]> => {
    if (!dataSource) {
      throw new Error('DataSource information is required')
    }

    interface TableResponse {
      code: number;
      message: string;
      data: string[] | TableInfo[];
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
        return responseData.map((item: string | TableInfo) => {
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
    
    throw new Error(response.data.message || 'Failed to fetch tables');
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
  createDataSource: async (dataSource: DataSourceCreateRequest): Promise<DataSource> => {
    const response = await post(dataSourceService, '/api/datasources', dataSource)
    return response.data
  },

  // 更新数据源
  updateDataSource: async (id: number, updates: Partial<DataSource>): Promise<DataSource> => {
    const response = await put(dataSourceService, `/api/datasources/${id}`, updates)
    return response.data
  },

  // 删除数据源
  deleteDataSource: async (id: number): Promise<void> => {
    await del(dataSourceService, `/api/datasources/${id}`)
  },

  // 测试数据源连接
  testConnection: async (params: TestConnectionRequest): Promise<TestConnectionResponse> => {
    const response = await post(dataSourceService, '/api/datasources/test-connection', params)
    return response
  },

  // 更新数据源状态
  updateDataSourceStatus: async (id: number, status: string): Promise<DataSource> => {
    const response = await put(dataSourceService, `/api/datasources/${id}/status`, { status })
    return response.data
  }
}

// 数据集API
export const dataSetApi = {
  // 获取数据集列表
  getDatasets: async (params: { page: number; pageSize: number; keyword?: string }): Promise<ApiResponse<DataSet>> => {
    const response = await get(dataSourceService, '/api/datasets', { params })
    return response.data
  },

  // 获取单个数据集
  getDatasetById: async (id: number): Promise<DataSet> => {
    const response = await get(dataSourceService, `/api/datasets/${id}`)
    return response.data
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

  // 预览数据
  previewData: async (datasetId: number, limit: number = 100): Promise<DataPreviewDTO> => {
    const response = await get(dataSourceService, `/api/datasets/${datasetId}/preview?limit=${limit}`)
    
    // 调试：打印完整响应
    console.log('完整响应:', response)
    console.log('响应数据:', response.data)
    
    const { columns, data: rawData, totalCount } = response.data
    console.log('提取的数据:', { columns, rawData, totalCount })
    console.log('rawData类型:', typeof rawData, Array.isArray(rawData))
    
    // 安全检查
    if (!Array.isArray(rawData)) {
      return { columns: columns || [], data: [], totalCount: totalCount || 0 }
    }
    
    const transformedData = rawData.map((row: any[]) => {
      const obj: Record<string, any> = {}
      columns.forEach((column: string, index: number) => {
        obj[column] = row[index]
      })
      return obj
    })
    
    return {
      columns,
      data: transformedData,
      totalCount
    }
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