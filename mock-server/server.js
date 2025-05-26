const jsonServer = require('json-server');
const { v4: uuidv4 } = require('uuid');
const moment = require('moment');

const server = jsonServer.create();
const router = jsonServer.router('db.json');
const middlewares = jsonServer.defaults();

// 使用默认中间件
server.use(middlewares);

// 使用自定义中间件
server.use(require('./middleware'));

// 解析JSON请求体
server.use(jsonServer.bodyParser);

// 自定义路由

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

// 使用默认路由
server.use('/api', router);

// 启动服务器
const PORT = process.env.PORT || 3003;
server.listen(PORT, () => {
  console.log(`🚀 Mock Server 运行在 http://localhost:${PORT}`);
  console.log(`📊 数据库接口: http://localhost:${PORT}/api`);
  console.log(`📝 表单模板: http://localhost:${PORT}/api/form_templates`);
  console.log(`🔧 自定义接口文档:`);
  console.log(`   GET  /api/form-templates/:id/full - 获取完整表单模板`);
  console.log(`   POST /api/form-templates/design - 保存表单设计`);
  console.log(`   POST /api/form-instances - 提交表单实例`);
  console.log(`   GET  /api/form-instances/:id/full - 获取表单实例详情`);
  console.log(`   GET  /api/form-templates/:id/sql - 生成SQL建表语句`);
  console.log(`   GET  /api/form-templates/:id/statistics - 获取表单统计`);
}); 