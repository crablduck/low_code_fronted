<template>
  <div class="sidebar">
    <div class="logo">
      <h2>工作流系统</h2>
    </div>
    <el-menu
      :default-active="activeIndex"
      class="sidebar-menu"
      router
      :collapse="isCollapse"
    >
      <el-menu-item index="/dashboard">
        <el-icon><House /></el-icon>
        <span>仪表盘</span>
      </el-menu-item>
      
      <el-sub-menu index="workflow">
        <template #title>
          <el-icon><Operation /></el-icon>
          <span>工作流管理</span>
        </template>
        <el-menu-item index="/workflow/list">
          <el-icon><List /></el-icon>
          <span>工作流列表</span>
        </el-menu-item>
        <el-menu-item index="/workflow/create">
          <el-icon><Plus /></el-icon>
          <span>创建工作流</span>
        </el-menu-item>
      </el-sub-menu>
      
      <el-sub-menu index="data">
        <template #title>
          <el-icon><DataBoard /></el-icon>
          <span>数据管理</span>
        </template>
        <el-menu-item index="/datasource-manage">
          <el-icon><Coin /></el-icon>
          <span>数据源管理</span>
        </el-menu-item>
        <el-menu-item index="/dataset-manage">
          <el-icon><Collection /></el-icon>
          <span>数据集管理</span>
        </el-menu-item>
        <el-menu-item index="/dataset-chart-demo">
          <el-icon><TrendCharts /></el-icon>
          <span>数据集图表演示</span>
        </el-menu-item>
      </el-sub-menu>
      
      <el-menu-item index="/settings">
        <el-icon><Setting /></el-icon>
        <span>系统设置</span>
      </el-menu-item>
    </el-menu>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { 
  House, 
  Operation, 
  List, 
  Plus, 
  DataBoard, 
  Coin, 
  Collection, 
  Setting,
  TrendCharts
} from '@element-plus/icons-vue'

const route = useRoute()

// Props
interface Props {
  isCollapse?: boolean
}

withDefaults(defineProps<Props>(), {
  isCollapse: false
})

const activeIndex = computed(() => route.path)
</script>

<style scoped>
.sidebar {
  height: 100vh;
  background-color: #304156;
  overflow-y: auto;
}

.logo {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #2b3a4b;
  color: white;
  border-bottom: 1px solid #1f2d3d;
}

.logo h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 500;
}

.sidebar-menu {
  border: none;
  background-color: transparent;
}

.sidebar-menu .el-menu-item,
.sidebar-menu .el-sub-menu__title {
  color: #bfcbd9;
  border-bottom: none;
}

.sidebar-menu .el-menu-item:hover,
.sidebar-menu .el-sub-menu__title:hover {
  background-color: #263445;
  color: #409eff;
}

.sidebar-menu .el-menu-item.is-active {
  background-color: #409eff;
  color: white;
}

.sidebar-menu .el-sub-menu .el-menu-item {
  background-color: #1f2d3d;
  padding-left: 50px;
}

.sidebar-menu .el-sub-menu .el-menu-item:hover {
  background-color: #001528;
}

.sidebar-menu .el-sub-menu .el-menu-item.is-active {
  background-color: #409eff;
}
</style> 