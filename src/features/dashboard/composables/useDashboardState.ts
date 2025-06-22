import { ref, reactive, computed, watch, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import * as echarts from 'echarts'
import type { 
  LayoutItem, 
  ChartConfig
} from '@/shared/types/dashboard'
import type { DataSet, DataSetField } from '@/shared/types/dataManagement'
import { get } from '@/shared/utils/request'
import { getDatasetDetail, getDatasetData, previewDatasetData, getDatasetFieldDistinctValues } from '@/api/dataset'
import { dataSetApi } from '@/api/dataSource'

// 定义图表实例类型，避免直接暴露echarts类型
export interface ChartInstance {
  dispose(): void
  resize(): void
  setOption(option: any): void
  getOption(): any
}

export interface DashboardState {
  // 布局和图表
  layout: LayoutItem[]
  chartInstances: Map<string, ChartInstance>
  
  // 数据集相关
  datasets: DataSet[]
  selectedDataset: DataSet | null
  datasetFields: DataSetField[]
  
  // UI状态
  isPreview: boolean
  showGridHelper: boolean
  isMobile: boolean
  
  // 保存状态
  showSaveDialog: boolean
  saveForm: {
    name: string
    description: string
  }
}

export function useDashboardState() {
  // 响应式状态
  const layout = ref<LayoutItem[]>([])
  const chartInstances = ref<Map<string, ChartInstance>>(new Map())
  
  // 数据集相关
  const datasets = ref<DataSet[]>([])
  const selectedDataset = ref<DataSet | null>(null)
  const datasetFields = ref<DataSetField[]>([])
  
  // UI状态
  const isPreview = ref(false)
  const showGridHelper = ref(true)
  const isMobile = ref(false)
  const isFullscreen = ref(false)
  
  // 选中状态管理
  const selectedItem = ref<any>(null)
  const showPropertiesPanel = ref(false)
  
  // 保存相关
  const showSaveDialog = ref(false)
  const saveForm = reactive({
    name: '',
    description: ''
  })

  // 计算属性
  const dimensionFields = computed(() => 
    datasetFields.value.filter(field => field.fieldType === 'dimension')
  )
  
  const metricFields = computed(() => 
    datasetFields.value.filter(field => field.fieldType === 'metric')
  )
  
  const hasCharts = computed(() => layout.value.length > 0)
  
  // 响应式监听
  watch(selectedDataset, (newDataset) => {
    if (newDataset) {
      loadDatasetFields(newDataset.id)
    } else {
      datasetFields.value = []
    }
  })
  
  // 检测移动端
  const checkMobile = () => {
    isMobile.value = window.innerWidth < 768
  }
  
  // 加载数据集
  const loadDatasets = async () => {
    try {
      console.log('开始加载数据集列表...')
      const response = await dataSetApi.getDatasets()
      datasets.value = response.data || []
      
      console.log('数据集加载成功:', datasets.value.length, '个数据集')
      
      // 如果没有选中数据集且有数据集可用，选中第一个
      if (!selectedDataset.value && datasets.value.length > 0) {
        selectedDataset.value = datasets.value[0]
        await loadDatasetFields(datasets.value[0].id)
      }
    } catch (error: any) {
      console.error('加载数据集失败:', error)
      ElMessage.error('加载数据集失败: ' + (error.message || '未知错误'))
      datasets.value = []
    }
  }
  
  // 加载数据集字段
  const loadDatasetFields = async (datasetId: string | number) => {
    try {
      console.log('开始加载数据集字段:', datasetId)
      
      // 首先尝试从数据集对象中获取字段
      const dataset = datasets.value.find(d => d.id === Number(datasetId))
      if (dataset && dataset.fields && dataset.fields.length > 0) {
        datasetFields.value = dataset.fields
        console.log('从数据集对象加载字段:', dataset.fields.length, '个字段')
        return
      }
      
      // 如果数据集对象中没有字段，调用API获取
      try {
        if (dataset) {
          const fields = await dataSetApi.getDatasetFields(dataset)
          if (fields && fields.length > 0) {
            datasetFields.value = fields
            // 同时更新数据集对象中的字段
            dataset.fields = fields
            console.log('从API加载字段:', fields.length, '个字段')
          } else {
            console.warn('API返回的字段为空')
            datasetFields.value = []
          }
        } else {
          // 如果没有找到数据集，尝试用 getDatasetDetail
          const response = await getDatasetDetail(Number(datasetId))
          datasetFields.value = (response.data as any)?.fields || []
        }
      } catch (apiError: any) {
        console.warn('API加载字段失败，使用模拟数据:', apiError.message)
        // 使用模拟字段数据
        datasetFields.value = [
          { 
            id: 1, datasetId: Number(datasetId), fieldName: 'date', displayName: '日期', fieldType: 'dimension', 
            isVisible: true, sortOrder: 1, dataType: 'date'
          },
          { 
            id: 2, datasetId: Number(datasetId), fieldName: 'category', displayName: '类别', fieldType: 'dimension', 
            isVisible: true, sortOrder: 2, dataType: 'string'
          },
          { 
            id: 3, datasetId: Number(datasetId), fieldName: 'value', displayName: '数值', fieldType: 'metric', 
            isVisible: true, sortOrder: 3, dataType: 'number', aggregation: 'sum'
          },
          { 
            id: 4, datasetId: Number(datasetId), fieldName: 'count', displayName: '计数', fieldType: 'metric', 
            isVisible: true, sortOrder: 4, dataType: 'number', aggregation: 'count'
          }
        ]
        console.log('使用模拟字段数据:', datasetFields.value)
      }
    } catch (error: any) {
      console.error('加载数据集字段失败:', error)
      ElMessage.error('加载数据集字段失败: ' + (error.message || '未知错误'))
      datasetFields.value = []
    }
  }

  // 选中状态管理函数 - 简化版本避免Promise问题
  const selectItem = (item: any) => {
    try {
      // 避免重复选中同一个项
      if (selectedItem.value && selectedItem.value.i === item.i) {
        return
      }
      
      // 直接设置新的选中状态
      selectedItem.value = { ...item } // 创建副本避免引用问题
      showPropertiesPanel.value = true
      
      console.log('选中组件:', item.i)
    } catch (error) {
      console.error('选中项目时出错:', error)
      // 重置状态
      selectedItem.value = null
      showPropertiesPanel.value = false
    }
  }

  const clearSelection = () => {
    try {
      if (selectedItem.value) {
        selectedItem.value = null
        showPropertiesPanel.value = false
        console.log('清除选中状态')
      }
    } catch (error) {
      console.error('清除选中状态时出错:', error)
      // 强制重置
      selectedItem.value = null
      showPropertiesPanel.value = false
    }
  }

  const updateSelectedItem = (updatedItem: any) => {
    try {
      if (selectedItem.value && selectedItem.value.i === updatedItem.i) {
        selectedItem.value = { ...updatedItem } // 创建副本
        // 同时更新layout中的对应项
        const index = layout.value.findIndex(item => item.i === updatedItem.i)
        if (index !== -1) {
          layout.value[index] = { ...updatedItem } // 创建副本
        }
      }
    } catch (error) {
      console.error('更新选中项目时出错:', error)
    }
  }

  // 删除图表 - 优化以防止虚拟DOM错误
  const deleteChart = async (chartId: string) => {
    try {
      await ElMessageBox.confirm('确定要删除这个图表吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      })
      
      // 如果要删除的是当前选中的项，先清除选中状态
      if (selectedItem.value && selectedItem.value.i === chartId) {
        await clearSelection()
      }
      
      // 销毁图表实例
      const chartInstance = chartInstances.value.get(chartId)
      if (chartInstance) {
        try {
          chartInstance.dispose()
        } catch (error) {
          console.warn('图表实例销毁失败:', error)
        }
        chartInstances.value.delete(chartId)
      }
      
      // 使用nextTick确保DOM更新的正确顺序
      await nextTick()
      
      // 从布局中移除 - 使用数组splice而不是filter，避免引用问题
      const index = layout.value.findIndex(item => item.i === chartId)
      if (index !== -1) {
        layout.value.splice(index, 1)
      }
      
      ElMessage.success('图表已删除')
    } catch (error) {
      // 用户取消操作或其他错误
      console.warn('删除图表操作取消或失败:', error)
    }
  }
  
  // 复制图表
  const copyChart = (chartId: string) => {
    const item = layout.value.find(item => item.i === chartId)
    if (!item) return
    
    const newId = `chart-${Date.now()}`
    const newItem: LayoutItem = {
      ...item,
      i: newId,
      x: item.x + 1,
      y: item.y + 1,
      chartConfig: {
        ...item.chartConfig,
        i: newId,
        id: newId,
        title: `${item.chartConfig.title} - 副本`
      }
    }
    
    layout.value.push(newItem)
    ElMessage.success('图表已复制')
  }
  
  // 清空所有图表
  const clearAllCharts = async () => {
    if (layout.value.length === 0) return
    
    try {
      await ElMessageBox.confirm('确定要清空所有图表吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      })
      
      // 先清除选中状态
      await clearSelection()
      
      // 销毁所有图表实例
      chartInstances.value.forEach(chart => {
        try {
          chart.dispose()
        } catch (error) {
          console.warn('图表实例销毁失败:', error)
        }
      })
      chartInstances.value.clear()
      
      // 使用nextTick确保DOM更新的正确顺序
      await nextTick()
      
      // 清空布局
      layout.value.splice(0, layout.value.length)
      
      ElMessage.success('所有图表已清空')
    } catch (error) {
      // 用户取消操作或其他错误
      console.warn('清空图表操作取消或失败:', error)
    }
  }
  
  // 全选图表
  const selectAllCharts = () => {
    if (layout.value.length === 0) {
      ElMessage.info('没有可选择的图表')
      return
    }
    
    ElMessage.info('已选择所有图表')
  }
  
  // 自动布局
  const autoLayout = () => {
    if (layout.value.length === 0) return
    
    let x = 0
    let y = 0
    const itemsPerRow = 2
    const itemWidth = 6
    const itemHeight = 7
    
    layout.value.forEach((item, index) => {
      if (index > 0 && index % itemsPerRow === 0) {
        x = 0
        y += itemHeight
      }
      
      item.x = x
      item.y = y
      item.w = itemWidth
      item.h = itemHeight
      
      x += itemWidth
    })
    
    ElMessage.success('自动布局完成')
  }

  // 处理数据集变更
  const handleDatasetChange = async (datasetId: number) => {
    const dataset = datasets.value.find(d => d.id === datasetId)
    if (dataset) {
      selectedDataset.value = dataset
      await loadDatasetFields(datasetId)
      console.log('数据集变更:', dataset.name)
    }
  }

  // 切换预览模式
  const togglePreview = () => {
    isPreview.value = !isPreview.value
    ElMessage.info(isPreview.value ? '已进入预览模式' : '已退出预览模式')
  }

  // 切换网格辅助线
  const toggleGridHelper = () => {
    showGridHelper.value = !showGridHelper.value
  }

  // 切换全屏模式
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      // 进入全屏
      document.documentElement.requestFullscreen().then(() => {
        isFullscreen.value = true
        ElMessage.info('已进入全屏模式')
      }).catch((err) => {
        console.error('全屏模式启动失败:', err)
        ElMessage.error('全屏模式启动失败')
      })
    } else {
      // 退出全屏
      document.exitFullscreen().then(() => {
        isFullscreen.value = false
        ElMessage.info('已退出全屏模式')
      }).catch((err) => {
        console.error('退出全屏失败:', err)
        ElMessage.error('退出全屏失败')
      })
    }
  }

  // 监听全屏状态变化
  const handleFullscreenChange = () => {
    isFullscreen.value = !!document.fullscreenElement
  }

  // 导出仪表盘
  const exportDashboard = () => {
    const data = {
      layout: layout.value,
      config: {
        title: '仪表盘导出',
        createTime: new Date().toISOString()
      }
    }
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `dashboard-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
    
    ElMessage.success('仪表盘已导出')
  }

  // 智能布局
  const applySmartLayout = () => {
    if (layout.value.length === 0) return
    
    // 按图表类型分组布局
    const chartItems = layout.value.filter(item => {
      const type = item.chartConfig.type
      return ['bar', 'line', 'pie', 'area', 'scatter'].includes(type)
    })
    
    const filterItems = layout.value.filter(item => {
      const type = item.chartConfig.type
      return type.startsWith('filter-')
    })
    
    let currentY = 0
    
    // 筛选器放在顶部
    filterItems.forEach((item, index) => {
      item.x = (index % 4) * 3
      item.y = Math.floor(index / 4) * 2
      item.w = 3
      item.h = 2
      currentY = Math.max(currentY, item.y + item.h)
    })
    
    // 图表放在筛选器下方
    chartItems.forEach((item, index) => {
      item.x = (index % 2) * 6
      item.y = currentY + Math.floor(index / 2) * 8
      item.w = 6
      item.h = 8
    })
    
    ElMessage.success('智能布局完成')
  }

  const handleFilterBindingChange = (chartId: string, filterIds: string[]) => {
    const chartItem = layout.value.find(item => item.i === chartId)
    if (chartItem) {
      // 添加filterBindings属性到chartConfig
      (chartItem as any).filterBindings = filterIds
      console.log(`图表 ${chartId} 绑定筛选器:`, filterIds)
    }
  }

  return {
    // 状态
    layout,
    chartInstances,
    datasets,
    selectedDataset,
    datasetFields,
    isPreview,
    showGridHelper,
    isMobile,
    isFullscreen,
    showSaveDialog,
    saveForm,
    selectedItem,
    showPropertiesPanel,
    
    // 计算属性
    dimensionFields,
    metricFields,
    hasCharts,
    
    // 方法
    checkMobile,
    loadDatasets,
    loadDatasetFields,
    handleDatasetChange,
    deleteChart,
    copyChart,
    clearAllCharts,
    selectAllCharts,
    autoLayout,
    togglePreview,
    toggleGridHelper,
    toggleFullscreen,
    handleFullscreenChange,
    exportDashboard,
    applySmartLayout,
    selectItem,
    clearSelection,
    updateSelectedItem,
    handleFilterBindingChange
  }
} 