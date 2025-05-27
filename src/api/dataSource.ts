import request from '@/utils/request'
import type { 
  DataSource, 
  DataSourceCreateRequest, 
  TableInfo, 
  FieldInfo, 
  DataSet, 
  DataSetCreateRequest, 
  DataSetUpdateRequest,
  DataPreviewDTO, 
  PagedResponse 
} from '@/types/dataManagement'

// 数据源 API
export const dataSourceApi = {
  // 获取所有数据源
  getAllDataSources: async (): Promise<DataSource[]> => {
    const response = await request.get('/api/data-sources')
    return response.data
  },

  // 获取数据源下的所有表
  getTablesBySourceId: async (sourceId: number): Promise<TableInfo[]> => {
    const response = await request.get(`/api/table-list?db=${sourceId}`)
    return response.data
  },

  // 获取表的字段信息
  getFieldsByTable: async (sourceId: number, tableName: string): Promise<FieldInfo[]> => {
    const response = await request.get(`/api/table-fields/${tableName}?db=${sourceId}`)
    return response.data
  },

  // 创建数据源
  createDataSource: async (dataSource: DataSourceCreateRequest): Promise<DataSource> => {
    const response = await request.post('/api/data-sources', dataSource)
    return response.data
  },

  // 更新数据源
  updateDataSource: async (id: number, updates: Partial<DataSource>): Promise<DataSource> => {
    const response = await request.put(`/api/data-sources/${id}`, updates)
    return response.data
  },

  // 删除数据源
  deleteDataSource: async (id: number): Promise<void> => {
    await request.delete(`/api/data-sources/${id}`)
  },

  // 测试数据源连接
  testConnection: async (dataSource: Partial<DataSource>): Promise<boolean> => {
    const response = await request.post('/api/data-sources/test', dataSource)
    return response.data.success
  },

  // 更新数据源状态
  updateDataSourceStatus: async (id: number, status: string): Promise<DataSource> => {
    const response = await request.patch(`/api/data-sources/${id}/status`, { status })
    return response.data
  }
}

// 数据集API
export const dataSetApi = {
  // 获取数据集列表
  getDatasets: async (params: { page: number; pageSize: number; keyword?: string }): Promise<PagedResponse<DataSet>> => {
    // 使用 mock 数据
    const mockDatasets = [
      {
        id: 1,
        name: '患者基础信息数据集',
        description: '患者基本信息，包含姓名、年龄、性别等基础数据',
        dataSourceId: 1,
        dataSourceName: 'MySQL主库',
        queryType: 'single',
        tableName: 'patients',
        status: 'active',
        createTime: '2024-01-15T10:30:00Z',
        updateTime: '2024-01-20T14:20:00Z',
        fields: [
          {
            id: 1,
            datasetId: 1,
            fieldName: 'patient_name',
            fieldType: 'dimension',
            displayName: '患者姓名',
            description: '患者的真实姓名',
            isVisible: true,
            sortOrder: 1,
            tableName: 'patients',
            physicalName: 'patient_name',
            dataType: 'varchar'
          }
        ]
      }
    ];

    return {
      items: mockDatasets,
      total: mockDatasets.length,
      page: params.page,
      pageSize: params.pageSize
    };
  },

  // 获取单个数据集
  getDatasetById: async (id: number): Promise<DataSet> => {
    const response = await request.get(`/api/datasets/${id}`)
    return response.data
  },

  // 创建数据集
  createDataset: async (dataset: DataSetCreateRequest): Promise<DataSet> => {
    const response = await request.post('/api/datasets', dataset)
    return response.data
  },

  // 更新数据集
  updateDataset: async (id: number, updates: DataSetUpdateRequest): Promise<DataSet> => {
    const response = await request.put(`/api/datasets/${id}`, updates)
    return response.data
  },

  // 删除数据集
  deleteDataset: async (id: number): Promise<void> => {
    await request.delete(`/api/datasets/${id}`)
  },

  // 更新数据集状态
  updateDatasetStatus: async (id: number, status: string): Promise<void> => {
    await request.put(`/api/datasets/${id}/status`, { status })
  },

  // 预览数据
  previewData: async (datasetId: number, limit: number = 100): Promise<DataPreviewDTO> => {
    const response = await request.get(`/api/datasets/${datasetId}/preview`, {
      params: { limit }
    })
    return response.data
  },

  // 验证SQL查询
  validateSQL: async (dataSourceId: number, sql: string): Promise<{ valid: boolean; error?: string }> => {
    const response = await request.post('/api/datasets/validate-sql', {
      dataSourceId,
      sql
    })
    return response.data
  },

  // 获取SQL查询结果预览
  previewSQL: async (dataSourceId: number, sql: string, limit: number = 100): Promise<DataPreviewDTO> => {
    const response = await request.post('/api/datasets/preview-sql', {
      dataSourceId,
      sql,
      limit
    })
    return response.data
  }
}

// 仪表盘API
export const dashboardApi = {
  // 保存仪表盘
  saveDashboard: async (data: any): Promise<any> => {
    const response = await request.post('/api/dashboards', data)
    return response.data
  },

  // 获取仪表盘列表
  getDashboards: async (): Promise<any[]> => {
    const response = await request.get('/api/dashboards')
    return response.data
  },

  // 获取仪表盘详情
  getDashboard: async (id: string): Promise<any> => {
    const response = await request.get(`/api/dashboards/${id}`)
    return response.data
  },

  // 更新仪表盘
  updateDashboard: async (id: string, data: any): Promise<any> => {
    const response = await request.put(`/api/dashboards/${id}`, data)
    return response.data
  },

  // 删除仪表盘
  deleteDashboard: async (id: string): Promise<void> => {
    await request.delete(`/api/dashboards/${id}`)
  }
}