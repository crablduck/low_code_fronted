<template>
  <div class="dashboard-designer">
    <div class="toolbar">
      <div class="toolbar-title">
        <el-icon class="toolbar-icon"><TrendCharts /></el-icon>
        仪表盘设计器
      </div>
      <div class="toolbar-actions">
        <el-button-group v-if="!isMobile">
          <el-button type="primary" @click="updateSelectedChart" :disabled="!selectedChart">更新当前图表</el-button>
          <el-button @click="showDataEditor = true">编辑数据</el-button>
          <el-button type="success" @click="showSaveDialog = true">保存仪表盘</el-button>
        </el-button-group>
        <!-- 移动端工具栏下拉菜单 -->
        <el-dropdown v-else trigger="click">
          <el-button type="primary">
            操作<el-icon class="el-icon--right"><ArrowDown /></el-icon>
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item @click="updateSelectedChart" :disabled="!selectedChart">更新当前图表</el-dropdown-item>
              <el-dropdown-item @click="showDataEditor = true">编辑数据</el-dropdown-item>
              <el-dropdown-item @click="showSaveDialog = true">保存仪表盘</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </div>
    
    <div class="main-content">
      <!-- 左侧图表类型面板 -->
      <div class="left-sidebar" :class="{ 'mobile-sidebar': isMobile }">
        <!-- 图表类型选择 -->
        <div class="panel-section">
          <h3 class="section-title">
            <el-icon><TrendCharts /></el-icon>
            图表类型
          </h3>
          <div class="chart-types">
            <div class="chart-type-item" 
                 v-for="type in chartTypes" 
                 :key="type.value"
                 draggable="true"
                 @dragstart="handleDragStart($event, type)">
              <el-icon>
                <component :is="type.icon" />
              </el-icon>
              <span v-if="!isMobile">{{ type.label }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 中间画布区域 -->
      <div class="canvas-container" 
           @dragover.prevent
           @drop="handleDrop">
        
        <!-- 快捷操作工具栏 -->
        <div class="canvas-toolbar" v-if="layout.length > 0">
          <el-button-group size="small">
            <el-button @click="selectAllCharts">
              <el-icon><Select /></el-icon>
              全选
            </el-button>
            <el-button @click="clearAllCharts" type="danger">
              <el-icon><Delete /></el-icon>
              清空
            </el-button>
            <el-button @click="autoLayout">
              <el-icon><Grid /></el-icon>
              自动布局
            </el-button>
            <el-button @click="exportDashboard">
              <el-icon><Download /></el-icon>
              导出
            </el-button>
          </el-button-group>
        </div>

        <grid-layout
          v-model:layout="layout"
          :col-num="12"
          :row-height="30"
          :is-draggable="true"
          :is-resizable="true"
          :vertical-compact="false"
          :use-css-transforms="true"
          :margin="[10, 10]"
          @update:layout="onLayoutUpdated"
        >
          <grid-item
            v-for="item in layout"
            :key="item.i"
            :x="item.x"
            :y="item.y"
            :w="item.w"
            :h="item.h"
            :i="item.i"
            @resize="onResize"
            @resized="onResized"
            @move="onMove"
            @moved="onMoved"
            @click="selectChart(item.i)"
            :drag-allow-from="'.chart-drag-handler'"
            :drag-ignore-from="'.chart-content'"
            class="grid-chart-item"
            :class="{ 'selected': selectedChart?.i === item.i }"
          >
            <div class="chart-container" :id="`chart-${item.i}`">
              <div class="chart-drag-handler">
                <el-icon><Rank /></el-icon>
                <span class="chart-title">{{ item.chartConfig.title || '图表' }}</span>
                <div class="chart-actions">
                  <el-button size="small" type="text" @click.stop="duplicateChart(item)">
                    <el-icon><CopyDocument /></el-icon>
                  </el-button>
                  <el-button size="small" type="text" @click.stop="removeChart(item.i)">
                    <el-icon><Delete /></el-icon>
                  </el-button>
                </div>
              </div>
              <div class="chart-content"></div>
            </div>
          </grid-item>
        </grid-layout>
      </div>

      <!-- 右侧配置面板区域 -->
      <div class="right-panels" :class="{ 'mobile-panels': isMobile }">
        <div class="panels-container">
          <!-- 图表配置面板 -->
          <div class="config-panel" v-if="selectedChart">
            <div class="panel-header">
              <h3>图表配置</h3>
              <el-button v-if="isMobile" @click="toggleConfigPanel" type="text" size="small">
                <el-icon><Close /></el-icon>
              </el-button>
            </div>
            <el-form label-width="80px" class="config-form" size="small">
              <el-form-item label="图表类型">
                <el-select v-model="selectedChart.type" @change="updateSelectedChart" size="small">
                  <el-option label="柱状图" value="bar" />
                  <el-option label="折线图" value="line" />
                  <el-option label="饼图" value="pie" />
                  <el-option label="表格" value="table" />
                </el-select>
              </el-form-item>

              <!-- 数据字段配置区域 -->
              <el-divider content-position="left">字段配置</el-divider>
              
              <!-- 字段配置 -->
              <template v-if="selectedChart.type === 'bar' || selectedChart.type === 'line'">
                <el-form-item label="X轴字段">
                  <div 
                    class="field-drop-zone"
                    @dragover.prevent
                    @drop="handleFieldDrop($event, 'x')"
                    @dragenter="handleDragEnter($event, 'dimension')"
                    @dragleave="handleDragLeave"
                    :class="{ 
                      'has-field': selectedChart.xField,
                      'drag-over': isDragOver && dragFieldType === 'dimension'
                    }"
                    data-field-type="x"
                  >
                    <div class="field-content" v-if="selectedChart.xField">
                      <el-icon><Grid /></el-icon>
                      <span class="field-name">{{ getFieldDisplayName(selectedChart.xField) }}</span>
                      <el-icon class="remove-field" @click.stop="removeField('x')"><Close /></el-icon>
                    </div>
                    <div class="drop-hint" v-else>
                      <el-icon><Grid /></el-icon>
                      拖拽维度字段
                    </div>
                  </div>
                </el-form-item>
                <el-form-item label="Y轴字段">
                  <div 
                    class="field-drop-zone"
                    @dragover.prevent
                    @drop="handleFieldDrop($event, 'y')"
                    @dragenter="handleDragEnter($event, 'metric')"
                    @dragleave="handleDragLeave"
                    :class="{ 
                      'has-field': selectedChart.yField,
                      'drag-over': isDragOver && dragFieldType === 'metric'
                    }"
                    data-field-type="y"
                  >
                    <div class="field-content" v-if="selectedChart.yField">
                      <el-icon><TrendCharts /></el-icon>
                      <span class="field-name">{{ getFieldDisplayName(selectedChart.yField) }}</span>
                      <el-icon class="remove-field" @click.stop="removeField('y')"><Close /></el-icon>
                    </div>
                    <div class="drop-hint" v-else>
                      <el-icon><TrendCharts /></el-icon>
                      拖拽指标字段
                    </div>
                  </div>
                </el-form-item>
              </template>

              <!-- 表格字段配置 -->
              <template v-if="selectedChart.type === 'table'">
                <el-form-item label="显示字段">
                  <div 
                    class="field-drop-zone table-fields"
                    @dragover.prevent
                    @drop="handleTableFieldDrop"
                    :class="{ 'has-field': selectedChart.tableFields?.length }"
                    data-field-type="table"
                  >
                    <div class="field-list" v-if="selectedChart.tableFields?.length">
                      <div v-for="field in selectedChart.tableFields" 
                           :key="field" 
                           class="field-tag">
                        <el-icon><Grid /></el-icon>
                        <span>{{ getFieldDisplayName(field) }}</span>
                        <el-icon class="remove-btn" @click="removeTableField(field)">
                          <Close />
                        </el-icon>
                      </div>
                    </div>
                    <div class="drop-hint" v-else>
                      <el-icon><Grid /></el-icon>
                      拖拽字段到此处
                    </div>
                  </div>
                </el-form-item>
              </template>

              <!-- 图表样式配置 -->
              <el-divider content-position="left">样式配置</el-divider>
              
              <el-form-item label="图表标题">
                <el-input 
                  v-model="selectedChart.title" 
                  @input="updateSelectedChart"
                  placeholder="请输入图表标题"
                  size="small"
                />
              </el-form-item>

              <el-form-item label="显示图例">
                <el-switch 
                  v-model="selectedChart.showLegend" 
                  @change="updateSelectedChart"
                  size="small"
                />
              </el-form-item>

              <el-form-item label="显示工具栏">
                <el-switch 
                  v-model="selectedChart.showToolbox" 
                  @change="updateSelectedChart"
                  size="small"
                />
              </el-form-item>

              <el-form-item label="数据限制">
                <el-input-number 
                  v-model="selectedChart.dataLimit" 
                  @change="updateSelectedChart"
                  :min="10"
                  :max="1000"
                  :step="10"
                  placeholder="数据条数"
                  size="small"
                  style="width: 100%"
                />
              </el-form-item>

              <el-form-item>
                <el-button type="danger" size="small" @click="removeSelectedChart">删除图表</el-button>
              </el-form-item>
            </el-form>
          </div>

          <!-- 数据配置面板 -->
          <div class="data-panel">
            <div class="panel-header">
              <h3>数据配置</h3>
              <div class="panel-actions">
                <el-button-group>
                  <el-button size="small" @click="previewData">
                    <el-icon><View /></el-icon>
                    预览
                  </el-button>
                  <el-button size="small" @click="refreshData">
                    <el-icon><Refresh /></el-icon>
                    刷新
                  </el-button>
                </el-button-group>
              </div>
            </div>
            
            <!-- 数据集选择 -->
            <div class="dataset-selector">
              <el-form label-width="80px" size="small">
                <el-form-item label="数据集">
                  <el-select
                    v-model="selectedDatasetId"
                    placeholder="请选择数据集"
                    @change="handleDatasetChange"
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
              </el-form>
            </div>

            <!-- 字段列表 -->
            <div class="field-sections" v-if="selectedDataset">
              <!-- 维度字段 -->
              <div class="field-section">
                <div class="section-header">
                  <el-icon><Grid /></el-icon>
                  维度字段
                </div>
                <div class="field-list">
                  <div
                    v-for="field in dimensionFields"
                    :key="field.fieldName"
                    class="field-item"
                    draggable="true"
                    @dragstart="handleFieldDragStart($event, field)"
                  >
                    <el-icon><Grid /></el-icon>
                    <span class="field-name">{{ field.displayName }}</span>
                    <el-tooltip
                      v-if="field.description"
                      :content="field.description"
                      placement="right"
                    >
                      <el-icon class="field-info"><InfoFilled /></el-icon>
                    </el-tooltip>
                  </div>
                </div>
              </div>

              <!-- 指标字段 -->
              <div class="field-section">
                <div class="section-header">
                  <el-icon><TrendCharts /></el-icon>
                  指标字段
                </div>
                <div class="field-list">
                  <div
                    v-for="field in metricFields"
                    :key="field.fieldName"
                    class="field-item"
                    draggable="true"
                    @dragstart="handleFieldDragStart($event, field)"
                  >
                    <el-icon><TrendCharts /></el-icon>
                    <span class="field-name">{{ field.displayName }}</span>
                    <el-tooltip
                      v-if="field.description"
                      :content="field.description"
                      placement="right"
                    >
                      <el-icon class="field-info"><InfoFilled /></el-icon>
                    </el-tooltip>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 移动端配置面板按钮 -->
      <div v-if="isMobile && !configPanelVisible && selectedChart" class="mobile-config-button">
        <el-button type="primary" circle @click="toggleConfigPanel">
          <el-icon><Setting /></el-icon>
        </el-button>
      </div>
    </div>

    <!-- 数据编辑对话框 -->
    <el-dialog v-model="showDataEditor" title="编辑数据" width="60%">
      <el-table :data="chartData" border>
        <el-table-column v-for="field in selectedDataset?.fields" 
                        :key="field.fieldName" 
                        :prop="field.fieldName" 
                        :label="field.displayName || field.fieldName">
          <template #default="{ row }">
            <el-input v-model="row[field.fieldName]" />
          </template>
        </el-table-column>
      </el-table>
      <template #footer>
        <el-button @click="showDataEditor = false">取消</el-button>
        <el-button type="primary" @click="handleDataUpdate">确定</el-button>
      </template>
    </el-dialog>

    <!-- 数据集预览对话框 -->
    <el-dialog
      v-model="showDatasetPreview"
      title="数据集预览"
      width="80%"
      destroy-on-close
    >
      <div class="dataset-preview">
        <div class="preview-header">
          <h4>{{ selectedDataset?.name }}</h4>
          <el-tag type="info">{{ selectedDataset?.tableName }}</el-tag>
        </div>
        
        <el-table :data="previewData" border style="width: 100%">
          <el-table-column
            v-for="field in selectedDataset?.fields"
            :key="field.fieldName"
            :prop="field.fieldName"
            :label="field.description || field.displayName"
            :width="field.fieldType === 'date' ? 120 : undefined"
          />
        </el-table>
      </div>
    </el-dialog>

    <!-- 保存仪表盘对话框 -->
    <el-dialog
      v-model="showSaveDialog"
      title="保存仪表盘"
      width="500px"
      destroy-on-close
    >
      <el-form :model="saveForm" label-width="100px">
        <el-form-item label="仪表盘名称" required>
          <el-input v-model="saveForm.name" placeholder="请输入仪表盘名称" />
        </el-form-item>
        <el-form-item label="保存位置" required>
          <el-cascader
            v-model="saveForm.menuId"
            :options="menuOptions"
            :props="{
              checkStrictly: true,
              value: 'id',
              label: 'name',
              children: 'children'
            }"
            placeholder="请选择保存位置"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="仪表盘描述">
          <el-input
            v-model="saveForm.description"
            type="textarea"
            rows="3"
            placeholder="请输入仪表盘描述"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showSaveDialog = false">取消</el-button>
        <el-button type="primary" @click="handleSaveDashboard">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick, computed, h, createVNode, render } from 'vue'
import * as echarts from 'echarts'
import { ElMessage, ElMessageBox, ElTable, ElTableColumn } from 'element-plus'
import { GridLayout, GridItem } from 'vue3-grid-layout-next'
import { Rank, TrendCharts, ArrowDown, Close, Setting, Grid, Refresh, Select, Delete, CopyDocument, Download, DataBoard, View, Search, InfoFilled } from '@element-plus/icons-vue'
import type { DataSet, DataSetField } from '@/types/dataManagement'
import { dataSetApi, dashboardApi } from '@/api/dataSource'
import { useDatasourceStore } from '@/stores/datasource'
import { useDatasetStore } from '@/stores/dataset'
import { mockMedicalData, mockDatasets, defaultFieldMappings } from '@/mock/dashboardData'

// 预览数据类型
interface PreviewData {
  [key: string]: string | number | null
}

// 图表配置类型
interface ChartConfig {
  i: string
  type: 'bar' | 'line' | 'pie' | 'table'
  xField?: string
  yField?: string
  nameField?: string
  valueField?: string
  tableFields?: string[]
  title?: string
  showLegend?: boolean
  showToolbox?: boolean
  dataLimit?: number
}

// 布局项类型
interface LayoutItem {
  x: number
  y: number
  w: number
  h: number
  i: string
  chartConfig: ChartConfig
}

// 图表类型配置
const chartTypes = [
  { label: '柱状图', value: 'bar', icon: 'TrendCharts' },
  { label: '折线图', value: 'line', icon: 'TrendCharts' },
  { label: '饼图', value: 'pie', icon: 'TrendCharts' },
  { label: '表格', value: 'table', icon: 'Grid' }
]

// 状态管理
const layout = ref<LayoutItem[]>([])
const selectedChart = ref<ChartConfig | null>(null)
const showDataEditor = ref(false)
const showDatasetPreview = ref(false)
const showSaveDialog = ref(false)
const chartInstances = ref<Map<string, echarts.ECharts>>(new Map())

// 数据集相关
const datasetStore = useDatasetStore()
const datasets = computed(() => mockDatasets) // 直接使用模拟数据
const selectedDatasetId = ref<number | null>(null)
const selectedDataset = ref<DataSet | null>(null)

// 使用模拟数据
const chartData = ref(mockMedicalData.patientStats)

// 字段搜索
const fieldSearchKeyword = ref('')

// 字段分类
const dimensionFields = computed(() => {
  const fields = selectedDataset.value?.fields.filter(f => f.fieldType === 'dimension') || []
  if (!fieldSearchKeyword.value) return fields
  
  return fields.filter(field => 
    (field.description || field.displayName || field.fieldName)
      .toLowerCase()
      .includes(fieldSearchKeyword.value.toLowerCase())
  )
})

const metricFields = computed(() => {
  const fields = selectedDataset.value?.fields.filter(f => f.fieldType === 'metric') || []
  if (!fieldSearchKeyword.value) return fields
  
  return fields.filter(field => 
    (field.description || field.displayName || field.fieldName)
      .toLowerCase()
      .includes(fieldSearchKeyword.value.toLowerCase())
  )
})

// 保存表单
const saveForm = ref({
  name: '',
  menuId: null,
  description: ''
})
const menuOptions = ref([])

// 响应式设计相关
const windowWidth = ref(window.innerWidth)
const configPanelVisible = ref(true)

// 是否为移动设备
const isMobile = computed(() => {
  return windowWidth.value < 768
})

// 拖拽状态
const isDragOver = ref(false)
const dragFieldType = ref<'dimension' | 'metric' | null>(null)

// 方法定义
const handleDragStart = (event: DragEvent, chart: any) => {
  if (event.dataTransfer) {
    event.dataTransfer.setData('chartType', JSON.stringify(chart))
  }
}

const handleFieldDragStart = (event: DragEvent, field: DataSetField) => {
  if (event.dataTransfer) {
    event.dataTransfer.setData('field', JSON.stringify(field))
  }
}

const handleFieldDrop = (e: DragEvent, targetType: 'x' | 'y') => {
  if (!e.dataTransfer || !selectedChart.value) return
  
  const fieldData = JSON.parse(e.dataTransfer.getData('field'))
  const field = fieldData as DataSetField
  
  // 重置拖拽状态
  isDragOver.value = false
  dragFieldType.value = null
  
  // 验证字段类型
  if (targetType === 'x' && field.fieldType !== 'dimension') {
    ElMessage.warning('X轴字段必须是维度字段')
    return
  }
  
  if (targetType === 'y' && field.fieldType !== 'metric') {
    ElMessage.warning('Y轴字段必须是指标字段')
    return
  }
  
  // 更新字段
  if (targetType === 'x') {
    selectedChart.value.xField = field.fieldName
  } else {
    selectedChart.value.yField = field.fieldName
  }
  
  updateSelectedChart()
}

const handleDrop = (e: DragEvent) => {
  if (!e.dataTransfer) return

  const chartTypeData = JSON.parse(e.dataTransfer.getData('chartType'))
  
  // 创建图表配置
  const chartConfig: ChartConfig = {
    i: `chart-${Date.now()}`,
    type: chartTypeData.value,
    title: chartTypeData.label,
    showLegend: true,
    showToolbox: false,
    dataLimit: 100
  }
  
  // 根据图表类型设置默认字段
  if (selectedDatasetId.value && selectedDataset.value) {
    const defaultMapping = defaultFieldMappings[chartConfig.type]
    if (defaultMapping) {
      Object.assign(chartConfig, defaultMapping)
    }
  }
  
  // 创建一个新的布局项
  const newItem: LayoutItem = {
    x: 0,
    y: 0,
    w: 6,
    h: 7,
    i: chartConfig.i,
    chartConfig: chartConfig
  }
  
  layout.value.push(newItem)
  selectedChart.value = chartConfig
  
  nextTick(() => {
    initChart(newItem.i, chartConfig)
    ElMessage.success(`已添加新的${chartTypeData.label}图表，请配置字段`)
  })
}

const initChart = (id: string, config: ChartConfig) => {
  const container = document.getElementById(`chart-${id}`)
  if (!container) return

  const chartContent = container.querySelector('.chart-content')
  if (!chartContent) return

  // 清空现有内容
  chartContent.innerHTML = ''

  // 如果是表格类型
  if (config.type === 'table') {
    // 创建表格容器
    const tableContainer = document.createElement('div')
    tableContainer.className = 'chart-table'
    chartContent.appendChild(tableContainer)

    // 如果没有配置字段，显示提示信息
    if (!config.tableFields?.length) {
      const emptyHint = document.createElement('div')
      emptyHint.className = 'empty-hint'
      emptyHint.innerHTML = `
        <el-empty description="请配置表格字段">
          <el-button size="small" type="primary">配置字段</el-button>
        </el-empty>
      `
      tableContainer.appendChild(emptyHint)
      return
    }

    // 渲染表格
    const tableVNode = h(ElTable, {
      data: chartData.value.slice(0, config.dataLimit || 100),
      border: true,
      stripe: true,
      height: '100%',
      style: { width: '100%' }
    }, {
      default: () => config.tableFields!.map(field => 
        h(ElTableColumn, {
          prop: field,
          label: getFieldDisplayName(field),
          minWidth: 120,
          showOverflowTooltip: true
        })
      )
    })

    render(tableVNode, tableContainer)
    return
  }

  // 其他图表类型的处理
  const chart = echarts.init(chartContent)
  chartInstances.value.set(id, chart)
  updateChart(id, config)
}

const updateChart = (id: string, config: ChartConfig) => {
  // 如果是表格类型，重新初始化
  if (config.type === 'table') {
    initChart(id, config)
    return
  }

  const chart = chartInstances.value.get(id)
  if (!chart) return

  // 如果没有数据，显示空状态
  if (chartData.value.length === 0) {
    const option = {
      title: {
        text: config.title || '图表',
        left: 'center',
        textStyle: {
          fontSize: 16,
          fontWeight: 'bold'
        }
      },
      graphic: {
        elements: [{
          type: 'text',
          left: 'center',
          top: 'middle',
          style: {
            text: '请选择数据集并配置字段',
            fontSize: 14,
            fill: '#999'
          }
        }]
      }
    }
    chart.setOption(option, true)
    return
  }

  let option: any = {
    title: {
      text: config.title || '图表',
      left: 'center',
      textStyle: {
        fontSize: 16,
        fontWeight: 'bold'
      }
    },
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c} ({d}%)'
    },
    legend: {
      show: config.showLegend !== false,
      bottom: 10
    },
    toolbox: {
      show: config.showToolbox === true,
      feature: {
        saveAsImage: {},
        dataView: { readOnly: false },
        magicType: { type: ['line', 'bar'] },
        restore: {}
      }
    }
  }
  
  // 获取实际数据
  const actualData = chartData.value.slice(0, config.dataLimit || 100)
  
  switch (config.type) {
    case 'bar':
      if (!config.xField || !config.yField) {
        option.graphic = {
          elements: [{
            type: 'text',
            left: 'center',
            top: 'middle',
            style: {
              text: '请配置X轴和Y轴字段',
              fontSize: 14,
              fill: '#999'
            }
          }]
        }
        break
      }
      
      option = {
        ...option,
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'shadow'
          }
        },
        xAxis: {
          type: 'category',
          data: actualData.map(item => item[config.xField!]),
          axisLabel: {
            rotate: actualData.length > 10 ? 45 : 0
          }
        },
        yAxis: { 
          type: 'value',
          name: selectedDataset.value?.fields.find(f => f.fieldName === config.yField)?.displayName || config.yField
        },
        series: [{
          name: config.title || '柱状图',
          type: 'bar',
          data: actualData.map(item => item[config.yField!]),
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: '#83bff6' },
              { offset: 0.5, color: '#188df0' },
              { offset: 1, color: '#188df0' }
            ])
          },
          emphasis: {
            itemStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: '#2378f7' },
                { offset: 0.7, color: '#2378f7' },
                { offset: 1, color: '#83bff6' }
              ])
            }
          }
        }]
      }
      break
    case 'line':
      if (!config.xField || !config.yField) {
        option.graphic = {
          elements: [{
            type: 'text',
            left: 'center',
            top: 'middle',
            style: {
              text: '请配置X轴和Y轴字段',
              fontSize: 14,
              fill: '#999'
            }
          }]
        }
        break
      }
      
      option = {
        ...option,
        tooltip: {
          trigger: 'axis'
        },
        xAxis: {
          type: 'category',
          data: actualData.map(item => item[config.xField!]),
          boundaryGap: false
        },
        yAxis: { 
          type: 'value',
          name: selectedDataset.value?.fields.find(f => f.fieldName === config.yField)?.displayName || config.yField
        },
        series: [{
          name: config.title || '折线图',
          type: 'line',
          data: actualData.map(item => item[config.yField!]),
          smooth: true,
          lineStyle: {
            color: '#5470c6',
            width: 3
          },
          itemStyle: {
            color: '#5470c6'
          },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(84, 112, 198, 0.3)' },
              { offset: 1, color: 'rgba(84, 112, 198, 0.1)' }
            ])
          }
        }]
      }
      break
    case 'pie':
      if (!config.nameField || !config.valueField) {
        option.graphic = {
          elements: [{
            type: 'text',
            left: 'center',
            top: 'middle',
            style: {
              text: '请配置名称和数值字段',
              fontSize: 14,
              fill: '#999'
            }
          }]
        }
        break
      }
      
      option = {
        ...option,
        tooltip: {
          trigger: 'item',
          formatter: '{a} <br/>{b}: {c} ({d}%)'
        },
        series: [{
          name: config.title || '饼图',
          type: 'pie',
          radius: ['40%', '70%'],
          center: ['50%', '50%'],
          data: actualData.map(item => ({
            name: item[config.nameField!],
            value: item[config.valueField!]
          })),
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: 'rgba(0, 0, 0, 0.5)'
            }
          },
          label: {
            show: true,
            formatter: '{b}: {d}%'
          }
        }]
      }
      break
  }
  
  chart.setOption(option, true)
}

const updateSelectedChart = () => {
  if (!selectedChart.value) return
  updateChart(selectedChart.value.i, selectedChart.value)
}

const selectChart = (id: string) => {
  const item = layout.value.find(item => item.i === id)
  if (item) {
    selectedChart.value = item.chartConfig
  }
}

const removeSelectedChart = () => {
  if (!selectedChart.value) return
  
  const id = selectedChart.value.i
  
  const chartInstance = chartInstances.value.get(id)
  if (chartInstance) {
    chartInstance.dispose()
    chartInstances.value.delete(id)
  }
  
  layout.value = layout.value.filter(item => item.i !== id)
  selectedChart.value = null
  
  ElMessage.success('图表已删除')
}

const handleDataUpdate = () => {
  showDataEditor.value = false
  if (selectedChart.value) {
    updateSelectedChart()
  }
}

// 数据源切换处理
const currentDataSource = ref('patientStats')
const handleDataSourceChange = (value: string) => {
  chartData.value = mockMedicalData[value]
  updateSelectedChart()
}

// 获取当前数据源的字段
const currentFields = computed(() => {
  if (!chartData.value.length) return []
  return Object.keys(chartData.value[0])
})

// 预览数据
const currentPreviewData = computed(() => {
  return chartData.value.slice(0, 5) // 只显示前5条数据
})

// 布局更新事件
const onLayoutUpdated = (newLayout: LayoutItem[]) => {
  layout.value = newLayout
}

const onResize = (i: string | number, h: number, w: number, height: number, width: number) => {
  // 调整大小过程中的处理
}

const onResized = (i: string | number, h: number, w: number, height: number, width: number) => {
  const strId = i.toString()
  const chartInstance = chartInstances.value.get(strId)
  if (chartInstance) {
    nextTick(() => {
      chartInstance.resize()
      if (!selectedChart.value || selectedChart.value.i !== strId) {
        selectChart(strId)
      }
    })
  }
}

const onMove = (i: string | number, x: number, y: number) => {
  // 移动过程中的处理
}

const onMoved = (i: string | number, x: number, y: number) => {
  // 移动完成后的处理
}

const handleResize = () => {
  chartInstances.value.forEach(instance => {
    instance.resize()
  })
}

const handleWindowResize = () => {
  windowWidth.value = window.innerWidth
  if (windowWidth.value >= 768) {
    configPanelVisible.value = true
  }
}

const toggleConfigPanel = () => {
  configPanelVisible.value = !configPanelVisible.value
}

const refreshData = async () => {
  if (!selectedDatasetId.value) {
    ElMessage.warning('请先选择数据集')
    return
  }

  try {
    // 使用模拟数据
    const dataSourceKey = 'patientStats' // 这里可以根据数据集类型选择不同的模拟数据
    chartData.value = mockMedicalData[dataSourceKey]
    
    // 重新渲染所有图表
    layout.value.forEach(item => {
      updateChart(item.i, item.chartConfig)
    })
    
    ElMessage.success('数据刷新成功')
  } catch (error) {
    console.error('刷新数据失败:', error)
    ElMessage.error('刷新数据失败')
  }
}

const previewData = () => {
  showDatasetPreview.value = true
}

const selectAllCharts = () => {
  // 选择所有图表（这里可以实现多选逻辑）
  ElMessage.info('全选功能开发中')
}

const clearAllCharts = () => {
  ElMessageBox.confirm('确定要清空所有图表吗？', '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    // 清理所有图表实例
    chartInstances.value.forEach(instance => {
      instance.dispose()
    })
    chartInstances.value.clear()
    
    // 清空布局
    layout.value = []
    selectedChart.value = null
    
    ElMessage.success('已清空所有图表')
  }).catch(() => {
    // 用户取消
  })
}

const autoLayout = () => {
  if (layout.value.length === 0) {
    ElMessage.warning('没有图表需要布局')
    return
  }

  // 自动重新排列图表
  const cols = 12
  const itemWidth = 6
  const itemHeight = 7
  
  layout.value.forEach((item, index) => {
    const row = Math.floor(index / (cols / itemWidth))
    const col = (index % (cols / itemWidth)) * itemWidth
    
    item.x = col
    item.y = row * itemHeight
    item.w = itemWidth
    item.h = itemHeight
  })
  
  ElMessage.success('自动布局完成')
}

const exportDashboard = () => {
  if (layout.value.length === 0) {
    ElMessage.warning('没有图表可以导出')
    return
  }

  const exportData = {
    name: saveForm.value.name || '未命名仪表盘',
    description: saveForm.value.description || '',
    config: {
      layout: layout.value,
      charts: layout.value.map(item => ({
        id: item.i,
        type: item.chartConfig.type,
        xField: item.chartConfig.xField,
        yField: item.chartConfig.yField,
        nameField: item.chartConfig.nameField,
        valueField: item.chartConfig.valueField,
        title: item.chartConfig.title,
        showLegend: item.chartConfig.showLegend,
        showToolbox: item.chartConfig.showToolbox,
        dataLimit: item.chartConfig.dataLimit
      }))
    },
    exportTime: new Date().toISOString()
  }

  // 创建下载链接
  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `dashboard_${Date.now()}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
  
  ElMessage.success('仪表盘配置已导出')
}

const duplicateChart = (item: LayoutItem) => {
  const newChartConfig: ChartConfig = {
    ...item.chartConfig,
    i: `chart-${Date.now()}`
  }
  
  const newItem: LayoutItem = {
    x: item.x + 1,
    y: item.y + 1,
    w: item.w,
    h: item.h,
    i: newChartConfig.i,
    chartConfig: newChartConfig
  }
  
  layout.value.push(newItem)
  selectedChart.value = newChartConfig
  
  nextTick(() => {
    initChart(newItem.i, newChartConfig)
    ElMessage.success('图表已复制')
  })
}

const removeChart = (chartId: string) => {
  const chartInstance = chartInstances.value.get(chartId)
  if (chartInstance) {
    chartInstance.dispose()
    chartInstances.value.delete(chartId)
  }
  
  layout.value = layout.value.filter(item => item.i !== chartId)
  
  if (selectedChart.value?.i === chartId) {
    selectedChart.value = null
  }
  
  ElMessage.success('图表已删除')
}

// 数据集变更处理
const handleDatasetChange = (datasetId: number) => {
  selectedDataset.value = datasets.value.find(d => d.id === datasetId) || null
  if (selectedDataset.value) {
    // 使用模拟数据
    const dataSourceKey = 'patientStats'
    chartData.value = mockMedicalData[dataSourceKey]
    ElMessage.success('数据集加载成功')
  }
}

// 获取所有字段
const allFields = computed(() => {
  return [...dimensionFields.value, ...metricFields.value]
})

// 处理表格字段拖拽
const handleTableFieldDrop = (e: DragEvent) => {
  if (!e.dataTransfer || !selectedChart.value) return
  
  const fieldData = JSON.parse(e.dataTransfer.getData('field'))
  const field = fieldData as DataSetField
  
  if (!selectedChart.value.tableFields) {
    selectedChart.value.tableFields = []
  }
  
  if (!selectedChart.value.tableFields.includes(field.fieldName)) {
    selectedChart.value.tableFields.push(field.fieldName)
    updateSelectedChart()
  }
}

// 处理拖拽进入
const handleDragEnter = (e: DragEvent, type: 'dimension' | 'metric') => {
  isDragOver.value = true
  dragFieldType.value = type
}

// 处理拖拽离开
const handleDragLeave = (e: DragEvent) => {
  const target = e.target as HTMLElement
  const relatedTarget = e.relatedTarget as HTMLElement
  
  // 确保不是子元素的拖拽事件
  if (target.contains(relatedTarget)) {
    return
  }
  
  isDragOver.value = false
  dragFieldType.value = null
}

// 获取字段显示名
const getFieldDisplayName = (fieldName: string) => {
  const field = selectedDataset.value?.fields.find(f => f.fieldName === fieldName)
  return field?.displayName || fieldName
}

// 移除字段
const removeField = (type: 'x' | 'y') => {
  if (!selectedChart.value) return
  
  if (type === 'x') {
    selectedChart.value.xField = undefined
  } else {
    selectedChart.value.yField = undefined
  }
  
  updateSelectedChart()
}

// 添加移除表格字段的方法
const removeTableField = (fieldName: string) => {
  if (!selectedChart.value || !selectedChart.value.tableFields) return
  
  selectedChart.value.tableFields = selectedChart.value.tableFields.filter(f => f !== fieldName)
  updateSelectedChart()
}

// 组件挂载
onMounted(() => {
  window.addEventListener('resize', handleWindowResize)
  window.addEventListener('resize', handleResize)
  
  // 初始化选中第一个数据集
  if (datasets.value.length > 0) {
    selectedDatasetId.value = datasets.value[0].id
    handleDatasetChange(datasets.value[0].id)
  }
})

// 组件卸载
onUnmounted(() => {
  chartInstances.value.forEach(instance => {
    instance.dispose()
  })
  chartInstances.value.clear()
  
  window.removeEventListener('resize', handleWindowResize)
  window.removeEventListener('resize', handleResize)
})
</script>

<style scoped lang="scss">
.dashboard-designer {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f5f7fa;
  overflow: hidden;
}

.toolbar {
  height: 60px;
  background: white;
  border-bottom: 1px solid #e4e7ed;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  z-index: 100;
  flex-shrink: 0;
}

.toolbar-title {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.toolbar-icon {
  font-size: 24px;
  color: #409eff;
}

.main-content {
  flex: 1;
  display: flex;
  min-height: 0;
  gap: 0;
}

.left-sidebar {
  width: 260px;
  background: white;
  border-right: 1px solid #e4e7ed;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  flex-shrink: 0;
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.04);
}

.panel-section {
  padding: 20px;
  border-bottom: 1px solid #f0f0f0;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 16px 0;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.chart-types {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.chart-type-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px 12px;
  border: 2px solid #e4e7ed;
  border-radius: 8px;
  cursor: grab;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  background: white;
  text-align: center;
  
  &:hover {
    border-color: #409eff;
    background: linear-gradient(135deg, #f0f9ff 0%, #e1f0ff 100%);
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(64, 158, 255, 0.15);
  }
  
  &:active {
    cursor: grabbing;
    transform: translateY(0);
  }
  
  .el-icon {
    font-size: 24px;
    color: #409eff;
  }
  
  span {
    font-size: 12px;
    font-weight: 500;
    color: #606266;
  }
}

.canvas-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: #fafbfc;
  position: relative;
  min-height: 0;
  overflow: hidden;
  
  // 改进网格背景
  background-image: 
    linear-gradient(rgba(64, 158, 255, 0.05) 1px, transparent 1px),
    linear-gradient(90deg, rgba(64, 158, 255, 0.05) 1px, transparent 1px);
  background-size: 20px 20px;
  background-position: 0 0;
}

.canvas-toolbar {
  padding: 12px 20px;
  background: white;
  border-bottom: 1px solid #e4e7ed;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.04);
  flex-shrink: 0;
}

.right-panels {
  width: 560px;
  background: white;
  border-left: 1px solid #e4e7ed;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  flex-shrink: 0;
  box-shadow: -2px 0 8px rgba(0, 0, 0, 0.04);
}

.panels-container {
  flex: 1;
  display: flex;
  flex-direction: row;
  overflow: hidden;
}

.config-panel {
  width: 280px;
  border-right: 1px solid #e4e7ed;
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
}

.data-panel {
  width: 280px;
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
  background: white;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #e4e7ed;
  background: linear-gradient(135deg, #fafbfc 0%, #f5f7fa 100%);
  flex-shrink: 0;
}

.panel-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  display: flex;
  align-items: center;
  gap: 8px;
  
  &::before {
    content: '';
    width: 3px;
    height: 16px;
    background: #409eff;
    border-radius: 2px;
  }
}

.panel-actions {
  display: flex;
  gap: 8px;
}

.config-form {
  padding: 20px;
  flex: 1;
  overflow-y: auto;
  
  :deep(.el-form-item) {
    margin-bottom: 20px;
    
    &:last-child {
      margin-bottom: 0;
    }
  }
  
  :deep(.el-form-item__label) {
    font-weight: 500;
    color: #606266;
    line-height: 1.4;
  }
}

.dataset-selector {
  padding: 16px;
  border-bottom: 1px solid #e4e7ed;
  background: #f8f9fa;
}

.field-sections {
  padding: 16px;
  border-bottom: 1px solid #e4e7ed;
  background: #f8f9fa;
  max-height: 400px;
  overflow-y: auto;
}

.field-section {
  margin-bottom: 16px;
  
  &:last-child {
    margin-bottom: 0;
  }
}

.section-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  background: #ebeef5;
  border-radius: 4px;
  margin-bottom: 8px;
  font-size: 14px;
  font-weight: 500;
  color: #606266;
}

.field-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.field-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: white;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  cursor: grab;
  transition: all 0.3s;
  
  &:hover {
    border-color: #409eff;
    background: #ecf5ff;
    transform: translateX(4px);
  }
  
  &:active {
    cursor: grabbing;
  }
  
  .el-icon {
    font-size: 16px;
    color: #409eff;
  }
  
  .field-name {
    flex: 1;
    font-size: 13px;
    color: #606266;
  }
  
  .field-info {
    font-size: 14px;
    color: #909399;
    cursor: help;
    
    &:hover {
      color: #409eff;
    }
  }
}

.field-drop-zone {
  position: relative;
  border: 2px dashed #e4e7ed;
  border-radius: 8px;
  padding: 12px;
  transition: all 0.3s;
  min-height: 48px;
  background: #fff;
  cursor: pointer;
  
  &:hover {
    border-color: #409eff;
    background: #ecf5ff;
  }
  
  &.has-field {
    border-color: #67c23a;
    background: #f0f9eb;
    border-style: solid;
  }
  
  &.drag-over {
    border-color: #409eff;
    background: #ecf5ff;
    border-style: dashed;
    border-width: 2px;
    transform: scale(1.02);
  }
  
  .field-content {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 4px 8px;
    background: rgba(255, 255, 255, 0.5);
    border-radius: 4px;
    
    .el-icon {
      font-size: 16px;
      color: #67c23a;
    }
    
    .field-name {
      flex: 1;
      font-size: 14px;
      color: #213547;
      font-weight: 500;
    }
    
    .remove-field {
      cursor: pointer;
      color: #909399;
      font-size: 14px;
      
      &:hover {
        color: #f56c6c;
      }
    }
  }
  
  .drop-hint {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    color: #909399;
    font-size: 13px;
    pointer-events: none;
    display: flex;
    align-items: center;
    gap: 8px;
    white-space: nowrap;
  }
}

.grid-chart-item {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid #e4e7ed;
  
  &:hover {
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
    transform: translateY(-1px);
  }
  
  &.selected {
    border: 2px solid #409eff !important;
    box-shadow: 0 0 0 4px rgba(64, 158, 255, 0.2) !important;
    transform: translateY(-1px);
  }
}

.chart-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.chart-drag-handler {
  height: 36px;
  background: linear-gradient(135deg, #fafbfc 0%, #f5f7fa 100%);
  border-bottom: 1px solid #e4e7ed;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  cursor: move;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  
  &:hover {
    background: linear-gradient(135deg, #409eff 0%, #337ecc 100%);
    color: white;
  }
}

.chart-title {
  flex: 1;
  font-size: 13px;
  font-weight: 600;
  margin-left: 8px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.chart-actions {
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.chart-drag-handler:hover .chart-actions {
  opacity: 1;
}

.chart-actions .el-button {
  padding: 4px 6px;
  min-height: 24px;
  border: none;
  background: transparent;
  border-radius: 4px;
  
  &:hover {
    background: rgba(255, 255, 255, 0.2);
    color: white;
  }
}

.chart-content {
  flex: 1;
  min-height: 0;
  padding: 8px;
}

/* 移动端优化 */
.mobile-sidebar {
  width: 80px;
  
  .chart-types {
    grid-template-columns: 1fr;
  }
  
  .chart-type-item span {
    display: none;
  }
  
  .chart-type-item {
    padding: 12px 8px;
  }
}

.mobile-panels {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  z-index: 1000;
  width: 90%;
  max-width: 360px;
  box-shadow: -8px 0 32px rgba(0, 0, 0, 0.3);
  transform: translateX(100%);
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  
  &.show {
    transform: translateX(0);
  }
}

.mobile-config-button {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 100;
  border-radius: 50%;
  width: 56px;
  height: 56px;
  box-shadow: 0 4px 16px rgba(64, 158, 255, 0.3);
}

/* 响应式断点 */
@media (max-width: 1400px) {
  .right-panels {
    width: 500px;
  }
  
  .config-panel,
  .data-panel {
    width: 250px;
  }
}

@media (max-width: 1200px) {
  .right-panels {
    width: 460px;
  }
  
  .config-panel,
  .data-panel {
    width: 230px;
  }
}

@media (max-width: 992px) {
  .right-panels {
    width: 440px;
  }
  
  .config-panel,
  .data-panel {
    width: 220px;
  }
}

@media (max-width: 768px) {
  .panels-container {
    flex-direction: column;
  }
  
  .right-panels {
    width: 100%;
  }
  
  .config-panel,
  .data-panel {
    width: 100%;
  }
}

/* 滚动条优化 */
.field-items::-webkit-scrollbar,
.config-form::-webkit-scrollbar,
.field-sections::-webkit-scrollbar {
  width: 6px;
}

.field-items::-webkit-scrollbar-track,
.config-form::-webkit-scrollbar-track,
.field-sections::-webkit-scrollbar-track {
  background: #f5f7fa;
  border-radius: 3px;
}

.field-items::-webkit-scrollbar-thumb,
.config-form::-webkit-scrollbar-thumb,
.field-sections::-webkit-scrollbar-thumb {
  background: #c0c4cc;
  border-radius: 3px;
  
  &:hover {
    background: #909399;
  }
}

/* 动画优化 */
.grid-chart-item {
  animation: fadeInUp 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 加载状态 */
.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

/* 数据提示区域 */
.no-data-hint,
.select-dataset-hint {
  padding: 40px 20px;
  text-align: center;
  background: #fafbfc;
  border-radius: 8px;
  margin: 20px;
}

.no-data-hint .el-button {
  margin-top: 16px;
}

.chart-table-container {
  height: 100%;
  overflow: auto;
  padding: 8px;
}

.data-source-selector {
  padding: 16px;
  border-bottom: 1px solid #e4e7ed;
  background: #f8f9fa;
  
  .el-radio-group {
    display: flex;
    gap: 8px;
    
    .el-radio-button {
      flex: 1;
      
      :deep(.el-radio-button__inner) {
        width: 100%;
      }
    }
  }
}

.preview-data {
  flex: 1;
  padding: 16px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  
  .el-table {
    flex: 1;
    overflow: hidden;
    
    :deep(.el-table__header) {
      background: #f8f9fa;
      
      th {
        background: #f8f9fa !important;
        font-weight: 600;
      }
    }
  }
}

/* 优化图表配置面板布局 */
.config-panel {
  .el-form {
    padding: 16px;
    
    .el-form-item {
      margin-bottom: 16px;
      
      &:last-child {
        margin-bottom: 0;
      }
    }
  }
  
  .field-drop-zone {
    min-height: 60px;
    padding: 12px;
    border: 2px dashed #e4e7ed;
    border-radius: 8px;
    margin-top: 8px;
    transition: all 0.3s;
    
    &:hover {
      border-color: #409eff;
      background: #f5f7fa;
    }
    
    &.has-field {
      border-style: solid;
      border-color: #67c23a;
      background: #f0f9eb;
    }
  }
}

/* 移动端适配 */
@media (max-width: 768px) {
  .main-content {
    flex-direction: column;
    
    .left-sidebar,
    .right-panels {
      width: 100%;
      max-width: none;
      border: none;
      border-bottom: 1px solid #e4e7ed;
    }
    
    .canvas-container {
      min-height: 400px;
    }
  }
  
  .data-source-selector {
    .el-radio-group {
      flex-direction: column;
    }
  }
}

.chart-table {
  height: 100%;
  padding: 8px;
  overflow: hidden;
  display: flex;
  flex-direction: column;

  :deep(.el-table) {
    flex: 1;
    overflow: hidden;

    .el-table__header {
      th {
        background-color: #f5f7fa;
        color: #606266;
        font-weight: 600;
      }
    }

    .el-table__body {
      td {
        padding: 8px;
      }
    }
  }

  .empty-hint {
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;

    :deep(.el-empty) {
      padding: 40px;
    }
  }
}

.field-drop-zone {
  &.table-fields {
    min-height: 120px;
    padding: 12px;
    background: #fafbfc;
    
    .field-list {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      padding: 8px;
      min-height: 40px;
      background: #fff;
      border-radius: 4px;
      
      .field-tag {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 6px 10px;
        background: #f0f9eb;
        border: 1px solid #67c23a;
        border-radius: 4px;
        font-size: 13px;
        transition: all 0.3s;
        
        &:hover {
          background: #f5f7fa;
          border-color: #409eff;
          transform: translateY(-1px);
          box-shadow: 0 2px 6px rgba(0,0,0,0.1);
        }
        
        .el-icon {
          font-size: 14px;
          color: #67c23a;
        }
        
        .remove-btn {
          cursor: pointer;
          color: #909399;
          font-size: 12px;
          padding: 2px;
          border-radius: 50%;
          transition: all 0.2s;
          
          &:hover {
            color: #f56c6c;
            background: rgba(245,108,108,0.1);
          }
        }
      }
    }
    
    .drop-hint {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      display: flex;
      align-items: center;
      gap: 8px;
      color: #909399;
      font-size: 14px;
      
      .el-icon {
        font-size: 18px;
        color: #409eff;
      }
    }
  }
}
</style> 