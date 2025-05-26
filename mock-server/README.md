# 工作流表单设计系统 - Mock API 服务

## 📋 概述

这是一个基于 json-server 的模拟后端服务，专为医疗行业工作流表单设计系统提供完整的 API 接口。该服务模拟了真实的后端数据结构和业务逻辑，便于前端开发和后期 Java 后端实现。

## 🚀 快速开始

### 安装依赖
```bash
cd mock-server
npm install
```

### 启动服务
```bash
# 开发模式（自动重启）
npm run dev

# 生产模式
npm start

# 初始化种子数据
npm run seed
```

服务将运行在 `http://localhost:3002`

## 📊 数据模型设计

### 核心实体关系

```
用户 (users)
├── 表单模板 (form_templates) - 一对多
│   ├── 表单字段 (form_fields) - 一对多
│   │   └── 字段选项 (field_options) - 一对多
│   ├── 表单实例 (form_instances) - 一对多
│   │   └── 表单数据 (form_data) - 一对多
│   └── 工作流 (workflows) - 一对一
│       ├── 工作流节点 (workflow_nodes) - 一对多
│       ├── 工作流连线 (workflow_edges) - 一对多
│       └── 工作流实例 (workflow_instances) - 一对多
│           └── 工作流任务 (workflow_tasks) - 一对多
├── 表单分类 (form_categories) - 多对多
└── 部门 (departments) - 多对一
```

### 数据表结构

#### 1. 用户表 (users)
```sql
CREATE TABLE users (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(50) NOT NULL UNIQUE COMMENT '用户名',
  email VARCHAR(100) NOT NULL UNIQUE COMMENT '邮箱',
  name VARCHAR(50) NOT NULL COMMENT '姓名',
  role ENUM('admin', 'doctor', 'nurse', 'manager') COMMENT '角色',
  department VARCHAR(50) COMMENT '部门',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

#### 2. 表单模板表 (form_templates)
```sql
CREATE TABLE form_templates (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL COMMENT '模板名称',
  description TEXT COMMENT '模板描述',
  category VARCHAR(50) COMMENT '分类',
  version VARCHAR(20) DEFAULT '1.0.0' COMMENT '版本号',
  status ENUM('draft', 'published', 'archived') DEFAULT 'draft' COMMENT '状态',
  created_by BIGINT COMMENT '创建人ID',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  published_at DATETIME COMMENT '发布时间',
  FOREIGN KEY (created_by) REFERENCES users(id)
);
```

#### 3. 表单字段表 (form_fields)
```sql
CREATE TABLE form_fields (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  template_id BIGINT NOT NULL COMMENT '模板ID',
  field_name VARCHAR(50) NOT NULL COMMENT '字段名',
  field_label VARCHAR(100) NOT NULL COMMENT '字段标签',
  field_type ENUM('text', 'textarea', 'number', 'select', 'radio', 'checkbox', 'date', 'datetime', 'time', 'switch', 'upload', 'slider') COMMENT '字段类型',
  data_type ENUM('VARCHAR', 'INT', 'DECIMAL', 'TEXT', 'DATE', 'DATETIME', 'BOOLEAN') COMMENT '数据类型',
  max_length INT COMMENT '最大长度',
  required BOOLEAN DEFAULT FALSE COMMENT '是否必填',
  placeholder VARCHAR(200) COMMENT '占位符',
  default_value TEXT COMMENT '默认值',
  sort_order INT DEFAULT 0 COMMENT '排序',
  validation JSON COMMENT '验证规则',
  props JSON COMMENT '组件属性',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (template_id) REFERENCES form_templates(id) ON DELETE CASCADE
);
```

#### 4. 字段选项表 (field_options)
```sql
CREATE TABLE field_options (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  field_id BIGINT NOT NULL COMMENT '字段ID',
  label VARCHAR(100) NOT NULL COMMENT '选项标签',
  value VARCHAR(100) NOT NULL COMMENT '选项值',
  sort_order INT DEFAULT 0 COMMENT '排序',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (field_id) REFERENCES form_fields(id) ON DELETE CASCADE
);
```

#### 5. 表单实例表 (form_instances)
```sql
CREATE TABLE form_instances (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  template_id BIGINT NOT NULL COMMENT '模板ID',
  instance_name VARCHAR(200) COMMENT '实例名称',
  status ENUM('draft', 'completed', 'cancelled') DEFAULT 'draft' COMMENT '状态',
  submitted_by BIGINT COMMENT '提交人ID',
  submitted_at DATETIME COMMENT '提交时间',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (template_id) REFERENCES form_templates(id),
  FOREIGN KEY (submitted_by) REFERENCES users(id)
);
```

#### 6. 表单数据表 (form_data)
```sql
CREATE TABLE form_data (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  instance_id BIGINT NOT NULL COMMENT '实例ID',
  field_id BIGINT COMMENT '字段ID',
  field_name VARCHAR(50) NOT NULL COMMENT '字段名',
  field_value TEXT COMMENT '字段值',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (instance_id) REFERENCES form_instances(id) ON DELETE CASCADE,
  FOREIGN KEY (field_id) REFERENCES form_fields(id)
);
```

## 🔌 API 接口文档

### 基础 CRUD 接口

所有实体都支持标准的 RESTful 接口：

```
GET    /api/{resource}           # 获取列表
GET    /api/{resource}/:id       # 获取详情
POST   /api/{resource}           # 创建
PUT    /api/{resource}/:id       # 更新
PATCH  /api/{resource}/:id       # 部分更新
DELETE /api/{resource}/:id       # 删除
```

支持的资源：
- `users` - 用户
- `form_templates` - 表单模板
- `form_fields` - 表单字段
- `field_options` - 字段选项
- `form_instances` - 表单实例
- `form_data` - 表单数据
- `workflows` - 工作流
- `workflow_nodes` - 工作流节点
- `workflow_edges` - 工作流连线
- `workflow_instances` - 工作流实例
- `workflow_tasks` - 工作流任务
- `form_categories` - 表单分类
- `departments` - 部门

### 自定义业务接口

#### 1. 获取完整表单模板
```http
GET /api/form-templates/:id/full
```

**响应示例：**
```json
{
  "id": 1,
  "name": "患者入院登记表",
  "description": "患者入院时需要填写的基本信息表单",
  "category": "医疗表单",
  "version": "1.0.0",
  "status": "published",
  "fields": [
    {
      "id": 1,
      "fieldName": "patientName",
      "fieldLabel": "患者姓名",
      "fieldType": "text",
      "dataType": "VARCHAR",
      "required": true,
      "validation": {
        "required": true,
        "message": "患者姓名不能为空"
      },
      "options": []
    }
  ]
}
```

#### 2. 保存表单设计
```http
POST /api/form-templates/design
Content-Type: application/json

{
  "template": {
    "name": "新表单模板",
    "description": "表单描述",
    "category": "医疗表单",
    "status": "draft",
    "createdBy": 1
  },
  "fields": [
    {
      "fieldName": "patientName",
      "fieldLabel": "患者姓名",
      "fieldType": "text",
      "dataType": "VARCHAR",
      "required": true,
      "placeholder": "请输入患者姓名",
      "validation": {
        "required": true,
        "message": "患者姓名不能为空"
      }
    }
  ]
}
```

#### 3. 提交表单实例
```http
POST /api/form-instances
Content-Type: application/json

{
  "templateId": 1,
  "instanceName": "张三入院登记",
  "submittedBy": 2,
  "formData": {
    "patientName": "张三",
    "patientAge": "35",
    "gender": "male",
    "admissionDate": "2024-01-03"
  }
}
```

#### 4. 获取表单实例详情
```http
GET /api/form-instances/:id/full
```

#### 5. 生成 SQL 建表语句
```http
GET /api/form-templates/:id/sql
```

**响应示例：**
```json
{
  "tableName": "form_患者入院登记表",
  "sql": "CREATE TABLE form_患者入院登记表 (\n  id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '主键',\n  patientName VARCHAR(50) NOT NULL  COMMENT '患者姓名',\n  patientAge INT NOT NULL  COMMENT '患者年龄',\n  created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',\n  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间'\n) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='患者入院时需要填写的基本信息表单';",
  "template": {...},
  "fields": [...]
}
```

#### 6. 获取表单统计信息
```http
GET /api/form-templates/:id/statistics
```

### 查询参数支持

支持 json-server 的所有查询功能：

```http
# 分页
GET /api/form_templates?_page=1&_limit=10

# 排序
GET /api/form_templates?_sort=createdAt&_order=desc

# 过滤
GET /api/form_templates?status=published
GET /api/form_templates?category=医疗表单

# 搜索
GET /api/form_templates?q=患者

# 关联查询
GET /api/form_templates?_embed=form_fields
GET /api/form_fields?_expand=template
```

## 🔧 前端集成示例

### 安装 HTTP 客户端
```bash
npm install axios
```

### API 服务封装
```typescript
// src/api/formApi.ts
import axios from 'axios';

const API_BASE_URL = 'http://localhost:3002/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 表单模板相关接口
export const formTemplateApi = {
  // 获取模板列表
  getTemplates: (params?: any) => api.get('/form_templates', { params }),
  
  // 获取完整模板（包含字段）
  getFullTemplate: (id: number) => api.get(`/form-templates/${id}/full`),
  
  // 保存表单设计
  saveDesign: (data: any) => api.post('/form-templates/design', data),
  
  // 生成SQL
  generateSQL: (id: number) => api.get(`/form-templates/${id}/sql`),
  
  // 获取统计信息
  getStatistics: (id: number) => api.get(`/form-templates/${id}/statistics`),
};

// 表单实例相关接口
export const formInstanceApi = {
  // 提交表单
  submit: (data: any) => api.post('/form-instances', data),
  
  // 获取实例详情
  getFullInstance: (id: number) => api.get(`/form-instances/${id}/full`),
  
  // 获取实例列表
  getInstances: (params?: any) => api.get('/form_instances', { params }),
};

// 其他基础接口
export const baseApi = {
  users: {
    list: (params?: any) => api.get('/users', { params }),
    get: (id: number) => api.get(`/users/${id}`),
  },
  categories: {
    list: () => api.get('/form_categories'),
  },
  departments: {
    list: () => api.get('/departments'),
  },
};
```

### Vue 组件使用示例
```vue
<template>
  <div>
    <el-button @click="loadTemplate">加载模板</el-button>
    <el-button @click="saveForm">保存表单</el-button>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { formTemplateApi, formInstanceApi } from '@/api/formApi';

const templateData = ref(null);

// 加载表单模板
const loadTemplate = async () => {
  try {
    const response = await formTemplateApi.getFullTemplate(1);
    templateData.value = response.data;
    console.log('模板数据:', templateData.value);
  } catch (error) {
    console.error('加载模板失败:', error);
  }
};

// 保存表单实例
const saveForm = async () => {
  try {
    const formData = {
      templateId: 1,
      instanceName: '测试表单',
      submittedBy: 1,
      formData: {
        patientName: '测试患者',
        patientAge: '30',
        gender: 'male'
      }
    };
    
    const response = await formInstanceApi.submit(formData);
    console.log('保存成功:', response.data);
  } catch (error) {
    console.error('保存失败:', error);
  }
};
</script>
```

## 🎯 Java 后端实现指南

### 实体类设计

```java
// FormTemplate.java
@Entity
@Table(name = "form_templates")
public class FormTemplate {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false, length = 100)
    private String name;
    
    @Column(columnDefinition = "TEXT")
    private String description;
    
    @Column(length = 50)
    private String category;
    
    @Column(length = 20)
    private String version = "1.0.0";
    
    @Enumerated(EnumType.STRING)
    private TemplateStatus status = TemplateStatus.DRAFT;
    
    @ManyToOne
    @JoinColumn(name = "created_by")
    private User createdBy;
    
    @OneToMany(mappedBy = "template", cascade = CascadeType.ALL)
    private List<FormField> fields = new ArrayList<>();
    
    @CreationTimestamp
    private LocalDateTime createdAt;
    
    @UpdateTimestamp
    private LocalDateTime updatedAt;
    
    private LocalDateTime publishedAt;
    
    // getters and setters...
}

// FormField.java
@Entity
@Table(name = "form_fields")
public class FormField {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne
    @JoinColumn(name = "template_id", nullable = false)
    private FormTemplate template;
    
    @Column(name = "field_name", nullable = false, length = 50)
    private String fieldName;
    
    @Column(name = "field_label", nullable = false, length = 100)
    private String fieldLabel;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "field_type")
    private FieldType fieldType;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "data_type")
    private DataType dataType;
    
    @Column(name = "max_length")
    private Integer maxLength;
    
    @Column(nullable = false)
    private Boolean required = false;
    
    private String placeholder;
    
    @Column(name = "default_value", columnDefinition = "TEXT")
    private String defaultValue;
    
    @Column(name = "sort_order")
    private Integer sortOrder = 0;
    
    @Column(columnDefinition = "JSON")
    private String validation;
    
    @Column(columnDefinition = "JSON")
    private String props;
    
    @OneToMany(mappedBy = "field", cascade = CascadeType.ALL)
    private List<FieldOption> options = new ArrayList<>();
    
    @CreationTimestamp
    private LocalDateTime createdAt;
    
    @UpdateTimestamp
    private LocalDateTime updatedAt;
    
    // getters and setters...
}
```

### 控制器实现

```java
@RestController
@RequestMapping("/api/form-templates")
@CrossOrigin(origins = "*")
public class FormTemplateController {
    
    @Autowired
    private FormTemplateService formTemplateService;
    
    @GetMapping("/{id}/full")
    public ResponseEntity<FormTemplateFullDto> getFullTemplate(@PathVariable Long id) {
        FormTemplateFullDto template = formTemplateService.getFullTemplate(id);
        return ResponseEntity.ok(template);
    }
    
    @PostMapping("/design")
    public ResponseEntity<FormDesignResponse> saveDesign(@RequestBody FormDesignRequest request) {
        FormDesignResponse response = formTemplateService.saveDesign(request);
        return ResponseEntity.ok(response);
    }
    
    @GetMapping("/{id}/sql")
    public ResponseEntity<SqlGenerationResponse> generateSQL(@PathVariable Long id) {
        SqlGenerationResponse response = formTemplateService.generateSQL(id);
        return ResponseEntity.ok(response);
    }
    
    @GetMapping("/{id}/statistics")
    public ResponseEntity<FormStatisticsDto> getStatistics(@PathVariable Long id) {
        FormStatisticsDto statistics = formTemplateService.getStatistics(id);
        return ResponseEntity.ok(statistics);
    }
}
```

## 🔍 测试用例

### 使用 curl 测试接口

```bash
# 1. 获取表单模板列表
curl -X GET "http://localhost:3002/api/form_templates"

# 2. 获取完整表单模板
curl -X GET "http://localhost:3002/api/form-templates/1/full"

# 3. 创建新的表单设计
curl -X POST "http://localhost:3002/api/form-templates/design" \
  -H "Content-Type: application/json" \
  -d '{
    "template": {
      "name": "测试表单",
      "description": "这是一个测试表单",
      "category": "测试分类",
      "createdBy": 1
    },
    "fields": [
      {
        "fieldName": "testField",
        "fieldLabel": "测试字段",
        "fieldType": "text",
        "dataType": "VARCHAR",
        "required": true
      }
    ]
  }'

# 4. 提交表单实例
curl -X POST "http://localhost:3002/api/form-instances" \
  -H "Content-Type: application/json" \
  -d '{
    "templateId": 1,
    "instanceName": "测试实例",
    "submittedBy": 1,
    "formData": {
      "patientName": "测试患者",
      "patientAge": "25"
    }
  }'

# 5. 生成SQL语句
curl -X GET "http://localhost:3002/api/form-templates/1/sql"
```

## 📝 开发注意事项

1. **数据一致性**: Mock 服务使用内存数据库，重启后数据会重置
2. **关联查询**: 使用 `_embed` 和 `_expand` 参数进行关联查询
3. **数据验证**: 前端应该进行完整的数据验证
4. **错误处理**: 所有接口都应该有适当的错误处理
5. **性能考虑**: 大量数据时考虑分页和缓存

## 🚀 部署说明

### Docker 部署
```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3002
CMD ["npm", "start"]
```

### 环境变量
```bash
PORT=3002
NODE_ENV=production
CORS_ORIGIN=http://localhost:3001
```

这个 Mock 服务为您的医疗工作流表单系统提供了完整的后端 API 模拟，可以直接用于前端开发和测试，同时为后期的 Java 后端实现提供了清晰的数据模型和接口规范。 