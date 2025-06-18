<template>
  <div class="chart-components">
    <h3>图表组件</h3>
    <div class="component-list">
      <div
        v-for="chart in chartList"
        :key="chart.type"
        class="chart-item"
        draggable="true"
        @dragstart="handleDragStart($event, chart)"
      >
        <el-icon><component :is="chart.icon" /></el-icon>
        <span>{{ chart.name }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { TrendCharts, PieChart, Histogram } from '@element-plus/icons-vue'

const chartList = ref([
  {
    type: 'line',
    name: '折线图',
    icon: TrendCharts,
    config: {
      // 默认配置
      data: [],
      xField: 'x',
      yField: 'y',
    }
  },
  {
    type: 'pie',
    name: '饼图',
    icon: PieChart,
    config: {
      data: [],
      angleField: 'value',
      colorField: 'type',
    }
  },
  {
    type: 'bar',
    name: '柱状图',
    icon: Histogram,
    config: {
      data: [],
      xField: 'x',
      yField: 'y',
    }
  }
])

const handleDragStart = (event: DragEvent, chart: any) => {
  if (event.dataTransfer) {
    event.dataTransfer.setData('chartType', JSON.stringify(chart))
  }
}
</script>

<style scoped>
.chart-components {
  width: 200px;
  padding: 16px;
  border-right: 1px solid #ddd;
}

.component-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.chart-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: move;
  user-select: none;
  transition: all 0.3s ease;
}

.chart-item:hover {
  background-color: #f5f5f5;
  transform: translateY(-2px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.chart-item .el-icon {
  font-size: 16px;
  color: #409eff;
}

.chart-item span {
  font-size: 14px;
  color: #606266;
}
</style> 