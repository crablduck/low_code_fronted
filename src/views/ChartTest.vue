<template>
  <div class="chart-test-container">
    <div class="test-header">
      <h2>图表渲染测试</h2>
      <el-button type="primary" @click="loadTestData">加载测试数据</el-button>
    </div>

    <div class="data-input-section">
      <h3>数据输入</h3>
      <el-input
        v-model="jsonData"
        type="textarea"
        :rows="20"
        placeholder="请输入JSON数据"
        @change="parseJsonData"
      />
    </div>

    <div class="chart-container">
      <h3>图表预览</h3>
      <div v-if="error" class="error-message">
        <el-alert :title="error" type="error" show-icon />
      </div>
      <div v-else class="grid-layout">
        <grid-layout
          :layout="layout"
          :col-num="12"
          :row-height="30"
          :is-draggable="false"
          :is-resizable="false"
          :is-mirrored="false"
          :vertical-compact="true"
          :margin="[10, 10]"
          :use-css-transforms="true"
        >
          <grid-item
            v-for="item in layout"
            :key="item.i"
            :x="item.x"
            :y="item.y"
            :w="item.w"
            :h="item.h"
            :i="item.i"
          >
            <div class="chart-item">
              <ChartRenderer
                v-if="item.chartConfig"
                :config="JSON.stringify(item.chartConfig)"
                :data="item.data"
              />
            </div>
          </grid-item>
        </grid-layout>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { GridLayout, GridItem } from 'vue3-grid-layout-next'
import ChartRenderer from '@/components/ChartRenderer.vue'

const jsonData = ref('')
const error = ref('')
const layout = ref([])
const chartData = ref([])

const loadTestData = () => {
  const testData = {
    code: 200,
    data: {
      id: "5",
      name: "测试2",
      description: "",
      layout: [
        {
          x: 0,
          y: 0,
          w: 6,
          h: 7,
          i: "chart-1748504670124",
          chartConfig: {
            i: "chart-1748504670124",
            type: "line",
            title: "折线图",
            showLegend: true,
            showToolbox: false,
            dataLimit: 100,
            xField: "date",
            yField: "patientCount"
          },
          moved: false,
          data: [
            { date: "2021-01-01", patientCount: 100 },
            { date: "2021-01-02", patientCount: 150 },
            { date: "2021-01-03", patientCount: 200 },
            { date: "2021-01-04", patientCount: 180 },
            { date: "2021-01-05", patientCount: 160 },
            { date: "2021-01-06", patientCount: 220 },
            { date: "2021-01-07", patientCount: 240 },
            { date: "2021-01-08", patientCount: 280 },
            { date: "2021-01-09", patientCount: 300 },
            { date: "2021-01-10", patientCount: 320 }
          ]
        }
      ],
      config: {
        charts: [
          {
            id: "chart-1748504670124",
            type: "line",
            config: {
              i: "chart-1748504670124",
              type: "line",
              title: "折线图",
              showLegend: true,
              showToolbox: false,
              dataLimit: 100,
              xField: "date",
              yField: "patientCount"
            },
            datasetId: 1
          }
        ]
      },
      renderState: true,
      autoRender: true
    },
    message: "操作成功"
  }

  try {
    layout.value = testData.data.layout
    error.value = ''
    jsonData.value = JSON.stringify(testData, null, 2)
  } catch (err) {
    error.value = '解析布局数据失败: ' + err.message
  }
  parseJsonData()
}

const parseJsonData = () => {
  try {
    const parsedData = JSON.parse(jsonData.value)
    if (parsedData.code === 200) {
      // layout 已经是数组，不需要解析
      layout.value = parsedData.data.layout
      
      // 直接使用 config 对象
      const parsedConfig = parsedData.data.config
      
      // 从 layout 中获取数据
      if (parsedData.data.layout && parsedData.data.layout[0] && parsedData.data.layout[0].data) {
        chartData.value = parsedData.data.layout[0].data
      }
      
      error.value = ''
    }
  } catch (err) {
    error.value = `JSON解析错误: ${err.message}`
  }
}

// 模拟数据
chartData.value = [
  { date: '2021-01-01', patientCount: 100 },
  { date: '2021-01-02', patientCount: 150 },
  { date: '2021-01-03', patientCount: 130 },
  { date: '2021-01-04', patientCount: 180 },
  { date: '2021-01-05', patientCount: 200 }
]
</script>

<style scoped>
.chart-test-container {
  padding: 20px;
}

.test-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.data-input-section {
  margin-bottom: 20px;
}

.chart-container {
  background: #f5f7fa;
  padding: 20px;
  border-radius: 4px;
}

.error-message {
  margin-bottom: 20px;
}

.grid-layout {
  width: 100%;
}

.chart-item {
  width: 100%;
  height: 100%;
  background: white;
  border-radius: 4px;
  padding: 10px;
  box-sizing: border-box;
}
</style>
