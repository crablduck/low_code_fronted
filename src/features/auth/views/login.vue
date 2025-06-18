<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import type { LoginForm } from '@/shared/types/auth'
import { ElMessage } from 'element-plus'
import { User, Lock } from '@element-plus/icons-vue'

const router = useRouter()
const userStore = useUserStore()
const loading = ref(false)

const loginForm = ref<LoginForm>({
  username: '',
  password: ''
})

// 登录处理
const handleLogin = async () => {
  try {
    loading.value = true
    const success = await userStore.login(loginForm.value)
    
    if (success) {
      ElMessage.success('登录成功')
      router.push('/')
    }
  } catch (error: any) {
    console.error('登录失败:', error)
    ElMessage.error('登录失败：' + (error.message || '用户名或密码错误'))
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="login-container">
    <div class="login-box">
      <h2 class="title">系统登录</h2>
      <el-form @submit.prevent="handleLogin" class="login-form">
        <el-form-item>
          <el-input
            v-model="loginForm.username"
            placeholder="请输入用户名"
            :prefix-icon="User"
          />
        </el-form-item>
        
        <el-form-item>
          <el-input
            v-model="loginForm.password"
            type="password"
            placeholder="请输入密码"
            :prefix-icon="Lock"
            show-password
          />
        </el-form-item>
        
        <el-form-item>
          <el-button
            type="primary"
            :loading="loading"
            class="w-full"
            @click="handleLogin"
          >
            登录
          </el-button>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: #f5f7fa;
}

.login-box {
  width: 400px;
  padding: 40px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.title {
  text-align: center;
  font-size: 24px;
  color: #303133;
  margin-bottom: 30px;
}

.login-form {
  margin-top: 20px;
}

.w-full {
  width: 100%;
}

:deep(.el-input__wrapper) {
  width: 100%;
}

:deep(.el-button) {
  width: 100%;
  height: 40px;
  font-size: 16px;
}
</style> 