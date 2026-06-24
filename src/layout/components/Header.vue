<template>
  <div class="navbar">
    <!-- 左侧 -->
    <div class="navbar-left">
      <div class="hamburger" @click="toggleSidebar">
        <el-icon :size="18">
          <Fold v-if="!isCollapsed" />
          <Expand v-else />
        </el-icon>
      </div>
      <Breadcrumb />
    </div>

    <!-- 右侧 -->
    <div class="navbar-right">
      <!-- 搜索 -->
      <!-- <el-tooltip content="全局搜索" placement="bottom" :show-after="300">
        <div class="navbar-action search-trigger" @click="handleSearch">
          <el-icon :size="16"><Search /></el-icon>
          <span class="search-hint">Ctrl+K</span>
        </div>
      </el-tooltip> -->

      <!-- 语言切换 -->
      <!-- <el-tooltip :content="t('header.language')" placement="bottom" :show-after="300">
        <div class="navbar-action lang-switch" @click="toggleLanguage">
          <span class="lang-text">{{ isEn ? '中' : 'EN' }}</span>
        </div>
      </el-tooltip> -->

      <!-- 全屏切换 -->
      <el-tooltip :content="t('header.fullscreen')" placement="bottom" :show-after="300">
        <div class="navbar-action" @click="toggleFullScreen">
          <el-icon :size="16"><FullScreen /></el-icon>
        </div>
      </el-tooltip>

      <!-- 主题切换 -->
      <el-tooltip :content="t('header.switchTheme')" placement="bottom" :show-after="300">
        <div class="navbar-action" @click="toggleTheme">
          <el-icon :size="16"><Sunny v-if="isDark" /><Moon v-else /></el-icon>
        </div>
      </el-tooltip>

      <!-- 消息通知 -->
      <el-popover trigger="click" placement="bottom-end" :width="320" popper-class="notification-popover">
        <template #reference>
          <div class="navbar-action notification-action">
            <el-badge :value="notifications.length" :max="99" :hidden="!notifications.length">
              <el-icon :size="16"><Bell /></el-icon>
            </el-badge>
          </div>
        </template>
        <div class="notification-panel">
          <div class="notification-header">
            <span class="title">{{ t('header.messageNotification') }}</span>
            <el-button type="primary" link size="small">{{ t('header.markAllRead') }}</el-button>
          </div>
          <div class="notification-list">
            <div
              v-for="(item, index) in notifications"
              :key="index"
              class="notification-item"
              :class="{ unread: !item.read }"
            >
              <div class="notify-dot" :class="{ active: !item.read }"></div>
              <div class="notify-content">
                <p class="notify-title">{{ item.title }}</p>
                <p class="notify-desc">{{ item.desc }}</p>
                <span class="notify-time">{{ item.time }}</span>
              </div>
            </div>
            <el-empty v-if="!notifications.length" :description="t('header.noMessages')" :image-size="80" />
          </div>
        </div>
      </el-popover>

      <!-- 分割线 -->
      <div class="nav-divider"></div>

      <!-- 用户信息 -->
      <el-dropdown trigger="click" @command="handleCommand" style="width:70px"  >
      
        <div class="user-info">
          <el-avatar :size="30" :src="avatar" class="user-avatar">
            {{ username?.charAt(0)?.toUpperCase() }}
          </el-avatar>
          <span class="username">{{ username }}</span>
          <el-icon :size="12" class="arrow-icon"><ArrowDown /></el-icon>
        </div>
        <template #dropdown>
          <el-dropdown-menu class="user-dropdown-menu">
            <div class="dropdown-user-info">
              <el-avatar :size="48" :src="avatar">
                {{ username?.charAt(0)?.toUpperCase() }}
              </el-avatar>
              <div class="info-text" style="width: 50px;">
                <p class="name">{{ username }}</p>
                <p class="role">{{ t('header.admin') }}</p>
              </div>
            </div>
            <el-dropdown-item divided command="profile">
              <el-icon><User /></el-icon>{{ t('header.personalCenter') }}
            </el-dropdown-item>
            <el-dropdown-item command="settings">
              <el-icon><Setting /></el-icon>{{ t('header.systemSettings') }}
            </el-dropdown-item>
            <el-dropdown-item divided command="logout">
              <el-icon><SwitchButton /></el-icon>{{ t('header.logout') }}
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessageBox } from 'element-plus'
import {
  Fold, Expand, FullScreen, Search, Bell, Sunny, Moon,
  ArrowDown, User, Setting, SwitchButton
} from '@element-plus/icons-vue'
import { useAppStore } from '@/stores/app'
import { useUserStore } from '@/stores/user'
import { useI18n } from 'vue-i18n'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import en from 'element-plus/es/locale/lang/en'
import Breadcrumb from './Breadcrumb.vue'

const router = useRouter()
const appStore = useAppStore()
const userStore = useUserStore()
const { t, locale } = useI18n()

const isCollapsed = computed(() => appStore.sidebarCollapsed)
const isDark = computed(() => appStore.theme === 'dark')
const isEn = computed(() => appStore.language === 'en-US')
const username = computed(() => userStore.username)
const avatar = computed(() => userStore.avatar)

// 模拟消息通知
const notifications = ref([
  { title: '采购审批', desc: '您有一条采购申请待审批，金额 ¥12,500', time: '5分钟前', read: false },
  { title: '库存预警', desc: '商品「iPhone15 Pro」库存不足，当前仅剩 5 件', time: '1小时前', read: false },
  { title: '订单提醒', desc: '新订单 SO20240615001 已创建，请及时处理', time: '2小时前', read: true }
])

// 切换侧边栏
function toggleSidebar() {
  appStore.toggleSidebar()
}

// 全屏切换
function toggleFullScreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen()
  } else {
    document.exitFullscreen()
  }
}

// 主题切换
function toggleTheme() {
  appStore.toggleTheme()
}

// 语言切换
function toggleLanguage() {
  const newLang = appStore.language === 'zh-CN' ? 'en-US' : 'zh-CN'
  appStore.setLanguage(newLang)
  locale.value = newLang
  // 同步 Element Plus 语言包
  const elLocale = newLang === 'en-US' ? en : zhCn
  document.querySelector('#app')?.__vue_app__?.config?.globalProperties?.$locale?.value
  // 通过重新挂载 Element Plus locale 实现切换
  window.location.reload()
}

// 全局搜索
function handleSearch() {
  console.log('打开全局搜索')
}

// 下拉命令处理
async function handleCommand(command) {
  switch (command) {
    case 'logout':
      try {
        await ElMessageBox.confirm(t('header.confirmLogout'), t('header.tips'), {
          confirmButtonText: t('common.confirm'),
          cancelButtonText: t('common.cancel'),
          type: 'warning'
        })
        await userStore.logout()
        router.push('/login')
      } catch (e) {
        // 取消操作
      }
      break
    case 'profile':
      router.push('/profile')
      break
    case 'settings':
      router.push('/system/config')
      break
  }
}
</script>

<style lang="scss" scoped>
.navbar {
  height: var(--header-height);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  background-color: var(--bg-color);
  box-shadow: 0 1px 4px rgba(0, 21, 41, 0.06);
  z-index: 10;
  position: relative;
}

.navbar-left {
  display: flex;
  align-items: center;
  gap: 14px;
}

.hamburger {
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border-radius: var(--border-radius-base);
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  color: var(--text-secondary);

  &:hover {
    background-color: rgba(0, 0, 0, 0.04);
    color: var(--text-primary);
  }

  html.dark & {
    &:hover {
      background-color: rgba(255, 255, 255, 0.08);
    }
  }
}

.navbar-right {
  display: flex;
  align-items: center;
  gap: 4px;
}

.navbar-action {
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: var(--border-radius-base);
  color: var(--text-secondary);
  transition: all 0.25s ease;

  &:hover {
    background-color: rgba(0, 0, 0, 0.04);
    color: var(--primary-color);
  }

  html.dark & {
    &:hover {
      background-color: rgba(255, 255, 255, 0.08);
    }
  }

  &.search-trigger {
    width: auto;
    padding: 0 10px;
    gap: 6px;
    border-radius: 8px;
    border: 1px solid var(--border-color-light);
    font-size: 13px;

    .search-hint {
      font-size: 11px;
      color: var(--text-placeholder);
      background: var(--bg-color-page);
      padding: 1px 5px;
      border-radius: 4px;
    }

    &:hover {
      border-color: var(--primary-color-light);
      background-color: transparent;
    }
  }

  &.notification-action {
    position: relative;

    :deep(.el-badge__content) {
      top: 4px;
      right: 4px;
    }
  }

  &.lang-switch {
    width: auto;
    padding: 0 8px;

    .lang-text {
      font-size: 13px;
      font-weight: 700;
      color: var(--text-secondary);
      letter-spacing: 0;
    }

    &:hover .lang-text {
      color: var(--primary-color);
    }
  }
}

.nav-divider {
  width: 1px;
  height: 18px;
  background-color: var(--border-color-light);
  margin: 0 8px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 10px 4px 4px;
  cursor: pointer;
  border-radius: var(--border-radius-base);
  transition: all 0.25s ease;

  &:hover {
    background-color: rgba(0, 0, 0, 0.03);
  }

  html.dark & {
    &:hover {
      background-color: rgba(255, 255, 255, 0.08);
    }
  }

  .user-avatar {
    flex-shrink: 0;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    font-size: 13px;
    font-weight: 600;
    color: #fff;
  }

  .username {
    font-size: 13px;
    color: var(--text-primary);
    max-width: 80px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-weight: 500;
  }

  .arrow-icon {
    color: var(--text-placeholder);
    transition: transform 0.25s ease;
  }

  &:hover .arrow-icon {
    transform: rotate(180deg);
  }
}
</style>

<style lang="scss">
.notification-popover {
  padding: 0 !important;
  border-radius: 12px !important;
  overflow: hidden;
}

.notification-panel {
  .notification-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 18px;
    border-bottom: 1px solid var(--border-color-lighter);

    .title {
      font-size: 15px;
      font-weight: 600;
      color: var(--text-primary);
    }
  }

  .notification-list {
    max-height: 300px;
    overflow-y: auto;
    padding: 8px 0;
  }

  .notification-item {
    display: flex;
    padding: 12px 18px;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
      background-color: var(--bg-color-page);
    }

    &.unread {
      background-color: #f8faff;
    }

    html.dark &.unread {
      background-color: rgba(64, 158, 255, 0.08);
    }

    .notify-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--border-color-light);
      margin-top: 6px;
      margin-right: 12px;
      flex-shrink: 0;
      transition: all 0.2s;

      &.active {
        background: var(--primary-color);
        box-shadow: 0 0 6px rgba(64, 158, 255, 0.4);
      }
    }

    .notify-content {
      flex: 1;
      min-width: 0;

      .notify-title {
        font-size: 13px;
        font-weight: 500;
        color: var(--text-primary);
        margin-bottom: 4px;
      }

      .notify-desc {
        font-size: 12px;
        color: var(--text-secondary);
        line-height: 1.5;
        margin-bottom: 4px;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }

      .notify-time {
        font-size: 11px;
        color: var(--text-placeholder);
      }
    }
  }
}

.user-dropdown-menu {
  padding: 8px 0;

  .dropdown-user-info {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 16px 20px;
    background: linear-gradient(135deg, #f5f7fa 0%, #e4e7ed 100%);

    html.dark & {
      background: linear-gradient(135deg, #262627 0%, #363637 100%);
    }

    .el-avatar {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      font-size: 18px;
      font-weight: 700;
      color: #fff;
    }

    .info-text {
      .name {
        font-size: 14px;
        font-weight: 600;
        color: var(--text-primary);
        margin-bottom: 2px;
      }

      .role {
        font-size: 12px;
        color: var(--text-secondary);
      }
    }
  }

  .el-dropdown-menu__item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 20px;
    font-size: 13px;

    .el-icon {
      font-size: 15px;
      color: var(--text-secondary);
    }

    &:hover {
      background-color: var(--bg-color-page);
      color: var(--primary-color);

      .el-icon {
        color: var(--primary-color);
      }
    }
  }
}
</style>
