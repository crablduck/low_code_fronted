<template>
  <div class="report-designer">
    <!-- 顶部工具栏 -->
    <div class="designer-header">
      <!-- Excel 风格工具栏 -->
      <div class="excel-toolbar">
        <div class="toolbar-group">
          <el-button-group>
            <el-button 
              v-for="btn in toolbarButtons" 
              :key="btn.tooltip"
              size="small"
              :title="btn.tooltip"
            >
              <el-icon><component :is="btn.icon" /></el-icon>
            </el-button>
          </el-button-group>
        </div>

        <div class="toolbar-group">
          <el-select v-model="currentFont" size="small" style="width: 120px">
            <el-option label="微软雅黑" value="Microsoft YaHei" />
            <el-option label="宋体" value="SimSun" />
            <el-option label="Arial" value="Arial" />
          </el-select>
          <el-select v-model="fontSize" size="small" style="width: 70px">
            <el-option v-for="size in [8,9,10,11,12,14,16,18,20,22,24,26,28,36,48,72]" 
              :key="size" :label="size" :value="size" />
          </el-select>
        </div>

        <div class="toolbar-group">
          <el-button-group>
            <el-button size="small" title="加粗">
              <el-icon><Document /></el-icon>
            </el-button>
            <el-button size="small" title="斜体">
              <el-icon><Edit /></el-icon>
            </el-button>
          </el-button-group>
        </div>

        <div class="toolbar-group">
          <el-color-picker v-model="textColor" size="small" show-alpha />
          <el-color-picker v-model="backgroundColor" size="small" show-alpha />
        </div>

        <div class="toolbar-group">
          <el-button-group>
            <el-button size="small" title="插入行">
              <el-icon><Plus /></el-icon>
            </el-button>
            <el-button size="small" title="删除行">
              <el-icon><Minus /></el-icon>
            </el-button>
          </el-button-group>
        </div>
      </div>

      <!-- 公式编辑栏 -->
      <div class="formula-bar">
        <div class="cell-location">A1</div>
        <el-input
          v-model="formulaInput"
          size="small"
          placeholder="=输入公式"
        >
          <template #prefix>
            <el-icon><Operation /></el-icon>
          </template>
        </el-input>
      </div>
    </div>

    <!-- 设计器主体 -->
    <div class="designer-body">
      <div class="spreadsheet-container">
        <!-- 表格头部 -->
        <div class="column-headers">
          <div class="corner-header"></div>
          <div v-for="col in columns" :key="col" class="column-header">
            {{ col }}
          </div>
        </div>

        <!-- 表格主体 -->
        <div class="spreadsheet-content">
          <!-- 行号 -->
          <div class="row-headers">
            <div v-for="row in 100" :key="row" class="row-header">
              {{ row }}
            </div>
          </div>

          <!-- 单元格区域 -->
          <div class="cells-container">
            <table class="cells-table">
              <tbody>
                <tr v-for="row in 100" :key="row">
                  <td v-for="col in columns" :key="col" 
                      @click="selectCell(row, col)"
                      :class="{ 'selected': isSelectedCell(row, col) }"
                  >
                    <div class="cell-content" contenteditable="true"
                         @blur="updateCellContent($event, row, col)">
                      {{ getCellContent(row, col) }}
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <!-- 计算公式编辑器弹窗 -->
    <el-dialog
      v-model="formulaVisible"
      title="计算公式编辑器"
      width="800px"
      destroy-on-close
    >
      <formula-editor
        v-if="formulaVisible"
        v-model="currentFormula"
        :fields="dataFields"
        @save="handleFormulaSave"
      />
    </el-dialog>

    <!-- 数据源配置弹窗 -->
    <el-dialog
      v-model="dataSourceVisible"
      title="数据源配置"
      width="800px"
      destroy-on-close
    >
      <data-source-config
        v-if="dataSourceVisible"
        v-model="reportData.dataSource"
        @save="handleDataSourceSave"
      />
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import type { Component } from 'vue'
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  Document,
  Folder,
  Download,
  Scissor,
  DocumentCopy,
  Edit,
  Operation,
  Plus,
  Minus,
  Grid,
  Picture,
  PieChart,
  Setting
} from '@element-plus/icons-vue'

interface ComponentItem {
  type: string
  label: string
  icon: string | Component
}

interface ReportData {
  title: string
  components: any[]
  dataSource: any | null
  calculations: any[]
}

interface CanvasConfig {
  width: number
  height: number
  grid: boolean
  snap: boolean
}

interface CellPosition {
  row: number
  col: string
}

// 工具栏按钮配置
const toolbarButtons = reactive([
  { icon: Document, tooltip: '新建' },
  { icon: Folder, tooltip: '打开' },
  { icon: Download, tooltip: '保存' },
  { icon: Scissor, tooltip: '剪切' },
  { icon: DocumentCopy, tooltip: '复制' },
  { icon: Edit, tooltip: '粘贴' }
])

// 组件列表
const componentList = reactive<ComponentItem[]>([
  { type: 'text', label: '文本', icon: Document },
  { type: 'table', label: '表格', icon: Grid },
  { type: 'chart', label: '图表', icon: PieChart },
  { type: 'image', label: '图片', icon: Picture },
  { type: 'shape', label: '形状', icon: Setting }
])

// 报表数据
const reportData = reactive<ReportData>({
  title: '',
  components: [],
  dataSource: null,
  calculations: []
})

// 画布配置
const canvasConfig = reactive<CanvasConfig>({
  width: 800,
  height: 1000,
  grid: true,
  snap: true
})

// 状态变量
const formulaVisible = ref(false)
const dataSourceVisible = ref(false)
const selectedComponent = ref(null)
const currentFormula = ref('')
const dataFields = ref([])
const currentFont = ref('Microsoft YaHei')
const fontSize = ref(12)
const textColor = ref('#000000')
const backgroundColor = ref('#ffffff')
const formulaInput = ref('')
const selectedCell = ref<CellPosition>({ row: 1, col: 'A' })

// 路由相关
const route = useRoute()
const router = useRouter()

// 列标题生成
const columns = computed(() => {
  const cols = []
  for (let i = 0; i < 26; i++) {
    cols.push(String.fromCharCode(65 + i))
  }
  return cols
})

// 单元格数据
const cellsData = reactive(new Map())

// 方法定义
const handleSave = async () => {
  try {
    // TODO: 实现保存逻辑
    ElMessage.success('保存成功')
  } catch (error) {
    ElMessage.error('保存失败')
  }
}

const handlePreview = () => {
  // TODO: 实现预览逻辑
}

const handleExport = () => {
  // TODO: 实现导出逻辑
}

const handleBack = () => {
  router.back()
}

const handleClone = (item) => {
  return {
    ...item,
    id: Date.now().toString(),
    props: {},
    style: {}
  }
}

const handleCellClick = (cell) => {
  selectedComponent.value = cell
}

const handleSelectionChange = (selection) => {
  // TODO: 处理选择变化
}

const openFormulaEditor = () => {
  formulaVisible.value = true
}

const openDataSource = () => {
  dataSourceVisible.value = true
}

const handleFormulaSave = (formula) => {
  // TODO: 保存公式
  formulaVisible.value = false
}

const handleDataSourceSave = (dataSource) => {
  // TODO: 保存数据源配置
  dataSourceVisible.value = false
}

const selectCell = (row: number, col: string) => {
  selectedCell.value = { row, col }
  formulaInput.value = getCellContent(row, col) || ''
}

const isSelectedCell = (row: number, col: string) => {
  return selectedCell.value.row === row && selectedCell.value.col === col
}

const getCellContent = (row: number, col: string) => {
  return cellsData.get(`${col}${row}`) || ''
}

const updateCellContent = (event: Event, row: number, col: string) => {
  const content = (event.target as HTMLElement).innerText
  cellsData.set(`${col}${row}`, content)
}

// 生命周期钩子
onMounted(async () => {
  const id = route.query.id
  if (id) {
    // TODO: 加载报表数据
  }
})
</script>

<style scoped>
.report-designer {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #f5f7fa;
}

.designer-header {
  padding: 0;
  background-color: #fff;
  border-bottom: 1px solid #dcdfe6;
}

.excel-toolbar {
  display: flex;
  padding: 8px;
  gap: 8px;
  border-bottom: 1px solid #dcdfe6;
}

.toolbar-group {
  display: flex;
  align-items: center;
  gap: 4px;
}

.formula-bar {
  display: flex;
  align-items: center;
  padding: 4px 8px;
  gap: 8px;
  border-bottom: 1px solid #dcdfe6;
}

.cell-location {
  min-width: 60px;
  padding: 4px 8px;
  background-color: #f5f7fa;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  text-align: center;
  font-family: Consolas, monospace;
}

.spreadsheet-container {
  height: 100%;
  overflow: auto;
}

.column-headers {
  display: flex;
  position: sticky;
  top: 0;
  z-index: 2;
  background-color: #f5f7fa;
}

.corner-header {
  width: 40px;
  min-width: 40px;
  height: 24px;
  border: 1px solid #dcdfe6;
  border-top: none;
  background-color: #f5f7fa;
}

.column-header {
  width: 100px;
  min-width: 100px;
  height: 24px;
  border: 1px solid #dcdfe6;
  border-left: none;
  border-top: none;
  text-align: center;
  font-family: Consolas, monospace;
  background-color: #f5f7fa;
}

.spreadsheet-content {
  display: flex;
}

.row-headers {
  position: sticky;
  left: 0;
  z-index: 1;
}

.row-header {
  width: 40px;
  height: 24px;
  border: 1px solid #dcdfe6;
  border-top: none;
  border-left: none;
  text-align: center;
  font-family: Consolas, monospace;
  background-color: #f5f7fa;
}

.cells-container {
  flex: 1;
  overflow: auto;
}

.cells-table {
  border-collapse: collapse;
  table-layout: fixed;
}

.cells-table td {
  width: 100px;
  height: 24px;
  border: 1px solid #dcdfe6;
  padding: 0;
}

.cell-content {
  width: 100%;
  height: 100%;
  padding: 0 4px;
  outline: none;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.cells-table td.selected {
  border: 2px solid #409eff;
  background-color: #ecf5ff;
}

/* 滚动条样式 */
.spreadsheet-container::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.spreadsheet-container::-webkit-scrollbar-track {
  background: #f1f1f1;
}

.spreadsheet-container::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 4px;
}

.spreadsheet-container::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style> 