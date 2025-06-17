<template>
  <div class="image-config-panel">
    <el-card class="config-card">
      <template #header>
        <div class="card-header">
          <el-icon><Picture /></el-icon>
          <span>图片配置</span>
        </div>
      </template>
      <el-form label-width="80px" size="small">
        <el-form-item label="图片地址">
          <el-input 
            v-model="imageUrl" 
            placeholder="请输入图片URL"
            @change="emitChange"
          >
            <template #append>
              <el-upload
                class="image-uploader"
                action="/api/upload"
                :show-file-list="false"
                :on-success="handleUploadSuccess"
                :before-upload="beforeUpload"
              >
                <el-button type="primary">上传</el-button>
              </el-upload>
            </template>
          </el-input>
        </el-form-item>
        <el-form-item v-if="imageUrl">
          <div class="image-preview">
            <img :src="imageUrl" alt="预览图" />
          </div>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Picture } from '@element-plus/icons-vue'

const props = defineProps<{ imageUrl?: string }>()
const emit = defineEmits<{ (e: 'update:imageUrl', value: string): void }>()

const imageUrl = ref(props.imageUrl || '')

watch(() => props.imageUrl, (val) => {
  imageUrl.value = val || ''
})

const emitChange = () => {
  emit('update:imageUrl', imageUrl.value as string)
}

const handleUploadSuccess = (response: any) => {
  if (response.code === 0 && response.data) {
    imageUrl.value = response.data.url
    emitChange()
  } else {
    ElMessage.error('上传失败')
  }
}

const beforeUpload = (file: File) => {
  const isImage = file.type.startsWith('image/')
  if (!isImage) {
    ElMessage.error('只能上传图片文件!')
    return false
  }
  const isLt2M = file.size / 1024 / 1024 < 2
  if (!isLt2M) {
    ElMessage.error('图片大小不能超过 2MB!')
    return false
  }
  return true
}
</script>

<style scoped>
.image-config-panel {
  height: 100%;
}
.config-card {
  height: 100%;
}
.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
}
.image-preview {
  margin-top: 10px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  padding: 10px;
  text-align: center;
}
.image-preview img {
  max-width: 100%;
  max-height: 200px;
  object-fit: contain;
}
.image-uploader :deep(.el-upload) {
  width: 100%;
}
</style> 