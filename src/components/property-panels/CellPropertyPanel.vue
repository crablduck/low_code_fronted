<template>
  <div class="cell-property-panel">
    <el-form :model="cellProps" label-width="80px" size="small">
      <!-- 基本属性 -->
      <div class="property-group">
        <h4>基本属性</h4>
        <el-form-item label="内容">
          <el-input 
            v-model="cellProps.content" 
            type="textarea" 
            :rows="3"
            placeholder="请输入单元格内容"
            @input="updateProperty('content', $event)"
          />
        </el-form-item>
        
        <el-form-item label="数据类型">
          <el-select 
            v-model="cellProps.dataType" 
            style="width: 100%"
            @change="updateProperty('dataType', $event)"
          >
            <el-option label="文本" value="text" />
            <el-option label="数字" value="number" />
            <el-option label="日期" value="date" />
            <el-option label="布尔值" value="boolean" />
            <el-option label="公式" value="formula" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="格式化">
          <el-input 
            v-model="cellProps.format" 
            placeholder="如：#,##0.00"
            @input="updateProperty('format', $event)"
          />
        </el-form-item>
      </div>
      
      <!-- 数据绑定 -->
      <div class="property-group">
        <h4>数据绑定</h4>
        <el-form-item label="数据源">
          <el-select 
            v-model="cellProps.dataSource" 
            style="width: 100%"
            @change="updateProperty('dataSource', $event)"
          >
            <el-option label="无" value="" />
            <el-option 
              v-for="ds in dataSources" 
              :key="ds.id" 
              :label="ds.name" 
              :value="ds.id" 
            />
          </el-select>
        </el-form-item>
        
        <el-form-item label="字段">
          <el-select 
            v-model="cellProps.field" 
            style="width: 100%"
            :disabled="!cellProps.dataSource"
            @change="updateProperty('field', $event)"
          >
            <el-option 
              v-for="field in availableFields" 
              :key="field" 
              :label="field" 
              :value="field" 
            />
          </el-select>
        </el-form-item>
        
        <el-form-item label="表达式">
          <el-input 
            v-model="cellProps.expression" 
            placeholder="如：${data.field_name}"
            @input="updateProperty('expression', $event)"
          />
          <div class="form-tip">支持表达式绑定，如 ${data.field_name}</div>
        </el-form-item>
      </div>
      
      <!-- 验证规则 -->
      <div class="property-group">
        <h4>验证规则</h4>
        <el-form-item label="必填">
          <el-switch 
            v-model="cellProps.required" 
            @change="updateProperty('required', $event)"
          />
        </el-form-item>
        
        <el-form-item label="最小值" v-if="cellProps.dataType === 'number'">
          <el-input-number 
            v-model="cellProps.min" 
            style="width: 100%"
            @change="updateProperty('min', $event)"
          />
        </el-form-item>
        
        <el-form-item label="最大值" v-if="cellProps.dataType === 'number'">
          <el-input-number 
            v-model="cellProps.max" 
            style="width: 100%"
            @change="updateProperty('max', $event)"
          />
        </el-form-item>
        
        <el-form-item label="正则表达式" v-if="cellProps.dataType === 'text'">
          <el-input 
            v-model="cellProps.pattern" 
            placeholder="如：^[0-9]+$"
            @input="updateProperty('pattern', $event)"
          />
        </el-form-item>
      </div>
      
      <!-- 显示设置 -->
      <div class="property-group">
        <h4>显示设置</h4>
        <el-form-item label="只读">
          <el-switch 
            v-model="cellProps.readonly" 
            @change="updateProperty('readonly', $event)"
          />
        </el-form-item>
        
        <el-form-item label="隐藏">
          <el-switch 
            v-model="cellProps.hidden" 
            @change="updateProperty('hidden', $event)"
          />
        </el-form-item>
        
        <el-form-item label="合并单元格">
          <div class="merge-controls">
            <el-input-number 
              v-model="cellProps.rowspan" 
              :min="1" 
              :max="20"
              placeholder="行"
              @change="updateProperty('rowspan', $event)"
            />
            <span>×</span>
            <el-input-number 
              v-model="cellProps.colspan" 
              :min="1" 
              :max="20"
              placeholder="列"
              @change="updateProperty('colspan', $event)"
            />
          </div>
        </el-form-item>
      </div>
    </el-form>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'

// Props 定义
interface Props {
  cell: any
  dataSources?: any[]
}

// Emits 定义
interface Emits {
  (e: 'update', data: any): void
}

const props = withDefaults(defineProps<Props>(), {
  dataSources: () => []
})

const emit = defineEmits<Emits>()

// 响应式数据
const cellProps = reactive({
  content: '',
  dataType: 'text',
  format: '',
  dataSource: '',
  field: '',
  expression: '',
  required: false,
  min: undefined,
  max: undefined,
  pattern: '',
  readonly: false,
  hidden: false,
  rowspan: 1,
  colspan: 1
})

// 计算属性
const availableFields = computed(() => {
  if (!cellProps.dataSource) return []
  
  const dataSource = props.dataSources.find(ds => ds.id === cellProps.dataSource)
  if (!dataSource) return []
  
  // 这里应该根据数据源获取字段列表
  // 暂时返回示例字段
  return ['field1', 'field2', 'field3', 'name', 'value', 'date']
})

// 方法
const updateProperty = (key: string, value: any) => {
  emit('update', { [key]: value })
}

// 监听 cell 变化，更新本地属性
watch(() => props.cell, (newCell) => {
  if (newCell) {
    Object.assign(cellProps, {
      content: newCell.content || '',
      dataType: newCell.dataType || 'text',
      format: newCell.format || '',
      dataSource: newCell.dataSource || '',
      field: newCell.field || '',
      expression: newCell.expression || '',
      required: newCell.required || false,
      min: newCell.min,
      max: newCell.max,
      pattern: newCell.pattern || '',
      readonly: newCell.readonly || false,
      hidden: newCell.hidden || false,
      rowspan: newCell.rowspan || 1,
      colspan: newCell.colspan || 1
    })
  }
}, { immediate: true })
</script>

<style scoped lang="scss">
.cell-property-panel {
  padding: 16px;
}

.property-group {
  margin-bottom: 24px;
  
  h4 {
    margin: 0 0 16px 0;
    font-size: 14px;
    color: #303133;
    font-weight: 500;
    border-bottom: 1px solid #e4e7ed;
    padding-bottom: 8px;
  }
}

.form-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
  line-height: 1.4;
}

.merge-controls {
  display: flex;
  align-items: center;
  gap: 8px;
  
  .el-input-number {
    flex: 1;
  }
  
  span {
    color: #909399;
    font-weight: 500;
  }
}

:deep(.el-form-item) {
  margin-bottom: 16px;
}

:deep(.el-form-item__label) {
  font-size: 13px;
  color: #606266;
}

:deep(.el-input__wrapper) {
  border-radius: 6px;
}

:deep(.el-select .el-input__wrapper) {
  border-radius: 6px;
}

:deep(.el-textarea__inner) {
  border-radius: 6px;
}
</style> 