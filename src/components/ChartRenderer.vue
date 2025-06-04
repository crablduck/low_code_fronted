<template>
  <div class="chart-renderer">
    <div class="chart-header">
      <h3>{{ config.title }}</h3>
      <div class="chart-actions" v-if="config.showToolbox">
        <el-button size="small" @click="downloadChart">下载</el-button>
      </div>
    </div>
    <div class="chart-content">
      <div ref="chartRef" class="chart-container"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import * as echarts from 'echarts'
import { ElMessage } from 'element-plus'

const props = defineProps<{
  config: string
  data: Array<{ [key: string]: any }>
}>()

const chartRef = ref<HTMLElement | null>(null)
let chartInstance: echarts.ECharts | null = null

const initChart = () => {
  if (!chartRef.value) return
  
  chartInstance = echarts.init(chartRef.value)
  
  try {
    // Parse the config string
    const config = JSON.parse(props.config)
    
    // Get the data
    const chartData = props.data.slice(0, config.dataLimit)
    
    const options = {
      title: {
        text: config.title
      },
      tooltip: {
        trigger: 'axis'
      },
      legend: {
        show: config.showLegend
      },
      xAxis: {
        type: 'category',
        data: chartData.map(item => item[config.xField])
      },
      yAxis: {
        type: 'value'
      },
      series: [
        {
          name: config.title,
          type: 'line',
          data: chartData.map(item => item[config.yField])
        }
      ]
    }

    chartInstance.setOption(options)
  } catch (err) {
    console.error('Chart configuration error:', err)
    ElMessage.error('图表配置错误: ' + err.message)
  }
}

const downloadChart = () => {
  if (!chartInstance) return
  
  const pngData = chartInstance.getDataURL({
    type: 'png',
    pixelRatio: 2,
    backgroundColor: '#fff'
  })

  const link = document.createElement('a')
  link.href = pngData
  link.download = `${props.config.title}.png`
  link.click()
}

onMounted(() => {
  initChart()
})

watch(() => props.data, () => {
  if (chartInstance) {
    initChart()
  }
})

watch(() => props.config, () => {
  if (chartInstance) {
    initChart()
  }
})
</script>

<style scoped>
.chart-renderer {
  width: 100%;
  height: 100%;
  background: white;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  border-bottom: 1px solid #eee;
}

.chart-header h3 {
  margin: 0;
  font-size: 16px;
}

.chart-actions {
  display: flex;
  gap: 8px;
}

.chart-content {
  width: 100%;
  height: calc(100% - 40px);
}

.chart-container {
  width: 100%;
  height: 100%;
}
</style>
