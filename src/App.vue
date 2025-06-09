<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import DefaultLayout from '@/components/Layout.vue'
import DesignerLayout from '@/components/DesignerLayout.vue'

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
