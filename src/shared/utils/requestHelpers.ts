/*
 * @Author: Mr.Crab wei17306927526@gmail.com
 * @Date: 2025-06-11 12:42:22
 * @LastEditors: KrabWW wei17306927526@gmail.com
 * @LastEditTime: 2025-06-20 10:10:20
 * @FilePath: /workflow-system/src/utils/requestHelpers.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import type { InternalAxiosRequestConfig, AxiosRequestConfig } from 'axios'
import { SKIP_AUTH_CONFIG } from '@/app/constants'

/**
 * 添加全局 headers 到请求配置
 * @param config axios 请求配置
 * @returns 更新后的配置
 */
export const addGlobalHeaders = (config: InternalAxiosRequestConfig | AxiosRequestConfig): InternalAxiosRequestConfig | AxiosRequestConfig => {
  // 从localStorage获取用户信息和token（因为这个文件可能在 store 初始化之前调用）
  const userInfoStr = localStorage.getItem('userInfo')
  const token = localStorage.getItem('token')
  
  // 确保 headers 对象存在
  if (!config.headers) {
    config.headers = {}
  }
  
  // 如果启用跳过认证，使用模拟认证信息
  const skipAuth = import.meta.env.VITE_SKIP_AUTH === 'true'
  
  if (skipAuth) {
    console.log(`🔓 跳过认证模式：使用模拟认证信息 (token: ${SKIP_AUTH_CONFIG.MOCK_TOKEN})`)
    config.headers['Authorization'] = SKIP_AUTH_CONFIG.MOCK_AUTH_HEADER
    config.headers['X-User-ID'] = SKIP_AUTH_CONFIG.MOCK_USER_ID
    return config
  }
  
  // 添加 JWT Token
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`
  }
  
  // 添加 X-User-ID 全局 header
  if (userInfoStr) {
    try {
      const userInfo = JSON.parse(userInfoStr)
      if (userInfo && userInfo.id) {
        config.headers['X-User-ID'] = userInfo.id.toString()
      }
    } catch (error) {
      console.warn('解析用户信息失败:', error)
      config.headers['X-User-ID'] = '1'
    }
  }
  
  return config
}

/**
 * 获取当前用户ID
 * @returns 用户ID字符串或null
 */
export const getCurrentUserId = (): string | null => {
  const userInfoStr = localStorage.getItem('userInfo')
  if (userInfoStr) {
    try {
      const userInfo = JSON.parse(userInfoStr)
      return userInfo?.id?.toString() || null
    } catch (error) {
      console.warn('解析用户信息失败:', error)
      return null
    }
  }
  return null
}

/**
 * 获取当前用户Token
 * @returns Token字符串或null
 */
export const getCurrentToken = (): string | null => {
  return localStorage.getItem('token')
}

/**
 * 日志输出请求信息
 * @param config 请求配置
 * @param serviceName 服务名称
 */
export const logRequestInfo = (config: InternalAxiosRequestConfig | AxiosRequestConfig, serviceName?: string) => {
  console.log(`===== ${serviceName || 'API'} 请求调试信息 =====`)
  console.log('请求URL:', config.url)
  console.log('请求方法:', config.method?.toUpperCase())
  console.log('请求数据:', config.data)
  console.log('X-User-ID:', config.headers?.['X-User-ID'] || '未设置')
  console.log('Authorization:', config.headers?.['Authorization'] ? '已设置' : '未设置')
} 