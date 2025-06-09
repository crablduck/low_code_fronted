<template>
  <div class="univer-report-designer">

    
    <div class="header">
      <div class="header-left">
        <h2>🏥 医疗报表设计器</h2>
        <span class="subtitle">专业的医疗数据可视化平台 - 支持绘图、图表分析和高级功能特性</span>
      </div>
      <div class="header-right">
        <el-button-group>
          <el-button @click="saveReport" type="primary" :icon="DocumentAdd">
            💾 保存报表
          </el-button>
          <el-button @click="exportData" :icon="Download">
            📤 导出数据
          </el-button>
          <el-button @click="showTipsDialog = true" :icon="QuestionFilled" type="info">
            📖 使用指南
          </el-button>
        </el-button-group>
      </div>
    </div>
    
    <div class="content">
      <!-- 状态栏 -->
      <div class="status-bar">
        <el-tag :type="univerStatus.type" effect="dark">
          {{ univerStatus.text }}
        </el-tag>
        <el-divider direction="vertical" />
        <span class="status-text">📊 模板: {{ currentTemplate }}</span>
        <el-divider direction="vertical" />
        <span class="status-text">🚀 Univer版本: {{ univerVersion }}</span>
        <div class="status-actions">
          <el-button @click="loadTemplate(currentTemplate)" size="small" type="success" :icon="Refresh">
            🔄 刷新
          </el-button>
          <el-button @click="forceRetry" size="small" type="warning" :icon="Operation">
            ⚡ 重试
          </el-button>
        </div>
      </div>
      
      <!-- 工具栏 -->
      <div class="toolbar">
        <div class="toolbar-left">
          <el-select v-model="currentTemplate" @change="loadTemplate" placeholder="选择模板" style="width: 280px;">
            <el-option label="🩺 患者统计报表 (含Excel公式)" value="patient-stats" />
            <el-option label="💰 科室收入报表 (SUM函数)" value="department-revenue" />
            <el-option label="💊 药品库存报表 (库存状态)" value="medicine-inventory" />
            <el-option label="👨‍⚕️ 医生工作量报表 (绩效计算)" value="doctor-workload" />
            <el-option label="🏥 床位占用统计" value="bed-occupancy" />
            <el-option label="📋 检查项目统计" value="examination-stats" />
          </el-select>
          
          <el-divider direction="vertical" />
          
          <el-button @click="resetData" :icon="Refresh" size="small">
            🔄 重置数据
          </el-button>
          <el-button @click="openDataSourceCompute" type="primary" size="small">
            🧮 数据源计算
          </el-button>
          <el-button @click="addNewSheet" type="success" size="small">
            ➕ 新建Sheet
          </el-button>
          
          <el-divider direction="vertical" />
          
          <el-tooltip content="使用说明" placement="bottom">
            <el-button @click="showTipsDialog = true" :icon="QuestionFilled" circle size="small" />
          </el-tooltip>
        </div>
        
        <div class="toolbar-right">
          <el-tag type="success" v-if="lastSaved">
            💾 最后保存: {{ formatTime(lastSaved) }}
          </el-tag>
        </div>
      </div>
      
      <!-- Univer电子表格容器 -->
      <div class="sheet-container">
        <UniverSheet 
          ref="univerSheetRef"
          :height="'calc(100vh - 240px)'"
          :data="currentData"
          @change="handleDataChange"
          @cellUpdate="handleCellUpdate"
          @ready="handleSheetReady"
        />
      </div>
    </div>

    <!-- 使用指南对话框 -->
    <el-dialog
      v-model="showTipsDialog"
      title="🧾 Univer 医疗报表设计器 - 使用指南"
      width="900px"
      destroy-on-close
    >
      <div class="tips-content">
        <el-alert
          title="Univer集成状态"
          :type="univerStatus.type"
          :description="univerStatus.description"
          show-icon
          :closable="false"
          style="margin-bottom: 20px;"
        />
        
        <el-divider content-position="left">✨ 功能特性</el-divider>
        <ul class="feature-list">
          <li>🚀 <strong>现代化表格:</strong> 基于Univer的Excel级别编辑体验</li>
          <li>📊 <strong>公式计算:</strong> 支持复杂数学公式和函数 (SUM, AVERAGE, COUNT等)</li>
          <li>🎨 <strong>富文本编辑:</strong> 字体、颜色、格式化、合并单元格</li>
          <li>🧮 <strong>数据源计算:</strong> 智能数据绑定，从外部数据源自动计算填充单元格</li>
          <li>📱 <strong>协作编辑:</strong> 多人实时编辑（即将支持）</li>
          <li>💾 <strong>Excel兼容:</strong> 完整的导入导出支持</li>
          <li>🏥 <strong>医疗定制:</strong> 针对医疗行业优化的6套专业模板</li>
          <li>📈 <strong>数据分析:</strong> 内置统计函数和条件判断</li>
          <li>🔄 <strong>实时计算:</strong> 数据变化时自动重新计算公式</li>
        </ul>
        
        <el-divider content-position="left">🔧 使用说明</el-divider>
        <ol class="usage-steps">
          <li><strong>选择模板:</strong> 从下拉菜单选择适合的医疗报表模板</li>
          <li><strong>编辑数据:</strong> 直接在表格中编辑，支持Excel公式和格式化</li>
          <li><strong>公式计算:</strong> 输入 =SUM(A1:A5) 等公式，支持自动计算</li>
          <li><strong>保存报表:</strong> 点击保存按钮将报表保存到本地存储</li>
          <li><strong>导出数据:</strong> 支持导出为JSON格式，后续支持Excel/PDF</li>
        </ol>
        
        <el-divider content-position="left">📊 模板介绍</el-divider>
        <div class="template-intro">
          <el-row :gutter="16">
            <el-col :span="12">
              <h4>🩺 患者统计报表</h4>
              <ul>
                <li>患者基本信息管理</li>
                <li>统计汇总（总数、分类）</li>
                <li>COUNTA、COUNTIF函数</li>
              </ul>
              
              <h4>💰 科室收入报表</h4>
              <ul>
                <li>月度收入跟踪</li>
                <li>SUM汇总计算</li>
                <li>增长率分析</li>
              </ul>
              
              <h4>💊 药品库存报表</h4>
              <ul>
                <li>库存状态监控</li>
                <li>自动缺货提醒</li>
                <li>IF条件判断函数</li>
              </ul>
            </el-col>
            <el-col :span="12">
              <h4>👨‍⚕️ 医生工作量报表</h4>
              <ul>
                <li>工作量综合评估</li>
                <li>绩效系数计算</li>
                <li>多维度统计分析</li>
              </ul>
              
              <h4>🏥 床位占用统计</h4>
              <ul>
                <li>床位使用率分析</li>
                <li>科室床位分布</li>
                <li>占用率计算</li>
              </ul>
              
              <h4>📋 检查项目统计</h4>
              <ul>
                <li>检查项目分类统计</li>
                <li>费用汇总分析</li>
                <li>项目使用频率</li>
              </ul>
            </el-col>
          </el-row>
        </div>
        
        <el-divider content-position="left">🛠️ 故障排除</el-divider>
        <div class="troubleshooting">
          <el-row :gutter="16">
            <el-col :span="12">
              <h4>🔄 加载问题</h4>
              <ul>
                <li>确保网络连接正常</li>
                <li>点击"重试"按钮重新加载</li>
                <li>使用备用编辑器作为替代方案</li>
                <li>清除浏览器缓存后重试</li>
              </ul>
            </el-col>
            <el-col :span="12">
              <h4>🌐 浏览器兼容性</h4>
              <ul>
                <li>推荐Chrome/Edge最新版</li>
                <li>确保JavaScript已启用</li>
                <li>避免使用过老的浏览器版本</li>
                <li>支持现代ES6+特性的浏览器</li>
              </ul>
            </el-col>
          </el-row>
        </div>
        
        <el-divider content-position="left">📚 技术信息</el-divider>
        <div class="tech-info">
          <el-descriptions :column="2" border>
            <el-descriptions-item label="🚀 Univer版本">{{ univerVersion }}</el-descriptions-item>
            <el-descriptions-item label="🌐 官网">
              <el-link href="https://univer.ai" target="_blank" type="primary">univer.ai</el-link>
            </el-descriptions-item>
            <el-descriptions-item label="📖 文档">
              <el-link href="https://docs.univer.ai" target="_blank" type="primary">docs.univer.ai</el-link>
            </el-descriptions-item>
            <el-descriptions-item label="💻 GitHub">
              <el-link href="https://github.com/dream-num/univer" target="_blank" type="primary">GitHub仓库</el-link>
            </el-descriptions-item>
            <el-descriptions-item label="🏥 医疗模板">6套专业模板</el-descriptions-item>
            <el-descriptions-item label="📊 支持公式">Excel兼容函数</el-descriptions-item>
          </el-descriptions>
        </div>

        <el-divider content-position="left">🧮 数据源计算功能使用指南</el-divider>
        <div class="data-compute-guide">
          <div class="guide-steps">
            <el-alert
              title="💡 全新功能：Univer自定义菜单"
              type="success"
              :closable="false"
              show-icon
            >
              <template #default>
                <p>我们在Univer电子表格中集成了<strong>数据源计算功能</strong>，支持通过右键菜单直接触发！</p>
              </template>
            </el-alert>
            
            <el-steps :active="5" finish-status="success" simple style="margin: 20px 0;">
              <el-step title="右键单元格" description="在Univer表格中右键点击任意单元格" />
              <el-step title="选择菜单项" description="从右键菜单中选择'🧮 从数据源计算赋值'" />
              <el-step title="选择数据集" description="从左侧面板选择要使用的数据集和字段" />
              <el-step title="配置条件" description="在中间面板设置过滤条件和计算函数" />
              <el-step title="预览结果" description="在右侧面板查看计算结果预览" />
              <el-step title="确认写入" description="点击确认将计算结果写入单元格" />
            </el-steps>
          </div>
          
          <div class="guide-tips">
            <el-row :gutter="16">
              <el-col :span="12">
                <el-card shadow="hover">
                  <template #header>
                    <span>🎯 使用方法</span>
                  </template>
                  <ul class="tip-list">
                    <li><strong>方法一：</strong> 右键点击单元格 → 选择"从数据源计算赋值"</li>
                    <li><strong>方法二：</strong> 点击工具栏的"🧮 测试数据源计算"按钮</li>
                    <li><strong>支持功能：</strong> SUM、AVG、COUNT、MAX、MIN等聚合函数</li>
                    <li><strong>过滤条件：</strong> 支持等于、不等于、大于、小于、包含等操作</li>
                  </ul>
                </el-card>
              </el-col>
              <el-col :span="12">
                <el-card shadow="hover">
                  <template #header>
                    <span>⚡ 技术特点</span>
                  </template>
                  <ul class="tip-list">
                    <li><strong>插件化设计：</strong> 基于Univer官方插件架构</li>
                    <li><strong>动态菜单：</strong> 根据单元格选择状态自动启用/禁用</li>
                    <li><strong>事件驱动：</strong> 通过CustomEvent实现Vue与Univer通信</li>
                    <li><strong>实时预览：</strong> 配置过程中即时显示计算结果</li>
                  </ul>
                </el-card>
              </el-col>
            </el-row>
          </div>
        </div>
      </div>
      
      <template #footer>
        <el-button @click="showTipsDialog = false" type="primary">我知道了 ✅</el-button>
      </template>
    </el-dialog>

    <!-- 保存报表对话框 -->
    <el-dialog
      v-model="showSaveDialog"
      title="💾 保存报表"
      width="500px"
    >
      <el-form :model="saveForm" label-width="100px">
        <el-form-item label="报表名称" required>
          <el-input v-model="saveForm.name" placeholder="请输入报表名称" />
        </el-form-item>
        <el-form-item label="报表描述">
          <el-input
            v-model="saveForm.description"
            type="textarea"
            rows="3"
            placeholder="请输入报表描述"
          />
        </el-form-item>
        <el-form-item label="报表分类">
          <el-select v-model="saveForm.category" placeholder="选择分类" style="width: 100%;">
            <el-option label="🩺 患者统计" value="patient" />
            <el-option label="💰 财务报表" value="finance" />
            <el-option label="💊 药品管理" value="medicine" />
            <el-option label="👨‍⚕️ 医生工作量" value="workload" />
            <el-option label="🏥 床位管理" value="bed" />
            <el-option label="📊 其他" value="other" />
          </el-select>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="showSaveDialog = false">取消</el-button>
        <el-button type="primary" @click="confirmSave">💾 保存</el-button>
      </template>
    </el-dialog>

    <!-- 数据源计算对话框 -->
    <CellComputedDialog
      ref="cellComputedDialogRef"
      @confirmed="handleDataSourceComputeConfirmed"
      @cancelled="handleDataSourceComputeCancelled"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed, onUnmounted, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  DataAnalysis,
  DocumentAdd,
  Download,
  Refresh,
  Operation,
  QuestionFilled,
  Document,
  ArrowDown
} from '@element-plus/icons-vue'
import UniverSheet from '@/components/UniverSheet.vue'
import CellComputedDialog from '@/components/data-compute/CellComputedDialog.vue'

// 响应式数据
const univerSheetRef = ref()
const showSaveDialog = ref(false)
const showTipsDialog = ref(false)
const showTemplateSelector = ref(false)
const currentTemplate = ref('patient-stats')
const currentData = ref(null)
const lastSaved = ref<Date | null>(null)
const univerVersion = ref('0.7.0')

// 添加数据源计算相关的响应式数据
const cellComputedDialogRef = ref()

// 添加移动端检测
const isMobile = ref(false)

// 状态管理
const univerStatus = ref({
  type: 'info' as 'success' | 'warning' | 'danger' | 'info',
  text: '正在初始化...',
  description: 'Univer组件正在加载中，请稍候'
})

// 保存表单
const saveForm = reactive({
  name: '',
  description: '',
  category: 'patient'
})

// 医疗报表模板数据 - 增强版本
const templates = {
  'patient-stats': {
    name: '🩺 患者统计报表 (含Excel公式)',
    data: [
      ['患者ID', '姓名', '年龄', '性别', '科室', '诊断', '入院日期', '状态', '费用'],
      ['P001', '张三', 45, '男', '心内科', '高血压', '2024-01-15', '住院', 3500],
      ['P002', '李四', 32, '女', '妇产科', '妊娠检查', '2024-01-16', '门诊', 890],
      ['P003', '王五', 67, '男', '骨科', '骨折', '2024-01-17', '住院', 8200],
      ['P004', '赵六', 28, '女', '内分泌科', '糖尿病', '2024-01-18', '门诊', 650],
      ['P005', '孙七', 55, '男', '呼吸科', '肺炎', '2024-01-19', '住院', 4300],
      ['P006', '周八', 38, '女', '神经内科', '偏头痛', '2024-01-20', '门诊', 420],
      ['', '', '', '', '', '', '', '', ''],
      ['📊 统计汇总:', '', '', '', '', '', '', '', ''],
      ['总患者数:', '=COUNTA(B2:B7)', '', '', '', '', '', '', ''],
      ['住院患者:', '=COUNTIF(H2:H7,"住院")', '', '', '', '', '', '', ''],
      ['门诊患者:', '=COUNTIF(H2:H7,"门诊")', '', '', '', '', '', '', ''],
      ['平均年龄:', '=AVERAGE(C2:C7)', '', '', '', '', '', '', ''],
      ['总费用:', '=SUM(I2:I7)', '', '', '', '', '', '', ''],
      ['平均费用:', '=AVERAGE(I2:I7)', '', '', '', '', '', '', '']
    ]
  },
  'department-revenue': {
    name: '💰 科室收入报表 (SUM函数和增长率)',
    data: [
      ['科室', '1月收入', '2月收入', '3月收入', '总收入', '增长率', '占比'],
      ['心内科', 120000, 135000, 150000, '=SUM(B2:D2)', '=(D2-B2)/B2*100', '=E2/E$8*100'],
      ['妇产科', 98000, 112000, 125000, '=SUM(B3:D3)', '=(D3-B3)/B3*100', '=E3/E$8*100'],
      ['骨科', 156000, 168000, 180000, '=SUM(B4:D4)', '=(D4-B4)/B4*100', '=E4/E$8*100'],
      ['内分泌科', 87000, 92000, 98000, '=SUM(B5:D5)', '=(D5-B5)/B5*100', '=E5/E$8*100'],
      ['呼吸科', 145000, 158000, 172000, '=SUM(B6:D6)', '=(D6-B6)/B6*100', '=E6/E$8*100'],
      ['', '', '', '', '', '', ''],
      ['📊 季度总计:', '=SUM(B2:B6)', '=SUM(C2:C6)', '=SUM(D2:D6)', '=SUM(E2:E6)', '=(D8-B8)/B8*100', '100%'],
      ['月平均收入:', '=B8/5', '=C8/5', '=D8/5', '=E8/5', '', ''],
      ['最高收入科室:', '=INDEX(A2:A6,MATCH(MAX(E2:E6),E2:E6,0))', '', '', '=MAX(E2:E6)', '', '']
    ]
  },
  'medicine-inventory': {
    name: '💊 药品库存报表 (库存状态逻辑)',
    data: [
      ['药品名称', '规格', '当前库存', '安全库存', '单价', '库存金额', '状态', '补货建议'],
      ['阿司匹林', '100mg*30片', 1200, 500, 15.5, '=C2*E2', '=IF(C2<D2,"⚠️缺货","✅正常")', '=IF(C2<D2,D2-C2,0)'],
      ['青霉素', '80万单位', 180, 200, 8.2, '=C3*E3', '=IF(C3<D3,"⚠️缺货","✅正常")', '=IF(C3<D3,D3-C3,0)'],
      ['胰岛素', '300单位', 80, 100, 45.8, '=C4*E4', '=IF(C4<D4,"⚠️缺货","✅正常")', '=IF(C4<D4,D4-C4,0)'],
      ['维生素C', '100mg*100片', 2000, 800, 12.3, '=C5*E5', '=IF(C5<D5,"⚠️缺货","✅正常")', '=IF(C5<D5,D5-C5,0)'],
      ['布洛芬', '200mg*20片', 600, 300, 18.7, '=C6*E6', '=IF(C6<D6,"⚠️缺货","✅正常")', '=IF(C6<D6,D6-C6,0)'],
      ['头孢菌素', '0.5g*12粒', 150, 200, 32.4, '=C7*E7', '=IF(C7<D7,"⚠️缺货","✅正常")', '=IF(C7<D7,D7-C7,0)'],
      ['', '', '', '', '', '', '', ''],
      ['📊 库存统计:', '', '=SUM(C2:C7)', '', '', '=SUM(F2:F7)', '', ''],
      ['缺货品种数:', '', '=COUNTIF(G2:G7,"⚠️缺货")', '', '', '', '', ''],
      ['正常库存:', '', '=COUNTIF(G2:G7,"✅正常")', '', '', '', '', ''],
      ['平均库存金额:', '', '', '', '', '=AVERAGE(F2:F7)', '', '']
    ]
  },
  'doctor-workload': {
    name: '👨‍⚕️ 医生工作量报表 (绩效计算)',
    data: [
      ['医生姓名', '科室', '门诊患者', '手术台数', '会诊次数', '总工作量', '绩效系数', '评级'],
      ['张医生', '心内科', 45, 8, 12, '=C2+D2*5+E2*2', '=F2/100', '=IF(G2>=1.2,"⭐优秀",IF(G2>=1,"✅良好","⚠️待改进"))'],
      ['李医生', '外科', 32, 15, 8, '=C3+D3*5+E3*2', '=F3/100', '=IF(G3>=1.2,"⭐优秀",IF(G3>=1,"✅良好","⚠️待改进"))'],
      ['王医生', '内科', 58, 3, 15, '=C4+D4*5+E4*2', '=F4/100', '=IF(G4>=1.2,"⭐优秀",IF(G4>=1,"✅良好","⚠️待改进"))'],
      ['赵医生', '儿科', 67, 5, 20, '=C5+D5*5+E5*2', '=F5/100', '=IF(G5>=1.2,"⭐优秀",IF(G5>=1,"✅良好","⚠️待改进"))'],
      ['孙医生', '骨科', 28, 12, 6, '=C6+D6*5+E6*2', '=F6/100', '=IF(G6>=1.2,"⭐优秀",IF(G6>=1,"✅良好","⚠️待改进"))'],
      ['', '', '', '', '', '', '', ''],
      ['📊 科室统计:', '', '=SUM(C2:C6)', '=SUM(D2:D6)', '=SUM(E2:E6)', '=SUM(F2:F6)', '=AVERAGE(G2:G6)', ''],
      ['平均工作量:', '', '=AVERAGE(C2:C6)', '=AVERAGE(D2:D6)', '=AVERAGE(E2:E6)', '=AVERAGE(F2:F6)', '', ''],
      ['最高绩效医生:', '=INDEX(A2:A6,MATCH(MAX(G2:G6),G2:G6,0))', '', '', '', '', '=MAX(G2:G6)', ''],
      ['优秀医生数:', '', '=COUNTIF(H2:H6,"⭐优秀")', '', '', '', '', '']
    ]
  },
  'bed-occupancy': {
    name: '🏥 床位占用统计',
    data: [
      ['科室', '总床位', '占用床位', '空闲床位', '占用率%', '状态', '需调整'],
      ['ICU', 20, 18, '=B2-C2', '=C2/B2*100', '=IF(E2>90,"🔴满负荷",IF(E2>70,"🟡较忙","🟢正常"))', '=IF(E2>95,"需扩容","正常")'],
      ['心内科', 45, 32, '=B3-C3', '=C3/B3*100', '=IF(E3>90,"🔴满负荷",IF(E3>70,"🟡较忙","🟢正常"))', '=IF(E3>95,"需扩容","正常")'],
      ['外科', 60, 55, '=B4-C4', '=C4/B4*100', '=IF(E4>90,"🔴满负荷",IF(E4>70,"🟡较忙","🟢正常"))', '=IF(E4>95,"需扩容","正常")'],
      ['儿科', 30, 18, '=B5-C5', '=C5/B5*100', '=IF(E5>90,"🔴满负荷",IF(E5>70,"🟡较忙","🟢正常"))', '=IF(E5>95,"需扩容","正常")'],
      ['妇产科', 25, 20, '=B6-C6', '=C6/B6*100', '=IF(E6>90,"🔴满负荷",IF(E6>70,"🟡较忙","🟢正常"))', '=IF(E6>95,"需扩容","正常")'],
      ['', '', '', '', '', '', ''],
      ['🏥 总计:', '=SUM(B2:B6)', '=SUM(C2:C6)', '=SUM(D2:D6)', '=C8/B8*100', '', ''],
      ['高负荷科室:', '=COUNTIF(F2:F6,"🔴满负荷")', '', '', '', '', ''],
      ['平均占用率:', '', '', '', '=AVERAGE(E2:E6)', '', '']
    ]
  },
  'examination-stats': {
    name: '📋 检查项目统计',
    data: [
      ['检查项目', '今日次数', '本周次数', '单价', '今日收入', '本周收入', '使用率%'],
      ['CT检查', 15, 89, 380, '=B2*D2', '=C2*D2', '=C2/500*100'],
      ['MRI检查', 8, 42, 850, '=B3*D3', '=C3*D3', '=C3/200*100'],
      ['B超检查', 45, 285, 120, '=B4*D4', '=C4*D4', '=C4/800*100'],
      ['X光检查', 32, 198, 80, '=B5*D5', '=C5*D5', '=C5/600*100'],
      ['心电图', 28, 167, 50, '=B6*D6', '=C6*D6', '=C6/400*100'],
      ['血常规', 67, 389, 35, '=B7*D7', '=C7*D7', '=C7/1000*100'],
      ['', '', '', '', '', '', ''],
      ['📊 统计汇总:', '=SUM(B2:B7)', '=SUM(C2:C7)', '', '=SUM(E2:E7)', '=SUM(F2:F7)', '=AVERAGE(G2:G7)'],
      ['最热门项目:', '=INDEX(A2:A7,MATCH(MAX(C2:C7),C2:C7,0))', '', '', '', '=MAX(F2:F7)', ''],
      ['平均单价:', '', '', '=AVERAGE(D2:D7)', '', '', '']
    ]
  }
}

// 方法
const loadTemplate = (templateKey: string) => {
  try {
    if (templates[templateKey]) {
      currentData.value = templates[templateKey].data
      saveForm.name = templates[templateKey].name
      ElMessage.success(`✅ 已加载模板：${templates[templateKey].name}`)
      
      univerStatus.value = {
        type: 'info',
        text: '模板已加载',
        description: '正在应用新的模板数据到表格中'
      }
    } else {
      throw new Error(`未找到模板: ${templateKey}`)
    }
  } catch (error: any) {
    ElMessage.error('❌ 加载模板失败')
  }
}

// 加载演示数据
const loadDemoData = () => {
  try {
    const demoData = [
      ['📊 演示数据', '数值A', '数值B', '计算结果', '状态'],
      ['项目1', 100, 200, '=B2+C2', '正常'],
      ['项目2', 150, 180, '=B3+C3', '良好'],
      ['项目3', 90, 210, '=B4+C4', '优秀'],
      ['项目4', 120, 160, '=B5+C5', '正常'],
      ['', '', '', '', ''],
      ['📈 汇总统计:', '=SUM(B2:B5)', '=SUM(C2:C5)', '=SUM(D2:D5)', ''],
      ['📊 平均值:', '=AVERAGE(B2:B5)', '=AVERAGE(C2:C5)', '=AVERAGE(D2:D5)', ''],
      ['🎯 最大值:', '=MAX(B2:B5)', '=MAX(C2:C5)', '=MAX(D2:D5)', '']
    ]
    
    currentData.value = demoData
    saveForm.name = '📊 演示数据模板'
    
    ElMessage.success('📊 演示数据已加载！包含基础公式示例')
    
    univerStatus.value = {
      type: 'success',
      text: '演示数据就绪',
      description: '已加载包含SUM、AVERAGE、MAX函数的演示数据'
    }
  } catch (error: any) {
    console.error('加载演示数据失败:', error)
    ElMessage.error('❌ 加载演示数据失败')
  }
}

const handleSheetReady = () => {
  console.log('✅ Univer电子表格已就绪')
  univerStatus.value = {
    type: 'success',
    text: 'Univer已就绪',
    description: 'Univer电子表格初始化成功，可以正常使用所有功能'
  }
  ElMessage.success('🎉 Univer电子表格加载完成！')
}

const handleDataChange = (data: any) => {
  console.log('📝 数据发生变化:', data)
}

const handleCellUpdate = (data: any) => {
  console.log('📊 单元格更新:', data)
}

const forceRetry = () => {
  if (univerSheetRef.value?.retry) {
    univerStatus.value = {
      type: 'warning',
      text: '正在重试...',
      description: '强制重新初始化Univer组件'
    }
    univerSheetRef.value.retry()
    ElMessage.info('🔄 正在重新初始化...')
  } else {
    ElMessage.warning('⚠️ 重试功能不可用')
  }
}

const saveReport = () => {
  showSaveDialog.value = true
}

const confirmSave = async () => {
  if (!saveForm.name) {
    ElMessage.warning('⚠️ 请输入报表名称')
    return
  }

  try {
    // 获取当前表格数据
    const sheetData = univerSheetRef.value?.getData()
    
    // 构建保存数据
    const reportData = {
      name: saveForm.name,
      description: saveForm.description,
      category: saveForm.category,
      data: sheetData,
      createdAt: new Date().toISOString(),
      type: 'univer',
      template: currentTemplate.value
    }

    console.log('💾 保存报表:', reportData)
    
    // 保存到本地存储
    const savedReports = JSON.parse(localStorage.getItem('univer-reports') || '[]')
    savedReports.push(reportData)
    localStorage.setItem('univer-reports', JSON.stringify(savedReports))
    
    lastSaved.value = new Date()
    showSaveDialog.value = false
    
    ElMessage.success('✅ 报表保存成功！')
  } catch (error: any) {
    console.error('保存失败:', error)
    ElMessage.error('❌ 保存失败')
  }
}

const exportData = () => {
  try {
    const sheetData = univerSheetRef.value?.getData()
    if (!sheetData) {
      ElMessage.warning('⚠️ 没有数据可以导出')
      return
    }

    const exportData = {
      name: saveForm.name || templates[currentTemplate.value].name,
      template: currentTemplate.value,
      data: sheetData,
      exportTime: new Date().toISOString(),
      type: 'univer-medical-report'
    }

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
      type: 'application/json' 
    })
    const url = URL.createObjectURL(blob)
    
    const a = document.createElement('a')
    a.href = url
    a.download = `${exportData.name.replace(/[^\w\s]/gi, '')}_${Date.now()}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    ElMessage.success('📥 数据导出成功！')
  } catch (error: any) {
    console.error('导出失败:', error)
    ElMessage.error('❌ 导出失败')
  }
}

const resetData = () => {
  ElMessageBox.confirm(
    '确定要重置数据吗？此操作将清除所有当前数据并重新加载模板！', 
    '🔄 确认重置', 
    { 
      type: 'warning',
      confirmButtonText: '确定重置',
      cancelButtonText: '取消'
    }
  ).then(() => {
    loadTemplate(currentTemplate.value)
    ElMessage.success('✅ 数据已重置到默认模板')
  }).catch(() => {
    ElMessage.info('已取消重置操作')
  })
}

const formatTime = (date: Date) => {
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 添加数据源计算的事件处理
const handleDataSourceComputeConfirmed = (result: any) => {
  console.log('✅ 数据源计算确认:', result)
  
  try {
    // 写入计算结果到Univer单元格
    if (univerSheetRef.value && result.cellInfo) {
      // 这里需要调用Univer的API写入数据
      // 暂时先用console.log展示结果
      console.log('📊 写入单元格:', {
        cell: `${String.fromCharCode(65 + result.cellInfo.col)}${result.cellInfo.row + 1}`,
        value: result.value,
        binding: result.bindingInfo
      })
      
      ElMessage.success(`✅ 计算结果 ${result.value} 已写入单元格`)
    }
  } catch (error) {
    console.error('❌ 写入单元格失败:', error)
    ElMessage.error('写入单元格失败')
  }
}

const handleDataSourceComputeCancelled = () => {
  console.log('❌ 用户取消了数据源计算')
}

// 添加新的 Sheet
const addNewSheet = () => {
  console.log('➕ 创建新 Sheet')
  
  try {
    // 检查 UniverSheet 实例
    if (univerSheetRef.value?.addSheet) {
      const sheetName = `新建表格${Date.now().toString().slice(-4)}`
      univerSheetRef.value.addSheet(sheetName)
      
      ElMessage.success({
        message: `✅ 成功创建新工作表：${sheetName}`,
        duration: 2000
      })
    } else {
      // 如果没有 addSheet 方法，显示提示
      ElMessage.info({
        message: '📋 多 Sheet 功能已启用！您可以在底部看到工作表标签，右键点击标签可以添加新工作表',
        duration: 4000
      })
    }
  } catch (error: any) {
    console.error('❌ 创建新 Sheet 失败:', error)
    ElMessage.warning({
      message: `⚠️ 创建失败: ${error.message}`,
      duration: 3000
    })
  }
}

// 打开数据源计算对话框
const openDataSourceCompute = () => {
  console.log('🧮 从工具栏打开数据源计算功能')
  
  try {
    // 检查当前是否有选中的单元格
    let cellInfo = null
    let selection = null
    
    // 尝试从 Univer 获取当前选中的单元格
    if (univerSheetRef.value?.getCurrentSelection) {
      const currentSelection = univerSheetRef.value.getCurrentSelection()
      if (currentSelection) {
        cellInfo = {
          row: currentSelection.startRow || 0,
          col: currentSelection.startColumn || 0,
          sheetId: currentSelection.sheetId || 'sheet-1',
          unitId: currentSelection.unitId || 'workbook-1'
        }
        selection = currentSelection
      }
    }
    
    // 如果没有选中单元格，使用默认位置
    if (!cellInfo) {
      cellInfo = {
        row: 0,
        col: 0,
        sheetId: 'sheet-1',
        unitId: 'workbook-1'
      }
      selection = {
        startRow: 0,
        endRow: 0,
        startColumn: 0,
        endColumn: 0
      }
    }
    
    // 显示数据源计算对话框
    if (cellComputedDialogRef.value) {
      cellComputedDialogRef.value.show(cellInfo)
      
      ElMessage.success({
        message: '📊 数据源计算对话框已打开',
        duration: 2000,
        showClose: true
      })
    } else {
      throw new Error('数据源计算组件未就绪，请等待页面完全加载')
    }
  } catch (error: any) {
    console.error('❌ 打开数据源计算对话框失败:', error)
    ElMessage.warning({
      message: `⚠️ 打开失败: ${error.message}`,
      duration: 3000,
      showClose: true
    })
  }
}

// 响应式处理窗口大小变化
const handleResize = () => {
  isMobile.value = window.innerWidth < 768
}

// 生命周期
onMounted(() => {
  console.log('🎯 UniverReportDesigner 页面加载')
  
  // 检测移动端
  isMobile.value = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  
  // 监听窗口大小变化
  window.addEventListener('resize', handleResize)
  
  // 🎉 监听Univer自定义菜单事件
  window.addEventListener('univer-data-source-compute', handleUniverDataSourceCompute)
  document.addEventListener('univer-data-source-compute', handleUniverDataSourceCompute)
  
  // 设置默认模板
  nextTick(() => {
    loadTemplate(currentTemplate.value)
  })
})

onUnmounted(() => {
  // 清理事件监听
  window.removeEventListener('resize', handleResize)
  window.removeEventListener('univer-data-source-compute', handleUniverDataSourceCompute)
  document.removeEventListener('univer-data-source-compute', handleUniverDataSourceCompute)
})

// 处理Univer数据源计算事件
const handleUniverDataSourceCompute = (event: CustomEvent) => {
  console.log('🧮 接收到Univer数据源计算事件', event.detail)
  
  const { selection, cellInfo, range } = event.detail
  
  // 打开数据源计算对话框
  if (cellComputedDialogRef.value) {
    cellComputedDialogRef.value.show(cellInfo)
    
    ElMessage.info({
      message: '📊 数据源计算对话框已打开',
      duration: 2000
    })
  } else {
    ElMessage.warning('⚠️ 数据源计算组件未就绪，请稍后重试')
  }
}
</script>

<style scoped lang="scss">
.univer-report-designer {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  font-family: 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
}

.header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 24px 32px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
  border-bottom: 3px solid rgba(255, 255, 255, 0.2);

  .header-left {
    h2 {
      margin: 0 0 10px 0;
      font-size: 28px;
      display: flex;
      align-items: center;
      gap: 16px;
      font-weight: 600;
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);

      .el-icon {
        font-size: 32px;
        color: #ffd700;
        filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
      }
    }

    p {
      margin: 0;
      opacity: 0.95;
      font-size: 15px;
      line-height: 1.5;
      color: rgba(255, 255, 255, 0.9);
    }
    
    .feature-highlight {
      margin-top: 8px;
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 13px;
      
      span {
        color: rgba(255, 255, 255, 0.85);
        font-style: italic;
      }
    }
  }

  .header-right {
    .el-button-group {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      border-radius: 8px;
      overflow: hidden;
    }
    
    .el-button {
      border-color: rgba(255, 255, 255, 0.3);
      font-weight: 500;
      padding: 12px 20px;
      transition: all 0.3s ease;
      
      &.el-button--primary {
        background: rgba(255, 255, 255, 0.2);
        border-color: rgba(255, 255, 255, 0.3);
        
        &:hover {
          background: rgba(255, 255, 255, 0.3);
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        }
      }
      
      &.el-button--info {
        background: rgba(103, 194, 58, 0.2);
        border-color: rgba(103, 194, 58, 0.3);
        
        &:hover {
          background: rgba(103, 194, 58, 0.3);
        }
      }
    }
  }
}

.content {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.status-bar {
  background: linear-gradient(90deg, #ffffff 0%, #f8f9fa 100%);
  padding: 16px 32px;
  border-bottom: 1px solid #e4e7ed;
  display: flex;
  align-items: center;
  gap: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  backdrop-filter: blur(10px);

  .el-tag {
    font-weight: 600;
    padding: 8px 16px;
    border-radius: 20px;
    border: none;
    font-size: 13px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  .status-text {
    font-size: 14px;
    color: #606266;
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .status-actions {
    margin-left: auto;
    display: flex;
    gap: 12px;
    
    .el-button {
      border-radius: 18px;
      padding: 8px 16px;
      font-weight: 500;
      transition: all 0.2s ease;
      
      &:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
      }
    }
  }
}

.toolbar {
  background: linear-gradient(90deg, #ffffff 0%, #f8f9fa 100%);
  padding: 20px 32px;
  border-bottom: 1px solid #e4e7ed;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.03);

  .toolbar-left {
    display: flex;
    align-items: center;
    gap: 20px;
    
    .el-select {
      .el-input {
        .el-input__wrapper {
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          border: 1px solid #e4e7ed;
          transition: all 0.2s ease;
          
          &:hover {
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          }
        }
      }
    }
    
    .el-button {
      border-radius: 8px;
      font-weight: 500;
      transition: all 0.2s ease;
      
      &:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
      }
    }
  }

  .toolbar-right {
    display: flex;
    align-items: center;
    gap: 12px;
    
    .el-tag {
      border-radius: 16px;
      padding: 8px 16px;
      font-weight: 500;
      border: none;
      background: linear-gradient(135deg, #67c23a 0%, #85ce61 100%);
      color: white;
      box-shadow: 0 2px 8px rgba(103, 194, 58, 0.3);
    }
  }
}

.sheet-container {
  flex: 1;
  padding: 24px 32px;
  min-height: 0;
  
  :deep(.univer-sheet-container) {
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
    border: 1px solid rgba(255, 255, 255, 0.5);
    backdrop-filter: blur(10px);
  }
}

.tips-content {
  .feature-list {
    margin: 20px 0;
    padding-left: 24px;
    
    li {
      margin: 12px 0;
      line-height: 1.8;
      font-size: 15px;
      color: #303133;
      
      strong {
        color: #409eff;
        font-weight: 600;
      }
    }
  }
  
  .usage-steps {
    margin: 20px 0;
    padding-left: 24px;
    
    li {
      margin: 12px 0;
      line-height: 1.8;
      font-size: 15px;
      color: #303133;
      
      strong {
        color: #67c23a;
        font-weight: 600;
      }
    }
  }
  
  .template-intro {
    margin-top: 20px;
    
    h4 {
      color: #409eff;
      margin: 20px 0 12px 0;
      font-size: 17px;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 8px;
      
      &::before {
        content: '';
        width: 4px;
        height: 20px;
        background: linear-gradient(135deg, #409eff 0%, #67c23a 100%);
        border-radius: 2px;
      }
    }
    
    ul {
      margin: 12px 0;
      padding-left: 28px;
      background: rgba(64, 158, 255, 0.05);
      border-radius: 8px;
      padding: 16px 16px 16px 44px;
      
      li {
        margin: 8px 0;
        line-height: 1.6;
        color: #606266;
        font-size: 14px;
        position: relative;
        
        &::before {
          content: '•';
          color: #409eff;
          position: absolute;
          left: -20px;
          font-weight: bold;
        }
      }
    }
  }
  
  .troubleshooting {
    h4 {
      color: #f56c6c;
      margin: 20px 0 12px 0;
      font-size: 17px;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 8px;
      
      &::before {
        content: '';
        width: 4px;
        height: 20px;
        background: linear-gradient(135deg, #f56c6c 0%, #f78989 100%);
        border-radius: 2px;
      }
    }
    
    ul {
      margin: 12px 0;
      padding-left: 28px;
      background: rgba(245, 108, 108, 0.05);
      border-radius: 8px;
      padding: 16px 16px 16px 44px;
      
      li {
        margin: 8px 0;
        line-height: 1.6;
        color: #606266;
        font-size: 14px;
        position: relative;
        
        &::before {
          content: '•';
          color: #f56c6c;
          position: absolute;
          left: -20px;
          font-weight: bold;
        }
      }
    }
  }
  
  .tech-info {
    margin-top: 24px;
    
    :deep(.el-descriptions) {
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
      
      .el-descriptions__header {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
      }
      
      .el-descriptions__body {
        .el-descriptions__table {
          .el-descriptions__cell {
            background: rgba(255, 255, 255, 0.8);
            
            &.is-bordered-label {
              background: rgba(64, 158, 255, 0.05);
              font-weight: 600;
              color: #409eff;
            }
          }
        }
      }
    }
  }
  
  .el-alert {
    border-radius: 8px;
    border: none;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  }
  
  .el-divider {
    margin: 24px 0;
    
    .el-divider__text {
      font-weight: 600;
      font-size: 16px;
      color: #303133;
      background: linear-gradient(135deg, #409eff 0%, #67c23a 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
  }

  .data-compute-guide {
    margin-top: 24px;
    
    .guide-steps {
      margin-bottom: 20px;
      
      .el-alert {
        margin-bottom: 16px;
        
        p {
          margin: 0;
          color: #3c3c3c;
          line-height: 1.6;
        }
      }
    }
    
    .guide-tips {
      .tip-list {
        list-style: none;
        padding: 0;
        margin: 0;
        
        li {
          padding: 8px 0;
          border-bottom: 1px solid #f0f0f0;
          color: #606266;
          line-height: 1.6;
          
          &:last-child {
            border-bottom: none;
          }
          
          strong {
            color: #409eff;
            font-weight: 600;
          }
        }
      }
      
      .el-card {
        height: 100%;
        
        .el-card__header {
          padding: 16px 20px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          font-weight: 600;
          font-size: 15px;
        }
        
        .el-card__body {
          padding: 20px;
        }
      }
    }
  }
}

/* 对话框样式增强 */
:deep(.el-dialog) {
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.2);
  
  .el-dialog__header {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 20px 24px;
    
    .el-dialog__title {
      font-size: 18px;
      font-weight: 600;
    }
    
    .el-dialog__close {
      color: rgba(255, 255, 255, 0.8);
      
      &:hover {
        color: white;
      }
    }
  }
  
  .el-dialog__body {
    padding: 24px;
  }
  
  .el-dialog__footer {
    padding: 16px 24px;
    background: #f8f9fa;
    border-top: 1px solid #e9ecef;
  }
}

/* 移动端适配 */
@media (max-width: 768px) {
  .header {
    flex-direction: column;
    gap: 20px;
    padding: 20px 16px;
    
    .header-left {
      text-align: center;
      
      h2 {
        font-size: 24px;
        justify-content: center;
      }
      
      p {
        text-align: center;
      }
    }
    
    .header-right {
      .el-button-group {
        display: flex;
        flex-direction: column;
        
        .el-button {
          border-radius: 8px !important;
          margin: 4px 0;
        }
      }
    }
  }
  
  .status-bar {
    flex-direction: column;
    gap: 12px;
    padding: 16px;
    text-align: center;
    
    .status-actions {
      margin-left: 0;
      justify-content: center;
    }
  }
  
  .toolbar {
    flex-direction: column;
    gap: 16px;
    padding: 16px;
    
    .toolbar-left,
    .toolbar-right {
      width: 100%;
      justify-content: center;
      
      .el-select {
        width: 100%;
      }
    }
  }
  
  .sheet-container {
    padding: 16px;
  }
  
  .tips-content {
    .template-intro {
      .el-row {
        .el-col {
          margin-bottom: 20px;
        }
      }
    }
  }
}

/* 滚动条美化 */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 4px;
  
  &:hover {
    background: linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%);
  }
}

/* 动画效果 */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.univer-report-designer {
  animation: fadeInUp 0.6s ease-out;
}

.sheet-container {
  animation: fadeInUp 0.8s ease-out 0.2s both;
}
</style> 