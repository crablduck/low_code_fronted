import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { DataSet } from '@/types/dataManagement'

export const useDatasetStore = defineStore('dataset', () => {
  // 状态
  const datasets = ref<DataSet[]>([])
  const selectedDataset = ref<DataSet | null>(null)
  const loading = ref(false)

  // 计算属性
  const activeDatasets = computed(() => 
    datasets.value.filter(ds => ds.status === 'active')
  )

  const inactiveDatasets = computed(() => 
    datasets.value.filter(ds => ds.status === 'inactive')
  )

  const datasetsByDataSource = computed(() => {
    const groups: Record<number, DataSet[]> = {}
    datasets.value.forEach(ds => {
      if (!groups[ds.dataSourceId]) {
        groups[ds.dataSourceId] = []
      }
      groups[ds.dataSourceId].push(ds)
    })
    return groups
  })

  // 操作方法
  const setDatasets = (newDatasets: DataSet[]) => {
    datasets.value = newDatasets
  }

  const addDataset = (dataset: DataSet) => {
    datasets.value.push(dataset)
  }

  const updateDataset = (id: number, updates: Partial<DataSet>) => {
    const index = datasets.value.findIndex(ds => ds.id === id)
    if (index !== -1) {
      datasets.value[index] = { ...datasets.value[index], ...updates }
    }
  }

  const removeDataset = (id: number) => {
    const index = datasets.value.findIndex(ds => ds.id === id)
    if (index !== -1) {
      datasets.value.splice(index, 1)
    }
    
    // 如果删除的是当前选中的数据集，清空选择
    if (selectedDataset.value?.id === id) {
      selectedDataset.value = null
    }
  }

  const selectDataset = (dataset: DataSet | null) => {
    selectedDataset.value = dataset
  }

  const setSelectedDataset = (dataset: DataSet | null) => {
    selectedDataset.value = dataset
  }

  const setLoading = (isLoading: boolean) => {
    loading.value = isLoading
  }

  return {
    // 状态
    datasets,
    selectedDataset,
    loading,
    
    // 计算属性
    activeDatasets,
    inactiveDatasets,
    datasetsByDataSource,
    
    // 操作方法
    setDatasets,
    addDataset,
    updateDataset,
    removeDataset,
    selectDataset,
    setSelectedDataset,
    setLoading
  }
}) 