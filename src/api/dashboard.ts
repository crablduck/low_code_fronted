/*
 * @Author: Mr.Crab wei17306927526@gmail.com
 * @Date: 2025-05-28 10:12:59
 * @LastEditors: Mr.Crab wei17306927526@gmail.com
 * @LastEditTime: 2025-05-29 16:31:59
 * @FilePath: /workflow-system/src/api/dashboard.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import type { DashboardForm, DashboardQuery, DashboardResponse, DashboardListResponse, DashboardItem } from '@/types/dashboard'
import request from '@/utils/request'

// 获取仪表盘列表
export const getDashboardList = async (query: DashboardQuery): Promise<DashboardListResponse> => {
  const response: any = await request({
    url: '/dashboards',
    method: 'get',
    params: {
      page: query.page || 1,
      pageSize: query.pageSize || 10,
      ...(query.name ? { name: query.name } : {}),
      ...(query.status ? { status: query.status } : {})
    }
  })

  // 适配返回的数据结构
  return {
    code: response.code,
    message: response.message,
    data: {
      list: response.data.items.map((item: any) => ({
        ...item,
        createTime: item.createdAt,
        updateTime: item.updatedAt
      })),
      total: response.data.total
    }
  }
}

// 获取仪表盘详情
export const getDashboardDetail = async (id: string): Promise<DashboardResponse> => {
  return request({
    url: `/dashboards/${id}`,
    method: 'get'
  })
}

// 创建仪表盘
export const createDashboard = async (data: DashboardForm): Promise<DashboardResponse> => {
  try {
    const response: any = await request({
      url: '/dashboards',
      method: 'post',
      data
    })

    if (response.code !== 200) {
      throw new Error(response.message || '创建仪表盘失败')
    }

    return {
      code: response.code,
      message: response.message,
      data: response.data
    }
  } catch (error: any) {
    console.error('创建仪表盘失败:', error)
    throw error
  }
}

// 更新仪表盘
export const updateDashboard = async (id: string, data: Partial<DashboardForm>): Promise<DashboardResponse> => {
  return request({
    url: `/dashboards/${id}`,
    method: 'put',
    data
  })
}

// 删除仪表盘
export const deleteDashboard = async (id: string): Promise<DashboardResponse> => {
  return request({
    url: `/dashboards/${id}`,
    method: 'delete'
  })
}

// 发布仪表盘
export const publishDashboard = async (id: string): Promise<DashboardResponse> => {
  return request({
    url: `/dashboards/${id}/publish`,
    method: 'put'
  })
}

// 归档仪表盘
export const archiveDashboard = async (id: string): Promise<DashboardResponse> => {
  return request({
    url: `/dashboards/${id}`,
    method: 'put',
    data: {
      status: 'archived'
    }
  })
}

// 获取仪表盘详情
export const getDashboard = async (id: string): Promise<DashboardItem> => {
  const response = await getDashboardDetail(id)
  return response.data
}

// 检查权限
export const checkPermission = async (id: string, permission: string): Promise<boolean> => {
  try {
    const response = await request({
      url: `/dashboards/${id}/permissions/${permission}`,
      method: 'get'
    })
    return response.data
  } catch (error) {
    return false
  }
}

export default {
  getDashboardList,
  getDashboardDetail,
  getDashboard,
  checkPermission,
  createDashboard,
  updateDashboard,
  deleteDashboard,
  publishDashboard,
  archiveDashboard
} 