<template>
  <div class="dashboard-designer">
    <div class="toolbar">
      <div class="toolbar-title">
        <el-icon class="toolbar-icon"><TrendCharts /></el-icon>
        仪表盘设计器
      </div>
      <div class="toolbar-actions">
        <el-button-group v-if="!isMobile">
          <el-button type="primary" @click="updateSelectedChart" :disabled="!selectedChart">更新当前图表</el-button>
          <el-button @click="showDataEditor = true">编辑数据</el-button>
          <el-button type="success" @click="showSaveDialog = true">保存仪表盘</el-button>
        </el-button-group>
        <!-- 移动端工具栏下拉菜单 -->
        <el-dropdown v-else trigger="click">
          <el-button type="primary">
            操作<el-icon class="el-icon--right"><ArrowDown /></el-icon>
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item @click="updateSelectedChart" :disabled="!selectedChart">更新当前图表</el-dropdown-item>
              <el-dropdown-item @click="showDataEditor = true">编辑数据</el-dropdown-item>
              <el-dropdown-item @click="showSaveDialog = true">保存仪表盘</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </div>
    
    <div class="main-content">
      <!-- 左侧图表类型面板 -->
      <div class="left-sidebar" :class="{ 'mobile-sidebar': isMobile }">
        <!-- 图表类型选择 -->
        <div class="panel-section">
          <h3 class="section-title">
            <el-icon><TrendCharts /></el-icon>
            图表类型
          </h3>
          <div class="chart-types">
            <div class="chart-type-item" 
                 v-for="type in chartTypes" 
                 :key="type.value"
                 draggable="true"
                 @dragstart="handleDragStart($event, type)">
              <el-icon>
                <component :is="type.icon" />
              </el-icon>
              <span v-if="!isMobile">{{ type.label }}</span>
            </div>
          </div>
        </div>
      </div>

            <!-- 中间画布区域 -->
      <div class="canvas-container" 
           :style="{ width: `calc(100% - ${leftSidebarWidth}px - ${rightPanelsWidth}px)` }"
           @dragover.prevent
           @drop="handleDrop">

        <!-- 快捷操作工具栏 -->
        <div class="canvas-toolbar" v-if="layout.length > 0">
          <el-button-group size="small">
            <el-button @click="selectAllCharts">
              <el-icon><Select /></el-icon>
              全选
            </el-button>
            <el-button @click="clearAllCharts" type="danger">
              <el-icon><Delete /></el-icon>
              清空
            </el-button>
            <el-button @click="autoLayout">
              <el-icon><Grid /></el-icon>
              自动布局
            </el-button>
            <el-button @click="exportDashboard">
              <el-icon><Download /></el-icon>
              导出
            </el-button>
          </el-button-group>
        </div>

        <grid-layout
          v-model:layout="layout"
          :col-num="12"
          :row-height="30"
          :is-draggable="true"
          :is-resizable="true"
          :vertical-compact="false"
          :use-css-transforms="true"
          :margin="[10, 10]"
          @update:layout="onLayoutUpdated"
          @contextmenu="handleCanvasContextMenu($event)"
        >
          <grid-item
            v-for="item in layout"
            :key="item.i"
            :x="item.x"
            :y="item.y"
            :w="item.w"
            :h="item.h"
            :i="item.i"
            @resize="onResize"
            @resized="onResized"
            @move="onMove"
            @moved="onMoved"
            @click="selectChart(item.i)"
            @contextmenu="handleChartContextMenu($event, item)"
            :drag-allow-from="'.chart-drag-handler'"
            :drag-ignore-from="'.chart-actions'"
            class="grid-chart-item"
            :class="{ 'selected': selectedChart?.i === item.i }"
          >
            <div class="chart-container" :id="`chart-${item.i}`">
              <div class="chart-drag-handler">
                <el-icon><Rank /></el-icon>
                <span class="chart-title">{{ item.chartConfig.title || '图表' }}</span>
                <div class="chart-actions">
                  <el-button size="small" type="text" @click.stop="duplicateChart(item)">
                    <el-icon><CopyDocument /></el-icon>
                  </el-button>
                  <el-button size="small" type="text" @click.stop="removeChart(item.i)">
                    <el-icon><Delete /></el-icon>
                  </el-button>
                </div>
              </div>
              <div 
                class="chart-content"
                @mousedown="handleChartContentMouseDown($event, item.i)"
                @mouseup="handleChartContentMouseUp"
                @mouseleave="handleChartContentMouseLeave"
                :class="{ 'drag-enabled': chartDragState.isDragging && chartDragState.dragChartId === item.i }"
                :title="chartDragState.isDragging && chartDragState.dragChartId === item.i ? '拖拽模式已激活，可以拖动图表' : '长按激活拖拽模式'"
              >
                <div v-if="chartDragState.isDragging && chartDragState.dragChartId === item.i" class="drag-hint">
                  <el-icon><Rank /></el-icon>
                  <span>拖拽模式已激活</span>
                </div>
              </div>
            </div>
          </grid-item>
        </grid-layout>
      </div>

      <!-- 垂直分隔条 -->
      <div class="vertical-resizer" 
           @mousedown="handleResizerMouseDown"
           :class="{ 'active': isResizing }">
        <div class="resizer-line"></div>
      </div>

      <!-- 右侧配置面板区域 -->
      <div class="right-panels" 
           :class="{ 'mobile-panels': isMobile }"
           :style="{ width: rightPanelsWidth + 'px' }">
        <div class="panels-container">
          <!-- 图表配置面板 -->
          <div class="config-panel" v-if="selectedChart">
            <div class="panel-header">
              <h3>图表配置</h3>
              <el-button v-if="isMobile" @click="toggleConfigPanel" type="text" size="small">
                <el-icon><Close /></el-icon>
              </el-button>
            </div>

            <!-- 配置标签页 -->
            <el-tabs v-model="activeConfigTab" class="config-tabs">
              <!-- 数据集配置标签页 -->
              <el-tab-pane label="数据源" name="dataset">
                <DatasetConfigPanel
                  :chart-type="selectedChart.type"
                  :initial-config="{
                    datasetId: selectedChart.datasetId,
                    fieldMapping: selectedChart.fieldMapping
                  }"
                  @config-change="handleDatasetConfigChange"
                />
                
                <!-- 字段展示区域 -->
                <div v-if="selectedDataset" class="fields-display-section">
                  <div class="section-header">
                    <el-icon><Grid /></el-icon>
                    <span>字段信息</span>
                    <span class="field-count">(共 {{ selectedDataset.fields?.length || 0 }} 个字段)</span>
                  </div>
                  
                  <!-- 维度字段 -->
                  <div class="field-group">
                    <div class="field-group-header">
                      <el-icon><Menu /></el-icon>
                      <span>维度字段</span>
                      <el-tag size="small" type="primary">{{ getDimensionFields().length }}</el-tag>
                    </div>
                    <div class="field-list">
                      <div 
                        v-for="field in getDimensionFields()" 
                        :key="field.fieldName"
                        class="field-item dimension-field"
                      >
                        <el-icon class="field-icon"><CircleFilled /></el-icon>
                        <span class="field-name">{{ field.displayName || field.fieldName }}</span>
                        <el-tag size="small" type="info">{{ field.fieldType }}</el-tag>
                      </div>
                      <div v-if="getDimensionFields().length === 0" class="empty-fields">
                        暂无维度字段
                      </div>
                    </div>
                  </div>
                  
                  <!-- 指标字段 -->
                  <div class="field-group">
                    <div class="field-group-header">
                      <el-icon><DataAnalysis /></el-icon>
                      <span>指标字段</span>
                      <el-tag size="small" type="success">{{ getMetricFields().length }}</el-tag>
                    </div>
                    <div class="field-list">
                      <div 
                        v-for="field in getMetricFields()" 
                        :key="field.fieldName || field.field"
                        class="field-item metric-field"
                      >
                        <el-icon class="field-icon"><TrendCharts /></el-icon>
                        <span class="field-name">{{ field.displayName || field.alias || field.fieldName || field.field }}</span>
                        <el-tag size="small" type="success">{{ field.aggregation || '指标' }}</el-tag>
                      </div>
                      <div v-if="getMetricFields().length === 0" class="empty-fields">
                        暂无指标字段
                      </div>
                    </div>
                  </div>
                </div>
              </el-tab-pane>

              <!-- 图表样式配置标签页 -->
              <el-tab-pane label="样式" name="style">
            <el-form label-width="80px" class="config-form" size="small">
              <el-form-item label="图表类型">
                <el-select v-model="selectedChart.type" @change="updateSelectedChart" size="small">
                  <el-option label="柱状图" value="bar" />
                  <el-option label="折线图" value="line" />
                  <el-option label="饼图" value="pie" />
                  <el-option label="表格" value="table" />
                </el-select>
              </el-form-item>

              <!-- 数据字段配置区域 -->
              <el-divider content-position="left">字段配置</el-divider>
              
              <!-- 字段配置 -->
              <template v-if="selectedChart.type === 'bar' || selectedChart.type === 'line'">
                <el-form-item label="X轴字段">
                  <div 
                    class="field-drop-zone"
                    @dragover.prevent
                    @drop="handleFieldDrop($event, 'x')"
                    @dragenter="handleDragEnter($event, 'dimension')"
                    @dragleave="handleDragLeave"
                    :class="{ 
                      'has-field': selectedChart.xField,
                      'drag-over': isDragOver && dragFieldType === 'dimension'
                    }"
                    data-field-type="x"
                  >
                    <div class="field-content" v-if="selectedChart.xField">
                      <el-icon><Grid /></el-icon>
                      <span class="field-name">{{ getFieldDisplayName(selectedChart.xField) }}</span>
                      <el-icon class="remove-field" @click.stop="removeField('x')"><Close /></el-icon>
                    </div>
                    <div class="drop-hint" v-else>
                      <el-icon><Grid /></el-icon>
                      <span class="hint-text">拖拽维度字段</span>
                      <div class="hint-animation">
                        <el-icon class="bounce-icon"><ArrowDownBold /></el-icon>
                      </div>
                    </div>
                  </div>
                </el-form-item>
                <el-form-item label="Y轴字段">
                  <div 
                    class="field-drop-zone"
                    @dragover.prevent
                    @drop="handleFieldDrop($event, 'y')"
                    @dragenter="handleDragEnter($event, 'metric')"
                    @dragleave="handleDragLeave"
                    :class="{ 
                      'has-field': selectedChart.yField,
                      'drag-over': isDragOver && dragFieldType === 'metric'
                    }"
                    data-field-type="y"
                  >
                    <div class="field-content" v-if="selectedChart.yField">
                      <el-icon><TrendCharts /></el-icon>
                      <span class="field-name">{{ getFieldDisplayName(selectedChart.yField) }}</span>
                      <el-icon class="remove-field" @click.stop="removeField('y')"><Close /></el-icon>
                    </div>
                    <div class="drop-hint" v-else>
                      <el-icon><TrendCharts /></el-icon>
                      <span class="hint-text">拖拽指标字段</span>
                      <div class="hint-animation">
                        <el-icon class="bounce-icon"><ArrowDownBold /></el-icon>
                      </div>
                    </div>
                  </div>
                </el-form-item>
              </template>

              <!-- 饼图字段配置 -->
              <template v-if="selectedChart.type === 'pie'">
                <el-form-item label="名称字段">
                  <div 
                    class="field-drop-zone"
                    @dragover.prevent
                    @drop="handleFieldDrop($event, 'name')"
                    @dragenter="handleDragEnter($event, 'dimension')"
                    @dragleave="handleDragLeave"
                    :class="{ 
                      'has-field': selectedChart.nameField,
                      'drag-over': isDragOver && dragFieldType === 'dimension'
                    }"
                    data-field-type="name"
                  >
                    <div class="field-content" v-if="selectedChart.nameField">
                      <el-icon><Grid /></el-icon>
                      <span class="field-name">{{ getFieldDisplayName(selectedChart.nameField) }}</span>
                      <el-icon class="remove-field" @click.stop="removeField('name')"><Close /></el-icon>
                    </div>
                    <div class="drop-hint" v-else>
                      <el-icon><Grid /></el-icon>
                      <span class="hint-text">拖拽维度字段</span>
                      <div class="hint-animation">
                        <el-icon class="bounce-icon"><ArrowDownBold /></el-icon>
                      </div>
                    </div>
                  </div>
                </el-form-item>
                <el-form-item label="数值字段">
                  <div 
                    class="field-drop-zone"
                    @dragover.prevent
                    @drop="handleFieldDrop($event, 'value')"
                    @dragenter="handleDragEnter($event, 'metric')"
                    @dragleave="handleDragLeave"
                    :class="{ 
                      'has-field': selectedChart.valueField,
                      'drag-over': isDragOver && dragFieldType === 'metric'
                    }"
                    data-field-type="value"
                  >
                    <div class="field-content" v-if="selectedChart.valueField">
                      <el-icon><TrendCharts /></el-icon>
                      <span class="field-name">{{ getFieldDisplayName(selectedChart.valueField) }}</span>
                      <el-icon class="remove-field" @click.stop="removeField('value')"><Close /></el-icon>
                    </div>
                    <div class="drop-hint" v-else>
                      <el-icon><TrendCharts /></el-icon>
                      <span class="hint-text">拖拽指标字段</span>
                      <div class="hint-animation">
                        <el-icon class="bounce-icon"><ArrowDownBold /></el-icon>
                      </div>
                    </div>
                  </div>
                </el-form-item>
              </template>

              <!-- 表格字段配置 -->
              <template v-if="selectedChart.type === 'table'">
                <el-form-item label="显示字段">
                  <div 
                    class="field-drop-zone table-fields"
                    @dragover.prevent
                    @drop="handleTableFieldDrop"
                    :class="{ 'has-field': selectedChart.tableFields?.length }"
                    data-field-type="table"
                  >
                    <div class="field-list" v-if="selectedChart.tableFields?.length">
                      <div v-for="field in selectedChart.tableFields" 
                           :key="field" 
                           class="field-tag">
                        <el-icon><Grid /></el-icon>
                        <span>{{ getFieldDisplayName(field) }}</span>
                        <el-icon class="remove-btn" @click="removeTableField(field)">
                          <Close />
                        </el-icon>
                      </div>
                    </div>
                    <div class="drop-hint" v-else>
                      <el-icon><Grid /></el-icon>
                      拖拽字段到此处
                    </div>
                  </div>
                </el-form-item>
              </template>

              <!-- 图表样式配置 -->
              <el-divider content-position="left">样式配置</el-divider>
              
              <el-form-item label="图表标题">
                <el-input 
                  v-model="selectedChart.title" 
                  @input="updateSelectedChart"
                  placeholder="请输入图表标题"
                  size="small"
                  class="chart-title-input"
                />
              </el-form-item>

              <el-form-item label="显示图例">
                <el-switch 
                  v-model="selectedChart.showLegend" 
                  @change="updateSelectedChart"
                  size="small"
                />
              </el-form-item>

              <el-form-item label="显示工具栏">
                <el-switch 
                  v-model="selectedChart.showToolbox" 
                  @change="updateSelectedChart"
                  size="small"
                />
              </el-form-item>

              <el-form-item label="数据限制">
                <el-input-number 
                  v-model="selectedChart.dataLimit" 
                  @change="updateSelectedChart"
                  :min="10"
                  :max="1000"
                  :step="10"
                  placeholder="数据条数"
                  size="small"
                  style="width: 100%"
                />
              </el-form-item>

                  <el-form-item>
                    <el-button type="danger" size="small" @click="removeSelectedChart">删除图表</el-button>
                  </el-form-item>
                </el-form>
              </el-tab-pane>
            </el-tabs>
          </div>
        </div>
      </div>
      
      <!-- 移动端配置面板按钮 -->
      <div v-if="isMobile && !configPanelVisible && selectedChart" class="mobile-config-button">
        <el-button type="primary" circle @click="toggleConfigPanel">
          <el-icon><Setting /></el-icon>
        </el-button>
      </div>
    </div>

    <!-- 数据编辑对话框 -->
    <el-dialog v-model="showDataEditor" title="编辑数据" width="60%">
      <el-table :data="chartData" border>
        <el-table-column v-for="field in selectedDataset?.fields" 
                        :key="field.fieldName" 
                        :prop="field.fieldName" 
                        :label="field.displayName || field.fieldName">
          <template #default="{ row }">
            <el-input v-model="row[field.fieldName]" />
          </template>
        </el-table-column>
      </el-table>
      <template #footer>
        <el-button @click="showDataEditor = false">取消</el-button>
        <el-button type="primary" @click="handleDataUpdate">确定</el-button>
      </template>
    </el-dialog>

    <!-- 数据集预览对话框 -->
    <el-dialog
      v-model="showDatasetPreview"
      title="数据集预览"
      width="80%"
      destroy-on-close
    >
      <div class="dataset-preview">
        <div class="preview-header">
          <div class="header-info">
            <h4>{{ selectedDataset?.name }}</h4>
            <el-tag type="info">{{ selectedDataset?.tableName || '自定义查询' }}</el-tag>
            <span v-if="previewDataList.length > 0" class="record-count">
              共 {{ previewDataList.length }} 条预览数据
            </span>
          </div>
          <div class="header-actions">
            <el-button size="small" @click="refreshPreviewData" :loading="previewLoading">
              <el-icon><Refresh /></el-icon>
              刷新
            </el-button>
          </div>
        </div>
        
        <el-table 
          :data="previewDataList" 
          border 
          style="width: 100%" 
          max-height="500"
          v-loading="previewLoading"
          stripe
        >
          <el-table-column
            v-for="column in previewColumns"
            :key="column"
            :prop="column"
            :label="getColumnDisplayName(column)"
            min-width="120"
            show-overflow-tooltip
          />
        </el-table>
        
        <div v-if="previewDataList.length === 0 && !previewLoading" class="empty-preview">
          <el-empty description="暂无预览数据" />
        </div>
      </div>
    </el-dialog>

    <!-- 保存仪表盘对话框 -->
    <el-dialog
      v-model="showSaveDialog"
      title="保存仪表盘"
      width="500px"
      destroy-on-close
    >
      <el-form :model="saveForm" label-width="100px">
        <el-form-item label="仪表盘名称" required>
          <el-input v-model="saveForm.name" placeholder="请输入仪表盘名称" />
        </el-form-item>
        <el-form-item label="仪表盘描述">
          <el-input
            v-model="saveForm.description"
            type="textarea"
            rows="3"
            placeholder="请输入仪表盘描述"
          />
        </el-form-item>
        <el-form-item label="菜单">
          <el-cascader
            v-model="saveForm.menuPath"
            :options="menuOptions"
            :props="{
              checkStrictly: true,
              label: 'label',
              value: 'value',
              emitPath: true
            }"
            placeholder="选择挂载的菜单位置"
            clearable
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showSaveDialog = false">取消</el-button>
        <el-button type="primary" @click="handleSave">保存</el-button>
      </template>
    </el-dialog>

    <!-- 发布对话框 -->
    <el-dialog
      v-model="publishDialogVisible"
      title="发布仪表盘"
      width="500px"
    >
      <div class="publish-form">
        <el-form ref="publishForm" :model="publishForm" label-width="100px">
          <el-form-item label="选择菜单">
            <el-cascader
              v-model="publishForm.menuPath"
              :options="menuOptions"
              :props="{
                checkStrictly: true,
                label: 'label',
                value: 'value',
                emitPath: true
              }"
              placeholder="选择挂载的菜单位置"
              clearable
            />
          </el-form-item>
          <el-form-item label="显示名称">
            <el-input v-model="publishForm.displayName" placeholder="菜单中显示的名称" />
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <el-button @click="publishDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handlePublish">确认发布</el-button>
      </template>
    </el-dialog>

    <!-- 右键菜单 -->
    <div 
      v-if="contextMenu.visible"
      class="context-menu"
      :style="{ left: contextMenu.x + 'px', top: contextMenu.y + 'px' }"
      @click.stop
    >
      <div class="context-menu-item" @click="handleContextMenuAction('edit')" v-if="contextMenu.chartItem">
        <el-icon><Setting /></el-icon>
        <span>编辑图表</span>
      </div>
      <div class="context-menu-item" @click="handleContextMenuAction('duplicate')" v-if="contextMenu.chartItem">
        <el-icon><CopyDocument /></el-icon>
        <span>复制图表</span>
      </div>
      <div class="context-menu-item" @click="handleContextMenuAction('moveToTop')" v-if="contextMenu.chartItem">
        <el-icon><ArrowUp /></el-icon>
        <span>置于顶层</span>
      </div>
      <div class="context-menu-item" @click="handleContextMenuAction('moveToBottom')" v-if="contextMenu.chartItem">
        <el-icon><ArrowDown /></el-icon>
        <span>置于底层</span>
      </div>
      <div class="context-menu-divider" v-if="contextMenu.chartItem"></div>
      <div class="context-menu-item" @click="handleContextMenuAction('delete')" v-if="contextMenu.chartItem">
        <el-icon><Delete /></el-icon>
        <span>删除图表</span>
      </div>
      
      <!-- 画布右键菜单 -->
      <div class="context-menu-item" @click="handleContextMenuAction('addBar')" v-if="!contextMenu.chartItem">
        <el-icon><TrendCharts /></el-icon>
        <span>添加柱状图</span>
      </div>
      <div class="context-menu-item" @click="handleContextMenuAction('addLine')" v-if="!contextMenu.chartItem">
        <el-icon><TrendCharts /></el-icon>
        <span>添加折线图</span>
      </div>
      <div class="context-menu-item" @click="handleContextMenuAction('addPie')" v-if="!contextMenu.chartItem">
        <el-icon><TrendCharts /></el-icon>
        <span>添加饼图</span>
      </div>
      <div class="context-menu-item" @click="handleContextMenuAction('addTable')" v-if="!contextMenu.chartItem">
        <el-icon><Grid /></el-icon>
        <span>添加表格</span>
      </div>
      <div class="context-menu-divider" v-if="!contextMenu.chartItem && layout.length > 0"></div>
      <div class="context-menu-item" @click="handleContextMenuAction('selectAll')" v-if="!contextMenu.chartItem && layout.length > 0">
        <el-icon><Select /></el-icon>
        <span>全选图表</span>
      </div>
      <div class="context-menu-item" @click="handleContextMenuAction('clearAll')" v-if="!contextMenu.chartItem && layout.length > 0">
        <el-icon><Delete /></el-icon>
        <span>清空画布</span>
      </div>
      <div class="context-menu-item" @click="handleContextMenuAction('autoLayout')" v-if="!contextMenu.chartItem && layout.length > 0">
        <el-icon><Grid /></el-icon>
        <span>自动布局</span>
      </div>
    </div>

    <!-- 右键菜单背景遮罩 -->
    <div 
      v-if="contextMenu.visible"
      class="context-menu-overlay"
      @click="hideContextMenu"
    ></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import * as echarts from 'echarts'
import { ElMessage, ElMessageBox, ElTable, ElTableColumn } from 'element-plus'
import { GridLayout, GridItem } from 'vue3-grid-layout-next'
import { Rank, TrendCharts, ArrowDown, ArrowUp, ArrowDownBold, Close, Setting, Grid, Refresh, Select, Delete, CopyDocument, Download, DataBoard, View, Search, InfoFilled, Plus, Collection } from '@element-plus/icons-vue'
import ChartDataSourceConfig from '@/components/chart/ChartDataSourceConfig.vue'
import DatasetSelector from '@/components/dataset/DatasetSelector.vue'
import DatasetConfigPanel from '@/components/dashboard/DatasetConfigPanel.vue'
import type { DataSet, DataSetField } from '@/types/dataManagement'
import type { MenuSelectOption, MenuItem } from '@/types/menu'
import { getMenuTree } from '@/api/menu'
import { createDashboard, updateDashboard, getDashboardDetail } from '@/api/dashboard'
import { DashboardStatus, DashboardType } from '@/types/dashboard'
import type { ChartFieldMapping } from '@/utils/chartDataTransform'
import { useDatasetStore } from '@/stores/dataset'
import type { DashboardForm, ChartConfig } from '@/types/dashboard'
import type { LayoutItem } from '@/types/dashboard'
import { defaultFieldMappings } from '@/mock/dashboardData'
import { dataSetApi } from '@/api/dataSource'
import { previewDatasetData } from '@/api/dataset'

// 预览数据类型
interface PreviewData {
  [key: string]: string | number | null
}

// 图表类型配置
const chartTypes = [
  { label: '柱状图', value: 'bar', icon: 'TrendCharts' },
  { label: '折线图', value: 'line', icon: 'TrendCharts' },
  { label: '饼图', value: 'pie', icon: 'TrendCharts' },
  { label: '表格', value: 'table', icon: 'Grid' }
]

// 状态管理
const layout = ref<LayoutItem[]>([])
const selectedChart = ref<ChartConfig | null>(null)
const showDataEditor = ref(false)
const showDatasetPreview = ref(false)
const showSaveDialog = ref(false)
const chartInstances = ref<Map<string, echarts.ECharts>>(new Map())

// 面板尺寸控制
const leftSidebarWidth = ref(260)
const rightPanelsWidth = ref(640)
const isResizing = ref(false)

// 新增：图表列表
const charts = computed(() => {
  return layout.value.map(item => item.chartConfig)
})

// 数据集相关
const datasetStore = useDatasetStore()
const datasets = ref<DataSet[]>([])
const datasetsLoading = ref(false)
const selectedDataset = ref<DataSet | null>(null)

// 图表数据
const chartData = ref<any[]>([])

// 数据预览相关
const previewLoading = ref(false)
const previewColumns = ref<string[]>([])

// 获取列显示名称
const getColumnDisplayName = (column: string) => {
  const field = selectedDataset.value?.fields?.find(f => f.fieldName === column)
  return field?.description || field?.displayName || column
}

// 处理预览数据格式
const processPreviewData = (response: any) => {
  let previewData = []
  
  if (response?.data?.columns && response?.data?.data) {
    // 处理二维数组格式：将 [["M", 10], ["F", 10]] 转换为 [{gender: "M", 患者ID: 10}, ...]
    const { columns, data } = response.data
    previewColumns.value = columns
    previewData = data.map((row: any[]) => {
      const obj: Record<string, any> = {}
      columns.forEach((column: string, index: number) => {
        obj[column] = row[index]
      })
      return obj
    })
  } else if (response?.data?.content && Array.isArray(response.data.content)) {
    previewData = response.data.content
    if (previewData.length > 0) {
      previewColumns.value = Object.keys(previewData[0])
    }
  } else if (response?.data && Array.isArray(response.data)) {
    previewData = response.data
    if (previewData.length > 0) {
      previewColumns.value = Object.keys(previewData[0])
    }
  }
  
  return previewData
}

// 字段搜索
const fieldSearchKeyword = ref('')

// 字段分类
const dimensionFields = computed(() => {
  if (!selectedDataset.value?.fields) return []
  
  const fields = selectedDataset.value.fields.filter(f => f.fieldType === 'dimension') || []
  if (!fieldSearchKeyword.value) return fields
  
  return fields.filter(field => 
    (field.description || field.displayName || field.fieldName)
      .toLowerCase()
      .includes(fieldSearchKeyword.value.toLowerCase())
  )
})

const metricFields = computed(() => {
  if (!selectedDataset.value?.fields) return []
  
  const fields = selectedDataset.value.fields.filter(f => f.fieldType === 'metric') || []
  if (!fieldSearchKeyword.value) return fields
  
  return fields.filter(field => 
    (field.description || field.displayName || field.fieldName)
      .toLowerCase()
      .includes(fieldSearchKeyword.value.toLowerCase())
  )
})

// 保存表单
const saveForm = ref({
  name: '',
  description: '',
  menuPath: [] as string[]
})

// 菜单选项
const menuOptions = ref<MenuSelectOption[]>([])

// 响应式设计相关
const windowWidth = ref(window.innerWidth)
const configPanelVisible = ref(true)

// 是否为移动设备
const isMobile = computed(() => {
  return windowWidth.value < 768
})

// 拖拽状态
const isDragOver = ref(false)
const dragFieldType = ref<'dimension' | 'metric' | null>(null)

// 配置面板状态
const activeConfigTab = ref('dataset')

// 右键菜单状态
const contextMenu = ref({
  visible: false,
  x: 0,
  y: 0,
  chartItem: null as LayoutItem | null
})

// 图表拖拽状态
const chartDragState = ref({
  isDragging: false,
  dragChartId: null as string | null,
  mouseDownTime: 0,
  dragThreshold: 150, // 长按阈值（毫秒）
  isManualDragging: false,
  dragStartPos: { x: 0, y: 0 },
  initialGridPos: { x: 0, y: 0 }
})

// 方法定义
const handleDragStart = (event: DragEvent, chart: any) => {
  if (event.dataTransfer) {
    event.dataTransfer.setData('chartType', JSON.stringify(chart))
  }
}

const handleFieldDragStart = (event: DragEvent, field: DataSetField) => {
  if (event.dataTransfer) {
    event.dataTransfer.setData('field', JSON.stringify(field))
  }
}

const handleFieldDrop = (e: DragEvent, targetType: 'x' | 'y' | 'name' | 'value') => {
  if (!e.dataTransfer || !selectedChart.value) return
  
  const fieldData = JSON.parse(e.dataTransfer.getData('field'))
  const field = fieldData as DataSetField
  
  // 重置拖拽状态
  isDragOver.value = false
  dragFieldType.value = null
  
  // 验证字段类型
  if ((targetType === 'x' || targetType === 'name') && field.fieldType !== 'dimension') {
    ElMessage.warning('X轴/名称字段必须是维度字段')
    return
  }
  
  if ((targetType === 'y' || targetType === 'value') && field.fieldType !== 'metric') {
    ElMessage.warning('Y轴/数值字段必须是指标字段')
    return
  }
  
  // 更新字段
  if (targetType === 'x') {
    selectedChart.value.xField = field.fieldName
  } else if (targetType === 'y') {
    selectedChart.value.yField = field.fieldName
  } else if (targetType === 'name') {
    selectedChart.value.nameField = field.fieldName
  } else if (targetType === 'value') {
    selectedChart.value.valueField = field.fieldName
  }
  
  updateSelectedChart()
}

const handleDrop = (e: DragEvent) => {
  if (!e.dataTransfer) return

  const chartTypeData = JSON.parse(e.dataTransfer.getData('chartType'))
  
  // 创建图表配置
  const chartConfig: ChartConfig = {
    i: `chart-${Date.now()}`,
    id: `chart-${Date.now()}`,
    type: chartTypeData.value,
    title: chartTypeData.label,
    showLegend: true,
    showToolbox: false,
    dataLimit: 100
  }
  
  // 应用智能推荐字段配置
  if (selectedDataset.value) {
    autoConfigureChartFields(chartConfig)
  }
  
  // 创建一个新的布局项
  const newItem: LayoutItem = {
    x: 0,
    y: 0,
    w: 6,
    h: 7,
    i: chartConfig.i,
    chartConfig: chartConfig
  }
  
  layout.value.push(newItem)
  selectedChart.value = chartConfig
  
  nextTick(() => {
    initChartInstance(newItem.i, chartConfig)
    ElMessage.success(`已添加新的${chartTypeData.label}图表，请配置字段`)
  })
}

// 初始化图表 - 新增支持数据集渲染
const initChartInstance = async (chartId: string, config: ChartConfig) => {
  const chartContainer = document.getElementById(`chart-${chartId}`)
  if (!chartContainer) return

  let chart = chartInstances.value.get(chartId)
  if (chart) {
    chart.dispose()
  }
  
  chart = echarts.init(chartContainer)
  chartInstances.value.set(chartId, chart)

  // 如果配置了数据集ID，使用数据集数据渲染
  if (config.datasetId && config.fieldMapping) {
    try {
      const { getChartData } = await import('@/services/dashboardDataService')
      const echartsOption = await getChartData(
        config.datasetId,
        config.type,
        config.fieldMapping,
        config
      )
      chart.setOption(echartsOption)
      return
    } catch (error) {
      console.error('获取数据集数据失败:', error)
      // 如果获取数据集数据失败，显示错误状态
      chart.setOption({
        title: {
          text: config.title || '图表',
          left: 'center',
          textStyle: { fontSize: 16, fontWeight: 'bold' }
        },
        graphic: {
          elements: [{
            type: 'text',
            left: 'center',
            top: 'middle',
            style: {
              text: `数据加载失败: ${error.message || '未知错误'}`,
              fontSize: 14,
              fill: '#f56c6c'
            }
          }]
        }
      })
      return
    }
  }

  // 否则使用原有的静态配置方式
  const option = getChartOption(config)
  chart.setOption(option)
}

const updateChart = (id: string, config: ChartConfig) => {
  // 如果是表格类型，重新初始化
  if (config.type === 'table') {
    initChartInstance(id, config)
    return
  }

  const chart = chartInstances.value.get(id)
  if (!chart) return

  // 如果没有数据，显示空状态
  if (chartData.value.length === 0) {
    const option = {
      title: {
        text: config.title || '图表',
        left: 'center',
        textStyle: {
          fontSize: 16,
          fontWeight: 'bold'
        }
      },
      graphic: {
        elements: [{
          type: 'text',
          left: 'center',
          top: 'middle',
          style: {
            text: '请选择数据集并配置字段',
            fontSize: 14,
            fill: '#999'
          }
        }]
      }
    }
    chart.setOption(option, true)
    return
  }

  let option: any = {
    title: {
      text: config.title || '图表',
      left: 'center',
      textStyle: {
        fontSize: 16,
        fontWeight: 'bold'
      }
    },
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c} ({d}%)'
    },
    legend: {
      show: config.showLegend !== false,
      bottom: 10
    },
    toolbox: {
      show: config.showToolbox === true,
      feature: {
        saveAsImage: {},
        dataView: { readOnly: false },
        magicType: { type: ['line', 'bar'] },
        restore: {}
      }
    }
  }
  
  // 获取实际数据
  const actualData = chartData.value.slice(0, config.dataLimit || 100)
  
  switch (config.type) {
    case 'bar':
      if (!config.xField || !config.yField) {
        option.graphic = {
          elements: [{
            type: 'text',
            left: 'center',
            top: 'middle',
            style: {
              text: '请配置X轴和Y轴字段',
              fontSize: 14,
              fill: '#999'
            }
          }]
        }
        break
      }
      
      option = {
        ...option,
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'shadow'
          }
        },
        xAxis: {
          type: 'category',
          data: actualData.map(item => item[config.xField!]),
          axisLabel: {
            rotate: actualData.length > 10 ? 45 : 0
          }
        },
        yAxis: { 
          type: 'value',
          name: selectedDataset.value?.fields.find(f => f.fieldName === config.yField)?.displayName || config.yField
        },
        series: [{
          name: config.title || '柱状图',
          type: 'bar',
          data: actualData.map(item => item[config.yField!]),
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: '#83bff6' },
              { offset: 0.5, color: '#188df0' },
              { offset: 1, color: '#188df0' }
            ])
          },
          emphasis: {
            itemStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: '#2378f7' },
                { offset: 0.7, color: '#2378f7' },
                { offset: 1, color: '#83bff6' }
              ])
            }
          }
        }]
      }
      break
    case 'line':
      if (!config.xField || !config.yField) {
        option.graphic = {
          elements: [{
            type: 'text',
            left: 'center',
            top: 'middle',
            style: {
              text: '请配置X轴和Y轴字段',
              fontSize: 14,
              fill: '#999'
            }
          }]
        }
        break
      }
      
      option = {
        ...option,
        tooltip: {
          trigger: 'axis'
        },
        xAxis: {
          type: 'category',
          data: actualData.map(item => item[config.xField!]),
          boundaryGap: false
        },
        yAxis: { 
          type: 'value',
          name: selectedDataset.value?.fields.find(f => f.fieldName === config.yField)?.displayName || config.yField
        },
        series: [{
          name: config.title || '折线图',
          type: 'line',
          data: actualData.map(item => item[config.yField!]),
          smooth: true,
          lineStyle: {
            color: '#5470c6',
            width: 3
          },
          itemStyle: {
            color: '#5470c6'
          },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(84, 112, 198, 0.3)' },
              { offset: 1, color: 'rgba(84, 112, 198, 0.1)' }
            ])
          }
        }]
      }
      break
    case 'pie':
      if (!config.nameField || !config.valueField) {
        option.graphic = {
          elements: [{
            type: 'text',
            left: 'center',
            top: 'middle',
            style: {
              text: '请配置名称和数值字段',
              fontSize: 14,
              fill: '#999'
            }
          }]
        }
        break
      }
      
      option = {
        ...option,
        tooltip: {
          trigger: 'item',
          formatter: '{a} <br/>{b}: {c} ({d}%)'
        },
        series: [{
          name: config.title || '饼图',
          type: 'pie',
          radius: ['40%', '70%'],
          center: ['50%', '50%'],
          data: actualData.map(item => ({
            name: item[config.nameField!],
            value: item[config.valueField!]
          })),
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: 'rgba(0, 0, 0, 0.5)'
            }
          },
          label: {
            show: true,
            formatter: '{b}: {d}%'
          }
        }]
      }
      break
  }
  
  chart.setOption(option, true)
}

const updateSelectedChart = () => {
  if (!selectedChart.value) return
  updateChart(selectedChart.value.i, selectedChart.value)
}

const selectChart = (id: string) => {
  const item = layout.value.find(item => item.i === id)
  if (item) {
    selectedChart.value = item.chartConfig
  }
}

const removeSelectedChart = () => {
  if (!selectedChart.value) return
  
  const id = selectedChart.value.i
  
  const chartInstance = chartInstances.value.get(id)
  if (chartInstance) {
    chartInstance.dispose()
    chartInstances.value.delete(id)
  }
  
  layout.value = layout.value.filter(item => item.i !== id)
  selectedChart.value = null
  
  ElMessage.success('图表已删除')
}

const handleDataUpdate = () => {
  showDataEditor.value = false
  if (selectedChart.value) {
    updateSelectedChart()
  }
}

// 加载数据集列表
const loadDatasets = async () => {
  try {
    datasetsLoading.value = true
    const response = await dataSetApi.getDatasets()
    datasets.value = response.data || []
    
    console.log('加载到的数据集:', datasets.value.length, '个')
    
    // 如果没有选中数据集且有数据集可用，选中第一个
    if (!selectedDataset.value && datasets.value.length > 0) {
      await handleDatasetChange(datasets.value[0])
    }
  } catch (error) {
    console.error('加载数据集失败:', error)
    ElMessage.error('加载数据集失败: ' + (error.message || '未知错误'))
  } finally {
    datasetsLoading.value = false
  }
}

// 数据源切换处理（保留用于兼容性）
const currentDataSource = ref('patientStats')
const handleDataSourceChange = (value: string) => {
  // 现在根据选中的数据集加载数据
  if (selectedDataset.value) {
    loadDatasetData()
  }
  updateSelectedChart()
}

// 获取当前数据源的字段
const currentFields = computed(() => {
  if (!chartData.value.length) return []
  return Object.keys(chartData.value[0])
})

// 预览数据
const previewDataList = ref<any[]>([])

// 布局更新事件
const onLayoutUpdated = (newLayout: LayoutItem[]) => {
  layout.value = newLayout
}

const onResize = (i: string | number, h: number, w: number, height: number, width: number) => {
  // 调整大小过程中的处理
}

const onResized = (i: string | number, h: number, w: number, height: number, width: number) => {
  const strId = i.toString()
  const chartInstance = chartInstances.value.get(strId)
  if (chartInstance) {
    nextTick(() => {
      chartInstance.resize()
      if (!selectedChart.value || selectedChart.value.i !== strId) {
        selectChart(strId)
      }
    })
  }
}

const onMove = (i: string | number, x: number, y: number) => {
  // 移动过程中的处理
}

const onMoved = (i: string | number, x: number, y: number) => {
  // 移动完成后的处理
}

const handleResize = () => {
  chartInstances.value.forEach(instance => {
    instance.resize()
  })
}

const handleWindowResize = () => {
  windowWidth.value = window.innerWidth
  if (windowWidth.value >= 768) {
    configPanelVisible.value = true
  }
}

const toggleConfigPanel = () => {
  configPanelVisible.value = !configPanelVisible.value
}

// 加载数据集数据
const loadDatasetData = async () => {
  if (!selectedDataset.value) return
  
  try {
    console.log('开始加载数据集数据:', selectedDataset.value.name)
    
    // 更新数据集字段信息
    const fields = await dataSetApi.getDatasetFields(selectedDataset.value)
    selectedDataset.value.fields = fields
    
    console.log('字段信息:', fields.length, '个字段')
    
    // 尝试加载数据预览
    try {
      const response = await previewDatasetData(selectedDataset.value.id)
      const previewData = processPreviewData(response)
      
      chartData.value = previewData
      previewDataList.value = previewData // 同时更新预览数据列表
      console.log('数据预览:', previewData.length, '行数据', previewData)
    } catch (dataError) {
      console.warn('数据预览失败，但字段信息已加载:', dataError.message)
      chartData.value = []
      previewDataList.value = []
    }
    
    ElMessage.success(`数据集 "${selectedDataset.value.name}" 加载成功`)
  } catch (error) {
    console.error('加载数据失败:', error)
    ElMessage.error('加载数据失败: ' + (error.message || '未知错误'))
  }
}

const refreshData = async () => {
  if (!selectedDataset.value) {
    ElMessage.warning('请先选择数据集')
    return
  }

  try {
    await loadDatasetData()
    
    // 重新渲染所有图表
    layout.value.forEach(item => {
      updateChart(item.i, item.chartConfig)
    })
    
    ElMessage.success('数据刷新成功')
  } catch (error) {
    console.error('刷新数据失败:', error)
    ElMessage.error('刷新数据失败')
  }
}

const showPreview = async () => {
  if (!selectedDataset.value) {
    ElMessage.warning('请先选择数据集')
    return
  }
  
  // 如果还没有预览数据，先加载
  if (previewDataList.value.length === 0) {
    try {
      const response = await previewDatasetData(selectedDataset.value.id)
      const previewData = processPreviewData(response)
      
      previewDataList.value = previewData
      console.log('预览数据加载成功:', previewData.length, '行数据')
    } catch (error) {
      console.error('加载预览数据失败:', error)
      ElMessage.error('加载预览数据失败: ' + (error.message || '未知错误'))
      return
    }
  }
  
  showDatasetPreview.value = true
}

// 刷新预览数据
const refreshPreviewData = async () => {
  if (!selectedDataset.value) {
    ElMessage.warning('请先选择数据集')
    return
  }
  
  try {
    previewLoading.value = true
    const response = await previewDatasetData(selectedDataset.value.id)
    const previewData = processPreviewData(response)
    
    previewDataList.value = previewData
    chartData.value = previewData
    console.log('预览数据刷新成功:', previewData.length, '行数据')
    ElMessage.success('预览数据已刷新')
  } catch (error) {
    console.error('刷新预览数据失败:', error)
    ElMessage.error('刷新预览数据失败: ' + (error.message || '未知错误'))
  } finally {
    previewLoading.value = false
  }
}

const selectAllCharts = () => {
  // 选择所有图表（这里可以实现多选逻辑）
  ElMessage.info('全选功能开发中')
}

const clearAllCharts = () => {
  ElMessageBox.confirm('确定要清空所有图表吗？', '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    // 清理所有图表实例
    chartInstances.value.forEach(instance => {
      instance.dispose()
    })
    chartInstances.value.clear()
    
    // 清空布局
    layout.value = []
    selectedChart.value = null
    
    ElMessage.success('已清空所有图表')
  }).catch(() => {
    // 用户取消
  })
}

const autoLayout = () => {
  if (layout.value.length === 0) {
    ElMessage.warning('没有图表需要布局')
    return
  }

  // 自动重新排列图表
  const cols = 12
  const itemWidth = 6
  const itemHeight = 7
  
  layout.value.forEach((item, index) => {
    const row = Math.floor(index / (cols / itemWidth))
    const col = (index % (cols / itemWidth)) * itemWidth
    
    item.x = col
    item.y = row * itemHeight
    item.w = itemWidth
    item.h = itemHeight
  })
  
  ElMessage.success('自动布局完成')
}

const exportDashboard = () => {
  if (layout.value.length === 0) {
    ElMessage.warning('没有图表可以导出')
    return
  }

  const exportData = {
    name: saveForm.value.name || '未命名仪表盘',
    description: saveForm.value.description || '',
    config: {
      layout: layout.value,
      charts: layout.value.map(item => ({
        id: item.i,
        type: item.chartConfig.type,
        xField: item.chartConfig.xField,
        yField: item.chartConfig.yField,
        nameField: item.chartConfig.nameField,
        valueField: item.chartConfig.valueField,
        title: item.chartConfig.title,
        showLegend: item.chartConfig.showLegend,
        showToolbox: item.chartConfig.showToolbox,
        dataLimit: item.chartConfig.dataLimit
      }))
    },
    exportTime: new Date().toISOString()
  }

  // 创建下载链接
  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `dashboard_${Date.now()}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
  
  ElMessage.success('仪表盘配置已导出')
}

const duplicateChart = (item: LayoutItem) => {
  const newChartConfig: ChartConfig = {
    ...item.chartConfig,
    i: `chart-${Date.now()}`
  }
  
  const newItem: LayoutItem = {
    x: item.x + 1,
    y: item.y + 1,
    w: item.w,
    h: item.h,
    i: newChartConfig.i,
    chartConfig: newChartConfig
  }
  
  layout.value.push(newItem)
  selectedChart.value = newChartConfig
  
  nextTick(() => {
    initChartInstance(newItem.i, newChartConfig)
    ElMessage.success('图表已复制')
  })
}

const removeChart = (chartId: string) => {
  const chartInstance = chartInstances.value.get(chartId)
  if (chartInstance) {
    chartInstance.dispose()
    chartInstances.value.delete(chartId)
  }
  
  layout.value = layout.value.filter(item => item.i !== chartId)
  
  if (selectedChart.value?.i === chartId) {
    selectedChart.value = null
  }
  
  ElMessage.success('图表已删除')
}

// 数据集变更处理
const handleDatasetChange = async (dataset: DataSet | null) => {
  // 此功能已迁移到 DatasetConfigPanel 组件
  console.log('数据集变更:', dataset)
}

// 新增：处理数据源配置变更
const handleDataSourceConfigChange = (config: any) => {
  if (selectedChart.value) {
    selectedChart.value.dataSourceConfig = config
    updateSelectedChart()
  }
}

// 新增：预览图表
const handlePreviewChart = (config: any) => {
  ElMessage.info('图表预览功能开发中')
  console.log('预览图表配置:', config)
}

// 新增：保存数据配置
const handleSaveDataConfig = (config: any) => {
  if (selectedChart.value) {
    selectedChart.value.dataSourceConfig = config
    updateSelectedChart()
    ElMessage.success('数据配置已保存')
  }
}

// 新增：处理数据集配置变更
const handleDatasetConfigChange = async (config: {
  datasetId: number
  fieldMapping: ChartFieldMapping
  isValid: boolean
}) => {
  if (!selectedChart.value) return
  
  // 更新图表配置
  selectedChart.value.datasetId = config.datasetId
  selectedChart.value.fieldMapping = config.fieldMapping
  
  // 如果配置有效，重新渲染图表
  if (config.isValid) {
    await initChartInstance(selectedChart.value.i, selectedChart.value)
    ElMessage.success('数据集配置已应用')
  }
}

// 获取所有字段
const allFields = computed(() => {
  return [...dimensionFields.value, ...metricFields.value]
})

// 处理表格字段拖拽
const handleTableFieldDrop = (e: DragEvent) => {
  if (!e.dataTransfer || !selectedChart.value) return
  
  const fieldData = JSON.parse(e.dataTransfer.getData('field'))
  const field = fieldData as DataSetField
  
  if (!selectedChart.value.tableFields) {
    selectedChart.value.tableFields = []
  }
  
  if (!selectedChart.value.tableFields.includes(field.fieldName)) {
    selectedChart.value.tableFields.push(field.fieldName)
    updateSelectedChart()
  }
}

// 处理拖拽进入
const handleDragEnter = (e: DragEvent, type: 'dimension' | 'metric') => {
  isDragOver.value = true
  dragFieldType.value = type
}

// 处理拖拽离开
const handleDragLeave = (e: DragEvent) => {
  const target = e.target as HTMLElement
  const relatedTarget = e.relatedTarget as HTMLElement
  
  // 确保不是子元素的拖拽事件
  if (target.contains(relatedTarget)) {
    return
  }
  
  isDragOver.value = false
  dragFieldType.value = null
}

// 获取字段显示名
const getFieldDisplayName = (fieldName: string) => {
  const field = selectedDataset.value?.fields.find(f => f.fieldName === fieldName)
  return field?.displayName || fieldName
}

// 智能推荐字段映射
const smartFieldMapping = computed(() => {
  if (!selectedDataset.value?.fields) return null
  
  const dimensions = dimensionFields.value
  const metrics = metricFields.value
  
  if (dimensions.length === 0 || metrics.length === 0) return null
  
  return {
    xField: dimensions[0]?.fieldName,
    yField: metrics[0]?.fieldName,
    nameField: dimensions[0]?.fieldName,
    valueField: metrics[0]?.fieldName
  }
})

// 自动配置图表字段的函数
const autoConfigureChartFields = (chartConfig: ChartConfig) => {
  if (!smartFieldMapping.value) return
  
  const mapping = smartFieldMapping.value
  
  // 根据图表类型配置字段
  switch (chartConfig.type) {
    case 'bar':
    case 'line':
      if (!chartConfig.xField && mapping.xField) {
        chartConfig.xField = mapping.xField
      }
      if (!chartConfig.yField && mapping.yField) {
        chartConfig.yField = mapping.yField
      }
      break
    case 'pie':
      if (!chartConfig.nameField && mapping.nameField) {
        chartConfig.nameField = mapping.nameField
      }
      if (!chartConfig.valueField && mapping.valueField) {
        chartConfig.valueField = mapping.valueField
      }
      break
    case 'table':
      if (!chartConfig.tableFields || chartConfig.tableFields.length === 0) {
        const allFields = [...dimensionFields.value, ...metricFields.value]
        chartConfig.tableFields = allFields.slice(0, 5).map(f => f.fieldName)
      }
      break
  }
}

// 移除字段
const removeField = (type: 'x' | 'y' | 'name' | 'value') => {
  if (!selectedChart.value) return
  
  if (type === 'x') {
    selectedChart.value.xField = undefined
  } else if (type === 'y') {
    selectedChart.value.yField = undefined
  } else if (type === 'name') {
    selectedChart.value.nameField = undefined
  } else if (type === 'value') {
    selectedChart.value.valueField = undefined
  }
  
  updateSelectedChart()
}

// 添加移除表格字段的方法
const removeTableField = (fieldName: string) => {
  if (!selectedChart.value || !selectedChart.value.tableFields) return
  
  selectedChart.value.tableFields = selectedChart.value.tableFields.filter(f => f !== fieldName)
  updateSelectedChart()
}

// 获取图表标题
const getChartTitle = (type: ChartConfig['type']) => {
  const titles = {
    bar: '柱状图',
    line: '折线图',
    pie: '饼图',
    table: '表格'
  }
  return titles[type] || '图表'
}

// 获取默认图表宽度
const getDefaultChartWidth = (type: ChartConfig['type']) => {
  const widths = {
    bar: 6,
    line: 6,
    pie: 6,
    table: 8
  }
  return widths[type] || 6
}

// 获取默认图表高度
const getDefaultChartHeight = (type: ChartConfig['type']) => {
  const heights = {
    bar: 7,
    line: 7,
    pie: 7,
    table: 8
  }
  return heights[type] || 7
}

// 获取查询类型标签
const getQueryTypeTag = (type: string) => {
  switch (type) {
    case 'single': return 'success'
    case 'multi': return 'warning'
    case 'sql': return 'danger'
    default: return 'info'
  }
}

const getQueryTypeLabel = (type: string) => {
  switch (type) {
    case 'single': return '单表查询'
    case 'multi': return '多表关联'
    case 'sql': return '自定义SQL'
    default: return type
  }
}

const getAggregationLabel = (agg: string) => {
  switch (agg) {
    case 'sum': return '求和'
    case 'count': return '计数'
    case 'avg': return '平均'
    case 'max': return '最大'
    case 'min': return '最小'
    default: return agg
  }
}

// 跳转到数据集管理
const goToDatasetManage = () => {
  router.push('/dataset-manage')
}

// 拖拽调整面板尺寸功能
const handleResizerMouseDown = (e: MouseEvent) => {
  isResizing.value = true
  const startX = e.clientX
  const startWidth = rightPanelsWidth.value
  
  const handleMouseMove = (moveEvent: MouseEvent) => {
    const deltaX = startX - moveEvent.clientX
    const newWidth = Math.max(320, Math.min(1000, startWidth + deltaX))
    rightPanelsWidth.value = newWidth
    
    // 触发图表重新渲染
    nextTick(() => {
      chartInstances.value.forEach(instance => {
        instance.resize()
      })
    })
  }
  
  const handleMouseUp = () => {
    isResizing.value = false
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', handleMouseUp)
    document.body.style.cursor = ''
    document.body.style.userSelect = ''
  }
  
  document.addEventListener('mousemove', handleMouseMove)
  document.addEventListener('mouseup', handleMouseUp)
  document.body.style.cursor = 'col-resize'
  document.body.style.userSelect = 'none'
}

// 路由和仪表盘ID
const route = useRoute()
const router = useRouter()
const currentDashboardId = ref<string | null>(null)

// 组件挂载
onMounted(async () => {
  const dashboardId = route.params.id
  
  if (dashboardId) {
    currentDashboardId.value = dashboardId as string
    await loadDashboard(dashboardId as string)
  }
  
  window.addEventListener('resize', handleWindowResize)
  window.addEventListener('resize', handleResize)
  
  // 添加键盘事件监听
  document.addEventListener('keydown', handleKeyDown)
  
  // 加载数据集列表
  await loadDatasets()
  
  await loadMenuTree()
})

// 组件卸载
onUnmounted(() => {
  chartInstances.value.forEach(instance => {
    instance.dispose()
  })
  chartInstances.value.clear()
  
  window.removeEventListener('resize', handleWindowResize)
  window.removeEventListener('resize', handleResize)
  document.removeEventListener('keydown', handleKeyDown)
  
  // 重置拖拽状态
  chartDragState.value.isDragging = false
  chartDragState.value.dragChartId = null
  document.body.style.cursor = ''
})

const dashboardName = ref('')
const publishDialogVisible = ref(false)

// 发布表单数据
const publishForm = ref({
  menuPath: [],
  displayName: ''
})

// 显示发布对话框
const showPublishDialog = () => {
  publishForm.value.displayName = dashboardName.value
  publishDialogVisible.value = true
}

// 保存仪表盘
const handleSave = async () => {
  try {
    if (!saveForm.value.name) {
      ElMessage.warning('请输入仪表盘名称')
      return
    }

    // 使用持久化工具构建仪表盘数据
    const { serializeLayout, getSaveSummary } = await import('@/utils/dashboardPersistence')
    const saveSummary = getSaveSummary(layout.value)
    
    const dashboardData: DashboardForm = {
      name: saveForm.value.name,
      description: saveForm.value.description,
      layout: serializeLayout(layout.value),
      status: DashboardStatus.DRAFT,
      type: DashboardType.CUSTOM,
      menuId: saveForm.value.menuPath[saveForm.value.menuPath.length - 1]
    }

    console.log('=== 保存仪表盘配置 ===')
    console.log('保存摘要:', saveSummary)
    console.log('布局数据:', layout.value)
    console.log('保存的数据结构:', dashboardData)

    // 判断是创建还是更新模式
    const isEditMode = !!currentDashboardId.value
    console.log('保存模式:', isEditMode ? '更新' : '创建')

    let result
    if (isEditMode) {
      // 编辑模式：调用更新API
      console.log('更新仪表盘 ID:', currentDashboardId.value)
      result = await updateDashboard(currentDashboardId.value!, dashboardData)
    } else {
      // 创建模式：调用创建API
      console.log('创建新仪表盘')
      result = await createDashboard(dashboardData)
    }
    
    if (result.code === 200 || result.code === 201) {
      ElMessage.success(isEditMode ? '更新成功' : '创建成功')
      showSaveDialog.value = false
      
      // 跳转到列表页
      router.push({
        path: '/dashboard/list',
        query: { skipAuthCheck: 'true' }
      })
      
      return isEditMode ? currentDashboardId.value : result.data?.id
    } else {
      throw new Error(result.message || '保存失败')
    }
  } catch (error: any) {
    console.error('保存失败:', error)
    ElMessage.error(error.message || '保存失败')
    return null
  }
}

// 恢复图表数据和配置
const restoreChartWithData = async (chartId: string, chartConfig: ChartConfig) => {
  try {
    console.log('恢复图表:', chartId, chartConfig)
    
    // 1. 初始化图表实例
    await initChartInstance(chartId, chartConfig)
    
    // 2. 如果有数据源配置，设置当前数据集
    if (chartConfig.datasetId) {
      console.log('恢复图表数据源:', chartConfig.datasetId)
      // 通过 datasetId 查找并设置选中的数据集
      const dataset = datasets.value.find(d => d.id === chartConfig.datasetId)
      if (dataset) {
        selectedDataset.value = dataset
      }
      
      // 如果选中了该图表，可以自动更新图表数据
      if (selectedChart.value?.i === chartId) {
        await updateSelectedChart()
      }
    }
    
    console.log('图表恢复完成:', chartId)
  } catch (error) {
    console.error('恢复图表失败:', chartId, error)
    ElMessage.warning(`图表 ${chartConfig.title || chartId} 恢复失败`)
  }
}

// 加载仪表盘数据
const loadDashboard = async (id: string) => {
  try {
    const response = await getDashboardDetail(id)
    const dashboardDetail = response.data
    
    console.log('=== 加载仪表盘数据 ===')
    console.log('仪表盘详情:', dashboardDetail)
    
    // 更新表单数据
    saveForm.value.name = dashboardDetail.name
    saveForm.value.description = dashboardDetail.description || ''
    
    // 使用持久化工具恢复布局
    if (dashboardDetail.layout) {
      const { deserializeLayout } = await import('@/utils/dashboardPersistence')
      layout.value = deserializeLayout(dashboardDetail.layout)
      console.log('恢复的布局数据:', layout.value)
    }
    
    // 初始化所有图表
    nextTick(() => {
      layout.value.forEach(item => {
        // 恢复图表实例并重新渲染数据
        restoreChartWithData(item.i, item.chartConfig)
      })
    })
    
    ElMessage.success('仪表盘加载成功')
  } catch (error) {
    console.error('加载仪表盘失败:', error)
    ElMessage.error('加载仪表盘失败: ' + (error.message || '未知错误'))
  }
}

// 发布仪表盘
const handlePublish = async () => {
  try {
    if (!publishForm.value.menuPath?.length) {
      ElMessage.warning('请选择发布位置')
      return
    }

    // 1. 先保存仪表盘
    const dashboardId = await handleSave()
    
    // 2. 创建菜单项
    const response = await fetch('http://localhost:4000/api/menus', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({
        parentId: publishForm.value.menuPath[publishForm.value.menuPath.length - 1],
        name: publishForm.value.displayName || saveForm.value.name,
        path: `/dashboard/view/${dashboardId}`,
        icon: 'Monitor',
        type: 'dashboard'
      })
    })

    const result = await response.json()
    if (result.code === 200) {
      ElMessage.success('发布成功')
      publishDialogVisible.value = false
      
      // 3. 刷新菜单
      window.dispatchEvent(new Event('menuUpdated'))
    } else {
      throw new Error(result.message)
    }
  } catch (error) {
    ElMessage.error('发布失败')
  }
}

// 加载菜单树
const loadMenuTree = async () => {
  try {
    const result = await getMenuTree()
    if (result.code === 200) {
      menuOptions.value = convertMenuToOptions(result.data)
    }
  } catch (error) {
    console.error('加载菜单树失败:', error)
    ElMessage.error('加载菜单树失败')
  }
}

// 将菜单树转换为级联选择器选项
const convertMenuToOptions = (menuItems: MenuItem[]): MenuSelectOption[] => {
  return menuItems.map(item => ({
    value: item.id,
    label: item.name,
    children: item.children ? convertMenuToOptions(item.children) : undefined
  }))
}

// 添加图表
const handleAddChart = (type: ChartConfig['type']) => {
  const chartId = `chart-${Date.now()}`
  const chartConfig: ChartConfig = {
    i: chartId,
    id: chartId,
    type,
    title: getChartTitle(type),
    showLegend: true,
    showToolbox: false,
    dataLimit: 100
  }

  layout.value.push({
    x: 0,
    y: 0,
    w: getDefaultChartWidth(type),
    h: getDefaultChartHeight(type),
    i: chartId,
    chartConfig
  })

  nextTick(() => {
    initChartInstance(chartId, chartConfig)
  })
}

// 获取图表配置
const getChartOption = (config: ChartConfig) => {
  // 根据图表类型返回不同的配置
  switch (config.type) {
    case 'bar':
      return {
        title: { text: config.title },
        tooltip: {},
        legend: { show: config.showLegend },
        xAxis: { type: 'category' },
        yAxis: { type: 'value' },
        series: [{
          type: 'bar',
          data: []
        }]
      }
    case 'line':
      return {
        title: { text: config.title },
        tooltip: {},
        legend: { show: config.showLegend },
        xAxis: { type: 'category' },
        yAxis: { type: 'value' },
        series: [{
          type: 'line',
          data: []
        }]
      }
    case 'pie':
      return {
        title: { text: config.title },
        tooltip: {},
        legend: { show: config.showLegend },
        series: [{
          type: 'pie',
          data: []
        }]
      }
    default:
      return {}
  }
}

// 右键菜单相关方法
const handleChartContextMenu = (event: MouseEvent, item: LayoutItem) => {
  event.preventDefault()
  event.stopPropagation()
  
  const { x, y } = getMenuPosition(event.clientX, event.clientY)
  
  contextMenu.value = {
    visible: true,
    x,
    y,
    chartItem: item
  }
  
  // 点击其他地方时隐藏菜单
  document.addEventListener('click', hideContextMenu, { once: true })
}

const handleCanvasContextMenu = (event: MouseEvent) => {
  // 检查是否点击在图表上
  const target = event.target as HTMLElement
  if (target.closest('.grid-chart-item')) {
    return // 如果点击在图表上，不显示画布菜单
  }
  
  event.preventDefault()
  event.stopPropagation()
  
  const { x, y } = getMenuPosition(event.clientX, event.clientY)
  
  contextMenu.value = {
    visible: true,
    x,
    y,
    chartItem: null
  }
  
  // 点击其他地方时隐藏菜单
  document.addEventListener('click', hideContextMenu, { once: true })
}

const getMenuPosition = (clientX: number, clientY: number) => {
  const menuWidth = 160
  const menuHeight = 300
  const windowWidth = window.innerWidth
  const windowHeight = window.innerHeight
  
  let x = clientX
  let y = clientY
  
  // 防止菜单超出屏幕右边界
  if (x + menuWidth > windowWidth) {
    x = windowWidth - menuWidth - 10
  }
  
  // 防止菜单超出屏幕下边界
  if (y + menuHeight > windowHeight) {
    y = windowHeight - menuHeight - 10
  }
  
  // 防止菜单超出屏幕左边界
  if (x < 0) {
    x = 10
  }
  
  // 防止菜单超出屏幕上边界
  if (y < 0) {
    y = 10
  }
  
  return { x, y }
}

const hideContextMenu = () => {
  contextMenu.value.visible = false
  contextMenu.value.chartItem = null
}

const handleContextMenuAction = (action: string) => {
  const { chartItem } = contextMenu.value
  
  switch (action) {
    case 'edit':
      if (chartItem) {
        selectChart(chartItem.i)
      }
      break
    case 'duplicate':
      if (chartItem) {
        duplicateChart(chartItem)
      }
      break
    case 'moveToTop':
      if (chartItem) {
        moveChartToTop(chartItem)
      }
      break
    case 'moveToBottom':
      if (chartItem) {
        moveChartToBottom(chartItem)
      }
      break
    case 'delete':
      if (chartItem) {
        removeChart(chartItem.i)
      }
      break
    case 'addBar':
      handleAddChart('bar')
      break
    case 'addLine':
      handleAddChart('line')
      break
    case 'addPie':
      handleAddChart('pie')
      break
    case 'addTable':
      handleAddChart('table')
      break
    case 'selectAll':
      selectAllCharts()
      break
    case 'clearAll':
      clearAllCharts()
      break
    case 'autoLayout':
      autoLayout()
      break
  }
  
  hideContextMenu()
}

const moveChartToTop = (item: LayoutItem) => {
  const index = layout.value.findIndex(l => l.i === item.i)
  if (index > -1) {
    const chartItem = layout.value.splice(index, 1)[0]
    layout.value.unshift(chartItem)
    ElMessage.success('图表已置于顶层')
  }
}

const moveChartToBottom = (item: LayoutItem) => {
  const index = layout.value.findIndex(l => l.i === item.i)
  if (index > -1) {
    const chartItem = layout.value.splice(index, 1)[0]
    layout.value.push(chartItem)
    ElMessage.success('图表已置于底层')
  }
}

// 键盘事件处理
const handleKeyDown = (event: KeyboardEvent) => {
  // ESC键隐藏右键菜单
  if (event.key === 'Escape' && contextMenu.value.visible) {
    hideContextMenu()
  }
  
  // Ctrl/Cmd + A 全选图表
  if ((event.ctrlKey || event.metaKey) && event.key === 'a' && layout.value.length > 0) {
    event.preventDefault()
    selectAllCharts()
  }
  
  // Delete键删除选中的图表
  if (event.key === 'Delete' && selectedChart.value) {
    event.preventDefault()
    removeChart(selectedChart.value.i)
  }
  
  // Ctrl/Cmd + D 复制选中的图表
  if ((event.ctrlKey || event.metaKey) && event.key === 'd' && selectedChart.value) {
    event.preventDefault()
    const item = layout.value.find(l => l.i === selectedChart.value!.i)
    if (item) {
      duplicateChart(item)
    }
  }
}

// 图表内容区域拖拽处理
const handleChartContentMouseDown = (event: MouseEvent, chartId: string) => {
  // 记录鼠标按下时间
  chartDragState.value.mouseDownTime = Date.now()
  chartDragState.value.dragChartId = chartId
  
  // 设置长按定时器
  const longPressTimer = setTimeout(() => {
    if (chartDragState.value.dragChartId === chartId) {
      enableChartDrag(chartId)
    }
  }, chartDragState.value.dragThreshold)
  
  // 鼠标释放时清除定时器
  const clearTimer = () => {
    clearTimeout(longPressTimer)
    document.removeEventListener('mouseup', clearTimer)
  }
  
  document.addEventListener('mouseup', clearTimer)
}

const handleChartContentMouseUp = () => {
  const pressDuration = Date.now() - chartDragState.value.mouseDownTime
  
  // 如果是短按（小于阈值），不启用拖拽模式
  if (pressDuration < chartDragState.value.dragThreshold) {
    chartDragState.value.dragChartId = null
    disableChartDrag()
  } else if (chartDragState.value.isDragging) {
    // 如果已经在拖拽模式，设置自动禁用定时器
    setTimeout(() => {
      disableChartDrag()
      ElMessage.success('拖拽模式已自动关闭')
    }, 3000) // 3秒后自动关闭拖拽模式
  }
}

const handleChartContentMouseLeave = () => {
  // 鼠标离开图表区域时重置状态
  if (!chartDragState.value.isDragging) {
    chartDragState.value.dragChartId = null
    disableChartDrag()
  }
}



const enableChartDrag = (chartId: string) => {
  console.log('启用拖拽模式:', chartId)
  chartDragState.value.isDragging = true
  
  // 添加视觉反馈
  const chartContainer = document.querySelector(`#chart-${chartId}`)
  if (chartContainer) {
    chartContainer.classList.add('drag-mode')
  }
  
  // 修改图表内容区域的样式，启用拖拽
  const chartContent = document.querySelector(`#chart-${chartId} .chart-content`)
  if (chartContent) {
    chartContent.classList.add('drag-enabled')
  }
  
  // 关键：动态修改grid-item的拖拽区域
  nextTick(() => {
    const gridItem = document.querySelector(`[data-grid-item-id="${chartId}"]`) as any
    if (gridItem && gridItem.__vueParentComponent) {
      // 临时修改vue3-grid-layout的dragAllowFrom属性
      const vueInstance = gridItem.__vueParentComponent.ctx
      if (vueInstance) {
        vueInstance.dragAllowFrom = '.chart-drag-handler, .chart-content'
        console.log('已更新拖拽配置:', vueInstance.dragAllowFrom)
      }
    }
    
    // 备用方案：直接在DOM元素上设置属性
    const chartContentElements = document.querySelectorAll(`#chart-${chartId} .chart-content, #chart-${chartId} .chart-content *`)
    chartContentElements.forEach(el => {
      (el as HTMLElement).setAttribute('data-grid-drag-handle', 'true')
    })
  })
  
  ElMessage({ message: '拖拽模式已激活！现在可以拖动蓝色区域', type: 'info', duration: 3000 })
}



const disableChartDrag = () => {
  if (chartDragState.value.dragChartId) {
    const chartId = chartDragState.value.dragChartId
    
    const chartContent = document.querySelector(`#chart-${chartId} .chart-content`)
    if (chartContent) {
      chartContent.classList.remove('drag-enabled')
      // 移除备用方案的拖拽属性
      const chartContentElements = document.querySelectorAll(`#chart-${chartId} .chart-content, #chart-${chartId} .chart-content *`)
      chartContentElements.forEach(el => {
        (el as HTMLElement).removeAttribute('data-grid-drag-handle')
      })
    }
    
    const chartContainer = document.querySelector(`#chart-${chartId}`)
    if (chartContainer) {
      chartContainer.classList.remove('drag-mode')
    }
  }
  
  chartDragState.value.isDragging = false
  chartDragState.value.dragChartId = null
}

// 获取维度字段
const getDimensionFields = () => {
  if (!selectedDataset.value) return []
  
  // 使用类型安全的方式访问属性
  const dataset = selectedDataset.value as any
  
  // 从effectiveDimensionFields获取
  if (dataset.effectiveDimensionFields?.length) {
    return dataset.fields?.filter((field: any) => 
      dataset.effectiveDimensionFields.includes(field.fieldName)
    ) || []
  }
  
  // 从autoDimensionFields获取
  if (dataset.autoDimensionFields?.length) {
    return dataset.fields?.filter((field: any) => 
      dataset.autoDimensionFields.includes(field.fieldName)
    ) || []
  }
  
  // 根据businessType或fieldType判断
  return dataset.fields?.filter((field: any) => 
    field.businessType === 'DIMENSION' || 
    field.fieldType === 'dimension' ||
    (field.allowGroupBy && field.fieldType !== 'metric')
  ) || []
}

// 获取指标字段
const getMetricFields = () => {
  if (!selectedDataset.value) return []
  
  // 从effectiveMetricFields获取
  if (selectedDataset.value.effectiveMetricFields?.length) {
    return selectedDataset.value.effectiveMetricFields
  }
  
  // 从autoMetricFields获取
  if (selectedDataset.value.autoMetricFields?.length) {
    return selectedDataset.value.autoMetricFields
  }
  
  // 从metricFields获取
  if (selectedDataset.value.metricFields?.length) {
    return selectedDataset.value.metricFields
  }
  
  // 根据businessType从fields中获取
  return selectedDataset.value.fields?.filter(field => 
    field.businessType === 'METRIC' || 
    field.fieldType === 'metric'
  ) || []
}
</script>

<style scoped lang="scss">
.dashboard-designer {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f5f7fa;
  overflow: hidden;
}

.toolbar {
  height: 60px;
  background: white;
  border-bottom: 1px solid #e4e7ed;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  z-index: 100;
  flex-shrink: 0;
}

.toolbar-title {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.toolbar-icon {
  font-size: 24px;
  color: #409eff;
}

.main-content {
  flex: 1;
  display: flex;
  min-height: 0;
  gap: 0;
}

.left-sidebar {
  width: 260px;
  background: white;
  border-right: 1px solid #e4e7ed;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  flex-shrink: 0;
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.04);
}

.panel-section {
  padding: 20px;
  border-bottom: 1px solid #f0f0f0;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 16px 0;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.chart-types {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.chart-type-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px 12px;
  border: 2px solid #e4e7ed;
  border-radius: 8px;
  cursor: grab;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  background: white;
  text-align: center;
  
  &:hover {
    border-color: #409eff;
    background: linear-gradient(135deg, #f0f9ff 0%, #e1f0ff 100%);
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(64, 158, 255, 0.15);
  }
  
  &:active {
    cursor: grabbing;
    transform: translateY(0);
  }
  
  .el-icon {
    font-size: 24px;
    color: #409eff;
  }
  
  span {
    font-size: 12px;
    font-weight: 500;
    color: #606266;
  }
}

.canvas-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: #fafbfc;
  position: relative;
  min-height: 0;
  overflow: hidden;
  
  // 改进网格背景
  background-image: 
    linear-gradient(rgba(64, 158, 255, 0.05) 1px, transparent 1px),
    linear-gradient(90deg, rgba(64, 158, 255, 0.05) 1px, transparent 1px);
  background-size: 20px 20px;
  background-position: 0 0;
}

.canvas-toolbar {
  padding: 12px 20px;
  background: white;
  border-bottom: 1px solid #e4e7ed;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.04);
  flex-shrink: 0;
}

.right-panels {
  background: white;
  border-left: 1px solid #e4e7ed;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  width: 380px;
  flex-shrink: 0;
  box-shadow: -2px 0 8px rgba(0, 0, 0, 0.04);
  transition: all 0.1s ease;
}

.panels-container {
  flex: 1;
  display: flex;
  flex-direction: row;
  overflow: hidden;
  width: 100%;
}

.config-panel {
  width: 100%;
  border-right: 1px solid #e4e7ed;
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
}

.data-panel {
  width: 320px;
  display: flex;
  flex-direction: column;
  min-height: 0;
  max-height: calc(100vh - 120px);
  overflow-y: auto;
  background: white;
  
  // 美化滚动条
  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 3px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: #c1c1c1;
    border-radius: 3px;
    transition: background 0.3s ease;
    
    &:hover {
      background: #a8a8a8;
    }
  }
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #e4e7ed;
  background: linear-gradient(135deg, #fafbfc 0%, #f5f7fa 100%);
  flex-shrink: 0;
}

.panel-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  display: flex;
  align-items: center;
  gap: 8px;
  
  &::before {
    content: '';
    width: 3px;
    height: 16px;
    background: #409eff;
    border-radius: 2px;
  }
}

.panel-actions {
  display: flex;
  gap: 8px;
}

.config-form {
  padding: 20px 16px;
  flex: 1;
  overflow-y: auto;
  
  :deep(.el-form-item) {
    margin-bottom: 20px;
    
    &:last-child {
      margin-bottom: 0;
    }
  }
  
  :deep(.el-form-item__label) {
    font-weight: 600;
    color: #303133;
    line-height: 1.4;
    font-size: 14px;
    margin-bottom: 8px;
  }
  
  :deep(.el-form-item__content) {
    .el-input,
    .el-select,
    .el-switch {
      width: 100%;
    }
    
    .el-input__inner {
      border-radius: 8px;
      border: 1px solid #e4e7ed;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      font-size: 14px;
      padding: 12px 16px;
      background: #fafafa;
      
      &:hover {
        border-color: #c0c4cc;
        background: #ffffff;
      }
      
      &:focus {
        border-color: #409eff;
        background: #ffffff;
        box-shadow: 0 0 0 3px rgba(64, 158, 255, 0.15);
      }
    }
    
    .el-select {
      .el-input__inner {
        cursor: pointer;
      }
      
      .el-select__wrapper {
        border-radius: 8px;
        border: 1px solid #e4e7ed;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        background: #fafafa;
        
        &:hover {
          border-color: #c0c4cc;
          background: #ffffff;
        }
        
        &.is-focused {
          border-color: #409eff;
          background: #ffffff;
          box-shadow: 0 0 0 3px rgba(64, 158, 255, 0.15);
        }
      }
    }
    
    .el-switch {
      .el-switch__core {
        border-radius: 12px;
      }
    }
    
    .el-button--danger {
      border-radius: 8px;
      padding: 10px 20px;
      font-weight: 600;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: 0 2px 4px rgba(245, 108, 108, 0.2);
      
      &:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(245, 108, 108, 0.3);
      }
    }
  }
  
  // 分组样式
  .form-group {
    background: linear-gradient(135deg, #fafbfc 0%, #f5f7fa 100%);
    border-radius: 12px;
    padding: 20px;
    margin-bottom: 24px;
    border: 1px solid #e4e7ed;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
    
    .group-title {
      font-size: 15px;
      font-weight: 700;
      color: #409eff;
      margin-bottom: 16px;
      padding-bottom: 8px;
      border-bottom: 2px solid #e1f3ff;
      display: flex;
      align-items: center;
      gap: 10px;
      
      .el-icon {
        font-size: 18px;
      }
    }
    
    .el-form-item {
      margin-bottom: 16px;
      
      &:last-child {
        margin-bottom: 0;
      }
    }
  }
}

.dataset-selector {
  padding: 16px;
  border-bottom: 1px solid #e4e7ed;
  background: #f8f9fa;
}

.field-sections {
  padding: 16px;
  border-bottom: 1px solid #e4e7ed;
  background: #f8f9fa;
  max-height: 400px;
  overflow-y: auto;
}

.field-section {
  margin-bottom: 16px;
  
  &:last-child {
    margin-bottom: 0;
  }
}

.section-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  background: #ebeef5;
  border-radius: 4px;
  margin-bottom: 8px;
  font-size: 14px;
  font-weight: 500;
  color: #606266;
}

.field-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.field-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: white;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  cursor: grab;
  transition: all 0.3s;
  
  &:hover {
    border-color: #409eff;
    background: linear-gradient(135deg, #ecf5ff 0%, #e1f3ff 100%);
    transform: translateX(4px) scale(1.02);
    box-shadow: 0 4px 12px rgba(64, 158, 255, 0.2);
  }
  
  &:active {
    cursor: grabbing;
    transform: translateX(4px) scale(0.98);
  }
  
  .el-icon {
    font-size: 16px;
    color: #409eff;
  }
  
  .field-name {
    flex: 1;
    font-size: 13px;
    color: #606266;
  }
  
  .field-info {
    font-size: 14px;
    color: #909399;
    cursor: help;
    
    &:hover {
      color: #409eff;
    }
  }
}

.field-drop-zone {
  position: relative;
  border: 2px dashed #d9d9d9;
  border-radius: 12px;
  padding: 20px 16px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  min-height: 72px;
  min-width: 140px;
  background: linear-gradient(135deg, #fafafa 0%, #f5f5f5 100%);
  cursor: pointer;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.04);
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    border-color: #409eff;
    background: linear-gradient(135deg, #ecf5ff 0%, #e1f3ff 100%);
    box-shadow: 0 4px 12px rgba(64, 158, 255, 0.15);
    transform: translateY(-1px);
  }
  
  &.has-field {
    border-color: #67c23a;
    background: linear-gradient(135deg, #f0f9eb 0%, #ebf7e3 100%);
    border-style: solid;
    box-shadow: 0 4px 12px rgba(103, 194, 58, 0.15);
  }
  
  &.drag-over {
    border-color: #409eff;
    background: linear-gradient(135deg, #ecf5ff 0%, #d6edff 100%);
    border-style: dashed;
    border-width: 3px;
    transform: scale(1.03);
    box-shadow: 0 8px 24px rgba(64, 158, 255, 0.25);
  }
  
  .field-content {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 12px;
    background: rgba(255, 255, 255, 0.8);
    border-radius: 8px;
    border: 1px solid rgba(255, 255, 255, 0.6);
    backdrop-filter: blur(10px);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
    
    .el-icon {
      font-size: 18px;
      color: #67c23a;
    }
    
    .field-name {
      flex: 1;
      font-size: 14px;
      color: #213547;
      font-weight: 600;
    }
    
    .remove-field {
      cursor: pointer;
      color: #909399;
      font-size: 16px;
      padding: 2px;
      border-radius: 4px;
      transition: all 0.2s;
      
      &:hover {
        color: #f56c6c;
        background: rgba(245, 108, 108, 0.1);
      }
    }
  }
  
  .drop-hint {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    color: #999999;
    font-size: 13px;
    pointer-events: none;
    font-weight: 500;
    opacity: 0.8;
    text-align: center;
    
    .hint-text {
      font-weight: 500;
      margin-bottom: 4px;
    }
    
    .hint-animation {
      display: flex;
      align-items: center;
      justify-content: center;
      
      .bounce-icon {
        font-size: 16px;
        color: #d3d4d6;
        animation: bounce 2s infinite;
      }
    }
  }
  
  &.drag-over {
    .drop-hint {
      .hint-text {
        color: #409eff;
        font-weight: 600;
      }
      
      .hint-animation .bounce-icon {
        color: #409eff;
        animation: bounce-fast 1s infinite;
      }
    }
  }
}

.grid-chart-item {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid #e4e7ed;
  
  &:hover {
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
    transform: translateY(-1px);
  }
  
  &.selected {
    border: 2px solid #409eff !important;
    box-shadow: 0 0 0 4px rgba(64, 158, 255, 0.2) !important;
    transform: translateY(-1px);
  }
}

.chart-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.chart-drag-handler {
  height: 36px;
  background: linear-gradient(135deg, #fafbfc 0%, #f5f7fa 100%);
  border-bottom: 1px solid #e4e7ed;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  cursor: move;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  
  &:hover {
    background: linear-gradient(135deg, #409eff 0%, #337ecc 100%);
    color: white;
  }
}

.chart-title {
  flex: 1;
  font-size: 13px;
  font-weight: 600;
  margin-left: 8px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.chart-actions {
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.chart-drag-handler:hover .chart-actions {
  opacity: 1;
}

.chart-actions .el-button {
  padding: 4px 6px;
  min-height: 24px;
  border: none;
  background: transparent;
  border-radius: 4px;
  
  &:hover {
    background: rgba(255, 255, 255, 0.2);
    color: white;
  }
}

.chart-content {
  flex: 1;
  min-height: 0;
  padding: 8px;
  transition: all 0.3s ease;
  user-select: none;
  
  &.drag-enabled {
    cursor: grab !important;
    background: #f0f8ff !important;
    border: 2px dashed #409eff;
    animation: dragPulse 2s infinite;
    position: relative;
    z-index: 999;
    
    // 确保所有子元素都可以拖拽
    *, canvas {
      pointer-events: none !important;
    }
    
    &:hover {
      background: #e6f3ff !important;
      border-color: #66b1ff;
      transform: scale(1.02);
    }
    
    &:active {
      cursor: grabbing !important;
      background: #cce7ff !important;
      transform: scale(0.98);
      animation: none;
    }
  }
}

/* 拖拽模式动画 */
@keyframes dragPulse {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(64, 158, 255, 0.4);
  }
  50% {
    box-shadow: 0 0 0 8px rgba(64, 158, 255, 0.1);
  }
}

/* 拖拽模式下的图表容器样式 */
.chart-container.drag-mode {
  border: 2px solid #409eff;
  box-shadow: 0 4px 16px rgba(64, 158, 255, 0.3);
  transform: scale(1.02);
  
  .chart-drag-handler {
    background: linear-gradient(135deg, #409eff 0%, #66b1ff 100%);
    color: white;
    
    .chart-title {
      color: white;
      font-weight: 600;
    }
    
    .chart-actions .el-button {
      color: white;
      
      &:hover {
        background: rgba(255, 255, 255, 0.2);
      }
    }
  }
}

/* 拖拽提示样式 */
.drag-hint {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: linear-gradient(135deg, #409eff 0%, #66b1ff 100%);
  color: white;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  box-shadow: 0 4px 16px rgba(64, 158, 255, 0.3);
  animation: dragHintBounce 1s ease-in-out infinite alternate;
  z-index: 999;
  cursor: grab;
  
  .el-icon {
    font-size: 18px;
    animation: dragHintRotate 2s linear infinite;
  }
  
  &:active {
    cursor: grabbing;
  }
}





@keyframes dragHintBounce {
  0% {
    transform: translate(-50%, -50%) scale(1);
  }
}

/* 字段拖拽动画 */
@keyframes bounce {
  0%, 20%, 50%, 80%, 100% {
    transform: translateY(0);
  }
  40% {
    transform: translateY(-8px);
  }
  60% {
    transform: translateY(-4px);
  }
}

@keyframes bounce-fast {
  0%, 20%, 50%, 80%, 100% {
    transform: translateY(0);
  }
  40% {
    transform: translateY(-6px);
  }
  60% {
    transform: translateY(-3px);
  }
}

@keyframes dragHintBounce {
  0% {
    transform: translate(-50%, -50%) scale(1);
  }
  100% {
    transform: translate(-50%, -50%) scale(1.05);
  }
}

@keyframes dragHintRotate {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

/* 移动端优化 */
.mobile-sidebar {
  width: 80px;
  
  .chart-types {
    grid-template-columns: 1fr;
  }
  
  .chart-type-item span {
    display: none;
  }
  
  .chart-type-item {
    padding: 12px 8px;
  }
}

.mobile-panels {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  z-index: 1000;
  width: 90%;
  max-width: 360px;
  box-shadow: -8px 0 32px rgba(0, 0, 0, 0.3);
  transform: translateX(100%);
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  
  &.show {
    transform: translateX(0);
  }
}

.mobile-config-button {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 100;
  border-radius: 50%;
  width: 56px;
  height: 56px;
  box-shadow: 0 4px 16px rgba(64, 158, 255, 0.3);
}

/* 响应式断点 */
@media (max-width: 1400px) {
  .right-panels {
    width: 580px;
  }
  
  .config-panel,
  .data-panel {
    width: 290px;
  }
}

@media (max-width: 1200px) {
  .right-panels {
    width: 540px;
  }
  
  .config-panel,
  .data-panel {
    width: 270px;
  }
}

@media (max-width: 992px) {
  .right-panels {
    width: 500px;
  }
  
  .config-panel,
  .data-panel {
    width: 250px;
  }
}

@media (max-width: 768px) {
  .panels-container {
    flex-direction: column;
  }
  
  .right-panels {
    width: 100%;
  }
  
  .config-panel,
  .data-panel {
    width: 100%;
  }
}

/* 滚动条优化 */
.field-items::-webkit-scrollbar,
.config-form::-webkit-scrollbar,
.field-sections::-webkit-scrollbar {
  width: 6px;
}

.field-items::-webkit-scrollbar-track,
.config-form::-webkit-scrollbar-track,
.field-sections::-webkit-scrollbar-track {
  background: #f5f7fa;
  border-radius: 3px;
}

.field-items::-webkit-scrollbar-thumb,
.config-form::-webkit-scrollbar-thumb,
.field-sections::-webkit-scrollbar-thumb {
  background: #c0c4cc;
  border-radius: 3px;
  
  &:hover {
    background: #909399;
  }
}

/* 动画优化 */
.grid-chart-item {
  animation: fadeInUp 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

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

/* 加载状态 */
.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

/* 数据提示区域 */
.no-data-hint,
.select-dataset-hint {
  padding: 40px 20px;
  text-align: center;
  background: #fafbfc;
  border-radius: 8px;
  margin: 20px;
}

.no-data-hint .el-button {
  margin-top: 16px;
}

.chart-table-container {
  height: 100%;
  overflow: auto;
  padding: 8px;
}

.data-source-selector {
  padding: 16px;
  border-bottom: 1px solid #e4e7ed;
  background: #f8f9fa;
  
  .el-radio-group {
    display: flex;
    gap: 8px;
    
    .el-radio-button {
      flex: 1;
      
      :deep(.el-radio-button__inner) {
        width: 100%;
      }
    }
  }
}

.preview-data {
  flex: 1;
  padding: 16px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  
  .el-table {
    flex: 1;
    overflow: hidden;
    
    :deep(.el-table__header) {
      background: #f8f9fa;
      
      th {
        background: #f8f9fa !important;
        font-weight: 600;
      }
    }
  }
}

/* 优化图表配置面板布局 */
.config-panel {
  .el-form {
    padding: 16px;
    
    .el-form-item {
      margin-bottom: 16px;
      
      &:last-child {
        margin-bottom: 0;
      }
    }
  }
  
  .field-drop-zone {
    min-height: 60px;
    padding: 12px;
    border: 2px dashed #e4e7ed;
    border-radius: 8px;
    margin-top: 8px;
    transition: all 0.3s;
    
    &:hover {
      border-color: #409eff;
      background: #f5f7fa;
    }
    
    &.has-field {
      border-style: solid;
      border-color: #67c23a;
      background: #f0f9eb;
    }
  }
}

/* 数据预览对话框样式 */
.dataset-preview {
  .preview-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
    padding-bottom: 12px;
    border-bottom: 1px solid #e4e7ed;
    
    .header-info {
      display: flex;
      align-items: center;
      gap: 12px;
      
      h4 {
        margin: 0;
        color: #303133;
        font-size: 16px;
        font-weight: 600;
      }
      
      .record-count {
        color: #909399;
        font-size: 14px;
      }
    }
  }
  
  .empty-preview {
    margin-top: 40px;
    text-align: center;
  }
}

/* 移动端适配 */
@media (max-width: 768px) {
  .main-content {
    flex-direction: column;
    
    .left-sidebar,
    .right-panels {
      width: 100%;
      max-width: none;
      border: none;
      border-bottom: 1px solid #e4e7ed;
    }
    
    .canvas-container {
      min-height: 400px;
    }
  }
  
  .data-source-selector {
    .el-radio-group {
      flex-direction: column;
    }
  }
}

.chart-table {
  height: 100%;
  padding: 8px;
  overflow: hidden;
  display: flex;
  flex-direction: column;

  :deep(.el-table) {
    flex: 1;
    overflow: hidden;

    .el-table__header {
      th {
        background-color: #f5f7fa;
        color: #606266;
        font-weight: 600;
      }
    }

    .el-table__body {
      td {
        padding: 8px;
      }
    }
  }

  .empty-hint {
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;

    :deep(.el-empty) {
      padding: 40px;
    }
  }
}

.field-drop-zone {
  &.table-fields {
    min-height: 120px;
    padding: 12px;
    background: #fafbfc;
    
    .field-list {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      padding: 8px;
      min-height: 40px;
      background: #fff;
      border-radius: 4px;
      
      .field-tag {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 6px 10px;
        background: #f0f9eb;
        border: 1px solid #67c23a;
        border-radius: 4px;
        font-size: 13px;
        transition: all 0.3s;
        
        &:hover {
          background: #f5f7fa;
          border-color: #409eff;
          transform: translateY(-1px);
          box-shadow: 0 2px 6px rgba(0,0,0,0.1);
        }
        
        .el-icon {
          font-size: 14px;
          color: #67c23a;
        }
        
        .remove-btn {
          cursor: pointer;
          color: #909399;
          font-size: 12px;
          padding: 2px;
          border-radius: 50%;
          transition: all 0.2s;
          
          &:hover {
            color: #f56c6c;
            background: rgba(245,108,108,0.1);
          }
        }
      }
    }
    
    .drop-hint {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      display: flex;
      align-items: center;
      gap: 8px;
      color: #909399;
      font-size: 14px;
      
      .el-icon {
        font-size: 18px;
        color: #409eff;
      }
    }
  }
}

/* 新的数据配置面板样式 */
.dataset-selector-section {
  margin: 4px 8px;
  flex-shrink: 0;
  max-height: 280px;
  display: flex;
  flex-direction: column;
  
  .section-header {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 12px;
    padding: 10px 12px;
    background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
    border-radius: 10px;
    border: 1px solid #f1f5f9;
    font-weight: 600;
    color: #1e293b;
    font-size: 14px;
    flex-shrink: 0;
    position: relative;
    
    &::before {
      content: '';
      position: absolute;
      left: 0;
      top: 0;
      bottom: 0;
      width: 3px;
      background: linear-gradient(135deg, #3b82f6, #8b5cf6);
      border-radius: 2px 0 0 2px;
    }
    
    .el-icon {
      color: #3b82f6;
      font-size: 16px;
      padding: 4px;
      background: rgba(59, 130, 246, 0.1);
      border-radius: 6px;
    }
    
    .help-icon {
      color: #64748b;
      cursor: help;
      font-size: 14px;
      margin-left: auto;
      transition: all 0.2s ease;
      
      &:hover {
        color: #3b82f6;
        transform: scale(1.05);
      }
    }
  }
  
  .dataset-selector-wrapper {
    flex: 1;
    min-height: 120px;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    
    // 消除内部组件的多余容器间距
    :deep(.dataset-selector) {
      flex: 1;
      margin: 0;
      padding: 0;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      background: #ffffff;
      display: flex;
      flex-direction: column;
    }
    
    // 优化整个选择器卡片
    :deep(.selector-card) {
      height: 100%;
      display: flex;
      flex-direction: column;
      border-radius: 6px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      
      .el-card__header {
        padding: 4px 8px;
        flex-shrink: 0;
        border-bottom: 1px solid #f0f0f0;
        background: #f8f9fa;
        
        .card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          
          .card-title {
            font-size: 12px;
            font-weight: 600;
            color: #333;
            flex-shrink: 0;
          }
          
          .card-actions {
            display: flex;
            gap: 4px;
            
            .el-button {
              padding: 2px 6px;
              font-size: 10px;
              min-height: 20px;
              border-radius: 4px;
            }
          }
        }
      }
      
      .el-card__body {
        flex: 1;
        padding: 0;
        display: flex;
        flex-direction: column;
        overflow: hidden;
      }
    }
    
    // 筛选区域放在卡片顶部独立区域
    :deep(.filter-section) {
      display: flex;
      gap: 6px;
      padding: 8px 10px;
      background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
      border-bottom: 1px solid #e2e8f0;
      flex-shrink: 0;
      border-radius: 8px 8px 0 0;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
      
      .el-row {
        width: 100%;
        margin: 0 !important;
        display: flex;
        align-items: center;
        gap: 6px;
        
        .el-col {
          padding: 0 !important;
          flex: 1;
        }
      }
      
      .el-input,
      .el-select {
        width: 100%;
        
        .el-input__wrapper,
        .el-select__wrapper {
          font-size: 11px;
          padding: 4px 8px;
          min-height: 28px;
          border-radius: 6px;
          border: 1px solid #d1d5db;
          background: #ffffff;
          transition: all 0.2s ease;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
          
          &:hover {
            border-color: #9ca3af;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          }
          
          &:focus-within {
            border-color: #3b82f6;
            box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
          }
        }
        
        .el-input__inner {
          font-size: 11px;
          color: #374151;
          
          &::placeholder {
            color: #9ca3af;
            font-size: 11px;
          }
        }
        
        .el-select__placeholder {
          color: #9ca3af;
          font-size: 11px;
        }
        
        .el-select__selected-item {
          font-size: 11px;
          color: #374151;
        }
        
        .el-select__caret {
          color: #6b7280;
          font-size: 12px;
        }
      }
      
      .el-button-group {
        display: flex;
        border-radius: 6px;
        overflow: hidden;
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
        
        .el-button {
          font-size: 11px;
          padding: 6px 12px;
          min-height: 28px;
          border-radius: 0;
          font-weight: 500;
          transition: all 0.2s ease;
          
          &:first-child {
            border-radius: 6px 0 0 6px;
          }
          
          &:last-child {
            border-radius: 0 6px 6px 0;
          }
          
          &.el-button--primary {
            background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
            border-color: #3b82f6;
            color: #ffffff;
            
            &:hover {
              background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
              transform: translateY(-1px);
              box-shadow: 0 2px 4px rgba(59, 130, 246, 0.2);
            }
          }
          
          &:not(.el-button--primary) {
            background: #ffffff;
            color: #6b7280;
            border-color: #d1d5db;
            
            &:hover {
              background: #f9fafb;
              color: #374151;
              border-color: #9ca3af;
              transform: translateY(-1px);
              box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            }
          }
        }
      }
    }
    
    // 浮动弹性布局数据集
    :deep(.dataset-list) {
      flex: 1;
      overflow-y: auto;
      padding: 6px;
      margin: 0;
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      align-content: flex-start;
      
      .dataset-item {
        flex: 0 0 auto;
        width: 180px;
        padding: 10px;
        border-radius: 8px;
        border: 1px solid #e5e7eb;
        background: #ffffff;
        transition: all 0.2s ease;
        display: flex;
        flex-direction: column;
        position: relative;
        
        &:hover {
          border-color: #3b82f6;
          background: #f0f9ff;
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(59,130,246,0.15);
        }
        
        &.selected {
          border-color: #3b82f6;
          background: #eff6ff;
          box-shadow: 0 0 0 2px rgba(59,130,246,0.2);
        }
        
        .dataset-header {
          margin-bottom: 8px;
          
          .dataset-name {
            font-size: 13px;
            font-weight: 600;
            color: #1f2937;
            line-height: 1.4;
            margin-bottom: 4px;
          }
          
          .dataset-actions {
            position: absolute;
            top: 4px;
            right: 4px;
            display: flex;
            gap: 2px;
            opacity: 0;
            transition: opacity 0.2s;
            
            .el-button {
              padding: 2px 4px;
              min-height: 18px;
              font-size: 10px;
              border-radius: 3px;
            }
          }
        }
        
        &:hover .dataset-actions {
          opacity: 1;
        }
        
        .dataset-info {
          display: flex;
          flex-direction: column;
          gap: 6px;
          
          .dataset-meta {
            display: flex;
            flex-wrap: wrap;
            gap: 4px;
            margin-bottom: 6px;
            
            .el-tag {
              padding: 2px 6px;
              font-size: 9px;
              height: 18px;
              line-height: 14px;
              border-radius: 4px;
              font-weight: 500;
            }
            
            .dataset-time {
              font-size: 10px;
              color: #94a3b8;
              background: rgba(148, 163, 184, 0.1);
              padding: 2px 6px;
              border-radius: 4px;
              font-weight: 500;
            }
          }
          
          .dataset-description {
            font-size: 11px;
            line-height: 1.3;
            color: #6b7280;
            margin-top: 4px;
          }
        }
      }
    }
  }
}

.field-drag-section {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  min-height: 300px;
  margin-top: 8px;
  
  .section-header {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 16px;
    font-weight: 700;
    color: #1e293b;
    font-size: 15px;
    background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
    flex-shrink: 0;
    border-bottom: 2px solid #f1f5f9;
    border-radius: 12px 12px 0 0;
    position: relative;
    
    &::before {
      content: '';
      position: absolute;
      left: 0;
      top: 0;
      bottom: 0;
      width: 4px;
      background: linear-gradient(135deg, #3b82f6, #8b5cf6);
      border-radius: 2px 0 0 2px;
    }
    
    .el-icon {
      color: #3b82f6;
      font-size: 18px;
      padding: 4px;
      background: rgba(59, 130, 246, 0.1);
      border-radius: 6px;
    }
    
    .help-icon {
      color: #64748b;
      cursor: help;
      font-size: 16px;
      margin-left: auto;
      transition: all 0.2s ease;
      
      &:hover {
        color: #3b82f6;
        transform: scale(1.1);
      }
    }
  }
  
  .field-search {
    padding: 12px 16px;
    background: #ffffff;
    flex-shrink: 0;
    border-bottom: 1px solid #f1f5f9;
  }
  
  .field-sections-container {
    flex: 1;
    overflow-y: auto;
    padding: 12px;
    display: flex;
    flex-direction: column;
    gap: 16px;
    min-height: 0;
    
    &::-webkit-scrollbar {
      width: 8px;
    }
    
    &::-webkit-scrollbar-track {
      background: #f1f5f9;
      border-radius: 4px;
      margin: 4px;
    }
    
    &::-webkit-scrollbar-thumb {
      background: linear-gradient(135deg, #cbd5e1, #94a3b8);
      border-radius: 4px;
      
      &:hover {
        background: linear-gradient(135deg, #94a3b8, #64748b);
      }
    }
  }
}

.field-section {
  margin-bottom: 12px;
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 150px;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  background: linear-gradient(135deg, #ffffff 0%, #fafbfc 100%);
  overflow: hidden;
  
  .field-section-title {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 16px;
    background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
    font-weight: 600;
    color: #475569;
    font-size: 14px;
    flex-shrink: 0;
    position: relative;
    
    &::before {
      content: '';
      position: absolute;
      left: 0;
      top: 0;
      bottom: 0;
      width: 3px;
      border-radius: 2px 0 0 2px;
    }
    
    .dimension-icon {
      color: #3b82f6;
      font-size: 16px;
      padding: 4px;
      background: rgba(59, 130, 246, 0.1);
      border-radius: 6px;
    }
    
    .metric-icon {
      color: #10b981;
      font-size: 16px;
      padding: 4px;
      background: rgba(16, 185, 129, 0.1);
      border-radius: 6px;
    }
    
    .el-tag {
      margin-left: auto;
      font-weight: 600;
      font-size: 11px;
    }
  }
  
  &:has(.dimension-icon) .field-section-title::before {
    background: linear-gradient(135deg, #3b82f6, #1d4ed8);
  }
  
  &:has(.metric-icon) .field-section-title::before {
    background: linear-gradient(135deg, #10b981, #059669);
  }
  
  .field-list {
    flex: 1;
    overflow-y: auto;
    padding: 8px;
    background: transparent;
    min-height: 100px;
    
    &::-webkit-scrollbar {
      width: 6px;
    }
    
    &::-webkit-scrollbar-track {
      background: #f1f5f9;
      border-radius: 3px;
      margin: 4px;
    }
    
    &::-webkit-scrollbar-thumb {
      background: linear-gradient(135deg, #cbd5e1, #94a3b8);
      border-radius: 3px;
      
      &:hover {
        background: linear-gradient(135deg, #94a3b8, #64748b);
      }
    }
  }
}

.field-item {
  margin-bottom: 6px;
  cursor: grab;
  border-radius: 6px;
  transition: all 0.2s ease;
  
  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }
  
  &:active {
    cursor: grabbing;
  }
  
  &.dimension-field {
    border: 1px solid #b3d8ff;
    background: linear-gradient(135deg, #ecf5ff 0%, #f0f9ff 100%);
    
    &:hover {
      border-color: #409eff;
      background: linear-gradient(135deg, #e1f3ff 0%, #ecf5ff 100%);
    }
  }
  
  &.metric-field {
    border: 1px solid #c2e7b0;
    background: linear-gradient(135deg, #f0f9ff 0%, #e8f5e8 100%);
    
    &:hover {
      border-color: #67c23a;
      background: linear-gradient(135deg, #e8f5e8 0%, #f0f9ff 100%);
    }
  }
  
  .field-content {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 10px;
    
    .field-icon {
      font-size: 16px;
      flex-shrink: 0;
    }
    
    .field-info {
      flex: 1;
      overflow: hidden;
      
      .field-name {
        font-size: 13px;
        font-weight: 500;
        color: #303133;
        margin-bottom: 2px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      
      .field-meta {
        font-size: 11px;
        color: #909399;
        display: flex;
        align-items: center;
        gap: 4px;
        font-family: 'Monaco', 'Consolas', monospace;
      }
    }
    
    .field-help {
      color: #909399;
      font-size: 12px;
      cursor: help;
      flex-shrink: 0;
    }
  }
}



.no-dataset-hint {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32px 16px;
}

.data-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: linear-gradient(180deg, #ffffff 0%, #fafbfc 100%);
  height: 100vh;
  overflow: hidden;
  position: relative;
  max-height: calc(100vh - 120px);
  
  &::-webkit-scrollbar {
    width: 8px;
  }
  
  &::-webkit-scrollbar-track {
    background: linear-gradient(180deg, #f1f5f9 0%, #e2e8f0 100%);
    border-radius: 4px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: linear-gradient(180deg, #94a3b8 0%, #64748b 100%);
    border-radius: 4px;
    transition: all 0.3s ease;
    
    &:hover {
      background: linear-gradient(180deg, #64748b 0%, #475569 100%);
    }
  }
  
  .panel-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 20px;
    border-bottom: 2px solid #f1f5f9;
    background: 
      linear-gradient(135deg, #ffffff 0%, #f8fafc 50%, #f1f5f9 100%);
    box-shadow: 
      0 4px 12px rgba(0, 0, 0, 0.05),
      inset 0 1px 2px rgba(255, 255, 255, 0.8);
    position: sticky;
    top: 0;
    z-index: 10;
    backdrop-filter: blur(10px);
    
    .header-content {
      display: flex;
      align-items: center;
      gap: 12px;
      
      .panel-icon {
        color: #3b82f6;
        font-size: 22px;
        padding: 8px;
        background: rgba(59, 130, 246, 0.1);
        border-radius: 10px;
        transition: all 0.3s ease;
        
        &:hover {
          background: rgba(59, 130, 246, 0.2);
          transform: scale(1.1);
        }
      }
      
      h3 {
        margin: 0;
        font-size: 18px;
        font-weight: 700;
        color: #1e293b;
        letter-spacing: -0.01em;
      }
    }
    
    .panel-actions {
      display: flex;
      gap: 8px;
      
      .el-button {
        border-radius: 8px;
        border: 1px solid transparent;
        padding: 8px 12px;
        font-weight: 500;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        
        &:hover {
          background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
          border-color: #3b82f6;
          color: #1e40af;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.2);
        }
        
        .el-icon {
          font-size: 16px;
        }
      }
    }
  }
}

.dataset-info-section {
  padding: 6px;
  background: transparent;
  flex-shrink: 0;
  position: relative;
  z-index: 15;
  margin-bottom: 12px;
}

.selected-info-card {
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  padding: 6px 8px;
  background: #ffffff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  position: relative;
  transition: all 0.2s ease;
  
  &:hover {
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
    border-color: #cbd5e1;
  }
}

.no-dataset-hint {
  text-align: center;
  padding: 20px;
  border: 2px dashed #e4e7ed;
  border-radius: 12px;
  background: linear-gradient(135deg, #fafbfc 0%, #ffffff 100%);
  transition: all 0.3s ease;
  
  &:hover {
    border-color: #c0c4cc;
    transform: translateY(-2px);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  }
  
  .hint-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    
    .hint-icon {
      font-size: 40px;
      color: #d3d4d6;
      margin-bottom: 8px;
      transition: color 0.3s ease;
    }
    
    .hint-text {
      font-size: 14px;
      color: #606266;
      font-weight: 500;
    }
    
    .hint-subtext {
      font-size: 12px;
      color: #909399;
    }
  }
  
  &:hover .hint-content .hint-icon {
    color: #c0c4cc;
  }
}

.selected-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
  padding: 4px 6px;
  background: #f8fafc;
  border-radius: 4px;
}

.selected-title {
  display: flex;
  align-items: center;
  gap: 4px;
  font-weight: 600;
  color: #1e293b;
  font-size: 14px;
}

.selected-icon {
  color: #3b82f6;
  font-size: 12px;
  padding: 2px;
  background: rgba(59, 130, 246, 0.1);
  border-radius: 4px;
}

.selected-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.basic-info {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2px 8px;
  padding: 4px 6px;
  background: #f8fafc;
  border-radius: 4px;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 3px;
  font-size: 11px;
  padding: 1px 0;
  
  &.description {
    grid-column: 1 / -1;
    margin-top: 2px;
    padding-top: 2px;
    border-top: 1px solid rgba(226, 232, 240, 0.3);
  }
}

.info-label {
  color: #64748b;
  min-width: 35px;
  font-weight: 500;
  font-size: 10px;
  flex-shrink: 0;
}

.info-value {
  color: #1e293b;
  flex: 1;
  font-weight: 400;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  line-height: 1.2;
  font-size: 9px;
}

.fields-summary {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  padding: 3px 6px;
  background: #dbeafe;
  border-radius: 4px;
  border: 1px solid rgba(59, 130, 246, 0.2);
  
  .fields-count {
    font-weight: 600;
    color: #1e40af;
    font-size: 12px;
  }
  
  .fields-breakdown {
    display: flex;
    gap: 6px;
  }
}





.field-stat {
  font-size: 11px;
  font-weight: 500;
  padding: 1px 4px;
  border-radius: 3px;
  
  &.dimension {
    color: #1d4ed8;
    background: rgba(29, 78, 216, 0.1);
  }
  
  &.metric {
    color: #059669;
    background: rgba(5, 150, 105, 0.1);
  }
}

// 图表标题输入框无边框样式
.chart-title-input {
  :deep(.el-input__wrapper) {
    border: none !important;
    box-shadow: none !important;
    background: transparent !important;
  }
  
  :deep(.el-input__inner) {
    border: none !important;
    box-shadow: none !important;
    background: transparent !important;
  }
  
  :deep(.el-input__wrapper:hover) {
    border: none !important;
    box-shadow: none !important;
  }
  
  :deep(.el-input__wrapper.is-focus) {
    border: none !important;
    box-shadow: none !important;
  }
}

/* 右键菜单样式 */
.context-menu {
  position: fixed;
  background: white;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  z-index: 9999;
  min-width: 160px;
  padding: 8px 0;
  font-size: 14px;
  backdrop-filter: blur(8px);
  animation: contextMenuFadeIn 0.15s ease-out;
  
  .context-menu-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 16px;
    cursor: pointer;
    transition: all 0.2s ease;
    color: #606266;
    line-height: 1.2;
    
    &:hover {
      background: linear-gradient(135deg, #f5f7fa 0%, #e8f4fd 100%);
      color: #409eff;
      
      .el-icon {
        transform: scale(1.1);
      }
    }
    
    &:active {
      background: #e8f4fd;
      transform: scale(0.98);
    }
    
    .el-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
      transition: transform 0.2s ease;
      flex-shrink: 0;
    }
    
    span {
      flex: 1;
      font-weight: 400;
      font-size: 13px;
    }
  }
  
  .context-menu-divider {
    height: 1px;
    background: linear-gradient(90deg, transparent, #e4e7ed, transparent);
    margin: 6px 0;
  }
}

@keyframes contextMenuFadeIn {
  from {
    opacity: 0;
    transform: scale(0.95) translateY(-5px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.context-menu-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 9998;
  background: transparent;
}

/* 垂直分隔条样式 */
.vertical-resizer {
  width: 8px;
  background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
  border-left: 1px solid #e2e8f0;
  border-right: 1px solid #e2e8f0;
  cursor: col-resize;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.2s ease;
  z-index: 100;
  
  &:hover {
    background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
    border-color: #3b82f6;
    
    .resizer-line {
      background: #3b82f6;
      width: 3px;
    }
  }
  
  &.active {
    background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
    border-color: #3b82f6;
    
    .resizer-line {
      background: #3b82f6;
      width: 3px;
    }
  }
  
  .resizer-line {
    width: 2px;
    height: 40px;
    background: #cbd5e1;
    border-radius: 1px;
    transition: all 0.2s ease;
    position: relative;
    
    &::before {
      content: '';
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 1px;
      height: 20px;
      background: rgba(255, 255, 255, 0.8);
      border-radius: 0.5px;
    }
  }
}

// 字段展示区域样式
.fields-display-section {
  margin: 16px 0;
  padding: 16px;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  background: linear-gradient(135deg, #fafbfc 0%, #f5f7fa 100%);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  
  .section-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 16px;
    font-weight: 600;
    color: #303133;
    font-size: 14px;
    
    .el-icon {
      color: #409eff;
      font-size: 16px;
    }
    
    .field-count {
      margin-left: auto;
      color: #909399;
      font-weight: normal;
      font-size: 12px;
    }
  }
  
  .field-group {
    margin-bottom: 16px;
    
    &:last-child {
      margin-bottom: 0;
    }
    
    .field-group-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;
      font-weight: 500;
      color: #606266;
      font-size: 13px;
      padding: 6px 8px;
      background: #ebeef5;
      border-radius: 4px;
      
      .el-icon {
        font-size: 16px;
      }
      
      .el-tag {
        margin-left: auto;
      }
    }
    
    .field-list {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    
    .field-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      background: white;
      border: 1px solid #e4e7ed;
      border-radius: 6px;
      font-size: 12px;
      transition: all 0.3s ease;
      
      &:hover {
        border-color: #c0c4cc;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        transform: translateY(-1px);
      }
      
      &.dimension-field {
        border-left: 3px solid #409eff;
        
        .field-icon {
          color: #409eff;
        }
      }
      
      &.metric-field {
        border-left: 3px solid #67c23a;
        
        .field-icon {
          color: #67c23a;
        }
      }
      
      .field-name {
        flex: 1;
        color: #303133;
        font-weight: 500;
      }
      
      .el-tag {
        font-size: 10px;
      }
    }
    
    .empty-fields {
      text-align: center;
      color: #c0c4cc;
      font-size: 12px;
      padding: 20px;
      background: white;
      border: 1px dashed #e4e7ed;
      border-radius: 6px;
    }
  }
}

</style> 