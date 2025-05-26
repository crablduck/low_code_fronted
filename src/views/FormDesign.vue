<template>
  <div class="form-design-container">
    <FormKit
      type="form"
      v-model="formData"
      @submit="handleSubmit"
      :config="{ validationVisibility: 'live' }"
    >
      <div class="form-grid">
        <div class="form-section">
          <h3>基本信息</h3>
          <div class="form-row">
            <FormKit
              type="text"
              name="patientName"
              label="患者姓名"
              validation="required"
              validation-label="患者姓名"
              placeholder="请输入患者姓名"
            />
            <FormKit
              type="select"
              name="gender"
              label="性别"
              :options="['男', '女']"
              validation="required"
              validation-label="性别"
            />
          </div>
          <div class="form-row">
            <FormKit
              type="number"
              name="age"
              label="年龄"
              validation="required|number|min:0|max:150"
              validation-label="年龄"
            />
            <FormKit
              type="date"
              name="visitDate"
              label="就诊日期"
              validation="required"
              validation-label="就诊日期"
            />
          </div>
        </div>

        <div class="form-section">
          <h3>病情描述</h3>
          <FormKit
            type="textarea"
            name="chiefComplaint"
            label="主诉"
            validation="required"
            validation-label="主诉"
            placeholder="请描述患者主要症状..."
          />
          <FormKit
            type="textarea"
            name="medicalHistory"
            label="既往病史"
            placeholder="请描述患者既往病史..."
          />
          <FormKit
            type="checkbox"
            name="allergies"
            label="过敏史"
            :options="{
              penicillin: '青霉素',
              sulfa: '磺胺类',
              cephalosporin: '头孢类',
              other: '其他'
            }"
          />
        </div>

        <div class="form-section">
          <h3>生命体征</h3>
          <div class="form-row">
            <FormKit
              type="text"
              name="bloodPressure"
              label="血压"
              placeholder="例如: 120/80 mmHg"
            />
            <FormKit
              type="number"
              name="heartRate"
              label="心率"
              validation="number|min:0|max:300"
              help="次/分钟"
            />
            <FormKit
              type="number"
              name="temperature"
              label="体温"
              validation="number|min:35|max:42"
              help="℃"
            />
          </div>
        </div>

        <div class="form-section">
          <h3>诊疗信息</h3>
          <FormKit
            type="textarea"
            name="diagnosis"
            label="诊断结果"
            validation="required"
            validation-label="诊断结果"
            placeholder="请输入诊断结果..."
          />
          <FormKit
            type="textarea"
            name="treatmentPlan"
            label="治疗方案"
            validation="required"
            validation-label="治疗方案"
            placeholder="请输入治疗方案..."
          />
          <FormKit
            type="file"
            name="attachments"
            label="附件上传"
            accept=".jpg,.png,.pdf"
            multiple="true"
          />
        </div>

        <div class="form-actions">
          <FormKit type="submit">保存表单</FormKit>
        </div>
      </div>
    </FormKit>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

// 表单数据
const formData = ref({
  patientName: '',
  gender: '',
  age: null,
  visitDate: '',
  chiefComplaint: '',
  medicalHistory: '',
  allergies: [],
  bloodPressure: '',
  heartRate: null,
  temperature: null,
  diagnosis: '',
  treatmentPlan: '',
  attachments: []
})

// 表单提交处理
const handleSubmit = (formData: any) => {
  console.log('表单数据：', formData)
  // 这里可以添加提交到后端的逻辑
}
</script>

<style scoped>
.form-design-container {
  width: 100%;
  max-width: 1200px;
  margin: 20px auto;
  padding: 20px;
}

.form-grid {
  display: grid;
  gap: 20px;
  background: #fff;
  padding: 24px;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.form-section {
  background: #f8f9fa;
  padding: 24px;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

.form-section h3 {
  margin: 0 0 20px 0;
  color: #303133;
  font-size: 18px;
  font-weight: 500;
  border-bottom: 2px solid #409eff;
  padding-bottom: 10px;
}

.form-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 16px;
}

.form-actions {
  display: flex;
  justify-content: center;
  margin-top: 20px;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
}

:deep(.formkit-outer) {
  margin-bottom: 16px;
}

:deep(.formkit-label) {
  font-weight: 500;
  color: #606266;
  margin-bottom: 8px;
  font-size: 14px;
}

:deep(.formkit-input) {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  transition: all 0.3s;
  font-size: 14px;
  line-height: 1.4;
}

:deep(.formkit-input:focus) {
  border-color: #409eff;
  outline: none;
  box-shadow: 0 0 0 3px rgba(64, 158, 255, 0.1);
}

:deep(.formkit-help) {
  color: #909399;
  font-size: 12px;
  margin-top: 4px;
}

:deep(.formkit-messages) {
  color: #f56c6c;
  font-size: 12px;
  margin-top: 4px;
}

:deep(.formkit-submit) {
  background-color: #409eff;
  border: none;
  color: white;
  padding: 12px 30px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
  font-weight: 500;
  transition: all 0.3s;
}

:deep(.formkit-submit:hover) {
  background-color: #66b1ff;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.3);
}

:deep(.formkit-textarea) {
  min-height: 100px;
  resize: vertical;
}

@media (max-width: 768px) {
  .form-design-container {
    padding: 10px;
  }
  
  .form-grid {
    padding: 16px;
  }
  
  .form-section {
    padding: 16px;
  }
  
  .form-row {
    grid-template-columns: 1fr;
  }
}
</style> 