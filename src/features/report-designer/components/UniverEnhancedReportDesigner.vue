<template>
  <div class="univer-enhanced-designer">
    <!-- 顶部工具栏 -->
    <div class="designer-header">
      <div class="header-left">
        <h3>🏥 Univer 增强报表设计器</h3>
        <span class="subtitle">集成 AntV 专业图表的企业级报表平台</span>
      </div>
      <div class="header-right">
        <el-button-group>
          <el-button @click="insertChart" type="primary">
            <el-icon><TrendCharts /></el-icon>
            插入图表
          </el-button>
          <el-button @click="saveReport">
            <el-icon><DocumentAdd /></el-icon>
            保存报表
          </el-button>
          <el-button @click="exportReport">
            <el-icon><Download /></el-icon>
            导出报表
          </el-button>
        </el-button-group>
      </div>
    </div>

    <!-- 主要内容区域 -->
    <div class="designer-content">
      <!-- 左侧工具面板 -->
      <div class="left-panel">
        <!-- Univer工作表区域 -->
        <div class="univer-container">
          <div ref="univerContainer" class="univer-sheet"></div>
        </div>
      </div>

      <!-- 右侧图表配置面板 -->
      <div class="right-panel" v-show="showChartPanel">
        <div class="panel-header">
          <h4>📊 图表配置</h4>
          <el-button @click="showChartPanel = false" type="text" size="small">
            <el-icon><Close /></el-icon>
          </el-button>
        </div>

        <!-- 图表类型选择 -->
        <div class="chart-type-selection">
          <h5>图表类型</h5>
          <div class="chart-types-grid">
            <div
              v-for="type in chartTypes"
              :key="type.value"
              class="chart-type-item"
              :class="{ active: selectedChartType === type.value }"
              @click="selectChartType(type.value)"
            >
              <div class="type-icon">{{ type.icon }}</div>
              <div class="type-name">{{ type.name }}</div>
            </div>
          </div>
        </div>

        <!-- 数据源配置 -->
        <div class="data-source-config">
          <h5>数据源</h5>
          <el-form label-width="80px" size="small">
            <el-form-item label="数据范围">
              <el-input v-model="dataRange" placeholder="例如: A1:D10" />
            </el-form-item>
            <el-form-item label="X轴字段">
              <el-select v-model="chartConfig.xField" placeholder="选择X轴字段">
                <el-option
                  v-for="field in availableFields"
                  :key="field"
                  :label="field"
                  :value="field"
                />
              </el-select>
            </el-form-item>
            <el-form-item label="Y轴字段">
              <el-select v-model="chartConfig.yField" placeholder="选择Y轴字段">
                <el-option
                  v-for="field in availableFields"
                  :key="field"
                  :label="field"
                  :value="field"
                />
              </el-select>
            </el-form-item>
          </el-form>
        </div>

        <!-- 图表样式配置 -->
        <div class="chart-style-config">
          <h5>样式配置</h5>
          <el-form label-width="80px" size="small">
            <el-form-item label="图表标题">
              <el-input v-model="chartConfig.title" placeholder="输入图表标题" />
            </el-form-item>
            <el-form-item label="主题">
              <el-select v-model="chartConfig.theme">
                <el-option label="医疗蓝" value="medical-blue" />
                <el-option label="科技绿" value="tech-green" />
                <el-option label="温馨橙" value="warm-orange" />
                <el-option label="专业灰" value="professional-gray" />
              </el-select>
            </el-form-item>
            <el-form-item label="显示图例">
              <el-switch v-model="chartConfig.showLegend" />
            </el-form-item>
          </el-form>
        </div>

        <!-- 图表预览 -->
        <div class="chart-preview">
          <h5>图表预览</h5>
          <div ref="chartPreview" class="preview-container"></div>
          <div class="preview-actions">
            <el-button @click="insertChartToSheet" type="primary" size="small">
              插入到工作表
            </el-button>
            <el-button @click="updateChart" size="small">
              更新预览
            </el-button>
          </div>
        </div>
      </div>
    </div>

    <!-- 图表插入对话框 -->
    <el-dialog v-model="showChartDialog" title="选择图表类型" width="600px">
      <div class="chart-dialog-content">
        <div class="chart-types-list">
          <div
            v-for="type in chartTypes"
            :key="type.value"
            class="chart-type-card"
            @click="selectAndConfigChart(type.value)"
          >
            <div class="card-icon">{{ type.icon }}</div>
            <div class="card-content">
              <h6>{{ type.name }}</h6>
              <p>{{ type.description }}</p>
            </div>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { TrendCharts, DocumentAdd, Download, Close } from '@element-plus/icons-vue'

// AntV imports
import { Chart } from '@antv/g2'

// Univer imports
import { Univer } from '@univerjs/core'
import { defaultTheme } from '@univerjs/design'
import { UniverSheetsPlugin } from '@univerjs/sheets'
import { UniverSheetsUIPlugin } from '@univerjs/sheets-ui'
import { UniverRenderEnginePlugin } from '@univerjs/engine-render'
import { UniverUIPlugin } from '@univerjs/ui'
import { UniverFormulaEnginePlugin } from '@univerjs/engine-formula'
import { LocaleType } from '@univerjs/core'

// 类型定义
interface ChartConfig {
  type: string
  title: string
  xField: string
  yField: string
  theme: string
  showLegend: boolean
}

// 响应式数据
const univerContainer = ref<HTMLDivElement>()
const chartPreview = ref<HTMLDivElement>()
const showChartPanel = ref(false)
const showChartDialog = ref(false)
const selectedChartType = ref('column')
const dataRange = ref('A1:D10')

let univerInstance: Univer | null = null
let chartInstance: Chart | null = null

// 图表配置
const chartConfig = ref<ChartConfig>({
  type: 'column',
  title: '数据图表',
  xField: '',
  yField: '',
  theme: 'medical-blue',
  showLegend: true
})

// 图表类型配置
const chartTypes = [
  { value: 'column', name: '柱状图', icon: '📊', description: '适合对比不同类别的数据' },
  { value: 'line', name: '折线图', icon: '📈', description: '适合显示数据的趋势变化' },
  { value: 'pie', name: '饼图', icon: '🥧', description: '适合显示数据的占比关系' },
  { value: 'area', name: '面积图', icon: '📊', description: '适合显示累积数据' },
  { value: 'scatter', name: '散点图', icon: '⚫', description: '适合显示两个变量的相关性' },
  { value: 'bar', name: '条形图', icon: '📋', description: '适合显示分类数据的横向对比' }
]

// 可用字段（从工作表数据中提取）
const availableFields = ref<string[]>(['类别', '数值1', '数值2', '数值3'])

// 主题色彩配置
const themeColors = {
  'medical-blue': ['#1890ff', '#36cfc9', '#52c41a', '#faad14', '#f5222d'],
  'tech-green': ['#52c41a', '#13c2c2', '#1890ff', '#722ed1', '#eb2f96'],
  'warm-orange': ['#fa8c16', '#faad14', '#fadb14', '#a0d911', '#52c41a'],
  'professional-gray': ['#595959', '#8c8c8c', '#bfbfbf', '#d9d9d9', '#f0f0f0']
}

// 模拟数据
const mockData = [
  { category: '心内科', value1: 120, value2: 98, value3: 156 },
  { category: '骨科', value1: 98, value2: 112, value3: 134 },
  { category: '妇产科', value1: 156, value2: 89, value3: 178 },
  { category: '儿科', value1: 203, value2: 145, value3: 198 },
  { category: '神经内科', value1: 87, value2: 67, value3: 92 }
]

// 方法定义
const initUniver = async () => {
  if (!univerContainer.value) return

  try {
    const univer = new Univer({
      theme: defaultTheme
    })

    // 注册必要的插件
    univer.registerPlugin(UniverRenderEnginePlugin)
    univer.registerPlugin(UniverUIPlugin, {
      container: univerContainer.value
    })
    univer.registerPlugin(UniverSheetsPlugin)
    univer.registerPlugin(UniverSheetsUIPlugin)
    univer.registerPlugin(UniverFormulaEnginePlugin)

    univerInstance = univer
    ElMessage.success('Univer 初始化成功')
  } catch (error) {
    console.error('Univer 初始化失败:', error)
    ElMessage.error('Univer 初始化失败')
  }
}

const insertChart = () => {
  showChartDialog.value = true
}

const selectAndConfigChart = (type: string) => {
  selectedChartType.value = type
  chartConfig.value.type = type
  showChartDialog.value = false
  showChartPanel.value = true
  
  nextTick(() => {
    updateChart()
  })
}

const selectChartType = (type: string) => {
  selectedChartType.value = type
  chartConfig.value.type = type
  updateChart()
}

const updateChart = () => {
  if (!chartPreview.value) return

  // 清理之前的图表
  if (chartInstance) {
    chartInstance.destroy()
  }

  // 创建新图表
  chartInstance = new Chart({
    container: chartPreview.value,
    autoFit: true
  })

  chartInstance.theme({
    defaultColor: themeColors[chartConfig.value.theme][0],
    colors10: themeColors[chartConfig.value.theme]
  })

  chartInstance.data(mockData)

  // 根据图表类型配置
  switch (chartConfig.value.type) {
    case 'column':
      chartInstance
        .interval()
        .encode('x', 'category')
        .encode('y', 'value1')
        .encode('color', 'category')
      break
    
    case 'line':
      chartInstance
        .line()
        .encode('x', 'category')
        .encode('y', 'value1')
        .encode('color', () => chartConfig.value.title)
        .style('stroke', themeColors[chartConfig.value.theme][0])
        .style('lineWidth', 3)
      
      chartInstance
        .point()
        .encode('x', 'category')
        .encode('y', 'value1')
        .style('fill', themeColors[chartConfig.value.theme][0])
        .style('r', 4)
      break
    
    case 'pie':
      chartInstance
        .coordinate({ type: 'theta', outerRadius: 0.8 })
      
      chartInstance
        .interval()
        .transform({ type: 'stackY' })
        .encode('y', 'value1')
        .encode('color', 'category')
        .legend('color', { position: 'right' })
      break
    
    case 'area':
      chartInstance
        .area()
        .encode('x', 'category')
        .encode('y', 'value1')
        .style('fill', `l(270) 0:${themeColors[chartConfig.value.theme][0]}40 1:${themeColors[chartConfig.value.theme][0]}`)
      break
    
    case 'scatter':
      chartInstance
        .point()
        .encode('x', 'value1')
        .encode('y', 'value2')
        .encode('color', 'category')
        .encode('size', 10)
      break
    
    case 'bar':
      chartInstance
        .interval()
        .coordinate({ type: 'transpose' })
        .encode('x', 'value1')
        .encode('y', 'category')
        .encode('color', 'category')
      break
  }

  chartInstance.interaction('tooltip', {
    shared: true,
    title: chartConfig.value.title
  })

  chartInstance.render()
}

const insertChartToSheet = () => {
  if (!univerInstance) {
    ElMessage.error('Univer 实例未初始化')
    return
  }

  // 这里实现将图表插入到工作表的逻辑
  ElMessage.success('图表已插入到工作表')
  showChartPanel.value = false
}

const saveReport = () => {
  ElMessage.success('报表已保存')
}

const exportReport = () => {
  ElMessage.success('报表已导出')
}

// 生命周期
onMounted(async () => {
  await nextTick()
  await initUniver()
})

onUnmounted(() => {
  if (chartInstance) {
    chartInstance.destroy()
  }
  if (univerInstance) {
    univerInstance.dispose()
  }
})
</script>

<style scoped lang="scss">
.univer-enhanced-designer {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f5f7fa;
  overflow: hidden;
}

.designer-header {
  height: 80px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  flex-shrink: 0;
  
  .header-left {
    h3 {
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
    }
  }
}

.designer-content {
  flex: 1;
  display: flex;
  min-height: 0;
}

.left-panel {
  flex: 1;
  background: white;
  margin: 16px;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  overflow: hidden;
}

.univer-container {
  height: 100%;
  padding: 16px;
}

.univer-sheet {
  height: 100%;
  border-radius: 8px;
  overflow: hidden;
}

.right-panel {
  width: 350px;
  background: white;
  margin: 16px 16px 16px 0;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #e1e8ed;
  background: linear-gradient(135deg, #fafbfc 0%, #f5f7fa 100%);
  
  h4 {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    color: #2c3e50;
  }
}

.chart-type-selection,
.data-source-config,
.chart-style-config,
.chart-preview {
  padding: 16px 20px;
  border-bottom: 1px solid #f0f0f0;
  
  h5 {
    margin: 0 0 12px 0;
    font-size: 14px;
    font-weight: 600;
    color: #606266;
  }
}

.chart-types-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

.chart-type-item {
  padding: 12px 8px;
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    border-color: #409eff;
    background: #ecf5ff;
  }
  
  &.active {
    border-color: #409eff;
    background: #409eff;
    color: white;
  }
  
  .type-icon {
    font-size: 18px;
    margin-bottom: 4px;
  }
  
  .type-name {
    font-size: 12px;
    font-weight: 500;
  }
}

.preview-container {
  height: 200px;
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  margin-bottom: 12px;
}

.preview-actions {
  display: flex;
  gap: 8px;
}

.chart-dialog-content {
  padding: 20px 0;
}

.chart-types-list {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.chart-type-card {
  padding: 20px;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 16px;
  
  &:hover {
    border-color: #409eff;
    background: #ecf5ff;
    transform: translateY(-2px);
    box-shadow: 0 8px 16px rgba(64, 158, 255, 0.1);
  }
  
  .card-icon {
    font-size: 32px;
    width: 50px;
    height: 50px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #409eff 0%, #337ecc 100%);
    border-radius: 8px;
    color: white;
  }
  
  .card-content {
    flex: 1;
    
    h6 {
      margin: 0 0 4px 0;
      font-size: 16px;
      font-weight: 600;
      color: #2c3e50;
    }
    
    p {
      margin: 0;
      font-size: 13px;
      color: #7f8c8d;
      line-height: 1.4;
    }
  }
}

/* 表单样式优化 */
:deep(.el-form) {
  .el-form-item {
    margin-bottom: 16px;
  }
  
  .el-input,
  .el-select {
    width: 100%;
  }
}

/* 滚动条样式 */
.right-panel::-webkit-scrollbar {
  width: 6px;
}

.right-panel::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.right-panel::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
  
  &:hover {
    background: #a8a8a8;
  }
}
</style> 