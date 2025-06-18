import type { DataSource, TableInfo, FieldInfo, DataSet, DataPreviewDTO } from '@/shared/types/dataManagement'

// 模拟数据源数据 - 医疗行业场景
export const mockDataSources: DataSource[] = [
  {
    id: 1,
    name: 'MySQL主库',
    type: 'mysql',
    host: '192.168.1.10',
    port: 3306,
    databaseName: 'hospital_main',
    username: 'admin',
    status: 'online',
    createTime: '2024-01-15T10:30:00Z',
    description: '医院主要业务数据库，包含患者、医生、科室等核心数据'
  },
  {
    id: 2,
    name: 'PostgreSQL数据仓库',
    type: 'postgresql',
    host: '192.168.1.20',
    port: 5432,
    databaseName: 'hospital_dw',
    username: 'dw_user',
    status: 'online',
    createTime: '2024-01-20T14:20:00Z',
    description: '医院数据仓库，用于数据分析和报表生成'
  },
  {
    id: 3,
    name: 'HIS系统数据库',
    type: 'oracle',
    host: '192.168.1.30',
    port: 1521,
    databaseName: 'HIS_PROD',
    username: 'his_user',
    status: 'online',
    createTime: '2024-02-01T09:15:00Z',
    description: '医院信息系统(HIS)核心数据库'
  },
  {
    id: 4,
    name: 'PACS影像数据库',
    type: 'mysql',
    host: '192.168.1.40',
    port: 3306,
    databaseName: 'pacs_system',
    username: 'pacs_admin',
    status: 'online',
    createTime: '2024-02-05T11:30:00Z',
    description: '医学影像存档与通信系统数据库'
  },
  {
    id: 5,
    name: 'LIS检验数据库',
    type: 'sqlserver',
    host: '192.168.1.50',
    port: 1433,
    databaseName: 'LIS_DB',
    username: 'lis_user',
    status: 'online',
    createTime: '2024-02-10T16:45:00Z',
    description: '实验室信息系统数据库，存储检验检查数据'
  },
  {
    id: 6,
    name: '备份数据库',
    type: 'mysql',
    host: '192.168.1.60',
    port: 3306,
    databaseName: 'hospital_backup',
    username: 'backup_user',
    status: 'offline',
    createTime: '2024-01-25T08:00:00Z',
    description: '医院数据备份库，用于灾难恢复'
  },
  {
    id: 7,
    name: '财务系统数据库',
    type: 'postgresql',
    host: '192.168.1.70',
    port: 5432,
    databaseName: 'finance_system',
    username: 'finance_user',
    status: 'online',
    createTime: '2024-02-15T13:20:00Z',
    description: '医院财务管理系统数据库'
  },
  {
    id: 8,
    name: '药房管理数据库',
    type: 'mysql',
    host: '192.168.1.80',
    port: 3306,
    databaseName: 'pharmacy_mgmt',
    username: 'pharmacy_admin',
    status: 'online',
    createTime: '2024-02-20T10:15:00Z',
    description: '药房库存和处方管理数据库'
  }
]

// 模拟数据表数据 - 医疗行业场景
export const mockTables: Record<number, TableInfo[]> = {
  1: [ // HIS系统
    {
      name: 'patients',
      description: '患者基本信息表',
      rowCount: 15420,
      createTime: '2024-01-15T10:30:00Z'
    },
    {
      name: 'patient_visits',
      description: '患者就诊记录表',
      rowCount: 45680,
      createTime: '2024-01-15T10:30:00Z'
    },
    {
      name: 'medical_fees',
      description: '医疗费用明细表',
      rowCount: 128340,
      createTime: '2024-01-15T10:30:00Z'
    },
    {
      name: 'doctors',
      description: '医生信息表',
      rowCount: 256,
      createTime: '2024-01-15T10:30:00Z'
    },
    {
      name: 'departments',
      description: '科室信息表',
      rowCount: 45,
      createTime: '2024-01-15T10:30:00Z'
    }
  ],
  2: [ // PACS系统
    {
      name: 'imaging_studies',
      description: '影像检查表',
      rowCount: 23450,
      createTime: '2024-01-15T10:30:00Z'
    },
    {
      name: 'imaging_reports',
      description: '影像报告表',
      rowCount: 23450,
      createTime: '2024-01-15T10:30:00Z'
    }
  ],
  3: [ // LIS系统
    {
      name: 'lab_tests',
      description: '检验项目表',
      rowCount: 89760,
      createTime: '2024-01-15T10:30:00Z'
    },
    {
      name: 'lab_results',
      description: '检验结果表',
      rowCount: 456780,
      createTime: '2024-01-15T10:30:00Z'
    }
  ],
  4: [ // PACS影像数据库
    {
      name: 'imaging_series',
      description: '影像序列表',
      rowCount: 650000,
      createTime: '2024-02-05T11:35:00Z'
    },
    {
      name: 'imaging_instances',
      description: '影像实例表',
      rowCount: 2500000,
      createTime: '2024-02-05T11:40:00Z'
    },
    {
      name: 'radiology_reports',
      description: '放射科报告表',
      rowCount: 175000,
      createTime: '2024-02-05T11:45:00Z'
    }
  ],
  5: [ // LIS检验数据库
    {
      name: 'lab_specimens',
      description: '标本信息表',
      rowCount: 480000,
      createTime: '2024-02-10T16:55:00Z'
    },
    {
      name: 'lab_reports',
      description: '检验报告表',
      rowCount: 440000,
      createTime: '2024-02-10T17:00:00Z'
    }
  ],
  6: [ // 备份数据库
    {
      name: 'backup_patients',
      description: '患者备份表',
      rowCount: 125000,
      createTime: '2024-01-25T08:00:00Z'
    },
    {
      name: 'backup_medical_records',
      description: '病历备份表',
      rowCount: 580000,
      createTime: '2024-01-25T08:15:00Z'
    }
  ],
  7: [ // 财务系统数据库
    {
      name: 'financial_transactions',
      description: '财务交易表',
      rowCount: 850000,
      createTime: '2024-02-15T13:20:00Z'
    },
    {
      name: 'insurance_claims',
      description: '保险理赔表',
      rowCount: 320000,
      createTime: '2024-02-15T13:25:00Z'
    },
    {
      name: 'payment_records',
      description: '支付记录表',
      rowCount: 680000,
      createTime: '2024-02-15T13:30:00Z'
    },
    {
      name: 'cost_centers',
      description: '成本中心表',
      rowCount: 120,
      createTime: '2024-02-15T13:35:00Z'
    }
  ],
  8: [
    {
      name: 'medications',
      description: '药品信息表',
      rowCount: 8500,
      createTime: '2024-02-20T10:15:00Z'
    },
    {
      name: 'inventory',
      description: '库存管理表',
      rowCount: 12000,
      createTime: '2024-02-20T10:20:00Z'
    },
    {
      name: 'dispensing_records',
      description: '发药记录表',
      rowCount: 520000,
      createTime: '2024-02-20T10:25:00Z'
    },
    {
      name: 'drug_interactions',
      description: '药物相互作用表',
      rowCount: 25000,
      createTime: '2024-02-20T10:30:00Z'
    }
  ]
}

// 模拟字段数据 - 医疗行业场景
export const mockFields: Record<string, FieldInfo[]> = {
  // 患者基本信息表
  'patients': [
    {
      name: 'patient_id',
      dataType: 'bigint',
      isPrimary: true,
      isNullable: false,
      description: '患者唯一标识'
    },
    {
      name: 'patient_name',
      dataType: 'varchar(100)',
      isPrimary: false,
      isNullable: false,
      description: '患者姓名'
    },
    {
      name: 'gender',
      dataType: 'varchar(10)',
      isPrimary: false,
      isNullable: true,
      description: '性别'
    },
    {
      name: 'birth_date',
      dataType: 'date',
      isPrimary: false,
      isNullable: true,
      description: '出生日期'
    },
    {
      name: 'phone_number',
      dataType: 'varchar(20)',
      isPrimary: false,
      isNullable: true,
      description: '联系电话'
    },
    {
      name: 'address',
      dataType: 'varchar(200)',
      isPrimary: false,
      isNullable: true,
      description: '家庭住址'
    },
    {
      name: 'create_time',
      dataType: 'datetime',
      isPrimary: false,
      isNullable: false,
      description: '创建时间'
    }
  ],
  
  // 患者就诊记录表
  'patient_visits': [
    {
      name: 'visit_id',
      dataType: 'bigint',
      isPrimary: true,
      isNullable: false,
      description: '就诊记录ID'
    },
    {
      name: 'patient_id',
      dataType: 'bigint',
      isPrimary: false,
      isNullable: false,
      description: '患者ID'
    },
    {
      name: 'doctor_id',
      dataType: 'bigint',
      isPrimary: false,
      isNullable: false,
      description: '医生ID'
    },
    {
      name: 'department_id',
      dataType: 'bigint',
      isPrimary: false,
      isNullable: false,
      description: '科室ID'
    },
    {
      name: 'visit_date',
      dataType: 'datetime',
      isPrimary: false,
      isNullable: false,
      description: '就诊时间'
    },
    {
      name: 'diagnosis',
      dataType: 'text',
      isPrimary: false,
      isNullable: true,
      description: '诊断结果'
    },
    {
      name: 'visit_type',
      dataType: 'varchar(20)',
      isPrimary: false,
      isNullable: false,
      description: '就诊类型'
    },
    {
      name: 'status',
      dataType: 'varchar(20)',
      isPrimary: false,
      isNullable: false,
      description: '就诊状态'
    }
  ],
  
  // 医疗费用明细表
  'medical_fees': [
    {
      name: 'fee_id',
      dataType: 'bigint',
      isPrimary: true,
      isNullable: false,
      description: '费用记录ID'
    },
    {
      name: 'patient_id',
      dataType: 'bigint',
      isPrimary: false,
      isNullable: false,
      description: '患者ID'
    },
    {
      name: 'visit_id',
      dataType: 'bigint',
      isPrimary: false,
      isNullable: false,
      description: '就诊记录ID'
    },
    {
      name: 'fee_type',
      dataType: 'varchar(50)',
      isPrimary: false,
      isNullable: false,
      description: '费用类型'
    },
    {
      name: 'fee_name',
      dataType: 'varchar(100)',
      isPrimary: false,
      isNullable: false,
      description: '费用项目名称'
    },
    {
      name: 'unit_price',
      dataType: 'decimal(10,2)',
      isPrimary: false,
      isNullable: false,
      description: '单价'
    },
    {
      name: 'quantity',
      dataType: 'int',
      isPrimary: false,
      isNullable: false,
      description: '数量'
    },
    {
      name: 'total_amount',
      dataType: 'decimal(10,2)',
      isPrimary: false,
      isNullable: false,
      description: '总金额'
    },
    {
      name: 'fee_date',
      dataType: 'datetime',
      isPrimary: false,
      isNullable: false,
      description: '费用发生时间'
    }
  ],
  
  // 医生信息表
  'doctors': [
    {
      name: 'doctor_id',
      dataType: 'bigint',
      isPrimary: true,
      isNullable: false,
      description: '医生ID'
    },
    {
      name: 'doctor_name',
      dataType: 'varchar(50)',
      isPrimary: false,
      isNullable: false,
      description: '医生姓名'
    },
    {
      name: 'department_id',
      dataType: 'bigint',
      isPrimary: false,
      isNullable: false,
      description: '所属科室ID'
    },
    {
      name: 'title',
      dataType: 'varchar(50)',
      isPrimary: false,
      isNullable: true,
      description: '职称'
    },
    {
      name: 'speciality',
      dataType: 'varchar(100)',
      isPrimary: false,
      isNullable: true,
      description: '专业特长'
    },
    {
      name: 'phone',
      dataType: 'varchar(20)',
      isPrimary: false,
      isNullable: true,
      description: '联系电话'
    }
  ],
  
  // 科室信息表
  'departments': [
    {
      name: 'department_id',
      dataType: 'bigint',
      isPrimary: true,
      isNullable: false,
      description: '科室ID'
    },
    {
      name: 'department_name',
      dataType: 'varchar(50)',
      isPrimary: false,
      isNullable: false,
      description: '科室名称'
    },
    {
      name: 'department_code',
      dataType: 'varchar(20)',
      isPrimary: false,
      isNullable: false,
      description: '科室编码'
    },
    {
      name: 'parent_id',
      dataType: 'bigint',
      isPrimary: false,
      isNullable: true,
      description: '上级科室ID'
    },
    {
      name: 'description',
      dataType: 'text',
      isPrimary: false,
      isNullable: true,
      description: '科室描述'
    }
  ],
  
  // 影像检查表
  'imaging_studies': [
    {
      name: 'study_id',
      dataType: 'bigint',
      isPrimary: true,
      isNullable: false,
      description: '检查ID'
    },
    {
      name: 'patient_id',
      dataType: 'bigint',
      isPrimary: false,
      isNullable: false,
      description: '患者ID'
    },
    {
      name: 'visit_id',
      dataType: 'bigint',
      isPrimary: false,
      isNullable: false,
      description: '就诊记录ID'
    },
    {
      name: 'study_type',
      dataType: 'varchar(50)',
      isPrimary: false,
      isNullable: false,
      description: '检查类型'
    },
    {
      name: 'study_date',
      dataType: 'datetime',
      isPrimary: false,
      isNullable: false,
      description: '检查时间'
    },
    {
      name: 'modality',
      dataType: 'varchar(20)',
      isPrimary: false,
      isNullable: false,
      description: '检查设备类型'
    }
  ],
  
  // 检验项目表
  'lab_tests': [
    {
      name: 'test_id',
      dataType: 'bigint',
      isPrimary: true,
      isNullable: false,
      description: '检验ID'
    },
    {
      name: 'patient_id',
      dataType: 'bigint',
      isPrimary: false,
      isNullable: false,
      description: '患者ID'
    },
    {
      name: 'visit_id',
      dataType: 'bigint',
      isPrimary: false,
      isNullable: false,
      description: '就诊记录ID'
    },
    {
      name: 'test_type',
      dataType: 'varchar(50)',
      isPrimary: false,
      isNullable: false,
      description: '检验类型'
    },
    {
      name: 'test_date',
      dataType: 'datetime',
      isPrimary: false,
      isNullable: false,
      description: '检验时间'
    },
    {
      name: 'sample_type',
      dataType: 'varchar(30)',
      isPrimary: false,
      isNullable: false,
      description: '样本类型'
    }
  ]
}

// 模拟数据集
export const getMockDatasets = (): DataSet[] => [
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
      },
      {
        id: 2,
        datasetId: 1,
        fieldName: 'age',
        fieldType: 'metric',
        displayName: '年龄',
        description: '患者年龄',
        isVisible: true,
        sortOrder: 2,
        tableName: 'patients',
        physicalName: 'age',
        dataType: 'int'
      },
      {
        id: 3,
        datasetId: 1,
        fieldName: 'gender',
        fieldType: 'dimension',
        displayName: '性别',
        description: '患者性别',
        isVisible: true,
        sortOrder: 3,
        tableName: 'patients',
        physicalName: 'gender',
        dataType: 'char'
      },
      {
        id: 4,
        datasetId: 1,
        fieldName: 'phone_number',
        fieldType: 'dimension',
        displayName: '联系电话',
        description: '患者联系电话',
        isVisible: true,
        sortOrder: 4,
        tableName: 'patients',
        physicalName: 'phone_number',
        dataType: 'varchar'
      },
      {
        id: 5,
        datasetId: 1,
        fieldName: 'insurance_type',
        fieldType: 'dimension',
        displayName: '医保类型',
        description: '患者医保类型',
        isVisible: true,
        sortOrder: 5,
        tableName: 'patients',
        physicalName: 'insurance_type',
        dataType: 'varchar'
      }
    ]
  },
  {
    id: 2,
    name: '患者就诊统计数据集',
    description: '患者就诊记录统计，关联患者信息和病历记录',
    dataSourceId: 1,
    dataSourceName: 'MySQL主库',
    queryType: 'multi',
    tables: ['patients', 'medical_records', 'departments'],
    relations: [
      {
        id: 1,
        leftTable: 'patients',
        leftField: 'patient_id',
        rightTable: 'medical_records',
        rightField: 'patient_id',
        joinType: 'INNER'
      },
      {
        id: 2,
        leftTable: 'medical_records',
        leftField: 'department_id',
        rightTable: 'departments',
        rightField: 'department_id',
        joinType: 'LEFT'
      }
    ],
    status: 'active',
    createTime: '2024-01-16T09:15:00Z',
    updateTime: '2024-01-22T16:45:00Z',
    fields: [
      {
        id: 6,
        datasetId: 2,
        fieldName: 'patient_name',
        fieldType: 'dimension',
        displayName: '患者姓名',
        description: '患者姓名',
        isVisible: true,
        sortOrder: 1,
        tableName: 'patients',
        physicalName: 'patient_name',
        dataType: 'varchar'
      },
      {
        id: 7,
        datasetId: 2,
        fieldName: 'department_name',
        fieldType: 'dimension',
        displayName: '就诊科室',
        description: '患者就诊的科室名称',
        isVisible: true,
        sortOrder: 2,
        tableName: 'departments',
        physicalName: 'department_name',
        dataType: 'varchar'
      },
      {
        id: 8,
        datasetId: 2,
        fieldName: 'visit_count',
        fieldType: 'metric',
        displayName: '就诊次数',
        description: '患者总就诊次数',
        isVisible: true,
        sortOrder: 3,
        isCalculated: true,
        expression: 'COUNT(medical_records.record_id)',
        aggregation: 'count'
      },
      {
        id: 9,
        datasetId: 2,
        fieldName: 'visit_date',
        fieldType: 'dimension',
        displayName: '就诊日期',
        description: '最近就诊日期',
        isVisible: true,
        sortOrder: 4,
        tableName: 'medical_records',
        physicalName: 'visit_date',
        dataType: 'datetime'
      },
      {
        id: 10,
        datasetId: 2,
        fieldName: 'avg_age_by_dept',
        fieldType: 'metric',
        displayName: '科室平均年龄',
        description: '各科室患者平均年龄',
        isVisible: true,
        sortOrder: 5,
        isCalculated: true,
        expression: 'AVG(YEAR(CURDATE()) - YEAR(patients.birth_date))',
        aggregation: 'avg'
      }
    ]
  },
  {
    id: 3,
    name: '医生工作量分析数据集',
    description: '医生工作量和绩效数据统计',
    dataSourceId: 1,
    dataSourceName: 'MySQL主库',
    queryType: 'multi',
    tables: ['doctors', 'medical_records', 'departments'],
    relations: [
      {
        id: 3,
        leftTable: 'doctors',
        leftField: 'doctor_id',
        rightTable: 'medical_records',
        rightField: 'doctor_id',
        joinType: 'LEFT'
      },
      {
        id: 4,
        leftTable: 'doctors',
        leftField: 'department_id',
        rightTable: 'departments',
        rightField: 'department_id',
        joinType: 'INNER'
      }
    ],
    status: 'active',
    createTime: '2024-01-18T11:20:00Z',
    updateTime: '2024-01-25T13:30:00Z',
    fields: [
      {
        id: 11,
        datasetId: 3,
        fieldName: 'doctor_name',
        fieldType: 'dimension',
        displayName: '医生姓名',
        description: '医生的真实姓名',
        isVisible: true,
        sortOrder: 1,
        tableName: 'doctors',
        physicalName: 'doctor_name',
        dataType: 'varchar'
      },
      {
        id: 12,
        datasetId: 3,
        fieldName: 'department_name',
        fieldType: 'dimension',
        displayName: '科室名称',
        description: '医生所属科室',
        isVisible: true,
        sortOrder: 2,
        tableName: 'departments',
        physicalName: 'department_name',
        dataType: 'varchar'
      },
      {
        id: 13,
        datasetId: 3,
        fieldName: 'title',
        fieldType: 'dimension',
        displayName: '职称',
        description: '医生职称',
        isVisible: true,
        sortOrder: 3,
        tableName: 'doctors',
        physicalName: 'title',
        dataType: 'varchar'
      },
      {
        id: 14,
        datasetId: 3,
        fieldName: 'patient_count',
        fieldType: 'metric',
        displayName: '接诊患者数',
        description: '医生接诊的患者总数',
        isVisible: true,
        sortOrder: 4,
        isCalculated: true,
        expression: 'COUNT(DISTINCT medical_records.patient_id)',
        aggregation: 'count'
      },
      {
        id: 15,
        datasetId: 3,
        fieldName: 'record_count',
        fieldType: 'metric',
        displayName: '病历记录数',
        description: '医生创建的病历记录总数',
        isVisible: true,
        sortOrder: 5,
        isCalculated: true,
        expression: 'COUNT(medical_records.record_id)',
        aggregation: 'count'
      }
    ]
  },
  {
    id: 4,
    name: '费用统计分析数据集',
    description: '患者费用统计，包含处方费用和检查费用',
    dataSourceId: 1,
    dataSourceName: 'MySQL主库',
    queryType: 'multi',
    tables: ['patients', 'billing', 'prescriptions'],
    relations: [
      {
        id: 5,
        leftTable: 'patients',
        leftField: 'patient_id',
        rightTable: 'billing',
        rightField: 'patient_id',
        joinType: 'INNER'
      },
      {
        id: 6,
        leftTable: 'patients',
        leftField: 'patient_id',
        rightTable: 'prescriptions',
        rightField: 'patient_id',
        joinType: 'LEFT'
      }
    ],
    status: 'active',
    createTime: '2024-01-20T15:30:00Z',
    updateTime: '2024-01-28T10:15:00Z',
    fields: [
      {
        id: 16,
        datasetId: 4,
        fieldName: 'patient_name',
        fieldType: 'dimension',
        displayName: '患者姓名',
        description: '患者姓名',
        isVisible: true,
        sortOrder: 1,
        tableName: 'patients',
        physicalName: 'patient_name',
        dataType: 'varchar'
      },
      {
        id: 17,
        datasetId: 4,
        fieldName: 'insurance_type',
        fieldType: 'dimension',
        displayName: '医保类型',
        description: '患者医保类型',
        isVisible: true,
        sortOrder: 2,
        tableName: 'patients',
        physicalName: 'insurance_type',
        dataType: 'varchar'
      },
      {
        id: 18,
        datasetId: 4,
        fieldName: 'total_amount',
        fieldType: 'metric',
        displayName: '总费用',
        description: '患者总医疗费用',
        isVisible: true,
        sortOrder: 3,
        tableName: 'billing',
        physicalName: 'total_amount',
        dataType: 'decimal',
        aggregation: 'sum'
      },
      {
        id: 19,
        datasetId: 4,
        fieldName: 'self_pay',
        fieldType: 'metric',
        displayName: '自费金额',
        description: '患者自费部分金额',
        isVisible: true,
        sortOrder: 4,
        tableName: 'billing',
        physicalName: 'self_pay',
        dataType: 'decimal',
        aggregation: 'sum'
      },
      {
        id: 20,
        datasetId: 4,
        fieldName: 'prescription_amount',
        fieldType: 'metric',
        displayName: '处方费用',
        description: '患者处方药品费用',
        isVisible: true,
        sortOrder: 5,
        tableName: 'prescriptions',
        physicalName: 'total_amount',
        dataType: 'decimal',
        aggregation: 'sum'
      }
    ]
  },
  {
    id: 5,
    name: '检验数据分析数据集',
    description: '基于LIS系统的检验数据分析',
    dataSourceId: 5,
    dataSourceName: 'LIS检验数据库',
    queryType: 'sql',
    sqlQuery: `
      SELECT 
        lt.test_type,
        COUNT(*) as test_count,
        COUNT(CASE WHEN lr.is_abnormal = 1 THEN 1 END) as abnormal_count,
        AVG(CASE WHEN lr.numeric_value IS NOT NULL THEN lr.numeric_value END) as avg_value,
        DATE_FORMAT(lt.collection_date, '%Y-%m') as test_month
      FROM lab_tests lt
      LEFT JOIN lab_results lr ON lt.test_id = lr.test_id
      WHERE lt.collection_date >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
      GROUP BY lt.test_type, DATE_FORMAT(lt.collection_date, '%Y-%m')
      ORDER BY test_month DESC, test_count DESC
    `,
    status: 'active',
    createTime: '2024-01-25T14:45:00Z',
    updateTime: '2024-02-01T09:20:00Z',
    fields: [
      {
        id: 21,
        datasetId: 5,
        fieldName: 'test_type',
        fieldType: 'dimension',
        displayName: '检验类型',
        description: '检验项目类型',
        isVisible: true,
        sortOrder: 1,
        dataType: 'varchar'
      },
      {
        id: 22,
        datasetId: 5,
        fieldName: 'test_month',
        fieldType: 'dimension',
        displayName: '检验月份',
        description: '检验数据统计月份',
        isVisible: true,
        sortOrder: 2,
        dataType: 'varchar'
      },
      {
        id: 23,
        datasetId: 5,
        fieldName: 'test_count',
        fieldType: 'metric',
        displayName: '检验次数',
        description: '检验项目总次数',
        isVisible: true,
        sortOrder: 3,
        dataType: 'int',
        aggregation: 'sum'
      },
      {
        id: 24,
        datasetId: 5,
        fieldName: 'abnormal_count',
        fieldType: 'metric',
        displayName: '异常次数',
        description: '检验结果异常的次数',
        isVisible: true,
        sortOrder: 4,
        dataType: 'int',
        aggregation: 'sum'
      },
      {
        id: 25,
        datasetId: 5,
        fieldName: 'avg_value',
        fieldType: 'metric',
        displayName: '平均值',
        description: '检验结果平均值',
        isVisible: true,
        sortOrder: 5,
        dataType: 'decimal',
        aggregation: 'avg'
      }
    ]
  },
  {
    id: 6,
    name: '药房库存管理数据集',
    description: '药房库存和处方用药统计分析',
    dataSourceId: 8,
    dataSourceName: '药房管理数据库',
    queryType: 'multi',
    tables: ['medications', 'inventory', 'dispensing_records'],
    relations: [
      {
        id: 7,
        leftTable: 'medications',
        leftField: 'medication_id',
        rightTable: 'inventory',
        rightField: 'medication_id',
        joinType: 'INNER'
      },
      {
        id: 8,
        leftTable: 'medications',
        leftField: 'medication_id',
        rightTable: 'dispensing_records',
        rightField: 'medication_id',
        joinType: 'LEFT'
      }
    ],
    status: 'active',
    createTime: '2024-02-01T16:30:00Z',
    updateTime: '2024-02-05T11:45:00Z',
    fields: [
      {
        id: 26,
        datasetId: 6,
        fieldName: 'medication_name',
        fieldType: 'dimension',
        displayName: '药品名称',
        description: '药品名称',
        isVisible: true,
        sortOrder: 1,
        tableName: 'medications',
        physicalName: 'medication_name',
        dataType: 'varchar'
      },
      {
        id: 27,
        datasetId: 6,
        fieldName: 'category',
        fieldType: 'dimension',
        displayName: '药品分类',
        description: '药品分类',
        isVisible: true,
        sortOrder: 2,
        tableName: 'medications',
        physicalName: 'category',
        dataType: 'varchar'
      },
      {
        id: 28,
        datasetId: 6,
        fieldName: 'current_stock',
        fieldType: 'metric',
        displayName: '当前库存',
        description: '药品当前库存数量',
        isVisible: true,
        sortOrder: 3,
        tableName: 'inventory',
        physicalName: 'current_stock',
        dataType: 'int',
        aggregation: 'sum'
      },
      {
        id: 29,
        datasetId: 6,
        fieldName: 'dispensed_quantity',
        fieldType: 'metric',
        displayName: '发药数量',
        description: '已发药数量',
        isVisible: true,
        sortOrder: 4,
        isCalculated: true,
        expression: 'SUM(dispensing_records.quantity)',
        aggregation: 'sum'
      },
      {
        id: 30,
        datasetId: 6,
        fieldName: 'unit_price',
        fieldType: 'metric',
        displayName: '单价',
        description: '药品单价',
        isVisible: true,
        sortOrder: 5,
        tableName: 'medications',
        physicalName: 'unit_price',
        dataType: 'decimal',
        aggregation: 'avg'
      }
    ]
  },
  {
    id: 7,
    name: '科室绩效综合数据集',
    description: '科室综合绩效分析，包含患者数量、收入、医生工作量等',
    dataSourceId: 2,
    dataSourceName: 'PostgreSQL数据仓库',
    queryType: 'sql',
    sqlQuery: `
      SELECT 
        d.department_name,
        d.department_type,
        COUNT(DISTINCT p.patient_id) as patient_count,
        COUNT(DISTINCT doc.doctor_id) as doctor_count,
        COUNT(mr.record_id) as record_count,
        SUM(b.total_amount) as total_revenue,
        AVG(b.total_amount) as avg_revenue_per_visit,
        DATE_FORMAT(mr.visit_date, '%Y-%m') as stat_month
      FROM department_performance d
      LEFT JOIN patient_statistics p ON d.department_id = p.department_id
      LEFT JOIN revenue_analysis b ON d.department_id = b.department_id
      LEFT JOIN medical_record_stats mr ON d.department_id = mr.department_id
      LEFT JOIN doctor_performance doc ON d.department_id = doc.department_id
      WHERE mr.visit_date >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
      GROUP BY d.department_name, d.department_type, DATE_FORMAT(mr.visit_date, '%Y-%m')
      ORDER BY stat_month DESC, total_revenue DESC
    `,
    status: 'active',
    createTime: '2024-02-03T13:15:00Z',
    updateTime: '2024-02-08T16:30:00Z',
    fields: [
      {
        id: 31,
        datasetId: 7,
        fieldName: 'department_name',
        fieldType: 'dimension',
        displayName: '科室名称',
        description: '科室名称',
        isVisible: true,
        sortOrder: 1,
        dataType: 'varchar'
      },
      {
        id: 32,
        datasetId: 7,
        fieldName: 'department_type',
        fieldType: 'dimension',
        displayName: '科室类型',
        description: '科室类型（临床/医技/行政）',
        isVisible: true,
        sortOrder: 2,
        dataType: 'varchar'
      },
      {
        id: 33,
        datasetId: 7,
        fieldName: 'stat_month',
        fieldType: 'dimension',
        displayName: '统计月份',
        description: '数据统计月份',
        isVisible: true,
        sortOrder: 3,
        dataType: 'varchar'
      },
      {
        id: 34,
        datasetId: 7,
        fieldName: 'patient_count',
        fieldType: 'metric',
        displayName: '患者数量',
        description: '科室接诊患者数量',
        isVisible: true,
        sortOrder: 4,
        dataType: 'int',
        aggregation: 'sum'
      },
      {
        id: 35,
        datasetId: 7,
        fieldName: 'doctor_count',
        fieldType: 'metric',
        displayName: '医生数量',
        description: '科室医生数量',
        isVisible: true,
        sortOrder: 5,
        dataType: 'int',
        aggregation: 'sum'
      },
      {
        id: 36,
        datasetId: 7,
        fieldName: 'total_revenue',
        fieldType: 'metric',
        displayName: '总收入',
        description: '科室总收入',
        isVisible: true,
        sortOrder: 6,
        dataType: 'decimal',
        aggregation: 'sum'
      },
      {
        id: 37,
        datasetId: 7,
        fieldName: 'avg_revenue_per_visit',
        fieldType: 'metric',
        displayName: '平均单次收入',
        description: '平均每次就诊收入',
        isVisible: true,
        sortOrder: 7,
        dataType: 'decimal',
        aggregation: 'avg'
      }
    ]
  }
]

// 模拟数据预览
export const getMockPreviewData = (): DataPreviewDTO => ({
  columns: [
    'patient_name', 'age', 'gender', 'department', 'visit_count', 
    'total_cost', 'visit_date', 'insurance_type', 'phone_number', 'diagnosis'
  ],
  data: [
    {
      patient_name: '张三',
      age: 45,
      gender: '男',
      department: '心内科',
      visit_count: 3,
      total_cost: 2850.50,
      visit_date: '2024-01-15',
      insurance_type: '职工医保',
      phone_number: '138****1234',
      diagnosis: '高血压病'
    },
    {
      patient_name: '李四',
      age: 32,
      gender: '女',
      department: '妇科',
      visit_count: 1,
      total_cost: 1200.00,
      visit_date: '2024-01-16',
      insurance_type: '居民医保',
      phone_number: '139****5678',
      diagnosis: '妇科炎症'
    },
    {
      patient_name: '王五',
      age: 28,
      gender: '男',
      department: '骨科',
      visit_count: 2,
      total_cost: 4680.30,
      visit_date: '2024-01-17',
      insurance_type: '新农合',
      phone_number: '136****9012',
      diagnosis: '腰椎间盘突出'
    },
    {
      patient_name: '赵六',
      age: 55,
      gender: '女',
      department: '内分泌科',
      visit_count: 4,
      total_cost: 3200.75,
      visit_date: '2024-01-18',
      insurance_type: '职工医保',
      phone_number: '137****3456',
      diagnosis: '糖尿病'
    },
    {
      patient_name: '钱七',
      age: 38,
      gender: '男',
      department: '消化科',
      visit_count: 2,
      total_cost: 1890.20,
      visit_date: '2024-01-19',
      insurance_type: '居民医保',
      phone_number: '135****7890',
      diagnosis: '胃炎'
    },
    {
      patient_name: '孙八',
      age: 42,
      gender: '女',
      department: '呼吸科',
      visit_count: 5,
      total_cost: 4500.60,
      visit_date: '2024-01-20',
      insurance_type: '职工医保',
      phone_number: '134****2345',
      diagnosis: '支气管炎'
    },
    {
      patient_name: '周九',
      age: 29,
      gender: '男',
      department: '神经科',
      visit_count: 1,
      total_cost: 2100.00,
      visit_date: '2024-01-21',
      insurance_type: '新农合',
      phone_number: '133****6789',
      diagnosis: '偏头痛'
    },
    {
      patient_name: '吴十',
      age: 51,
      gender: '女',
      department: '肿瘤科',
      visit_count: 3,
      total_cost: 8900.40,
      visit_date: '2024-01-22',
      insurance_type: '职工医保',
      phone_number: '132****0123',
      diagnosis: '乳腺癌'
    },
    {
      patient_name: '郑十一',
      age: 35,
      gender: '男',
      department: '泌尿科',
      visit_count: 2,
      total_cost: 1650.80,
      visit_date: '2024-01-23',
      insurance_type: '居民医保',
      phone_number: '131****4567',
      diagnosis: '前列腺炎'
    },
    {
      patient_name: '王十二',
      age: 47,
      gender: '女',
      department: '眼科',
      visit_count: 6,
      total_cost: 3200.25,
      visit_date: '2024-01-24',
      insurance_type: '职工医保',
      phone_number: '130****8901',
      diagnosis: '白内障'
    },
    {
      patient_name: '刘十三',
      age: 63,
      gender: '男',
      department: '心内科',
      visit_count: 8,
      total_cost: 12500.00,
      visit_date: '2024-01-25',
      insurance_type: '职工医保',
      phone_number: '189****2345',
      diagnosis: '冠心病'
    },
    {
      patient_name: '陈十四',
      age: 26,
      gender: '女',
      department: '皮肤科',
      visit_count: 1,
      total_cost: 580.50,
      visit_date: '2024-01-26',
      insurance_type: '居民医保',
      phone_number: '188****6789',
      diagnosis: '湿疹'
    },
    {
      patient_name: '杨十五',
      age: 58,
      gender: '男',
      department: '肾内科',
      visit_count: 4,
      total_cost: 6800.90,
      visit_date: '2024-01-27',
      insurance_type: '职工医保',
      phone_number: '187****0123',
      diagnosis: '慢性肾炎'
    },
    {
      patient_name: '黄十六',
      age: 33,
      gender: '女',
      department: '产科',
      visit_count: 12,
      total_cost: 8900.75,
      visit_date: '2024-01-28',
      insurance_type: '生育保险',
      phone_number: '186****4567',
      diagnosis: '正常妊娠'
    },
    {
      patient_name: '林十七',
      age: 41,
      gender: '男',
      department: '普外科',
      visit_count: 3,
      total_cost: 15600.20,
      visit_date: '2024-01-29',
      insurance_type: '职工医保',
      phone_number: '185****8901',
      diagnosis: '胆囊结石'
    }
  ],
  totalCount: 15
}) 