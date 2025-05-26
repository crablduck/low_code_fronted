# 端口配置调整完成

## 端口分配

| 服务 | 端口 | 地址 | 说明 |
|------|------|------|------|
| 前端服务 | 3000 | http://localhost:3000 | Vue.js应用 |
| 后端API | 4000 | http://localhost:4000 | Node.js + Express + SQLite |
| Mock服务 | 5000 | http://localhost:5000 | JSON Server (开发测试用) |

## 修改内容

### 1. 后端服务 (node_backend)
- **文件**: `node_backend/server.js`
- **修改**: 端口从3002改为4000
- **状态**: ✅ 已完成

### 2. Mock服务 (mock-server)
- **文件**: `mock-server/server.js`
- **修改**: 端口从3003改为5000
- **文件**: `mock-server/package.json`
- **修改**: json-server端口从3003改为5000
- **状态**: ✅ 已完成

### 3. 前端API配置
- **文件**: `src/api/request.ts`
- **修改**: baseURL从3002改为4000
- **文件**: `src/api/formApi.ts`
- **修改**: API_BASE_URL从3002改为4000
- **状态**: ✅ 已完成

### 4. 组件API调用
- **文件**: `src/components/FormWizard/QuickFormWizard.vue`
- **修改**: 所有API调用URL改为4000端口
- **文件**: `src/components/Layout.vue`
- **修改**: 菜单API调用URL改为4000端口
- **文件**: `src/views/ApiTest.vue`
- **修改**: 所有API调用URL改为4000端口
- **状态**: ✅ 已完成

### 5. 启动脚本
- **文件**: `start-services.sh`
- **修改**: 后端端口显示改为4000
- **文件**: `start-dev.sh`
- **修改**: Mock服务端口显示改为5000
- **状态**: ✅ 已完成

### 6. 测试脚本
- **文件**: `test-api-connection.sh`
- **修改**: 所有API测试URL改为4000端口
- **文件**: `mock-server/test-api.sh`
- **修改**: Mock API测试URL改为5000端口
- **状态**: ✅ 已完成

## 验证结果

### 后端API服务 (端口: 4000)
```bash
✅ 健康检查: http://localhost:4000/api/health
✅ 菜单列表: http://localhost:4000/api/menu-list (11个菜单)
✅ 数据源列表: http://localhost:4000/api/data-sources (3个数据源)
✅ 表列表: http://localhost:4000/api/table-list (4个表)
```

### 前端服务 (端口: 3000)
```bash
✅ 主页: http://localhost:3000
✅ 表单设计器: http://localhost:3000/form-designer
✅ API测试页面: http://localhost:3000/api-test
```

### Mock服务 (端口: 5000)
```bash
✅ Mock API: http://localhost:5000/api
✅ 表单模板: http://localhost:5000/api/form_templates
✅ 表单实例: http://localhost:5000/api/form_instances
```

## 启动命令

### 启动所有服务
```bash
./start-services.sh
```

### 启动开发环境 (包含Mock服务)
```bash
./start-dev.sh
```

### 单独启动后端API
```bash
cd node_backend
npm start
```

### 单独启动Mock服务
```bash
cd mock-server
npm start
```

### 单独启动前端
```bash
npm run dev
```

## 测试命令

### 测试后端API连接
```bash
./test-api-connection.sh
```

### 测试Mock API连接
```bash
cd mock-server
./test-api.sh
```

### 手动测试
```bash
# 后端API
curl http://localhost:4000/api/health
curl http://localhost:4000/api/menu-list
curl http://localhost:4000/api/data-sources

# Mock API
curl http://localhost:5000/api/form_templates
curl http://localhost:5000/api/form_instances
```

## 端口冲突解决
通过将端口分散到不同的范围，避免了常见的端口冲突：
- 3000: 前端开发服务器 (常用端口)
- 4000: 后端API服务 (避开3000-3999常用范围)
- 5000: Mock服务 (避开4000-4999范围)

## 注意事项
1. 确保防火墙允许这些端口的访问
2. 如果端口被占用，可以通过环境变量修改：
   ```bash
   PORT=4001 npm start  # 后端API
   PORT=5001 npm start  # Mock服务
   ```
3. 前端开发服务器端口可以在vite.config.ts中修改 