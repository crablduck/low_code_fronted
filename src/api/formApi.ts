import axios from 'axios';

// API基础配置
const API_BASE_URL = 'http://localhost:4000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    // 可以在这里添加认证token
    // const token = localStorage.getItem('token');
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`;
    // }
    console.log('🚀 API请求:', config.method?.toUpperCase(), config.url);
    return config;
  },
  (error) => {
    console.error('❌ 请求错误:', error);
    return Promise.reject(error);
  }
);

// 响应拦截器
api.interceptors.response.use(
  (response) => {
    console.log('✅ API响应:', response.status, response.config.url);
    
    // 如果后端返回的数据格式是 { code, message, data }，则提取 data 部分
    if (response.data && typeof response.data === 'object' && 'code' in response.data) {
      if (response.data.code === 200) {
        // 成功响应，返回 data 部分
        return {
          ...response,
          data: response.data.data
        };
      } else {
        // 业务错误，抛出异常
        const error = new Error(response.data.message || '请求失败');
        error.response = response;
        throw error;
      }
    }
    
    return response;
  },
  (error) => {
    console.error('❌ 响应错误:', error.response?.status, error.response?.data);
    return Promise.reject(error);
  }
);

// 表单模板相关接口
export const formTemplateApi = {
  // 获取模板列表
  getTemplates: (params?: {
    _page?: number;
    _limit?: number;
    _sort?: string;
    _order?: 'asc' | 'desc';
    status?: string;
    category?: string;
    q?: string;
  }) => api.get('/form_templates', { params }),

  // 获取单个模板
  getTemplate: (id: number) => api.get(`/form_templates/${id}`),

  // 获取完整模板（包含字段和选项）
  getFullTemplate: (id: number) => api.get(`/form-templates/${id}/full`),

  // 创建模板
  createTemplate: (data: any) => api.post('/form_templates', data),

  // 更新模板
  updateTemplate: (id: number, data: any) => api.put(`/form_templates/${id}`, data),

  // 删除模板
  deleteTemplate: (id: number) => api.delete(`/form_templates/${id}`),

  // 保存表单设计（创建模板和字段）
  saveDesign: (data: {
    template: {
      name: string;
      description?: string;
      category?: string;
      status?: 'draft' | 'published' | 'archived';
      createdBy: number;
    };
    fields: Array<{
      fieldName: string;
      fieldLabel: string;
      fieldType: string;
      dataType: string;
      required?: boolean;
      placeholder?: string;
      defaultValue?: any;
      validation?: any;
      props?: any;
      options?: Array<{ label: string; value: string | number }>;
    }>;
  }) => api.post('/form-templates/design', data),

  // 生成SQL建表语句
  generateSQL: (id: number) => api.get(`/form-templates/${id}/sql`),

  // 获取统计信息
  getStatistics: (id: number) => api.get(`/form-templates/${id}/statistics`),

  // 发布模板
  publishTemplate: (id: number) => api.patch(`/form_templates/${id}`, {
    status: 'published',
    publishedAt: new Date().toISOString()
  }),

  // 归档模板
  archiveTemplate: (id: number) => api.patch(`/form_templates/${id}`, {
    status: 'archived'
  }),
};

// 表单字段相关接口
export const formFieldApi = {
  // 获取模板的所有字段
  getFieldsByTemplate: (templateId: number) => 
    api.get('/form_fields', { params: { templateId, _sort: 'sortOrder', _order: 'asc' } }),

  // 创建字段
  createField: (data: any) => api.post('/form_fields', data),

  // 更新字段
  updateField: (id: number, data: any) => api.put(`/form_fields/${id}`, data),

  // 删除字段
  deleteField: (id: number) => api.delete(`/form_fields/${id}`),

  // 批量更新字段排序
  updateFieldsOrder: (fields: Array<{ id: number; sortOrder: number }>) => {
    return Promise.all(
      fields.map(field => api.patch(`/form_fields/${field.id}`, { sortOrder: field.sortOrder }))
    );
  },
};

// 字段选项相关接口
export const fieldOptionApi = {
  // 获取字段的所有选项
  getOptionsByField: (fieldId: number) => 
    api.get('/field_options', { params: { fieldId, _sort: 'sortOrder', _order: 'asc' } }),

  // 创建选项
  createOption: (data: any) => api.post('/field_options', data),

  // 更新选项
  updateOption: (id: number, data: any) => api.put(`/field_options/${id}`, data),

  // 删除选项
  deleteOption: (id: number) => api.delete(`/field_options/${id}`),

  // 批量创建选项
  createOptions: (fieldId: number, options: Array<{ label: string; value: string | number }>) => {
    return Promise.all(
      options.map((option, index) => 
        api.post('/field_options', {
          fieldId,
          ...option,
          sortOrder: index + 1,
          createdAt: new Date().toISOString()
        })
      )
    );
  },
};

// 表单实例相关接口
export const formInstanceApi = {
  // 获取实例列表
  getInstances: (params?: {
    _page?: number;
    _limit?: number;
    _sort?: string;
    _order?: 'asc' | 'desc';
    templateId?: number;
    status?: string;
    submittedBy?: number;
  }) => api.get('/form_instances', { params }),

  // 获取单个实例
  getInstance: (id: number) => api.get(`/form_instances/${id}`),

  // 获取完整实例（包含模板和数据）
  getFullInstance: (id: number) => api.get(`/form-instances/${id}/full`),

  // 提交表单实例
  submit: (data: {
    templateId: number;
    instanceName?: string;
    submittedBy: number;
    formData: Record<string, any>;
  }) => api.post('/form-instances', data),

  // 更新实例
  updateInstance: (id: number, data: any) => api.put(`/form_instances/${id}`, data),

  // 删除实例
  deleteInstance: (id: number) => api.delete(`/form_instances/${id}`),

  // 获取实例的表单数据
  getInstanceData: (instanceId: number) => 
    api.get('/form_data', { params: { instanceId } }),
};

// 表单数据相关接口
export const formDataApi = {
  // 获取数据列表
  getData: (params?: any) => api.get('/form_data', { params }),

  // 创建数据
  createData: (data: any) => api.post('/form_data', data),

  // 更新数据
  updateData: (id: number, data: any) => api.put(`/form_data/${id}`, data),

  // 删除数据
  deleteData: (id: number) => api.delete(`/form_data/${id}`),
};

// 用户相关接口
export const userApi = {
  // 获取用户列表
  getUsers: (params?: any) => api.get('/users', { params }),

  // 获取单个用户
  getUser: (id: number) => api.get(`/users/${id}`),

  // 创建用户
  createUser: (data: any) => api.post('/users', data),

  // 更新用户
  updateUser: (id: number, data: any) => api.put(`/users/${id}`, data),

  // 删除用户
  deleteUser: (id: number) => api.delete(`/users/${id}`),
};

// 表单分类相关接口
export const categoryApi = {
  // 获取分类列表
  getCategories: () => api.get('/form_categories'),

  // 获取单个分类
  getCategory: (id: number) => api.get(`/form_categories/${id}`),

  // 创建分类
  createCategory: (data: any) => api.post('/form_categories', data),

  // 更新分类
  updateCategory: (id: number, data: any) => api.put(`/form_categories/${id}`, data),

  // 删除分类
  deleteCategory: (id: number) => api.delete(`/form_categories/${id}`),
};

// 部门相关接口
export const departmentApi = {
  // 获取部门列表
  getDepartments: () => api.get('/departments'),

  // 获取单个部门
  getDepartment: (id: number) => api.get(`/departments/${id}`),

  // 创建部门
  createDepartment: (data: any) => api.post('/departments', data),

  // 更新部门
  updateDepartment: (id: number, data: any) => api.put(`/departments/${id}`, data),

  // 删除部门
  deleteDepartment: (id: number) => api.delete(`/departments/${id}`),
};

// 工作流相关接口
export const workflowApi = {
  // 获取工作流列表
  getWorkflows: (params?: any) => api.get('/workflows', { params }),

  // 获取单个工作流
  getWorkflow: (id: number) => api.get(`/workflows/${id}`),

  // 创建工作流
  createWorkflow: (data: any) => api.post('/workflows', data),

  // 更新工作流
  updateWorkflow: (id: number, data: any) => api.put(`/workflows/${id}`, data),

  // 删除工作流
  deleteWorkflow: (id: number) => api.delete(`/workflows/${id}`),

  // 获取工作流节点
  getWorkflowNodes: (workflowId: number) => 
    api.get('/workflow_nodes', { params: { workflowId } }),

  // 获取工作流连线
  getWorkflowEdges: (workflowId: number) => 
    api.get('/workflow_edges', { params: { workflowId } }),
};

// 统一导出
export default {
  formTemplate: formTemplateApi,
  formField: formFieldApi,
  fieldOption: fieldOptionApi,
  formInstance: formInstanceApi,
  formData: formDataApi,
  user: userApi,
  category: categoryApi,
  department: departmentApi,
  workflow: workflowApi,
};

// 导出类型定义
export interface ApiResponse<T = any> {
  data: T;
  status: number;
  statusText: string;
  headers?: any;
}

export interface PaginatedResponse<T = any> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

// 错误处理工具函数
export const handleApiError = (error: any) => {
  if (error.response) {
    // 服务器响应错误
    const { status, data } = error.response;
    console.error(`API错误 ${status}:`, data);
    return {
      message: data.message || data.error || '服务器错误',
      status,
      data
    };
  } else if (error.request) {
    // 网络错误
    console.error('网络错误:', error.request);
    return {
      message: '网络连接失败，请检查网络设置',
      status: 0,
      data: null
    };
  } else {
    // 其他错误
    console.error('未知错误:', error.message);
    return {
      message: error.message || '未知错误',
      status: -1,
      data: null
    };
  }
}; 