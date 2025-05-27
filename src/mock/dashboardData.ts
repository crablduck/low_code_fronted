import type { DataSet } from '@/types/dataManagement'

// 医疗数据集模拟数据
export const mockMedicalData = {
  // 患者统计数据
  patientStats: [
    { date: '2024-01', department: '内科', patientCount: 156, revenue: 89500, avgStay: 4.2 },
    { date: '2024-01', department: '外科', patientCount: 98, revenue: 125000, avgStay: 5.8 },
    { date: '2024-01', department: '儿科', patientCount: 78, revenue: 45600, avgStay: 3.1 },
    { date: '2024-01', department: '妇产科', patientCount: 112, revenue: 98000, avgStay: 4.5 },
    { date: '2024-02', department: '内科', patientCount: 168, revenue: 92300, avgStay: 4.0 },
    { date: '2024-02', department: '外科', patientCount: 105, revenue: 135000, avgStay: 5.5 },
    { date: '2024-02', department: '儿科', patientCount: 85, revenue: 48900, avgStay: 3.0 },
    { date: '2024-02', department: '妇产科', patientCount: 125, revenue: 105000, avgStay: 4.3 }
  ],

  // 科室绩效数据
  departmentPerformance: [
    { department: '内科', totalPatients: 324, satisfaction: 92, efficiency: 88, revenue: 181800 },
    { department: '外科', totalPatients: 203, satisfaction: 89, efficiency: 85, revenue: 260000 },
    { department: '儿科', totalPatients: 163, satisfaction: 95, efficiency: 90, revenue: 94500 },
    { department: '妇产科', totalPatients: 237, satisfaction: 91, efficiency: 87, revenue: 203000 }
  ],

  // 设备使用数据
  equipmentUtilization: [
    { equipment: 'CT扫描仪', utilizationRate: 85, maintenanceCost: 25000, examCount: 450 },
    { equipment: 'MRI', utilizationRate: 78, maintenanceCost: 35000, examCount: 280 },
    { equipment: 'X光机', utilizationRate: 92, maintenanceCost: 15000, examCount: 890 },
    { equipment: '超声仪', utilizationRate: 88, maintenanceCost: 18000, examCount: 560 }
  ]
}

// 模拟数据集
export const mockDatasets: DataSet[] = [
  {
    id: 1,
    name: '门诊量统计',
    description: '各科室门诊量统计数据',
    dataSourceId: 1,
    dataSourceName: '医院HIS系统',
    queryType: 'single',
    tableName: 'outpatient_stats',
    status: 'active',
    createTime: '2024-03-20',
    fields: [
      { 
        id: 1,
        datasetId: 1,
        fieldName: 'date',
        displayName: '日期',
        fieldType: 'dimension',
        description: '统计日期',
        isVisible: true,
        sortOrder: 1,
        dataType: 'date'
      },
      {
        id: 2,
        datasetId: 1,
        fieldName: 'department',
        displayName: '科室',
        fieldType: 'dimension',
        description: '科室名称',
        isVisible: true,
        sortOrder: 2,
        dataType: 'string'
      },
      {
        id: 3,
        datasetId: 1,
        fieldName: 'patientCount',
        displayName: '就诊人数',
        fieldType: 'metric',
        description: '门诊就诊人数',
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
        description: '门诊收入(元)',
        isVisible: true,
        sortOrder: 4,
        dataType: 'number',
        aggregation: 'sum'
      }
    ]
  },
  {
    id: 2,
    name: '住院统计',
    description: '住院病人统计数据',
    dataSourceId: 1,
    dataSourceName: '医院HIS系统',
    queryType: 'single',
    tableName: 'inpatient_stats',
    status: 'active',
    createTime: '2024-03-20',
    fields: [
      {
        id: 5,
        datasetId: 2,
        fieldName: 'date',
        displayName: '日期',
        fieldType: 'dimension',
        description: '统计日期',
        isVisible: true,
        sortOrder: 1,
        dataType: 'date'
      },
      {
        id: 6,
        datasetId: 2,
        fieldName: 'ward',
        displayName: '病区',
        fieldType: 'dimension',
        description: '病区名称',
        isVisible: true,
        sortOrder: 2,
        dataType: 'string'
      },
      {
        id: 7,
        datasetId: 2,
        fieldName: 'bedCount',
        displayName: '床位数',
        fieldType: 'metric',
        description: '总床位数',
        isVisible: true,
        sortOrder: 3,
        dataType: 'number'
      },
      {
        id: 8,
        datasetId: 2,
        fieldName: 'occupancyRate',
        displayName: '使用率',
        fieldType: 'metric',
        description: '床位使用率(%)',
        isVisible: true,
        sortOrder: 4,
        dataType: 'number'
      },
      {
        id: 9,
        datasetId: 2,
        fieldName: 'avgStay',
        displayName: '平均住院日',
        fieldType: 'metric',
        description: '平均住院天数',
        isVisible: true,
        sortOrder: 5,
        dataType: 'number',
        aggregation: 'avg'
      }
    ]
  },
  {
    id: 3,
    name: '医疗设备使用情况',
    description: '医疗设备使用统计',
    dataSourceId: 1,
    dataSourceName: '医院HIS系统',
    queryType: 'single',
    tableName: 'equipment_stats',
    status: 'active',
    createTime: '2024-03-20',
    fields: [
      {
        id: 10,
        datasetId: 3,
        fieldName: 'equipment',
        displayName: '设备名称',
        fieldType: 'dimension',
        description: '医疗设备名称',
        isVisible: true,
        sortOrder: 1,
        dataType: 'string'
      },
      {
        id: 11,
        datasetId: 3,
        fieldName: 'utilizationRate',
        displayName: '使用率',
        fieldType: 'metric',
        description: '设备使用率(%)',
        isVisible: true,
        sortOrder: 2,
        dataType: 'number'
      },
      {
        id: 12,
        datasetId: 3,
        fieldName: 'maintenanceCost',
        displayName: '维护成本',
        fieldType: 'metric',
        description: '设备维护成本(元)',
        isVisible: true,
        sortOrder: 3,
        dataType: 'number',
        aggregation: 'sum'
      },
      {
        id: 13,
        datasetId: 3,
        fieldName: 'examCount',
        displayName: '检查次数',
        fieldType: 'metric',
        description: '设备使用次数',
        isVisible: true,
        sortOrder: 4,
        dataType: 'number',
        aggregation: 'sum'
      }
    ]
  }
]

// 模拟图表数据
export const mockChartData = {
  // 门诊量数据
  outpatientData: [
    { department: '内科', date: '2024-01-01', patientCount: 120, revenue: 24000 },
    { department: '外科', date: '2024-01-01', patientCount: 85, revenue: 17000 },
    { department: '儿科', date: '2024-01-01', patientCount: 65, revenue: 13000 },
    { department: '妇产科', date: '2024-01-01', patientCount: 45, revenue: 9000 },
    { department: '内科', date: '2024-01-02', patientCount: 135, revenue: 27000 },
    { department: '外科', date: '2024-01-02', patientCount: 90, revenue: 18000 },
    { department: '儿科', date: '2024-01-02', patientCount: 70, revenue: 14000 },
    { department: '妇产科', date: '2024-01-02', patientCount: 50, revenue: 10000 }
  ],
  
  // 住院统计数据
  inpatientData: [
    { ward: '内科病区', month: '2024-01', bedCount: 100, occupancyRate: 85.5 },
    { ward: '外科病区', month: '2024-01', bedCount: 80, occupancyRate: 78.3 },
    { ward: '儿科病区', month: '2024-01', bedCount: 50, occupancyRate: 65.8 },
    { ward: '妇产病区', month: '2024-01', bedCount: 60, occupancyRate: 72.4 },
    { ward: '内科病区', month: '2024-02', bedCount: 100, occupancyRate: 88.2 },
    { ward: '外科病区', month: '2024-02', bedCount: 80, occupancyRate: 82.1 },
    { ward: '儿科病区', month: '2024-02', bedCount: 50, occupancyRate: 70.5 },
    { ward: '妇产病区', month: '2024-02', bedCount: 60, occupancyRate: 75.8 }
  ]
}

// 字段配置
export const mockFieldConfigs = {
  patientStats: {
    dimensions: ['date', 'department'],
    metrics: ['patientCount', 'revenue', 'avgStay']
  },
  departmentPerformance: {
    dimensions: ['department'],
    metrics: ['totalPatients', 'satisfaction', 'efficiency', 'revenue']
  },
  equipmentUtilization: {
    dimensions: ['equipment'],
    metrics: ['utilizationRate', 'maintenanceCost', 'examCount']
  }
}

// 默认字段映射
export const defaultFieldMappings = {
  bar: {
    xField: 'department',
    yField: 'patientCount'
  },
  line: {
    xField: 'date',
    yField: 'revenue'
  },
  pie: {
    nameField: 'department',
    valueField: 'revenue'
  }
} 