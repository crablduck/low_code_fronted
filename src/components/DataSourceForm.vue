<template>
  <el-dialog
    v-model="showDialog"
    :title="dataSource?.id ? '编辑数据源' : '创建数据源'"
    width="500px"
    @close="handleClose"
  >
    <el-form
      :model="form"
      :rules="rules"
      ref="formRef"
      label-width="100px"
    >
      <el-form-item label="数据源名称" prop="name">
        <el-input v-model="form.name" placeholder="请输入数据源名称" />
      </el-form-item>

      <el-form-item label="数据源类型" prop="type">
        <el-select v-model="form.type" placeholder="请选择数据源类型">
          <el-option label="MySQL" value="mysql" />
          <el-option label="PostgreSQL" value="postgresql" />
          <el-option label="SQLite" value="sqlite" />
          <el-option label="Oracle" value="oracle" />
          <el-option label="SQL Server" value="sqlserver" />
        </el-select>
      </el-form-item>

      <el-form-item label="连接地址" prop="url">
        <el-input v-model="form.url" placeholder="请输入数据库连接地址" />
      </el-form-item>

      <el-form-item label="端口" prop="port">
        <el-input-number v-model="form.port" :min="0" :max="65535" />
      </el-form-item>

      <el-form-item label="数据库名" prop="database">
        <el-input v-model="form.database" placeholder="请输入数据库名称" />
      </el-form-item>

      <el-form-item label="用户名" prop="username">
        <el-input v-model="form.username" placeholder="请输入数据库用户名" />
      </el-form-item>

      <el-form-item label="密码" prop="password">
        <el-input
          v-model="form.password"
          type="password"
          placeholder="请输入数据库密码"
          show-password
        />
      </el-form-item>

      <el-form-item>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
        <el-button @click="handleClose">取消</el-button>
      </el-form-item>
    </el-form>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch, reactive } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { DataSource } from '@/types/dataManagement'
import { dataSourceApi } from '@/api/dataSource'

const props = defineProps<{
  modelValue: boolean
  dataSource?: DataSource
}>()

const emit = defineEmits(['update:modelValue', 'success'])

const showDialog = ref(props.modelValue)
const formRef = ref()

const form = reactive<DataSource>({
  id: props.dataSource?.id || 0,
  name: props.dataSource?.name || '',
  type: props.dataSource?.type || 'mysql',
  config: {
    url: props.dataSource?.url || '',
    port: props.dataSource?.port || 0,
    database: props.dataSource?.database || '',
    username: props.dataSource?.username || '',
    password: props.dataSource?.password || ''
  },
  description: props.dataSource?.description || ''
})

const rules = {
  name: [
    { required: true, message: '请输入数据源名称', trigger: 'blur' }
  ],
  type: [
    { required: true, message: '请选择数据源类型', trigger: 'change' }
  ],
  url: [
    { required: true, message: '请输入连接地址', trigger: 'blur' }
  ],
  port: [
    { required: true, message: '请输入端口', trigger: 'blur' }
  ],
  database: [
    { required: true, message: '请输入数据库名', trigger: 'blur' }
  ],
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' }
  ]
}

watch(() => props.modelValue, (newValue) => {
  showDialog.value = newValue
})

watch(() => props.dataSource, (newValue) => {
  if (newValue) {
    Object.assign(form, {
      id: newValue.id,
      name: newValue.name,
      type: newValue.type,
      url: newValue.url,
      port: newValue.port,
      database: newValue.database,
      username: newValue.username,
      password: newValue.password,
      status: newValue.status
    })
  }
}, { deep: true })

const handleClose = () => {
  emit('update:modelValue', false)
  formRef.value?.resetFields()
}

const handleSubmit = async () => {
  try {
    await formRef.value?.validate()
    
    const dataSourceRequest = {
      name: form.name,
      type: form.type as 'mysql' | 'postgresql' | 'sqlite' | 'oracle' | 'sqlserver',
      host: form.config.url,
      port: form.config.port,
      databaseName: form.config.database,
      username: form.config.username,
      password: form.config.password,
      description: form.description
    }

    if (form.id) {
      await dataSourceApi.updateDataSource(form.id, dataSourceRequest)
      ElMessage.success('数据源更新成功')
    } else {
      await dataSourceApi.createDataSource(dataSourceRequest)
      ElMessage.success('数据源创建成功')
    }
    
    emit('update:modelValue', false)
    emit('success')
  } catch (error) {
    ElMessage.error('操作失败')
  }
}
</script>
