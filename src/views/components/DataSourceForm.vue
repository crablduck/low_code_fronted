<template>
  <el-form :model="formData" label-width="120px">
    <el-form-item label="Name">
      <el-input v-model="formData.name" placeholder="Enter data source name" />
    </el-form-item>
    <el-form-item label="Type">
      <el-select v-model="formData.type" placeholder="Select data source type">
        <el-option label="MySQL" value="mysql" />
        <el-option label="PostgreSQL" value="postgresql" />
        <el-option label="MongoDB" value="mongodb" />
      </el-select>
    </el-form-item>
    <el-form-item label="Connection String">
      <el-input v-model="formData.connectionString" placeholder="Enter connection string" />
    </el-form-item>
    <el-form-item>
      <el-button type="primary" @click="submitForm">Submit</el-button>
      <el-button @click="resetForm">Reset</el-button>
    </el-form-item>
  </el-form>
</template>

<script setup>
import { ref, defineEmits } from 'vue'

const emit = defineEmits(['submit'])

const formData = ref({
  name: '',
  type: '',
  connectionString: ''
})

const submitForm = () => {
  emit('submit', formData.value)
}

const resetForm = () => {
  formData.value = {
    name: '',
    type: '',
    connectionString: ''
  }
}
</script>

<style scoped>
:deep(.el-form-item__content) {
  margin-left: 120px !important;
}
</style>
