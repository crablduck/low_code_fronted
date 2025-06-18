/*
 * @Author: Mr.Crab wei17306927526@gmail.com
 * @Date: 2025-05-28 10:02:57
 * @LastEditors: Mr.Crab wei17306927526@gmail.com
 * @LastEditTime: 2025-05-28 22:12:01
 * @FilePath: /workflow-system/src/api/auth.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import type { LoginForm, LoginResponse, UserInfo, ApiResponse, TenantListResponse } from '@/shared/types/auth'

// const API_BASE_URL = 'http://localhost:6001' // 这里替换成你的实际API地址
const API_BASE_URL = 'http://172.16.1.107:6001' // 这里替换成你的实际API地址

export const login = async (data: LoginForm): Promise<LoginResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })
    
    if (!response.ok) {
      throw new Error('登录失败')
    }
    
    return response.json()
  } catch (error) {
    console.error('登录错误:', error)
    throw error
  }
}

export const getUserInfo = async (): Promise<UserInfo> => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/user-info`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    })
    
    if (!response.ok) {
      throw new Error('获取用户信息失败')
    }
    
    return response.json()
  } catch (error) {
    console.error('获取用户信息错误:', error)
    throw error
  }
}

export interface Tenant {
  id: number
  name: string
  code: string
  status: 'active' | 'inactive'
}

export const getTenants = async (): Promise<Tenant[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/tenants`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    })
    
    if (!response.ok) {
      throw new Error('获取租户列表失败')
    }
    
    return response.json()
  } catch (error) {
    console.error('获取租户列表错误:', error)
    throw error
  }
}

export const getTenantList = async (): Promise<TenantListResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/tenants`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    })
    
    if (!response.ok) {
      throw new Error('获取租户列表失败')
    }
    
    return response.json()
  } catch (error) {
    console.error('获取租户列表错误:', error)
    throw error
  }
}

export default {
  login,
  getUserInfo,
  getTenantList
} 