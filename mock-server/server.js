const jsonServer = require('json-server');
const { v4: uuidv4 } = require('uuid');
const moment = require('moment');
const cors = require('cors');

const server = jsonServer.create();
const router = jsonServer.router('db.json');
const middlewares = jsonServer.defaults();

// 配置 CORS - 允许所有来源访问
server.use(cors({
  origin: 'http://localhost:3000', // 允许前端域名
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// 使用默认中间件
server.use(middlewares);

// 使用自定义中间件
server.use(require('./middleware'));

// 解析JSON请求体
server.use(jsonServer.bodyParser);

// 健康检查端点
server.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 自定义路由

// 数据源相关API
// 1. 获取数据源列表
server.get('/api/data-sources', (req, res) => {
  const dataSources = [
    {
      id: 1,
      name: 'MySQL主库',
      type: 'mysql',
      host: 'localhost',
      port: 3306,
      databaseName: 'medical_system',
      status: 'online'
    },
    {
      id: 2,
      name: 'PostgreSQL数据仓库',
      type: 'postgresql',
      host: 'localhost',
      port: 5432,
      databaseName: 'data_warehouse',
      status: 'online'
    },
    {
      id: 3,
      name: 'SQLite本地库',
      type: 'sqlite',
      databaseName: 'local.db',
      status: 'online'
    }
  ];
  res.json({
    code: 200,
    message: 'success',
    data: dataSources
  });
});

// 2. 获取指定数据源的表列表
server.get('/api/table-list', (req, res) => {
  const { db } = req.query;
  
  let tables = [];
  
  if (db === '1') { // MySQL主库
    tables = [
      {
        name: 'patients',
        comment: '患者信息表',
        columns: [
          { name: 'id', type: 'bigint', comment: '主键', nullable: false },
          { name: 'name', type: 'varchar(100)', comment: '患者姓名', nullable: false },
          { name: 'gender', type: 'varchar(10)', comment: '性别', nullable: true },
          { name: 'age', type: 'int', comment: '年龄', nullable: true },
          { name: 'phone', type: 'varchar(20)', comment: '联系电话', nullable: true },
          { name: 'address', type: 'text', comment: '地址', nullable: true },
          { name: 'created_at', type: 'datetime', comment: '创建时间', nullable: false }
        ]
      },
      {
        name: 'medical_records',
        comment: '病历记录表',
        columns: [
          { name: 'id', type: 'bigint', comment: '主键', nullable: false },
          { name: 'patient_id', type: 'bigint', comment: '患者ID', nullable: false },
          { name: 'diagnosis', type: 'text', comment: '诊断结果', nullable: true },
          { name: 'symptoms', type: 'text', comment: '症状描述', nullable: true },
          { name: 'treatment', type: 'text', comment: '治疗方案', nullable: true },
          { name: 'doctor_id', type: 'bigint', comment: '医生ID', nullable: false },
          { name: 'visit_date', type: 'date', comment: '就诊日期', nullable: false },
          { name: 'created_at', type: 'datetime', comment: '创建时间', nullable: false }
        ]
      },
      {
        name: 'departments',
        comment: '科室表',
        columns: [
          { name: 'id', type: 'bigint', comment: '主键', nullable: false },
          { name: 'name', type: 'varchar(100)', comment: '科室名称', nullable: false },
          { name: 'description', type: 'text', comment: '科室描述', nullable: true },
          { name: 'head_doctor', type: 'varchar(100)', comment: '科室主任', nullable: true },
          { name: 'location', type: 'varchar(200)', comment: '科室位置', nullable: true },
          { name: 'created_at', type: 'datetime', comment: '创建时间', nullable: false }
        ]
      }
    ];
  } else if (db === '2') { // PostgreSQL数据仓库
    tables = [
      {
        name: 'patient_statistics',
        comment: '患者统计表',
        columns: [
          { name: 'id', type: 'bigserial', comment: '主键', nullable: false },
          { name: 'date', type: 'date', comment: '统计日期', nullable: false },
          { name: 'total_patients', type: 'integer', comment: '总患者数', nullable: false },
          { name: 'new_patients', type: 'integer', comment: '新增患者数', nullable: false },
          { name: 'department_id', type: 'bigint', comment: '科室ID', nullable: false }
        ]
      }
    ];
  } else if (db === '3') { // SQLite本地库
    tables = [
      {
        name: 'local_cache',
        comment: '本地缓存表',
        columns: [
          { name: 'id', type: 'integer', comment: '主键', nullable: false },
          { name: 'key', type: 'text', comment: '缓存键', nullable: false },
          { name: 'value', type: 'text', comment: '缓存值', nullable: true },
          { name: 'expires_at', type: 'datetime', comment: '过期时间', nullable: true }
        ]
      }
    ];
  }
  
  res.json(tables);
});

// 3. 根据表结构生成表单字段
server.get('/api/table-fields/:tableName', (req, res) => {
  const { tableName } = req.params;
  const { db } = req.query;
  
  // 模拟根据表结构生成表单字段
  let fields = [];
  
  if (tableName === 'patients') {
    fields = [
      {
        field: 'name',
        label: '患者姓名',
        type: 'text',
        required: true,
        placeholder: '请输入患者姓名'
      },
      {
        field: 'gender',
        label: '性别',
        type: 'radio',
        required: false,
        options: ['男', '女']
      },
      {
        field: 'age',
        label: '年龄',
        type: 'number',
        required: false,
        placeholder: '请输入年龄'
      },
      {
        field: 'phone',
        label: '联系电话',
        type: 'text',
        required: false,
        placeholder: '请输入联系电话'
      },
      {
        field: 'address',
        label: '地址',
        type: 'textarea',
        required: false,
        placeholder: '请输入详细地址'
      }
    ];
  } else if (tableName === 'medical_records') {
    fields = [
      {
        field: 'patient_id',
        label: '患者ID',
        type: 'number',
        required: true,
        placeholder: '请输入患者ID'
      },
      {
        field: 'diagnosis',
        label: '诊断结果',
        type: 'textarea',
        required: false,
        placeholder: '请输入诊断结果'
      },
      {
        field: 'symptoms',
        label: '症状描述',
        type: 'textarea',
        required: false,
        placeholder: '请描述症状'
      },
      {
        field: 'treatment',
        label: '治疗方案',
        type: 'textarea',
        required: false,
        placeholder: '请输入治疗方案'
      },
      {
        field: 'visit_date',
        label: '就诊日期',
        type: 'date',
        required: true,
        placeholder: '请选择就诊日期'
      }
    ];
  } else if (tableName === 'departments') {
    fields = [
      {
        field: 'name',
        label: '科室名称',
        type: 'text',
        required: true,
        placeholder: '请输入科室名称'
      },
      {
        field: 'description',
        label: '科室描述',
        type: 'textarea',
        required: false,
        placeholder: '请输入科室描述'
      },
      {
        field: 'head_doctor',
        label: '科室主任',
        type: 'text',
        required: false,
        placeholder: '请输入科室主任姓名'
      },
      {
        field: 'location',
        label: '科室位置',
        type: 'text',
        required: false,
        placeholder: '请输入科室位置'
      }
    ];
  }
  
  res.json(fields);
});

// 1. 获取表单模板及其字段（关联查询）
server.get('/api/form-templates/:id/full', (req, res) => {
  const db = router.db;
  const templateId = parseInt(req.params.id);
  
  const template = db.get('form_templates').find({ id: templateId }).value();
  if (!template) {
    return res.status(404).json({ error: '表单模板不存在' });
  }
  
  const fields = db.get('form_fields')
    .filter({ templateId })
    .orderBy(['sortOrder'], ['asc'])
    .value();
  
  // 为每个字段获取选项
  const fieldsWithOptions = fields.map(field => {
    const options = db.get('field_options')
      .filter({ fieldId: field.id })
      .orderBy(['sortOrder'], ['asc'])
      .value();
    return { ...field, options };
  });
  
  res.json({
    ...template,
    fields: fieldsWithOptions
  });
});

// 2. 保存表单设计（创建模板和字段）
server.post('/api/form-templates/design', (req, res) => {
  const db = router.db;
  const { template, fields } = req.body;
  
  try {
    // 创建表单模板
    const newTemplate = {
      id: db.get('form_templates').size().value() + 1,
      ...template,
      createdAt: moment().toISOString(),
      updatedAt: moment().toISOString()
    };
    
    db.get('form_templates').push(newTemplate).write();
    
    // 创建表单字段
    const newFields = fields.map((field, index) => {
      const fieldId = db.get('form_fields').size().value() + index + 1;
      const newField = {
        id: fieldId,
        templateId: newTemplate.id,
        ...field,
        sortOrder: index + 1,
        createdAt: moment().toISOString(),
        updatedAt: moment().toISOString()
      };
      
      // 如果有选项，创建选项记录
      if (field.options && field.options.length > 0) {
        field.options.forEach((option, optionIndex) => {
          const newOption = {
            id: db.get('field_options').size().value() + optionIndex + 1,
            fieldId: fieldId,
            ...option,
            sortOrder: optionIndex + 1,
            createdAt: moment().toISOString()
          };
          db.get('field_options').push(newOption).write();
        });
      }
      
      return newField;
    });
    
    db.get('form_fields').push(...newFields).write();
    
    res.json({
      success: true,
      template: newTemplate,
      fields: newFields
    });
  } catch (error) {
    res.status(500).json({ error: '保存表单设计失败', details: error.message });
  }
});

// 3. 提交表单实例
server.post('/api/form-instances', (req, res) => {
  const db = router.db;
  const { templateId, instanceName, formData, submittedBy } = req.body;
  
  try {
    // 创建表单实例
    const newInstance = {
      id: db.get('form_instances').size().value() + 1,
      templateId,
      instanceName,
      status: 'completed',
      submittedBy,
      submittedAt: moment().toISOString(),
      createdAt: moment().toISOString(),
      updatedAt: moment().toISOString()
    };
    
    db.get('form_instances').push(newInstance).write();
    
    // 保存表单数据
    const formDataRecords = Object.entries(formData).map(([fieldName, fieldValue]) => {
      const field = db.get('form_fields')
        .find({ templateId, fieldName })
        .value();
      
      return {
        id: db.get('form_data').size().value() + Object.keys(formData).indexOf(fieldName) + 1,
        instanceId: newInstance.id,
        fieldId: field ? field.id : null,
        fieldName,
        fieldValue: typeof fieldValue === 'object' ? JSON.stringify(fieldValue) : String(fieldValue),
        createdAt: moment().toISOString()
      };
    });
    
    db.get('form_data').push(...formDataRecords).write();
    
    res.json({
      success: true,
      instance: newInstance,
      data: formDataRecords
    });
  } catch (error) {
    res.status(500).json({ error: '提交表单失败', details: error.message });
  }
});

// 4. 获取表单实例详情（包含数据）
server.get('/api/form-instances/:id/full', (req, res) => {
  const db = router.db;
  const instanceId = parseInt(req.params.id);
  
  const instance = db.get('form_instances').find({ id: instanceId }).value();
  if (!instance) {
    return res.status(404).json({ error: '表单实例不存在' });
  }
  
  const template = db.get('form_templates').find({ id: instance.templateId }).value();
  const formData = db.get('form_data').filter({ instanceId }).value();
  
  // 将数据转换为键值对格式
  const dataMap = {};
  formData.forEach(item => {
    dataMap[item.fieldName] = item.fieldValue;
  });
  
  res.json({
    ...instance,
    template,
    formData: dataMap,
    rawData: formData
  });
});

// 5. 生成SQL建表语句
server.get('/api/form-templates/:id/sql', (req, res) => {
  const db = router.db;
  const templateId = parseInt(req.params.id);
  
  const template = db.get('form_templates').find({ id: templateId }).value();
  if (!template) {
    return res.status(404).json({ error: '表单模板不存在' });
  }
  
  const fields = db.get('form_fields')
    .filter({ templateId })
    .orderBy(['sortOrder'], ['asc'])
    .value();
  
  // 生成建表SQL
  const tableName = `form_${template.name.replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase()}`;
  let sql = `CREATE TABLE ${tableName} (\n`;
  sql += `  id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '主键',\n`;
  
  fields.forEach(field => {
    const columnName = field.fieldName;
    let columnType = '';
    let columnComment = field.fieldLabel || field.fieldName;
    
    switch (field.dataType) {
      case 'VARCHAR':
        columnType = `VARCHAR(${field.maxLength || 255})`;
        break;
      case 'INT':
        columnType = 'INT';
        break;
      case 'DECIMAL':
        columnType = 'DECIMAL(10,2)';
        break;
      case 'TEXT':
        columnType = 'TEXT';
        break;
      case 'DATE':
        columnType = 'DATE';
        break;
      case 'DATETIME':
        columnType = 'DATETIME';
        break;
      case 'BOOLEAN':
        columnType = 'TINYINT(1)';
        break;
      default:
        columnType = 'VARCHAR(255)';
    }
    
    const nullable = field.required ? 'NOT NULL' : 'NULL';
    const defaultValue = field.defaultValue ? `DEFAULT '${field.defaultValue}'` : '';
    
    sql += `  ${columnName} ${columnType} ${nullable} ${defaultValue} COMMENT '${columnComment}',\n`;
  });
  
  sql += `  created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',\n`;
  sql += `  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间'\n`;
  sql += `) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='${template.description || template.name}';`;
  
  res.json({
    tableName,
    sql,
    template,
    fields
  });
});

// 6. 获取表单统计信息
server.get('/api/form-templates/:id/statistics', (req, res) => {
  const db = router.db;
  const templateId = parseInt(req.params.id);
  
  const template = db.get('form_templates').find({ id: templateId }).value();
  if (!template) {
    return res.status(404).json({ error: '表单模板不存在' });
  }
  
  const instances = db.get('form_instances').filter({ templateId }).value();
  const totalSubmissions = instances.length;
  const completedSubmissions = instances.filter(i => i.status === 'completed').length;
  
  // 按日期统计提交量
  const submissionsByDate = {};
  instances.forEach(instance => {
    const date = moment(instance.submittedAt).format('YYYY-MM-DD');
    submissionsByDate[date] = (submissionsByDate[date] || 0) + 1;
  });
  
  res.json({
    template,
    statistics: {
      totalSubmissions,
      completedSubmissions,
      submissionsByDate,
      lastSubmissionAt: instances.length > 0 ? 
        moment.max(instances.map(i => moment(i.submittedAt))).toISOString() : null
    }
  });
});

// 数据集预览接口
server.get('/api/datasets/:id/preview', (req, res) => {
  res.json({
    code: 200,
    message: 'success',
    data: {
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
        }
      ],
      totalCount: 5
    }
  });
});

// 使用默认路由
server.use('/api', router);

// 启动服务器
const PORT = 4500;
server.listen(PORT, () => {
  console.log(`Mock Server is running at http://localhost:${PORT}`);
  console.log(`📊 数据库接口: http://localhost:${PORT}/api`);
  console.log(`📝 表单模板: http://localhost:${PORT}/api/form_templates`);
  console.log(`🔧 自定义接口文档:`);
  console.log(`   GET  /api/form-templates/:id/full - 获取完整表单模板`);
  console.log(`   POST /api/form-templates/design - 保存表单设计`);
  console.log(`   POST /api/form-instances - 提交表单实例`);
  console.log(`   GET  /api/form-instances/:id/full - 获取表单实例详情`);
  console.log(`   GET  /api/form-templates/:id/sql - 生成SQL建表语句`);
  console.log(`   GET  /api/form-templates/:id/statistics - 获取表单统计`);
  console.log(`   GET  /api/datasets/:id/preview - 获取数据集预览`);
}); 