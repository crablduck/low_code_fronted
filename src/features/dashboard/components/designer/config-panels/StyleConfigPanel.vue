<template>
  <div class="style-config-panel">
    <el-form label-width="80px" size="small">
      <el-form-item label="背景色">
        <el-color-picker 
          v-model="config.backgroundColor" 
          @change="handleUpdate"
          show-alpha
        />
      </el-form-item>
      
      <el-form-item label="边框色">
        <el-color-picker 
          v-model="config.borderColor" 
          @change="handleUpdate"
          show-alpha
        />
      </el-form-item>
      
      <el-form-item label="文字颜色">
        <el-color-picker 
          v-model="config.textColor" 
          @change="handleUpdate"
          show-alpha
        />
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup lang="ts">
interface Props {
  config: any
}

interface Emits {
  (e: 'update', config: any): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const handleUpdate = () => {
  emit('update', props.config)
}
</script>

<style lang="scss" scoped>
.style-config-panel {
  padding: 16px;
}
</style> 