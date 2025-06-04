// 菜单项接口
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

// 菜单树响应接口
export interface MenuTreeResponse {
  code: number
  data: MenuItem[]
  message: string
}

// 菜单选择项接口
export interface MenuSelectOption {
  value: string
  label: string
  children?: MenuSelectOption[]
} 