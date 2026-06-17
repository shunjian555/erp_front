/**
 * Mock 数据 - BI 报表分析
 */
import Mock from 'mockjs'
const Random = Mock.Random

export default [
  // 销售分析
  {
    url: '/api/bi/sales-analysis',
    method: 'get',
    response: () => {
      const months = [], salesData = [], profitData = []
      for (let i = 11; i >= 0; i--) {
        const d = new Date(); d.setMonth(d.getMonth() - i)
        months.push(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`)
        salesData.push(Random.float(50000, 200000, 2, 2))
        profitData.push(Random.float(10000, 80000, 2, 2))
      }
      return { code: 200, data: {
        monthlyTrend: { months, salesData, profitData },
        topGoods: Array.from({ length: 10 }, () => ({
          name: `商品${Random.ctitle(4, 6)}`, sales: Random.integer(500, 8000),
          amount: Random.float(10000, 150000, 2, 2),
          growth: Random.float(-15, 35, 1, 1)
        })),
        regionData: [
          { name: '华东', value: Random.integer(3000, 6000), amount: Random.float(400000, 900000, 2, 2) },
          { name: '华南', value: Random.integer(2000, 4500), amount: Random.float(250000, 650000, 2, 2) },
          { name: '华北', value: Random.integer(1800, 3800), amount: Random.float(200000, 550000, 2, 2) },
          { name: '西南', value: Random.integer(1200, 2800), amount: Random.float(120000, 350000, 2, 2) },
          { name: '华中', value: Random.integer(1000, 2200), amount: Random.float(100000, 280000, 2, 2) },
          { name: '西北', value: Random.integer(500, 1500), amount: Random.float(50000, 150000, 2, 2) }
        ],
        customerLevel: [
          { name: 'A类客户', value: Random.integer(20, 50), color: '#409EFF' },
          { name: 'B类客户', value: Random.integer(80, 150), color: '#67C23A' },
          { name: 'C类客户', value: Random.integer(100, 200), color: '#E6A23C' }
        ],
        summary: {
          totalSales: Random.float(2000000, 5000000, 2, 2),
          totalProfit: Random.float(400000, 1200000, 2, 2),
          avgOrderAmount: Random.float(2000, 8000, 2, 2),
          growthRate: Random.float(-5, 25, 1, 1)
        }
      }}
    }
  },
  // 采购分析
  {
    url: '/api/bi/purchase-analysis',
    method: 'get',
    response: () => ({ code: 200, data: {
      monthlyTrend: {
        months: ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'],
        purchaseData: Array.from({ length: 12 }, () => Random.float(30000, 150000, 2, 2)),
        orderCount: Array.from({ length: 12 }, () => Random.integer(10, 60))
      },
      supplierRanking: Array.from({ length: 10 }, (_, i) => ({
        name: `供应商${String.fromCharCode(65+i)}公司`, orderCount: Random.integer(5, 40),
        amount: Random.float(50000, 300000, 2, 2), onTimeRate: Random.float(85, 99.5, 1, 1)
      })),
      categoryDistribution: [
        { name: '原材料', value: Random.integer(30, 45) },
        { name: '办公用品', value: Random.integer(10, 20) },
        { name: '设备配件', value: Random.integer(15, 28) },
        { name: '包装材料', value: Random.integer(5, 15) },
        { name: '其他', value: Random.integer(3, 10) }
      ],
      summary: {
        totalPurchase: Random.float(1500000, 3500000, 2, 2),
        supplierCount: Random.integer(30, 60),
        avgOrderAmount: Random.float(5000, 20000, 2, 2),
        costReduction: Random.float(-8, 12, 1, 1)
      }
    }})
  },
  // 库存分析
  {
    url: '/api/bi/inventory-analysis',
    method: 'get',
    response: () => ({ code: 200, data: {
      stockTrend: {
        dates: Array.from({ length: 14 }, (_, i) => `${6}/${i+1}`),
        inStock: Array.from({ length: 14 }, () => Random.integer(50, 300)),
        outStock: Array.from({ length: 14 }, () => Random.integer(30, 250)),
        totalStock: Array.from({ length: 14 }, () => Random.integer(5000, 8000))
      },
      warehouseDistribution: [
        { name: '主仓库', value: Random.integer(3000, 5000) },
        { name: '分仓库A', value: Random.integer(1500, 3000) },
        { name: '分仓库B', value: Random.integer(1000, 2000) },
        { name: '临时仓', value: Random.integer(200, 800) }
      ],
      turnoverRate: Array.from({ length: 8 }, (_, i) => ({
        category: ['电子产品','办公用品','食品饮料','服装鞋帽','家居用品','原材料','设备配件','其他'][i],
        rate: Random.float(1.5, 12, 1, 1)
      })),
      warningStats: {
        lowStock: Random.integer(15, 35), overStock: Random.randint(5, 18),
        expired: Random.randint(0, 8), nearExpired: Random.randint(3, 12)
      },
      summary: {
        totalSku: Random.integer(200, 500), totalValue: Random.float(2000000, 8000000, 2, 2),
        turnoverDays: Random.float(25, 65, 1, 1), accuracyRate: Random.float(92, 99.5, 1, 1)
      }
    }})
  },
  // 利润分析
  {
    url: '/api/bi/profit-analysis',
    method: 'get',
    response: () => ({ code: 200, data: {
      profitTrend: {
        months: ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'],
        revenue: Array.from({ length: 12 }, () => Random.float(150000, 450000, 2, 2)),
        cost: Array.from({ length: 12 }, () => Random.float(80000, 280000, 2, 2)),
        profit: Array.from({ length: 12 }, () => Random.float(30000, 170000, 2, 2))
      },
      costStructure: [
        { name: '采购成本', value: Random.integer(40, 55) },
        { name: '人工成本', value: Random.integer(15, 25) },
        { name: '运营成本', value: Random.integer(10, 20) },
        { name: '物流成本', value: Random.integer(5, 12) },
        { name: '其他成本', value: Random.integer(3, 10) }
      ],
      departmentProfit: [
        { name: '销售部', revenue: Random.float(3000000, 6000000, 2, 2), profit: Random.float(500000, 1200000, 2, 2) },
        { name: '采购部', revenue: 0, profit: Random.float(-200000, -50000, 2, 2) },
        { name: '技术部', revenue: 0, profit: Random.float(-300000, -100000, 2, 2) },
        { name: '市场部', revenue: 0, profit: Random.float(-150000, -40000, 2, 2) },
        { name: '财务部', revenue: 0, profit: Random.float(-80000, -20000, 2, 2) }
      ],
      marginTrend: Array.from({ length: 12 }, (_, i) => ({
        month: `${i+1}月`, grossMargin: Random.float(22, 42, 1, 1), netMargin: Random.float(8, 22, 1, 1)
      })),
      summary: {
        totalRevenue: Random.float(5000000, 12000000, 2, 2),
        totalCost: Random.float(3200000, 7800000, 2, 2),
        totalProfit: Random.float(800000, 4200000, 2, 2),
        grossMarginRate: Random.float(28, 38, 1, 1),
        netMarginRate: Random.float(10, 20, 1, 1)
      }
    }})
  }
]
