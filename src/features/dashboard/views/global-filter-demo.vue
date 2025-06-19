<template>
  <div class="global-filter-demo">
    <div class="demo-header">
      <h2>
        <el-icon><Filter /></el-icon>
        全局筛选器功能演示
      </h2>
      <p>这个页面展示了全局筛选器功能的完整使用流程</p>
    </div>

    <el-row :gutter="20">
      <!-- 左侧：全局筛选器配置 -->
      <el-col :span="12">
        <el-card>
          <template #header>
            <div class="card-header">
              <el-icon><Setting /></el-icon>
              <span>全局筛选器配置</span>
            </div>
          </template>
          
          <GlobalFilterConfigPanel
            v-model="filtersConfig"
            :datasets="datasets"
            @update:modelValue="handleFiltersConfigChange"
          />
        </el-card>
      </el-col>

      <!-- 右侧：筛选器渲染效果 -->
      <el-col :span="12">
        <el-card>
          <template #header>
            <div class="card-header">
              <el-icon><View /></el-icon>
              <span>筛选器渲染效果</span>
            </div>
          </template>
          
          <GlobalFiltersRenderer
            :filters="filtersConfig.filters"
            :layout="filtersConfig.layout"
            @filter-change="handleFilterChange"
            @apply-filters="handleApplyFilters"
          />
        </el-card>
      </el-col>
    </el-row>

    <!-- 图表绑定配置演示 -->
    <el-row :gutter="20" style="margin-top: 20px;">
      <el-col :span="24">
        <el-card>
          <template #header>
            <div class="card-header">
              <el-icon><Connection /></el-icon>
              <span>图表筛选器绑定配置演示</span>
            </div>
          </template>
          
          <div class="binding-demo">
            <div class="demo-chart-config">
              <h4>模拟图表配置</h4>
              <el-form :model="demoChartConfig" label-width="120px" size="small">
                <el-form-item label="图表类型">
                  <el-select v-model="demoChartConfig.type">
                    <el-option label="柱状图" value="bar" />
                    <el-option label="折线图" value="line" />
                    <el-option label="饼图" value="pie" />
                  </el-select>
                </el-form-item>
                <el-form-item label="图表标题">
                  <el-input v-model="demoChartConfig.title" />
                </el-form-item>
                <el-form-item label="数据集">
                  <el-select v-model="demoChartConfig.datasetId" @change="loadChartFields">
                    <el-option
                      v-for="dataset in datasets"
                      :key="dataset.id"
                      :label="dataset.name"
                      :value="dataset.id"
                    />
                  </el-select>
                </el-form-item>
              </el-form>
            </div>

            <div class="binding-config">
              <ChartGlobalFilterBindingPanel
                v-model="demoChartConfig"
                :global-filters="filtersConfig.filters"
                :chart-fields="selectedDatasetFields"
                @update:modelValue="handleChartConfigChange"
              />
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 配置预览 -->
    <el-row style="margin-top: 20px;">
      <el-col :span="24">
        <el-card>
          <template #header>
            <div class="card-header">
              <el-icon><Document /></el-icon>
              <span>配置预览</span>
            </div>
          </template>
          
          <el-tabs v-model="activeTab">
            <el-tab-pane label="全局筛选器配置" name="filters">
              <pre class="config-preview">{{ JSON.stringify(filtersConfig, null, 2) }}</pre>
            </el-tab-pane>
            <el-tab-pane label="图表配置" name="chart">
              <pre class="config-preview">{{ JSON.stringify(demoChartConfig, null, 2) }}</pre>
            </el-tab-pane>
            <el-tab-pane label="筛选器值" name="values">
              <pre class="config-preview">{{ JSON.stringify(currentFilterValues, null, 2) }}</pre>
            </el-tab-pane>
          </el-tabs>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Filter, Setting, View, Connection, Document } from '@element-plus/icons-vue'
import GlobalFilterConfigPanel from '../components/dashboard/GlobalFilterConfigPanel.vue'
import GlobalFiltersRenderer from '../components/dashboard/GlobalFiltersRenderer.vue'
import ChartGlobalFilterBindingPanel from '../components/dashboard/ChartGlobalFilterBindingPanel.vue'
import type { 
  DashboardGlobalFilters, 
  ChartConfig 
} from '@/shared/types/dashboard'
import type { DataSet, DataSetField } from '@/shared/types/dataManagement'
import { dataSetApi } from '@/api/dataSource'

// 响应式数据
const filtersConfig = ref<DashboardGlobalFilters>({
  filters: [],
  layout: {
    position: 'top',
    columns: 3,
    spacing: 16
  }
})

const datasets = ref<DataSet[]>([])
const currentFilterValues = ref<Record<string, any>>({})
const activeTab = ref('filters')

// 演示图表配置
const demoChartConfig = ref<ChartConfig>({
  i: 'demo-chart',
  id: 'demo-chart',
  type: 'bar',
  title: '演示图表',
  datasetId: undefined,
  useGlobalFilters: false,
  globalFilterBindings: []
})

// 选中数据集的字段
const selectedDatasetFields = computed(() => {
  const dataset = datasets.value.find(d => d.id === demoChartConfig.value.datasetId)
  return dataset?.fields || []
})

// 方法
const handleFiltersConfigChange = (config: DashboardGlobalFilters) => {
  filtersConfig.value = config
  console.log('筛选器配置变更:', config)
}

const handleFilterChange = (values: Record<string, any>) => {
  currentFilterValues.value = values
  console.log('筛选器值变更:', values)
  ElMessage.info(`筛选器值已更新: ${Object.keys(values).length} 个筛选条件`)
}

const handleApplyFilters = (values: Record<string, any>) => {
  currentFilterValues.value = values
  console.log('应用筛选器:', values)
  ElMessage.success('筛选器已应用')
}

const handleChartConfigChange = (config: ChartConfig) => {
  demoChartConfig.value = config
  console.log('图表配置变更:', config)
}

const loadChartFields = async (datasetId: number) => {
  console.log('加载数据集字段:', datasetId)
  // 这里可以添加加载逻辑，因为演示中数据集已经包含字段信息
}

const loadDatasets = async () => {
  try {
    // 模拟数据集数据
    datasets.value = [
      {
        id: 1,
        name: '患者基础信息数据集',
        description: '包含患者的基本信息和统计数据',
        dataSourceId: 1,
        dataSourceName: '医疗数据源',
        queryType: 'single',
        status: 'active',
        createTime: '2024-01-01',
        fields: [
          {
            id: 1,
            datasetId: 1,
            fieldName: 'gender',
            fieldType: 'dimension',
            displayName: '性别',
            description: '患者性别',
            isVisible: true,
            sortOrder: 1
          },
          {
            id: 2,
            datasetId: 1,
            fieldName: 'age_group',
            fieldType: 'dimension',
            displayName: '年龄段',
            description: '患者年龄分组',
            isVisible: true,
            sortOrder: 2
          },
          {
            id: 3,
            datasetId: 1,
            fieldName: 'department',
            fieldType: 'dimension',
            displayName: '科室',
            description: '就诊科室',
            isVisible: true,
            sortOrder: 3
          },
          {
            id: 4,
            datasetId: 1,
            fieldName: 'patient_count',
            fieldType: 'metric',
            displayName: '患者数量',
            description: '患者总数',
            isVisible: true,
            sortOrder: 4,
            aggregation: 'count'
          },
          {
            id: 5,
            datasetId: 1,
            fieldName: 'total_cost',
            fieldType: 'metric',
            displayName: '总费用',
            description: '医疗总费用',
            isVisible: true,
            sortOrder: 5,
            aggregation: 'sum'
          }
        ]
      }
    ]
  } catch (error) {
    console.error('加载数据集失败:', error)
    ElMessage.error('加载数据集失败')
  }
}

// 初始化
onMounted(() => {
  loadDatasets()
})
</script>

<style scoped lang="scss">
.global-filter-demo {
  padding: 20px;

  .demo-header {
    margin-bottom: 20px;
    text-align: center;

    h2 {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      margin: 0 0 8px 0;
      color: #2c3e50;
    }

    p {
      color: #7f8c8d;
      margin: 0;
    }
  }

  .card-header {
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 600;
  }

  .binding-demo {
    display: flex;
    gap: 20px;

    .demo-chart-config {
      flex: 1;
      padding: 16px;
      background: #f8f9fa;
      border-radius: 8px;

      h4 {
        margin: 0 0 16px 0;
        color: #2c3e50;
      }
    }

    .binding-config {
      flex: 2;
    }
  }

  .config-preview {
    background: #f4f4f4;
    border: 1px solid #ddd;
    border-radius: 4px;
    padding: 16px;
    font-size: 12px;
    max-height: 400px;
    overflow-y: auto;
    margin: 0;
  }

  .el-row {
    margin-bottom: 0;
  }
}

@media (max-width: 768px) {
  .global-filter-demo {
    .binding-demo {
      flex-direction: column;
    }
  }
}
</style> 