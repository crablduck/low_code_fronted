import type { DatasetResponse, DatasetData } from '@/types/dataset'
import request from '@/utils/request'

// 获取数据集详情
export const getDatasetDetail = async (id: number): Promise<DatasetResponse> => {
  return request({
    url: `/datasets/${id}`,
    method: 'get'
  })
}

// 获取数据集数据
export const getDatasetData = async (id: number, params: any = {}): Promise<DatasetData> => {
  return request({
    url: `/datasets/${id}/data`,
    method: 'get',
    params
  })
}

export default {
  getDatasetDetail,
  getDatasetData
}
