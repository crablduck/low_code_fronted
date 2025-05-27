import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { DataSource } from '@/types/dataManagement'

export const useDatasourceStore = defineStore('datasource', () => {
  // 状态
  const dataSources = ref<DataSource[]>([])
  const loading = ref(false)
  const selectedDataSourceId = ref<number | null>(null)

  // 计算属性
  const selectedDataSource = computed(() => {
    if (!selectedDataSourceId.value) return null
    return dataSources.value.find(ds => ds.id === selectedDataSourceId.value) || null
  })

  const onlineDataSources = computed(() => {
    return dataSources.value.filter(ds => ds.status === 'online')
  })

  const offlineDataSources = computed(() => {
    return dataSources.value.filter(ds => ds.status === 'offline')
  })

  const dataSourcesByType = computed(() => {
    const groups: Record<string, DataSource[]> = {}
    dataSources.value.forEach(ds => {
      if (!groups[ds.type]) {
        groups[ds.type] = []
      }
      groups[ds.type].push(ds)
    })
    return groups
  })

  // 操作方法
  const setDataSources = (newDataSources: DataSource[]) => {
    dataSources.value = newDataSources
  }

  const addDataSource = (dataSource: DataSource) => {
    dataSources.value.push(dataSource)
  }

  const updateDataSource = (id: number, updates: Partial<DataSource>) => {
    const index = dataSources.value.findIndex(ds => ds.id === id)
    if (index !== -1) {
      dataSources.value[index] = { ...dataSources.value[index], ...updates }
    }
  }

  const removeDataSource = (id: number) => {
    const index = dataSources.value.findIndex(ds => ds.id === id)
    if (index !== -1) {
      dataSources.value.splice(index, 1)
    }
    
    // 如果删除的是当前选中的数据源，清除选中状态
    if (selectedDataSourceId.value === id) {
      selectedDataSourceId.value = null
    }
  }

  const selectDataSource = (id: number | null) => {
    selectedDataSourceId.value = id
  }

  const setLoading = (isLoading: boolean) => {
    loading.value = isLoading
  }

  const getDataSourceById = (id: number) => {
    return dataSources.value.find(ds => ds.id === id)
  }

  const getDataSourcesByType = (type: string) => {
    return dataSources.value.filter(ds => ds.type === type)
  }

  const clearAll = () => {
    dataSources.value = []
    selectedDataSourceId.value = null
    loading.value = false
  }

  return {
    // 状态
    dataSources,
    loading,
    selectedDataSourceId,
    
    // 计算属性
    selectedDataSource,
    onlineDataSources,
    offlineDataSources,
    dataSourcesByType,
    
    // 方法
    setDataSources,
    addDataSource,
    updateDataSource,
    removeDataSource,
    selectDataSource,
    setLoading,
    getDataSourceById,
    getDataSourcesByType,
    clearAll
  }
}) 