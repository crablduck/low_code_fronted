# 表单设计器拖拽和右键菜单功能指南

## 🎯 新增功能概述

表单设计器现在支持字段拖拽移动和右键菜单操作，让表单设计更加便捷和高效！

## 🚀 功能特性

### 1. 字段拖拽功能

#### 拖拽手柄
- **位置**: 每个字段右下角的蓝色圆形图标
- **图标**: 网格图标 (Grid)
- **显示**: 鼠标悬停或选中字段时显示
- **操作**: 按住拖拽手柄上下移动可调整字段顺序

#### 拖拽操作
1. **激活拖拽**: 鼠标按下字段右下角的拖拽手柄
2. **移动字段**: 上下拖拽移动字段位置
3. **阈值设置**: 拖拽距离超过50px时触发位置交换
4. **视觉反馈**: 拖拽时字段会变半透明并缩小

#### 拖拽样式
```css
.drag-handle {
  position: absolute;
  bottom: -8px;
  right: -8px;
  width: 20px;
  height: 20px;
  background: #409eff;
  border-radius: 50%;
  cursor: move;
  opacity: 0;
  transition: opacity 0.2s;
}

.form-field.dragging {
  opacity: 0.5;
  transform: scale(0.95);
}
```

### 2. 右键菜单功能

#### 菜单触发
- **操作**: 在任意字段上右键点击
- **效果**: 显示上下文菜单，同时选中该字段
- **位置**: 鼠标点击位置显示菜单

#### 菜单选项

##### 📋 复制字段
- **功能**: 复制当前字段创建副本
- **位置**: 在原字段下方插入副本
- **命名**: 自动添加"_copy"后缀和"(副本)"标签
- **样式**: 完全复制原字段的样式配置

##### ⬆️ 上移
- **功能**: 将字段向上移动一个位置
- **限制**: 第一个字段无法上移
- **效果**: 与上方字段交换位置

##### ⬇️ 下移
- **功能**: 将字段向下移动一个位置
- **限制**: 最后一个字段无法下移
- **效果**: 与下方字段交换位置

##### 🎨 复制样式
- **功能**: 复制当前字段的样式配置
- **存储**: 保存到剪贴板（内存中）
- **提示**: 显示"样式已复制"消息

##### 📄 粘贴样式
- **功能**: 将复制的样式应用到当前字段
- **条件**: 需要先复制其他字段的样式
- **状态**: 无可用样式时显示为禁用状态
- **提示**: 显示"样式已粘贴"消息

##### 🗑️ 删除字段
- **功能**: 删除当前字段
- **样式**: 红色危险样式
- **效果**: 立即从表单中移除字段
- **索引**: 自动调整选中字段索引

#### 菜单样式
```css
.context-menu {
  position: fixed;
  background: white;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  padding: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  z-index: 1000;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  cursor: pointer;
  transition: background 0.2s;
}

.menu-item:hover {
  background: #f0f9ff;
}

.menu-item.danger {
  color: #f56c6c;
}

.menu-item.disabled {
  color: #909399;
  cursor: not-allowed;
}
```

## 📖 使用指南

### 快速体验步骤

#### 1. 访问表单设计器
```
前端地址: http://localhost:3000/form-design
Mock API: http://localhost:3003/api
```

#### 2. 创建表单字段
1. 选择数据源（如：MySQL主库）
2. 输入表单名称
3. 从左侧拖拽组件到设计画布

#### 3. 测试拖拽功能
1. 鼠标悬停在字段上，观察右下角拖拽手柄
2. 按住拖拽手柄，上下移动调整字段顺序
3. 观察字段位置的实时变化

#### 4. 测试右键菜单
1. 在任意字段上右键点击
2. 尝试各种菜单操作：
   - 复制字段 → 观察副本创建
   - 上移/下移 → 观察位置变化
   - 复制样式 → 修改另一字段样式 → 粘贴样式
   - 删除字段 → 观察字段移除

## 🔧 技术实现

### 拖拽实现原理
```typescript
const startDrag = (event: MouseEvent, index: number) => {
  event.preventDefault()
  isDragging.value = true
  dragFieldIndex.value = index
  dragStartPosition.value = { x: event.clientX, y: event.clientY }
  
  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging.value) return
    
    const deltaY = e.clientY - dragStartPosition.value.y
    const threshold = 50 // 拖拽阈值
    
    if (Math.abs(deltaY) > threshold) {
      const direction = deltaY > 0 ? 'down' : 'up'
      moveField(dragFieldIndex.value, direction)
      dragStartPosition.value = { x: e.clientX, y: e.clientY }
    }
  }
  
  // 添加事件监听器...
}
```

### 右键菜单实现
```typescript
const showContextMenu = (event: MouseEvent, index: number) => {
  event.preventDefault()
  contextMenuVisible.value = true
  contextMenuPosition.value = { x: event.clientX, y: event.clientY }
  contextMenuFieldIndex.value = index
  selectedFieldIndex.value = index
}
```

## 🎨 样式定制

### 拖拽手柄自定义
```css
.drag-handle {
  background: #409eff; /* 主题色 */
  width: 20px;         /* 大小 */
  height: 20px;
  border-radius: 50%;  /* 圆形 */
}

.drag-handle:hover {
  background: #337ecc; /* 悬停色 */
}
```

### 右键菜单自定义
```css
.context-menu {
  background: white;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}
```

## 🚀 未来扩展

### 可能的增强功能
1. **批量操作**: 支持多选字段批量移动
2. **拖拽预览**: 显示拖拽目标位置预览线
3. **键盘快捷键**: 支持Ctrl+C/V复制粘贴
4. **撤销重做**: 支持操作历史记录
5. **拖拽到其他容器**: 支持跨容器拖拽

### 性能优化
1. **虚拟滚动**: 大量字段时的性能优化
2. **防抖处理**: 拖拽操作的防抖优化
3. **内存管理**: 事件监听器的及时清理

## 📝 注意事项

1. **浏览器兼容性**: 现代浏览器支持，IE需要polyfill
2. **触摸设备**: 移动端需要适配触摸事件
3. **性能考虑**: 大量字段时建议分页或虚拟滚动
4. **用户体验**: 提供清晰的视觉反馈和操作提示

---

🎉 **恭喜！** 您的表单设计器现在具备了完整的拖拽和右键菜单功能，让表单设计更加高效便捷！ 