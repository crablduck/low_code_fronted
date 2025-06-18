/*
 * @Author: Mr.Crab wei17306927526@gmail.com
 * @Date: 2025-05-29 11:16:34
 * @LastEditors: Mr.Crab wei17306927526@gmail.com
 * @LastEditTime: 2025-05-29 17:13:17
 * @FilePath: /workflow-system/src/api/menu.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import request from '@/shared/utils/request'
import type { MenuTreeResponse, MenuSelectOption } from '@/shared/types/menu'

export interface MenuResponse {
  code: number
  data: MenuItem[]
  message: string
}

export interface MenuItem {
  id: string
  parentId: string | null
  name: string
  path: string
  component: string | null
  icon: string | null
  type: number
  permission: string | null
  sort: number
  status: number
  createTime: any
  updateTime: any
  children?: MenuItem[]
}

// 构建菜单树
export const buildMenuTree = (menus: MenuItem[]): MenuItem[] => {
  const menuMap = new Map<string, MenuItem>()
  const result: MenuItem[] = []

  // 先把所有菜单放入 Map
  menus.forEach(menu => {
    menuMap.set(menu.id, { ...menu, children: [] })
  })

  // 构建树形结构
  menus.forEach(menu => {
    const currentMenu = menuMap.get(menu.id)!
    if (menu.parentId) {
      const parentMenu = menuMap.get(menu.parentId)
      if (parentMenu) {
        parentMenu.children = parentMenu.children || []
        parentMenu.children.push(currentMenu)
      }
    } else {
      result.push(currentMenu)
    }
  })

  return result.sort((a, b) => a.sort - b.sort)
}

// 获取菜单列表
export const getMenuList = async (): Promise<MenuResponse> => {
  const response: any = await request({
    url: '/menu',
    method: 'get'
  })
  return {
    code: response.code,
    message: response.message,
    data: response.data
  }
}

// 获取菜单树
export const getMenuTree = async (): Promise<MenuTreeResponse> => {

  const response: any = await request({
    url: '/menu',
    method: 'get'
  })
  
  // 确保返回的数据结构正确
  if (response.data) {
    response.data = buildMenuTree(response.data)
  }
  
  return {
    code: response.code || 200,
    message: response.message || 'success',
    data: response.data || []
  }
}

// 将菜单树转换为级联选择器选项
export const convertMenuToOptions = (menuItems: MenuItem[]): MenuSelectOption[] => {
  return menuItems.map(item => {
    const hasChildren = item.children && item.children.length > 0
    return {
      value: item.id,
      label: item.name || '未命名菜单',
      ...(hasChildren ? { children: convertMenuToOptions(item.children) } : {})
    }
  })
} 