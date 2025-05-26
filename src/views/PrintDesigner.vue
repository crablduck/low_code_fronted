<template>
  <div class="print-designer">
    <!-- 顶部工具栏 -->
    <div class="designer-header">
      <div class="header-left">
        <h2>打印模板设计器</h2>
        <el-breadcrumb separator="/">
          <el-breadcrumb-item>低代码平台</el-breadcrumb-item>
          <el-breadcrumb-item>打印设计</el-breadcrumb-item>
          <el-breadcrumb-item>{{ templateName || '新建模板' }}</el-breadcrumb-item>
        </el-breadcrumb>
      </div>

      <div class="header-center">
        <!-- 页面配置 -->
        <el-button-group>
          <el-dropdown @command="handlePaperSizeChange">
            <el-button size="small">
              {{ currentPaperSize.name }}
              <el-icon class="el-icon--right"><ArrowDown /></el-icon>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item
                  v-for="size in paperSizes"
                  :key="size.name"
                  :command="size.name"
                >
                  {{ size.name }} ({{ size.width }}×{{ size.height }}mm)
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>

          <el-button
            size="small"
            :type="pageConfig.orientation === 'portrait' ? 'primary' : 'default'"
            @click="toggleOrientation"
          >
            {{ pageConfig.orientation === 'portrait' ? '纵向' : '横向' }}
          </el-button>
        </el-button-group>

        <el-divider direction="vertical" />

        <!-- 边距设置 -->
        <el-popover placement="bottom" width="300" trigger="click">
          <template #reference>
            <el-button size="small" :icon="Setting">边距</el-button>
          </template>
          <div class="margin-settings">
            <h4>页面边距 (mm)</h4>
            <el-row :gutter="8">
              <el-col :span="12">
                <el-input
                  v-model.number="pageConfig.margin.top"
                  placeholder="上边距"
                  size="small"
                  @change="handleMarginChange"
                >
                  <template #prepend>上</template>
                </el-input>
              </el-col>
              <el-col :span="12">
                <el-input
                  v-model.number="pageConfig.margin.bottom"
                  placeholder="下边距"
                  size="small"
                  @change="handleMarginChange"
                >
                  <template #prepend>下</template>
                </el-input>
              </el-col>
            </el-row>
            <el-row :gutter="8" style="margin-top: 8px;">
              <el-col :span="12">
                <el-input
                  v-model.number="pageConfig.margin.left"
                  placeholder="左边距"
                  size="small"
                  @change="handleMarginChange"
                >
                  <template #prepend>左</template>
                </el-input>
              </el-col>
              <el-col :span="12">
                <el-input
                  v-model.number="pageConfig.margin.right"
                  placeholder="右边距"
                  size="small"
                  @change="handleMarginChange"
                >
                  <template #prepend>右</template>
                </el-input>
              </el-col>
            </el-row>
          </div>
        </el-popover>
      </div>

      <div class="header-right">
        <!-- 模板操作 -->
        <el-button-group>
          <el-button size="small" @click="newTemplate">
            <el-icon><DocumentAdd /></el-icon>
            新建
          </el-button>
          <el-button size="small" @click="openTemplate">
            <el-icon><FolderOpened /></el-icon>
            打开
          </el-button>
          <el-button size="small" @click="saveTemplate">
            <el-icon><Document /></el-icon>
            保存
          </el-button>
        </el-button-group>

        <el-divider direction="vertical" />

        <!-- 导出操作 -->
        <el-dropdown @command="handleExport">
          <el-button size="small" type="primary">
            导出
            <el-icon class="el-icon--right"><ArrowDown /></el-icon>
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="pdf">
                <el-icon><Document /></el-icon>
                导出PDF
              </el-dropdown-item>
              <el-dropdown-item command="image">
                <el-icon><Picture /></el-icon>
                导出图片
              </el-dropdown-item>
              <el-dropdown-item command="print">
                <el-icon><Printer /></el-icon>
                直接打印
              </el-dropdown-item>
              <el-dropdown-item command="json" divided>
                <el-icon><Download /></el-icon>
                导出JSON
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>

        <!-- 预览数据 -->
        <el-popover placement="bottom" width="400" trigger="click">
          <template #reference>
            <el-button size="small" :icon="DataLine">预览数据</el-button>
          </template>
          <div class="preview-data-editor">
            <h4>预览数据</h4>
            <el-input
              v-model="previewDataJson"
              type="textarea"
              :rows="10"
              placeholder="请输入JSON格式的预览数据"
              @change="handlePreviewDataChange"
            />
            <div class="data-actions">
              <el-button size="small" @click="loadSampleData">加载示例数据</el-button>
              <el-button size="small" type="primary" @click="applyPreviewData">应用数据</el-button>
            </div>
          </div>
        </el-popover>
      </div>
    </div>

    <!-- 主要内容区域 -->
    <div class="designer-content">
      <!-- 左侧组件面板 -->
      <ComponentPanel
        :data-fields="dataFields"
        :selected-template-id="selectedTemplateId"
        @drag-start="handleDragStart"
        @drag-end="handleDragEnd"
        @template-change="handleTemplateChange"
      />

      <!-- 中间设计画布 -->
      <DesignCanvas
        v-model:components="components"
        v-model:selected-ids="selectedIds"
        v-model:clipboard="clipboard"
        v-model:grid-config="gridConfig"
        v-model:preview-mode="previewMode"
        :page-config="pageConfig"
        :ruler-config="rulerConfig"
        :preview-data="previewData"
        :can-undo="historyManager.canUndo()"
        :can-redo="historyManager.canRedo()"
        @component-add="handleComponentAdd"
        @component-update="handleComponentUpdate"
        @component-delete="handleComponentDelete"
        @undo="handleUndo"
        @redo="handleRedo"
        @save-history="handleSaveHistory"
      />

      <!-- 右侧属性面板 -->
      <PropertyPanel
        :selected-components="selectedComponents"
        :available-fields="dataFields"
        @update-component="handleComponentUpdate"
        @update-components="handleComponentsUpdate"
      />
    </div>

    <!-- 模板选择对话框 -->
    <el-dialog
      v-model="templateDialogVisible"
      title="选择模板"
      width="800px"
      :close-on-click-modal="false"
    >
      <div class="template-list">
        <el-row :gutter="16">
          <el-col
            v-for="template in savedTemplates"
            :key="template.id"
            :span="8"
          >
            <el-card
              class="template-card"
              :class="{ active: selectedTemplateId === template.id }"
              @click="selectTemplate(template.id)"
            >
              <div class="template-preview">
                <img
                  v-if="template.thumbnail"
                  :src="template.thumbnail"
                  :alt="template.name"
                />
                <div v-else class="no-preview">
                  <el-icon><Document /></el-icon>
                  <span>无预览</span>
                </div>
              </div>
              <div class="template-info">
                <h4>{{ template.name }}</h4>
                <p>{{ template.description }}</p>
                <div class="template-meta">
                  <span>{{ formatDate(template.updatedAt) }}</span>
                  <span>{{ template.components?.length || 0 }} 个组件</span>
                </div>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </div>
      
      <template #footer>
        <el-button @click="templateDialogVisible = false">取消</el-button>
        <el-button
          type="primary"
          :disabled="!selectedTemplateId"
          @click="loadSelectedTemplate"
        >
          打开模板
        </el-button>
      </template>
    </el-dialog>

    <!-- 保存模板对话框 -->
    <el-dialog
      v-model="saveDialogVisible"
      title="保存模板"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form :model="saveForm" label-width="80px">
        <el-form-item label="模板名称" required>
          <el-input v-model="saveForm.name" placeholder="请输入模板名称" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input
            v-model="saveForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入模板描述"
          />
        </el-form-item>
        <el-form-item label="分类">
          <el-select v-model="saveForm.category" placeholder="请选择分类">
            <el-option label="报表模板" value="report" />
            <el-option label="标签模板" value="label" />
            <el-option label="证书模板" value="certificate" />
            <el-option label="发票模板" value="invoice" />
            <el-option label="其他" value="other" />
          </el-select>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="saveDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmSaveTemplate">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue';
import {
  ArrowDown,
  Setting,
  DocumentAdd,
  FolderOpened,
  Document,
  Picture,
  Printer,
  Download,
  DataLine
} from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';

// 导入组件
import ComponentPanel from '@/components/print-designer/ComponentPanel.vue';
import DesignCanvas from '@/components/print-designer/DesignCanvas.vue';
import PropertyPanel from '@/components/print-designer/PropertyPanel.vue';

// 导入类型和工具
import { PAPER_SIZES } from '@/types/printDesigner';
import type {
  PrintComponent,
  PageConfig,
  GridConfig,
  RulerConfig,
  PreviewData,
  DataField,
  PaperSize,
  PrintTemplate
} from '@/types/printDesigner';
import {
  HistoryManager,
  ExportHelper,
  TemplateValidator,
  UnitConverter
} from '@/utils/printDesigner';

// 响应式数据
const templateName = ref('');
const components = ref<PrintComponent[]>([]);
const selectedIds = ref<string[]>([]);
const clipboard = ref<PrintComponent[]>([]);
const previewMode = ref(false);
const previewData = ref<PreviewData>({});
const previewDataJson = ref('{}');

// 页面配置
const pageConfig = reactive<PageConfig>({
  paperSize: 'A4',
  orientation: 'portrait',
  margin: {
    top: 20,
    right: 20,
    bottom: 20,
    left: 20
  },
  scale: 1
});

// 网格配置
const gridConfig = reactive<GridConfig>({
  enabled: true,
  visible: true,
  snap: true,
  size: 10
});

// 标尺配置
const rulerConfig = reactive<RulerConfig>({
  enabled: true,
  unit: 'mm'
});

// 数据字段
const dataFields = ref<DataField[]>([
  { name: 'patient_name', label: '患者姓名', type: 'string' },
  { name: 'patient_id', label: '患者ID', type: 'string' },
  { name: 'age', label: '年龄', type: 'number' },
  { name: 'gender', label: '性别', type: 'string' },
  { name: 'diagnosis', label: '诊断', type: 'string' },
  { name: 'doctor_name', label: '医生姓名', type: 'string' },
  { name: 'department', label: '科室', type: 'string' },
  { name: 'visit_date', label: '就诊日期', type: 'date' },
  { name: 'prescription', label: '处方', type: 'array' },
  { name: 'total_amount', label: '总金额', type: 'number' }
]);

// 历史记录管理器
const historyManager = new HistoryManager();

// 纸张尺寸
const paperSizes = Object.values(PAPER_SIZES);

// 模板相关
const templateDialogVisible = ref(false);
const saveDialogVisible = ref(false);
const selectedTemplateId = ref<string>('1');
const savedTemplates = ref<PrintTemplate[]>([]);

// 保存表单
const saveForm = reactive({
  name: '',
  description: '',
  category: 'report'
});

// 计算属性
const currentPaperSize = computed(() => {
  return PAPER_SIZES[pageConfig.paperSize] || PAPER_SIZES.A4;
});

const selectedComponents = computed(() => {
  return components.value.filter(c => selectedIds.value.includes(c.id));
});

// 页面配置处理
const handlePaperSizeChange = (sizeName: string) => {
  pageConfig.paperSize = sizeName;
  handleSaveHistory('更改纸张尺寸');
};

const toggleOrientation = () => {
  pageConfig.orientation = pageConfig.orientation === 'portrait' ? 'landscape' : 'portrait';
  handleSaveHistory('切换页面方向');
};

const handleMarginChange = () => {
  handleSaveHistory('调整页面边距');
};

// 组件操作处理
const handleComponentAdd = (component: PrintComponent) => {
  components.value.push(component);
  handleSaveHistory(`添加${component.type}组件`);
};

const handleComponentUpdate = (component: PrintComponent) => {
  const index = components.value.findIndex(c => c.id === component.id);
  if (index !== -1) {
    components.value[index] = component;
  }
};

const handleComponentsUpdate = (updatedComponents: PrintComponent[]) => {
  updatedComponents.forEach(component => {
    handleComponentUpdate(component);
  });
  handleSaveHistory('批量更新组件');
};

const handleComponentDelete = (id: string) => {
  const index = components.value.findIndex(c => c.id === id);
  if (index !== -1) {
    components.value.splice(index, 1);
    selectedIds.value = selectedIds.value.filter(selectedId => selectedId !== id);
  }
};

// 拖拽处理
const handleDragStart = (data: any) => {
  // 拖拽开始时的处理
};

const handleDragEnd = () => {
  // 拖拽结束时的处理
};

// 历史记录处理
const handleSaveHistory = (description: string) => {
  historyManager.addHistory({
    components: JSON.parse(JSON.stringify(components.value)),
    pageConfig: JSON.parse(JSON.stringify(pageConfig)),
    selectedIds: [...selectedIds.value]
  }, description);
};

const handleUndo = () => {
  const state = historyManager.undo();
  if (state) {
    components.value = state.components;
    Object.assign(pageConfig, state.pageConfig);
    selectedIds.value = state.selectedIds;
    ElMessage.success('撤销成功');
  }
};

const handleRedo = () => {
  const state = historyManager.redo();
  if (state) {
    components.value = state.components;
    Object.assign(pageConfig, state.pageConfig);
    selectedIds.value = state.selectedIds;
    ElMessage.success('重做成功');
  }
};

// 预览数据处理
const handlePreviewDataChange = () => {
  try {
    previewData.value = JSON.parse(previewDataJson.value);
  } catch (error) {
    ElMessage.error('预览数据格式错误');
  }
};

const loadSampleData = () => {
  const sampleData = {
    patient_name: '张三',
    patient_id: 'P001234',
    age: 35,
    gender: '男',
    diagnosis: '高血压',
    doctor_name: '李医生',
    department: '内科',
    visit_date: '2024-01-15',
    prescription: ['降压药', '维生素'],
    total_amount: 156.50
  };
  previewDataJson.value = JSON.stringify(sampleData, null, 2);
  previewData.value = sampleData;
  ElMessage.success('已加载示例数据');
};

const applyPreviewData = () => {
  try {
    previewData.value = JSON.parse(previewDataJson.value);
    ElMessage.success('预览数据已应用');
  } catch (error) {
    ElMessage.error('预览数据格式错误');
  }
};

// 模板操作
const newTemplate = () => {
  if (components.value.length > 0) {
    ElMessageBox.confirm(
      '当前模板尚未保存，是否继续创建新模板？',
      '确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    ).then(() => {
      resetTemplate();
    });
  } else {
    resetTemplate();
  }
};

const resetTemplate = () => {
  templateName.value = '';
  components.value = [];
  selectedIds.value = [];
  clipboard.value = [];
  previewData.value = {};
  previewDataJson.value = '{}';
  historyManager.clear();
  
  // 重置页面配置
  Object.assign(pageConfig, {
    paperSize: 'A4',
    orientation: 'portrait',
    margin: { top: 20, right: 20, bottom: 20, left: 20 },
    scale: 1
  });
  
  ElMessage.success('已创建新模板');
};

const openTemplate = () => {
  loadSavedTemplates();
  templateDialogVisible.value = true;
};

const saveTemplate = () => {
  if (components.value.length === 0) {
    ElMessage.warning('模板为空，无法保存');
    return;
  }
  
  // 验证模板
  const errors = TemplateValidator.validateTemplate(components.value, pageConfig);
  if (errors.length > 0) {
    ElMessage.error(`模板验证失败：${errors[0]}`);
    return;
  }
  
  saveForm.name = templateName.value || '未命名模板';
  saveForm.description = '';
  saveForm.category = 'report';
  saveDialogVisible.value = true;
};

const confirmSaveTemplate = async () => {
  if (!saveForm.name.trim()) {
    ElMessage.error('请输入模板名称');
    return;
  }
  
  try {
    const template: PrintTemplate = {
      id: Date.now().toString(),
      name: saveForm.name,
      description: saveForm.description,
      category: saveForm.category,
      components: JSON.parse(JSON.stringify(components.value)),
      pageConfig: JSON.parse(JSON.stringify(pageConfig)),
      dataFields: JSON.parse(JSON.stringify(dataFields.value)),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // 保存到本地存储
    const templates = JSON.parse(localStorage.getItem('printTemplates') || '[]');
    const existingIndex = templates.findIndex((t: PrintTemplate) => t.name === template.name);
    
    if (existingIndex !== -1) {
      template.id = templates[existingIndex].id;
      template.createdAt = templates[existingIndex].createdAt;
      templates[existingIndex] = template;
    } else {
      templates.push(template);
    }
    
    localStorage.setItem('printTemplates', JSON.stringify(templates));
    
    templateName.value = template.name;
    saveDialogVisible.value = false;
    ElMessage.success('模板保存成功');
    
  } catch (error) {
    console.error('保存模板失败:', error);
    ElMessage.error('保存模板失败');
  }
};

const loadSavedTemplates = () => {
  try {
    const templates = JSON.parse(localStorage.getItem('printTemplates') || '[]');
    savedTemplates.value = templates.map((t: any) => ({
      ...t,
      createdAt: new Date(t.createdAt),
      updatedAt: new Date(t.updatedAt)
    }));
  } catch (error) {
    console.error('加载模板失败:', error);
    savedTemplates.value = [];
  }
};

const selectTemplate = (templateId: string) => {
  selectedTemplateId.value = templateId;
};

const loadSelectedTemplate = () => {
  const template = savedTemplates.value.find(t => t.id === selectedTemplateId.value);
  if (template) {
    templateName.value = template.name;
    components.value = JSON.parse(JSON.stringify(template.components));
    Object.assign(pageConfig, template.pageConfig);
    if (template.dataFields) {
      dataFields.value = template.dataFields;
    }
    
    selectedIds.value = [];
    clipboard.value = [];
    historyManager.clear();
    
    templateDialogVisible.value = false;
    ElMessage.success(`已加载模板：${template.name}`);
  }
};

// 导出处理
const handleExport = async (command: string) => {
  if (components.value.length === 0) {
    ElMessage.warning('模板为空，无法导出');
    return;
  }
  
  try {
    const canvasElement = document.querySelector('.page-background') as HTMLElement;
    if (!canvasElement) {
      ElMessage.error('找不到画布元素');
      return;
    }
    
    switch (command) {
      case 'pdf':
        await ExportHelper.exportToPDF(canvasElement, {
          filename: `${templateName.value || '打印模板'}.pdf`
        });
        ElMessage.success('PDF导出成功');
        break;
        
      case 'image':
        const imageData = await ExportHelper.exportToImage(canvasElement);
        const link = document.createElement('a');
        link.download = `${templateName.value || '打印模板'}.png`;
        link.href = imageData;
        link.click();
        ElMessage.success('图片导出成功');
        break;
        
      case 'print':
        ExportHelper.print(canvasElement);
        break;
        
      case 'json':
        const templateData = {
          name: templateName.value,
          components: components.value,
          pageConfig: pageConfig,
          dataFields: dataFields.value
        };
        const jsonData = JSON.stringify(templateData, null, 2);
        const blob = new Blob([jsonData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const jsonLink = document.createElement('a');
        jsonLink.download = `${templateName.value || '打印模板'}.json`;
        jsonLink.href = url;
        jsonLink.click();
        URL.revokeObjectURL(url);
        ElMessage.success('JSON导出成功');
        break;
    }
  } catch (error) {
    console.error('导出失败:', error);
    ElMessage.error('导出失败');
  }
};

// 工具函数
const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
};

// 键盘快捷键
const handleKeyDown = (event: KeyboardEvent) => {
  if (event.ctrlKey || event.metaKey) {
    switch (event.key) {
      case 's':
        event.preventDefault();
        saveTemplate();
        break;
      case 'n':
        event.preventDefault();
        newTemplate();
        break;
      case 'o':
        event.preventDefault();
        openTemplate();
        break;
    }
  }
};

// 生命周期
onMounted(() => {
  document.addEventListener('keydown', handleKeyDown);
  loadSavedTemplates();
  
  // 初始化历史记录
  handleSaveHistory('初始化模板');
});

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeyDown);
});

// 模板切换处理
const handleTemplateChange = (templateId: string) => {
  selectedTemplateId.value = templateId;
  // 这里可以根据模板ID加载对应的组件配置
  ElMessage.success(`已切换到模板 ${templateId}`);
};
</script>

<style scoped>
.print-designer {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f5f5f5;
}

.designer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: #ffffff;
  border-bottom: 1px solid #e4e7ed;
  box-shadow: 0 1px 4px rgba(0,0,0,0.1);
  z-index: 100;
}

.header-left h2 {
  margin: 0 0 4px 0;
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.header-center,
.header-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.designer-content {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.margin-settings h4 {
  margin: 0 0 12px 0;
  font-size: 14px;
  color: #303133;
}

.preview-data-editor h4 {
  margin: 0 0 12px 0;
  font-size: 14px;
  color: #303133;
}

.data-actions {
  margin-top: 12px;
  text-align: right;
}

.template-list {
  max-height: 400px;
  overflow-y: auto;
}

.template-card {
  cursor: pointer;
  transition: all 0.2s ease;
  margin-bottom: 16px;
}

.template-card:hover {
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  transform: translateY(-2px);
}

.template-card.active {
  border-color: #409eff;
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2);
}

.template-preview {
  height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f8f9fa;
  border-radius: 4px;
  margin-bottom: 12px;
  overflow: hidden;
}

.template-preview img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.no-preview {
  display: flex;
  flex-direction: column;
  align-items: center;
  color: #c0c4cc;
}

.no-preview .el-icon {
  font-size: 32px;
  margin-bottom: 8px;
}

.template-info h4 {
  margin: 0 0 8px 0;
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}

.template-info p {
  margin: 0 0 8px 0;
  font-size: 12px;
  color: #909399;
  line-height: 1.4;
}

.template-meta {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  color: #c0c4cc;
}

/* 滚动条样式 */
.template-list::-webkit-scrollbar {
  width: 6px;
}

.template-list::-webkit-scrollbar-track {
  background: #f1f1f1;
}

.template-list::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.template-list::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .designer-header {
    flex-wrap: wrap;
    gap: 8px;
  }
  
  .header-center {
    order: 3;
    width: 100%;
    justify-content: center;
  }
}

@media (max-width: 768px) {
  .designer-header {
    padding: 8px 12px;
  }
  
  .header-left h2 {
    font-size: 16px;
  }
  
  .template-card {
    margin-bottom: 12px;
  }
  
  .template-preview {
    height: 80px;
  }
}
</style> 