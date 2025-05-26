<template>
  <div class="api-test">
    <!-- 页面头部 -->
    <el-card class="header-card">
      <div class="header-content">
        <div class="title-section">
          <h2>🧪 API 接口测试中心</h2>
          <p>医疗工作流表单系统 Mock API 测试工具</p>
        </div>
        <div class="status-section">
          <el-tag :type="serverStatus === 'connected' ? 'success' : 'danger'" size="large">
            {{ serverStatus === 'connected' ? '服务器已连接' : '服务器未连接' }}
          </el-tag>
          <el-button @click="checkServerStatus" :loading="checking" type="primary" size="small">
            重新检测
          </el-button>
        </div>
      </div>
    </el-card>

    <!-- 快速测试区域 -->
    <el-card class="test-card">
      <template #header>
        <span>🚀 快速测试</span>
      </template>
      
      <el-row :gutter="20">
        <!-- 表单模板测试 -->
        <el-col :span="12">
          <el-card shadow="hover">
            <template #header>
              <span>📝 表单模板接口</span>
            </template>
            
            <el-space direction="vertical" style="width: 100%">
              <el-button @click="testGetTemplates" type="primary" :loading="loading.templates">
                获取模板列表
              </el-button>
              
              <el-button @click="testGetFullTemplate" type="success" :loading="loading.fullTemplate">
                获取完整模板 (ID: 1)
              </el-button>
              
              <el-button @click="testGenerateSQL" type="warning" :loading="loading.sql">
                生成SQL语句 (ID: 1)
              </el-button>
              
              <el-button @click="testGetStatistics" type="info" :loading="loading.statistics">
                获取统计信息 (ID: 1)
              </el-button>
            </el-space>
          </el-card>
        </el-col>

        <!-- 表单实例测试 -->
        <el-col :span="12">
          <el-card shadow="hover">
            <template #header>
              <span>📋 表单实例接口</span>
            </template>
            
            <el-space direction="vertical" style="width: 100%">
              <el-button @click="testGetInstances" type="primary" :loading="loading.instances">
                获取实例列表
              </el-button>
              
              <el-button @click="testGetFullInstance" type="success" :loading="loading.fullInstance">
                获取完整实例 (ID: 1)
              </el-button>
              
              <el-button @click="testSubmitForm" type="warning" :loading="loading.submit">
                提交测试表单
              </el-button>
            </el-space>
          </el-card>
        </el-col>
      </el-row>

      <!-- 基础数据测试 -->
      <el-row :gutter="20" style="margin-top: 20px">
        <el-col :span="8">
          <el-card shadow="hover">
            <template #header>
              <span>👥 用户接口</span>
            </template>
            <el-button @click="testGetUsers" type="primary" :loading="loading.users" style="width: 100%">
              获取用户列表
            </el-button>
          </el-card>
        </el-col>

        <el-col :span="8">
          <el-card shadow="hover">
            <template #header>
              <span>🏢 部门接口</span>
            </template>
            <el-button @click="testGetDepartments" type="primary" :loading="loading.departments" style="width: 100%">
              获取部门列表
            </el-button>
          </el-card>
        </el-col>

        <el-col :span="8">
          <el-card shadow="hover">
            <template #header>
              <span>📂 分类接口</span>
            </template>
            <el-button @click="testGetCategories" type="primary" :loading="loading.categories" style="width: 100%">
              获取分类列表
            </el-button>
          </el-card>
        </el-col>
      </el-row>
    </el-card>

    <!-- 测试结果显示 -->
    <el-card class="result-card" v-if="testResult">
      <template #header>
        <div class="card-header">
          <span>📊 测试结果</span>
          <el-button @click="clearResult" size="small">清空</el-button>
        </div>
      </template>
      
      <el-alert
        :title="testResult.title"
        :type="testResult.type"
        :description="testResult.description"
        show-icon
        style="margin-bottom: 15px"
      />
      
      <el-collapse v-if="testResult.data">
        <el-collapse-item title="响应数据" name="data">
          <pre class="json-display">{{ JSON.stringify(testResult.data, null, 2) }}</pre>
        </el-collapse-item>
      </el-collapse>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import {
  formTemplateApi,
  formInstanceApi,
  userApi,
  departmentApi,
  categoryApi,
  handleApiError
} from '@/api/formApi';

// 响应式数据
const serverStatus = ref('disconnected');
const checking = ref(false);

const loading = ref({
  templates: false,
  fullTemplate: false,
  sql: false,
  statistics: false,
  instances: false,
  fullInstance: false,
  submit: false,
  users: false,
  departments: false,
  categories: false
});

const testResult = ref(null);

// 检查服务器连接状态
const checkServerStatus = async () => {
  checking.value = true;
  try {
    await formTemplateApi.getTemplates({ _limit: 1 });
    serverStatus.value = 'connected';
    ElMessage.success('Mock服务器连接成功！');
  } catch (error) {
    serverStatus.value = 'disconnected';
    ElMessage.error('Mock服务器连接失败，请确保服务器已启动');
  } finally {
    checking.value = false;
  }
};

// 显示测试结果
const showResult = (title: string, type: string, data?: any, description?: string) => {
  testResult.value = {
    title,
    type,
    description: description || (type === 'success' ? '请求成功' : '请求失败'),
    data
  };
};

// 清空测试结果
const clearResult = () => {
  testResult.value = null;
};

// 测试获取模板列表
const testGetTemplates = async () => {
  loading.value.templates = true;
  try {
    const response = await formTemplateApi.getTemplates({ _limit: 10 });
    showResult('获取模板列表', 'success', response.data, `成功获取 ${response.data.length} 个模板`);
    ElMessage.success('获取模板列表成功');
  } catch (error) {
    const errorInfo = handleApiError(error);
    showResult('获取模板列表', 'error', errorInfo, errorInfo.message);
    ElMessage.error('获取模板列表失败');
  } finally {
    loading.value.templates = false;
  }
};

// 测试获取完整模板
const testGetFullTemplate = async () => {
  loading.value.fullTemplate = true;
  try {
    const response = await formTemplateApi.getFullTemplate(1);
    showResult('获取完整模板', 'success', response.data, `模板: ${response.data.name}, 字段数: ${response.data.fields?.length || 0}`);
    ElMessage.success('获取完整模板成功');
  } catch (error) {
    const errorInfo = handleApiError(error);
    showResult('获取完整模板', 'error', errorInfo, errorInfo.message);
    ElMessage.error('获取完整模板失败');
  } finally {
    loading.value.fullTemplate = false;
  }
};

// 测试生成SQL
const testGenerateSQL = async () => {
  loading.value.sql = true;
  try {
    const response = await formTemplateApi.generateSQL(1);
    showResult('生成SQL语句', 'success', response.data, `表名: ${response.data.tableName}`);
    ElMessage.success('生成SQL语句成功');
  } catch (error) {
    const errorInfo = handleApiError(error);
    showResult('生成SQL语句', 'error', errorInfo, errorInfo.message);
    ElMessage.error('生成SQL语句失败');
  } finally {
    loading.value.sql = false;
  }
};

// 测试获取统计信息
const testGetStatistics = async () => {
  loading.value.statistics = true;
  try {
    const response = await formTemplateApi.getStatistics(1);
    const stats = response.data.statistics;
    showResult('获取统计信息', 'success', response.data, 
      `总提交: ${stats.totalSubmissions}, 已完成: ${stats.completedSubmissions}`);
    ElMessage.success('获取统计信息成功');
  } catch (error) {
    const errorInfo = handleApiError(error);
    showResult('获取统计信息', 'error', errorInfo, errorInfo.message);
    ElMessage.error('获取统计信息失败');
  } finally {
    loading.value.statistics = false;
  }
};

// 测试获取实例列表
const testGetInstances = async () => {
  loading.value.instances = true;
  try {
    const response = await formInstanceApi.getInstances({ _limit: 10 });
    showResult('获取实例列表', 'success', response.data, `成功获取 ${response.data.length} 个实例`);
    ElMessage.success('获取实例列表成功');
  } catch (error) {
    const errorInfo = handleApiError(error);
    showResult('获取实例列表', 'error', errorInfo, errorInfo.message);
    ElMessage.error('获取实例列表失败');
  } finally {
    loading.value.instances = false;
  }
};

// 测试获取完整实例
const testGetFullInstance = async () => {
  loading.value.fullInstance = true;
  try {
    const response = await formInstanceApi.getFullInstance(1);
    showResult('获取完整实例', 'success', response.data, 
      `实例: ${response.data.instanceName}, 模板: ${response.data.template?.name}`);
    ElMessage.success('获取完整实例成功');
  } catch (error) {
    const errorInfo = handleApiError(error);
    showResult('获取完整实例', 'error', errorInfo, errorInfo.message);
    ElMessage.error('获取完整实例失败');
  } finally {
    loading.value.fullInstance = false;
  }
};

// 测试提交表单
const testSubmitForm = async () => {
  loading.value.submit = true;
  try {
    const testData = {
      templateId: 1,
      instanceName: `API测试表单_${Date.now()}`,
      submittedBy: 1,
      formData: {
        patientName: '测试患者',
        patientAge: '30',
        gender: 'male',
        phone: '13800138000',
        admissionDate: new Date().toISOString().split('T')[0]
      }
    };
    
    const response = await formInstanceApi.submit(testData);
    showResult('提交测试表单', 'success', response.data, 
      `成功创建实例 ID: ${response.data.instance?.id}`);
    ElMessage.success('提交测试表单成功');
  } catch (error) {
    const errorInfo = handleApiError(error);
    showResult('提交测试表单', 'error', errorInfo, errorInfo.message);
    ElMessage.error('提交测试表单失败');
  } finally {
    loading.value.submit = false;
  }
};

// 测试获取用户列表
const testGetUsers = async () => {
  loading.value.users = true;
  try {
    const response = await userApi.getUsers();
    showResult('获取用户列表', 'success', response.data, `成功获取 ${response.data.length} 个用户`);
    ElMessage.success('获取用户列表成功');
  } catch (error) {
    const errorInfo = handleApiError(error);
    showResult('获取用户列表', 'error', errorInfo, errorInfo.message);
    ElMessage.error('获取用户列表失败');
  } finally {
    loading.value.users = false;
  }
};

// 测试获取部门列表
const testGetDepartments = async () => {
  loading.value.departments = true;
  try {
    const response = await departmentApi.getDepartments();
    showResult('获取部门列表', 'success', response.data, `成功获取 ${response.data.length} 个部门`);
    ElMessage.success('获取部门列表成功');
  } catch (error) {
    const errorInfo = handleApiError(error);
    showResult('获取部门列表', 'error', errorInfo, errorInfo.message);
    ElMessage.error('获取部门列表失败');
  } finally {
    loading.value.departments = false;
  }
};

// 测试获取分类列表
const testGetCategories = async () => {
  loading.value.categories = true;
  try {
    const response = await categoryApi.getCategories();
    showResult('获取分类列表', 'success', response.data, `成功获取 ${response.data.length} 个分类`);
    ElMessage.success('获取分类列表成功');
  } catch (error) {
    const errorInfo = handleApiError(error);
    showResult('获取分类列表', 'error', errorInfo, errorInfo.message);
    ElMessage.error('获取分类列表失败');
  } finally {
    loading.value.categories = false;
  }
};

// 组件挂载时检查服务器状态
onMounted(() => {
  checkServerStatus();
});
</script>

<style scoped>
.api-test {
  padding: 20px;
}

.header-card {
  margin-bottom: 20px;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.title-section h2 {
  margin: 0 0 8px 0;
  color: #303133;
}

.title-section p {
  margin: 0;
  color: #909399;
  font-size: 14px;
}

.status-section {
  display: flex;
  align-items: center;
  gap: 12px;
}

.test-card {
  margin-bottom: 20px;
}

.result-card {
  margin-top: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.json-display {
  background-color: #f5f5f5;
  padding: 15px;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
  font-size: 12px;
  line-height: 1.4;
  max-height: 400px;
  overflow-y: auto;
  white-space: pre-wrap;
  word-break: break-all;
}

.el-space {
  width: 100%;
}

.el-button {
  width: 100%;
}
</style> 