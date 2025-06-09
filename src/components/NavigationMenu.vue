<template>
  <el-menu
    :default-active="activeMenu"
    mode="horizontal"
    class="nav-menu"
    @select="handleMenuSelect"
    background-color="#667eea"
    text-color="#fff"
    active-text-color="#ffd04b"
    v-loading="menuLoading"
  >
    <!-- 固定的首页菜单 -->
    <el-menu-item index="/" class="menu-item-home">
      <el-icon><House /></el-icon>
      <span>首页</span>
    </el-menu-item>
    
    <!-- 固定的表单设计器菜单 -->
    <el-menu-item index="/form-designer" class="menu-item-designer">
      <el-icon><Edit /></el-icon>
      <span>表单设计器</span>
    </el-menu-item>
    
    <!-- 固定的打印设计器菜单 -->
    <el-menu-item index="/print-designer" class="menu-item-print">
      <el-icon><Printer /></el-icon>
      <span>打印设计器</span>
    </el-menu-item>
    
    <!-- 固定的报表设计器菜单 -->
    <el-menu-item index="/report-designer" class="menu-item-report">
      <el-icon><TrendCharts /></el-icon>
      <span>报表设计器</span>
    </el-menu-item>
    
    <!-- 固定的Univer报表设计器菜单 -->
    <el-menu-item index="/univer-report-designer" class="menu-item-univer">
      <el-icon><DataAnalysis /></el-icon>
      <span>Univer报表</span>
    </el-menu-item>
    
    <!-- 仪表盘菜单 -->
    <el-sub-menu index="/dashboard" class="menu-item-dashboard">
      <template #title>
        <el-icon><Monitor /></el-icon>
        <span>仪表盘</span>
      </template>
      <el-menu-item index="/dashboard/list">
        <el-icon><Document /></el-icon>
        <span>仪表盘管理</span>
      </el-menu-item>
      <el-menu-item index="/dashboard/create">
        <el-icon><Edit /></el-icon>
        <span>新建仪表盘</span>
      </el-menu-item>
      <el-menu-item index="/dashboard/designer">
        <el-icon><TrendCharts /></el-icon>
        <span>仪表盘设计器</span>
      </el-menu-item>
    </el-sub-menu>
    
    <!-- 数据源管理菜单 -->
    <el-menu-item index="/datasource-manage" class="menu-item-datasource">
      <el-icon><DataAnalysis /></el-icon>
      <span>数据源管理</span>
    </el-menu-item>
    
    <!-- 数据集管理菜单 -->
    <el-menu-item index="/dataset-manage" class="menu-item-dataset">
      <el-icon><Grid /></el-icon>
      <span>数据集管理</span>
    </el-menu-item>
    
    <!-- 动态菜单项 -->
    <template v-for="menu in menuList" :key="menu.id">
      <!-- 有子菜单的情况 -->
      <el-sub-menu 
        v-if="menu.children && menu.children.length > 0" 
        :index="menu.path"
        class="menu-item-parent menu-item-dynamic"
      >
        <template #title>
          <el-icon><component :is="getMenuIcon(menu.icon)" /></el-icon>
          <span>{{ menu.name }}</span>
          <el-tag size="small" type="info" class="dynamic-tag">动态</el-tag>
        </template>
        <el-menu-item
          v-for="child in menu.children"
          :key="child.id"
          :index="child.path"
          @click="handleMenuClick(child)"
          class="menu-item-child menu-item-dynamic"
        >
          <el-icon><component :is="getMenuIcon(child.icon)" /></el-icon>
          <span>{{ child.name }}</span>
          <el-tag size="small" type="info" class="dynamic-tag">动态</el-tag>
        </el-menu-item>
      </el-sub-menu>
      
      <!-- 没有子菜单的情况 -->
      <el-menu-item
        v-else
        :index="menu.path"
        @click="handleMenuClick(menu)"
        class="menu-item-single menu-item-dynamic"
      >
        <el-icon><component :is="getMenuIcon(menu.icon)" /></el-icon>
        <span>{{ menu.name }}</span>
        <el-tag size="small" type="info" class="dynamic-tag">动态</el-tag>
      </el-menu-item>
    </template>
    
    <!-- 固定的工具菜单 -->
    <el-menu-item index="/api-test" class="menu-item-tools">
      <el-icon><Setting /></el-icon>
      <span>API测试</span>
    </el-menu-item>
    
    <!-- 菜单状态指示器 -->
    <div class="menu-status">
      <el-tooltip content="菜单加载状态" placement="bottom">
        <el-icon v-if="!menuLoading" class="status-icon success">
          <CircleCheck />
        </el-icon>
        <el-icon v-else class="status-icon loading">
          <Loading />
        </el-icon>
      </el-tooltip>
    </div>
  </el-menu>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  House,
  Edit,
  More,
  Setting,
  Star,
  Document,
  Management,
  UserFilled,
  Lock,
  Connection,
  DataBoard,
  Grid,
  Monitor,
  Printer,
  User,
  CircleCheck,
  Loading,
  TrendCharts,
  DataAnalysis,
  HomeFilled,
  EditPen,
  Link,
  Tickets,
  Platform
} from '@element-plus/icons-vue'
import request from '@/utils/request'  // 导入封装的请求实例
import { getMenuList, buildMenuTree } from '@/api/menu'
import type { MenuItem } from '@/api/menu'

const route = useRoute()
const router = useRouter()

// 响应式数据
const menuLoading = ref(false)
const menuList = ref<MenuItem[]>([])
const activeMenu = ref('')

// 图标映射
const iconMap: Record<string, any> = {
  house: House,
  edit: Edit,
  setting: Setting,
  document: Document,
  management: Management,
  user: UserFilled,
  lock: Lock,
  connection: Connection,
  databoard: DataBoard,
  grid: Grid,
  monitor: Monitor,
  printer: Printer,
  chart: TrendCharts,
  analysis: DataAnalysis,
  star: Star,
  more: More
}

// 计算属性
const activeIndex = computed(() => route.path)

const getMenuIcon = (iconName?: string | null) => {
  if (!iconName) return Setting
  return iconMap[iconName.toLowerCase()] || Setting
}

const loadMenuData = async () => {
  try {
    menuLoading.value = true
    const result = await getMenuList()
    console.log('菜单接口返回数据:', result)
    if (result.code === 200) {
      // 构建树形结构
      const treeData = buildMenuTree(result.data)
      console.log('构建的菜单树:', treeData)
      menuList.value = treeData
    } else {
      throw new Error(result.message)
    }
  } catch (error) {
    console.error('加载菜单失败:', error)
    ElMessage.error('加载菜单失败')
  } finally {
    menuLoading.value = false
  }
}

const handleMenuClick = (menu: MenuItem) => {
  if (menu.path) {
    router.push(menu.path)
  }
}

const handleMenuSelect = (index: string) => {
  console.log('菜单选择:', index) // 添加调试日志
  
  if (index && index !== route.path) {
    try {
    router.push(index)
      console.log('路由跳转成功:', index)
    } catch (error) {
      console.error('路由跳转失败:', error)
      ElMessage.error(`页面跳转失败: ${index}`)
    }
  }
}

// 生命周期
onMounted(() => {
  loadMenuData()
  
  // 监听菜单更新事件
  window.addEventListener('menuUpdated', loadMenuData)
})

// 组件卸载时清理事件监听
onUnmounted(() => {
  window.removeEventListener('menuUpdated', loadMenuData)
})
</script>

<style scoped>
/* 导航菜单基础样式 */
.nav-menu {
  flex: 1;
  background: transparent !important;
  border: none !important;
  padding: 0 20px;
}

/* 一级菜单项样式 */
:deep(.el-menu--horizontal) {
  border: none !important;
  background: transparent !important;
  display: flex;
  gap: 8px;
}

:deep(.el-menu-item),
:deep(.el-sub-menu__title) {
  height: 48px !important;
  line-height: 48px !important;
  padding: 0 20px !important;
  color: rgba(255, 255, 255, 0.85) !important;
  font-size: 15px !important;
  font-weight: 500;
  letter-spacing: 0.5px;
  border-radius: 8px;
  transition: all 0.3s ease;
  margin: 0 2px;
  
  &:hover, &:focus {
    background: rgba(255, 255, 255, 0.15) !important;
    color: white !important;
  }
  
  &.is-active {
    background: rgba(255, 255, 255, 0.2) !important;
    color: #ffd04b !important;
    font-weight: 600;
  }

  .el-icon {
    margin-right: 8px;
    font-size: 18px;
    vertical-align: middle;
  }
}

/* 子菜单样式 */
:deep(.el-menu--popup) {
  background: rgba(30, 60, 114, 0.95) !important;
  backdrop-filter: blur(12px);
  border-radius: 12px;
  padding: 8px;
  min-width: 200px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
}

:deep(.el-menu--popup .el-menu-item) {
  height: 44px !important;
  line-height: 44px !important;
  padding: 0 16px !important;
  margin: 4px 0;
  border-radius: 6px;
  font-size: 14px !important;
  display: flex;
  align-items: center;
  justify-content: space-between;
  
  &:hover {
    background: rgba(255, 255, 255, 0.1) !important;
  }

  /* 菜单项右侧的数字提示 */
  .menu-badge {
    background: rgba(255, 208, 75, 0.2);
    color: #ffd04b;
    padding: 2px 8px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: 600;
    margin-left: 8px;
  }
}

/* 子菜单箭头图标 */
:deep(.el-sub-menu__icon-arrow) {
  margin-left: 8px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.7);
}

/* 响应式调整 */
@media (max-width: 1200px) {
  :deep(.el-menu-item),
  :deep(.el-sub-menu__title) {
    padding: 0 16px !important;
    font-size: 14px !important;
  }
}

@media (max-width: 768px) {
  .nav-menu {
    padding: 0 8px;
  }
  
  :deep(.el-menu-item),
  :deep(.el-sub-menu__title) {
    padding: 0 12px !important;
    font-size: 13px !important;
    
    .el-icon {
      margin-right: 4px;
      font-size: 16px;
    }
  }
}

/* 基础菜单样式 */
.nav-menu {
  position: relative;
  width: 100%;
  display: flex !important;
  overflow: visible !important; /* 改为可见，不滚动 */
  flex-wrap: nowrap !important;
  justify-content: flex-start !important;
}

/* 菜单项基础样式 */
.nav-menu :deep(.el-menu--horizontal) {
  display: flex !important;
  width: 100% !important; /* 占满整个宽度 */
  flex-wrap: nowrap !important; /* 不换行 */
  justify-content: flex-start !important;
  gap: 2px; /* 减小间距 */
  min-width: 100% !important;
  overflow: visible !important;
  background: transparent;
  border: none;
}

/* 菜单项容器样式 */
.nav-menu :deep(.el-menu--horizontal > .el-menu-item),
.nav-menu :deep(.el-menu--horizontal > .el-sub-menu) {
  flex: 0 0 auto !important;
  margin: 0 !important;
  white-space: nowrap !important;
  min-width: fit-content !important;
}

/* 菜单项基本样式 - 进一步优化宽度 */
.nav-menu :deep(.el-menu-item),
.nav-menu :deep(.el-sub-menu__title) {
  color: rgba(255, 255, 255, 0.8) !important;
  border-bottom: none !important;
  background-color: transparent !important;
  transition: all 0.3s ease;
  padding: 0 6px !important;  /* 进一步减小内边距 */
  height: 56px !important;
  line-height: 56px !important;
  border-radius: 4px;
  font-size: 12px !important; /* 进一步减小字体 */
  font-weight: 500;
  white-space: nowrap !important;
  flex-shrink: 0 !important;
  min-width: fit-content !important;
  
  &:hover, &.is-active {
    background: rgba(255, 255, 255, 0.1) !important;
    color: white !important;
    border-bottom: 2px solid #ffd04b !important;
  }
}

/* 特殊菜单项样式 */
.menu-item-home:hover {
  background: linear-gradient(135deg, rgba(103, 194, 58, 0.3), rgba(103, 194, 58, 0.2)) !important;
}

.menu-item-designer:hover {
  background: linear-gradient(135deg, rgba(64, 158, 255, 0.3), rgba(64, 158, 255, 0.2)) !important;
}

.menu-item-print:hover {
  background: linear-gradient(135deg, rgba(230, 162, 60, 0.3), rgba(230, 162, 60, 0.2)) !important;
}

.menu-item-report:hover {
  background: linear-gradient(135deg, rgba(103, 194, 58, 0.3), rgba(103, 194, 58, 0.2)) !important;
}

.menu-item-dashboard:hover {
  background: linear-gradient(135deg, rgba(144, 147, 153, 0.3), rgba(144, 147, 153, 0.2)) !important;
}

.menu-item-datasource:hover {
  background: linear-gradient(135deg, rgba(19, 206, 102, 0.3), rgba(19, 206, 102, 0.2)) !important;
}

.menu-item-dataset:hover {
  background: linear-gradient(135deg, rgba(255, 170, 0, 0.3), rgba(255, 170, 0, 0.2)) !important;
}

.menu-item-tools:hover {
  background: linear-gradient(135deg, rgba(245, 108, 108, 0.3), rgba(245, 108, 108, 0.2)) !important;
}

/* 菜单徽章样式 */
.menu-badge {
  position: absolute;
  top: 15px;
  right: 15px;
  transform: scale(0.8);
}

.menu-badge :deep(.el-badge__content) {
  background-color: rgba(255, 255, 255, 0.3) !important;
  color: #fff !important;
  border: 1px solid rgba(255, 255, 255, 0.5);
  font-size: 10px;
}

/* 动态标签样式 */
.dynamic-tag {
  margin-left: 8px;
  transform: scale(0.8);
  background: linear-gradient(135deg, #67c23a, #85ce61) !important;
  border: none !important;
  color: #fff !important;
  font-weight: 500;
}

/* 菜单状态指示器 */
.menu-status {
  position: absolute;
  right: -30px;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
}

.status-icon {
  font-size: 16px;
  transition: all 0.3s;
}

.status-icon.success {
  color: #67c23a;
}

.status-icon.loading {
  color: #409eff;
  animation: rotate 1s linear infinite;
}

@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* 菜单项加载动画 */
.nav-menu .el-menu-item,
.nav-menu .el-sub-menu__title {
  animation: slideInDown 0.6s ease-out;
}

@keyframes slideInDown {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 响应式优化 - 弹性设计 */
@media (max-width: 1920px) {
  .nav-menu .el-menu-item,
  .nav-menu .el-sub-menu__title {
    padding: 0 5px !important;
    font-size: 11px;
  }
}

@media (max-width: 1600px) {
  .nav-menu .el-menu-item,
  .nav-menu .el-sub-menu__title {
    padding: 0 4px !important;
    font-size: 10px;
  }
}

@media (max-width: 1400px) {
  .nav-menu .el-menu-item,
  .nav-menu .el-sub-menu__title {
    padding: 0 3px !important;
    font-size: 10px;
  }
  
  .menu-badge,
  .dynamic-tag {
    display: none;
  }
}

@media (max-width: 1200px) {
  .nav-menu .el-menu-item,
  .nav-menu .el-sub-menu__title {
    padding: 0 3px !important;
    font-size: 9px;
  }
  
  .nav-menu .el-menu-item span,
  .nav-menu .el-sub-menu__title span {
    display: none; /* 隐藏文字，只显示图标 */
  }
  
  .nav-menu .el-icon {
    margin-right: 0 !important;
    font-size: 16px;
  }
}

/* 为重要的设计器菜单保留文字显示 */
@media (max-width: 1200px) {
  .menu-item-print span,
  .menu-item-report span {
    display: inline !important;
    font-size: 9px;
  }
  
  .menu-item-print .el-icon,
  .menu-item-report .el-icon {
    margin-right: 4px !important;
  }
}

@media (max-width: 992px) {
  .nav-menu .el-menu-item,
  .nav-menu .el-sub-menu__title {
    padding: 0 4px !important;
    font-size: 10px;
  }
}

@media (max-width: 768px) {
  .nav-menu .el-menu-item,
  .nav-menu .el-sub-menu__title {
    padding: 0 6px !important;
    font-size: 12px;
  }
  
  .nav-menu .el-menu-item span,
  .nav-menu .el-sub-menu__title span {
    display: none;
  }
  
  .menu-status {
    display: none;
  }
}

@media (max-width: 480px) {
  .nav-menu .el-menu-item,
  .nav-menu .el-sub-menu__title {
    padding: 0 4px !important;
    font-size: 11px;
  }
  
  .nav-menu .el-icon {
    font-size: 14px;
  }
}

/* 深色模式支持 */
@media (prefers-color-scheme: dark) {
  .nav-menu .el-sub-menu .el-menu {
    background: linear-gradient(135deg, rgba(30, 30, 30, 0.95), rgba(50, 50, 50, 0.95)) !important;
    border-color: rgba(255, 255, 255, 0.1);
  }
}

/* 高对比度模式支持 */
@media (prefers-contrast: high) {
  .nav-menu .el-menu-item,
  .nav-menu .el-sub-menu__title {
    border: 1px solid rgba(255, 255, 255, 0.3);
  }
  
  .nav-menu .el-menu-item:hover,
  .nav-menu .el-sub-menu__title:hover {
    border-color: #ffd04b;
  }
}

/* 确保菜单不会被省略 */
.nav-menu :deep(.el-menu--horizontal) {
  overflow: visible !important;
}

.nav-menu :deep(.el-menu--horizontal > .el-menu-item) {
  flex-shrink: 0 !important;
}

.nav-menu :deep(.el-menu--horizontal > .el-sub-menu) {
  flex-shrink: 0 !important;
}

/* 菜单项悬停效果 */
.nav-menu .el-menu-item:hover,
.nav-menu .el-sub-menu__title:hover {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0.1)) !important;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  backdrop-filter: blur(10px);
}

/* 激活状态 */
.nav-menu .el-menu-item.is-active {
  background: linear-gradient(135deg, rgba(255, 208, 75, 0.3), rgba(255, 208, 75, 0.2)) !important;
  border-bottom: 3px solid #ffd04b;
  box-shadow: 0 4px 16px rgba(255, 208, 75, 0.4);
  transform: translateY(-1px);
}

/* 设计器菜单特殊样式 - 突出显示但保持紧凑 */
.menu-item-print,
.menu-item-report {
  background: linear-gradient(135deg, rgba(255, 208, 75, 0.2), rgba(255, 208, 75, 0.1)) !important;
  border: 1px solid rgba(255, 208, 75, 0.3) !important;
  font-weight: 600 !important;
  color: #ffd04b !important;
  padding: 0 8px !important; /* 设计器菜单稍微大一点 */
}

.menu-item-dynamic {
  position: relative;
}

.dynamic-tag {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  background-color: #409eff !important;
  border-color: #409eff !important;
  color: white !important;
  padding: 0 4px;
  height: 16px;
  line-height: 16px;
  font-size: 10px;
}

.el-sub-menu .dynamic-tag {
  right: 24px;
}
</style>