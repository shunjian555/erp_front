import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { login as loginApi, getUserInfo as getUserInfoApi } from '@/api/user'
import { getToken, setToken, removeToken } from '@/utils/auth'

export const useUserStore = defineStore('user', () => {
  const token = ref(getToken() || '')
  const userInfo = ref({})
  const roles = ref([])
  const permissions = ref([])

  // 是否已登录
  const isLogin = computed(() => !!token.value)

  // 用户名
  const username = computed(() => userInfo.value.username || '')
  // 用户头像
  const avatar = computed(() => userInfo.value.avatar || '')

  // 登录
  async function login(loginForm) {
    try {
      const res = await loginApi(loginForm)
      token.value = res.data.token
      setToken(res.data.token)
      return res
    } catch (error) {
      return Promise.reject(error)
    }
  }

  // 获取用户信息
  async function getUserInfo() {
    try {
      const res = await getUserInfoApi()
      userInfo.value = res.data.userInfo
      roles.value = res.data.roles
      permissions.value = res.data.permissions
      return res.data
    } catch (error) {
      return Promise.reject(error)
    }
  }

  // 退出登录
  async function logout() {
    token.value = ''
    userInfo.value = {}
    roles.value = []
    permissions.value = []
    removeToken()
  }

  // 重置状态
  function resetState() {
    token.value = ''
    userInfo.value = {}
    roles.value = []
    permissions.value = []
  }

  return {
    token,
    userInfo,
    roles,
    permissions,
    isLogin,
    username,
    avatar,
    login,
    getUserInfo,
    logout,
    resetState
  }
})
