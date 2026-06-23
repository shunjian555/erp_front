<template>
  <div class="tags-view-container" v-show="visitedViews.length > 0">
    <el-scrollbar class="tags-view-wrapper">
      <router-link
        v-for="tag in visitedViews"
        :key="tag.path"
        :class="{ active: isActive(tag), affix: tag.meta?.affix }"
        :to="{ path: tag.path }"
        class="tags-view-item"
        @contextmenu.prevent="openContextMenu(tag, $event)"
      >
        {{ tag.meta?.title }}
        <el-icon
          v-if="!tag.meta?.affix"
          class="close-icon"
          @click.prevent.stop="closeTag(tag)"
        >
          <Close />
        </el-icon>
      </router-link>
    </el-scrollbar>

    <!-- 右键菜单 -->
    <ul
      v-show="contextMenuVisible"
      class="context-menu"
      :style="{ left: contextMenuLeft + 'px', top: contextMenuTop + 'px' }"
    >
      <li @click="refreshSelectedTag">刷新页面</li>
      <li v-if="!selectedTag?.meta?.affix" @click="closeSelectedTag">关闭当前</li>
      <li @click="closeOtherTags">关闭其他</li>
      <li @click="closeAllTags">关闭全部</li>
    </ul>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useTagsViewStore } from '@/stores/tagsView'

const route = useRoute()
const router = useRouter()
const tagsViewStore = useTagsViewStore()

const visitedViews = computed(() => tagsViewStore.visitedViews)
const selectedTag = ref(null)

// 右键菜单状态
const contextMenuVisible = ref(false)
const contextMenuLeft = ref(0)
const contextMenuTop = ref(0)

// 是否激活
function isActive(tag) {
  return tag.path === route.path
}

// 关闭标签
function closeTag(tag) {
  tagsViewStore.delView(tag)
  if (isActive(tag)) {
    toLastView(tag)
  }
}

// 跳转到最后一个视图
function toLastView(view) {
  const lastView = tagsViewStore.visitedViews.slice(-1)[0]
  if (lastView) {
    router.push(lastView.path)
  } else {
    router.push('/dashboard')
  }
}

// 打开右键菜单
function openContextMenu(tag, e) {
  selectedTag.value = tag
  contextMenuLeft.value = e.clientX
  contextMenuTop.value = e.clientY
  contextMenuVisible.value = true
}

// 关闭右键菜单
function closeContextMenu() {
  contextMenuVisible.value = false
}

// 刷新选中标签
function refreshSelectedTag() {
  router.replace({ path: '/redirect' + route.fullPath })
  closeContextMenu()
}

// 关闭选中标签
function closeSelectedTag() {
  if (selectedTag.value) {
    closeTag(selectedTag.value)
  }
  closeContextMenu()
}

// 关闭其他标签
function closeOtherTags() {
  if (selectedTag.value) {
    tagsViewStore.delOthersViews(selectedTag.value)
  } else {
    tagsViewStore.delOthersViews(route)
  }
  closeContextMenu()
}

// 关闭全部标签
function closeAllTags() {
  tagsViewStore.delAllViews()
  toLastView({})
  closeContextMenu()
}

// 监听路由变化添加标签
watch(
  () => route.path,
  () => {
    if (route.name) {
      tagsViewStore.addView(route)
    }
  },
  { immediate: true }
)

// 点击空白处关闭右键菜单
onMounted(() => {
  document.addEventListener('click', closeContextMenu)
})
</script>

<style lang="scss" scoped>
.tags-view-container {
  height: var(--tagsview-height);
  width: 100%;
  background: var(--bg-color);
  border-bottom: 1px solid var(--border-color-lighter);
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.06);
  position: relative;
}

.tags-view-wrapper {
  :deep(.el-scrollbar__view) {
    display: flex;
    align-items: center;
    height: 100%;
    padding: 0 8px;
  }
}

.tags-view-item {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 0 10px;
  height: 26px;
  line-height: 24px;
  font-size: 13px;
  color: var(--text-secondary);
  border: 1px solid var(--border-color-lighter);
  border-radius: 2px;
  margin-right: 6px;
  text-decoration: none;
  white-space: nowrap;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    color: var(--primary-color);
    border-color: var(--primary-color-lighter);
    background-color: rgba(64, 158, 255, 0.04);
  }

  &.active {
    color: #fff;
    background-color: var(--primary-color);
    border-color: var(--primary-color);

    &:hover {
      color: #fff;
      background-color: var(--primary-color);
    }
  }

  .close-icon {
    border-radius: 50%;
    width: 14px;
    height: 14px;
    display: flex;
    align-items: center;
    justify-content: center;

    &:hover {
      background-color: rgba(0, 0, 0, 0.15);
    }
  }
}

.context-menu {
  position: fixed;
  z-index: 3000;
  list-style-type: none;
  padding: 5px 0;
  margin: 0;
  background: var(--bg-color-overlay);
  border-radius: 4px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
  font-size: 13px;

  li {
    padding: 8px 16px;
    cursor: pointer;
    color: var(--text-regular);

    &:hover {
      background-color: var(--bg-color-page);
      color: var(--primary-color);
    }
  }
}
</style>
