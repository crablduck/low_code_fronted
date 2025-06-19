<template>
  <div class="dashboard-designer-refactored">
    <!-- 工具栏 -->
    <DesignerToolbar
      :is-preview="isPreview"
      :show-grid-helper="showGridHelper"
      :is-mobile="isMobile"
      :has-charts="hasCharts"
      @toggle-preview="togglePreview"
      @toggle-grid-helper="toggleGridHelper"
      @smart-layout="applySmartLayout"
      @select-all="selectAllCharts"
      @clear-all="clearAllCharts"
      @export-dashboard="exportDashboard"
      @save-dashboard="showSaveDialog = true"
    />
    
    <div class="main-content">
      <!-- 左侧面板 -->
      <DesignerSidebar
        :is-mobile="isMobile"
        @chart-drag-start="handleDragStart"
        @component-drag-start="handleComponentDragStart"
      />
      
      <!-- 中间画布区域 -->
      <DesignerCanvas
        :layout="layout"
        @update:layout="layout = $event"
        :selected-chart="selectedChart"
        :is-preview="isPreview"
        :show-grid-helper="showGridHelper"
        :has-charts="hasCharts"
        @drop="handleDrop"
        @chart-click="selectChart"
        @canvas-click="deselectChart"
        @chart-context-menu="handleChartContextMenu"
        @update-config="updateItemConfig"
        @delete-chart="(chartId) => deleteChart(chartId)"
        @copy-chart="(chartId) => copyChart(chartId)"
        @select-all="selectAllCharts"
        @clear-all="clearAllCharts"
        @auto-layout="autoLayout"
        @export="exportDashboard"
        @resize="onResize"
        @resized="onResized"
        @move="onMove"
        @moved="onMoved"
      />
      
      <!-- 右侧配置面板 -->
      <div class="right-panels" :class="{ 'mobile-panels': isMobile }">
        <div class="panels-container">
          <!-- 无选中图表时的提示 -->
          <div v-if="!selectedChart" class="no-chart-selected">
            <div class="no-chart-content">
              <div class="hint-icon-wrapper">
                <el-icon class="hint-icon"><DataBoard /></el-icon>
              </div>
              <h4>请选择一个图表</h4>
              <p>点击画布中的图表来配置其数据源和样式属性</p>
              <div class="hint-steps">
                <div class="step-item">
                  <span class="step-number">1</span>
                  <span>从左侧拖拽图表类型到画布</span>
                </div>
                <div class="step-item">
                  <span class="step-number">2</span>
                  <span>点击图表进行配置</span>
                </div>
              </div>
            </div>
          </div>
          
          <!-- 图表配置面板 -->
          <div class="config-panel" v-if="selectedChart">
            <div class="panel-header">
              <h3>图表配置</h3>
              <el-button v-if="isMobile" @click="showConfigPanel = false" type="text" size="small">
                <el-icon><Close /></el-icon>
              </el-button>
            </div>

            <!-- 配置标签页 -->
            <el-tabs v-model="activeConfigTab" class="config-tabs" type="card">
              <!-- 数据源配置标签页 -->
              <el-tab-pane name="dataset" v-if="selectedChart">
                <template #label>
                  <div class="tab-label">
                    <el-icon><DataAnalysis /></el-icon>
                    <span>数据源</span>
                  </div>
                </template>
                
                <!-- 基础图表配置 -->
                <div class="basic-chart-config">
                  <el-form label-width="80px" size="small">
                    <el-form-item label="图表标题">
                      <el-input 
                        v-model="selectedChart.title" 
                        @change="updateSelectedChart"
                        placeholder="请输入图表标题"
                      />
                    </el-form-item>
                    
                    <el-form-item label="数据集">
                      <el-select 
                        v-model="selectedChart.datasetId" 
                        @change="handleDatasetChange"
                        placeholder="请选择数据集"
                        style="width: 100%"
                      >
                        <el-option
                          v-for="dataset in datasets"
                          :key="dataset.id"
                          :label="dataset.name"
                          :value="dataset.id"
                        />
                      </el-select>
                    </el-form-item>
                    
                    <!-- 字段映射配置 -->
                    <template v-if="selectedDataset && isChartType(selectedChart.type)">
                      <el-form-item label="X轴字段" v-if="['bar', 'line', 'area'].includes(selectedChart.type)">
                        <el-select 
                          v-model="selectedChart.fieldMapping.xField" 
                          @change="updateSelectedChart"
                          placeholder="请选择X轴字段"
                          style="width: 100%"
                        >
                          <el-option
                            v-for="field in dimensionFields"
                            :key="field.fieldName"
                            :label="field.displayName || field.fieldName"
                            :value="field.fieldName"
                          />
                        </el-select>
                      </el-form-item>
                      
                      <el-form-item label="Y轴字段" v-if="['bar', 'line', 'area'].includes(selectedChart.type)">
                        <el-select 
                          v-model="selectedChart.fieldMapping.yField" 
                          @change="updateSelectedChart"
                          placeholder="请选择Y轴字段"
                          style="width: 100%"
                        >
                          <el-option
                            v-for="field in metricFields"
                            :key="field.fieldName"
                            :label="field.displayName || field.fieldName"
                            :value="field.fieldName"
                          />
                        </el-select>
                      </el-form-item>
                      
                      <el-form-item label="名称字段" v-if="selectedChart.type === 'pie'">
                        <el-select 
                          v-model="selectedChart.fieldMapping.nameField" 
                          @change="updateSelectedChart"
                          placeholder="请选择名称字段"
                          style="width: 100%"
                        >
                          <el-option
                            v-for="field in dimensionFields"
                            :key="field.fieldName"
                            :label="field.displayName || field.fieldName"
                            :value="field.fieldName"
                          />
                        </el-select>
                      </el-form-item>
                      
                      <el-form-item label="数值字段" v-if="selectedChart.type === 'pie'">
                        <el-select 
                          v-model="selectedChart.fieldMapping.valueField" 
                          @change="updateSelectedChart"
                          placeholder="请选择数值字段"
                          style="width: 100%"
                        >
                          <el-option
                            v-for="field in metricFields"
                            :key="field.fieldName"
                            :label="field.displayName || field.fieldName"
                            :value="field.fieldName"
                          />
                        </el-select>
                      </el-form-item>
                    </template>

                    <!-- 字段展示区域 -->
                    <div v-if="selectedDataset" class="fields-display-section">
                      <div class="section-header">
                        <el-icon><Grid /></el-icon>
                        <span>字段信息</span>
                        <el-tag size="small" type="info" class="field-count">
                          共 {{ datasetFields.length || 0 }} 个字段
                        </el-tag>
                      </div>
                      
                      <div class="fields-container">
                        <!-- 维度字段 -->
                        <div class="field-group">
                          <div class="field-group-header">
                            <el-icon><Menu /></el-icon>
                            <span>维度字段</span>
                            <el-tag size="small" type="primary">{{ dimensionFields.length }}</el-tag>
                          </div>
                          <div class="field-list">
                            <div 
                              v-for="field in dimensionFields" 
                              :key="field.fieldName"
                              class="field-item dimension-field"
                            >
                              <el-icon class="field-icon"><CirclePlus /></el-icon>
                              <span class="field-name">{{ field.displayName || field.fieldName }}</span>
                              <el-tag size="small" type="info">{{ field.fieldType }}</el-tag>
                            </div>
                            <div v-if="dimensionFields.length === 0" class="empty-fields">
                              <el-icon><InfoFilled /></el-icon>
                              <span>暂无维度字段</span>
                            </div>
                          </div>
                        </div>
                        
                        <!-- 指标字段 -->
                        <div class="field-group">
                          <div class="field-group-header">
                            <el-icon><DataAnalysis /></el-icon>
                            <span>指标字段</span>
                            <el-tag size="small" type="success">{{ metricFields.length }}</el-tag>
                          </div>
                          <div class="field-list">
                            <div 
                              v-for="field in metricFields" 
                              :key="field.fieldName"
                              class="field-item metric-field"
                            >
                              <el-icon class="field-icon"><TrendCharts /></el-icon>
                              <span class="field-name">{{ field.displayName || field.fieldName }}</span>
                              <el-tag size="small" type="success">{{ field.aggregation || '指标' }}</el-tag>
                            </div>
                            <div v-if="metricFields.length === 0" class="empty-fields">
                              <el-icon><InfoFilled /></el-icon>
                              <span>暂无指标字段</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </el-form>
                </div>
              </el-tab-pane>

              <!-- 图表样式配置标签页 -->
              <el-tab-pane name="style" v-if="selectedChart && isChartType(selectedChart.type)">
                <template #label>
                  <div class="tab-label">
                    <el-icon><Setting /></el-icon>
                    <span>样式配置</span>
                  </div>
                </template>
                <div class="style-config-container">
                  <el-form label-width="80px" size="small">
                    <el-form-item label="显示图例" v-if="['bar', 'line', 'pie', 'area'].includes(selectedChart.type)">
                      <el-switch 
                        v-model="selectedChart.showLegend" 
                        @change="updateSelectedChart"
                      />
                    </el-form-item>
                    
                    <el-form-item label="显示工具栏" v-if="['bar', 'line', 'pie', 'area'].includes(selectedChart.type)">
                      <el-switch 
                        v-model="selectedChart.showToolbox" 
                        @change="updateSelectedChart"
                      />
                    </el-form-item>
                    
                    <el-form-item label="数据限制">
                      <el-input-number 
                        v-model="selectedChart.dataLimit" 
                        @change="updateSelectedChart"
                        :min="10"
                        :max="10000"
                        :step="10"
                      />
                    </el-form-item>
                  </el-form>
                </div>
              </el-tab-pane>
            </el-tabs>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 保存对话框 -->
    <el-dialog 
      v-model="showSaveDialog" 
      :title="dashboardId ? '更新仪表盘' : '保存仪表盘'" 
      width="500px"
    >
      <el-form :model="saveForm" label-width="80px">
        <el-form-item label="名称" required>
          <el-input v-model="saveForm.name" placeholder="请输入仪表盘名称" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input 
            v-model="saveForm.description" 
            type="textarea" 
            placeholder="请输入仪表盘描述"
            :rows="3"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showSaveDialog = false">取消</el-button>
          <el-button type="primary" @click="handleSaveDashboard">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { 
  Setting, 
  DataAnalysis, 
  Grid, 
  Menu, 
  CirclePlus, 
  InfoFilled, 
  TrendCharts, 
  Close 
} from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import { getDashboardDetail } from '@/api/dashboard'
import { DashboardStatus, DashboardType } from '@/shared/types/dashboard'

// 组件导入
import DesignerToolbar from '../components/designer/DesignerToolbar.vue'
import DesignerSidebar from '../components/designer/DesignerSidebar.vue'
import DesignerCanvas from '../components/designer/DesignerCanvas.vue'

// 组合式函数
import { useDashboardState } from '../composables/useDashboardState'
import { useDragAndDrop } from '../composables/useDragAndDrop'

// 路由
const route = useRoute()
const dashboardId = route.params.id as string

// 使用组合式函数
const {
  // 状态
  layout,
  selectedChart,
  chartInstances,
  datasets,
  selectedDataset,
  datasetFields,
  isPreview,
  showGridHelper,
  isMobile,
  globalFiltersConfig,
  activeConfigTab,
  showConfigPanel,
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
  applySmartLayout,
  getDefaultFilterOptions
} = useDashboardState()

// 获取默认筛选器值
const getDefaultFilterValue = (filterType: string) => {
  const defaultValueMap: Record<string, any> = {
    'filter-select': null,
    'filter-multiselect': [],
    'filter-date': null,
    'filter-daterange': null,
    'filter-slider': 50,
    'filter-input': ''
  }
  return defaultValueMap[filterType] || null
}

const {
  // 拖拽处理
  handleDragStart,
  handleComponentDragStart,
  handleCanvasDrop,
  isChartType,
  isFilterType,
  isTextType,
  setDefaultValueFunctions
} = useDragAndDrop()

// 设置默认值函数
setDefaultValueFunctions(getDefaultFilterOptions, getDefaultFilterValue)

// 处理拖拽放下
const handleDrop = (event: DragEvent) => {
  const newChart = handleCanvasDrop(
    event, 
    layout.value, 
    selectedDataset.value, 
    datasetFields.value, 
    initChartInstance
  )
  
  if (newChart) {
    selectedChart.value = newChart
  }
}

// 初始化图表实例（废弃，现在由ChartItem组件自己管理）
const initChartInstance = async (chartId: string, config: any) => {
  // 注意：图表实例现在由ChartItem组件自己管理，避免重复初始化
  console.log(`图表 ${chartId} 实例管理已移交给ChartItem组件`)
}

// 更新项目配置
const updateItemConfig = (itemId: string, config: any) => {
  const item = layout.value.find(item => item.i === itemId)
  if (item) {
    console.log(`更新图表 ${itemId} 配置:`, config)
    
    // 确保字段映射对象存在
    if (!item.chartConfig.fieldMapping) {
      item.chartConfig.fieldMapping = {}
    }
    
    // 更新配置并触发响应性
    item.chartConfig = {
      ...item.chartConfig,
      ...config,
      fieldMapping: {
        ...item.chartConfig.fieldMapping,
        ...(config.fieldMapping || {})
      }
    }
    
    if (selectedChart.value?.i === itemId) {
      selectedChart.value = {
        ...selectedChart.value,
        ...config,
        fieldMapping: {
          ...selectedChart.value.fieldMapping,
          ...(config.fieldMapping || {})
        }
      }
    }
    
    // 强制触发布局更新，确保 ChartItem 重新渲染
    layout.value = [...layout.value]
    
    console.log(`图表 ${itemId} 配置更新完成:`, item.chartConfig)
  }
}

// 右键菜单处理
const handleChartContextMenu = (event: MouseEvent, item: any) => {
  event.preventDefault()
}

// 保存仪表盘
const handleSaveDashboard = async () => {
  if (!saveForm.name.trim()) {
    ElMessage.warning('请输入仪表盘名称')
    return
  }
  
  try {
    const dashboardData = {
      name: saveForm.name,
      description: saveForm.description,
      layout: JSON.stringify(layout.value),
      status: DashboardStatus.DRAFT,
      type: DashboardType.CUSTOM
    }
    
    if (dashboardId) {
      // 更新现有仪表盘
      const { updateDashboard } = await import('@/api/dashboard')
      const result = await updateDashboard(dashboardId, dashboardData)
      
      if (result.code === 200) {
        ElMessage.success('更新成功')
      } else {
        throw new Error(result.message || '更新失败')
      }
    } else {
      // 创建新仪表盘
      const { createDashboard } = await import('@/api/dashboard')
      const result = await createDashboard(dashboardData)
      
      if (result.code === 200) {
        ElMessage.success('保存成功')
      } else {
        throw new Error(result.message || '保存失败')
      }
    }
    
    showSaveDialog.value = false
  } catch (error) {
    console.error('保存仪表盘失败:', error)
    ElMessage.error(dashboardId ? '更新失败' : '保存失败')
  }
}





// 布局事件处理
const onMove = (i: string, newX: number, newY: number) => {
  // 移动中的逻辑
  console.log(`图表 ${i} 移动中: (${newX}, ${newY})`)
}

const onMoved = (i: string, newX: number, newY: number) => {
  // 移动完成的逻辑
  console.log(`图表 ${i} 移动完成: (${newX}, ${newY})`)
}

const onResize = (i: string, newH: number, newW: number) => {
  // 调整大小中的逻辑
  console.log(`图表 ${i} 调整大小中: ${newW}x${newH}`)
}

const onResized = (i: string, newH: number, newW: number, newHPx: number, newWPx: number) => {
  // 调整大小完成的逻辑
  console.log(`图表 ${i} 调整大小完成: ${newW}x${newH} (${newWPx}x${newHPx}px)`)
  
  // 更新布局中的尺寸信息
  const item = layout.value.find(item => item.i === i)
  if (item) {
    item.w = newW
    item.h = newH
    
    // 触发布局更新，这会导致 ChartItem 重新渲染（因为 key 包含了 w 和 h）
    layout.value = [...layout.value]
    
    console.log(`图表 ${i} 布局信息已更新，ChartItem 将重新渲染`)
  }
}

// 加载仪表盘数据
const loadDashboardData = async () => {
  if (!dashboardId) return
  
  try {
    console.log('加载仪表盘数据，ID:', dashboardId)
    const result = await getDashboardDetail(dashboardId)
    
    if (result.code === 200 && result.data) {
      const dashboardData = result.data
      console.log('获取到的仪表盘数据:', dashboardData)
      
      // 恢复布局数据
      if (dashboardData.layout && Array.isArray(dashboardData.layout)) {
        layout.value = dashboardData.layout
        console.log('恢复的布局数据:', layout.value)
        
        // 如果有选中的第一个图表，自动选中它
        if (layout.value.length > 0) {
          const firstChart = layout.value[0]
          if (firstChart.chartConfig) {
            selectedChart.value = { ...firstChart.chartConfig, i: firstChart.i }
            console.log('自动选中第一个图表:', selectedChart.value)
          }
        }
      }
      
      // 恢复保存表单数据
      if (dashboardData.name) {
        saveForm.name = dashboardData.name
      }
      if (dashboardData.description) {
        saveForm.description = dashboardData.description
      }
      
      ElMessage.success('仪表盘数据加载成功')
      
      // 图表实例现在由ChartItem组件自己管理，不需要在这里初始化
      console.log('仪表盘布局恢复完成，图表将由各自的ChartItem组件负责渲染')
      
    } else {
      throw new Error(result.message || '获取仪表盘数据失败')
    }
  } catch (error) {
    console.error('加载仪表盘数据失败:', error)
    ElMessage.error('加载仪表盘数据失败')
  }
}

// 生命周期
onMounted(async () => {
  checkMobile()
  await loadDatasets()
  
  // 如果有仪表盘ID，加载仪表盘数据
  if (dashboardId) {
    await loadDashboardData()
  }
  
  window.addEventListener('resize', checkMobile)
})

onUnmounted(() => {
  window.removeEventListener('resize', checkMobile)
  
  // 清理图表实例
  chartInstances.value.forEach(chart => chart.dispose())
  chartInstances.value.clear()
})
</script>

<style lang="scss" scoped>
.dashboard-designer-refactored {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  
  .main-content {
    display: flex;
    flex: 1;
    height: calc(100vh - 60px);
    
    .right-panels {
      width: 380px;
      background: white;
      border-left: 1px solid #e4e7ed;
      overflow-y: auto;
      flex-shrink: 0;
      box-shadow: -2px 0 8px rgba(0, 0, 0, 0.1);
      
      .panels-container {
        height: 100%;
      }
      
      .config-panel {
        padding: 0;
        height: 100%;
        
        .panel-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 20px;
          background: linear-gradient(135deg, #f8fbff 0%, #e8f5e8 100%);
          border-bottom: 1px solid #e3f2fd;
          position: relative;
          
          &::before {
            content: '';
            position: absolute;
            left: 0;
            top: 0;
            bottom: 0;
            width: 4px;
            background: linear-gradient(180deg, #2196f3 0%, #4caf50 100%);
            border-radius: 0 2px 2px 0;
          }
          
          h3 {
            margin: 0;
            font-size: 15px;
            font-weight: 500;
            color: #1976d2;
            display: flex;
            align-items: center;
            gap: 8px;
            
            &::before {
              content: '';
              width: 6px;
              height: 6px;
              background: #2196f3;
              border-radius: 50%;
              flex-shrink: 0;
            }
          }
          
          .el-button {
            background: transparent;
            border: 1px solid #e3f2fd;
            color: #1976d2;
            padding: 4px 8px;
            font-size: 12px;
            border-radius: 4px;
            
            &:hover {
              background: rgba(33, 150, 243, 0.08);
              border-color: #bbdefb;
            }
          }
        }
        
        .config-tabs {
          height: calc(100% - 70px);
          
          :deep(.el-tabs__header) {
            margin: 0;
            background: #f8fbff;
            border-bottom: 1px solid #e3f2fd;
            
            .el-tabs__nav-wrap {
              padding: 0 20px;
            }
            
            .el-tabs__item {
              color: #78909c;
              border: none;
              font-weight: 400;
              transition: all 0.2s ease;
              
              &:hover {
                color: #1976d2;
              }
              
              &.is-active {
                color: #1976d2;
                background: white;
                border-bottom: 2px solid #2196f3;
                font-weight: 500;
              }
              
              .tab-label {
                display: flex;
                align-items: center;
                gap: 6px;
                font-size: 13px;
                
                .el-icon {
                  font-size: 14px;
                }
              }
            }
          }
          
          :deep(.el-tabs__content) {
            padding: 20px;
            height: calc(100% - 60px);
            overflow-y: auto;
          }
        }
        
        .basic-chart-config {
          .el-form-item {
            margin-bottom: 20px;
            
            .el-form-item__label {
              color: #303133;
              font-weight: 500;
            }
          }
        }
        
        .style-config-container {
          .el-form-item {
            margin-bottom: 16px;
          }
        }
        
        // 字段展示区域样式
        .fields-display-section {
          margin-top: 20px;
          border-top: 1px solid #f0f2f5;
          padding-top: 20px;
          
          .section-header {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 16px;
            
            .el-icon {
              color: #409eff;
              font-size: 16px;
            }
            
            span {
              font-size: 14px;
              font-weight: 600;
              color: #303133;
            }
            
            .field-count {
              margin-left: auto;
            }
          }
          
          .fields-container {
            .field-group {
              margin-bottom: 16px;
              
              .field-group-header {
                display: flex;
                align-items: center;
                gap: 8px;
                margin-bottom: 8px;
                padding: 8px 12px;
                background: #f5f7fa;
                border-radius: 4px;
                
                .el-icon {
                  color: #606266;
                  font-size: 14px;
                }
                
                span {
                  font-size: 13px;
                  font-weight: 500;
                  color: #606266;
                }
                
                .el-tag {
                  margin-left: auto;
                }
              }
              
              .field-list {
                .field-item {
                  display: flex;
                  align-items: center;
                  gap: 8px;
                  padding: 8px 12px;
                  margin-bottom: 4px;
                  background: white;
                  border: 1px solid #e4e7ed;
                  border-radius: 4px;
                  transition: all 0.2s ease;
                  
                  &:hover {
                    border-color: #c0c4cc;
                    background: #f8f9fa;
                  }
                  
                  .field-icon {
                    color: #909399;
                    font-size: 14px;
                  }
                  
                  .field-name {
                    flex: 1;
                    font-size: 13px;
                    color: #606266;
                  }
                  
                  .el-tag {
                    font-size: 11px;
                  }
                  
                  &.dimension-field {
                    .field-icon {
                      color: #409eff;
                    }
                  }
                  
                  &.metric-field {
                    .field-icon {
                      color: #67c23a;
                    }
                  }
                }
                
                .empty-fields {
                  display: flex;
                  align-items: center;
                  gap: 8px;
                  padding: 16px 12px;
                  color: #c0c4cc;
                  font-size: 13px;
                  text-align: center;
                  
                  .el-icon {
                    font-size: 16px;
                  }
                }
              }
            }
          }
        }
      }
      
      .no-chart-selected {
        display: flex;
        align-items: center;
        justify-content: center;
        height: 100%;
        padding: 40px 20px;
        background: linear-gradient(135deg, #e3f2fd 0%, #f5f9ff 100%);
        color: #546e7a;
        
        .no-chart-content {
          text-align: center;
          
          .hint-icon-wrapper {
            margin-bottom: 20px;
            
            .hint-icon {
              font-size: 64px;
              color: #90caf9;
            }
          }
          
          h4 {
            margin: 0 0 12px 0;
            font-size: 20px;
            font-weight: 600;
            color: #37474f;
          }
          
          p {
            margin: 0 0 24px 0;
            font-size: 14px;
            line-height: 1.6;
            color: #546e7a;
          }
          
          .hint-steps {
            .step-item {
              display: flex;
              align-items: center;
              justify-content: center;
              gap: 12px;
              margin-bottom: 12px;
              
              .step-number {
                display: flex;
                align-items: center;
                justify-content: center;
                width: 24px;
                height: 24px;
                background: #bbdefb;
                border-radius: 50%;
                font-size: 12px;
                font-weight: bold;
                color: #1976d2;
              }
              
              span:last-child {
                font-size: 13px;
                color: #546e7a;
              }
            }
          }
        }
      }
      
      &.mobile-panels {
        position: fixed;
        top: 60px;
        right: 0;
        width: 100%;
        height: calc(100vh - 60px);
        z-index: 1000;
        transform: translateX(100%);
        transition: transform 0.3s ease;
        
        &.show {
          transform: translateX(0);
        }
      }
    }
  }
}

// 响应式设计
@media (max-width: 768px) {
  .dashboard-designer-refactored {
    .main-content {
      flex-direction: column;
      height: auto;
      
      .right-panels {
        width: 100% !important;
        border-left: none;
        border-top: 1px solid #e4e7ed;
        box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.1);
      }
    }
  }
}

// 全局筛选器在顶部的特殊样式
:deep(.vue-grid-layout) {
  .vue-grid-item {
    transition: all 0.3s ease;
    
    // 筛选器样式
    &[data-filter="true"] {
      .chart-container {
        background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);
        border: 2px solid #e91e63;
        
        .chart-drag-handler {
          background: linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%);
          color: #e91e63;
          
          .chart-type-badge {
            background: rgba(233, 30, 99, 0.1);
            color: #e91e63;
          }
        }
      }
    }
    
    // 图表样式
    &[data-chart="true"] {
      .chart-container {
        background: white;
        border: 1px solid #e4e7ed;
        
        &:hover {
          border-color: #409eff;
          box-shadow: 0 4px 12px rgba(64, 158, 255, 0.15);
        }
      }
    }
    
    // 选中状态
    &.selected {
      .chart-container {
        border-color: #409eff !important;
        box-shadow: 0 0 0 3px rgba(64, 158, 255, 0.2) !important;
        transform: translateY(-2px);
      }
    }
  }
}
</style> 