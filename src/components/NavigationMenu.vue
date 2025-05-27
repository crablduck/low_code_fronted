<template>
  <el-menu
    :default-active="activeIndex"
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
    
    <!-- 仪表盘设计器菜单 -->
    <el-menu-item index="/dashboard-designer" class="menu-item-dashboard">
      <el-icon><Monitor /></el-icon>
      <span>仪表盘设计器</span>
    </el-menu-item>
    
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
    
    <!-- 动态菜单项 - 支持层级菜单和悬停显示子菜单 -->
    <template v-for="menu in topLevelMenus" :key="menu.id">
      <!-- 有子菜单的父菜单 -->
      <el-sub-menu v-if="hasChildren(menu)" :index="menu.path" class="menu-item-parent">
        <template #title>
          <el-icon><component :is="getMenuIcon(menu.icon)" /></el-icon>
          <span>{{ menu.name }}</span>
          <el-badge 
            v-if="getChildren(menu).length > 0" 
            :value="getChildren(menu).length" 
            class="menu-badge"
            type="info"
          />
        </template>
        <!-- 子菜单 -->
        <el-menu-item 
          v-for="childMenu in getChildren(menu)" 
          :key="childMenu.id"
          :index="childMenu.path"
          class="menu-item-child"
        >
          <el-icon><component :is="getMenuIcon(childMenu.icon)" /></el-icon>
          <span>{{ childMenu.name }}</span>
          <!-- 动态生成的表单页面标识 -->
          <el-tag 
            v-if="childMenu.path.includes('auto_page_')" 
            size="small" 
            type="success"
            class="dynamic-tag"
          >
            动态
          </el-tag>
        </el-menu-item>
      </el-sub-menu>
      
      <!-- 没有子菜单的顶级菜单 -->
      <el-menu-item v-else :index="menu.path" class="menu-item-single">
        <el-icon><component :is="getMenuIcon(menu.icon)" /></el-icon>
        <span>{{ menu.name }}</span>
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
  DataAnalysis
} from '@element-plus/icons-vue'

// 接口定义
interface MenuItem {
  id: number
  name: string
  path: string
  parent_id: number | null
  icon: string
  sort_order: number
}

const route = useRoute()
const router = useRouter()

// 响应式数据
const menuLoading = ref(false)
const menuList = ref<MenuItem[]>([])

// 图标映射
const iconMap = {
  'Setting': Setting,
  'Management': Management,
  'DataBoard': DataBoard,
  'Document': Document,
  'User': User,
  'UserFilled': UserFilled,
  'Lock': Lock,
  'Connection': Connection,
  'Edit': Edit,
  'Database': DataBoard,
  'Grid': Grid,
  'Monitor': Monitor,
  'Printer': Printer,
  'TrendCharts': TrendCharts,
  'DataAnalysis': DataAnalysis
}

// 计算属性
const activeIndex = computed(() => route.path)

// 获取顶级菜单（parent_id为null的菜单）
const topLevelMenus = computed(() => {
  return menuList.value
    .filter(menu => menu.parent_id === null)
    .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
})

// 检查菜单是否有子菜单
const hasChildren = (menu: MenuItem) => {
  return menuList.value.some(item => item.parent_id === menu.id)
}

// 获取子菜单
const getChildren = (menu: MenuItem) => {
  return menuList.value
    .filter(item => item.parent_id === menu.id)
    .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
}

const getMenuIcon = (iconName: string) => {
  return iconMap[iconName] || Setting
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

// 方法
const loadMenus = async () => {
  menuLoading.value = true
  
  try {
    const response = await fetch('http://localhost:4000/api/menu-list')
    const result = await response.json()
    
    if (result.code === 200) {
      menuList.value = Array.isArray(result.data) ? result.data : []
    } else {
      throw new Error(result.message || '获取菜单失败')
    }
  } catch (error) {
    console.error('加载菜单失败:', error)
    ElMessage.error('加载菜单失败')
  } finally {
    menuLoading.value = false
  }
}

// 暴露方法供外部调用
defineExpose({
  loadMenus
})

// 生命周期
onMounted(() => {
  loadMenus()
  
  // 监听菜单更新事件
  window.addEventListener('menuUpdated', loadMenus)
})

// 组件卸载时清理事件监听
onUnmounted(() => {
  window.removeEventListener('menuUpdated', loadMenus)
})
</script>

<style scoped>
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
  color: #fff !important;
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

/* 子菜单样式 */
.nav-menu .el-sub-menu .el-menu {
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.95), rgba(118, 75, 162, 0.95)) !important;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  margin-top: 12px;
  padding: 12px 0;
  backdrop-filter: blur(20px);
  min-width: 200px;
}

.nav-menu .el-sub-menu .el-menu-item {
  background-color: transparent !important;
  color: #fff !important;
  height: 48px;
  line-height: 48px;
  padding: 0 20px;
  margin: 4px 12px;
  border-radius: 8px;
  font-size: 14px;
  position: relative;
}

.nav-menu .el-sub-menu .el-menu-item:hover {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0.1)) !important;
  transform: translateX(6px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

/* 图标样式优化 - 减小图标大小 */
.nav-menu .el-icon {
  margin-right: 6px; /* 减小图标与文字间距 */
  font-size: 14px; /* 减小图标大小 */
  transition: all 0.3s;
  flex-shrink: 0;
}

.nav-menu .el-sub-menu .el-icon {
  font-size: 14px;
}

.nav-menu .el-menu-item:hover .el-icon,
.nav-menu .el-sub-menu__title:hover .el-icon {
  transform: scale(1.1);
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
</style> 