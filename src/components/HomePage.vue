<template>
  <div class="home-page">
    <!-- 欢迎横幅 -->
    <div class="welcome-banner">
      <div class="banner-content">
        <h1>🚀 低代码工作流系统</h1>
        <p>快速构建表单和流程，提升业务效率</p>
        <div class="quick-actions">
          <el-button type="primary" size="large" @click="$router.push('/form-design')">
            <el-icon><Edit /></el-icon>
            开始设计表单
          </el-button>
          <el-button type="success" size="large" @click="$router.push('/workflow-design')">
            <el-icon><Connection /></el-icon>
            设计工作流程
          </el-button>
        </div>
      </div>
      <div class="banner-image">
        <el-icon class="large-icon"><DataBoard /></el-icon>
      </div>
    </div>

    <!-- 功能特性 -->
    <div class="features-section">
      <h2>🎯 核心功能</h2>
      <div class="features-grid">
        <div class="feature-card">
          <div class="feature-icon">
            <el-icon><Edit /></el-icon>
          </div>
          <h3>表单设计器</h3>
          <p>拖拽式表单设计，支持多种控件类型，实时预览，一键导出</p>
          <el-button text type="primary" @click="$router.push('/form-design')">
            立即体验 →
          </el-button>
        </div>

        <div class="feature-card">
          <div class="feature-icon">
            <el-icon><Connection /></el-icon>
          </div>
          <h3>流程设计器</h3>
          <p>可视化流程编排，支持条件分支，审批流程，自动化执行</p>
          <el-button text type="primary" @click="$router.push('/workflow-design')">
            即将推出 →
          </el-button>
        </div>

        <div class="feature-card">
          <div class="feature-icon">
            <el-icon><DataBoard /></el-icon>
          </div>
          <h3>数据管理</h3>
          <p>表单数据收集，统计分析，导出报表，数据可视化</p>
          <el-button text type="primary" disabled>
            开发中 →
          </el-button>
        </div>

        <div class="feature-card">
          <div class="feature-icon">
            <el-icon><Setting /></el-icon>
          </div>
          <h3>系统配置</h3>
          <p>用户权限管理，系统参数配置，组织架构设置</p>
          <el-button text type="primary" disabled>
            开发中 →
          </el-button>
        </div>
      </div>
    </div>

    <!-- 最近项目 -->
    <div class="recent-section">
      <h2>📋 最近项目</h2>
      <div class="recent-grid">
        <div class="recent-item">
          <div class="recent-icon">
            <el-icon><Document /></el-icon>
          </div>
          <div class="recent-info">
            <h4>用户注册表单</h4>
            <p>包含基本信息、联系方式等字段</p>
            <span class="recent-time">2 小时前</span>
          </div>
          <el-button size="small" type="primary">编辑</el-button>
        </div>

        <div class="recent-item">
          <div class="recent-icon">
            <el-icon><Connection /></el-icon>
          </div>
          <div class="recent-info">
            <h4>请假审批流程</h4>
            <p>员工请假申请和审批流程</p>
            <span class="recent-time">1 天前</span>
          </div>
          <el-button size="small" type="success">查看</el-button>
        </div>

        <div class="recent-item">
          <div class="recent-icon">
            <el-icon><Document /></el-icon>
          </div>
          <div class="recent-info">
            <h4>客户反馈表单</h4>
            <p>收集客户意见和建议</p>
            <span class="recent-time">3 天前</span>
          </div>
          <el-button size="small" type="primary">编辑</el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Edit, Connection, DataBoard, Setting, Document } from '@element-plus/icons-vue'
</script>

<style scoped>
.home-page {
  padding: 0;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  min-height: 100vh;
}

.welcome-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 60px 40px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  margin-bottom: 40px;
}

.banner-content h1 {
  font-size: 3rem;
  margin: 0 0 16px 0;
  font-weight: 700;
}

.banner-content p {
  font-size: 1.2rem;
  margin: 0 0 32px 0;
  opacity: 0.9;
}

.quick-actions {
  display: flex;
  gap: 16px;
}

.quick-actions .el-button {
  padding: 12px 24px;
  font-size: 16px;
}

.banner-image {
  flex-shrink: 0;
}

.large-icon {
  font-size: 120px;
  opacity: 0.3;
}

.features-section,
.recent-section {
  padding: 0 40px 40px 40px;
}

.features-section h2,
.recent-section h2 {
  font-size: 2rem;
  margin-bottom: 32px;
  text-align: center;
  color: #2c3e50;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 24px;
  margin-bottom: 40px;
}

.feature-card {
  background: white;
  padding: 32px 24px;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  text-align: center;
  transition: transform 0.3s, box-shadow 0.3s;
}

.feature-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);
}

.feature-icon {
  width: 64px;
  height: 64px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 20px auto;
}

.feature-icon .el-icon {
  font-size: 32px;
  color: white;
}

.feature-card h3 {
  font-size: 1.4rem;
  margin: 0 0 12px 0;
  color: #2c3e50;
}

.feature-card p {
  color: #7f8c8d;
  line-height: 1.6;
  margin-bottom: 20px;
}

.recent-grid {
  display: grid;
  gap: 16px;
  max-width: 800px;
  margin: 0 auto;
}

.recent-item {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  gap: 16px;
  transition: transform 0.2s;
}

.recent-item:hover {
  transform: translateX(4px);
}

.recent-icon {
  width: 48px;
  height: 48px;
  background: #ecf5ff;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.recent-icon .el-icon {
  font-size: 24px;
  color: #409eff;
}

.recent-info {
  flex: 1;
}

.recent-info h4 {
  margin: 0 0 4px 0;
  color: #2c3e50;
}

.recent-info p {
  margin: 0 0 4px 0;
  color: #7f8c8d;
  font-size: 14px;
}

.recent-time {
  font-size: 12px;
  color: #bdc3c7;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .welcome-banner {
    flex-direction: column;
    text-align: center;
    padding: 40px 20px;
  }

  .banner-content h1 {
    font-size: 2rem;
  }

  .quick-actions {
    flex-direction: column;
    width: 100%;
  }

  .features-section,
  .recent-section {
    padding: 0 20px 40px 20px;
  }

  .features-grid {
    grid-template-columns: 1fr;
  }

  .recent-item {
    flex-direction: column;
    text-align: center;
  }
}
</style> 