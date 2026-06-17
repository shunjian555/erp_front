<template>
  <div class="base-card" :class="{ shadow: shadow, hoverable: hoverable }">
    <div v-if="title || $slots.header" class="base-card-header">
      <span class="base-card-title">{{ title }}</span>
      <div class="base-card-extra">
        <slot name="header" />
      </div>
    </div>
    <div class="base-card-body">
      <slot />
    </div>
  </div>
</template>

<script setup>
defineProps({
  title: {
    type: String,
    default: ''
  },
  shadow: {
    type: String,
    default: 'always'
  },
  hoverable: {
    type: Boolean,
    default: false
  }
})
</script>

<style lang="scss" scoped>
.base-card {
  background: #fff;
  border-radius: var(--border-radius-base);
  transition: all 0.3s;

  &.shadow.always {
    box-shadow: var(--box-shadow-light);
  }

  &.hoverable:hover {
    box-shadow: var(--box-shadow-dark);
    transform: translateY(-2px);
  }
}

.base-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 18px;
  border-bottom: 1px solid var(--border-color-lighter);

  .base-card-title {
    font-size: 15px;
    font-weight: 600;
    color: var(--text-primary);
  }
}

.base-card-body {
  padding: 18px;
}
</style>
