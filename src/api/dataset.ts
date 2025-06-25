/*
 * @Author: Mr.Crab wei17306927526@gmail.com
 * @Date: 2025-05-30 09:13:33
 * @LastEditors: KrabWW wei17306927526@gmail.com
 * @LastEditTime: 2025-06-24 15:39:20
 * @FilePath: /workflow-system/src/api/dataset.ts
 * @Description: 数据集API接口 - 根据API使用指南文档规范实现
 */
import { get, post } from '@/shared/utils/request'
import { dataSourceService } from '@/shared/utils/request'
import type { DataSet } from '@/shared/types/dataManagement'

// 获取当前用户ID的辅助函数
const getCurrentUserId = () => {
  // 从localStorage或用户store获取用户ID
  return localStorage.getItem('userId') || 'anonymous'
}

// 创建带用户ID头部的请求配置
const createRequestConfig = () => {
  return {
    headers: {
      'X-User-ID': getCurrentUserId()
    }
  }
}

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

// 智能预览数据集数据（推荐使用）
export const smartPreviewDataset = async (datasetId: number, options?: {
  filters?: Array<{
    fieldName: string;
    operator: string;
    value: any;
  }>;
  selectedFieldNames?: string[];
  dimensionsOnly?: boolean;
  metricsOnly?: boolean;
  limit?: number;
}) => {
  console.log(`智能预览数据集 ${datasetId}:`, options)
  try {
    const response = await post(dataSourceService, `/api/datasets/${datasetId}/smart-preview`, {
      filters: options?.filters || [],
      selectedFieldNames: options?.selectedFieldNames,
      dimensionsOnly: options?.dimensionsOnly,
      metricsOnly: options?.metricsOnly,
      limit: options?.limit || 100
    })
    
    console.log(`数据集 ${datasetId} 智能预览响应:`, response)
    return response
  } catch (error) {
    console.error(`数据集 ${datasetId} 智能预览失败:`, error)
    throw error
  }
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

// 获取数据集字段的去重值（用于全局筛选器选项）
export const getDatasetFieldDistinctValues = async (datasetId: number, fieldName: string, filters?: Record<string, any>) => {
  try {
    // 构建查询参数
    const queryParams: any = {
      field: fieldName
    }
    
    // 如果有级联筛选条件，添加到参数中
    if (filters) {
      Object.keys(filters).forEach(key => {
        if (filters[key] !== null && filters[key] !== undefined) {
          queryParams[`filter_${key}`] = filters[key]
        }
      })
    }
    
    const queryString = new URLSearchParams(queryParams).toString()
    const url = `/api/datasets/${datasetId}/distinct-values?${queryString}`
    
    console.log(`获取数据集 ${datasetId} 字段 ${fieldName} 的去重值`)
    const response = await get(dataSourceService, url)
    
    if (response && response.data) {
      console.log(`字段 ${fieldName} 的去重值:`, response.data)
      return response
    }
    
    return response
  } catch (error) {
    console.error(`获取字段 ${fieldName} 去重值失败:`, error)
    throw error
  }
}

// ========== 根据API使用指南文档的接口定义 ==========

// 单数据源预览接口 - 根据文档规范
export interface DatasetPreviewRequest {
  dataSourceId: number;
  tableName: string;
  fields: Array<{
    fieldName: string;
    fieldType: "dimension" | "metric";
    isCalculated: boolean;
    expression?: string;
    aggregation?: "sum" | "count" | "avg" | "max" | "min";
  }>;
  filters?: Array<{
    fieldName: string;  // 注意：文档中使用 fieldName 而不是 field
    operator: "eq" | "gt" | "lt" | "in" | "like";
    value: any;
  }>;
  limit?: number;
}

// 跨数据源预览接口 - 根据文档规范
export interface CrossSourcePreviewRequest {
  dataSourceIds: number[];
  tables: Array<{
    tableName: string;
    dataSourceId: number;
    alias: string;
  }>;
  relations: Array<{
    leftTable: string;
    leftField: string;
    rightTable: string;
    rightField: string;
    joinType: "LEFT" | "RIGHT" | "INNER" | "FULL";
  }>;
  fields: Array<{
    fieldName: string;
    tableName: string;
    fieldType: "dimension" | "metric";
    aggregation?: "sum" | "count" | "avg" | "max" | "min";
  }>;
  filters?: Array<{
    fieldName: string;
    operator: "eq" | "gt" | "lt" | "in" | "like";
    value: any;
  }>;
  limit?: number;
}

// 计算字段验证请求 - 根据文档规范
export interface CalculatedFieldValidationRequest {
  expression: string;
  availableFields: string[];
  dataSourceId: number;
  tableName?: string;
}

// 计算字段预览请求 - 根据文档规范  
export interface CalculatedFieldPreviewRequest {
  expression: string;
  fieldName: string;
  tableName: string;
  dataSourceId: number;
  limit?: number;
}

// 数据集保存请求 - 简化版本
export interface DatasetSaveRequest {
  name: string;
  description?: string;
  category?: string;
  
  // 复用现有查询类型
  queryType: "single" | "multi" | "sql";
  dataSourceId?: number;
  dataSourceIds?: number[];
  tableName?: string;
  tables?: string[];
  relations?: any[]; // 复用后端TableRelation结构
  
  // 复用现有字段结构
  fields: any[]; // 复用后端DataSetField结构
  calculatedFields?: any[]; // 复用后端CalculatedField结构
}

// ========== API调用方法 - 根据文档规范 ==========

// 单数据源预览API - 根据文档规范
export const datasetPreview = async (data: DatasetPreviewRequest) => {
  console.log('🔍 调用单数据源预览接口:', data)
  try {
    const response = await post(dataSourceService, '/api/datasets/preview', data);
    console.log('✅ 单数据源预览API响应:', response)
    return response
  } catch (error) {
    console.error('❌ 单数据源预览API失败:', error)
    throw error
  }
};

// 跨数据源预览API - 根据文档规范
export const crossSourcePreview = async (data: CrossSourcePreviewRequest) => {
  console.log('🔍 调用跨数据源预览接口:', data)
  try {
    const response = await post(dataSourceService, '/api/datasets/preview-cross-source', data);
    console.log('✅ 跨数据源预览API响应:', response)
    return response
  } catch (error) {
    console.error('❌ 跨数据源预览API失败:', error)
    throw error
  }
};

// 计算字段验证API - 根据文档规范
export const validateCalculatedField = async (data: CalculatedFieldValidationRequest) => {
  console.log('🔍 调用计算字段验证接口:', data)
  try {
    const response = await post(dataSourceService, '/api/datasets/validate-calculated-field', data);
    console.log('✅ 计算字段验证API响应:', response)
    return response
  } catch (error) {
    console.error('❌ 计算字段验证API失败:', error)
    throw error
  }
};

// 计算字段预览API - 根据文档规范
export const previewCalculatedField = async (data: CalculatedFieldPreviewRequest) => {
  console.log('🔍 调用计算字段预览接口:', data)
  try {
    const response = await post(dataSourceService, '/api/datasets/preview-calculated-field', data);
    console.log('✅ 计算字段预览API响应:', response)
    return response
  } catch (error) {
    console.error('❌ 计算字段预览API失败:', error)
    throw error
  }
};

// 数据集保存API
export const saveDataset = async (data: DatasetSaveRequest) => {
  console.log('🔍 调用数据集保存接口:', data)
  try {
    const response = await post(dataSourceService, '/api/datasets', data);
    console.log('✅ 数据集保存API响应:', response)
    return response
  } catch (error) {
    console.error('❌ 数据集保存API失败:', error)
    throw error
  }
};

export default {
  getDatasetDetail,
  getDatasetData,
  previewDatasetData,
  smartPreviewDataset,
  getDatasetFieldDistinctValues,
  // 新增的API方法
  datasetPreview,
  crossSourcePreview,
  validateCalculatedField,
  previewCalculatedField,
  saveDataset
}
