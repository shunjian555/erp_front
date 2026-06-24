<template>
  <!-- 有子菜单 -->
  <el-sub-menu v-if="item.children?.length && !item.meta?.hideChildrenInMenu" :index="basePath">
    <template #title>
      <el-icon v-if="item.meta?.icon">
        <component :is="item.meta.icon" />
      </el-icon>
      <span>{{ item.meta?.titleKey ? t(item.meta.titleKey) : item.meta?.title }}</span>
    </template>
    <SidebarItem
      v-for="child in visibleChildren"
      :key="child.path"
      :item="child"
      :base-path="resolvePath(child.path)"
    />
  </el-sub-menu>

  <!-- 无子菜单或只有一个子菜单 -->
  <el-menu-item v-else-if="!item.children || item.children.length === 0" :index="basePath">
    <el-icon v-if="item.meta?.icon">
      <component :is="item.meta.icon" />
    </el-icon>
    <template #title>{{ item.meta?.titleKey ? t(item.meta.titleKey) : item.meta?.title }}</template>
  </el-menu-item>

  <!-- 只有一个子菜单时直接显示 -->
  <el-menu-item v-else :index="onlyOneChild.path ? resolvePath(onlyOneChild.path) : basePath">
    <el-icon v-if="item.meta?.icon || onlyOneChild.meta?.icon">
      <component :is="(onlyOneChild.meta?.icon) || (item.meta?.icon)" />
    </el-icon>
    <template #title>{{ (onlyOneChild.meta?.titleKey ? t(onlyOneChild.meta.titleKey) : onlyOneChild.meta?.title) || (item.meta?.titleKey ? t(item.meta.titleKey) : item.meta?.title) }}</template>
  </el-menu-item>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const props = defineProps({
  item: {
    type: Object,
    required: true
  },
  basePath: {
    type: String,
    default: ''
  }
})

// 过滤可见的子路由
const visibleChildren = computed(() => {
  return props.item.children?.filter((child) => !child.meta?.hidden) || []
})

// 只有一个子菜单时的处理
const onlyOneChild = computed(() => {
  const children = visibleChildren.value
  if (children.length === 1) return children[0]
  return {}
})

// 解析路径
function resolvePath(path) {
  if (path.startsWith('/')) return path
  return `${props.basePath}/${path}`.replace(/\/+/g, '/')
}
</script>
