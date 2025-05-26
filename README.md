# Vue 3 + TypeScript + Vite

This template should help get you started developing with Vue 3 and TypeScript in Vite. The template uses Vue 3 `<script setup>` SFCs, check out the [script setup docs](https://v3.vuejs.org/api/sfc-script-setup.html#sfc-script-setup) to learn more.

Learn more about the recommended Project Setup and IDE Support in the [Vue Docs TypeScript Guide](https://vuejs.org/guide/typescript/overview.html#project-setup).

# 医疗工作流表单设计系统

一个基于 Vue 3 + TypeScript + Element Plus 的医疗行业工作流表单设计系统，支持可视化表单设计、工作流编排和数据管理。

## 🏥 项目特色

- **医疗行业专用**: 针对医疗行业业务场景设计的表单模板和工作流
- **可视化设计**: 拖拽式表单设计器和工作流编排器
- **完整的数据模型**: 包含用户、部门、表单、工作流等完整业务实体
- **Mock API服务**: 基于 json-server 的完整后端API模拟
- **Java后端指南**: 提供详细的Java Spring Boot实现指南

## 🚀 快速开始

### 环境要求

- Node.js 16+
- npm 或 yarn
- 现代浏览器

### 安装和启动

1. **克隆项目**
```bash
git clone http://172.16.0.238:3000/xiejw/workflow-system.git
cd workflow-system
```

2. **安装依赖**
```bash
# 安装前端依赖
npm install

# 安装Mock服务器依赖
cd mock-server && npm install && cd ..
```

3. **启动开发环境**
```bash
# 方式1: 使用启动脚本（推荐）
chmod +x start-dev.sh
./start-dev.sh

# 方式2: 手动启动
# 终端1: 启动Mock服务器
cd mock-server && npm start

# 终端2: 启动前端服务器
npm run dev
```

4. **访问应用**
- 前端应用: http://localhost:3001
- Mock API: http://localhost:3003
- API测试页面: http://localhost:3001/api-test

## 📊 系统架构

### 前端技术栈
- **Vue 3**: 渐进式JavaScript框架
- **TypeScript**: 类型安全的JavaScript超集
- **Element Plus**: Vue 3 UI组件库
- **Vue Router**: 官方路由管理器
- **Axios**: HTTP客户端库
- **Vite**: 现代化构建工具

### Mock API服务
- **json-server**: RESTful API模拟服务器
- **自定义中间件**: 业务逻辑处理
- **CORS支持**: 跨域请求处理
- **数据持久化**: JSON文件存储

## 🗄️ 数据模型

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

### 预置数据
- **5个用户**: 管理员、医生、护士等不同角色
- **8个部门**: 内科、外科、儿科等医疗科室
- **6个分类**: 医疗表单、设备管理、人事管理等
- **5个表单模板**: 患者入院登记、设备申请、员工入职等
- **27个表单字段**: 包含各种字段类型和验证规则
- **23个字段选项**: 单选、多选等选项数据

## 🔌 API接口

### 基础CRUD接口
所有实体都支持标准的RESTful接口：
```
GET    /api/{resource}           # 获取列表
GET    /api/{resource}/:id       # 获取详情
POST   /api/{resource}           # 创建
PUT    /api/{resource}/:id       # 更新
PATCH  /api/{resource}/:id       # 部分更新
DELETE /api/{resource}/:id       # 删除
```

### 自定义业务接口
```
GET  /api/form-templates/:id/full        # 获取完整表单模板
POST /api/form-templates/design          # 保存表单设计
POST /api/form-instances                 # 提交表单实例
GET  /api/form-instances/:id/full        # 获取表单实例详情
GET  /api/form-templates/:id/sql         # 生成SQL建表语句
GET  /api/form-templates/:id/statistics  # 获取表单统计
```

### 查询功能
```
# 分页
GET /api/form_templates?_page=1&_limit=10

# 排序
GET /api/form_templates?_sort=createdAt&_order=desc

# 过滤
GET /api/form_templates?status=published

# 搜索
GET /api/form_templates?q=患者

# 关联查询
GET /api/form_templates?_embed=form_fields
```

## 🧪 测试

### API测试
```bash
# 运行完整的API测试套件
./mock-server/test-api.sh

# 手动测试单个接口
curl "http://localhost:3003/api/form_templates"
```

### 前端测试
访问 http://localhost:3001/api-test 进行可视化API测试

## 📁 项目结构

```
workflow-system/
├── src/                          # 前端源码
│   ├── api/                      # API接口封装
│   │   └── formApi.ts           # 表单相关API
│   ├── components/              # Vue组件
│   │   ├── FormDesigner.vue     # 表单设计器
│   │   ├── WorkflowDesigner.vue # 工作流设计器
│   │   └── Layout.vue           # 布局组件
│   ├── views/                   # 页面组件
│   │   ├── ApiTest.vue          # API测试页面
│   │   ├── FormDesign.vue       # 表单设计页面
│   │   └── ...                  # 其他页面
│   ├── router/                  # 路由配置
│   └── types/                   # TypeScript类型定义
├── mock-server/                 # Mock API服务
│   ├── server.js               # 服务器主文件
│   ├── db.json                 # 数据库文件
│   ├── seed.js                 # 种子数据生成
│   ├── middleware.js           # 自定义中间件
│   ├── test-api.sh            # API测试脚本
│   └── README.md              # Mock服务器文档
├── start-dev.sh               # 开发环境启动脚本
└── README.md                  # 项目文档
```

## 🎯 Java后端实现

### 技术栈建议
- **Spring Boot 3.x**: 主框架
- **Spring Data JPA**: 数据访问层
- **MySQL 8.x**: 数据库
- **Spring Security**: 安全框架
- **Spring Validation**: 数据验证
- **Swagger/OpenAPI**: API文档

### 实体类示例
```java
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
    
    @Enumerated(EnumType.STRING)
    private TemplateStatus status;
    
    @OneToMany(mappedBy = "template", cascade = CascadeType.ALL)
    private List<FormField> fields = new ArrayList<>();
    
    // getters and setters...
}
```

### 控制器示例
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
}
```

## 🔧 开发指南

### 添加新的表单字段类型
1. 在 `src/types/IFormKit.ts` 中定义字段类型
2. 在 `FormDesigner.vue` 中添加字段组件
3. 在 Mock API 的种子数据中添加示例

### 添加新的API接口
1. 在 `mock-server/server.js` 中添加路由
2. 在 `src/api/formApi.ts` 中添加接口方法
3. 在测试脚本中添加测试用例

### 自定义工作流节点
1. 在 `src/components/nodes/` 中创建节点组件
2. 在 `WorkflowDesigner.vue` 中注册节点类型
3. 在数据模型中定义节点配置

## 📝 部署说明

### 前端部署
```bash
# 构建生产版本
npm run build

# 部署到静态服务器
# dist/ 目录包含所有静态文件
```

### Mock服务器部署
```bash
# 使用PM2部署
npm install -g pm2
cd mock-server
pm2 start server.js --name workflow-mock

# 使用Docker部署
docker build -t workflow-mock .
docker run -p 3003:3003 workflow-mock
```

## 🤝 贡献指南

1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 📞 联系方式

- 项目维护者: 医疗架构师
- 邮箱: architect@hospital.com
- 项目地址: http://172.16.0.238:3000/xiejw/workflow-system

## 🙏 致谢

感谢以下开源项目的支持：
- [Vue.js](https://vuejs.org/)
- [Element Plus](https://element-plus.org/)
- [json-server](https://github.com/typicode/json-server)
- [TypeScript](https://www.typescriptlang.org/)

---

**注意**: 这是一个演示项目，用于展示医疗工作流表单系统的设计思路和技术实现。在生产环境中使用时，请确保符合相关的医疗数据安全和隐私保护法规。
