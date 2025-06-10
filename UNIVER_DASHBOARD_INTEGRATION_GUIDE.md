# 🏥 Univer报表和仪表盘集成功能指南

## 📋 概述

本指南详细介绍了 Univer 报表管理和仪表盘保存功能的完整实现，包括前端界面、API接口设计和数据集集成等内容。

## 🎯 功能特性

### 1. Univer 报表管理系统

#### 🚀 核心功能
- **报表列表管理**：支持报表的创建、编辑、删除、复制、导出
- **模板系统**：内置6套医疗行业专业模板
- **分类管理**：按医疗业务分类（患者统计、财务报表、药品管理等）
- **状态管理**：草稿、已发布、已归档三种状态
- **搜索过滤**：支持按名称、分类、状态进行筛选

#### 📊 数据集集成
- **单表查询**：支持简单的单表数据查询
- **多表关联**：支持复杂的多表JOIN查询
- **自定义SQL**：支持完全自定义的SQL查询
- **实时计算**：支持Excel风格的公式计算

### 2. 仪表盘保存功能增强

#### 📈 图表数据源配置
- **数据集绑定**：每个图表可以绑定到特定的数据集
- **查询配置**：根据数据集类型自动适配查询配置
- **参数传递**：支持图表间的参数联动
- **缓存机制**：智能缓存提升查询性能

## 🏗️ 系统架构

### 前端组件结构

```
src/
├── views/
│   ├── UniverReportManager.vue     # 报表管理主页面
│   ├── UniverReportDesigner.vue    # 报表设计器（增强版）
│   └── DashboardDesigner.vue       # 仪表盘设计器（增强版）
├── api/
│   └── report.ts                   # 报表相关API接口
└── router/
    └── index.ts                    # 路由配置
```

### API接口设计

#### Univer 报表接口
- `GET /api/univer-reports` - 获取报表列表
- `GET /api/univer-reports/:id` - 获取报表详情
- `POST /api/univer-reports` - 创建报表
- `PUT /api/univer-reports/:id` - 更新报表
- `PUT /api/univer-reports/:id/data` - 保存报表数据
- `DELETE /api/univer-reports/:id` - 删除报表
- `POST /api/univer-reports/:id/copy` - 复制报表
- `GET /api/univer-reports/:id/export` - 导出报表

#### 数据集查询接口
- `POST /api/datasets/:id/query` - 查询数据集数据
- `POST /api/datasets/:id/preview` - 预览数据集数据

#### 仪表盘接口（增强版）
- `GET /api/dashboards` - 获取仪表盘列表
- `POST /api/dashboards` - 创建仪表盘（含数据源配置）
- `PUT /api/dashboards/:id` - 更新仪表盘
- `POST /api/dashboards/:id/charts/:chartId/data` - 获取图表数据

## 📝 数据结构设计

### 1. Univer 报表数据结构

```typescript
interface UniverReport {
  id: string
  name: string                    // 报表名称
  description?: string            // 报表描述
  category: 'patient' | 'finance' | 'medicine' | 'workload' | 'bed' | 'other'
  status: 'draft' | 'published' | 'archived'
  template: string               // 模板键名
  data: any[][]                  // Univer表格数据
  formulas?: Record<string, string>  // Excel公式
  styles?: Record<string, any>       // 样式配置
  createdAt: string
  updatedAt: string
  createdBy: string
}
```

### 2. 仪表盘图表数据源配置

```typescript
interface ChartDataSource {
  datasetId: number | null       // 数据集ID
  datasetName: string           // 数据集名称
  queryType: 'single' | 'multi' | 'sql'
  
  // 根据 queryType 的不同配置
  queryConfig: {
    // 单表查询配置
    tableName?: string
    dimensions?: string[]
    metrics?: string[]
    filters?: QueryFilter[]
    orderBy?: QuerySort[]
    limit?: number
    
    // 多表查询配置
    mainTable?: string
    joins?: QueryJoin[]
    groupBy?: string[]
    having?: QueryFilter[]
    
    // SQL查询配置
    sql?: string
    parameters?: Record<string, any>
  }
}

interface QueryFilter {
  field: string
  operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'like' | 'between'
  value: any
}

interface QueryJoin {
  table: string
  type: 'INNER' | 'LEFT' | 'RIGHT' | 'FULL'
  condition: string
}
```

### 3. 仪表盘保存数据结构

```typescript
interface DashboardLayout {
  x: number
  y: number
  w: number
  h: number
  i: string
  chartConfig: {
    i: string
    id: string
    type: ChartType
    title: string
    // 基础配置
    xField?: string
    yField?: string
    nameField?: string
    valueField?: string
    showLegend: boolean
    showToolbox: boolean
    dataLimit: number
    
    // 数据源配置
    dataSource: ChartDataSource
  }
}
```

## 🔧 实施步骤

### 阶段一：Univer 报表管理基础功能

1. **创建报表管理页面**
   - ✅ 已完成：`UniverReportManager.vue`
   - ✅ 已完成：报表列表展示、搜索、筛选
   - ✅ 已完成：报表CRUD操作界面

2. **完善报表设计器**
   - ✅ 已完成：`UniverReportDesigner.vue` 增强
   - ✅ 已完成：报表保存和加载功能
   - ✅ 已完成：模板系统集成

3. **API接口开发**
   - ⚠️ 需要后端实现：Univer报表CRUD接口
   - ⚠️ 需要后端实现：数据集查询接口

### 阶段二：数据集集成功能

1. **数据源计算组件集成**
   - ✅ 已完成：CellComputedDialog 组件集成
   - ✅ 已完成：数据集选择和配置界面
   - ⚠️ 需要后端支持：数据集查询API

2. **查询配置界面**
   - ⚠️ 待开发：单表查询配置界面
   - ⚠️ 待开发：多表关联配置界面
   - ⚠️ 待开发：SQL编辑器界面

### 阶段三：仪表盘保存功能增强

1. **图表数据源配置**
   - ✅ 已完成：DashboardDesigner 数据源配置结构
   - ⚠️ 待开发：图表数据源配置界面
   - ⚠️ 待开发：数据集选择组件

2. **数据查询和缓存**
   - ⚠️ 需要后端实现：图表数据查询接口
   - ⚠️ 需要后端实现：查询结果缓存机制

## 📋 后端 API 开发清单

### 🔴 优先级高（必须实现）

#### Univer 报表管理 API

```bash
# 报表CRUD
POST   /api/univer-reports          # 创建报表
GET    /api/univer-reports          # 获取报表列表
GET    /api/univer-reports/:id      # 获取报表详情
PUT    /api/univer-reports/:id      # 更新报表
DELETE /api/univer-reports/:id      # 删除报表

# 报表数据管理
PUT    /api/univer-reports/:id/data # 保存报表数据（Univer表格数据）

# 报表操作
POST   /api/univer-reports/:id/copy # 复制报表
GET    /api/univer-reports/:id/export # 导出报表
```

#### 数据集查询 API

```bash
# 数据集查询（核心功能）
POST   /api/datasets/:id/query     # 查询数据集数据
POST   /api/datasets/:id/preview   # 预览数据集数据（限制5条）
```

#### 仪表盘增强 API

```bash
# 图表数据获取
POST   /api/dashboards/:id/charts/:chartId/data # 获取图表数据
```

### 🟡 优先级中（建议实现）

```bash
# 报表模板
GET    /api/univer-report-templates/:key # 获取报表模板

# 报表发布
POST   /api/univer-reports/:id/publish   # 发布报表

# 数据集字段信息
GET    /api/datasets/:id/fields          # 获取数据集字段列表
```

### 🟢 优先级低（后期优化）

```bash
# 报表协作
POST   /api/univer-reports/:id/share     # 分享报表
GET    /api/univer-reports/:id/comments  # 报表评论

# 查询优化
GET    /api/datasets/:id/query-stats     # 查询性能统计
POST   /api/datasets/query-cache-clear   # 清理查询缓存
```

## 📋 Postman 测试集合

已提供两个完整的 Postman 集合文档：

1. **`postman_univer_reports_api.json`** - Univer 报表管理 API
2. **`postman_dashboard_api.json`** - 仪表盘管理 API

### 使用方法

1. 打开 Postman
2. 点击 Import 导入上述 JSON 文件
3. 设置环境变量：
   - `baseUrl`: `http://localhost:6001`
   - `token`: 你的 JWT 认证令牌
4. 开始测试接口

## 🎯 关键实现要点

### 1. 数据集查询配置

不同查询类型需要不同的配置结构：

```typescript
// 单表查询
{
  "queryType": "single",
  "queryConfig": {
    "tableName": "patients",
    "dimensions": ["department"],
    "metrics": ["COUNT(*) as patient_count"],
    "filters": [
      {"field": "created_at", "operator": ">=", "value": "2024-01-01"}
    ],
    "orderBy": [{"field": "patient_count", "direction": "desc"}],
    "limit": 20
  }
}

// 多表关联查询
{
  "queryType": "multi",
  "queryConfig": {
    "mainTable": "patients",
    "joins": [
      {"table": "departments", "type": "LEFT", "condition": "patients.department_id = departments.id"}
    ],
    "dimensions": ["departments.name as department"],
    "metrics": ["COUNT(patients.id) as patient_count"],
    "groupBy": ["departments.name"]
  }
}

// SQL查询
{
  "queryType": "sql",
  "queryConfig": {
    "sql": "SELECT department, COUNT(*) as count FROM patients GROUP BY department",
    "parameters": {}
  }
}
```

### 2. Univer 数据格式

Univer 报表的数据格式为二维数组：

```javascript
[
  ["患者ID", "姓名", "年龄", "科室", "费用"],           // 表头
  ["P001", "张三", 35, "心内科", 1500.50],            // 数据行
  ["P002", "李四", 28, "妇产科", 800.00],             // 数据行
  ["", "", "", "总计:", "=SUM(E2:E3)"]               // 公式行
]
```

### 3. 错误处理

所有 API 接口都应该返回统一的错误格式：

```json
{
  "code": 400,
  "message": "参数错误",
  "data": null,
  "errors": [
    {
      "field": "queryConfig.tableName",
      "message": "表名不能为空"
    }
  ]
}
```

## 🚀 测试和部署

### 开发环境测试

1. **前端启动**：`npm run dev`（端口3000）
2. **后端启动**：确保6001端口后端服务运行
3. **访问地址**：
   - 报表管理：http://localhost:3000/univer-report-manager
   - 报表设计器：http://localhost:3000/univer-report-designer
   - 仪表盘设计器：http://localhost:3000/dashboard/designer

### 功能验证清单

- [ ] Univer 报表列表正常显示
- [ ] 新建报表功能正常
- [ ] 报表数据保存和加载正常
- [ ] 数据集查询接口调用正常
- [ ] 仪表盘图表数据源配置正常
- [ ] 图表数据获取正常
- [ ] 缓存机制工作正常

## 📞 技术支持

如在实施过程中遇到问题，请参考：

1. **前端组件文档**：查看各组件的注释和使用说明
2. **API文档**：参考 Postman 集合中的接口定义
3. **MCP API参考**：使用 `mcp_API__read_project_oas` 工具查看数据集相关接口
4. **日志调试**：查看浏览器控制台和后端日志

---

**更新时间**：2024年1月
**版本**：v1.0.0
**维护者**：医疗行业架构师团队 