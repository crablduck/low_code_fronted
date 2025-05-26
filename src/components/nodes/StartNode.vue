<script setup lang="ts">
import { Position, Handle } from '@vue-flow/core'
import type { NodeProps } from '@vue-flow/core'

defineProps<NodeProps>()
</script>

<template>
  <div class="start-node">
    <Handle type="source" :position="Position.Bottom" />
    {{ data.label }}
  </div>
</template>

<style scoped>
.start-node {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: #67C23A;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
}
</style> 