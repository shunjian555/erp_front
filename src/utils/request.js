/**
 * 纯 Mock 请求适配器
 * - 不走真实 HTTP，所有请求在前端根据 URL 路由到本地 mock 数据
 * - 返回结构与 axios 保持兼容：{ code, data, message }
 * - 支持 GET / POST / PUT / DELETE
 */
import { ElMessage, ElMessageBox } from 'element-plus'
import NProgress from 'nprogress'
import financeMockApis from '@/mock/modules/finance.js'
import dashboardMockApis from '@/mock/dashboard.js'
import crmMockApis from '@/mock/modules/crm.js'
import oaMockApis from '@/mock/modules/oa.js'
import purchaseMockApis from '@/mock/modules/purchase.js'
import salesInventoryMockApis from '@/mock/modules/sales-inventory.js'
import biMockApis from '@/mock/modules/bi.js'
import systemMockApis from '@/mock/modules/system.js'
import wmsFinanceMockApis from '@/mock/modules/wms-finance.js'
import userMockApis from '@/mock/user.js'

// 收集所有 mock API：{ url -> { method, response } }
const mockApis = new Map()
function registerApis(list) {
  for (const api of list || []) {
    mockApis.set(`${api.method.toUpperCase()} ${api.url}`, api)
  }
}
registerApis(financeMockApis)
registerApis(dashboardMockApis)
registerApis(crmMockApis)
registerApis(oaMockApis)
registerApis(purchaseMockApis)
registerApis(salesInventoryMockApis)
registerApis(biMockApis)
registerApis(systemMockApis)
registerApis(wmsFinanceMockApis)
registerApis(userMockApis)

// 模拟网络延迟（毫秒）
const MOCK_DELAY = 200

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * 主调用函数
 * 用法：request({ url: '/api/finance/subject/list', method: 'get', params: {…}, data: {…} })
 * 返回 Promise<{ code, data, message }>
 */
async function request(config) {
  NProgress.start()
  const { url = '', method = 'get', params = {}, data = null } = config
  const upperMethod = method.toUpperCase()
  const key = `${upperMethod} ${url}`

  try {
    // 优先精确匹配
    let api = mockApis.get(key)

    // 兼容：params 在 url 上
    if (!api && params && Object.keys(params).length) {
      const qs = new URLSearchParams(params).toString()
      api = mockApis.get(`${upperMethod} ${url}?${qs}`)
    }

    await delay(MOCK_DELAY)
    NProgress.done()

    if (!api) {
      console.warn(`[Mock] 未注册接口: ${key}`)
      // 兜底：返回空数据，避免页面崩溃
      return { code: 200, data: { list: [], total: 0 } }
    }

    // 构造 mock 上下文（与 vite-plugin-mock 保持一致）
    const mockConfig = {
      url,
      method: upperMethod,
      body: data,
      query: params,
      params
    }

    const result = api.response(mockConfig)
    if (result && typeof result.then === 'function') {
      return await result
    }

    // 业务错误码检查
    if (result && result.code !== undefined && result.code !== 200) {
      const errMsg = result.message || '请求失败'
      ElMessage.error(errMsg)
      return Promise.reject(new Error(errMsg))
    }

    return result
  } catch (err) {
    NProgress.done()
    console.error('[Mock] 请求异常:', err)
    ElMessage.error(err.message || '请求失败')
    return Promise.reject(err)
  }
}

// 导出与 axios service 相同的形态，便于上层直接 import
export default request

// 额外导出：401 处理工具（按需使用）
export function handleUnauthorized() {
  ElMessageBox.confirm('登录状态已过期，请重新登录', '提示', {
    confirmButtonText: '重新登录',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    import('@/router').then(({ default: router }) => {
      import('@/stores/user').then(({ useUserStore }) => {
        const userStore = useUserStore()
        userStore.logout()
        router.push('/login')
      })
    })
  })
}

// 工具：手动注册其它 mock 模块
export function registerMockModule(list) {
  registerApis(list)
}
