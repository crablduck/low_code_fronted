<script setup lang="ts">
import { Position, Handle } from '@vue-flow/core'
import type { NodeProps } from '@vue-flow/core'

defineProps<NodeProps>()
</script>

<template>
  <div class="end-node">
    <Handle type="target" :position="Position.Top" />
    {{ data.label }}
  </div>
</template>

<style scoped>
.end-node {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: #F56C6C;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
}
</style> 