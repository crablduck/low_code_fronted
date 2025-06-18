/*
 * @Author: Mr.Crab
 * @Date: 2025-01-14 10:00:00
 * @LastEditors: Mr.Crab
 * @LastEditTime: 2025-01-14 10:00:00
 * @FilePath: /workflow-system/src/components/ReportDesigner.vue
 * @Description: 真正Excel风格的报表设计器
 */
<template>
  <div class="report-designer">
    <!-- 顶部工具栏 -->
    <div class="designer-header">
      <div class="header-left">
          <el-button-group>
          <el-button size="small" @click="handleSave" :loading="saving" class="excel-btn">
            <el-icon><DocumentCopy /></el-icon>
            保存
          </el-button>
          <el-button size="small" @click="updateRender" :loading="rendering" class="excel-btn" type="success">
            <el-icon><Refresh /></el-icon>
            更新渲染
          </el-button>
          <el-button size="small" @click="clearAll" class="excel-btn">
            <el-icon><Delete /></el-icon>
            清空表格
            </el-button>
          </el-button-group>
        
        <el-divider direction="vertical" />
        
        <span class="report-title">{{ reportData.name || 'Excel报表设计器' }}</span>
        </div>

      <div class="header-right">
        <el-button size="small" @click="toggleRightPanel" class="excel-btn" :type="rightPanelVisible ? 'primary' : ''">
          <el-icon><Operation /></el-icon>
          {{ rightPanelVisible ? '隐藏面板' : '显示面板' }}
        </el-button>
        <!-- 全屏模式时显示返回上一页按钮，否则显示返回报表按钮 -->
        <el-button v-if="route.meta?.layout === 'fullscreen'" size="small" @click="router.back()" class="excel-btn">
          <el-icon><ArrowLeft /></el-icon>
          返回上一页
        </el-button>
        <el-button v-else size="small" @click="$emit('back')" class="excel-btn">
          <el-icon><ArrowLeft /></el-icon>
          返回报表
        </el-button>
      </div>
    </div>

    <!-- Excel工具栏组 -->
    <div class="excel-toolbars">
      <!-- 主工具栏 -->
      <div class="excel-toolbar main-toolbar">
        <div class="toolbar-group">
          <!-- 文件操作 -->
          <div class="toolbar-section">
            <el-button size="small" class="toolbar-btn" title="新建">
              <el-icon><Plus /></el-icon>
            </el-button>
            <el-button size="small" class="toolbar-btn" title="打开">
              <el-icon><FolderOpened /></el-icon>
            </el-button>
            <el-button size="small" class="toolbar-btn" title="保存" @click="handleSave">
              <el-icon><DocumentCopy /></el-icon>
            </el-button>
            <el-button size="small" class="toolbar-btn" title="打印">
              <el-icon><Printer /></el-icon>
            </el-button>
          </div>

          <div class="toolbar-divider"></div>

          <!-- 撤销重做 -->
          <div class="toolbar-section">
            <el-button size="small" class="toolbar-btn" title="撤销">
              <el-icon><RefreshLeft /></el-icon>
            </el-button>
            <el-button size="small" class="toolbar-btn" title="重做">
              <el-icon><RefreshRight /></el-icon>
            </el-button>
          </div>

          <div class="toolbar-divider"></div>

          <!-- 🧩 组件插入区域 -->
          <div class="toolbar-section components-toolbar">
            <label class="section-label">插入组件:</label>
            <div class="toolbar-components">
              <div 
                v-for="component in availableComponents" 
                :key="component.type"
                class="toolbar-component-item"
                draggable="true"
                @dragstart="handleComponentDragStart($event, component)"
                @click="insertComponentAtCursor(component)"
                :title="`插入 ${component.name}`"
              >
                <el-icon>
                  <component :is="component.icon" />
                </el-icon>
                <span>{{ component.name }}</span>
              </div>
            </div>
          </div>

          <div class="toolbar-divider"></div>

          <!-- 字体和格式 -->
          <div class="toolbar-section">
            <el-select v-model="currentFont" size="small" style="width: 120px" class="excel-select">
            <el-option label="微软雅黑" value="Microsoft YaHei" />
            <el-option label="宋体" value="SimSun" />
            <el-option label="Arial" value="Arial" />
              <el-option label="Calibri" value="Calibri" />
          </el-select>
            
            <el-select v-model="fontSize" size="small" style="width: 70px; margin-left: 8px" class="excel-select">
              <el-option v-for="size in fontSizes" :key="size" :label="size" :value="size" />
          </el-select>

            <el-button-group class="format-buttons" style="margin-left: 8px">
              <el-button size="small" :class="{ 'is-active': cellFormat.bold }" @click="toggleBold" class="format-btn">
                <strong>B</strong>
            </el-button>
              <el-button size="small" :class="{ 'is-active': cellFormat.italic }" @click="toggleItalic" class="format-btn">
                <em>I</em>
              </el-button>
              <el-button size="small" :class="{ 'is-active': cellFormat.underline }" @click="toggleUnderline" class="format-btn">
                <u>U</u>
            </el-button>
          </el-button-group>
        </div>

          <div class="toolbar-divider"></div>

          <!-- 颜色工具 -->
          <div class="toolbar-section">
            <el-color-picker v-model="cellFormat.color" size="small" class="color-picker" />
            <el-color-picker v-model="cellFormat.backgroundColor" size="small" class="color-picker" style="margin-left: 8px" />
        </div>

          <div class="toolbar-divider"></div>

          <!-- 边框和对齐 -->
          <div class="toolbar-section">
            <el-button-group class="border-buttons">
              <el-button size="small" title="所有边框" @click="setBorderStyle('all')" class="border-btn">
                <el-icon><Grid /></el-icon>
            </el-button>
              <el-button size="small" title="外边框" @click="setBorderStyle('outer')" class="border-btn">
                ⊞
              </el-button>
              <el-button size="small" title="无边框" @click="setBorderStyle('none')" class="border-btn">
                □
              </el-button>
            </el-button-group>

            <el-button-group class="align-buttons" style="margin-left: 8px">
              <el-button size="small" title="左对齐" class="align-btn" @click="setAlignment('left')">
                <el-icon><Back /></el-icon>
              </el-button>
              <el-button size="small" title="居中对齐" class="align-btn" @click="setAlignment('center')">
                <el-icon><Position /></el-icon>
              </el-button>
              <el-button size="small" title="右对齐" class="align-btn" @click="setAlignment('right')">
                <el-icon><Right /></el-icon>
            </el-button>
          </el-button-group>
        </div>

          <div class="toolbar-divider"></div>

          <!-- 合并单元格 -->
          <div class="toolbar-section">
            <el-button size="small" class="toolbar-btn" @click="mergeSelectedCells" :disabled="!canMerge" title="合并单元格">
              <el-icon><CopyDocument /></el-icon>
            </el-button>
            <el-button size="small" class="toolbar-btn" @click="splitSelectedCells" :disabled="!canSplit" title="拆分单元格">
              <el-icon><DocumentRemove /></el-icon>
            </el-button>
          </div>
          
          <div class="toolbar-divider"></div>
          
          <!-- 🎯 选择范围操作 -->
          <div class="toolbar-section">
            <el-button size="small" @click="selectAll" title="全选" class="toolbar-btn">
              <el-icon><Select /></el-icon>
              全选
            </el-button>
            <el-button size="small" @click="clearSelection" title="清除选择" class="toolbar-btn">
              <el-icon><Close /></el-icon>
              清除
            </el-button>
          </div>

          <div class="toolbar-divider"></div>

          <!-- 更新渲染 -->
          <div class="toolbar-section">
            <el-button size="small" @click="updateRender" :loading="rendering" type="success" class="render-btn">
              <el-icon><Refresh /></el-icon>
              更新渲染
            </el-button>
          </div>

          <!-- 工具栏-导入导出 -->
          <div class="toolbar-group">
            <el-button-group>
              <el-button size="small" @click="showInsertTableDialog">
                <el-icon><Grid /></el-icon>
                插入表格
              </el-button>
              <el-button size="small" @click="showExportDialog">
                <el-icon><Download /></el-icon>
                导出
              </el-button>
            </el-button-group>
          </div>
        </div>
      </div>

      <!-- 公式栏 -->
      <div class="formula-bar">
        <div class="name-box">
          <input v-model="selectedCell.ref" readonly class="name-input" />
        </div>
        <div class="fx-label">fx</div>
        <div class="formula-input-container">
          <input 
            v-model="cellFormula" 
            class="formula-input" 
            placeholder="在此输入公式或拖入字段，如: ${visit_count} * 10"
            @keyup.enter="applyFormula"
            @drop="handleFormulaDrop"
            @dragover.prevent
            @dragenter.prevent
            :class="{ 'formula-drag-over': isFormulaDragOver }"
          />
          <el-button 
          size="small"
            type="primary" 
            @click="applyFormula"
            class="apply-formula-btn"
          >
            <el-icon><Check /></el-icon>
            应用
          </el-button>
        </div>
        
        <!-- 公式帮助提示 -->
        <div class="formula-help" v-if="cellFormula">
          <span class="formula-preview">
            预览: {{ getFormulaPreview() }}
          </span>
        </div>
      </div>
    </div>

    <!-- 主内容区域 -->
    <div class="designer-body">
      <!-- 中央Excel表格区域 -->
      <div class="table-container" :style="{ 'margin-right': rightPanelVisible ? '300px' : '0' }">
        <!-- Excel表格 -->
        <div class="excel-table-wrapper">
          <!-- 列标题 -->
        <div class="column-headers">
            <div class="corner-cell"></div>
            <div v-for="col in allColumns" :key="col" class="column-header" 
                 :class="{ 
                   'selected': selectedCell.col === col, 
                   'has-field': getColumnField(col),
                   'drop-active': isDragOverColumn === col
                 }"
                 :style="{ width: (columnWidths[col] || defaultColumnWidth) + 'px' }"
                 @click="selectColumnHeader(col)">
              <div v-if="getColumnField(col)" class="column-field">
                <span class="field-name" :title="getColumnField(col).label">{{ getColumnField(col).label }}</span>
                <el-button size="small" text @click.stop="removeColumnField(col)">
                  <el-icon><Close /></el-icon>
                </el-button>
              </div>
              <div v-else class="drop-zone" 
                   @drop="handleColumnDrop($event, col)"
                   @dragover="handleDragOver($event, col)"
                   @dragenter="handleDragEnter($event, col)"
                   @dragleave="handleDragLeave($event, col)">
            {{ col }}
              </div>
              <!-- 列宽调整手柄 -->
              <div 
                class="resize-handle resize-handle-col"
                @mousedown="startResize($event, 'column', col)"
                @dblclick="autoFitColumn(col)"
                title="拖拽调整列宽，双击自适应"
              ></div>
          </div>
        </div>

        <!-- 表格主体 -->
          <div class="spreadsheet-body">
            <!-- 行标题 -->
            <div class="row-headers" ref="rowHeadersRef">
              <div v-for="row in allRows" :key="row" class="row-header"
                   :class="{ 'selected': selectedCell.row === row }">
              {{ row }}
            </div>
          </div>

            <!-- 单元格表格 -->
            <div class="cells-area" ref="cellsAreaRef" @scroll="handleScroll">
              <table class="excel-table">
              <tbody>
                  <tr v-for="rowIndex in allRows" :key="rowIndex">
                    <td v-for="col in allColumns" :key="col" 
                        :class="getCellClass(rowIndex, col)"
                        @click="selectCell(rowIndex, col, $event)"
                        @mousedown="startCellSelection($event, rowIndex, col)"
                        @mouseenter="handleCellMouseEnter($event, rowIndex, col)"
                        @mouseup="endCellSelection"
                        @dblclick="editCell(rowIndex, col)"
                        @contextmenu.prevent="handleCellRightClick($event, rowIndex, col)"
                        @dragover.prevent="handleCellDragOver($event, rowIndex, col)"
                        @drop="handleCellDrop($event, rowIndex, col)"
                        @dragenter="handleCellDragEnter($event, rowIndex, col)"
                        @dragleave="handleCellDragLeave($event, rowIndex, col)"
                        :style="getCellStyle(rowIndex, col)">
                      <input 
                        v-if="isEditing(rowIndex, col)"
                        class="cell-input"
                        v-model="editingValue"
                        @blur="finishEdit"
                        @keyup.enter="finishEdit"
                        @keyup.esc="cancelEdit"
                        ref="cellInputRef"
                      />
                      <div v-else class="cell-content" 
                           :class="{ 'drop-ready': isCellDropReady(rowIndex, col) }">
                        {{ getCellValue(rowIndex, col) }}
                        <div v-if="isCellDropReady(rowIndex, col)" class="drop-hint">
                          拖拽字段到此
                        </div>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 🔥 绝对定位的右侧数据源面板 - 100%可见！ -->
    <div class="fixed-right-panel" :class="{ 'panel-hidden': !rightPanelVisible }">
      <!-- 面板头部 -->
      <div class="panel-header">
        <div class="panel-title">
          <el-icon><Operation /></el-icon>
          <span>数据源面板</span>
        </div>
        <el-button size="small" text @click="toggleRightPanel" class="close-btn">
          <el-icon><Close /></el-icon>
        </el-button>
      </div>

      <!-- 面板内容 -->
      <div class="panel-content">
        <!-- 数据源选择器 -->
        <div class="data-source-selector">
          <h4>📋 选择数据源</h4>
          <el-select 
            v-model="selectedDataSource" 
            @change="loadDataSource" 
            placeholder="请选择数据表" 
            style="width: 100%; margin-bottom: 10px;"
            size="small"
          >
            <el-option 
              v-for="ds in availableDataSources" 
              :key="ds.value" 
              :label="ds.label" 
              :value="ds.value" 
            />
          </el-select>
          
          <el-button 
            type="success" 
            @click="updateRender" 
            :loading="rendering" 
            style="width: 100%;"
            size="small"
          >
            <el-icon><Refresh /></el-icon>
            加载数据
          </el-button>
  </div>

        <!-- 🔗 当前绑定状态 -->
        <div class="binding-status" v-if="Object.keys(columnFieldMap).length > 0">
          <h4>🔗 当前绑定状态</h4>
          <div class="binding-list">
            <div v-for="(field, col) in columnFieldMap" :key="col" class="binding-item">
              <span class="col-name">{{ col }}列</span>
              <span class="arrow">→</span>
              <span class="field-name">{{ field.label }}</span>
              <el-button size="small" text @click="removeColumnField(col)" class="remove-binding">
                <el-icon><Close /></el-icon>
              </el-button>
            </div>
          </div>
        </div>

        <!-- 🔍 数据预览和过滤 -->
        <div class="data-preview-section" v-if="sourceData.length > 0">
          <h4>🔍 数据预览 ({{ filteredData.length }} / {{ sourceData.length }})</h4>
          
          <!-- 过滤控件 -->
          <div class="filter-controls">
            <el-input
              v-model="dataFilter"
              placeholder="输入过滤条件（如：内科、1250）"
              size="small"
              clearable
              @input="applyDataFilter"
              style="margin-bottom: 8px;"
            >
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>
            <div class="filter-tips">
              <el-tag size="small" type="info">
                {{ filteredData.length === 1 ? '✅ 单条数据 - 可拖拽到单元格' : '📊 多条数据 - 可拖拽到表头' }}
              </el-tag>
            </div>
          </div>

          <!-- 数据预览表格 -->
          <div class="data-preview-table">
            <table class="mini-table">
              <thead>
                <tr>
                  <th v-for="field in originalFields" :key="field.name" class="mini-th">
                    {{ field.label }}
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(row, index) in filteredData.slice(0, 5)" :key="index" class="mini-tr">
                  <td v-for="field in originalFields" :key="field.name" class="mini-td">
                    {{ row[field.name] }}
                  </td>
                </tr>
              </tbody>
            </table>
            <div v-if="filteredData.length > 5" class="more-data-hint">
              还有 {{ filteredData.length - 5 }} 条数据...
            </div>
          </div>
        </div>

        <!-- 字段列表 -->
        <div class="fields-section" v-if="originalFields.length > 0">
          <h4>📝 可拖拽字段 ({{ originalFields.length }})</h4>
          <div class="fields-container">
            <div 
              v-for="field in originalFields" 
              :key="field.name"
              class="field-card"
              draggable="true"
              @dragstart="handleFieldDragStart($event, field, 'original')"
            >
              <div class="field-content">
                <div class="field-name">{{ field.label }}</div>
                <div class="field-type">{{ field.type }}</div>
              </div>
              <el-icon class="drag-handle"><Rank /></el-icon>
            </div>
          </div>
        </div>

        <!-- 简单说明 -->
        <div class="help-section">
          <div class="help-card">
            <h4>🎯 使用方法</h4>
            <ol>
              <li>选择数据源表格</li>
              <li>点击"加载数据"按钮</li>
              <li>拖拽字段到Excel列标题</li>
              <li>查看数据绑定结果</li>
            </ol>
          </div>
          
          <!-- 公式功能说明 -->
          <div class="formula-help-card">
            <h4>🧮 公式计算功能</h4>
            <div class="formula-examples">
              <p><strong>基本用法：</strong></p>
              <ul>
                <li>点击列标题进入列公式编辑模式</li>
                <li>拖拽字段到公式栏插入字段引用</li>
                <li>支持数学运算：+、-、*、/</li>
              </ul>
              
              <p><strong>公式示例：</strong></p>
              <div class="formula-example">
                <code>${visit_count} * 10</code>
                <span class="example-desc">将就诊人数乘以10</span>
              </div>
              <div class="formula-example">
                <code>${visit_count} > 100 ? "多" : "少"</code>
                <span class="example-desc">条件判断</span>
              </div>
              
              <p><strong>操作步骤：</strong></p>
              <ol>
                <li>点击列标题（如C列）</li>
                <li>在公式栏输入或拖拽字段</li>
                <li>点击"应用"按钮</li>
                <li>查看整列计算结果</li>
              </ol>
            </div>
          </div>
        </div>

        <!-- 🚀 一键完成典型场景 -->
        <div class="scenario-section">
          <div class="scenario-card">
            <h4>🚀 一键完成场景</h4>
            <p class="scenario-desc">自动完成"按科室统计每月就诊人数"报表设计</p>
            <el-button 
              type="primary" 
              @click="autoCompleteScenario"
              :loading="rendering"
              style="width: 100%;"
            >
              <el-icon><Star /></el-icon>
              一键完成报表设计
            </el-button>
          </div>
        </div>
      </div>
    </div>

    <!-- 右键菜单 -->
    <el-dropdown
      ref="contextMenuRef"
      :show-timeout="0"
      :hide-timeout="0"
      trigger="contextmenu"
      :visible="contextMenu.visible"
      placement="bottom-start"
      style="position: fixed; z-index: 9999;"
      :style="{ left: contextMenu.x + 'px', top: contextMenu.y + 'px' }"
    >
      <span></span>
      <template #dropdown>
        <el-dropdown-menu>
          <!-- 单元格范围选择时的菜单 -->
          <template v-if="selectedCells.length > 1">
            <el-dropdown-item @click="mergeCells">
              <el-icon><Grid /></el-icon>
              合并单元格
            </el-dropdown-item>
            <el-dropdown-item @click="clearSelection">
              <el-icon><Close /></el-icon>
              清除选择
            </el-dropdown-item>
            <el-dropdown-item divided @click="copySelection">
              <el-icon><CopyDocument /></el-icon>
              复制
            </el-dropdown-item>
            <el-dropdown-item @click="deleteSelection">
              <el-icon><Delete /></el-icon>
              删除内容
            </el-dropdown-item>
          </template>
          
          <!-- 单个单元格菜单 -->
          <template v-else>
            <el-dropdown-item @click="editCell(selectedCell.row, selectedCell.col)">
              <el-icon><Edit /></el-icon>
              编辑单元格
            </el-dropdown-item>
            <el-dropdown-item @click="showInsertTableDialog">
              <el-icon><Grid /></el-icon>
              插入表格
            </el-dropdown-item>
            <el-dropdown-item divided @click="copyCell">
              <el-icon><CopyDocument /></el-icon>
              复制
            </el-dropdown-item>
            <el-dropdown-item @click="pasteCell">
              <el-icon><Document /></el-icon>
              粘贴
            </el-dropdown-item>
            <el-dropdown-item @click="clearCell">
              <el-icon><Delete /></el-icon>
              清除内容
            </el-dropdown-item>
          </template>
          
          <el-dropdown-item divided @click="showExportDialog">
            <el-icon><Download /></el-icon>
            导出
          </el-dropdown-item>
        </el-dropdown-menu>
      </template>
    </el-dropdown>

    <!-- 格式设置对话框 -->
    <el-dialog v-model="formatDialog.visible" title="单元格格式" width="500px">
      <el-form :model="formatDialog.form" label-width="100px">
        <el-form-item label="字体">
          <el-select v-model="formatDialog.form.fontFamily" style="width: 100%">
            <el-option label="微软雅黑" value="Microsoft YaHei" />
            <el-option label="宋体" value="SimSun" />
            <el-option label="Arial" value="Arial" />
            <el-option label="Calibri" value="Calibri" />
          </el-select>
        </el-form-item>
        <el-form-item label="字号">
          <el-input-number v-model="formatDialog.form.fontSize" :min="8" :max="72" />
        </el-form-item>
        <el-form-item label="字体颜色">
          <el-color-picker v-model="formatDialog.form.color" />
        </el-form-item>
        <el-form-item label="背景颜色">
          <el-color-picker v-model="formatDialog.form.backgroundColor" />
        </el-form-item>
        <el-form-item label="对齐方式">
          <el-select v-model="formatDialog.form.textAlign">
            <el-option label="左对齐" value="left" />
            <el-option label="居中" value="center" />
            <el-option label="右对齐" value="right" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-checkbox v-model="formatDialog.form.bold">加粗</el-checkbox>
          <el-checkbox v-model="formatDialog.form.italic">斜体</el-checkbox>
          <el-checkbox v-model="formatDialog.form.underline">下划线</el-checkbox>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="formatDialog.visible = false">取消</el-button>
        <el-button type="primary" @click="applyFormat">应用</el-button>
      </template>
    </el-dialog>

    <!-- 插入表格对话框 -->
    <el-dialog v-model="insertTableDialog" title="插入表格" width="500px">
      <el-form :model="insertTableForm" label-width="100px">
        <el-form-item label="行数">
          <el-input-number v-model="insertTableForm.rows" :min="1" :max="100" />
        </el-form-item>
        <el-form-item label="列数">
          <el-input-number v-model="insertTableForm.cols" :min="1" :max="50" />
        </el-form-item>
        <el-form-item label="表头">
          <el-checkbox v-model="insertTableForm.hasHeader" />
        </el-form-item>
        <el-form-item label="数据">
          <el-table :data="insertTableForm.data" border>
            <el-table-column v-for="col in insertTableForm.cols" :key="col" :label="`列${col}`">
              <template #default="scope">
                <el-input v-model="scope.row[col]" />
              </template>
            </el-table-column>
          </el-table>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="insertTableDialog = false">取消</el-button>
        <el-button type="primary" @click="insertTable">确定</el-button>
      </template>
    </el-dialog>

    <!-- 导出对话框 -->
    <el-dialog v-model="exportDialog" title="导出报表" width="500px">
      <el-form :model="exportForm" label-width="100px">
        <el-form-item label="格式">
          <el-radio-group v-model="exportForm.format">
            <el-radio label="xlsx" />
            <el-radio label="pdf" />
          </el-radio-group>
        </el-form-item>
        <el-form-item label="范围">
          <el-radio-group v-model="exportForm.range">
            <el-radio label="all">全部</el-radio>
            <el-radio label="selection">选择范围</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="文件名">
          <el-input v-model="exportForm.filename" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="exportDialog = false">取消</el-button>
        <el-button type="primary" @click="exportReport">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  DocumentCopy, ArrowLeft, Delete, Grid, Rank, Close, Operation, Edit, Refresh,
  Plus, FolderOpened, Printer, RefreshLeft, RefreshRight, Position, Back, Right,
  Picture, TrendCharts, ScaleToOriginal, Link, Sort, Filter, CopyDocument, DocumentRemove, Star, Check,
  DataAnalysis, CirclePlus, Collection, Minus, Reading, Search, Document, Select, Download
} from '@element-plus/icons-vue'
import { reportApi, reportDataSourceApi } from '@/api/report'

// 类型定义
interface FieldInfo {
  name: string
  label: string
  type: string
  fieldType?: 'original' | 'computed'
  id?: number
  expression?: string
}

interface ComputedFieldInfo extends FieldInfo {
  id: number
  expression: string
  fieldType: 'computed'
}

// Props & Emits
interface Props {
  mode?: 'edit' | 'preview'
  reportData?: any
}

const props = defineProps<Props>()
const emit = defineEmits(['back'])

const route = useRoute()
const router = useRouter()

// 响应式数据
const saving = ref(false)
const rendering = ref(false)
const rightPanelVisible = ref(true)
const selectedDataSource = ref('')
const cellFormula = ref('')

// 🔄 分组与模板可视交互功能
// const groupEnabled = ref(false)
// const groupByField = ref('')
// const aggregationType = ref('sum')
// const reportTitle = ref('月度就诊统计')

// 条件样式配置
const conditionalStyles = reactive<Record<string, any>>({})

// 参数化控件
const reportParameters = reactive<Record<string, any>>({})

// 单元格编辑相关
const editingCell = ref<{row: number, col: string} | null>(null)
const editingValue = ref('')
const cellInputRef = ref<HTMLInputElement>()

// DOM 引用
const rowHeadersRef = ref<HTMLElement>()
const cellsAreaRef = ref<HTMLElement>()

// 合并单元格数据结构
const mergedCells = reactive<Record<string, {
  rowspan: number
  colspan: number
  startRow: number
  startCol: string
  endRow: number
  endCol: string
}>>({})

// 列宽行高数据
const columnWidths = reactive<Record<string, number>>({})
const rowHeights = reactive<Record<number, number>>({})
const defaultColumnWidth = 80
const defaultRowHeight = 21

// 添加单元格格式映射
const cellFormatMap = reactive<Record<string, any>>({})

// 调整状态
const resizing = ref<{
  type: 'column' | 'row'
  target: string | number
  startX: number
  startY: number
  startSize: number
} | null>(null)

// 🎯 选择范围功能
const selectionRange = reactive({
  start: { row: 0, col: '' },
  end: { row: 0, col: '' },
  active: false,
  selecting: false
})

// 选中的单元格范围
const selectedCells = computed(() => {
  if (!selectionRange.active) return []
  
  const cells: Array<{row: number, col: string}> = []
  const startRowIndex = Math.min(selectionRange.start.row, selectionRange.end.row)
  const endRowIndex = Math.max(selectionRange.start.row, selectionRange.end.row)
  const startColIndex = Math.min(
    getColumnIndex(selectionRange.start.col),
    getColumnIndex(selectionRange.end.col)
  )
  const endColIndex = Math.max(
    getColumnIndex(selectionRange.start.col), 
    getColumnIndex(selectionRange.end.col)
  )
  
  for (let row = startRowIndex; row <= endRowIndex; row++) {
    for (let colIndex = startColIndex; colIndex <= endColIndex; colIndex++) {
      const col = allColumns.value[colIndex]
      if (col) {
        cells.push({ row, col })
      }
    }
  }
  
  return cells
})

// 检查单元格是否在选择范围内
const isCellInSelection = (row: number, col: string) => {
  if (!selectionRange.active) return false
  return selectedCells.value.some(cell => cell.row === row && cell.col === col)
}

// 生成大量列和行，真正Excel感觉
const generateColumns = () => {
  const cols = []
  for (let i = 0; i < 26; i++) {
    cols.push(String.fromCharCode(65 + i)) // A-Z
  }
  for (let i = 0; i < 26; i++) {
    for (let j = 0; j < 26; j++) {
      cols.push(String.fromCharCode(65 + i) + String.fromCharCode(65 + j)) // AA-ZZ
    }
  }
  return cols.slice(0, 50) // 显示50列
}

const allColumns = ref(generateColumns())
const allRows = computed(() => Array.from({ length: 100 }, (_, i) => i + 1)) // 100行

// Excel样式相关
const currentFont = ref('Microsoft YaHei')
const fontSize = ref(12)
const fontSizes = [8, 9, 10, 11, 12, 14, 16, 18, 20, 22, 24, 26, 28, 36, 48]
const selectedCell = reactive({ row: 1, col: 'A', ref: 'A1' })
const cellFormat = reactive({
  bold: false,
  italic: false,
  underline: false,
  color: '#000000',
  backgroundColor: '#ffffff',
  borderStyle: 'all' as 'all' | 'outer' | 'none',
  borderWidth: 1,
  borderColor: '#d1d5db',
  textAlign: 'left' as 'left' | 'center' | 'right'
})

// 报表数据
const reportData = reactive({
  id: null as number | null,
  name: '',
  config: {
    template: 'computed',
    dataSource: { type: 'table' as const, tableName: '', sqlQuery: '', apiUrl: '' },
    fields: { selected: [], mapping: {} }
  }
})

// 数据源相关
const sourceData = ref<any[]>([])
const originalFields = ref<FieldInfo[]>([])
const computedFields = ref<ComputedFieldInfo[]>([])
const columnFieldMap = reactive<Record<string, FieldInfo>>({}) // 列与字段的映射
const renderedData = reactive<Record<string, string>>({}) // 渲染后的数据
const availableDataSources = ref<Array<{label: string, value: string}>>([]) // 可用数据源列表

// 可拖拽组件列表
const availableComponents = ref([
  { type: 'text', name: '文本', icon: 'Reading' },
  { type: 'table', name: '表格', icon: 'Grid' },
  { type: 'chart', name: '图表', icon: 'TrendCharts' },
  { type: 'image', name: '图片', icon: 'Picture' }
])

// 计算字段表单
const computedFieldForm = reactive({
  label: '',
  expression: '',
  type: 'string'
})

// 计算属性
const canCreateField = computed(() => {
  return computedFieldForm.label.trim() && computedFieldForm.expression.trim()
})

// 拖拽状态
const isDragOverColumn = ref<string | null>(null)

// 公式计算相关
const isFormulaDragOver = ref(false)
const columnFormulas = reactive<Record<string, string>>({}) // 列级公式存储
const currentEditingColumn = ref<string>('')

// 🎯 新增：表格插入和导出功能
const insertTableDialog = ref(false)
const insertTableForm = reactive({
  rows: 3,
  cols: 3,
  hasHeader: true,
  data: [] as string[][]
})

const exportDialog = ref(false)
const exportForm = reactive({
  format: 'xlsx' as 'xlsx' | 'pdf',
  range: 'all' as 'all' | 'selection',
  filename: '报表导出'
})

// 方法
const toggleRightPanel = () => {
  rightPanelVisible.value = !rightPanelVisible.value
}

// 🎯 模板可视交互功能方法

// 报表标题设置
// const setReportTitle = () => {
//   renderedData['A1'] = reportTitle.value
//   ElMessage.success('报表标题已设置到A1单元格')
// }

// 快速设置表头
// const setupTableHeaders = () => {
//   renderedData['A2'] = '科室'
//   renderedData['B2'] = '月份'
//   renderedData['C2'] = '就诊人数'
//   ElMessage.success('表头已设置完成：A2-科室，B2-月份，C2-就诊人数')
// }

// 获取字段显示名称
// const getFieldLabel = (fieldName: string): string => {
//   const field = originalFields.value.find(f => f.name === fieldName)
//   return field ? field.label : fieldName
// }

// 分组开关处理
// const handleGroupToggle = () => {
//   if (!groupEnabled.value) {
//     groupByField.value = ''
//     updateRender()
//   }
// }

// 应用分组设置
// const applyGrouping = () => {
//   if (!groupEnabled.value || !groupByField.value) return
//   
//   try {
//     const groupedData = groupDataByField(sourceData.value, groupByField.value, aggregationType.value)
//     
//     // 清空现有渲染数据（保留标题和表头）
//     Object.keys(renderedData).forEach(key => {
//       if (key.match(/^[A-Z][3-9]/) || key.match(/^[A-Z][1-9]\d+/)) {
//         delete renderedData[key]
//       }
//     })
//     
//     renderGroupedData(groupedData)
//     ElMessage.success(`已按"${getFieldLabel(groupByField.value)}"进行${aggregationType.value}分组`)
//   } catch (error: any) {
//     ElMessage.error('分组失败: ' + error.message)
//   }
// }

// 数据分组逻辑
// const groupDataByField = (data: any[], fieldName: string, aggType: string) => {
//   const grouped: Record<string, any[]> = {}
//   
//   // 按字段分组
//   data.forEach(item => {
//     const key = String(item[fieldName] || 'Unknown')
//     if (!grouped[key]) {
//       grouped[key] = []
//     }
//     grouped[key].push(item)
//   })
//   
//   // 计算聚合值
//   const result: any[] = []
//   Object.keys(grouped).forEach(key => {
//     const items = grouped[key]
//     const aggregatedItem: any = { [fieldName]: key }
//     
//     // 对数值字段进行聚合计算
//     originalFields.value.forEach(field => {
//       if (field.type === 'number' && field.name !== fieldName) {
//         const values = items.map(item => Number(item[field.name]) || 0)
//         
//         switch (aggType) {
//           case 'sum':
//             aggregatedItem[field.name] = values.reduce((sum, val) => sum + val, 0)
//             break
//           case 'avg':
//             aggregatedItem[field.name] = values.length > 0 ? values.reduce((sum, val) => sum + val, 0) / values.length : 0
//             break
//           case 'count':
//             aggregatedItem[field.name] = items.length
//             break
//           default:
//             aggregatedItem[field.name] = values.reduce((sum, val) => sum + val, 0)
//         }
//       } else if (field.name !== fieldName) {
//         aggregatedItem[field.name] = items[0][field.name]
//       }
//     })
//     
//     result.push(aggregatedItem)
//   })
//   
//   return result
// }

// 渲染分组数据
// const renderGroupedData = (groupedData: any[]) => {
//   groupedData.forEach((row, index) => {
//     const rowNum = index + 3 // 从第3行开始
//     
//     Object.keys(columnFieldMap).forEach(col => {
//       const field = columnFieldMap[col]
//       const value = row[field.name]
//       
//       if (value !== undefined && value !== null) {
//         if (field.type === 'number' && typeof value === 'number') {
//           renderedData[`${col}${rowNum}`] = value.toLocaleString()
//         } else {
//           renderedData[`${col}${rowNum}`] = String(value)
//         }
//       } else {
//         renderedData[`${col}${rowNum}`] = ''
//       }
//     })
//   })
// }

// 一键完成典型场景
const autoCompleteScenario = async () => {
  try {
    rendering.value = true
    
    // 确保选择了正确的数据源
    if (selectedDataSource.value !== 'visit_stat_monthly') {
      selectedDataSource.value = 'visit_stat_monthly'
      await loadDataSource()
    }
    
    // 设置报表标题
    const reportTitle = '月度就诊统计'
    renderedData['A1'] = reportTitle
    
    // 设置表头
    renderedData['A2'] = '科室'
    renderedData['B2'] = '月份' 
    renderedData['C2'] = '就诊人数'
    
    // 字段绑定
    const fields = originalFields.value
    if (fields.length >= 3) {
      const deptField = fields.find(f => f.name === 'department_name')
      const monthField = fields.find(f => f.name === 'visit_month')
      const countField = fields.find(f => f.name === 'visit_count')
      
      if (deptField) columnFieldMap['A'] = deptField
      if (monthField) columnFieldMap['B'] = monthField
      if (countField) columnFieldMap['C'] = countField
    }
    
    // 渲染数据
    sourceData.value.forEach((row, index) => {
      const rowNum = index + 3
      if (columnFieldMap['A']) renderedData[`A${rowNum}`] = row.department_name || ''
      if (columnFieldMap['B']) renderedData[`B${rowNum}`] = row.visit_month || ''
      if (columnFieldMap['C']) {
        const count = row.visit_count
        renderedData[`C${rowNum}`] = typeof count === 'number' ? count.toLocaleString() : String(count || 0)
      }
    })
    
    ElMessage.success('🎉 场景完成！已自动设置标题、表头并绑定数据')
    
  } catch (error: any) {
    ElMessage.error('场景设置失败: ' + error.message)
  } finally {
    rendering.value = false
  }
}

const loadAvailableDataSources = async () => {
  try {
    const tableResult = await reportDataSourceApi.getTableList()
    if (tableResult.code === 200) {
      // 处理可能的嵌套数据结构
      let tables = tableResult.data
      if (tables && typeof tables === 'object' && 'data' in tables) {
        tables = (tables as any).data
      }
      
      // 确保tables是数组
      const tableArray = Array.isArray(tables) ? tables : []
      availableDataSources.value = tableArray
        .filter((table: any) => !table.name.startsWith('_') && table.type === 'BASE TABLE')
        .map((table: any) => ({
          label: table.name,
          value: table.name
        }))
      
      // 如果没有选中的数据源，默认选择第一个
      if (!selectedDataSource.value && availableDataSources.value.length > 0) {
        selectedDataSource.value = availableDataSources.value[0].value
      }
    }
  } catch (error) {
    console.error('加载数据源列表失败:', error)
    // 使用默认数据源
    availableDataSources.value = [
      { label: '患者就诊信息', value: 'visit_info' },
      { label: '月度就诊统计', value: 'visit_stat_monthly' },
      { label: '用户管理', value: 'users' },
      { label: '部门统计', value: 'departments' }
    ]
    // 设置默认选择
    selectedDataSource.value = 'visit_stat_monthly'
  }
}

const loadDataSource = async () => {
  if (!selectedDataSource.value) return
  
  try {
    // 获取表结构
    const structResult = await reportDataSourceApi.getTableStructure(selectedDataSource.value)
    if (structResult.code === 200) {
      // 处理可能的嵌套数据结构
      let fields = structResult.data
      if (fields && typeof fields === 'object' && 'data' in fields) {
        fields = (fields as any).data
      }
      
      // 确保fields是数组
      const fieldsArray = Array.isArray(fields) ? fields : []
      originalFields.value = fieldsArray.map((field: any) => ({
        name: field.name,
        label: field.comment || field.name,
        type: mapFieldType(field.type),
        fieldType: 'original' as const
      }))
    }
    
    // 获取表数据
    const dataResult = await reportDataSourceApi.getTableData(selectedDataSource.value, 50)
    if (dataResult.code === 200) {
      // 处理可能的嵌套数据结构
      let data = dataResult.data
      if (data && typeof data === 'object' && 'data' in data) {
        data = (data as any).data
      }
      // 确保data是数组
      sourceData.value = Array.isArray(data) ? data : []
    }
    
    ElMessage.success(`数据源 "${selectedDataSource.value}" 加载成功`)
  } catch (error) {
    console.error('加载数据源失败:', error)
    ElMessage.error('加载数据源失败，使用模拟数据')
    loadMockData()
  }
}

const loadMockData = () => {
  // 模拟数据源配置 - 作为备用方案
  const dataSources: Record<string, { fields: FieldInfo[], data: any[] }> = {
    'visit_info': {
      fields: [
        { name: 'patient_name', label: '患者姓名', type: 'string' },
        { name: 'visit_date', label: '就诊时间', type: 'datetime' },
        { name: 'department', label: '科室', type: 'string' },
        { name: 'doctor_name', label: '主诊医生', type: 'string' },
        { name: 'diagnosis', label: '诊断', type: 'text' },
        { name: 'age', label: '年龄', type: 'number' }
      ],
      data: [
        { patient_name: '张三', visit_date: '2024-01-15 09:30', department: '内科', doctor_name: '李医生', diagnosis: '高血压', age: 45 },
        { patient_name: '李四', visit_date: '2024-01-15 10:15', department: '外科', doctor_name: '王医生', diagnosis: '阑尾炎', age: 32 },
        { patient_name: '王五', visit_date: '2024-01-15 11:00', department: '儿科', doctor_name: '赵医生', diagnosis: '感冒', age: 8 }
      ]
    },
    'visit_stat_monthly': {
      fields: [
        { name: 'department_name', label: '科室名称', type: 'string' },
        { name: 'visit_month', label: '就诊月份', type: 'string' },
        { name: 'visit_count', label: '就诊人数', type: 'number' }
      ],
      data: [
        { department_name: '内科', visit_month: '2024-01', visit_count: 158 },
        { department_name: '内科', visit_month: '2024-02', visit_count: 142 },
        { department_name: '内科', visit_month: '2024-03', visit_count: 173 },
        { department_name: '外科', visit_month: '2024-01', visit_count: 89 },
        { department_name: '外科', visit_month: '2024-02', visit_count: 95 },
        { department_name: '外科', visit_month: '2024-03', visit_count: 108 },
        { department_name: '儿科', visit_month: '2024-01', visit_count: 234 },
        { department_name: '儿科', visit_month: '2024-02', visit_count: 198 },
        { department_name: '儿科', visit_month: '2024-03', visit_count: 267 },
        { department_name: '妇产科', visit_month: '2024-01', visit_count: 76 },
        { department_name: '妇产科', visit_month: '2024-02', visit_count: 82 },
        { department_name: '妇产科', visit_month: '2024-03', visit_count: 91 }
      ]
    }
  }
  
  if (selectedDataSource.value && dataSources[selectedDataSource.value]) {
    const ds = dataSources[selectedDataSource.value]
    originalFields.value = ds.fields
    sourceData.value = ds.data
  }
}

// 映射数据库字段类型到界面类型
const mapFieldType = (dbType: string): string => {
  const type = dbType.toLowerCase()
  if (type.includes('varchar') || type.includes('char') || type.includes('text')) return 'string'
  if (type.includes('int') || type.includes('decimal') || type.includes('float') || type.includes('double')) return 'number'
  if (type.includes('datetime') || type.includes('timestamp') || type.includes('date')) return 'datetime'
  if (type.includes('boolean') || type.includes('tinyint(1)')) return 'boolean'
  return 'string'
}

const getFieldTypeColor = (type: string) => {
  const colors: Record<string, string> = {
    'string': 'primary',
    'number': 'success',
    'datetime': 'warning',
    'text': 'info',
    'boolean': 'danger'
  }
  return colors[type] || 'default'
}

const getColumnField = (col: string): FieldInfo | null => {
  return columnFieldMap[col] || null
}

const getCellValue = (row: number, col: string): string => {
  const cellKey = `${col}${row}`
  return renderedData[cellKey] || ''
}

const getCellClass = (row: number, col: string) => {
  const classes = []
  
  // 当前选中的单元格
  if (selectedCell.row === row && selectedCell.col === col) {
    classes.push('selected')
  }
  
  // 在选择范围内的单元格
  if (isCellInSelection(row, col)) {
    classes.push('in-selection')
  }
  
  // 选择范围的起始单元格
  if (selectionRange.active && 
      selectionRange.start.row === row && 
      selectionRange.start.col === col) {
    classes.push('selection-start')
  }
  
  // 选择范围的结束单元格
  if (selectionRange.active && 
      selectionRange.end.row === row && 
      selectionRange.end.col === col) {
    classes.push('selection-end')
  }
  
  // 是否有合并信息
  const cellKey = `${col}${row}`
  if (mergedCells[cellKey]) {
    classes.push('merged-cell')
  }
  
  return classes
}

const getCellStyle = (row: number, col: string) => {
  const cellKey = `${col}${row}`
  const cellFormats = cellFormatMap[cellKey] || {}
  
  return {
    fontFamily: cellFormats.fontFamily || currentFont.value,
    fontSize: (cellFormats.fontSize || fontSize.value) + 'px',
    fontWeight: cellFormats.bold ? 'bold' : 'normal',
    fontStyle: cellFormats.italic ? 'italic' : 'normal',
    textDecoration: cellFormats.underline ? 'underline' : 'none',
    color: cellFormats.color || '#000',
    backgroundColor: cellFormats.backgroundColor || 'transparent',
    textAlign: cellFormats.textAlign || 'left',
    width: (columnWidths[col] || defaultColumnWidth) + 'px',
    maxWidth: (columnWidths[col] || defaultColumnWidth) + 'px',
    minWidth: (columnWidths[col] || defaultColumnWidth) + 'px'
  }
}

const selectCell = (row: number, col: string, event?: MouseEvent) => {
  // 检查是否按下Shift键进行范围选择
  if (event && event.shiftKey && selectionRange.active) {
    // 扩展选择范围
    selectionRange.end = { row, col }
  } else {
    // 单个单元格选择
    selectedCell.row = row
    selectedCell.col = col
    selectedCell.ref = `${col}${row}`
    
    // 开始新的选择范围
    selectionRange.start = { row, col }
    selectionRange.end = { row, col }
    selectionRange.active = true
    selectionRange.selecting = false
  }
  
  // 更新公式栏
  const cellKey = `${col}${row}`
  cellFormula.value = renderedData[cellKey] || ''
}

const editCell = (row: number, col: string) => {
  selectCell(row, col) // 内部调用，不需要event参数
  editingCell.value = { row, col }
  editingValue.value = getCellValue(row, col)
  
  // 在下一个 tick 中聚焦输入框
  nextTick(() => {
    // 查找当前编辑单元格的输入框
    const cellKey = `${col}${row}`
    const inputElement = document.querySelector(`.cell-input`) as HTMLInputElement
    if (inputElement) {
      inputElement.focus()
      inputElement.select()
    }
  })
}

const isEditing = (row: number, col: string): boolean => {
  return editingCell.value?.row === row && editingCell.value?.col === col
}

const finishEdit = () => {
  if (editingCell.value) {
    const cellKey = `${editingCell.value.col}${editingCell.value.row}`
    let value = editingValue.value
    
    // 处理表达式计算
    if (value.startsWith('=')) {
      try {
        // 使用新的简化表达式计算
        const result = evaluateSimpleExpression(value.substring(1))
        renderedData[cellKey] = String(result)
      } catch (error) {
        renderedData[cellKey] = '#ERROR!'
        ElMessage.error('表达式计算错误')
      }
    } else {
      // 数据类型检测和格式化
      const formattedValue = formatCellValue(value)
      renderedData[cellKey] = formattedValue
    }
    
    editingCell.value = null
    editingValue.value = ''
  }
}

const cancelEdit = () => {
  editingCell.value = null
  editingValue.value = ''
}

const applyFormula = () => {
  if (currentEditingColumn.value) {
    // 应用公式到整列
    applyFormulaToColumn(currentEditingColumn.value, cellFormula.value)
  } else {
    // 应用到单个单元格
    const cellKey = `${selectedCell.col}${selectedCell.row}`
    try {
      const sampleData = sourceData.value[0] || {}
      const result = evaluateFormula(cellFormula.value, sampleData)
      renderedData[cellKey] = String(result)
      ElMessage.success('公式应用成功')
    } catch (error) {
      renderedData[cellKey] = cellFormula.value
      ElMessage.warning('作为普通文本保存')
    }
  }
}

// 🧮 公式计算核心功能

// 处理字段拖拽到公式栏
const handleFormulaDrop = (event: DragEvent) => {
  event.preventDefault()
  isFormulaDragOver.value = false
  
  try {
    const fieldData = event.dataTransfer?.getData('application/json')
    if (fieldData) {
      const field = JSON.parse(fieldData) as FieldInfo
      
      // 在光标位置插入字段引用
      const input = event.target as HTMLInputElement
      const cursorPos = input.selectionStart || 0
      const beforeText = cellFormula.value.substring(0, cursorPos)
      const afterText = cellFormula.value.substring(cursorPos)
      
      const fieldReference = `\${${field.name}}`
      cellFormula.value = beforeText + fieldReference + afterText
      
      ElMessage.success(`字段 "${field.label}" 已插入公式`)
      
      // 重新设置光标位置
      setTimeout(() => {
        const newPos = cursorPos + fieldReference.length
        input.setSelectionRange(newPos, newPos)
        input.focus()
      }, 0)
    }
  } catch (error) {
    console.error('公式拖拽处理失败:', error)
    ElMessage.error('字段插入失败')
  }
}

// 获取公式预览结果
const getFormulaPreview = (): string => {
  if (!cellFormula.value) return ''
  
  try {
    // 如果当前是列标题，则使用第一行数据进行预览
    const sampleData = sourceData.value[0] || {}
    const result = evaluateFormula(cellFormula.value, sampleData)
    return String(result)
  } catch (error) {
    return '公式错误'
  }
}

// 公式计算引擎
const evaluateFormula = (formula: string, data: any): any => {
  let expression = formula.trim()
  
  // 如果不是公式（不包含${}），直接返回原值
  if (!expression.includes('${')) {
    return expression
  }
  
  // 替换字段引用 ${field_name} 为实际值
  originalFields.value.forEach(field => {
    const fieldRef = `\${${field.name}}`
    if (expression.includes(fieldRef)) {
      const value = data[field.name]
      
      if (field.type === 'number') {
        expression = expression.replace(new RegExp(`\\$\\{${field.name}\\}`, 'g'), String(value || 0))
      } else {
        expression = expression.replace(new RegExp(`\\$\\{${field.name}\\}`, 'g'), `"${value || ''}"`)
      }
    }
  })
  
  // 安全计算表达式
  try {
    // 只允许安全的数学运算和比较
    const safeExpression = expression.replace(/[^0-9+\-*/().,\s"<>=!&|]/g, '')
    return new Function('return ' + safeExpression)()
  } catch (error) {
    throw new Error('公式计算错误')
  }
}

// 应用公式到列
const applyFormulaToColumn = (col: string, formula: string) => {
  console.log(`🧮 应用公式到列 ${col}:`, formula)
  
  // 保存列公式
  columnFormulas[col] = formula
  
  // 对所有数据行应用公式
  sourceData.value.forEach((row, index) => {
    const rowNum = index + 3 // 从第3行开始
    const cellKey = `${col}${rowNum}`
    
    try {
      const result = evaluateFormula(formula, row)
      if (typeof result === 'number') {
        renderedData[cellKey] = result.toLocaleString()
      } else {
        renderedData[cellKey] = String(result)
      }
    } catch (error) {
      renderedData[cellKey] = 'ERROR'
    }
  })
  
  ElMessage.success(`列 ${col} 公式应用完成`)
}

// 选中列标题时的处理
const selectColumnHeader = (col: string) => {
  currentEditingColumn.value = col
  selectedCell.col = col
  selectedCell.row = 2 // 表头行
  selectedCell.ref = `${col}2`
  
  // 如果该列有公式，显示在公式栏
  if (columnFormulas[col]) {
    cellFormula.value = columnFormulas[col]
  } else if (columnFieldMap[col]) {
    // 如果有字段绑定，显示字段引用
    cellFormula.value = `\${${columnFieldMap[col].name}}`
  } else {
    cellFormula.value = ''
  }
  
  ElMessage.info(`选中列 ${col}，可在公式栏编辑列公式`)
}

const handleScroll = (event: any) => {
  // 同步行标题与单元格的垂直滚动
  if (rowHeadersRef.value && cellsAreaRef.value) {
    rowHeadersRef.value.scrollTop = cellsAreaRef.value.scrollTop
  }
}

const handleFieldDragStart = (event: DragEvent, field: FieldInfo, type: 'original' | 'computed') => {
  if (event.dataTransfer) {
    const dragData = {
      ...field,
      fieldType: type
    }
    event.dataTransfer.setData('application/json', JSON.stringify(dragData))
    event.dataTransfer.effectAllowed = 'copy'
    console.log('🔥 开始拖拽字段:', field.label)
  }
}

const handleColumnDrop = (event: DragEvent, col: string) => {
  event.preventDefault()
  isDragOverColumn.value = null
  
  try {
    const fieldData = event.dataTransfer?.getData('application/json')
    if (fieldData) {
      const field = JSON.parse(fieldData) as FieldInfo
      
      // 绑定字段到列
      columnFieldMap[col] = field
      
      console.log(`✅ 字段 "${field.label}" 已绑定到列 ${col}`)
      ElMessage.success(`字段 "${field.label}" 已绑定到 ${col} 列`)
      
      // 立即渲染数据到该列
      renderColumnData(col, field)
    }
  } catch (error) {
    console.error('拖拽处理失败:', error)
    ElMessage.error('字段绑定失败')
  }
}

// 单独渲染列数据
const renderColumnData = (col: string, field: FieldInfo) => {
  console.log(`🔄 渲染列 ${col} 的数据，字段:`, field.label)
  
  sourceData.value.forEach((row, index) => {
    const rowNum = index + 3 // 从第3行开始（第1行标题，第2行表头）
    const cellKey = `${col}${rowNum}`
    
    const value = row[field.name]
    if (value !== undefined && value !== null) {
      if (field.type === 'number' && typeof value === 'number') {
        renderedData[cellKey] = value.toLocaleString()
      } else {
        renderedData[cellKey] = String(value)
      }
    } else {
      renderedData[cellKey] = ''
    }
  })
  
  console.log(`✅ 列 ${col} 数据渲染完成`)
}

// 拖拽悬停处理
const handleDragOver = (event: DragEvent, col: string) => {
  event.preventDefault()
  isDragOverColumn.value = col
}

const handleDragEnter = (event: DragEvent, col: string) => {
  event.preventDefault()
  isDragOverColumn.value = col
}

const handleDragLeave = (event: DragEvent, col: string) => {
  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect()
  const x = event.clientX
  const y = event.clientY
  
  if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
    isDragOverColumn.value = null
  }
}

const removeColumnField = (col: string) => {
  delete columnFieldMap[col]
  // 清除该列的渲染数据
  allRows.value.forEach(row => {
    delete renderedData[`${col}${row}`]
  })
}

const updateRender = async () => {
  rendering.value = true
  try {
    // 重新渲染数据
    await new Promise(resolve => setTimeout(resolve, 500))
    ElMessage.success('数据渲染完成')
  } catch (error: any) {
    ElMessage.error('渲染失败: ' + error.message)
  } finally {
    rendering.value = false
  }
}

const createComputedField = () => {
  if (!canCreateField.value) return
  
  // 验证表达式
  try {
    const testRow = sourceData.value[0] || {}
    evaluateExpression(computedFieldForm.expression, testRow)
  } catch (error: any) {
    ElMessage.error('表达式错误: ' + error.message)
    return
  }
  
  const newField: ComputedFieldInfo = {
    id: Date.now(),
    name: 'computed_' + Date.now(),
    label: computedFieldForm.label,
    expression: computedFieldForm.expression,
    type: computedFieldForm.type,
    fieldType: 'computed'
  }
  
  computedFields.value.push(newField)
  resetComputedForm()
  ElMessage.success(`计算字段 "${newField.label}" 创建成功`)
}

const editComputedField = (field: ComputedFieldInfo) => {
  computedFieldForm.label = field.label
  computedFieldForm.expression = field.expression
  computedFieldForm.type = field.type
  
  deleteComputedField(field.id)
}

const deleteComputedField = (fieldId: number) => {
  const index = computedFields.value.findIndex(f => f.id === fieldId)
  if (index > -1) {
    computedFields.value.splice(index, 1)
    ElMessage.success('计算字段已删除')
  }
}

const resetComputedForm = () => {
  computedFieldForm.label = ''
  computedFieldForm.expression = ''
  computedFieldForm.type = 'string'
}

const evaluateExpression = (expression: string, row: any): any => {
  let expr = expression
  
  originalFields.value.forEach(field => {
    const regex = new RegExp(`\\b${field.name}\\b`, 'g')
    const value = row[field.name]
    
    if (typeof value === 'string') {
      expr = expr.replace(regex, `"${value}"`)
    } else {
      expr = expr.replace(regex, String(value))
    }
  })
  
  try {
    return new Function('return ' + expr)()
  } catch (error) {
    throw new Error('表达式执行失败')
  }
}

// Excel工具栏方法
const toggleBold = () => {
  cellFormat.bold = !cellFormat.bold
  applyCurrentFormatToCell()
}

const toggleItalic = () => {
  cellFormat.italic = !cellFormat.italic
  applyCurrentFormatToCell()
}

const toggleUnderline = () => {
  cellFormat.underline = !cellFormat.underline
  applyCurrentFormatToCell()
}

const setBorderStyle = (style: 'all' | 'outer' | 'none') => {
  cellFormat.borderStyle = style
  applyCurrentFormatToCell()
}

const clearAll = () => {
  // 清空所有数据
  Object.keys(renderedData).forEach(key => {
    delete renderedData[key]
  })
  ElMessage.success('表格已清空')
}

const handleSave = async () => {
  saving.value = true
  try {
    // 保存逻辑
    await new Promise(resolve => setTimeout(resolve, 1000))
    ElMessage.success('报表保存成功')
  } catch (error) {
    ElMessage.error('保存失败')
  } finally {
    saving.value = false
  }
}

// 生命周期
onMounted(async () => {
  console.log('🚀 Excel报表设计器启动')
  
  // 强制显示右侧面板
  rightPanelVisible.value = true
  
  // 默认选择月度统计数据源
  selectedDataSource.value = 'visit_stat_monthly'
  
  // 立即加载模拟数据
  loadMockData()
  console.log('✅ 模拟数据已加载 - 字段数:', originalFields.value.length)
  
  // 异步尝试加载真实数据源
  setTimeout(async () => {
    try {
      await loadAvailableDataSources()
      if (selectedDataSource.value && !originalFields.value.length) {
        await loadDataSource()
      }
    } catch (error) {
      console.log('使用模拟数据作为默认数据源')
    }
  }, 500)
  
  // 初始化滚动同步
  if (cellsAreaRef.value && rowHeadersRef.value) {
    cellsAreaRef.value.addEventListener('scroll', () => {
      if (rowHeadersRef.value && cellsAreaRef.value) {
        rowHeadersRef.value.scrollTop = cellsAreaRef.value.scrollTop
      }
    })
  }
})

const dataFilter = ref('')
const filteredData = computed(() => {
  return sourceData.value.filter(row => {
    return Object.values(row).some(value => {
      return String(value).toLowerCase().includes(dataFilter.value.toLowerCase())
    })
  })
})

// 应用数据过滤
const applyDataFilter = () => {
  // 这里可以添加更多的过滤逻辑
  console.log('过滤条件:', dataFilter.value)
}

// 单元格拖拽处理
const handleCellDragOver = (event: DragEvent, rowIndex: number, col: string) => {
  event.preventDefault()
  if (filteredData.value.length === 1) {
    isDragOverColumn.value = col
  }
}

const handleCellDrop = (event: DragEvent, rowIndex: number, col: string) => {
  event.preventDefault()
  isDragOverColumn.value = null
  
  try {
    const dragData = event.dataTransfer?.getData('application/json')
    if (dragData) {
      const data = JSON.parse(dragData)
      
      // 处理组件拖拽
      if (data.type === 'component') {
        const cellRef = `${col}${rowIndex}`
        handleComponentDrop(data, cellRef)
        return
      }
      
      // 处理字段拖拽（原有逻辑）
      if (filteredData.value.length !== 1) {
        ElMessage.warning('只有过滤到单条数据时才能拖拽到单元格，请使用过滤功能')
        return
      }
      
      const field = data as FieldInfo
      
      // 获取单条数据的字段值
      const singleRow = filteredData.value[0]
      const cellRef = `${col}${rowIndex}`
      const fieldValue = singleRow[field.name]
      
      // 直接设置单元格值
      renderedData[cellRef] = String(fieldValue || '')
      
      ElMessage.success(`字段 "${field.label}" 的值 "${fieldValue}" 已填入 ${cellRef} 单元格`)
    }
  } catch (error) {
    console.error('拖拽处理失败:', error)
    ElMessage.error('拖拽处理失败')
  }
}

// 处理组件拖拽到单元格
const handleComponentDrop = (componentData: any, cellRef: string) => {
  const { componentType, componentName } = componentData
  
  switch (componentType) {
    case 'text':
      renderedData[cellRef] = '文本内容'
      break
    case 'table':
      renderedData[cellRef] = '[表格]'
      break
    case 'chart':
      renderedData[cellRef] = '[图表]'
      break
    case 'image':
      renderedData[cellRef] = '[图片]'
      break
    default:
      renderedData[cellRef] = `[${componentName}]`
  }
  
  ElMessage.success(`组件 "${componentName}" 已插入到 ${cellRef} 单元格`)
}

const insertRowAbove = () => {
  // 实现插入行上方的逻辑
  contextMenu.visible = false
  ElMessage.success('已在上方插入行')
}

const insertRowBelow = () => {
  // 实现插入行下方的逻辑
  contextMenu.visible = false
  ElMessage.success('已在下方插入行')
}

const insertColumnLeft = () => {
  // 实现插入列左侧的逻辑
  contextMenu.visible = false
  ElMessage.success('已在左侧插入列')
}

const insertColumnRight = () => {
  // 实现插入列右侧的逻辑
  contextMenu.visible = false
  ElMessage.success('已在右侧插入列')
}

const deleteRow = () => {
  // 实现删除行的逻辑
  const row = selectedCell.row
  allRows.value.forEach(r => {
    allColumns.value.forEach(col => {
      if (r === row) {
        delete renderedData[`${col}${r}`]
      }
    })
  })
  contextMenu.visible = false
  ElMessage.success(`已删除第 ${row} 行`)
}

const deleteColumn = () => {
  // 实现删除列的逻辑
  const col = selectedCell.col
  allRows.value.forEach(row => {
    delete renderedData[`${col}${row}`]
  })
  delete columnFieldMap[col]
  contextMenu.visible = false
  ElMessage.success(`已删除 ${col} 列`)
}

const formatCell = () => {
  // 使用当前单元格格式初始化对话框
  formatDialog.form.fontFamily = currentFont.value
  formatDialog.form.fontSize = fontSize.value
  formatDialog.form.color = cellFormat.color
  formatDialog.form.backgroundColor = cellFormat.backgroundColor
  formatDialog.form.textAlign = cellFormat.textAlign
  formatDialog.form.bold = cellFormat.bold
  formatDialog.form.italic = cellFormat.italic
  formatDialog.form.underline = cellFormat.underline
  
  formatDialog.visible = true
  contextMenu.visible = false
}

const clearCell = () => {
  const cellKey = `${selectedCell.col}${selectedCell.row}`
  delete renderedData[cellKey]
  contextMenu.visible = false
  ElMessage.success('已清除单元格内容')
}

// 📋 单元格合并功能
const mergeCells = () => {
  if (selectedCells.value.length < 2) {
    ElMessage.warning('请选择多个单元格进行合并')
    return
  }
  
  // 计算合并范围
  const startCell = selectedCells.value[0]
  const endCell = selectedCells.value[selectedCells.value.length - 1]
  
  // 创建合并单元格记录
  const mergeKey = `${startCell.col}${startCell.row}`
  const rowspan = Math.abs(endCell.row - startCell.row) + 1
  const colspan = Math.abs(getColumnIndex(endCell.col) - getColumnIndex(startCell.col)) + 1
  
  mergedCells[mergeKey] = {
    rowspan,
    colspan,
    startRow: Math.min(startCell.row, endCell.row),
    startCol: startCell.col < endCell.col ? startCell.col : endCell.col,
    endRow: Math.max(startCell.row, endCell.row),
    endCol: startCell.col > endCell.col ? startCell.col : endCell.col
  }
  
  // 保留第一个单元格的内容，清空其他单元格
  const firstCellKey = mergeKey
  const firstCellValue = renderedData[firstCellKey] || ''
  
  selectedCells.value.forEach((cell, index) => {
    const cellKey = `${cell.col}${cell.row}`
    if (index === 0) {
      // 保留第一个单元格的内容
      renderedData[cellKey] = firstCellValue
    } else {
      // 清空其他单元格
      delete renderedData[cellKey]
    }
  })
  
  clearSelection()
  ElMessage.success(`已合并 ${rowspan}x${colspan} 单元格`)
}

// 拆分单元格
const splitCells = () => {
  const cellKey = `${selectedCell.col}${selectedCell.row}`
  
  if (mergedCells[cellKey]) {
    delete mergedCells[cellKey]
    ElMessage.success('已拆分单元格')
  } else {
    ElMessage.warning('当前单元格未合并')
  }
  contextMenu.visible = false
}

// 获取下一列
const getNextColumn = (col: string): string => {
  const index = allColumns.value.findIndex(c => c === col)
  return allColumns.value[index + 1] || col
}

// 获取列索引
const getColumnIndex = (col: string): number => {
  return allColumns.value.findIndex(c => c === col)
}

const handleCellDragEnter = (event: DragEvent, rowIndex: number, col: string) => {
  event.preventDefault()
  if (filteredData.value.length === 1) {
    isDragOverColumn.value = col
  }
}

const handleCellDragLeave = (event: DragEvent, rowIndex: number, col: string) => {
  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect()
  const x = event.clientX
  const y = event.clientY
  
  if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
    isDragOverColumn.value = null
  }
}

const isCellDropReady = (rowIndex: number, col: string): boolean => {
  return isDragOverColumn.value === col && filteredData.value.length === 1
}

const contextMenu = reactive({
  visible: false,
  x: 0,
  y: 0
})

// 剪贴板数据
const clipboard = reactive({
  hasData: false,
  data: [] as any[],
  type: 'single' as 'single' | 'range'
})

const formatDialog = reactive({
  visible: false,
  form: {
    fontFamily: 'Microsoft YaHei',
    fontSize: 12,
    color: '#000000',
    backgroundColor: '#ffffff',
    textAlign: 'left',
    bold: false,
    italic: false,
    underline: false
  }
})

const applyFormat = () => {
  formatDialog.visible = false
  // 应用格式设置
  cellFormat.color = formatDialog.form.color
  cellFormat.backgroundColor = formatDialog.form.backgroundColor
  cellFormat.bold = formatDialog.form.bold
  cellFormat.italic = formatDialog.form.italic
  cellFormat.underline = formatDialog.form.underline
  cellFormat.textAlign = formatDialog.form.textAlign as 'left' | 'center' | 'right'
}

const copyCell = () => {
  const cellKey = `${selectedCell.col}${selectedCell.row}`
  const cellValue = renderedData[cellKey] || ''
  clipboard.hasData = true
  // 这里可以使用navigator.clipboard.writeText(cellValue)
  contextMenu.visible = false
  ElMessage.success('已复制单元格内容')
}

const pasteCell = () => {
  if (!clipboard.hasData) return
  // 这里可以使用navigator.clipboard.readText()来粘贴
  const cellKey = `${selectedCell.col}${selectedCell.row}`
  renderedData[cellKey] = '粘贴的内容' // 示例
  contextMenu.visible = false
  ElMessage.success('已粘贴到单元格')
}

// 右键菜单处理
const handleCellRightClick = (event: MouseEvent, row: number, col: string) => {
  event.preventDefault()
  
  // 如果点击的单元格不在当前选择范围内，选择该单元格
  if (!isCellInSelection(row, col)) {
    selectCell(row, col) // 内部调用，不需要event参数
  }
  
  contextMenu.x = event.clientX
  contextMenu.y = event.clientY
  contextMenu.visible = true
  
  // 点击其他地方隐藏菜单
  const hideMenu = () => {
    contextMenu.visible = false
    document.removeEventListener('click', hideMenu)
  }
  setTimeout(() => {
    document.addEventListener('click', hideMenu)
  }, 0)
}

// 组件拖拽处理
const handleComponentDragStart = (event: DragEvent, component: any) => {
  if (event.dataTransfer) {
    event.dataTransfer.setData('component', JSON.stringify(component))
  }
}

// 在当前选中单元格插入组件
const insertComponentAtCursor = (component: any) => {
  const cellKey = `${selectedCell.col}${selectedCell.row}`
  renderedData[cellKey] = `[${component.name}]`
  ElMessage.success(`已插入${component.name}组件`)
}

// 格式化单元格值
const formatCellValue = (value: string): string => {
  // 数字检测
  if (!isNaN(Number(value)) && value.trim() !== '') {
    const num = Number(value)
    // 如果是整数，不显示小数点
    if (Number.isInteger(num)) {
      return num.toLocaleString()
    } else {
      return num.toFixed(2)
    }
  }
  
  // 日期检测
  const date = new Date(value)
  if (!isNaN(date.getTime()) && (value.includes('-') || value.includes('/'))) {
    return date.toLocaleDateString('zh-CN')
  }
  
  // 普通文本
  return value
}

// 简单表达式计算引擎
const evaluateSimpleExpression = (expr: string): number => {
  // 替换单元格引用为实际值
  let expression = expr.toUpperCase()
  
  // 处理单元格引用 (如 A1, B2)
  const cellRefRegex = /([A-Z]+)(\d+)/g
  expression = expression.replace(cellRefRegex, (match, col, row) => {
    const cellValue = getCellValue(parseInt(row), col)
    const numValue = parseFloat(cellValue) || 0
    return numValue.toString()
  })
  
  // 处理基本数学运算
  try {
    // 安全的表达式计算，只允许数字和基本运算符
    const safeExpr = expression.replace(/[^0-9+\-*/().\s]/g, '')
    return new Function('return ' + safeExpr)()
  } catch (error) {
    throw new Error('无效的表达式')
  }
}

// 🔧 列宽行高调整功能
const startResize = (event: MouseEvent, type: 'column' | 'row', target: string | number) => {
  event.preventDefault()
  event.stopPropagation()
  
  const currentSize = type === 'column' 
    ? columnWidths[target as string] || defaultColumnWidth
    : rowHeights[target as number] || defaultRowHeight
  
  resizing.value = {
    type,
    target,
    startX: event.clientX,
    startY: event.clientY,
    startSize: currentSize
  }
  
  // 添加全局鼠标事件监听
  document.addEventListener('mousemove', handleResize)
  document.addEventListener('mouseup', stopResize)
  
  // 添加拖拽样式
  document.body.style.cursor = type === 'column' ? 'col-resize' : 'row-resize'
  document.body.style.userSelect = 'none'
}

const handleResize = (event: MouseEvent) => {
  if (!resizing.value) return
  
  const { type, target, startX, startY, startSize } = resizing.value
  
  if (type === 'column') {
    const deltaX = event.clientX - startX
    const newWidth = Math.max(30, startSize + deltaX) // 最小宽度30px
    columnWidths[target as string] = newWidth
  } else {
    const deltaY = event.clientY - startY
    const newHeight = Math.max(15, startSize + deltaY) // 最小高度15px
    rowHeights[target as number] = newHeight
  }
}

const stopResize = () => {
  resizing.value = null
  document.removeEventListener('mousemove', handleResize)
  document.removeEventListener('mouseup', stopResize)
  
  // 恢复样式
  document.body.style.cursor = ''
  document.body.style.userSelect = ''
}

// 自适应列宽
const autoFitColumn = (col: string) => {
  // 计算该列内容的最大宽度
  let maxWidth = 60 // 最小宽度
  
  allRows.value.forEach(row => {
    const cellValue = getCellValue(row, col)
    if (cellValue) {
      // 简单估算文本宽度 (每个字符约8px)
      const textWidth = cellValue.length * 8 + 20 // 加上padding
      maxWidth = Math.max(maxWidth, textWidth)
    }
  })
  
  columnWidths[col] = Math.min(maxWidth, 300) // 最大宽度300px
  ElMessage.success(`列 ${col} 已自适应宽度`)
}

const canMerge = computed(() => {
  return selectedCells.value.length > 1
})

const canSplit = computed(() => {
  return selectedCells.value.length === 1
})

const selectAll = () => {
  selectionRange.start = { row: 1, col: 'A' }
  selectionRange.end = { row: allRows.value[allRows.value.length - 1], col: allColumns.value[allColumns.value.length - 1] }
  selectionRange.active = true
  ElMessage.success('已全选所有单元格')
}

const clearSelection = () => {
  selectionRange.active = false
  selectedCell.row = 1
  selectedCell.col = 'A'
  selectedCell.ref = 'A1'
  ElMessage.success('已清除选择')
}

const mergeSelectedCells = () => {
  // 这里需要选择区域，先用当前选中单元格作为示例
  const startRow = Math.min(...selectedCells.value.map(cell => cell.row))
  const endRow = Math.max(...selectedCells.value.map(cell => cell.row))
  const startCol = selectedCells.value[0].col
  const endCol = selectedCells.value[selectedCells.value.length - 1].col
  
  const mergeKey = `${startCol}${startRow}`
  
  mergedCells[mergeKey] = {
    rowspan: endRow - startRow + 1,
    colspan: getColumnIndex(endCol) - getColumnIndex(startCol) + 1,
    startRow,
    startCol,
    endRow,
    endCol
  }
  
  contextMenu.visible = false
  ElMessage.success(`已合并单元格 ${startCol}${startRow}:${endCol}${endRow}`)
}

const splitSelectedCells = () => {
  const cellKey = `${selectedCell.col}${selectedCell.row}`
  
  if (mergedCells[cellKey]) {
    delete mergedCells[cellKey]
    ElMessage.success('已拆分单元格')
  } else {
    ElMessage.warning('当前单元格未合并')
  }
  contextMenu.visible = false
}

const setAlignment = (alignment: 'left' | 'center' | 'right') => {
  cellFormat.textAlign = alignment
  applyCurrentFormatToCell()
  ElMessage.success(`已应用${alignment}对齐方式`)
}

// 🖱️ 鼠标拖拽选择功能
const startCellSelection = (event: MouseEvent, row: number, col: string) => {
  // 如果按住Shift键，扩展现有选择
  if (event.shiftKey && selectionRange.active) {
    selectionRange.end = { row, col }
    return
  }
  
  // 否则开始新的选择
  event.preventDefault()
  selectionRange.start = { row, col }
  selectionRange.end = { row, col }
  selectionRange.active = true
  selectionRange.selecting = true
  
  selectedCell.row = row
  selectedCell.col = col
  selectedCell.ref = `${col}${row}`
  
  // 添加全局事件监听
  document.addEventListener('mouseup', endCellSelection)
  document.body.style.userSelect = 'none'
}

const handleCellMouseEnter = (event: MouseEvent, row: number, col: string) => {
  // 只在拖拽选择时才处理
  if (!selectionRange.selecting) return
  
  selectionRange.end = { row, col }
}

const endCellSelection = () => {
  selectionRange.selecting = false
  document.removeEventListener('mouseup', endCellSelection)
  document.body.style.userSelect = ''
  
  // 如果选择了范围，更新公式栏显示范围信息
  if (selectedCells.value.length > 1) {
    const startCell = selectionRange.start
    const endCell = selectionRange.end
    cellFormula.value = `范围: ${startCell.col}${startCell.row}:${endCell.col}${endCell.row} (${selectedCells.value.length} 个单元格)`
  } else {
    // 单个单元格，显示其内容
    const cellKey = `${selectionRange.start.col}${selectionRange.start.row}`
    cellFormula.value = renderedData[cellKey] || ''
  }
}

// 应用格式到选中的单元格
const applyFormatToSelectedCells = () => {
  const cells = selectedCells.value.length > 0 ? selectedCells.value : [{ row: selectedCell.row, col: selectedCell.col }]
  
  cells.forEach(cell => {
    const cellKey = `${cell.col}${cell.row}`
    if (!cellFormatMap[cellKey]) {
      cellFormatMap[cellKey] = {}
    }
    
    // 应用当前格式到单元格
    Object.assign(cellFormatMap[cellKey], {
      fontFamily: currentFont.value,
      fontSize: fontSize.value,
      bold: cellFormat.bold,
      italic: cellFormat.italic,
      underline: cellFormat.underline,
      color: cellFormat.color,
      backgroundColor: cellFormat.backgroundColor,
      textAlign: cellFormat.textAlign
    })
  })
}

// 简化的格式应用函数
const applyCurrentFormatToCell = () => {
  selectedCells.value.forEach(cell => {
    const cellKey = `${cell.col}${cell.row}`
    cellFormatMap[cellKey] = { ...cellFormat }
  })
}

// 🎯 新增功能实现

// 插入表格功能
const showInsertTableDialog = () => {
  insertTableDialog.value = true
  // 初始化表格数据
  insertTableForm.data = Array(insertTableForm.rows).fill(null).map(() => 
    Array(insertTableForm.cols).fill('')
  )
}

const insertTable = () => {
  const startRow = selectedCell.row
  const startColIndex = getColumnIndex(selectedCell.col)
  
  // 插入表格数据到单元格
  insertTableForm.data.forEach((row, rowIndex) => {
    row.forEach((cellValue, colIndex) => {
      const targetRow = startRow + rowIndex
      const targetCol = allColumns.value[startColIndex + colIndex]
      if (targetCol) {
        const cellKey = `${targetCol}${targetRow}`
        renderedData[cellKey] = cellValue
      }
    })
  })
  
  insertTableDialog.value = false
  ElMessage.success(`已插入 ${insertTableForm.rows}x${insertTableForm.cols} 表格`)
}

// 绑定数据集到表格
const bindDatasetToTable = () => {
  if (sourceData.value.length === 0) {
    ElMessage.warning('请先加载数据源')
    return
  }
  
  const startRow = selectedCell.row
  const startColIndex = getColumnIndex(selectedCell.col)
  
  // 插入表头
  if (insertTableForm.hasHeader) {
    originalFields.value.forEach((field, index) => {
      const targetCol = allColumns.value[startColIndex + index]
      if (targetCol) {
        const cellKey = `${targetCol}${startRow}`
        renderedData[cellKey] = field.label
      }
    })
  }
  
  // 插入数据
  const dataStartRow = insertTableForm.hasHeader ? startRow + 1 : startRow
  sourceData.value.slice(0, 10).forEach((rowData, rowIndex) => { // 限制10行数据
    originalFields.value.forEach((field, colIndex) => {
      const targetCol = allColumns.value[startColIndex + colIndex]
      if (targetCol) {
        const cellKey = `${targetCol}${dataStartRow + rowIndex}`
        renderedData[cellKey] = String(rowData[field.name] || '')
      }
    })
  })
  
  insertTableDialog.value = false
  ElMessage.success('数据集已绑定到表格')
}

// 导出功能
const showExportDialog = () => {
  exportDialog.value = true
}

const exportReport = async () => {
  try {
    if (exportForm.format === 'xlsx') {
      await exportToExcel()
    } else if (exportForm.format === 'pdf') {
      await exportToPDF()
    }
    exportDialog.value = false
  } catch (error) {
    console.error('导出失败:', error)
    ElMessage.error('导出失败')
  }
}

const exportToExcel = async () => {
  // 使用动态导入避免打包体积过大
  const XLSX = await import('xlsx')
  
  const worksheet = XLSX.utils.aoa_to_sheet([])
  const workbook = XLSX.utils.book_new()
  
  // 收集要导出的数据
  const exportData: any[][] = []
  const maxRow = Math.max(...Object.keys(renderedData).map(key => {
    const match = key.match(/([A-Z]+)(\d+)/)
    return match ? parseInt(match[2]) : 0
  }))
  
  for (let row = 1; row <= maxRow; row++) {
    const rowData: any[] = []
    allColumns.value.forEach(col => {
      const cellKey = `${col}${row}`
      rowData.push(renderedData[cellKey] || '')
    })
    exportData.push(rowData)
  }
  
  const ws = XLSX.utils.aoa_to_sheet(exportData)
  XLSX.utils.book_append_sheet(workbook, ws, '报表')
  XLSX.writeFile(workbook, `${exportForm.filename}.xlsx`)
  
  ElMessage.success('Excel导出成功')
}

const exportToPDF = async () => {
  // 使用html2canvas和jsPDF进行PDF导出
  const html2canvas = await import('html2canvas')
  const jsPDF = await import('jspdf')
  
  const canvas = await html2canvas.default(document.querySelector('.excel-table') as HTMLElement)
  const imgData = canvas.toDataURL('image/png')
  
  const pdf = new jsPDF.jsPDF()
  const imgWidth = 210
  const pageHeight = 295
  const imgHeight = (canvas.height * imgWidth) / canvas.width
  let heightLeft = imgHeight
  
  let position = 0
  
  pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
  heightLeft -= pageHeight
  
  while (heightLeft >= 0) {
    position = heightLeft - imgHeight
    pdf.addPage()
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
    heightLeft -= pageHeight
  }
  
  pdf.save(`${exportForm.filename}.pdf`)
  ElMessage.success('PDF导出成功')
}

// 复制选择范围
const copySelection = () => {
  const data = selectedCells.value.map(cell => {
    const cellKey = `${cell.col}${cell.row}`
    return renderedData[cellKey] || ''
  })
  
  // 保存到剪贴板数据
  clipboard.data = data
  clipboard.hasData = true
  clipboard.type = 'range'
  
  ElMessage.success(`已复制 ${selectedCells.value.length} 个单元格`)
}

// 删除选择范围
const deleteSelection = () => {
  selectedCells.value.forEach(cell => {
    const cellKey = `${cell.col}${cell.row}`
    delete renderedData[cellKey]
  })
  
  ElMessage.success(`已删除 ${selectedCells.value.length} 个单元格内容`)
}

// 检查单元格是否被合并
const isCellMerged = (row: number, col: string): boolean => {
  return Object.values(mergedCells).some(merge => {
    const colIndex = getColumnIndex(col)
    const startColIndex = getColumnIndex(merge.startCol)
    const endColIndex = getColumnIndex(merge.endCol)
    
    return row >= merge.startRow && 
           row <= merge.endRow && 
           colIndex >= startColIndex && 
           colIndex <= endColIndex &&
           !(row === merge.startRow && col === merge.startCol) // 不是起始单元格
  })
}

// 获取合并单元格信息
const getMergedCellInfo = (row: number, col: string) => {
  const cellKey = `${col}${row}`
  return mergedCells[cellKey]
}
</script>

<style scoped lang="scss">
// Excel主题色彩
$excel-green: #107c41;
$excel-dark-green: #0e6b37;
$excel-light-gray: #f8f9fa;
$excel-border-color: #d1d5db;
$excel-selected-blue: #0078d4;
$excel-header-bg: #f3f4f6;
$excel-toolbar-bg: #f7f7f7;

.report-designer {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: white;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

// 顶部工具栏 - Excel风格
.designer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 16px;
  background: $excel-green;
  color: white;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  z-index: 20;

  .header-left {
  display: flex;
    align-items: center;
    gap: 16px;

    .report-title {
      font-size: 16px;
      font-weight: 600;
      color: white;
    }
  }

  .excel-btn {
    background: rgba(255,255,255,0.1);
    border: 1px solid rgba(255,255,255,0.2);
    color: white;
    
    &:hover {
      background: rgba(255,255,255,0.2);
      border-color: rgba(255,255,255,0.3);
    }
    
    &.el-button--success {
      background: rgba(34, 197, 94, 0.8);
      border-color: rgba(34, 197, 94, 0.9);
    }
    
    &.el-button--primary {
      background: rgba(59, 130, 246, 0.8);
      border-color: rgba(59, 130, 246, 0.9);
    }
  }
}

// Excel工具栏组
.excel-toolbars {
  background: $excel-toolbar-bg;
  border-bottom: 2px solid $excel-border-color;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  z-index: 15;
}

// 主工具栏
.main-toolbar {
  padding: 8px 16px;

.toolbar-group {
  display: flex;
  align-items: center;
    gap: 16px;
    flex-wrap: wrap;
  }

  .toolbar-section {
    display: flex;
    align-items: center;
    gap: 6px;

    label {
      font-size: 12px;
      color: #374151;
      font-weight: 500;
    }
    
    .section-label {
      font-size: 11px;
      color: #6b7280;
      font-weight: 600;
      margin-right: 8px;
      white-space: nowrap;
    }
  }
  
  /* 工具栏组件区域 */
  .components-toolbar {
    .toolbar-components {
      display: flex;
      gap: 4px;
      align-items: center;
    }
    
    .toolbar-component-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 6px 8px;
      background: white;
      border: 1px solid $excel-border-color;
      border-radius: 4px;
      cursor: pointer;
      transition: all 0.2s;
      min-width: 50px;
      height: 50px;
      user-select: none;
      position: relative;
      
      &:hover {
        background: #e5f3ff;
        border-color: $excel-selected-blue;
        transform: translateY(-1px);
        box-shadow: 0 2px 6px rgba(0, 120, 212, 0.2);
      }
      
      &:active {
        transform: translateY(0);
        box-shadow: 0 1px 3px rgba(0, 120, 212, 0.3);
      }
      
      .el-icon {
        font-size: 18px;
        color: $excel-selected-blue;
        margin-bottom: 2px;
      }
      
      span {
        font-size: 9px;
        color: #374151;
        font-weight: 500;
        line-height: 1;
        text-align: center;
      }
      
      /* 拖拽时的样式 */
      &[draggable="true"] {
        cursor: grab;
        
        &:active {
          cursor: grabbing;
        }
      }
      
      /* 添加拖拽提示 */
      &::after {
        content: '';
        position: absolute;
        top: 2px;
        right: 2px;
        width: 6px;
        height: 6px;
        background: #10b981;
        border-radius: 50%;
        opacity: 0;
        transition: opacity 0.2s;
      }
      
      &:hover::after {
        opacity: 1;
      }
    }
  }

  .toolbar-divider {
    width: 1px;
    height: 32px;
    background: $excel-border-color;
    margin: 0 8px;
  }

  .toolbar-btn, .format-btn, .border-btn, .align-btn {
    background: white;
    border: 1px solid $excel-border-color;
    color: #374151;
    font-weight: 500;
    min-width: 32px;
    height: 32px;
    
    &:hover {
      background: #e5f3ff;
      border-color: $excel-selected-blue;
      color: $excel-selected-blue;
    }
    
    &.is-active {
      background: $excel-selected-blue;
      border-color: $excel-selected-blue;
      color: white;
    }
  }

  .render-btn {
    background: $excel-green;
    border-color: $excel-green;
    color: white;
    font-weight: 600;
    padding: 0 16px;
    
    &:hover {
      background: $excel-dark-green;
      border-color: $excel-dark-green;
    }
  }

  .excel-select {
    :deep(.el-input__wrapper) {
      border: 1px solid $excel-border-color;
      border-radius: 4px;
      
      &:hover {
        border-color: $excel-selected-blue;
      }
    }
  }

  .color-picker {
    :deep(.el-color-picker__trigger) {
      border: 1px solid $excel-border-color;
      border-radius: 4px;
      width: 32px;
      height: 32px;
    }
  }
}

// 公式栏
.formula-bar {
  display: flex;
  align-items: center;
  background: white;
  border-bottom: 1px solid $excel-border-color;
  padding: 4px 8px;
  height: 32px;
  
  .name-box {
    width: 80px;
    margin-right: 8px;
    
    .name-input {
      width: 100%;
      height: 24px;
      border: 1px solid $excel-border-color;
      border-radius: 3px;
      padding: 0 6px;
      font-size: 12px;
      background: white;
      text-align: center;
      font-weight: 600;
      
      &:focus {
        outline: none;
        border-color: $excel-selected-blue;
        box-shadow: 0 0 0 1px rgba(0, 120, 212, 0.2);
      }
    }
  }
  
  .fx-label {
    width: 24px;
    height: 24px;
    background: $excel-light-gray;
    border: 1px solid $excel-border-color;
    border-radius: 3px 0 0 3px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    font-weight: 600;
    color: #666;
  }
  
  .formula-input-container {
    flex: 1;
    display: flex;
    align-items: center;
    position: relative;
    
    .formula-input {
      flex: 1;
      height: 24px;
      border: 1px solid $excel-border-color;
      border-left: none;
      border-radius: 0;
      padding: 0 8px;
      font-size: 12px;
      font-family: 'Consolas', 'Monaco', monospace;
      
      &:focus {
        outline: none;
        border-color: $excel-selected-blue;
        box-shadow: 0 0 0 1px rgba(0, 120, 212, 0.2);
      }
      
      &.formula-drag-over {
        border-color: #f59e0b;
        background: #fef3c7;
        box-shadow: 0 0 0 1px rgba(245, 158, 11, 0.5);
      }
      
      &::placeholder {
        color: #9ca3af;
        font-style: italic;
      }
    }
    
    .apply-formula-btn {
      height: 24px;
      margin-left: 8px;
      border-radius: 0 3px 3px 0;
      padding: 0 12px;
      font-size: 11px;
      background: $excel-green;
      border-color: $excel-green;
      
      &:hover {
        background: $excel-dark-green;
        border-color: $excel-dark-green;
      }
    }
  }
  
  .formula-help {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background: #f8fafc;
    border: 1px solid $excel-border-color;
    border-top: none;
  padding: 4px 8px;
    font-size: 11px;
    color: #6b7280;
    z-index: 10;
    
    .formula-preview {
      color: $excel-green;
      font-weight: 600;
    }
  }
}

// 主体区域
.designer-body {
  flex: 1;
  display: flex;
  background: white;
  overflow: hidden;
}

// 中央Excel区域
.table-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: white;
  position: relative;
  transition: all 0.3s ease;
  
  &.panel-collapsed {
    margin-right: 0;
    width: 100%; // 确保折叠时占满全宽
  }
}

// Excel表格包装器
.excel-table-wrapper {
  flex: 1;
  overflow: hidden;
  background: white;
  border: 2px solid $excel-border-color;
  border-radius: 0;
  position: relative;
}

// 列标题 - 真正Excel风格
.column-headers {
  display: flex;
  position: sticky;
  top: 0;
  z-index: 10;
  background: $excel-header-bg;
  border-bottom: 2px solid $excel-border-color;

  .corner-cell {
    width: 50px;
    height: 21px;
    border-right: 1px solid $excel-border-color;
    background: $excel-header-bg;
    position: sticky;
    left: 0;
    z-index: 12;
}

.column-header {
    width: 80px;
    min-width: 80px;
    height: 21px;
    border-right: 1px solid $excel-border-color;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 11px;
    font-weight: 600;
    background: $excel-header-bg;
    color: #374151;
    user-select: none;
    cursor: pointer;
    position: relative;
    
    &:hover {
      background: #e5f3ff;
    }
    
    &.selected {
      background: #e3f2fd !important;
      border: 2px solid $excel-selected-blue !important;
      position: relative;
      z-index: 5;
    }
    
    // 🎯 选择范围样式
    &.in-selection {
      background: rgba(64, 158, 255, 0.1) !important;
      border: 1px solid rgba(64, 158, 255, 0.3) !important;
    }
    
    &.selection-start {
      border-top-left-radius: 4px;
      border: 2px solid #1976d2 !important;
    }
    
    &.selection-end {
      border-bottom-right-radius: 4px;
      border: 2px solid #1976d2 !important;
    }
    
    // 合并单元格样式
    &.merged-cell {
      background: #f3e5f5;
      border: 2px solid #9c27b0;
      
      &::after {
        content: '⊞';
        position: absolute;
        top: 2px;
        right: 2px;
        font-size: 8px;
        color: #9c27b0;
        opacity: 0.7;
      }
    }
    
    .resize-handle {
      position: absolute;
      background: transparent;
      z-index: 10;
      
      &.resize-handle-col {
        top: 0;
        right: 0;
        width: 4px;
        height: 100%;
        cursor: col-resize;
        
        &:hover {
          background: rgba(64, 158, 255, 0.5);
        }
      }
      
      &.resize-handle-row {
        bottom: 0;
        left: 0;
        width: 100%;
        height: 4px;
        cursor: row-resize;
        
        &:hover {
          background: rgba(64, 158, 255, 0.5);
        }
      }
    }
  }
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}

.spreadsheet-body {
  display: flex;
  height: calc(100vh - 200px);
  overflow: auto;
}

// 行标题 - 真正Excel风格
.row-headers {
  position: sticky;
  left: 0;
  z-index: 5;
  background: $excel-header-bg;
  overflow-y: hidden;
  scrollbar-width: none;
  -ms-overflow-style: none;
  height: calc(100vh - 200px);
  
  &::-webkit-scrollbar {
    display: none;
}

.row-header {
    width: 50px;
    height: 21px;
    border-right: 1px solid $excel-border-color;
    border-bottom: 1px solid $excel-border-color;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 11px;
    font-weight: 600;
    background: $excel-header-bg;
    color: #374151;
    user-select: none;
    cursor: pointer;
    
    &:hover {
      background: #e5f3ff;
    }
    
    &.selected {
      background: $excel-selected-blue;
      color: white;
    }
  }
}

// 单元格区域
.cells-area {
  flex: 1;
  overflow: auto;
  position: relative;
}

// Excel表格 - 完全Excel风格
.excel-table {
  border-collapse: separate;
  border-spacing: 0;
  table-layout: fixed;
  width: 4000px; // 足够宽以容纳50列
  height: 2100px; // 足够高以容纳100行

  td {
    height: 21px;
    border-right: 1px solid #c0c0c0;
    border-bottom: 1px solid #c0c0c0;
    padding: 0;
    position: relative;
    background: white;
    // 移除固定宽度，让getCellStyle中的width样式生效
    box-sizing: border-box;

    &:hover {
      background: #f8fafc;
    }

    &.selected {
      background: #cce7ff;
      border: 2px solid $excel-selected-blue !important;
      z-index: 3;
      box-shadow: 0 0 0 1px $excel-selected-blue;
    }
    
    // 🎯 选择范围样式 - 与列标题保持一致
    &.in-selection {
      background: rgba(64, 158, 255, 0.1) !important;
      border: 1px solid rgba(64, 158, 255, 0.3) !important;
    }
    
    &.selection-start {
      border-top-left-radius: 4px;
      border: 2px solid #1976d2 !important;
    }
    
    &.selection-end {
      border-bottom-right-radius: 4px;
      border: 2px solid #1976d2 !important;
    }
    
    // 合并单元格样式
    &.merged-cell {
      background: #f3e5f5;
      border: 2px solid #9c27b0;
      
      &::after {
        content: '⊞';
        position: absolute;
        top: 2px;
        right: 2px;
        font-size: 8px;
        color: #9c27b0;
        opacity: 0.7;
      }
    }
  }
}

.cell-content {
  width: 100%;
  height: 100%;
  padding: 1px 4px;
  border: none;
  outline: none;
  font-size: 11px;
  line-height: 19px;
  overflow: hidden;
  white-space: nowrap;
  background: transparent;
  font-family: 'Calibri', 'Segoe UI', sans-serif;
  display: flex;
  align-items: center;
  color: #000;
  position: relative;
  
  &.drop-ready {
    background: #fef3c7 !important;
    border: 1px solid #f59e0b !important;
    
    .drop-hint {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      color: #92400e;
      font-size: 9px;
      font-weight: 600;
      white-space: nowrap;
      pointer-events: none;
    }
  }
}

.cell-input {
  width: 100%;
  height: 100%;
  padding: 1px 4px;
  border: 2px solid $excel-selected-blue;
  outline: none;
  font-size: 11px;
  line-height: 17px;
  background: white;
  font-family: 'Calibri', 'Segoe UI', sans-serif;
  color: #000;
  box-sizing: border-box;
  
  &:focus {
    border-color: $excel-selected-blue;
    box-shadow: 0 0 0 1px rgba(0, 120, 212, 0.2);
  }
}

// 右侧数据源面板
.fixed-right-panel {
  width: 300px;
  background: white;
  border-left: 2px solid $excel-border-color;
  overflow-y: auto;
  padding: 0;
  box-shadow: -2px 0 8px rgba(0,0,0,0.1);
  z-index: 1000;
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  transform: translateX(0);
  transition: transform 0.3s ease;
  box-sizing: border-box;

  &.panel-hidden {
    transform: translateX(100%);
  }

  .panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 20px;
    background: $excel-green;
    color: white;
    border-bottom: 1px solid $excel-border-color;

    .panel-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 600;
      font-size: 16px;

      .el-icon {
        font-size: 18px;
      }
    }

    .close-btn {
      background: rgba(255,255,255,0.1);
      border: 1px solid rgba(255,255,255,0.2);
      color: white;
      
      &:hover {
        background: rgba(255,255,255,0.2);
        border-color: rgba(255,255,255,0.3);
      }
    }
  }

  .panel-content {
    padding: 20px;

    h4 {
      margin: 0 0 12px 0;
      color: #374151;
      font-weight: 600;
      font-size: 14px;
    }

    .data-source-selector {
      margin-bottom: 20px;
      
      .el-select {
        margin-bottom: 10px;
      }
    }

    .binding-status {
      margin-bottom: 20px;

      .binding-list {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .binding-item {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px 12px;
        background: #f8fafc;
        border: 1px solid #e5e7eb;
        border-radius: 4px;

        .col-name {
          font-weight: 600;
          color: #374151;
        }

        .arrow {
          color: #6b7280;
        }

        .field-name {
          flex: 1;
          color: #059669;
          font-weight: 500;
        }

        .remove-binding {
          color: #ef4444;
          
          &:hover {
            background: rgba(239, 68, 68, 0.1);
          }
        }
      }
    }

    .fields-section {
      margin-bottom: 20px;

      .fields-container {
        display: flex;
        flex-direction: column;
        gap: 8px;
        max-height: 250px;
        overflow-y: auto;
      }

      .field-card {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 10px 12px;
        background: #f0f9ff;
        border: 1px solid #0ea5e9;
        border-radius: 6px;
        cursor: move;
        transition: all 0.2s;

        &:hover {
          background: #e0f2fe;
          transform: translateY(-1px);
          box-shadow: 0 2px 8px rgba(14, 165, 233, 0.2);
        }

        .field-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 2px;

          .field-name {
            font-size: 13px;
            color: #374151;
            font-weight: 500;
          }

          .field-type {
            font-size: 10px;
            color: #0ea5e9;
            font-weight: 600;
            text-transform: uppercase;
          }
        }

        .drag-handle {
          color: #0ea5e9;
          font-size: 16px;
        }
      }
    }

    .help-section {
      .help-card {
        padding: 16px;
        background: #fffbeb;
        border: 1px solid #fde68a;
        border-radius: 6px;

        h4 {
          margin-bottom: 12px;
          color: #92400e;
        }

        ol {
          list-style-type: decimal;
          padding-left: 20px;
          margin: 0;
          
          li {
            margin-bottom: 6px;
            font-size: 12px;
            color: #92400e;
            
            &:last-child {
              margin-bottom: 0;
            }
          }
        }
      }
      
      .formula-help-card {
        padding: 16px;
        background: #fffbeb;
        border: 1px solid #fde68a;
        border-radius: 6px;

        h4 {
          margin-bottom: 12px;
          color: #92400e;
        }

        .formula-examples {
          margin-bottom: 16px;

          p {
            margin-bottom: 8px;
            font-size: 12px;
            color: #92400e;
          }

          .formula-example {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 4px;

            code {
              background: #f3f4f6;
              padding: 4px 8px;
              border-radius: 4px;
            }

            .example-desc {
              font-size: 10px;
              color: #6b7280;
            }
          }
        }
      }
    }

    // 🚀 一键完成典型场景
    .scenario-section {
      .scenario-card {
        padding: 16px;
        background: #fffbeb;
        border: 1px solid #fde68a;
        border-radius: 6px;

        h4 {
          margin-bottom: 12px;
          color: #92400e;
        }

        p {
          margin-bottom: 12px;
          font-size: 12px;
          color: #92400e;
        }

        .el-button {
          background: $excel-green;
          border-color: $excel-green;
          color: white;
          font-weight: 600;
          padding: 0 16px;
          
          &:hover {
            background: $excel-dark-green;
            border-color: $excel-dark-green;
          }
        }
      }
    }

    .data-preview-section {
      margin-bottom: 20px;

      .filter-controls {
        display: flex;
        flex-direction: column;
        gap: 8px;

        .filter-tips {
          display: flex;
          align-items: center;
          gap: 4px;
        }
      }

      .data-preview-table {
        margin-top: 8px;
        border: 1px solid #e5e7eb;
        border-radius: 6px;
        overflow: hidden;

        .mini-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 11px;

          .mini-th {
            background: #f8fafc;
            padding: 6px 8px;
            border-bottom: 1px solid #e5e7eb;
            border-right: 1px solid #e5e7eb;
            font-weight: 600;
            color: #374151;
            text-align: left;
            font-size: 10px;
            
            &:last-child {
              border-right: none;
            }
          }

          .mini-td {
            padding: 6px 8px;
            border-bottom: 1px solid #f3f4f6;
            border-right: 1px solid #f3f4f6;
            color: #6b7280;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
            max-width: 80px;
            
            &:last-child {
              border-right: none;
            }
          }

          .mini-tr {
            &:hover {
              background: #f8fafc;
            }
            
            &:last-child .mini-td {
              border-bottom: none;
            }
          }
        }

        .more-data-hint {
          padding: 8px;
          background: #f8fafc;
          font-size: 11px;
          color: #6b7280;
          text-align: center;
          border-top: 1px solid #e5e7eb;
        }
      }
    }

    .drop-hint {
      color: #f59e0b;
      font-size: 10px;
      margin-top: 4px;
    }
  }
}

// 滚动条样式
:deep(.cells-area) {
  &::-webkit-scrollbar {
    width: 16px;
    height: 16px;
  }
  
  &::-webkit-scrollbar-track {
  background: #f1f1f1;
}

  &::-webkit-scrollbar-thumb {
  background: #c1c1c1;
    border-radius: 8px;

    &:hover {
  background: #a8a8a8;
    }
  }
  
  &::-webkit-scrollbar-corner {
    background: #f1f1f1;
  }
}

// 响应式设计
@media (max-width: 1200px) {
  .main-toolbar {
    .toolbar-group {
      gap: 8px;
    }
    
    .toolbar-divider {
      margin: 0 4px;
    }
  }
  
  .right-panel {
    width: 300px;
  }
}

.context-menu {
  position: fixed;
  background: white;
  border: 1px solid #e4e7ed;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  border-radius: 6px;
  padding: 4px 0;
  z-index: 2000;
  min-width: 160px;
  font-size: 13px;

  .menu-item {
    display: flex;
    align-items: center;
    padding: 8px 16px;
    cursor: pointer;
    transition: background 0.2s;
    color: #606266;

    &:hover {
      background: #f5f7fa;
      color: #409eff;
    }
    
    &.disabled {
      color: #c0c4cc;
      cursor: not-allowed;
      
      &:hover {
        background: transparent;
        color: #c0c4cc;
      }
    }

    .el-icon {
      margin-right: 8px;
      font-size: 14px;
    }
    
    span {
      flex: 1;
      white-space: nowrap;
    }
  }

  .menu-divider {
    height: 1px;
    background: #e4e7ed;
    margin: 4px 0;
  }
}

/* 工具栏按钮组样式 */
.cell-actions, .align-actions, .row-col-actions {
  .el-button {
    min-width: 32px;
    padding: 8px 6px;
    
    &:hover {
      background: #e3f2fd;
      border-color: $excel-selected-blue;
      color: $excel-selected-blue;
    }
    
    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }
}
.toolbar-section {
  .section-label {
    font-size: 10px;
    color: #6b7280;
    font-weight: 600;
    margin-right: 6px;
    white-space: nowrap;
    display: block;
    margin-bottom: 2px;
  }
}
</style> 
