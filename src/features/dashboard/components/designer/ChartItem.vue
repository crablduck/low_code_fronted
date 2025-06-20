<template>
  <div class="chart-container" :id="`chart-${item.i}`" :class="{ selected: isSelected, 'preview-mode': isPreview }" @click="handleChartClick">
    <!-- 拖拽手柄和标题栏 - 仅在编辑模式下显示，用于拖拽移动位置 -->
    <div v-if="!isPreview" class="chart-drag-handler" title="拖拽移动图表位置">
      <div class="drag-handle" title="拖拽移动">
        <el-icon><Grid /></el-icon>
      </div>
      <span class="chart-title">{{ getItemTitle() }}</span>
      <div class="chart-type-badge">{{ getItemTypeBadge() }}</div>
      <div class="chart-actions" @mousedown.stop @click.stop>
        <el-button size="small" link @click="$emit('duplicate')" title="复制">
          <el-icon><CopyDocument /></el-icon>
        </el-button>
        <el-button size="small" link @click="$emit('remove')" title="删除">
          <el-icon><Delete /></el-icon>
        </el-button>
      </div>
    </div>
    
    <!-- 图表内容区域 -->
    <div class="chart-content" @click="handleChartClick">
      <!-- 图表内容 -->
      <div v-if="isChartType()" class="chart-render-area">
        <!-- 图片类型 -->
        <div v-if="item.chartConfig.type === 'image'" class="image-chart">
          <img 
            v-if="item.chartConfig.imageUrl" 
            :src="item.chartConfig.imageUrl" 
            alt="图片" 
            style="width: 100%; height: 100%; object-fit: contain;"
          />
          <div v-else class="image-placeholder">
            <el-icon><Picture /></el-icon>
            <span>点击配置图片</span>
          </div>
        </div>
        
        <!-- 其他图表类型 -->
        <div v-else class="chart-placeholder">
          <!-- ECharts渲染容器 -->
          <div :id="`echarts-${item.i}`" class="echarts-container"></div>
          
          <!-- 数据加载中状态 -->
          <div v-if="isLoadingData" class="loading-state">
            <div class="loading-spinner"></div>
            <div class="loading-text">正在加载数据...</div>
          </div>
          
          <!-- 数据加载错误状态 -->
          <div v-else-if="dataError" class="error-state">
            <el-icon><Warning /></el-icon>
            <div class="error-title">数据加载失败</div>
            <div class="error-message">{{ dataError }}</div>
            <el-button size="small" @click="retryLoadData" type="primary">重试</el-button>
          </div>
          
          <!-- 占位符内容 - 仅在没有配置数据集时显示 -->
          <div v-else-if="!hasValidDataConfig" class="placeholder-content">
            <div class="chart-icon">
              <el-icon v-if="item.chartConfig.type === 'bar'"><DataBoard /></el-icon>
              <el-icon v-else-if="item.chartConfig.type === 'line'"><TrendCharts /></el-icon>
              <el-icon v-else-if="item.chartConfig.type === 'area'"><TrendCharts /></el-icon>
              <el-icon v-else-if="item.chartConfig.type === 'pie'"><PieChart /></el-icon>
              <el-icon v-else-if="item.chartConfig.type === 'scatter'"><TrendCharts /></el-icon>
              <el-icon v-else-if="item.chartConfig.type === 'table'"><Grid /></el-icon>
              <el-icon v-else><TrendCharts /></el-icon>
            </div>
            <div class="chart-title">{{ getChartTypeLabel(item.chartConfig.type) }}</div>
            <div class="chart-description">{{ getChartDescription(item.chartConfig.type) }}</div>
            <div class="config-hint">点击右侧配置面板设置数据源</div>
          </div>
        </div>
      </div>
      
      <!-- 筛选器组件内容 -->
      <div v-else-if="isFilterType()" class="filter-component">
        <FilterRenderer
          :config="item.chartConfig"
          @value-change="handleFilterValueChange"
          @filter-apply="handleFilterApply"
        />
      </div>
      
      <!-- 文本组件内容 -->
      <div v-else-if="isTextType()" class="text-component">
        <div class="component-wrapper">
          <component 
            :is="getTextComponent()"
            :config="item.chartConfig"
            :is-design-mode="true"
            @update:config="(config) => $emit('update-config', config)"
          />
        </div>
        <!-- 组件渲染失败时的后备内容 -->
        <div v-if="!getTextComponent()" class="component-error">
          <el-icon><Document /></el-icon>
          <span>文本组件加载失败</span>
          <p>点击右侧配置面板重新配置</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineAsyncComponent, ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { 
  Grid, 
  CopyDocument, 
  Delete, 
  Picture, 
  TrendCharts,
  Setting,
  Document,
  DataBoard,
  PieChart,
  Warning
} from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import * as echarts from 'echarts'
import type { LayoutItem } from '@/shared/types/dashboard'

// 导入API
import { previewDatasetData } from '@/api/dataset'
import { getChartData } from '@/services/dashboardDataService'

// 暂时使用静态导入，后续可以改为动态导入
import FilterSelectDesigner from '../dashboard/FilterSelectDesigner.vue'
import FilterMultiSelectDesigner from '../dashboard/FilterMultiSelectDesigner.vue'
import FilterDateDesigner from '../dashboard/FilterDateDesigner.vue'
import FilterDateRangeDesigner from '../dashboard/FilterDateRangeDesigner.vue'
import FilterSliderDesigner from '../dashboard/FilterSliderDesigner.vue'
import FilterInputDesigner from '../dashboard/FilterInputDesigner.vue'
import TextTitleDesigner from '../dashboard/TextTitleDesigner.vue'
import TextContentDesigner from '../dashboard/TextContentDesigner.vue'
import FilterRenderer from '../dashboard/FilterRenderer.vue'

// 导入统一的类型定义
import { chartTypes, componentTypes, filterTypes } from '../../composables/useDragAndDrop'
import { useDragAndDrop } from '../../composables/useDragAndDrop'

interface Props {
  item: LayoutItem
  isSelected: boolean
  isPreview: boolean
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'duplicate': []
  'remove': []
  'update-config': [config: any]
  'chart-click': []
}>()

// 数据加载状态
const isLoadingData = ref(false)
const dataError = ref<string | null>(null)
const chartInstance = ref<echarts.ECharts | null>(null)
const resizeObserver = ref<ResizeObserver | null>(null)

// 获取拖拽相关函数
const { isFilterType: checkIsFilterType, isChartType: checkIsChartType, isTextType: checkIsTextType } = useDragAndDrop()

// 处理图表点击事件
const handleChartClick = () => {
  emit('chart-click')
}

// 注释：组件状态监控逻辑已整合到下方的生命周期钩子中

// 检查是否有有效的数据配置
const hasValidDataConfig = computed(() => {
  const config = props.item.chartConfig
  if (!config.datasetId || !config.fieldMapping) {
    return false
  }
  
  // 根据图表类型验证必要字段
  switch (config.type) {
    case 'bar':
    case 'line':
    case 'area':
      return !!(config.fieldMapping.xField && config.fieldMapping.yField)
    case 'pie':
      return !!(config.fieldMapping.nameField && config.fieldMapping.valueField)
    case 'scatter':
      return !!(config.fieldMapping.xField && config.fieldMapping.yField)
    case 'table':
      return !!(config.fieldMapping.tableFields && config.fieldMapping.tableFields.length > 0)
    default:
      return Object.keys(config.fieldMapping).length > 0
  }
})

// 获取项目标题
const getItemTitle = () => {
  if (isChartType()) {
    return props.item.chartConfig.title || '图表'
  } else if (isFilterType()) {
    return props.item.chartConfig.title || props.item.chartConfig.label || '筛选器'
  } else if (isTextType()) {
    return props.item.chartConfig.title || '文本'
  }
  return '组件'
}

// 获取组件类型标识
const getItemTypeBadge = () => {
  if (isChartType()) {
    const chartType = chartTypes.find(chart => chart.value === props.item.chartConfig.type)
    return chartType?.label || '图表'
  } else if (isFilterType()) {
    const componentType = componentTypes.find(comp => comp.value === props.item.chartConfig.type)
    return componentType?.label || '筛选器'
  } else if (isTextType()) {
    const componentType = componentTypes.find(comp => comp.value === props.item.chartConfig.type)
    return componentType?.label || '文本'
  }
  return '组件'
}

// 判断是否为图表类型
const isChartType = () => {
  return checkIsChartType(props.item.chartConfig.type)
}

// 判断是否为筛选器类型
const isFilterType = () => {
  return checkIsFilterType(props.item.chartConfig.type)
}

// 判断是否为文本类型
const isTextType = () => {
  return checkIsTextType(props.item.chartConfig.type)
}

// 获取筛选器组件
const getFilterComponent = () => {
  const componentMap = {
    'filter-select': FilterSelectDesigner,
    'filter-multiselect': FilterMultiSelectDesigner,
    'filter-date': FilterDateDesigner,
    'filter-daterange': FilterDateRangeDesigner,
    'filter-slider': FilterSliderDesigner,
    'filter-input': FilterInputDesigner
  }
  return componentMap[props.item.chartConfig.type as keyof typeof componentMap] || FilterSelectDesigner
}

// 获取文本组件
const getTextComponent = () => {
  const componentMap = {
    'text-title': TextTitleDesigner,
    'text-content': TextContentDesigner
  }
  return componentMap[props.item.chartConfig.type as keyof typeof componentMap] || TextTitleDesigner
}

// 获取图表类型标签
const getChartTypeLabel = (type: string) => {
  const chartType = chartTypes.find(chart => chart.value === type)
  return chartType?.label || '图表'
}

// 获取图表描述
const getChartDescription = (type: string) => {
  const descriptions: Record<string, string> = {
    'bar': '用于比较不同类别的数据大小',
    'line': '展示数据随时间的变化趋势',
    'pie': '显示各部分占整体的比例关系',
    'scatter': '展示两个变量之间的相关性和分布',
    'area': '显示数据随时间的累积变化趋势',
    'table': '以表格形式展示详细数据信息',
    'image': '展示图片内容和媒体资源',
    'radar': '多维度数据对比分析',
    'gauge': '显示单一指标的进度或状态',
    'funnel': '展示业务流程各阶段转化率',
    'heatmap': '通过颜色深浅表示数据密度',
    'treemap': '层次化数据的矩形树图',
    'liquidfill': '液体填充效果的进度图'
  }
  return descriptions[type] || '数据可视化图表'
}

// 图表容器尺寸监听器
const setupResizeObserver = () => {
  const chartContainer = document.getElementById(`echarts-${props.item.i}`)
  if (!chartContainer || !chartInstance.value) {
    return
  }

  // 如果已经有监听器，先清理
  if (resizeObserver.value) {
    resizeObserver.value.disconnect()
  }

  // 创建新的监听器
  resizeObserver.value = new ResizeObserver((entries) => {
    for (const entry of entries) {
      if (chartInstance.value && !chartInstance.value.isDisposed()) {
        // 延迟执行resize，确保DOM更新完成
        nextTick(() => {
          if (chartInstance.value && !chartInstance.value.isDisposed()) {
            console.log(`图表 ${props.item.i} 容器尺寸变化，执行resize`)
            chartInstance.value.resize()
          }
        })
      }
    }
  })

  resizeObserver.value.observe(chartContainer)
  console.log(`图表 ${props.item.i} 已设置ResizeObserver监听`)
}

// 初始化图表实例
const initChartInstance = () => {
  const chartContainer = document.getElementById(`echarts-${props.item.i}`)
  if (!chartContainer) {
    console.warn(`图表容器未找到: echarts-${props.item.i}`)
    return
  }

  // 检查是否已经有ECharts实例
  const existingInstance = echarts.getInstanceByDom(chartContainer)
  if (existingInstance) {
    console.log(`图表 ${props.item.i} 已存在ECharts实例，先销毁`)
    existingInstance.dispose()
  }

  // 销毁我们自己的旧实例引用
  if (chartInstance.value) {
    console.log(`销毁图表 ${props.item.i} 的旧实例`)
    chartInstance.value.dispose()
    chartInstance.value = null
  }

  // 创建新实例
  try {
    chartInstance.value = echarts.init(chartContainer)
    console.log(`图表 ${props.item.i} ECharts实例创建成功`)
    
    // 设置容器尺寸监听
    setupResizeObserver()
    
    // 监听窗口大小变化
    const handleResize = () => {
      if (chartInstance.value && !chartInstance.value.isDisposed()) {
        chartInstance.value.resize()
      }
    }
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      if (resizeObserver.value) {
        resizeObserver.value.disconnect()
        resizeObserver.value = null
      }
    }
  } catch (error) {
    console.error(`图表 ${props.item.i} ECharts实例创建失败:`, error)
  }
}

// 加载并渲染图表数据
const loadAndRenderChart = async () => {
  const config = props.item.chartConfig
  
  // 检查是否为图表类型且有有效配置
  if (!isChartType() || !hasValidDataConfig.value) {
    return
  }

  isLoadingData.value = true
  dataError.value = null

  try {
    console.log(`开始加载图表数据: ${config.title} (dataset: ${config.datasetId})`)
    
    // 使用 dashboardDataService 的 getChartData 方法
    const echartsOption = await getChartData(
      config.datasetId!,
      config.type,
      config.fieldMapping!,
      {
        title: config.title,
        showLegend: config.showLegend,
        showToolbox: config.showToolbox,
        dataLimit: config.dataLimit
      }
    )

    // 确保图表实例存在且有效
    if (!chartInstance.value || chartInstance.value.isDisposed()) {
      await nextTick()
      initChartInstance()
    }

    if (chartInstance.value && !chartInstance.value.isDisposed() && echartsOption) {
      chartInstance.value.setOption(echartsOption, true)
      console.log(`图表渲染成功: ${config.title}`)
    } else {
      console.warn(`图表 ${config.title} 实例无效，跳过渲染`)
    }

  } catch (error) {
    console.error(`图表数据加载失败: ${config.title}`, error)
    dataError.value = error.message || '未知错误'
    
    // 显示错误信息在图表中
    if (chartInstance.value && !chartInstance.value.isDisposed()) {
      chartInstance.value.setOption({
        title: {
          text: config.title || '图表',
          left: 'center',
          textStyle: { fontSize: 16, fontWeight: 'bold' }
        },
        graphic: {
          elements: [{
            type: 'text',
            left: 'center',
            top: 'middle',
            style: {
              text: `数据加载失败: ${dataError.value}`,
              fontSize: 14,
              fill: '#f56c6c'
            }
          }]
        }
      }, true)
    }
  } finally {
    isLoadingData.value = false
  }
}

// 重试加载数据
const retryLoadData = async () => {
  await loadAndRenderChart()
}

// 处理过滤器值变化
const handleFilterValueChange = (value: any) => {
  console.log('过滤器值变化:', value)
  // 这里可以添加过滤器值变化的处理逻辑
  // 比如更新图表配置或触发其他组件的更新
}

// 处理过滤器应用
const handleFilterApply = (filterData: any) => {
  console.log('应用过滤器:', filterData)
  // 这里可以添加过滤器应用的处理逻辑
  // 比如更新全局过滤条件，重新加载相关图表数据
}

// 组件挂载完成
onMounted(async () => {
  // 如果是图表类型，初始化图表
  if (isChartType()) {
    await nextTick()
    initChartInstance()
    
    // 如果有有效配置，立即加载数据
    if (hasValidDataConfig.value) {
      await loadAndRenderChart()
    }
  }
})

// 组件卸载清理
onUnmounted(() => {
  if (chartInstance.value && !chartInstance.value.isDisposed()) {
    console.log(`清理图表 ${props.item.i} 的ECharts实例`)
    chartInstance.value.dispose()
    chartInstance.value = null
  }
  
  // 清理尺寸监听器
  if (resizeObserver.value) {
    resizeObserver.value.disconnect()
    resizeObserver.value = null
  }
})

// 监控图表配置变化 - 优化版本，更精确地检测变化
watch(() => props.item.chartConfig, async (newConfig, oldConfig) => {
  if (!newConfig || !isChartType()) return

  console.log(`图表 ${props.item.i} 配置变化检测:`, {
    newConfig: newConfig,
    oldConfig: oldConfig
  })

  // 检查关键配置是否发生变化
  const datasetChanged = newConfig.datasetId !== oldConfig?.datasetId
  const fieldMappingChanged = JSON.stringify(newConfig.fieldMapping) !== JSON.stringify(oldConfig?.fieldMapping)
  const typeChanged = newConfig.type !== oldConfig?.type
  const titleChanged = newConfig.title !== oldConfig?.title
  const styleChanged = newConfig.showLegend !== oldConfig?.showLegend || 
                      newConfig.showToolbox !== oldConfig?.showToolbox ||
                      newConfig.dataLimit !== oldConfig?.dataLimit

  const configChanged = datasetChanged || fieldMappingChanged || typeChanged || titleChanged || styleChanged

  if (configChanged) {
    console.log(`图表 ${props.item.i} 配置发生变化，准备重新渲染:`, {
      datasetChanged,
      fieldMappingChanged,
      typeChanged,
      titleChanged,
      styleChanged
    })
    
    // 如果图表类型发生变化，重新初始化图表实例
    if (typeChanged) {
      console.log(`图表 ${props.item.i} 类型变化: ${oldConfig?.type} -> ${newConfig.type}`)
      await nextTick()
      initChartInstance()
    }
    
    // 如果有有效配置，重新加载数据
    if (hasValidDataConfig.value) {
      console.log(`图表 ${props.item.i} 有效配置检查通过，开始加载数据`)
      await loadAndRenderChart()
    } else {
      console.log(`图表 ${props.item.i} 配置不完整，跳过数据加载:`, {
        datasetId: newConfig.datasetId,
        fieldMapping: newConfig.fieldMapping,
        hasValidConfig: hasValidDataConfig.value
      })
    }
  } else {
    console.log(`图表 ${props.item.i} 配置无关键变化，跳过重新渲染`)
  }
}, { deep: true, immediate: false })

// 监控有效数据配置状态变化
watch(() => hasValidDataConfig.value, async (isValid, wasValid) => {
  if (!isChartType()) return
  
  console.log(`图表 ${props.item.i} 有效配置状态变化: ${wasValid} -> ${isValid}`)
  
  if (isValid && !wasValid) {
    // 从无效变为有效，立即加载数据
    console.log(`图表 ${props.item.i} 配置从无效变为有效，立即加载数据`)
    await loadAndRenderChart()
  }
})

// 监控预览模式变化
watch(() => props.isPreview, async (isPreview) => {
  if (isPreview && isChartType() && hasValidDataConfig.value) {
    // 进入预览模式时，确保图表正确渲染
    await nextTick()
    if (chartInstance.value && !chartInstance.value.isDisposed()) {
      chartInstance.value.resize()
    } else {
      initChartInstance()
      await loadAndRenderChart()
    }
  }
})
</script>

<style lang="scss" scoped>
.chart-container {
  width: 100%;
  height: 100%;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  background-color: #ffffff;
  display: flex;
  flex-direction: column;
  position: relative;
  transition: all 0.3s ease;
  
  &:hover {
    border-color: #c6e2ff;
    box-shadow: 0 2px 8px rgba(64, 158, 255, 0.15);
  }
  
  // 选中状态样式
  &.selected {
    border-color: #409eff;
    box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2);
  }

  // 预览模式样式
  &.preview-mode {
    .chart-content {
      height: 100% !important;
      padding: 12px;
    }
  }
  
  .chart-drag-handler {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
    border-bottom: 1px solid #e4e7ed;
    cursor: move;
    user-select: none;
    position: relative;
    pointer-events: all;
    touch-action: none;
    min-height: 36px;
    z-index: 100;
    transition: all 0.2s ease;
    
    &:hover {
      background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
      border-bottom-color: #409eff;
    }
    
    .drag-handle {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 24px;
      height: 24px;
      border-radius: 4px;
      background: rgba(64, 158, 255, 0.15);
      color: #409eff;
      cursor: grab;
      transition: all 0.2s ease;
      border: 1px solid rgba(64, 158, 255, 0.3);
      
      &:hover {
        background: rgba(64, 158, 255, 0.25);
        border-color: rgba(64, 158, 255, 0.5);
        transform: scale(1.05);
      }
      
      &:active {
        cursor: grabbing;
        background: rgba(64, 158, 255, 0.3);
        transform: scale(0.95);
      }
      
      .el-icon {
        font-size: 14px;
        font-weight: bold;
      }
    }
    
    &:hover {
      .chart-actions {
        opacity: 1;
        transform: translateX(0);
      }
    }
    
    .chart-title {
      flex: 1;
      font-size: 13px;
      font-weight: 500;
      color: #303133;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    
    .chart-type-badge {
      font-size: 11px;
      padding: 2px 6px;
      background: rgba(103, 194, 58, 0.1);
      color: #67c23a;
      border-radius: 10px;
      white-space: nowrap;
    }
    
    .chart-actions {
      display: flex;
      align-items: center;
      gap: 4px;
      opacity: 0;
      transform: translateX(10px);
      transition: all 0.2s ease;
      
      .el-button {
        padding: 4px;
        min-height: auto;
        
        &:hover {
          color: #409eff;
          background: rgba(64, 158, 255, 0.1);
        }
        
        &:last-child:hover {
          color: #f56c6c;
          background: rgba(245, 108, 108, 0.1);
        }
        
        .el-icon {
          font-size: 12px;
        }
      }
    }
  }
  
  .chart-content {
    flex: 1;
    height: calc(100% - 40px);
    padding: 12px;
    position: relative;
    
          .chart-render-area {
        width: 100%;
        height: 100%;
        min-height: 200px;
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
      
      .image-chart {
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        
        img {
          max-width: 100%;
          max-height: 100%;
          border-radius: 4px;
        }
      }
      
      .image-placeholder,
      .chart-placeholder {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        width: 100%;
        height: 100%;
        position: relative;
        
        .echarts-container {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          width: 100% !important;
          height: 100% !important;
          min-width: 200px;
          min-height: 150px;
          z-index: 1;
        }
        
        .loading-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 12px;
          z-index: 10;
          
          .loading-spinner {
            width: 32px;
            height: 32px;
            border: 3px solid #f3f3f3;
            border-top: 3px solid #409eff;
            border-radius: 50%;
            animation: spin 1s linear infinite;
          }
          
          .loading-text {
            font-size: 14px;
            color: #606266;
          }
          
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        }
        
        .error-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 8px;
          text-align: center;
          color: #f56c6c;
          z-index: 10;
          
          .el-icon {
            font-size: 48px;
            color: #f56c6c;
          }
          
          .error-title {
            font-size: 16px;
            font-weight: 600;
            margin-bottom: 4px;
          }
          
          .error-message {
            font-size: 12px;
            color: #909399;
            margin-bottom: 12px;
            max-width: 200px;
            word-break: break-word;
          }
        }
        
        .placeholder-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 8px;
          text-align: center;
          color: #909399;
          z-index: 2;
          background: rgba(255, 255, 255, 0.9);
          padding: 20px;
          border-radius: 8px;
          border: 2px dashed #e4e7ed;
          transition: all 0.3s ease;
          
          &:hover {
            border-color: #409eff;
            background: rgba(64, 158, 255, 0.05);
          }
          
          .chart-icon {
            .el-icon {
              font-size: 48px;
              color: #409eff;
            }
          }
          
          .chart-title {
            font-size: 16px;
            font-weight: 600;
            color: #303133;
            margin: 4px 0;
          }
          
          .chart-description {
            font-size: 13px;
            color: #606266;
            margin: 2px 0;
            line-height: 1.4;
          }
          
          .config-hint {
            font-size: 11px;
            color: #909399;
            margin-top: 4px;
            padding: 4px 8px;
            background: #f5f7fa;
            border-radius: 4px;
          }
        }
      }
    }
    
    .filter-component,
    .text-component {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      
      .component-wrapper {
        width: 100%;
        height: 100%;
        position: relative;
        z-index: 1;
      }
      
      .component-error {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 8px;
        text-align: center;
        color: #f56c6c;
        width: 100%;
        min-height: 80px;
        
        .el-icon {
          font-size: 32px;
          color: #f56c6c;
        }
        
        span {
          font-size: 13px;
          font-weight: 500;
        }
        
        p {
          font-size: 11px;
          color: #909399;
          margin: 0;
        }
      }
    }
  }
}
</style> 