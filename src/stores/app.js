import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useAppStore = defineStore('app', () => {
  // 侧边栏是否折叠
  const sidebarCollapsed = ref(false)
  // 设备类型（mobile / desktop）
  const device = ref('desktop')
  // 主题模式
  const theme = ref(localStorage.getItem('erp_theme') || 'light')

  // 切换侧边栏折叠状态
  function toggleSidebar() {
    sidebarCollapsed.value = !sidebarCollapsed.value
  }

  // 关闭侧边栏
  function closeSidebar() {
    sidebarCollapsed.value = true
  }

  // 打开侧边栏
  function openSidebar() {
    sidebarCollapsed.value = false
  }

  // 设置设备类型
  function setDevice(deviceType) {
    device.value = deviceType
  }

  // 切换主题
  function toggleTheme() {
    theme.value = theme.value === 'light' ? 'dark' : 'light'
    localStorage.setItem('erp_theme', theme.value)
    document.documentElement.setAttribute('data-theme', theme.value)
  }

  return {
    sidebarCollapsed,
    device,
    theme,
    toggleSidebar,
    closeSidebar,
    openSidebar,
    setDevice,
    toggleTheme
  }
})
