<template>
  <div class="designer-layout">
    <div class="designer-header">
      <div class="logo-section" @click="goBack">
        <el-icon><Back /></el-icon>
        <span>返回仪表盘</span>
      </div>
    </div>
    <div class="designer-content">
      <router-view />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { Back } from '@element-plus/icons-vue'

const router = useRouter()

const goBack = () => {
  router.push('/dashboard/list')
}
</script>

<style scoped>
.designer-layout {
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.designer-header {
  height: 50px;
  background: #fff;
  border-bottom: 1px solid #e0e0e0;
  display: flex;
  align-items: center;
  padding: 0 20px;
}

.logo-section {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 6px 12px;
  border-radius: 4px;
  transition: all 0.3s;
}

.logo-section:hover {
  background: #f5f7fa;
}

.designer-content {
  flex: 1;
  overflow: hidden;
}
</style> 