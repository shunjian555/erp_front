/**
 * Mock 数据 - Dashboard 首页
 */
import Mock from 'mockjs'
const Random = Mock.Random

export default [
  // 统计卡片数据
  {
    url: '/api/dashboard/stats',
    method: 'get',
    response: () => ({
      code: 200,
      data: {
        salesAmount: Random.float(100000, 500000, 2, 2),
        orderCount: Random.integer(800, 1500),
        purchaseAmount: Random.float(60000, 300000, 2, 2),
        inventoryAmount: Random.float(200000, 800000, 2, 2),
        customerCount: Random.integer(200, 500),
        supplierCount: Random.integer(50, 150),
        pendingApproval: Random.integer(10, 50),
        profit: Random.float(50000, 200000, 2, 2)
      }
    })
  },
  // 销售趋势（支持时间范围参数）
  {
    url: '/api/dashboard/sales-trend',
    method: 'get',
    response: ({ query }) => {
      const days = parseInt(query.days) || 30
      const dates = [], values = []
      for (let i = days - 1; i >= 0; i--) {
        const d = new Date(); d.setDate(d.getDate() - i)
        dates.push(`${d.getMonth()+1}/${d.getDate()}`)
        values.push(Random.integer(5000, 30000))
      }
      return { code: 200, data: { dates, values } }
    }
  },
  // 销售排行 Top10
  {
    url: '/api/dashboard/sales-ranking',
    method: 'get',
    response: () => ({
      code: 200,
      data: Array.from({ length: 10 }, () => ({
        name: `商品${Random.ctitle(4,6)}`,
        sales: Random.integer(1000, 10000),
        amount: Random.float(10000, 100000, 2, 2)
      }))
    })
  },
  // 库存预警
  {
    url: '/api/dashboard/inventory-warning',
    method: 'get',
    response: () => ({
      code: 200,
      data: {
        list: Array.from({ length: 8 }, (_, i) => ({
          id: i + 1, goodsName: `商品${Random.ctitle(3,5)}`,
          currentStock: Random.integer(0, 20),
          safeStock: Random.integer(30, 100),
          unit: ['个','件','箱','套'][i % 4]
        })),
        total: 8
      }
    })
  },
  // 待办事项
  {
    url: '/api/dashboard/todo-list',
    method: 'get',
    response: () => ({
      code: 200,
      data: [
        { type: 'purchase', title: '待审批采购单', count: Random.integer(3,10), icon: 'ShoppingCart', color: '#e6a23c' },
        { type: 'delivery', title: '待发货订单', count: Random.integer(5,15), icon: 'Van', color: '#409eff' },
        { type: 'return', title: '待处理退货', count: Random.integer(1,5), icon: 'RefreshLeft', color: '#f56c6c' }
      ]
    })
  }
]
