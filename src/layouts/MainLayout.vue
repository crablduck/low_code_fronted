<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { storeToRefs } from 'pinia'
import NavigationMenu from '@/components/NavigationMenu.vue'

const router = useRouter()
const userStore = useUserStore()
const { userInfo, tenantInfo } = storeToRefs(userStore)

const handleLogout = () => {
  userStore.logout()
  router.push('/login')
}
</script>

<template>
  <el-container class="layout-container">
    <el-aside width="220px" class="aside">
      <div class="logo">
        <img v-if="tenantInfo?.logo" :src="tenantInfo.logo" alt="logo" />
        <span v-else>低代码工作流系统</span>
      </div>
      <NavigationMenu />
    </el-aside>
    
    <el-container>
      <el-header class="header">
        <div class="header-left">
          <span class="tenant-name">{{ tenantInfo?.name || '未选择机构' }}</span>
        </div>
        <div class="header-right">
          <el-dropdown @command="handleLogout">
            <span class="user-info">
              {{ userInfo?.username }}
              <el-icon class="el-icon--right">
                <arrow-down />
              </el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="logout">退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>
      
      <el-main class="main">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<style scoped>
.layout-container {
  height: 100vh;
}

.aside {
  background-color: #304156;
  color: #fff;
}

.logo {
  height: 60px;
  line-height: 60px;
  text-align: center;
  font-size: 20px;
  border-bottom: 1px solid #1f2d3d;
}

.logo img {
  height: 40px;
  margin-top: 10px;
}

.header {
  background-color: #fff;
  border-bottom: 1px solid #dcdfe6;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
}

.tenant-name {
  font-size: 16px;
  color: #606266;
}

.user-info {
  cursor: pointer;
  color: #606266;
}

.main {
  background-color: #f0f2f5;
  padding: 20px;
}
</style> 