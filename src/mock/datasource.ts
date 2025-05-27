import type { DataSource, TableInfo, FieldInfo, DataSet } from '@/types/dataManagement'

// Mock数据源列表
export const mockDataSources: DataSource[] = [
  {
    id: 1,
    name: 'HIS系统数据库',
    type: 'mysql',
    host: '192.168.1.100',
    port: 3306,
    database: 'his_db',
    username: 'his_user',
    status: 'connected',
    description: '医院信息系统主数据库，包含患者、就诊、处方等核心数据',
    createTime: '2024-01-01T08:00:00Z',
    updateTime: '2024-03-15T10:30:00Z'
  },
  {
    id: 2,
    name: 'PACS影像系统',
    type: 'postgresql',
    host: '192.168.1.101',
    port: 5432,
    database: 'pacs_db',
    username: 'pacs_user',
    status: 'connected',
    description: '医学影像存档和通信系统数据库，存储影像检查相关数据',
    createTime: '2024-01-02T09:00:00Z',
    updateTime: '2024-03-16T11:30:00Z'
  },
  {
    id: 3,
    name: 'LIS检验系统',
    type: 'mysql',
    host: '192.168.1.102',
    port: 3306,
    database: 'lis_db',
    username: 'lis_user',
    status: 'connected',
    description: '实验室信息系统数据库，包含各类检验报告和结果数据',
    createTime: '2024-01-03T10:00:00Z',
    updateTime: '2024-03-17T12:30:00Z'
  },
  {
    id: 4,
    name: 'EMR电子病历',
    type: 'oracle',
    host: '192.168.1.103',
    port: 1521,
    database: 'emr_db',
    username: 'emr_user',
    status: 'connected',
    description: '电子病历系统数据库，存储病历文书和临床诊疗记录',
    createTime: '2024-01-04T11:00:00Z',
    updateTime: '2024-03-18T13:30:00Z'
  }
]

// Mock数据表信息
export const mockTables: Record<number, TableInfo[]> = {
  1: [ // HIS系统表
    {
      name: 'patient_info',
      description: '患者基本信息表',
      rowCount: 150000
    },
    {
      name: 'outpatient_visit',
      description: '门诊就诊记录表',
      rowCount: 500000
    },
    {
      name: 'inpatient_visit',
      description: '住院就诊记录表',
      rowCount: 100000
    },
    {
      name: 'prescription',
      description: '处方信息表',
      rowCount: 800000
    },
    {
      name: 'medical_record',
      description: '病历记录表',
      rowCount: 600000
    }
  ],
  2: [ // PACS系统表
    {
      name: 'examination',
      description: '影像检查记录表',
      rowCount: 200000
    },
    {
      name: 'image_data',
      description: '影像数据表',
      rowCount: 400000
    },
    {
      name: 'report',
      description: '影像报告表',
      rowCount: 200000
    }
  ],
  3: [ // LIS系统表
    {
      name: 'lab_order',
      description: '检验申请单',
      rowCount: 300000
    },
    {
      name: 'lab_result',
      description: '检验结果表',
      rowCount: 900000
    },
    {
      name: 'specimen',
      description: '标本信息表',
      rowCount: 300000
    }
  ],
  4: [ // EMR系统表
    {
      name: 'clinical_note',
      description: '临床病历记录',
      rowCount: 400000
    },
    {
      name: 'diagnosis',
      description: '诊断信息表',
      rowCount: 500000
    },
    {
      name: 'treatment_plan',
      description: '治疗计划表',
      rowCount: 200000
    }
  ]
}

// Mock字段信息
export const mockFields: Record<string, FieldInfo[]> = {
  'patient_info': [
    { name: 'patient_id', type: 'varchar', description: '患者ID' },
    { name: 'name', type: 'varchar', description: '患者姓名' },
    { name: 'gender', type: 'varchar', description: '性别' },
    { name: 'birth_date', type: 'date', description: '出生日期' },
    { name: 'id_card', type: 'varchar', description: '身份证号' },
    { name: 'phone', type: 'varchar', description: '联系电话' },
    { name: 'address', type: 'varchar', description: '居住地址' }
  ],
  'outpatient_visit': [
    { name: 'visit_id', type: 'varchar', description: '就诊ID' },
    { name: 'patient_id', type: 'varchar', description: '患者ID' },
    { name: 'visit_date', type: 'datetime', description: '就诊时间' },
    { name: 'department', type: 'varchar', description: '就诊科室' },
    { name: 'doctor', type: 'varchar', description: '接诊医生' },
    { name: 'diagnosis', type: 'varchar', description: '诊断信息' },
    { name: 'visit_fee', type: 'decimal', description: '就诊费用' }
  ]
}

// Mock数据集
export const mockDatasets: DataSet[] = [
  {
    id: 1,
    name: '门诊患者基础数据集',
    description: '包含门诊患者基本信息和就诊记录',
    dataSourceId: 1,
    dataSourceName: 'HIS系统数据库',
    queryType: 'multi',
    tables: ['patient_info', 'outpatient_visit'],
    relations: [
      {
        sourceTable: 'patient_info',
        targetTable: 'outpatient_visit',
        sourceField: 'patient_id',
        targetField: 'patient_id',
        relationType: 'inner'
      }
    ],
    status: 'active',
    createTime: '2024-03-01T08:00:00Z',
    updateTime: '2024-03-15T10:30:00Z',
    fields: [
      {
        name: 'patient_id',
        displayName: '患者ID',
        tableName: 'patient_info',
        type: 'dimension'
      },
      {
        name: 'name',
        displayName: '患者姓名',
        tableName: 'patient_info',
        type: 'dimension'
      },
      {
        name: 'visit_count',
        displayName: '就诊次数',
        tableName: 'outpatient_visit',
        type: 'metric',
        aggregator: 'count'
      },
      {
        name: 'total_fee',
        displayName: '总费用',
        tableName: 'outpatient_visit',
        type: 'metric',
        aggregator: 'sum'
      }
    ]
  },
  {
    id: 2,
    name: '检验结果统计数据集',
    description: '检验科室工作量和结果统计分析',
    dataSourceId: 3,
    dataSourceName: 'LIS检验系统',
    queryType: 'multi',
    tables: ['lab_order', 'lab_result'],
    relations: [
      {
        sourceTable: 'lab_order',
        targetTable: 'lab_result',
        sourceField: 'order_id',
        targetField: 'order_id',
        relationType: 'inner'
      }
    ],
    status: 'active',
    createTime: '2024-03-02T09:00:00Z',
    updateTime: '2024-03-16T11:30:00Z',
    fields: [
      {
        name: 'order_id',
        displayName: '申请单号',
        tableName: 'lab_order',
        type: 'dimension'
      },
      {
        name: 'test_item',
        displayName: '检验项目',
        tableName: 'lab_result',
        type: 'dimension'
      },
      {
        name: 'result_count',
        displayName: '检验次数',
        tableName: 'lab_result',
        type: 'metric',
        aggregator: 'count'
      }
    ]
  },
  {
    id: 3,
    name: '影像检查统计数据集',
    description: '影像科室检查工作量统计',
    dataSourceId: 2,
    dataSourceName: 'PACS影像系统',
    queryType: 'single',
    tableName: 'examination',
    status: 'active',
    createTime: '2024-03-03T10:00:00Z',
    updateTime: '2024-03-17T12:30:00Z',
    fields: [
      {
        name: 'exam_type',
        displayName: '检查类型',
        tableName: 'examination',
        type: 'dimension'
      },
      {
        name: 'exam_count',
        displayName: '检查次数',
        tableName: 'examination',
        type: 'metric',
        aggregator: 'count'
      },
      {
        name: 'exam_fee',
        displayName: '检查费用',
        tableName: 'examination',
        type: 'metric',
        aggregator: 'sum'
      }
    ]
  }
]

// 模拟数据源类型
export const dataSourceTypes = [
  { value: 'mysql', label: 'MySQL' },
  { value: 'postgresql', label: 'PostgreSQL' },
  { value: 'mongodb', label: 'MongoDB' },
  { value: 'oracle', label: 'Oracle' },
  { value: 'sqlserver', label: 'SQL Server' }
]

// 模拟测试连接响应
export const mockTestConnection = (params: any) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      if (params.host && params.port && params.database && params.username) {
        resolve({
          success: true,
          message: '连接成功'
        })
      } else {
        resolve({
          success: false,
          message: '连接失败：请检查连接参数'
        })
      }
    }, 1000)
  })
}

// 模拟获取数据库表列表
export const mockGetTables = (datasourceId: number) => {
  const tables = {
    1: [ // HIS系统
      { name: 'patient_info', comment: '患者基本信息表' },
      { name: 'outpatient_visit', comment: '门诊就诊记录表' },
      { name: 'inpatient_visit', comment: '住院就诊记录表' },
      { name: 'prescription', comment: '处方信息表' },
      { name: 'medical_order', comment: '医嘱信息表' }
    ],
    2: [ // EMR系统
      { name: 'emr_documents', comment: '电子病历文档表' },
      { name: 'emr_templates', comment: '病历模板表' },
      { name: 'medical_records', comment: '病历记录表' }
    ],
    3: [ // PACS系统
      { name: 'image_studies', comment: '影像检查表' },
      { name: 'image_series', comment: '影像序列表' },
      { name: 'image_instances', comment: '影像实例表' }
    ],
    4: [ // LIS系统
      { name: 'lab_tests', comment: '检验申请表' },
      { name: 'lab_results', comment: '检验结果表' },
      { name: 'lab_items', comment: '检验项目表' }
    ]
  }
  
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(tables[datasourceId] || [])
    }, 500)
  })
}

// 模拟获取表结构
export const mockGetTableSchema = (datasourceId: number, tableName: string) => {
  const schemas = {
    'patient_info': [
      { name: 'patient_id', type: 'varchar', length: 32, comment: '患者ID' },
      { name: 'name', type: 'varchar', length: 50, comment: '姓名' },
      { name: 'gender', type: 'varchar', length: 10, comment: '性别' },
      { name: 'birth_date', type: 'date', comment: '出生日期' },
      { name: 'id_card', type: 'varchar', length: 18, comment: '身份证号' },
      { name: 'phone', type: 'varchar', length: 20, comment: '联系电话' }
    ],
    'outpatient_visit': [
      { name: 'visit_id', type: 'varchar', length: 32, comment: '就诊ID' },
      { name: 'patient_id', type: 'varchar', length: 32, comment: '患者ID' },
      { name: 'visit_date', type: 'datetime', comment: '就诊时间' },
      { name: 'dept_name', type: 'varchar', length: 50, comment: '就诊科室' },
      { name: 'doctor_name', type: 'varchar', length: 50, comment: '就诊医生' },
      { name: 'diagnosis', type: 'text', comment: '诊断信息' }
    ]
  }
  
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(schemas[tableName] || [])
    }, 500)
  })
} 