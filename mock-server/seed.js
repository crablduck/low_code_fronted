const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const moment = require('moment');

// 生成种子数据
function generateSeedData() {
  const data = {
    users: [],
    form_templates: [],
    form_fields: [],
    field_options: [],
    form_instances: [],
    form_data: [],
    workflows: [],
    workflow_nodes: [],
    workflow_edges: [],
    workflow_instances: [],
    workflow_tasks: [],
    form_categories: [],
    departments: []
  };

  // 生成用户数据
  const users = [
    { username: 'admin', email: 'admin@hospital.com', name: '系统管理员', role: 'admin', department: '信息科' },
    { username: 'doctor1', email: 'doctor1@hospital.com', name: '张医生', role: 'doctor', department: '内科' },
    { username: 'doctor2', email: 'doctor2@hospital.com', name: '李医生', role: 'doctor', department: '外科' },
    { username: 'nurse1', email: 'nurse1@hospital.com', name: '王护士', role: 'nurse', department: '内科' },
    { username: 'manager1', email: 'manager1@hospital.com', name: '陈主任', role: 'manager', department: '内科' }
  ];

  users.forEach((user, index) => {
    data.users.push({
      id: index + 1,
      ...user,
      createdAt: moment().subtract(30, 'days').toISOString(),
      updatedAt: moment().subtract(30, 'days').toISOString()
    });
  });

  // 生成部门数据
  const departments = [
    { name: '内科', code: 'NK', level: 1 },
    { name: '外科', code: 'WK', level: 1 },
    { name: '儿科', code: 'EK', level: 1 },
    { name: '妇产科', code: 'FCK', level: 1 },
    { name: '急诊科', code: 'JZK', level: 1 },
    { name: '信息科', code: 'XXK', level: 1 },
    { name: '药剂科', code: 'YJK', level: 1 },
    { name: '检验科', code: 'JYK', level: 1 }
  ];

  departments.forEach((dept, index) => {
    data.departments.push({
      id: index + 1,
      ...dept,
      parentId: null,
      createdAt: moment().subtract(30, 'days').toISOString()
    });
  });

  // 生成表单分类
  const categories = [
    { name: '医疗表单', description: '医疗相关的表单模板' },
    { name: '设备管理', description: '设备管理相关表单' },
    { name: '人事管理', description: '人事管理相关表单' },
    { name: '财务管理', description: '财务管理相关表单' },
    { name: '质量管理', description: '质量管理相关表单' },
    { name: '药品管理', description: '药品管理相关表单' }
  ];

  categories.forEach((category, index) => {
    data.form_categories.push({
      id: index + 1,
      ...category,
      parentId: null,
      sortOrder: index + 1,
      createdAt: moment().subtract(30, 'days').toISOString()
    });
  });

  // 生成表单模板
  const templates = [
    {
      name: '患者入院登记表',
      description: '患者入院时需要填写的基本信息表单',
      category: '医疗表单',
      status: 'published',
      createdBy: 1
    },
    {
      name: '医疗设备申请表',
      description: '科室申请医疗设备时使用的表单',
      category: '设备管理',
      status: 'draft',
      createdBy: 1
    },
    {
      name: '员工入职申请表',
      description: '新员工入职时填写的申请表单',
      category: '人事管理',
      status: 'published',
      createdBy: 1
    },
    {
      name: '药品采购申请表',
      description: '药剂科药品采购申请表单',
      category: '药品管理',
      status: 'published',
      createdBy: 1
    },
    {
      name: '医疗质量检查表',
      description: '医疗质量检查评估表单',
      category: '质量管理',
      status: 'draft',
      createdBy: 1
    }
  ];

  templates.forEach((template, index) => {
    data.form_templates.push({
      id: index + 1,
      ...template,
      version: '1.0.0',
      createdAt: moment().subtract(Math.random() * 30, 'days').toISOString(),
      updatedAt: moment().subtract(Math.random() * 30, 'days').toISOString(),
      publishedAt: template.status === 'published' ? moment().subtract(Math.random() * 20, 'days').toISOString() : null
    });
  });

  // 为每个模板生成字段
  const fieldTemplates = {
    1: [ // 患者入院登记表
      { fieldName: 'patientName', fieldLabel: '患者姓名', fieldType: 'text', dataType: 'VARCHAR', required: true, placeholder: '请输入患者姓名' },
      { fieldName: 'patientAge', fieldLabel: '患者年龄', fieldType: 'number', dataType: 'INT', required: true, placeholder: '请输入年龄' },
      { fieldName: 'gender', fieldLabel: '性别', fieldType: 'radio', dataType: 'VARCHAR', required: true },
      { fieldName: 'idCard', fieldLabel: '身份证号', fieldType: 'text', dataType: 'VARCHAR', required: true, placeholder: '请输入身份证号' },
      { fieldName: 'phone', fieldLabel: '联系电话', fieldType: 'text', dataType: 'VARCHAR', required: true, placeholder: '请输入联系电话' },
      { fieldName: 'address', fieldLabel: '家庭住址', fieldType: 'textarea', dataType: 'TEXT', required: false, placeholder: '请输入家庭住址' },
      { fieldName: 'admissionDate', fieldLabel: '入院日期', fieldType: 'date', dataType: 'DATE', required: true },
      { fieldName: 'department', fieldLabel: '入院科室', fieldType: 'select', dataType: 'VARCHAR', required: true },
      { fieldName: 'emergencyContact', fieldLabel: '紧急联系人', fieldType: 'text', dataType: 'VARCHAR', required: true, placeholder: '请输入紧急联系人姓名' },
      { fieldName: 'emergencyPhone', fieldLabel: '紧急联系人电话', fieldType: 'text', dataType: 'VARCHAR', required: true, placeholder: '请输入紧急联系人电话' }
    ],
    2: [ // 医疗设备申请表
      { fieldName: 'equipmentName', fieldLabel: '设备名称', fieldType: 'text', dataType: 'VARCHAR', required: true, placeholder: '请输入设备名称' },
      { fieldName: 'equipmentType', fieldLabel: '设备类型', fieldType: 'select', dataType: 'VARCHAR', required: true },
      { fieldName: 'quantity', fieldLabel: '申请数量', fieldType: 'number', dataType: 'INT', required: true, placeholder: '请输入申请数量' },
      { fieldName: 'budget', fieldLabel: '预算金额', fieldType: 'number', dataType: 'DECIMAL', required: true, placeholder: '请输入预算金额' },
      { fieldName: 'reason', fieldLabel: '申请理由', fieldType: 'textarea', dataType: 'TEXT', required: true, placeholder: '请详细说明申请理由' },
      { fieldName: 'urgency', fieldLabel: '紧急程度', fieldType: 'radio', dataType: 'VARCHAR', required: true },
      { fieldName: 'expectedDate', fieldLabel: '期望到货日期', fieldType: 'date', dataType: 'DATE', required: false }
    ],
    3: [ // 员工入职申请表
      { fieldName: 'employeeName', fieldLabel: '姓名', fieldType: 'text', dataType: 'VARCHAR', required: true, placeholder: '请输入姓名' },
      { fieldName: 'gender', fieldLabel: '性别', fieldType: 'radio', dataType: 'VARCHAR', required: true },
      { fieldName: 'birthDate', fieldLabel: '出生日期', fieldType: 'date', dataType: 'DATE', required: true },
      { fieldName: 'idCard', fieldLabel: '身份证号', fieldType: 'text', dataType: 'VARCHAR', required: true, placeholder: '请输入身份证号' },
      { fieldName: 'phone', fieldLabel: '联系电话', fieldType: 'text', dataType: 'VARCHAR', required: true, placeholder: '请输入联系电话' },
      { fieldName: 'email', fieldLabel: '邮箱地址', fieldType: 'text', dataType: 'VARCHAR', required: true, placeholder: '请输入邮箱地址' },
      { fieldName: 'education', fieldLabel: '学历', fieldType: 'select', dataType: 'VARCHAR', required: true },
      { fieldName: 'major', fieldLabel: '专业', fieldType: 'text', dataType: 'VARCHAR', required: true, placeholder: '请输入专业' },
      { fieldName: 'position', fieldLabel: '应聘职位', fieldType: 'select', dataType: 'VARCHAR', required: true },
      { fieldName: 'expectedSalary', fieldLabel: '期望薪资', fieldType: 'number', dataType: 'DECIMAL', required: false, placeholder: '请输入期望薪资' }
    ]
  };

  let fieldId = 1;
  let optionId = 1;

  Object.entries(fieldTemplates).forEach(([templateId, fields]) => {
    fields.forEach((field, index) => {
      const newField = {
        id: fieldId++,
        templateId: parseInt(templateId),
        ...field,
        maxLength: field.dataType === 'VARCHAR' ? 255 : null,
        defaultValue: '',
        sortOrder: index + 1,
        validation: {
          required: field.required,
          message: field.required ? `${field.fieldLabel}不能为空` : ''
        },
        props: {},
        createdAt: moment().subtract(Math.random() * 25, 'days').toISOString(),
        updatedAt: moment().subtract(Math.random() * 25, 'days').toISOString()
      };

      data.form_fields.push(newField);

      // 为选择类型字段添加选项
      if (field.fieldType === 'radio' || field.fieldType === 'select') {
        let options = [];
        
        if (field.fieldName === 'gender') {
          options = [
            { label: '男', value: 'male' },
            { label: '女', value: 'female' }
          ];
        } else if (field.fieldName === 'department') {
          options = [
            { label: '内科', value: 'internal' },
            { label: '外科', value: 'surgery' },
            { label: '儿科', value: 'pediatrics' },
            { label: '妇产科', value: 'obstetrics' }
          ];
        } else if (field.fieldName === 'equipmentType') {
          options = [
            { label: '诊断设备', value: 'diagnostic' },
            { label: '治疗设备', value: 'treatment' },
            { label: '监护设备', value: 'monitoring' },
            { label: '实验设备', value: 'laboratory' }
          ];
        } else if (field.fieldName === 'urgency') {
          options = [
            { label: '紧急', value: 'urgent' },
            { label: '一般', value: 'normal' },
            { label: '不急', value: 'low' }
          ];
        } else if (field.fieldName === 'education') {
          options = [
            { label: '本科', value: 'bachelor' },
            { label: '硕士', value: 'master' },
            { label: '博士', value: 'doctor' },
            { label: '专科', value: 'college' }
          ];
        } else if (field.fieldName === 'position') {
          options = [
            { label: '医生', value: 'doctor' },
            { label: '护士', value: 'nurse' },
            { label: '技师', value: 'technician' },
            { label: '管理员', value: 'admin' }
          ];
        }

        options.forEach((option, optionIndex) => {
          data.field_options.push({
            id: optionId++,
            fieldId: newField.id,
            ...option,
            sortOrder: optionIndex + 1,
            createdAt: moment().subtract(Math.random() * 25, 'days').toISOString()
          });
        });
      }
    });
  });

  // 生成一些表单实例
  const instances = [
    { templateId: 1, instanceName: '张三入院登记', submittedBy: 2, status: 'completed' },
    { templateId: 1, instanceName: '李四入院登记', submittedBy: 2, status: 'completed' },
    { templateId: 3, instanceName: '王五入职申请', submittedBy: 3, status: 'completed' },
    { templateId: 4, instanceName: '阿司匹林采购申请', submittedBy: 4, status: 'completed' }
  ];

  instances.forEach((instance, index) => {
    const submittedAt = moment().subtract(Math.random() * 15, 'days').toISOString();
    data.form_instances.push({
      id: index + 1,
      ...instance,
      submittedAt,
      createdAt: moment(submittedAt).subtract(1, 'hour').toISOString(),
      updatedAt: submittedAt
    });
  });

  // 为实例生成表单数据
  const instanceData = {
    1: { // 张三入院登记
      patientName: '张三',
      patientAge: '35',
      gender: 'male',
      idCard: '110101198901011234',
      phone: '13800138001',
      address: '北京市朝阳区某某街道',
      admissionDate: '2024-01-03',
      department: 'internal',
      emergencyContact: '张夫人',
      emergencyPhone: '13800138002'
    },
    2: { // 李四入院登记
      patientName: '李四',
      patientAge: '28',
      gender: 'female',
      idCard: '110101199201011234',
      phone: '13800138003',
      address: '北京市海淀区某某小区',
      admissionDate: '2024-01-05',
      department: 'obstetrics',
      emergencyContact: '李先生',
      emergencyPhone: '13800138004'
    }
  };

  let dataId = 1;
  Object.entries(instanceData).forEach(([instanceId, formData]) => {
    Object.entries(formData).forEach(([fieldName, fieldValue]) => {
      const field = data.form_fields.find(f => 
        f.templateId === data.form_instances[parseInt(instanceId) - 1].templateId && 
        f.fieldName === fieldName
      );
      
      data.form_data.push({
        id: dataId++,
        instanceId: parseInt(instanceId),
        fieldId: field ? field.id : null,
        fieldName,
        fieldValue: String(fieldValue),
        createdAt: data.form_instances[parseInt(instanceId) - 1].submittedAt
      });
    });
  });

  return data;
}

// 生成并保存数据
const seedData = generateSeedData();
fs.writeFileSync('db.json', JSON.stringify(seedData, null, 2));

console.log('🌱 种子数据生成完成！');
console.log(`📊 生成统计:`);
console.log(`   用户: ${seedData.users.length} 个`);
console.log(`   部门: ${seedData.departments.length} 个`);
console.log(`   表单分类: ${seedData.form_categories.length} 个`);
console.log(`   表单模板: ${seedData.form_templates.length} 个`);
console.log(`   表单字段: ${seedData.form_fields.length} 个`);
console.log(`   字段选项: ${seedData.field_options.length} 个`);
console.log(`   表单实例: ${seedData.form_instances.length} 个`);
console.log(`   表单数据: ${seedData.form_data.length} 条`);
console.log('');
console.log('💡 现在可以运行 npm start 启动服务器了！'); 