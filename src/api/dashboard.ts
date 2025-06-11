/*
 * @Author: Mr.Crab wei17306927526@gmail.com
 * @Date: 2025-05-28 10:12:59
 * @LastEditors: Mr.Crab wei17306927526@gmail.com
 * @LastEditTime: 2025-06-11 14:34:53
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
  const response: any = await request({
    url: `/dashboards/${id}`,
    method: 'get'
  })
  
  console.log('=== 获取仪表盘详情 ===')
  console.log('仪表盘ID:', id)
  console.log('API返回数据:', response)
  
  const dashboardData = response.data
  
  // 关键：重新组装布局和图表配置
  let layoutData = []
  let chartsData = []
  
  // 解析layout和charts字段
  try {
    layoutData = typeof dashboardData.layout === 'string' 
      ? JSON.parse(dashboardData.layout) 
      : (dashboardData.layout || [])
  } catch (error) {
    console.error('解析layout失败:', error)
    layoutData = []
  }
  
  try {
    chartsData = typeof dashboardData.charts === 'string' 
      ? JSON.parse(dashboardData.charts) 
      : (dashboardData.charts || [])
  } catch (error) {
    console.error('解析charts失败:', error)
    chartsData = []
  }
  
  console.log('数据库中的layout字段:', layoutData)
  console.log('数据库中的charts字段:', chartsData)
  
  // 重新组装：将图表配置合并到布局中
  const combinedLayout = layoutData.map((layoutItem: any) => {
    // 查找对应的图表配置
    const chartConfig = chartsData.find((chart: any) => chart.id === layoutItem.i)
    
    return {
      ...layoutItem,
      chartConfig: chartConfig || null
    }
  })
  
  console.log('重新组装的layout:', combinedLayout)
  
  return {
    code: response.code,
    message: response.message,
    data: {
      ...dashboardData,
      layout: JSON.stringify(combinedLayout)
    }
  }
}

// 创建仪表盘
export const createDashboard = async (data: DashboardForm): Promise<DashboardResponse> => {
  try {
    console.log('=== 创建仪表盘 ===')
    console.log('原始数据:', data)
    console.log('原始layout类型:', typeof data.layout)
    console.log('原始layout内容:', data.layout)
    
    // 关键：构建符合后端数据库结构的数据格式，分离布局和图表配置
    let layoutData: any = data.layout
    
    // 如果layout是字符串，尝试解析为数组
    if (typeof layoutData === 'string') {
      try {
        layoutData = JSON.parse(layoutData)
      } catch (error) {
        console.error('解析layout字符串失败:', error)
        layoutData = []
      }
    }
    
    // 分离布局信息和图表配置
    const pureLayout: any[] = []
    const chartsConfig: any[] = []
    
    layoutData.forEach((item: any) => {
      // 布局信息：只保留位置和尺寸
      pureLayout.push({
        x: item.x,
        y: item.y,
        w: item.w,
        h: item.h,
        i: item.i
      })
      
      // 图表配置：保存完整的chartConfig
      if (item.chartConfig) {
        chartsConfig.push({
          id: item.i, // 使用布局项的i作为关联ID
          ...item.chartConfig
        })
      }
    })
    
    const requestData = {
      name: data.name,
      description: data.description,
      status: data.status,
      type: data.type,
      layout: JSON.stringify(pureLayout), // 🔥 纯布局信息
      charts: JSON.stringify(chartsConfig) // 🔥 图表配置信息
    }
    
         console.log('处理后的layout数据:', layoutData)
     console.log('分离后的纯布局:', pureLayout)
     console.log('分离后的图表配置:', chartsConfig)
     console.log('发送到API的数据:', requestData)
    
    const response: any = await request({
      url: '/dashboards',
      method: 'post',
      data: requestData
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
  console.log('=== 更新仪表盘 ===')
  console.log('仪表盘ID:', id)
  console.log('原始数据:', data)
  
  // 关键：构建符合API文档的数据结构
  let requestData: any = {
    name: data.name,
    description: data.description,
    status: data.status,
    type: data.type
  }
  
  // 如果有layout数据，分离更新layout和charts字段
  if (data.layout) {
    console.log('更新时的layout数据:', data.layout)
    console.log('更新时layout类型:', typeof data.layout)
    
    let layoutData: any = data.layout
    
    // 如果layout是字符串，尝试解析为数组
    if (typeof layoutData === 'string') {
      try {
        layoutData = JSON.parse(layoutData)
      } catch (error) {
        console.error('解析layout字符串失败:', error)
        layoutData = []
      }
    }
    
    // 分离布局信息和图表配置
    const pureLayout: any[] = []
    const chartsConfig: any[] = []
    
    layoutData.forEach((item: any) => {
      // 布局信息：只保留位置和尺寸
      pureLayout.push({
        x: item.x,
        y: item.y,
        w: item.w,
        h: item.h,
        i: item.i
      })
      
      // 图表配置：保存完整的chartConfig
      if (item.chartConfig) {
        chartsConfig.push({
          id: item.i, // 使用布局项的i作为关联ID
          ...item.chartConfig
        })
      }
    })
    
    requestData.layout = JSON.stringify(pureLayout) // 🔥 纯布局信息
    requestData.charts = JSON.stringify(chartsConfig) // 🔥 图表配置信息
    
    console.log('更新时分离后的纯布局:', pureLayout)
    console.log('更新时分离后的图表配置:', chartsConfig)
  }
  
  console.log('发送到API的数据:', requestData)
  
  return request({
    url: `/dashboards/${id}`,
    method: 'put',
    data: requestData
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