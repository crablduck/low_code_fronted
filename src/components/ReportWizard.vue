/*
 * @Author: Mr.Crab
 * @Date: 2025-01-14 10:00:00
 * @LastEditors: Mr.Crab
 * @LastEditTime: 2025-01-14 10:00:00
 * @FilePath: /workflow-system/src/components/ReportWizard.vue
 * @Description: 报表创建向导
 */
<template>
  <el-dialog
    v-model="visible"
    title="创建报表"
    width="800px"
    :before-close="handleClose"
    destroy-on-close
  >
    <el-steps :active="currentStep" finish-status="success" align-center>
      <el-step title="基本信息" />
      <el-step title="选择模板" />
    </el-steps>

    <div class="wizard-content">
      <!-- 第一步：基本信息 -->
      <div v-if="currentStep === 0" class="step-content">
        <el-form
          ref="basicFormRef"
          :model="reportForm"
          :rules="basicRules"
          label-width="100px"
          size="large"
        >
          <el-form-item label="报表名称" prop="name">
            <el-input
              v-model="reportForm.name"
              placeholder="请输入报表名称"
              clearable
            />
          </el-form-item>

          <el-form-item label="报表描述" prop="description">
            <el-input
              v-model="reportForm.description"
              type="textarea"
              :rows="3"
              placeholder="请输入报表描述（可选）"
            />
          </el-form-item>

          <el-form-item label="报表分类" prop="category">
            <el-select
              v-model="reportForm.category"
              placeholder="请选择报表分类"
              style="width: 100%"
            >
              <el-option label="销售报表" value="sales" />
              <el-option label="财务报表" value="finance" />
              <el-option label="运营报表" value="operation" />
              <el-option label="统计报表" value="statistics" />
              <el-option label="其他" value="other" />
            </el-select>
          </el-form-item>

          <el-form-item label="报表状态" prop="status">
            <el-radio-group v-model="reportForm.status">
              <el-radio label="draft">草稿</el-radio>
              <el-radio label="published">发布</el-radio>
            </el-radio-group>
          </el-form-item>
        </el-form>
      </div>

      <!-- 第二步：选择模板 -->
      <div v-if="currentStep === 1" class="step-content">
        <div class="template-section">
          <h3>选择报表模板</h3>
          <p class="section-desc">选择一个模板开始创建报表，或选择空白模板自由设计</p>
          
          <el-row :gutter="20" class="template-grid">
            <!-- 空白模板 -->
            <el-col :span="8">
              <div
                class="template-card"
                :class="{ 'selected': selectedTemplate === 'blank' }"
                @click="selectTemplate('blank')"
              >
                <div class="template-preview blank-preview">
                  <el-icon size="48"><Document /></el-icon>
                  <div class="preview-text">空白报表</div>
                </div>
                <div class="template-info">
                  <h4>空白模板</h4>
                  <p>从空白页面开始，自由设计报表结构</p>
                </div>
              </div>
            </el-col>

            <!-- 表格模板 -->
            <el-col :span="8">
              <div
                class="template-card"
                :class="{ 'selected': selectedTemplate === 'table' }"
                @click="selectTemplate('table')"
              >
                <div class="template-preview table-preview">
                  <div class="preview-table">
                    <div class="table-header">
                      <span>姓名</span>
                      <span>年龄</span>
                      <span>状态</span>
                    </div>
                    <div class="table-row">
                      <span>张三</span>
                      <span>65</span>
                      <span>已退休</span>
                    </div>
                    <div class="table-row">
                      <span>李四</span>
                      <span>45</span>
                      <span>在职</span>
                    </div>
                  </div>
                </div>
                <div class="template-info">
                  <h4>数据表格</h4>
                  <p>展示结构化数据的表格报表</p>
                </div>
              </div>
            </el-col>

            <!-- 统计模板 -->
            <el-col :span="8">
              <div
                class="template-card"
                :class="{ 'selected': selectedTemplate === 'chart' }"
                @click="selectTemplate('chart')"
              >
                <div class="template-preview chart-preview">
                  <div class="preview-chart">
                    <div class="chart-title">退休统计</div>
                    <div class="chart-content">
                      <div class="bar-item">
                        <span>已退休</span>
                        <div class="bar" style="width: 60%"></div>
                        <span>60%</span>
                      </div>
                      <div class="bar-item">
                        <span>在职</span>
                        <div class="bar" style="width: 40%"></div>
                        <span>40%</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div class="template-info">
                  <h4>统计图表</h4>
                  <p>包含图表和统计分析的报表</p>
                </div>
              </div>
            </el-col>
          </el-row>

          <!-- 模板描述 -->
          <div v-if="selectedTemplate" class="template-description">
            <h4>{{ getTemplateTitle() }}</h4>
            <p>{{ getTemplateDescription() }}</p>
            <div class="template-features">
              <el-tag
                v-for="feature in getTemplateFeatures()"
                :key="feature"
                type="info"
                size="small"
                class="feature-tag"
              >
                {{ feature }}
              </el-tag>
            </div>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button v-if="currentStep > 0" @click="prevStep">上一步</el-button>
        <el-button
          v-if="currentStep < 1"
          type="primary"
          @click="nextStep"
          :loading="validating"
        >
          下一步
        </el-button>
        <el-button
          v-if="currentStep === 1"
          type="primary"
          @click="createReport"
          :loading="creating"
          :disabled="!selectedTemplate"
        >
          创建报表并进入设计器
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Document } from '@element-plus/icons-vue'
import type { FormInstance, FormRules } from 'element-plus'
import { reportApi } from '@/api/report'
import type { ReportCreateRequest } from '@/api/report'

interface Props {
  modelValue: boolean
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'done'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()
const router = useRouter()

// 响应式数据
const currentStep = ref(0)
const validating = ref(false)
const creating = ref(false)
const selectedTemplate = ref('')
const basicFormRef = ref<FormInstance>()

// 表单数据
const reportForm = reactive({
  name: '',
  description: '',
  category: 'other',
  status: 'draft'
})

// 计算属性
const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

// 表单验证规则
const basicRules: FormRules = {
  name: [
    { required: true, message: '请输入报表名称', trigger: 'blur' },
    { min: 2, max: 50, message: '报表名称长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  category: [
    { required: true, message: '请选择报表分类', trigger: 'change' }
  ]
}

// 方法
const nextStep = async () => {
  if (currentStep.value === 0) {
    // 验证基本信息表单
    if (!basicFormRef.value) return
    
    validating.value = true
    try {
      const valid = await basicFormRef.value.validate()
      if (valid) {
        currentStep.value++
      }
    } catch (error) {
      ElMessage.error('请完善基本信息')
    } finally {
      validating.value = false
    }
  }
}

const prevStep = () => {
  if (currentStep.value > 0) {
    currentStep.value--
  }
}

const selectTemplate = (template: string) => {
  selectedTemplate.value = template
}

const getTemplateTitle = () => {
  const titles = {
    blank: '空白模板',
    table: '数据表格模板',
    chart: '统计图表模板'
  }
  return titles[selectedTemplate.value] || ''
}

const getTemplateDescription = () => {
  const descriptions = {
    blank: '提供一个空白的报表画布，您可以自由添加文本、表格、图表等元素，完全自定义报表布局。',
    table: '预设了表格结构，适合展示员工信息、数据列表等结构化数据，支持数据源绑定和自动填充。',
    chart: '包含预设的图表和统计分析功能，适合制作数据分析报表，如年龄统计、退休分析等。'
  }
  return descriptions[selectedTemplate.value] || ''
}

const getTemplateFeatures = () => {
  const features = {
    blank: ['自由布局', '拖拽设计', '多种组件'],
    table: ['数据绑定', '自动填充', '表格样式'],
    chart: ['图表展示', '数据统计', '可视化分析']
  }
  return features[selectedTemplate.value] || []
}

const createReport = async () => {
  if (!selectedTemplate.value) {
    ElMessage.warning('请选择一个模板')
    return
  }

  creating.value = true
  try {
    // 根据模板生成配置
    const config = generateTemplateConfig(selectedTemplate.value)
    
    const reportData: ReportCreateRequest = {
      name: reportForm.name,
      description: reportForm.description,
      category: reportForm.category as any,
      status: reportForm.status as any,
      config
    }

    const result = await reportApi.createReport(reportData)
    
    if (result.code === 200) {
      ElMessage.success('报表创建成功！正在进入设计器...')
      
      // 关闭对话框
      handleClose()
      
      // 跳转到报表设计器
      setTimeout(() => {
        router.push({
          path: '/report-designer/edit',
          query: {
            id: result.data.id.toString(),
            mode: 'edit',
            template: selectedTemplate.value
          }
        })
      }, 500)
    } else {
      throw new Error(result.message)
    }
  } catch (error: any) {
    ElMessage.error('创建失败: ' + error.message)
  } finally {
    creating.value = false
  }
}

const generateTemplateConfig = (template: string) => {
  const baseConfig = {
    template,
    dataSource: {
      type: 'table' as const,
      tableName: '',
      sqlQuery: '',
      staticData: ''
    },
    fields: {
      selected: [],
      mapping: {}
    },
    tableConfig: {
      rowCount: 10,
      colCount: 6,
      height: 400
    }
  }

  switch (template) {
    case 'table':
      return {
        ...baseConfig,
        dataSource: {
          type: 'table' as const,
          tableName: 'employee_info',
          sqlQuery: '',
          staticData: ''
        },
        fields: {
          selected: ['name', 'age', 'department', 'status'],
          mapping: {
            'name': '姓名',
            'age': '年龄',
            'department': '部门',
            'status': '状态'
          }
        },
        tableConfig: {
          rowCount: 15,
          colCount: 4,
          height: 500
        }
      }
    
    case 'chart':
      return {
        ...baseConfig,
        dataSource: {
          type: 'sql' as const,
          tableName: '',
          sqlQuery: 'SELECT age, COUNT(*) as count FROM employee_info GROUP BY CASE WHEN age >= 60 THEN "已退休" ELSE "在职" END',
          staticData: ''
        },
        fields: {
          selected: ['age_group', 'count'],
          mapping: {
            'age_group': '年龄组',
            'count': '人数'
          }
        }
      }
    
    default: // blank
      return baseConfig
  }
}

const handleClose = () => {
  // 重置表单和步骤
  currentStep.value = 0
  selectedTemplate.value = ''
  Object.assign(reportForm, {
    name: '',
    description: '',
    category: 'other',
    status: 'draft'
  })
  
  visible.value = false
}
</script>

<style scoped lang="scss">
.wizard-content {
  margin: 30px 0;
  min-height: 400px;
}

.step-content {
  padding: 20px 0;
}

.template-section {
  .section-desc {
    color: #666;
    margin-bottom: 30px;
    text-align: center;
  }
}

.template-grid {
  margin-bottom: 30px;
}

.template-card {
  border: 2px solid #e4e7ed;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  overflow: hidden;

  &:hover {
    border-color: #409eff;
    box-shadow: 0 4px 12px rgba(64, 158, 255, 0.2);
  }

  &.selected {
    border-color: #409eff;
    background-color: #f0f8ff;
    box-shadow: 0 4px 12px rgba(64, 158, 255, 0.3);
  }
}

.template-preview {
  height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #fafafa;
  border-bottom: 1px solid #e4e7ed;

  &.blank-preview {
    flex-direction: column;
    color: #909399;

    .preview-text {
      margin-top: 8px;
      font-size: 14px;
    }
  }
}

.preview-table {
  width: 80%;
  border: 1px solid #ddd;
  border-radius: 4px;
  overflow: hidden;
  font-size: 12px;

  .table-header {
    display: flex;
    background-color: #409eff;
    color: white;
    
    span {
      flex: 1;
      padding: 4px 8px;
      text-align: center;
      border-right: 1px solid rgba(255, 255, 255, 0.3);
      
      &:last-child {
        border-right: none;
      }
    }
  }

  .table-row {
    display: flex;
    background-color: white;
    
    &:nth-child(even) {
      background-color: #f9f9f9;
    }
    
    span {
      flex: 1;
      padding: 4px 8px;
      text-align: center;
      border-right: 1px solid #eee;
      
      &:last-child {
        border-right: none;
      }
    }
  }
}

.preview-chart {
  width: 80%;
  font-size: 11px;

  .chart-title {
    text-align: center;
    font-weight: bold;
    margin-bottom: 8px;
    color: #333;
  }

  .bar-item {
    display: flex;
    align-items: center;
    margin-bottom: 4px;
    gap: 8px;

    span:first-child {
      width: 40px;
      text-align: right;
      font-size: 10px;
    }

    .bar {
      height: 12px;
      background-color: #409eff;
      border-radius: 2px;
      flex: 1;
      max-width: 60px;
    }

    span:last-child {
      width: 30px;
      font-size: 10px;
    }
  }
}

.template-info {
  padding: 16px;

  h4 {
    margin: 0 0 8px 0;
    color: #303133;
    font-size: 16px;
  }

  p {
    margin: 0;
    color: #606266;
    font-size: 14px;
    line-height: 1.4;
  }
}

.template-description {
  background-color: #f8f9fa;
  padding: 20px;
  border-radius: 8px;
  border: 1px solid #e9ecef;

  h4 {
    margin: 0 0 12px 0;
    color: #409eff;
    font-size: 18px;
  }

  p {
    margin: 0 0 16px 0;
    color: #606266;
    line-height: 1.6;
  }
}

.template-features {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.feature-tag {
  margin: 0;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
</style> 