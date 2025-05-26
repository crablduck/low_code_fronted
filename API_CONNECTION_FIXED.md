# API连接问题修复完成

## 问题描述
前端尝试访问错误的API端口，导致网络连接错误。

## 修复内容

### 1. 端口配置统一
- ✅ **node_backend**: 端口4000 (http://localhost:4000)
- ✅ **mock-server**: 端口5000 (http://localhost:5000)  
- ✅ **前端服务**: 端口3000 (http://localhost:3000)

### 2. 更新前端API配置
- ✅ **src/api/request.ts**: 将baseURL改为4000端口
- ✅ **src/api/formApi.ts**: 将API_BASE_URL改为4000端口
- ✅ **src/api/dataSource.ts**: 使用相对路径，自动使用request.ts的配置

### 3. 更新组件API调用
- ✅ **src/components/FormWizard/QuickFormWizard.vue**: 更新为4000端口
- ✅ **src/components/Layout.vue**: 更新为4000端口
- ✅ **src/views/ApiTest.vue**: 更新为4000端口

### 4. 验证API连接
- ✅ **健康检查**: http://localhost:4000/api/health
- ✅ **菜单列表**: http://localhost:4000/api/menu-list (11个菜单)
- ✅ **数据源列表**: http://localhost:4000/api/data-sources (3个数据源)
- ✅ **表列表**: http://localhost:4000/api/table-list (4个表)

## 当前服务状态

### 后端服务 (端口: 4000)
```bash
✅ 健康检查: http://localhost:4000/api/health
✅ 菜单API: http://localhost:4000/api/menu-list
✅ 数据源API: http://localhost:4000/api/data-sources
✅ 表列表API: http://localhost:4000/api/table-list?db=mysql_main
```

### Mock服务 (端口: 5000)
```bash
✅ Mock API: http://localhost:5000/api
✅ 表单模板: http://localhost:5000/api/form_templates
✅ 表单实例: http://localhost:5000/api/form_instances
```

### 前端服务 (端口: 3000)
```bash
✅ 主页: http://localhost:3000
✅ 表单设计器: http://localhost:3000/form-designer
✅ API测试页面: http://localhost:3000/api-test
```

## 测试方法

### 1. 命令行测试
```bash
./test-api-connection.sh
```

### 2. 浏览器测试
访问 http://localhost:3000/api-test 进行可视化API测试

### 3. 手动测试
```bash
# 健康检查
curl http://localhost:4000/api/health

# 菜单列表
curl http://localhost:4000/api/menu-list

# 数据源列表
curl http://localhost:4000/api/data-sources
```

## 解决的问题
1. ❌ **Network Error**: 前端无法连接到后端API
2. ❌ **ERR_CONNECTION_REFUSED**: 端口连接被拒绝
3. ❌ **API调用失败**: 表单设计器无法加载数据

## 现在的状态
1. ✅ **前后端连接正常**: 端口配置统一为4000
2. ✅ **API响应正常**: 所有端点返回正确数据
3. ✅ **前端可以正常调用**: 表单设计器可以加载数据源和菜单

## 端口分配
- **前端服务**: 3000
- **后端API**: 4000  
- **Mock服务**: 5000

## 下一步
- 测试表单设计器的完整功能
- 验证快速表单生成向导
- 确保所有页面的API调用都正常工作 