<template>
  <div
    class="line-renderer"
    :class="{ selected: selected, preview: previewMode }"
    :style="componentStyle"
    @click="handleClick"
  >
    <div class="line" :style="lineStyle"></div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { LineComponent, PreviewData } from '@/shared/types/printDesigner';

interface Props {
  component: LineComponent;
  selected: boolean;
  previewMode: boolean;
  previewData: PreviewData;
  scale: number;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  select: [id: string, multiSelect?: boolean];
  update: [component: LineComponent];
  delete: [id: string];
  clone: [component: LineComponent];
}>();

const componentStyle = computed(() => ({
  position: 'absolute',
  left: `${props.component.x}px`,
  top: `${props.component.y}px`,
  width: `${props.component.width}px`,
  height: `${props.component.height}px`,
  zIndex: props.component.zIndex
}));

const lineStyle = computed(() => {
  const isHorizontal = props.component.direction === 'horizontal';
  return {
    width: isHorizontal ? '100%' : `${props.component.style.width}px`,
    height: isHorizontal ? `${props.component.style.width}px` : '100%',
    backgroundColor: props.component.style.color,
    borderStyle: props.component.style.lineStyle,
    borderWidth: isHorizontal ? `0 0 ${props.component.style.width}px 0` : `0 ${props.component.style.width}px 0 0`,
    borderColor: props.component.style.color
  };
});

const handleClick = (event: MouseEvent) => {
  if (!props.previewMode) {
    event.stopPropagation();
    emit('select', props.component.id, event.ctrlKey || event.metaKey);
  }
};
</script>

<style scoped>
.line-renderer {
  border: 1px solid transparent;
}

.line-renderer.selected {
  border-color: #409eff;
}

.line {
  pointer-events: none;
}
</style> 