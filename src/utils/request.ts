/*
 * @Author: Mr.Crab wei17306927526@gmail.com
 * @Date: 2025-05-28 10:00:35
 * @LastEditors: Mr.Crab wei17306927526@gmail.com
 * @LastEditTime: 2025-06-06 09:37:51
 * @FilePath: /workflow-system/src/utils/request.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import axios from 'axios'
import type { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse } from 'axios'
import { ElMessage } from 'element-plus'
import router from '@/router'
import { useUserStore } from '@/stores/user'
import type { ApiResponse } from '@/types/dataManagement'
import { addGlobalHeaders, logRequestInfo } from './requestHelpers'

// 创建两个axios实例
// 1. 主服务API实例（用于登录、菜单等）
const mainService: AxiosInstance = axios.create({
  baseURL: 'http://172.16.1.107:6001',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 2. 数据源服务API实例（跳过JWT认证）
const dataSourceService: AxiosInstance = axios.create({
  baseURL: 'http://172.16.1.107:8080',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 主服务请求拦截器
mainService.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // 使用通用工具添加全局 headers
    addGlobalHeaders(config)
    
    // 可以添加主服务特有的逻辑
    logRequestInfo(config, '主服务')
    
    return config
  },
  (error) => {
    console.error('主服务请求错误:', error)
    return Promise.reject(error)
  }
)

// 数据源服务请求拦截器（不需要JWT认证，但需要X-User-ID）
dataSourceService.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // 使用通用工具添加全局 headers
    addGlobalHeaders(config)
    
    // 数据源服务特有的逻辑
    logRequestInfo(config, '数据源服务')
    
    return config
  },
  (error) => {
    console.error('数据源服务请求错误:', error)
    return Promise.reject(error)
  }
)

// 响应拦截器（两个实例共用）
const responseInterceptor = (response: AxiosResponse) => {
  const res = response.data
  
  if (response.status === 200 || response.status === 201) {
    if (res.code !== undefined && res.code !== 200) {
      ElMessage({
        message: res.message || '请求失败',
        type: 'error'
      })
      return Promise.reject(new Error(res.message || '请求失败'))
    }
    return res
  } else {
    ElMessage({
      message: `请求错误: ${response.status}`,
      type: 'error'
    })
    return Promise.reject(new Error(`请求错误: ${response.status}`))
  }
}

// 添加响应拦截器
mainService.interceptors.response.use(responseInterceptor)
dataSourceService.interceptors.response.use(responseInterceptor)

// 导出两个服务实例
export { mainService, dataSourceService }

// 移除旧的拦截器代码，因为它们已经被新的拦截器替代
// 保持代码的整洁

// 导出请求方法
export const request = (service: AxiosInstance, config: InternalAxiosRequestConfig) => {
  return service(config)
}

export const get = async <T>(service: AxiosInstance, url: string): Promise<ApiResponse<T>> => {
  const response = await service.get(url)
  return response
}

export const post = async <T>(service: AxiosInstance, url: string, data?: any): Promise<ApiResponse<T>> => {
  const response = await service.post(url, data)
  return response
}

export const put = (service: AxiosInstance, url: string, data?: any, config?: InternalAxiosRequestConfig) => {
  return service.put(url, data, config)
}

export const del = (service: AxiosInstance, url: string, config?: InternalAxiosRequestConfig) => {
  return service.delete(url, config)
}

// 导出默认服务实例（保持兼容性）
export default mainService