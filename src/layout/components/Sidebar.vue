<template>
  <div class="sidebar">
    <div class="logo-container" :class="{ collapsed: isCollapsed }">
      <router-link to="/">
        <img src="@/assets/logo.svg" alt="logo" class="logo-img" />
        <span v-show="!isCollapsed" class="logo-title">Smart ERP</span>
      </router-link>
    </div>
    <el-scrollbar wrap-class="scrollbar-wrapper">
      <el-menu
        :default-active="activeMenu"
        :collapse="isCollapsed"
        :unique-opened="true"
        :collapse-transition="false"
        mode="vertical"
        background-color="#001529"
        text-color="rgba(255,255,255,0.65)"
        active-text-color="#ffffff"
        @select="handleMenuSelect"
      >
        <SidebarItem
          v-for="route in menuRoutes"
          :key="route.path"
          :item="route"
          :base-path="resolvePath(route.path)"
        />
      </el-menu>
    </el-scrollbar>

    <!-- 折叠按钮 -->
    <div class="sidebar-toggle" @click="toggleSidebar">
      <el-icon :size="16"><Fold v-if="!isCollapsed" /><Expand v-else /></el-icon>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Fold, Expand } from '@element-plus/icons-vue'
import { useAppStore } from '@/stores/app'
import menuData from '@/config/menus.json'
import SidebarItem from './SidebarItem.vue'

const route = useRoute()
const router = useRouter()
const appStore = useAppStore()

const isCollapsed = computed(() => appStore.sidebarCollapsed)

// 从 JSON 文件读取菜单数据，转换为路由格式（将 title/icon/affix 等包装到 meta 中）
const menuRoutes = computed(() => {
  function transform(item) {
    const result = { path: item.path }
    const meta = {}
    if (item.title) meta.title = item.title
    if (item.icon) meta.icon = item.icon
    if (item.affix) meta.affix = item.affix
    if (Object.keys(meta).length) result.meta = meta
    if (item.children?.length) {
      result.children = item.children.map(transform)
    }
    return result
  }
  return menuData.map(transform)
})

// 当前激活菜单
const activeMenu = computed(() => {
  const { meta, path } = route
  if (meta.activeMenu) return meta.activeMenu
  return path
})

function resolvePath(routePath) {
  return routePath
}

// 切换侧边栏
function toggleSidebar() {
  appStore.toggleSidebar()
}

// 手动处理菜单导航，避免首次点击整页刷新
function handleMenuSelect(index) {
  if (index !== route.path) {
    router.push(index)
  }
}
</script>

<style lang="scss" scoped>
.sidebar {
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
  background-color: #001529;
  position: relative;

  .logo-container {
    height: var(--header-height);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 12px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    overflow: hidden;

    a {
      display: flex;
      align-items: center;
      text-decoration: none;
      white-space: nowrap;
    }

    .logo-img {
      width: 32px;
      height: 32px;
      flex-shrink: 0;
    }

    .logo-title {
      font-size: 17px;
      font-weight: 700;
      color: #fff;
      margin-left: 10px;
      letter-spacing: 1px;
      transition: opacity 0.25s ease;
    }

    &.collapsed .logo-title {
      opacity: 0;
      width: 0;
      margin-left: 0;
    }
  }

  :deep(.el-menu) {
    border-right: none;
    background: transparent !important;
  }

  :deep(.el-scrollbar) {
    flex: 1;
    overflow: hidden;
  }

  :deep(.scrollbar-wrapper) {
    overflow-x: hidden !important;
  }

  // 菜单项样式优化
  :deep(.el-menu-item),
  :deep(.el-sub-menu__title) {
    height: 46px;
    line-height: 46px;
    margin: 2px 8px;
    border-radius: 8px;
    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);

    &:hover {
      background-color: rgba(255, 255, 255, 0.08) !important;
      color: #fff !important;
    }

    &.is-active {
      background: linear-gradient(135deg, #1890ff 0%, #096dd9 100%) !important;
      color: #fff !important;
      box-shadow: 0 4px 12px rgba(24, 144, 255, 0.3);

      .el-icon {
        color: #fff !important;
      }
    }

    .el-icon {
      width: 18px;
      margin-right: 8px;
      vertical-align: middle;
    }
  }

  :deep(.el-sub-menu) {
    .el-sub-menu__title:hover {
      color: #fff !important;
    }

    .el-menu {
      background: transparent !important;
    }

    .el-menu-item {
      height: 40px;
      line-height: 40px;
      min-width: auto;
      padding-left: 48px !important;
      margin: 1px 8px 1px 20px;
      border-radius: 6px;

      &::before {
        content: '';
        position: absolute;
        left: 20px;
        top: 50%;
        transform: translateY(-50%);
        width: 5px;
        height: 5px;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.35);
        transition: all 0.2s;
      }

      &:hover::before,
      &.is-active::before {
        background: #fff;
        box-shadow: 0 0 6px rgba(255, 255, 255, 0.5);
      }
    }
  }

  // 折叠状态下的子菜单弹出层
  :deep(.el-menu--collapse) {
    .el-sub-menu__title {
      justify-content: center;
      padding: 0 !important;

      span,
      .el-sub-menu__icon-arrow {
        display: none;
      }
    }

    .el-popper {
      border-radius: 10px;
      box-shadow: 0 6px 24px rgba(0, 0, 0, 0.15);
    }
  }

  // 底部折叠按钮
  .sidebar-toggle {
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: rgba(255, 255, 255, 0.45);
    border-top: 1px solid rgba(255, 255, 255, 0.06);
    transition: all 0.25s ease;

    &:hover {
      color: rgba(255, 255, 255, 0.85);
      background-color: rgba(255, 255, 255, 0.05);
    }
  }
}
</style>
