/**
 * Mock 数据 - 商品中心 & 采购管理
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

export default [
  // 商品管理
  {
    url: '/api/product/goods/list',
    method: 'get',
    response: () => {
      const colors = ['红色', '蓝色', '黑色', '白色', '绿色']
      const sizes = ['S', 'M', 'L', 'XL', 'XXL']
      const materials = ['塑料', '金属', '木质', '玻璃', '陶瓷']
      const units = ['个', '件', '箱', '套', 'kg', '台']
      const categories = ['电子产品', '办公用品', '食品饮料', '服装鞋帽', '家居用品', '原材料']
      const brands = ['品牌A', '品牌B', '品牌C', '品牌D', '品牌E']

      const list = Array.from({ length: 10 }, (_, i) => {
        const isMulti = Math.random() > 0.5
        const item = {
          id: i + 1,
          goodsCode: `SP${Random.string('number', 7)}`,
          goodsName: Random.ctitle(4, 10),
          category: categories[Random.integer(0, categories.length - 1)],
          brand: brands[Random.integer(0, brands.length - 1)],
          status: Random.integer(0, 1),
          createTime: Random.datetime('yyyy-MM-dd HH:mm:ss'),
          specType: isMulti ? 'multi' : 'single'
        }

        if (isMulti) {
          // 多规格商品
          const specCount = Random.integer(1, 2)
          const specNames = []
          if (specCount >= 1) {
            const vals = Array.from({ length: Random.integer(2, 4) }, () => colors[Random.integer(0, colors.length - 1)])
            specNames.push({ name: '颜色', values: [...new Set(vals)] })
          }
          if (specCount >= 2) {
            const vals = Array.from({ length: Random.integer(2, 4) }, () => sizes[Random.integer(0, sizes.length - 1)])
            specNames.push({ name: '尺寸', values: [...new Set(vals)] })
          }

          // 生成 SKU 笛卡尔积
          const skuCombinations = specNames.reduce((acc, sn) => {
            const result = []
            acc.forEach(comb => sn.values.forEach(v => result.push([...comb, v])))
            return result
          }, [[]])

          item.specNames = specNames
          item.unit = ''
          item.skus = skuCombinations.map((combo, j) => ({
            id: j + 1,
            skuCode: `SKU-${item.goodsCode}-${combo.join('-')}`,
            specValues: combo,
            price: Random.float(100, 9999, 2, 2),
            costPrice: Random.float(50, 800, 2, 2),
            stock: Random.integer(0, 500),
            status: Random.integer(0, 1)
          }))
          // 列表展示用：取最低价和总库存
          item.price = Math.min(...item.skus.map(s => s.price))
          item.stock = item.skus.reduce((sum, s) => sum + s.stock, 0)
        } else {
          // 单规格商品
          item.unit = units[Random.integer(0, units.length - 1)]
          item.price = Random.float(100, 9999, 2, 2)
          item.costPrice = Random.float(50, 800, 2, 2)
          item.stock = Random.integer(0, 5000)
          item.specNames = []
          item.skus = []
        }

        return item
      })
      return { code: 200, data: { list, total: 128 } }
    }
  },
  // 商品分类
  {
    url: '/api/product/category/list',
    method: 'get',
    response: () => ({ code: 200, data: [
      { id: 1, parentId: 0, name: '电子产品', code: 'ELEC', sort: 1, children: [
        { id: 11, parentId: 1, name: '手机数码', code: 'ELEC-PHONE', sort: 1 },
        { id: 12, parentId: 1, name: '电脑配件', code: 'ELEC-PC', sort: 2 },
        { id: 13, parentId: 1, name: '智能设备', code: 'ELEC-SMART', sort: 3 }
      ]},
      { id: 2, parentId: 0, name: '办公用品', code: 'OFFICE', sort: 2, children: [
        { id: 21, parentId: 2, name: '文具纸品', code: 'OFFICE-WRITE', sort: 1 },
        { id: 22, parentId: 2, name: '办公设备', code: 'OFFICE-EQUIP', sort: 2 }
      ]},
      { id: 3, parentId: 0, name: '食品饮料', code: 'FOOD', sort: 3 },
      { id: 4, parentId: 0, name: '服装鞋帽', code: 'CLOTH', sort: 4 }
    ]})
  },
  // 品牌管理
  {
    url: '/api/product/brand/list',
    method: 'get',
    response: () => ({ code: 200, data: {
      list: ['华为','苹果','小米','联想','戴尔','得力','晨光','三只松鼠'].map((n, i) => ({
        id: i + 1, name: n, logo: '', description: `${n}是全球知名的科技/消费品牌，产品涵盖手机、电脑、智能家居等多个领域`, sort: i + 1,
        status: 1, createTime: '2024-01-01 00:00:00'
      })),
      total: 8
    }})
  },
  // 单位管理
  {
    url: '/api/product/unit/list',
    method: 'get',
    response: () => ({ code: 200, data: {
      list: ['个','件','箱','套','kg','台'].map((n, i) => ({
        id: i + 1, code: `UNIT${String(i + 1).padStart(3,'0')}`,
        name: n, description: '', status: 1, createTime: '2024-01-01 00:00:00'
      })),
      total: 6
    }})
  },
  // 采购申请
  {
    url: '/api/purchase/request/list',
    method: 'get',
    response: () => genList({ total: 45, recordName: '采购申请', fields: {
      requestNo: `PR${Random.string('number', 8)}`, goodsName: '{{title}}',
      quantity: Random.integer(1, 200), budgetAmount: '{{amount}}',
      reason: Random.cparagraph(1, 2), applicant: genCName(),
      department: ['采购部', '研发部', '运营部', '生产部', '行政部'],
      applyDate: Random.datetime('yyyy-MM-dd'),
      status: [0, 1, 2, 3], createTime: '{{date}}'
    }})
  },
  // 采购订单
  {
    url: '/api/purchase/order/list',
    method: 'get',
    response: () => genList({ total: 78, recordName: '采购订单', fields: {
      orderNo: `PO${Random.string('number', 8)}`, supplierName: '{{name}}',
      totalAmount: '{{amount}}', quantity: Random.integer(10, 500),
      contactPerson: genCName(), phone: /^1[3-9]\d{9}$/,
      deliveryDate: Random.datetime('yyyy-MM-dd'),
      remark: Random.cparagraph(1, 2),
      status: [0, 1, 2, 3], createTime: '{{date}}'
    }})
  },
  // 采购入库
  {
    url: '/api/purchase/inbound/list',
    method: 'get',
    response: () => genList({ total: 95, recordName: '入库单', fields: {
      inboundNo: `IN${Random.string('number', 8)}`, orderNo: `PO${Random.string('number', 8)}`,
      supplierName: '{{name}}', totalAmount: '{{amount}}',
      quantity: Random.integer(5, 300),
      warehouse: ['主仓库', '分仓库A', '分仓库B'],
      operator: genCName(),
      inboundDate: Random.datetime('yyyy-MM-dd'),
      remark: Random.cparagraph(1, 2),
      status: [0, 1], createTime: '{{date}}'
    }})
  },
  // 采购退货
  {
    url: '/api/purchase/return/list',
    method: 'get',
    response: () => genList({ total: 18, recordName: '退货单', fields: {
      returnNo: `PUR-R${Random.string('number', 7)}`, orderNo: `PO${Random.string('number', 8)}`,
      supplierName: '{{name}}', amount: '{{amount}}',
      quantity: Random.integer(1, 100),
      reason: ['质量问题', '规格不符', '数量多余', '其他'],
      applicant: genCName(),
      applyDate: Random.datetime('yyyy-MM-dd'),
      status: [0, 1], createTime: '{{date}}'
    }})
  },
  // 供应商管理
  {
    url: '/api/purchase/supplier/list',
    method: 'get',
    response: () => genList({ total: 32, recordName: '供应商', fields: {
      supplierName: '{{name}}', contactPerson: genCName(),
      phone: /^1[3-9]\d{9}$/, email: Random.email(),
      address: Random.city(true), level: ['战略', '核心', '普通'],
      status: [0, 1], createTime: '{{date}}'
    }})
  }
]
