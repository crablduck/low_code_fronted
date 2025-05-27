<template>
  <div class="property-panel">
    <div class="panel-header">
      <h3>属性面板</h3>
      <div v-if="selectedComponents.length > 0" class="selection-info">
        已选择 {{ selectedComponents.length }} 个组件
      </div>
    </div>

    <div class="panel-content">
      <!-- 无选择状态 -->
      <div v-if="selectedComponents.length === 0" class="empty-state">
        <el-icon class="empty-icon"><Select /></el-icon>
        <p>请选择组件以编辑属性</p>
      </div>

      <!-- 多选状态 -->
      <div v-else-if="selectedComponents.length > 1" class="multi-selection">
        <el-card shadow="never">
          <template #header>
            <span>批量操作</span>
          </template>
          
          <!-- 位置和尺寸 -->
          <div class="property-group">
            <h4>位置和尺寸</h4>
            <el-row :gutter="8">
              <el-col :span="12">
                <el-input
                  v-model.number="batchPosition.x"
                  placeholder="X坐标"
                  size="small"
                  @change="handleBatchPositionChange"
                >
                  <template #prepend>X</template>
                </el-input>
              </el-col>
              <el-col :span="12">
                <el-input
                  v-model.number="batchPosition.y"
                  placeholder="Y坐标"
                  size="small"
                  @change="handleBatchPositionChange"
                >
                  <template #prepend>Y</template>
                </el-input>
              </el-col>
            </el-row>
          </div>

          <!-- 对齐操作 -->
          <div class="property-group">
            <h4>对齐</h4>
            <el-button-group class="align-buttons">
              <el-button size="small" @click="alignLeft">左对齐</el-button>
              <el-button size="small" @click="alignCenter">居中</el-button>
              <el-button size="small" @click="alignRight">右对齐</el-button>
            </el-button-group>
            <el-button-group class="align-buttons">
              <el-button size="small" @click="alignTop">顶部对齐</el-button>
              <el-button size="small" @click="alignMiddle">垂直居中</el-button>
              <el-button size="small" @click="alignBottom">底部对齐</el-button>
            </el-button-group>
          </div>

          <!-- 分布操作 -->
          <div class="property-group">
            <h4>分布</h4>
            <el-button-group class="align-buttons">
              <el-button size="small" @click="distributeHorizontal">水平分布</el-button>
              <el-button size="small" @click="distributeVertical">垂直分布</el-button>
            </el-button-group>
          </div>
        </el-card>
      </div>

      <!-- 单选状态 -->
      <div v-else class="single-selection">
        <el-tabs v-model="activeTab" type="border-card">
          <!-- 基础属性 -->
          <el-tab-pane label="基础" name="basic">
            <div class="property-group">
              <h4>基本信息</h4>
              <el-form label-width="60px" size="small">
                <el-form-item label="类型">
                  <el-tag>{{ getComponentTypeName(currentComponent.type) }}</el-tag>
                </el-form-item>
                <el-form-item label="ID">
                  <el-input v-model="currentComponent.id" disabled />
                </el-form-item>
              </el-form>
            </div>

            <div class="property-group">
              <h4>位置和尺寸</h4>
              <el-form label-width="60px" size="small">
                <el-form-item label="X坐标">
                  <el-input-number
                    v-model="currentComponent.x"
                    :min="0"
                    :step="1"
                    controls-position="right"
                    @change="handleComponentUpdate"
                  />
                </el-form-item>
                <el-form-item label="Y坐标">
                  <el-input-number
                    v-model="currentComponent.y"
                    :min="0"
                    :step="1"
                    controls-position="right"
                    @change="handleComponentUpdate"
                  />
                </el-form-item>
                <el-form-item label="宽度">
                  <el-input-number
                    v-model="currentComponent.width"
                    :min="1"
                    :step="1"
                    controls-position="right"
                    @change="handleComponentUpdate"
                  />
                </el-form-item>
                <el-form-item label="高度">
                  <el-input-number
                    v-model="currentComponent.height"
                    :min="1"
                    :step="1"
                    controls-position="right"
                    @change="handleComponentUpdate"
                  />
                </el-form-item>
              </el-form>
            </div>

            <div class="property-group">
              <h4>层级和状态</h4>
              <el-form label-width="60px" size="small">
                <el-form-item label="层级">
                  <el-input-number
                    v-model="currentComponent.zIndex"
                    :min="0"
                    :step="1"
                    controls-position="right"
                    @change="handleComponentUpdate"
                  />
                </el-form-item>
                <el-form-item label="锁定">
                  <el-switch
                    v-model="currentComponent.locked"
                    @change="handleComponentUpdate"
                  />
                </el-form-item>
                <el-form-item label="可见">
                  <el-switch
                    v-model="currentComponent.visible"
                    @change="handleComponentUpdate"
                  />
                </el-form-item>
              </el-form>
            </div>
          </el-tab-pane>

          <!-- 样式属性 -->
          <el-tab-pane label="样式" name="style">
            <!-- 文本组件样式 -->
            <div v-if="currentComponent.type === 'text'" class="text-style">
              <div class="property-group">
                <h4>文本内容</h4>
                <el-form label-width="80px" size="small">
                  <el-form-item label="内容">
                    <el-input
                      v-model="currentComponent.content"
                      type="textarea"
                      :rows="3"
                      @change="handleComponentUpdate"
                    />
                  </el-form-item>
                  <el-form-item label="字段绑定">
                    <el-input
                      v-model="currentComponent.fieldBinding"
                      placeholder="{{field_name}}"
                      @change="handleComponentUpdate"
                    />
                  </el-form-item>
                </el-form>
              </div>

              <div class="property-group">
                <h4>字体样式</h4>
                <el-form label-width="80px" size="small">
                  <el-form-item label="字体">
                    <el-select
                      v-model="currentComponent.style.fontFamily"
                      @change="handleComponentUpdate"
                    >
                      <el-option label="Arial" value="Arial" />
                      <el-option label="微软雅黑" value="Microsoft YaHei" />
                      <el-option label="宋体" value="SimSun" />
                      <el-option label="黑体" value="SimHei" />
                    </el-select>
                  </el-form-item>
                  <el-form-item label="字号">
                    <el-input-number
                      v-model="currentComponent.style.fontSize"
                      :min="8"
                      :max="72"
                      controls-position="right"
                      @change="handleComponentUpdate"
                    />
                  </el-form-item>
                  <el-form-item label="粗细">
                    <el-select
                      v-model="currentComponent.style.fontWeight"
                      @change="handleComponentUpdate"
                    >
                      <el-option label="正常" value="normal" />
                      <el-option label="粗体" value="bold" />
                      <el-option label="细体" value="lighter" />
                    </el-select>
                  </el-form-item>
                  <el-form-item label="颜色">
                    <el-color-picker
                      v-model="currentComponent.style.color"
                      @change="handleComponentUpdate"
                    />
                  </el-form-item>
                  <el-form-item label="对齐">
                    <el-select
                      v-model="currentComponent.style.textAlign"
                      @change="handleComponentUpdate"
                    >
                      <el-option label="左对齐" value="left" />
                      <el-option label="居中" value="center" />
                      <el-option label="右对齐" value="right" />
                      <el-option label="两端对齐" value="justify" />
                    </el-select>
                  </el-form-item>
                  <el-form-item label="行高">
                    <el-input-number
                      v-model="currentComponent.style.lineHeight"
                      :min="1"
                      :max="3"
                      :step="0.1"
                      controls-position="right"
                      @change="handleComponentUpdate"
                    />
                  </el-form-item>
                </el-form>
              </div>
            </div>

            <!-- 线条组件样式 -->
            <div v-else-if="currentComponent.type === 'line'" class="line-style">
              <div class="property-group">
                <h4>线条样式</h4>
                <el-form label-width="80px" size="small">
                  <el-form-item label="方向">
                    <el-radio-group
                      v-model="currentComponent.direction"
                      @change="handleComponentUpdate"
                    >
                      <el-radio label="horizontal">水平</el-radio>
                      <el-radio label="vertical">垂直</el-radio>
                    </el-radio-group>
                  </el-form-item>
                  <el-form-item label="颜色">
                    <el-color-picker
                      v-model="currentComponent.style.color"
                      @change="handleComponentUpdate"
                    />
                  </el-form-item>
                  <el-form-item label="粗细">
                    <el-input-number
                      v-model="currentComponent.style.width"
                      :min="1"
                      :max="10"
                      controls-position="right"
                      @change="handleComponentUpdate"
                    />
                  </el-form-item>
                  <el-form-item label="样式">
                    <el-select
                      v-model="currentComponent.style.lineStyle"
                      @change="handleComponentUpdate"
                    >
                      <el-option label="实线" value="solid" />
                      <el-option label="虚线" value="dashed" />
                      <el-option label="点线" value="dotted" />
                    </el-select>
                  </el-form-item>
                </el-form>
              </div>
            </div>

            <!-- 表格组件样式 -->
            <div v-else-if="currentComponent.type === 'table'" class="table-style">
              <div class="property-group">
                <h4>表格结构</h4>
                <el-form label-width="80px" size="small">
                  <el-form-item label="行数">
                    <el-input-number
                      v-model="currentComponent.rows"
                      :min="1"
                      :max="20"
                      controls-position="right"
                      @change="handleTableStructureChange"
                    />
                  </el-form-item>
                  <el-form-item label="列数">
                    <el-input-number
                      v-model="currentComponent.cols"
                      :min="1"
                      :max="20"
                      controls-position="right"
                      @change="handleTableStructureChange"
                    />
                  </el-form-item>
                </el-form>
              </div>

              <div class="property-group">
                <h4>边框样式</h4>
                <el-form label-width="80px" size="small">
                  <el-form-item label="边框色">
                    <el-color-picker
                      v-model="currentComponent.style.borderColor"
                      @change="handleComponentUpdate"
                    />
                  </el-form-item>
                  <el-form-item label="边框宽">
                    <el-input-number
                      v-model="currentComponent.style.borderWidth"
                      :min="0"
                      :max="5"
                      controls-position="right"
                      @change="handleComponentUpdate"
                    />
                  </el-form-item>
                </el-form>
              </div>
            </div>

            <!-- 二维码组件样式 -->
            <div v-else-if="currentComponent.type === 'qrcode'" class="qrcode-style">
              <div class="property-group">
                <h4>二维码内容</h4>
                <el-form label-width="80px" size="small">
                  <el-form-item label="内容">
                    <el-input
                      v-model="currentComponent.content"
                      type="textarea"
                      :rows="3"
                      @change="handleComponentUpdate"
                    />
                  </el-form-item>
                  <el-form-item label="字段绑定">
                    <el-input
                      v-model="currentComponent.fieldBinding"
                      placeholder="{{field_name}}"
                      @change="handleComponentUpdate"
                    />
                  </el-form-item>
                </el-form>
              </div>

              <div class="property-group">
                <h4>二维码选项</h4>
                <el-form label-width="80px" size="small">
                  <el-form-item label="纠错级别">
                    <el-select
                      v-model="currentComponent.options.errorCorrectionLevel"
                      @change="handleComponentUpdate"
                    >
                      <el-option label="低 (L)" value="L" />
                      <el-option label="中 (M)" value="M" />
                      <el-option label="高 (Q)" value="Q" />
                      <el-option label="最高 (H)" value="H" />
                    </el-select>
                  </el-form-item>
                  <el-form-item label="边距">
                    <el-input-number
                      v-model="currentComponent.options.margin"
                      :min="0"
                      :max="10"
                      controls-position="right"
                      @change="handleComponentUpdate"
                    />
                  </el-form-item>
                  <el-form-item label="前景色">
                    <el-color-picker
                      v-model="currentComponent.options.color.dark"
                      @change="handleComponentUpdate"
                    />
                  </el-form-item>
                  <el-form-item label="背景色">
                    <el-color-picker
                      v-model="currentComponent.options.color.light"
                      @change="handleComponentUpdate"
                    />
                  </el-form-item>
                </el-form>
              </div>
            </div>

            <!-- 条形码组件样式 -->
            <div v-else-if="currentComponent.type === 'barcode'" class="barcode-style">
              <div class="property-group">
                <h4>条形码内容</h4>
                <el-form label-width="80px" size="small">
                  <el-form-item label="内容">
                    <el-input
                      v-model="currentComponent.content"
                      @change="handleComponentUpdate"
                    />
                  </el-form-item>
                  <el-form-item label="字段绑定">
                    <el-input
                      v-model="currentComponent.fieldBinding"
                      placeholder="{{field_name}}"
                      @change="handleComponentUpdate"
                    />
                  </el-form-item>
                </el-form>
              </div>

              <div class="property-group">
                <h4>条形码选项</h4>
                <el-form label-width="80px" size="small">
                  <el-form-item label="格式">
                    <el-select
                      v-model="currentComponent.format"
                      @change="handleComponentUpdate"
                    >
                      <el-option label="CODE128" value="CODE128" />
                      <el-option label="CODE39" value="CODE39" />
                      <el-option label="EAN13" value="EAN13" />
                      <el-option label="EAN8" value="EAN8" />
                      <el-option label="UPC" value="UPC" />
                    </el-select>
                  </el-form-item>
                  <el-form-item label="显示文本">
                    <el-switch
                      v-model="currentComponent.options.displayValue"
                      @change="handleComponentUpdate"
                    />
                  </el-form-item>
                  <el-form-item label="字体大小">
                    <el-input-number
                      v-model="currentComponent.options.fontSize"
                      :min="8"
                      :max="24"
                      controls-position="right"
                      @change="handleComponentUpdate"
                    />
                  </el-form-item>
                  <el-form-item label="文本边距">
                    <el-input-number
                      v-model="currentComponent.options.textMargin"
                      :min="0"
                      :max="10"
                      controls-position="right"
                      @change="handleComponentUpdate"
                    />
                  </el-form-item>
                  <el-form-item label="条码高度">
                    <el-input-number
                      v-model="currentComponent.options.height"
                      :min="20"
                      :max="100"
                      controls-position="right"
                      @change="handleComponentUpdate"
                    />
                  </el-form-item>
                </el-form>
              </div>
            </div>

            <!-- 图片组件样式 -->
            <div v-else-if="currentComponent.type === 'image'" class="image-style">
              <div class="property-group">
                <h4>图片设置</h4>
                <el-form label-width="80px" size="small">
                  <el-form-item label="图片源">
                    <el-input
                      v-model="currentComponent.src"
                      placeholder="图片URL或base64"
                      @change="handleComponentUpdate"
                    />
                  </el-form-item>
                  <el-form-item label="替代文本">
                    <el-input
                      v-model="currentComponent.alt"
                      @change="handleComponentUpdate"
                    />
                  </el-form-item>
                  <el-form-item label="适应方式">
                    <el-select
                      v-model="currentComponent.style.objectFit"
                      @change="handleComponentUpdate"
                    >
                      <el-option label="包含" value="contain" />
                      <el-option label="覆盖" value="cover" />
                      <el-option label="填充" value="fill" />
                      <el-option label="缩小" value="scale-down" />
                      <el-option label="无" value="none" />
                    </el-select>
                  </el-form-item>
                </el-form>
              </div>

              <div class="property-group">
                <h4>上传图片</h4>
                <el-upload
                  class="image-uploader"
                  :show-file-list="false"
                  :before-upload="handleImageUpload"
                  accept="image/*"
                >
                  <el-button size="small" type="primary">选择图片</el-button>
                </el-upload>
              </div>
            </div>

            <!-- 页码组件样式 -->
            <div v-else-if="currentComponent.type === 'pageNumber'" class="page-number-style">
              <div class="property-group">
                <h4>页码设置</h4>
                <el-form label-width="80px" size="small">
                  <el-form-item label="格式">
                    <el-select
                      v-model="currentComponent.format"
                      @change="handleComponentUpdate"
                    >
                      <el-option label="当前页/总页数" value="current/total" />
                      <el-option label="当前页" value="current" />
                      <el-option label="总页数" value="total" />
                    </el-select>
                  </el-form-item>
                  <el-form-item label="前缀">
                    <el-input
                      v-model="currentComponent.prefix"
                      @change="handleComponentUpdate"
                    />
                  </el-form-item>
                  <el-form-item label="后缀">
                    <el-input
                      v-model="currentComponent.suffix"
                      @change="handleComponentUpdate"
                    />
                  </el-form-item>
                </el-form>
              </div>

              <div class="property-group">
                <h4>字体样式</h4>
                <el-form label-width="80px" size="small">
                  <el-form-item label="字体">
                    <el-select
                      v-model="currentComponent.style.fontFamily"
                      @change="handleComponentUpdate"
                    >
                      <el-option label="Arial" value="Arial" />
                      <el-option label="微软雅黑" value="Microsoft YaHei" />
                      <el-option label="宋体" value="SimSun" />
                      <el-option label="黑体" value="SimHei" />
                    </el-select>
                  </el-form-item>
                  <el-form-item label="字号">
                    <el-input-number
                      v-model="currentComponent.style.fontSize"
                      :min="8"
                      :max="72"
                      controls-position="right"
                      @change="handleComponentUpdate"
                    />
                  </el-form-item>
                  <el-form-item label="颜色">
                    <el-color-picker
                      v-model="currentComponent.style.color"
                      @change="handleComponentUpdate"
                    />
                  </el-form-item>
                  <el-form-item label="对齐">
                    <el-select
                      v-model="currentComponent.style.textAlign"
                      @change="handleComponentUpdate"
                    >
                      <el-option label="左对齐" value="left" />
                      <el-option label="居中" value="center" />
                      <el-option label="右对齐" value="right" />
                    </el-select>
                  </el-form-item>
                </el-form>
              </div>
            </div>
          </el-tab-pane>

          <!-- 数据绑定 -->
          <el-tab-pane label="数据" name="data">
            <div class="property-group">
              <h4>字段绑定</h4>
              <p class="help-text">
                使用 {{field_name}} 格式绑定数据字段
              </p>
              
              <div v-if="availableFields.length > 0" class="field-list">
                <div
                  v-for="field in availableFields"
                  :key="field.name"
                  class="field-item"
                  @click="insertField(field)"
                >
                  <div class="field-info">
                    <div class="field-name">{{ field.label }}</div>
                    <div class="field-binding">{{ getFieldBinding(field.name) }}</div>
                  </div>
                  <el-button size="small" type="text">插入</el-button>
                </div>
              </div>
              
              <div v-else class="no-fields">
                <p>暂无可用字段</p>
              </div>
            </div>
          </el-tab-pane>
        </el-tabs>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { Select } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import { 
  PrintComponent, 
  DataField,
  TextComponent,
  LineComponent,
  TableComponent,
  QRCodeComponent,
  BarcodeComponent,
  ImageComponent,
  PageNumberComponent,
  TableCell
} from '@/types/printDesigner';
import { AlignmentHelper } from '@/utils/printDesigner';

// Props
interface Props {
  selectedComponents: PrintComponent[];
  availableFields: DataField[];
}

const props = defineProps<Props>();

// Emits
const emit = defineEmits<{
  updateComponent: [component: PrintComponent];
  updateComponents: [components: PrintComponent[]];
}>();

// 响应式数据
const activeTab = ref('basic');
const batchPosition = ref({ x: 0, y: 0 });

// 计算属性
const currentComponent = computed(() => {
  return props.selectedComponents[0] || null;
});

// 获取组件类型名称
const getComponentTypeName = (type: string): string => {
  const typeNames: Record<string, string> = {
    text: '文本',
    line: '线条',
    table: '表格',
    qrcode: '二维码',
    barcode: '条形码',
    image: '图片',
    pageNumber: '页码'
  };
  return typeNames[type] || type;
};

// 处理组件更新
const handleComponentUpdate = () => {
  if (currentComponent.value) {
    emit('updateComponent', { ...currentComponent.value });
  }
};

// 处理表格结构变化
const handleTableStructureChange = () => {
  if (currentComponent.value && currentComponent.value.type === 'table') {
    const component = currentComponent.value as TableComponent;
    const newRows = component.rows;
    const newCols = component.cols;
    
    // 重新构建单元格数组
    const newCells: TableCell[][] = [];
    for (let i = 0; i < newRows; i++) {
      newCells[i] = [];
      for (let j = 0; j < newCols; j++) {
        // 保留原有单元格数据，或创建新单元格
        if (component.cells[i] && component.cells[i][j]) {
          newCells[i][j] = component.cells[i][j];
        } else {
          newCells[i][j] = {
            content: `单元格 ${i + 1}-${j + 1}`,
            colspan: 1,
            rowspan: 1,
            style: {
              fontSize: 12,
              fontFamily: 'Arial',
              fontWeight: 'normal',
              color: '#000000',
              textAlign: 'left',
              padding: { top: 3, right: 3, bottom: 3, left: 3 }
            }
          };
        }
      }
    }
    
    component.cells = newCells;
    handleComponentUpdate();
  }
};

// 处理批量位置变化
const handleBatchPositionChange = () => {
  if (props.selectedComponents.length > 1) {
    const updatedComponents = props.selectedComponents.map(component => ({
      ...component,
      x: batchPosition.value.x,
      y: batchPosition.value.y
    }));
    emit('updateComponents', updatedComponents);
  }
};

// 对齐操作
const alignLeft = () => {
  const aligned = AlignmentHelper.alignLeft(props.selectedComponents);
  emit('updateComponents', aligned);
};

const alignCenter = () => {
  const aligned = AlignmentHelper.alignCenterHorizontal(props.selectedComponents);
  emit('updateComponents', aligned);
};

const alignRight = () => {
  const aligned = AlignmentHelper.alignRight(props.selectedComponents);
  emit('updateComponents', aligned);
};

const alignTop = () => {
  const aligned = AlignmentHelper.alignTop(props.selectedComponents);
  emit('updateComponents', aligned);
};

const alignMiddle = () => {
  const aligned = AlignmentHelper.alignCenterVertical(props.selectedComponents);
  emit('updateComponents', aligned);
};

const alignBottom = () => {
  const aligned = AlignmentHelper.alignBottom(props.selectedComponents);
  emit('updateComponents', aligned);
};

// 分布操作
const distributeHorizontal = () => {
  if (props.selectedComponents.length >= 3) {
    const distributed = AlignmentHelper.distributeHorizontal(props.selectedComponents);
    emit('updateComponents', distributed);
  } else {
    ElMessage.warning('至少需要选择3个组件才能进行分布操作');
  }
};

const distributeVertical = () => {
  if (props.selectedComponents.length >= 3) {
    const distributed = AlignmentHelper.distributeVertical(props.selectedComponents);
    emit('updateComponents', distributed);
  } else {
    ElMessage.warning('至少需要选择3个组件才能进行分布操作');
  }
};

// 插入字段
const insertField = (field: DataField) => {
  if (currentComponent.value) {
    const component = currentComponent.value;
    const fieldBinding = `{{${field.name}}}`;
    
    if (component.type === 'text') {
      (component as TextComponent).content = fieldBinding;
      (component as TextComponent).fieldBinding = fieldBinding;
    } else if (component.type === 'qrcode' || component.type === 'barcode') {
      (component as QRCodeComponent | BarcodeComponent).content = fieldBinding;
      (component as QRCodeComponent | BarcodeComponent).fieldBinding = fieldBinding;
    }
    
    handleComponentUpdate();
    ElMessage.success(`已插入字段: ${field.label}`);
  }
};

// 处理图片上传
const handleImageUpload = (file: File): boolean => {
  if (currentComponent.value && currentComponent.value.type === 'image') {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        (currentComponent.value as ImageComponent).src = e.target.result as string;
        handleComponentUpdate();
        ElMessage.success('图片上传成功');
      }
    };
    reader.readAsDataURL(file);
  }
  return false; // 阻止默认上传行为
};

// 监听选中组件变化
watch(
  () => props.selectedComponents,
  (newComponents) => {
    if (newComponents.length === 1) {
      activeTab.value = 'basic';
    } else if (newComponents.length > 1) {
      // 计算批量位置的平均值
      const avgX = newComponents.reduce((sum, c) => sum + c.x, 0) / newComponents.length;
      const avgY = newComponents.reduce((sum, c) => sum + c.y, 0) / newComponents.length;
      batchPosition.value = { x: Math.round(avgX), y: Math.round(avgY) };
    }
  },
  { immediate: true }
);

// 获取字段绑定
const getFieldBinding = (fieldName: string): string => {
  const field = props.availableFields.find(f => f.name === fieldName);
  return field ? `{{${field.name}}}` : '';
};
</script>

<style scoped>
.property-panel {
  height: 100%;
  background: #ffffff;
  border-left: 1px solid #e4e7ed;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.panel-header {
  padding: 16px;
  border-bottom: 1px solid #e4e7ed;
  flex-shrink: 0;
}

.panel-header h3 {
  margin: 0 0 8px 0;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.selection-info {
  font-size: 12px;
  color: #909399;
}

.panel-content {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 16px;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #909399;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
  color: #c0c4cc;
}

.multi-selection {
  margin-bottom: 16px;
}

.property-group {
  margin-bottom: 24px;
}

.property-group h4 {
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  border-bottom: 1px solid #e4e7ed;
  padding-bottom: 8px;
}

.align-buttons {
  display: flex;
  width: 100%;
  margin-bottom: 8px;
}

.align-buttons .el-button {
  flex: 1;
}

.field-list {
  max-height: 300px;
  overflow-y: auto;
}

.field-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  margin-bottom: 8px;
  background: #f8f9fa;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.field-item:hover {
  background: #e3f2fd;
}

.field-info {
  flex: 1;
}

.field-name {
  font-size: 14px;
  color: #303133;
  margin-bottom: 4px;
}

.field-binding {
  font-size: 11px;
  color: #67c23a;
  font-family: 'Courier New', monospace;
}

.help-text {
  font-size: 12px;
  color: #909399;
  margin-bottom: 12px;
  line-height: 1.5;
}

.no-fields {
  text-align: center;
  padding: 20px;
  color: #c0c4cc;
}

.image-uploader {
  width: 100%;
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

/* 表单样式优化 */
.el-form-item {
  margin-bottom: 16px;
}

.el-input-number {
  width: 100%;
}

.el-select {
  width: 100%;
}

.el-color-picker {
  width: 100%;
}

/* 标签页样式 */
.el-tabs--border-card {
  border: none;
  box-shadow: none;
}

.el-tabs--border-card > .el-tabs__content {
  padding: 16px 0;
}

/* 响应式设计 */
@media (max-width: 1366px) {
  .panel-content {
    padding: 12px;
  }
  
  .property-group {
    margin-bottom: 16px;
  }
}

@media (max-width: 768px) {
  .panel-content {
    padding: 8px;
  }
}
</style> 