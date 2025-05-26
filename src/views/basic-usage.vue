<template>
  <div class="example-container">
    <h1>快速表单生成向导 - 使用示例</h1>
    
    <!-- 基本使用 -->
    <el-card class="example-card">
      <template #header>
        <div class="card-header">
          <span>基本使用</span>
          <el-button type="primary" @click="showBasicWizard = true">
            打开向导
          </el-button>
        </div>
      </template>
      
      <p>点击按钮打开快速表单生成向导，体验3步创建表单的流程。</p>
      
      <!-- 配置结果展示 -->
      <div v-if="lastConfig" class="config-result">
        <h4>最后一次配置结果：</h4>
        <el-descriptions :column="2" border>
          <el-descriptions-item label="表单名称">
            {{ lastConfig.basic.name }}
          </el-descriptions-item>
          <el-descriptions-item label="数据源">
            {{ lastConfig.basic.dataSource }}
          </el-descriptions-item>
          <el-descriptions-item label="选择模板">
            {{ getTemplateName(lastConfig.template.selectedTemplate) }}
          </el-descriptions-item>
          <el-descriptions-item label="字段数量">
            {{ lastConfig.template.fields.length }}
          </el-descriptions-item>
          <el-descriptions-item label="路由路径">
            {{ lastConfig.page.routePath }}
          </el-descriptions-item>
          <el-descriptions-item label="自动生成菜单">
            {{ lastConfig.page.autoGenerateMenu ? '是' : '否' }}
          </el-descriptions-item>
        </el-descriptions>
        
        <!-- 字段列表 -->
        <div class="fields-preview">
          <h4>字段列表：</h4>
          <el-table :data="lastConfig.template.fields" size="small" border>
            <el-table-column prop="label" label="字段名称" width="120" />
            <el-table-column prop="name" label="字段标识" width="120" />
            <el-table-column prop="type" label="类型" width="100" />
            <el-table-column prop="required" label="必填" width="80">
              <template #default="{ row }">
                <el-tag :type="row.required ? 'danger' : 'info'" size="small">
                  {{ row.required ? '是' : '否' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="placeholder" label="提示信息" />
          </el-table>
        </div>
      </div>
    </el-card>

    <!-- 医疗行业示例 -->
    <el-card class="example-card">
      <template #header>
        <div class="card-header">
          <span>医疗行业示例</span>
          <el-button type="success" @click="createMedicalForm">
            创建患者信息表
          </el-button>
        </div>
      </template>
      
      <p>演示医疗行业常见的患者信息表单创建流程。</p>
      
      <div class="medical-examples">
        <el-row :gutter="20">
          <el-col :span="8">
            <div class="example-item">
              <h4>患者登记表</h4>
              <p>包含基本信息、医保类型、科室等字段</p>
              <el-button size="small" @click="createPatientForm">快速创建</el-button>
            </div>
          </el-col>
          <el-col :span="8">
            <div class="example-item">
              <h4>药品信息表</h4>
              <p>药品名称、规格、厂家、价格等信息</p>
              <el-button size="small" @click="createMedicineForm">快速创建</el-button>
            </div>
          </el-col>
          <el-col :span="8">
            <div class="example-item">
              <h4>检查报告表</h4>
              <p>检查项目、结果、建议等信息录入</p>
              <el-button size="small" @click="createReportForm">快速创建</el-button>
            </div>
          </el-col>
        </el-row>
      </div>
    </el-card>

    <!-- API 模拟 -->
    <el-card class="example-card">
      <template #header>
        <span>API 接口模拟</span>
      </template>
      
      <p>本示例使用模拟数据，实际项目中需要对接真实的后端API。</p>
      
      <el-tabs>
        <el-tab-pane label="数据源接口" name="datasource">
          <pre><code>GET /api/data-sources
{{ JSON.stringify(mockDataSources, null, 2) }}</code></pre>
        </el-tab-pane>
        <el-tab-pane label="数据表接口" name="tables">
          <pre><code>GET /api/table-list?db=mysql_main
{{ JSON.stringify(mockTables, null, 2) }}</code></pre>
        </el-tab-pane>
        <el-tab-pane label="菜单接口" name="menus">
          <pre><code>GET /api/menu-list
{{ JSON.stringify(mockMenus, null, 2) }}</code></pre>
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <!-- 快速表单生成向导 -->
    <QuickFormWizard
      v-model="showBasicWizard"
      @done="handleWizardDone"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import QuickFormWizard from '@/components/FormWizard/QuickFormWizard.vue'
import type { FormConfig } from '@/types/form-wizard'

// 响应式数据
const showBasicWizard = ref(false)
const lastConfig = ref<FormConfig | null>(null)

// 模拟数据
const mockDataSources = [
  { id: 'mysql_main', name: '主数据库 (MySQL)', type: 'mysql' },
  { id: 'postgres_his', name: 'HIS系统数据库 (PostgreSQL)', type: 'postgresql' },
  { id: 'mongo_logs', name: '日志数据库 (MongoDB)', type: 'mongodb' }
]

const mockTables = [
  { name: 'users', comment: '用户表' },
  { name: 'patients', comment: '患者信息表' },
  { name: 'doctors', comment: '医生信息表' },
  { name: 'departments', comment: '科室表' },
  { name: 'medicines', comment: '药品信息表' }
]

const mockMenus = [
  { id: 'system', name: '系统管理', path: '/system' },
  { id: 'medical', name: '医疗管理', path: '/medical' },
  { id: 'patient', name: '患者管理', path: '/patient' },
  { id: 'medicine', name: '药品管理', path: '/medicine' },
  { id: 'report', name: '报表中心', path: '/report' }
]

// 模板名称映射
const templateNames = {
  'personal': '个人信息模板',
  'product': '商品信息模板',
  'empty': '空模板'
}

// 方法
const handleWizardDone = (config: FormConfig) => {
  lastConfig.value = config
  ElMessage.success('表单配置完成！')
  
  console.log('表单配置:', config)
  
  // 模拟后续处理
  setTimeout(() => {
    ElMessage.info('正在生成表单页面...')
    
    setTimeout(() => {
      ElMessage.success('表单页面生成成功！可以在菜单中查看。')
    }, 2000)
  }, 1000)
}

const getTemplateName = (templateId: string) => {
  return templateNames[templateId] || templateId
}

const createMedicalForm = () => {
  ElMessage.info('正在准备医疗表单模板...')
  showBasicWizard.value = true
}

const createPatientForm = () => {
  // 预设患者信息表单配置
  const patientConfig = {
    basic: {
      name: '患者登记表',
      description: '新患者入院登记信息收集',
      dataSource: 'mysql_main',
      existingTable: ''
    },
    template: {
      selectedTemplate: 'personal',
      fields: [
        { name: 'patient_name', label: '患者姓名', type: 'input', required: true },
        { name: 'id_card', label: '身份证号', type: 'input', required: true },
        { name: 'gender', label: '性别', type: 'select', required: true, options: ['男', '女'] },
        { name: 'birthday', label: '出生日期', type: 'date', required: true },
        { name: 'phone', label: '联系电话', type: 'input', required: true },
        { name: 'medical_insurance', label: '医保类型', type: 'select', required: false, options: ['城镇职工', '城乡居民', '新农合', '自费'] },
        { name: 'department', label: '科室', type: 'select', required: true },
        { name: 'admission_date', label: '入院日期', type: 'date', required: true }
      ]
    },
    page: {
      autoGenerateMenu: true,
      parentMenu: 'patient',
      routePath: 'patient_register',
      pageTitle: '患者登记'
    }
  }
  
  handleWizardDone(patientConfig)
}

const createMedicineForm = () => {
  const medicineConfig = {
    basic: {
      name: '药品信息表',
      description: '药品基础信息管理',
      dataSource: 'mysql_main',
      existingTable: ''
    },
    template: {
      selectedTemplate: 'product',
      fields: [
        { name: 'medicine_name', label: '药品名称', type: 'input', required: true },
        { name: 'medicine_code', label: '药品编码', type: 'input', required: true },
        { name: 'specification', label: '规格', type: 'input', required: true },
        { name: 'manufacturer', label: '生产厂家', type: 'input', required: true },
        { name: 'price', label: '单价', type: 'number', required: true },
        { name: 'stock', label: '库存数量', type: 'number', required: true },
        { name: 'category', label: '药品分类', type: 'select', required: true },
        { name: 'expiry_date', label: '有效期', type: 'date', required: true }
      ]
    },
    page: {
      autoGenerateMenu: true,
      parentMenu: 'medicine',
      routePath: 'medicine_info',
      pageTitle: '药品信息管理'
    }
  }
  
  handleWizardDone(medicineConfig)
}

const createReportForm = () => {
  const reportConfig = {
    basic: {
      name: '检查报告表',
      description: '医疗检查报告信息录入',
      dataSource: 'mysql_main',
      existingTable: ''
    },
    template: {
      selectedTemplate: 'empty',
      fields: [
        { name: 'patient_id', label: '患者ID', type: 'input', required: true },
        { name: 'exam_type', label: '检查类型', type: 'select', required: true, options: ['血常规', 'X光', 'CT', 'MRI', '超声'] },
        { name: 'exam_date', label: '检查日期', type: 'datetime', required: true },
        { name: 'doctor_name', label: '检查医生', type: 'input', required: true },
        { name: 'result', label: '检查结果', type: 'textarea', required: true },
        { name: 'suggestion', label: '医生建议', type: 'textarea', required: false },
        { name: 'status', label: '报告状态', type: 'select', required: true, options: ['待审核', '已审核', '已发布'] }
      ]
    },
    page: {
      autoGenerateMenu: true,
      parentMenu: 'medical',
      routePath: 'exam_report',
      pageTitle: '检查报告管理'
    }
  }
  
  handleWizardDone(reportConfig)
}
</script>

<style scoped lang="scss">
.example-container {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
  
  h1 {
    text-align: center;
    color: #303133;
    margin-bottom: 30px;
  }
}

.example-card {
  margin-bottom: 20px;
  
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
}

.config-result {
  margin-top: 20px;
  padding: 20px;
  background-color: #f5f7fa;
  border-radius: 8px;
  
  h4 {
    margin-top: 0;
    color: #303133;
  }
}

.fields-preview {
  margin-top: 20px;
  
  h4 {
    margin-bottom: 10px;
    color: #303133;
  }
}

.medical-examples {
  .example-item {
    padding: 20px;
    border: 1px solid #e4e7ed;
    border-radius: 8px;
    text-align: center;
    
    h4 {
      margin: 0 0 10px 0;
      color: #303133;
    }
    
    p {
      margin: 0 0 15px 0;
      color: #606266;
      font-size: 14px;
    }
  }
}

pre {
  background-color: #f5f7fa;
  padding: 15px;
  border-radius: 4px;
  overflow-x: auto;
  font-size: 12px;
  
  code {
    color: #303133;
  }
}
</style>
