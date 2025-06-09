<template>
  <div class="function-selector">
    <div class="function-groups">
      <div
        v-for="group in functionGroups"
        :key="group.name"
        class="function-group"
      >
        <div class="group-header">
          <el-icon>
            <component :is="group.icon" />
          </el-icon>
          <span class="group-name">{{ group.name }}</span>
        </div>
        
        <div class="function-list">
          <div
            v-for="func in group.functions"
            :key="func.id"
            class="function-item"
            :class="{ 
              active: selectedFunction === func.id,
              disabled: !isFunctionSupported(func)
            }"
            @click="selectFunction(func)"
          >
            <div class="function-info">
              <div class="function-header">
                <span class="function-name">{{ func.name }}</span>
                <el-tag 
                  size="small" 
                  :type="getFunctionTypeColor(func.id)"
                  class="function-tag"
                >
                  {{ func.id }}
                </el-tag>
              </div>
              
              <div class="function-description">
                {{ func.description }}
              </div>
              
              <div class="function-meta" v-if="func.supportedTypes.length > 0">
                <span class="meta-label">支持类型:</span>
                <div class="supported-types">
                  <el-tag
                    v-for="type in func.supportedTypes"
                    :key="type"
                    size="small"
                    type="info"
                    class="type-tag"
                  >
                    {{ type }}
                  </el-tag>
                </div>
              </div>
              
              <!-- 参数说明 -->
              <div class="function-params" v-if="func.requiresParameters && func.parameters">
                <span class="meta-label">参数:</span>
                <div class="params-list">
                  <div
                    v-for="param in func.parameters"
                    :key="param.name"
                    class="param-item"
                  >
                    <span class="param-name">{{ param.label }}</span>
                    <span class="param-type">({{ param.type }})</span>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- 选中标记 -->
            <div class="function-check" v-if="selectedFunction === func.id">
              <el-icon><Check /></el-icon>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 函数说明面板 -->
    <el-card 
      v-if="selectedFunctionDef" 
      class="function-detail-card"
      shadow="never"
    >
      <template #header>
        <span>函数详情</span>
      </template>
      
      <div class="function-detail">
        <div class="detail-row">
          <span class="detail-label">函数名:</span>
          <span class="detail-value">{{ selectedFunctionDef.name }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">标识符:</span>
          <el-tag size="small" :type="getFunctionTypeColor(selectedFunctionDef.id)">
            {{ selectedFunctionDef.id }}
          </el-tag>
        </div>
        <div class="detail-row">
          <span class="detail-label">描述:</span>
          <span class="detail-value">{{ selectedFunctionDef.description }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">需要参数:</span>
          <el-tag size="small" :type="selectedFunctionDef.requiresParameters ? 'warning' : 'success'">
            {{ selectedFunctionDef.requiresParameters ? '是' : '否' }}
          </el-tag>
        </div>
        
        <!-- 使用示例 -->
        <div class="usage-example" v-if="getUsageExample(selectedFunctionDef)">
          <div class="example-label">使用示例:</div>
          <div class="example-code">{{ getUsageExample(selectedFunctionDef) }}</div>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Check } from '@element-plus/icons-vue'
import { 
  Odometer, 
  TrendCharts, 
  DataAnalysis,
  Document,
  Timer
} from '@element-plus/icons-vue'
import type { DataSetField } from '@/types/dataManagement'
import type { FunctionDefinition, AggregateFunction } from '@/types/data-compute'

// Props & Emits
interface Props {
  selectedFunction: string
  field: DataSetField | null
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:selectedFunction': [func: string]
  'functionChange': [func: string]
}>()

// 函数定义
const functionDefinitions: FunctionDefinition[] = [
  // 基础聚合函数
  {
    id: 'SUM',
    name: '求和',
    description: '计算数值字段的总和',
    supportedTypes: ['number', 'integer', 'decimal'],
    requiresParameters: false
  },
  {
    id: 'AVG',
    name: '平均值',
    description: '计算数值字段的平均值',
    supportedTypes: ['number', 'integer', 'decimal'],
    requiresParameters: false
  },
  {
    id: 'COUNT',
    name: '计数',
    description: '计算记录总数（不包含空值）',
    supportedTypes: ['string', 'number', 'date', 'datetime', 'boolean'],
    requiresParameters: false
  },
  {
    id: 'MAX',
    name: '最大值',
    description: '计算字段的最大值',
    supportedTypes: ['number', 'integer', 'decimal', 'date', 'datetime'],
    requiresParameters: false
  },
  {
    id: 'MIN',
    name: '最小值',
    description: '计算字段的最小值',
    supportedTypes: ['number', 'integer', 'decimal', 'date', 'datetime'],
    requiresParameters: false
  },
  
  // 统计函数
  {
    id: 'MEDIAN',
    name: '中位数',
    description: '计算数值字段的中位数',
    supportedTypes: ['number', 'integer', 'decimal'],
    requiresParameters: false
  },
  {
    id: 'MODE',
    name: '众数',
    description: '计算出现频率最高的值',
    supportedTypes: ['string', 'number'],
    requiresParameters: false
  },
  {
    id: 'STDDEV',
    name: '标准差',
    description: '计算数值字段的标准差',
    supportedTypes: ['number', 'integer', 'decimal'],
    requiresParameters: false
  },
  {
    id: 'VARIANCE',
    name: '方差',
    description: '计算数值字段的方差',
    supportedTypes: ['number', 'integer', 'decimal'],
    requiresParameters: false
  },
  
  // 高级函数
  {
    id: 'PERCENTILE',
    name: '百分位数',
    description: '计算指定百分位数的值',
    supportedTypes: ['number', 'integer', 'decimal'],
    requiresParameters: true,
    parameters: [
      {
        name: 'percentile',
        label: '百分位',
        type: 'number',
        required: true,
        defaultValue: 50,
        min: 0,
        max: 100
      }
    ]
  },
  {
    id: 'RANK',
    name: '排名',
    description: '计算值在数据集中的排名',
    supportedTypes: ['number', 'integer', 'decimal'],
    requiresParameters: true,
    parameters: [
      {
        name: 'order',
        label: '排序方式',
        type: 'select',
        required: true,
        defaultValue: 'desc',
        options: [
          { label: '降序(大到小)', value: 'desc' },
          { label: '升序(小到大)', value: 'asc' }
        ]
      }
    ]
  },
  
  // 其他函数
  {
    id: 'DISTINCT',
    name: '去重计数',
    description: '计算唯一值的数量',
    supportedTypes: ['string', 'number', 'date'],
    requiresParameters: false
  },
  {
    id: 'FIRST',
    name: '第一个值',
    description: '获取第一个非空值',
    supportedTypes: ['string', 'number', 'date', 'datetime'],
    requiresParameters: false
  },
  {
    id: 'LAST',
    name: '最后一个值',
    description: '获取最后一个非空值',
    supportedTypes: ['string', 'number', 'date', 'datetime'],
    requiresParameters: false
  }
]

// 计算属性
const functionGroups = computed(() => [
  {
    name: '基础聚合',
    icon: Odometer,
    functions: functionDefinitions.filter(f => 
      ['SUM', 'AVG', 'COUNT', 'MAX', 'MIN'].includes(f.id)
    )
  },
  {
    name: '统计分析',
    icon: TrendCharts,
    functions: functionDefinitions.filter(f => 
      ['MEDIAN', 'MODE', 'STDDEV', 'VARIANCE'].includes(f.id)
    )
  },
  {
    name: '高级计算',
    icon: DataAnalysis,
    functions: functionDefinitions.filter(f => 
      ['PERCENTILE', 'RANK'].includes(f.id)
    )
  },
  {
    name: '其他函数',
    icon: Document,
    functions: functionDefinitions.filter(f => 
      ['DISTINCT', 'FIRST', 'LAST'].includes(f.id)
    )
  }
])

const selectedFunctionDef = computed(() => 
  functionDefinitions.find(f => f.id === props.selectedFunction)
)

// 方法
const selectFunction = (func: FunctionDefinition) => {
  if (!isFunctionSupported(func)) return
  
  emit('update:selectedFunction', func.id)
  emit('functionChange', func.id)
}

const isFunctionSupported = (func: FunctionDefinition): boolean => {
  if (!props.field) return false
  
  const fieldType = props.field.dataType?.toLowerCase() || ''
  return func.supportedTypes.some(type => 
    type.toLowerCase() === fieldType ||
    (type === 'number' && ['integer', 'decimal'].includes(fieldType))
  )
}

const getFunctionTypeColor = (funcId: AggregateFunction): string => {
  const colorMap: Record<string, string> = {
    'SUM': 'success',
    'AVG': 'success',
    'COUNT': 'primary',
    'MAX': 'warning',
    'MIN': 'warning',
    'MEDIAN': 'info',
    'MODE': 'info',
    'STDDEV': 'danger',
    'VARIANCE': 'danger',
    'PERCENTILE': 'primary',
    'RANK': 'primary',
    'DISTINCT': 'success',
    'FIRST': 'info',
    'LAST': 'info'
  }
  
  return colorMap[funcId] || 'info'
}

const getUsageExample = (func: FunctionDefinition): string => {
  const fieldName = props.field?.displayName || '字段名'
  
  const examples: Record<string, string> = {
    'SUM': `SUM(${fieldName}) - 计算${fieldName}的总和`,
    'AVG': `AVG(${fieldName}) - 计算${fieldName}的平均值`,
    'COUNT': `COUNT(${fieldName}) - 统计${fieldName}的记录数`,
    'MAX': `MAX(${fieldName}) - 找出${fieldName}的最大值`,
    'MIN': `MIN(${fieldName}) - 找出${fieldName}的最小值`,
    'MEDIAN': `MEDIAN(${fieldName}) - 计算${fieldName}的中位数`,
    'MODE': `MODE(${fieldName}) - 找出${fieldName}的众数`,
    'STDDEV': `STDDEV(${fieldName}) - 计算${fieldName}的标准差`,
    'VARIANCE': `VARIANCE(${fieldName}) - 计算${fieldName}的方差`,
    'PERCENTILE': `PERCENTILE(${fieldName}, 50) - 计算${fieldName}的50%分位数`,
    'RANK': `RANK(${fieldName}) - 计算${fieldName}的排名`,
    'DISTINCT': `DISTINCT(${fieldName}) - 统计${fieldName}的唯一值数量`,
    'FIRST': `FIRST(${fieldName}) - 获取${fieldName}的第一个值`,
    'LAST': `LAST(${fieldName}) - 获取${fieldName}的最后一个值`
  }
  
  return examples[func.id] || ''
}
</script>

<style scoped>
.function-selector {
  .function-groups {
    .function-group {
      margin-bottom: 20px;
      
      .group-header {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 12px;
        padding: 8px 12px;
        background: linear-gradient(135deg, #f8f9fa, #e9ecef);
        border-radius: 6px;
        border-left: 4px solid #409eff;
        
        .group-name {
          font-weight: 600;
          color: #303133;
          font-size: 14px;
        }
      }
      
      .function-list {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
        gap: 12px;
        
        .function-item {
          padding: 12px;
          border: 1px solid #e4e7ed;
          border-radius: 6px;
          background: white;
          cursor: pointer;
          transition: all 0.2s;
          position: relative;
          
          &:hover {
            border-color: #409eff;
            background: #f0f9ff;
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(64, 158, 255, 0.15);
          }
          
          &.active {
            border-color: #409eff;
            background: #ecf5ff;
            box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2);
          }
          
          &.disabled {
            opacity: 0.5;
            cursor: not-allowed;
            
            &:hover {
              border-color: #e4e7ed;
              background: white;
              transform: none;
              box-shadow: none;
            }
          }
          
          .function-info {
            .function-header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: 8px;
              
              .function-name {
                font-weight: 600;
                color: #303133;
                font-size: 15px;
              }
              
              .function-tag {
                font-size: 10px;
                font-family: monospace;
              }
            }
            
            .function-description {
              color: #606266;
              font-size: 13px;
              line-height: 1.4;
              margin-bottom: 8px;
            }
            
            .function-meta {
              margin-bottom: 8px;
              
              .meta-label {
                color: #909399;
                font-size: 12px;
                display: block;
                margin-bottom: 4px;
              }
              
              .supported-types {
                display: flex;
                gap: 4px;
                flex-wrap: wrap;
                
                .type-tag {
                  font-size: 10px;
                  height: 18px;
                  line-height: 18px;
                  padding: 0 6px;
                }
              }
            }
            
            .function-params {
              .params-list {
                margin-top: 4px;
                
                .param-item {
                  display: flex;
                  gap: 4px;
                  font-size: 11px;
                  color: #666;
                  margin-bottom: 2px;
                  
                  .param-name {
                    font-weight: 500;
                  }
                  
                  .param-type {
                    color: #909399;
                    font-style: italic;
                  }
                }
              }
            }
          }
          
          .function-check {
            position: absolute;
            top: 8px;
            right: 8px;
            color: #409eff;
            font-size: 16px;
          }
        }
      }
    }
  }
  
  .function-detail-card {
    margin-top: 20px;
    
    :deep(.el-card__header) {
      padding: 12px 16px;
      background: #f8f9fa;
      
      span {
        font-size: 13px;
        font-weight: 600;
        color: #303133;
      }
    }
    
    :deep(.el-card__body) {
      padding: 16px;
    }
    
    .function-detail {
      .detail-row {
        display: flex;
        align-items: center;
        margin-bottom: 12px;
        font-size: 13px;
        
        &:last-child {
          margin-bottom: 0;
        }
        
        .detail-label {
          width: 80px;
          color: #909399;
          flex-shrink: 0;
        }
        
        .detail-value {
          color: #303133;
          font-weight: 500;
        }
      }
      
      .usage-example {
        margin-top: 16px;
        padding: 12px;
        background: #f5f7fa;
        border-radius: 4px;
        border-left: 3px solid #409eff;
        
        .example-label {
          font-size: 12px;
          color: #909399;
          margin-bottom: 6px;
        }
        
        .example-code {
          font-family: 'Courier New', monospace;
          font-size: 13px;
          color: #303133;
          background: white;
          padding: 8px;
          border-radius: 3px;
          border: 1px solid #e4e7ed;
        }
      }
    }
  }
}

/* 响应式调整 */
@media (max-width: 768px) {
  .function-selector .function-groups .function-group .function-list {
    grid-template-columns: 1fr;
  }
}
</style> 