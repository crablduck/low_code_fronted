<!--
 * @Author: Mr.Crab wei17306927526@gmail.com
 * @Date: 2025-05-28 10:00:35
 * @LastEditors: Mr.Crab wei17306927526@gmail.com
 * @LastEditTime: 2025-06-12 08:38:21
 * @FilePath: /workflow-system/src/App.vue
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
-->
<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import DefaultLayout from '@/components/Layout.vue'
import DesignerLayout from '@/components/DesignerLayout.vue'
import AIChatAssistant from '@/components/AIChatAssistant.vue'

const route = useRoute()

// 根据路由meta信息决定使用哪个布局
const layout = computed(() => {
  // 登录页不使用布局
  if (route.meta.public) {
    return 'div'
  }
  // 全屏页面不使用布局
  if (route.meta.layout === 'fullscreen') {
    return 'div'
  }
  // 设计器页面使用特殊布局
  if (route.meta.layout === 'designer') {
    return DesignerLayout
  }
  // 默认使用标准布局
  return DefaultLayout
})
</script>

<template>
  <component :is="layout">
    <router-view />
  </component>
  <AIChatAssistant />
</template>

<style>
:root {
  --primary-color: #409eff;
  --header-height: 60px;
  --sidebar-width: 220px;
}

html, body {
  margin: 0;
  padding: 0;
  height: 100%;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

#app {
  height: 100%;
}
</style>
