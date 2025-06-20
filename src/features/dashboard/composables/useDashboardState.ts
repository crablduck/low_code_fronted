import { ref, reactive, computed, watch, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import * as echarts from 'echarts'
import type { 
  LayoutItem, 
  ChartConfig, 
  GlobalFilter,
  DashboardGlobalFilters
} from '@/shared/types/dashboard'
import type { DataSet, DataSetField } from '@/shared/types/dataManagement'
import { get } from '@/shared/utils/request'
import { getDatasetDetail, getDatasetData, previewDatasetData, getDatasetFieldDistinctValues } from '@/api/dataset'
import { dataSetApi } from '@/api/dataSource'

export interface DashboardState {
  // 布局和图表
  layout: LayoutItem[]
  selectedChart: ChartConfig | null
  chartInstances: Map<string, echarts.ECharts>
  
  // 数据集相关
  datasets: DataSet[]
  selectedDataset: DataSet | null
  datasetFields: DataSetField[]
  
  // UI状态
  isPreview: boolean
  showGridHelper: boolean
  isMobile: boolean
  
  // 全局筛选器
  globalFilters: GlobalFilter[]
  
  // 保存状态
  showSaveDialog: boolean
  saveForm: {
    name: string
    description: string
  }
  
  // 全局筛选器配置
  globalFiltersConfig: DashboardGlobalFilters
  
  // 配置面板状态
  activeConfigTab: string
  showConfigPanel: boolean
}

export function useDashboardState() {
  // 响应式状态
  const layout = ref<LayoutItem[]>([])
  const selectedChart = ref<ChartConfig | null>(null)
  const chartInstances = ref<Map<string, echarts.ECharts>>(new Map())
  
  // 数据集相关
  const datasets = ref<DataSet[]>([])
  const selectedDataset = ref<DataSet | null>(null)
  const datasetFields = ref<DataSetField[]>([])
  
  // UI状态
  const isPreview = ref(false)
  const showGridHelper = ref(true)
  const isMobile = ref(false)
  
  // 全局筛选器
  const globalFilters = ref<GlobalFilter[]>([])
  
  // 保存相关
  const showSaveDialog = ref(false)
  const saveForm = reactive({
    name: '',
    description: ''
  })
  
  // 全局筛选器配置
  const globalFiltersConfig = ref<DashboardGlobalFilters>({
    filters: [],
    layout: {
      position: 'top',
      columns: 3,
      spacing: 16
    }
  })
  
  // 配置面板状态
  const activeConfigTab = ref('dataset')
  const showConfigPanel = ref(false)
  
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
    } catch (error) {
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
          datasetFields.value = response.data?.fields || []
        }
      } catch (apiError) {
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
    } catch (error) {
      console.error('加载数据集字段失败:', error)
      ElMessage.error('加载数据集字段失败: ' + (error.message || '未知错误'))
      datasetFields.value = []
    }
  }
  
  // 选择图表
  const selectChart = async (chartId: string) => {
    const item = layout.value.find(item => item.i === chartId)
    if (item && item.chartConfig) {
      // 确保 fieldMapping 对象存在
      if (!item.chartConfig.fieldMapping) {
        item.chartConfig.fieldMapping = {}
      }
      
      selectedChart.value = { ...item.chartConfig, i: item.i }
      
      // 确保选中图表的 fieldMapping 也存在
      if (!selectedChart.value.fieldMapping) {
        selectedChart.value.fieldMapping = {}
      }
      
      console.log('选中图表:', selectedChart.value)
      
      // 如果图表有绑定的数据集，自动加载数据集信息
      if (selectedChart.value.datasetId) {
        console.log('图表绑定的数据集ID:', selectedChart.value.datasetId)
        
        // 查找对应的数据集
        let targetDataset = datasets.value.find(ds => ds.id === selectedChart.value.datasetId)
        
        if (!targetDataset) {
          // 如果当前数据集列表中没有，尝试从API加载
          try {
            const { getDatasetDetail } = await import('@/api/dataset')
            const response = await getDatasetDetail(selectedChart.value.datasetId)
            if (response.code === 200 && response.data) {
              targetDataset = response.data
              // 添加到数据集列表中
              if (!datasets.value.find(ds => ds.id === targetDataset.id)) {
                datasets.value.push(targetDataset)
              }
            }
          } catch (error) {
            console.warn('加载数据集详情失败:', error)
          }
        }
        
        if (targetDataset) {
          selectedDataset.value = targetDataset
          console.log('自动选择数据集:', selectedDataset.value.name)
          
          // 加载数据集字段信息
          await loadDatasetFields(targetDataset.id)
          
          ElMessage.success(`已选择图表"${selectedChart.value.title || '未命名图表'}"，数据集"${targetDataset.name}"`)
        } else {
          console.warn('未找到图表绑定的数据集:', selectedChart.value.datasetId)
          ElMessage.warning('图表绑定的数据集不存在，请重新配置数据源')
        }
      } else {
        console.log('图表未绑定数据集，显示配置面板')
        // 如果没有绑定数据集，确保有可用的数据集列表
        if (datasets.value.length === 0) {
          await loadDatasets()
        }
      }
      
      // 确保配置面板显示数据源标签页
      activeConfigTab.value = 'dataset'
    } else {
      console.warn('未找到图表或图表配置:', chartId, item)
    }
  }
  
  // 取消选择图表
  const deselectChart = () => {
    selectedChart.value = null
  }
  
  // 删除图表
  const deleteChart = async (chartId: string) => {
    try {
      await ElMessageBox.confirm('确定要删除这个图表吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      })
      
      // 销毁图表实例
      const chartInstance = chartInstances.value.get(chartId)
      if (chartInstance) {
        chartInstance.dispose()
        chartInstances.value.delete(chartId)
      }
      
      // 从布局中移除
      layout.value = layout.value.filter(item => item.i !== chartId)
      
      // 如果是当前选中的图表，取消选中
      if (selectedChart.value?.i === chartId) {
        selectedChart.value = null
      }
      
      ElMessage.success('图表已删除')
    } catch (error) {
      // 用户取消操作
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
      
      // 销毁所有图表实例
      chartInstances.value.forEach(chart => chart.dispose())
      chartInstances.value.clear()
      
      // 清空布局
      layout.value = []
      selectedChart.value = null
      
      ElMessage.success('所有图表已清空')
    } catch (error) {
      // 用户取消操作
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
  
  // 更新选中图表
  const updateSelectedChart = () => {
    if (!selectedChart.value) return
    
    const item = layout.value.find(item => item.i === selectedChart.value?.i)
    if (item && item.chartConfig) {
      // 确保字段映射对象存在
      if (!item.chartConfig.fieldMapping) {
        item.chartConfig.fieldMapping = {}
      }
      
      // 更新配置并触发响应性
      Object.assign(item.chartConfig, {
        ...selectedChart.value,
        fieldMapping: {
          ...item.chartConfig.fieldMapping,
          ...selectedChart.value.fieldMapping
        }
      })
      
      console.log(`图表 ${selectedChart.value.i} 配置已更新:`, item.chartConfig)
    }
  }
  
  // 处理数据集变更
  const handleDatasetChange = async (datasetId: number) => {
    if (!selectedChart.value) return
    
    console.log('数据集变更:', datasetId)
    
    // 查找对应的数据集
    let targetDataset = datasets.value.find(ds => ds.id === datasetId)
    
    if (!targetDataset) {
      // 如果当前数据集列表中没有，尝试从API加载
      try {
        const { getDatasetDetail } = await import('@/api/dataset')
        const response = await getDatasetDetail(datasetId)
        if (response.code === 200 && response.data) {
          targetDataset = response.data
          // 添加到数据集列表中
          if (!datasets.value.find(ds => ds.id === targetDataset.id)) {
            datasets.value.push(targetDataset)
          }
        }
      } catch (error) {
        console.warn('加载数据集详情失败:', error)
        ElMessage.error('加载数据集详情失败')
        return
      }
    }
    
    if (targetDataset) {
      // 更新选中的数据集
      selectedDataset.value = targetDataset
      
      // 更新图表的数据集ID
      selectedChart.value.datasetId = datasetId
      
      // 重置字段映射，清空所有字段选择
      if (selectedChart.value.fieldMapping) {
        selectedChart.value.fieldMapping = {
          xField: '',
          yField: '',
          nameField: '',
          valueField: '',
          groupField: '',
          sizeField: '',
          tableFields: []
        }
      }
      
      // 加载数据集字段信息
      await loadDatasetFields(datasetId)
      
      // 更新布局中的图表配置
      updateSelectedChart()
      
      console.log('数据集切换成功:', targetDataset.name)
      ElMessage.success(`已切换到数据集"${targetDataset.name}"`)
    } else {
      ElMessage.error('数据集不存在')
    }
  }
  
  // 切换预览模式
  const togglePreview = () => {
    isPreview.value = !isPreview.value
    if (isPreview.value) {
      selectedChart.value = null
    }
  }
  
  // 切换网格辅助
  const toggleGridHelper = () => {
    showGridHelper.value = !showGridHelper.value
  }
  
  // 导出仪表盘配置
  const exportDashboard = () => {
    const config = {
      layout: layout.value,
      globalFilters: globalFilters.value,
      selectedDataset: selectedDataset.value,
      exportTime: new Date().toISOString()
    }
    
    const blob = new Blob([JSON.stringify(config, null, 2)], {
      type: 'application/json'
    })
    
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `dashboard-config-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
    
    ElMessage.success('配置已导出')
  }
  
  // 全局筛选器相关方法
  const handleGlobalFiltersChange = (config: DashboardGlobalFilters) => {
    globalFiltersConfig.value = config
  }
  
  // 获取筛选器默认选项
  const getDefaultFilterOptions = (filterType: string) => {
    const optionsMap: Record<string, any[]> = {
      'filter-select': [
        { label: '北京', value: 'beijing' },
        { label: '上海', value: 'shanghai' },
        { label: '广州', value: 'guangzhou' },
        { label: '深圳', value: 'shenzhen' },
        { label: '杭州', value: 'hangzhou' }
      ],
      'filter-multiselect': [
        { label: '销售部', value: 'sales' },
        { label: '技术部', value: 'tech' },
        { label: '市场部', value: 'marketing' },
        { label: '财务部', value: 'finance' },
        { label: '人事部', value: 'hr' }
      ]
    }
    return optionsMap[filterType] || []
  }
  
  // 获取筛选器默认值
  const getDefaultFilterValue = (filterType: string) => {
    const defaultValueMap: Record<string, any> = {
      'filter-select': 'beijing',
      'filter-multiselect': ['sales', 'tech'],
      'filter-date': '2024-01-15',
      'filter-daterange': ['2024-01-01', '2024-01-31'],
      'filter-slider': 50,
      'filter-input': '示例文本'
    }
    return defaultValueMap[filterType] || null
  }
  
  // 智能布局：筛选器默认在顶部
  const applySmartLayout = () => {
    const filters = layout.value.filter(item => item.chartConfig && isFilterType(item.chartConfig.type))
    const charts = layout.value.filter(item => item.chartConfig && !isFilterType(item.chartConfig.type))
    
    // 重新排列筛选器在顶部
    let filterY = 0
    let filterX = 0
    const filterHeight = 3 // 筛选器默认高度
    const filterWidth = 4  // 筛选器默认宽度
    
    filters.forEach((filter, index) => {
      filter.x = filterX
      filter.y = filterY
      filter.w = filterWidth
      filter.h = filterHeight
      
      filterX += filterWidth
      if (filterX + filterWidth > 12) {
        filterX = 0
        filterY += filterHeight
      }
    })
    
    // 图表从筛选器下方开始
    const chartStartY = filterY + (filters.length > 0 ? filterHeight : 0)
    let chartX = 0
    let chartY = chartStartY
    
    charts.forEach((chart, index) => {
      chart.x = chartX
      chart.y = chartY
      
      chartX += chart.w
      if (chartX >= 12) {
        chartX = 0
        chartY += chart.h
      }
    })
  }
  
  return {
    // 响应式状态
    layout,
    selectedChart,
    chartInstances,
    datasets,
    selectedDataset,
    datasetFields,
    isPreview,
    showGridHelper,
    isMobile,
    globalFilters,
    showSaveDialog,
    saveForm,
    
    // 计算属性
    dimensionFields,
    metricFields,
    hasCharts,
    
    // 方法
    checkMobile,
    loadDatasets,
    loadDatasetFields,
    handleDatasetChange,
    selectChart,
    deselectChart,
    deleteChart,
    copyChart,
    clearAllCharts,
    selectAllCharts,
    autoLayout,
    updateSelectedChart,
    togglePreview,
    toggleGridHelper,
    exportDashboard,
    
    // 全局筛选器相关
    globalFiltersConfig,
    activeConfigTab,
    showConfigPanel,
    handleGlobalFiltersChange,
    getDefaultFilterOptions,
    getDefaultFilterValue,
    applySmartLayout
  }
} 