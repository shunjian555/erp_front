import { defineStore } from 'pinia'
import { ref } from 'vue'
import { asyncRoutes, constantRoutes } from '@/router'

// 判断是否有权限访问路由
function hasPermission(roles, route) {
  if (route.meta && route.meta.roles) {
    return roles.some((role) => route.meta.roles.includes(role))
  }
  return true
}

// 过滤异步路由
function filterAsyncRoutes(routes, roles) {
  const res = []
  routes.forEach((route) => {
    const tmp = { ...route }
    if (hasPermission(roles, tmp)) {
      if (tmp.children) {
        tmp.children = filterAsyncRoutes(tmp.children, roles)
      }
      res.push(tmp)
    }
  })
  return res
}

export const usePermissionStore = defineStore('permission', () => {
  const routes = ref([])
  const dynamicRoutes = ref([])

  // 根据角色生成可访问的路由
  function generateRoutes(roles) {
    let accessedRoutes
    if (roles.includes('admin')) {
      accessedRoutes = asyncRoutes
    } else {
      accessedRoutes = filterAsyncRoutes(asyncRoutes, roles)
    }
    routes.value = constantRoutes.concat(accessedRoutes)
    dynamicRoutes.value = accessedRoutes
    return accessedRoutes
  }

  return {
    routes,
    dynamicRoutes,
    generateRoutes
  }
})
