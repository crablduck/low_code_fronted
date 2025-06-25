<template>
  <div class="properties-panel" :class="{ 'mobile-panel': isMobile }">
    <!-- 面板头部 -->
    <div class="panel-header">
      <h3 class="panel-title">
        <el-icon><Setting /></el-icon>
        属性配置
      </h3>
      <el-button 
        v-if="selectedItem" 
        text 
        type="danger" 
        @click="handleClose"
        :icon="Close"
        size="small"
      />
    </div>

    <!-- 未选择组件时的提示 -->
    <div v-if="!selectedItem" class="no-selection">
      <el-icon><InfoFilled /></el-icon>
      <p>请选择一个组件进行配置</p>
    </div>

    <!-- 选中组件时的配置面板 -->
    <div v-else class="config-content">
      <!-- Tab 标签页 -->
      <el-tabs v-model="activeTab" class="config-tabs">
        <!-- 基础配置 -->
        <el-tab-pane label="基础配置" name="basic">
          <div class="config-section">
            <el-form label-width="80px" size="small">
              <el-form-item label="组件ID">
                <el-input 
                  v-model="selectedItem.i" 
                  disabled
                  placeholder="组件唯一标识"
                />
              </el-form-item>
              <el-form-item label="组件名称">
                <el-input 
                  v-model="selectedItem.chartConfig.title" 
                  placeholder="请输入组件名称"
                  @input="handleUpdate"
                />
              </el-form-item>
              <el-form-item label="组件类型">
                <el-tag :type="getComponentTypeTag(selectedItem.chartConfig.type)">
                  {{ getComponentTypeName(selectedItem.chartConfig.type) }}
                </el-tag>
              </el-form-item>
              <el-form-item label="描述信息">
                <el-input 
                  v-model="selectedItem.chartConfig.description" 
                  type="textarea"
                  :rows="2"
                  placeholder="请输入组件描述"
                  @input="handleUpdate"
                />
              </el-form-item>
            </el-form>
          </div>
        </el-tab-pane>

        <!-- 数据配置 -->
        <el-tab-pane v-if="isChartComponent || isFilterComponent" label="数据配置" name="data">
          <div class="config-section">
            <el-form label-width="80px" size="small">
              <!-- 数据集选择 -->
              <el-form-item label="数据集">
                <el-select 
                  v-model="selectedItem.chartConfig.datasetId" 
                  placeholder="选择数据集"
                  @change="handleDatasetChange"
                  style="width: 100%"
                  clearable
                >
                  <el-option
                    v-for="dataset in datasets"
                    :key="dataset.id"
                    :label="dataset.name"
                    :value="dataset.id"
                  />
                </el-select>
              </el-form-item>

              <!-- 字段展示区域 -->
              <div v-if="selectedItem.chartConfig.datasetId" class="fields-section">
                <div class="fields-display">
                  <div class="field-category">
                    <h5 class="field-category-title">
                      <el-icon class="metric-icon"><TrendCharts /></el-icon>
                      指标字段 ({{ metricFields.length }})
                    </h5>
                    <div class="field-list">
                      <div 
                        v-for="field in metricFields" 
                        :key="field.fieldName"
                        class="field-item metric-field"
                        draggable="true"
                        @dragstart="handleFieldDragStart(field, 'metric')"
                      >
                        <el-icon class="field-icon"><TrendCharts /></el-icon>
                        <span class="field-name">{{ field.displayName || field.fieldName }}</span>
                        <el-tag size="small" type="success">{{ field.aggregation || 'sum' }}</el-tag>
                      </div>
                      <div v-if="metricFields.length === 0" class="empty-fields">
                        暂无指标字段
                      </div>
                    </div>
                  </div>

                  <div class="field-category">
                    <h5 class="field-category-title">
                      <el-icon class="dimension-icon"><Grid /></el-icon>
                      维度字段 ({{ dimensionFields.length }})
                    </h5>
                    <div class="field-list">
                      <div 
                        v-for="field in dimensionFields" 
                        :key="field.fieldName"
                        class="field-item dimension-field"
                        draggable="true"
                        @dragstart="handleFieldDragStart(field, 'dimension')"
                      >
                        <el-icon class="field-icon"><Grid /></el-icon>
                        <span class="field-name">{{ field.displayName || field.fieldName }}</span>
                        <el-tag size="small" type="info">{{ field.fieldType }}</el-tag>
                      </div>
                      <div v-if="dimensionFields.length === 0" class="empty-fields">
                        暂无维度字段
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 字段映射配置 -->
              <div v-if="selectedItem.chartConfig.datasetId && isChartComponent" class="field-mapping">
                <el-divider content-position="left">字段映射</el-divider>
                
                <el-form-item label="X轴字段" v-if="needsXAxisField">
                  <el-select 
                    v-model="selectedItem.chartConfig.fieldMapping.xAxis" 
                    placeholder="拖拽维度字段到这里或手动选择"
                    @change="handleUpdate"
                    style="width: 100%"
                    clearable
                    @drop="handleFieldDrop($event, 'xAxis')"
                    @dragover="handleDragOver"
                  >
                    <el-option
                      v-for="field in dimensionFields"
                      :key="field.fieldName"
                      :label="field.displayName || field.fieldName"
                      :value="field.fieldName"
                    />
                  </el-select>
                </el-form-item>

                <el-form-item label="Y轴字段" v-if="needsYAxisField">
                  <el-select 
                    v-model="selectedItem.chartConfig.fieldMapping.yAxis" 
                    placeholder="拖拽指标字段到这里或手动选择"
                    @change="handleUpdate"
                    style="width: 100%"
                    clearable
                    @drop="handleFieldDrop($event, 'yAxis')"
                    @dragover="handleDragOver"
                  >
                    <el-option
                      v-for="field in metricFields"
                      :key="field.fieldName"
                      :label="field.displayName || field.fieldName"
                      :value="field.fieldName"
                    />
                  </el-select>
                </el-form-item>

                <el-form-item label="分组字段" v-if="needsSeriesField">
                  <el-select 
                    v-model="selectedItem.chartConfig.fieldMapping.series" 
                    placeholder="拖拽维度字段到这里或手动选择"
                    @change="handleUpdate"
                    style="width: 100%"
                    clearable
                    @drop="handleFieldDrop($event, 'series')"
                    @dragover="handleDragOver"
                  >
                    <el-option
                      v-for="field in dimensionFields"
                      :key="field.fieldName"
                      :label="field.displayName || field.fieldName"
                      :value="field.fieldName"
                    />
                  </el-select>
                </el-form-item>

                <el-form-item label="数值字段" v-if="needsValueField">
                  <el-select 
                    v-model="selectedItem.chartConfig.fieldMapping.value" 
                    placeholder="拖拽指标字段到这里或手动选择"
                    @change="handleUpdate"
                    style="width: 100%"
                    clearable
                    @drop="handleFieldDrop($event, 'value')"
                    @dragover="handleDragOver"
                  >
                    <el-option
                      v-for="field in metricFields"
                      :key="field.fieldName"
                      :label="field.displayName || field.fieldName"
                      :value="field.fieldName"
                    />
                  </el-select>
                </el-form-item>

                <!-- 图表渲染按钮 -->
                <div class="chart-actions">
                  <el-button 
                    type="primary" 
                    @click="renderSingleChart"
                    :disabled="!canRenderChart"
                    icon="View"
                    style="width: 100%"
                  >
                    渲染图表预览
                  </el-button>
                </div>
              </div>

              <!-- 筛选器字段配置 -->
              <div v-if="selectedItem.chartConfig.datasetId && isFilterComponent" class="filter-config">
                <el-divider content-position="left">筛选器配置</el-divider>
                
                <el-form-item label="筛选字段">
                  <el-select 
                    v-model="selectedItem.chartConfig.fieldName" 
                    placeholder="选择筛选字段"
                    @change="handleUpdate"
                    style="width: 100%"
                    clearable
                  >
                    <el-option
                      v-for="field in allFields"
                      :key="field.fieldName"
                      :label="field.displayName || field.fieldName"
                      :value="field.fieldName"
                    >
                      <span>{{ field.displayName || field.fieldName }}</span>
                      <el-tag size="small" style="margin-left: 8px" :type="field.fieldType === 'metric' ? 'success' : 'info'">
                        {{ field.fieldType === 'metric' ? '指标' : '维度' }}
                      </el-tag>
                    </el-option>
                  </el-select>
                </el-form-item>

                <el-form-item label="默认值">
                  <el-input 
                    v-model="selectedItem.chartConfig.defaultValue" 
                    placeholder="设置默认值"
                    @input="handleUpdate"
                  />
                </el-form-item>

                <el-form-item label="是否必选">
                  <el-switch 
                    v-model="selectedItem.chartConfig.required" 
                    @change="handleUpdate"
                  />
                </el-form-item>

                <el-form-item label="多选模式" v-if="selectedItem.chartConfig.type === 'filter-multiselect'">
                  <el-switch 
                    v-model="selectedItem.chartConfig.multiple" 
                    @change="handleUpdate"
                  />
                </el-form-item>
              </div>

              <!-- 全局筛选器绑定配置 -->
              <div v-if="isChartComponent && selectedItem.chartConfig.datasetId" class="chart-filter-config">
                <el-divider content-position="left">全局筛选器绑定</el-divider>
                
                <el-form-item label="启用全局筛选器">
                  <el-switch 
                    v-model="selectedItem.chartConfig.useGlobalFilters" 
                    @change="handleUpdate"
                  />
                  <div class="help-text">开启后，此图表将响应全局筛选器的变化</div>
                </el-form-item>

                <div v-if="selectedItem.chartConfig.useGlobalFilters">
                  <!-- 全局筛选器列表 -->
                  <div v-if="availableGlobalFilters.length === 0" class="no-global-filters">
                    <el-empty 
                      :image-size="80"
                      title="暂无可用的筛选器"
                      description="请先从左侧面板拖拽筛选器组件到设计器中，然后再进行绑定配置"
                    >
                      <el-button type="primary" @click="showGlobalFilterTip">
                        如何添加筛选器？
                      </el-button>
                    </el-empty>
                  </div>

                  <div v-else class="global-filters-binding">
                    <el-form-item label="选择要绑定的筛选器">
                      <div class="global-filters-list">
                        <div 
                          v-for="filter in availableGlobalFilters" 
                          :key="filter.key"
                          class="global-filter-item"
                        >
                          <el-card shadow="never" class="filter-card">
                            <div class="filter-header">
                              <el-checkbox 
                                :model-value="isFilterEnabled(filter.key)"
                                @change="toggleFilterBinding(filter.key, $event)"
                              >
                                <span class="filter-label">{{ filter.label }}</span>
                              </el-checkbox>
                              <el-tag size="small" :type="getFilterControlTypeTag(filter.controlType)">
                                {{ getFilterControlTypeName(filter.controlType) }}
                              </el-tag>
                            </div>
                            
                            <div class="filter-info">
                              <span class="filter-dataset">数据集: {{ getDatasetName(filter.datasetId) }}</span>
                              <span class="filter-field">字段: {{ filter.fieldName }}</span>
                            </div>

                            <!-- 字段映射配置 -->
                            <div v-if="isFilterEnabled(filter.key)" class="field-mapping">
                              <el-form-item label="映射到图表字段" size="small">
                                <el-select 
                                  :model-value="getFilterBinding(filter.key)?.chartField"
                                  @change="updateFilterBinding(filter.key, 'chartField', $event)"
                                  placeholder="选择图表字段"
                                  style="width: 100%"
                                  clearable
                                >
                                  <el-option-group label="维度字段">
                                    <el-option
                                      v-for="field in dimensionFields"
                                      :key="field.fieldName"
                                      :label="field.displayName || field.fieldName"
                                      :value="field.fieldName"
                                    >
                                      <span>{{ field.displayName || field.fieldName }}</span>
                                      <el-tag size="small" style="margin-left: 8px" type="info">
                                        {{ field.dataType }}
                                      </el-tag>
                                    </el-option>
                                  </el-option-group>
                                  <el-option-group label="指标字段">
                                    <el-option
                                      v-for="field in metricFields"
                                      :key="field.fieldName"
                                      :label="field.displayName || field.fieldName"
                                      :value="field.fieldName"
                                    >
                                      <span>{{ field.displayName || field.fieldName }}</span>
                                      <el-tag size="small" style="margin-left: 8px" type="success">
                                        {{ field.dataType }}
                                      </el-tag>
                                    </el-option>
                                  </el-option-group>
                                </el-select>
                              </el-form-item>
                              
                              <!-- 操作符选择 -->
                              <el-form-item label="过滤操作" size="small">
                                <el-select 
                                  :model-value="getFilterBinding(filter.key)?.operator || 'equals'"
                                  @change="updateFilterBinding(filter.key, 'operator', $event)"
                                  placeholder="选择操作符"
                                  style="width: 100%"
                                >
                                  <el-option label="等于" value="equals" />
                                  <el-option label="不等于" value="not_equals" />
                                  <el-option label="包含" value="contains" />
                                  <el-option label="不包含" value="not_contains" />
                                  <el-option label="大于" value="greater_than" />
                                  <el-option label="大于等于" value="greater_than_or_equal" />
                                  <el-option label="小于" value="less_than" />
                                  <el-option label="小于等于" value="less_than_or_equal" />
                                  <el-option label="为空" value="is_null" />
                                  <el-option label="不为空" value="is_not_null" />
                                </el-select>
                              </el-form-item>
                              
                              <!-- 映射说明 -->
                              <div class="mapping-description">
                                <el-text size="small" type="info">
                                  <el-icon><InfoFilled /></el-icon>
                                  {{ getFilterMappingDescription(filter.key) }}
                                </el-text>
                              </div>
                            </div>
                          </el-card>
                        </div>
                      </div>
                    </el-form-item>

                    <!-- 配置预览 -->
                    <div v-if="enabledFilterBindings.length > 0" class="config-preview">
                      <el-divider content-position="left">绑定预览</el-divider>
                      <div class="preview-content">
                        <el-alert
                          title="配置预览"
                          type="info"
                          :closable="false"
                          show-icon
                        >
                          <p>当前图表将响应以下全局筛选器的变化：</p>
                          <ul>
                            <li v-for="binding in enabledFilterBindings" :key="binding.filterKey">
                              <strong>{{ getGlobalFilterLabel(binding.filterKey) }}</strong> 
                              <el-tag size="small" type="primary" style="margin: 0 4px">
                                {{ getOperatorLabel(binding.operator || 'equals') }}
                              </el-tag>
                              <span class="chart-field">{{ getFieldDisplayName(binding.chartField) }}</span>
                            </li>
                          </ul>
                        </el-alert>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 数据刷新设置 -->
              <div v-if="isChartComponent" class="refresh-config">
                <el-divider content-position="left">刷新设置</el-divider>
                
                <el-form-item label="自动刷新">
                  <el-switch 
                    v-model="selectedItem.chartConfig.autoRefresh" 
                    @change="handleUpdate"
                  />
                </el-form-item>
                
                <el-form-item label="刷新间隔" v-if="selectedItem.chartConfig.autoRefresh">
                  <el-select 
                    v-model="selectedItem.chartConfig.refreshInterval" 
                    placeholder="选择刷新间隔"
                    @change="handleUpdate"
                    style="width: 100%"
                  >
                    <el-option label="30秒" :value="30" />
                    <el-option label="1分钟" :value="60" />
                    <el-option label="5分钟" :value="300" />
                    <el-option label="10分钟" :value="600" />
                    <el-option label="30分钟" :value="1800" />
                  </el-select>
                </el-form-item>
              </div>
            </el-form>
          </div>
        </el-tab-pane>

        <!-- 样式配置 -->
        <el-tab-pane label="样式配置" name="style">
          <div class="config-section">
            <el-form label-width="80px" size="small">
              <!-- 标题样式 -->
              <div class="style-group">
                <h5 class="style-group-title">标题样式</h5>
                <el-form-item label="显示标题">
                  <el-switch 
                    v-model="selectedItem.chartConfig.showTitle" 
                    @change="handleUpdate"
                  />
                </el-form-item>

                <div v-if="selectedItem.chartConfig.showTitle">
                  <el-form-item label="标题位置">
                    <el-select 
                      v-model="selectedItem.chartConfig.titlePosition" 
                      @change="handleUpdate"
                      style="width: 100%"
                    >
                      <el-option label="左对齐" value="left" />
                      <el-option label="居中" value="center" />
                      <el-option label="右对齐" value="right" />
                    </el-select>
                  </el-form-item>

                  <el-form-item label="标题字体">
                    <el-input-number 
                      v-model="selectedItem.chartConfig.titleFontSize" 
                      :min="12" 
                      :max="32"
                      @change="handleUpdate"
                      style="width: 100%"
                    />
                  </el-form-item>

                  <el-form-item label="标题颜色">
                    <el-color-picker 
                      v-model="selectedItem.chartConfig.titleColor" 
                      @change="handleUpdate"
                      show-alpha
                    />
                  </el-form-item>
                </div>
              </div>

              <!-- 背景样式 -->
              <div class="style-group">
                <h5 class="style-group-title">背景样式</h5>
                <el-form-item label="背景色">
                  <el-color-picker 
                    v-model="selectedItem.chartConfig.backgroundColor" 
                    @change="handleUpdate"
                    show-alpha
                  />
                </el-form-item>

                <el-form-item label="边框颜色">
                  <el-color-picker 
                    v-model="selectedItem.chartConfig.borderColor" 
                    @change="handleUpdate"
                    show-alpha
                  />
                </el-form-item>

                <el-form-item label="边框宽度">
                  <el-input-number 
                    v-model="selectedItem.chartConfig.borderWidth" 
                    :min="0" 
                    :max="10"
                    @change="handleUpdate"
                    style="width: 100%"
                  />
                </el-form-item>

                <el-form-item label="圆角半径">
                  <el-input-number 
                    v-model="selectedItem.chartConfig.borderRadius" 
                    :min="0" 
                    :max="20"
                    @change="handleUpdate"
                    style="width: 100%"
                  />
                </el-form-item>

                <el-form-item label="内边距">
                  <el-input-number 
                    v-model="selectedItem.chartConfig.padding" 
                    :min="0" 
                    :max="50"
                    @change="handleUpdate"
                    style="width: 100%"
                  />
                </el-form-item>
              </div>

              <!-- 图表特定样式 -->
              <div v-if="isChartComponent" class="style-group">
                <h5 class="style-group-title">图表样式</h5>
                <el-form-item label="显示图例">
                  <el-switch 
                    v-model="selectedItem.chartConfig.showLegend" 
                    @change="handleUpdate"
                  />
                </el-form-item>

                <el-form-item label="图例位置" v-if="selectedItem.chartConfig.showLegend">
                  <el-select 
                    v-model="selectedItem.chartConfig.legendPosition" 
                    @change="handleUpdate"
                    style="width: 100%"
                  >
                    <el-option label="顶部" value="top" />
                    <el-option label="底部" value="bottom" />
                    <el-option label="左侧" value="left" />
                    <el-option label="右侧" value="right" />
                  </el-select>
                </el-form-item>

                <el-form-item label="显示网格">
                  <el-switch 
                    v-model="selectedItem.chartConfig.showGrid" 
                    @change="handleUpdate"
                  />
                </el-form-item>

                <el-form-item label="显示工具栏">
                  <el-switch 
                    v-model="selectedItem.chartConfig.showToolbox" 
                    @change="handleUpdate"
                  />
                </el-form-item>

                <el-form-item label="主题色">
                  <el-color-picker 
                    v-model="selectedItem.chartConfig.themeColor" 
                    @change="handleUpdate"
                    show-alpha
                  />
                </el-form-item>

                <el-form-item label="启用动画">
                  <el-switch 
                    v-model="selectedItem.chartConfig.enableAnimation" 
                    @change="handleUpdate"
                  />
                </el-form-item>
              </div>
            </el-form>
          </div>
        </el-tab-pane>

        <!-- 高级配置 -->
        <el-tab-pane label="高级配置" name="advanced">
          <div class="config-section">
            <el-form label-width="80px" size="small">
              <!-- 筛选器联动 -->
              <div v-if="isChartComponent" class="advanced-group">
                <h5 class="advanced-group-title">筛选器联动</h5>
                <el-form-item label="启用联动">
                  <el-switch 
                    v-model="selectedItem.chartConfig.useGlobalFilters" 
                    @change="handleUpdate"
                  />
                </el-form-item>

                <div v-if="selectedItem.chartConfig.useGlobalFilters">
                  <el-form-item label="绑定筛选器">
                    <el-select 
                      v-model="selectedItem.chartConfig.globalFilterBindings" 
                      multiple
                      placeholder="选择要绑定的筛选器"
                      @change="handleUpdate"
                      style="width: 100%"
                    >
                      <el-option
                        v-for="filter in availableGlobalFilters"
                        :key="filter.key"
                        :label="filter.label"
                        :value="filter.key"
                      />
                    </el-select>
                  </el-form-item>
                </div>
              </div>

              <!-- 布局设置 -->
              <div class="advanced-group">
                <h5 class="advanced-group-title">布局设置</h5>
                <el-form-item label="层级">
                  <el-input-number 
                    v-model="selectedItem.chartConfig.zIndex" 
                    :min="0" 
                    :max="1000"
                    @change="handleUpdate"
                    style="width: 100%"
                  />
                </el-form-item>

                <el-form-item label="透明度">
                  <el-slider 
                    v-model="selectedItem.chartConfig.opacity" 
                    :min="0" 
                    :max="1"
                    :step="0.1"
                    @change="handleUpdate"
                    style="width: 100%"
                  />
                </el-form-item>

                <el-form-item label="响应式">
                  <el-switch 
                    v-model="selectedItem.chartConfig.responsive" 
                    @change="handleUpdate"
                  />
                </el-form-item>

                <el-form-item label="允许拖拽">
                  <el-switch 
                    v-model="selectedItem.chartConfig.draggable" 
                    @change="handleUpdate"
                  />
                </el-form-item>

                <el-form-item label="允许调整大小">
                  <el-switch 
                    v-model="selectedItem.chartConfig.resizable" 
                    @change="handleUpdate"
                  />
                </el-form-item>
              </div>

              <!-- 性能设置 -->
              <div class="advanced-group">
                <h5 class="advanced-group-title">性能设置</h5>
                <el-form-item label="数据限制">
                  <el-input-number 
                    v-model="selectedItem.chartConfig.dataLimit" 
                    :min="10" 
                    :max="10000"
                    :step="10"
                    @change="handleUpdate"
                    style="width: 100%"
                  />
                </el-form-item>

                <el-form-item label="启用缓存">
                  <el-switch 
                    v-model="selectedItem.chartConfig.enableCache" 
                    @change="handleUpdate"
                  />
                </el-form-item>

                <el-form-item label="缓存时间" v-if="selectedItem.chartConfig.enableCache">
                  <el-select 
                    v-model="selectedItem.chartConfig.cacheTime" 
                    @change="handleUpdate"
                    style="width: 100%"
                  >
                    <el-option label="1分钟" :value="60" />
                    <el-option label="5分钟" :value="300" />
                    <el-option label="10分钟" :value="600" />
                    <el-option label="30分钟" :value="1800" />
                    <el-option label="1小时" :value="3600" />
                  </el-select>
                </el-form-item>
              </div>
            </el-form>
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { 
  Setting, 
  Close, 
  InfoFilled, 
  DataAnalysis, 
  Filter, 
  Brush,
  TrendCharts,
  Grid,
  View
} from '@element-plus/icons-vue'
import type { DataSet, DataSetField } from '@/shared/types/dataManagement'
import type { LayoutItem, GlobalFilterConfig, GlobalFilterBinding } from '@/shared/types/dashboard'
import { getDatasetDetail } from '@/api/dataset'

// Props
const props = defineProps<{
  selectedItem: LayoutItem | null
  datasets: DataSet[]
  layout: LayoutItem[]
  isMobile?: boolean
}>()

// Emits
const emit = defineEmits<{
  update: [item: LayoutItem]
  close: []
}>()

// 活动标签页
const activeTab = ref('basic')

// 本地状态管理
const datasetFields = ref<DataSetField[]>([])
const loading = ref(false)

// 字段分类
const metricFields = computed(() => {
  return datasetFields.value.filter((field: DataSetField) => field.fieldType === 'metric')
})

const dimensionFields = computed(() => {
  return datasetFields.value.filter((field: DataSetField) => field.fieldType === 'dimension')
})

const allFields = computed(() => {
  return [...metricFields.value, ...dimensionFields.value]
})

// 加载数据集字段
const loadDatasetFields = async (datasetId: string | number) => {
  try {
    loading.value = true
    console.log('开始加载数据集字段:', datasetId)
    
    // 首先尝试从数据集对象中获取字段
    const dataset = props.datasets.find(d => d.id === Number(datasetId))
    if (dataset && dataset.fields && dataset.fields.length > 0) {
      datasetFields.value = dataset.fields
      console.log('从数据集对象加载字段:', dataset.fields.length, '个字段')
      return
    }

    // 如果数据集对象中没有字段，调用API获取
    try {
      const response = await getDatasetDetail(Number(datasetId))
      // 根据实际API响应结构调整
      if (response && response.data) {
        // 检查分页格式的响应
        if (response.data.content && Array.isArray(response.data.content)) {
          datasetFields.value = response.data.content as DataSetField[]
          console.log('从API加载字段（分页格式）:', response.data.content.length, '个字段')
        } else if (Array.isArray(response.data)) {
          datasetFields.value = response.data as DataSetField[]
          console.log('从API加载字段（数组格式）:', response.data.length, '个字段')
        } else {
          console.warn('API响应中没有找到字段数据，使用模拟数据')
          throw new Error('No fields found in API response')
        }
      } else {
        console.warn('API返回的字段为空，使用模拟数据')
        // 使用模拟字段数据
        datasetFields.value = [
          { 
            id: 1, datasetId: Number(datasetId), fieldName: 'date', displayName: '日期', fieldType: 'dimension', 
            isVisible: true, sortOrder: 1, dataType: 'date'
          },
          { 
            id: 2, datasetId: Number(datasetId), fieldName: 'category', displayName: '类别', fieldType: 'dimension', 
            isVisible: true, sortOrder: 2, dataType: 'string'
          },
          { 
            id: 3, datasetId: Number(datasetId), fieldName: 'region', displayName: '地区', fieldType: 'dimension', 
            isVisible: true, sortOrder: 3, dataType: 'string'
          },
          { 
            id: 4, datasetId: Number(datasetId), fieldName: 'value', displayName: '数值', fieldType: 'metric', 
            isVisible: true, sortOrder: 4, dataType: 'number', aggregation: 'sum'
          },
          { 
            id: 5, datasetId: Number(datasetId), fieldName: 'count', displayName: '计数', fieldType: 'metric', 
            isVisible: true, sortOrder: 5, dataType: 'number', aggregation: 'count'
          },
          { 
            id: 6, datasetId: Number(datasetId), fieldName: 'revenue', displayName: '收入', fieldType: 'metric', 
            isVisible: true, sortOrder: 6, dataType: 'number', aggregation: 'sum'
          }
        ]
        console.log('使用模拟字段数据:', datasetFields.value.length, '个字段')
      }
    } catch (apiError: any) {
      console.warn('API加载字段失败，使用模拟数据:', apiError.message)
      // 使用模拟字段数据
      datasetFields.value = [
        { 
          id: 1, datasetId: Number(datasetId), fieldName: 'date', displayName: '日期', fieldType: 'dimension', 
          isVisible: true, sortOrder: 1, dataType: 'date'
        },
        { 
          id: 2, datasetId: Number(datasetId), fieldName: 'category', displayName: '类别', fieldType: 'dimension', 
          isVisible: true, sortOrder: 2, dataType: 'string'
        },
        { 
          id: 3, datasetId: Number(datasetId), fieldName: 'region', displayName: '地区', fieldType: 'dimension', 
          isVisible: true, sortOrder: 3, dataType: 'string'
        },
        { 
          id: 4, datasetId: Number(datasetId), fieldName: 'value', displayName: '数值', fieldType: 'metric', 
          isVisible: true, sortOrder: 4, dataType: 'number', aggregation: 'sum'
        },
        { 
          id: 5, datasetId: Number(datasetId), fieldName: 'count', displayName: '计数', fieldType: 'metric', 
          isVisible: true, sortOrder: 5, dataType: 'number', aggregation: 'count'
        },
        { 
          id: 6, datasetId: Number(datasetId), fieldName: 'revenue', displayName: '收入', fieldType: 'metric', 
          isVisible: true, sortOrder: 6, dataType: 'number', aggregation: 'sum'
        }
      ]
      console.log('使用模拟字段数据:', datasetFields.value.length, '个字段')
    }
  } catch (error: any) {
    console.error('加载数据集字段失败:', error)
    ElMessage.error('加载数据集字段失败: ' + (error.message || '未知错误'))
    datasetFields.value = []
  } finally {
    loading.value = false
  }
}

// 组件类型判断
const isChartComponent = computed(() => {
  if (!props.selectedItem) return false
  const type = props.selectedItem.chartConfig.type
  return ['bar', 'line', 'pie', 'table', 'area', 'scatter', 'radar', 'gauge', 'funnel', 'heatmap', 'treemap', 'liquidfill'].includes(type)
})

const isFilterComponent = computed(() => {
  if (!props.selectedItem) return false
  const type = props.selectedItem.chartConfig.type
  return type.startsWith('filter-')
})

// 字段需求判断
const needsXAxisField = computed(() => {
  if (!props.selectedItem) return false
  const type = props.selectedItem.chartConfig.type
  return ['bar', 'line', 'area', 'scatter'].includes(type)
})

const needsYAxisField = computed(() => {
  if (!props.selectedItem) return false
  const type = props.selectedItem.chartConfig.type
  return ['bar', 'line', 'area', 'scatter'].includes(type)
})

const needsSeriesField = computed(() => {
  if (!props.selectedItem) return false
  const type = props.selectedItem.chartConfig.type
  return ['bar', 'line', 'area', 'pie'].includes(type)
})

const needsValueField = computed(() => {
  if (!props.selectedItem) return false
  const type = props.selectedItem.chartConfig.type
  return ['pie', 'gauge', 'funnel', 'liquidfill'].includes(type)
})

// 判断是否可以渲染图表
const canRenderChart = computed(() => {
  if (!props.selectedItem || !isChartComponent.value) return false
  
  const config = props.selectedItem.chartConfig
  if (!config.datasetId) return false
  
  const fieldMapping = config.fieldMapping
  const type = config.type
  
  // 根据图表类型检查必需字段
  switch (type) {
    case 'bar':
    case 'line':
    case 'area':
    case 'scatter':
      return !!(fieldMapping?.xAxis && fieldMapping?.yAxis)
    case 'pie':
    case 'gauge':
    case 'funnel':
      return !!(fieldMapping?.value)
    default:
      return !!config.datasetId
  }
})

// 基于设计器中的筛选器组件动态生成全局筛选器配置
const availableGlobalFilters = computed<GlobalFilterConfig[]>(() => {
  // 从layout中筛选出筛选器组件
  const filterComponents = props.layout.filter(item => 
    item.chartConfig.type.startsWith('filter-')
  )
  
  console.log('检测到的筛选器组件:', filterComponents.length, '个')
  
  // 转换为全局筛选器配置
  return filterComponents.map(item => {
    const config = item.chartConfig
    
    // 根据筛选器类型确定controlType
    const getControlType = (type: string): GlobalFilterConfig['controlType'] => {
      switch (type) {
        case 'filter-select': return 'select'
        case 'filter-multiselect': return 'multiSelect'
        case 'filter-date': return 'date'
        case 'filter-daterange': return 'dateRange'
        case 'filter-slider': return 'slider'
        case 'filter-input': return 'input'
        default: return 'select'
      }
    }
    
    return {
      key: item.i, // 使用组件ID作为key
      label: config.title || config.label || `筛选器${item.i}`,
      datasetId: config.datasetId || 0,
      fieldName: config.fieldName || '',
      controlType: getControlType(config.type),
      required: config.required || false,
      placeholder: config.placeholder || '',
      defaultValue: config.defaultValue,
      options: config.options || []
    } as GlobalFilterConfig
  })
})

// 组件类型名称映射
const getComponentTypeName = (type: string) => {
  const typeNames: Record<string, string> = {
    'bar': '柱状图',
    'line': '折线图',
    'pie': '饼图',
    'table': '表格',
    'area': '面积图',
    'scatter': '散点图',
    'radar': '雷达图',
    'gauge': '仪表盘',
    'funnel': '漏斗图',
    'heatmap': '热力图',
    'treemap': '矩形树图',
    'liquidfill': '水波图',
    'filter-select': '下拉筛选器',
    'filter-multiselect': '多选筛选器',
    'filter-date': '日期筛选器',
    'filter-daterange': '日期范围筛选器',
    'filter-slider': '滑动筛选器',
    'filter-input': '输入筛选器',
    'text-title': '标题文本',
    'text-content': '内容文本',
    'image': '图片'
  }
  return typeNames[type] || type
}

// 组件类型标签类型
const getComponentTypeTag = (type: string) => {
  if (type.startsWith('filter-')) return 'warning'
  if (type.startsWith('text-')) return 'info'
  if (type === 'image') return 'info'
  return 'primary'
}

// 数据集变更处理
const handleDatasetChange = async (datasetId: number) => {
  if (!props.selectedItem) return
  
  try {
    // 清空字段映射
    if (props.selectedItem.chartConfig.fieldMapping) {
      props.selectedItem.chartConfig.fieldMapping = {}
    }
    
    // 加载数据集字段
    await loadDatasetFields(datasetId)
    
    // 自动切换到数据配置tab以便查看字段
    activeTab.value = 'data'
    
    // 更新选中项
    handleUpdate()
    
    ElMessage.success('数据集已更新，请查看字段配置')
  } catch (error) {
    console.error('加载数据集字段失败:', error)
    ElMessage.error('加载数据集字段失败')
  }
}

// 字段拖拽开始
const handleFieldDragStart = (field: DataSetField, fieldType: 'metric' | 'dimension') => {
  // 存储拖拽的字段信息
  const dragData = {
    fieldName: field.fieldName,
    displayName: field.displayName,
    fieldType: fieldType
  }
  
  // 设置拖拽数据
  const event = window.event as DragEvent
  event.dataTransfer?.setData('application/json', JSON.stringify(dragData))
}

// 拖拽悬停
const handleDragOver = (event: DragEvent) => {
  event.preventDefault()
}

// 字段拖拽放置
const handleFieldDrop = (event: DragEvent, targetField: string) => {
  event.preventDefault()
  
  try {
    const dragData = event.dataTransfer?.getData('application/json')
    if (!dragData || !props.selectedItem) return
    
    const fieldInfo = JSON.parse(dragData)
    
    // 确保字段映射对象存在
    if (!props.selectedItem.chartConfig.fieldMapping) {
      props.selectedItem.chartConfig.fieldMapping = {}
    }
    
    // 设置字段映射
    props.selectedItem.chartConfig.fieldMapping[targetField] = fieldInfo.fieldName
    
    // 更新组件
    handleUpdate()
    
    ElMessage.success(`已将 ${fieldInfo.displayName} 设置为 ${targetField}`)
  } catch (error) {
    console.error('拖拽处理失败:', error)
    ElMessage.error('拖拽处理失败')
  }
}

// 更新处理
const handleUpdate = () => {
  if (props.selectedItem) {
    emit('update', props.selectedItem)
  }
}

// 渲染单个图表
const renderSingleChart = async () => {
  if (!props.selectedItem || !canRenderChart.value) {
    ElMessage.warning('请先完成图表配置')
    return
  }
  
  try {
    const config = props.selectedItem.chartConfig
    
    // 构建过滤条件 - 从全局筛选器获取
    const filters: Array<{
      fieldName: string
      operator: string
      value: any
    }> = []
    
    // 获取当前图表绑定的全局筛选器
    if (config.globalFilterBindings && config.globalFilterBindings.length > 0) {
      for (const binding of config.globalFilterBindings) {
        // 查找对应的筛选器组件
        const filterComponent = props.layout.find(item => 
          item.i === binding.filterKey && item.chartConfig.type.startsWith('filter-')
        )
        
        if (filterComponent && filterComponent.chartConfig.fieldName && binding.chartField && binding.operator) {
          // 获取筛选器的当前值（这里应该获取实际的筛选器值，而不是默认值）
          // TODO: 在实际应用中，这里应该从全局筛选器状态管理中获取当前值
          let filterValue = filterComponent.chartConfig.defaultValue
          
          // 使用用户配置的操作符，而不是硬编码逻辑
          let operator = binding.operator
          
          // 操作符映射：前端操作符 -> API操作符
          const operatorMapping: Record<string, string> = {
            'equals': 'eq',
            'not_equals': 'ne', 
            'contains': 'like',
            'not_contains': 'not_like',
            'greater_than': 'gt',
            'greater_than_or_equal': 'gte',
            'less_than': 'lt',
            'less_than_or_equal': 'lte',
            'is_null': 'is_null',
            'is_not_null': 'is_not_null'
          }
          
          // 转换为API支持的操作符
          const apiOperator = operatorMapping[operator] || 'eq'
          
          // 特殊值处理
          if (operator === 'contains' && filterValue && typeof filterValue === 'string' && !filterValue.includes('%')) {
            filterValue = `%${filterValue}%`
          } else if (operator === 'is_null' || operator === 'is_not_null') {
            filterValue = null
          }
          
          // 条件验证：只有有操作符配置才处理
          if (binding.operator && (filterValue !== null && filterValue !== undefined && filterValue !== '' || operator === 'is_null' || operator === 'is_not_null')) {
            filters.push({
              fieldName: binding.chartField, // 使用绑定的图表字段
              operator: apiOperator,
              value: filterValue
            })
          }
        }
      }
    }
    

    
    console.log('🔍 智能预览过滤器参数构建完成:', {
      totalBindings: config.globalFilterBindings?.length || 0,
      validFilters: filters.length,
      filterDetails: filters.map(f => ({
        field: f.fieldName,
        operator: f.operator,
        value: f.value
      }))
    })
    
    // 调用智能预览接口
    const { smartPreviewDataset } = await import('@/api/dataset')
    
    const previewOptions = {
      filters: filters,
      limit: 50 // 限制50条数据用于预览
    }
    
    console.log('调用智能预览接口:', config.datasetId, previewOptions)
    
    const response = await smartPreviewDataset(config.datasetId, previewOptions)
    
    if (response.code === 200 && response.data) {
      console.log('智能预览响应:', response.data)
      
      // 处理不同的响应数据格式
      let records: any[] = []
      let totalCount = 0
      let columns: string[] = []
      
      const data = response.data as any
      
      if (data.records && Array.isArray(data.records)) {
        // 格式1: { columns: string[], records: any[], totalCount: number }
        records = data.records
        totalCount = data.totalCount || records.length
        columns = data.columns || []
      } else if (data.content && Array.isArray(data.content)) {
        // 格式2: 分页格式 { content: any[], totalElements: number, ... }
        records = data.content
        totalCount = data.totalElements || records.length
        columns = data.columns || []
      } else if (Array.isArray(data)) {
        // 格式3: 直接是数组
        records = data
        totalCount = records.length
        columns = records.length > 0 ? Object.keys(records[0]) : []
      }
      
      // 转换数据格式为图表可用格式
      const chartData = transformSmartPreviewToChartData({ 
        columns, 
        records 
      }, config)
      
      console.log('转换后的图表数据:', chartData)
      
      // 更新图表配置中的数据
      if (!config.chartData) {
        config.chartData = {}
      }
      
      // 强制更新 chartData，确保触发响应式更新
      const oldChartData = config.chartData
      config.chartData = { ...chartData, _timestamp: Date.now() }
      
      console.log('🔄 强制更新图表数据:', {
        oldData: oldChartData,
        newData: config.chartData,
        timestamp: config.chartData._timestamp
      })
      
      // 触发图表更新
      handleUpdate()
      
      ElMessage.success(`图表数据加载成功！共${totalCount}条记录`)
    } else {
      throw new Error(response.message || '获取数据失败')
    }
  } catch (error) {
    console.error('渲染图表失败:', error)
    ElMessage.error(`渲染图表失败: ${error.message}`)
  }
}

// 将智能预览数据转换为图表数据格式
const transformSmartPreviewToChartData = (smartData: any, config: any) => {
  const { columns, records } = smartData
  const { fieldMapping, type } = config
  
  if (!records || !Array.isArray(records) || records.length === 0) {
    return { series: [], categories: [] }
  }
  
  console.log('开始转换数据:', { columns, records: records.length, fieldMapping, type })
  
  switch (type) {
    case 'bar':
    case 'line':
    case 'area':
      return transformToBarLineData(records, fieldMapping)
    case 'pie':
      return transformToPieData(records, fieldMapping)
    case 'scatter':
      return transformToScatterData(records, fieldMapping)
    default:
      return { series: records, categories: columns }
  }
}

// 转换为柱状图/折线图数据
const transformToBarLineData = (records: any[], fieldMapping: any) => {
  const xField = fieldMapping.xAxis
  const yField = fieldMapping.yAxis
  const seriesField = fieldMapping.series
  
  console.log('🔍 柱状图/折线图数据转换调试:')
  console.log('- 字段映射:', fieldMapping)
  console.log('- X轴字段:', xField)
  console.log('- Y轴字段:', yField)
  console.log('- 分组字段:', seriesField)
  console.log('- 原始数据:', records)
  
  if (!xField || !yField) {
    console.log('❌ 缺少必要字段映射，返回空数据')
    return { series: [], categories: [] }
  }
  
  // 提取分类（X轴数据）
  const categories = [...new Set(records.map(record => record[xField]))].filter(Boolean)
  console.log('- 提取的分类:', categories)
  
  if (!seriesField) {
    // 没有分组字段，单系列数据
    const seriesData = categories.map(category => {
      const record = records.find(r => r[xField] === category)
      const value = record ? (record[yField] || 0) : 0
      console.log(`  - ${category}: ${value}`)
      return value
    })
    
    const result = {
      categories,
      series: [{
        name: yField,
        data: seriesData
        // 注意：这里不设置type，由generateEChartsOptionFromChartData根据图表类型设置
      }]
    }
    
    console.log('✅ 单系列转换结果:', result)
    return result
  } else {
    // 有分组字段，多系列数据
    const seriesNames = [...new Set(records.map(record => record[seriesField]))].filter(Boolean)
    console.log('- 分组名称:', seriesNames)
    
    const series = seriesNames.map(seriesName => {
      const seriesData = categories.map(category => {
        const record = records.find(r => r[xField] === category && r[seriesField] === seriesName)
        return record ? (record[yField] || 0) : 0
      })
      
      return {
        name: seriesName,
        data: seriesData
        // 注意：这里不设置type，由generateEChartsOptionFromChartData根据图表类型设置
      }
    })
    
    const result = { categories, series }
    console.log('✅ 多系列转换结果:', result)
    return result
  }
}

// 转换为饼图数据
const transformToPieData = (records: any[], fieldMapping: any) => {
  const nameField = fieldMapping.name || fieldMapping.nameField
  const valueField = fieldMapping.value || fieldMapping.valueField
  
  console.log('🔍 饼图数据转换调试:')
  console.log('- 字段映射:', fieldMapping)
  console.log('- 名称字段:', nameField)
  console.log('- 数值字段:', valueField)
  console.log('- 原始数据:', records)
  
  if (!nameField || !valueField) {
    console.log('❌ 缺少必要字段映射，返回空数据')
    return { series: [] }
  }
  
  const pieData = records.map(record => ({
    name: record[nameField],
    value: record[valueField] || 0
  })).filter(item => item.name && item.value > 0)
  
  console.log('- 转换后的饼图数据:', pieData)
  
  const result = {
    series: [{
      name: '数据',
      type: 'pie',  // 明确设置饼图类型
      data: pieData
    }]
  }
  
  console.log('✅ 饼图转换结果:', result)
  return result
}

// 转换为散点图数据
const transformToScatterData = (records: any[], fieldMapping: any) => {
  const xField = fieldMapping.xAxis
  const yField = fieldMapping.yAxis
  
  if (!xField || !yField) {
    return { series: [] }
  }
  
  const scatterData = records.map(record => [
    record[xField] || 0,
    record[yField] || 0
  ]).filter(point => point[0] !== null && point[1] !== null)
  
  return {
    series: [{
      name: '散点数据',
      data: scatterData
    }]
  }
}

// 关闭面板
const handleClose = () => {
  emit('close')
}

// 辅助函数：获取字段显示名称
const getFieldDisplayName = (fieldName: string) => {
  const field = datasetFields.value.find(f => f.fieldName === fieldName)
  return field?.displayName || fieldName
}

// 辅助函数：获取字段类型
const getFieldType = (fieldName: string) => {
  const field = datasetFields.value.find(f => f.fieldName === fieldName)
  return field?.fieldType || 'dimension'
}

// 全局筛选器相关辅助函数
const enabledFilterBindings = computed(() => {
  if (!props.selectedItem?.chartConfig.globalFilterBindings) return []
  return props.selectedItem.chartConfig.globalFilterBindings
})

const isFilterEnabled = (filterKey: string) => {
  return enabledFilterBindings.value.some(binding => binding.filterKey === filterKey)
}

const getFilterBinding = (filterKey: string) => {
  return enabledFilterBindings.value.find(binding => binding.filterKey === filterKey)
}

const toggleFilterBinding = (filterKey: string, enabled: boolean) => {
  if (!props.selectedItem?.chartConfig.globalFilterBindings) {
    props.selectedItem.chartConfig.globalFilterBindings = []
  }
  
  if (enabled) {
    // 添加绑定
    const newBinding: GlobalFilterBinding = {
      filterKey,
      chartField: ''
    }
    props.selectedItem.chartConfig.globalFilterBindings.push(newBinding)
  } else {
    // 移除绑定
    const index = props.selectedItem.chartConfig.globalFilterBindings.findIndex(
      binding => binding.filterKey === filterKey
    )
    if (index > -1) {
      props.selectedItem.chartConfig.globalFilterBindings.splice(index, 1)
    }
  }
  
  handleUpdate()
}

const updateFilterBinding = (filterKey: string, property: string, value: any) => {
  if (!props.selectedItem?.chartConfig.globalFilterBindings) {
    props.selectedItem.chartConfig.globalFilterBindings = []
  }
  
  const existingBinding = props.selectedItem.chartConfig.globalFilterBindings.find(
    binding => binding.filterKey === filterKey
  )
  
  if (existingBinding) {
    existingBinding[property] = value
  } else {
    const newBinding = {
      filterKey,
      chartField: property === 'chartField' ? value : undefined,
      operator: property === 'operator' ? value : 'equals'
    }
    props.selectedItem.chartConfig.globalFilterBindings.push(newBinding)
  }
  
  handleUpdate()
}

const getGlobalFilterLabel = (filterKey: string) => {
  const filter = availableGlobalFilters.value.find(f => f.key === filterKey)
  return filter?.label || filterKey
}

const getDatasetName = (datasetId: number) => {
  const dataset = props.datasets.find(d => d.id === datasetId)
  return dataset?.name || `数据集${datasetId}`
}

const getFilterControlTypeName = (controlType: string) => {
  const typeNames: Record<string, string> = {
    'select': '下拉选择',
    'multiSelect': '多选',
    'dateRange': '日期范围',
    'date': '单日期',
    'month': '月份',
    'year': '年份',
    'input': '文本输入',
    'number': '数字输入',
    'slider': '滑块',
    'cascade': '联动选择'
  }
  return typeNames[controlType] || controlType
}

const getFilterControlTypeTag = (controlType: string) => {
  const tagTypes: Record<string, string> = {
    'select': 'primary',
    'multiSelect': 'success',
    'dateRange': 'warning',
    'date': 'warning',
    'month': 'warning',
    'year': 'warning',
    'input': 'info',
    'number': 'info',
    'slider': 'danger',
    'cascade': 'primary'
  }
  return tagTypes[controlType] || 'info'
}

const showGlobalFilterTip = () => {
  ElMessage.info('请先从左侧面板拖拽筛选器组件到设计器中，然后回到这里进行图表与筛选器的绑定配置')
}

// 获取筛选器映射描述
const getFilterMappingDescription = (filterKey: string) => {
  const binding = getFilterBinding(filterKey)
  if (!binding?.chartField || !binding?.operator) {
    return '请完成字段映射和操作符配置'
  }
  
  const filter = availableGlobalFilters.value.find(f => f.key === filterKey)
  const operatorMap = {
    'equals': '等于',
    'not_equals': '不等于', 
    'contains': '包含',
    'not_contains': '不包含',
    'greater_than': '大于',
    'greater_than_or_equal': '大于等于',
    'less_than': '小于',
    'less_than_or_equal': '小于等于',
    'is_null': '为空',
    'is_not_null': '不为空'
  }
  
  return `当 ${filter?.label} 的值 ${operatorMap[binding.operator]} 图表的 ${getFieldDisplayName(binding.chartField)} 字段时，图表将自动筛选`
}

// 获取操作符标签
const getOperatorLabel = (operator: string) => {
  const operatorMap = {
    'equals': '等于',
    'not_equals': '不等于', 
    'contains': '包含',
    'not_contains': '不包含',
    'greater_than': '大于',
    'greater_than_or_equal': '大于等于',
    'less_than': '小于',
    'less_than_or_equal': '小于等于',
    'is_null': '为空',
    'is_not_null': '不为空'
  }
  return operatorMap[operator] || operator
}

// 监听选中项变化，只在首次选中时重置标签页
watch(() => props.selectedItem, (newItem, oldItem) => {
  if (newItem) {
    // 只有在选中不同组件时才重置到基础配置
    if (!oldItem || oldItem.i !== newItem.i) {
      activeTab.value = 'basic'
    }
    
    // 确保字段映射对象存在
    if (!newItem.chartConfig.fieldMapping) {
      newItem.chartConfig.fieldMapping = {}
    }
    
    // 确保筛选器默认值对象存在
    if (!newItem.chartConfig.filterDefaults) {
      newItem.chartConfig.filterDefaults = {}
    }
    
    // 如果有数据集ID，加载字段
    if (newItem.chartConfig.datasetId) {
      loadDatasetFields(newItem.chartConfig.datasetId)
    }
  }
}, { immediate: true })
</script>

<style scoped lang="scss">
.properties-panel {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #ffffff;
  border-left: 1px solid #e4e7ed;

  .panel-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px;
    border-bottom: 1px solid #e4e7ed;
    background: #f8f9fa;

    .panel-title {
      margin: 0;
      color: #303133;
      font-size: 16px;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 8px;
    }
  }

  .no-selection {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 200px;
    color: #909399;

    .el-icon {
      font-size: 48px;
      margin-bottom: 16px;
    }

    p {
      margin: 0;
      font-size: 14px;
    }
  }

  .config-content {
    flex: 1;
    overflow: hidden;

    .config-tabs {
      height: 100%;
      
      :deep(.el-tabs__content) {
        height: calc(100% - 40px);
        overflow-y: auto;
        padding: 0;
      }

      :deep(.el-tab-pane) {
        height: 100%;
        overflow-y: auto;
      }
    }

    .config-section {
      padding: 20px;
    }

    // 字段展示样式
    .fields-section {
      margin: 16px 0;
      
      .fields-display {
        border: 1px solid #e4e7ed;
        border-radius: 6px;
        background: #fafafa;
        
        .field-category {
          border-bottom: 1px solid #e4e7ed;
          
          &:last-child {
            border-bottom: none;
          }
          
          .field-category-title {
            margin: 0;
            padding: 12px 16px;
            background: #f0f2f5;
            color: #606266;
            font-size: 14px;
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 8px;
            border-bottom: 1px solid #e4e7ed;
            
            .metric-icon {
              color: #67c23a;
            }
            
            .dimension-icon {
              color: #409eff;
            }
          }
          
          .field-list {
            max-height: 200px;
            overflow-y: auto;
            padding: 8px;
            
            .field-item {
              display: flex;
              align-items: center;
              gap: 8px;
              padding: 8px 12px;
              margin: 4px 0;
              background: #ffffff;
              border: 1px solid #e4e7ed;
              border-radius: 4px;
              cursor: grab;
              transition: all 0.2s ease;
              
              &:hover {
                border-color: #c6e2ff;
                background: #ecf5ff;
              }
              
              &:active {
                cursor: grabbing;
              }
              
              .field-icon {
                font-size: 16px;
              }
              
              .field-name {
                flex: 1;
                font-size: 13px;
                color: #606266;
              }
              
              .el-tag {
                font-size: 11px;
              }
            }
            
            .metric-field {
              .field-icon {
                color: #67c23a;
              }
            }
            
            .dimension-field {
              .field-icon {
                color: #409eff;
              }
            }
            
            .empty-fields {
              padding: 20px;
              text-align: center;
              color: #c0c4cc;
              font-size: 13px;
            }
          }
        }
      }
    }

    // 样式分组
    .style-group,
    .advanced-group {
      margin-bottom: 24px;
      
      .style-group-title,
      .advanced-group-title {
        margin: 0 0 16px 0;
        color: #606266;
        font-size: 14px;
        font-weight: 600;
        padding-bottom: 8px;
        border-bottom: 1px solid #e4e7ed;
      }
    }

    // 图表操作按钮样式
    .chart-actions {
      margin-top: 16px;
      padding-top: 16px;
      border-top: 1px solid #e4e7ed;
      
      .el-button {
        height: 36px;
        font-weight: 500;
      }
    }

    // 筛选器配置样式
    .chart-filter-config,
    .filter-config {
      margin: 16px 0;
      padding: 16px;
      background: #f8f9fa;
      border: 1px solid #e9ecef;
      border-radius: 6px;
      
      .help-text {
        font-size: 12px;
        color: #909399;
        margin-top: 4px;
      }
      
      .no-global-filters {
        text-align: center;
        padding: 20px;
      }
      
      .global-filters-binding {
        .global-filters-list {
          .global-filter-item {
            margin-bottom: 16px;
            
            &:last-child {
              margin-bottom: 0;
            }
            
            .filter-card {
              border: 1px solid #e4e7ed;
              
              &:hover {
                border-color: #c6e2ff;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
              }
              
              .filter-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                margin-bottom: 8px;
                
                .filter-label {
                  font-weight: 600;
                  color: #303133;
                }
              }
              
              .filter-info {
                display: flex;
                flex-direction: column;
                gap: 4px;
                margin-bottom: 12px;
                
                .filter-dataset,
                .filter-field {
                  font-size: 12px;
                  color: #606266;
                }
              }
              
              .field-mapping {
                border-top: 1px solid #f0f0f0;
                padding-top: 12px;
                margin-top: 12px;
              }
            }
          }
        }
        
        .config-preview {
          .preview-content {
            ul {
              margin: 8px 0;
              padding-left: 20px;
              
              li {
                margin: 4px 0;
                font-size: 14px;
                
                .chart-field {
                  color: #409eff;
                  font-weight: 600;
                }
              }
            }
          }
        }
      }
      
      .filter-default-config {
        margin-bottom: 12px;
        
        &:last-child {
          margin-bottom: 0;
        }
        
        :deep(.el-input-group__prepend) {
          background: #f5f7fa;
          border-color: #dcdfe6;
          
          .el-tag {
            margin: 0;
          }
        }
      }
    }

    // 表单样式优化
    :deep(.el-form-item) {
      margin-bottom: 16px;
      
      .el-form-item__label {
        font-size: 13px;
        color: #606266;
      }
      
      .el-input,
      .el-select,
      .el-input-number {
        .el-input__inner {
          font-size: 13px;
        }
      }
    }

    :deep(.el-divider) {
      margin: 20px 0;
      
      .el-divider__text {
        font-size: 13px;
        color: #909399;
      }
    }
  }

  // 移动端适配
  &.mobile-panel {
    position: fixed;
    top: 0;
    right: 0;
    width: 100vw;
    height: 100vh;
    z-index: 2000;
    border-left: none;
    
    .panel-header {
      padding: 12px 16px;
      
      .panel-title {
        font-size: 14px;
      }
    }
    
    .config-content {
      .config-section {
        padding: 16px;
      }
    }
  }
}
</style> 