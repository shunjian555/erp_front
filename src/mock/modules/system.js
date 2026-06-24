/**
 * Mock 数据 - 系统管理
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
  // 用户管理
  {
    url: '/api/system/user/list',
    method: 'get',
    response: () => genList({ total: 24, recordName: '用户', fields: {
      username: `user${String(Math.floor(Math.random()*24)+1).padStart(3,'0')}`,
      realName: genCName(), phone: /^1[3-9]\d{9}$/, email: Random.email(),
      roleName: ['超级管理员','管理员','运营人员','销售人员','采购员','库管员','财务人员'][Math.floor(Math.random()*7)],
      deptName: ['总公司','技术部','销售部','财务部','行政部','采购部','仓储部'][Math.floor(Math.random()*7)],
      lastLoginTime: '{{date}}', status: [0, 1]
    }})
  },
  // 角色管理
  {
    url: '/api/system/role/list',
    method: 'get',
    response: () => ({ code: 200, data: {
      list: [
        { id: 1, code: 'admin', roleName: '超级管理员', description: '拥有系统全部权限', userCount: 2, sort: 1, status: 1, createTime: '2024-01-01 00:00:00' },
        { id: 2, code: 'manager', roleName: '管理员', description: '可管理大部分功能', userCount: 5, sort: 2, status: 1, createTime: '2024-01-01 00:00:00' },
        { id: 3, code: 'sale', roleName: '销售角色', description: '销售相关权限', userCount: 8, sort: 3, status: 1, createTime: '2024-01-05 00:00:00' },
        { id: 4, code: 'purchase', roleName: '采购角色', description: '采购相关权限', userCount: 4, sort: 4, status: 1, createTime: '2024-01-05 00:00:00' },
        { id: 5, code: 'warehouse', roleName: '仓储角色', description: '仓储相关权限', userCount: 3, sort: 5, status: 1, createTime: '2024-01-06 00:00:00' },
        { id: 6, code: 'finance', roleName: '财务角色', description: '财务相关权限', userCount: 2, sort: 6, status: 1, createTime: '2024-01-07 00:00:00' }
      ],
      total: 6
    }})
  },
  // 字典管理
  {
    url: '/api/system/dict/list',
    method: 'get',
    response: () => genList({ total: 36, recordName: '字典', fields: {
      dictType: `dict_${['sex','status','level','type','category','method'][Math.floor(Math.random()*6)]}`,
      dictLabel: Random.ctitle(2, 6), dictValue: String(Random.integer(0, 100)),
      remark: '', sort: Random.integer(0, 100), status: [0, 1]
    }})
  },
  // 操作日志
  {
    url: '/api/system/log/list',
    method: 'get',
    response: () => genList({ total: 256, recordName: '日志', fields: {
      module: ['用户管理','角色管理','菜单管理','字典管理','系统配置','客户管理','订单管理','库存管理','财务管理'][Math.floor(Math.random()*9)],
      type: ['login','operate','query','export','exception'][Math.floor(Math.random()*5)],
      description: ['登录系统','退出系统','新增用户','编辑用户','删除用户','导出数据','修改密码','查看详情'][Math.floor(Math.random()*8)],
      operator: genCName(),
      ip: Mock.mock('@ip'),
      status: [0, 1],
      duration: Random.integer(10, 2000),
      createTime: '{{date}}'
    }})
  },

  // 菜单树（供左侧菜单加载使用）
  {
    url: '/api/system/menu/tree',
    method: 'get',
    response: () => {
      // 与 menus.json 保持一致，作为后端真实接口的 mock
      // titleKey 用于 i18n 国际化
      const menuTree = [
        { path: '/dashboard', title: '工作台', titleKey: 'menu.dashboard', icon: 'Odometer', affix: true },
        { path: '/crm', title: 'CRM', titleKey: 'menu.crm', icon: 'UserFilled', children: [
          { path: '/crm/customer', title: '客户管理', titleKey: 'menu.crmCustomer', icon: 'User' },
          { path: '/crm/contact', title: '联系人管理', titleKey: 'menu.crmContact', icon: 'Phone' },
          { path: '/crm/lead', title: '线索管理', titleKey: 'menu.crmLead', icon: 'Connection' },
          { path: '/crm/opportunity', title: '商机管理', titleKey: 'menu.crmOpportunity', icon: 'TrendCharts' },
          { path: '/crm/quote', title: '报价管理', titleKey: 'menu.crmQuote', icon: 'Document' },
          { path: '/crm/contract', title: '合同管理', titleKey: 'menu.crmContract', icon: 'Tickets' },
          { path: '/crm/follow', title: '跟进记录', titleKey: 'menu.crmFollow', icon: 'ChatLineRound' },
          { path: '/crm/pool', title: '客户公海', titleKey: 'menu.crmPool', icon: 'DataBoard' },
          { path: '/crm/receivable-plan', title: '回款计划', titleKey: 'menu.crmReceivablePlan', icon: 'Coin' }
        ]},
        { path: '/oa', title: 'OA', titleKey: 'menu.oa', icon: 'Notebook', children: [
          { path: '/oa/approval', title: '审批中心', titleKey: 'menu.oaApproval', icon: 'Checked' },
          { path: '/oa/leave', title: '请假申请', titleKey: 'menu.oaLeave', icon: 'Calendar' },
          { path: '/oa/expense', title: '报销申请', titleKey: 'menu.oaExpense', icon: 'Wallet' },
          { path: '/oa/purchase-req', title: '采购申请', titleKey: 'menu.oaPurchaseReq', icon: 'ShoppingCart' },
          { path: '/oa/notice', title: '公告管理', titleKey: 'menu.oaNotice', icon: 'Bell' },
          { path: '/oa/message', title: '消息中心', titleKey: 'menu.oaMessage', icon: 'ChatDotRound' },
          { path: '/oa/attendance', title: '考勤管理', titleKey: 'menu.oaAttendance', icon: 'AlarmClock' },
          { path: '/oa/schedule', title: '日程管理', titleKey: 'menu.oaSchedule', icon: 'Calendar' },
          { path: '/oa/task', title: '任务管理', titleKey: 'menu.oaTask', icon: 'List' },
          { path: '/oa/business-trip', title: '出差申请', titleKey: 'menu.oaBusinessTrip', icon: 'Promotion' },
          { path: '/oa/car', title: '用车申请', titleKey: 'menu.oaCar', icon: 'Van' },
          { path: '/oa/meeting', title: '会议管理', titleKey: 'menu.oaMeeting', icon: 'VideoCamera' }
        ]},
        { path: '/product', title: '商品中心', titleKey: 'menu.product', icon: 'Goods', children: [
          { path: '/product/goods', title: '商品管理', titleKey: 'menu.productGoods', icon: 'Box' },
          { path: '/product/category', title: '商品分类', titleKey: 'menu.productCategory', icon: 'Menu' },
          { path: '/product/brand', title: '品牌管理', titleKey: 'menu.productBrand', icon: 'Medal' },
          { path: '/product/unit', title: '单位管理', titleKey: 'menu.productUnit', icon: 'DataAnalysis' }
        ]},
        { path: '/purchase', title: '采购管理', titleKey: 'menu.purchase', icon: 'ShoppingCartFull', children: [
          { path: '/purchase/request', title: '采购申请', titleKey: 'menu.purchaseRequest', icon: 'DocumentAdd' },
          { path: '/purchase/order', title: '采购订单', titleKey: 'menu.purchaseOrder', icon: 'List' },
          { path: '/purchase/inbound', title: '采购入库', titleKey: 'menu.purchaseInbound', icon: 'Box' },
          { path: '/purchase/return', title: '采购退货', titleKey: 'menu.purchaseReturn', icon: 'RefreshLeft' },
          { path: '/purchase/supplier', title: '供应商管理', titleKey: 'menu.purchaseSupplier', icon: 'OfficeBuilding' }
        ]},
        { path: '/sales', title: '销售管理', titleKey: 'menu.sales', icon: 'ShoppingBag', children: [
          { path: '/sales/order', title: '销售订单', titleKey: 'menu.salesOrder', icon: 'List' },
          { path: '/sales/outbound', title: '销售出库', titleKey: 'menu.salesOutbound', icon: 'Box' },
          { path: '/sales/return', title: '销售退货', titleKey: 'menu.salesReturn', icon: 'RefreshRight' },
          { path: '/sales/customer', title: '客户管理', titleKey: 'menu.salesCustomer', icon: 'User' }
        ]},
        { path: '/inventory', title: '库存管理', titleKey: 'menu.inventory', icon: 'House', children: [
          { path: '/inventory/query', title: '库存查询', titleKey: 'menu.inventoryQuery', icon: 'Search' },
          { path: '/inventory/flow', title: '库存流水', titleKey: 'menu.inventoryFlow', icon: 'Clock' },
          { path: '/inventory/warning', title: '库存预警', titleKey: 'menu.inventoryWarning', icon: 'Warning' },
          { path: '/inventory/stocktake', title: '库存盘点', titleKey: 'menu.inventoryStocktake', icon: 'DocumentChecked' },
          { path: '/inventory/adjust', title: '库存调整', titleKey: 'menu.inventoryAdjust', icon: 'EditPen' }
        ]},
        { path: '/wms', title: 'WMS', titleKey: 'menu.wms', icon: 'OfficeBuilding', children: [
          { path: '/wms/warehouse', title: '仓库管理', titleKey: 'menu.wmsWarehouse', icon: 'HomeFilled' },
          { path: '/wms/area', title: '库区管理', titleKey: 'menu.wmsArea', icon: 'Grid' },
          { path: '/wms/location', title: '库位管理', titleKey: 'menu.wmsLocation', icon: 'MapLocation' },
          { path: '/wms/transfer', title: '调拨管理', titleKey: 'menu.wmsTransfer', icon: 'Switch' },
          { path: '/wms/batch', title: '批次管理', titleKey: 'menu.wmsBatch', icon: 'CollectionTag' },
          { path: '/wms/barcode', title: '条码管理', titleKey: 'menu.wmsBarcode', icon: 'Grid' }
        ]},
        { path: '/production', title: '生产管理', titleKey: 'menu.production', icon: 'Cpu', children: [
          { path: '/production/bom', title: 'BOM管理', titleKey: 'menu.productionBom', icon: 'Document' },
          { path: '/production/process', title: '工艺路线', titleKey: 'menu.productionProcess', icon: 'Share' },
          { path: '/production/capacity', title: '产能数据', titleKey: 'menu.productionCapacity', icon: 'DataLine' },
          { path: '/production/mps', title: '主生产计划', titleKey: 'menu.productionMps', icon: 'Calendar' },
          { path: '/production/mrp', title: '物料需求计划', titleKey: 'menu.productionMrp', icon: 'Tickets' },
          { path: '/production/order', title: '生产订单', titleKey: 'menu.productionOrder', icon: 'List' },
          { path: '/production/operation', title: '工序管理', titleKey: 'menu.productionOperation', icon: 'Operation' },
          { path: '/production/workshop', title: '车间管理', titleKey: 'menu.productionWorkshop', icon: 'OfficeBuilding' },
          { path: '/production/outsourcing', title: '委外加工', titleKey: 'menu.productionOutsourcing', icon: 'Connection' },
          { path: '/production/equipment', title: '设备管理', titleKey: 'menu.productionEquipment', icon: 'Tools' }
        ]},
        { path: '/finance', title: '财务管理', titleKey: 'menu.finance', icon: 'Money', children: [
          { path: '/finance/subject', title: '会计科目', titleKey: 'menu.financeSubject', icon: 'Collection' },
          { path: '/finance/voucher', title: '凭证管理', titleKey: 'menu.financeVoucher', icon: 'Document' },
          { path: '/finance/voucherTemplate', title: '凭证模板', titleKey: 'menu.financeVoucherTemplate', icon: 'MagicStick' },
          { path: '/finance/ledger', title: '总账查询', titleKey: 'menu.financeLedger', icon: 'Notebook' },
          { path: '/finance/trialBalance', title: '试算平衡', titleKey: 'menu.financeTrialBalance', icon: 'DataLine' },
          { path: '/finance/report', title: '财务报表', titleKey: 'menu.financeReport', icon: 'DataAnalysis' },
          { path: '/finance/period', title: '期末结账', titleKey: 'menu.financePeriod', icon: 'Calendar' },
          { path: '/finance/receivable', title: '应收管理', titleKey: 'menu.financeReceivable', icon: 'ArrowDown' },
          { path: '/finance/payable', title: '应付管理', titleKey: 'menu.financePayable', icon: 'ArrowUp' },
          { path: '/finance/receipt', title: '收款单', titleKey: 'menu.financeReceipt', icon: 'CreditCard' },
          { path: '/finance/payment', title: '付款单', titleKey: 'menu.financePayment', icon: 'CreditCard' },
          { path: '/finance/expense', title: '费用管理', titleKey: 'menu.financeExpense', icon: 'Wallet' },
          { path: '/finance/invoice', title: '发票管理', titleKey: 'menu.financeInvoice', icon: 'Ticket' },
          { path: '/finance/businessIntegration', title: '业务-财务集成', titleKey: 'menu.financeBusinessIntegration', icon: 'Connection' },
          { path: '/finance/receivableAging', title: '应收账龄分析', titleKey: 'menu.financeReceivableAging', icon: 'TrendCharts' },
          { path: '/finance/payableAging', title: '应付账龄分析', titleKey: 'menu.financePayableAging', icon: 'TrendCharts' },
          { path: '/finance/bankAccount', title: '银行账户与资金', titleKey: 'menu.financeBankAccount', icon: 'CreditCard' },
          { path: '/finance/bankReconcile', title: '银行对账', titleKey: 'menu.financeBankReconcile', icon: 'Document' },
          { path: '/finance/cashier', title: '出纳管理', titleKey: 'menu.financeCashier', icon: 'Wallet' },
          { path: '/finance/onlineBank', title: '网上银行', titleKey: 'menu.financeOnlineBank', icon: 'CreditCard' },
          { path: '/finance/tax', title: '税务管理', titleKey: 'menu.financeTax', icon: 'Ticket' },
          { path: '/finance/fundPlan', title: '资金计划', titleKey: 'menu.financeFundPlan', icon: 'Coin' },
          { path: '/finance/cashFlow', title: '现金流预测', titleKey: 'menu.financeCashFlow', icon: 'DataLine' },
          { path: '/finance/multiBook', title: '多账簿管理', titleKey: 'menu.financeMultiBook', icon: 'Notebook' }
        ]},
        { path: '/bi', title: 'BI报表', titleKey: 'menu.bi', icon: 'DataAnalysis', children: [
          { path: '/bi/sales-analysis', title: '销售分析', titleKey: 'menu.biSalesAnalysis', icon: 'TrendCharts' },
          { path: '/bi/purchase-analysis', title: '采购分析', titleKey: 'menu.biPurchaseAnalysis', icon: 'ShoppingCart' },
          { path: '/bi/inventory-analysis', title: '库存分析', titleKey: 'menu.biInventoryAnalysis', icon: 'Box' },
          { path: '/bi/profit-analysis', title: '利润分析', titleKey: 'menu.biProfitAnalysis', icon: 'Money' },
          { path: '/bi/reportDesigner', title: '自定义报表设计器', titleKey: 'menu.biReportDesigner', icon: 'EditPen' },
          { path: '/bi/dashboardCustom', title: '仪表盘自定义', titleKey: 'menu.biDashboardCustom', icon: 'DataBoard' },
          { path: '/bi/alertRule', title: '预警规则配置', titleKey: 'menu.biAlertRule', icon: 'Warning' },
          { path: '/bi/dataDrill', title: '数据钻取', titleKey: 'menu.biDataDrill', icon: 'Share' },
          { path: '/bi/comparisonAnalysis', title: '同比环比分析', titleKey: 'menu.biComparisonAnalysis', icon: 'TrendCharts' }
        ]},
        { path: '/system', title: '系统管理', titleKey: 'menu.system', icon: 'Setting', children: [
          { path: '/system/user', title: '用户管理', titleKey: 'menu.systemUser', icon: 'UserFilled' },
          { path: '/system/role', title: '角色管理', titleKey: 'menu.systemRole', icon: 'User' },
          { path: '/system/menu', title: '菜单管理', titleKey: 'menu.systemMenu', icon: 'Menu' },
          { path: '/system/dept', title: '部门管理', titleKey: 'menu.systemDept', icon: 'OfficeBuilding' },
          { path: '/system/dict', title: '字典管理', titleKey: 'menu.systemDict', icon: 'Document' },
          { path: '/system/log', title: '操作日志', titleKey: 'menu.systemLog', icon: 'Notebook' },
          { path: '/system/config', title: '系统配置', titleKey: 'menu.systemConfig', icon: 'Tools' },
          { path: '/system/orgSwitch', title: '多组织/多公司', titleKey: 'menu.systemOrgSwitch', icon: 'OfficeBuilding' },
          { path: '/system/i18n', title: '多语言 (i18n)', titleKey: 'menu.systemI18n', icon: 'ChatLineRound' },
          { path: '/system/docNumber', title: '单据编号规则', titleKey: 'menu.systemDocNumber', icon: 'CollectionTag' },
          { path: '/system/printTemplate', title: '打印模板设计', titleKey: 'menu.systemPrintTemplate', icon: 'Printer' },
          { path: '/system/workflowDesigner', title: '工作流设计器', titleKey: 'menu.systemWorkflowDesigner', icon: 'Share' },
          { path: '/system/dataImport', title: '数据导入导出', titleKey: 'menu.systemDataImport', icon: 'Upload' },
          { path: '/system/apiGateway', title: 'API 网关', titleKey: 'menu.systemApiGateway', icon: 'Connection' },
          { path: '/system/monitor', title: '系统监控', titleKey: 'menu.systemMonitor', icon: 'Monitor' }
        ]}
      ]
      return { code: 200, data: menuTree }
    }
  }
]
