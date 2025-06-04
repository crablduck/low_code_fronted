/*
 * @Author: Mr.Crab wei17306927526@gmail.com
 * @Date: 2025-05-28 10:02:49
 * @LastEditors: Mr.Crab wei17306927526@gmail.com
 * @LastEditTime: 2025-05-28 22:16:40
 * @FilePath: /workflow-system/src/types/auth.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
export interface LoginForm {
  username: string
  password: string
}

export interface TenantInfo {
  code: string
  name: string
  logo?: string
  theme?: string
}

export interface UserInfo {
  id: string
  username: string
  realName: string
  email: string
  avatar: string | null
}

export interface LoginResponse {
  code: number
  data: {
    access_token: string
    user: UserInfo
  }
  message?: string
}

export interface TenantListResponse {
  code: number
  message: string
  data: TenantInfo[]
}

export interface ApiResponse<T> {
  code: number
  message: string
  data: T
} 