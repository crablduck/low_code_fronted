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

        <!-- 导航菜单 -->
        <el-menu
          :default-active="activeIndex"
          mode="horizontal"
          class="nav-menu"
          @select="handleMenuSelect"
          background-color="transparent"
          text-color="#fff"
          active-text-color="#ffd04b"
        >
          <el-menu-item index="/">
            <el-icon><House /></el-icon>
            <span>首页</span>
          </el-menu-item>
          <el-menu-item index="/form-design">
            <el-icon><Edit /></el-icon>
            <span>表单设计</span>
          </el-menu-item>
          <el-menu-item index="/workflow-design">
            <el-icon><Connection /></el-icon>
            <span>流程设计</span>
          </el-menu-item>
          <el-menu-item index="/api-test">
            <el-icon><Monitor /></el-icon>
            <span>API测试</span>
          </el-menu-item>
          <el-sub-menu index="more">
            <template #title>
              <el-icon><More /></el-icon>
              <span>更多</span>
            </template>
            <el-menu-item index="/data-management" disabled>
              <el-icon><DataBoard /></el-icon>
              <span>数据管理</span>
            </el-menu-item>
            <el-menu-item index="/system-config" disabled>
              <el-icon><Setting /></el-icon>
              <span>系统配置</span>
            </el-menu-item>
          </el-sub-menu>
        </el-menu>

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
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  DataBoard,
  House,
  Edit,
  Connection,
  More,
  Setting,
  User,
  ArrowDown,
  SwitchButton,
  Monitor
} from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()

// 用户头像（可以从用户信息中获取）
const userAvatar = ref('')

// 当前激活的菜单项
const activeIndex = computed(() => route.path)

// 处理菜单选择
const handleMenuSelect = (index: string) => {
  if (index && !index.startsWith('more')) {
    router.push(index)
  }
}
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
  height: 60px;
  line-height: 60px;
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 100%;
  padding: 0 24px;
  max-width: 1400px;
  margin: 0 auto;
}

.logo-section {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  transition: opacity 0.3s;
}

.logo-section:hover {
  opacity: 0.8;
}

.logo-icon {
  font-size: 32px;
  color: #ffd04b;
}

.logo-text {
  font-size: 20px;
  font-weight: 700;
  color: white;
  letter-spacing: 1px;
}

.nav-menu {
  flex: 1;
  margin: 0 40px;
  border-bottom: none;
}

.nav-menu .el-menu-item,
.nav-menu .el-sub-menu__title {
  border-bottom: none;
  height: 60px;
  line-height: 60px;
  padding: 0 20px;
  transition: all 0.3s;
}

.nav-menu .el-menu-item:hover,
.nav-menu .el-sub-menu__title:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.nav-menu .el-menu-item.is-active {
  background-color: rgba(255, 208, 75, 0.2);
  border-bottom: 2px solid #ffd04b;
}

.user-section {
  flex-shrink: 0;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  color: white;
  cursor: pointer;
  padding: 8px 12px;
  border-radius: 6px;
  transition: background-color 0.3s;
}

.user-info:hover {
  background-color: rgba(255, 255, 255, 0.1);
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

/* 响应式设计 */
@media (max-width: 768px) {
  .header-content {
    padding: 0 16px;
  }

  .logo-text {
    display: none;
  }

  .nav-menu {
    margin: 0 20px;
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