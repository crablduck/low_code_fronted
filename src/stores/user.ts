/*
 * @Author: Mr.Crab wei17306927526@gmail.com
 * @Date: 2025-05-28 10:02:39
 * @LastEditors: Mr.Crab wei17306927526@gmail.com
 * @LastEditTime: 2025-05-29 10:36:19
 * @FilePath: /workflow-system/src/stores/user.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { LoginForm, UserInfo } from '@/types/auth'
import { login as loginApi, getUserInfo as getUserInfoApi } from '@/api/auth'

// 使用选项式API方式定义store
export const useUserStore = defineStore('user', {
  state: () => ({
    token: localStorage.getItem('token'),
    userInfo: null as UserInfo | null
  }),
  
  actions: {
    // 设置token
    setToken(newToken: string | null) {
      this.token = newToken
      if (newToken) {
        localStorage.setItem('token', newToken)
      } else {
        localStorage.removeItem('token')
        localStorage.removeItem('userInfo')
        this.userInfo = null
      }
    },
    
    // 登录
    async login(loginForm: LoginForm): Promise<boolean> {
      try {
        const response = await loginApi(loginForm)
        console.log('登录响应:', response)
        
        if (response) {
          const { access_token, user } = response.data
          this.setToken(access_token)
          this.userInfo = user
          
          // 持久化存储
          localStorage.setItem('userInfo', JSON.stringify(user))
          
          return true
        }
        return false
      } catch (error) {
        console.error('登录错误:', error)
        this.setToken(null)
        throw error
      }
    },
    
    // 获取用户信息
    async getUserInfo() {
      if (!this.token) return null
      try {
        const userInfo = await getUserInfoApi()
        this.userInfo = userInfo
        localStorage.setItem('userInfo', JSON.stringify(userInfo))
        return userInfo
      } catch (error) {
        this.setToken(null)
        throw error
      }
    },
    
    // 退出登录
    logout() {
      this.setToken(null)
    }
  }
})

// 初始化store
// const store = useUserStore()
// if (store.token) {
//   store.initFromStorage()
// }