<template>
  <div class="form-designer">
    <!-- 左侧控件面板 -->
    <div class="control-panel">
      <el-collapse v-model="state.activeNames">
        <el-collapse-item title="基础控件" name="basic">
          <draggable
            :list="basicControls"
            :group="{ name: 'controls', pull: 'clone', put: false }"
            :sort="false"
            item-key="id"
            class="control-list"
          >
            <template #item="{ element }">
              <div class="control-item">
                <el-icon><component :is="element.icon" /></el-icon>
                <span>{{ element.label }}</span>
              </div>
            </template>
          </draggable>
        </el-collapse-item>
        
        <el-collapse-item title="高级控件" name="advanced">
          <draggable
            :list="advancedControls"
            :group="{ name: 'controls', pull: 'clone', put: false }"
            :sort="false"
            item-key="id"
            class="control-list"
          >
            <template #item="{ element }">
              <div class="control-item">
                <el-icon><component :is="element.icon" /></el-icon>
                <span>{{ element.label }}</span>
              </div>
            </template>
          </draggable>
        </el-collapse-item>
      </el-collapse>
    </div>

    <!-- 中间设计区域 -->
    <div class="design-area">
      <div class="toolbar">
        <el-button type="primary" @click="exportSchema">
          <el-icon><Download /></el-icon>
          导出 Schema
        </el-button>
        <el-button type="success" @click="exportSQL">
          <el-icon><Document /></el-icon>
          导出 SQL
        </el-button>
        <el-button @click="previewForm">
          <el-icon><View /></el-icon>
          预览表单
        </el-button>
        <el-button @click="clearForm" type="danger">
          <el-icon><Delete /></el-icon>
          清空表单
        </el-button>
      </div>

      <div class="form-canvas" :class="{ 'empty': state.formControls.length === 0 }">
        <div v-if="state.formControls.length === 0" class="empty-tip">
          <el-icon><Plus /></el-icon>
          <p>从左侧拖拽控件到此处开始设计表单</p>
        </div>
        
        <el-form v-else label-width="120px" label-position="left">
          <draggable
            v-model="state.formControls"
            :group="{ name: 'controls', pull: false, put: true }"
            item-key="id"
            class="form-container"
            @start="dragStart"
            @end="dragEnd"
            :animation="200"
          >
            <template #item="{ element, index }">
              <div 
                class="form-control-wrapper"
                :class="{ active: state.selectedControl?.id === element.id }"
                @click="selectControl(element)"
              >
                <el-form-item
                  :label="element.label"
                  :prop="element.field"
                  :required="element.required"
                >
                  <component
                    :is="getComponentType(element.type)"
                    v-model="element.value"
                    v-bind="getComponentProps(element)"
                    :placeholder="element.placeholder"
                    :disabled="element.disabled"
                    style="width: 100%"
                  >
                    <!-- 选择框选项 -->
                    <template v-if="element.type === 'select'">
                      <el-option
                        v-for="option in element.options"
                        :key="option.value"
                        :label="option.label"
                        :value="option.value"
                      />
                    </template>
                    
                    <!-- 单选框选项 -->
                    <template v-if="element.type === 'radio'">
                      <el-radio
                        v-for="option in element.options"
                        :key="option.value"
                        :label="option.value"
                      >
                        {{ option.label }}
                      </el-radio>
                    </template>
                    
                    <!-- 多选框选项 -->
                    <template v-if="element.type === 'checkbox'">
                      <el-checkbox
                        v-for="option in element.options"
                        :key="option.value"
                        :label="option.value"
                      >
                        {{ option.label }}
                      </el-checkbox>
                    </template>
                  </component>
                </el-form-item>
                
                <!-- 控件操作按钮 -->
                <div class="control-actions" v-show="state.selectedControl?.id === element.id">
                  <el-button-group>
                    <el-button size="small" @click.stop="moveUp(index)" :disabled="index === 0">
                      <el-icon><ArrowUp /></el-icon>
                    </el-button>
                    <el-button size="small" @click.stop="moveDown(index)" :disabled="index === state.formControls.length - 1">
                      <el-icon><ArrowDown /></el-icon>
                    </el-button>
                    <el-button size="small" @click.stop="cloneControl(element)">
                      <el-icon><CopyDocument /></el-icon>
                    </el-button>
                    <el-button size="small" type="danger" @click.stop="deleteControl(element)">
                      <el-icon><Delete /></el-icon>
                    </el-button>
                  </el-button-group>
                </div>
              </div>
            </template>
          </draggable>
        </el-form>
        
        <!-- 空状态时的拖拽区域 -->
        <draggable
          v-if="state.formControls.length === 0"
          v-model="state.formControls"
          :group="{ name: 'controls', pull: false, put: true }"
          item-key="id"
          class="empty-drop-zone"
          @start="dragStart"
          @end="dragEnd"
          :animation="200"
        >
          <template #item="{ element }">
            <!-- 这里不会渲染，因为列表为空 -->
          </template>
          <div class="empty-drop-tip">
            <el-icon><Upload /></el-icon>
            <p>拖拽左侧控件到此处开始设计表单</p>
          </div>
        </draggable>
      </div>
    </div>

    <!-- 右侧属性面板 -->
    <div class="property-panel">
      <div v-if="!state.selectedControl" class="no-selection">
        <el-icon><InfoFilled /></el-icon>
        <p>请选择一个控件来编辑属性</p>
      </div>
      
      <div v-else>
        <h3>{{ state.selectedControl.label }} - 属性配置</h3>
        <el-form label-position="top" size="small">
          <!-- 基础属性 -->
          <el-card class="property-card" header="基础属性">
            <el-form-item label="字段名">
              <el-input v-model="state.selectedControl.field" @change="updateControl" />
            </el-form-item>
            <el-form-item label="标签">
              <el-input v-model="state.selectedControl.label" @change="updateControl" />
            </el-form-item>
            <el-form-item label="占位符" v-if="hasPlaceholder(state.selectedControl.type)">
              <el-input v-model="state.selectedControl.placeholder" @change="updateControl" />
            </el-form-item>
            <el-form-item label="默认值">
              <component
                :is="getComponentType(state.selectedControl.type)"
                v-model="state.selectedControl.value"
                :placeholder="'设置默认值'"
                style="width: 100%"
              />
            </el-form-item>
          </el-card>

          <!-- 验证规则 -->
          <el-card class="property-card" header="验证规则">
            <el-form-item>
              <el-checkbox v-model="state.selectedControl.required" @change="updateControl">
                必填
              </el-checkbox>
            </el-form-item>
            <el-form-item>
              <el-checkbox v-model="state.selectedControl.disabled" @change="updateControl">
                禁用
              </el-checkbox>
            </el-form-item>
            <el-form-item>
              <el-checkbox v-model="state.selectedControl.hidden" @change="updateControl">
                隐藏
              </el-checkbox>
            </el-form-item>
          </el-card>

          <!-- 选项配置 -->
          <el-card v-if="hasOptions(state.selectedControl.type)" class="property-card" header="选项配置">
            <div v-for="(option, index) in state.selectedControl.options" :key="index" class="option-item">
              <el-input v-model="option.label" placeholder="选项文本" style="margin-bottom: 8px;" />
              <el-input v-model="option.value" placeholder="选项值" />
              <el-button type="danger" size="small" @click="removeOption(index)" style="margin-left: 8px;">
                <el-icon><Delete /></el-icon>
              </el-button>
            </div>
            <el-button type="primary" size="small" @click="addOption" style="width: 100%; margin-top: 8px;">
              <el-icon><Plus /></el-icon>
              添加选项
            </el-button>
          </el-card>

          <!-- 样式配置 -->
          <el-card class="property-card" header="样式配置">
            <el-form-item label="宽度">
              <el-select v-model="widthType" @change="updateWidth">
                <el-option label="自适应" value="auto" />
                <el-option label="固定宽度" value="fixed" />
                <el-option label="百分比" value="percent" />
              </el-select>
            </el-form-item>
            <el-form-item v-if="widthType === 'fixed'" label="宽度值(px)">
              <el-input-number v-model="fixedWidth" :min="50" :max="800" @change="updateWidth" />
            </el-form-item>
            <el-form-item v-if="widthType === 'percent'" label="宽度百分比">
              <el-input-number v-model="percentWidth" :min="10" :max="100" @change="updateWidth" />
            </el-form-item>
          </el-card>
        </el-form>
      </div>
    </div>

    <!-- 预览对话框 -->
    <el-dialog v-model="previewVisible" title="表单预览" width="80%" top="5vh">
      <div class="preview-container">
        <el-form :model="previewData" label-width="120px" ref="previewFormRef">
          <template v-for="control in state.formControls" :key="control.id">
            <el-form-item
              v-if="!control.hidden"
              :label="control.label"
              :prop="control.field"
              :rules="getValidationRules(control)"
            >
              <component
                :is="getComponentType(control.type)"
                v-model="previewData[control.field]"
                v-bind="getComponentProps(control)"
                :placeholder="control.placeholder"
                :disabled="control.disabled"
                style="width: 100%"
              >
                <template v-if="control.type === 'select'">
                  <el-option
                    v-for="option in control.options"
                    :key="option.value"
                    :label="option.label"
                    :value="option.value"
                  />
                </template>
                <template v-if="control.type === 'radio'">
                  <el-radio
                    v-for="option in control.options"
                    :key="option.value"
                    :label="option.value"
                  >
                    {{ option.label }}
                  </el-radio>
                </template>
                <template v-if="control.type === 'checkbox'">
                  <el-checkbox
                    v-for="option in control.options"
                    :key="option.value"
                    :label="option.value"
                  >
                    {{ option.label }}
                  </el-checkbox>
                </template>
              </component>
            </el-form-item>
          </template>
        </el-form>
        
        <div class="preview-actions">
          <el-button type="primary" @click="validateForm">验证表单</el-button>
          <el-button @click="resetForm">重置表单</el-button>
        </div>
        
        <el-divider content-position="left">表单数据</el-divider>
        <pre class="json-preview">{{ JSON.stringify(previewData, null, 2) }}</pre>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
// @ts-nocheck
import { ref, reactive, computed } from 'vue'
import draggable from 'vuedraggable'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Document,
  Edit,
  Select,
  Calendar,
  Switch,
  Upload,
  Delete,
  Download,
  View,
  Plus,
  ArrowUp,
  ArrowDown,
  CopyDocument,
  InfoFilled,
  Clock,
  Timer,
  Operation,
  CircleCheck,
  Check
} from '@element-plus/icons-vue'
import type {
  IFormControl,
  FormControlType,
  IFormDesignerState
} from '../types/IFormKit'

// 状态管理
const state = reactive<IFormDesignerState>({
  formControls: [],
  selectedControl: null,
  activeTab: 'basic',
  activeNames: ['basic', 'advanced']
})

// 基础控件配置
const basicControls = reactive<IFormControl[]>([
  { id: 'text', type: 'text', field: '', label: '单行文本', icon: 'Edit' },
  { id: 'textarea', type: 'textarea', field: '', label: '多行文本', icon: 'Document' },
  { id: 'number', type: 'number', field: '', label: '数字输入', icon: 'Edit' },
  { id: 'select', type: 'select', field: '', label: '下拉选择', icon: 'Select' },
  { id: 'radio', type: 'radio', field: '', label: '单选框', icon: 'CircleCheck' },
  { id: 'checkbox', type: 'checkbox', field: '', label: '多选框', icon: 'Check' }
])

// 高级控件配置
const advancedControls = reactive<IFormControl[]>([
  { id: 'date', type: 'date', field: '', label: '日期选择', icon: 'Calendar' },
  { id: 'time', type: 'time', field: '', label: '时间选择', icon: 'Clock' },
  { id: 'datetime', type: 'datetime', field: '', label: '日期时间', icon: 'Timer' },
  { id: 'switch', type: 'switch', field: '', label: '开关', icon: 'Switch' },
  { id: 'slider', type: 'slider', field: '', label: '滑块', icon: 'Operation' },
  { id: 'upload', type: 'upload', field: '', label: '文件上传', icon: 'Upload' }
])

// 预览相关
const previewVisible = ref(false)
const previewData = ref<Record<string, any>>({})
const previewFormRef = ref()

// 样式配置
const widthType = ref('auto')
const fixedWidth = ref(200)
const percentWidth = ref(100)

// 获取组件类型
const getComponentType = (type: FormControlType): string => {
  const componentMap: Record<FormControlType, string> = {
    text: 'el-input',
    textarea: 'el-input',
    number: 'el-input-number',
    select: 'el-select',
    date: 'el-date-picker',
    time: 'el-time-picker',
    datetime: 'el-date-picker',
    switch: 'el-switch',
    radio: 'el-radio-group',
    checkbox: 'el-checkbox-group',
    upload: 'el-upload',
    slider: 'el-slider'
  }
  return componentMap[type] || 'el-input'
}

// 获取组件属性
const getComponentProps = (control: IFormControl) => {
  const baseProps = {
    clearable: true,
    ...control.props
  }

  switch (control.type) {
    case 'textarea':
      return { ...baseProps, type: 'textarea', rows: 4 }
    case 'datetime':
      return { ...baseProps, type: 'datetime' }
    case 'upload':
      return { ...baseProps, action: '#', 'show-file-list': false }
    default:
      return baseProps
  }
}

// 判断是否有占位符
const hasPlaceholder = (type: FormControlType): boolean => {
  return ['text', 'textarea', 'number', 'select'].includes(type)
}

// 判断是否有选项
const hasOptions = (type: FormControlType): boolean => {
  return ['select', 'radio', 'checkbox'].includes(type)
}

// 获取验证规则
const getValidationRules = (control: IFormControl) => {
  const rules: any[] = []
  
  if (control.required) {
    rules.push({
      required: true,
      message: `请输入${control.label}`,
      trigger: ['blur', 'change']
    })
  }
  
  return rules
}

// 创建新控件
const createControl = (template: IFormControl): IFormControl => {
  const newControl: IFormControl = {
    id: `${template.type}_${Date.now()}`,
    type: template.type,
    field: `field_${Date.now()}`,
    label: template.label,
    placeholder: `请输入${template.label}`,
    required: false,
    hidden: false,
    disabled: false,
    value: getDefaultValue(template.type),
    props: {
      clearable: true
    }
  }

  // 为有选项的控件添加默认选项
  if (hasOptions(template.type)) {
    newControl.options = [
      { label: '选项1', value: '1' },
      { label: '选项2', value: '2' }
    ]
  }

  return newControl
}

// 获取默认值
const getDefaultValue = (type: FormControlType) => {
  switch (type) {
    case 'number':
      return 0
    case 'switch':
      return false
    case 'checkbox':
      return []
    case 'slider':
      return 0
    default:
      return ''
  }
}

// 拖拽事件
const dragStart = () => {
  console.log('开始拖拽')
}

const dragEnd = (event: any) => {
  console.log('拖拽结束:', event)
  
  if (event.added) {
    console.log('添加新控件:', event.added.element)
    const newControl = createControl(event.added.element)
    console.log('创建的控件:', newControl)
    
    // 直接替换拖拽进来的模板控件
    const index = event.added.newIndex
    if (index !== undefined && index < state.formControls.length) {
      // 替换现有位置的控件
      state.formControls[index] = newControl
    } else {
      // 如果索引无效，直接添加到末尾
      state.formControls.push(newControl)
    }
    
    selectControl(newControl)
    console.log('当前控件列表:', state.formControls)
  }
}

// 选择控件
const selectControl = (control: IFormControl) => {
  state.selectedControl = control
}

// 更新控件
const updateControl = () => {
  // 触发响应式更新
}

// 控件操作
const moveUp = (index: number) => {
  if (index > 0) {
    const temp = state.formControls[index]
    state.formControls[index] = state.formControls[index - 1]
    state.formControls[index - 1] = temp
  }
}

const moveDown = (index: number) => {
  if (index < state.formControls.length - 1) {
    const temp = state.formControls[index]
    state.formControls[index] = state.formControls[index + 1]
    state.formControls[index + 1] = temp
  }
}

const cloneControl = (control: IFormControl) => {
  const cloned = createControl(control)
  cloned.label = `${control.label}_副本`
  cloned.field = `${control.field}_copy_${Date.now()}`
  
  const index = state.formControls.findIndex(item => item.id === control.id)
  state.formControls.splice(index + 1, 0, cloned)
  selectControl(cloned)
}

const deleteControl = (control: IFormControl) => {
  ElMessageBox.confirm('确定要删除这个控件吗？', '确认删除', {
    type: 'warning'
  }).then(() => {
    const index = state.formControls.findIndex(item => item.id === control.id)
    if (index !== -1) {
      state.formControls.splice(index, 1)
      if (state.selectedControl?.id === control.id) {
        state.selectedControl = null
      }
    }
    ElMessage.success('删除成功')
  }).catch(() => {})
}

// 选项操作
const addOption = () => {
  if (!state.selectedControl?.options) {
    state.selectedControl!.options = []
  }
  state.selectedControl!.options.push({
    label: `选项${state.selectedControl!.options.length + 1}`,
    value: `${state.selectedControl!.options.length + 1}`
  })
}

const removeOption = (index: number) => {
  if (state.selectedControl?.options) {
    state.selectedControl.options.splice(index, 1)
  }
}

// 样式更新
const updateWidth = () => {
  if (!state.selectedControl) return
  
  if (!state.selectedControl.style) {
    state.selectedControl.style = {}
  }
  
  switch (widthType.value) {
    case 'auto':
      state.selectedControl.style.width = '100%'
      break
    case 'fixed':
      state.selectedControl.style.width = `${fixedWidth.value}px`
      break
    case 'percent':
      state.selectedControl.style.width = `${percentWidth.value}%`
      break
  }
}

// 表单操作
const clearForm = () => {
  ElMessageBox.confirm('确定要清空整个表单吗？', '确认清空', {
    type: 'warning'
  }).then(() => {
    state.formControls = []
    state.selectedControl = null
    ElMessage.success('表单已清空')
  }).catch(() => {})
}

const previewForm = () => {
  // 初始化预览数据
  previewData.value = {}
  state.formControls.forEach(control => {
    previewData.value[control.field] = control.value || getDefaultValue(control.type)
  })
  previewVisible.value = true
}

const validateForm = () => {
  if (previewFormRef.value) {
    previewFormRef.value.validate((valid: boolean) => {
      if (valid) {
        ElMessage.success('表单验证通过')
      } else {
        ElMessage.error('表单验证失败')
      }
    })
  }
}

const resetForm = () => {
  if (previewFormRef.value) {
    previewFormRef.value.resetFields()
  }
}

// 导出功能
const exportSchema = () => {
  const schema = {
    version: '1.0.0',
    title: '表单设计器',
    controls: state.formControls.map(control => ({
      id: control.id,
      type: control.type,
      field: control.field,
      label: control.label,
      placeholder: control.placeholder,
      required: control.required,
      hidden: control.hidden,
      disabled: control.disabled,
      value: control.value,
      options: control.options,
      validation: control.validation,
      style: control.style,
      props: control.props
    }))
  }
  
  // 创建下载链接
  const blob = new Blob([JSON.stringify(schema, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'form-schema.json'
  a.click()
  URL.revokeObjectURL(url)
  
  ElMessage.success('Schema 导出成功')
}

const exportSQL = () => {
  const tableName = 'form_data'
  let sql = `CREATE TABLE ${tableName} (\n`
  sql += '  id INT PRIMARY KEY AUTO_INCREMENT,\n'
  
  state.formControls.forEach(control => {
    let fieldType = 'VARCHAR(255)'
    
    switch (control.type) {
      case 'number':
        fieldType = 'INT'
        break
      case 'textarea':
        fieldType = 'TEXT'
        break
      case 'date':
        fieldType = 'DATE'
        break
      case 'datetime':
        fieldType = 'DATETIME'
        break
      case 'switch':
        fieldType = 'BOOLEAN'
        break
    }
    
    sql += `  ${control.field} ${fieldType}`
    if (control.required) {
      sql += ' NOT NULL'
    }
    sql += `,\n`
  })
  
  sql += '  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,\n'
  sql += '  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP\n'
  sql += ');'
  
  // 创建下载链接
  const blob = new Blob([sql], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'form-table.sql'
  a.click()
  URL.revokeObjectURL(url)
  
  ElMessage.success('SQL 导出成功')
}
</script>

<style scoped>
.form-designer {
  display: grid;
  grid-template-columns: 280px 1fr 320px;
  gap: 16px;
  height: 100vh;
  padding: 16px;
  box-sizing: border-box;
  background: #f5f7fa;
}

.control-panel,
.design-area,
.property-panel {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.control-panel {
  padding: 16px;
  overflow-y: auto;
}

.control-list {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
  margin-top: 8px;
}

.control-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 8px;
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  cursor: move;
  transition: all 0.3s;
  background: #fafafa;
}

.control-item:hover {
  background: #ecf5ff;
  border-color: #409eff;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.15);
}

.design-area {
  display: flex;
  flex-direction: column;
}

.toolbar {
  display: flex;
  gap: 12px;
  padding: 16px;
  border-bottom: 1px solid #e4e7ed;
  background: #fafbfc;
}

.form-canvas {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  min-height: 400px;
  position: relative;
}

.form-canvas.empty {
  display: flex;
  align-items: center;
  justify-content: center;
}

.empty-tip {
  text-align: center;
  color: #909399;
}

.empty-tip .el-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.form-container {
  min-height: 200px;
}

.empty-drop-zone {
  position: absolute;
  top: 20px;
  left: 20px;
  right: 20px;
  bottom: 20px;
  min-height: 360px;
  border: 2px dashed #c0c4cc;
  border-radius: 8px;
  background: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
}

.empty-drop-zone:hover {
  border-color: #409eff;
  background: rgba(64, 158, 255, 0.05);
}

.empty-drop-tip {
  text-align: center;
  color: #909399;
  pointer-events: none; /* 防止阻止拖拽事件 */
}

.empty-drop-tip .el-icon {
  font-size: 48px;
  margin-bottom: 16px;
  color: #c0c4cc;
}

.empty-drop-tip p {
  margin: 0;
  font-size: 16px;
}

.form-control-wrapper {
  position: relative;
  margin-bottom: 16px;
  padding: 12px;
  border: 2px dashed transparent;
  border-radius: 6px;
  transition: all 0.3s;
}

.form-control-wrapper:hover {
  border-color: #c0c4cc;
  background: #fafafa;
}

.form-control-wrapper.active {
  border-color: #409eff;
  background: #ecf5ff;
}

.control-actions {
  position: absolute;
  top: -8px;
  right: 8px;
  z-index: 10;
}

.property-panel {
  padding: 16px;
  overflow-y: auto;
}

.no-selection {
  text-align: center;
  color: #909399;
  margin-top: 100px;
}

.no-selection .el-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.property-card {
  margin-bottom: 16px;
}

.option-item {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.preview-container {
  max-height: 70vh;
  overflow-y: auto;
}

.preview-actions {
  text-align: center;
  margin: 20px 0;
}

.json-preview {
  background: #f5f7fa;
  padding: 16px;
  border-radius: 6px;
  font-size: 12px;
  max-height: 300px;
  overflow-y: auto;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .form-designer {
    grid-template-columns: 250px 1fr 280px;
  }
}

@media (max-width: 768px) {
  .form-designer {
    grid-template-columns: 1fr;
    grid-template-rows: auto 1fr auto;
  }
  
  .control-panel,
  .property-panel {
    max-height: 300px;
  }
}
</style> 