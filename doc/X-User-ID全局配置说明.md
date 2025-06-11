# X-User-ID 全局配置说明

## 📋 概述

为了满足系统后端接口对 `X-User-ID` header 的全局要求，我们在前端实现了统一的配置方案。该方案确保所有 API 请求都会自动携带当前用户的 ID。

## 🎯 已配置的服务

### 1. **主要服务实例**

✅ **src/utils/request.ts**
- `mainService` (http://localhost:6001) - 主服务API
- `dataSourceService` (http://localhost:8080) - 数据源服务API

✅ **src/api/request.ts**
- `request` (http://localhost:4000) - 表单等业务API

✅ **src/api/formApi.ts** 
- `api` (http://localhost:4000) - 表单相关API

## 🛠 技术实现

### 核心工具函数

创建了 `src/utils/requestHelpers.ts` 提供统一的配置工具：

```typescript
// 添加全局 headers（包括 X-User-ID 和 Authorization）
addGlobalHeaders(config)

// 获取当前用户ID
getCurrentUserId(): string | null

// 获取当前用户Token
getCurrentToken(): string | null

// 请求日志输出
logRequestInfo(config, serviceName)
```

### 实现原理

1. **用户信息获取**：从 `localStorage` 获取用户信息，避免依赖 Pinia store 的初始化时机
2. **自动注入**：在请求拦截器中自动为所有请求添加 `X-User-ID` header
3. **容错处理**：包含完善的错误处理，避免解析失败影响请求

### 配置示例

```typescript
// 在任何 axios 实例的请求拦截器中使用
service.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // 使用通用工具添加全局 headers
    addGlobalHeaders(config)
    
    // 添加调试日志
    logRequestInfo(config, '服务名称')
    
    return config
  },
  (error) => {
    console.error('请求错误:', error)
    return Promise.reject(error)
  }
)
```

## 🔄 数据流程

1. **用户登录** → 用户信息存储到 `localStorage`
2. **发起请求** → 请求拦截器自动读取用户信息
3. **添加 Header** → 自动添加 `X-User-ID: {userId}` 
4. **发送请求** → 后端接收到带有用户ID的请求

## 📊 请求 Headers 结构

每个请求会自动携带以下 headers：

```
Content-Type: application/json
Authorization: Bearer {jwt_token}          // 如果有token
X-User-ID: {user_id}                      // 当前用户ID
```

## 🚨 注意事项

### 对于新模块开发

如果您需要创建新的 axios 实例，请确保：

1. **导入工具函数**：
   ```typescript
   import { addGlobalHeaders, logRequestInfo } from '@/utils/requestHelpers'
   ```

2. **在请求拦截器中调用**：
   ```typescript
   yourAxiosInstance.interceptors.request.use((config) => {
     addGlobalHeaders(config)
     logRequestInfo(config, '您的服务名')
     return config
   })
   ```

### 对于现有模块

如果发现某个模块的 API 请求缺少 `X-User-ID`：

1. 检查该模块是否使用了独立的 axios 实例
2. 为其添加请求拦截器配置
3. 或者改用已配置好的服务实例

## 🔍 调试支持

所有配置了全局 headers 的请求都会输出调试信息：

```
===== 数据源服务 请求调试信息 =====
请求URL: /api/datasets/32/preview
请求方法: GET
请求数据: undefined
X-User-ID: 123
Authorization: 已设置
```

## 📈 扩展建议

### 1. 环境配置

可以根据环境变量控制是否启用调试日志：

```typescript
if (process.env.NODE_ENV === 'development') {
  logRequestInfo(config, serviceName)
}
```

### 2. 错误监控

可以添加用户ID缺失的监控：

```typescript
if (!config.headers['X-User-ID']) {
  console.warn('警告：请求缺少 X-User-ID header')
  // 发送错误报告到监控系统
}
```

### 3. 多租户支持

未来如需支持多租户，可以扩展为：

```typescript
config.headers['X-Tenant-ID'] = getTenantId()
config.headers['X-User-ID'] = getUserId()
```

## ✅ 验证方法

### 1. 开发环境验证

查看浏览器开发者工具的 Network 面板，确认请求包含正确的 headers。

### 2. 控制台日志

观察控制台输出的请求调试信息。

### 3. 后端验证

与后端开发确认是否正确接收到 `X-User-ID` header。

---

通过这套统一的配置方案，确保了所有模块的 API 请求都能正确携带用户ID，满足了系统的全局要求。 