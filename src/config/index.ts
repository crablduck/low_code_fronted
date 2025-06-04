/*
 * @Author: Mr.Crab wei17306927526@gmail.com
 * @Date: 2025-05-29 11:16:34
 * @LastEditors: Mr.Crab wei17306927526@gmail.com
 * @LastEditTime: 2025-05-29 11:19:34
 * @FilePath: /workflow-system/src/config/index.ts
 * @Description: 全局配置文件
 */

// API 基础配置
export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:6001',
  TIMEOUT: 10000,
  WITH_CREDENTIALS: true
}

// 应用配置
export const APP_CONFIG = {
  TITLE: import.meta.env.VITE_APP_TITLE || '低代码工作流系统',
  DESC: import.meta.env.VITE_APP_DESC || '基于 Vue 3 + TypeScript + Vite + Element Plus 的低代码工作流系统'
}

// 默认请求头
export const DEFAULT_HEADERS = {
  'Accept': '*/*',
  'Content-Type': 'application/json'
}

// Token 相关配置
export const TOKEN_CONFIG = {
  STORAGE_KEY: 'token',
  HEADER_KEY: 'Authorization',
  PREFIX: 'Bearer '
} 