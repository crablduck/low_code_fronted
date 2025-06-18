<template>
  <div class="layout">
    <!-- 顶部导航栏 -->
    <el-header class="header">
      <div class="header-content">
        <!-- Logo 和标题 -->
        <div class="logo-section" @click="goHome">
          <el-icon class="logo-icon"><DataBoard /></el-icon>
          <span class="logo-text">低代码工作流</span>
        </div>

        <!-- 导航菜单组件 -->
        <NavigationMenu />

        <!-- 用户信息 -->
        <div class="user-section">
          <el-dropdown>
            <span class="user-info">
              <el-avatar :size="32" :src="userAvatar">
                <el-icon><User /></el-icon>
              </el-avatar>
              <span class="username">管理员</span>
              <el-icon class="arrow-down"><ArrowDown /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item>
                  <el-icon><User /></el-icon>
                  个人中心
                </el-dropdown-item>
                <el-dropdown-item>
                  <el-icon><Setting /></el-icon>
                  设置
                </el-dropdown-item>
                <el-dropdown-item divided>
                  <el-icon><SwitchButton /></el-icon>
                  退出登录
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </div>
    </el-header>

    <!-- 主要内容区域 -->
    <el-main class="main-content">
      <router-view />
    </el-main>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  DataBoard,
  User,
  ArrowDown,
  SwitchButton,
  Setting
} from '@element-plus/icons-vue'
import NavigationMenu from './NavigationMenu.vue'

// 响应式数据
const userAvatar = ref('')
const router = useRouter()

// 方法
const goHome = () => {
  router.push('/')
}
</script>

<style scoped>
.layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: var(--el-bg-color);
}

.header {
  background: linear-gradient(135deg, #1e3c72 0%, #6b46c1 100%);
  box-shadow: none;
  padding: 0;
  height: var(--header-height);
  line-height: var(--header-height);
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.header-content {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 24px;
  display: flex;
  align-items: center;
  height: 100%;
  gap: 40px;
}

.logo-section {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  padding: 8px 16px;
  border-radius: 12px;
  transition: all 0.3s;
  
  &:hover {
    background: rgba(255, 255, 255, 0.1);
    transform: translateY(-1px);
  }
}

.logo-icon {
  font-size: 24px;
  color: #ffd04b;
}

.logo-text {
  font-size: 18px;
  font-weight: 600;
  color: white;
  background: linear-gradient(135deg, #fff 0%, #ffd04b 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.user-section {
  margin-left: auto;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  border-radius: 30px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  cursor: pointer;
  transition: all 0.3s;
  
  &:hover {
    background: rgba(255, 255, 255, 0.15);
    transform: translateY(-1px);
  }
}

.username {
  color: white;
  font-size: 14px;
  font-weight: 500;
}

.arrow-down {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.8);
}

.main-content {
  flex: 1;
  padding: 24px;
  margin-top: var(--header-height);
  background: #f5f7fa;
  min-height: calc(100vh - var(--header-height));
}

:deep(.el-dropdown-menu) {
  background: rgba(30, 60, 114, 0.95) !important;
  backdrop-filter: blur(12px);
  border-radius: 12px;
  padding: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
}

:deep(.el-dropdown-menu__item) {
  color: rgba(255, 255, 255, 0.9);
  font-size: 14px;
  padding: 8px 16px;
  border-radius: 6px;
  
  &:hover {
    background: rgba(255, 255, 255, 0.1);
    color: white;
  }
  
  .el-icon {
    margin-right: 8px;
    font-size: 16px;
  }
}

@media (max-width: 768px) {
  .logo-text {
    display: none;
  }
  
  .username {
    display: none;
  }
  
  .user-section {
    min-width: 60px;
  }

  .header-content {
    padding: 0 12px;
  }
}
</style> 