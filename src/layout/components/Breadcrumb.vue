<template>
  <el-breadcrumb separator="/" class="breadcrumb">
    <transition-group name="breadcrumb-fade">
      <el-breadcrumb-item v-for="(item, index) in breadcrumbs" :key="item.path">
        <span v-if="index === breadcrumbs.length - 1" class="no-link">
          {{ item.meta?.title }}
        </span>
        <router-link v-else :to="item.path" class="link-text">
          {{ item.meta?.title }}
        </router-link>
      </el-breadcrumb-item>
    </transition-group>
  </el-breadcrumb>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const breadcrumbs = ref([])

// 获取面包屑数据
function getBreadcrumbs() {
  const matched = route.matched.filter(
    (item) => item.meta && item.meta.title && !item.meta.hidden
  )
  breadcrumbs.value = matched
}

watch(
  () => route.path,
  () => getBreadcrumbs(),
  { immediate: true }
)
</script>

<style lang="scss" scoped>
.breadcrumb {
  font-size: 13px;

  .no-link {
    color: var(--text-primary);
    font-weight: 600;
  }

  .link-text {
    color: var(--text-secondary);
    font-weight: 400;
    transition: color 0.2s;

    &:hover {
      color: var(--primary-color);
    }
  }

  :deep(.el-breadcrumb__separator) {
    margin: 0 6px;
    color: #c0c4cc;
    font-size: 12px;
  }

  :deep(.el-breadcrumb__inner) {
    &.is-link:hover {
      color: var(--primary-color);
    }
  }
}

// 面包屑切换动画
.breadcrumb-fade-enter-active,
.breadcrumb-fade-leave-active {
  transition: all 0.2s ease;
}

.breadcrumb-fade-enter-from,
.breadcrumb-fade-leave-to {
  opacity: 0;
  transform: translateX(-8px);
}
</style>
