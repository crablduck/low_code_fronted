<template>
  <div class="header-test-page">
    <el-card class="test-card">
      <template #header>
        <h2>X-User-ID Header 测试页面</h2>
      </template>
      
      <div class="test-section">
        <h3>1. 用户信息检查</h3>
        <el-row :gutter="16">
          <el-col :span="6">
            <el-button @click="checkUserInfo" type="primary">检查用户信息</el-button>
          </el-col>
          <el-col :span="6">
            <el-button @click="simulateLogin" type="success">模拟登录</el-button>
          </el-col>
          <el-col :span="6">
            <el-button @click="clearUserData" type="danger">清除用户数据</el-button>
          </el-col>
        </el-row>
        <div v-if="userInfoResult" class="result-box">
          <pre>{{ userInfoResult }}</pre>
        </div>
      </div>
      
      <div class="test-section">
        <h3>2. Headers 测试</h3>
        <el-button @click="testHeaders" type="success">测试 Headers 添加</el-button>
        <div v-if="headersResult" class="result-box">
          <pre>{{ headersResult }}</pre>
        </div>
      </div>
      
      <div class="test-section">
        <h3>3. 实际 API 请求测试</h3>
        <el-row :gutter="16">
          <el-col :span="6">
            <el-input-number 
              v-model="testDatasetId" 
              :min="1" 
              placeholder="数据集ID"
            />
          </el-col>
          <el-col :span="6">
            <el-button @click="testApiRequest" type="warning" :loading="apiLoading">
              测试数据集API
            </el-button>
          </el-col>
          <el-col :span="6">
            <el-button @click="testLocalRequest" type="info">
              测试本地请求
            </el-button>
          </el-col>
        </el-row>
        <div v-if="apiResult" class="result-box">
          <pre>{{ apiResult }}</pre>
        </div>
      </div>
      
      <div class="test-section">
        <h3>4. 网络请求监控</h3>
        <el-alert
          title="测试说明"
          type="info"
          :closable="false"
          show-icon
        >
          <p><strong>步骤 1：</strong> 点击"模拟登录"按钮创建测试用户数据</p>
          <p><strong>步骤 2：</strong> 点击"检查用户信息"验证数据是否正确</p>
          <p><strong>步骤 3：</strong> 点击"测试 Headers 添加"查看 headers 配置</p>
          <p><strong>步骤 4：</strong> 打开开发者工具 → Network 面板</p>
          <p><strong>步骤 5：</strong> 点击"测试本地请求"查看实际发送的 headers</p>
          <p><strong>预期结果：</strong> 请求应包含 <code>X-User-ID: 123</code> header</p>
        </el-alert>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { previewDatasetData } from '@/api/dataset'

const userInfoResult = ref('')
const headersResult = ref('')
const apiResult = ref('')
const testDatasetId = ref(1)
const apiLoading = ref(false)

// 模拟登录
const simulateLogin = () => {
  console.log('===== 模拟登录 =====')
  
  const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.mock_token_for_testing'
  const mockUserInfo = {
    id: 123,
    username: 'test_user',
    email: 'test@example.com',
    name: '测试用户'
  }
  
  // 存储到 localStorage
  localStorage.setItem('token', mockToken)
  localStorage.setItem('userInfo', JSON.stringify(mockUserInfo))
  
  ElMessage.success('模拟登录成功！用户ID: 123')
  
  // 自动检查用户信息
  checkUserInfo()
}

// 清除用户数据
const clearUserData = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('userInfo')
  
  userInfoResult.value = ''
  headersResult.value = ''
  apiResult.value = ''
  
  ElMessage.info('用户数据已清除')
}

// 检查用户信息
const checkUserInfo = () => {
  console.log('===== 用户信息检查 =====')
  
  const token = localStorage.getItem('token')
  const userInfoStr = localStorage.getItem('userInfo')
  
  const result = {
    hasToken: !!token,
    token: token ? token.substring(0, 20) + '...' : null,
    hasUserInfo: !!userInfoStr,
    userInfoRaw: userInfoStr,
    userInfo: null as any,
    userId: null as any,
    userIdType: null as any
  }
  
  if (userInfoStr) {
    try {
      const userInfo = JSON.parse(userInfoStr)
      result.userInfo = userInfo
      result.userId = userInfo?.id
      result.userIdType = typeof userInfo?.id
    } catch (error: any) {
      result.userInfo = { error: '解析失败', details: error.message }
    }
  }
  
  userInfoResult.value = JSON.stringify(result, null, 2)
  console.log('用户信息检查结果:', result)
}

// 测试 Headers 添加
const testHeaders = () => {
  console.log('===== Headers 添加测试 =====')
  
  const mockConfig = {
    url: '/test',
    method: 'GET',
    headers: {} as any
  }
  
  // 模拟添加 headers
  const userInfoStr = localStorage.getItem('userInfo')
  const token = localStorage.getItem('token')
  
  if (token) {
    mockConfig.headers['Authorization'] = `Bearer ${token}`
  }
  
  if (userInfoStr) {
    try {
      const userInfo = JSON.parse(userInfoStr)
      if (userInfo && userInfo.id) {
        mockConfig.headers['X-User-ID'] = userInfo.id.toString()
      }
    } catch (error) {
      mockConfig.headers['error'] = '解析用户信息失败'
    }
  }
  
  headersResult.value = JSON.stringify(mockConfig, null, 2)
  console.log('模拟请求配置:', mockConfig)
}

// 测试本地请求 (模拟检查 headers)
const testLocalRequest = async () => {
  apiLoading.value = true
  apiResult.value = ''
  
  try {
    console.log('===== 本地请求测试 =====')
    
    // 使用 fetch 直接测试，这样可以看到实际发送的 headers
    const url = 'http://localhost:8080/api/datasets/1/preview'
    
    // 手动构建 headers
    const headers: any = {
      'Content-Type': 'application/json'
    }
    
    const userInfoStr = localStorage.getItem('userInfo')
    const token = localStorage.getItem('token')
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }
    
    if (userInfoStr) {
      try {
        const userInfo = JSON.parse(userInfoStr)
        if (userInfo && userInfo.id) {
          headers['X-User-ID'] = userInfo.id.toString()
        }
      } catch (error) {
        console.error('解析用户信息失败:', error)
      }
    }
    
    console.log('发送的 headers:', headers)
    
    const response = await fetch(url, {
      method: 'GET',
      headers: headers
    })
    
    const data = await response.text()
    
    apiResult.value = JSON.stringify({
      success: true,
      requestHeaders: headers,
      responseStatus: response.status,
      responseHeaders: Object.fromEntries(response.headers.entries()),
      responseBody: data.substring(0, 200) + (data.length > 200 ? '...' : '')
    }, null, 2)
    
    ElMessage.success('本地请求测试完成')
    
  } catch (error: any) {
    console.error('本地请求失败:', error)
    
    apiResult.value = JSON.stringify({
      success: false,
      error: {
        message: error.message,
        name: error.name
      }
    }, null, 2)
    
    ElMessage.error('本地请求失败')
  } finally {
    apiLoading.value = false
  }
}

// 测试实际 API 请求
const testApiRequest = async () => {
  apiLoading.value = true
  apiResult.value = ''
  
  try {
    console.log('===== 实际 API 请求测试 =====')
    console.log('请求数据集ID:', testDatasetId.value)
    
    const response = await previewDatasetData(testDatasetId.value)
    
    apiResult.value = JSON.stringify({
      success: true,
      response: {
        code: response.code,
        message: response.message,
        dataType: typeof response.data,
        hasData: !!response.data
      }
    }, null, 2)
    
    ElMessage.success('API 请求成功')
    
  } catch (error: any) {
    console.error('API 请求失败:', error)
    
    apiResult.value = JSON.stringify({
      success: false,
      error: {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      }
    }, null, 2)
    
    ElMessage.error('API 请求失败')
  } finally {
    apiLoading.value = false
  }
}
</script>

<style scoped>
.header-test-page {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
}

.test-card {
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.test-section {
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 1px solid #f0f0f0;
}

.test-section:last-child {
  border-bottom: none;
}

.test-section h3 {
  margin-bottom: 16px;
  color: var(--el-text-color-primary);
}

.result-box {
  margin-top: 16px;
  padding: 16px;
  background: #f5f7fa;
  border-radius: 8px;
  border: 1px solid #e4e7ed;
}

.result-box pre {
  margin: 0;
  white-space: pre-wrap;
  word-wrap: break-word;
  font-family: 'Monaco', 'Consolas', 'Courier New', monospace;
  font-size: 12px;
  line-height: 1.5;
}
</style> 