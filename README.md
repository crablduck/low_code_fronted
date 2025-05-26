# Vue 3 + TypeScript + Vite

This template should help get you started developing with Vue 3 and TypeScript in Vite. The template uses Vue 3 `<script setup>` SFCs, check out the [script setup docs](https://v3.vuejs.org/api/sfc-script-setup.html#sfc-script-setup) to learn more.

Learn more about the recommended Project Setup and IDE Support in the [Vue Docs TypeScript Guide](https://vuejs.org/guide/typescript/overview.html#project-setup).

# 医疗工作流表单设计系统

一个基于 Vue 3 + TypeScript + Element Plus 的医疗行业工作流表单设计系统，包含完整的前后端API模拟服务。

## 🏥 项目特色

- **医疗行业专用**: 针对医疗行业业务场景设计的表单模板和工作流
- **可视化设计**: 拖拽式表单设计器和工作流编排器
- **完整的数据模型**: 包含用户、部门、表单、工作流等完整业务实体
- **Mock API服务**: 基于 json-server 的完整后端API模拟
- **Java后端指南**: 提供详细的Java Spring Boot实现指南

## 🚀 快速开始

### 环境要求
- Node.js >= 16.0.0
- npm >= 8.0.0

### 安装依赖
```bash
# 安装前端依赖
npm install

# 安装Mock服务器依赖
cd mock-server && npm install && cd ..
```

### 启动开发环境
```bash
# 方式1：使用启动脚本（推荐）
chmod +x start-dev.sh
./start-dev.sh

# 方式2：手动启动
# 启动Mock API服务器
cd mock-server && npm start &

# 启动前端开发服务器
npm run dev
```

### 访问地址
- **前端应用**: http://localhost:3000
- **Mock API**: http://localhost:3003
- **API测试页面**: http://localhost:3000/api-test

## 📊 系统架构

### 前端技术栈
- **Vue 3**: 渐进式JavaScript框架
- **TypeScript**: 类型安全的JavaScript超集
- **Element Plus**: Vue 3 UI组件库
- **Vue Router**: 官方路由管理器
- **Pinia**: 状态管理库
- **Vite**: 现代化构建工具

### Mock API服务
- **json-server**: RESTful API模拟服务器
- **Express**: 自定义中间件和路由
- **Moment.js**: 日期时间处理
- **Lodash**: 实用工具库

## 🎯 核心功能

### 1. 表单设计器
- 拖拽式表单字段设计
- 支持多种字段类型（文本、数字、选择、日期等）
- 字段属性配置（验证规则、默认值等）
- 实时预览功能
- 表单模板管理

### 2. 工作流设计器
- 可视化流程节点编排
- 支持多种节点类型（开始、审批、处理、结束）
- 条件分支和并行处理
- 流程实例管理
- 任务分配和跟踪

### 3. API测试中心
- **快速测试**: 一键测试所有预定义接口
- **自定义测试**: 支持自定义HTTP请求
- **测试历史**: 记录所有测试结果和统计信息
- **性能监控**: 接口响应时间分析
- **批量测试**: 支持批量接口测试

### 4. 数据管理
- 表单实例管理
- 数据查询和导出
- 统计分析报表
- 用户权限管理

## 🔌 API接口文档

### Mock API服务地址
- **基础URL**: http://localhost:3003/api
- **文档地址**: http://localhost:3003
- **测试页面**: http://localhost:3000/api-test

### 核心接口

#### 表单模板管理
```http
GET    /api/form_templates              # 获取模板列表
GET    /api/form_templates/:id          # 获取单个模板
POST   /api/form_templates              # 创建模板
PUT    /api/form_templates/:id          # 更新模板
DELETE /api/form_templates/:id          # 删除模板

# 自定义业务接口
GET    /api/form-templates/:id/full     # 获取完整模板（含字段）
POST   /api/form-templates/design       # 保存表单设计
GET    /api/form-templates/:id/sql      # 生成SQL建表语句
GET    /api/form-templates/:id/statistics # 获取统计信息
```

#### 表单实例管理
```http
GET    /api/form_instances              # 获取实例列表
GET    /api/form_instances/:id          # 获取单个实例
POST   /api/form_instances              # 创建实例
PUT    /api/form_instances/:id          # 更新实例
DELETE /api/form_instances/:id          # 删除实例

# 自定义业务接口
GET    /api/form-instances/:id/full     # 获取完整实例（含数据）
```

#### 基础数据管理
```http
GET    /api/users                       # 用户管理
GET    /api/departments                 # 部门管理
GET    /api/form_categories             # 分类管理
GET    /api/form_fields                 # 字段管理
GET    /api/field_options               # 字段选项管理
```

### 查询参数支持
```http
# 分页
?_page=1&_limit=10

# 排序
?_sort=createdAt&_order=desc

# 过滤
?status=published&category=医疗表单

# 搜索
?q=患者

# 关联查询
?_embed=form_fields    # 包含关联数据
?_expand=template      # 展开关联数据
```

## 🧪 API测试

### 自动化测试
```bash
# 运行API测试脚本
./mock-server/test-api.sh
```

### 手动测试
访问 http://localhost:3000/api-test 使用可视化API测试工具

### 测试用例
```bash
# 获取表单模板
curl http://localhost:3003/api/form_templates

# 提交表单实例
curl -X POST http://localhost:3003/api/form-instances \
  -H "Content-Type: application/json" \
  -d '{"templateId": 1, "instanceName": "测试表单", "submittedBy": 1, "formData": {"patientName": "张三"}}'
```

## 📁 项目结构

```
workflow-system/
├── src/                          # 前端源码
│   ├── components/              # Vue组件
│   │   ├── FormDesigner.vue    # 表单设计器
│   │   ├── WorkflowDesigner.vue # 工作流设计器
│   │   └── Layout.vue           # 布局组件
│   ├── views/                   # 页面组件
│   │   ├── ApiTest.vue          # API测试页面
│   │   ├── FormDesign.vue       # 表单设计页面
│   │   └── ...
│   ├── api/                     # API接口封装
│   │   └── formApi.ts           # 表单相关API
│   ├── router/                  # 路由配置
│   ├── stores/                  # 状态管理
│   └── types/                   # TypeScript类型定义
├── mock-server/                 # Mock API服务
│   ├── server.js                # 服务器主文件
│   ├── db.json                  # 数据库文件
│   ├── middleware.js            # 自定义中间件
│   ├── seed.js                  # 数据种子文件
│   ├── test-api.sh              # API测试脚本
│   └── README.md                # Mock服务文档
├── start-dev.sh                 # 开发环境启动脚本
└── README.md                    # 项目文档
```

## 🔧 开发指南

### 前端开发
```bash
# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 类型检查
npm run type-check

# 代码格式化
npm run format
```

### Mock API开发
```bash
# 启动Mock服务器
cd mock-server && npm start

# 开发模式（自动重启）
cd mock-server && npm run dev

# 重新生成测试数据
cd mock-server && npm run seed

# 运行API测试
./mock-server/test-api.sh
```

### 添加新的API接口
1. 在 `mock-server/server.js` 中添加自定义路由
2. 在 `src/api/formApi.ts` 中添加前端接口封装
3. 在 `src/views/ApiTest.vue` 中添加测试用例
4. 更新 `mock-server/test-api.sh` 测试脚本

## 🎨 界面预览

### 主要页面
- **首页**: 系统概览和快速导航
- **表单设计**: 可视化表单设计器
- **工作流设计**: 流程节点编排器
- **API测试**: 接口测试和调试工具
- **数据管理**: 表单实例和数据查看

### 特色功能
- **响应式设计**: 支持桌面和移动端
- **暗色主题**: 支持主题切换
- **国际化**: 支持多语言
- **权限控制**: 基于角色的访问控制

## 🚀 部署指南

### 前端部署
```bash
# 构建生产版本
npm run build

# 部署到静态服务器
# 将 dist/ 目录内容部署到 Web 服务器
```

### Mock API部署
```bash
# 使用 PM2 部署
npm install -g pm2
cd mock-server
pm2 start server.js --name "workflow-mock-api"

# 使用 Docker 部署
docker build -t workflow-mock-api .
docker run -p 3003:3003 workflow-mock-api
```

## 🔄 Java后端迁移

### 数据模型映射
Mock API的数据结构可以直接映射为Java实体类：

```java
// 表单模板实体
@Entity
@Table(name = "form_templates")
public class FormTemplate {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false)
    private String name;
    
    private String description;
    private String category;
    private String version;
    
    @Enumerated(EnumType.STRING)
    private TemplateStatus status;
    
    @OneToMany(mappedBy = "template", cascade = CascadeType.ALL)
    private List<FormField> fields;
    
    // getters and setters...
}
```

### API接口实现
```java
@RestController
@RequestMapping("/api/form-templates")
public class FormTemplateController {
    
    @GetMapping("/{id}/full")
    public ResponseEntity<FormTemplateFullDto> getFullTemplate(@PathVariable Long id) {
        // 实现逻辑
    }
    
    @PostMapping("/design")
    public ResponseEntity<FormDesignResponse> saveDesign(@RequestBody FormDesignRequest request) {
        // 实现逻辑
    }
}
```

### 推荐技术栈
- **Spring Boot 3.x**: 主框架
- **Spring Data JPA**: 数据访问层
- **MySQL/PostgreSQL**: 数据库
- **Redis**: 缓存
- **Spring Security**: 安全框架
- **Swagger/OpenAPI**: API文档

## 🤝 贡献指南

1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 📝 更新日志

### v1.0.0 (2025-05-26)
- ✅ 完成基础表单设计器
- ✅ 实现Mock API服务
- ✅ 添加API测试工具
- ✅ 完善医疗业务模型
- ✅ 提供Java后端实现指南

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 📞 联系方式

- **项目维护者**: 谢佳伟
- **邮箱**: xiejw@hospital.com
- **项目地址**: http://172.16.0.238:3000/xiejw/workflow-system

## 🙏 致谢

感谢以下开源项目的支持：
- [Vue.js](https://vuejs.org/)
- [Element Plus](https://element-plus.org/)
- [json-server](https://github.com/typicode/json-server)
- [TypeScript](https://www.typescriptlang.org/)

---

**🏥 专为医疗行业打造的工作流表单系统，助力医疗信息化建设！**

# 快速表单生成向导

一个基于 Vue3 + Element Plus 的快速表单生成向导组件，帮助医疗行业架构师快速构建前后端项目。

## ✨ 特性

- 🚀 **3步快速创建** - 通过向导式流程，3步完成表单创建
- 🎯 **智能模板** - 内置个人信息、商品信息等常用模板
- 🔧 **自动生成** - 自动生成数据表结构、菜单导航、路由配置
- 💡 **智能建议** - 根据表单名称自动生成路由路径和页面标题
- 🎨 **现代UI** - 基于 Element Plus 的现代化界面设计
- 📱 **响应式** - 支持各种屏幕尺寸的设备

## 🏗️ 架构设计

### 组件结构
```
src/
├── components/
│   └── FormWizard/
│       └── QuickFormWizard.vue     # 主向导组件
├── views/
│   └── FormDesigner/
│       └── index.vue               # 表单设计器主页面
├── types/
│   └── form-wizard.ts              # TypeScript 类型定义
└── README.md                       # 使用说明
```

### 核心流程

#### 步骤一：基本信息配置
- 表单名称（必填）
- 表单说明（可选）
- 数据源选择（接口：`/api/data-sources`）
- 现有数据表选择（接口：`/api/table-list?db=xxx`）

#### 步骤二：字段模板选择
- **个人信息模板**：姓名、性别、出生日期、手机号、邮箱
- **商品信息模板**：商品名称、价格、库存、分类、描述
- **空模板**：从零开始手动创建字段

#### 步骤三：页面生成配置
- 自动生成菜单（默认开启）
- 菜单挂载位置（接口：`/api/menu-list`）
- 路由路径（自动生成，可编辑）
- 页面标题（自动填充，可编辑）

## 🚀 快速开始

### 1. 安装依赖

```bash
npm install vue@^3.0.0 element-plus @element-plus/icons-vue
```

### 2. 引入组件

```vue
<template>
  <div>
    <!-- 触发按钮 -->
    <el-button type="primary" @click="showWizard = true">
      快速创建表单
    </el-button>
    
    <!-- 向导组件 -->
    <QuickFormWizard
      v-model="showWizard"
      @done="handleWizardDone"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import QuickFormWizard from '@/components/FormWizard/QuickFormWizard.vue'

const showWizard = ref(false)

const handleWizardDone = (config) => {
  console.log('表单配置:', config)
  // 处理表单创建完成后的逻辑
}
</script>
```

### 3. 配置API接口

确保以下API接口可用：

```javascript
// 获取数据源列表
GET /api/data-sources
// 响应格式：
{
  "code": 200,
  "data": [
    {
      "id": "mysql_main",
      "name": "主数据库",
      "type": "mysql"
    }
  ]
}

// 获取数据表列表
GET /api/table-list?db={dataSourceId}
// 响应格式：
{
  "code": 200,
  "data": [
    {
      "name": "users",
      "comment": "用户表"
    }
  ]
}

// 获取菜单列表
GET /api/menu-list
// 响应格式：
{
  "code": 200,
  "data": [
    {
      "id": "system",
      "name": "系统管理",
      "path": "/system"
    }
  ]
}
```

## 📋 配置数据结构

### FormConfig 完整配置

```typescript
interface FormConfig {
  basic: {
    name: string              // 表单名称
    description: string       // 表单说明
    dataSource: string        // 数据源ID
    existingTable: string     // 现有表名
  }
  template: {
    selectedTemplate: string  // 选中模板ID
    fields: FieldDefinition[] // 字段列表
  }
  page: {
    autoGenerateMenu: boolean // 自动生成菜单
    parentMenu: string        // 父菜单ID
    routePath: string         // 路由路径
    pageTitle: string         // 页面标题
  }
}
```

### 字段定义结构

```typescript
interface FieldDefinition {
  name: string                // 字段标识
  label: string               // 显示名称
  type: FieldType             // 字段类型
  required: boolean           // 是否必填
  placeholder?: string        // 提示信息
  options?: string[]          // 选项列表
  showInTable?: boolean       // 表格显示
  showInSearch?: boolean      // 搜索条件
}
```

## 🎯 使用场景

### 医疗行业应用

1. **患者信息管理**
   - 使用个人信息模板
   - 添加医保类型、科室等医疗特定字段

2. **药品信息录入**
   - 使用商品信息模板
   - 添加药品编码、规格、厂家等字段

3. **检查报告表单**
   - 使用空模板
   - 自定义检查项目、结果、建议等字段

### 快速原型开发

```javascript
// 向导完成后的处理示例
const handleWizardDone = async (config) => {
  try {
    // 1. 创建数据表
    await createTable(config.basic.dataSource, config.template.fields)
    
    // 2. 生成Vue页面
    await generateVuePage(config)
    
    // 3. 创建菜单项
    if (config.page.autoGenerateMenu) {
      await createMenuItem(config.page)
    }
    
    // 4. 注册路由
    await registerRoute(config.page.routePath)
    
    ElMessage.success('表单创建成功！')
    
    // 5. 跳转到编辑页面
    router.push(`/form-designer/edit?config=${encodeURIComponent(JSON.stringify(config))}`)
    
  } catch (error) {
    ElMessage.error('创建失败：' + error.message)
  }
}
```

## 🔧 自定义扩展

### 添加新的字段模板

```javascript
// 在 QuickFormWizard.vue 中添加新模板
const fieldTemplates = ref([
  // 现有模板...
  {
    id: 'medical',
    name: '医疗信息模板',
    description: '适用于患者信息、病历记录等医疗场景',
    icon: MedicalIcon,
    fields: [
      { name: 'patient_name', label: '患者姓名', type: 'input', required: true },
      { name: 'id_card', label: '身份证号', type: 'input', required: true },
      { name: 'medical_insurance', label: '医保类型', type: 'select', required: false },
      { name: 'department', label: '科室', type: 'select', required: true },
      { name: 'admission_date', label: '入院日期', type: 'date', required: true }
    ]
  }
])
```

### 自定义字段类型

```typescript
// 在 types/form-wizard.ts 中扩展字段类型
export type FieldType = 
  | 'input'
  | 'textarea'
  | 'number'
  | 'select'
  // ... 现有类型
  | 'medical_code'    // 医疗编码输入
  | 'diagnosis'       // 诊断选择
  | 'prescription'    // 处方录入
```

## 🎨 样式自定义

### 主题色彩

```scss
// 自定义主题变量
:root {
  --wizard-primary-color: #409eff;
  --wizard-success-color: #67c23a;
  --wizard-warning-color: #e6a23c;
  --wizard-danger-color: #f56c6c;
}

// 自定义向导样式
.wizard-steps {
  --el-color-primary: var(--wizard-primary-color);
}
```

### 模板卡片样式

```scss
.template-card {
  // 自定义卡片样式
  border-radius: 12px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  
  &:hover {
    transform: translateY(-8px);
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
  }
  
  &.active {
    border-color: var(--wizard-primary-color);
    background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  }
}
```

## 📊 性能优化

### 懒加载优化

```javascript
// 异步加载数据源
const loadDataSources = async () => {
  if (dataSources.value.length > 0) return // 避免重复加载
  
  dataSourceLoading.value = true
  try {
    const response = await fetch('/api/data-sources')
    dataSources.value = await response.json()
  } finally {
    dataSourceLoading.value = false
  }
}
```

### 缓存策略

```javascript
// 使用 sessionStorage 缓存表单配置
const saveFormConfig = (config) => {
  sessionStorage.setItem('form_wizard_config', JSON.stringify(config))
}

const loadFormConfig = () => {
  const saved = sessionStorage.getItem('form_wizard_config')
  return saved ? JSON.parse(saved) : null
}
```

## 🔍 调试技巧

### 开发模式调试

```javascript
// 在开发环境下显示详细配置信息
if (process.env.NODE_ENV === 'development') {
  console.log('表单配置:', JSON.stringify(formConfig, null, 2))
}

// 添加配置验证
const validateConfig = (config) => {
  const errors = []
  
  if (!config.basic.name) errors.push('表单名称不能为空')
  if (!config.basic.dataSource) errors.push('必须选择数据源')
  if (!config.template.selectedTemplate) errors.push('必须选择字段模板')
  
  return errors
}
```

## 🤝 贡献指南

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🙏 致谢

- [Vue.js](https://vuejs.org/) - 渐进式 JavaScript 框架
- [Element Plus](https://element-plus.org/) - 基于 Vue 3 的组件库
- [TypeScript](https://www.typescriptlang.org/) - JavaScript 的超集

---

**快速表单生成向导** - 让表单创建变得简单高效！ 🚀
