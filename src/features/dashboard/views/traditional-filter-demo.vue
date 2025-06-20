<template>
  <div class="traditional-filter-demo">
    <div class="demo-header">
      <h2>
        <el-icon><Filter /></el-icon>
        传统样式全局筛选器演示
      </h2>
      <p>这个页面展示了新的传统样式全局筛选器功能</p>
    </div>

    <el-row :gutter="20">
      <!-- 配置面板 -->
      <el-col :span="8">
        <el-card>
          <template #header>
            <div class="card-header">
              <el-icon><Setting /></el-icon>
              <span>筛选器配置</span>
            </div>
          </template>
          
          <div class="config-section">
            <h4>添加筛选器</h4>
            <el-button type="primary" @click="addDemoFilter" size="small">
              <el-icon><Plus /></el-icon>
              添加演示筛选器
            </el-button>
            
            <div v-if="demoFilters.length > 0" class="filter-list">
              <h4>已配置筛选器</h4>
              <div 
                v-for="(filter, index) in demoFilters" 
                :key="filter.key"
                class="filter-item"
              >
                <div class="filter-info">
                  <span class="filter-name">{{ filter.label }}</span>
                  <el-tag 
                    size="small" 
                    :type="getControlTypeColor(filter.controlType)"
                  >
                    {{ getControlTypeLabel(filter.controlType) }}
                  </el-tag>
                </div>
                <el-button 
                  size="small" 
                  type="danger" 
                  text 
                  @click="removeDemoFilter(index)"
                >
                  删除
                </el-button>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>

      <!-- 传统样式过滤器 -->
      <el-col :span="16">
        <el-card>
          <template #header>
            <div class="card-header">
              <el-icon><View /></el-icon>
              <span>传统样式筛选器</span>
            </div>
          </template>
          
          <TraditionalGlobalFiltersRenderer
            :filters="demoFilters"
            :show-quick-actions="true"
            :auto-apply="false"
            @filter-change="handleFilterChange"
            @apply-filters="handleApplyFilters"
          />
        </el-card>
      </el-col>
    </el-row>

    <!-- 对比效果 -->
    <el-row :gutter="20" style="margin-top: 20px;">
      <el-col :span="24">
        <el-card>
          <template #header>
            <div class="card-header">
              <el-icon><Switch /></el-icon>
              <span>样式对比</span>
              <div style="margin-left: auto;">
                <el-radio-group v-model="activeTab" size="small">
                  <el-radio-button label="traditional">传统样式</el-radio-button>
                  <el-radio-button label="original">原始样式</el-radio-button>
                </el-radio-group>
              </div>
            </div>
          </template>
          
          <div style="padding: 20px;">
            <div v-if="activeTab === 'traditional'">
              <TraditionalGlobalFiltersRenderer
                :filters="demoFilters"
                :show-quick-actions="true"
                :auto-apply="false"
                @filter-change="handleFilterChange"
                @apply-filters="handleApplyFilters"
              />
            </div>
            <div v-else>
              <GlobalFiltersRenderer
                :filters="demoFilters"
                :layout="{ position: 'top', columns: 3, spacing: 16 }"
                :show-quick-actions="true"
                :auto-apply="false"
                @filter-change="handleFilterChange"
                @apply-filters="handleApplyFilters"
              />
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 筛选结果 -->
    <el-row style="margin-top: 20px;">
      <el-col :span="24">
        <el-card>
          <template #header>
            <div class="card-header">
              <el-icon><Document /></el-icon>
              <span>筛选结果</span>
            </div>
          </template>
          
          <div class="result-display">
            <h4>当前筛选条件：</h4>
            <pre class="filter-result">{{ JSON.stringify(currentFilterValues, null, 2) }}</pre>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Filter, Setting, View, Switch, Document, Plus } from '@element-plus/icons-vue'
import TraditionalGlobalFiltersRenderer from '../components/dashboard/TraditionalGlobalFiltersRenderer.vue'
import GlobalFiltersRenderer from '../components/dashboard/GlobalFiltersRenderer.vue'
import type { GlobalFilterConfig } from '@/shared/types/dashboard'

// 响应式数据
const demoFilters = ref<GlobalFilterConfig[]>([])
const currentFilterValues = ref<Record<string, any>>({})
const activeTab = ref('traditional')

// 演示数据
const demoFilterTemplates = [
  {
    key: 'province',
    label: '省',
    datasetId: 1,
    fieldName: 'province',
    controlType: 'select' as const,
    placeholder: '全部',
    options: [
      { label: '北京', value: 'beijing' },
      { label: '上海', value: 'shanghai' },
      { label: '广东', value: 'guangdong' },
      { label: '浙江', value: 'zhejiang' },
      { label: '江苏', value: 'jiangsu' }
    ]
  },
  {
    key: 'hospital_type',
    label: '医疗机构',
    datasetId: 1,
    fieldName: 'hospital_type',
    controlType: 'select' as const,
    placeholder: '全部',
    options: [
      { label: '三甲医院', value: 'level3a' },
      { label: '三乙医院', value: 'level3b' },
      { label: '二甲医院', value: 'level2a' },
      { label: '社区医院', value: 'community' },
      { label: '专科医院', value: 'specialist' }
    ]
  },
  {
    key: 'category',
    label: '业务关系',
    datasetId: 1,
    fieldName: 'category',
    controlType: 'multiSelect' as const,
    placeholder: '请选择',
    options: [
      { label: '全部', value: 'all' },
      { label: '合作', value: 'cooperation' },
      { label: '竞争', value: 'competition' }
    ]
  },
  {
    key: 'date_range',
    label: '选择日期',
    datasetId: 1,
    fieldName: 'date_range',
    controlType: 'dateRange' as const,
    placeholder: '选择日期范围'
  },
  {
    key: 'report_date',
    label: '报告月',
    datasetId: 1,
    fieldName: 'report_date',
    controlType: 'month' as const,
    placeholder: '选择月份',
    defaultValue: '2022-05'
  },
  {
    key: 'report_year',
    label: '年',
    datasetId: 1,
    fieldName: 'report_year',
    controlType: 'year' as const,
    placeholder: '选择年份'
  },
  {
    key: 'keywords',
    label: '编制情况',
    datasetId: 1,
    fieldName: 'keywords',
    controlType: 'input' as const,
    placeholder: '请输入关键词'
  }
]

// 方法
const addDemoFilter = () => {
  if (demoFilters.value.length >= demoFilterTemplates.length) {
    ElMessage.warning('所有演示筛选器已添加')
    return
  }
  
  const template = demoFilterTemplates[demoFilters.value.length]
  demoFilters.value.push({ ...template })
  ElMessage.success(`添加了筛选器：${template.label}`)
}

const removeDemoFilter = (index: number) => {
  const filter = demoFilters.value[index]
  demoFilters.value.splice(index, 1)
  ElMessage.success(`删除了筛选器：${filter.label}`)
}

const handleFilterChange = (values: Record<string, any>) => {
  currentFilterValues.value = values
  console.log('筛选器值变更:', values)
}

const handleApplyFilters = (values: Record<string, any>) => {
  currentFilterValues.value = values
  console.log('应用筛选器:', values)
  ElMessage.success('筛选条件已应用')
}

const getControlTypeLabel = (type: string) => {
  const labels = {
    select: '下拉选择',
    multiSelect: '多选',
    dateRange: '日期范围',
    date: '日期选择',
    month: '月份选择',
    year: '年份选择',
    slider: '滑块',
    input: '输入框',
    number: '数字输入'
  }
  return labels[type as keyof typeof labels] || type
}

const getControlTypeColor = (type: string) => {
  const colors = {
    select: '',
    multiSelect: 'success',
    dateRange: 'warning',
    date: 'info',
    month: 'info',
    year: 'info',
    slider: 'danger',
    input: 'primary',
    number: 'primary'
  }
  return colors[type as keyof typeof colors] || ''
}

// 初始化
onMounted(() => {
  // 默认添加几个筛选器作为演示
  demoFilters.value = [
    { ...demoFilterTemplates[0] },
    { ...demoFilterTemplates[1] },
    { ...demoFilterTemplates[4] },
    { ...demoFilterTemplates[5] }
  ]
})
</script>

<style scoped lang="scss">
.traditional-filter-demo {
  padding: 20px;
  background: #f5f7fa;
  min-height: 100vh;

  .demo-header {
    text-align: center;
    margin-bottom: 30px;
    
    h2 {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      margin: 0 0 10px 0;
      color: #303133;
      
      .el-icon {
        color: #409eff;
      }
    }
    
    p {
      color: #606266;
      margin: 0;
      font-size: 14px;
    }
  }

  .card-header {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    
    .el-icon {
      color: #409eff;
    }
  }

  .config-section {
    .filter-list {
      margin-top: 16px;
      
      .filter-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 8px 12px;
        margin: 8px 0;
        border: 1px solid #e4e7ed;
        border-radius: 4px;
        background: #fafafa;
        
        .filter-info {
          display: flex;
          align-items: center;
          gap: 8px;
          
          .filter-name {
            font-size: 13px;
            color: #303133;
          }
        }
      }
    }
  }

  .result-display {
    h4 {
      margin: 0 0 12px 0;
      color: #303133;
    }
    
    .filter-result {
      background: #f8f9fa;
      border: 1px solid #e9ecef;
      border-radius: 4px;
      padding: 12px;
      font-size: 12px;
      color: #495057;
      white-space: pre-wrap;
      max-height: 200px;
      overflow-y: auto;
    }
  }
}

// 响应式处理
@media (max-width: 768px) {
  .traditional-filter-demo {
    padding: 10px;
    
    .demo-header h2 {
      font-size: 18px;
    }
  }
}
</style> 