<template>
  <div class="layout">
    <!-- 顶部导航栏 -->
    <el-header class="header">
      <div class="header-content">
        <!-- Logo 和标题 -->
        <div class="logo-section" @click="$router.push('/')">
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
</script>

<style scoped>
.layout {
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  padding: 0;
  height: 70px;
  line-height: 70px;
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 100%;
  padding: 0 24px;
  max-width: none;
  margin: 0 auto;
  min-width: 2800px;
  width: 100%;
  overflow: visible;
}

.logo-section {
  display: flex;
  align-items: center;
  gap: 16px;
  cursor: pointer;
  transition: opacity 0.3s;
  min-width: 220px;
  flex-shrink: 0;
}

.logo-section:hover {
  opacity: 0.8;
}

.logo-icon {
  font-size: 36px;
  color: #ffd04b;
}

.logo-text {
  font-size: 22px;
  font-weight: 700;
  color: white;
  letter-spacing: 1.2px;
}

.nav-menu {
  flex: 1;
  margin: 0 40px;
  border-bottom: none;
  background-color: transparent !important;
  overflow: visible;
  min-width: 2500px;
  max-width: none;
}

.nav-menu .el-menu-item,
.nav-menu .el-sub-menu__title {
  border-bottom: none;
  height: 70px;
  line-height: 70px;
  padding: 0 20px;
  margin: 0 2px;
  transition: all 0.3s;
  background-color: transparent !important;
  border-radius: 8px;
  font-size: 15px;
  white-space: nowrap;
  flex-shrink: 0;
}

.nav-menu .el-menu-item:hover,
.nav-menu .el-sub-menu__title:hover {
  background-color: rgba(255, 255, 255, 0.15) !important;
  transform: translateY(-1px);
}

.nav-menu .el-menu-item.is-active {
  background-color: rgba(255, 208, 75, 0.25) !important;
  border-bottom: 3px solid #ffd04b;
  box-shadow: 0 2px 8px rgba(255, 208, 75, 0.3);
}

/* 子菜单样式 */
.nav-menu .el-sub-menu .el-menu {
  background-color: rgba(102, 126, 234, 0.95) !important;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
  margin-top: 8px;
}

.nav-menu .el-sub-menu .el-menu-item {
  background-color: transparent !important;
  color: #fff !important;
  height: 48px;
  line-height: 48px;
  padding: 0 20px;
  margin: 4px 8px;
  border-radius: 6px;
}

.nav-menu .el-sub-menu .el-menu-item:hover {
  background-color: rgba(255, 255, 255, 0.15) !important;
}

.user-section {
  flex-shrink: 0;
  min-width: 180px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
  color: white;
  cursor: pointer;
  padding: 12px 16px;
  border-radius: 8px;
  transition: all 0.3s;
  font-size: 15px;
}

.user-info:hover {
  background-color: rgba(255, 255, 255, 0.15);
  transform: translateY(-1px);
}

.username {
  font-size: 14px;
  font-weight: 500;
}

.arrow-down {
  font-size: 12px;
  transition: transform 0.3s;
}

.main-content {
  flex: 1;
  padding: 0;
  overflow: auto;
  background: #f5f7fa;
}

/* 响应式设计 - 调整断点 */
@media (max-width: 1800px) {
  .header-content {
    padding: 0 20px;
  }
  
  .nav-menu {
    margin: 0 30px;
    min-width: 1000px;
  }
}

@media (max-width: 1600px) {
  .header-content {
    padding: 0 16px;
  }
  
  .nav-menu {
    margin: 0 25px;
    min-width: 900px;
  }
}

@media (max-width: 768px) {
  .header-content {
    padding: 0 16px;
  }

  .logo-text {
    display: none;
  }

  .nav-menu {
    margin: 0 20px;
    min-width: 600px;
  }

  .nav-menu .el-menu-item span,
  .nav-menu .el-sub-menu__title span {
    display: none;
  }

  .username {
    display: none;
  }
}

@media (max-width: 480px) {
  .nav-menu {
    margin: 0 10px;
  }

  .nav-menu .el-menu-item,
  .nav-menu .el-sub-menu__title {
    padding: 0 10px;
  }
}
</style> 