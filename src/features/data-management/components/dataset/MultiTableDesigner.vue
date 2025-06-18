<template>
  <div class="multi-table-designer">
    <div class="designer-layout">
      <!-- 左侧表选择面板 -->
      <div class="tables-panel">
        <div class="panel-header">
          <h4>可用数据表</h4>
          <el-input
            v-model="searchKeyword"
            placeholder="搜索表名"
            size="small"
            prefix-icon="Search"
            clearable
          />
        </div>
        
        <div class="tables-list">
          <div
            v-for="table in filteredTables"
            :key="table.name"
            class="table-item"
            :class="{ selected: selectedTables.includes(table.name) }"
            @click="toggleTable(table.name)"
            draggable="true"
            @dragstart="handleDragStart($event, table)"
          >
            <div class="table-icon">
              <el-icon><Grid /></el-icon>
            </div>
            <div class="table-info">
              <div class="table-name">{{ table.name }}</div>
              <div class="table-desc">{{ table.description || '暂无描述' }}</div>
              <div class="table-count">{{ table.rowCount || 0 }} 条记录</div>
            </div>
            <div class="table-actions">
              <el-button
                v-if="selectedTables.includes(table.name)"
                type="danger"
                size="small"
                circle
                @click.stop="removeTable(table.name)"
              >
                <el-icon><Close /></el-icon>
              </el-button>
              <el-button
                v-else
                type="primary"
                size="small"
                circle
                @click.stop="addTable(table.name)"
              >
                <el-icon><Plus /></el-icon>
              </el-button>
            </div>
          </div>
        </div>
      </div>

      <!-- 中间关联设计画布 -->
      <div class="canvas-panel">
        <div class="panel-header">
          <h4>表关联设计</h4>
          <div class="canvas-actions">
            <el-button size="small" @click="triggerSmartDetection" type="primary">
              <el-icon><Link /></el-icon>
              智能关联
            </el-button>
            <el-button size="small" @click="autoLayout">自动布局</el-button>
            <el-button size="small" @click="clearCanvas">清空画布</el-button>
            <el-button size="small" @click="zoomIn">放大</el-button>
            <el-button size="small" @click="zoomOut">缩小</el-button>
          </div>
        </div>
        
        <div 
          ref="canvasRef" 
          class="relation-canvas"
          @drop="handleDrop"
          @dragover="handleDragOver"
          @click="clearSelection"
        >
          <!-- 表节点 -->
          <div
            v-for="(table, index) in canvasTables"
            :key="table.name"
            class="table-node"
            :class="{ selected: selectedNode === table.name }"
            :style="{ 
              left: table.x + 'px', 
              top: table.y + 'px',
              transform: `scale(${zoomLevel})`
            }"
            @click.stop="selectNode(table.name)"
            @mousedown="startDrag($event, table)"
          >
            <div class="node-header">
              <el-icon><Grid /></el-icon>
              <span class="node-title">{{ table.name }}</span>
              <el-button
                type="danger"
                size="small"
                circle
                @click.stop="removeTableFromCanvas(table.name)"
              >
                <el-icon><Close /></el-icon>
              </el-button>
            </div>
            <div class="node-fields">
              <div
                v-for="field in getTableFields(table.name)"
                :key="field.name"
                class="field-item"
                :class="{ 
                  primary: field.isPrimary,
                  foreign: isFieldInRelation(table.name, field.name)
                }"
                @click.stop="selectField(table.name, field.name)"
              >
                <el-icon v-if="field.isPrimary"><Key /></el-icon>
                <el-icon v-else-if="isFieldInRelation(table.name, field.name)"><Link /></el-icon>
                <span class="field-name">{{ field.name }}</span>
                <span class="field-type">{{ field.dataType }}</span>
              </div>
            </div>
          </div>

          <!-- 关联线 -->
          <svg class="relations-svg" :style="{ transform: `scale(${zoomLevel})` }">
            <defs>
              <marker
                id="arrowhead"
                markerWidth="10"
                markerHeight="7"
                refX="9"
                refY="3.5"
                orient="auto"
              >
                <polygon points="0 0, 10 3.5, 0 7" fill="#409eff" />
              </marker>
            </defs>
            <line
              v-for="(relation, index) in relations"
              :key="index"
              :x1="getFieldPosition(relation.leftTable, relation.leftField).x"
              :y1="getFieldPosition(relation.leftTable, relation.leftField).y"
              :x2="getFieldPosition(relation.rightTable, relation.rightField).x"
              :y2="getFieldPosition(relation.rightTable, relation.rightField).y"
              stroke="#409eff"
              stroke-width="2"
              marker-end="url(#arrowhead)"
              @click="selectRelation(index)"
            />
          </svg>

          <!-- 临时连接线 -->
          <svg v-if="connecting" class="temp-line-svg">
            <line
              :x1="tempLine.startX"
              :y1="tempLine.startY"
              :x2="tempLine.endX"
              :y2="tempLine.endY"
              stroke="#67c23a"
              stroke-width="2"
              stroke-dasharray="5,5"
            />
          </svg>
        </div>
      </div>

      <!-- 右侧关联配置面板 -->
      <div class="config-panel">
        <div class="panel-header">
          <h4>关联配置</h4>
        </div>
        
        <div class="config-content">
          <!-- 快速关联 -->
          <div class="quick-relation">
            <h5>快速关联</h5>
            <el-form size="small">
              <el-form-item label="左表">
                <el-select v-model="quickRelation.leftTable" placeholder="选择表">
                  <el-option
                    v-for="table in selectedTables"
                    :key="table"
                    :label="table"
                    :value="table"
                  />
                </el-select>
              </el-form-item>
              <el-form-item label="左字段">
                <el-select v-model="quickRelation.leftField" placeholder="选择字段">
                  <el-option
                    v-for="field in getTableFields(quickRelation.leftTable)"
                    :key="field.name"
                    :label="field.name"
                    :value="field.name"
                  />
                </el-select>
              </el-form-item>
              <el-form-item label="关联类型">
                <el-select v-model="quickRelation.joinType">
                  <el-option label="INNER JOIN" value="INNER" />
                  <el-option label="LEFT JOIN" value="LEFT" />
                  <el-option label="RIGHT JOIN" value="RIGHT" />
                  <el-option label="FULL JOIN" value="FULL" />
                </el-select>
              </el-form-item>
              <el-form-item label="右表">
                <el-select v-model="quickRelation.rightTable" placeholder="选择表">
                  <el-option
                    v-for="table in selectedTables"
                    :key="table"
                    :label="table"
                    :value="table"
                  />
                </el-select>
              </el-form-item>
              <el-form-item label="右字段">
                <el-select v-model="quickRelation.rightField" placeholder="选择字段">
                  <el-option
                    v-for="field in getTableFields(quickRelation.rightTable)"
                    :key="field.name"
                    :label="field.name"
                    :value="field.name"
                  />
                </el-select>
              </el-form-item>
              <el-form-item>
                <el-button type="primary" @click="addQuickRelation" size="small">
                  添加关联
                </el-button>
              </el-form-item>
            </el-form>
          </div>

          <!-- 关联列表 -->
          <div class="relations-list">
            <h5>已配置关联</h5>
            <div
              v-for="(relation, index) in relations"
              :key="index"
              class="relation-item"
              :class="{ selected: selectedRelation === index }"
              @click="selectedRelation = index"
            >
              <div class="relation-info">
                <div class="relation-text">
                  {{ relation.leftTable }}.{{ relation.leftField }}
                  <el-tag size="small" :type="getJoinTypeColor(relation.joinType)">
                    {{ relation.joinType }}
                  </el-tag>
                  {{ relation.rightTable }}.{{ relation.rightField }}
                </div>
              </div>
              <el-button
                type="danger"
                size="small"
                circle
                @click.stop="removeRelation(index)"
              >
                <el-icon><Delete /></el-icon>
              </el-button>
            </div>
          </div>

          <!-- 智能推荐 -->
          <div class="smart-suggestions">
            <h5>智能推荐</h5>
            <div
              v-for="suggestion in smartSuggestions"
              :key="`${suggestion.leftTable}-${suggestion.rightTable}`"
              class="suggestion-item"
            >
              <div class="suggestion-text">
                {{ suggestion.leftTable }}.{{ suggestion.leftField }} → 
                {{ suggestion.rightTable }}.{{ suggestion.rightField }}
              </div>
              <el-button
                type="primary"
                size="small"
                @click="applySuggestion(suggestion)"
              >
                应用
              </el-button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 智能关联建议对话框 -->
    <el-dialog 
      v-model="showSuggestionDialog" 
      title="智能关联建议" 
      width="600px"
      :close-on-click-modal="false"
    >
      <div class="suggestion-dialog">
        <div class="dialog-header">
          <el-alert
            title="系统检测到以下可能的表关联关系，请确认是否应用："
            type="info"
            :closable="false"
            show-icon
          />
        </div>
        
        <div class="suggestions-list">
          <div
            v-for="(suggestion, index) in pendingSuggestions"
            :key="index"
            class="suggestion-card"
            :class="{ selected: suggestion.selected }"
          >
            <div class="suggestion-header">
              <el-checkbox 
                v-model="suggestion.selected"
                @change="updateSuggestionSelection(index, $event)"
              />
              <div class="suggestion-info">
                <div class="suggestion-title">
                  {{ suggestion.leftTable }} ⟷ {{ suggestion.rightTable }}
                </div>
                <div class="suggestion-detail">
                  {{ suggestion.leftField }} → {{ suggestion.rightField }}
                </div>
                <div class="suggestion-confidence">
                  <el-tag :type="getConfidenceType(suggestion.confidence)" size="small">
                    {{ getConfidenceText(suggestion.confidence) }}
                  </el-tag>
                  <span class="confidence-reason">{{ suggestion.reason }}</span>
                </div>
              </div>
            </div>
            
            <div class="suggestion-config">
              <el-form size="small" :inline="true">
                <el-form-item label="关联类型">
                  <el-select v-model="suggestion.joinType" style="width: 120px;">
                    <el-option label="INNER" value="INNER" />
                    <el-option label="LEFT" value="LEFT" />
                    <el-option label="RIGHT" value="RIGHT" />
                    <el-option label="FULL" value="FULL" />
                  </el-select>
                </el-form-item>
              </el-form>
            </div>
          </div>
        </div>
      </div>
      
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="cancelSuggestions">取消</el-button>
          <el-button @click="selectAllSuggestions">全选</el-button>
          <el-button @click="clearAllSuggestions">清空</el-button>
          <el-button type="primary" @click="applySuggestions">
            应用选中的关联 ({{ selectedSuggestionsCount }})
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Grid, Close, Plus, Key, Link, Delete } from '@element-plus/icons-vue'
import type { TableInfo, FieldInfo, TableRelation } from '@/shared/types/dataManagement'

// 智能关联建议接口
interface SmartSuggestion extends TableRelation {
  confidence: 'high' | 'medium' | 'low'
  reason: string
  selected: boolean
}

// Props
interface Props {
  tables: string[]
  relations: TableRelation[]
  availableTables: TableInfo[]
  tableFields: Record<string, FieldInfo[]>
}

const props = withDefaults(defineProps<Props>(), {
  tables: () => [],
  relations: () => [],
  availableTables: () => [],
  tableFields: () => ({})
})

// Emits
const emit = defineEmits<{
  'update:tables': [tables: string[]]
  'update:relations': [relations: TableRelation[]]
  'tables-change': [tables: string[]]
}>()

// 响应式数据
const searchKeyword = ref('')
const canvasRef = ref<HTMLElement>()
const selectedNode = ref<string>('')
const selectedRelation = ref<number>(-1)
const selectedField = ref<{ table: string, field: string } | null>(null)
const connecting = ref(false)
const zoomLevel = ref(1)
const draggedTable = ref<string>('')

// 智能建议相关
const showSuggestionDialog = ref(false)
const pendingSuggestions = ref<SmartSuggestion[]>([])

// 画布表格位置
const canvasTables = ref<Array<{ name: string, x: number, y: number }>>([])

// 临时连接线
const tempLine = reactive({
  startX: 0,
  startY: 0,
  endX: 0,
  endY: 0
})

// 快速关联表单
const quickRelation = reactive({
  leftTable: '',
  leftField: '',
  joinType: 'INNER' as 'INNER' | 'LEFT' | 'RIGHT' | 'FULL',
  rightTable: '',
  rightField: ''
})

// 计算属性
const selectedTables = computed({
  get: () => props.tables,
  set: (value) => emit('update:tables', value)
})

const relations = computed({
  get: () => props.relations,
  set: (value) => emit('update:relations', value)
})

const filteredTables = computed(() => {
  if (!searchKeyword.value) return props.availableTables
  return props.availableTables.filter(table =>
    table.name.toLowerCase().includes(searchKeyword.value.toLowerCase()) ||
    (table.description && table.description.toLowerCase().includes(searchKeyword.value.toLowerCase()))
  )
})

const smartSuggestions = computed(() => {
  return generateSmartSuggestions()
})

const selectedSuggestionsCount = computed(() => {
  return pendingSuggestions.value.filter(s => s.selected).length
})

// 智能关联建议生成
const generateSmartSuggestions = (): TableRelation[] => {
  const suggestions: TableRelation[] = []
  const tables = selectedTables.value
  
  for (let i = 0; i < tables.length; i++) {
    for (let j = i + 1; j < tables.length; j++) {
      const table1 = tables[i]
      const table2 = tables[j]
      
      // 使用新的智能检测算法
      const smartSuggestions = detectSmartRelations(table1, table2)
      // 转换为简单的TableRelation格式
      const simpleRelations = smartSuggestions.map(s => ({
        leftTable: s.leftTable,
        leftField: s.leftField,
        rightTable: s.rightTable,
        rightField: s.rightField,
        joinType: s.joinType
      }))
      suggestions.push(...simpleRelations)
    }
  }
  
  return suggestions.filter(suggestion => 
    !relations.value.some(relation =>
      relation.leftTable === suggestion.leftTable &&
      relation.leftField === suggestion.leftField &&
      relation.rightTable === suggestion.rightTable &&
      relation.rightField === suggestion.rightField
    )
  )
}

// 智能关联检测算法 - 增强版
const detectSmartRelations = (table1: string, table2: string): SmartSuggestion[] => {
  const fields1 = getTableFields(table1)
  const fields2 = getTableFields(table2)
  const suggestions: SmartSuggestion[] = []
  
  // 1. 主键-外键关联检测（最高优先级）
  const primaryKeys1 = fields1.filter(f => f.isPrimary)
  const primaryKeys2 = fields2.filter(f => f.isPrimary)
  
  // 检查主键与外键的关联
  primaryKeys1.forEach(pk => {
    // 查找可能的外键：表名_id 或 表名Id 或 直接同名
    const possibleForeignKeys = fields2.filter(f => 
      f.name.toLowerCase() === pk.name.toLowerCase() ||
      f.name.toLowerCase() === `${table1.toLowerCase()}_id` ||
      f.name.toLowerCase() === `${table1.toLowerCase()}id` ||
      f.name.toLowerCase().includes(table1.toLowerCase()) && f.name.toLowerCase().includes('id')
    )
    
    possibleForeignKeys.forEach(fk => {
      suggestions.push({
        leftTable: table1,
        leftField: pk.name,
        rightTable: table2,
        rightField: fk.name,
        joinType: 'INNER',
        confidence: 'high',
        reason: `主键 ${pk.name} 与外键 ${fk.name} 的关联`,
        selected: true // 高置信度默认选中
      })
    })
  })
  
  primaryKeys2.forEach(pk => {
    const possibleForeignKeys = fields1.filter(f => 
      f.name.toLowerCase() === pk.name.toLowerCase() ||
      f.name.toLowerCase() === `${table2.toLowerCase()}_id` ||
      f.name.toLowerCase() === `${table2.toLowerCase()}id` ||
      f.name.toLowerCase().includes(table2.toLowerCase()) && f.name.toLowerCase().includes('id')
    )
    
    possibleForeignKeys.forEach(fk => {
      // 避免重复添加
      const exists = suggestions.some(s => 
        (s.leftTable === table2 && s.leftField === pk.name && 
         s.rightTable === table1 && s.rightField === fk.name) ||
        (s.leftTable === table1 && s.leftField === fk.name && 
         s.rightTable === table2 && s.rightField === pk.name)
      )
      
      if (!exists) {
        suggestions.push({
          leftTable: table2,
          leftField: pk.name,
          rightTable: table1,
          rightField: fk.name,
          joinType: 'INNER',
          confidence: 'high',
          reason: `主键 ${pk.name} 与外键 ${fk.name} 的关联`,
          selected: true
        })
      }
    })
  })
  
  // 2. 同名ID字段关联（中等优先级）
  const idFields1 = fields1.filter(f => f.name.toLowerCase().includes('id'))
  const idFields2 = fields2.filter(f => f.name.toLowerCase().includes('id'))
  
  idFields1.forEach(f1 => {
    idFields2.forEach(f2 => {
      if (f1.name.toLowerCase() === f2.name.toLowerCase()) {
        const exists = suggestions.some(s => 
          (s.leftTable === table1 && s.leftField === f1.name && 
           s.rightTable === table2 && s.rightField === f2.name) ||
          (s.leftTable === table2 && s.leftField === f2.name && 
           s.rightTable === table1 && s.rightField === f1.name)
        )
        
        if (!exists) {
          suggestions.push({
            leftTable: table1,
            leftField: f1.name,
            rightTable: table2,
            rightField: f2.name,
            joinType: 'INNER',
            confidence: 'medium',
            reason: `同名ID字段 ${f1.name} 的关联`,
            selected: false
          })
        }
      }
    })
  })
  
  // 3. 语义化字段关联（低优先级）
  const semanticPatterns = [
    { pattern: /patient.*id/i, description: '患者ID' },
    { pattern: /user.*id/i, description: '用户ID' },
    { pattern: /doctor.*id/i, description: '医生ID' },
    { pattern: /department.*id/i, description: '科室ID' },
    { pattern: /visit.*id/i, description: '就诊ID' },
    { pattern: /order.*id/i, description: '订单ID' },
    { pattern: /.*_id$/i, description: '外键ID' }
  ]
  
  semanticPatterns.forEach(pattern => {
    const matchingFields1 = fields1.filter(f => pattern.pattern.test(f.name))
    const matchingFields2 = fields2.filter(f => pattern.pattern.test(f.name))
    
    matchingFields1.forEach(f1 => {
      matchingFields2.forEach(f2 => {
        if (f1.name.toLowerCase() === f2.name.toLowerCase()) {
          const exists = suggestions.some(s => 
            (s.leftTable === table1 && s.leftField === f1.name && 
             s.rightTable === table2 && s.rightField === f2.name) ||
            (s.leftTable === table2 && s.leftField === f2.name && 
             s.rightTable === table1 && s.rightField === f1.name)
          )
          
          if (!exists) {
            suggestions.push({
              leftTable: table1,
              leftField: f1.name,
              rightTable: table2,
              rightField: f2.name,
              joinType: 'INNER',
              confidence: 'low',
              reason: `${pattern.description}字段的语义关联`,
              selected: false
            })
          }
        }
      })
    })
  })
  
  return suggestions
}

// 自动应用高置信度关联
const autoApplyHighConfidenceRelations = (suggestions: SmartSuggestion[]) => {
  const highConfidenceSuggestions = suggestions.filter(s => s.confidence === 'high')
  
  if (highConfidenceSuggestions.length > 0) {
    highConfidenceSuggestions.forEach(suggestion => {
      addRelation({
        leftTable: suggestion.leftTable,
        leftField: suggestion.leftField,
        rightTable: suggestion.rightTable,
        rightField: suggestion.rightField,
        joinType: suggestion.joinType
      })
    })
    
    ElMessage.success(`自动应用了 ${highConfidenceSuggestions.length} 个高置信度关联`)
    
    // 显示剩余的中低置信度建议
    const remainingSuggestions = suggestions.filter(s => s.confidence !== 'high')
    if (remainingSuggestions.length > 0) {
      pendingSuggestions.value = remainingSuggestions
      showSuggestionDialog.value = true
    }
  } else {
    // 没有高置信度关联，显示所有建议
    pendingSuggestions.value = suggestions
    showSuggestionDialog.value = true
  }
}

// 修改showSmartSuggestions方法
const showSmartSuggestions = (newTableName: string) => {
  const allSuggestions: SmartSuggestion[] = []
  
  // 与画布上每个现有表进行关联检测
  canvasTables.value.forEach(existingTable => {
    if (existingTable.name !== newTableName) {
      const suggestions = detectSmartRelations(existingTable.name, newTableName)
      allSuggestions.push(...suggestions)
    }
  })
  
  // 按置信度排序，高置信度在前
  const sortedSuggestions = allSuggestions.sort((a, b) => {
    const confidenceOrder = { high: 3, medium: 2, low: 1 }
    return confidenceOrder[b.confidence] - confidenceOrder[a.confidence]
  })
  
  if (sortedSuggestions.length > 0) {
    // 检查是否有高置信度关联
    const hasHighConfidence = sortedSuggestions.some(s => s.confidence === 'high')
    
    if (hasHighConfidence) {
      // 询问用户是否自动应用高置信度关联
      ElMessageBox.confirm(
        `检测到 ${sortedSuggestions.filter(s => s.confidence === 'high').length} 个高置信度关联关系，是否自动应用？`,
        '智能关联检测',
        {
          confirmButtonText: '自动应用',
          cancelButtonText: '手动选择',
          type: 'info'
        }
      ).then(() => {
        autoApplyHighConfidenceRelations(sortedSuggestions)
      }).catch(() => {
        // 用户选择手动，显示所有建议
        pendingSuggestions.value = sortedSuggestions
        showSuggestionDialog.value = true
      })
    } else {
      // 没有高置信度关联，直接显示建议
      pendingSuggestions.value = sortedSuggestions
      showSuggestionDialog.value = true
    }
  }
}

// 添加自动连线功能
const drawAutoConnections = () => {
  nextTick(() => {
    // 重新绘制所有连接线
    updateConnections()
  })
}

// 更新连接线绘制
const updateConnections = () => {
  // 这里应该更新连接线的视觉表示，而不是修改relations数据
  nextTick(() => {
    // 触发重新渲染连接线
    drawConnections()
  })
}

// 绘制连接线
const drawConnections = () => {
  // 这个方法用于在SVG中绘制连接线
  // 实际的连接线绘制在模板中通过computed属性connections实现
}

// 计算连接线位置
const connections = computed(() => {
  return relations.value.map(relation => {
    const leftPos = getFieldPosition(relation.leftTable, relation.leftField)
    const rightPos = getFieldPosition(relation.rightTable, relation.rightField)
    
    return {
      x1: leftPos.x,
      y1: leftPos.y,
      x2: rightPos.x,
      y2: rightPos.y,
      relation
    }
  })
})

// 监听表格位置变化，自动更新连接线
watch([canvasTables, relations], () => {
  updateConnections()
}, { deep: true })

// 方法定义
const toggleTable = (tableName: string) => {
  if (selectedTables.value.includes(tableName)) {
    removeTable(tableName)
  } else {
    addTable(tableName)
  }
}

const addTable = (tableName: string) => {
  if (!selectedTables.value.includes(tableName)) {
    const newTables = [...selectedTables.value, tableName]
    selectedTables.value = newTables
    emit('tables-change', newTables)
    
    // 添加到画布
    addTableToCanvas(tableName)
    
    // 如果画布上已有其他表，显示智能关联建议
    if (canvasTables.value.length > 1) {
      showSmartSuggestions(tableName)
    }
  }
}

const removeTable = (tableName: string) => {
  const newTables = selectedTables.value.filter(t => t !== tableName)
  selectedTables.value = newTables
  emit('tables-change', newTables)
  
  // 从画布移除
  removeTableFromCanvas(tableName)
  
  // 移除相关的关联关系
  const newRelations = relations.value.filter(r => 
    r.leftTable !== tableName && r.rightTable !== tableName
  )
  relations.value = newRelations
}

const addTableToCanvas = (tableName: string) => {
  const canvas = canvasRef.value
  if (!canvas) return
  
  const rect = canvas.getBoundingClientRect()
  
  // 智能布局：如果是第一个表，放在中心偏左；后续表格按网格排列
  let x, y
  if (canvasTables.value.length === 0) {
    x = 100
    y = 100
  } else {
    const cols = Math.ceil(Math.sqrt(canvasTables.value.length + 1))
    const row = Math.floor(canvasTables.value.length / cols)
    const col = canvasTables.value.length % cols
    x = col * 280 + 50
    y = row * 250 + 50
  }
  
  canvasTables.value.push({ name: tableName, x, y })
}

const removeTableFromCanvas = (tableName: string) => {
  canvasTables.value = canvasTables.value.filter(t => t.name !== tableName)
  removeTable(tableName)
}

const getTableFields = (tableName: string): FieldInfo[] => {
  return props.tableFields[tableName] || []
}

const isFieldInRelation = (tableName: string, fieldName: string): boolean => {
  return relations.value.some(r =>
    (r.leftTable === tableName && r.leftField === fieldName) ||
    (r.rightTable === tableName && r.rightField === fieldName)
  )
}

const selectNode = (tableName: string) => {
  selectedNode.value = tableName
}

const selectField = (tableName: string, fieldName: string) => {
  if (!connecting.value) {
    // 开始连接
    connecting.value = true
    selectedField.value = { table: tableName, field: fieldName }
    
    const pos = getFieldPosition(tableName, fieldName)
    tempLine.startX = pos.x
    tempLine.startY = pos.y
    tempLine.endX = pos.x
    tempLine.endY = pos.y
    
    // 监听鼠标移动
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('click', handleCanvasClick)
  } else {
    // 完成连接
    if (selectedField.value && 
        (selectedField.value.table !== tableName || selectedField.value.field !== fieldName)) {
      addRelation({
        leftTable: selectedField.value.table,
        leftField: selectedField.value.field,
        rightTable: tableName,
        rightField: fieldName,
        joinType: 'INNER'
      })
    }
    
    // 重置连接状态
    resetConnection()
  }
}

const handleMouseMove = (event: MouseEvent) => {
  if (connecting.value && canvasRef.value) {
    const rect = canvasRef.value.getBoundingClientRect()
    tempLine.endX = event.clientX - rect.left
    tempLine.endY = event.clientY - rect.top
  }
}

const handleCanvasClick = () => {
  resetConnection()
}

const resetConnection = () => {
  connecting.value = false
  selectedField.value = null
  document.removeEventListener('mousemove', handleMouseMove)
  document.removeEventListener('click', handleCanvasClick)
}

const getFieldPosition = (tableName: string, fieldName: string) => {
  const table = canvasTables.value.find(t => t.name === tableName)
  if (!table) return { x: 0, y: 0 }
  
  const fields = getTableFields(tableName)
  const fieldIndex = fields.findIndex(f => f.name === fieldName)
  
  return {
    x: table.x + 200, // 表格右边缘
    y: table.y + 40 + fieldIndex * 24 + 12 // 字段中心位置
  }
}

const addRelation = (relation: TableRelation) => {
  const newRelations = [...relations.value, relation]
  relations.value = newRelations
  ElMessage.success(`已添加关联：${relation.leftTable}.${relation.leftField} → ${relation.rightTable}.${relation.rightField}`)
}

const removeRelation = (index: number) => {
  const newRelations = relations.value.filter((_, i) => i !== index)
  relations.value = newRelations
}

const addQuickRelation = () => {
  if (!quickRelation.leftTable || !quickRelation.leftField ||
      !quickRelation.rightTable || !quickRelation.rightField) {
    ElMessage.warning('请完整填写关联信息')
    return
  }
  
  addRelation({
    leftTable: quickRelation.leftTable,
    leftField: quickRelation.leftField,
    rightTable: quickRelation.rightTable,
    rightField: quickRelation.rightField,
    joinType: quickRelation.joinType
  })
  
  // 重置表单
  Object.assign(quickRelation, {
    leftTable: '',
    leftField: '',
    joinType: 'INNER',
    rightTable: '',
    rightField: ''
  })
}

const applySuggestion = (suggestion: TableRelation) => {
  addRelation(suggestion)
}

// 智能建议对话框方法
const updateSuggestionSelection = (index: number, selected: boolean) => {
  pendingSuggestions.value[index].selected = selected
}

const selectAllSuggestions = () => {
  pendingSuggestions.value.forEach(s => s.selected = true)
}

const clearAllSuggestions = () => {
  pendingSuggestions.value.forEach(s => s.selected = false)
}

const applySuggestions = () => {
  const selectedSuggestions = pendingSuggestions.value.filter(s => s.selected)
  
  selectedSuggestions.forEach(suggestion => {
    addRelation({
      leftTable: suggestion.leftTable,
      leftField: suggestion.leftField,
      rightTable: suggestion.rightTable,
      rightField: suggestion.rightField,
      joinType: suggestion.joinType
    })
  })
  
  showSuggestionDialog.value = false
  pendingSuggestions.value = []
  
  if (selectedSuggestions.length > 0) {
    ElMessage.success(`已应用 ${selectedSuggestions.length} 个关联关系`)
  }
}

const cancelSuggestions = () => {
  showSuggestionDialog.value = false
  pendingSuggestions.value = []
}

const getConfidenceType = (confidence: string) => {
  switch (confidence) {
    case 'high': return 'success'
    case 'medium': return 'warning'
    case 'low': return 'info'
    default: return 'info'
  }
}

const getConfidenceText = (confidence: string) => {
  switch (confidence) {
    case 'high': return '高置信度'
    case 'medium': return '中等置信度'
    case 'low': return '低置信度'
    default: return '未知'
  }
}

const getJoinTypeColor = (joinType: string) => {
  switch (joinType) {
    case 'INNER': return 'success'
    case 'LEFT': return 'warning'
    case 'RIGHT': return 'info'
    case 'FULL': return 'danger'
    default: return 'info'
  }
}

const autoLayout = () => {
  const tables = canvasTables.value
  const cols = Math.ceil(Math.sqrt(tables.length))
  const spacing = 250
  
  tables.forEach((table, index) => {
    const row = Math.floor(index / cols)
    const col = index % cols
    table.x = col * spacing + 50
    table.y = row * spacing + 50
  })
}

const clearCanvas = () => {
  canvasTables.value = []
  selectedTables.value = []
  relations.value = []
  emit('tables-change', [])
}

const clearSelection = () => {
  selectedNode.value = ''
  selectedRelation.value = -1
}

const zoomIn = () => {
  zoomLevel.value = Math.min(zoomLevel.value + 0.1, 2)
}

const zoomOut = () => {
  zoomLevel.value = Math.max(zoomLevel.value - 0.1, 0.5)
}

// 拖拽相关
const handleDragStart = (event: DragEvent, table: TableInfo) => {
  draggedTable.value = table.name
  if (event.dataTransfer) {
    event.dataTransfer.setData('text/plain', table.name)
  }
}

const handleDragOver = (event: DragEvent) => {
  event.preventDefault()
}

const handleDrop = (event: DragEvent) => {
  event.preventDefault()
  const tableName = event.dataTransfer?.getData('text/plain')
  if (tableName && !selectedTables.value.includes(tableName)) {
    const rect = canvasRef.value?.getBoundingClientRect()
    if (rect) {
      const x = event.clientX - rect.left - 100
      const y = event.clientY - rect.top - 50
      
      addTable(tableName)
      
      // 更新位置
      nextTick(() => {
        const tableNode = canvasTables.value.find(t => t.name === tableName)
        if (tableNode) {
          tableNode.x = x
          tableNode.y = y
        }
      })
    }
  }
}

const startDrag = (event: MouseEvent, table: { name: string, x: number, y: number }) => {
  const startX = event.clientX - table.x
  const startY = event.clientY - table.y
  
  const handleMouseMove = (e: MouseEvent) => {
    table.x = e.clientX - startX
    table.y = e.clientY - startY
  }
  
  const handleMouseUp = () => {
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', handleMouseUp)
  }
  
  document.addEventListener('mousemove', handleMouseMove)
  document.addEventListener('mouseup', handleMouseUp)
}

const selectRelation = (index: number) => {
  selectedRelation.value = index
}

// 监听选中表格变化
watch(() => props.tables, (newTables) => {
  // 同步画布表格
  const currentCanvasTables = canvasTables.value.map(t => t.name)
  
  // 添加新表格到画布
  newTables.forEach(tableName => {
    if (!currentCanvasTables.includes(tableName)) {
      addTableToCanvas(tableName)
    }
  })
  
  // 移除不再选中的表格
  canvasTables.value = canvasTables.value.filter(t => newTables.includes(t.name))
}, { immediate: true })

// 添加一个方法来手动触发智能关联检测
const triggerSmartDetection = () => {
  if (canvasTables.value.length >= 2) {
    const allSuggestions: SmartSuggestion[] = []
    
    // 检测所有表之间的关联
    for (let i = 0; i < canvasTables.value.length; i++) {
      for (let j = i + 1; j < canvasTables.value.length; j++) {
        const suggestions = detectSmartRelations(
          canvasTables.value[i].name, 
          canvasTables.value[j].name
        )
        allSuggestions.push(...suggestions)
      }
    }
    
    if (allSuggestions.length > 0) {
      pendingSuggestions.value = allSuggestions
      showSuggestionDialog.value = true
    } else {
      ElMessage.info('未检测到可能的关联关系')
    }
  } else {
    ElMessage.warning('至少需要两个表才能进行关联检测')
  }
}
</script>

<style scoped>
.multi-table-designer {
  height: 100%;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  overflow: hidden;
}

.designer-layout {
  display: flex;
  height: 100%;
}

.tables-panel {
  width: 240px;
  border-right: 1px solid #e4e7ed;
  background: #fafafa;
  display: flex;
  flex-direction: column;
}

.canvas-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: white;
}

.config-panel {
  width: 260px;
  border-left: 1px solid #e4e7ed;
  background: #fafafa;
  display: flex;
  flex-direction: column;
}

.panel-header {
  padding: 16px;
  border-bottom: 1px solid #e4e7ed;
  background: white;
}

.panel-header h4 {
  margin: 0 0 12px 0;
  color: #303133;
}

.canvas-actions {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}

.tables-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.table-item {
  display: flex;
  align-items: center;
  padding: 12px;
  margin-bottom: 8px;
  background: white;
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s;
}

.table-item:hover {
  border-color: #409eff;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.2);
}

.table-item.selected {
  border-color: #409eff;
  background: #ecf5ff;
}

.table-icon {
  margin-right: 12px;
  color: #409eff;
}

.table-info {
  flex: 1;
}

.table-name {
  font-weight: 500;
  color: #303133;
  margin-bottom: 4px;
}

.table-desc {
  font-size: 12px;
  color: #909399;
  margin-bottom: 2px;
}

.table-count {
  font-size: 11px;
  color: #c0c4cc;
}

.relation-canvas {
  flex: 1;
  position: relative;
  overflow: hidden;
  background: #f8f9fa;
  background-image: 
    radial-gradient(circle, #ddd 1px, transparent 1px);
  background-size: 20px 20px;
}

.table-node {
  position: absolute;
  width: 200px;
  background: white;
  border: 2px solid #e4e7ed;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  cursor: move;
  transition: all 0.3s;
}

.table-node:hover {
  border-color: #409eff;
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.3);
}

.table-node.selected {
  border-color: #409eff;
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.4);
}

.node-header {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  background: #409eff;
  color: white;
  border-radius: 6px 6px 0 0;
}

.node-title {
  flex: 1;
  font-weight: 500;
  margin-left: 8px;
}

.node-fields {
  max-height: 200px;
  overflow-y: auto;
}

.field-item {
  display: flex;
  align-items: center;
  padding: 6px 12px;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  transition: background-color 0.3s;
}

.field-item:hover {
  background: #f5f7fa;
}

.field-item.primary {
  background: #fff7e6;
  color: #e6a23c;
}

.field-item.foreign {
  background: #f0f9ff;
  color: #409eff;
}

.field-name {
  flex: 1;
  margin-left: 8px;
  font-size: 13px;
}

.field-type {
  font-size: 11px;
  color: #909399;
}

.relations-svg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.relations-svg line {
  pointer-events: stroke;
  cursor: pointer;
}

.temp-line-svg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.config-content {
  flex: 1;
  padding: 16px;
  overflow-y: auto;
}

.quick-relation,
.relations-list,
.smart-suggestions {
  margin-bottom: 24px;
}

.quick-relation h5,
.relations-list h5,
.smart-suggestions h5 {
  margin: 0 0 12px 0;
  color: #303133;
  font-size: 14px;
}

.relation-item {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  margin-bottom: 8px;
  background: white;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  cursor: pointer;
}

.relation-item:hover {
  border-color: #409eff;
}

.relation-item.selected {
  border-color: #409eff;
  background: #ecf5ff;
}

.relation-info {
  flex: 1;
}

.relation-text {
  font-size: 12px;
  color: #606266;
  display: flex;
  align-items: center;
  gap: 8px;
}

.suggestion-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  margin-bottom: 8px;
  background: white;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
}

.suggestion-text {
  font-size: 12px;
  color: #606266;
}

/* 智能建议对话框样式 */
.suggestion-dialog {
  max-height: 500px;
  overflow-y: auto;
}

.dialog-header {
  margin-bottom: 16px;
}

.suggestions-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.suggestion-card {
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  padding: 16px;
  background: white;
  transition: all 0.3s;
}

.suggestion-card:hover {
  border-color: #409eff;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.2);
}

.suggestion-card.selected {
  border-color: #409eff;
  background: #ecf5ff;
}

.suggestion-header {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 12px;
}

.suggestion-info {
  flex: 1;
}

.suggestion-title {
  font-weight: 500;
  color: #303133;
  margin-bottom: 4px;
}

.suggestion-detail {
  font-size: 14px;
  color: #606266;
  margin-bottom: 8px;
  font-family: 'Courier New', monospace;
}

.suggestion-confidence {
  display: flex;
  align-items: center;
  gap: 8px;
}

.confidence-reason {
  font-size: 12px;
  color: #909399;
}

.suggestion-config {
  padding-left: 32px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
</style> 