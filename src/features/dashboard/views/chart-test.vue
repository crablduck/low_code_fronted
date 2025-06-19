<template>
  <div class="chart-test-page">
    <h2>📊 图表渲染测试</h2>
    
    <div class="test-controls">
      <el-button @click="testPieChart" type="primary">测试饼图</el-button>
      <el-button @click="clearChart" type="default">清空图表</el-button>
    </div>
    
    <div class="chart-container">
      <div id="test-chart" style="width: 500px; height: 400px; border: 1px solid #ccc;"></div>
    </div>
    
    <div class="data-preview">
      <h3>测试数据</h3>
      <pre>{{ JSON.stringify(testData, null, 2) }}</pre>
    </div>
    
    <div class="transformation-result">
      <h3>转换结果</h3>
      <pre>{{ JSON.stringify(transformResult, null, 2) }}</pre>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import * as echarts from 'echarts'
import { transformToObjectArray, transformForPieChart, generateEChartsOption } from '@/shared/utils/chartDataTransform'

const chartInstance = ref<echarts.ECharts | null>(null)
const transformResult = ref<any>({})

// 模拟您的API数据
const testData = ref({
  code: 200,
  message: "成功",
  data: {
    columns: ["gender", "患者ID"],
    data: [
      ["M", 10],
      ["F", 10]
    ],
    totalCount: 2
  }
})

// 测试饼图
const testPieChart = () => {
  try {
    console.log('🧪 开始测试饼图渲染')
    
    // 1. 转换数据格式
    const objectData = transformToObjectArray(testData.value)
    console.log('1. 对象数组转换结果:', objectData)
    
    // 2. 饼图字段映射
    const fieldMapping = {
      categoryField: 'gender',
      valueField: '患者ID'
    }
    console.log('2. 字段映射配置:', fieldMapping)
    
    // 3. 饼图数据转换
    const chartData = transformForPieChart(testData.value, fieldMapping)
    console.log('3. 饼图数据转换结果:', chartData)
    transformResult.value = chartData
    
    // 4. 生成ECharts配置
    const echartsOption = generateEChartsOption('pie', chartData, '性别分布图')
    console.log('4. ECharts配置:', echartsOption)
    
    // 5. 渲染图表
    const container = document.getElementById('test-chart')
    if (!container) {
      throw new Error('图表容器未找到')
    }
    
    // 清理旧实例
    if (chartInstance.value) {
      chartInstance.value.dispose()
    }
    
    // 创建新实例
    chartInstance.value = echarts.init(container)
    chartInstance.value.setOption(echartsOption)
    
    console.log('✅ 饼图渲染成功')
    
  } catch (error) {
    console.error('❌ 饼图测试失败:', error)
    alert(`测试失败: ${error.message}`)
  }
}

// 清空图表
const clearChart = () => {
  if (chartInstance.value) {
    chartInstance.value.dispose()
    chartInstance.value = null
  }
  transformResult.value = {}
}

// 组件挂载时自动测试
onMounted(() => {
  setTimeout(() => {
    testPieChart()
  }, 500)
})

// 组件卸载时清理
onUnmounted(() => {
  clearChart()
})
</script>

<style lang="scss" scoped>
.chart-test-page {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
  
  h2 {
    color: #303133;
    margin-bottom: 20px;
  }
  
  .test-controls {
    margin-bottom: 20px;
    
    .el-button {
      margin-right: 10px;
    }
  }
  
  .chart-container {
    margin-bottom: 30px;
    
    #test-chart {
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }
  }
  
  .data-preview,
  .transformation-result {
    margin-bottom: 20px;
    
    h3 {
      color: #606266;
      font-size: 16px;
      margin-bottom: 10px;
    }
    
    pre {
      background: #f5f7fa;
      padding: 15px;
      border-radius: 4px;
      font-size: 12px;
      overflow-x: auto;
      border: 1px solid #e4e7ed;
    }
  }
}
</style> 