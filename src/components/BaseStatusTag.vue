<template>
  <div class="status-tag" :class="[`status-${type}`]">
    <slot>{{ text }}</slot>
  </div>
</template>

<script setup>
defineProps({
  type: {
    type: String,
    default: 'default',
    validator: (v) => ['success', 'warning', 'danger', 'info', 'default'].includes(v)
  },
  text: {
    type: String,
    default: ''
  }
})
</script>

<style lang="scss" scoped>
.status-tag {
  display: inline-flex;
  align-items: center;
  padding: 2px 10px;
  font-size: 12px;
  border-radius: 10px;
  line-height: 20px;

  &.status-success {
    color: #67c23a;
    background-color: #f0f9eb;
  }

  &.status-warning {
    color: #e6a23c;
    background-color: #fdf6ec;
  }

  &.status-danger {
    color: #f56c6c;
    background-color: #fef0f0;
  }

  &.status-info {
    color: #909399;
    background-color: #f4f4f5;
  }

  &.status-default {
    color: #606266;
    background-color: #f5f7fa;
  }
}
</style>
