<template>
  <el-dialog
    v-model="visible"
    :title="isEdit ? '编辑数据源' : '新建数据源'"
    width="600px"
    :before-close="handleClose"
  >
    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-width="120px"
    >
      <el-form-item label="数据源名称" prop="name">
        <el-input v-model="form.name" placeholder="请输入数据源名称" />
      </el-form-item>
      
      <el-form-item label="数据源类型" prop="type">
        <el-select v-model="form.type" placeholder="请选择数据源类型" style="width: 100%">
          <el-option label="MySQL" value="mysql" />
          <el-option label="PostgreSQL" value="postgresql" />
          <el-option label="SQLite" value="sqlite" />
          <el-option label="Oracle" value="oracle" />
          <el-option label="SQL Server" value="sqlserver" />
        </el-select>
      </el-form-item>
      
      <el-form-item label="主机地址" prop="host" v-if="form.type !== 'sqlite'">
        <el-input v-model="form.host" placeholder="请输入主机地址" />
      </el-form-item>
      
      <el-form-item label="端口" prop="port" v-if="form.type !== 'sqlite'">
        <el-input-number 
          v-model="form.port" 
          :min="1" 
          :max="65535" 
          placeholder="请输入端口号"
          style="width: 100%"
        />
      </el-form-item>
      
      <el-form-item label="数据库名称" prop="databaseName">
        <el-input v-model="form.databaseName" placeholder="请输入数据库名称" />
      </el-form-item>
      
      <el-form-item label="用户名" prop="username" v-if="form.type !== 'sqlite'">
        <el-input v-model="form.username" placeholder="请输入用户名" />
      </el-form-item>
      
      <el-form-item label="密码" prop="password" v-if="form.type !== 'sqlite'">
        <el-input 
          v-model="form.password" 
          type="password" 
          placeholder="请输入密码"
          show-password
        />
      </el-form-item>
      
      <el-form-item label="描述">
        <el-input 
          v-model="form.description" 
          type="textarea" 
          :rows="3"
          placeholder="请输入数据源描述（可选）"
        />
      </el-form-item>
    </el-form>
    
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button type="info" @click="testConnection" :loading="testing">测试连接</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitting">
          {{ isEdit ? '更新' : '创建' }}
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { dataSourceApi } from '@/api/dataSource'
import type { DataSource, DataSourceCreateRequest } from '@/types/dataManagement'

// Props
interface Props {
  modelValue: boolean
  dataSource?: DataSource | null
}

const props = withDefaults(defineProps<Props>(), {
  dataSource: null
})

// Emits
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  success: []
}>()

// 响应式数据
const formRef = ref<FormInstance>()
const testing = ref(false)
const submitting = ref(false)

// 表单数据
const form = reactive<DataSourceCreateRequest>({
  name: '',
  type: 'mysql',
  host: 'localhost',
  port: 3306,
  databaseName: '',
  username: '',
  password: '',
  description: ''
})

// 计算属性
const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const isEdit = computed(() => !!props.dataSource)

// 表单验证规则
const rules: FormRules = {
  name: [
    { required: true, message: '请输入数据源名称', trigger: 'blur' },
    { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  type: [
    { required: true, message: '请选择数据源类型', trigger: 'change' }
  ],
  host: [
    { required: true, message: '请输入主机地址', trigger: 'blur' }
  ],
  port: [
    { required: true, message: '请输入端口号', trigger: 'blur' },
    { type: 'number', min: 1, max: 65535, message: '端口号必须在 1-65535 之间', trigger: 'blur' }
  ],
  databaseName: [
    { required: true, message: '请输入数据库名称', trigger: 'blur' }
  ],
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' }
  ]
}

// 方法定义 - 必须在watch之前定义
const resetForm = () => {
  Object.assign(form, {
    name: '',
    type: 'mysql',
    host: 'localhost',
    port: 3306,
    databaseName: '',
    username: '',
    password: '',
    description: ''
  })
  formRef.value?.clearValidate()
}

const testConnection = async () => {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
    testing.value = true
    
    const result = await dataSourceApi.testConnection(form)
    
    if (result) {
      ElMessage.success('连接测试成功')
    } else {
      ElMessage.error('连接测试失败')
    }
  } catch (error) {
    if (error !== false) { // 不是表单验证错误
      ElMessage.error('连接测试失败')
      console.error(error)
    }
  } finally {
    testing.value = false
  }
}

const handleSubmit = async () => {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
    submitting.value = true
    
    if (isEdit.value && props.dataSource) {
      // 编辑模式
      const updateData: Partial<DataSourceCreateRequest> = { ...form }
      if (!updateData.password) {
        delete updateData.password // 如果密码为空，不更新密码
      }
      await dataSourceApi.updateDataSource(props.dataSource.id, updateData)
      ElMessage.success('数据源更新成功')
    } else {
      // 新建模式
      await dataSourceApi.createDataSource(form)
      ElMessage.success('数据源创建成功')
    }
    
    emit('success')
  } catch (error) {
    if (error !== false) { // 不是表单验证错误
      ElMessage.error(isEdit.value ? '数据源更新失败' : '数据源创建失败')
      console.error(error)
    }
  } finally {
    submitting.value = false
  }
}

const handleClose = () => {
  if (!submitting.value && !testing.value) {
    visible.value = false
    resetForm()
  }
}

// 监听器 - 在方法定义之后
// 监听数据源类型变化，设置默认端口
watch(() => form.type, (newType) => {
  const defaultPorts: Record<string, number> = {
    mysql: 3306,
    postgresql: 5432,
    oracle: 1521,
    sqlserver: 1433
  }
  
  if (defaultPorts[newType]) {
    form.port = defaultPorts[newType]
  }
})

// 监听编辑数据源变化
watch(() => props.dataSource, (dataSource) => {
  if (dataSource) {
    Object.assign(form, {
      name: dataSource.name,
      type: dataSource.type,
      host: dataSource.host,
      port: dataSource.port,
      databaseName: dataSource.databaseName,
      username: dataSource.username,
      password: '', // 编辑时不显示原密码
      description: dataSource.description || ''
    })
  } else {
    resetForm()
  }
}, { immediate: true })
</script>

<style scoped>
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
</style> 