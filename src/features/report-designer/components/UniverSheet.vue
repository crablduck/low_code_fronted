<template>
  <div class="univer-sheet-container">
    <!-- 加载状态覆盖层 -->
    <div v-if="loading" class="loading-overlay">
      <div class="loading-spinner">
        <div class="spinner"></div>
      </div>
      <p>🚀 正在加载 Univer 电子表格（集成绘图和高级功能）...</p>
    </div>
    
    <!-- 错误状态 -->
    <div v-if="error && !showFallback && !loading" class="error-container">
      <el-alert
        :title="error"
        type="error"
        center
        show-icon
      />
      <div style="margin-top: 16px; display: flex; gap: 12px; justify-content: center;">
        <el-button @click="retryInit">🔄 重试</el-button>
        <el-button @click="useFallback" type="success">📋 使用备用编辑器</el-button>
      </div>
    </div>
    
    <!-- 备用编辑器 -->
    <div v-if="showFallback" class="fallback-container">
      <div class="fallback-header">
        <el-alert 
          title="📋 正在使用备用表格编辑器" 
          type="info" 
          :closable="false"
          style="margin-bottom: 16px;"
        />
      </div>
      <div class="fallback-table">
        <el-table
          :data="fallbackData"
          border
          style="width: 100%"
          :height="parseInt(height) - 100"
        >
          <el-table-column
            v-for="(col, index) in fallbackColumns"
            :key="index"
            :prop="col.prop"
            :label="col.label"
            :width="120"
          >
            <template #default="{ row, $index }">
              <el-input
                v-model="row[col.prop]"
                size="small"
                @change="(value: any) => handleCellChange($index, col.prop, value)"
              />
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>
    
    <!-- Univer容器 - 按照指南的简洁方式 -->
    <div 
      v-show="!showFallback"
      ref="containerRef"
      class="univer-container"
      :style="{ width: '100%', height: height }"
    ></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick, computed } from 'vue'
import { ElAlert, ElButton, ElMessage, ElTable, ElTableColumn, ElInput } from 'element-plus'

// 引入 Univer 预设包 - 集成高级功能：绘图、图表、高级特性
import { createUniver, defaultTheme, LocaleType, merge } from '@univerjs/presets'

// 核心表格功能
import { UniverSheetsCorePreset } from '@univerjs/presets/preset-sheets-core'
import sheetsCoreZhCN from '@univerjs/presets/preset-sheets-core/locales/zh-CN'
import '@univerjs/presets/lib/styles/preset-sheets-core.css'

// 注释：Sheet UI 功能通过 UniverSheetsCorePreset({header: true}) 启用

// 绘图功能预设 - 支持图表、绘图等功能
import { UniverSheetsDrawingPreset } from '@univerjs/presets/preset-sheets-drawing'
import UniverPresetSheetsDrawingZhCN from '@univerjs/presets/preset-sheets-drawing/locales/zh-CN'
import '@univerjs/presets/lib/styles/preset-sheets-drawing.css'

// 高级功能预设 - 支持更多企业级特性
import { UniverSheetsAdvancedPreset } from '@univerjs/presets/preset-sheets-advanced'
import UniverPresetSheetsAdvancedZhCN from '@univerjs/presets/preset-sheets-advanced/locales/zh-CN'
import '@univerjs/presets/lib/styles/preset-sheets-advanced.css'

// 导入我们的自定义菜单插件
import { 
  createUniverSheetsCustomMenuPlugin,
  disposeUniverSheetsCustomMenuPlugin,
  getUniverSheetsCustomMenuPlugin
} from '@/plugins/univer-custom-menu'

// 组件Props
interface Props {
  height?: string
  data?: any
  options?: any
  readonly?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  height: '600px',
  readonly: false
})

// 组件Emits
const emit = defineEmits<{
  (e: 'change', data: any): void
  (e: 'cellUpdate', data: any): void
  (e: 'ready'): void
}>()

// 响应式数据
const containerRef = ref<HTMLDivElement | null>(null)
const loading = ref(true)
const error = ref('')
const showFallback = ref(false)

let univerAPI: any = null

// 医疗行业示例数据 - 包含多个sheet和图表数据
const WORKBOOK_DATA = {
  id: 'medical-workbook',
  locale: LocaleType.ZH_CN,
  name: '医疗数据工作簿',
  sheetOrder: ['patientSheet', 'departmentSheet', 'chartSheet'],
  appVersion: '3.0.0-alpha',
  sheets: {
    // 患者数据表
    patientSheet: {
      id: 'patientSheet',
      name: '患者统计',
      tabColor: '#4472c4',
      hidden: 0,
      rowCount: 50,
      columnCount: 15,
      zoomRatio: 1,
      scrollTop: 0,
      scrollLeft: 0,
      defaultColumnWidth: 100,
      defaultRowHeight: 25,
      mergeData: [],
      cellData: {
        0: {
          0: { v: '患者ID', s: { bl: 1, fc: { rgb: '#ffffff' }, bg: { rgb: '#4472c4' } } },
          1: { v: '姓名', s: { bl: 1, fc: { rgb: '#ffffff' }, bg: { rgb: '#4472c4' } } },
          2: { v: '年龄', s: { bl: 1, fc: { rgb: '#ffffff' }, bg: { rgb: '#4472c4' } } },
          3: { v: '性别', s: { bl: 1, fc: { rgb: '#ffffff' }, bg: { rgb: '#4472c4' } } },
          4: { v: '科室', s: { bl: 1, fc: { rgb: '#ffffff' }, bg: { rgb: '#4472c4' } } },
          5: { v: '诊断', s: { bl: 1, fc: { rgb: '#ffffff' }, bg: { rgb: '#4472c4' } } },
          6: { v: '入院日期', s: { bl: 1, fc: { rgb: '#ffffff' }, bg: { rgb: '#4472c4' } } },
          7: { v: '出院日期', s: { bl: 1, fc: { rgb: '#ffffff' }, bg: { rgb: '#4472c4' } } },
          8: { v: '治疗费用', s: { bl: 1, fc: { rgb: '#ffffff' }, bg: { rgb: '#4472c4' } } },
          9: { v: '满意度', s: { bl: 1, fc: { rgb: '#ffffff' }, bg: { rgb: '#4472c4' } } }
        },
        1: {
          0: { v: 'P001' }, 1: { v: '张三' }, 2: { v: 45 }, 3: { v: '男' }, 4: { v: '心内科' },
          5: { v: '高血压' }, 6: { v: '2024-01-15' }, 7: { v: '2024-01-25' }, 8: { v: 8500 }, 9: { v: 4.5 }
        },
        2: {
          0: { v: 'P002' }, 1: { v: '李四' }, 2: { v: 32 }, 3: { v: '女' }, 4: { v: '妇产科' },
          5: { v: '妊娠检查' }, 6: { v: '2024-01-16' }, 7: { v: '2024-01-16' }, 8: { v: 1200 }, 9: { v: 4.8 }
        },
        3: {
          0: { v: 'P003' }, 1: { v: '王五' }, 2: { v: 67 }, 3: { v: '男' }, 4: { v: '骨科' },
          5: { v: '骨折' }, 6: { v: '2024-01-17' }, 7: { v: '2024-02-05' }, 8: { v: 15600 }, 9: { v: 4.2 }
        },
        4: {
          0: { v: 'P004' }, 1: { v: '赵六' }, 2: { v: 28 }, 3: { v: '女' }, 4: { v: '内分泌科' },
          5: { v: '糖尿病' }, 6: { v: '2024-01-18' }, 7: { v: '2024-01-22' }, 8: { v: 3200 }, 9: { v: 4.6 }
        },
        5: {
          0: { v: 'P005' }, 1: { v: '孙七' }, 2: { v: 55 }, 3: { v: '男' }, 4: { v: '呼吸科' },
          5: { v: '肺炎' }, 6: { v: '2024-01-19' }, 7: { v: '2024-01-30' }, 8: { v: 6800 }, 9: { v: 4.3 }
        },
        6: {
          0: { v: 'P006' }, 1: { v: '周八' }, 2: { v: 42 }, 3: { v: '女' }, 4: { v: '神经内科' },
          5: { v: '偏头痛' }, 6: { v: '2024-01-20' }, 7: { v: '2024-01-21' }, 8: { v: 950 }, 9: { v: 4.7 }
        },
        7: {
          0: { v: 'P007' }, 1: { v: '吴九' }, 2: { v: 38 }, 3: { v: '男' }, 4: { v: '消化科' },
          5: { v: '胃炎' }, 6: { v: '2024-01-21' }, 7: { v: '2024-01-24' }, 8: { v: 2100 }, 9: { v: 4.4 }
        },
        8: {
          0: { v: 'P008' }, 1: { v: '郑十' }, 2: { v: 29 }, 3: { v: '女' }, 4: { v: '皮肤科' },
          5: { v: '湿疹' }, 6: { v: '2024-01-22' }, 7: { v: '2024-01-22' }, 8: { v: 380 }, 9: { v: 4.9 }
        }
      }
    },
    
    // 科室统计表
    departmentSheet: {
      id: 'departmentSheet',
      name: '科室统计',
      tabColor: '#70ad47',
      hidden: 0,
      rowCount: 30,
      columnCount: 10,
      zoomRatio: 1,
      scrollTop: 0,
      scrollLeft: 0,
      defaultColumnWidth: 120,
      defaultRowHeight: 25,
      mergeData: [],
      cellData: {
        0: {
          0: { v: '科室名称', s: { bl: 1, fc: { rgb: '#ffffff' }, bg: { rgb: '#70ad47' } } },
          1: { v: '患者数量', s: { bl: 1, fc: { rgb: '#ffffff' }, bg: { rgb: '#70ad47' } } },
          2: { v: '总收入', s: { bl: 1, fc: { rgb: '#ffffff' }, bg: { rgb: '#70ad47' } } },
          3: { v: '平均费用', s: { bl: 1, fc: { rgb: '#ffffff' }, bg: { rgb: '#70ad47' } } },
          4: { v: '满意度', s: { bl: 1, fc: { rgb: '#ffffff' }, bg: { rgb: '#70ad47' } } },
          5: { v: '医生数量', s: { bl: 1, fc: { rgb: '#ffffff' }, bg: { rgb: '#70ad47' } } }
        },
        1: {
          0: { v: '心内科' }, 1: { v: 45 }, 2: { v: 382500 }, 3: { v: 8500 }, 4: { v: 4.5 }, 5: { v: 8 }
        },
        2: {
          0: { v: '妇产科' }, 1: { v: 32 }, 2: { v: 38400 }, 3: { v: 1200 }, 4: { v: 4.8 }, 5: { v: 6 }
        },
        3: {
          0: { v: '骨科' }, 1: { v: 28 }, 2: { v: 436800 }, 3: { v: 15600 }, 4: { v: 4.2 }, 5: { v: 10 }
        },
        4: {
          0: { v: '内分泌科' }, 1: { v: 38 }, 2: { v: 121600 }, 3: { v: 3200 }, 4: { v: 4.6 }, 5: { v: 5 }
        },
        5: {
          0: { v: '呼吸科' }, 1: { v: 42 }, 2: { v: 285600 }, 3: { v: 6800 }, 4: { v: 4.3 }, 5: { v: 7 }
        },
        6: {
          0: { v: '神经内科' }, 1: { v: 35 }, 2: { v: 33250 }, 3: { v: 950 }, 4: { v: 4.7 }, 5: { v: 6 }
        },
        7: {
          0: { v: '消化科' }, 1: { v: 29 }, 2: { v: 60900 }, 3: { v: 2100 }, 4: { v: 4.4 }, 5: { v: 4 }
        },
        8: {
          0: { v: '皮肤科' }, 1: { v: 52 }, 2: { v: 19760 }, 3: { v: 380 }, 4: { v: 4.9 }, 5: { v: 3 }
        }
      }
    },
    
    // 数据分析表
    chartSheet: {
      id: 'chartSheet',
      name: '数据分析',
      tabColor: '#ffc000',
      hidden: 0,
      rowCount: 40,
      columnCount: 12,
      zoomRatio: 1,
      scrollTop: 0,
      scrollLeft: 0,
      defaultColumnWidth: 100,
      defaultRowHeight: 25,
      mergeData: [],
      cellData: {
        0: {
          0: { v: '月份', s: { bl: 1, fc: { rgb: '#ffffff' }, bg: { rgb: '#ffc000' } } },
          1: { v: '患者数量', s: { bl: 1, fc: { rgb: '#ffffff' }, bg: { rgb: '#ffc000' } } },
          2: { v: '收入(万元)', s: { bl: 1, fc: { rgb: '#ffffff' }, bg: { rgb: '#ffc000' } } },
          3: { v: '平均满意度', s: { bl: 1, fc: { rgb: '#ffffff' }, bg: { rgb: '#ffc000' } } }
        },
        1: { 0: { v: '1月' }, 1: { v: 301 }, 2: { v: 138.8 }, 3: { v: 4.5 } },
        2: { 0: { v: '2月' }, 1: { v: 287 }, 2: { v: 125.6 }, 3: { v: 4.6 } },
        3: { 0: { v: '3月' }, 1: { v: 324 }, 2: { v: 152.3 }, 3: { v: 4.4 } },
        4: { 0: { v: '4月' }, 1: { v: 298 }, 2: { v: 141.2 }, 3: { v: 4.7 } },
        5: { 0: { v: '5月' }, 1: { v: 312 }, 2: { v: 148.9 }, 3: { v: 4.5 } },
        6: { 0: { v: '6月' }, 1: { v: 335 }, 2: { v: 159.8 }, 3: { v: 4.8 } },
        // 空行用于图表插入位置
        8: {
          0: { v: '✨ 可在此区域插入图表' },
          1: { v: '点击插入 → 图表 → 选择图表类型' }
        }
      }
    }
  }
}

// 备用表格数据
const fallbackData = ref([
  { col0: '患者ID', col1: '姓名', col2: '年龄', col3: '性别', col4: '科室', col5: '诊断', col6: '入院日期', col7: '状态' },
  { col0: 'P001', col1: '张三', col2: '45', col3: '男', col4: '心内科', col5: '高血压', col6: '2024-01-15', col7: '住院' },
  { col0: 'P002', col1: '李四', col2: '32', col3: '女', col4: '妇产科', col5: '妊娠检查', col6: '2024-01-16', col7: '门诊' },
  { col0: 'P003', col1: '王五', col2: '67', col3: '男', col4: '骨科', col5: '骨折', col6: '2024-01-17', col7: '住院' },
  { col0: 'P004', col1: '赵六', col2: '28', col3: '女', col4: '内分泌科', col5: '糖尿病', col6: '2024-01-18', col7: '门诊' },
  { col0: 'P005', col1: '孙七', col2: '55', col3: '男', col4: '呼吸科', col5: '肺炎', col6: '2024-01-19', col7: '住院' },
  { col0: 'P006', col1: '周八', col2: '38', col3: '女', col4: '神经内科', col5: '偏头痛', col6: '2024-01-20', col7: '门诊' }
])

const fallbackColumns = computed(() => [
  { prop: 'col0', label: 'A (患者ID)' },
  { prop: 'col1', label: 'B (姓名)' },
  { prop: 'col2', label: 'C (年龄)' },
  { prop: 'col3', label: 'D (性别)' },
  { prop: 'col4', label: 'E (科室)' },
  { prop: 'col5', label: 'F (诊断)' },
  { prop: 'col6', label: 'G (入院日期)' },
  { prop: 'col7', label: 'H (状态)' }
])

// 初始化 Univer - 使用官网推荐的预设方式
const initUniver = async () => {
  try {
    console.log('🚀 开始初始化 Univer (使用官网预设方式)')

    if (!containerRef.value) {
      throw new Error('容器元素未准备好')
    }

    // 清除已有实例
    if (univerAPI) {
      console.log('🧹 清理已有Univer实例')
      try {
        univerAPI.dispose?.()
      } catch (err) {
        console.warn('⚠️ 清理实例时出错:', err)
      }
      univerAPI = null
    }

    console.log('📦 创建 Univer 实例 (集成高级功能)')
    
    // 使用完整的 Univer 预设配置：核心+绘图+高级功能
    const { univerAPI: api } = createUniver({
      locale: LocaleType.ZH_CN,
      locales: {
        [LocaleType.ZH_CN]: merge(
          {},
          sheetsCoreZhCN,
          UniverPresetSheetsDrawingZhCN,
          UniverPresetSheetsAdvancedZhCN,
        ),
      },
      theme: defaultTheme,
      presets: [
        UniverSheetsCorePreset({
          container: containerRef.value,
          header: true,  // 启用顶部工具栏和底部Sheet标签页
        }),

        UniverSheetsDrawingPreset(),
        UniverSheetsAdvancedPreset(),
      ]
    })

    univerAPI = api
    
    console.log('📊 创建医疗数据工作簿...')
    univerAPI.createWorkbook(WORKBOOK_DATA)
    
    // 🎉 初始化自定义菜单插件（独立管理）
    setTimeout(() => {
      try {
        const customMenuPlugin = createUniverSheetsCustomMenuPlugin({
          enableDataSourceCompute: true,
          enableRightClickMenu: true,
          enableToolbarMenu: false
        })
        console.log('✅ 自定义菜单插件初始化成功')
      } catch (pluginError) {
        console.warn('⚠️ 自定义插件初始化失败，但不影响主要功能:', pluginError)
      }
    }, 1000)
    
    console.log('✅ Univer 初始化成功！')
    loading.value = false
    error.value = ''
    
    // 发出就绪事件
    emit('ready')
    // ElMessage.success('🎉 Univer电子表格加载成功! 包含数据源计算功能')

  } catch (err: any) {
    console.error('❌ 初始化 Univer 失败:', err)
    error.value = `初始化失败: ${err.message}`
    loading.value = false
    
    ElMessage.error('❌ Univer加载失败，可以使用备用编辑器')
  }
}

// 重试初始化
const retryInit = () => {
  console.log('🔄 重试初始化Univer...')
  error.value = ''
  loading.value = true
  showFallback.value = false
  
  nextTick(() => {
    setTimeout(() => {
      initUniver()
    }, 100) // 减少延迟，提升响应速度
  })
}

// 使用备用编辑器
const useFallback = () => {
  console.log('📋 切换到备用编辑器')
  error.value = ''
  loading.value = false
  showFallback.value = true
  emit('ready')
  ElMessage.success('📋 已切换到备用表格编辑器')
}

// 处理单元格变化
const handleCellChange = (rowIndex: number, column: string, value: any) => {
  console.log('📝 单元格变化:', { rowIndex, column, value })
  emit('cellUpdate', { row: rowIndex, column, value })
  emit('change', fallbackData.value)
}

// 获取数据
const getData = () => {
  if (showFallback.value) {
    return {
      type: 'fallback',
      data: fallbackData.value
    }
  }
  
  if (!univerAPI) return null
  
  try {
    // 这里可以使用 univerAPI.getWorkbook() 获取数据
    console.log('📊 获取Univer数据')
    return { type: 'univer', data: null }
  } catch (err) {
    console.error('❌ 获取数据失败:', err)
  }
  return null
}

// 设置数据
const setData = (data: any) => {
  if (showFallback.value) {
    if (data && Array.isArray(data)) {
      fallbackData.value = data
      console.log('📋 设置备用编辑器数据')
    }
    return
  }
  
  if (!univerAPI || !data) return
  
  try {
    console.log('📊 设置Univer数据:', data)
    // 这里可以使用 univerAPI 的 API 设置数据
  } catch (err) {
    console.error('❌ 设置数据失败:', err)
  }
}

// 添加新的 Sheet
const addSheet = (sheetName?: string) => {
  if (!univerAPI) {
    console.warn('⚠️ Univer 实例未初始化')
    return false
  }
  
  try {
    const name = sheetName || `Sheet${Date.now().toString().slice(-4)}`
    
    // 使用 Univer API 创建新的工作表
    const workbook = univerAPI.getActiveWorkbook()
    if (workbook) {
      const newSheetId = `sheet_${Date.now()}`
      
      // 创建新的工作表配置
      const newSheetConfig = {
        id: newSheetId,
        name: name,
        tabColor: '#2ECC71',
        hidden: 0,
        rowCount: 100,
        columnCount: 20,
        zoomRatio: 1,
        scrollTop: 0,
        scrollLeft: 0,
        defaultColumnWidth: 100,
        defaultRowHeight: 25,
        mergeData: [],
        cellData: {
          0: {
            0: { v: '新工作表', s: { bl: 1, fc: { rgb: '#ffffff' }, bg: { rgb: '#2ECC71' } } },
            1: { v: '列B', s: { bl: 1, fc: { rgb: '#ffffff' }, bg: { rgb: '#2ECC71' } } },
            2: { v: '列C', s: { bl: 1, fc: { rgb: '#ffffff' }, bg: { rgb: '#2ECC71' } } }
          }
        }
      }
      
      // 添加新工作表到工作簿
      workbook.insertSheet(newSheetConfig)
      
      console.log(`✅ 新工作表 "${name}" 创建成功`)
      return true
    }
  } catch (err) {
    console.error('❌ 创建新工作表失败:', err)
    return false
  }
  
  return false
}

// 导出方法给父组件使用
defineExpose({
  getData,
  setData,
  addSheet,
  retry: retryInit,
  useFallback
})

// 组件挂载 - 按照指南的方式
onMounted(async () => {
  console.log('🎯 UniverSheet组件挂载')
  
  // 确保Vue完全渲染完成
  await nextTick()
  
  // 按照指南减少延迟，提升响应速度
  setTimeout(() => {
    console.log('⚡ 执行Univer初始化')
    initUniver()
  }, 100)
})

// 组件卸载
onUnmounted(() => {
  console.log('🗑️ UniverSheet组件卸载')
  
  // 清理自定义插件
  try {
    disposeUniverSheetsCustomMenuPlugin()
    console.log('✅ 自定义插件已清理')
  } catch (error) {
    console.warn('⚠️ 清理插件时出错:', error)
  }
  
  if (univerAPI) {
    try {
      univerAPI.dispose?.()
      univerAPI = null
      console.log('✅ Univer实例已清理')
    } catch (err) {
      console.error('❌ 销毁 Univer 实例失败:', err)
    }
  }
})
</script>

<style scoped>
.univer-sheet-container {
  width: 100%;
  height: 100%;
  position: relative;
  background: #fff;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  touch-action: none; /* 允许所有触摸手势 */
  user-select: none; /* 防止文本选择干扰 */
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.95);
  color: #606266;
  z-index: 1000;
  backdrop-filter: blur(4px);
}

.loading-spinner {
  margin-bottom: 16px;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #e4e7ed;
  border-top: 4px solid #409eff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 20px;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
}

.fallback-container {
  height: 100%;
  padding: 16px;
  display: flex;
  flex-direction: column;
  background: #fafbfc;
}

.fallback-header {
  flex-shrink: 0;
}

.fallback-table {
  flex: 1;
  overflow: hidden;
}

.univer-container {
  width: 100%;
  height: 100%;
  background-color: white;
  border-radius: 6px;
  touch-action: manipulation;
  overflow: hidden;
}

/* 备用表格样式优化 */
:deep(.el-table) {
  .el-input {
    .el-input__wrapper {
      border: none;
      box-shadow: none;
      background: transparent;
      transition: all 0.2s ease;
    }
    
    .el-input__wrapper:hover {
      background: rgba(64, 158, 255, 0.05);
    }
  }
  
  .el-table__cell {
    padding: 6px 8px;
    font-size: 13px;
  }
  
  .el-table__header th {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    font-weight: 600;
  }
  
  .el-table__row:hover > td {
    background-color: rgba(64, 158, 255, 0.05) !important;
  }
}

/* 解决 Univer 事件冲突的全局样式 */
:deep(.univer-container) {
  /* 确保所有Univer相关的元素都能正确处理事件 */
  * {
    touch-action: manipulation;
    user-select: none;
  }
  
  /* 允许在画布区域进行绘图操作 */
  canvas {
    touch-action: none;
    pointer-events: auto;
  }
  
  /* 确保工具栏和菜单可以正常交互 */
  .univer-toolbar,
  .univer-menu,
  .univer-context-menu {
    touch-action: manipulation;
    user-select: auto;
    pointer-events: auto;
  }
}
</style> 