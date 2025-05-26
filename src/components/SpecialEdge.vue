<script setup lang="ts">
import { BaseEdge, EdgeLabelRenderer, getBezierPath, type EdgeProps } from '@vue-flow/core'
import { computed } from 'vue'

const props = defineProps<EdgeProps>()

const path = computed(() => getBezierPath(props))
</script>

<script>
export default {
  inheritAttrs: false,
}
</script>

<template>
  <!-- 使用 BaseEdge 组件渲染自定义边 -->
  <BaseEdge :path="path[0]" />
  <!-- 使用 EdgeLabelRenderer 渲染自定义标签 -->
  <EdgeLabelRenderer>
    <div
      :style="{
        pointerEvents: 'all',
        position: 'absolute',
        transform: `translate(-50%, -50%) translate(${path[1]}px,${path[2]}px)`
      }"
      class="nodrag nopan"
    >
      {{ props.data.hello }}
    </div>
  </EdgeLabelRenderer>
</template> 