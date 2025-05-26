<script setup lang="ts">
import { Position, Handle } from '@vue-flow/core'
import type { NodeProps } from '@vue-flow/core'

defineProps<NodeProps>()
</script>

<template>
  <div class="approval-node">
    <Handle type="target" :position="Position.Top" />
    {{ data.label }}
    <Handle type="source" :position="Position.Bottom" />
  </div>
</template>

<style scoped>
.approval-node {
  width: 100px;
  height: 100px;
  background: #E6A23C;
  transform: rotate(45deg);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
}

.approval-node > span {
  transform: rotate(-45deg);
}
</style> 