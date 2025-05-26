<script setup lang="ts">
// 移除直接导入 FormDesigner，改为使用路由
</script>

<template>
  <div class="app">
    <router-view />
  </div>
</template>

<style scoped>
.app {
  height: 100vh;
  overflow: hidden;
}

.app-bg {
  min-height: 100vh;
  background: linear-gradient(135deg, #e0f7fa 0%, #f5faff 100%);
}

.full-screen {
  width: 100vw;
  height: 100vh;
}

.app-layout {
  display: flex;
  height: 100vh;
  box-shadow: 0 4px 24px 0 rgba(0,0,0,0.06);
  border-radius: 18px;
  margin: 0 auto;
  max-width: 1400px;
  overflow: hidden;
}
.side-nav {
  width: 210px;
  background: #fff;
  display: flex;
  flex-direction: column;
  padding: 24px 0 0 0;
  border-right: 1px solid #e0e0e0;
  box-shadow: 2px 0 8px 0 rgba(64,158,255,0.04);
}
.logo-area {
  display: flex;
  align-items: center;
  padding: 0 24px 24px 24px;
  margin-bottom: 12px;
  border-bottom: 1px solid #f0f0f0;
}
.logo {
  width: 36px;
  height: 36px;
  margin-right: 10px;
}
.brand {
  font-weight: bold;
  font-size: 18px;
  color: #409eff;
  letter-spacing: 1px;
}
.side-nav a {
  display: flex;
  align-items: center;
  padding: 12px 28px;
  color: #333;
  text-decoration: none;
  border-radius: 6px;
  margin: 2px 12px;
  font-size: 16px;
  transition: background 0.2s, color 0.2s;
}
.side-nav a .icon {
  margin-right: 10px;
  font-size: 18px;
}
.side-nav a.router-link-active {
  background: #409eff;
  color: #fff;
  font-weight: bold;
}
.side-nav a.router-link-active .icon {
  color: #fff;
}
.main-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: #f8fbfd;
}
.top-bar {
  height: 60px;
  background: #fff;
  display: flex;
  align-items: center;
  padding: 0 32px;
  box-shadow: 0 2px 8px 0 rgba(64,158,255,0.06);
  font-size: 20px;
  color: #409eff;
  font-weight: 500;
  letter-spacing: 1px;
}
.main-content {
  flex: 1;
  padding: 36px 40px;
  overflow: auto;
  border-radius: 12px;
}
.logo-area.no-logo {
  justify-content: flex-start;
  padding-left: 24px;
}
.logo-area.no-logo .brand {
  margin-left: 0;
}
</style>
