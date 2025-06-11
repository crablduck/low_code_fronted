/*
 * @Author: Mr.Crab wei17306927526@gmail.com
 * @Date: 2025-05-28 10:12:59
 * @LastEditors: Mr.Crab wei17306927526@gmail.com
 * @LastEditTime: 2025-06-11 14:34:53
 * @FilePath: /workflow-system/src/api/dashboard.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import type { DashboardForm, DashboardQuery, DashboardResponse, DashboardListResponse, DashboardItem } from '@/types/dashboard'
import { mainService as request } from '@/utils/request'

// 获取仪表盘列表
export const getDashboardList = async (query: DashboardQuery): Promise<DashboardListResponse> => {
  console.log('=== 获取仪表盘列表 ===')
  console.log('使用真实API: localhost:6001')
  
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

  console.log('仪表盘列表响应:', response)

  // 真实API的数据结构
  return {
    code: response.code || 200,
    message: response.message || 'success',
    data: {
      list: (response.data?.items || response.data || []).map((item: any) => ({
        ...item,
        createTime: item.createdAt,
        updateTime: item.updatedAt
      })),
      total: response.data?.total || 0
    }
  }
}

// 获取仪表盘详情
export const getDashboardDetail = async (id: string): Promise<DashboardResponse> => {
  console.log('=== 获取仪表盘详情 ===')
  console.log('仪表盘ID:', id)
  console.log('使用真实API: localhost:6001')
  
  const response: any = await request({
    url: `/dashboards/${id}`,
    method: 'get'
  })
  
  console.log('API返回数据:', response)
  
  // 真实API的数据处理逻辑
  const dashboardData = response.data
  
  console.log('原始仪表盘数据:', dashboardData)
  
  // 根据您提供的真实API数据结构，API同时返回了顶层的layout和charts，以及config内的相同数据
  // 优先使用config字段中的数据（如果存在），否则使用顶层的数据
  let layoutData = []
  let chartsData = []
  
  // 优先使用config字段中的数据
  if (dashboardData.config && (dashboardData.config.layout || dashboardData.config.charts)) {
    console.log('使用config字段中的数据')
    layoutData = dashboardData.config.layout || []
    chartsData = dashboardData.config.charts || []
  } else {
    // 使用顶层的layout和charts数据
    console.log('使用顶层的layout和charts数据')
    layoutData = dashboardData.layout || []
    chartsData = dashboardData.charts || []
  }
  
  // 如果是字符串格式需要解析
  if (typeof layoutData === 'string') {
    try {
      layoutData = JSON.parse(layoutData)
    } catch (error) {
      console.error('解析layout失败:', error)
      layoutData = []
    }
  }
  
  if (typeof chartsData === 'string') {
    try {
      chartsData = JSON.parse(chartsData)
    } catch (error) {
      console.error('解析charts失败:', error)
      chartsData = []
    }
  }
  
  console.log('解析后的layout:', layoutData)
  console.log('解析后的charts:', chartsData)
  
  // 将图表配置合并到布局中
  const mergedLayout = layoutData.map((layoutItem: any) => {
    const chartConfig = chartsData.find((chart: any) => chart.id === layoutItem.i || chart.i === layoutItem.i)
    return {
      ...layoutItem,
      chartConfig: chartConfig || {
        id: layoutItem.i,
        i: layoutItem.i,
        type: 'bar',
        title: '未配置图表'
      }
    }
  })
  
  console.log('合并后的layout:', mergedLayout)
  
  return {
    code: response.code || 200,
    message: response.message || 'success',
    data: {
      ...dashboardData,
      layout: mergedLayout,
      charts: chartsData
    }
  }
}

// 创建仪表盘
export const createDashboard = async (data: DashboardForm): Promise<DashboardResponse> => {
  try {
    console.log('=== 创建仪表盘 ===')
    console.log('原始数据:', data)
    console.log('使用真实API: localhost:6001')
    
    // 真实API的数据处理逻辑
    console.log('原始layout类型:', typeof data.layout)
    console.log('原始layout内容:', data.layout)
    
    // 构建符合后端数据库结构的数据格式，分离布局和图表配置
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
      layout: JSON.stringify(pureLayout), // 纯布局信息
      charts: JSON.stringify(chartsConfig) // 图表配置信息
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
  console.log('使用真实API: localhost:6001')
  
  // 以下是真实API的数据处理逻辑
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