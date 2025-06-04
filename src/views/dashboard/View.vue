<template>
  <div class="dashboard-view">
    <div class="dashboard-header">
      <h2>{{ dashboardInfo.name }}</h2>
      <div class="actions">
        <el-button type="primary" link @click="handleEdit" v-if="hasEditPermission">
          <el-icon><Edit /></el-icon>
          编辑
        </el-button>
        <el-button type="primary" link @click="handleRefresh">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
      </div>
    </div>

    <div class="dashboard-content" v-loading="loading">
      <!-- 仪表盘内容渲染区域 -->
      <grid-layout
        v-if="!loading"
        :layout="layout"
        :col-num="12"
        :row-height="30"
        :margin="[10, 10]"
        :is-draggable="false"
        :is-resizable="false"
      >
        <grid-item
          v-for="item in layout"
          :key="item.i"
          :x="item.x"
          :y="item.y"
          :w="item.w"
          :h="item.h"
          :i="item.i"
        >
          <!-- 根据图表类型渲染不同的组件 -->
          <component
            :is="getChartComponent(item.type)"
            :config="item.config"
            :data="item.data"
          />
        </grid-item>
      </grid-layout>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Edit, Refresh } from '@element-plus/icons-vue'
import { GridLayout, GridItem } from 'vue3-grid-layout-next'
import { getDashboard, checkPermission } from '@/api/dashboard'

const route = useRoute()
const router = useRouter()
const loading = ref(true)
const hasEditPermission = ref(false)
const dashboardInfo = ref({
  id: '',
  name: '',
  config: {},
  layout: []
})
const layout = ref([])

// 检查权限
const checkEditPermission = async (dashboardId: string) => {
  try {
    const result = await checkPermission('dashboard_edit', dashboardId)
    hasEditPermission.value = result.data.hasPermission
  } catch (error) {
    console.error('检查权限失败:', error)
    hasEditPermission.value = false
  }
}

// 加载仪表盘数据
const loadDashboard = async () => {
  try {
    loading.value = true
    const dashboardId = route.params.id as string
    
    // 检查权限
    await checkEditPermission(dashboardId)
    
    // 获取仪表盘数据
    const result = await getDashboard(dashboardId)
    if (result.code === 200) {
      dashboardInfo.value = result.data
      layout.value = result.data.layout
    } else {
      throw new Error(result.message)
    }
  } catch (error) {
    ElMessage.error('加载仪表盘失败')
  } finally {
    loading.value = false
  }
}

// 根据图表类型获取对应的组件
const getChartComponent = (type: string) => {
  const componentMap = {
    'line': 'LineChart',
    'bar': 'BarChart',
    'pie': 'PieChart',
    'table': 'DataTable'
  }
  return componentMap[type] || 'div'
}

// 处理编辑按钮点击
const handleEdit = () => {
  if (!hasEditPermission.value) {
    ElMessage.warning('您没有编辑权限')
    return
  }
  router.push(`/dashboard/designer/${dashboardInfo.value.id}`)
}

// 处理刷新按钮点击
const handleRefresh = () => {
  loadDashboard()
}

onMounted(() => {
  loadDashboard()
})
</script>

<style scoped>
.dashboard-view {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #f5f7fa;
}

.dashboard-header {
  padding: 16px 24px;
  background: white;
  border-bottom: 1px solid var(--el-border-color-light);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.dashboard-header h2 {
  margin: 0;
  font-size: 18px;
  color: var(--el-text-color-primary);
}

.actions {
  display: flex;
  gap: 12px;
}

.dashboard-content {
  flex: 1;
  padding: 24px;
  overflow: auto;
}
</style> 