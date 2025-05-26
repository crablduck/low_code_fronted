# 低代码工作流系统 - 后端API服务

## 📋 项目说明

这是一个基于Node.js + Express + SQLite的后端API服务，为低代码工作流系统提供数据支持。

## 🚀 快速开始

### 安装依赖
```bash
npm install
```

### 启动服务
```bash
npm start
# 或者
npm run dev
```

服务将在 `http://localhost:3002` 启动

## 📊 API接口文档

### 基础信息
- **服务地址**: http://localhost:3002
- **API前缀**: /api
- **数据格式**: JSON

### 接口列表

#### 1. 健康检查
```
GET /api/health
```

#### 2. 获取菜单列表
```
GET /api/menu-list
```
**响应示例**:
```json
{
  "code": 200,
  "message": "success",
  "data": [
    {
      "id": 1,
      "name": "系统管理",
      "path": "/system",
      "parent_id": null,
      "icon": "Setting",
      "sort_order": 1
    }
  ]
}
```

#### 3. 获取数据源列表
```
GET /api/data-sources
```

#### 4. 获取数据表列表
```
GET /api/table-list?db={dataSourceId}
```

#### 5. 创建菜单
```
POST /api/menus
Content-Type: application/json

{
  "name": "菜单名称",
  "path": "/menu/path",
  "parent_id": 1,
  "icon": "IconName",
  "sort_order": 1
}
```

#### 6. 保存表单配置
```
POST /api/form-configs
Content-Type: application/json

{
  "name": "表单名称",
  "description": "表单描述",
  "data_source_id": "mysql_main",
  "table_name": "users",
  "config_json": {},
  "status": "draft"
}
```

#### 7. 获取表单配置列表
```
GET /api/form-configs
```

## 🗄️ 数据库结构

### 表结构说明

#### menus (菜单表)
- `id`: 主键
- `name`: 菜单名称
- `path`: 菜单路径
- `parent_id`: 父菜单ID
- `icon`: 图标名称
- `sort_order`: 排序
- `is_active`: 是否激活
- `created_at`: 创建时间
- `updated_at`: 更新时间

#### data_sources (数据源表)
- `id`: 数据源ID
- `name`: 数据源名称
- `type`: 数据源类型 (mysql/postgresql/sqlite)
- `host`: 主机地址
- `port`: 端口
- `database_name`: 数据库名
- `username`: 用户名
- `password`: 密码
- `is_active`: 是否激活
- `created_at`: 创建时间

#### table_info (数据表信息表)
- `id`: 主键
- `data_source_id`: 数据源ID
- `table_name`: 表名
- `table_comment`: 表注释
- `created_at`: 创建时间

#### form_configs (表单配置表)
- `id`: 主键
- `name`: 表单名称
- `description`: 表单描述
- `data_source_id`: 数据源ID
- `table_name`: 表名
- `config_json`: 配置JSON
- `status`: 状态 (draft/published)
- `created_at`: 创建时间
- `updated_at`: 更新时间

## 🔧 开发说明

### 技术栈
- **Node.js**: 运行环境
- **Express**: Web框架
- **better-sqlite3**: SQLite数据库驱动
- **cors**: 跨域支持
- **body-parser**: 请求体解析

### 项目结构
```
node_backend/
├── server.js          # 主服务文件
├── database.sqlite     # SQLite数据库文件 (自动生成)
├── package.json        # 项目配置
└── README.md          # 说明文档
```

### 初始数据
服务启动时会自动创建数据库表并插入初始数据：
- 系统管理、业务管理、数据管理、报表管理等菜单
- MySQL、PostgreSQL、SQLite等数据源
- 各数据源下的示例表信息

## 🌐 与前端集成

前端Vue应用需要将API请求地址指向后端服务：

```javascript
// 在前端代码中使用
const API_BASE_URL = 'http://localhost:3002/api'

// 获取菜单列表
fetch(`${API_BASE_URL}/menu-list`)
  .then(response => response.json())
  .then(data => console.log(data))
```

## 📝 注意事项

1. **端口冲突**: 确保3002端口未被占用
2. **CORS**: 已配置允许跨域请求
3. **数据持久化**: SQLite数据库文件会自动创建在项目根目录
4. **错误处理**: 所有接口都包含错误处理和统一的响应格式

## 🔄 更新日志

- v1.0.0: 初始版本，包含基础API接口和数据库结构 