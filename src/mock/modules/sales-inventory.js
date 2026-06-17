/**
 * Mock 数据 - 销售管理 & 库存管理
 */
import Mock from 'mockjs'
const Random = Mock.Random

// 中文姓名生成（替代不可用的 genCName()）
const surnames = ['张', '王', '李', '赵', '刘', '陈', '杨', '黄', '周', '吴']
const maleNames = ['伟', '强', '磊', '军', '勇', '杰', '涛', '明', '超', '华']
const femaleNames = ['芳', '娜', '敏', '静', '丽', '娟', '艳', '霞', '燕', '玲']
function genCName() {
  const surname = surnames[Random.integer(0, surnames.length - 1)]
  const names = Math.random() > 0.4 ? maleNames : femaleNames
  return surname + names[Random.integer(0, names.length - 1)] + (Math.random() > 0.5 ? names[Random.integer(0, names.length - 1)] : '')
}

function genList(opts) {
  const { total = 50, recordName, fields } = opts
  const list = Array.from({ length: Math.min(total, 10) }, (_, i) => {
    const item = { id: i + 1 }
    Object.entries(fields).forEach(([k, v]) => {
      if (typeof v === 'function') { item[k] = v(i) }
      else if (v === '{{name}}') item[k] = `${recordName}-${i + 1}`
      else if (v === '{{title}}') item[k] = Random.ctitle(6, 12)
      else if (v === '{{code}}') item[k] = `CODE${Random.string('number', 8)}`
      else if (v === '{{amount}}') item[k] = Random.float(100, 99999, 2, 2)
      else if (v === '{{date}}') item[k] = Random.datetime('yyyy-MM-dd HH:mm:ss')
      else if (Array.isArray(v)) item[k] = v[Random.integer(0, v.length - 1)]
      else item[k] = v
    })
    return item
  })
  return { code: 200, data: { list, total } }
}

// ==================== 销售管理 ====================
export default [
  // 销售订单
  {
    url: '/api/sales/order/list',
    method: 'get',
    response: () => genList({ total: 156, recordName: '销售订单', fields: {
      orderNo: `SO${Random.string('number', 8)}`, customerName: '{{name}}',
      totalAmount: '{{amount}}', quantity: Random.integer(5, 200),
      deliveryDate: Random.date('yyyy-MM-dd'), status: [0, 1, 2, 3, 4],
      createTime: '{{date}}'
    }})
  },
  // 销售出库
  {
    url: '/api/sales/outbound/list',
    method: 'get',
    response: () => genList({ total: 120, recordName: '出库单', fields: {
      outboundNo: `OUT${Random.string('number', 8)}`, orderNo: `SO${Random.string('number', 8)}`,
      customerName: '{{name}}', quantity: Random.integer(5, 150),
      outboundDate: Random.date('yyyy-MM-dd'), status: [0, 1],
      createTime: '{{date}}'
    }})
  },
  // 销售退货
  {
    url: '/api/sales/return/list',
    method: 'get',
    response: () => genList({ total: 22, recordName: '退货单', fields: {
      returnNo: `SAL-R${Random.string('number', 7)}`, orderNo: `SO${Random.string('number', 8)}`,
      customerName: '{{name}}', amount: '{{amount}}',
      reason: ['质量问题','发错货','客户拒收','其他'],
      status: [0, 1], createTime: '{{date}}'
    }})
  },
  // 销售客户
  {
    url: '/api/sales/customer/list',
    method: 'get',
    response: () => genList({ total: 68, recordName: '客户', fields: {
      customerName: '{{name}}', contactName: genCName(),
      phone: /^1[3-9]\d{9}$/, email: Random.email(),
      address: Random.city(true), level: ['A','B','C'],
      status: [0, 1], createTime: '{{date}}'
    }})
  },

  // ==================== 库存管理 ====================
  // 库存查询
  {
    url: '/api/inventory/query/list',
    method: 'get',
    response: () => {
      const res = genList({ total: 256, recordName: '库存', fields: {
        goodsCode: `SP${Random.string('number', 7)}`, goodsName: '{{title}}',
        category: ['电子产品','办公用品','食品饮料','服装鞋帽'],
        warehouse: ['主仓库','分仓库A','分仓库B','临时仓'],
        unit: ['个','件','箱','套'],
        safeStock: Random.integer(30, 200), stock: Random.integer(0, 500),
        costPrice: '{{amount}}', updateTime: '{{date}}'
      }})
      res.data.list.forEach(item => {
        item.totalValue = +(item.stock * parseFloat(item.costPrice)).toFixed(2)
      })
      return res
    }
  },
  // 库存流水
  {
    url: '/api/inventory/flow/list',
    method: 'get',
    response: () => {
      const res = genList({ total: 380, recordName: '流水', fields: {
        flowNo: `FL${Random.string('number', 9)}`, goodsName: '{{title}}',
        type: ['in','out'], quantity: Random.integer(1, 200),
        beforeStock: Random.integer(50, 500),
        sourceType: ['采购入库','销售出库','盘点调整','调拨','退货'],
        operator: genCName(), createTime: '{{date}}'
      }})
      res.data.list.forEach(item => {
        item.afterStock = item.type === 'out' ? item.beforeStock - item.quantity : item.beforeStock + item.quantity
      })
      return res
    }
  },
  // 库存预警
  {
    url: '/api/inventory/warning/list',
    method: 'get',
    response: () => {
      const res = genList({ total: 28, recordName: '预警', fields: {
        goodsCode: `SP${Random.string('number', 7)}`, goodsName: '{{title}}',
        currentStock: Random.integer(0, 25), safeStock: Random.integer(30, 100),
        unit: ['个','件','箱'], level: ['high','medium','low'],
        status: 1, lastInDate: Random.date('yyyy-MM-dd')
      }})
      res.data.list.forEach(item => { item.gap = Math.max(0, item.safeStock - item.currentStock) })
      return res
    }
  },
  // 库存盘点
  {
    url: '/api/inventory/stocktake/list',
    method: 'get',
    response: () => genList({ total: 16, recordName: '盘点单', fields: {
      stocktakeNo: `ST${Random.string('number', 8)}`,
      warehouse: ['主仓库','分仓库A','分仓库B'],
      totalCount: Random.integer(50, 300), diffCount: Random.integer(-10, 15),
      executor: genCName(), startTime: '{{date}}', status: [0, 1, 2, 3]
    }})
  },
  // 库存调整
  {
    url: '/api/inventory/adjust/list',
    method: 'get',
    response: () => genList({ total: 34, recordName: '调整单', fields: {
      adjustNo: `ADJ${Random.string('number', 8)}`, goodsName: '{{title}}',
      adjustType: ['increase','decrease'], adjustQty: Random.integer(1, 100),
      reason: ['盘盈','盘损','损坏','过期','其他'],
      operator: genCName(), status: [0, 1], createTime: '{{date}}'
    }})
  }
]
