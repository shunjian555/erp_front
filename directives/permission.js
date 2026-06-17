/**
 * 权限指令 v-permission
 * 用法: v-permission="['admin', 'editor']"
 */
import { useUserStore } from '@/stores/user'

export default {
  mounted(el, binding) {
    const { value } = binding
    const userStore = useUserStore()
    const permissions = userStore.permissions

    if (value && value instanceof Array && value.length > 0) {
      const hasPermission = permissions.some((permission) => value.includes(permission))
      if (!hasPermission) {
        el.parentNode && el.parentNode.removeChild(el)
      }
    }
  }
}
