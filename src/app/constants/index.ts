/**
 * 应用常量定义
 */

// 应用基础信息
export const APP_INFO = {
  NAME: '低代码工作流系统',
  VERSION: '1.0.0',
  DESCRIPTION: '企业级低代码工作流平台'
} as const

// 本地存储键名
export const STORAGE_KEYS = {
  TOKEN: 'token',
  USER_INFO: 'userInfo',
  THEME: 'theme',
  LANGUAGE: 'language'
} as const

// API 相关常量
export const API_CONFIG = {
  TIMEOUT: 30000,
  RETRY_TIMES: 3,
  BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'
} as const

// 路由常量
export const ROUTE_NAMES = {
  HOME: 'Home',
  LOGIN: 'Login',
  DASHBOARD: 'Dashboard',
  FORM_DESIGNER: 'FormDesigner',
  REPORT_DESIGNER: 'ReportDesigner',
  WORKFLOW_DESIGNER: 'WorkflowDesigner',
  DATA_SOURCE_MANAGE: 'DatasourceManage',
  DATASET_MANAGE: 'DatasetManage'
} as const

// 页面尺寸常量
export const PAGE_SIZES = [10, 20, 50, 100] as const

// 默认分页配置
export const DEFAULT_PAGINATION = {
  PAGE: 1,
  SIZE: 20,
  TOTAL: 0
} as const

// 文件上传限制
export const FILE_UPLOAD = {
  MAX_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'],
  CHUNK_SIZE: 1024 * 1024 // 1MB
} as const

// 表单验证规则
export const VALIDATION_RULES = {
  REQUIRED: { required: true, message: '此字段为必填项', trigger: 'blur' },
  EMAIL: { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' },
  PHONE: { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号码', trigger: 'blur' }
} as const

// 主题配置
export const THEME_CONFIG = {
  PRIMARY_COLOR: '#409EFF',
  SUCCESS_COLOR: '#67C23A',
  WARNING_COLOR: '#E6A23C',
  DANGER_COLOR: '#F56C6C',
  INFO_COLOR: '#909399'
} as const

// 跳过认证模式配置
export const SKIP_AUTH_CONFIG = {
  // 跳过认证时使用的模拟token
  MOCK_TOKEN: 'dev-mock-token',
  // 跳过认证时使用的模拟用户ID
  MOCK_USER_ID: '1',
  // 完整的Authorization头格式
  MOCK_AUTH_HEADER: 'Bearer dev-mock-token'
} as const 