<template>
  <div class="workflow-designer">
    <!-- 主设计区域 -->
    <div class="flow-main">
    <!-- 左侧节点面板 -->
    <div class="node-panel">
      <div class="panel-header">
        <h3>🔧 流程节点</h3>
        <el-divider />
      </div>
      
      <!-- 基础节点 -->
      <div class="node-category">
        <h4>基础节点</h4>
        <div
          class="drag-node start-node"
          draggable="true"
          @dragstart="onDragStart($event, 'input')"
        >
          <el-icon><VideoPlay /></el-icon>
          <span>开始节点</span>
        </div>
        <div
          class="drag-node process-node"
          draggable="true"
          @dragstart="onDragStart($event, 'default')"
        >
          <el-icon><Operation /></el-icon>
          <span>处理节点</span>
        </div>
        <div
          class="drag-node end-node"
          draggable="true"
          @dragstart="onDragStart($event, 'output')"
        >
          <el-icon><CircleCheck /></el-icon>
          <span>结束节点</span>
        </div>
      </div>

      <!-- 高级节点 -->
      <div class="node-category">
        <h4>高级节点</h4>
        <div
          class="drag-node decision-node"
          draggable="true"
          @dragstart="onDragStart($event, 'decision')"
        >
          <el-icon><Switch /></el-icon>
          <span>条件判断</span>
        </div>
        <div
          class="drag-node parallel-node"
          draggable="true"
          @dragstart="onDragStart($event, 'parallel')"
        >
          <el-icon><Connection /></el-icon>
          <span>并行处理</span>
        </div>
        <div
          class="drag-node timer-node"
          draggable="true"
          @dragstart="onDragStart($event, 'timer')"
        >
          <el-icon><Timer /></el-icon>
          <span>定时器</span>
        </div>
      </div>
    </div>

      <!-- 中间画布区域 -->
      <div class="canvas-area">
      <!-- 顶部工具栏 -->
      <div class="toolbar">
        <div class="toolbar-left">
          <el-button type="primary" @click="onSave">
            <el-icon><Download /></el-icon>
            保存流程
          </el-button>
          <el-button @click="addNode">
            <el-icon><Plus /></el-icon>
            添加节点
          </el-button>
          <el-button @click="deleteNode" :disabled="!hasSelectedNodes">
            <el-icon><Delete /></el-icon>
            删除节点
          </el-button>
        </div>
        
        <div class="toolbar-right">
          <el-button @click="fitView">
            <el-icon><FullScreen /></el-icon>
            适应画布
          </el-button>
          <el-button @click="clearFlow">
            <el-icon><RefreshLeft /></el-icon>
            清空画布
          </el-button>
          <el-button @click="exportFlow">
            <el-icon><Document /></el-icon>
            导出流程
          </el-button>
        </div>
      </div>

      <!-- 流程设计画布 -->
      <VueFlow
        v-model:nodes="nodes"
        v-model:edges="edges"
        :default-viewport="{ zoom: 1 }"
        class="flow-canvas"
        @connect="onConnect"
        @drop="onDrop"
        @dragover="onDragOver"
        @node-click="onNodeClick"
        @edge-click="onEdgeClick"
        :connection-line-style="{ stroke: '#409eff', strokeWidth: 2 }"
        :default-edge-options="{ type: 'smoothstep', animated: true }"
      >
        <Background pattern-color="#e4e7ed" :gap="20" />
        <Controls :show-interactive="false" />
        <MiniMap 
          :node-color="getNodeColor"
          :mask-color="'rgba(64, 158, 255, 0.1)'"
          pannable
          zoomable
        />
      </VueFlow>
    </div>

    <!-- 右侧属性面板 -->
    <div class="property-panel" v-if="selectedNode">
      <div class="panel-header">
        <h3>⚙️ 节点属性</h3>
        <el-divider />
      </div>
      
      <el-form label-position="top" size="small">
        <el-form-item label="节点ID">
          <el-input v-model="selectedNode.id" disabled />
        </el-form-item>
        
        <el-form-item label="节点名称">
          <el-input v-model="selectedNode.data.label" @input="updateNodeLabel" />
        </el-form-item>
        
        <el-form-item label="节点类型">
            <el-tag :type="getNodeTypeColor(selectedNode.data.nodeType || selectedNode.type)">
              {{ getNodeTypeName(selectedNode.data.nodeType || selectedNode.type) }}
          </el-tag>
        </el-form-item>
        
        <el-form-item label="节点描述">
          <el-input 
            v-model="selectedNode.data.description" 
            type="textarea" 
            :rows="3"
            placeholder="请输入节点描述..."
            @input="updateNodeData"
          />
        </el-form-item>
        
        <!-- 条件节点特殊配置 -->
          <template v-if="selectedNode.data.nodeType === 'decision'">
          <el-form-item label="条件表达式">
            <el-input 
              v-model="selectedNode.data.condition" 
              placeholder="例如: ${amount} > 1000"
              @input="updateNodeData"
            />
          </el-form-item>
        </template>
        
        <!-- 定时器节点特殊配置 -->
          <template v-if="selectedNode.data.nodeType === 'timer'">
          <el-form-item label="延迟时间(秒)">
            <el-input-number 
              v-model="selectedNode.data.delay" 
              :min="1"
              @change="updateNodeData"
            />
          </el-form-item>
        </template>
      </el-form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// @ts-nocheck
import { ref, computed, onMounted } from 'vue'
import { VueFlow, useVueFlow } from '@vue-flow/core'
import { Background } from '@vue-flow/background'
import { MiniMap } from '@vue-flow/minimap'
import { Controls } from '@vue-flow/controls'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  VideoPlay,
  Operation,
  CircleCheck,
  Switch,
  Connection,
  Timer,
  Download,
  Plus,
  Delete,
  FullScreen,
  RefreshLeft,
  Document
} from '@element-plus/icons-vue'
import type { Node, Edge } from '@vue-flow/core'

// 获取节点样式
const getNodeStyle = (type: string) => {
  const styles: Record<string, any> = {
    decision: {
      background: '#f0f9ff',
      border: '2px solid #0ea5e9',
      borderRadius: '8px'
    },
    parallel: {
      background: '#f0fdf4',
      border: '2px solid #22c55e',
      borderRadius: '8px'
    },
    timer: {
      background: '#fefce8',
      border: '2px solid #eab308',
      borderRadius: '8px'
    }
  }
  return styles[type] || {}
}

// 初始化节点和连线
const nodes = ref<Node[]>([
  {
    id: 'start-1',
    type: 'input',
    position: { x: 100, y: 100 },
    data: { 
      label: '流程开始',
      description: '流程的起始节点',
      nodeType: 'input'
    },
  },
  {
    id: 'process-1',
    type: 'default',
    position: { x: 300, y: 200 },
    data: { 
      label: '审核处理',
      description: '进行业务审核处理',
      nodeType: 'default'
    },
  },
  {
    id: 'decision-1',
    type: 'default',
    position: { x: 500, y: 200 },
    data: { 
      label: '审核结果',
      description: '判断审核是否通过',
      nodeType: 'decision',
      condition: '${approved} == true'
    },
    style: getNodeStyle('decision'),
    class: 'node-decision'
  },
  {
    id: 'end-1',
    type: 'output',
    position: { x: 700, y: 100 },
    data: { 
      label: '流程结束',
      description: '流程的结束节点',
      nodeType: 'output'
    },
  }
])

const edges = ref<Edge[]>([
  {
    id: 'e1-2',
    source: 'start-1',
    target: 'process-1',
    label: '开始',
    type: 'smoothstep'
  },
  {
    id: 'e2-3',
    source: 'process-1',
    target: 'decision-1',
    label: '提交审核',
    type: 'smoothstep'
  },
  {
    id: 'e3-4',
    source: 'decision-1',
    target: 'end-1',
    label: '通过',
    type: 'smoothstep'
  }
])

// 选中的节点
const selectedNode = ref<Node | null>(null)

// 获取 vue-flow 实例方法
const { 
  addNodes,
  removeNodes,
  fitView: fitViewFlow,
  project,
  getSelectedNodes,
  getSelectedEdges
} = useVueFlow()

// 计算是否有选中的节点
const hasSelectedNodes = computed(() => {
  return getSelectedNodes.value.length > 0
})

// 拖拽开始
const onDragStart = (event: DragEvent, type: string) => {
  if (event.dataTransfer) {
    event.dataTransfer.setData('application/vueflow', type)
    event.dataTransfer.effectAllowed = 'move'
  }
}

// 拖拽结束，添加新节点
const onDrop = (event: DragEvent) => {
  if (!event.dataTransfer) return

  const type = event.dataTransfer.getData('application/vueflow')
  const { left, top } = (event.target as HTMLDivElement).getBoundingClientRect()
  const position = project({
    x: event.clientX - left,
    y: event.clientY - top,
  })

  // 根据类型确定节点的实际类型
  let nodeType = type
  // decision 节点在 vue-flow 中应该使用 default 类型，通过样式和数据来区分
  if (type === 'decision' || type === 'parallel' || type === 'timer') {
    nodeType = 'default'
  }

  const newNode: Node = {
    id: `${type}-${Date.now()}`,
    type: nodeType,
    position,
    data: { 
      label: getNodeLabel(type),
      description: getNodeDescription(type),
      nodeType: type, // 保存原始类型用于区分
      ...(type === 'decision' && { condition: '' }),
      ...(type === 'timer' && { delay: 60 })
    },
    style: getNodeStyle(type),
    // 为特殊节点添加类名
    class: type === 'decision' || type === 'parallel' || type === 'timer' ? `node-${type}` : ''
  }

  addNodes([newNode])
  ElMessage.success(`已添加${getNodeLabel(type)}`)
}

// 允许拖拽
const onDragOver = (event: DragEvent) => {
  event.preventDefault()
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = 'move'
  }
}

// 连线处理
const onConnect = (params: any) => {
  const newEdge = {
    id: `e-${Date.now()}`,
    source: params.source,
    target: params.target,
    type: 'smoothstep',
    animated: true,
    label: '连接'
  }
  edges.value.push(newEdge)
  ElMessage.success('连线创建成功')
}

// 节点点击事件
const onNodeClick = (event: any) => {
  selectedNode.value = event.node
}

// 连线点击事件
const onEdgeClick = (event: any) => {
  selectedNode.value = null
}

// 保存流程
const onSave = () => {
  const flowData = {
    nodes: nodes.value,
    edges: edges.value,
    timestamp: new Date().toISOString()
  }
  
  console.log('保存流程数据:', flowData)
  
  // 创建下载链接
  const blob = new Blob([JSON.stringify(flowData, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `workflow-${Date.now()}.json`
  a.click()
  URL.revokeObjectURL(url)
  
  ElMessage.success('流程已保存并下载')
}

// 添加节点
const addNode = () => {
  const newNode = {
    id: `node-${Date.now()}`,
    type: 'default',
    position: { x: 200, y: 200 },
    data: { 
      label: '新节点',
      description: '新添加的处理节点'
    },
  }
  addNodes([newNode])
  ElMessage.success('已添加新节点')
}

// 删除选中节点
const deleteNode = () => {
  const selectedNodes = getSelectedNodes.value
  const selectedEdges = getSelectedEdges.value
  
  if (selectedNodes.length === 0 && selectedEdges.length === 0) {
    ElMessage.warning('请先选中要删除的节点或连线')
    return
  }
  
  ElMessageBox.confirm(
    `确定要删除选中的 ${selectedNodes.length} 个节点和 ${selectedEdges.length} 条连线吗？`,
    '确认删除',
    {
      type: 'warning'
    }
  ).then(() => {
    if (selectedNodes.length > 0) {
      removeNodes(selectedNodes)
    }
    if (selectedEdges.length > 0) {
      edges.value = edges.value.filter(edge => 
        !selectedEdges.some(selected => selected.id === edge.id)
      )
    }
    selectedNode.value = null
    ElMessage.success('删除成功')
  }).catch(() => {})
}

// 清空画布
const clearFlow = () => {
  ElMessageBox.confirm('确定要清空整个流程画布吗？', '确认清空', {
    type: 'warning'
  }).then(() => {
    nodes.value = []
    edges.value = []
    selectedNode.value = null
    ElMessage.success('画布已清空')
  }).catch(() => {})
}

// 导出流程
const exportFlow = () => {
  const flowData = {
    nodes: nodes.value,
    edges: edges.value,
    metadata: {
      name: '工作流程',
      version: '1.0.0',
      created: new Date().toISOString()
    }
  }
  
  console.log('导出流程:', flowData)
  ElMessage.success('流程已导出到控制台')
}

// 适应画布
const fitView = () => {
  fitViewFlow({ padding: 0.2 })
  ElMessage.success('画布已适应')
}

// 更新节点标签
const updateNodeLabel = () => {
  // 触发响应式更新
}

// 更新节点数据
const updateNodeData = () => {
  // 触发响应式更新
}

// 获取节点显示名称
const getNodeLabel = (type: string): string => {
  const labels: Record<string, string> = {
    input: '开始节点',
    default: '处理节点',
    output: '结束节点',
    decision: '条件判断',
    parallel: '并行处理',
    timer: '定时器'
  }
  return labels[type] || '未知节点'
}

// 获取节点描述
const getNodeDescription = (type: string): string => {
  const descriptions: Record<string, string> = {
    input: '流程的起始节点',
    default: '执行业务处理逻辑',
    output: '流程的结束节点',
    decision: '根据条件进行分支判断',
    parallel: '并行执行多个任务',
    timer: '延迟执行或定时触发'
  }
  return descriptions[type] || '节点描述'
}

// 获取节点类型名称
const getNodeTypeName = (type: string): string => {
  const names: Record<string, string> = {
    input: '开始节点',
    default: '处理节点',
    output: '结束节点',
    decision: '条件节点',
    parallel: '并行节点',
    timer: '定时节点'
  }
  return names[type] || type
}

// 获取节点类型颜色
const getNodeTypeColor = (type: string): string => {
  const colors: Record<string, string> = {
    input: 'success',
    default: 'primary',
    output: 'danger',
    decision: 'warning',
    parallel: 'info',
    timer: 'warning'
  }
  return colors[type] || 'default'
}

// 获取小地图节点颜色
const getNodeColor = (node: Node): string => {
  const nodeType = node.data?.nodeType || node.type || 'default'
  const colors: Record<string, string> = {
    input: '#22c55e',
    default: '#409eff',
    output: '#f56565',
    decision: '#eab308',
    parallel: '#06b6d4',
    timer: '#f59e0b'
  }
  return colors[nodeType] || '#409eff'
}

onMounted(() => {
  fitView()
})
</script>

<style scoped lang="scss">
.workflow-designer {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f5f7fa;
  overflow: hidden;
}

/* 主设计区域 */
.flow-main {
  flex: 1;
  display: flex;
  min-height: 0;
}

/* 左侧节点面板 */
.node-panel {
  width: 240px;
  background: white;
  border-right: 1px solid #e4e7ed;
  display: flex;
  flex-direction: column;

.panel-header {
    padding: 16px;
    border-bottom: 1px solid #f0f0f0;
    background: #fafbfc;

    h3 {
  margin: 0;
      font-size: 14px;
      color: #606266;
      font-weight: 600;
    }
  }
}

.node-category {
  margin-bottom: 24px;
  padding: 0 16px;
  
  &:last-child {
    margin-bottom: 0;
  }
  
  h4 {
  margin: 0 0 12px 0;
    font-size: 13px;
    color: #909399;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
}

.drag-node {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  margin-bottom: 8px;
  background: #ffffff;
  border: 1.5px solid #e4e7ed;
  border-radius: 8px;
  cursor: grab;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  font-size: 13px;
  color: #606266;
  
  &:hover {
  transform: translateY(-1px);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.08);
    border-color: #c6e2ff;
}

  &:active {
  cursor: grabbing;
    transform: translateY(0);
}

  .el-icon {
    font-size: 16px;
    flex-shrink: 0;
  }
  
  span {
    font-weight: 500;
  }
}

// 节点类型特定样式
.start-node {
  border-color: #67c23a;
  background: linear-gradient(135deg, #f0f9ff 0%, #e8f5e8 100%);
  
  .el-icon {
    color: #67c23a;
  }
  
  &:hover {
    border-color: #85ce61;
    background: linear-gradient(135deg, #e1f3d8 0%, #d5f2d5 100%);
  }
}

.process-node {
  border-color: #409eff;
  background: linear-gradient(135deg, #ecf5ff 0%, #e1f0ff 100%);
  
  .el-icon {
    color: #409eff;
  }
  
  &:hover {
    border-color: #66b1ff;
    background: linear-gradient(135deg, #d9ecff 0%, #cce7ff 100%);
  }
}

.end-node {
  border-color: #f56c6c;
  background: linear-gradient(135deg, #fef0f0 0%, #fde2e2 100%);
  
  .el-icon {
    color: #f56c6c;
  }
  
  &:hover {
    border-color: #f78989;
    background: linear-gradient(135deg, #fde2e2 0%, #fcd5d5 100%);
  }
}

.decision-node {
  border-color: #e6a23c;
  background: linear-gradient(135deg, #fdf6ec 0%, #faecd8 100%);
  
  .el-icon {
    color: #e6a23c;
  }
  
  &:hover {
    border-color: #ebb563;
    background: linear-gradient(135deg, #faecd8 0%, #f7e2c4 100%);
  }
}

.parallel-node {
  border-color: #909399;
  background: linear-gradient(135deg, #f4f4f5 0%, #e9e9eb 100%);
  
  .el-icon {
    color: #909399;
  }
  
  &:hover {
    border-color: #a6a9ad;
    background: linear-gradient(135deg, #e9e9eb 0%, #dcdfe6 100%);
  }
}

.timer-node {
  border-color: #b88230;
  background: linear-gradient(135deg, #fdf5e6 0%, #faecd0 100%);
  
  .el-icon {
    color: #b88230;
  }
  
  &:hover {
    border-color: #c89450;
    background: linear-gradient(135deg, #faecd0 0%, #f7e3bb 100%);
  }
}

/* 中间画布区域 */
.canvas-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

/* 工具栏样式 */
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 20px;
  background: white;
  border-bottom: 1px solid #e4e7ed;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);

.toolbar-left,
.toolbar-right {
  display: flex;
  gap: 8px;
  }
}

/* 流程画布样式 */
.flow-canvas {
  flex: 1;
  position: relative;
  background: #fafbfc;
  
  // 网格背景
  background-image: 
    radial-gradient(circle, #d1d5db 1px, transparent 1px);
  background-size: 20px 20px;
  background-position: 0 0, 10px 10px;
}

/* 右侧属性面板 */
.property-panel {
  width: 300px;
  background: white;
  border-left: 1px solid #e4e7ed;
  display: flex;
  flex-direction: column;
  
  .panel-header {
    padding: 16px 20px;
    border-bottom: 1px solid #f0f0f0;
    background: #fafbfc;
    
    h3 {
      margin: 0;
      font-size: 16px;
      color: #303133;
      font-weight: 600;
    }
  }
  
  .el-form {
    padding: 20px;
    flex: 1;
    overflow-y: auto;
    
    .el-form-item {
      margin-bottom: 20px;
      
      &:last-child {
        margin-bottom: 0;
      }
    }
    
    .el-form-item__label {
      font-weight: 500;
      color: #606266;
    }
  }
}

/* Vue Flow 节点自定义样式 */
:deep(.vue-flow__node) {
  background: white;
  border: 2px solid #e4e7ed;
  border-radius: 8px;
  padding: 12px 16px;
  font-size: 14px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  min-width: 120px;
  
  &:hover {
    border-color: #409eff;
    box-shadow: 0 4px 16px rgba(64, 158, 255, 0.15);
    transform: translateY(-1px);
  }
  
  &.selected {
    border-color: #409eff;
    box-shadow: 0 0 0 3px rgba(64, 158, 255, 0.2);
  }
}

:deep(.vue-flow__node-input) {
  background: linear-gradient(135deg, #f0f9ff 0%, #e8f5e8 100%);
  border-color: #67c23a;
  color: #67c23a;
  font-weight: 600;
}

:deep(.vue-flow__node-output) {
  background: linear-gradient(135deg, #fef0f0 0%, #fde2e2 100%);
  border-color: #f56c6c;
  color: #f56c6c;
  font-weight: 600;
}

:deep(.vue-flow__node-default) {
  background: linear-gradient(135deg, #ecf5ff 0%, #e1f0ff 100%);
  border-color: #409eff;
  color: #409eff;
  font-weight: 500;
  
  &.node-decision {
    background: linear-gradient(135deg, #fdf6ec 0%, #faecd8 100%);
    border-color: #e6a23c;
    color: #e6a23c;
    border-radius: 12px;
    
    &::before {
      content: '';
      position: absolute;
      top: -2px;
      left: -2px;
      right: -2px;
      bottom: -2px;
      background: linear-gradient(45deg, #e6a23c, #ebb563);
      border-radius: 14px;
      z-index: -1;
    }
  }
}

:deep(.vue-flow__edge-path) {
  stroke: #409eff;
  stroke-width: 2;
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1));
}

:deep(.vue-flow__edge.selected .vue-flow__edge-path) {
  stroke: #66b1ff;
  stroke-width: 3;
}

:deep(.vue-flow__edge-textbg) {
  fill: white;
  stroke: #e4e7ed;
  stroke-width: 1;
}

:deep(.vue-flow__edge-text) {
  font-size: 12px;
  font-weight: 500;
  fill: #606266;
}

/* 控制面板样式 */
:deep(.vue-flow__controls) {
  background: white;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  
  .vue-flow__controls-button {
    border: none;
    border-bottom: 1px solid #f0f0f0;
    background: white;
    color: #606266;
    transition: all 0.2s;
    
    &:hover {
      background: #f5f7fa;
      color: #409eff;
}

    &:last-child {
      border-bottom: none;
    }
  }
}

/* 小地图样式 */
:deep(.vue-flow__minimap) {
  background: white;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .property-panel {
    width: 280px;
  }
}

@media (max-width: 768px) {
  .node-panel {
    width: 200px;
  }
  
  .property-panel {
    width: 260px;
    position: absolute;
    right: 0;
    top: 0;
    height: 100%;
    transform: translateX(100%);
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: -4px 0 16px rgba(0, 0, 0, 0.1);
    z-index: 1000;
    
    &.show {
      transform: translateX(0);
    }
  }
  
  .drag-node span {
    font-size: 12px;
  }
}

@media (max-width: 480px) {
  .node-panel {
    width: 60px;
    
    .panel-header h3,
    .node-category h4,
    .drag-node span {
      display: none;
  }
  
    .drag-node {
    justify-content: center;
      padding: 12px 8px;
    }
  }
  
  .toolbar {
    padding: 8px 12px;
  }
}
</style> 