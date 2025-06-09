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
    tableName: 'patient_stats',
    fields: [
      { fieldName: 'department', displayName: '科室', fieldType: 'dimension' },
      { fieldName: 'month', displayName: '月份', fieldType: 'dimension' },
      { fieldName: 'visitCount', displayName: '就诊人数', fieldType: 'metric' },
      { fieldName: 'revenue', displayName: '收入', fieldType: 'metric' }
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