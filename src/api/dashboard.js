import request from '@/utils/request'

// 获取仪表盘统计数据
export function getDashboardStats() {
  return request({
    url: '/api/dashboard/stats',
    method: 'get'
  })
}

// 获取销售趋势
export function getSalesTrend(days = 7) {
  return request({
    url: '/api/dashboard/sales-trend',
    method: 'get',
    params: { days }
  })
}

// 获取销售排行
export function getSalesRanking() {
  return request({
    url: '/api/dashboard/sales-ranking',
    method: 'get'
  })
}

// 获取库存预警
export function getInventoryWarning() {
  return request({
    url: '/api/dashboard/inventory-warning',
    method: 'get'
  })
}

// 获取待办事项
export function getTodoList() {
  return request({
    url: '/api/dashboard/todo-list',
    method: 'get'
  })
}
