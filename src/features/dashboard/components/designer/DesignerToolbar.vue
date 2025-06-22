<template>
  <div class="designer-toolbar">
    <div class="toolbar-title">
      <el-icon class="toolbar-icon"><TrendCharts /></el-icon>
      仪表盘设计器
    </div>
    
    <div class="toolbar-actions">
      <!-- 桌面端按钮组 -->
      <el-button-group v-if="!isMobile" size="small">
        <!-- 预览模式 -->
        <el-button @click="$emit('toggle-preview')" :type="isPreview ? 'primary' : 'default'">
          <el-icon><View /></el-icon>
          {{ isPreview ? '编辑' : '预览' }}
        </el-button>
        
        <!-- 网格辅助 -->
        <el-button @click="$emit('toggle-grid-helper')" :type="showGridHelper ? 'primary' : 'default'">
          <el-icon><Grid /></el-icon>
          网格
        </el-button>
        
        <!-- 自动布局 -->
        <el-button @click="$emit('auto-layout')" type="info" v-if="hasCharts">
          <el-icon><MagicStick /></el-icon>
          自动布局
        </el-button>
        
        <!-- 清空画布 -->
        <el-button @click="$emit('clear-all')" type="danger" v-if="hasCharts">
          <el-icon><Delete /></el-icon>
          清空画布
        </el-button>
        
        <!-- 导出配置 -->
        <el-button @click="$emit('export-dashboard')">
          <el-icon><Download /></el-icon>
          导出
        </el-button>
        
        <!-- 全屏 -->
        <el-button @click="$emit('toggle-fullscreen')" :type="isFullscreen ? 'primary' : 'default'">
          <el-icon><FullScreen /></el-icon>
          {{ isFullscreen ? '退出全屏' : '全屏' }}
        </el-button>
        
        <!-- 保存 -->
        <el-button type="success" @click="$emit('save-dashboard')">
          <el-icon><Document /></el-icon>
          保存
        </el-button>
      </el-button-group>
      
      <!-- 移动端下拉菜单 -->
      <el-dropdown v-else trigger="click">
        <el-button type="primary" size="small">
          工具<el-icon class="el-icon--right"><ArrowDown /></el-icon>
        </el-button>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item @click="$emit('toggle-preview')">
              <el-icon><View /></el-icon>
              {{ isPreview ? '编辑模式' : '预览模式' }}
            </el-dropdown-item>
            <el-dropdown-item @click="$emit('toggle-grid-helper')">
              <el-icon><Grid /></el-icon>
              {{ showGridHelper ? '隐藏网格' : '显示网格' }}
            </el-dropdown-item>
            <el-dropdown-item @click="$emit('auto-layout')" v-if="hasCharts">
              <el-icon><MagicStick /></el-icon>
              自动布局
            </el-dropdown-item>
            <el-dropdown-item @click="$emit('clear-all')" v-if="hasCharts">
              <el-icon><Delete /></el-icon>
              清空画布
            </el-dropdown-item>
            <el-dropdown-item @click="$emit('export-dashboard')">
              <el-icon><Download /></el-icon>
              导出配置
            </el-dropdown-item>
            <el-dropdown-item @click="$emit('toggle-fullscreen')">
              <el-icon><FullScreen /></el-icon>
              {{ isFullscreen ? '退出全屏' : '全屏模式' }}
            </el-dropdown-item>
            <el-dropdown-item @click="$emit('save-dashboard')">
              <el-icon><Document /></el-icon>
              保存仪表盘
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
  </div>
</template>

<script setup lang="ts">
import { 
  TrendCharts, 
  View, 
  Grid, 
  Download, 
  Document, 
  ArrowDown,
  MagicStick,
  Delete,
  FullScreen
} from '@element-plus/icons-vue'

interface Props {
  isPreview: boolean
  showGridHelper: boolean
  isMobile: boolean
  hasCharts: boolean
  isFullscreen: boolean
}

defineProps<Props>()

defineEmits<{
  'toggle-preview': []
  'toggle-grid-helper': []
  'toggle-fullscreen': []
  'auto-layout': []
  'clear-all': []
  'export-dashboard': []
  'save-dashboard': []
}>()
</script>

<style lang="scss" scoped>
.designer-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 60px;
  padding: 0 24px;
  background: #f8fbff;
  border-bottom: 1px solid #e3f2fd;
  box-shadow: 0 1px 4px rgba(33, 150, 243, 0.08);
  
  .toolbar-title {
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 16px;
    font-weight: 500;
    color: #1976d2;
    
    .toolbar-icon {
      font-size: 20px;
      color: #2196f3;
    }
  }
  
  .toolbar-actions {
    .el-button-group {
      .el-button {
        border-color: #e3f2fd;
        background: #ffffff;
        color: #1976d2;
        font-weight: 400;
        font-size: 13px;
        padding: 8px 12px;
        border-radius: 6px;
        margin-left: 2px;
        
        &:hover {
          background: #f3f9ff;
          border-color: #bbdefb;
          color: #1565c0;
        }
        
        &.el-button--primary {
          background: #2196f3;
          border-color: #2196f3;
          color: white;
          
          &:hover {
            background: #1976d2;
            border-color: #1976d2;
          }
        }
        
        &.el-button--success {
          background: #4caf50;
          border-color: #4caf50;
          color: white;
          
          &:hover {
            background: #388e3c;
            border-color: #388e3c;
          }
        }
        
        &.el-button--danger {
          background: #f44336;
          border-color: #f44336;
          color: white;
          
          &:hover {
            background: #d32f2f;
            border-color: #d32f2f;
          }
        }
        
        &.el-button--info {
          background: #90a4ae;
          border-color: #90a4ae;
          color: white;
          
          &:hover {
            background: #78909c;
            border-color: #78909c;
          }
        }
        
        .el-icon {
          margin-right: 4px;
          font-size: 14px;
        }
      }
    }
    
    .el-dropdown {
      .el-button {
        background: #ffffff;
        border-color: #e3f2fd;
        color: #1976d2;
        font-weight: 400;
        border-radius: 6px;
        
        &:hover {
          background: #f3f9ff;
          border-color: #bbdefb;
        }
      }
    }
  }
}

// 响应式设计
@media (max-width: 768px) {
  .designer-toolbar {
    padding: 0 16px;
    height: 50px;
    
    .toolbar-title {
      font-size: 14px;
      
      .toolbar-icon {
        font-size: 18px;
      }
    }
  }
}
</style> 