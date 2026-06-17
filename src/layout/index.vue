<template>
  <div class="layout-container">
    <Sidebar class="sidebar-container" />
    <div class="main-container" :class="{ 'sidebar-collapsed': isCollapsed }">
      <Header class="header-container" />
      <TagsView v-if="showTagsView" />
      <AppMain class="app-main" />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useAppStore } from '@/stores/app'
import Sidebar from './components/Sidebar.vue'
import Header from './components/Header.vue'
import TagsView from './components/TagsView.vue'
import AppMain from './components/AppMain.vue'

const appStore = useAppStore()

const isCollapsed = computed(() => appStore.sidebarCollapsed)
const showTagsView = computed(() => true)
</script>

<style lang="scss" scoped>
.layout-container {
  display: flex;
  width: 100%;
  height: 100%;
}

.sidebar-container {
  width: var(--sidebar-width);
  height: 100%;
  position: fixed;
  left: 0;
  top: 0;
  z-index: 1001;
  transition: width var(--transition-duration);
  background-color: #001529;
  overflow: hidden;
}

.main-container {
  margin-left: var(--sidebar-width);
  min-height: 100%;
  width: calc(100% - var(--sidebar-width));
  display: flex;
  flex-direction: column;
  transition: margin-left var(--transition-duration), width var(--transition-duration);
  background-color: var(--bg-color-page);

  &.sidebar-collapsed {
    margin-left: var(--sidebar-collapsed-width);
    width: calc(100% - var(--sidebar-collapsed-width));
  }
}

.header-container {
  position: sticky;
  top: 0;
  z-index: 1000;
}

.app-main {
  flex: 1;
  padding: 16px;
  overflow-y: auto;
}
</style>
