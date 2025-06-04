<template>
  <div class="home-page">
    <!-- 主横幅区域 -->
    <div class="hero-section">
      <div class="hero-content">
        <div class="hero-text">
          <h1>🏥 医疗低代码工作流平台</h1>
          <p class="hero-subtitle">专为医疗行业打造的智能化表单设计与流程管理系统</p>
          <p class="hero-description">
            快速构建医疗表单、患者管理流程、诊疗记录系统，提升医疗服务效率，保障数据安全合规
          </p>
          <div class="hero-actions">
            <el-button type="primary" size="large" @click="navigateTo('/form-designer')">
            <el-icon><Edit /></el-icon>
            开始设计表单
          </el-button>
            <el-button type="success" size="large" @click="navigateTo('/print-designer')">
              <el-icon><Printer /></el-icon>
              打印设计器
            </el-button>
            <el-button type="warning" size="large" @click="navigateTo('/report-designer')">
              <el-icon><TrendCharts /></el-icon>
              报表设计器
          </el-button>
        </div>
      </div>
        <div class="hero-visual">
          <div class="floating-cards">
            <div class="card card-1">
              <el-icon><User /></el-icon>
              <span>患者管理</span>
            </div>
            <div class="card card-2">
              <el-icon><Document /></el-icon>
              <span>病历记录</span>
            </div>
            <div class="card card-3">
              <el-icon><DataAnalysis /></el-icon>
              <span>数据分析</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 核心设计器功能 -->
    <div class="designers-section">
      <div class="section-header">
        <h2>🎨 核心设计器</h2>
        <p>专业的可视化设计工具，让医疗流程数字化变得简单</p>
      </div>
      <div class="designers-grid">
        <div class="designer-card primary" @click="navigateTo('/form-designer')">
          <div class="card-header">
            <div class="card-icon">
            <el-icon><Edit /></el-icon>
            </div>
            <div class="card-badge">核心</div>
          </div>
          <h3>表单设计器</h3>
          <p>拖拽式表单设计，支持医疗专用控件，实时预览，一键发布</p>
          <ul class="feature-list">
            <li>✓ 患者信息表单</li>
            <li>✓ 诊疗记录模板</li>
            <li>✓ 检查申请单</li>
            <li>✓ 药品处方表单</li>
          </ul>
          <div class="card-action">
            <span>立即使用</span>
            <el-icon><ArrowRight /></el-icon>
          </div>
        </div>

        <div class="designer-card success" @click="navigateTo('/print-designer')">
          <div class="card-header">
            <div class="card-icon">
              <el-icon><Printer /></el-icon>
            </div>
            <div class="card-badge">专业</div>
          </div>
          <h3>打印设计器</h3>
          <p>专业的医疗单据打印设计，支持多种纸张规格和打印模式</p>
          <ul class="feature-list">
            <li>✓ 病历打印模板</li>
            <li>✓ 检验报告单</li>
            <li>✓ 处方笺设计</li>
            <li>✓ 住院证明</li>
          </ul>
          <div class="card-action">
            <span>开始设计</span>
            <el-icon><ArrowRight /></el-icon>
          </div>
        </div>

        <div class="designer-card warning" @click="navigateTo('/report-designer')">
          <div class="card-header">
            <div class="card-icon">
              <el-icon><TrendCharts /></el-icon>
            </div>
            <div class="card-badge">智能</div>
          </div>
          <h3>报表设计器</h3>
          <p>智能数据分析与可视化报表，助力医疗决策和质量管理</p>
          <ul class="feature-list">
            <li>✓ 患者统计报表</li>
            <li>✓ 科室业务分析</li>
            <li>✓ 医疗质量指标</li>
            <li>✓ 财务收入报表</li>
          </ul>
          <div class="card-action">
            <span>创建报表</span>
            <el-icon><ArrowRight /></el-icon>
          </div>
        </div>

        <div class="designer-card info" @click="navigateTo('/dashboard-designer')">
          <div class="card-header">
            <div class="card-icon">
              <el-icon><Monitor /></el-icon>
            </div>
            <div class="card-badge">可视化</div>
          </div>
          <h3>仪表盘设计器</h3>
          <p>实时数据监控面板，医疗运营状况一目了然</p>
          <ul class="feature-list">
            <li>✓ 实时患者流量</li>
            <li>✓ 床位使用率</li>
            <li>✓ 医生工作负荷</li>
            <li>✓ 设备运行状态</li>
          </ul>
          <div class="card-action">
            <span>构建面板</span>
            <el-icon><ArrowRight /></el-icon>
          </div>
        </div>
      </div>
    </div>

    <!-- 医疗场景应用 -->
    <div class="scenarios-section">
      <div class="section-header">
        <h2>🏥 医疗场景应用</h2>
        <p>覆盖医疗机构全业务流程的数字化解决方案</p>
      </div>
      <div class="scenarios-grid">
        <div class="scenario-card">
          <div class="scenario-icon">
            <el-icon><User /></el-icon>
          </div>
          <h4>门诊管理</h4>
          <p>患者挂号、就诊记录、处方开具、费用结算全流程数字化</p>
        </div>
        <div class="scenario-card">
          <div class="scenario-icon">
            <el-icon><House /></el-icon>
          </div>
          <h4>住院管理</h4>
          <p>入院登记、床位管理、护理记录、出院结算智能化管理</p>
        </div>
        <div class="scenario-card">
          <div class="scenario-icon">
            <el-icon><DataAnalysis /></el-icon>
          </div>
          <h4>检验检查</h4>
          <p>检验申请、报告生成、结果查询、质量控制全程追踪</p>
        </div>
        <div class="scenario-card">
          <div class="scenario-icon">
            <el-icon><Setting /></el-icon>
          </div>
          <h4>药品管理</h4>
          <p>药品入库、处方审核、发药记录、库存管理智能化</p>
        </div>
      </div>
    </div>

    <!-- 快速开始 -->
    <div class="quick-start-section">
      <div class="quick-start-content">
        <h2>🚀 快速开始</h2>
        <p>三步即可创建您的第一个医疗表单</p>
        <div class="steps">
          <div class="step">
            <div class="step-number">1</div>
            <h4>选择模板</h4>
            <p>从医疗专用模板库中选择合适的表单模板</p>
          </div>
          <div class="step">
            <div class="step-number">2</div>
            <h4>拖拽设计</h4>
            <p>使用可视化设计器自定义表单字段和布局</p>
          </div>
          <div class="step">
            <div class="step-number">3</div>
            <h4>发布使用</h4>
            <p>一键发布表单，立即投入医疗业务使用</p>
          </div>
        </div>
        <el-button type="primary" size="large" @click="navigateTo('/form-designer')">
          立即开始设计
        </el-button>
      </div>
        </div>

    <!-- 系统优势 -->
    <div class="advantages-section">
      <div class="section-header">
        <h2>💡 系统优势</h2>
        <p>专为医疗行业量身定制的技术优势</p>
      </div>
      <div class="advantages-grid">
        <div class="advantage-item">
          <div class="advantage-icon">
            <el-icon><Lock /></el-icon>
          </div>
          <h4>数据安全</h4>
          <p>符合医疗数据安全规范，多重加密保护患者隐私</p>
        </div>
        <div class="advantage-item">
          <div class="advantage-icon">
            <el-icon><Connection /></el-icon>
          </div>
          <h4>系统集成</h4>
          <p>无缝对接HIS、LIS、PACS等医疗信息系统</p>
        </div>
        <div class="advantage-item">
          <div class="advantage-icon">
            <el-icon><Star /></el-icon>
          </div>
          <h4>易于使用</h4>
          <p>零代码可视化设计，医护人员也能轻松上手</p>
        </div>
        <div class="advantage-item">
          <div class="advantage-icon">
            <el-icon><TrendCharts /></el-icon>
          </div>
          <h4>智能分析</h4>
          <p>内置医疗数据分析模型，提供决策支持</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { 
  Edit, 
  Printer, 
  TrendCharts, 
  Monitor, 
  User, 
  Document, 
  DataAnalysis, 
  ArrowRight,
  House,
  Setting,
  Lock,
  Connection,
  Star
} from '@element-plus/icons-vue'

const router = useRouter()

const navigateTo = (path: string) => {
  router.push(path)
}
</script>

<style scoped>
.home-page {
  min-height: 100%;
  margin: -24px;
  padding: 0;
  display: flex;
  flex-direction: column;
}

.hero-section {
  background: linear-gradient(135deg, #1e3c72 0%, #6b46c1 100%);
  padding: 120px 24px 60px;
  margin-top: -60px;
  color: white;
  text-align: center;
}

.hero-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  max-width: 1200px;
  margin: 0 auto;
  position: relative;
  z-index: 1;
}

.hero-text {
  flex: 1;
  max-width: 600px;
}

.hero-text h1 {
  font-size: 3.5rem;
  margin: 0 0 20px 0;
  font-weight: 800;
  line-height: 1.2;
  background: linear-gradient(135deg, #fff 0%, #ffd04b 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.hero-subtitle {
  font-size: 1.4rem;
  margin: 0 0 16px 0;
  font-weight: 600;
  color: #ffd04b;
}

.hero-description {
  font-size: 1.1rem;
  margin: 0 0 40px 0;
  opacity: 0.9;
  line-height: 1.6;
}

.hero-actions {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.hero-actions .el-button {
  padding: 14px 28px;
  font-size: 16px;
  font-weight: 600;
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
  transition: all 0.3s;
}

.hero-actions .el-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
}

.hero-visual {
  flex-shrink: 0;
  margin-left: 40px;
}

.floating-cards {
  display: flex;
  flex-direction: column;
  gap: 20px;
  position: relative;
}

.card {
  background: rgba(255, 255, 255, 0.95);
  padding: 20px;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  text-align: center;
  transition: all 0.3s;
  width: 160px;
  animation: float 6s ease-in-out infinite;
}

.card-1 {
  animation-delay: 0s;
}

.card-2 {
  animation-delay: 2s;
}

.card-3 {
  animation-delay: 4s;
}

@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
}

.card:hover {
  transform: translateY(-8px) scale(1.05);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.2);
}

.card .el-icon {
  font-size: 32px;
  color: #667eea;
  margin-bottom: 8px;
}

.card span {
  display: block;
  font-weight: 600;
  color: #2d3748;
  font-size: 14px;
}

/* 通用区域样式 */
.designers-section,
.scenarios-section,
.advantages-section {
  padding: 80px 40px;
  background: linear-gradient(135deg, #f8fafc 0%, #edf2f7 100%);
  position: relative;
}

.scenarios-section::before,
.advantages-section::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(102, 126, 234, 0.2), transparent);
}

.section-header {
  text-align: center;
  margin-bottom: 60px;
}

.section-header h2 {
  font-size: 2.5rem;
  margin-bottom: 16px;
  color: #2d3748;
  font-weight: 700;
}

.section-header p {
  font-size: 1.2rem;
  color: #718096;
  max-width: 600px;
  margin: 0 auto;
}

/* 设计器卡片 */
.designers-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 24px;
}

@media (max-width: 1400px) {
  .designers-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .designers-grid {
    grid-template-columns: 1fr;
  }
}

.designer-card {
  background: white;
  padding: 30px;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: 2px solid transparent;
  transition: all 0.3s;
  cursor: pointer;
  position: relative;
  overflow: hidden;
}

.designer-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.designer-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
  border-color: #667eea;
}

.designer-card.primary::before {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.designer-card.success::before {
  background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
}

.designer-card.warning::before {
  background: linear-gradient(135deg, #ed8936 0%, #dd6b20 100%);
}

.designer-card.info::before {
  background: linear-gradient(135deg, #4299e1 0%, #3182ce 100%);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.card-icon {
  width: 60px;
  height: 60px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.card-icon .el-icon {
  font-size: 28px;
  color: white;
}

.card-badge {
  background: #e6fffa;
  color: #319795;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  border: 1px solid #81e6d9;
}

.designer-card h3 {
  font-size: 1.5rem;
  margin: 0 0 12px 0;
  color: #2d3748;
  font-weight: 700;
}

.designer-card p {
  color: #718096;
  line-height: 1.6;
  margin-bottom: 20px;
  font-size: 14px;
}

.feature-list {
  list-style: none;
  padding: 0;
  margin: 20px 0;
}

.feature-list li {
  padding: 6px 0;
  color: #4a5568;
  font-size: 14px;
  display: flex;
  align-items: center;
}

.feature-list li::before {
  content: '✓';
  color: #48bb78;
  font-weight: bold;
  margin-right: 8px;
}

.card-action {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid #e2e8f0;
}

.card-action span {
  font-weight: 600;
  color: #667eea;
}

.card-action .el-icon {
  color: #667eea;
  transition: transform 0.3s;
}

.designer-card:hover .card-action .el-icon {
  transform: translateX(4px);
}

/* 场景应用 */
.scenarios-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 30px;
  max-width: 1200px;
  margin: 0 auto;
}

.scenario-card {
  background: white;
  padding: 40px 30px;
  border-radius: 20px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05);
  text-align: center;
  transition: all 0.4s ease;
  border: 1px solid rgba(102, 126, 234, 0.1);
  position: relative;
  overflow: hidden;
}

.scenario-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #667eea, #764ba2);
  opacity: 0;
  transition: opacity 0.3s;
}

.scenario-card:hover {
  transform: translateY(-10px);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  border-color: rgba(102, 126, 234, 0.3);
}

.scenario-card:hover::before {
  opacity: 1;
}

.scenario-icon {
  width: 80px;
  height: 80px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 30px;
  transform: rotate(-5deg);
  transition: all 0.4s ease;
}

.scenario-card:hover .scenario-icon {
  transform: rotate(0) scale(1.1);
}

.scenario-icon .el-icon {
  font-size: 36px;
  color: white;
}

.scenario-card h4 {
  font-size: 1.4rem;
  margin: 0 0 16px;
  color: #2d3748;
  font-weight: 600;
}

.scenario-card p {
  color: #718096;
  line-height: 1.7;
  font-size: 1rem;
  margin: 0;
}

/* 快速开始 */
.quick-start-section {
  background: linear-gradient(135deg, #4299e1 0%, #3182ce 100%);
  color: white;
  padding: 80px 40px;
  margin: 80px 0;
}

.quick-start-content {
  text-align: center;
  max-width: 800px;
  margin: 0 auto;
}

.quick-start-content h2 {
  font-size: 2.5rem;
  margin-bottom: 16px;
  font-weight: 700;
}

.quick-start-content > p {
  font-size: 1.2rem;
  margin-bottom: 40px;
  opacity: 0.9;
}

.steps {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 30px;
  margin-bottom: 40px;
}

.step {
  text-align: center;
}

.step-number {
  background: white;
  color: #4299e1;
  border-radius: 50%;
  width: 50px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  font-weight: 700;
  margin: 0 auto 16px auto;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.step h4 {
  font-size: 1.2rem;
  margin: 0 0 8px 0;
  font-weight: 600;
}

.step p {
  font-size: 14px;
  opacity: 0.9;
  line-height: 1.5;
}

/* 系统优势 */
.advantages-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 30px;
  max-width: 1200px;
  margin: 0 auto;
}

.advantage-item {
  background: white;
  padding: 40px 30px;
  border-radius: 20px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05);
  text-align: center;
  transition: all 0.4s ease;
  border: 1px solid rgba(102, 126, 234, 0.1);
  position: relative;
  overflow: hidden;
}

.advantage-item::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #667eea, #764ba2);
  opacity: 0;
  transition: opacity 0.3s;
}

.advantage-item:hover {
  transform: translateY(-10px);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  border-color: rgba(102, 126, 234, 0.3);
}

.advantage-item:hover::before {
  opacity: 1;
}

.advantage-icon {
  width: 80px;
  height: 80px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 30px;
  transform: rotate(-5deg);
  transition: all 0.4s ease;
}

.advantage-item:hover .advantage-icon {
  transform: rotate(0) scale(1.1);
}

.advantage-icon .el-icon {
  font-size: 36px;
  color: white;
}

.advantage-item h4 {
  font-size: 1.4rem;
  margin: 0 0 16px;
  color: #2d3748;
  font-weight: 600;
}

.advantage-item p {
  color: #718096;
  line-height: 1.7;
  font-size: 1rem;
  margin: 0;
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .hero-content {
    flex-direction: column;
    text-align: center;
  }
  
  .hero-visual {
    margin-left: 0;
    margin-top: 40px;
  }
  
  .floating-cards {
    flex-direction: row;
    justify-content: center;
  }
}

@media (max-width: 768px) {
  .hero-section {
    padding: 60px 20px;
  }

  .hero-text h1 {
    font-size: 2.5rem;
  }

  .hero-actions {
    flex-direction: column;
    width: 100%;
  }

  .hero-actions .el-button {
    width: 100%;
  }
  
  .designers-section,
  .scenarios-section,
  .advantages-section,
  .quick-start-section {
    padding: 60px 20px;
  }

  .designers-grid,
  .scenarios-grid,
  .advantages-grid {
    grid-template-columns: 1fr;
  }
  
  .steps {
    grid-template-columns: 1fr;
  }

  .floating-cards {
    flex-direction: column;
    align-items: center;
  }
  
  .card {
    width: 140px;
  }

  .scenarios-section,
  .advantages-section {
    padding: 60px 20px;
  }
  
  .scenarios-grid,
  .advantages-grid {
    grid-template-columns: 1fr;
    gap: 20px;
  }
  
  .scenario-card,
  .advantage-item {
    padding: 30px 20px;
  }
}

@media (max-width: 480px) {
  .hero-text h1 {
    font-size: 2rem;
  }
  
  .section-header h2 {
    font-size: 2rem;
  }
  
  .quick-start-content h2 {
    font-size: 2rem;
  }
}
</style> 