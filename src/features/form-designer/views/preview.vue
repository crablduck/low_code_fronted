<template>
  <div class="form-preview">
    <div class="preview-header">
      <div class="header-left">
        <el-button @click="goBack" :icon="ArrowLeft">返回</el-button>
        <h1>表单预览</h1>
        <el-tag type="success">{{ formData.name || '未命名表单' }}</el-tag>
      </div>
      <div class="header-right">
        <el-button @click="editForm" :icon="Edit">编辑</el-button>
        <el-button type="primary" @click="submitForm" :loading="submitting">
          提交测试
        </el-button>
      </div>
    </div>

    <div class="preview-content">
      <el-row :gutter="20">
        <!-- 左侧：表单预览 -->
        <el-col :span="16">
          <el-card class="form-preview-card">
            <template #header>
              <div class="card-header">
                <span>{{ formData.name || '表单预览' }}</span>
                <el-tag size="small" type="info">预览模式</el-tag>
              </div>
            </template>
            
            <div class="form-container">
              <el-form
                ref="previewFormRef"
                :model="formValues"
                :rules="formRules"
                label-width="120px"
                size="default"
              >
                <el-form-item
                  v-for="field in formFields"
                  :key="field.name"
                  :label="field.label"
                  :prop="field.name"
                  :required="field.required"
                >
                  <!-- 文本输入 -->
                  <el-input
                    v-if="field.type === 'input'"
                    v-model="formValues[field.name]"
                    :placeholder="field.placeholder"
                    :maxlength="field.maxLength"
                    show-word-limit
                  />
                  
                  <!-- 多行文本 -->
                  <el-input
                    v-else-if="field.type === 'textarea'"
                    v-model="formValues[field.name]"
                    type="textarea"
                    :placeholder="field.placeholder"
                    :rows="field.rows || 3"
                    :maxlength="field.maxLength"
                    show-word-limit
                  />
                  
                  <!-- 数字输入 -->
                  <el-input-number
                    v-else-if="field.type === 'number'"
                    v-model="formValues[field.name]"
                    :placeholder="field.placeholder"
                    :min="field.min"
                    :max="field.max"
                    :precision="field.precision"
                    style="width: 100%"
                  />
                  
                  <!-- 下拉选择 -->
                  <el-select
                    v-else-if="field.type === 'select'"
                    v-model="formValues[field.name]"
                    :placeholder="field.placeholder"
                    style="width: 100%"
                    clearable
                  >
                    <el-option
                      v-for="option in field.options"
                      :key="option"
                      :label="option"
                      :value="option"
                    />
                  </el-select>
                  
                  <!-- 单选框 -->
                  <el-radio-group
                    v-else-if="field.type === 'radio'"
                    v-model="formValues[field.name]"
                  >
                    <el-radio
                      v-for="option in field.options"
                      :key="option"
                      :label="option"
                    >
                      {{ option }}
                    </el-radio>
                  </el-radio-group>
                  
                  <!-- 复选框 -->
                  <el-checkbox-group
                    v-else-if="field.type === 'checkbox'"
                    v-model="formValues[field.name]"
                  >
                    <el-checkbox
                      v-for="option in field.options"
                      :key="option"
                      :label="option"
                    >
                      {{ option }}
                    </el-checkbox>
                  </el-checkbox-group>
                  
                  <!-- 日期选择 -->
                  <el-date-picker
                    v-else-if="field.type === 'date'"
                    v-model="formValues[field.name]"
                    type="date"
                    :placeholder="field.placeholder"
                    style="width: 100%"
                  />
                  
                  <!-- 日期时间选择 -->
                  <el-date-picker
                    v-else-if="field.type === 'datetime'"
                    v-model="formValues[field.name]"
                    type="datetime"
                    :placeholder="field.placeholder"
                    style="width: 100%"
                  />
                  
                  <!-- 开关 -->
                  <el-switch
                    v-else-if="field.type === 'switch'"
                    v-model="formValues[field.name]"
                  />
                  
                  <!-- 默认文本输入 -->
                  <el-input
                    v-else
                    v-model="formValues[field.name]"
                    :placeholder="field.placeholder"
                  />
                </el-form-item>
                
                <el-form-item>
                  <el-button type="primary" @click="submitForm" :loading="submitting">
                    提交表单
                  </el-button>
                  <el-button @click="resetForm">重置</el-button>
                </el-form-item>
              </el-form>
            </div>
          </el-card>
        </el-col>
        
        <!-- 右侧：表单信息 -->
        <el-col :span="8">
          <el-card class="form-info-card">
            <template #header>
              <span>表单信息</span>
            </template>
            
            <el-descriptions :column="1" border>
              <el-descriptions-item label="表单名称">
                {{ formData.name || '未命名' }}
              </el-descriptions-item>
              <el-descriptions-item label="表单说明">
                {{ formData.description || '无说明' }}
              </el-descriptions-item>
              <el-descriptions-item label="字段数量">
                {{ formFields.length }}
              </el-descriptions-item>
              <el-descriptions-item label="必填字段">
                {{ requiredFieldsCount }}
              </el-descriptions-item>
              <el-descriptions-item label="创建时间">
                {{ formatDate(formData.createdAt) }}
              </el-descriptions-item>
              <el-descriptions-item label="更新时间">
                {{ formatDate(formData.updatedAt) }}
              </el-descriptions-item>
            </el-descriptions>
          </el-card>
          
          <el-card class="form-data-card" style="margin-top: 20px;">
            <template #header>
              <span>当前表单数据</span>
            </template>
            
            <div class="form-data-preview">
              <pre>{{ JSON.stringify(formValues, null, 2) }}</pre>
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
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowLeft, Edit } from '@element-plus/icons-vue'
import type { FormInstance } from 'element-plus'

const route = useRoute()
const router = useRouter()

// 响应式数据
const submitting = ref(false)
const previewFormRef = ref<FormInstance>()

// 表单数据
const formData = reactive({
  id: '',
  name: '',
  description: '',
  createdAt: '',
  updatedAt: ''
})

// 表单字段
const formFields = ref([])

// 表单值
const formValues = reactive({})

// 表单验证规则
const formRules = computed(() => {
  const rules = {}
  formFields.value.forEach(field => {
    if (field.required) {
      rules[field.name] = [
        { required: true, message: `请输入${field.label}`, trigger: 'blur' }
      ]
    }
  })
  return rules
})

// 计算属性
const requiredFieldsCount = computed(() => {
  return formFields.value.filter(field => field.required).length
})

// 方法
const goBack = () => {
  router.push('/form-designer')
}

const editForm = () => {
  router.push(`/form-designer/edit/${route.params.id}`)
}

const submitForm = async () => {
  if (!previewFormRef.value) return
  
  try {
    await previewFormRef.value.validate()
    
    submitting.value = true
    
    // 模拟提交API调用
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    await ElMessageBox.alert(
      `表单提交成功！\n\n提交数据：\n${JSON.stringify(formValues, null, 2)}`,
      '提交成功',
      {
        confirmButtonText: '确定',
        type: 'success'
      }
    )
    
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('表单验证失败，请检查必填项')
    }
  } finally {
    submitting.value = false
  }
}

const resetForm = () => {
  if (!previewFormRef.value) return
  
  previewFormRef.value.resetFields()
  
  // 重置为默认值
  formFields.value.forEach(field => {
    if (field.defaultValue !== undefined) {
      formValues[field.name] = field.defaultValue
    }
  })
  
  ElMessage.success('表单已重置')
}

const formatDate = (dateStr: string) => {
  if (!dateStr) return '未知'
  return new Date(dateStr).toLocaleString('zh-CN')
}

const loadFormData = async () => {
  try {
    // 模拟加载表单数据
    const formId = route.params.id
    
    // 这里应该调用真实的API
    const mockFormData = {
      id: formId,
      name: '患者登记表',
      description: '新患者入院登记信息收集',
      createdAt: '2024-01-15T10:30:00Z',
      updatedAt: '2024-01-15T14:20:00Z',
      fields: [
        {
          name: 'patient_name',
          label: '患者姓名',
          type: 'input',
          required: true,
          placeholder: '请输入患者姓名'
        },
        {
          name: 'id_card',
          label: '身份证号',
          type: 'input',
          required: true,
          placeholder: '请输入身份证号'
        },
        {
          name: 'gender',
          label: '性别',
          type: 'radio',
          required: true,
          options: ['男', '女']
        },
        {
          name: 'birthday',
          label: '出生日期',
          type: 'date',
          required: true,
          placeholder: '请选择出生日期'
        },
        {
          name: 'phone',
          label: '联系电话',
          type: 'input',
          required: true,
          placeholder: '请输入联系电话'
        },
        {
          name: 'medical_insurance',
          label: '医保类型',
          type: 'select',
          required: false,
          placeholder: '请选择医保类型',
          options: ['城镇职工', '城乡居民', '新农合', '自费']
        },
        {
          name: 'department',
          label: '科室',
          type: 'select',
          required: true,
          placeholder: '请选择科室',
          options: ['内科', '外科', '儿科', '妇科', '骨科']
        },
        {
          name: 'admission_date',
          label: '入院日期',
          type: 'date',
          required: true,
          placeholder: '请选择入院日期'
        }
      ]
    }
    
    // 设置表单数据
    Object.assign(formData, mockFormData)
    formFields.value = mockFormData.fields
    
    // 初始化表单值
    formFields.value.forEach(field => {
      formValues[field.name] = field.defaultValue || (field.type === 'checkbox' ? [] : '')
    })
    
  } catch (error) {
    console.error('加载表单数据失败:', error)
    ElMessage.error('加载表单数据失败')
  }
}

// 生命周期
onMounted(() => {
  loadFormData()
})
</script>

<style scoped lang="scss">
.form-preview {
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.preview-header {
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

.preview-content {
  flex: 1;
  padding: 20px;
  background: #f5f7fa;
  overflow: auto;
}

.form-preview-card {
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
}

.form-container {
  max-width: 600px;
  margin: 0 auto;
}

.form-info-card,
.form-data-card {
  height: fit-content;
}

.form-data-preview {
  max-height: 300px;
  overflow: auto;
  
  pre {
    background: #f5f7fa;
    padding: 12px;
    border-radius: 4px;
    font-size: 12px;
    line-height: 1.4;
    margin: 0;
  }
}

:deep(.el-form-item) {
  margin-bottom: 22px;
}

:deep(.el-descriptions__body) {
  background: white;
}

:deep(.el-descriptions__label) {
  width: 100px;
}
</style> 