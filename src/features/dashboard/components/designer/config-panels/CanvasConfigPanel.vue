<template>
  <div class="canvas-config-panel">
    <el-form label-width="80px" size="small">
      <el-form-item label="画布背景">
        <el-color-picker 
          v-model="config.canvasBackground" 
          @change="handleUpdate"
          show-alpha
        />
      </el-form-item>
      
      <el-form-item label="网格显示">
        <el-switch 
          v-model="config.showGrid" 
          @change="handleUpdate"
        />
      </el-form-item>
      
      <el-form-item label="网格大小">
        <el-input-number 
          v-model="config.gridSize" 
          :min="10" 
          :max="50"
          @change="handleUpdate"
          style="width: 100%"
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
.canvas-config-panel {
  padding: 16px;
}
</style> 