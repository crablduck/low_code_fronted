<script setup lang="ts">
import { Position, Handle } from '@vue-flow/core'
import type { NodeProps } from '@vue-flow/core'

defineProps<NodeProps>()
</script>

<template>
  <div class="process-node">
    <Handle type="target" :position="Position.Top" />
    {{ data.label }}
    <Handle type="source" :position="Position.Bottom" />
  </div>
</template>

<style scoped>
.process-node {
  padding: 15px 25px;
  border-radius: 4px;
  background: #409EFF;
  color: white;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style> 