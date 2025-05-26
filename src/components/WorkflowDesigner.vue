<template>
  <div class="workflow-designer">
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

    <!-- 主设计区域 -->
    <div class="flow-main">
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
          <el-tag :type="getNodeTypeColor(selectedNode.type)">
            {{ getNodeTypeName(selectedNode.type) }}
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
        <template v-if="selectedNode.type === 'decision'">
          <el-form-item label="条件表达式">
            <el-input 
              v-model="selectedNode.data.condition" 
              placeholder="例如: ${amount} > 1000"
              @input="updateNodeData"
            />
          </el-form-item>
        </template>
        
        <!-- 定时器节点特殊配置 -->
        <template v-if="selectedNode.type === 'timer'">
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

// 初始化节点和连线
const nodes = ref<Node[]>([
  {
    id: 'start-1',
    type: 'input',
    position: { x: 100, y: 100 },
    data: { 
      label: '流程开始',
      description: '流程的起始节点'
    },
  },
  {
    id: 'process-1',
    type: 'default',
    position: { x: 300, y: 200 },
    data: { 
      label: '审核处理',
      description: '进行业务审核处理'
    },
  },
  {
    id: 'decision-1',
    type: 'decision',
    position: { x: 500, y: 200 },
    data: { 
      label: '审核结果',
      description: '判断审核是否通过',
      condition: '${approved} == true'
    },
  },
  {
    id: 'end-1',
    type: 'output',
    position: { x: 700, y: 100 },
    data: { 
      label: '流程结束',
      description: '流程的结束节点'
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

  const newNode: Node = {
    id: `${type}-${Date.now()}`,
    type: type === 'decision' ? 'default' : type,
    position,
    data: { 
      label: getNodeLabel(type),
      description: getNodeDescription(type),
      ...(type === 'decision' && { condition: '' }),
      ...(type === 'timer' && { delay: 60 })
    },
    style: getNodeStyle(type)
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
  const colors: Record<string, string> = {
    input: '#22c55e',
    default: '#409eff',
    output: '#f56565',
    decision: '#eab308',
    parallel: '#06b6d4',
    timer: '#f59e0b'
  }
  return colors[node.type || 'default'] || '#409eff'
}

onMounted(() => {
  fitView()
})
</script>

<style>
@import '@vue-flow/core/dist/style.css';
@import '@vue-flow/core/dist/theme-default.css';
</style>

<style scoped>
.workflow-designer {
  display: flex;
  width: 100%;
  height: 100vh;
  background: #f8f9fa;
}

.node-panel {
  width: 280px;
  background: white;
  border-right: 1px solid #e4e7ed;
  overflow-y: auto;
}

.panel-header {
  padding: 20px 20px 0 20px;
}

.panel-header h3 {
  margin: 0;
  color: #2c3e50;
  font-size: 16px;
}

.node-category {
  padding: 0 20px 20px 20px;
}

.node-category h4 {
  margin: 0 0 12px 0;
  color: #606266;
  font-size: 14px;
  font-weight: 500;
}

.drag-node {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  margin-bottom: 8px;
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  cursor: grab;
  background: white;
  transition: all 0.3s;
  font-size: 14px;
}

.drag-node:hover {
  box-shadow: 0 2px 12px rgba(64, 158, 255, 0.15);
  border-color: #409eff;
  transform: translateY(-1px);
}

.drag-node:active {
  cursor: grabbing;
}

.start-node:hover {
  border-color: #67c23a;
  box-shadow: 0 2px 12px rgba(103, 194, 58, 0.15);
}

.end-node:hover {
  border-color: #f56c6c;
  box-shadow: 0 2px 12px rgba(245, 108, 108, 0.15);
}

.decision-node:hover {
  border-color: #e6a23c;
  box-shadow: 0 2px 12px rgba(230, 162, 60, 0.15);
}

.flow-main {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 20px;
  background: white;
  border-bottom: 1px solid #e4e7ed;
}

.toolbar-left,
.toolbar-right {
  display: flex;
  gap: 8px;
}

.flow-canvas {
  flex: 1;
}

.property-panel {
  width: 300px;
  background: white;
  border-left: 1px solid #e4e7ed;
  overflow-y: auto;
  padding: 0 0 20px 0;
}

.property-panel .panel-header {
  padding: 20px 20px 0 20px;
}

.property-panel .el-form {
  padding: 0 20px;
}

/* Vue Flow 自定义样式 */
:deep(.vue-flow__node) {
  font-size: 12px;
}

:deep(.vue-flow__node.selected) {
  box-shadow: 0 0 0 2px #409eff;
}

:deep(.vue-flow__edge.selected .vue-flow__edge-path) {
  stroke: #409eff;
  stroke-width: 3;
}

:deep(.vue-flow__controls) {
  bottom: 20px;
  left: 20px;
}

:deep(.vue-flow__minimap) {
  bottom: 20px;
  right: 20px;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .node-panel {
    width: 240px;
  }
  
  .property-panel {
    width: 260px;
  }
}

@media (max-width: 768px) {
  .workflow-designer {
    flex-direction: column;
  }
  
  .node-panel,
  .property-panel {
    width: 100%;
    height: 200px;
  }
  
  .toolbar {
    flex-direction: column;
    gap: 8px;
  }
  
  .toolbar-left,
  .toolbar-right {
    width: 100%;
    justify-content: center;
  }
}
</style> 