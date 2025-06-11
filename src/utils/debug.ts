/**
 * 调试工具：检查用户信息和请求 headers
 */

// 检查 localStorage 中的用户信息
export const checkUserInfo = () => {
  console.log('===== 用户信息检查 =====')
  
  const token = localStorage.getItem('token')
  const userInfoStr = localStorage.getItem('userInfo')
  
  console.log('Token:', token ? '已设置' : '未设置')
  console.log('UserInfo 原始数据:', userInfoStr)
  
  if (userInfoStr) {
    try {
      const userInfo = JSON.parse(userInfoStr)
      console.log('解析后的用户信息:', userInfo)
      console.log('用户ID:', userInfo?.id)
      console.log('用户ID类型:', typeof userInfo?.id)
    } catch (error) {
      console.error('解析用户信息失败:', error)
    }
  } else {
    console.warn('localStorage 中没有用户信息')
  }
}

// 手动测试 headers 添加
export const testHeadersAddition = () => {
  console.log('===== Headers 添加测试 =====')
  
  const mockConfig = {
    url: '/test',
    method: 'GET',
    headers: {}
  }
  
  // 模拟添加 headers
  const userInfoStr = localStorage.getItem('userInfo')
  const token = localStorage.getItem('token')
  
  if (token) {
    mockConfig.headers['Authorization'] = `Bearer ${token}`
  }
  
  if (userInfoStr) {
    try {
      const userInfo = JSON.parse(userInfoStr)
      if (userInfo && userInfo.id) {
        mockConfig.headers['X-User-ID'] = userInfo.id.toString()
      }
    } catch (error) {
      console.error('解析失败:', error)
    }
  }
  
  console.log('模拟请求配置:', mockConfig)
  return mockConfig
}

// 在全局对象上暴露调试函数
if (typeof window !== 'undefined') {
  ;(window as any).debugUserInfo = checkUserInfo
  ;(window as any).debugHeaders = testHeadersAddition
} 