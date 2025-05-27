import { DataSet } from '@/types/dataManagement'

// 模拟数据集列表
export const mockDatasets: DataSet[] = [
  {
    id: 1,
    name: '门诊量统计数据集',
    tableName: 'outpatient_stats',
    datasourceId: 1,
    createTime: '2024-03-15 10:00:00',
    updateTime: '2024-03-15 10:00:00',
    description: '门诊就诊量统计数据',
    fields: [
      {
        fieldName: 'stat_date',
        displayName: '统计日期',
        fieldType: 'dimension',
        dataType: 'date',
        description: '统计日期'
      },
      {
        fieldName: 'dept_name',
        displayName: '科室名称',
        fieldType: 'dimension',
        dataType: 'string',
        description: '就诊科室'
      },
      {
        fieldName: 'visit_count',
        displayName: '就诊人次',
        fieldType: 'metric',
        dataType: 'number',
        description: '日门诊量'
      },
      {
        fieldName: 'first_visit_count',
        displayName: '初诊人次',
        fieldType: 'metric',
        dataType: 'number',
        description: '初诊病人数'
      },
      {
        fieldName: 'repeat_visit_count',
        displayName: '复诊人次',
        fieldType: 'metric',
        dataType: 'number',
        description: '复诊病人数'
      }
    ]
  },
  {
    id: 2,
    name: '住院患者统计数据集',
    tableName: 'inpatient_stats',
    datasourceId: 1,
    createTime: '2024-03-15 10:00:00',
    updateTime: '2024-03-15 10:00:00',
    description: '住院患者统计数据',
    fields: [
      {
        fieldName: 'stat_date',
        displayName: '统计日期',
        fieldType: 'dimension',
        dataType: 'date',
        description: '统计日期'
      },
      {
        fieldName: 'dept_name',
        displayName: '科室名称',
        fieldType: 'dimension',
        dataType: 'string',
        description: '住院科室'
      },
      {
        fieldName: 'bed_count',
        displayName: '床位数',
        fieldType: 'metric',
        dataType: 'number',
        description: '科室床位数'
      },
      {
        fieldName: 'patient_count',
        displayName: '在院人数',
        fieldType: 'metric',
        dataType: 'number',
        description: '当前在院病人数'
      },
      {
        fieldName: 'admission_count',
        displayName: '入院人数',
        fieldType: 'metric',
        dataType: 'number',
        description: '当日入院人数'
      },
      {
        fieldName: 'discharge_count',
        displayName: '出院人数',
        fieldType: 'metric',
        dataType: 'number',
        description: '当日出院人数'
      }
    ]
  },
  {
    id: 3,
    name: '检验结果统计数据集',
    tableName: 'lab_result_stats',
    datasourceId: 4,
    createTime: '2024-03-15 10:00:00',
    updateTime: '2024-03-15 10:00:00',
    description: '检验结果统计数据',
    fields: [
      {
        fieldName: 'stat_date',
        displayName: '统计日期',
        fieldType: 'dimension',
        dataType: 'date',
        description: '统计日期'
      },
      {
        fieldName: 'lab_type',
        displayName: '检验类型',
        fieldType: 'dimension',
        dataType: 'string',
        description: '检验类型'
      },
      {
        fieldName: 'test_count',
        displayName: '检验次数',
        fieldType: 'metric',
        dataType: 'number',
        description: '检验次数'
      },
      {
        fieldName: 'abnormal_count',
        displayName: '异常数',
        fieldType: 'metric',
        dataType: 'number',
        description: '异常结果数'
      },
      {
        fieldName: 'critical_count',
        displayName: '危急值数',
        fieldType: 'metric',
        dataType: 'number',
        description: '危急值结果数'
      }
    ]
  },
  {
    id: 4,
    name: '医生工作量统计数据集',
    tableName: 'doctor_workload_stats',
    datasourceId: 1,
    createTime: '2024-03-15 10:00:00',
    updateTime: '2024-03-15 10:00:00',
    description: '医生工作量统计数据',
    fields: [
      {
        fieldName: 'stat_date',
        displayName: '统计日期',
        fieldType: 'dimension',
        dataType: 'date',
        description: '统计日期'
      },
      {
        fieldName: 'dept_name',
        displayName: '科室名称',
        fieldType: 'dimension',
        dataType: 'string',
        description: '所属科室'
      },
      {
        fieldName: 'doctor_name',
        displayName: '医生姓名',
        fieldType: 'dimension',
        dataType: 'string',
        description: '医生姓名'
      },
      {
        fieldName: 'outpatient_count',
        displayName: '门诊量',
        fieldType: 'metric',
        dataType: 'number',
        description: '门诊接诊量'
      },
      {
        fieldName: 'prescription_count',
        displayName: '处方数',
        fieldType: 'metric',
        dataType: 'number',
        description: '开具处方数'
      },
      {
        fieldName: 'examination_count',
        displayName: '检查数',
        fieldType: 'metric',
        dataType: 'number',
        description: '开具检查数'
      }
    ]
  }
]

// 模拟数据集预览数据
export const mockDatasetPreview = (datasetId: number) => {
  const previewData = {
    1: [ // 门诊量统计
      { stat_date: '2024-03-15', dept_name: '内科', visit_count: 120, first_visit_count: 45, repeat_visit_count: 75 },
      { stat_date: '2024-03-15', dept_name: '外科', visit_count: 85, first_visit_count: 30, repeat_visit_count: 55 },
      { stat_date: '2024-03-15', dept_name: '儿科', visit_count: 95, first_visit_count: 40, repeat_visit_count: 55 }
    ],
    2: [ // 住院患者统计
      { stat_date: '2024-03-15', dept_name: '内科', bed_count: 50, patient_count: 45, admission_count: 5, discharge_count: 3 },
      { stat_date: '2024-03-15', dept_name: '外科', bed_count: 40, patient_count: 35, admission_count: 4, discharge_count: 2 },
      { stat_date: '2024-03-15', dept_name: '儿科', bed_count: 30, patient_count: 25, admission_count: 3, discharge_count: 2 }
    ],
    3: [ // 检验结果统计
      { stat_date: '2024-03-15', lab_type: '血常规', test_count: 150, abnormal_count: 25, critical_count: 3 },
      { stat_date: '2024-03-15', lab_type: '生化全套', test_count: 100, abnormal_count: 15, critical_count: 2 },
      { stat_date: '2024-03-15', lab_type: '凝血功能', test_count: 80, abnormal_count: 10, critical_count: 1 }
    ],
    4: [ // 医生工作量统计
      { stat_date: '2024-03-15', dept_name: '内科', doctor_name: '张医生', outpatient_count: 35, prescription_count: 30, examination_count: 15 },
      { stat_date: '2024-03-15', dept_name: '外科', doctor_name: '李医生', outpatient_count: 28, prescription_count: 25, examination_count: 12 },
      { stat_date: '2024-03-15', dept_name: '儿科', doctor_name: '王医生', outpatient_count: 32, prescription_count: 28, examination_count: 14 }
    ]
  }

  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(previewData[datasetId] || [])
    }, 500)
  })
}

// 模拟数据集查询
export const mockQueryDataset = (datasetId: number, params: any) => {
  return mockDatasetPreview(datasetId)
} 