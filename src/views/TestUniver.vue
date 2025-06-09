<template>
  <div class="test-univer-page">
    <h1>🧪 Univer Sheet 标签页测试</h1>
    
    <div class="test-info">
      <p>✅ 如果配置正确，您应该能看到：</p>
      <ul>
        <li>🔧 顶部工具栏（格式化按钮等）</li>
        <li>📊 电子表格主体区域</li>
        <li>📋 <strong>底部的Sheet标签页：患者统计、科室统计、数据分析</strong></li>
      </ul>
    </div>
    
    <!-- Univer 容器 - 固定高度确保标签页可见 -->
    <div class="univer-test-container">
      <div id="univer-test" class="univer-instance"></div>
    </div>
    
    <div class="debug-info">
      <h3>🐛 调试信息</h3>
      <p>初始化状态: {{ initStatus }}</p>
      <p>错误信息: {{ errorMessage || '无' }}</p>
      <button @click="checkUniverDOM">🔍 检查DOM结构</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'
import { createUniver, defaultTheme, LocaleType, merge } from '@univerjs/presets'
import { UniverSheetsCorePreset } from '@univerjs/presets/preset-sheets-core'
import sheetsCoreZhCN from '@univerjs/presets/preset-sheets-core/locales/zh-CN'
import '@univerjs/presets/lib/styles/preset-sheets-core.css'

const initStatus = ref('未开始')
const errorMessage = ref('')

let univerAPI: any = null

// 简化的医疗数据 - 确保多个Sheet
const SIMPLE_WORKBOOK_DATA = {
  id: 'test-workbook',
  locale: LocaleType.ZH_CN,
  name: '测试工作簿',
  sheetOrder: ['sheet1', 'sheet2', 'sheet3'],
  sheets: {
    sheet1: {
      id: 'sheet1',
      name: '📊 患者统计',
      tabColor: '#4472c4',
      cellData: {
        0: {
          0: { v: '患者ID' },
          1: { v: '姓名' },
          2: { v: '科室' }
        },
        1: {
          0: { v: 'P001' },
          1: { v: '张三' },
          2: { v: '心内科' }
        }
      }
    },
    sheet2: {
      id: 'sheet2',
      name: '🏥 科室统计',
      tabColor: '#70ad47',
      cellData: {
        0: {
          0: { v: '科室名称' },
          1: { v: '患者数量' },
          2: { v: '收入' }
        },
        1: {
          0: { v: '心内科' },
          1: { v: 45 },
          2: { v: 382500 }
        }
      }
    },
    sheet3: {
      id: 'sheet3',
      name: '📈 数据分析',
      tabColor: '#ffc000',
      cellData: {
        0: {
          0: { v: '月份' },
          1: { v: '患者数量' },
          2: { v: '收入' }
        },
        1: {
          0: { v: '1月' },
          1: { v: 301 },
          2: { v: 138800 }
        }
      }
    }
  }
}

const initUniver = async () => {
  try {
    initStatus.value = '初始化中...'
    console.log('🚀 开始初始化测试 Univer')

    const container = document.getElementById('univer-test')
    if (!container) {
      throw new Error('容器元素不存在')
    }

    console.log('📦 创建 Univer 实例')
    const { univerAPI: api } = createUniver({
      locale: LocaleType.ZH_CN,
      locales: {
        [LocaleType.ZH_CN]: merge({}, sheetsCoreZhCN),
      },
      theme: defaultTheme,
      presets: [
        UniverSheetsCorePreset({
          container: 'univer-test',  // 使用ID字符串
          header: true,              // 关键配置：启用头部和标签页
        }),
      ]
    })

    univerAPI = api
    
    console.log('📊 创建工作簿...')
    univerAPI.createWorkbook(SIMPLE_WORKBOOK_DATA)
    
    initStatus.value = '✅ 初始化成功'
    console.log('✅ Univer 测试初始化成功！')
    
  } catch (err: any) {
    console.error('❌ 初始化失败:', err)
    initStatus.value = '❌ 初始化失败'
    errorMessage.value = err.message
  }
}

const checkUniverDOM = () => {
  const container = document.getElementById('univer-test')
  if (container) {
    console.log('🔍 Univer 容器DOM结构:')
    console.log('容器高度:', container.offsetHeight + 'px')
    console.log('容器宽度:', container.offsetWidth + 'px')
    console.log('子元素数量:', container.children.length)
    
    // 查找可能的标签页元素
    const tabs = container.querySelectorAll('[class*="tab"], [class*="sheet"], [class*="bottom"]')
    console.log('找到的标签页相关元素:', tabs.length)
    tabs.forEach((tab, index) => {
      console.log(`标签页 ${index + 1}:`, tab.className, tab.textContent?.trim())
    })
    
    // 检查是否有隐藏的元素
    const allChildren = container.querySelectorAll('*')
    let hiddenCount = 0
    allChildren.forEach(child => {
      const style = window.getComputedStyle(child)
      if (style.display === 'none' || style.visibility === 'hidden' || style.height === '0px') {
        hiddenCount++
      }
    })
    console.log('隐藏的元素数量:', hiddenCount)
  }
}

onMounted(async () => {
  await nextTick()
  setTimeout(() => {
    initUniver()
  }, 100)
})
</script>

<style scoped>
.test-univer-page {
  padding: 20px;
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.test-info {
  background: #f0f9ff;
  border: 1px solid #0ea5e9;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 20px;
}

.test-info ul {
  margin: 8px 0;
  padding-left: 20px;
}

.univer-test-container {
  flex: 1;
  min-height: 600px;
  border: 2px solid #e11d48;
  border-radius: 8px;
  margin-bottom: 20px;
  position: relative;
}

.univer-instance {
  width: 100%;
  height: 100%;
  min-height: 600px;
}

.debug-info {
  background: #fefce8;
  border: 1px solid #eab308;
  border-radius: 8px;
  padding: 16px;
}

.debug-info button {
  background: #3b82f6;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  margin-top: 8px;
}

.debug-info button:hover {
  background: #2563eb;
}

/* 确保 Univer 样式不被覆盖 */
:deep(.univer-instance) {
  * {
    box-sizing: border-box;
  }
}
</style> 