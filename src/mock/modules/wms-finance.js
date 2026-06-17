/**
 * Mock 数据 - WMS 仓储管理 & 财务管理
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

// ==================== WMS ====================
export default [
  // 仓库管理
  {
    url: '/api/wms/warehouse/list',
    method: 'get',
    response: () => ({ code: 200, data: {
      list: [
        { id: 1, code: 'WH001', name: '主仓库', address: '北京市朝阳区xxx路88号', manager: '张三', area: 5000, status: 1, createTime: '2024-01-01 00:00:00' },
        { id: 2, code: 'WH002', name: '分仓库A', address: '上海市浦东新区xxx路66号', manager: '李四', area: 3000, status: 1, createTime: '2024-02-01 00:00:00' },
        { id: 3, code: 'WH003', name: '分仓库B', address: '广州市天河区xxx路128号', manager: '王五', area: 2500, status: 1, createTime: '2024-03-01 00:00:00' },
        { id: 4, code: 'WH004', name: '临时仓', address: '深圳市南山区xxx路56号', manager: '赵六', area: 800, status: 0, createTime: '2024-04-01 00:00:00' }
      ],
      total: 4
    }})
  },
  // 库区管理
  {
    url: '/api/wms/area/list',
    method: 'get',
    response: () => genList({ total: 18, recordName: '库区', fields: {
      code: `AREA${String(Math.floor((Math.random() * 20) + 1)).padStart(3,'0')}`,
      name: `库区-${['A','B','C','D','E','F'][Math.floor(Math.random() * 6)]}${Math.floor(Math.random() * 3) + 1}`,
      warehouseName: ['主仓库','分仓库A','分仓库B'],
      type: ['normal','cold','hazardous'],
      capacity: Random.integer(500, 5000), status: [0, 1], createTime: '{{date}}'
    }})
  },
  // 库位管理
  {
    url: '/api/wms/location/list',
    method: 'get',
    response: () => genList({ total: 86, recordName: '库位', fields: {
      locationCode: `LOC-${['A','B','C','D'][Math.floor(Math.random()*4)]}${String(Math.floor(Math.random()*10)+1).padStart(2,'0')}-${String(Math.floor(Math.random()*8)+1).padStart(2,'0')}`,
      areaName: `库区-A${Math.floor(Math.random()*3)+1}`,
      warehouseName: ['主仓库','分仓库A'],
      rowCol: `${Math.floor(Math.random()*10)+1}排${Math.floor(Math.random()*5)+1}列`,
      maxWeight: Random.integer(500, 2000), status: [0, 1]
    }})
  },
  // 调拨管理
  {
    url: '/api/wms/transfer/list',
    method: 'get',
    response: () => genList({ total: 28, recordName: '调拨单', fields: {
      transferNo: `TF${Random.string('number', 8)}`,
      fromWarehouse: ['主仓库','分仓库A'],
      toWarehouse: ['分仓库A','分仓库B','主仓库'],
      goodsName: '{{title}}', quantity: Random.integer(10, 300),
      operator: genCName(), status: [0, 1, 2, 3], createTime: '{{date}}'
    }})
  },
  // 批次管理
  {
    url: '/api/wms/batch/list',
    method: 'get',
    response: () => genList({ total: 65, recordName: '批次', fields: {
      batchNo: `BAT${Random.string('number', 10)}`, goodsName: '{{title}}',
      quantity: Random.integer(50, 2000), produceDate: Random.date('yyyy-MM-dd'),
      expireDate: Random.date('yyyy-MM-dd'), warehouse: ['主仓库','分仓库A'],
      status: [0, 1]
    }})
  },
  // 条码管理
  {
    url: '/api/wms/barcode/list',
    method: 'get',
    response: () => genList({ total: 120, recordName: '条码', fields: {
      barcode: Random.string('number', 13), goodsName: '{{title}}',
      batchNo: `BAT${Random.string('number', 10)}`,
      quantity: Random.integer(1, 500), type: ['EAN13','CODE128','QR'],
      createTime: '{{date}}'
    }})
  },

  // ==================== 财务管理 ====================
  // 凭证/科目/账簿 基础版接口已迁移到 finance.js（完整版：含分录、状态、模板、期间）
  // 应收/应付/收付款/费用/发票 保留旧版接口

  // 应收管理
  // 应收管理
  {
    url: '/api/finance/receivable/list',
    method: 'get',
    response: () => {
      const res = genList({ total: 58, recordName: '应收单', fields: {
        receivableNo: `AR${Random.string('number', 8)}`, customerName: '{{name}}',
        orderNo: `SO${Random.string('number', 8)}`, amount: '{{amount}}',
        receivedAmount: Random.float(0, 50000, 2, 2),
        dueDate: Random.date('yyyy-MM-dd'), status: [0, 1]
      }})
      res.data.list.forEach(item => { item.remainAmount = +(parseFloat(item.amount) - parseFloat(item.receivedAmount)).toFixed(2) })
      return res
    }
  },
  // 应付管理
  {
    url: '/api/finance/payable/list',
    method: 'get',
    response: () => {
      const res = genList({ total: 42, recordName: '应付单', fields: {
        payableNo: `AP${Random.string('number', 8)}`, supplierName: '{{name}}',
        orderNo: `PO${Random.string('number', 8)}`, amount: '{{amount}}',
        paidAmount: Random.float(0, 40000, 2, 2),
        dueDate: Random.date('yyyy-MM-dd'), status: [0, 1]
      }})
      res.data.list.forEach(item => { item.remainAmount = +(parseFloat(item.amount) - parseFloat(item.paidAmount)).toFixed(2) })
      return res
    }
  },
  // 收款单
  {
    url: '/api/finance/receipt/list',
    method: 'get',
    response: () => genList({ total: 86, recordName: '收款单', fields: {
      receiptNo: `RCT${Random.string('number', 8)}`, customerName: '{{name}}',
      amount: '{{amount}}', payMethod: ['cash','bank','alipay','wechat'],
      orderNo: `SO${Random.string('number', 8)}`, status: [0, 1], createTime: '{{date}}'
    }})
  },
  // 付款单
  {
    url: '/api/finance/payment/list',
    method: 'get',
    response: () => genList({ total: 72, recordName: '付款单', fields: {
      paymentNo: `PAY${Random.string('number', 8)}`, supplierName: '{{name}}',
      amount: '{{amount}}', payMethod: ['cash','bank','wechat'],
      orderNo: `PO${Random.string('number', 8)}`, status: [0, 1], createTime: '{{date}}'
    }})
  },
  // 费用管理
  {
    url: '/api/finance/expense/list',
    method: 'get',
    response: () => genList({ total: 95, recordName: '费用单', fields: {
      expenseNo: `EXP${Random.string('number', 8)}`,
      category: ['travel','office','entertainment','transport','communication'],
      amount: '{{amount}}', description: Random.cparagraph(1, 2),
      applicant: genCName(), status: [0, 1], createTime: '{{date}}'
    }})
  },
  // 发票管理
  {
    url: '/api/finance/invoice/list',
    method: 'get',
    response: () => genList({ total: 55, recordName: '发票', fields: {
      invoiceNo: Random.string('number', 18),
      invoiceType: ['in','out'], title: '{{name}}公司', amount: '{{amount}}',
      taxAmount: +(Random.float(100, 99999, 2, 2) * 0.13).toFixed(2),
      issueDate: Random.date('yyyy-MM-dd'), status: [0, 1]
    }})
  }
]
