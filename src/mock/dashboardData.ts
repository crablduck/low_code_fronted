// 医疗行业模拟数据
export const mockMedicalData = {
  patientStats: [
    { department: '内科', month: '2024-01', visitCount: 1250, revenue: 125000 },
    { department: '外科', month: '2024-01', visitCount: 980, revenue: 196000 },
    { department: '儿科', month: '2024-01', visitCount: 750, revenue: 75000 },
    { department: '妇产科', month: '2024-01', visitCount: 650, revenue: 130000 },
    { department: '急诊科', month: '2024-01', visitCount: 1100, revenue: 110000 }
  ]
}

// 模拟数据集
export const mockDatasets = [
  {
    id: 1,
    name: '患者统计数据',
    description: '医院各科室的患者就诊统计数据',
    dataSourceId: 1,
    dataSourceName: '医院业务数据库',
    tableName: 'patient_stats',
    queryType: 'single',
    status: 'active',
    createTime: '2024-01-01T00:00:00Z',
    updateTime: '2024-01-01T00:00:00Z',
    fields: [
      { 
        id: 1,
        datasetId: 1,
        fieldName: 'department', 
        displayName: '科室', 
        fieldType: 'dimension',
        description: '医院科室名称',
        isVisible: true,
        sortOrder: 1,
        dataType: 'string'
      },
      { 
        id: 2,
        datasetId: 1,
        fieldName: 'month', 
        displayName: '月份', 
        fieldType: 'dimension',
        description: '统计月份',
        isVisible: true,
        sortOrder: 2,
        dataType: 'string'
      },
      { 
        id: 3,
        datasetId: 1,
        fieldName: 'visitCount', 
        displayName: '就诊人数', 
        fieldType: 'metric',
        description: '该月就诊总人数',
        isVisible: true,
        sortOrder: 3,
        dataType: 'number',
        aggregation: 'sum'
      },
      { 
        id: 4,
        datasetId: 1,
        fieldName: 'revenue', 
        displayName: '收入', 
        fieldType: 'metric',
        description: '该月收入总额',
        isVisible: true,
        sortOrder: 4,
        dataType: 'number',
        aggregation: 'sum'
      }
    ]
  }
]

// 默认字段映射
export const defaultFieldMappings = {
  bar: { xField: 'department', yField: 'visitCount' },
  line: { xField: 'month', yField: 'visitCount' },
  pie: { nameField: 'department', valueField: 'visitCount' },
  table: { tableFields: ['department', 'month', 'visitCount', 'revenue'] }
} 