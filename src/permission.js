/**
 * 路由权限控制
 */
import router from '@/router'
import { useUserStore } from '@/stores/user'
import NProgress from 'nprogress'
import 'nprogress/nprogress.css'

NProgress.configure({ showSpinner: false })

const whiteList = ['/login']

router.beforeEach(async (to, from, next) => {
  NProgress.start()

  const userStore = useUserStore()
  const hasToken = userStore.token

  if (hasToken) {
    if (to.path === '/login') {
      next({ path: '/' })
      NProgress.done()
    } else {
      // 页面刷新后 permissions 为空，需要重新获取用户信息
      if (userStore.permissions.length === 0) {
        try {
          await userStore.getUserInfo()
        } catch (e) {
          // 获取失败，清除 token 并跳转登录
          await userStore.logout()
          next(`/login?redirect=${to.path}`)
          NProgress.done()
          return
        }
      }
      next()
    }
  } else {
    // 未登录
    if (whiteList.includes(to.path)) {
      next()
    } else {
      next(`/login?redirect=${to.path}`)
      NProgress.done()
    }
  }
})

router.afterEach(() => {
  NProgress.done()
})
