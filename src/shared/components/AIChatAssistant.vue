<script setup lang="ts">
import { onMounted } from 'vue'

// 配置 AI 助手
const initChatbot = () => {
  window.difyChatbotConfig = {
    token: 'dzVh83i5dJtovCDc',
    baseUrl: 'http://localhost',
    systemVariables: {},
  }

  // 创建并添加脚本
  const script = document.createElement('script')
  script.src = 'http://localhost/embed.min.js'
  script.id = 'dzVh83i5dJtovCDc'
  script.defer = true
  document.body.appendChild(script)
}

// 组件挂载时初始化
onMounted(() => {
  initChatbot()
})
</script>

<template>
  <!-- AI 助手将自动注入到页面中 -->
</template>

<style>
#dify-chatbot-bubble-button {
  background-color: #1C64F2 !important;
}

#dify-chatbot-bubble-window {
  width: 24rem !important;
  height: 40rem !important;
}
</style> 