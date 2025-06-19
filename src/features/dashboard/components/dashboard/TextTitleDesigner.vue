<template>
  <div class="text-title-designer">
    <div v-if="isDesignMode" class="design-mode">
      <div class="text-preview">
        <h1 
          :style="{
            fontSize: (config.fontSize || 18) + 'px',
            fontWeight: config.fontWeight || 'bold',
            color: config.color || '#333333',
            textAlign: config.textAlign || 'left',
            margin: 0,
            padding: 0
          }"
        >
          {{ config.content || '标题文本' }}
        </h1>
      </div>
      <div class="design-overlay">
        <el-icon><Setting /></el-icon>
        <span>点击编辑标题</span>
      </div>
    </div>
    
    <div v-else class="runtime-mode">
      <h1 
        :style="{
          fontSize: (config.fontSize || 18) + 'px',
          fontWeight: config.fontWeight || 'bold',
          color: config.color || '#333333',
          textAlign: config.textAlign || 'left',
          margin: 0,
          padding: 0
        }"
      >
        {{ config.content || '标题文本' }}
      </h1>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Setting } from '@element-plus/icons-vue'

interface TextConfig {
  content?: string
  fontSize?: number
  fontWeight?: string
  color?: string
  textAlign?: string
}

interface Props {
  config: TextConfig
  isDesignMode?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isDesignMode: false,
  config: () => ({})
})

const emit = defineEmits<{
  'update:config': [config: TextConfig]
}>()
</script>

<style scoped>
.text-title-designer {
  position: relative;
  width: 100%;
  height: 100%;
  padding: 8px;
  display: flex;
  align-items: center;
}

.design-mode {
  position: relative;
  width: 100%;
  height: 100%;
  max-width: 100%;
  max-height: 100%;
  overflow: hidden;
}

.text-preview {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
}

.design-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(64, 158, 255, 0.05);
  border: 2px dashed #409eff;
  border-radius: 4px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  font-size: 12px;
  color: #409eff;
  cursor: pointer;
  transition: all 0.2s ease;
  opacity: 0;
}

.design-mode:hover .design-overlay {
  opacity: 1;
}

.runtime-mode {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
}
</style> 