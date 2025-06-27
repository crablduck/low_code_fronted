# 医疗工作流系统 (Workflow System)

一个基于 Vue 3 + TypeScript 的现代化医疗工作流低代码平台，专为医疗行业快速构建前后端项目而设计。

## 🚀 项目特性

### 核心功能模块

- **📊 仪表盘设计器** - 可视化数据大屏设计，支持多种图表组件
- **📝 表单设计器** - 拖拽式表单构建，支持多种表单控件
- **📋 报表设计器** - 基于 Univer 的在线表格编辑器
- **🖨️ 打印设计器** - 可视化打印模板设计
- **🔄 工作流引擎** - 基于流程图的业务流程设计
- **📈 数据管理** - 数据源管理、数据集设计、计算字段配置

### 技术亮点

- **🏗️ 微前端架构** - 基于 Feature 的模块化架构设计
- **🎨 现代化UI** - 基于 Element Plus 的统一设计语言
- **📱 响应式设计** - 支持多端适配，优秀的用户体验
- **🔧 低代码开发** - 可视化设计，减少代码编写工作量
- **⚡ 高性能** - Vite 构建，HMR 热更新，开发体验流畅
- **🔐 权限管理** - 完整的用户认证和权限控制体系

## 🛠️ 技术栈

### 前端核心

- **框架**: Vue 3.4 + TypeScript 5.2
- **构建工具**: Vite 5.1
- **状态管理**: Pinia 3.0
- **路由**: Vue Router 4.5
- **UI组件**: Element Plus 2.9

### 数据可视化

- **图表库**: ECharts 5.6 + AntV G2/G6/S2
- **流程图**: Vue Flow + AntV X6
- **表格**: Univer 0.7 (在线表格编辑器)

### 功能增强

- **拖拽**: VueDraggable 4.1
- **Excel**: LuckySheet 2.1 + LuckyExcel
- **打印**: Print.js + html2pdf.js
- **条码**: JSBarcode + QRCode
- **代码编辑**: CodeMirror 6.0

### 开发工具

- **🧠 Stagewise**: 可视化编码工具，支持在浏览器中选择元素并与AI代理交互
- **⚡ HMR**: Vite 热模块替换，极速开发体验
- **🔧 TypeScript**: 完整的类型检查和智能提示

## 📦 快速开始

### 环境要求

- Node.js >= 16.0.0
- npm >= 8.0.0 或 yarn >= 1.22.0

### 安装依赖

```bash
# 使用 npm
npm install

# 或使用 yarn
yarn install
```

### 开发环境

```bash
# 启动开发服务器
npm run dev

# 或
yarn dev
```

开发服务器启动后，访问 [http://localhost:3000](http://localhost:3000)

### 生产构建

```bash
# 构建生产版本
npm run build

# 或
yarn build
```

### 预览构建结果

```bash
# 预览生产构建
npm run preview

# 或
yarn preview
```

## 🏗️ 项目结构

```
src/
├── app/                    # 应用核心配置
│   ├── config/            # 应用配置
│   └── constants/         # 常量定义
├── features/              # 功能模块 (Feature-based Architecture)
│   ├── auth/             # 用户认证
│   ├── dashboard/        # 仪表盘设计器
│   ├── data-management/  # 数据管理
│   ├── form-designer/    # 表单设计器
│   ├── print-designer/   # 打印设计器
│   ├── report-designer/  # 报表设计器
│   └── workflow/         # 工作流引擎
├── shared/               # 共享资源
│   ├── components/       # 通用组件
│   ├── types/           # 类型定义
│   ├── utils/           # 工具函数
│   └── guards/          # 路由守卫
├── layouts/             # 布局组件
├── api/                 # API 接口
├── stores/              # 状态管理
├── router/              # 路由配置
└── styles/              # 全局样式
```

## 🔧 开发指南

### 🧠 可视化编码 (Stagewise)

本项目集成了 Stagewise 可视化编码工具，让您可以直接在浏览器中选择UI元素并与AI代理交互：

1. **安装扩展**: 首先安装 [Stagewise VS Code 扩展](https://marketplace.visualstudio.com/items?itemName=stagewise.stagewise-vscode-extension)
2. **启动开发**: `npm run dev` 启动开发服务器
3. **使用工具**: 页面底部会出现工具栏，选择元素并添加注释
4. **AI处理**: AI代理会自动分析并修改代码

详细使用指南请查看：[Stagewise 设置指南](./doc/stagewise-setup.md)

### 代码规范

- 遵循 **SOLID 原则**，保持代码职责单一
- 使用 **TypeScript** 进行类型安全开发
- 组件命名采用 **PascalCase**
- 文件命名采用 **kebab-case**
- 提交信息遵循 **Conventional Commits** 规范

### 功能模块开发

每个功能模块（Feature）包含完整的功能实现：

```
features/example-feature/
├── components/          # 功能组件
├── views/              # 页面视图
├── services/           # 业务逻辑
├── stores/             # 状态管理
├── types/              # 类型定义
└── utils/              # 工具函数
```

### API 调用规范

数据集相关API请求使用统一模式：

```typescript
// 推荐使用
await get(dataSourceService, ...)

// 而不是标准的request工具
```

## 🎨 UI/UX 设计

- **主色调**: 浅蓝色系，营造医疗专业感
- **布局**: 统一的设计语言和布局模式
- **响应式**: 支持桌面端和移动端适配
- **无障碍**: 遵循 WCAG 2.1 规范

## 🚀 部署指南

### 环境配置

项目支持多环境配置，通过环境变量进行区分：

- 开发环境：`localhost:3000`
- 测试环境：配置相应的 API 地址
- 生产环境：配置生产 API 地址

### Docker 部署

```dockerfile
# 示例 Dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "run", "preview"]
```

## 🤝 贡献指南

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

## 📋 TODO

- [ ] 增加单元测试覆盖
- [ ] 完善国际化支持
- [ ] 优化移动端体验
- [ ] 添加主题切换功能
- [ ] 集成更多数据源类型

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 👥 团队

- **架构师**: 医疗行业架构师，专注于快速构建前后端项目解决方案

## 📞 支持

如有问题或建议，请创建 Issue 或联系开发团队。

---

**让低代码开发更简单，让医疗信息化更高效！** 🏥✨
# low_code_fronted

## 项目说明
这是一个工作流系统的前端项目，支持独立运行和 iframe 嵌入模式。

## 环境要求
- Node.js >= 16
- pnpm >= 7

## 开发说明

### 1. 独立运行模式
```bash
# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev
```

### 2. iframe 嵌入模式
本项目支持作为 iframe 嵌入到其他应用中。主要修改包括：
- 隐藏顶部导航栏
- 环境变量配置
- 认证机制适配

#### 2.1 环境变量配置
在 `.env.development` 中配置：
```env
# 仪表盘服务地址
VITE_DASHBOARD_URL=http://localhost:6001

# 数据源服务地址
VITE_DATASOURCE_BASE_URL=http://localhost:8080

# API基础地址
VITE_API_BASE_URL=http://localhost:48080
```

## Git Submodule 使用说明

### 1. 首次克隆项目
如果你是首次克隆主项目，需要执行：
```bash
# 克隆主项目
git clone <main-project-url>

# 初始化并更新子模块
git submodule init
git submodule update
```

### 2. 更新子模块
当 workflow-system 有更新时，执行：
```bash
# 更新所有子模块到最新版本
git submodule update --remote

# 或者只更新特定子模块
git submodule update --remote workflow-system
```

### 3. 提交子模块更新
如果你修改了子模块的内容：
```bash
# 1. 进入子模块目录
cd workflow-system

# 2. 创建新分支
git checkout -b feature/your-feature

# 3. 提交修改
git add .
git commit -m "feat: your feature description"

# 4. 推送到远程仓库
git push origin feature/your-feature

# 5. 在 GitHub 上创建 Pull Request
# 访问: https://github.com/crablduck/low_code_fronted/pulls
```

### 4. 常见问题

#### 4.1 子模块更新冲突
如果在更新子模块时遇到冲突：
```bash
# 1. 保存当前修改
git stash

# 2. 更新子模块
git submodule update --remote

# 3. 恢复修改并解决冲突
git stash pop
```

#### 4.2 子模块分支切换
如果需要切换子模块的分支：
```bash
cd workflow-system
git checkout <branch-name>
cd ..
git add workflow-system
git commit -m "chore: switch workflow-system to branch <branch-name>"
```

## 项目结构
```
workflow-system/
├── src/                    # 源代码目录
│   ├── api/               # API 接口
│   ├── components/        # 公共组件
│   ├── features/          # 功能模块
│   ├── shared/           # 共享资源
│   └── ...
├── .env.development       # 开发环境配置
└── ...
```

## 注意事项
1. 不要直接在 main 分支上修改代码
2. 所有功能开发请创建新分支
3. 提交代码前请确保通过所有测试
4. 环境变量文件（.env.*）不会被 git 追踪，需要手动配置

## 更新日志

### 2024-03-xx
- 添加 iframe 嵌入支持
- 优化环境变量配置
- 修复已知问题

## 贡献指南
1. Fork 项目
2. 创建功能分支
3. 提交修改
4. 创建 Pull Request

## 许可证
[MIT License](LICENSE)
