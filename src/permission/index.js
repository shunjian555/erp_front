import NProgress from 'nprogress'
import 'nprogress/nprogress.css'
import router from '@/router'
import { useUserStore } from '@/stores/user'
import { usePermissionStore } from '@/stores/permission'

NProgress.configure({ showSpinner: false })

const whiteList = ['/login']

router.beforeEach(async (to, from, next) => {
  NProgress.start()

  const userStore = useUserStore()
  const permissionStore = usePermissionStore()

  if (userStore.token) {
    if (to.path === '/login') {
      next({ path: '/' })
      NProgress.done()
    } else {
      // 检查是否已生成动态路由
      if (permissionStore.routes.length === 0) {
        try {
          // 从store获取路由（实际项目中从后端获取）
          const accessRoutes = permissionStore.generateRoutes(userStore.roles)
          accessRoutes.forEach((route) => {
            router.addRoute(route)
          })
          // 确保路由已添加完成
          next({ ...to, replace: true })
        } catch (error) {
          await userStore.logout()
          next(`/login?redirect=${to.path}`)
          NProgress.done()
        }
      } else {
        next()
      }
    }
  } else {
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
