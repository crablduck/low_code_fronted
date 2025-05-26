// 测试菜单数据结构
const testMenuData = async () => {
  try {
    const response = await fetch('http://localhost:4000/api/menu-list')
    const result = await response.json()
    
    console.log('=== 菜单数据测试 ===')
    console.log('API响应:', result)
    
    if (result.code === 200 && Array.isArray(result.data)) {
      const menuData = result.data
      console.log('菜单总数:', menuData.length)
      
      // 分析顶级菜单
      const topLevelMenus = menuData.filter(menu => menu.parent_id === null)
      console.log('顶级菜单数量:', topLevelMenus.length)
      console.log('顶级菜单:', topLevelMenus.map(m => ({ id: m.id, name: m.name, path: m.path })))
      
      // 分析子菜单
      topLevelMenus.forEach(parent => {
        const children = menuData.filter(menu => menu.parent_id === parent.id)
        console.log(`${parent.name} 的子菜单 (${children.length}个):`, children.map(c => ({ id: c.id, name: c.name, path: c.path })))
      })
      
      // 检查数据完整性
      const hasAllRequiredFields = menuData.every(menu => 
        menu.id && menu.name && menu.path && menu.hasOwnProperty('parent_id')
      )
      console.log('数据完整性检查:', hasAllRequiredFields ? '✅ 通过' : '❌ 失败')
      
    } else {
      console.error('❌ API返回数据格式错误')
    }
  } catch (error) {
    console.error('❌ 测试失败:', error.message)
  }
}

// 如果在Node.js环境中运行
if (typeof window === 'undefined') {
  const fetch = require('node-fetch')
  testMenuData()
} else {
  // 在浏览器中运行
  testMenuData()
} 