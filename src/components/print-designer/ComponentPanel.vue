<template>
  <div class="component-panel">
    <div class="panel-header">
      <h3>组件面板</h3>
      <el-input
        v-model="searchText"
        placeholder="搜索组件..."
        size="small"
        clearable
        prefix-icon="Search"
        class="search-input"
      />
    </div>

    <div class="panel-content">
      <!-- 基础组件 -->
      <div class="component-group">
        <div class="group-title">
          <el-icon><Document /></el-icon>
          <span>基础组件</span>
        </div>
        
        <div class="component-list">
          <div
            v-for="item in filteredBasicComponents"
            :key="item.type"
            class="component-item"
            :draggable="true"
            @dragstart="handleDragStart($event, item)"
            @dragend="handleDragEnd"
          >
            <div class="component-icon">
              <el-icon>
                <component :is="getIconComponent(item.icon)" />
              </el-icon>
            </div>
            <div class="component-info">
              <div class="component-name">{{ item.name }}</div>
              <div class="component-desc">{{ item.description }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 高级组件 -->
      <div class="component-group">
        <div class="group-title">
          <el-icon><Grid /></el-icon>
          <span>高级组件</span>
        </div>
        
        <div class="component-list">
          <div
            v-for="item in filteredAdvancedComponents"
            :key="item.type"
            class="component-item"
            :draggable="true"
            @dragstart="handleDragStart($event, item)"
            @dragend="handleDragEnd"
          >
            <div class="component-icon">
              <el-icon>
                <component :is="getIconComponent(item.icon)" />
              </el-icon>
            </div>
            <div class="component-info">
              <div class="component-name">{{ item.name }}</div>
              <div class="component-desc">{{ item.description }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 数据字段 -->
      <div class="panel-section">
        <div class="section-header">
          <h4>数据字段</h4>
        </div>
        
        <!-- 模板选择器 -->
        <div class="template-selector" v-if="templates.length > 0">
          <el-select
            :model-value="selectedTemplateId"
            @update:model-value="handleTemplateChange"
            placeholder="选择表单模板"
            size="small"
            style="width: 100%; margin-bottom: 12px;"
            :loading="loading"
          >
            <el-option
              v-for="template in templates"
              :key="template.id"
              :label="template.name"
              :value="template.id"
            >
              <div style="display: flex; justify-content: space-between;">
                <span>{{ template.name }}</span>
                <span style="color: #8492a6; font-size: 12px;">{{ template.category }}</span>
              </div>
            </el-option>
          </el-select>
        </div>
        
        <div class="field-list">
          <div
            v-for="field in filteredDataFields"
            :key="field.name"
            class="field-item"
            :draggable="true"
            @dragstart="handleFieldDragStart($event, field)"
            @dragend="handleDragEnd"
          >
            <div class="field-icon">
              <el-icon>
                <component :is="getFieldIcon(field.type)" />
              </el-icon>
            </div>
            <div class="field-info">
              <div class="field-name">{{ field.label }}</div>
              <div class="field-binding">{{ getFieldBinding(field.name) }}</div>
            </div>
          </div>
          
          <!-- 空状态 -->
          <div v-if="filteredDataFields.length === 0 && !loading" class="empty-state">
            <el-icon><Document /></el-icon>
            <p>暂无数据字段</p>
            <p class="empty-tip">请选择表单模板或添加字段</p>
          </div>
          
          <!-- 加载状态 -->
          <div v-if="loading" class="loading-state">
            <el-icon class="is-loading"><Loading /></el-icon>
            <p>加载中...</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { 
  Document, 
  Grid, 
  DataLine, 
  Minus, 
  Picture,
  Search,
  Loading
} from '@element-plus/icons-vue';
import { COMPONENT_PANEL_ITEMS, ComponentPanelItem, DataField } from '@/types/printDesigner';
import { formTemplateApi } from '@/api/formApi';
import { ElMessage } from 'element-plus';

// Props
interface Props {
  dataFields?: DataField[];
  selectedTemplateId?: number;
}

const props = withDefaults(defineProps<Props>(), {
  dataFields: () => [],
  selectedTemplateId: 1 // 默认选择第一个模板
});

// Emits
const emit = defineEmits<{
  dragStart: [data: { type: 'component' | 'field'; item: ComponentPanelItem | DataField }];
  dragEnd: [];
  templateChange: [templateId: number];
}>();

// 响应式数据
const searchText = ref('');
const templates = ref<any[]>([]);
const templateFields = ref<DataField[]>([]);
const loading = ref(false);

// 基础组件
const basicComponents = computed(() => 
  COMPONENT_PANEL_ITEMS.filter(item => 
    ['text', 'line', 'image', 'pageNumber'].includes(item.type)
  )
);

// 高级组件
const advancedComponents = computed(() => 
  COMPONENT_PANEL_ITEMS.filter(item => 
    ['table', 'qrcode', 'barcode'].includes(item.type)
  )
);

// 过滤后的基础组件
const filteredBasicComponents = computed(() => {
  if (!searchText.value) return basicComponents.value;
  return basicComponents.value.filter(item =>
    item.name.toLowerCase().includes(searchText.value.toLowerCase()) ||
    item.description.toLowerCase().includes(searchText.value.toLowerCase())
  );
});

// 过滤后的高级组件
const filteredAdvancedComponents = computed(() => {
  if (!searchText.value) return advancedComponents.value;
  return advancedComponents.value.filter(item =>
    item.name.toLowerCase().includes(searchText.value.toLowerCase()) ||
    item.description.toLowerCase().includes(searchText.value.toLowerCase())
  );
});

// 合并的数据字段（props传入的 + 从模板获取的）
const allDataFields = computed(() => {
  return [...props.dataFields, ...templateFields.value];
});

// 过滤后的数据字段
const filteredDataFields = computed(() => {
  if (!searchText.value) return allDataFields.value;
  return allDataFields.value.filter(field =>
    field.name.toLowerCase().includes(searchText.value.toLowerCase()) ||
    field.label.toLowerCase().includes(searchText.value.toLowerCase())
  );
});

// 获取表单模板列表
const fetchTemplates = async () => {
  try {
    loading.value = true;
    const response = await formTemplateApi.getList();
    templates.value = response.data || [];
    
    // 如果有模板，加载第一个模板的字段
    if (templates.value.length > 0) {
      await loadTemplateFields(props.selectedTemplateId || templates.value[0].id);
    }
  } catch (error) {
    console.error('获取表单模板失败:', error);
    ElMessage.error('获取表单模板失败');
  } finally {
    loading.value = false;
  }
};

// 加载模板字段
const loadTemplateFields = async (templateId: number) => {
  try {
    const response = await formTemplateApi.getFullTemplate(templateId);
    const template = response.data;
    
    if (template && template.fields) {
      // 将模板字段转换为DataField格式
      templateFields.value = template.fields.map((field: any) => ({
        name: field.fieldName,
        label: field.fieldLabel || field.fieldName,
        type: mapFieldType(field.dataType),
        description: field.description || '',
        defaultValue: field.defaultValue
      }));
    }
  } catch (error) {
    console.error('获取模板字段失败:', error);
    ElMessage.error('获取模板字段失败');
  }
};

// 映射字段类型
const mapFieldType = (dataType: string): DataField['type'] => {
  const typeMap: Record<string, DataField['type']> = {
    'VARCHAR': 'string',
    'TEXT': 'string',
    'INT': 'number',
    'DECIMAL': 'number',
    'DATE': 'date',
    'DATETIME': 'date',
    'BOOLEAN': 'boolean'
  };
  return typeMap[dataType] || 'string';
};

// 处理模板切换
const handleTemplateChange = (templateId: number) => {
  loadTemplateFields(templateId);
  emit('templateChange', templateId);
};

// 获取字段绑定文本
const getFieldBinding = (fieldName: string) => {
  return `{{${fieldName}}}`;
};

// 获取图标组件
const getIconComponent = (iconName: string) => {
  const iconMap: Record<string, any> = {
    Document,
    Minus,
    Grid,
    Picture
  };
  return iconMap[iconName] || Document;
};

// 获取字段图标
const getFieldIcon = (fieldType: string) => {
  const iconMap: Record<string, any> = {
    string: Document,
    number: DataLine,
    date: DataLine,
    boolean: DataLine,
    array: Grid,
    object: Grid
  };
  return iconMap[fieldType] || Document;
};

// 处理组件拖拽开始
const handleDragStart = (event: DragEvent, item: ComponentPanelItem) => {
  if (!event.dataTransfer) return;
  
  // 设置拖拽数据
  event.dataTransfer.setData('application/json', JSON.stringify({
    type: 'component',
    componentType: item.type,
    defaultProps: item.defaultProps
  }));
  
  // 设置拖拽效果
  event.dataTransfer.effectAllowed = 'copy';
  
  // 创建拖拽预览
  const dragImage = createDragPreview(item.name, item.icon);
  event.dataTransfer.setDragImage(dragImage, 50, 25);
  
  emit('dragStart', { type: 'component', item });
};

// 处理字段拖拽开始
const handleFieldDragStart = (event: DragEvent, field: DataField) => {
  if (!event.dataTransfer) return;
  
  // 设置拖拽数据
  event.dataTransfer.setData('application/json', JSON.stringify({
    type: 'field',
    fieldName: field.name,
    fieldLabel: field.label,
    fieldType: field.type
  }));
  
  // 设置拖拽效果
  event.dataTransfer.effectAllowed = 'copy';
  
  // 创建拖拽预览
  const dragImage = createDragPreview(field.label, 'field');
  event.dataTransfer.setDragImage(dragImage, 50, 25);
  
  emit('dragStart', { type: 'field', item: field });
};

// 处理拖拽结束
const handleDragEnd = () => {
  emit('dragEnd');
};

// 创建拖拽预览
const createDragPreview = (text: string, type: string): HTMLElement => {
  const preview = document.createElement('div');
  preview.style.cssText = `
    position: absolute;
    top: -1000px;
    left: -1000px;
    padding: 8px 12px;
    background: #409eff;
    color: white;
    border-radius: 4px;
    font-size: 12px;
    white-space: nowrap;
    box-shadow: 0 2px 8px rgba(0,0,0,0.15);
    z-index: 9999;
  `;
  preview.textContent = text;
  document.body.appendChild(preview);
  
  // 清理预览元素
  setTimeout(() => {
    document.body.removeChild(preview);
  }, 0);
  
  return preview;
};

// 组件挂载时获取数据
onMounted(() => {
  fetchTemplates();
});
</script>

<style scoped>
.component-panel {
  width: 280px;
  height: 100%;
  background: #ffffff;
  border-right: 1px solid #e4e7ed;
  display: flex;
  flex-direction: column;
}

.panel-header {
  padding: 16px;
  border-bottom: 1px solid #e4e7ed;
}

.panel-header h3 {
  margin: 0 0 12px 0;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.search-input {
  width: 100%;
}

.panel-content {
  flex: 1;
  overflow-y: auto;
  padding: 8px 0;
}

.component-group {
  margin-bottom: 16px;
}

.group-title {
  display: flex;
  align-items: center;
  padding: 8px 16px;
  font-size: 14px;
  font-weight: 600;
  color: #606266;
  background: #f5f7fa;
  border-bottom: 1px solid #e4e7ed;
}

.group-title .el-icon {
  margin-right: 8px;
  font-size: 16px;
}

.component-list,
.field-list {
  padding: 8px;
}

.component-item,
.field-item {
  display: flex;
  align-items: center;
  padding: 12px;
  margin-bottom: 8px;
  background: #ffffff;
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  cursor: grab;
  transition: all 0.2s ease;
  user-select: none;
}

.component-item:hover,
.field-item:hover {
  border-color: #409eff;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.1);
  transform: translateY(-1px);
}

.component-item:active,
.field-item:active {
  cursor: grabbing;
  transform: translateY(0);
}

.component-icon,
.field-icon {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f0f9ff;
  border-radius: 6px;
  margin-right: 12px;
  flex-shrink: 0;
}

.component-icon .el-icon,
.field-icon .el-icon {
  font-size: 18px;
  color: #409eff;
}

.component-info,
.field-info {
  flex: 1;
  min-width: 0;
}

.component-name,
.field-name {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.component-desc {
  font-size: 12px;
  color: #909399;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.field-binding {
  font-size: 11px;
  color: #67c23a;
  font-family: 'Courier New', monospace;
  background: #f0f9ff;
  padding: 2px 6px;
  border-radius: 3px;
  display: inline-block;
}

/* 滚动条样式 */
.panel-content::-webkit-scrollbar {
  width: 6px;
}

.panel-content::-webkit-scrollbar-track {
  background: #f1f1f1;
}

.panel-content::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.panel-content::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

/* 拖拽状态 */
.component-item.dragging,
.field-item.dragging {
  opacity: 0.5;
  transform: rotate(5deg);
}

/* 空状态 */
.component-list:empty::after,
.field-list:empty::after {
  content: '暂无组件';
  display: block;
  text-align: center;
  color: #c0c4cc;
  font-size: 12px;
  padding: 20px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .component-panel {
    width: 240px;
  }
  
  .component-item,
  .field-item {
    padding: 8px;
  }
  
  .component-icon,
  .field-icon {
    width: 28px;
    height: 28px;
    margin-right: 8px;
  }
  
  .component-name,
  .field-name {
    font-size: 13px;
  }
  
  .component-desc {
    font-size: 11px;
  }
}

.template-selector {
  margin-bottom: 12px;
}

.empty-state {
  text-align: center;
  padding: 24px 12px;
  color: #909399;
  
  .el-icon {
    font-size: 32px;
    margin-bottom: 8px;
  }
  
  p {
    margin: 4px 0;
    font-size: 14px;
  }
  
  .empty-tip {
    font-size: 12px;
    color: #c0c4cc;
  }
}

.loading-state {
  text-align: center;
  padding: 24px 12px;
  color: #909399;
  
  .el-icon {
    font-size: 24px;
    margin-bottom: 8px;
  }
  
  p {
    margin: 4px 0;
    font-size: 14px;
  }
}
</style> 