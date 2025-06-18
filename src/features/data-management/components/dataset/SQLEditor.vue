<template>
  <div class="sql-editor">
    <div class="editor-header">
      <div class="header-left">
        <h4>SQL查询编辑器</h4>
        <el-tag v-if="validationResult" :type="validationResult.valid ? 'success' : 'danger'" size="small">
          {{ validationResult.valid ? '语法正确' : '语法错误' }}
        </el-tag>
      </div>
      <div class="header-right">
        <el-button size="small" @click="formatSQL">格式化</el-button>
        <el-button size="small" @click="validateSQL" :loading="validating">验证</el-button>
        <el-button size="small" @click="executeSQL" :loading="executing">执行</el-button>
        <el-button size="small" @click="showTemplates = true">模板</el-button>
      </div>
    </div>

    <div class="editor-content">
      <div class="editor-main">
        <!-- CodeMirror编辑器容器 -->
        <div ref="editorRef" class="codemirror-container"></div>
        
        <!-- 错误提示 -->
        <div v-if="validationResult && !validationResult.valid" class="error-message">
          <el-alert
            :title="validationResult.error"
            type="error"
            :closable="false"
            show-icon
          />
        </div>
      </div>

      <!-- 侧边栏：表结构和函数帮助 -->
      <div class="editor-sidebar">
        <el-tabs v-model="sidebarTab" type="border-card">
          <el-tab-pane label="表结构" name="tables">
            <div class="tables-panel">
              <el-input
                v-model="tableSearchKeyword"
                placeholder="搜索表名"
                size="small"
                prefix-icon="Search"
                clearable
              />
              
              <div class="tables-list">
                <div
                  v-for="table in filteredTables"
                  :key="table.name"
                  class="table-item"
                  @click="insertTableName(table.name)"
                >
                  <div class="table-header">
                    <el-icon><Grid /></el-icon>
                    <span class="table-name">{{ table.name }}</span>
                    <el-button
                      size="small"
                      text
                      @click.stop="toggleTableFields(table.name)"
                    >
                      <el-icon><ArrowDown v-if="expandedTables.includes(table.name)" /><ArrowRight v-else /></el-icon>
                    </el-button>
                  </div>
                  
                  <div v-if="expandedTables.includes(table.name)" class="table-fields">
                    <div
                      v-for="field in getTableFields(table.name)"
                      :key="field.name"
                      class="field-item"
                      @click.stop="insertFieldName(table.name, field.name)"
                    >
                      <el-icon v-if="field.isPrimary"><Key /></el-icon>
                      <el-icon v-else><Document /></el-icon>
                      <span class="field-name">{{ field.name }}</span>
                      <span class="field-type">{{ field.dataType }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </el-tab-pane>
          
          <el-tab-pane label="SQL函数" name="functions">
            <div class="functions-panel">
              <el-collapse v-model="activeFunctionGroups">
                <el-collapse-item
                  v-for="group in sqlFunctions"
                  :key="group.name"
                  :title="group.name"
                  :name="group.name"
                >
                  <div
                    v-for="func in group.functions"
                    :key="func.name"
                    class="function-item"
                    @click="insertFunction(func)"
                  >
                    <div class="function-name">{{ func.name }}</div>
                    <div class="function-desc">{{ func.description }}</div>
                    <div class="function-syntax">{{ func.syntax }}</div>
                  </div>
                </el-collapse-item>
              </el-collapse>
            </div>
          </el-tab-pane>
          
          <el-tab-pane label="查询历史" name="history">
            <div class="history-panel">
              <div
                v-for="(query, index) in queryHistory"
                :key="index"
                class="history-item"
                @click="loadHistoryQuery(query)"
              >
                <div class="history-time">{{ formatTime(query.timestamp) }}</div>
                <div class="history-sql">{{ query.sql.substring(0, 100) }}...</div>
              </div>
            </div>
          </el-tab-pane>
        </el-tabs>
      </div>
    </div>

    <!-- SQL模板对话框 -->
    <el-dialog v-model="showTemplates" title="SQL模板" width="800px">
      <div class="templates-grid">
        <div
          v-for="template in sqlTemplates"
          :key="template.name"
          class="template-item"
          @click="useTemplate(template)"
        >
          <div class="template-name">{{ template.name }}</div>
          <div class="template-desc">{{ template.description }}</div>
          <pre class="template-sql">{{ template.sql }}</pre>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { Grid, Key, Document, ArrowDown, ArrowRight } from '@element-plus/icons-vue'
import { EditorView, basicSetup } from 'codemirror'
import { EditorState } from '@codemirror/state'
import { sql } from '@codemirror/lang-sql'
import { oneDark } from '@codemirror/theme-one-dark'
import { dataSetApi, dataSourceApi } from '@/api/dataSource'
import type { TableInfo, FieldInfo } from '@/shared/types/dataManagement'

// Props
interface Props {
  modelValue: string
  dataSourceId: number
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  dataSourceId: 0
})

// Emits
const emit = defineEmits<{
  'update:modelValue': [value: string]
  validate: [result: { valid: boolean, error?: string }]
}>()

// 响应式数据
const editorRef = ref<HTMLElement>()
const editorView = ref<EditorView>()
const validating = ref(false)
const executing = ref(false)
const validationResult = ref<{ valid: boolean, error?: string } | null>(null)
const sidebarTab = ref('tables')
const showTemplates = ref(false)
const tableSearchKeyword = ref('')
const expandedTables = ref<string[]>([])
const activeFunctionGroups = ref<string[]>(['聚合函数', '字符串函数'])

const tables = ref<TableInfo[]>([])
const tableFields = ref<Record<string, FieldInfo[]>>({})
const queryHistory = ref<Array<{ sql: string, timestamp: number }>>([])

// SQL函数定义
const sqlFunctions = [
  {
    name: '聚合函数',
    functions: [
      { name: 'COUNT', description: '计算行数', syntax: 'COUNT(column_name)' },
      { name: 'SUM', description: '求和', syntax: 'SUM(column_name)' },
      { name: 'AVG', description: '平均值', syntax: 'AVG(column_name)' },
      { name: 'MAX', description: '最大值', syntax: 'MAX(column_name)' },
      { name: 'MIN', description: '最小值', syntax: 'MIN(column_name)' }
    ]
  },
  {
    name: '字符串函数',
    functions: [
      { name: 'CONCAT', description: '字符串连接', syntax: 'CONCAT(str1, str2, ...)' },
      { name: 'SUBSTRING', description: '截取字符串', syntax: 'SUBSTRING(string, start, length)' },
      { name: 'UPPER', description: '转大写', syntax: 'UPPER(string)' },
      { name: 'LOWER', description: '转小写', syntax: 'LOWER(string)' },
      { name: 'TRIM', description: '去除空格', syntax: 'TRIM(string)' }
    ]
  },
  {
    name: '日期函数',
    functions: [
      { name: 'NOW', description: '当前时间', syntax: 'NOW()' },
      { name: 'DATE_FORMAT', description: '格式化日期', syntax: 'DATE_FORMAT(date, format)' },
      { name: 'YEAR', description: '获取年份', syntax: 'YEAR(date)' },
      { name: 'MONTH', description: '获取月份', syntax: 'MONTH(date)' },
      { name: 'DAY', description: '获取日期', syntax: 'DAY(date)' }
    ]
  },
  {
    name: '数学函数',
    functions: [
      { name: 'ROUND', description: '四舍五入', syntax: 'ROUND(number, decimals)' },
      { name: 'CEIL', description: '向上取整', syntax: 'CEIL(number)' },
      { name: 'FLOOR', description: '向下取整', syntax: 'FLOOR(number)' },
      { name: 'ABS', description: '绝对值', syntax: 'ABS(number)' },
      { name: 'POWER', description: '幂运算', syntax: 'POWER(base, exponent)' }
    ]
  }
]

// SQL模板
const sqlTemplates = [
  {
    name: '基础查询',
    description: '简单的SELECT查询',
    sql: `SELECT column1, column2
FROM table_name
WHERE condition
ORDER BY column1;`
  },
  {
    name: '聚合查询',
    description: '带GROUP BY的聚合查询',
    sql: `SELECT column1, COUNT(*) as count, SUM(column2) as total
FROM table_name
WHERE condition
GROUP BY column1
HAVING COUNT(*) > 1
ORDER BY count DESC;`
  },
  {
    name: '内连接',
    description: '两表内连接查询',
    sql: `SELECT t1.column1, t2.column2
FROM table1 t1
INNER JOIN table2 t2 ON t1.id = t2.table1_id
WHERE condition;`
  },
  {
    name: '左连接',
    description: '左外连接查询',
    sql: `SELECT t1.column1, t2.column2
FROM table1 t1
LEFT JOIN table2 t2 ON t1.id = t2.table1_id
WHERE condition;`
  },
  {
    name: '子查询',
    description: '带子查询的复杂查询',
    sql: `SELECT column1, column2
FROM table1
WHERE column1 IN (
    SELECT column1
    FROM table2
    WHERE condition
);`
  },
  {
    name: '窗口函数',
    description: '使用窗口函数的查询',
    sql: `SELECT 
    column1,
    column2,
    ROW_NUMBER() OVER (PARTITION BY column1 ORDER BY column2) as row_num,
    SUM(column3) OVER (PARTITION BY column1) as total
FROM table_name;`
  }
]

// 计算属性
const filteredTables = computed(() => {
  if (!tableSearchKeyword.value) return tables.value
  return tables.value.filter(table =>
    table.name.toLowerCase().includes(tableSearchKeyword.value.toLowerCase()) ||
    (table.description && table.description.toLowerCase().includes(tableSearchKeyword.value.toLowerCase()))
  )
})

// 方法定义
const initEditor = () => {
  if (!editorRef.value) return

  const state = EditorState.create({
    doc: props.modelValue,
    extensions: [
      basicSetup,
      sql(),
      oneDark,
      EditorView.updateListener.of((update) => {
        if (update.docChanged) {
          const newValue = update.state.doc.toString()
          emit('update:modelValue', newValue)
        }
      }),
      EditorView.theme({
        '&': {
          height: '400px'
        },
        '.cm-content': {
          padding: '16px',
          fontSize: '14px',
          lineHeight: '1.6'
        },
        '.cm-focused': {
          outline: 'none'
        }
      })
    ]
  })

  editorView.value = new EditorView({
    state,
    parent: editorRef.value
  })
}

const loadTables = async () => {
  if (!props.dataSourceId) return
  
  try {
    tables.value = await dataSourceApi.getTablesBySourceId(props.dataSourceId)
    
    // 预加载常用表的字段信息
    for (const table of tables.value.slice(0, 5)) {
      try {
        const fields = await dataSourceApi.getFieldsByTable(props.dataSourceId, table.name)
        tableFields.value[table.name] = fields
      } catch (error) {
        console.error(`加载表 ${table.name} 字段失败:`, error)
      }
    }
  } catch (error) {
    console.error('加载数据表失败:', error)
  }
}

const getTableFields = (tableName: string): FieldInfo[] => {
  return tableFields.value[tableName] || []
}

const loadTableFields = async (tableName: string) => {
  if (tableFields.value[tableName]) return
  
  try {
    const fields = await dataSourceApi.getFieldsByTable(props.dataSourceId, tableName)
    tableFields.value[tableName] = fields
  } catch (error) {
    console.error(`加载表 ${tableName} 字段失败:`, error)
  }
}

const toggleTableFields = async (tableName: string) => {
  if (expandedTables.value.includes(tableName)) {
    expandedTables.value = expandedTables.value.filter(t => t !== tableName)
  } else {
    expandedTables.value.push(tableName)
    await loadTableFields(tableName)
  }
}

const insertTableName = (tableName: string) => {
  insertText(tableName)
}

const insertFieldName = (tableName: string, fieldName: string) => {
  insertText(`${tableName}.${fieldName}`)
}

const insertFunction = (func: { name: string, syntax: string }) => {
  insertText(func.syntax)
}

const insertText = (text: string) => {
  if (!editorView.value) return
  
  const { state } = editorView.value
  const { from, to } = state.selection.main
  
  editorView.value.dispatch({
    changes: { from, to, insert: text },
    selection: { anchor: from + text.length }
  })
  
  editorView.value.focus()
}

const formatSQL = () => {
  if (!editorView.value) return
  
  const sql = editorView.value.state.doc.toString()
  
  // 简单的SQL格式化
  const formatted = sql
    .replace(/\s+/g, ' ')
    .replace(/\s*,\s*/g, ',\n  ')
    .replace(/\s+(SELECT|FROM|WHERE|GROUP BY|ORDER BY|HAVING|UNION|JOIN|INNER JOIN|LEFT JOIN|RIGHT JOIN|FULL JOIN)\s+/gi, '\n$1 ')
    .replace(/\s+(AND|OR)\s+/gi, '\n  $1 ')
    .trim()
  
  editorView.value.dispatch({
    changes: { from: 0, to: editorView.value.state.doc.length, insert: formatted }
  })
  
  ElMessage.success('SQL格式化完成')
}

const validateSQL = async () => {
  if (!props.dataSourceId) {
    ElMessage.warning('请先选择数据源')
    return
  }
  
  const sql = editorView.value?.state.doc.toString() || ''
  if (!sql.trim()) {
    ElMessage.warning('请输入SQL语句')
    return
  }
  
  validating.value = true
  try {
    const result = await dataSetApi.validateSQL(props.dataSourceId, sql)
    validationResult.value = result
    emit('validate', result)
    
    if (result.valid) {
      ElMessage.success('SQL语法验证通过')
    } else {
      ElMessage.error(result.error || 'SQL语法错误')
    }
  } catch (error) {
    validationResult.value = { valid: false, error: '验证失败' }
    ElMessage.error('SQL验证失败')
  } finally {
    validating.value = false
  }
}

const executeSQL = async () => {
  if (!props.dataSourceId) {
    ElMessage.warning('请先选择数据源')
    return
  }
  
  const sql = editorView.value?.state.doc.toString() || ''
  if (!sql.trim()) {
    ElMessage.warning('请输入SQL语句')
    return
  }
  
  executing.value = true
  try {
    // 先验证SQL
    await validateSQL()
    
    if (validationResult.value?.valid) {
      // 执行SQL预览
      const result = await dataSetApi.previewSQL(props.dataSourceId, sql, 100)
      
      // 添加到历史记录
      queryHistory.value.unshift({
        sql,
        timestamp: Date.now()
      })
      
      // 限制历史记录数量
      if (queryHistory.value.length > 20) {
        queryHistory.value = queryHistory.value.slice(0, 20)
      }
      
      ElMessage.success(`查询执行成功，返回 ${result.totalCount} 条记录`)
    }
  } catch (error) {
    ElMessage.error('SQL执行失败')
  } finally {
    executing.value = false
  }
}

const useTemplate = (template: { name: string, sql: string }) => {
  if (!editorView.value) return
  
  editorView.value.dispatch({
    changes: { from: 0, to: editorView.value.state.doc.length, insert: template.sql }
  })
  
  showTemplates.value = false
  ElMessage.success(`已应用模板：${template.name}`)
}

const loadHistoryQuery = (query: { sql: string, timestamp: number }) => {
  if (!editorView.value) return
  
  editorView.value.dispatch({
    changes: { from: 0, to: editorView.value.state.doc.length, insert: query.sql }
  })
  
  ElMessage.success('已加载历史查询')
}

const formatTime = (timestamp: number) => {
  return new Date(timestamp).toLocaleString()
}

// 监听modelValue变化
watch(() => props.modelValue, (newValue) => {
  if (editorView.value && editorView.value.state.doc.toString() !== newValue) {
    editorView.value.dispatch({
      changes: { from: 0, to: editorView.value.state.doc.length, insert: newValue }
    })
  }
})

// 监听数据源变化
watch(() => props.dataSourceId, (newDataSourceId) => {
  if (newDataSourceId) {
    loadTables()
  }
}, { immediate: true })

// 生命周期
onMounted(() => {
  nextTick(() => {
    initEditor()
  })
})

onUnmounted(() => {
  if (editorView.value) {
    editorView.value.destroy()
  }
})
</script>

<style scoped>
.sql-editor {
  height: 100%;
  display: flex;
  flex-direction: column;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  overflow: hidden;
}

.editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #f5f7fa;
  border-bottom: 1px solid #e4e7ed;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-left h4 {
  margin: 0;
  color: #303133;
}

.header-right {
  display: flex;
  gap: 8px;
}

.editor-content {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.editor-main {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.codemirror-container {
  flex: 1;
  overflow: hidden;
}

.error-message {
  padding: 12px;
  border-top: 1px solid #e4e7ed;
}

.editor-sidebar {
  width: 300px;
  border-left: 1px solid #e4e7ed;
  background: #fafafa;
}

.tables-panel {
  padding: 12px;
}

.tables-list {
  margin-top: 12px;
  max-height: 400px;
  overflow-y: auto;
}

.table-item {
  margin-bottom: 8px;
  background: white;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  overflow: hidden;
}

.table-header {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.table-header:hover {
  background: #f5f7fa;
}

.table-name {
  flex: 1;
  margin-left: 8px;
  font-weight: 500;
  color: #303133;
}

.table-fields {
  border-top: 1px solid #f0f0f0;
  background: #fafafa;
}

.field-item {
  display: flex;
  align-items: center;
  padding: 6px 12px 6px 32px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.field-item:hover {
  background: #f0f2f5;
}

.field-name {
  flex: 1;
  margin-left: 8px;
  font-size: 13px;
  color: #606266;
}

.field-type {
  font-size: 11px;
  color: #909399;
}

.functions-panel {
  padding: 12px;
}

.function-item {
  padding: 8px 12px;
  margin-bottom: 8px;
  background: white;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s;
}

.function-item:hover {
  border-color: #409eff;
  box-shadow: 0 2px 4px rgba(64, 158, 255, 0.2);
}

.function-name {
  font-weight: 500;
  color: #409eff;
  margin-bottom: 4px;
}

.function-desc {
  font-size: 12px;
  color: #606266;
  margin-bottom: 4px;
}

.function-syntax {
  font-size: 11px;
  color: #909399;
  font-family: 'Courier New', monospace;
  background: #f5f7fa;
  padding: 2px 4px;
  border-radius: 2px;
}

.history-panel {
  padding: 12px;
  max-height: 400px;
  overflow-y: auto;
}

.history-item {
  padding: 8px 12px;
  margin-bottom: 8px;
  background: white;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s;
}

.history-item:hover {
  border-color: #409eff;
  box-shadow: 0 2px 4px rgba(64, 158, 255, 0.2);
}

.history-time {
  font-size: 11px;
  color: #909399;
  margin-bottom: 4px;
}

.history-sql {
  font-size: 12px;
  color: #606266;
  font-family: 'Courier New', monospace;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.templates-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 16px;
  max-height: 500px;
  overflow-y: auto;
}

.template-item {
  padding: 16px;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
}

.template-item:hover {
  border-color: #409eff;
  box-shadow: 0 4px 8px rgba(64, 158, 255, 0.2);
}

.template-name {
  font-weight: 500;
  color: #303133;
  margin-bottom: 8px;
}

.template-desc {
  font-size: 12px;
  color: #606266;
  margin-bottom: 12px;
}

.template-sql {
  font-size: 11px;
  color: #909399;
  background: #f5f7fa;
  padding: 8px;
  border-radius: 4px;
  margin: 0;
  white-space: pre-wrap;
  overflow: hidden;
}
</style> 