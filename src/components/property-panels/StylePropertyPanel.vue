<template>
  <div class="style-property-panel">
    <el-form :model="styleProps" label-width="80px" size="small">
      <!-- 字体样式 -->
      <div class="property-group">
        <h4>字体样式</h4>
        <el-form-item label="字体大小">
          <el-input-number 
            v-model="styleProps.fontSize" 
            :min="8" 
            :max="72"
            style="width: 100%"
            @change="updateStyle('fontSize', $event + 'px')"
          />
        </el-form-item>
        
        <el-form-item label="字体粗细">
          <el-select 
            v-model="styleProps.fontWeight" 
            style="width: 100%"
            @change="updateStyle('fontWeight', $event)"
          >
            <el-option label="正常" value="normal" />
            <el-option label="粗体" value="bold" />
            <el-option label="100" value="100" />
            <el-option label="200" value="200" />
            <el-option label="300" value="300" />
            <el-option label="400" value="400" />
            <el-option label="500" value="500" />
            <el-option label="600" value="600" />
            <el-option label="700" value="700" />
            <el-option label="800" value="800" />
            <el-option label="900" value="900" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="字体样式">
          <el-select 
            v-model="styleProps.fontStyle" 
            style="width: 100%"
            @change="updateStyle('fontStyle', $event)"
          >
            <el-option label="正常" value="normal" />
            <el-option label="斜体" value="italic" />
            <el-option label="倾斜" value="oblique" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="字体颜色">
          <el-color-picker 
            v-model="styleProps.color" 
            show-alpha
            @change="updateStyle('color', $event)"
          />
        </el-form-item>
      </div>
      
      <!-- 背景样式 -->
      <div class="property-group">
        <h4>背景样式</h4>
        <el-form-item label="背景颜色">
          <el-color-picker 
            v-model="styleProps.backgroundColor" 
            show-alpha
            @change="updateStyle('backgroundColor', $event)"
          />
        </el-form-item>
        
        <el-form-item label="背景图片">
          <el-input 
            v-model="styleProps.backgroundImage" 
            placeholder="图片URL或base64"
            @input="updateStyle('backgroundImage', $event ? `url(${$event})` : '')"
          />
        </el-form-item>
        
        <el-form-item label="背景重复">
          <el-select 
            v-model="styleProps.backgroundRepeat" 
            style="width: 100%"
            @change="updateStyle('backgroundRepeat', $event)"
          >
            <el-option label="重复" value="repeat" />
            <el-option label="不重复" value="no-repeat" />
            <el-option label="水平重复" value="repeat-x" />
            <el-option label="垂直重复" value="repeat-y" />
          </el-select>
        </el-form-item>
      </div>
      
      <!-- 边框样式 -->
      <div class="property-group">
        <h4>边框样式</h4>
        <el-form-item label="边框宽度">
          <el-input-number 
            v-model="styleProps.borderWidth" 
            :min="0" 
            :max="20"
            style="width: 100%"
            @change="updateStyle('borderWidth', $event + 'px')"
          />
        </el-form-item>
        
        <el-form-item label="边框样式">
          <el-select 
            v-model="styleProps.borderStyle" 
            style="width: 100%"
            @change="updateStyle('borderStyle', $event)"
          >
            <el-option label="无" value="none" />
            <el-option label="实线" value="solid" />
            <el-option label="虚线" value="dashed" />
            <el-option label="点线" value="dotted" />
            <el-option label="双线" value="double" />
            <el-option label="凹槽" value="groove" />
            <el-option label="凸起" value="ridge" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="边框颜色">
          <el-color-picker 
            v-model="styleProps.borderColor" 
            show-alpha
            @change="updateStyle('borderColor', $event)"
          />
        </el-form-item>
        
        <el-form-item label="圆角">
          <el-input-number 
            v-model="styleProps.borderRadius" 
            :min="0" 
            :max="50"
            style="width: 100%"
            @change="updateStyle('borderRadius', $event + 'px')"
          />
        </el-form-item>
      </div>
      
      <!-- 文本对齐 -->
      <div class="property-group">
        <h4>文本对齐</h4>
        <el-form-item label="水平对齐">
          <el-radio-group 
            v-model="styleProps.textAlign" 
            @change="updateStyle('textAlign', $event)"
          >
            <el-radio-button label="left">左对齐</el-radio-button>
            <el-radio-button label="center">居中</el-radio-button>
            <el-radio-button label="right">右对齐</el-radio-button>
          </el-radio-group>
        </el-form-item>
        
        <el-form-item label="垂直对齐">
          <el-radio-group 
            v-model="styleProps.verticalAlign" 
            @change="updateStyle('verticalAlign', $event)"
          >
            <el-radio-button label="top">顶部</el-radio-button>
            <el-radio-button label="middle">居中</el-radio-button>
            <el-radio-button label="bottom">底部</el-radio-button>
          </el-radio-group>
        </el-form-item>
      </div>
      
      <!-- 内边距和外边距 -->
      <div class="property-group">
        <h4>间距设置</h4>
        <el-form-item label="内边距">
          <div class="spacing-controls">
            <el-input-number 
              v-model="styleProps.paddingTop" 
              :min="0" 
              placeholder="上"
              @change="updateStyle('paddingTop', $event + 'px')"
            />
            <el-input-number 
              v-model="styleProps.paddingRight" 
              :min="0" 
              placeholder="右"
              @change="updateStyle('paddingRight', $event + 'px')"
            />
            <el-input-number 
              v-model="styleProps.paddingBottom" 
              :min="0" 
              placeholder="下"
              @change="updateStyle('paddingBottom', $event + 'px')"
            />
            <el-input-number 
              v-model="styleProps.paddingLeft" 
              :min="0" 
              placeholder="左"
              @change="updateStyle('paddingLeft', $event + 'px')"
            />
          </div>
        </el-form-item>
        
        <el-form-item label="外边距">
          <div class="spacing-controls">
            <el-input-number 
              v-model="styleProps.marginTop" 
              placeholder="上"
              @change="updateStyle('marginTop', $event + 'px')"
            />
            <el-input-number 
              v-model="styleProps.marginRight" 
              placeholder="右"
              @change="updateStyle('marginRight', $event + 'px')"
            />
            <el-input-number 
              v-model="styleProps.marginBottom" 
              placeholder="下"
              @change="updateStyle('marginBottom', $event + 'px')"
            />
            <el-input-number 
              v-model="styleProps.marginLeft" 
              placeholder="左"
              @change="updateStyle('marginLeft', $event + 'px')"
            />
          </div>
        </el-form-item>
      </div>
      
      <!-- 阴影效果 -->
      <div class="property-group">
        <h4>阴影效果</h4>
        <el-form-item label="启用阴影">
          <el-switch 
            v-model="styleProps.enableShadow" 
            @change="toggleShadow"
          />
        </el-form-item>
        
        <template v-if="styleProps.enableShadow">
          <el-form-item label="水平偏移">
            <el-input-number 
              v-model="styleProps.shadowX" 
              style="width: 100%"
              @change="updateShadow"
            />
          </el-form-item>
          
          <el-form-item label="垂直偏移">
            <el-input-number 
              v-model="styleProps.shadowY" 
              style="width: 100%"
              @change="updateShadow"
            />
          </el-form-item>
          
          <el-form-item label="模糊半径">
            <el-input-number 
              v-model="styleProps.shadowBlur" 
              :min="0"
              style="width: 100%"
              @change="updateShadow"
            />
          </el-form-item>
          
          <el-form-item label="阴影颜色">
            <el-color-picker 
              v-model="styleProps.shadowColor" 
              show-alpha
              @change="updateShadow"
            />
          </el-form-item>
        </template>
      </div>
      
      <!-- 快速样式 -->
      <div class="property-group">
        <h4>快速样式</h4>
        <div class="quick-styles">
          <el-button size="small" @click="applyQuickStyle('header')">标题样式</el-button>
          <el-button size="small" @click="applyQuickStyle('data')">数据样式</el-button>
          <el-button size="small" @click="applyQuickStyle('highlight')">高亮样式</el-button>
          <el-button size="small" @click="applyQuickStyle('warning')">警告样式</el-button>
          <el-button size="small" @click="resetStyles">重置样式</el-button>
        </div>
      </div>
    </el-form>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from 'vue'

// Props 定义
interface Props {
  target: any
}

// Emits 定义
interface Emits {
  (e: 'update', data: any): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 响应式数据
const styleProps = reactive({
  fontSize: 14,
  fontWeight: 'normal',
  fontStyle: 'normal',
  color: '#333333',
  backgroundColor: '',
  backgroundImage: '',
  backgroundRepeat: 'no-repeat',
  borderWidth: 0,
  borderStyle: 'solid',
  borderColor: '#e4e7ed',
  borderRadius: 0,
  textAlign: 'left',
  verticalAlign: 'middle',
  paddingTop: 0,
  paddingRight: 0,
  paddingBottom: 0,
  paddingLeft: 0,
  marginTop: 0,
  marginRight: 0,
  marginBottom: 0,
  marginLeft: 0,
  enableShadow: false,
  shadowX: 0,
  shadowY: 0,
  shadowBlur: 0,
  shadowColor: '#000000'
})

// 方法
const updateStyle = (key: string, value: any) => {
  emit('update', { [key]: value })
}

const updateShadow = () => {
  if (styleProps.enableShadow) {
    const shadowValue = `${styleProps.shadowX}px ${styleProps.shadowY}px ${styleProps.shadowBlur}px ${styleProps.shadowColor}`
    updateStyle('boxShadow', shadowValue)
  }
}

const toggleShadow = (enabled: boolean) => {
  if (enabled) {
    updateShadow()
  } else {
    updateStyle('boxShadow', 'none')
  }
}

const applyQuickStyle = (type: string) => {
  const quickStyles = {
    header: {
      fontSize: '16px',
      fontWeight: 'bold',
      color: '#303133',
      backgroundColor: '#f5f7fa',
      textAlign: 'center',
      paddingTop: '12px',
      paddingBottom: '12px'
    },
    data: {
      fontSize: '14px',
      fontWeight: 'normal',
      color: '#606266',
      backgroundColor: '#ffffff',
      textAlign: 'left',
      paddingTop: '8px',
      paddingBottom: '8px'
    },
    highlight: {
      fontSize: '14px',
      fontWeight: 'bold',
      color: '#409eff',
      backgroundColor: '#ecf5ff',
      borderWidth: '1px',
      borderColor: '#409eff'
    },
    warning: {
      fontSize: '14px',
      fontWeight: 'normal',
      color: '#e6a23c',
      backgroundColor: '#fdf6ec',
      borderWidth: '1px',
      borderColor: '#e6a23c'
    }
  }
  
  const styles = quickStyles[type]
  if (styles) {
    emit('update', styles)
  }
}

const resetStyles = () => {
  const resetStyles = {
    fontSize: '14px',
    fontWeight: 'normal',
    fontStyle: 'normal',
    color: '#333333',
    backgroundColor: '',
    backgroundImage: '',
    borderWidth: '0px',
    borderStyle: 'solid',
    borderColor: '#e4e7ed',
    borderRadius: '0px',
    textAlign: 'left',
    verticalAlign: 'middle',
    paddingTop: '0px',
    paddingRight: '0px',
    paddingBottom: '0px',
    paddingLeft: '0px',
    marginTop: '0px',
    marginRight: '0px',
    marginBottom: '0px',
    marginLeft: '0px',
    boxShadow: 'none'
  }
  
  emit('update', resetStyles)
}

// 监听 target 变化，更新本地样式
watch(() => props.target, (newTarget) => {
  if (newTarget && newTarget.style) {
    const style = newTarget.style
    
    Object.assign(styleProps, {
      fontSize: parseInt(style.fontSize) || 14,
      fontWeight: style.fontWeight || 'normal',
      fontStyle: style.fontStyle || 'normal',
      color: style.color || '#333333',
      backgroundColor: style.backgroundColor || '',
      backgroundImage: style.backgroundImage?.replace(/url\(|\)/g, '') || '',
      backgroundRepeat: style.backgroundRepeat || 'no-repeat',
      borderWidth: parseInt(style.borderWidth) || 0,
      borderStyle: style.borderStyle || 'solid',
      borderColor: style.borderColor || '#e4e7ed',
      borderRadius: parseInt(style.borderRadius) || 0,
      textAlign: style.textAlign || 'left',
      verticalAlign: style.verticalAlign || 'middle',
      paddingTop: parseInt(style.paddingTop) || 0,
      paddingRight: parseInt(style.paddingRight) || 0,
      paddingBottom: parseInt(style.paddingBottom) || 0,
      paddingLeft: parseInt(style.paddingLeft) || 0,
      marginTop: parseInt(style.marginTop) || 0,
      marginRight: parseInt(style.marginRight) || 0,
      marginBottom: parseInt(style.marginBottom) || 0,
      marginLeft: parseInt(style.marginLeft) || 0,
      enableShadow: style.boxShadow && style.boxShadow !== 'none'
    })
    
    // 解析阴影值
    if (styleProps.enableShadow && style.boxShadow) {
      const shadowMatch = style.boxShadow.match(/(-?\d+)px\s+(-?\d+)px\s+(\d+)px\s+(.+)/)
      if (shadowMatch) {
        styleProps.shadowX = parseInt(shadowMatch[1])
        styleProps.shadowY = parseInt(shadowMatch[2])
        styleProps.shadowBlur = parseInt(shadowMatch[3])
        styleProps.shadowColor = shadowMatch[4]
      }
    }
  }
}, { immediate: true })
</script>

<style scoped lang="scss">
.style-property-panel {
  padding: 16px;
}

.property-group {
  margin-bottom: 24px;
  
  h4 {
    margin: 0 0 16px 0;
    font-size: 14px;
    color: #303133;
    font-weight: 500;
    border-bottom: 1px solid #e4e7ed;
    padding-bottom: 8px;
  }
}

.spacing-controls {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  
  .el-input-number {
    width: 100%;
  }
}

.quick-styles {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  
  .el-button {
    flex: 1;
    min-width: 80px;
  }
}

:deep(.el-form-item) {
  margin-bottom: 16px;
}

:deep(.el-form-item__label) {
  font-size: 13px;
  color: #606266;
}

:deep(.el-input__wrapper) {
  border-radius: 6px;
}

:deep(.el-select .el-input__wrapper) {
  border-radius: 6px;
}

:deep(.el-radio-group) {
  width: 100%;
  
  .el-radio-button {
    flex: 1;
  }
  
  .el-radio-button__inner {
    width: 100%;
    font-size: 12px;
  }
}

:deep(.el-color-picker) {
  width: 100%;
}
</style> 