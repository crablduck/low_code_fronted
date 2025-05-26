// 数据源相关类型
export interface DataSource {
  id: string
  name: string
  type: 'mysql' | 'postgresql' | 'sqlite' | 'mongodb'
  host?: string
  port?: number
  database?: string
  status: 'connected' | 'disconnected' | 'error'
}

// 数据表信息
export interface TableInfo {
  name: string
  comment?: string
  engine?: string
  charset?: string
  rowCount?: number
  createTime?: string
}

// 菜单项
export interface MenuItem {
  id: string
  name: string
  path: string
  icon?: string
  parentId?: string
  children?: MenuItem[]
  sort?: number
}

// 字段类型枚举
export type FieldType = 
  | 'input'      // 文本输入
  | 'textarea'   // 多行文本
  | 'number'     // 数字输入
  | 'select'     // 下拉选择
  | 'radio'      // 单选框
  | 'checkbox'   // 复选框
  | 'date'       // 日期选择
  | 'datetime'   // 日期时间选择
  | 'time'       // 时间选择
  | 'switch'     // 开关
  | 'slider'     // 滑块
  | 'rate'       // 评分
  | 'upload'     // 文件上传
  | 'cascader'   // 级联选择
  | 'transfer'   // 穿梭框

// 字段定义
export interface FieldDefinition {
  name: string                    // 字段标识（数据库字段名）
  label: string                   // 字段显示名称
  type: FieldType                 // 字段类型
  required: boolean               // 是否必填
  placeholder?: string            // 提示信息
  defaultValue?: any              // 默认值
  options?: string[] | OptionItem[] // 选项列表（用于select、radio、checkbox）
  validation?: ValidationRule[]   // 验证规则
  props?: Record<string, any>     // 组件特定属性
  
  // 表格显示相关
  showInTable?: boolean          // 是否在表格中显示
  showInSearch?: boolean         // 是否作为搜索条件
  sortable?: boolean             // 是否可排序
  width?: number                 // 表格列宽
  
  // 数据库相关
  dbType?: string                // 数据库字段类型
  length?: number                // 字段长度
  precision?: number             // 数字精度
  scale?: number                 // 数字小数位
  nullable?: boolean             // 是否允许为空
  unique?: boolean               // 是否唯一
  index?: boolean                // 是否创建索引
  comment?: string               // 字段注释
}

// 选项项
export interface OptionItem {
  label: string
  value: any
  disabled?: boolean
  children?: OptionItem[]
}

// 验证规则
export interface ValidationRule {
  type: 'required' | 'min' | 'max' | 'pattern' | 'custom'
  value?: any
  message: string
  trigger?: 'blur' | 'change'
}

// 字段模板
export interface FieldTemplate {
  id: string
  name: string
  description: string
  icon: any
  category: 'common' | 'business' | 'medical' | 'ecommerce' | 'custom'
  fields: FieldDefinition[]
  tags?: string[]
}

// 表单基本信息
export interface FormBasicInfo {
  name: string                    // 表单名称
  description: string             // 表单说明
  dataSource: string              // 数据源ID
  existingTable: string           // 现有表名（可选）
  tableName?: string              // 新表名（自动生成或手动指定）
  tableComment?: string           // 表注释
}

// 模板配置
export interface TemplateConfig {
  selectedTemplate: string        // 选中的模板ID
  fields: FieldDefinition[]       // 字段列表
  customFields?: FieldDefinition[] // 自定义添加的字段
}

// 页面配置
export interface PageConfig {
  autoGenerateMenu: boolean       // 是否自动生成菜单
  parentMenu: string              // 父菜单ID
  routePath: string               // 路由路径
  pageTitle: string               // 页面标题
  
  // 页面功能配置
  enableAdd?: boolean             // 启用新增功能
  enableEdit?: boolean            // 启用编辑功能
  enableDelete?: boolean          // 启用删除功能
  enableExport?: boolean          // 启用导出功能
  enableImport?: boolean          // 启用导入功能
  enableBatchDelete?: boolean     // 启用批量删除
  
  // 表格配置
  pageSize?: number               // 默认分页大小
  showPagination?: boolean        // 显示分页
  showSelection?: boolean         // 显示选择列
  showIndex?: boolean             // 显示序号列
  
  // 权限配置
  permissions?: string[]          // 页面权限标识
}

// 完整的表单配置
export interface FormConfig {
  basic: FormBasicInfo
  template: TemplateConfig
  page: PageConfig
  
  // 元数据
  id?: string                     // 表单ID（编辑时存在）
  version?: string                // 版本号
  status?: 'draft' | 'published' | 'archived' // 状态
  createdAt?: string              // 创建时间
  updatedAt?: string              // 更新时间
  createdBy?: string              // 创建人
  updatedBy?: string              // 更新人
}

// 表单生成结果
export interface FormGenerateResult {
  formId: string                  // 生成的表单ID
  tableName: string               // 数据表名
  routePath: string               // 路由路径
  menuId?: string                 // 菜单ID（如果自动生成）
  
  // 生成的文件路径
  files: {
    vue?: string                  // Vue组件文件路径
    api?: string                  // API文件路径
    sql?: string                  // SQL文件路径
    route?: string                // 路由配置文件路径
  }
  
  // 生成状态
  success: boolean
  message: string
  errors?: string[]
}

// API响应类型
export interface ApiResponse<T = any> {
  code: number
  message: string
  data: T
  success: boolean
}

// 分页响应
export interface PageResponse<T = any> {
  list: T[]
  total: number
  current: number
  size: number
  pages: number
}

// 表单实例（运行时）
export interface FormInstance {
  id: string
  name: string
  description: string
  config: FormConfig
  fieldsCount: number
  status: 'draft' | 'published' | 'archived'
  isTemplate: boolean
  createdAt: string
  updatedAt: string
  createdBy: string
  
  // 统计信息
  stats?: {
    viewCount?: number            // 访问次数
    submitCount?: number          // 提交次数
    lastSubmitAt?: string         // 最后提交时间
  }
}

// 导出配置
export interface ExportConfig {
  format: 'json' | 'sql' | 'vue' | 'zip'
  includeData?: boolean           // 是否包含数据
  includeStructure?: boolean      // 是否包含结构
  compression?: boolean           // 是否压缩
}

// 导入配置
export interface ImportConfig {
  source: 'file' | 'url' | 'text'
  format: 'json' | 'sql' | 'excel'
  overwrite?: boolean             // 是否覆盖现有配置
  validateOnly?: boolean          // 仅验证不导入
} 