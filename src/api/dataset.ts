/*
 * @Author: Mr.Crab wei17306927526@gmail.com
 * @Date: 2025-05-30 09:13:33
 * @LastEditors: Mr.Crab wei17306927526@gmail.com
 * @LastEditTime: 2025-06-11 12:35:41
 * @FilePath: /workflow-system/src/api/dataset.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import { get } from '@/utils/request'
import { dataSourceService } from '@/utils/request'
import type { DataSet } from '@/types/dataManagement'

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
  const response = await get(dataSourceService, `/api/datasets/${datasetId}/preview`)
  return response
}

export default {
  getDatasetDetail,
  getDatasetData,
  previewDatasetData
}
