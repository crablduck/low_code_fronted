import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

// 仪表盘配置类型
export interface DashboardConfig {
  id: string
  name: string
  description?: string
  layout: any[]
  charts: any[]
  createTime: string
  updateTime?: string
}

export const useDashboardStore = defineStore('dashboard', () => {
  // 状态
  const dashboards = ref<DashboardConfig[]>([])
  const currentDashboard = ref<DashboardConfig | null>(null)
  const loading = ref(false)

  // 计算属性
  const dashboardCount = computed(() => dashboards.value.length)

  // 操作方法
  const setDashboards = (newDashboards: DashboardConfig[]) => {
    dashboards.value = newDashboards
  }

  const addDashboard = (dashboard: DashboardConfig) => {
    dashboards.value.push(dashboard)
  }

  const updateDashboard = (id: string, updates: Partial<DashboardConfig>) => {
    const index = dashboards.value.findIndex(d => d.id === id)
    if (index !== -1) {
      dashboards.value[index] = { ...dashboards.value[index], ...updates }
    }
  }

  const removeDashboard = (id: string) => {
    const index = dashboards.value.findIndex(d => d.id === id)
    if (index !== -1) {
      dashboards.value.splice(index, 1)
    }
    
    // 如果删除的是当前仪表盘，清空选择
    if (currentDashboard.value?.id === id) {
      currentDashboard.value = null
    }
  }

  const setCurrentDashboard = (dashboard: DashboardConfig | null) => {
    currentDashboard.value = dashboard
  }

  const setLoading = (isLoading: boolean) => {
    loading.value = isLoading
  }

  return {
    // 状态
    dashboards,
    currentDashboard,
    loading,
    
    // 计算属性
    dashboardCount,
    
    // 操作方法
    setDashboards,
    addDashboard,
    updateDashboard,
    removeDashboard,
    setCurrentDashboard,
    setLoading
  }
}) 