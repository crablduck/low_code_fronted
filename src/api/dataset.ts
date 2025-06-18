/*
 * @Author: Mr.Crab wei17306927526@gmail.com
 * @Date: 2025-05-30 09:13:33
 * @LastEditors: Mr.Crab wei17306927526@gmail.com
 * @LastEditTime: 2025-06-11 16:20:09
 * @FilePath: /workflow-system/src/api/dataset.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import { get } from '@/shared/utils/request'
import { dataSourceService } from '@/shared/utils/request'
import type { DataSet } from '@/shared/types/dataManagement'

// 获取数据集详情
export const getDatasetDetail = async (id: number) => {
  const response = await get(dataSourceService, `/api/datasets/${id}`)
  return response
}

// 获取数据集数据
export const getDatasetData = async (id: number, params: any = {}) => {
  // 注意：如果需要传递查询参数，可能需要调整 URL 或使用 POST 方法
  const queryString = new URLSearchParams(params).toString()
  const url = queryString ? `/api/datasets/${id}/data?${queryString}` : `/api/datasets/${id}/data`
  
  const response = await get(dataSourceService, url)
  return response
}

// 预览数据集数据（用于仪表盘图表渲染）  
export const previewDatasetData = async (datasetId: number) => {
  console.log(`预览数据集 ${datasetId} - 使用数据源服务 localhost:8080`)
  try {
    // 根据记忆，所有数据集API请求应该使用 get(dataSourceService, ...) 模式
    const response = await get(dataSourceService, `/api/datasets/${datasetId}/preview`)
    console.log(`数据集 ${datasetId} 预览响应:`, response)
    
    // 检查响应格式
    if (response && response.data) {
      console.log(`数据集 ${datasetId} 响应数据结构:`, response.data)
      if (response.data.content && Array.isArray(response.data.content)) {
        console.log(`数据集 ${datasetId} 包含 ${response.data.content.length} 条记录`)
        console.log(`数据集 ${datasetId} 数据样本:`, response.data.content.slice(0, 3))
      }
    }
    
    return response
  } catch (error) {
    console.error(`数据集 ${datasetId} 预览失败:`, error)
    throw error
  }
}

export default {
  getDatasetDetail,
  getDatasetData,
  previewDatasetData
}
