<template>
  <div class="form-editor">
    <!-- 顶部工具栏 -->
    <div class="editor-header">
      <div class="header-left">
        <el-button @click="goBack" :icon="ArrowLeft">返回</el-button>
        <h1>{{ isEdit ? '编辑表单' : '新建表单' }}</h1>
        <el-tag v-if="fromWizard" type="success">来自向导</el-tag>
      </div>
      <div class="header-right">
        <el-button @click="previewForm" :icon="View">预览</el-button>
        <el-button type="primary" @click="saveForm" :loading="saving" :icon="Check">
          保存表单
        </el-button>
      </div>
    </div>

    <!-- 向导配置信息 -->
    <div v-if="fromWizard && formConfig" class="wizard-config">
      <el-alert
        :title="`表单名称：${formConfig.basic.name}`"
        :description="`数据源：${formConfig.basic.dataSource} | 模板：${getTemplateName(formConfig.template.selectedTemplate)}`"
        type="info"
        show-icon
        :closable="false"
      />
    </div>

    <!-- 主编辑区域 -->
    <div class="editor-content">
      <el-row :gutter="20" class="editor-main">
        <!-- 左侧：字段组件库 -->
        <el-col :span="6">
          <el-card class="field-panel">
            <template #header>
              <span>字段组件</span>
            </template>
            <div class="field-components">
              <div
                v-for="component in fieldComponents"
                :key="component.type"
                class="field-component"
                draggable="true"
                @dragstart="handleDragStart(component)"
              >
                <el-icon><component :is="component.icon" /></el-icon>
                <span>{{ component.label }}</span>
              </div>
            </div>
          </el-card>
        </el-col>

        <!-- 中间：表单设计区域 -->
        <el-col :span="12">
          <el-card class="design-panel">
            <template #header>
              <span>表单设计</span>
            </template>
            <div
              class="form-canvas"
              @drop="handleDrop"
              @dragover.prevent
              @dragenter.prevent
            >
              <div v-if="!formFields.length" class="empty-canvas">
                <el-empty description="拖拽左侧组件到此处开始设计表单" />
              </div>
              
              <div
                v-for="(field, index) in formFields"
                :key="field.id"
                class="form-field-item"
                :class="{ active: selectedFieldIndex === index }"
                @click="selectField(index)"
              >
                <!-- 字段预览 -->
                <div class="field-preview">
                  <el-form-item :label="field.label" :required="field.required">
                    <component
                      :is="getFieldComponent(field.type)"
                      v-bind="getFieldProps(field)"
                      :model-value="field.defaultValue"
                      disabled
                      style="width: 100%"
                    />
                  </el-form-item>
                </div>
                
                <!-- 字段操作按钮 -->
                <div class="field-actions">
                  <el-button size="small" type="primary" @click.stop="editField(index)">
                    编辑
                  </el-button>
                  <el-button size="small" type="danger" @click.stop="removeField(index)">
                    删除
                  </el-button>
                </div>
              </div>
            </div>
          </el-card>
        </el-col>

        <!-- 右侧：属性配置面板 -->
        <el-col :span="6">
          <el-card class="property-panel">
            <template #header>
              <span>属性配置</span>
            </template>
            
            <div v-if="selectedField" class="field-properties">
              <el-tabs v-model="activeTab" type="border-card">
                <!-- 基础属性 -->
                <el-tab-pane label="基础属性" name="basic">
                  <el-form :model="selectedField" label-width="80px" size="small">
                    <el-form-item label="字段名称">
                      <el-input v-model="selectedField.label" @change="updateField" />
                    </el-form-item>
                    <el-form-item label="字段标识">
                      <el-input v-model="selectedField.name" @change="updateField" />
                    </el-form-item>
                    <el-form-item label="是否必填">
                      <el-switch v-model="selectedField.required" @change="updateField" />
                    </el-form-item>
                    <el-form-item label="提示信息">
                      <el-input v-model="selectedField.placeholder" @change="updateField" />
                    </el-form-item>
                    <el-form-item label="默认值">
                      <el-input v-model="selectedField.defaultValue" @change="updateField" />
                    </el-form-item>
                    
                    <!-- 选项配置（用于select、radio、checkbox） -->
                    <el-form-item v-if="hasOptions(selectedField.type)" label="选项配置">
                      <div class="options-editor">
                        <div
                          v-for="(option, index) in selectedField.options"
                          :key="index"
                          class="option-item"
                        >
                          <el-input
                            v-model="selectedField.options[index]"
                            size="small"
                            @change="updateField"
                          />
                          <el-button
                            size="small"
                            type="danger"
                            @click="removeOption(index)"
                          >
                            删除
                          </el-button>
                        </div>
                        <el-button
                          size="small"
                          type="primary"
                          @click="addOption"
                          style="width: 100%; margin-top: 8px;"
                        >
                          添加选项
                        </el-button>
                      </div>
                    </el-form-item>
                  </el-form>
                </el-tab-pane>
                
                <!-- 验证规则 -->
                <el-tab-pane label="验证规则" name="validation">
                  <el-form :model="selectedField" label-width="80px" size="small">
                    <el-form-item label="最小长度" v-if="selectedField.type === 'input'">
                      <el-input-number v-model="selectedField.minLength" :min="0" @change="updateField" />
                    </el-form-item>
                    <el-form-item label="最大长度" v-if="selectedField.type === 'input'">
                      <el-input-number v-model="selectedField.maxLength" :min="0" @change="updateField" />
                    </el-form-item>
                    <el-form-item label="最小值" v-if="selectedField.type === 'number'">
                      <el-input-number v-model="selectedField.min" @change="updateField" />
                    </el-form-item>
                    <el-form-item label="最大值" v-if="selectedField.type === 'number'">
                      <el-input-number v-model="selectedField.max" @change="updateField" />
                    </el-form-item>
                    <el-form-item label="正则验证">
                      <el-input v-model="selectedField.pattern" placeholder="正则表达式" @change="updateField" />
                    </el-form-item>
                  </el-form>
                </el-tab-pane>
                
                <!-- 显示配置 -->
                <el-tab-pane label="显示配置" name="display">
                  <el-form :model="selectedField" label-width="100px" size="small">
                    <el-form-item label="表格中显示">
                      <el-switch v-model="selectedField.showInTable" @change="updateField" />
                    </el-form-item>
                    <el-form-item label="搜索条件">
                      <el-switch v-model="selectedField.showInSearch" @change="updateField" />
                    </el-form-item>
                    <el-form-item label="可排序">
                      <el-switch v-model="selectedField.sortable" @change="updateField" />
                    </el-form-item>
                    <el-form-item label="列宽">
                      <el-input-number v-model="selectedField.width" :min="50" @change="updateField" />
                    </el-form-item>
                  </el-form>
                </el-tab-pane>
              </el-tabs>
            </div>
            
            <div v-else class="no-selection">
              <el-empty description="请选择一个字段进行配置" />
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { 
  ArrowLeft, 
  View, 
  Check, 
  Edit, 
  Document, 
  Plus, 
  ArrowDown, 
  CircleCheck, 
  Select,
  Calendar,
  Switch
} from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()

// 响应式数据
const saving = ref(false)
const selectedFieldIndex = ref(-1)
const activeTab = ref('basic')
const formFields = ref([])

// 从路由参数获取配置
const fromWizard = computed(() => route.query.fromWizard === 'true')
const formConfig = computed(() => {
  if (route.query.config) {
    try {
      return JSON.parse(route.query.config as string)
    } catch {
      return null
    }
  }
  return null
})

const isEdit = computed(() => !!route.params.id)

// 字段组件库
const fieldComponents = [
  { type: 'input', label: '单行文本', icon: Edit },
  { type: 'textarea', label: '多行文本', icon: Document },
  { type: 'number', label: '数字输入', icon: Plus },
  { type: 'select', label: '下拉选择', icon: ArrowDown },
  { type: 'radio', label: '单选框', icon: CircleCheck },
  { type: 'checkbox', label: '复选框', icon: Select },
  { type: 'date', label: '日期选择', icon: Calendar },
  { type: 'switch', label: '开关', icon: Switch }
]

// 计算属性
const selectedField = computed(() => {
  return selectedFieldIndex.value >= 0 ? formFields.value[selectedFieldIndex.value] : null
})

// 方法
const goBack = () => {
  router.push('/form-designer')
}

const previewForm = () => {
  if (route.params.id) {
    router.push(`/form-designer/preview/${route.params.id}`)
  } else {
    ElMessage.warning('请先保存表单后再预览')
  }
}

const saveForm = async () => {
  saving.value = true
  try {
    // 模拟保存API调用
    await new Promise(resolve => setTimeout(resolve, 1000))
    ElMessage.success('表单保存成功！')
    
    // 如果是新建，跳转到编辑页面
    if (!isEdit.value) {
      router.replace('/form-designer/edit/new-form-id')
    }
  } catch (error) {
    ElMessage.error('保存失败')
  } finally {
    saving.value = false
  }
}

const handleDragStart = (component: any) => {
  // 存储拖拽的组件信息
  ;(window as any).draggedComponent = component
}

const handleDrop = (event: DragEvent) => {
  event.preventDefault()
  const component = (window as any).draggedComponent
  if (component) {
    addField(component)
    ;(window as any).draggedComponent = null
  }
}

const addField = (component) => {
  const fieldId = `field_${Date.now()}`
  const newField = {
    id: fieldId,
    type: component.type,
    name: `field_${formFields.value.length + 1}`,
    label: component.label,
    placeholder: `请输入${component.label}`,
    required: false,
    defaultValue: '',
    options: hasOptions(component.type) ? ['选项1', '选项2'] : undefined,
    showInTable: true,
    showInSearch: false,
    sortable: false,
    width: 120,
    minLength: undefined,
    maxLength: undefined,
    min: undefined,
    max: undefined,
    pattern: ''
  }
  
  formFields.value.push(newField)
  selectedFieldIndex.value = formFields.value.length - 1
}

const selectField = (index) => {
  selectedFieldIndex.value = index
  activeTab.value = 'basic'
}

const editField = (index) => {
  selectedFieldIndex.value = index
  activeTab.value = 'basic'
}

const removeField = (index) => {
  formFields.value.splice(index, 1)
  if (selectedFieldIndex.value === index) {
    selectedFieldIndex.value = -1
  } else if (selectedFieldIndex.value > index) {
    selectedFieldIndex.value--
  }
}

const updateField = () => {
  // 字段更新时的处理逻辑
}

const hasOptions = (type) => {
  return ['select', 'radio', 'checkbox'].includes(type)
}

const addOption = () => {
  if (selectedField.value && selectedField.value.options) {
    selectedField.value.options.push(`选项${selectedField.value.options.length + 1}`)
  }
}

const removeOption = (index) => {
  if (selectedField.value && selectedField.value.options) {
    selectedField.value.options.splice(index, 1)
  }
}

const getFieldComponent = (type) => {
  const componentMap = {
    input: 'el-input',
    textarea: 'el-input',
    number: 'el-input-number',
    select: 'el-select',
    radio: 'el-radio-group',
    checkbox: 'el-checkbox-group',
    date: 'el-date-picker',
    switch: 'el-switch'
  }
  return componentMap[type] || 'el-input'
}

const getFieldProps = (field: any) => {
  const props: any = {
    placeholder: field.placeholder
  }
  
  if (field.type === 'textarea') {
    props.type = 'textarea'
    props.rows = 3
  }
  
  if (field.type === 'select') {
    // 为select添加选项
    props.options = field.options || []
  }
  
  return props
}

const getTemplateName = (templateId) => {
  const templateMap = {
    personal: '个人信息模板',
    product: '商品信息模板',
    empty: '空模板'
  }
  return templateMap[templateId] || '未知模板'
}

// 生命周期
onMounted(() => {
  // 如果是从向导进入，初始化字段
  if (fromWizard.value && formConfig.value) {
    formFields.value = formConfig.value.template.fields.map((field, index) => ({
      id: `field_${index}`,
      type: field.type,
      name: field.name,
      label: field.label,
      placeholder: field.placeholder,
      required: field.required,
      defaultValue: '',
      options: field.options || undefined,
      showInTable: true,
      showInSearch: false,
      sortable: false,
      width: 120,
      minLength: undefined,
      maxLength: undefined,
      min: undefined,
      max: undefined,
      pattern: ''
    }))
  }
})
</script>

<style scoped lang="scss">
.form-editor {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f5f7fa;
}

.editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: white;
  border-bottom: 1px solid #e4e7ed;
  
  .header-left {
    display: flex;
    align-items: center;
    gap: 12px;
    
    h1 {
      margin: 0;
      font-size: 18px;
      color: #303133;
    }
  }
  
  .header-right {
    display: flex;
    gap: 8px;
  }
}

.wizard-config {
  padding: 16px 20px;
  background: white;
  border-bottom: 1px solid #e4e7ed;
}

.editor-content {
  flex: 1;
  padding: 20px;
  overflow: auto;
}

.editor-main {
  height: calc(100vh - 200px);
}

.field-panel,
.design-panel,
.property-panel {
  height: 100%;
  
  :deep(.el-card__body) {
    height: calc(100% - 60px);
    overflow: auto;
  }
}

.field-components {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.field-component {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  cursor: grab;
  transition: all 0.3s;
  background: white;
  
  &:hover {
    border-color: #409eff;
    box-shadow: 0 2px 8px rgba(64, 158, 255, 0.2);
  }
  
  &:active {
    cursor: grabbing;
  }
  
  .el-icon {
    font-size: 16px;
    color: #409eff;
  }
  
  span {
    font-size: 13px;
    color: #303133;
  }
}

.form-canvas {
  min-height: 400px;
  padding: 20px;
  border: 2px dashed #e4e7ed;
  border-radius: 6px;
  background: #fafafa;
  
  &:hover {
    border-color: #409eff;
    background: #f0f9ff;
  }
}

.empty-canvas {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 300px;
}

.form-field-item {
  position: relative;
  margin-bottom: 16px;
  padding: 16px;
  background: white;
  border: 2px solid transparent;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s;
  
  &:hover {
    border-color: #e4e7ed;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }
  
  &.active {
    border-color: #409eff;
    box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2);
  }
  
  .field-preview {
    pointer-events: none;
  }
  
  .field-actions {
    position: absolute;
    top: 8px;
    right: 8px;
    display: none;
    gap: 4px;
  }
  
  &:hover .field-actions,
  &.active .field-actions {
    display: flex;
  }
}

.field-properties {
  :deep(.el-tabs__content) {
    padding: 16px;
  }
}

.options-editor {
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  padding: 12px;
  background: #fafafa;
}

.option-item {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
  align-items: center;
  
  &:last-child {
    margin-bottom: 0;
  }
}

.no-selection {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 200px;
  color: #909399;
  font-size: 14px;
}
</style> 