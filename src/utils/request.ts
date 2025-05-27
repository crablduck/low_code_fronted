import axios from 'axios'
import type { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'
import { ElMessage } from 'element-plus'

// 创建 axios 实例
const service: AxiosInstance = axios.create({
  baseURL: 'http://localhost:4500', // 修改为 4500 端口
  timeout: 15000, // 请求超时时间
  headers: {
    'Content-Type': 'application/json;charset=utf-8'
  }
})

// 请求拦截器
service.interceptors.request.use(
  (config) => {
    // 从 localStorage 获取 token
    const token = localStorage.getItem('token')
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    console.error('请求错误：', error)
    return Promise.reject(error)
  }
)

// 响应拦截器
service.interceptors.response.use(
  (response: AxiosResponse) => {
    const res = response.data
    return res
  },
  (error) => {
    console.error('响应错误：', error)
    ElMessage.error(error.message || '请求失败')
    return Promise.reject(error)
  }
)

// 封装 GET 请求
export const get = (url: string, params?: any, config?: AxiosRequestConfig) => {
  return service.get(url, { params, ...config })
}

// 封装 POST 请求
export const post = (url: string, data?: any, config?: AxiosRequestConfig) => {
  return service.post(url, data, config)
}

// 封装 PUT 请求
export const put = (url: string, data?: any, config?: AxiosRequestConfig) => {
  return service.put(url, data, config)
}

// 封装 DELETE 请求
export const del = (url: string, config?: AxiosRequestConfig) => {
  return service.delete(url, config)
}

// 导出 axios 实例
export default service 