import type { NavigationGuardNext, RouteLocationNormalized } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { STORAGE_KEYS } from '@/app/constants'

/**
 * 认证路由守卫
 */
export const authGuard = async (
  to: RouteLocationNormalized,
  from: RouteLocationNormalized,
  next: NavigationGuardNext
) => {
  const userStore = useUserStore()
  
  // 设置页面标题
  if (to.meta?.title) {
    document.title = `${to.meta.title} - 低代码工作流系统`
  }

  // 如果启用跳过认证，直接通过
  const skipAuth = import.meta.env.VITE_SKIP_AUTH === 'true'
  
  if (skipAuth) {
    console.log('🔓 跳过认证模式：允许访问所有页面')
    next()
    return
  }

  // 处理公开页面（如登录页面）
  if (to.meta?.public) {
    // 如果是登录页面且用户已有token，跳转到首页
    if (userStore.token && to.path === '/login') {
      next('/')
      return
    }
    // 对于公开页面，直接通过，不进行任何认证检查
    next()
    return
  }

  // 检查 token
  if (!userStore.token) {
    console.log('🔒 未找到token，跳转到登录页面')
    next('/login')
    return
  }

  // 跳过用户信息检查的情况
  if (to.query.skipAuthCheck === 'true') {
    next()
    return
  }

  // 获取用户信息（仅对需要认证的页面）
  if (!userStore.userInfo) {
    try {
      const userInfo = await userStore.getUserInfo()
      if (!userInfo) {
        throw new Error('获取用户信息失败')
      }
      next()
    } catch (error) {
      console.error('用户认证失败:', error)
      // 清除无效的认证信息
      localStorage.removeItem(STORAGE_KEYS.TOKEN)
      localStorage.removeItem(STORAGE_KEYS.USER_INFO)
      userStore.$reset()
      next('/login')
    }
  } else {
    next()
  }
} 