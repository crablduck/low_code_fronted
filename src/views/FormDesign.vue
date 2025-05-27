<template>
  <div class="form-designer">
    <!-- 数据源配置区域 -->
    <div class="datasource-config">
      <el-card shadow="never" class="config-card">
        <template #header>
          <div class="card-header">
            <span>数据源配置</span>
            <el-tag v-if="selectedDataSource" type="success" size="small">
              {{ selectedDataSource.name }}
            </el-tag>
          </div>
        </template>
        
        <el-row :gutter="20">
          <el-col :span="6">
            <el-form-item label="目标数据库">
              <el-select
                v-model="selectedDataSourceId"
                placeholder="请选择数据库"
                @change="handleDataSourceChange"
                style="width: 100%"
              >
                <el-option
                  v-for="ds in dataSources"
                  :key="ds.id"
                  :label="ds.name"
                  :value="ds.id"
                >
                  <span style="float: left">{{ ds.name }}</span>
                  <span style="float: right; color: #8492a6; font-size: 13px">
                    {{ ds.type }}
                  </span>
                </el-option>
              </el-select>
            </el-form-item>
          </el-col>
          
          <el-col :span="6">
            <el-form-item label="数据表">
              <el-select
                v-model="selectedTableName"
                placeholder="选择已有表或留空新建"
                @change="handleTableChange"
                style="width: 100%"
                clearable
              >
                <el-option
                  v-for="table in tables"
                  :key="table.name"
                  :label="table.name"
                  :value="table.name"
                >
                  <span style="float: left">{{ table.name }}</span>
                  <span style="float: right; color: #8492a6; font-size: 13px">
                    {{ table.description }}
                  </span>
                </el-option>
              </el-select>
            </el-form-item>
          </el-col>
          
          <el-col :span="6">
            <el-form-item label="表名称">
              <el-input
                v-model="formSchema.tableName"
                placeholder="自动生成或手动输入"
                :disabled="!!selectedTableName"
              />
            </el-form-item>
          </el-col>
          
          <el-col :span="6">
            <div class="config-actions">
              <el-button
                v-if="selectedTableName"
                type="primary"
                @click="loadTableFields"
                :loading="loadingTableFields"
              >
                从表结构生成字段
              </el-button>
              <el-button
                v-if="!selectedDataSourceId"
                type="warning"
                disabled
              >
                请先选择数据库
              </el-button>
            </div>
          </el-col>
        </el-row>
      </el-card>
    </div>

    <!-- 顶部工具栏 -->
    <div class="toolbar">
      <div class="toolbar-left">
        <el-button 
          type="primary" 
          @click="saveForm"
          :disabled="!selectedDataSourceId"
        >
          <el-icon><DocumentAdd /></el-icon>
          保存表单
        </el-button>
        <el-button @click="previewForm">
          <el-icon><View /></el-icon>
          预览
        </el-button>
        <el-button @click="clearForm">
          <el-icon><Delete /></el-icon>
          清空
        </el-button>
      </div>
      <div class="toolbar-right">
        <el-input
          v-model="formSchema.formName"
          placeholder="请输入表单名称"
          style="width: 200px;"
          @input="handleFormNameChange"
        />
      </div>
    </div>

    <!-- 主要内容区域 -->
    <div class="designer-content">
      <!-- 左侧组件面板 -->
      <div class="left-panel">
        <div class="panel-header">
          <h3>组件库</h3>
        </div>
        <div class="component-list">
          <div class="component-group">
            <h4>基础组件</h4>
            <div
              v-for="component in basicComponents"
              :key="component.type"
              class="component-item"
              draggable="true"
              @dragstart="handleDragStart($event, component)"
            >
              <el-icon>
                <component :is="component.icon" />
              </el-icon>
              <span>{{ component.label }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 中间设计区域 -->
      <div class="center-panel">
        <div class="design-canvas"
             @drop="handleDrop"
             @dragover.prevent
             @dragenter.prevent>
          <div v-if="formSchema.fields.length === 0" class="empty-canvas">
            <el-icon class="empty-icon"><Plus /></el-icon>
            <p>拖拽左侧组件到此处开始设计表单</p>
          </div>
          <div
            v-for="(field, index) in formSchema.fields"
            :key="field.id"
            class="form-field"
            :class="{ active: selectedFieldIndex === index }"
            @click="selectField(index)"
            @contextmenu.prevent="showContextMenu($event, index)"
            :style="{ position: 'relative' }"
          >
            <div class="field-wrapper">
              <!-- 文本输入框 -->
              <div v-if="field.type === 'text'" class="field-preview" :style="getFieldStyle(field)">
                <label>{{ field.label }}</label>
                <el-input
                  :placeholder="field.placeholder"
                  disabled
                />
              </div>
              
              <!-- 数字输入框 -->
              <div v-else-if="field.type === 'number'" class="field-preview" :style="getFieldStyle(field)">
                <label>{{ field.label }}</label>
                <el-input-number
                  :placeholder="field.placeholder"
                  disabled
                />
              </div>
              
              <!-- 选择框 -->
              <div v-else-if="field.type === 'select'" class="field-preview" :style="getFieldStyle(field)">
                <label>{{ field.label }}</label>
                <el-select
                  :placeholder="field.placeholder"
                  disabled
                  style="width: 100%"
                >
                  <el-option
                    v-for="option in field.options"
                    :key="option"
                    :label="option"
                    :value="option"
                  />
                </el-select>
              </div>
              
              <!-- 单选框 -->
              <div v-else-if="field.type === 'radio'" class="field-preview" :style="getFieldStyle(field)">
                <label>{{ field.label }}</label>
                <el-radio-group disabled>
                  <el-radio
                    v-for="option in field.options"
                    :key="option"
                    :label="option"
                  >
                    {{ option }}
                  </el-radio>
                </el-radio-group>
              </div>
              
              <!-- 多选框 -->
              <div v-else-if="field.type === 'checkbox'" class="field-preview" :style="getFieldStyle(field)">
                <label>{{ field.label }}</label>
                <el-checkbox-group disabled>
                  <el-checkbox
                    v-for="option in field.options"
                    :key="option"
                    :label="option"
                  >
                    {{ option }}
                  </el-checkbox>
                </el-checkbox-group>
              </div>
              
              <!-- 日期选择器 -->
              <div v-else-if="field.type === 'date'" class="field-preview" :style="getFieldStyle(field)">
                <label>{{ field.label }}</label>
                <el-date-picker
                  type="date"
                  :placeholder="field.placeholder"
                  disabled
                  style="width: 100%"
                />
              </div>
              
              <!-- 文本域 -->
              <div v-else-if="field.type === 'textarea'" class="field-preview" :style="getFieldStyle(field)">
                <label>{{ field.label }}</label>
                <el-input
                  type="textarea"
                  :placeholder="field.placeholder"
                  disabled
                />
              </div>
            </div>
            
            <!-- 字段操作按钮 -->
            <div class="field-actions">
              <el-button
                size="small"
                type="danger"
                circle
                @click.stop="removeField(index)"
              >
                <el-icon><Delete /></el-icon>
              </el-button>
            </div>
            
            <!-- 拖拽手柄 -->
            <div 
              class="drag-handle"
              @mousedown="startDrag($event, index)"
            >
              <el-icon><Grid /></el-icon>
            </div>
            
            <!-- 调节大小手柄 -->
            <div class="resize-handles" v-if="selectedFieldIndex === index">
              <!-- 右边调节宽度 -->
              <div 
                class="resize-handle resize-handle-right"
                @mousedown="startResize($event, index, 'right')"
              ></div>
              <!-- 下边调节高度 -->
              <div 
                class="resize-handle resize-handle-bottom"
                @mousedown="startResize($event, index, 'bottom')"
              ></div>
              <!-- 右下角调节宽高 -->
              <div 
                class="resize-handle resize-handle-corner"
                @mousedown="startResize($event, index, 'corner')"
              ></div>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧属性面板 -->
      <div class="right-panel">
        <el-tabs v-model="activeTab" type="border-card">
          <!-- 字段属性 -->
          <el-tab-pane label="字段属性" name="field">
            <div v-if="selectedField" class="property-form">
              <el-form label-width="80px" size="small">
                <el-form-item label="字段名">
                  <el-input v-model="selectedField.field" />
                </el-form-item>
                <el-form-item label="标签">
                  <el-input v-model="selectedField.label" />
                </el-form-item>
                <el-form-item label="占位符">
                  <el-input v-model="selectedField.placeholder" />
                </el-form-item>
                <el-form-item label="必填">
                  <el-switch v-model="selectedField.required" />
                </el-form-item>
                <el-form-item v-if="['select', 'radio', 'checkbox'].includes(selectedField.type)" label="选项">
                  <div class="options-editor">
                    <div
                      v-for="(option, index) in selectedField.options"
                      :key="index"
                      class="option-item"
                    >
                      <el-input
                        v-model="selectedField.options[index]"
                        size="small"
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
                    >
                      添加选项
                    </el-button>
                  </div>
                </el-form-item>
              </el-form>
            </div>
            <div v-else class="no-selection">
              <p>请选择一个字段来编辑属性</p>
            </div>
          </el-tab-pane>

          <!-- 样式配置 -->
          <el-tab-pane label="样式配置" name="style">
            <div v-if="selectedField" class="style-form">
              <el-form label-width="100px" size="small">
                <!-- 布局样式 -->
                <el-divider content-position="left">布局样式</el-divider>
                <el-form-item label="宽度">
                  <el-select v-model="selectedField.style.width" placeholder="选择宽度">
                    <el-option label="自动" value="auto" />
                    <el-option label="25%" value="25%" />
                    <el-option label="50%" value="50%" />
                    <el-option label="75%" value="75%" />
                    <el-option label="100%" value="100%" />
                    <el-option label="自定义" value="custom" />
                  </el-select>
                  <el-input
                    v-if="selectedField.style.width === 'custom'"
                    v-model="selectedField.style.customWidth"
                    placeholder="例如: 200px"
                    style="margin-top: 8px"
                  />
                </el-form-item>
                
                <el-form-item label="对齐方式">
                  <el-radio-group v-model="selectedField.style.textAlign">
                    <el-radio label="left">左对齐</el-radio>
                    <el-radio label="center">居中</el-radio>
                    <el-radio label="right">右对齐</el-radio>
                  </el-radio-group>
                </el-form-item>

                <el-form-item label="外边距">
                  <el-row :gutter="8">
                    <el-col :span="6">
                      <el-input
                        v-model="selectedField.style.marginTop"
                        placeholder="上"
                        size="small"
                      />
                    </el-col>
                    <el-col :span="6">
                      <el-input
                        v-model="selectedField.style.marginRight"
                        placeholder="右"
                        size="small"
                      />
                    </el-col>
                    <el-col :span="6">
                      <el-input
                        v-model="selectedField.style.marginBottom"
                        placeholder="下"
                        size="small"
                      />
                    </el-col>
                    <el-col :span="6">
                      <el-input
                        v-model="selectedField.style.marginLeft"
                        placeholder="左"
                        size="small"
                      />
                    </el-col>
                  </el-row>
                </el-form-item>

                <el-form-item label="内边距">
                  <el-row :gutter="8">
                    <el-col :span="6">
                      <el-input
                        v-model="selectedField.style.paddingTop"
                        placeholder="上"
                        size="small"
                      />
                    </el-col>
                    <el-col :span="6">
                      <el-input
                        v-model="selectedField.style.paddingRight"
                        placeholder="右"
                        size="small"
                      />
                    </el-col>
                    <el-col :span="6">
                      <el-input
                        v-model="selectedField.style.paddingBottom"
                        placeholder="下"
                        size="small"
                      />
                    </el-col>
                    <el-col :span="6">
                      <el-input
                        v-model="selectedField.style.paddingLeft"
                        placeholder="左"
                        size="small"
                      />
                    </el-col>
                  </el-row>
                </el-form-item>

                <!-- 字体样式 -->
                <el-divider content-position="left">字体样式</el-divider>
                <el-form-item label="字体大小">
                  <el-select v-model="selectedField.style.fontSize" placeholder="选择字体大小">
                    <el-option label="12px" value="12px" />
                    <el-option label="14px" value="14px" />
                    <el-option label="16px" value="16px" />
                    <el-option label="18px" value="18px" />
                    <el-option label="20px" value="20px" />
                    <el-option label="24px" value="24px" />
                  </el-select>
                </el-form-item>

                <el-form-item label="字体粗细">
                  <el-select v-model="selectedField.style.fontWeight" placeholder="选择字体粗细">
                    <el-option label="正常" value="normal" />
                    <el-option label="粗体" value="bold" />
                    <el-option label="细体" value="lighter" />
                  </el-select>
                </el-form-item>

                <el-form-item label="字体颜色">
                  <el-color-picker v-model="selectedField.style.color" />
                </el-form-item>

                <!-- 背景样式 -->
                <el-divider content-position="left">背景样式</el-divider>
                <el-form-item label="背景颜色">
                  <el-color-picker v-model="selectedField.style.backgroundColor" />
                </el-form-item>

                <!-- 边框样式 -->
                <el-divider content-position="left">边框样式</el-divider>
                <el-form-item label="边框宽度">
                  <el-input
                    v-model="selectedField.style.borderWidth"
                    placeholder="例如: 1px"
                  />
                </el-form-item>

                <el-form-item label="边框样式">
                  <el-select v-model="selectedField.style.borderStyle" placeholder="选择边框样式">
                    <el-option label="无" value="none" />
                    <el-option label="实线" value="solid" />
                    <el-option label="虚线" value="dashed" />
                    <el-option label="点线" value="dotted" />
                  </el-select>
                </el-form-item>

                <el-form-item label="边框颜色">
                  <el-color-picker v-model="selectedField.style.borderColor" />
                </el-form-item>

                <el-form-item label="圆角">
                  <el-input
                    v-model="selectedField.style.borderRadius"
                    placeholder="例如: 4px"
                  />
                </el-form-item>

                <!-- 阴影效果 -->
                <el-divider content-position="left">阴影效果</el-divider>
                <el-form-item label="阴影">
                  <el-input
                    v-model="selectedField.style.boxShadow"
                    placeholder="例如: 0 2px 4px rgba(0,0,0,0.1)"
                  />
                </el-form-item>

                <!-- 样式预设 -->
                <el-divider content-position="left">样式预设</el-divider>
                <el-form-item label="预设样式">
                  <el-select v-model="stylePreset" @change="applyStylePreset" placeholder="选择预设样式">
                    <el-option label="默认样式" value="default" />
                    <el-option label="卡片样式" value="card" />
                    <el-option label="简约样式" value="minimal" />
                    <el-option label="强调样式" value="emphasis" />
                    <el-option label="警告样式" value="warning" />
                  </el-select>
                </el-form-item>

                <el-form-item>
                  <el-button type="primary" size="small" @click="resetFieldStyle">
                    重置样式
                  </el-button>
                  <el-button type="success" size="small" @click="copyFieldStyle">
                    复制样式
                  </el-button>
                  <el-button 
                    type="warning" 
                    size="small" 
                    @click="pasteFieldStyle"
                    :disabled="!copiedStyle"
                  >
                    粘贴样式
                  </el-button>
                </el-form-item>
              </el-form>
            </div>
            <div v-else class="no-selection">
              <p>请选择一个字段来配置样式</p>
            </div>
          </el-tab-pane>

          <!-- 数据配置 -->
          <el-tab-pane label="数据配置" name="data">
            <div class="data-config">
              <el-form label-width="100px" size="small">
                <el-form-item label="接口路径">
                  <el-input
                    v-model="formSchema.apiEndpoint"
                    placeholder="例如: /api/data"
                  />
                  <div class="form-help">表单提交时的API接口地址</div>
                </el-form-item>
              </el-form>

              <div class="field-mapping">
                <h4>字段映射配置</h4>
                <div class="mapping-help">
                  配置表单字段与数据模型的映射关系
                </div>
                <el-table
                  :data="fieldMappingList"
                  size="small"
                  border
                  style="width: 100%"
                >
                  <el-table-column prop="field" label="字段名" width="100">
                    <template #default="{ row }">
                      <span>{{ row.field }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column prop="label" label="标签" width="100">
                    <template #default="{ row }">
                      <span>{{ row.label }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column prop="mapping" label="映射名称">
                    <template #default="{ row }">
                      <el-input
                        v-model="formSchema.fieldMapping[row.field]"
                        placeholder="例如: patient_name"
                        size="small"
                      />
                    </template>
                  </el-table-column>
                </el-table>
              </div>

              <div class="schema-preview">
                <h4>Schema预览</h4>
                <el-input
                  type="textarea"
                  :value="formSchemaJson"
                  readonly
                  :rows="10"
                  style="font-family: monospace; font-size: 12px;"
                />
              </div>
            </div>
          </el-tab-pane>
        </el-tabs>
      </div>
    </div>

    <!-- 预览对话框 -->
    <el-dialog
      v-model="previewVisible"
      title="表单预览"
      width="60%"
      :before-close="closePreview"
    >
      <div class="form-preview">
        <h3>{{ formSchema.formName || '未命名表单' }}</h3>
        <el-form label-width="120px">
          <el-form-item
            v-for="field in formSchema.fields"
            :key="field.id"
            :label="field.label"
            :required="field.required"
          >
            <!-- 根据字段类型渲染不同的组件 -->
            <el-input
              v-if="field.type === 'text'"
              :placeholder="field.placeholder"
            />
            <el-input-number
              v-else-if="field.type === 'number'"
              :placeholder="field.placeholder"
            />
            <el-select
              v-else-if="field.type === 'select'"
              :placeholder="field.placeholder"
              style="width: 100%"
            >
              <el-option
                v-for="option in field.options"
                :key="option"
                :label="option"
                :value="option"
              />
            </el-select>
            <el-radio-group v-else-if="field.type === 'radio'">
              <el-radio
                v-for="option in field.options"
                :key="option"
                :label="option"
              >
                {{ option }}
              </el-radio>
            </el-radio-group>
            <el-checkbox-group v-else-if="field.type === 'checkbox'">
              <el-checkbox
                v-for="option in field.options"
                :key="option"
                :label="option"
              >
                {{ option }}
              </el-checkbox>
            </el-checkbox-group>
            <el-date-picker
              v-else-if="field.type === 'date'"
              type="date"
              :placeholder="field.placeholder"
              style="width: 100%"
            />
            <el-input
              v-else-if="field.type === 'textarea'"
              type="textarea"
              :placeholder="field.placeholder"
            />
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <el-button @click="closePreview">关闭</el-button>
      </template>
    </el-dialog>
    
    <!-- 右键菜单 -->
    <div 
      v-if="contextMenuVisible"
      class="context-menu"
      :style="{ left: contextMenuPosition.x + 'px', top: contextMenuPosition.y + 'px' }"
      @click.stop
    >
      <div class="menu-item" @click="duplicateField">
        <el-icon><DocumentAdd /></el-icon>
        <span>复制字段</span>
      </div>
      <div class="menu-item" @click="moveFieldUp">
        <el-icon><Top /></el-icon>
        <span>上移</span>
      </div>
      <div class="menu-item" @click="moveFieldDown">
        <el-icon><Bottom /></el-icon>
        <span>下移</span>
      </div>
      <div class="menu-item" @click="copyFieldStyle">
        <el-icon><CopyDocument /></el-icon>
        <span>复制样式</span>
      </div>
      <div class="menu-item" @click="pasteFieldStyle" :class="{ disabled: !copiedStyle }">
        <el-icon><Document /></el-icon>
        <span>粘贴样式</span>
      </div>
      <div class="menu-divider"></div>
      <div class="menu-item danger" @click="removeCurrentField">
        <el-icon><Delete /></el-icon>
        <span>删除字段</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, onMounted, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import {
  DocumentAdd,
  View,
  Delete,
  Plus,
  Edit,
  Calendar,
  List,
  Select,
  Grid,
  Top,
  Bottom,
  CopyDocument,
  Document
} from '@element-plus/icons-vue'
import { 
  dataSourceApi
} from '@/api/dataSource'
import type { DataSource, TableInfo, FieldInfo } from '@/types/dataManagement'

// 字段类型定义
interface FormField {
  id: string
  type: string
  field: string
  label: string
  placeholder?: string
  required: boolean
  options?: string[]
  style: {
    // 布局样式
    width: string
    height: string
    customWidth?: string
    textAlign: string
    marginTop: string
    marginRight: string
    marginBottom: string
    marginLeft: string
    paddingTop: string
    paddingRight: string
    paddingBottom: string
    paddingLeft: string
    
    // 字体样式
    fontSize: string
    fontWeight: string
    color: string
    
    // 背景样式
    backgroundColor: string
    
    // 边框样式
    borderWidth: string
    borderStyle: string
    borderColor: string
    borderRadius: string
    
    // 阴影效果
    boxShadow: string
  }
}

// 表单Schema定义
interface FormSchema {
  formName: string
  fields: FormField[]
  apiEndpoint: string
  fieldMapping: Record<string, string>
  tableName: string
  dataSourceId?: number
}

// 基础组件配置
const basicComponents = [
  { type: 'text', label: '文本输入', icon: Edit },
  { type: 'number', label: '数字输入', icon: Grid },
  { type: 'select', label: '下拉选择', icon: Select },
  { type: 'radio', label: '单选框', icon: List },
  { type: 'checkbox', label: '多选框', icon: List },
  { type: 'date', label: '日期选择', icon: Calendar },
  { type: 'textarea', label: '多行文本', icon: Edit }
]

// 表单Schema
const formSchema = reactive<FormSchema>({
  formName: '医疗表单',
  fields: [],
  apiEndpoint: '/api/data',
  fieldMapping: {},
  tableName: '',
  dataSourceId: undefined
})

// 数据源相关状态
const dataSources = ref<DataSource[]>([])
const selectedDataSourceId = ref<number>()
const selectedDataSource = computed(() => 
  dataSources.value.find(ds => ds.id === selectedDataSourceId.value)
)

const tables = ref<TableInfo[]>([])
const selectedTableName = ref<string>('')
const loadingTableFields = ref(false)

// 其他状态
const selectedFieldIndex = ref<number>(-1)
const selectedField = computed(() => {
  return selectedFieldIndex.value >= 0 ? formSchema.fields[selectedFieldIndex.value] : null
})

// 当前激活的标签页
const activeTab = ref('field')

// 预览对话框
const previewVisible = ref(false)

// 字段映射列表
const fieldMappingList = computed(() => {
  return formSchema.fields.map(field => ({
    field: field.field,
    label: field.label,
    type: field.type
  }))
})

// Schema预览
const formSchemaJson = computed(() => {
  return JSON.stringify(formSchema, null, 2)
})

// 拖拽组件变量
let draggedComponent: any = null

const handleDragStart = (event: DragEvent, component: any) => {
  draggedComponent = component
}

// 拖拽相关
const isDragging = ref(false)
const dragStartPosition = ref({ x: 0, y: 0 })
const dragFieldIndex = ref(-1)

// 调节大小相关
const isResizing = ref(false)
const resizeStartPosition = ref({ x: 0, y: 0 })
const resizeFieldIndex = ref(-1)
const resizeDirection = ref('')
const originalSize = ref({ width: 0, height: 0 })

const handleDrop = (event: DragEvent) => {
  event.preventDefault()
  if (draggedComponent) {
    addField(draggedComponent)
    draggedComponent = null
  }
}

// 添加字段
const addField = (component: any) => {
  const fieldId = `field_${Date.now()}`
  const newField: FormField = {
    id: fieldId,
    type: component.type,
    field: `field_${formSchema.fields.length + 1}`,
    label: component.label,
    placeholder: `请输入${component.label}`,
    required: false,
    options: ['select', 'radio', 'checkbox'].includes(component.type) ? ['选项1', '选项2'] : undefined,
    style: {
      width: 'auto',
      height: 'auto',
      textAlign: 'left',
      marginTop: '0',
      marginRight: '0',
      marginBottom: '0',
      marginLeft: '0',
      paddingTop: '0',
      paddingRight: '0',
      paddingBottom: '0',
      paddingLeft: '0',
      fontSize: '14px',
      fontWeight: 'normal',
      color: '#303133',
      backgroundColor: 'transparent',
      borderWidth: '1px',
      borderStyle: 'solid',
      borderColor: '#dcdfe6',
      borderRadius: '4px',
      boxShadow: 'none'
    }
  }
  
  formSchema.fields.push(newField)
  formSchema.fieldMapping[newField.field] = newField.field
  selectedFieldIndex.value = formSchema.fields.length - 1
}

// 选择字段
const selectField = (index: number) => {
  selectedFieldIndex.value = index
  activeTab.value = 'field'
}

// 删除字段
const removeField = (index: number) => {
  const field = formSchema.fields[index]
  delete formSchema.fieldMapping[field.field]
  formSchema.fields.splice(index, 1)
  if (selectedFieldIndex.value === index) {
    selectedFieldIndex.value = -1
  } else if (selectedFieldIndex.value > index) {
    selectedFieldIndex.value--
  }
}

// 添加选项
const addOption = () => {
  if (selectedField.value && selectedField.value.options) {
    selectedField.value.options.push(`选项${selectedField.value.options.length + 1}`)
  }
}

// 删除选项
const removeOption = (index: number) => {
  if (selectedField.value && selectedField.value.options) {
    selectedField.value.options.splice(index, 1)
  }
}

// 保存表单
const saveForm = () => {
  if (!selectedDataSourceId.value) {
    ElMessage.warning('请先选择目标数据库')
    return
  }
  if (!formSchema.formName) {
    ElMessage.warning('请输入表单名称')
    return
  }
  if (formSchema.fields.length === 0) {
    ElMessage.warning('请至少添加一个字段')
    return
  }
  
  // 设置数据源ID
  formSchema.dataSourceId = selectedDataSourceId.value
  
  // 如果没有选择已有表，根据表单名称生成表名
  if (!selectedTableName.value && !formSchema.tableName) {
    formSchema.tableName = generateTableName(formSchema.formName)
  }
  
  console.log('保存表单Schema:', formSchema)
  ElMessage.success('表单保存成功')
}

// 预览表单
const previewForm = () => {
  if (formSchema.fields.length === 0) {
    ElMessage.warning('请至少添加一个字段')
    return
  }
  previewVisible.value = true
}

// 关闭预览
const closePreview = () => {
  previewVisible.value = false
}

// 清空表单
const clearForm = () => {
  formSchema.fields = []
  formSchema.fieldMapping = {}
  formSchema.tableName = ''
  selectedFieldIndex.value = -1
  selectedTableName.value = ''
  ElMessage.success('表单已清空')
}

// 处理表单名称变化
const handleFormNameChange = () => {
  if (!selectedTableName.value) {
    formSchema.tableName = generateTableName(formSchema.formName)
  }
}

// 处理数据源变化
const handleDataSourceChange = async () => {
  if (!selectedDataSourceId.value) return
  
  try {
    tables.value = await dataSourceApi.getTablesBySourceId(selectedDataSourceId.value)
  } catch (error) {
    console.error('获取数据表失败:', error)
    ElMessage.error('获取数据表失败')
  }
}

// 处理表变化
const handleTableChange = (tableName: string) => {
  if (tableName) {
    formSchema.tableName = tableName
  } else {
    formSchema.tableName = generateTableName(formSchema.formName)
  }
}

// 加载表字段
const loadTableFields = async () => {
  if (!selectedDataSourceId.value || !selectedTableName.value) return
  
  loadingTableFields.value = true
  try {
    const tableFields = await dataSourceApi.getFieldsByTable(selectedDataSourceId.value, selectedTableName.value)
    
    // 清空现有字段
    formSchema.fields = []
    formSchema.fieldMapping = {}
    
    // 根据表字段生成表单字段
    tableFields.forEach((field: FieldInfo, index: number) => {
      const fieldType = getFieldTypeFromDbType(field.dataType)
      const newField: FormField = {
        id: `field_${Date.now()}_${index}`,
        type: fieldType,
        field: field.name,
        label: field.description || field.name,
        placeholder: `请输入${field.description || field.name}`,
        required: !field.isNullable,
        options: fieldType === 'select' ? ['选项1', '选项2'] : undefined,
        style: {
          width: 'auto',
          height: 'auto',
          textAlign: 'left',
          marginTop: '0',
          marginRight: '0',
          marginBottom: '0',
          marginLeft: '0',
          paddingTop: '0',
          paddingRight: '0',
          paddingBottom: '0',
          paddingLeft: '0',
          fontSize: '14px',
          fontWeight: 'normal',
          color: '#303133',
          backgroundColor: 'transparent',
          borderWidth: '1px',
          borderStyle: 'solid',
          borderColor: '#dcdfe6',
          borderRadius: '4px',
          boxShadow: 'none'
        }
      }
      
      formSchema.fields.push(newField)
      formSchema.fieldMapping[newField.field] = field.name
    })
    
    ElMessage.success(`成功生成 ${tableFields.length} 个字段`)
  } catch (error) {
    console.error('获取表字段失败:', error)
    ElMessage.error('获取表字段失败')
  } finally {
    loadingTableFields.value = false
  }
}

// 根据数据库字段类型推断表单字段类型
const getFieldTypeFromDbType = (dbType: string): string => {
  const type = dbType.toLowerCase()
  if (type.includes('int') || type.includes('decimal') || type.includes('float') || type.includes('double')) {
    return 'number'
  } else if (type.includes('date') || type.includes('time')) {
    return 'date'
  } else if (type.includes('text') || type.includes('longtext')) {
    return 'textarea'
  } else {
    return 'text'
  }
}

// 生成表名
const generateTableName = (formName: string): string => {
  if (!formName) return ''
  return formName
    .replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_')
    .replace(/^_+|_+$/g, '')
    .toLowerCase() + '_form'
}

// 样式配置相关
const stylePreset = ref('')
const copiedStyle = ref<any>(null)

// 默认样式配置
const getDefaultStyle = () => ({
  width: 'auto',
  height: 'auto',
  textAlign: 'left',
  marginTop: '0',
  marginRight: '0',
  marginBottom: '0',
  marginLeft: '0',
  paddingTop: '0',
  paddingRight: '0',
  paddingBottom: '0',
  paddingLeft: '0',
  fontSize: '14px',
  fontWeight: 'normal',
  color: '#303133',
  backgroundColor: 'transparent',
  borderWidth: '1px',
  borderStyle: 'solid',
  borderColor: '#dcdfe6',
  borderRadius: '4px',
  boxShadow: 'none'
})

// 样式预设配置
const stylePresets: Record<string, any> = {
  default: getDefaultStyle(),
  card: {
    ...getDefaultStyle(),
    backgroundColor: '#ffffff',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: '#e4e7ed',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    paddingTop: '12px',
    paddingRight: '16px',
    paddingBottom: '12px',
    paddingLeft: '16px'
  },
  minimal: {
    ...getDefaultStyle(),
    borderStyle: 'none',
    backgroundColor: 'transparent',
    fontSize: '14px',
    color: '#606266'
  },
  emphasis: {
    ...getDefaultStyle(),
    backgroundColor: '#f0f9ff',
    borderWidth: '2px',
    borderStyle: 'solid',
    borderColor: '#409eff',
    borderRadius: '6px',
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#409eff'
  },
  warning: {
    ...getDefaultStyle(),
    backgroundColor: '#fef0e6',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: '#e6a23c',
    borderRadius: '4px',
    color: '#e6a23c'
  }
}

// 应用样式预设
const applyStylePreset = (presetName: string) => {
  if (!selectedField.value || !presetName || !stylePresets[presetName]) return
  
  Object.assign(selectedField.value.style, stylePresets[presetName])
  ElMessage.success(`已应用${presetName}样式预设`)
}

// 重置字段样式
const resetFieldStyle = () => {
  if (!selectedField.value) return
  
  Object.assign(selectedField.value.style, getDefaultStyle())
  stylePreset.value = ''
  ElMessage.success('样式已重置为默认值')
}

// 复制字段样式
const copyFieldStyle = () => {
  if (contextMenuFieldIndex.value >= 0) {
    const field = formSchema.fields[contextMenuFieldIndex.value]
    copiedStyle.value = { ...field.style }
    ElMessage.success('样式已复制')
  }
  hideContextMenu()
}

// 粘贴字段样式
const pasteFieldStyle = () => {
  if (contextMenuFieldIndex.value >= 0 && copiedStyle.value) {
    const field = formSchema.fields[contextMenuFieldIndex.value]
    field.style = { ...copiedStyle.value }
    ElMessage.success('样式已粘贴')
  }
  hideContextMenu()
}

// 计算字段的内联样式
const getFieldStyle = (field: FormField) => {
  const style = field.style
  const computedStyle: any = {}
  
  // 宽度处理
  if (style.width === 'custom' && style.customWidth) {
    computedStyle.width = style.customWidth
  } else if (style.width !== 'auto') {
    computedStyle.width = style.width
  }
  
  // 对齐方式
  if (style.textAlign) {
    computedStyle.textAlign = style.textAlign
  }
  
  // 外边距
  if (style.marginTop) computedStyle.marginTop = style.marginTop
  if (style.marginRight) computedStyle.marginRight = style.marginRight
  if (style.marginBottom) computedStyle.marginBottom = style.marginBottom
  if (style.marginLeft) computedStyle.marginLeft = style.marginLeft
  
  // 内边距
  if (style.paddingTop) computedStyle.paddingTop = style.paddingTop
  if (style.paddingRight) computedStyle.paddingRight = style.paddingRight
  if (style.paddingBottom) computedStyle.paddingBottom = style.paddingBottom
  if (style.paddingLeft) computedStyle.paddingLeft = style.paddingLeft
  
  // 字体样式
  if (style.fontSize) computedStyle.fontSize = style.fontSize
  if (style.fontWeight) computedStyle.fontWeight = style.fontWeight
  if (style.color) computedStyle.color = style.color
  
  // 背景颜色
  if (style.backgroundColor && style.backgroundColor !== 'transparent') {
    computedStyle.backgroundColor = style.backgroundColor
  }
  
  // 边框样式
  if (style.borderWidth && style.borderStyle && style.borderColor) {
    computedStyle.border = `${style.borderWidth} ${style.borderStyle} ${style.borderColor}`
  }
  if (style.borderRadius) {
    computedStyle.borderRadius = style.borderRadius
  }
  
  // 阴影效果
  if (style.boxShadow && style.boxShadow !== 'none') {
    computedStyle.boxShadow = style.boxShadow
  }
  
  return computedStyle
}

// 初始化数据
onMounted(async () => {
  try {
    dataSources.value = await dataSourceApi.getAllDataSources()
    document.addEventListener('click', handleDocumentClick)
  } catch (error) {
    console.error('获取数据源失败:', error)
    ElMessage.error('获取数据源失败')
  }
})

// 组件卸载时移除监听器
onUnmounted(() => {
  document.removeEventListener('click', handleDocumentClick)
})

// 右键菜单相关
const contextMenuVisible = ref(false)
const contextMenuPosition = ref({ x: 0, y: 0 })
const contextMenuFieldIndex = ref(-1)

const showContextMenu = (event: MouseEvent, index: number) => {
  event.preventDefault()
  contextMenuVisible.value = true
  contextMenuPosition.value = { x: event.clientX, y: event.clientY }
  contextMenuFieldIndex.value = index
  selectedFieldIndex.value = index
}

const hideContextMenu = () => {
  contextMenuVisible.value = false
  contextMenuFieldIndex.value = -1
}

// 调节大小功能
const startResize = (event: MouseEvent, index: number, direction: string) => {
  event.preventDefault()
  event.stopPropagation()
  
  isResizing.value = true
  resizeFieldIndex.value = index
  resizeDirection.value = direction
  resizeStartPosition.value = { x: event.clientX, y: event.clientY }
  
  const field = formSchema.fields[index]
  const fieldElement = (event.target as HTMLElement).closest('.form-field')
  
  if (fieldElement) {
    const rect = fieldElement.getBoundingClientRect()
    originalSize.value = { 
      width: rect.width, 
      height: rect.height 
    }
    fieldElement.classList.add('resizing')
  }
  
  const handleMouseMove = (e: MouseEvent) => {
    if (!isResizing.value) return
    
    const deltaX = e.clientX - resizeStartPosition.value.x
    const deltaY = e.clientY - resizeStartPosition.value.y
    
    const field = formSchema.fields[resizeFieldIndex.value]
    
    if (direction === 'right') {
      // 调节宽度
      const newWidth = Math.max(100, originalSize.value.width + deltaX)
      field.style.width = 'custom'
      field.style.customWidth = `${newWidth}px`
    } else if (direction === 'bottom') {
      // 调节高度（主要针对textarea）
      if (field.type === 'textarea') {
        const newHeight = Math.max(60, originalSize.value.height + deltaY)
        if (!field.style.height) field.style.height = `${newHeight}px`
        else field.style.height = `${newHeight}px`
      }
    } else if (direction === 'corner') {
      // 同时调节宽高
      const newWidth = Math.max(100, originalSize.value.width + deltaX)
      const newHeight = Math.max(60, originalSize.value.height + deltaY)
      
      field.style.width = 'custom'
      field.style.customWidth = `${newWidth}px`
      
      if (field.type === 'textarea') {
        field.style.height = `${newHeight}px`
      }
    }
  }
  
  const handleMouseUp = () => {
    isResizing.value = false
    resizeFieldIndex.value = -1
    resizeDirection.value = ''
    
    if (fieldElement) {
      fieldElement.classList.remove('resizing')
    }
    
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', handleMouseUp)
  }
  
  document.addEventListener('mousemove', handleMouseMove)
  document.addEventListener('mouseup', handleMouseUp)
}

// 拖拽功能
const startDrag = (event: MouseEvent, index: number) => {
  event.preventDefault()
  event.stopPropagation()
  isDragging.value = true
  dragFieldIndex.value = index
  dragStartPosition.value = { x: event.clientX, y: event.clientY }
  
  // 添加拖拽样式
  const fieldElement = (event.target as HTMLElement).closest('.form-field')
  if (fieldElement) {
    fieldElement.classList.add('dragging')
  }
  
  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging.value) return
    
    const deltaY = e.clientY - dragStartPosition.value.y
    const threshold = 50 // 拖拽阈值
    
    if (Math.abs(deltaY) > threshold) {
      const direction = deltaY > 0 ? 'down' : 'up'
      moveField(dragFieldIndex.value, direction)
      dragStartPosition.value = { x: e.clientX, y: e.clientY }
    }
  }
  
  const handleMouseUp = () => {
    isDragging.value = false
    dragFieldIndex.value = -1
    
    // 移除拖拽样式
    if (fieldElement) {
      fieldElement.classList.remove('dragging')
    }
    
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', handleMouseUp)
  }
  
  document.addEventListener('mousemove', handleMouseMove)
  document.addEventListener('mouseup', handleMouseUp)
}

// 点击外部关闭右键菜单
const handleDocumentClick = (event: MouseEvent) => {
  if (contextMenuVisible.value) {
    const contextMenu = document.querySelector('.context-menu')
    if (contextMenu && !contextMenu.contains(event.target as Node)) {
      hideContextMenu()
    }
  }
}

// 移动字段
const moveField = (fromIndex: number, direction: 'up' | 'down') => {
  const toIndex = direction === 'up' ? fromIndex - 1 : fromIndex + 1
  
  if (toIndex < 0 || toIndex >= formSchema.fields.length) return
  
  const field = formSchema.fields.splice(fromIndex, 1)[0]
  formSchema.fields.splice(toIndex, 0, field)
  
  // 更新选中的字段索引
  if (selectedFieldIndex.value === fromIndex) {
    selectedFieldIndex.value = toIndex
  }
}

// 右键菜单功能
const duplicateField = () => {
  if (contextMenuFieldIndex.value >= 0) {
    const originalField = formSchema.fields[contextMenuFieldIndex.value]
    const newField: FormField = {
      ...originalField,
      id: Date.now().toString(),
      field: originalField.field + '_copy',
      label: originalField.label + ' (副本)',
      style: { ...originalField.style }
    }
    
    formSchema.fields.splice(contextMenuFieldIndex.value + 1, 0, newField)
    selectedFieldIndex.value = contextMenuFieldIndex.value + 1
  }
  hideContextMenu()
}

const moveFieldUp = () => {
  if (contextMenuFieldIndex.value > 0) {
    moveField(contextMenuFieldIndex.value, 'up')
  }
  hideContextMenu()
}

const moveFieldDown = () => {
  if (contextMenuFieldIndex.value < formSchema.fields.length - 1) {
    moveField(contextMenuFieldIndex.value, 'down')
  }
  hideContextMenu()
}

const removeCurrentField = () => {
  if (contextMenuFieldIndex.value >= 0) {
    formSchema.fields.splice(contextMenuFieldIndex.value, 1)
    if (selectedFieldIndex.value >= contextMenuFieldIndex.value) {
      selectedFieldIndex.value = Math.max(0, selectedFieldIndex.value - 1)
    }
    if (formSchema.fields.length === 0) {
      selectedFieldIndex.value = -1
    }
  }
  hideContextMenu()
}
</script>

<style scoped>
@import '@/styles/designer-common-layout.scss';

.form-designer {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #f5f5f5;
}

/* 数据源配置区域样式 */
.datasource-config {
  margin-bottom: 16px;
}

.config-card {
  border-radius: 8px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
}

.config-actions {
  display: flex;
  align-items: flex-end;
  height: 100%;
  padding-top: 24px;
}

/* 工具栏样式 */
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: white;
  border-bottom: 1px solid #e4e7ed;
  margin-bottom: 16px;
}

.toolbar-left {
  display: flex;
  gap: 12px;
}

.toolbar-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

/* 组件列表样式 */
.component-list {
  padding: 16px;
}

.component-group h4 {
  margin: 0 0 12px 0;
  font-size: 14px;
  color: #606266;
  font-weight: 500;
}

.component-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  margin-bottom: 8px;
  background: #f8f9fa;
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  cursor: grab;
  transition: all 0.2s;
}

.component-item:hover {
  background: #e3f2fd;
  border-color: #409eff;
  transform: translateY(-1px);
}

.component-item:active {
  cursor: grabbing;
}

.component-item span {
  font-size: 14px;
  color: #303133;
}

/* 设计画布样式 */
.design-canvas {
  min-height: 100%;
  padding: 24px;
  position: relative;
}

.empty-canvas {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 400px;
  color: #909399;
  border: 2px dashed #dcdfe6;
  border-radius: 8px;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.empty-canvas p {
  font-size: 16px;
  margin: 0;
}

.form-field {
  position: relative;
  margin-bottom: 16px;
  padding: 12px;
  border: 2px dashed transparent;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.form-field:hover {
  border-color: #409eff;
  background-color: #f0f9ff;
}

.form-field.active {
  border-color: #409eff;
  background-color: #ecf5ff;
}

.field-wrapper {
  pointer-events: none;
}

.field-wrapper label {
  display: block;
  margin-bottom: 4px;
  font-weight: 500;
  color: #303133;
}

.field-actions {
  position: absolute;
  top: -8px;
  right: -8px;
  opacity: 0;
  transition: opacity 0.2s;
}

.form-field:hover .field-actions,
.form-field.active .field-actions {
  opacity: 1;
}

/* 拖拽手柄样式 */
.drag-handle {
  position: absolute;
  bottom: -8px;
  right: -8px;
  width: 20px;
  height: 20px;
  background: #409eff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: move;
  opacity: 0;
  transition: all 0.2s;
  z-index: 10;
  pointer-events: auto;
  border: 2px solid #fff;
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
}

.drag-handle:hover {
  background: #337ecc;
  transform: scale(1.1);
}

.drag-handle .el-icon {
  color: white;
  font-size: 12px;
}

.form-field:hover .drag-handle,
.form-field.active .drag-handle {
  opacity: 1;
}

.form-field.dragging {
  opacity: 0.5;
  transform: scale(0.95);
  transition: all 0.2s;
}

/* 调节大小手柄样式 */
.resize-handles {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.resize-handle {
  position: absolute;
  background: #409eff;
  border: 1px solid #fff;
  pointer-events: auto;
  z-index: 15;
}

.resize-handle-right {
  top: 50%;
  right: -4px;
  width: 8px;
  height: 20px;
  transform: translateY(-50%);
  cursor: ew-resize;
}

.resize-handle-bottom {
  bottom: -4px;
  left: 50%;
  width: 20px;
  height: 8px;
  transform: translateX(-50%);
  cursor: ns-resize;
}

.resize-handle-corner {
  bottom: -4px;
  right: -4px;
  width: 12px;
  height: 12px;
  cursor: nw-resize;
  border-radius: 2px;
}

.resize-handle:hover {
  background: #337ecc;
}

.form-field.resizing {
  border-color: #409eff;
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2);
}

/* 属性面板样式 */
.property-form,
.style-form,
.data-config {
  padding: 16px;
}

.style-form .el-divider {
  margin: 16px 0 12px 0;
}

.style-form .el-divider__text {
  font-weight: 600;
  color: #409eff;
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
}

.option-item:last-child {
  margin-bottom: 0;
}

.no-selection {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 200px;
  color: #909399;
  font-size: 14px;
}

.form-help {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

.mapping-help {
  font-size: 12px;
  color: #606266;
  margin-bottom: 12px;
  padding: 8px;
  background: #f0f9ff;
  border-radius: 4px;
  border-left: 3px solid #409eff;
}

.field-mapping h4,
.schema-preview h4 {
  margin: 16px 0 8px 0;
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}

/* 字段预览样式增强 */
.field-preview {
  transition: all 0.3s ease;
  border-radius: 4px;
  min-height: 60px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.field-preview label {
  font-weight: 500;
  color: inherit;
  margin-bottom: 4px;
}

.field-preview:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

/* 右键菜单样式 */
.context-menu {
  position: fixed;
  background: white;
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  padding: 4px 0;
  min-width: 140px;
  z-index: 9999;
  font-size: 14px;
}

.menu-item {
  display: flex;
  align-items: center;
  padding: 8px 16px;
  cursor: pointer;
  transition: background-color 0.2s;
  gap: 8px;
}

.menu-item:hover {
  background-color: #f5f7fa;
}

.menu-item.disabled {
  color: #c0c4cc;
  cursor: not-allowed;
}

.menu-item.disabled:hover {
  background-color: transparent;
}

.menu-item.danger {
  color: #f56c6c;
}

.menu-item.danger:hover {
  background-color: #fef0f0;
}

.menu-divider {
  height: 1px;
  background-color: #e4e7ed;
  margin: 4px 0;
}
</style> 