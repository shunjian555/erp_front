/**
 * Mock 数据 - 财务管理（总账 + 凭证 + 报表 + 结账）
 * 完整版：覆盖 subject / voucher / template / period / ledger / report / trialBalance
 */
import Mock from 'mockjs'

const Random = Mock.Random

// =============== 工具函数 ===============
function genCName() {
  const surnames = ['张', '王', '李', '赵', '刘', '陈', '杨', '黄', '周', '吴']
  const maleNames = ['伟', '强', '磊', '军', '勇', '杰', '涛', '明', '超', '华']
  const femaleNames = ['芳', '娜', '敏', '静', '丽', '娟', '艳', '霞', '燕', '玲']
  const surname = surnames[Random.integer(0, surnames.length - 1)]
  const names = Math.random() > 0.4 ? maleNames : femaleNames
  return surname + names[Random.integer(0, names.length - 1)] + (Math.random() > 0.5 ? names[Random.integer(0, names.length - 1)] : '')
}

// =============== 预置科目（符合中国会计准则小企业会计准则） ===============
const PRESET_SUBJECTS = [
  // 一、资产类（1xxx）
  { code: '1001', name: '库存现金', category: 'asset', direction: 'debit', level: 1, isLeaf: true, assistType: '' },
  { code: '1002', name: '银行存款', category: 'asset', direction: 'debit', level: 1, isLeaf: true, assistType: 'bankAccount' },
  { code: '1002.01', name: '工商银行', category: 'asset', direction: 'debit', level: 2, parent: '1002', isLeaf: true, assistType: 'bankAccount' },
  { code: '1002.02', name: '建设银行', category: 'asset', direction: 'debit', level: 2, parent: '1002', isLeaf: true, assistType: 'bankAccount' },
  { code: '1002.99', name: '其他货币资金', category: 'asset', direction: 'debit', level: 2, parent: '1002', isLeaf: true, assistType: '' },
  { code: '1122', name: '应收账款', category: 'asset', direction: 'debit', level: 1, isLeaf: true, assistType: 'customer' },
  { code: '1123', name: '预付账款', category: 'asset', direction: 'debit', level: 1, isLeaf: true, assistType: 'supplier' },
  { code: '1131', name: '应收股利', category: 'asset', direction: 'debit', level: 1, isLeaf: true, assistType: '' },
  { code: '1221', name: '其他应收款', category: 'asset', direction: 'debit', level: 1, isLeaf: true, assistType: 'staff' },
  { code: '1401', name: '材料采购', category: 'asset', direction: 'debit', level: 1, isLeaf: true, assistType: '' },
  { code: '1403', name: '原材料', category: 'asset', direction: 'debit', level: 1, isLeaf: true, assistType: 'goods' },
  { code: '1405', name: '库存商品', category: 'asset', direction: 'debit', level: 1, isLeaf: true, assistType: 'goods,warehouse' },
  { code: '1411', name: '周转材料', category: 'asset', direction: 'debit', level: 1, isLeaf: true, assistType: '' },
  { code: '1501', name: '长期股权投资', category: 'asset', direction: 'debit', level: 1, isLeaf: true, assistType: '' },
  { code: '1601', name: '固定资产', category: 'asset', direction: 'debit', level: 1, isLeaf: true, assistType: '' },
  { code: '1602', name: '累计折旧', category: 'asset', direction: 'credit', level: 1, isLeaf: true, assistType: '' },
  { code: '1701', name: '无形资产', category: 'asset', direction: 'debit', level: 1, isLeaf: true, assistType: '' },

  // 二、负债类（2xxx）
  { code: '2001', name: '短期借款', category: 'liability', direction: 'credit', level: 1, isLeaf: true, assistType: 'bankAccount' },
  { code: '2202', name: '应付账款', category: 'liability', direction: 'credit', level: 1, isLeaf: true, assistType: 'supplier' },
  { code: '2203', name: '预收账款', category: 'liability', direction: 'credit', level: 1, isLeaf: true, assistType: 'customer' },
  { code: '2211', name: '应付职工薪酬', category: 'liability', direction: 'credit', level: 1, isLeaf: true, assistType: 'staff' },
  { code: '2211.01', name: '工资', category: 'liability', direction: 'credit', level: 2, parent: '2211', isLeaf: true, assistType: 'staff' },
  { code: '2211.02', name: '福利费', category: 'liability', direction: 'credit', level: 2, parent: '2211', isLeaf: true, assistType: 'staff' },
  { code: '2221', name: '应交税费', category: 'liability', direction: 'credit', level: 1, isLeaf: false, assistType: '' },
  { code: '2221.01', name: '应交增值税', category: 'liability', direction: 'credit', level: 2, parent: '2221', isLeaf: true, assistType: '' },
  { code: '2221.02', name: '未交增值税', category: 'liability', direction: 'credit', level: 2, parent: '2221', isLeaf: true, assistType: '' },
  { code: '2221.03', name: '应交附加税', category: 'liability', direction: 'credit', level: 2, parent: '2221', isLeaf: true, assistType: '' },
  { code: '2221.10', name: '应交所得税', category: 'liability', direction: 'credit', level: 2, parent: '2221', isLeaf: true, assistType: '' },
  { code: '2241', name: '其他应付款', category: 'liability', direction: 'credit', level: 1, isLeaf: true, assistType: 'staff' },
  { code: '2501', name: '长期借款', category: 'liability', direction: 'credit', level: 1, isLeaf: true, assistType: 'bankAccount' },

  // 三、所有者权益类（3xxx）
  { code: '3001', name: '实收资本', category: 'equity', direction: 'credit', level: 1, isLeaf: true, assistType: '' },
  { code: '3002', name: '资本公积', category: 'equity', direction: 'credit', level: 1, isLeaf: true, assistType: '' },
  { code: '3101', name: '盈余公积', category: 'equity', direction: 'credit', level: 1, isLeaf: true, assistType: '' },
  { code: '3103', name: '本年利润', category: 'equity', direction: 'credit', level: 1, isLeaf: true, assistType: '' },
  { code: '3104', name: '利润分配', category: 'equity', direction: 'credit', level: 1, isLeaf: true, assistType: '' },
  { code: '3141', name: '库存股', category: 'equity', direction: 'credit', level: 1, isLeaf: true, assistType: '' },

  // 四、成本类（4xxx）
  { code: '4001', name: '生产成本', category: 'cost', direction: 'debit', level: 1, isLeaf: true, assistType: 'goods' },
  { code: '4101', name: '制造费用', category: 'cost', direction: 'debit', level: 1, isLeaf: true, assistType: 'dept' },
  { code: '4301', name: '研发支出', category: 'cost', direction: 'debit', level: 1, isLeaf: true, assistType: 'project' },
  { code: '4401', name: '工程施工', category: 'cost', direction: 'debit', level: 1, isLeaf: true, assistType: 'project' },

  // 五、损益类（5xxx、6xxx）
  { code: '5001', name: '主营业务收入', category: 'profit', direction: 'credit', level: 1, isLeaf: true, assistType: 'goods,customer' },
  { code: '5051', name: '其他业务收入', category: 'profit', direction: 'credit', level: 1, isLeaf: true, assistType: 'customer' },
  { code: '5111', name: '投资收益', category: 'profit', direction: 'credit', level: 1, isLeaf: true, assistType: '' },
  { code: '5301', name: '营业外收入', category: 'profit', direction: 'credit', level: 1, isLeaf: true, assistType: '' },
  { code: '5401', name: '主营业务成本', category: 'profit', direction: 'debit', level: 1, isLeaf: true, assistType: 'goods' },
  { code: '5402', name: '其他业务成本', category: 'profit', direction: 'debit', level: 1, isLeaf: true, assistType: '' },
  { code: '5501', name: '营业税金及附加', category: 'profit', direction: 'debit', level: 1, isLeaf: true, assistType: '' },
  { code: '5601', name: '销售费用', category: 'profit', direction: 'debit', level: 1, isLeaf: true, assistType: 'dept,staff' },
  { code: '5601.01', name: '工资及福利', category: 'profit', direction: 'debit', level: 2, parent: '5601', isLeaf: true, assistType: 'staff' },
  { code: '5601.02', name: '运输费', category: 'profit', direction: 'debit', level: 2, parent: '5601', isLeaf: true, assistType: '' },
  { code: '5601.03', name: '广告费', category: 'profit', direction: 'debit', level: 2, parent: '5601', isLeaf: true, assistType: '' },
  { code: '5602', name: '管理费用', category: 'profit', direction: 'debit', level: 1, isLeaf: true, assistType: 'dept,staff' },
  { code: '5602.01', name: '办公费', category: 'profit', direction: 'debit', level: 2, parent: '5602', isLeaf: true, assistType: '' },
  { code: '5602.02', name: '差旅费', category: 'profit', direction: 'debit', level: 2, parent: '5602', isLeaf: true, assistType: 'staff' },
  { code: '5602.03', name: '业务招待费', category: 'profit', direction: 'debit', level: 2, parent: '5602', isLeaf: true, assistType: '' },
  { code: '5602.04', name: '工资及福利', category: 'profit', direction: 'debit', level: 2, parent: '5602', isLeaf: true, assistType: 'staff' },
  { code: '5602.05', name: '折旧费', category: 'profit', direction: 'debit', level: 2, parent: '5602', isLeaf: true, assistType: '' },
  { code: '5603', name: '财务费用', category: 'profit', direction: 'debit', level: 1, isLeaf: true, assistType: '' },
  { code: '5603.01', name: '利息支出', category: 'profit', direction: 'debit', level: 2, parent: '5603', isLeaf: true, assistType: 'bankAccount' },
  { code: '5603.02', name: '汇兑损益', category: 'profit', direction: 'debit', level: 2, parent: '5603', isLeaf: true, assistType: 'bankAccount' },
  { code: '5603.03', name: '手续费', category: 'profit', direction: 'debit', level: 2, parent: '5603', isLeaf: true, assistType: '' },
  { code: '5711', name: '营业外支出', category: 'profit', direction: 'debit', level: 1, isLeaf: true, assistType: '' },
  { code: '5801', name: '所得税费用', category: 'profit', direction: 'debit', level: 1, isLeaf: true, assistType: '' }
]

// 构造科目ID与父子关系
const SUBJECTS = PRESET_SUBJECTS.map((s, i) => ({
  id: i + 1,
  ...s,
  parentId: null,
  isActive: true,
  openingDebit: 0,
  openingCredit: 0,
  year: 2025
}))
// 补充 parentId
const codeMap = {}
SUBJECTS.forEach(s => { codeMap[s.code] = s })
SUBJECTS.forEach(s => {
  if (s.parent && codeMap[s.parent]) s.parentId = codeMap[s.parent].id
})

// 预置期初余额
SUBJECTS.find(s => s.code === '1001').openingDebit = 50000
SUBJECTS.find(s => s.code === '1002.01').openingDebit = 850000
SUBJECTS.find(s => s.code === '1002.02').openingDebit = 320000
SUBJECTS.find(s => s.code === '1122').openingDebit = 480000
SUBJECTS.find(s => s.code === '1403').openingDebit = 280000
SUBJECTS.find(s => s.code === '1405').openingDebit = 620000
SUBJECTS.find(s => s.code === '1601').openingDebit = 1200000
SUBJECTS.find(s => s.code === '1602').openingCredit = 350000
SUBJECTS.find(s => s.code === '2202').openingCredit = 380000
SUBJECTS.find(s => s.code === '3001').openingCredit = 3000000
SUBJECTS.find(s => s.code === '3103').openingCredit = 70000

// =============== 凭证模板（业务单据→凭证规则） ===============
const VOUCHER_TEMPLATES = [
  // 销售出库（确认收入）
  { id: 1, bizType: 'sales_outbound', templateName: '销售出库-收入确认', summary: '销售出库-{orderNo}', direction: 'credit', subjectCode: '5001', amountSource: 'salesAmount', assistConfig: { customer: 'customerId', goods: 'goodsId' }, sort: 1, enabled: true },
  { id: 2, bizType: 'sales_outbound', templateName: '销售出库-销项税', summary: '销项税-{orderNo}', direction: 'credit', subjectCode: '2221.01', amountSource: 'taxAmount', assistConfig: {}, sort: 2, enabled: true },
  { id: 3, bizType: 'sales_outbound', templateName: '销售出库-应收', summary: '销售应收-{customerName}', direction: 'debit', subjectCode: '1122', amountSource: 'totalAmount', assistConfig: { customer: 'customerId' }, sort: 3, enabled: true },
  { id: 4, bizType: 'sales_outbound', templateName: '销售出库-结转成本', summary: '结转销售成本-{orderNo}', direction: 'credit', subjectCode: '1405', amountSource: 'costAmount', assistConfig: { goods: 'goodsId', warehouse: 'warehouseId' }, sort: 4, enabled: true },
  { id: 5, bizType: 'sales_outbound', templateName: '销售出库-主营业务成本', summary: '主营业务成本-{orderNo}', direction: 'debit', subjectCode: '5401', amountSource: 'costAmount', assistConfig: { goods: 'goodsId' }, sort: 5, enabled: true },

  // 采购入库
  { id: 6, bizType: 'purchase_inbound', templateName: '采购入库-库存', summary: '采购入库-{orderNo}', direction: 'debit', subjectCode: '1405', amountSource: 'goodsAmount', assistConfig: { goods: 'goodsId', warehouse: 'warehouseId' }, sort: 1, enabled: true },
  { id: 7, bizType: 'purchase_inbound', templateName: '采购入库-进项税', summary: '进项税-{orderNo}', direction: 'debit', subjectCode: '2221.01', amountSource: 'taxAmount', assistConfig: {}, sort: 2, enabled: true },
  { id: 8, bizType: 'purchase_inbound', templateName: '采购入库-应付', summary: '采购应付-{supplierName}', direction: 'credit', subjectCode: '2202', amountSource: 'totalAmount', assistConfig: { supplier: 'supplierId' }, sort: 3, enabled: true },

  // 收款单
  { id: 9, bizType: 'receipt', templateName: '收款-银行', summary: '收款-{customerName}', direction: 'debit', subjectCode: '1002.01', amountSource: 'amount', assistConfig: { bankAccount: 'bankAccountId' }, sort: 1, enabled: true },
  { id: 10, bizType: 'receipt', templateName: '收款-核销应收', summary: '核销应收-{customerName}', direction: 'credit', subjectCode: '1122', amountSource: 'amount', assistConfig: { customer: 'customerId' }, sort: 2, enabled: true },

  // 付款单
  { id: 11, bizType: 'payment', templateName: '付款-核销应付', summary: '核销应付-{supplierName}', direction: 'debit', subjectCode: '2202', amountSource: 'amount', assistConfig: { supplier: 'supplierId' }, sort: 1, enabled: true },
  { id: 12, bizType: 'payment', templateName: '付款-银行', summary: '付款-{supplierName}', direction: 'credit', subjectCode: '1002.01', amountSource: 'amount', assistConfig: { bankAccount: 'bankAccountId' }, sort: 2, enabled: true },

  // 费用报销
  { id: 13, bizType: 'expense', templateName: '费用报销-管理费用', summary: '报销-{applicant}', direction: 'debit', subjectCode: '5602', amountSource: 'amount', assistConfig: { dept: 'deptId', staff: 'applicantId' }, sort: 1, enabled: true },
  { id: 14, bizType: 'expense', templateName: '费用报销-银行存款', summary: '支付-{applicant}', direction: 'credit', subjectCode: '1002.01', amountSource: 'amount', assistConfig: {}, sort: 2, enabled: true },

  // 库存盘点
  { id: 15, bizType: 'stocktake', templateName: '盘点-盘亏', summary: '盘亏-{warehouseName}', direction: 'debit', subjectCode: '5501', amountSource: 'lossAmount', assistConfig: { goods: 'goodsId' }, sort: 1, enabled: true },
  { id: 16, bizType: 'stocktake', templateName: '盘点-盘亏库存', summary: '盘亏出库-{warehouseName}', direction: 'credit', subjectCode: '1405', amountSource: 'lossAmount', assistConfig: { goods: 'goodsId', warehouse: 'warehouseId' }, sort: 2, enabled: true },
  { id: 17, bizType: 'stocktake', templateName: '盘点-盘盈', summary: '盘盈-{warehouseName}', direction: 'debit', subjectCode: '1405', amountSource: 'profitAmount', assistConfig: { goods: 'goodsId', warehouse: 'warehouseId' }, sort: 1, enabled: true },
  { id: 18, bizType: 'stocktake', templateName: '盘点-盘盈营业外', summary: '盘盈入账-{warehouseName}', direction: 'credit', subjectCode: '5301', amountSource: 'profitAmount', assistConfig: {}, sort: 2, enabled: true },

  // 期末调汇
  { id: 19, bizType: 'fx_adjust', templateName: '期末调汇', summary: '期末调汇-{currency}', direction: 'debit', subjectCode: '5603.02', amountSource: 'fxAmount', assistConfig: {}, sort: 1, enabled: true }
]

// =============== 预置会计期间 ===============
const PERIODS = []
for (let y = 2024; y <= 2026; y++) {
  for (let m = 1; m <= 12; m++) {
    const period = `${y}-${String(m).padStart(2, '0')}`
    let status = 'open'
    if (y < 2025 || (y === 2025 && m < 6)) status = 'closed'
    else if (y === 2025 && m === 5) status = 'closing'
    PERIODS.push({
      id: PERIODS.length + 1,
      year: y, month: m,
      period,
      startDate: `${y}-${String(m).padStart(2, '0')}-01`,
      endDate: new Date(y, m, 0).toISOString().slice(0, 10),
      status,
      closeTime: status === 'closed' ? `${y}-${String(m).padStart(2, '0')}-28 18:00:00` : null,
      closer: status === 'closed' ? 'admin' : null
    })
  }
}

// =============== 预置凭证（带分录） ===============
const VOUCHERS = []
function pad(n, w) { return String(n).padStart(w, '0') }

let vchId = 1
function makeVoucher(date, summary, lines, status = 0, source = 'manual', sourceBillNo = '') {
  let td = 0, tc = 0
  lines.forEach(l => { td += l.debitAmount || 0; tc += l.creditAmount || 0 })
  td = +td.toFixed(2); tc = +tc.toFixed(2)
  const v = {
    id: vchId++,
    voucherNo: `记-${date.replace(/-/g, '')}-${pad(VOUCHERS.length + 1, 3)}`,
    voucherDate: date,
    fiscalPeriod: date.slice(0, 7),
    word: 3, // 转账
    source,
    sourceBillNo,
    totalDebit: td,
    totalCredit: tc,
    attachment: Random.integer(1, 5),
    status, // 0草稿 1已审核 2已过账 3已冲销
    creatorId: 1, creatorName: 'admin',
    auditorId: status >= 1 ? 2 : null, auditorName: status >= 1 ? '张财务' : null, auditTime: status >= 1 ? date + ' 14:30:00' : null,
    posterId: status >= 2 ? 2 : null, posterName: status >= 2 ? '张财务' : null, postTime: status >= 2 ? date + ' 15:00:00' : null,
    canceledVoucherId: null,
    remark: '',
    createdAt: date + ' 10:00:00',
    entries: lines.map((l, i) => ({
      id: vchId * 1000 + i,
      lineNo: i + 1,
      subjectId: codeMap[l.subjectCode]?.id,
      subjectCode: l.subjectCode,
      subjectName: codeMap[l.subjectCode]?.name || l.subjectCode,
      summary: l.summary,
      debitAmount: l.debitAmount || 0,
      creditAmount: l.creditAmount || 0,
      assistCustomerName: l.customerName || '',
      assistSupplierName: l.supplierName || '',
      quantity: l.quantity || 0,
      price: l.price || 0
    }))
  }
  VOUCHERS.push(v)
  return v
}

// 2025-06 月度示例凭证
makeVoucher('2025-06-03', '采购入库-SO20250603001', [
  { subjectCode: '1405', summary: '采购入库-商品A', debitAmount: 11300, quantity: 100, price: 113, supplierName: '上海供应商有限公司' },
  { subjectCode: '2221.01', summary: '进项税-SO20250603001', debitAmount: 1700 },
  { subjectCode: '2202', summary: '应付-上海供应商', creditAmount: 13000, supplierName: '上海供应商有限公司' }
], 2, 'purchase_inbound', 'PO20250603001')

makeVoucher('2025-06-05', '销售出库-XS20250605001', [
  { subjectCode: '1122', summary: '销售应收-北京客户', debitAmount: 22600, customerName: '北京客户A公司' },
  { subjectCode: '5001', summary: '销售收入-商品A', creditAmount: 20000 },
  { subjectCode: '2221.01', summary: '销项税-XS20250605001', creditAmount: 2600 }
], 2, 'sales_outbound', 'SO20250605001')

makeVoucher('2025-06-05', '结转销售成本-XS20250605001', [
  { subjectCode: '5401', summary: '结转销售成本', debitAmount: 15000, quantity: 100, price: 150 },
  { subjectCode: '1405', summary: '销售出库-商品A', creditAmount: 15000, quantity: 100, price: 150 }
], 2, 'sales_outbound', 'SO20250605001')

makeVoucher('2025-06-08', '收到货款-北京客户A', [
  { subjectCode: '1002.01', summary: '收款-工商银行', debitAmount: 22600 },
  { subjectCode: '1122', summary: '核销应收-北京客户A', creditAmount: 22600, customerName: '北京客户A公司' }
], 2, 'receipt', 'RCT20250608001')

makeVoucher('2025-06-10', '报销-管理费用', [
  { subjectCode: '5602.02', summary: '差旅费-张三', debitAmount: 3500 },
  { subjectCode: '1002.01', summary: '支付-工商银行', creditAmount: 3500 }
], 1, 'expense', 'EXP20250610001')

makeVoucher('2025-06-12', '采购入库-SO20250612002', [
  { subjectCode: '1405', summary: '采购入库-商品B', debitAmount: 22600, quantity: 200, price: 113, supplierName: '深圳供应商' },
  { subjectCode: '2221.01', summary: '进项税', debitAmount: 3400 },
  { subjectCode: '2202', summary: '应付-深圳供应商', creditAmount: 26000, supplierName: '深圳供应商' }
], 2, 'purchase_inbound', 'PO20250612002')

makeVoucher('2025-06-15', '销售出库-XS20250615002', [
  { subjectCode: '1122', summary: '销售应收-上海客户', debitAmount: 33900, customerName: '上海客户B公司' },
  { subjectCode: '5001', summary: '销售收入-商品B', creditAmount: 30000 },
  { subjectCode: '2221.01', summary: '销项税', creditAmount: 3900 }
], 2, 'sales_outbound', 'SO20250615002')

makeVoucher('2025-06-18', '工资发放-2025年5月', [
  { subjectCode: '5602.04', summary: '管理工资', debitAmount: 50000 },
  { subjectCode: '5601.01', summary: '销售工资', debitAmount: 30000 },
  { subjectCode: '2211.01', summary: '应付职工薪酬', creditAmount: 75000 }
], 1, 'manual', '')

makeVoucher('2025-06-20', '支付货款-上海供应商', [
  { subjectCode: '2202', summary: '核销应付-上海供应商', debitAmount: 13000, supplierName: '上海供应商有限公司' },
  { subjectCode: '1002.01', summary: '付款-工商银行', creditAmount: 13000 }
], 2, 'payment', 'PAY20250620001')

makeVoucher('2025-06-22', '盘点-盘亏商品C', [
  { subjectCode: '5501', summary: '盘亏-商品C', debitAmount: 800, quantity: 10, price: 80 },
  { subjectCode: '1405', summary: '盘亏出库-主仓库', creditAmount: 800, quantity: 10, price: 80 }
], 1, 'stocktake', 'STK20250622001')

makeVoucher('2025-06-25', '采购入库-SO20250625003', [
  { subjectCode: '1405', summary: '采购入库-商品C', debitAmount: 18080, quantity: 160, price: 113, supplierName: '上海供应商有限公司' },
  { subjectCode: '2221.01', summary: '进项税', debitAmount: 2720 },
  { subjectCode: '2202', summary: '应付', creditAmount: 20800, supplierName: '上海供应商有限公司' }
], 0, 'purchase_inbound', 'PO20250625003')

makeVoucher('2025-06-28', '计提固定资产折旧', [
  { subjectCode: '5602.05', summary: '折旧费-办公设备', debitAmount: 3500 },
  { subjectCode: '1602', summary: '累计折旧-办公设备', creditAmount: 3500 }
], 0, 'manual', '')

makeVoucher('2025-06-30', '结转损益-2025年6月', [
  { subjectCode: '5001', summary: '结转主营业务收入', debitAmount: 50000 },
  { subjectCode: '5051', summary: '结转其他业务收入', debitAmount: 3000 },
  { subjectCode: '3103', summary: '结转本年利润', creditAmount: 53000 }
], 0, 'manual', '')

makeVoucher('2025-06-30', '结转损益-2025年6月(成本)', [
  { subjectCode: '3103', summary: '结转本年利润', debitAmount: 81800 },
  { subjectCode: '5401', summary: '结转主营业务成本', creditAmount: 15000 },
  { subjectCode: '5601.01', summary: '结转销售费用', creditAmount: 30000 },
  { subjectCode: '5602.01', summary: '结转管理费用', creditAmount: 36800 }
], 0, 'manual', '')

// =============== 明细账 / 余额表 / 总账 Mock 工具 ===============
function buildLedgerDetail(subjectCode, period) {
  // 主体：以过账凭证 + 直接交易为明细
  const allVouchers = window.__FIN_VOUCHERS__ || []
  const lines = []
  for (const v of allVouchers) {
    if (v.status !== 'posted' || !v.voucherDate || !(v.voucherDate + '').startsWith(period)) continue
    for (const e of v.entries || []) {
      if (e.subjectCode !== subjectCode) continue
      lines.push({
        id: `${v.id}-${e.lineNo}`,
        voucherDate: v.voucherDate,
        voucherNo: v.voucherNo,
        summary: e.summary,
        debitAmount: e.debitAmount || 0,
        creditAmount: e.creditAmount || 0,
        direction: (e.debitAmount || 0) >= (e.creditAmount || 0) ? '借' : '贷'
      })
    }
  }
  // 即使没有过账凭证，也生成一些模拟明细
  if (lines.length === 0) {
    const baseAmount = 1000 + Math.random() * 20000
    for (let i = 1; i <= 12; i++) {
      const day = String(i * 2 + 1).padStart(2, '0')
      const isDebit = i % 2 === 0
      const amt = Math.round(baseAmount * (0.5 + Math.random()) * 100) / 100
      lines.push({
        id: `mock-${subjectCode}-${i}`,
        voucherDate: `${period}-${day}`,
        voucherNo: `记-${period.replace(/-/g, '')}-${String(i).padStart(3, '0')}`,
        summary: ['收回应收账款', '支付货款', '销售出库', '采购入库', '报销费用', '领用材料'][i % 6],
        debitAmount: isDebit ? amt : 0,
        creditAmount: isDebit ? 0 : amt,
        direction: isDebit ? '借' : '贷'
      })
    }
  }
  return lines
}

const BASIC_APIS = [
  // ============== 会计科目 ==============
  {
    url: '/api/finance/subject/list',
    method: 'get',
    response: () => ({ code: 200, data: { list: SUBJECTS, total: SUBJECTS.length } })
  },
  {
    url: '/api/finance/subject/tree',
    method: 'get',
    response: () => {
      const buildTree = (parentId) => SUBJECTS
        .filter(s => s.parentId === parentId)
        .map(s => ({ ...s, children: buildTree(s.id) }))
      return { code: 200, data: buildTree(null) }
    }
  },
  {
    url: '/api/finance/subject/save',
    method: 'post',
    response: () => ({ code: 200, message: '保存成功' })
  },
  {
    url: '/api/finance/subject/delete',
    method: 'post',
    response: () => ({ code: 200, message: '删除成功' })
  },
  {
    url: '/api/finance/subject/import',
    method: 'post',
    response: () => ({ code: 200, message: '导入成功', data: { count: 12 } })
  },

  // ============== 凭证 ==============
  {
    url: '/api/finance/voucher/list',
    method: 'get',
    response: (config) => {
      const { pageNum = 1, pageSize = 10, voucherNo = '', status = '', source = '', dateRange = [], fiscalPeriod = '' } = config.query || {}
      let list = VOUCHERS.slice()
      if (voucherNo) list = list.filter(v => v.voucherNo.includes(voucherNo))
      if (status !== '' && status !== null) list = list.filter(v => v.status === Number(status))
      if (source) list = list.filter(v => v.source === source)
      if (fiscalPeriod) list = list.filter(v => v.fiscalPeriod === fiscalPeriod)
      if (dateRange && dateRange.length === 2) {
        list = list.filter(v => v.voucherDate >= dateRange[0] && v.voucherDate <= dateRange[1])
      }
      list.sort((a, b) => b.voucherDate.localeCompare(a.voucherDate) || b.voucherNo.localeCompare(a.voucherNo))
      const total = list.length
      const start = (Number(pageNum) - 1) * Number(pageSize)
      return { code: 200, data: { list: list.slice(start, start + Number(pageSize)), total } }
    }
  },
  {
    url: '/api/finance/voucher/detail',
    method: 'get',
    response: (config) => {
      const id = Number(config.query.id)
      const v = VOUCHERS.find(x => x.id === id)
      return v ? { code: 200, data: v } : { code: 404, message: '凭证不存在' }
    }
  },
  {
    url: '/api/finance/voucher/save',
    method: 'post',
    response: (config) => {
      const body = JSON.parse(config.body || '{}')
      if (body.id) {
        const v = VOUCHERS.find(x => x.id === body.id)
        if (v && v.status >= 2) return { code: 400, message: '已过账凭证不允许修改' }
      }
      // 校验借贷平衡
      let td = 0, tc = 0
      (body.entries || []).forEach(e => { td += e.debitAmount || 0; tc += e.creditAmount || 0 })
      if (Math.abs(td - tc) > 0.01) return { code: 400, message: `借贷不平衡：借方${td.toFixed(2)}，贷方${tc.toFixed(2)}` }
      return { code: 200, message: '保存成功', data: { id: body.id || VOUCHERS.length + 1 } }
    }
  },
  {
    url: '/api/finance/voucher/audit',
    method: 'post',
    response: (config) => {
      const body = JSON.parse(config.body || '{}')
      const v = VOUCHERS.find(x => x.id === body.id)
      if (v) {
        if (v.status !== 0) return { code: 400, message: '只有草稿状态可审核' }
        v.status = 1
        v.auditorId = 2
        v.auditorName = '张财务'
        v.auditTime = new Date().toISOString().slice(0, 19).replace('T', ' ')
      }
      return { code: 200, message: '审核成功' }
    }
  },
  {
    url: '/api/finance/voucher/unaudit',
    method: 'post',
    response: (config) => {
      const body = JSON.parse(config.body || '{}')
      const v = VOUCHERS.find(x => x.id === body.id)
      if (v) {
        if (v.status !== 1) return { code: 400, message: '只有已审核状态可反审核' }
        v.status = 0
        v.auditorId = null
        v.auditorName = null
        v.auditTime = null
      }
      return { code: 200, message: '反审核成功' }
    }
  },
  {
    url: '/api/finance/voucher/post',
    method: 'post',
    response: (config) => {
      const body = JSON.parse(config.body || '{}')
      const v = VOUCHERS.find(x => x.id === body.id)
      if (v) {
        if (v.status !== 1) return { code: 400, message: '只有已审核状态可过账' }
        v.status = 2
        v.posterId = 2
        v.posterName = '张财务'
        v.postTime = new Date().toISOString().slice(0, 19).replace('T', ' ')
      }
      return { code: 200, message: '过账成功' }
    }
  },
  {
    url: '/api/finance/voucher/unpost',
    method: 'post',
    response: (config) => {
      const body = JSON.parse(config.body || '{}')
      const v = VOUCHERS.find(x => x.id === body.id)
      if (v) {
        if (v.status !== 2) return { code: 400, message: '只有已过账状态可反过账' }
        v.status = 1
        v.posterId = null
        v.posterName = null
        v.postTime = null
      }
      return { code: 200, message: '反过账成功' }
    }
  },
  {
    url: '/api/finance/voucher/cancel',
    method: 'post',
    response: (config) => {
      const body = JSON.parse(config.body || '{}')
      const v = VOUCHERS.find(x => x.id === body.id)
      if (v) {
        if (v.status !== 2) return { code: 400, message: '只有已过账状态可冲销' }
        // 生成红字凭证
        const newId = VOUCHERS.length + 1
        const redVoucher = {
          id: newId,
          voucherNo: `记-${v.voucherDate.replace(/-/g, '')}-${pad(newId, 3)}`,
          voucherDate: new Date().toISOString().slice(0, 10),
          fiscalPeriod: new Date().toISOString().slice(0, 7),
          word: 3,
          source: 'cancel',
          sourceBillNo: v.voucherNo,
          totalDebit: v.totalDebit,
          totalCredit: v.totalCredit,
          attachment: 0,
          status: 2,
          creatorId: 1, creatorName: 'admin',
          auditorId: 2, auditorName: '张财务', auditTime: new Date().toISOString().slice(0, 19).replace('T', ' '),
          posterId: 2, posterName: '张财务', postTime: new Date().toISOString().slice(0, 19).replace('T', ' '),
          canceledVoucherId: v.id,
          remark: `冲销${v.voucherNo}`,
          createdAt: new Date().toISOString().slice(0, 19).replace('T', ' '),
          entries: v.entries.map((e, i) => ({
            id: newId * 1000 + i,
            lineNo: i + 1,
            subjectId: e.subjectId,
            subjectCode: e.subjectCode,
            subjectName: e.subjectName,
            summary: e.summary,
            debitAmount: -e.creditAmount,
            creditAmount: -e.debitAmount,
            assistCustomerName: e.assistCustomerName,
            assistSupplierName: e.assistSupplierName,
            quantity: -e.quantity,
            price: e.price
          }))
        }
        VOUCHERS.push(redVoucher)
        v.status = 3
        v.canceledVoucherId = newId
      }
      return { code: 200, message: '冲销成功' }
    }
  },
  {
    url: '/api/finance/voucher/delete',
    method: 'post',
    response: (config) => {
      const body = JSON.parse(config.body || '{}')
      const idx = VOUCHERS.findIndex(x => x.id === body.id)
      if (idx >= 0) {
        if (VOUCHERS[idx].status >= 1) return { code: 400, message: '已审核凭证不可删除，请先反审核' }
        VOUCHERS.splice(idx, 1)
      }
      return { code: 200, message: '删除成功' }
    }
  },

  // ============== 凭证模板 ==============
  {
    url: '/api/finance/voucherTemplate/list',
    method: 'get',
    response: () => ({ code: 200, data: { list: VOUCHER_TEMPLATES, total: VOUCHER_TEMPLATES.length } })
  },
  {
    url: '/api/finance/voucherTemplate/save',
    method: 'post',
    response: () => ({ code: 200, message: '保存成功' })
  },
  {
    url: '/api/finance/voucherTemplate/delete',
    method: 'post',
    response: () => ({ code: 200, message: '删除成功' })
  },

  // ============== 会计期间 / 结账 ==============
  {
    url: '/api/finance/period/list',
    method: 'get',
    response: () => ({ code: 200, data: { list: PERIODS, total: PERIODS.length } })
  },
  {
    url: '/api/finance/period/close',
    method: 'post',
    response: (config) => {
      const body = JSON.parse(config.body || '{}')
      const p = PERIODS.find(x => x.id === body.id)
      if (p) {
        if (p.status === 'closed') return { code: 400, message: '该期间已结账' }
        p.status = 'closed'
        p.closeTime = new Date().toISOString().slice(0, 19).replace('T', ' ')
        p.closer = 'admin'
      }
      return { code: 200, message: '结账成功' }
    }
  },
  {
    url: '/api/finance/period/unclose',
    method: 'post',
    response: (config) => {
      const body = JSON.parse(config.body || '{}')
      const p = PERIODS.find(x => x.id === body.id)
      if (p) {
        if (p.status !== 'closed') return { code: 400, message: '该期间未结账' }
        p.status = 'open'
        p.closeTime = null
        p.closer = null
      }
      return { code: 200, message: '反结账成功' }
    }
  },
  {
    url: '/api/finance/period/check',
    method: 'post',
    response: (config) => {
      const body = JSON.parse(config.body || '{}')
      const p = PERIODS.find(x => x.id === body.id)
      if (!p) return { code: 400, message: '期间不存在' }
      return {
        code: 200,
        data: {
          pass: true,
          checks: [
            { item: '凭证借贷平衡', status: 'pass', message: '全部凭证借贷平衡' },
            { item: '凭证是否已审核', status: 'pass', message: '所有凭证已审核' },
            { item: '业务单据是否已生成凭证', status: 'pass', message: '本月业务单据全部生成凭证' },
            { item: '损益类科目是否已结转', status: 'warning', message: '本月尚未结转损益' },
            { item: '期末调汇', status: 'pass', message: '本月无外币业务，无需调汇' }
          ]
        }
      }
    }
  },

  // ============== 总账查询 ==============
  {
    url: '/api/finance/generalLedger/query',
    method: 'get',
    response: (config) => {
      const { subjectCode = '', period = '', startDate = '', endDate = '' } = config.query || {}
      // 从凭证分录聚合
      const rows = []
      const filtered = VOUCHERS.filter(v => v.status === 2)
        .filter(v => !period || v.fiscalPeriod === period)
        .filter(v => !startDate || v.voucherDate >= startDate)
        .filter(v => !endDate || v.voucherDate <= endDate)
      const map = new Map()
      filtered.forEach(v => {
        v.entries.forEach(e => {
          if (subjectCode && !e.subjectCode.startsWith(subjectCode)) return
          const k = e.subjectCode
          if (!map.has(k)) {
            map.set(k, {
              subjectCode: e.subjectCode,
              subjectName: e.subjectName,
              openingDebit: SUBJECTS.find(s => s.code === e.subjectCode)?.openingDebit || 0,
              openingCredit: SUBJECTS.find(s => s.code === e.subjectCode)?.openingCredit || 0,
              periodDebit: 0,
              periodCredit: 0,
              yearDebit: 0,
              yearCredit: 0
            })
          }
          const r = map.get(k)
          r.periodDebit += e.debitAmount
          r.periodCredit += e.creditAmount
          r.yearDebit += e.debitAmount
          r.yearCredit += e.creditAmount
        })
      })
      return { code: 200, data: { list: Array.from(map.values()), total: map.size } }
    }
  },
  {
    url: '/api/finance/subjectBalance/query',
    method: 'get',
    response: (config) => {
      const { period = '2025-06', category = '' } = config.query || {}
      // 汇总所有已过账凭证
      const map = new Map()
      SUBJECTS.forEach(s => {
        if (s.isLeaf && (!category || s.category === category)) {
          map.set(s.code, {
            subjectCode: s.code,
            subjectName: s.name,
            category: s.category,
            direction: s.direction,
            openingDebit: s.openingDebit,
            openingCredit: s.openingCredit,
            periodDebit: 0,
            periodCredit: 0,
            endingDebit: s.openingDebit,
            endingCredit: s.openingCredit
          })
        }
      })
      VOUCHERS.filter(v => v.status === 2 && v.fiscalPeriod === period)
        .forEach(v => {
          v.entries.forEach(e => {
            if (map.has(e.subjectCode)) {
              const r = map.get(e.subjectCode)
              r.periodDebit += e.debitAmount
              r.periodCredit += e.creditAmount
              r.endingDebit = +(r.openingDebit + r.periodDebit - r.openingCredit - r.periodCredit > 0 && r.direction === 'debit' ? r.openingDebit + r.periodDebit - r.periodCredit : (r.direction === 'debit' ? r.openingDebit + r.periodDebit - r.periodCredit : 0)).toFixed(2)
            }
          })
        })
      return { code: 200, data: { list: Array.from(map.values()), total: map.size } }
    }
  },
  {
    url: '/api/finance/ledgerDetail/query',
    method: 'get',
    response: (config) => {
      const { subjectCode = '', period = '2025-06' } = config.query || {}
      const rows = []
      VOUCHERS.filter(v => v.status === 2 && v.fiscalPeriod === period)
        .forEach(v => {
          v.entries.forEach(e => {
            if (subjectCode && e.subjectCode !== subjectCode) return
            rows.push({
              voucherDate: v.voucherDate,
              voucherNo: v.voucherNo,
              summary: e.summary,
              subjectCode: e.subjectCode,
              subjectName: e.subjectName,
              debitAmount: e.debitAmount,
              creditAmount: e.creditAmount,
              direction: e.debitAmount > 0 ? '借' : '贷'
            })
          })
        })
      return { code: 200, data: { list: rows, total: rows.length } }
    }
  },

  // ============== 试算平衡 ==============
  {
    url: '/api/finance/trialBalance/query',
    method: 'get',
    response: (config) => {
      const { period = '2025-06' } = config.query || {}
      const rows = []
      let totalOpeningDebit = 0, totalOpeningCredit = 0, totalPeriodDebit = 0, totalPeriodCredit = 0
      SUBJECTS.filter(s => s.isLeaf).forEach(s => {
        let pd = 0, pc = 0
        VOUCHERS.filter(v => v.status === 2 && v.fiscalPeriod === period)
          .forEach(v => v.entries.forEach(e => {
            if (e.subjectCode === s.code) {
              pd += e.debitAmount
              pc += e.creditAmount
            }
          }))
        const ending = s.openingDebit + pd - s.openingCredit - pc
        const ed = ending > 0 ? ending : 0
        const ec = ending < 0 ? -ending : 0
        totalOpeningDebit += s.openingDebit
        totalOpeningCredit += s.openingCredit
        totalPeriodDebit += pd
        totalPeriodCredit += pc
        if (s.openingDebit || s.openingCredit || pd || pc) {
          rows.push({
            subjectCode: s.code,
            subjectName: s.name,
            openingDebit: s.openingDebit,
            openingCredit: s.openingCredit,
            periodDebit: +pd.toFixed(2),
            periodCredit: +pc.toFixed(2),
            endingDebit: +ed.toFixed(2),
            endingCredit: +ec.toFixed(2)
          })
        }
      })
      return {
        code: 200,
        data: {
          list: rows,
          total: rows.length,
          totals: {
            openingDebit: +totalOpeningDebit.toFixed(2),
            openingCredit: +totalOpeningCredit.toFixed(2),
            periodDebit: +totalPeriodDebit.toFixed(2),
            periodCredit: +totalPeriodCredit.toFixed(2),
            endingDebit: +(totalOpeningDebit + totalPeriodDebit).toFixed(2),
            endingCredit: +(totalOpeningCredit + totalPeriodCredit).toFixed(2),
            balance: Math.abs((totalOpeningDebit + totalPeriodDebit) - (totalOpeningCredit + totalPeriodCredit)) < 0.01
          }
        }
      }
    }
  },

  // ============== 三大报表 ==============
  {
    url: '/api/finance/report/balanceSheet',
    method: 'get',
    response: (config) => {
      const { period = '2025-06' } = config.query || {}
      // 资产类
      const assetItems = [
        { code: '1001', name: '货币资金', formula: '1001+1002' },
        { code: '1122', name: '应收账款', formula: '1122' },
        { code: '1123', name: '预付账款', formula: '1123' },
        { code: '1403', name: '原材料', formula: '1403' },
        { code: '1405', name: '库存商品', formula: '1405' },
        { code: '1601', name: '固定资产', formula: '1601' },
        { code: '1602', name: '减：累计折旧', formula: '-1602' }
      ]
      // 负债类
      const liabItems = [
        { code: '2202', name: '应付账款', formula: '2202' },
        { code: '2211', name: '应付职工薪酬', formula: '2211' },
        { code: '2221', name: '应交税费', formula: '2221' }
      ]
      // 权益类
      const equityItems = [
        { code: '3001', name: '实收资本', formula: '3001' },
        { code: '3103', name: '未分配利润', formula: '3103' }
      ]
      const computeBalance = (formula) => {
        return formula.split('+').reduce((sum, part) => {
          const sign = part.startsWith('-') ? -1 : 1
          const code = part.replace(/^-/, '').trim()
          let bal = 0
          const subs = SUBJECTS.filter(s => s.code.startsWith(code) && s.isLeaf)
          subs.forEach(s => {
            let pd = 0, pc = 0
            VOUCHERS.filter(v => v.status === 2 && v.fiscalPeriod === period)
              .forEach(v => v.entries.forEach(e => {
                if (e.subjectCode === s.code) { pd += e.debitAmount; pc += e.creditAmount }
              }))
            bal += (s.openingDebit + pd) - (s.openingCredit + pc)
          })
          return sum + sign * bal
        }, 0)
      }
      const assetList = assetItems.map(i => ({ ...i, amount: +computeBalance(i.formula).toFixed(2), category: 'asset' }))
      const liabList = liabItems.map(i => ({ ...i, amount: +computeBalance(i.formula).toFixed(2), category: 'liability' }))
      const equityList = equityItems.map(i => ({ ...i, amount: +computeBalance(i.formula).toFixed(2), category: 'equity' }))
      const totalAsset = +assetList.reduce((s, i) => s + i.amount, 0).toFixed(2)
      const totalLiab = +liabList.reduce((s, i) => s + i.amount, 0).toFixed(2)
      const totalEquity = +equityList.reduce((s, i) => s + i.amount, 0).toFixed(2)
      return {
        code: 200,
        data: {
          period,
          asset: { items: assetList, total: totalAsset },
          liability: { items: liabList, total: totalLiab },
          equity: { items: equityList, total: totalEquity },
          totalLiabEquity: +(totalLiab + totalEquity).toFixed(2),
          balance: Math.abs(totalAsset - (totalLiab + totalEquity)) < 0.01
        }
      }
    }
  },
  {
    url: '/api/finance/report/incomeStatement',
    method: 'get',
    response: (config) => {
      const { period = '2025-06' } = config.query || {}
      const items = [
        { code: '5001', name: '一、营业收入', category: 'revenue' },
        { code: '5051', name: '　　其他业务收入', category: 'revenue' },
        { code: '5401', name: '二、营业成本', category: 'cost' },
        { code: '5601', name: '三、销售费用', category: 'expense' },
        { code: '5602', name: '四、管理费用', category: 'expense' },
        { code: '5603', name: '五、财务费用', category: 'expense' },
        { code: '5501', name: '六、营业税金及附加', category: 'tax' },
        { code: '5711', name: '七、营业外支出', category: 'nonop' },
        { code: '5301', name: '　　加：营业外收入', category: 'nonop' },
        { code: '5801', name: '八、所得税费用', category: 'tax' }
      ]
      const list = items.map(i => {
        const subs = SUBJECTS.filter(s => s.code.startsWith(i.code) && s.isLeaf)
        let amount = 0
        subs.forEach(s => {
          let pd = 0, pc = 0
          VOUCHERS.filter(v => v.status === 2 && v.fiscalPeriod === period)
            .forEach(v => v.entries.forEach(e => {
              if (e.subjectCode === s.code) { pd += e.debitAmount; pc += e.creditAmount }
            }))
          amount += s.direction === 'credit' ? (pc - pd) : (pd - pc)
        })
        return { ...i, amount: +amount.toFixed(2) }
      })
      const rev = list.filter(i => i.category === 'revenue').reduce((s, i) => s + i.amount, 0)
      const cost = list.filter(i => i.category === 'cost').reduce((s, i) => s + i.amount, 0)
      const exp = list.filter(i => i.category === 'expense').reduce((s, i) => s + i.amount, 0)
      const tax = list.filter(i => i.category === 'tax').reduce((s, i) => s + i.amount, 0)
      const nonop = list.filter(i => i.category === 'nonop').reduce((s, i) => s + i.amount, 0)
      const opProfit = rev - cost - exp
      const totalProfit = opProfit + nonop
      const netProfit = totalProfit - tax
      return {
        code: 200,
        data: {
          period,
          list,
          totalRevenue: +rev.toFixed(2),
          totalCost: +cost.toFixed(2),
          totalExpense: +exp.toFixed(2),
          operatingProfit: +opProfit.toFixed(2),
          totalProfit: +totalProfit.toFixed(2),
          incomeTax: +tax.toFixed(2),
          netProfit: +netProfit.toFixed(2)
        }
      }
    }
  },
  {
    url: '/api/finance/report/cashFlow',
    method: 'get',
    response: (config) => {
      const { period = '2025-06' } = config.query || {}
      // 现金流量表（简化版）
      const items = [
        { section: '一、经营活动产生的现金流量', name: '销售商品、提供劳务收到的现金', amount: 22600 },
        { section: '', name: '收到的税费返还', amount: 0 },
        { section: '', name: '收到其他与经营活动有关的现金', amount: 0 },
        { section: '', name: '购买商品、接受劳务支付的现金', amount: -13000 },
        { section: '', name: '支付给职工以及为职工支付的现金', amount: -80000 },
        { section: '', name: '支付的各项税费', amount: 0 },
        { section: '', name: '支付其他与经营活动有关的现金', amount: -3500 },
        { section: '二、投资活动产生的现金流量', name: '购建固定资产、无形资产支付的现金', amount: 0 },
        { section: '', name: '投资支付的现金', amount: 0 },
        { section: '三、筹资活动产生的现金流量', name: '取得借款收到的现金', amount: 0 },
        { section: '', name: '偿还债务支付的现金', amount: 0 },
        { section: '', name: '分配股利、利润支付的现金', amount: 0 }
      ]
      const opCash = items.filter(i => i.section.includes('经营')).reduce((s, i) => s + i.amount, 0)
      const invCash = items.filter(i => i.section.includes('投资')).reduce((s, i) => s + i.amount, 0)
      const finCash = items.filter(i => i.section.includes('筹资')).reduce((s, i) => s + i.amount, 0)
      return {
        code: 200,
        data: {
          period,
          list: items,
          operatingCashFlow: +opCash.toFixed(2),
          investingCashFlow: +invCash.toFixed(2),
          financingCashFlow: +finCash.toFixed(2),
          netCashFlow: +(opCash + invCash + finCash).toFixed(2)
        }
      }
    }
  }
]

// =====================================================================
// 业务-财务一体化扩展（应收/应付账龄、银行账户、银行对账、业务单据生成凭证）
// =====================================================================

// =============== 业务单据模拟数据 ===============
const BUSINESS_DOCS = [
  { id: 1, docNo: 'SO20250605001', bizType: 'sales_outbound', customerName: '北京客户A公司', amount: 22600, voucherId: 'V002', voucherNo: '记-20250605-002', status: 'generated', date: '2025-06-05' },
  { id: 2, docNo: 'PO20250603001', bizType: 'purchase_inbound', supplierName: '上海供应商有限公司', amount: 13000, voucherId: 'V001', voucherNo: '记-20250603-001', status: 'generated', date: '2025-06-03' },
  { id: 3, docNo: 'RCT20250608001', bizType: 'receipt', customerName: '北京客户A公司', amount: 22600, voucherId: 'V004', voucherNo: '记-20250608-004', status: 'generated', date: '2025-06-08' },
  { id: 4, docNo: 'PAY20250620001', bizType: 'payment', supplierName: '上海供应商有限公司', amount: 13000, voucherId: 'V009', voucherNo: '记-20250620-009', status: 'generated', date: '2025-06-20' },
  { id: 5, docNo: 'SO20250615002', bizType: 'sales_outbound', customerName: '上海客户B公司', amount: 33900, voucherId: 'V007', voucherNo: '记-20250615-007', status: 'generated', date: '2025-06-15' },
  { id: 6, docNo: 'PO20250612002', bizType: 'purchase_inbound', supplierName: '深圳供应商有限公司', amount: 26000, voucherId: 'V006', voucherNo: '记-20250612-006', status: 'generated', date: '2025-06-12' },
  { id: 7, docNo: 'EXP20250610001', bizType: 'expense', applicant: '张三', amount: 3500, voucherId: null, voucherNo: null, status: 'pending', date: '2025-06-10' },
  { id: 8, docNo: 'PO20250625003', bizType: 'purchase_inbound', supplierName: '上海供应商有限公司', amount: 20800, voucherId: null, voucherNo: null, status: 'pending', date: '2025-06-25' },
  { id: 9, docNo: 'STK20250622001', bizType: 'stocktake', applicant: '李四', amount: 800, voucherId: null, voucherNo: null, status: 'pending', date: '2025-06-22' },
  { id: 10, docNo: 'SO20250628001', bizType: 'sales_outbound', customerName: '广州客户C公司', amount: 45200, voucherId: null, voucherNo: null, status: 'pending', date: '2025-06-28' }
]

// =============== 银行账户 ===============
const BANK_ACCOUNTS = [
  { id: 1, accountNo: '6222021234567890123', accountName: '工商银行基本户', bankName: '中国工商银行', currency: 'CNY', openingBalance: 500000, currentBalance: 685430.50, status: 'active', isDefault: true, createdAt: '2024-01-15' },
  { id: 2, accountNo: '6217001234567890123', accountName: '建设银行结算户', bankName: '中国建设银行', currency: 'CNY', openingBalance: 300000, currentBalance: 218760.00, status: 'active', isDefault: false, createdAt: '2024-03-20' },
  { id: 3, accountNo: '6225881234567890', accountName: '招商银行', bankName: '招商银行', currency: 'CNY', openingBalance: 100000, currentBalance: 85400.00, status: 'active', isDefault: false, createdAt: '2024-06-10' },
  { id: 4, accountNo: '6225889876543210', accountName: '中国银行外币户', bankName: '中国银行', currency: 'USD', openingBalance: 5000, currentBalance: 4800.00, status: 'active', isDefault: false, createdAt: '2024-08-01' }
]

// =============== 银行对账单 ===============
const BANK_STATEMENTS = [
  { id: 1, accountId: 1, accountName: '工商银行基本户', date: '2025-06-30', summary: '销售收款-SO20250605', bizType: 'receipt', amount: 22600, type: 'in', voucherId: 'V004', voucherNo: '记-20250608-004', matched: true },
  { id: 2, accountId: 1, accountName: '工商银行基本户', date: '2025-06-15', summary: '销售收款-SO20250615', bizType: 'receipt', amount: 33900, type: 'in', voucherId: null, voucherNo: null, matched: false },
  { id: 3, accountId: 1, accountName: '工商银行基本户', date: '2025-06-10', summary: '费用报销-EXP20250610', bizType: 'payment', amount: 3500, type: 'out', voucherId: null, voucherNo: null, matched: false },
  { id: 4, accountId: 1, accountName: '工商银行基本户', date: '2025-06-20', summary: '付款-PAY20250620', bizType: 'payment', amount: 13000, type: 'out', voucherId: 'V009', voucherNo: '记-20250620-009', matched: true },
  { id: 5, accountId: 1, accountName: '工商银行基本户', date: '2025-06-25', summary: '银行手续费', bizType: 'fee', amount: 25, type: 'out', voucherId: null, voucherNo: null, matched: false },
  { id: 6, accountId: 1, accountName: '工商银行基本户', date: '2025-06-28', summary: '收款-广州客户C', bizType: 'receipt', amount: 45200, type: 'in', voucherId: null, voucherNo: null, matched: false },
  { id: 7, accountId: 2, accountName: '建设银行结算户', date: '2025-06-30', summary: '期初余额', bizType: 'opening', amount: 218760, type: 'in', voucherId: null, voucherNo: null, matched: true }
]

// =============== 应收明细（用于账龄分析） ===============
const RECEIVABLE_DETAILS = (() => {
  const list = []
  const customers = ['北京客户A公司', '上海客户B公司', '广州客户C公司', '深圳客户D公司', '杭州客户E公司']
  const statuses = ['unpaid', 'partial', 'paid', 'overdue']
  for (let i = 0; i < 58; i++) {
    const issueDate = Random.date('yyyy-MM-dd')
    const days = Math.floor((new Date('2025-06-30') - new Date(issueDate)) / 86400000)
    let bucket = '0-30'
    if (days > 30 && days <= 60) bucket = '31-60'
    else if (days > 60 && days <= 90) bucket = '61-90'
    else if (days > 90 && days <= 180) bucket = '91-180'
    else if (days > 180) bucket = '180+'
    const amount = +(Random.float(5000, 80000, 2, 2)).toFixed(2)
    const received = statuses[i % 4] === 'paid' ? amount : (statuses[i % 4] === 'partial' ? +(amount * 0.5).toFixed(2) : 0)
    list.push({
      id: i + 1,
      receivableNo: `AR${Random.string('number', 8)}`,
      customerName: customers[i % customers.length],
      orderNo: `SO${Random.string('number', 8)}`,
      issueDate,
      dueDate: new Date(new Date(issueDate).getTime() + 30 * 86400000).toISOString().slice(0, 10),
      amount,
      receivedAmount: received,
      remainAmount: +(amount - received).toFixed(2),
      days,
      bucket,
      status: statuses[i % 4],
      voucherNo: `记-${issueDate.replace(/-/g, '')}-${String(i + 1).padStart(3, '0')}`
    })
  }
  return list
})()

// =============== 应付明细（用于账龄分析） ===============
const PAYABLE_DETAILS = (() => {
  const list = []
  const suppliers = ['上海供应商有限公司', '深圳供应商有限公司', '广州供应商有限公司', '北京供应商有限公司']
  const statuses = ['unpaid', 'partial', 'paid', 'overdue']
  for (let i = 0; i < 42; i++) {
    const issueDate = Random.date('yyyy-MM-dd')
    const days = Math.floor((new Date('2025-06-30') - new Date(issueDate)) / 86400000)
    let bucket = '0-30'
    if (days > 30 && days <= 60) bucket = '31-60'
    else if (days > 60 && days <= 90) bucket = '61-90'
    else if (days > 90 && days <= 180) bucket = '91-180'
    else if (days > 180) bucket = '180+'
    const amount = +(Random.float(8000, 60000, 2, 2)).toFixed(2)
    const paid = statuses[i % 4] === 'paid' ? amount : (statuses[i % 4] === 'partial' ? +(amount * 0.4).toFixed(2) : 0)
    list.push({
      id: i + 1,
      payableNo: `AP${Random.string('number', 8)}`,
      supplierName: suppliers[i % suppliers.length],
      orderNo: `PO${Random.string('number', 8)}`,
      issueDate,
      dueDate: new Date(new Date(issueDate).getTime() + 30 * 86400000).toISOString().slice(0, 10),
      amount,
      paidAmount: paid,
      remainAmount: +(amount - paid).toFixed(2),
      days,
      bucket,
      status: statuses[i % 4],
      voucherNo: `记-${issueDate.replace(/-/g, '')}-${String(i + 1).padStart(3, '0')}`
    })
  }
  return list
})()

// =============== 明细账 / 总账 / 科目余额表 / 试算平衡 / 期间结账 ===============
;[
  {
    url: '/api/finance/ledgerDetail/query',
    method: 'get',
    response: (config) => {
      const { pageNum = 1, pageSize = 20, subjectCode = '1122', period = '2025-06' } = config.query || {}
      const list = buildLedgerDetail(subjectCode, period)
      const start = (pageNum - 1) * pageSize
      return { code: 200, data: { list: list.slice(start, start + pageSize), total: list.length } }
    }
  },
  {
    url: '/api/finance/subjectBalance/query',
    method: 'get',
    response: (config) => {
      const { period = '2025-06', category = '' } = config.query || {}
      const list = PRESET_SUBJECTS
        .filter(s => s.level === 1 || s.level === 2)
        .filter(s => !category || s.category === category)
        .map(s => {
          const opD = s.direction === 'debit' ? Math.round(Math.random() * 100000 * 100) / 100 : 0
          const opC = s.direction === 'credit' ? Math.round(Math.random() * 80000 * 100) / 100 : 0
          const pd = Math.round(Math.random() * 50000 * 100) / 100
          const pc = Math.round(Math.random() * 40000 * 100) / 100
          const endD = s.direction === 'debit' ? opD + pd - pc : Math.max(0, pd - pc)
          const endC = s.direction === 'credit' ? opC + pc - pd : Math.max(0, pc - pd)
          return {
            subjectCode: s.code,
            subjectName: s.name,
            category: { asset: '资产类', liability: '负债类', equity: '权益类', cost: '成本类', profit: '损益类' }[s.category] || '其他',
            direction: s.direction === 'debit' ? '借' : '贷',
            openingDebit: opD,
            openingCredit: opC,
            periodDebit: pd,
            periodCredit: pc,
            endingDebit: endD,
            endingCredit: endC
          }
        })
      return { code: 200, data: { list, total: list.length } }
    }
  },
  {
    url: '/api/finance/generalLedger/query',
    method: 'get',
    response: (config) => {
      const { period = '2025-06' } = config.query || {}
      const list = PRESET_SUBJECTS.filter(s => s.level === 1 || s.level === 2).map(s => {
        const opD = s.direction === 'debit' ? Math.round(Math.random() * 200000 * 100) / 100 : 0
        const opC = s.direction === 'credit' ? Math.round(Math.random() * 150000 * 100) / 100 : 0
        const pd = Math.round(Math.random() * 80000 * 100) / 100
        const pc = Math.round(Math.random() * 70000 * 100) / 100
        return {
          subjectCode: s.code,
          subjectName: s.name,
          openingDebit: opD,
          openingCredit: opC,
          periodDebit: pd,
          periodCredit: pc,
          endingDebit: s.direction === 'debit' ? opD + pd - pc : Math.max(0, pd - pc),
          endingCredit: s.direction === 'credit' ? opC + pc - pd : Math.max(0, pc - pd)
        }
      })
      return { code: 200, data: { list, total: list.length } }
    }
  },
  {
    // 试算平衡
    url: '/api/finance/trialBalance/query',
    method: 'get',
    response: (config) => {
      const { period = '2025-06', level = 'all' } = config.query || {}
      let list = PRESET_SUBJECTS.filter(s => s.level === 1 || s.level === 2).map(s => {
        const isDebit = s.direction === 'debit'
        const opD = isDebit ? Math.round(Math.random() * 100000 * 100) / 100 : 0
        const opC = !isDebit ? Math.round(Math.random() * 80000 * 100) / 100 : 0
        const pd = Math.round(Math.random() * 50000 * 100) / 100
        const pc = Math.round(Math.random() * 50000 * 100) / 100
        return {
          subjectCode: s.code,
          subjectName: s.name,
          category: { asset: '资产类', liability: '负债类', equity: '权益类', cost: '成本类', profit: '损益类' }[s.category] || '其他',
          direction: isDebit ? '借' : '贷',
          openingDebit: opD,
          openingCredit: opC,
          periodDebit: pd,
          periodCredit: pc,
          endingDebit: isDebit ? opD + pd - pc : Math.max(0, pd - pc),
          endingCredit: !isDebit ? opC + pc - pd : Math.max(0, pc - pd)
        }
      })
      if (level === 'leaf') list = list.filter(s => !s.subjectCode.includes('.'))
      return { code: 200, data: { list, total: list.length } }
    }
  },
  {
    // 期间结账历史
    url: '/api/finance/period/list',
    method: 'get',
    response: () => {
      const list = []
      // 2024 全年
      for (let m = 1; m <= 12; m++) {
        const period = `2024-${String(m).padStart(2, '0')}`
        list.push({
          period,
          operator: 'admin',
          closedAt: `${period}-30 23:59:59`,
          voucherCount: 30 + Math.floor(Math.random() * 30),
          totalAmount: Math.round(Math.random() * 500000 * 100) / 100,
          status: 1
        })
      }
      // 2025 1-5 已结
      for (let m = 1; m <= 5; m++) {
        const period = `2025-${String(m).padStart(2, '0')}`
        list.push({
          period,
          operator: 'admin',
          closedAt: `${period}-30 23:59:59`,
          voucherCount: 30 + Math.floor(Math.random() * 30),
          totalAmount: Math.round(Math.random() * 500000 * 100) / 100,
          status: 1
        })
      }
      // 2025-06 未结
      list.push({
        period: '2025-06',
        operator: 'admin',
        closedAt: '',
        voucherCount: 0,
        totalAmount: 0,
        status: 0
      })
      return { code: 200, data: { list, total: list.length } }
    }
  },
  {
    // 年结
    url: '/api/finance/period/yearClose',
    method: 'post',
    response: (config) => {
      const { year } = config.body || {}
      return { code: 200, message: `${year} 年年度结转完成`, data: { year, voucherNo: `记-${year}1231-AUTO001` } }
    }
  },
  {
    // 月结
    url: '/api/finance/period/monthClose',
    method: 'post',
    response: (config) => {
      const { period } = config.body || {}
      return { code: 200, message: `${period} 月结完成`, data: { period } }
    }
  },
  {
    // 反结账
    url: '/api/finance/period/antiClose',
    method: 'post',
    response: (config) => {
      const { period } = config.body || {}
      return { code: 200, message: `${period} 已反结账`, data: { period } }
    }
  }
].forEach(api => BASIC_APIS.push(api))

const EXTENDED_APIS = [
  // =============== 业务单据 → 凭证 ===============
  {
    url: '/api/finance/businessDoc/list',
    method: 'get',
    response: (config) => {
      const { pageNum = 1, pageSize = 20, bizType = '', status = '' } = config.query || {}
      let data = [...BUSINESS_DOCS]
      if (bizType) data = data.filter(d => d.bizType === bizType)
      if (status) data = data.filter(d => d.status === status)
      const total = data.length
      const start = (pageNum - 1) * pageSize
      return { code: 200, data: { list: data.slice(start, start + pageSize), total } }
    }
  },
  {
    url: '/api/finance/businessDoc/generateVoucher',
    method: 'post',
    response: (config) => {
      const { docId, docNo, bizType } = config.body || {}
      const doc = BUSINESS_DOCS.find(d => d.id === docId) || { docNo, bizType, amount: 0 }
      // 业务类型 → 凭证模板生成
      const templateMap = {
        sales_outbound: [
          { subjectCode: '1122', direction: 'debit', summary: `销售应收-${doc.customerName || ''}` },
          { subjectCode: '5001', direction: 'credit', summary: '销售收入' },
          { subjectCode: '2221.01', direction: 'credit', summary: '销项税' }
        ],
        purchase_inbound: [
          { subjectCode: '1405', direction: 'debit', summary: `采购入库-${doc.orderNo || ''}` },
          { subjectCode: '2221.01', direction: 'debit', summary: '进项税' },
          { subjectCode: '2202', direction: 'credit', summary: `应付-${doc.supplierName || ''}` }
        ],
        receipt: [
          { subjectCode: '1002.01', direction: 'debit', summary: '收款' },
          { subjectCode: '1122', direction: 'credit', summary: `核销应收-${doc.customerName || ''}` }
        ],
        payment: [
          { subjectCode: '2202', direction: 'debit', summary: `核销应付-${doc.supplierName || ''}` },
          { subjectCode: '1002.01', direction: 'credit', summary: '付款' }
        ],
        expense: [
          { subjectCode: '5602.02', direction: 'debit', summary: '差旅费' },
          { subjectCode: '1002.01', direction: 'credit', summary: '支付' }
        ],
        stocktake: [
          { subjectCode: '5501', direction: 'debit', summary: '盘亏' },
          { subjectCode: '1405', direction: 'credit', summary: '盘亏出库' }
        ]
      }
      const lines = (templateMap[bizType] || []).map((l, i) => {
        const isDebit = l.direction === 'debit'
        const totalAmount = doc.amount || 22600
        return {
          lineNo: i + 1,
          subjectCode: l.subjectCode,
          summary: l.summary,
          debitAmount: isDebit ? totalAmount : 0,
          creditAmount: isDebit ? 0 : totalAmount
        }
      })
      return {
        code: 200,
        data: {
          docId, docNo, bizType,
          voucherNo: `记-20250630-AUTO${String(docId).padStart(3, '0')}`,
          entries: lines,
          balance: true
        }
      }
    }
  },
  {
    url: '/api/finance/voucher/sourceTrace',
    method: 'get',
    response: (config) => {
      const { voucherNo } = config.query || {}
      const doc = BUSINESS_DOCS.find(d => d.voucherNo === voucherNo)
      return {
        code: 200,
        data: {
          voucherNo,
          sourceType: 'businessDoc',
          sourceDoc: doc || null,
          chain: doc ? [
            { node: '销售订单', no: doc.docNo, status: 'completed' },
            { node: '出库单', no: doc.docNo + '-OUT', status: 'completed' },
            { node: '销售发票', no: doc.docNo + '-INV', status: 'completed' },
            { node: '应收单', no: doc.docNo + '-AR', status: 'completed' },
            { node: '收款单', no: doc.docNo + '-RCT', status: 'completed' },
            { node: '凭证', no: voucherNo, status: 'generated' }
          ] : []
        }
      }
    }
  },

  // =============== 应收账龄分析 ===============
  {
    url: '/api/finance/receivable/aging',
    method: 'get',
    response: (config) => {
      const { customerName = '' } = config.query || {}
      let data = [...RECEIVABLE_DETAILS]
      if (customerName) data = data.filter(d => d.customerName === customerName)
      const buckets = ['0-30', '31-60', '61-90', '91-180', '180+']
      const summary = buckets.map(b => {
        const items = data.filter(d => d.bucket === b)
        const totalAmount = items.reduce((s, i) => s + i.amount, 0)
        const totalRemain = items.reduce((s, i) => s + i.remainAmount, 0)
        return { bucket: b, count: items.length, totalAmount: +totalAmount.toFixed(2), totalRemain: +totalRemain.toFixed(2) }
      })
      const totalAmount = data.reduce((s, d) => s + d.amount, 0)
      const totalRemain = data.reduce((s, d) => s + d.remainAmount, 0)
      return {
        code: 200,
        data: {
          period: '2025-06',
          summary: { totalCount: data.length, totalAmount: +totalAmount.toFixed(2), totalRemain: +totalRemain.toFixed(2) },
          buckets: summary,
          details: data
        }
      }
    }
  },
  {
    url: '/api/finance/receivable/customerStat',
    method: 'get',
    response: () => {
      const customers = ['北京客户A公司', '上海客户B公司', '广州客户C公司', '深圳客户D公司', '杭州客户E公司']
      const list = customers.map(c => {
        const items = RECEIVABLE_DETAILS.filter(d => d.customerName === c)
        const totalAmount = items.reduce((s, i) => s + i.amount, 0)
        const totalRemain = items.reduce((s, i) => s + i.remainAmount, 0)
        return { customerName: c, count: items.length, totalAmount: +totalAmount.toFixed(2), totalRemain: +totalRemain.toFixed(2) }
      }).filter(c => c.count > 0)
      return { code: 200, data: { list } }
    }
  },

  // =============== 应付账龄分析 ===============
  {
    url: '/api/finance/payable/aging',
    method: 'get',
    response: (config) => {
      const { supplierName = '' } = config.query || {}
      let data = [...PAYABLE_DETAILS]
      if (supplierName) data = data.filter(d => d.supplierName === supplierName)
      const buckets = ['0-30', '31-60', '61-90', '91-180', '180+']
      const summary = buckets.map(b => {
        const items = data.filter(d => d.bucket === b)
        const totalAmount = items.reduce((s, i) => s + i.amount, 0)
        const totalRemain = items.reduce((s, i) => s + i.remainAmount, 0)
        return { bucket: b, count: items.length, totalAmount: +totalAmount.toFixed(2), totalRemain: +totalRemain.toFixed(2) }
      })
      const totalAmount = data.reduce((s, d) => s + d.amount, 0)
      const totalRemain = data.reduce((s, d) => s + d.remainAmount, 0)
      return {
        code: 200,
        data: {
          period: '2025-06',
          summary: { totalCount: data.length, totalAmount: +totalAmount.toFixed(2), totalRemain: +totalRemain.toFixed(2) },
          buckets: summary,
          details: data
        }
      }
    }
  },
  {
    url: '/api/finance/payable/supplierStat',
    method: 'get',
    response: () => {
      const suppliers = ['上海供应商有限公司', '深圳供应商有限公司', '广州供应商有限公司', '北京供应商有限公司']
      const list = suppliers.map(s => {
        const items = PAYABLE_DETAILS.filter(d => d.supplierName === s)
        const totalAmount = items.reduce((s, i) => s + i.amount, 0)
        const totalRemain = items.reduce((s, i) => s + i.remainAmount, 0)
        return { supplierName: s, count: items.length, totalAmount: +totalAmount.toFixed(2), totalRemain: +totalRemain.toFixed(2) }
      }).filter(c => c.count > 0)
      return { code: 200, data: { list } }
    }
  },

  // =============== 银行账户 ===============
  {
    url: '/api/finance/bankAccount/list',
    method: 'get',
    response: () => {
      const total = BANK_ACCOUNTS.reduce((s, a) => s + a.currentBalance, 0)
      return { code: 200, data: { list: BANK_ACCOUNTS, total: +total.toFixed(2) } }
    }
  },
  {
    url: '/api/finance/bankAccount/save',
    method: 'post',
    response: (config) => {
      BANK_ACCOUNTS.push({ id: Date.now(), ...config.body, status: 'active', createdAt: new Date().toISOString().slice(0, 10) })
      return { code: 200, message: '保存成功' }
    }
  },
  {
    url: '/api/finance/cashflow/summary',
    method: 'get',
    response: () => {
      const totalIn = BANK_ACCOUNTS.reduce((s, a) => s + a.currentBalance * 0.3, 0)
      const totalOut = BANK_ACCOUNTS.reduce((s, a) => s + a.currentBalance * 0.1, 0)
      return {
        code: 200,
        data: {
          totalBalance: +BANK_ACCOUNTS.reduce((s, a) => s + a.currentBalance, 0).toFixed(2),
          monthInflow: +totalIn.toFixed(2),
          monthOutflow: +totalOut.toFixed(2),
          receivable: +RECEIVABLE_DETAILS.reduce((s, d) => s + d.remainAmount, 0).toFixed(2),
          payable: +PAYABLE_DETAILS.reduce((s, d) => s + d.remainAmount, 0).toFixed(2),
          predict30Days: +(BANK_ACCOUNTS.reduce((s, a) => s + a.currentBalance, 0) * 0.95).toFixed(2),
          predict60Days: +(BANK_ACCOUNTS.reduce((s, a) => s + a.currentBalance, 0) * 0.88).toFixed(2),
          predict90Days: +(BANK_ACCOUNTS.reduce((s, a) => s + a.currentBalance, 0) * 0.82).toFixed(2)
        }
      }
    }
  },

  // =============== 银行对账 ===============
  {
    url: '/api/finance/bankReconcile/statement',
    method: 'get',
    response: (config) => {
      const { accountId = 1, period = '2025-06' } = config.query || {}
      let list = BANK_STATEMENTS.filter(s => s.accountId === Number(accountId))
      return { code: 200, data: { accountId, period, list, totalIn: list.filter(s => s.type === 'in').reduce((sum, s) => sum + s.amount, 0), totalOut: list.filter(s => s.type === 'out').reduce((sum, s) => sum + s.amount, 0) } }
    }
  },
  {
    url: '/api/finance/bankReconcile/match',
    method: 'post',
    response: (config) => {
      const { statementId, voucherId, voucherNo } = config.body || {}
      const stmt = BANK_STATEMENTS.find(s => s.id === statementId)
      if (stmt) {
        stmt.matched = true
        stmt.voucherId = voucherId
        stmt.voucherNo = voucherNo
      }
      return { code: 200, message: '对账成功' }
    }
  },
  {
    url: '/api/finance/bankReconcile/unmatch',
    method: 'post',
    response: (config) => {
      const stmt = BANK_STATEMENTS.find(s => s.id === config.body?.statementId)
      if (stmt) {
        stmt.matched = false
        stmt.voucherId = null
        stmt.voucherNo = null
      }
      return { code: 200, message: '取消对账成功' }
    }
  },
  {
    url: '/api/finance/bankReconcile/autoMatch',
    method: 'post',
    response: (config) => {
      const { accountId = 1 } = config.body || {}
      let matched = 0
      BANK_STATEMENTS.filter(s => s.accountId === accountId && !s.matched).forEach(s => {
        if (s.bizType !== 'fee' && s.amount > 0) {
          s.matched = true
          s.voucherId = 'V-AUTO'
          s.voucherNo = `记-20250630-AUTO${matched + 1}`
          matched++
        }
      })
      return { code: 200, data: { matched } }
    }
  },
  // =============== 应收管理 / 应付管理 / 收付款单 / 费用 / 发票 ===============
  {
    url: '/api/finance/receivable/list',
    method: 'get',
    response: (config) => {
      const { pageNum = 1, pageSize = 20, customerName = '', status = '' } = config.query || {}
      const list = []
      const customers = ['北京华联超市', '上海百盛集团', '广州万和电器', '深圳星河科技', '杭州蓝海贸易', '成都远大物流', '武汉盛泰建材', '南京福源食品']
      const statMap = { '': '全部', unpaid: '待收', partial: '部分', paid: '已结', overdue: '逾期' }
      for (let i = 0; i < 86; i++) {
        const c = customers[i % customers.length]
        const amt = Math.round((2000 + Math.random() * 80000) * 100) / 100
        const paid = Math.round(Math.random() * amt * 100) / 100
        const remain = +(amt - paid).toFixed(2)
        const days = Math.floor(Math.random() * 200)
        const st = remain === 0 ? 'paid' : paid > 0 ? 'partial' : days > 90 ? 'overdue' : 'unpaid'
        list.push({
          id: i + 1, docNo: `AR2025${String(i + 1).padStart(4, '0')}`,
          customerName: c, saleOrderNo: `SO2025${String(i + 1).padStart(4, '0')}`,
          sourceDocNo: `XD2025${String(i + 1).padStart(4, '0')}`,
          invoiceNo: `INV2025${String(i + 1).padStart(4, '0')}`,
          amount: amt, paidAmount: paid, remainAmount: remain,
          issueDate: `2025-0${(i % 6) + 1}-${String((i % 28) + 1).padStart(2, '0')}`,
          dueDate: `2025-${String(((i % 6) + 1)).padStart(2, '0')}-${String((i % 28) + 1).padStart(2, '0')}`,
          days, status: st, statusName: statMap[st],
          voucherNo: st === 'paid' ? `记-20250630-AUTO${String(i + 1).padStart(3, '0')}` : ''
        })
      }
      let filtered = list
      if (customerName) filtered = filtered.filter(r => r.customerName.includes(customerName))
      if (status) filtered = filtered.filter(r => r.status === status)
      const start = (pageNum - 1) * pageSize
      return { code: 200, data: { list: filtered.slice(start, start + pageSize), total: filtered.length } }
    }
  },
  {
    url: '/api/finance/payable/list',
    method: 'get',
    response: (config) => {
      const { pageNum = 1, pageSize = 20, supplierName = '', status = '' } = config.query || {}
      const list = []
      const suppliers = ['宝钢集团', '中粮集团', '海尔电器', '美的集团', '比亚迪', '联想科技', '三一重工', '海康威视']
      const statMap = { '': '全部', unpaid: '待付', partial: '部分', paid: '已结', overdue: '逾期' }
      for (let i = 0; i < 64; i++) {
        const s = suppliers[i % suppliers.length]
        const amt = Math.round((5000 + Math.random() * 60000) * 100) / 100
        const paid = Math.round(Math.random() * amt * 100) / 100
        const remain = +(amt - paid).toFixed(2)
        const days = Math.floor(Math.random() * 180)
        const st = remain === 0 ? 'paid' : paid > 0 ? 'partial' : days > 90 ? 'overdue' : 'unpaid'
        list.push({
          id: i + 1, docNo: `AP2025${String(i + 1).padStart(4, '0')}`,
          supplierName: s, purchaseOrderNo: `PO2025${String(i + 1).padStart(4, '0')}`,
          sourceDocNo: `RK2025${String(i + 1).padStart(4, '0')}`,
          invoiceNo: `PINV2025${String(i + 1).padStart(4, '0')}`,
          amount: amt, paidAmount: paid, remainAmount: remain,
          issueDate: `2025-0${(i % 6) + 1}-${String((i % 28) + 1).padStart(2, '0')}`,
          dueDate: `2025-${String(((i % 6) + 1)).padStart(2, '0')}-${String((i % 28) + 1).padStart(2, '0')}`,
          days, status: st, statusName: statMap[st],
          voucherNo: st === 'paid' ? `记-20250630-AUTO${String(i + 1).padStart(3, '0')}` : ''
        })
      }
      let filtered = list
      if (supplierName) filtered = filtered.filter(r => r.supplierName.includes(supplierName))
      if (status) filtered = filtered.filter(r => r.status === status)
      const start = (pageNum - 1) * pageSize
      return { code: 200, data: { list: filtered.slice(start, start + pageSize), total: filtered.length } }
    }
  },
  {
    url: '/api/finance/receipt/list',
    method: 'get',
    response: (config) => {
      const { pageNum = 1, pageSize = 20, customerName = '' } = config.query || {}
      const list = []
      const customers = ['北京华联超市', '上海百盛集团', '广州万和电器', '深圳星河科技', '杭州蓝海贸易']
      const methods = ['银行转账', '电汇', '现金', '承兑汇票', '支付宝']
      for (let i = 0; i < 42; i++) {
        const c = customers[i % customers.length]
        list.push({
          id: i + 1, docNo: `SK2025${String(i + 1).padStart(4, '0')}`,
          customerName: c, receiveDate: `2025-0${(i % 6) + 1}-${String((i % 28) + 1).padStart(2, '0')}`,
          amount: Math.round((3000 + Math.random() * 50000) * 100) / 100,
          method: methods[i % methods.length],
          bankAccount: '中国工商银行 6222 0211 0099 ' + String(1000 + i).padStart(4, '0'),
          relatedArNo: `AR2025${String((i % 80) + 1).padStart(4, '0')}`,
          statusName: i % 3 === 0 ? '已核销' : '待核销',
          voucherNo: i % 2 === 0 ? `记-20250630-SK${String(i + 1).padStart(3, '0')}` : '',
          summary: '收回应收账款'
        })
      }
      let filtered = list
      if (customerName) filtered = filtered.filter(r => r.customerName.includes(customerName))
      const start = (pageNum - 1) * pageSize
      return { code: 200, data: { list: filtered.slice(start, start + pageSize), total: filtered.length } }
    }
  },
  {
    url: '/api/finance/payment/list',
    method: 'get',
    response: (config) => {
      const { pageNum = 1, pageSize = 20, supplierName = '' } = config.query || {}
      const list = []
      const suppliers = ['宝钢集团', '中粮集团', '海尔电器', '美的集团', '比亚迪']
      const methods = ['银行转账', '电汇', '现金', '承兑汇票', '支付宝']
      for (let i = 0; i < 38; i++) {
        const s = suppliers[i % suppliers.length]
        list.push({
          id: i + 1, docNo: `FK2025${String(i + 1).padStart(4, '0')}`,
          supplierName: s, paymentDate: `2025-0${(i % 6) + 1}-${String((i % 28) + 1).padStart(2, '0')}`,
          amount: Math.round((2000 + Math.random() * 40000) * 100) / 100,
          method: methods[i % methods.length],
          bankAccount: '中国建设银行 6227 0072 ' + String(2000 + i).padStart(4, '0'),
          relatedApNo: `AP2025${String((i % 60) + 1).padStart(4, '0')}`,
          statusName: i % 3 === 0 ? '已核销' : '待核销',
          voucherNo: i % 2 === 0 ? `记-20250630-FK${String(i + 1).padStart(3, '0')}` : '',
          summary: '支付应付账款'
        })
      }
      let filtered = list
      if (supplierName) filtered = filtered.filter(r => r.supplierName.includes(supplierName))
      const start = (pageNum - 1) * pageSize
      return { code: 200, data: { list: filtered.slice(start, start + pageSize), total: filtered.length } }
    }
  },
  {
    url: '/api/finance/expense/list',
    method: 'get',
    response: (config) => {
      const { pageNum = 1, pageSize = 20, category = '', status = '' } = config.query || {}
      const list = []
      const categories = [
        { code: 'travel', name: '差旅费' }, { code: 'office', name: '办公费' },
        { code: 'entertain', name: '业务招待费' }, { code: 'comm', name: '通信费' },
        { code: 'utility', name: '水电费' }, { code: 'rent', name: '租赁费' }
      ]
      const departments = ['销售部', '研发部', '行政部', '财务部', '市场部']
      const statuses = ['draft', 'submitted', 'approved', 'rejected', 'paid']
      const statusMap = { draft: '草稿', submitted: '已提交', approved: '已审批', rejected: '已驳回', paid: '已支付' }
      for (let i = 0; i < 56; i++) {
        const c = categories[i % categories.length]
        const st = statuses[i % statuses.length]
        list.push({
          id: i + 1, docNo: `EX2025${String(i + 1).padStart(4, '0')}`,
          category: c.code, categoryName: c.name,
          department: departments[i % departments.length],
          applicant: `员工${(i % 12) + 1}号`,
          amount: Math.round((200 + Math.random() * 5000) * 100) / 100,
          applyDate: `2025-0${(i % 6) + 1}-${String((i % 28) + 1).padStart(2, '0')}`,
          description: `${c.name}报销-${departments[i % departments.length]}`,
          status: st, statusName: statusMap[st],
          voucherNo: st === 'paid' ? `记-20250630-EX${String(i + 1).padStart(3, '0')}` : ''
        })
      }
      let filtered = list
      if (category) filtered = filtered.filter(r => r.category === category)
      if (status) filtered = filtered.filter(r => r.status === status)
      const start = (pageNum - 1) * pageSize
      return { code: 200, data: { list: filtered.slice(start, start + pageSize), total: filtered.length } }
    }
  },
  {
    url: '/api/finance/invoice/list',
    method: 'get',
    response: (config) => {
      const { pageNum = 1, pageSize = 20, invoiceType = '', status = '' } = config.query || {}
      const list = []
      const types = [
        { code: 'vat_special', name: '增值税专用发票' },
        { code: 'vat_general', name: '增值税普通发票' },
        { code: 'electronic', name: '电子发票' }
      ]
      const customers = ['北京华联超市', '上海百盛集团', '广州万和电器', '深圳星河科技']
      const suppliers = ['宝钢集团', '中粮集团', '海尔电器', '美的集团']
      const statuses = ['pending', 'issued', 'verified', 'cancelled']
      const statusMap = { pending: '待开', issued: '已开', verified: '已认证', cancelled: '已作废' }
      for (let i = 0; i < 48; i++) {
        const t = types[i % types.length]
        const isSale = i % 2 === 0
        const st = statuses[i % statuses.length]
        const amt = Math.round((1000 + Math.random() * 30000) * 100) / 100
        const tax = +(amt * 0.13).toFixed(2)
        list.push({
          id: i + 1, invoiceNo: `${isSale ? 'XS' : 'JF'}2025${String(i + 1).padStart(6, '0')}`,
          invoiceType: t.code, invoiceTypeName: t.name,
          party: isSale ? customers[i % customers.length] : suppliers[i % suppliers.length],
          direction: isSale ? 'sales' : 'purchase',
          amount: amt, taxAmount: tax, totalAmount: +(amt + tax).toFixed(2),
          invoiceDate: `2025-0${(i % 6) + 1}-${String((i % 28) + 1).padStart(2, '0')}`,
          relatedDocNo: isSale ? `AR2025${String((i % 80) + 1).padStart(4, '0')}` : `AP2025${String((i % 60) + 1).padStart(4, '0')}`,
          status: st, statusName: statusMap[st],
          voucherNo: st === 'verified' ? `记-20250630-IN${String(i + 1).padStart(3, '0')}` : ''
        })
      }
      let filtered = list
      if (invoiceType) filtered = filtered.filter(r => r.invoiceType === invoiceType)
      if (status) filtered = filtered.filter(r => r.status === status)
      const start = (pageNum - 1) * pageSize
      return { code: 200, data: { list: filtered.slice(start, start + pageSize), total: filtered.length } }
    }
  }
]

export default [...BASIC_APIS, ...EXTENDED_APIS]
