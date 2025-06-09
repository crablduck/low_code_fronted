<template>
  <div class="univer-antv-integration">
    <!-- 顶部工具栏 -->
    <div class="integration-header">
      <div class="header-left">
        <h2>🏥 医疗数据分析工作台</h2>
        <span class="subtitle">Univer电子表格 + AntV图表分析</span>
      </div>
      <div class="header-right">
        <el-button-group>
          <el-button @click="showChartPanel = !showChartPanel" :type="showChartPanel ? 'primary' : 'default'">
            <el-icon><TrendCharts /></el-icon>
            {{ showChartPanel ? '隐藏图表' : '显示图表' }}
          </el-button>
          <el-button @click="syncDataToChart" type="success">
            <el-icon><Refresh /></el-icon>
            同步数据到图表
          </el-button>
          <el-button @click="exportAnalysis">
            <el-icon><Download /></el-icon>
            导出分析报告
          </el-button>
        </el-button-group>
      </div>
    </div>

    <!-- 主内容区域 -->
    <div class="integration-content">
      <!-- 左侧Univer电子表格 -->
      <div class="univer-section" :class="{ 'full-width': !showChartPanel }">
        <div class="section-header">
          <h4>📊 数据表格编辑器</h4>
          <div class="table-actions">
            <el-button size="small" @click="insertSampleData">
              <el-icon><DocumentAdd /></el-icon>
              插入示例数据
            </el-button>
            <el-button size="small" @click="clearTable">
              <el-icon><Delete /></el-icon>
              清空表格
            </el-button>
          </div>
        </div>
        
        <!-- Univer容器 -->
        <div ref="univerContainer" class="univer-container"></div>
        
        <!-- 数据提取面板 -->
        <div class="data-extraction-panel">
          <h5>🎯 数据提取配置</h5>
          <div class="extraction-controls">
            <el-row :gutter="12">
              <el-col :span="8">
                <el-select v-model="extractConfig.sheetId" placeholder="选择工作表" size="small">
                  <el-option
                    v-for="sheet in availableSheets"
                    :key="sheet.id"
                    :label="sheet.name"
                    :value="sheet.id"
                  />
                </el-select>
              </el-col>
              <el-col :span="8">
                <el-input 
                  v-model="extractConfig.range" 
                  placeholder="数据范围 如:A1:D10" 
                  size="small"
                />
              </el-col>
              <el-col :span="8">
                <el-button @click="extractDataForChart" type="primary" size="small">
                  <el-icon><Connection /></el-icon>
                  提取数据
                </el-button>
              </el-col>
            </el-row>
          </div>
        </div>
      </div>

      <!-- 右侧AntV图表分析面板 -->
      <div v-show="showChartPanel" class="chart-section">
        <div class="section-header">
          <h4>📈 智能图表分析</h4>
          <div class="chart-controls">
            <el-button-group size="small">
              <el-button @click="autoAnalyze" type="primary">
                <el-icon><MagicStick /></el-icon>
                智能分析
              </el-button>
              <el-button @click="clearCharts">
                <el-icon><Close /></el-icon>
                清空图表
              </el-button>
            </el-button-group>
          </div>
        </div>

        <!-- 数据预览 -->
        <div class="data-preview" v-if="extractedData.length > 0">
          <h6>提取的数据 ({{ extractedData.length }}行)</h6>
          <div class="preview-table">
            <table>
              <thead>
                <tr>
                  <th v-for="(header, index) in dataHeaders" :key="index">
                    {{ header }}
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(row, index) in extractedData.slice(0, 5)" :key="index">
                  <td v-for="(cell, cellIndex) in row" :key="cellIndex">
                    {{ cell }}
                  </td>
                </tr>
              </tbody>
            </table>
            <div v-if="extractedData.length > 5" class="more-indicator">
              还有 {{ extractedData.length - 5 }} 行数据...
            </div>
          </div>
        </div>

        <!-- 快速图表生成 -->
        <div class="quick-charts">
          <h6>🚀 快速图表生成</h6>
          <div class="chart-templates">
            <div 
              v-for="template in chartTemplates" 
              :key="template.type"
              class="chart-template"
              @click="generateChart(template.type)"
            >
              <div class="template-icon">{{ template.icon }}</div>
              <div class="template-name">{{ template.name }}</div>
            </div>
          </div>
        </div>

        <!-- 生成的图表容器 -->
        <div class="generated-charts">
          <div
            v-for="(chart, index) in generatedCharts"
            :key="index"
            class="chart-item"
          >
            <div class="chart-header">
              <span class="chart-title">{{ chart.title }}</span>
              <el-button 
                @click="removeChart(index)" 
                type="danger" 
                size="small" 
                text
              >
                <el-icon><Close /></el-icon>
              </el-button>
            </div>
            <div :data-chart-index="index" class="chart-container"></div>
          </div>
        </div>

        <!-- 空状态 -->
        <div v-if="generatedCharts.length === 0" class="empty-charts">
          <el-empty description="暂无图表，请先提取数据后生成图表">
            <el-button type="primary" @click="extractDataForChart">开始分析</el-button>
          </el-empty>
        </div>
      </div>
    </div>

    <!-- 分析洞察浮层 -->
    <div v-if="showInsights" class="insights-overlay">
      <div class="insights-panel">
        <div class="insights-header">
          <h4>🧠 AI数据洞察</h4>
          <el-button @click="showInsights = false" type="danger" size="small" circle>
            <el-icon><Close /></el-icon>
          </el-button>
        </div>
        <div class="insights-content">
          <div v-for="insight in dataInsights" :key="insight.id" class="insight-item">
            <div class="insight-icon">{{ insight.icon }}</div>
            <div class="insight-text">
              <strong>{{ insight.title }}:</strong>
              {{ insight.description }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 
  TrendCharts, 
  Refresh, 
  Download, 
  DocumentAdd, 
  Delete, 
  Connection,
  MagicStick,
  Close
} from '@element-plus/icons-vue'

// 引入 AntV 和 Univer
import { Chart } from '@antv/g2'
import { createUniver, defaultTheme, LocaleType } from '@univerjs/presets'
import { UniverSheetsCorePreset } from '@univerjs/presets/preset-sheets-core'
import { UniverSheetsAdvancedPreset } from '@univerjs/presets/preset-sheets-advanced'

// 类型定义
interface SheetInfo {
  id: string
  name: string
}

interface ExtractConfig {
  sheetId: string
  range: string
}

interface ChartTemplate {
  type: string
  name: string
  icon: string
  description: string
}

interface GeneratedChart {
  title: string
  type: string
  chart: Chart | null
}

// 响应式数据
const univerContainer = ref<HTMLDivElement>()
const showChartPanel = ref(true)
const showInsights = ref(false)
const extractedData = ref<any[]>([])
const dataHeaders = ref<string[]>([])
const generatedCharts = ref<GeneratedChart[]>([])

let univerInstance: any = null

// 数据提取配置
const extractConfig = ref<ExtractConfig>({
  sheetId: '',
  range: 'A1:Z100'
})

// 可用工作表
const availableSheets = ref<SheetInfo[]>([
  { id: 'sheet1', name: '患者统计表' },
  { id: 'sheet2', name: '科室数据表' },
  { id: 'sheet3', name: '分析汇总表' }
])

// 图表模板
const chartTemplates: ChartTemplate[] = [
  { type: 'column', name: '柱状图', icon: '📊', description: '对比分析' },
  { type: 'line', name: '折线图', icon: '📈', description: '趋势分析' },
  { type: 'pie', name: '饼图', icon: '🥧', description: '占比分析' },
  { type: 'area', name: '面积图', icon: '📊', description: '堆叠分析' },
  { type: 'scatter', name: '散点图', icon: '⚫', description: '分布分析' },
  { type: 'heatmap', name: '热力图', icon: '🔥', description: '密度分析' }
]

// 智能洞察数据
const dataInsights = ref([
  {
    id: 'trend',
    icon: '📈',
    title: '数据趋势',
    description: '检测到数据呈上升趋势，增长率约15%'
  },
  {
    id: 'anomaly',
    icon: '⚠️',
    title: '异常检测',
    description: '发现3个可能的异常数据点，建议人工复核'
  },
  {
    id: 'correlation',
    icon: '🔗',
    title: '相关性分析',
    description: '字段A与字段B存在强正相关(r=0.87)'
  }
])

// 医疗示例数据
const sampleMedicalData = [
  ['科室', '患者数量', '收入(万元)', '满意度', '医生数量'],
  ['心内科', 120, 45.2, 4.5, 8],
  ['骨科', 98, 52.8, 4.2, 6],
  ['妇产科', 156, 38.6, 4.8, 10],
  ['儿科', 203, 42.1, 4.6, 12],
  ['神经内科', 87, 35.4, 4.4, 5],
  ['外科', 145, 48.9, 4.3, 9],
  ['内科', 189, 41.7, 4.5, 11],
  ['急诊科', 267, 36.8, 4.1, 15]
]

// 方法定义
const initUniver = async () => {
  if (!univerContainer.value) return
  
  try {
    const { univerAPI } = await createUniver({
      theme: defaultTheme,
      locale: LocaleType.ZH_CN,
      presets: [
        UniverSheetsCorePreset({
          container: univerContainer.value,
          header: true,
          footer: false,
          contextMenu: true
        }),
        UniverSheetsAdvancedPreset()
      ]
    })

    univerInstance = univerAPI
    
    ElMessage.success('电子表格初始化完成')
  } catch (error) {
    console.error('Univer初始化失败:', error)
    ElMessage.error('电子表格初始化失败')
  }
}

const insertSampleData = () => {
  if (!univerInstance) {
    ElMessage.warning('请先初始化电子表格')
    return
  }

  try {
    // 在当前活动工作表中插入示例数据
    const activeSheet = univerInstance.getActiveWorkbook()?.getActiveSheet()
    if (activeSheet) {
      // 设置数据范围
      for (let row = 0; row < sampleMedicalData.length; row++) {
        for (let col = 0; col < sampleMedicalData[row].length; col++) {
          activeSheet.setCell(row, col, sampleMedicalData[row][col])
        }
      }
      ElMessage.success('示例数据已插入')
    }
  } catch (error) {
    console.error('插入数据失败:', error)
    ElMessage.error('插入数据失败')
  }
}

const clearTable = () => {
  ElMessageBox.confirm('确定要清空表格数据吗？', '确认操作', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    // 清空当前表格
    if (univerInstance) {
      const activeSheet = univerInstance.getActiveWorkbook()?.getActiveSheet()
      if (activeSheet) {
        activeSheet.clear()
        ElMessage.success('表格已清空')
      }
    }
  })
}

const extractDataForChart = () => {
  if (!univerInstance) {
    ElMessage.warning('请先初始化电子表格')
    return
  }

  try {
    // 模拟数据提取
    const mockData = [
      ['心内科', 120, 45.2, 4.5],
      ['骨科', 98, 52.8, 4.2],
      ['妇产科', 156, 38.6, 4.8],
      ['儿科', 203, 42.1, 4.6],
      ['神经内科', 87, 35.4, 4.4]
    ]
    
    extractedData.value = mockData
    dataHeaders.value = ['科室', '患者数量', '收入(万元)', '满意度']
    
    ElMessage.success(`成功提取 ${mockData.length} 行数据`)
    
    // 自动显示洞察
    setTimeout(() => {
      showInsights.value = true
    }, 1000)
    
  } catch (error) {
    console.error('数据提取失败:', error)
    ElMessage.error('数据提取失败')
  }
}

const generateChart = (chartType: string) => {
  if (extractedData.value.length === 0) {
    ElMessage.warning('请先提取数据')
    return
  }

  const chartIndex = generatedCharts.value.length
  const chartTitle = `${getChartTypeName(chartType)} - ${new Date().toLocaleTimeString()}`
  
  generatedCharts.value.push({
    title: chartTitle,
    type: chartType,
    chart: null
  })

  nextTick(() => {
    renderChart(chartType, chartIndex)
  })
}

const renderChart = (chartType: string, index: number) => {
  const containerRef = document.querySelector(`[data-chart-index="${index}"]`) as HTMLElement
  if (!containerRef) return

  // 转换数据格式
  const chartData = extractedData.value.map(row => ({
    department: row[0],
    patients: row[1],
    revenue: row[2],
    satisfaction: row[3]
  }))

  const chart = new Chart({
    container: containerRef,
    theme: 'classic'
  })

  chart.data(chartData)

  // 根据图表类型渲染
  switch (chartType) {
    case 'column':
      chart
        .interval()
        .encode('x', 'department')
        .encode('y', 'patients')
        .encode('color', 'department')
      break
      
    case 'line':
      chart
        .line()
        .encode('x', 'department')
        .encode('y', 'revenue')
        .style('stroke', '#1890ff')
        .style('lineWidth', 3)
      
      chart
        .point()
        .encode('x', 'department')
        .encode('y', 'revenue')
        .style('fill', '#1890ff')
        .style('r', 4)
      break
      
    case 'pie':
      chart
        .coordinate({ type: 'theta', outerRadius: 0.8 })
      
      chart
        .interval()
        .transform({ type: 'stackY' })
        .encode('y', 'patients')
        .encode('color', 'department')
        .legend('color', { position: 'right' })
      break
      
    case 'area':
      chart
        .area()
        .encode('x', 'department')
        .encode('y', 'revenue')
        .style('fill', 'l(270) 0:#1890ff40 1:#1890ff')
      break
      
    case 'scatter':
      chart
        .point()
        .encode('x', 'revenue')
        .encode('y', 'satisfaction')
        .encode('color', 'department')
        .encode('size', 8)
      break
  }

  chart.interaction('tooltip', { shared: true })
  chart.render()

  // 保存chart实例
  generatedCharts.value[index].chart = chart
  
  ElMessage.success(`${getChartTypeName(chartType)}生成成功`)
}

const getChartTypeName = (type: string): string => {
  const typeMap: Record<string, string> = {
    column: '柱状图',
    line: '折线图', 
    pie: '饼图',
    area: '面积图',
    scatter: '散点图',
    heatmap: '热力图'
  }
  return typeMap[type] || '图表'
}

const removeChart = (index: number) => {
  const chart = generatedCharts.value[index]
  if (chart.chart) {
    chart.chart.destroy()
  }
  generatedCharts.value.splice(index, 1)
  ElMessage.success('图表已删除')
}

const clearCharts = () => {
  generatedCharts.value.forEach(chart => {
    if (chart.chart) {
      chart.chart.destroy()
    }
  })
  generatedCharts.value = []
  ElMessage.success('所有图表已清空')
}

const autoAnalyze = () => {
  if (extractedData.value.length === 0) {
    extractDataForChart()
  }
  
  setTimeout(() => {
    generateChart('column')
    setTimeout(() => generateChart('line'), 500)
    setTimeout(() => generateChart('pie'), 1000)
    ElMessage.success('智能分析完成')
  }, 500)
}

const syncDataToChart = () => {
  extractDataForChart()
  if (generatedCharts.value.length > 0) {
    clearCharts()
    setTimeout(() => autoAnalyze(), 500)
  }
}

const exportAnalysis = () => {
  ElMessage.info('导出功能开发中...')
}

// 组件挂载
onMounted(() => {
  initUniver()
})

// 组件卸载
onUnmounted(() => {
  generatedCharts.value.forEach(chart => {
    if (chart.chart) {
      chart.chart.destroy()
    }
  })
  
  if (univerInstance) {
    univerInstance.dispose()
  }
})
</script>

<style scoped lang="scss">
.univer-antv-integration {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f5f7fa;
  overflow: hidden;
}

.integration-header {
  height: 80px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  
  .header-left {
    h2 {
      margin: 0;
      font-size: 24px;
      font-weight: 600;
    }
    
    .subtitle {
      font-size: 14px;
      opacity: 0.9;
      margin-top: 4px;
      display: block;
    }
  }
  
  .header-right {
    :deep(.el-button) {
      background: rgba(255, 255, 255, 0.2);
      border: 1px solid rgba(255, 255, 255, 0.3);
      color: white;
      
      &:hover {
        background: rgba(255, 255, 255, 0.3);
      }
      
      &.el-button--primary {
        background: rgba(255, 255, 255, 0.9);
        color: #667eea;
      }
    }
  }
}

.integration-content {
  flex: 1;
  display: flex;
  gap: 20px;
  padding: 20px;
  min-height: 0;
}

.univer-section {
  flex: 1;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  
  &.full-width {
    flex: 1;
  }
  
  .section-header {
    padding: 20px 24px 16px;
    border-bottom: 1px solid #e1e8ed;
    display: flex;
    justify-content: space-between;
    align-items: center;
    
    h4 {
      margin: 0;
      font-size: 16px;
      font-weight: 600;
      color: #2c3e50;
    }
    
    .table-actions {
      display: flex;
      gap: 8px;
    }
  }
  
  .univer-container {
    flex: 1;
    min-height: 400px;
    margin: 0 20px;
  }
  
  .data-extraction-panel {
    padding: 16px 24px;
    border-top: 1px solid #e1e8ed;
    background: #f8fafe;
    
    h5 {
      margin: 0 0 12px 0;
      font-size: 14px;
      font-weight: 600;
      color: #2c3e50;
    }
    
    .extraction-controls {
      :deep(.el-select),
      :deep(.el-input) {
        width: 100%;
      }
    }
  }
}

.chart-section {
  width: 480px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  
  .section-header {
    padding: 20px 24px 16px;
    border-bottom: 1px solid #e1e8ed;
    display: flex;
    justify-content: space-between;
    align-items: center;
    
    h4 {
      margin: 0;
      font-size: 16px;
      font-weight: 600;
      color: #2c3e50;
    }
  }
  
  .data-preview {
    padding: 16px 24px;
    border-bottom: 1px solid #e1e8ed;
    
    h6 {
      margin: 0 0 12px 0;
      font-size: 13px;
      font-weight: 600;
      color: #666;
    }
    
    .preview-table {
      background: #f8fafe;
      border-radius: 6px;
      overflow: hidden;
      
      table {
        width: 100%;
        border-collapse: collapse;
        font-size: 12px;
        
        th, td {
          padding: 8px 12px;
          text-align: left;
          border-bottom: 1px solid #e1e8ed;
        }
        
        th {
          background: #409eff;
          color: white;
          font-weight: 600;
        }
        
        td {
          background: white;
        }
      }
      
      .more-indicator {
        padding: 8px 12px;
        text-align: center;
        color: #999;
        font-size: 12px;
        background: #f5f5f5;
      }
    }
  }
  
  .quick-charts {
    padding: 16px 24px;
    border-bottom: 1px solid #e1e8ed;
    
    h6 {
      margin: 0 0 12px 0;
      font-size: 13px;
      font-weight: 600;
      color: #666;
    }
    
    .chart-templates {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 8px;
    }
    
    .chart-template {
      padding: 12px 8px;
      border: 1px solid #e1e8ed;
      border-radius: 6px;
      text-align: center;
      cursor: pointer;
      transition: all 0.3s ease;
      background: white;
      
      &:hover {
        border-color: #409eff;
        background: #f0f9ff;
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(64, 158, 255, 0.15);
      }
      
      .template-icon {
        font-size: 20px;
        margin-bottom: 4px;
      }
      
      .template-name {
        font-size: 11px;
        font-weight: 600;
        color: #2c3e50;
      }
    }
  }
  
  .generated-charts {
    flex: 1;
    padding: 16px 24px;
    overflow-y: auto;
    
    .chart-item {
      margin-bottom: 20px;
      border: 1px solid #e1e8ed;
      border-radius: 8px;
      overflow: hidden;
      
      .chart-header {
        padding: 12px 16px;
        background: #f8fafe;
        border-bottom: 1px solid #e1e8ed;
        display: flex;
        justify-content: space-between;
        align-items: center;
        
        .chart-title {
          font-size: 13px;
          font-weight: 600;
          color: #2c3e50;
        }
      }
      
      .chart-container {
        height: 240px;
        padding: 12px;
      }
    }
  }
  
  .empty-charts {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 40px 24px;
  }
}

.insights-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  
  .insights-panel {
    background: white;
    border-radius: 12px;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
    width: 480px;
    max-height: 60vh;
    overflow: hidden;
    
    .insights-header {
      padding: 20px 24px;
      border-bottom: 1px solid #e1e8ed;
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #f8fafe;
      
      h4 {
        margin: 0;
        font-size: 16px;
        font-weight: 600;
        color: #2c3e50;
      }
    }
    
    .insights-content {
      padding: 20px 24px;
      overflow-y: auto;
      
      .insight-item {
        display: flex;
        align-items: flex-start;
        gap: 12px;
        margin-bottom: 16px;
        padding: 16px;
        background: #f8fafe;
        border-radius: 8px;
        border-left: 4px solid #409eff;
        
        .insight-icon {
          font-size: 24px;
          margin-top: 2px;
        }
        
        .insight-text {
          flex: 1;
          font-size: 14px;
          line-height: 1.5;
          color: #2c3e50;
          
          strong {
            color: #409eff;
          }
        }
      }
    }
  }
}

/* 响应式设计 */
@media (max-width: 1400px) {
  .integration-content {
    flex-direction: column;
    
    .chart-section {
      width: 100%;
      min-height: 400px;
    }
  }
}

/* 滚动条样式 */
.generated-charts::-webkit-scrollbar,
.insights-content::-webkit-scrollbar {
  width: 6px;
}

.generated-charts::-webkit-scrollbar-track,
.insights-content::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.generated-charts::-webkit-scrollbar-thumb,
.insights-content::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
  
  &:hover {
    background: #a8a8a8;
  }
}
</style> 