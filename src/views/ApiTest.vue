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
            <el-icon><Connection /></el-icon>
            {{ serverStatus === 'connected' ? '服务器已连接' : '服务器未连接' }}
          </el-tag>
          <el-button @click="checkServerStatus" :loading="checking" type="primary" size="small">
            重新检测
          </el-button>
        </div>
      </div>
      
      <!-- 服务器信息 -->
      <el-divider />
      <div class="server-info">
        <el-descriptions :column="4" size="small">
          <el-descriptions-item label="API地址">http://localhost:3003/api</el-descriptions-item>
          <el-descriptions-item label="服务状态">
            <el-tag :type="serverStatus === 'connected' ? 'success' : 'danger'" size="small">
              {{ serverStatus === 'connected' ? '在线' : '离线' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="测试次数">{{ testCount }}</el-descriptions-item>
          <el-descriptions-item label="成功率">
            <el-tag :type="successRate >= 80 ? 'success' : successRate >= 60 ? 'warning' : 'danger'" size="small">
              {{ successRate.toFixed(1) }}%
            </el-tag>
          </el-descriptions-item>
        </el-descriptions>
      </div>
    </el-card>

    <!-- 功能选项卡 -->
    <el-card class="main-card">
      <el-tabs v-model="activeTab" type="border-card">
        <!-- 快速测试 -->
        <el-tab-pane label="🚀 快速测试" name="quick">
          <div class="quick-test">
            <el-row :gutter="20">
              <!-- 表单模板测试 -->
              <el-col :span="12">
                <el-card shadow="hover" class="test-group">
                  <template #header>
                    <div class="group-header">
                      <span>📝 表单模板接口</span>
                      <el-button @click="testAllTemplateApis" size="small" type="primary" :loading="loading.allTemplate">
                        全部测试
                      </el-button>
                    </div>
                  </template>
                  
                  <el-space direction="vertical" style="width: 100%">
                    <el-button @click="testGetTemplates" type="primary" :loading="loading.templates" class="test-btn">
                      <el-icon><List /></el-icon>
                      获取模板列表
                    </el-button>
                    
                    <el-button @click="testGetFullTemplate" type="success" :loading="loading.fullTemplate" class="test-btn">
                      <el-icon><Document /></el-icon>
                      获取完整模板 (ID: 1)
                    </el-button>
                    
                    <el-button @click="testGenerateSQL" type="warning" :loading="loading.sql" class="test-btn">
                      <el-icon><DataBase /></el-icon>
                      生成SQL语句 (ID: 1)
                    </el-button>
                    
                    <el-button @click="testGetStatistics" type="info" :loading="loading.statistics" class="test-btn">
                      <el-icon><PieChart /></el-icon>
                      获取统计信息 (ID: 1)
                    </el-button>
                  </el-space>
                </el-card>
              </el-col>

              <!-- 表单实例测试 -->
              <el-col :span="12">
                <el-card shadow="hover" class="test-group">
                  <template #header>
                    <div class="group-header">
                      <span>📋 表单实例接口</span>
                      <el-button @click="testAllInstanceApis" size="small" type="primary" :loading="loading.allInstance">
                        全部测试
                      </el-button>
                    </div>
                  </template>
                  
                  <el-space direction="vertical" style="width: 100%">
                    <el-button @click="testGetInstances" type="primary" :loading="loading.instances" class="test-btn">
                      <el-icon><List /></el-icon>
                      获取实例列表
                    </el-button>
                    
                    <el-button @click="testGetFullInstance" type="success" :loading="loading.fullInstance" class="test-btn">
                      <el-icon><Document /></el-icon>
                      获取完整实例 (ID: 1)
                    </el-button>
                    
                    <el-button @click="testSubmitForm" type="warning" :loading="loading.submit" class="test-btn">
                      <el-icon><Plus /></el-icon>
                      提交测试表单
                    </el-button>
                  </el-space>
                </el-card>
              </el-col>
            </el-row>

            <!-- 基础数据测试 -->
            <el-row :gutter="20" style="margin-top: 20px">
              <el-col :span="8">
                <el-card shadow="hover" class="test-group">
                  <template #header>
                    <span>👥 用户接口</span>
                  </template>
                  <el-button @click="testGetUsers" type="primary" :loading="loading.users" class="test-btn full-width">
                    <el-icon><User /></el-icon>
                    获取用户列表
                  </el-button>
                </el-card>
              </el-col>

              <el-col :span="8">
                <el-card shadow="hover" class="test-group">
                  <template #header>
                    <span>🏢 部门接口</span>
                  </template>
                  <el-button @click="testGetDepartments" type="primary" :loading="loading.departments" class="test-btn full-width">
                    <el-icon><OfficeBuilding /></el-icon>
                    获取部门列表
                  </el-button>
                </el-card>
              </el-col>

              <el-col :span="8">
                <el-card shadow="hover" class="test-group">
                  <template #header>
                    <span>📂 分类接口</span>
                  </template>
                  <el-button @click="testGetCategories" type="primary" :loading="loading.categories" class="test-btn full-width">
                    <el-icon><Folder /></el-icon>
                    获取分类列表
                  </el-button>
                </el-card>
              </el-col>
            </el-row>

            <!-- 批量测试 -->
            <el-row style="margin-top: 20px">
              <el-col :span="24">
                <el-card shadow="hover" class="test-group">
                  <template #header>
                    <span>⚡ 批量测试</span>
                  </template>
                  <el-space>
                    <el-button @click="testAllApis" type="danger" :loading="loading.all" size="large">
                      <el-icon><Lightning /></el-icon>
                      测试所有接口
                    </el-button>
                    <el-button @click="performanceTest" type="warning" :loading="loading.performance">
                      <el-icon><Stopwatch /></el-icon>
                      性能测试
                    </el-button>
                    <el-button @click="clearAllResults" type="info">
                      <el-icon><Delete /></el-icon>
                      清空结果
                    </el-button>
                  </el-space>
                </el-card>
              </el-col>
            </el-row>
          </div>
        </el-tab-pane>

        <!-- 自定义测试 -->
        <el-tab-pane label="🔧 自定义测试" name="custom">
          <div class="custom-test">
            <el-row :gutter="20">
              <el-col :span="12">
                <el-card shadow="hover">
                  <template #header>
                    <span>🛠️ 自定义请求</span>
                  </template>
                  
                  <el-form :model="customRequest" label-width="80px">
                    <el-form-item label="请求方法">
                      <el-select v-model="customRequest.method" style="width: 100%">
                        <el-option label="GET" value="GET" />
                        <el-option label="POST" value="POST" />
                        <el-option label="PUT" value="PUT" />
                        <el-option label="DELETE" value="DELETE" />
                        <el-option label="PATCH" value="PATCH" />
                      </el-select>
                    </el-form-item>
                    
                    <el-form-item label="请求URL">
                      <el-input v-model="customRequest.url" placeholder="/api/form_templates" />
                    </el-form-item>
                    
                    <el-form-item label="请求头" v-if="customRequest.method !== 'GET'">
                      <el-input
                        v-model="customRequest.headers"
                        type="textarea"
                        :rows="3"
                        placeholder='{"Content-Type": "application/json"}'
                      />
                    </el-form-item>
                    
                    <el-form-item label="请求体" v-if="customRequest.method !== 'GET'">
                      <el-input
                        v-model="customRequest.body"
                        type="textarea"
                        :rows="6"
                        placeholder='{"name": "测试表单", "description": "这是一个测试"}'
                      />
                    </el-form-item>
                    
                    <el-form-item>
                      <el-button @click="sendCustomRequest" type="primary" :loading="loading.custom">
                        <el-icon><Send /></el-icon>
                        发送请求
                      </el-button>
                      <el-button @click="resetCustomRequest">
                        <el-icon><Refresh /></el-icon>
                        重置
                      </el-button>
                    </el-form-item>
                  </el-form>
                </el-card>
              </el-col>
              
              <el-col :span="12">
                <el-card shadow="hover">
                  <template #header>
                    <span>📋 常用请求模板</span>
                  </template>
                  
                  <el-space direction="vertical" style="width: 100%">
                    <el-button @click="loadTemplate('getTemplates')" type="primary" plain class="template-btn">
                      获取表单模板列表
                    </el-button>
                    <el-button @click="loadTemplate('createTemplate')" type="success" plain class="template-btn">
                      创建表单模板
                    </el-button>
                    <el-button @click="loadTemplate('submitInstance')" type="warning" plain class="template-btn">
                      提交表单实例
                    </el-button>
                    <el-button @click="loadTemplate('updateTemplate')" type="info" plain class="template-btn">
                      更新表单模板
                    </el-button>
                  </el-space>
                </el-card>
              </el-col>
            </el-row>
          </div>
        </el-tab-pane>

        <!-- 测试历史 -->
        <el-tab-pane label="📊 测试历史" name="history">
          <div class="test-history">
            <el-row :gutter="20">
              <el-col :span="24">
                <el-card shadow="hover">
                  <template #header>
                    <div class="history-header">
                      <span>📈 测试统计</span>
                      <el-button @click="clearHistory" size="small" type="danger">
                        清空历史
                      </el-button>
                    </div>
                  </template>
                  
                  <el-row :gutter="20">
                    <el-col :span="6">
                      <el-statistic title="总测试次数" :value="testHistory.length" />
                    </el-col>
                    <el-col :span="6">
                      <el-statistic title="成功次数" :value="successCount" />
                    </el-col>
                    <el-col :span="6">
                      <el-statistic title="失败次数" :value="failureCount" />
                    </el-col>
                    <el-col :span="6">
                      <el-statistic title="成功率" :value="successRate" suffix="%" />
                    </el-col>
                  </el-row>
                </el-card>
              </el-col>
            </el-row>
            
            <el-row style="margin-top: 20px">
              <el-col :span="24">
                <el-card shadow="hover">
                  <template #header>
                    <span>📋 测试记录</span>
                  </template>
                  
                  <el-table :data="paginatedHistory" style="width: 100%" max-height="400">
                    <el-table-column prop="timestamp" label="时间" width="180">
                      <template #default="{ row }">
                        {{ formatTime(row.timestamp) }}
                      </template>
                    </el-table-column>
                    <el-table-column prop="api" label="接口" width="200" />
                    <el-table-column prop="method" label="方法" width="80">
                      <template #default="{ row }">
                        <el-tag :type="getMethodType(row.method)" size="small">{{ row.method }}</el-tag>
                      </template>
                    </el-table-column>
                    <el-table-column prop="status" label="状态" width="100">
                      <template #default="{ row }">
                        <el-tag :type="row.success ? 'success' : 'danger'" size="small">
                          {{ row.success ? '成功' : '失败' }}
                        </el-tag>
                      </template>
                    </el-table-column>
                    <el-table-column prop="duration" label="耗时" width="100">
                      <template #default="{ row }">
                        {{ row.duration }}ms
                      </template>
                    </el-table-column>
                    <el-table-column prop="response" label="响应" show-overflow-tooltip />
                  </el-table>
                  
                  <el-pagination
                    v-if="testHistory.length > 10"
                    v-model:current-page="currentPage"
                    :page-size="10"
                    :total="testHistory.length"
                    layout="prev, pager, next"
                    style="margin-top: 20px; text-align: center"
                  />
                </el-card>
              </el-col>
            </el-row>
          </div>
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <!-- 测试结果显示 -->
    <el-card class="result-card" v-if="testResult">
      <template #header>
        <div class="card-header">
          <span>📊 测试结果</span>
          <div>
            <el-button @click="copyResult" size="small" type="primary">
              <el-icon><CopyDocument /></el-icon>
              复制
            </el-button>
            <el-button @click="clearResult" size="small">
              <el-icon><Close /></el-icon>
              关闭
            </el-button>
          </div>
        </div>
      </template>
      
      <el-alert
        :title="testResult.title"
        :type="testResult.type"
        :description="testResult.description"
        show-icon
        style="margin-bottom: 15px"
      />
      
      <el-tabs v-if="testResult.data" type="border-card">
        <el-tab-pane label="📄 响应数据" name="response">
          <div class="json-container">
            <pre class="json-display">{{ JSON.stringify(testResult.data, null, 2) }}</pre>
          </div>
        </el-tab-pane>
        <el-tab-pane label="📊 请求信息" name="request" v-if="testResult.requestInfo">
          <el-descriptions :column="2" border>
            <el-descriptions-item label="请求方法">{{ testResult.requestInfo.method }}</el-descriptions-item>
            <el-descriptions-item label="请求URL">{{ testResult.requestInfo.url }}</el-descriptions-item>
            <el-descriptions-item label="响应状态">{{ testResult.requestInfo.status }}</el-descriptions-item>
            <el-descriptions-item label="响应时间">{{ testResult.requestInfo.duration }}ms</el-descriptions-item>
          </el-descriptions>
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import {
  Connection, List, Document, DataBase, PieChart, Plus, User, OfficeBuilding, Folder,
  Lightning, Stopwatch, Delete, Send, Refresh, CopyDocument, Close
} from '@element-plus/icons-vue';
import {
  formTemplateApi,
  formInstanceApi,
  userApi,
  departmentApi,
  categoryApi,
  handleApiError
} from '@/api/formApi';

// 响应式数据
const activeTab = ref('quick');
const checking = ref(false);
const serverStatus = ref<'connected' | 'disconnected'>('disconnected');
const testCount = ref(0);
const currentPage = ref(1);

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
  categories: false,
  allTemplate: false,
  allInstance: false,
  all: false,
  performance: false,
  custom: false
});

const testResult = ref<{
  title: string;
  type: 'success' | 'error' | 'warning' | 'info';
  description: string;
  data?: any;
  requestInfo?: {
    method: string;
    url: string;
    status: number;
    duration: number;
  };
} | null>(null);

const customRequest = ref({
  method: 'GET',
  url: '/api/form_templates',
  headers: '{"Content-Type": "application/json"}',
  body: ''
});

const testHistory = ref<Array<{
  timestamp: number;
  api: string;
  method: string;
  success: boolean;
  duration: number;
  response: string;
}>>([]);

// 计算属性
const successCount = computed(() => testHistory.value.filter(t => t.success).length);
const failureCount = computed(() => testHistory.value.filter(t => !t.success).length);
const successRate = computed(() => {
  if (testHistory.value.length === 0) return 0;
  return (successCount.value / testHistory.value.length) * 100;
});

const paginatedHistory = computed(() => {
  const start = (currentPage.value - 1) * 10;
  return testHistory.value.slice(start, start + 10).reverse();
});

// 工具函数
const formatTime = (timestamp: number) => {
  return new Date(timestamp).toLocaleString('zh-CN');
};

const getMethodType = (method: string) => {
  const types: Record<string, string> = {
    'GET': 'primary',
    'POST': 'success',
    'PUT': 'warning',
    'DELETE': 'danger',
    'PATCH': 'info'
  };
  return types[method] || 'default';
};

// 记录测试历史
const recordTest = (api: string, method: string, success: boolean, duration: number, response: any) => {
  testHistory.value.push({
    timestamp: Date.now(),
    api,
    method,
    success,
    duration,
    response: success ? '成功' : (response?.message || '失败')
  });
  testCount.value++;
};

// 检查服务器连接状态
const checkServerStatus = async () => {
  checking.value = true;
  const startTime = Date.now();
  try {
    await formTemplateApi.getTemplates({ _limit: 1 });
    serverStatus.value = 'connected';
    const duration = Date.now() - startTime;
    ElMessage.success(`Mock服务器连接成功！响应时间: ${duration}ms`);
    recordTest('连接检测', 'GET', true, duration, null);
  } catch (error) {
    serverStatus.value = 'disconnected';
    const duration = Date.now() - startTime;
    ElMessage.error('Mock服务器连接失败，请确保服务器已启动');
    recordTest('连接检测', 'GET', false, duration, error);
  } finally {
    checking.value = false;
  }
};

// 显示测试结果
const showResult = (title: string, type: 'success' | 'error', data?: any, description?: string, requestInfo?: any) => {
  testResult.value = {
    title,
    type,
    description: description || (type === 'success' ? '请求成功' : '请求失败'),
    data,
    requestInfo
  };
};

// 清空测试结果
const clearResult = () => {
  testResult.value = null;
};

// 复制结果
const copyResult = async () => {
  if (testResult.value?.data) {
    try {
      await navigator.clipboard.writeText(JSON.stringify(testResult.value.data, null, 2));
      ElMessage.success('结果已复制到剪贴板');
    } catch (error) {
      ElMessage.error('复制失败');
    }
  }
};

// 清空所有结果
const clearAllResults = () => {
  testResult.value = null;
  ElMessage.success('已清空所有结果');
};

// 清空历史记录
const clearHistory = async () => {
  try {
    await ElMessageBox.confirm('确定要清空所有测试历史记录吗？', '确认操作', {
      type: 'warning'
    });
    testHistory.value = [];
    testCount.value = 0;
    ElMessage.success('历史记录已清空');
  } catch {
    // 用户取消
  }
};

// 测试函数包装器
const testWrapper = async (testFn: Function, apiName: string, method: string = 'GET') => {
  const startTime = Date.now();
  try {
    const result = await testFn();
    const duration = Date.now() - startTime;
    recordTest(apiName, method, true, duration, result);
    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    recordTest(apiName, method, false, duration, error);
    throw error;
  }
};

// 测试获取模板列表
const testGetTemplates = async () => {
  loading.value.templates = true;
  try {
    const response = await testWrapper(
      () => formTemplateApi.getTemplates({ _limit: 10 }),
      '获取模板列表'
    );
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
    const response = await testWrapper(
      () => formTemplateApi.getFullTemplate(1),
      '获取完整模板'
    );
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
    const response = await testWrapper(
      () => formTemplateApi.generateSQL(1),
      '生成SQL语句'
    );
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
    const response = await testWrapper(
      () => formTemplateApi.getStatistics(1),
      '获取统计信息'
    );
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
    const response = await testWrapper(
      () => formInstanceApi.getInstances({ _limit: 10 }),
      '获取实例列表'
    );
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
    const response = await testWrapper(
      () => formInstanceApi.getFullInstance(1),
      '获取完整实例'
    );
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
    
    const response = await testWrapper(
      () => formInstanceApi.submit(testData),
      '提交表单实例',
      'POST'
    );
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
    const response = await testWrapper(
      () => userApi.getUsers(),
      '获取用户列表'
    );
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
    const response = await testWrapper(
      () => departmentApi.getDepartments(),
      '获取部门列表'
    );
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
    const response = await testWrapper(
      () => categoryApi.getCategories(),
      '获取分类列表'
    );
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

// 测试所有模板接口
const testAllTemplateApis = async () => {
  loading.value.allTemplate = true;
  try {
    await testGetTemplates();
    await testGetFullTemplate();
    await testGenerateSQL();
    await testGetStatistics();
    ElMessage.success('所有模板接口测试完成');
  } catch (error) {
    ElMessage.error('模板接口测试中断');
  } finally {
    loading.value.allTemplate = false;
  }
};

// 测试所有实例接口
const testAllInstanceApis = async () => {
  loading.value.allInstance = true;
  try {
    await testGetInstances();
    await testGetFullInstance();
    await testSubmitForm();
    ElMessage.success('所有实例接口测试完成');
  } catch (error) {
    ElMessage.error('实例接口测试中断');
  } finally {
    loading.value.allInstance = false;
  }
};

// 测试所有接口
const testAllApis = async () => {
  loading.value.all = true;
  try {
    await testAllTemplateApis();
    await testAllInstanceApis();
    await testGetUsers();
    await testGetDepartments();
    await testGetCategories();
    ElMessage.success('所有接口测试完成');
  } catch (error) {
    ElMessage.error('接口测试中断');
  } finally {
    loading.value.all = false;
  }
};

// 性能测试
const performanceTest = async () => {
  loading.value.performance = true;
  try {
    const tests = [
      () => formTemplateApi.getTemplates({ _limit: 1 }),
      () => formTemplateApi.getFullTemplate(1),
      () => formInstanceApi.getInstances({ _limit: 1 }),
      () => userApi.getUsers(),
      () => departmentApi.getDepartments()
    ];
    
    const results = [];
    for (let i = 0; i < 5; i++) {
      const startTime = Date.now();
      await Promise.all(tests.map(test => test()));
      const duration = Date.now() - startTime;
      results.push(duration);
    }
    
    const avgTime = results.reduce((a, b) => a + b, 0) / results.length;
    const minTime = Math.min(...results);
    const maxTime = Math.max(...results);
    
    showResult('性能测试', 'success', {
      rounds: 5,
      results,
      average: avgTime,
      min: minTime,
      max: maxTime
    }, `平均响应时间: ${avgTime.toFixed(2)}ms`);
    
    ElMessage.success(`性能测试完成，平均响应时间: ${avgTime.toFixed(2)}ms`);
  } catch (error) {
    ElMessage.error('性能测试失败');
  } finally {
    loading.value.performance = false;
  }
};

// 发送自定义请求
const sendCustomRequest = async () => {
  loading.value.custom = true;
  const startTime = Date.now();
  
  try {
    const url = `http://localhost:3003${customRequest.value.url}`;
    const config: any = {
      method: customRequest.value.method,
      url,
    };
    
    if (customRequest.value.method !== 'GET') {
      if (customRequest.value.headers) {
        config.headers = JSON.parse(customRequest.value.headers);
      }
      if (customRequest.value.body) {
        config.data = JSON.parse(customRequest.value.body);
      }
    }
    
    const response = await fetch(url, {
      method: customRequest.value.method,
      headers: customRequest.value.method !== 'GET' && customRequest.value.headers 
        ? JSON.parse(customRequest.value.headers) 
        : undefined,
      body: customRequest.value.method !== 'GET' && customRequest.value.body 
        ? customRequest.value.body 
        : undefined
    });
    
    const duration = Date.now() - startTime;
    const data = await response.json();
    
    const requestInfo = {
      method: customRequest.value.method,
      url: customRequest.value.url,
      status: response.status,
      duration
    };
    
    if (response.ok) {
      showResult('自定义请求', 'success', data, `请求成功 (${response.status})`, requestInfo);
      recordTest('自定义请求', customRequest.value.method, true, duration, data);
      ElMessage.success('自定义请求成功');
    } else {
      showResult('自定义请求', 'error', data, `请求失败 (${response.status})`, requestInfo);
      recordTest('自定义请求', customRequest.value.method, false, duration, data);
      ElMessage.error('自定义请求失败');
    }
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorInfo = handleApiError(error);
    showResult('自定义请求', 'error', errorInfo, errorInfo.message);
    recordTest('自定义请求', customRequest.value.method, false, duration, error);
    ElMessage.error('自定义请求失败');
  } finally {
    loading.value.custom = false;
  }
};

// 重置自定义请求
const resetCustomRequest = () => {
  customRequest.value = {
    method: 'GET',
    url: '/api/form_templates',
    headers: '{"Content-Type": "application/json"}',
    body: ''
  };
};

// 加载请求模板
const loadTemplate = (templateName: string) => {
  const templates: Record<string, any> = {
    getTemplates: {
      method: 'GET',
      url: '/api/form_templates?_limit=5',
      headers: '',
      body: ''
    },
    createTemplate: {
      method: 'POST',
      url: '/api/form-templates/design',
      headers: '{"Content-Type": "application/json"}',
      body: JSON.stringify({
        template: {
          name: "测试表单模板",
          description: "这是一个通过API创建的测试表单",
          category: "测试分类",
          status: "draft",
          createdBy: 1
        },
        fields: [
          {
            fieldName: "testField",
            fieldLabel: "测试字段",
            fieldType: "text",
            dataType: "VARCHAR",
            required: true,
            placeholder: "请输入测试内容"
          }
        ]
      }, null, 2)
    },
    submitInstance: {
      method: 'POST',
      url: '/api/form-instances',
      headers: '{"Content-Type": "application/json"}',
      body: JSON.stringify({
        templateId: 1,
        instanceName: "API测试实例",
        submittedBy: 1,
        formData: {
          patientName: "API测试患者",
          patientAge: "25",
          gender: "female"
        }
      }, null, 2)
    },
    updateTemplate: {
      method: 'PUT',
      url: '/api/form_templates/1',
      headers: '{"Content-Type": "application/json"}',
      body: JSON.stringify({
        name: "更新后的表单模板",
        description: "这是一个更新后的表单模板描述"
      }, null, 2)
    }
  };
  
  if (templates[templateName]) {
    customRequest.value = templates[templateName];
    ElMessage.success('模板已加载');
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
  background-color: #f5f7fa;
  min-height: calc(100vh - 60px);
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

.server-info {
  margin-top: 16px;
}

.main-card {
  margin-bottom: 20px;
}

.test-group {
  height: 100%;
}

.group-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.test-btn {
  width: 100%;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 8px;
}

.test-btn:last-child {
  margin-bottom: 0;
}

.full-width {
  width: 100%;
}

.template-btn {
  width: 100%;
  text-align: left;
}

.result-card {
  margin-top: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.json-container {
  max-height: 400px;
  overflow-y: auto;
}

.json-display {
  background-color: #f8f9fa;
  padding: 16px;
  border-radius: 6px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 13px;
  line-height: 1.5;
  color: #24292e;
  white-space: pre-wrap;
  word-break: break-all;
  border: 1px solid #e1e4e8;
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.quick-test, .custom-test, .test-history {
  padding: 20px 0;
}

:deep(.el-card__header) {
  background-color: #fafbfc;
  border-bottom: 1px solid #ebeef5;
}

:deep(.el-tabs__content) {
  padding: 0;
}

:deep(.el-statistic__content) {
  font-size: 24px;
  font-weight: 600;
}

:deep(.el-descriptions__label) {
  font-weight: 600;
}

@media (max-width: 768px) {
  .api-test {
    padding: 10px;
  }
  
  .header-content {
    flex-direction: column;
    gap: 16px;
    text-align: center;
  }
  
  .status-section {
    flex-direction: column;
    gap: 8px;
  }
}
</style> 