import { createRouter, createWebHistory } from 'vue-router'
import Layout from '@/layout/index.vue'

/**
 * 静态路由（不需要权限）
 */
export const constantRoutes = [
  {
    path: '/login',
    component: () => import('@/views/login/index.vue'),
    meta: { title: '登录', titleKey: 'menu.login', hidden: true }
  },
  {
    path: '/redirect',
    component: Layout,
    meta: { hidden: true },
    children: [
      {
        path: '/redirect/:path(.*)',
        component: () => import('@/layout/components/Redirect.vue')
      }
    ]
  },
  {
    path: '/',
    component: Layout,
    redirect: '/dashboard',
    meta: { title: '首页', titleKey: 'menu.home', icon: 'HomeFilled' },
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/dashboard/index.vue'),
        meta: { title: '工作台', titleKey: 'menu.dashboard', icon: 'Odometer', affix: true, keepAlive: true }
      }
    ]
  },
  {
    path: '/profile',
    component: Layout,
    meta: { title: '个人中心', titleKey: 'menu.profile', hidden: true },
    children: [
      {
        path: '',
        name: 'Profile',
        component: () => import('@/views/profile/index.vue'),
        meta: { title: '个人中心', titleKey: 'menu.profile', icon: 'User' }
      }
    ]
  }
]

/**
 * 异步路由（需要权限）
 */
export const asyncRoutes = [
  // ==================== CRM 客户关系管理 ====================
  {
    path: '/crm',
    component: Layout,
    redirect: '/crm/customer',
    meta: { title: 'CRM', titleKey: 'menu.crm', icon: 'UserFilled', roles: ['admin', 'crm'] },
    children: [
      {
        path: 'customer',
        name: 'CrmCustomer',
        component: () => import('@/views/crm/customer/index.vue'),
        meta: { title: '客户管理', titleKey: 'menu.crmCustomer', icon: 'User' }
      },
      {
        path: 'contact',
        name: 'CrmContact',
        component: () => import('@/views/crm/contact/index.vue'),
        meta: { title: '联系人管理', titleKey: 'menu.crmContact', icon: 'Phone' }
      },
      {
        path: 'lead',
        name: 'CrmLead',
        component: () => import('@/views/crm/lead/index.vue'),
        meta: { title: '线索管理', titleKey: 'menu.crmLead', icon: 'Connection' }
      },
      {
        path: 'opportunity',
        name: 'CrmOpportunity',
        component: () => import('@/views/crm/opportunity/index.vue'),
        meta: { title: '商机管理', titleKey: 'menu.crmOpportunity', icon: 'TrendCharts' }
      },
      {
        path: 'quote',
        name: 'CrmQuote',
        component: () => import('@/views/crm/quote/index.vue'),
        meta: { title: '报价管理', titleKey: 'menu.crmQuote', icon: 'Document' }
      },
      {
        path: 'contract',
        name: 'CrmContract',
        component: () => import('@/views/crm/contract/index.vue'),
        meta: { title: '合同管理', titleKey: 'menu.crmContract', icon: 'Tickets' }
      },
      {
        path: 'follow',
        name: 'CrmFollow',
        component: () => import('@/views/crm/follow/index.vue'),
        meta: { title: '跟进记录', titleKey: 'menu.crmFollow', icon: 'ChatLineRound' }
      },
      {
        path: 'pool',
        name: 'CrmPool',
        component: () => import('@/views/crm/pool/index.vue'),
        meta: { title: '客户公海', titleKey: 'menu.crmPool', icon: 'DataBoard' }
      },
      {
        path: 'receivable-plan',
        name: 'CrmReceivablePlan',
        component: () => import('@/views/crm/receivablePlan/index.vue'),
        meta: { title: '回款计划', titleKey: 'menu.crmReceivablePlan', icon: 'Coin' }
      }
    ]
  },

  // ==================== OA 办公自动化 ====================
  {
    path: '/oa',
    component: Layout,
    redirect: '/oa/approval',
    meta: { title: 'OA', titleKey: 'menu.oa', icon: 'Notebook', roles: ['admin', 'oa'] },
    children: [
      {
        path: 'approval',
        name: 'OaApproval',
        component: () => import('@/views/oa/approval/index.vue'),
        meta: { title: '审批中心', titleKey: 'menu.oaApproval', icon: 'Checked' }
      },
      {
        path: 'leave',
        name: 'OaLeave',
        component: () => import('@/views/oa/leave/index.vue'),
        meta: { title: '请假申请', titleKey: 'menu.oaLeave', icon: 'Calendar' }
      },
      {
        path: 'expense',
        name: 'OaExpense',
        component: () => import('@/views/oa/expense/index.vue'),
        meta: { title: '报销申请', titleKey: 'menu.oaExpense', icon: 'Wallet' }
      },
      {
        path: 'purchase-req',
        name: 'OaPurchaseReq',
        component: () => import('@/views/oa/purchaseReq/index.vue'),
        meta: { title: '采购申请', titleKey: 'menu.oaPurchaseReq', icon: 'ShoppingCart' }
      },
      {
        path: 'notice',
        name: 'OaNotice',
        component: () => import('@/views/oa/notice/index.vue'),
        meta: { title: '公告管理', titleKey: 'menu.oaNotice', icon: 'Bell' }
      },
      {
        path: 'message',
        name: 'OaMessage',
        component: () => import('@/views/oa/message/index.vue'),
        meta: { title: '消息中心', titleKey: 'menu.oaMessage', icon: 'ChatDotRound' }
      },
      {
        path: 'attendance',
        name: 'OaAttendance',
        component: () => import('@/views/oa/attendance/index.vue'),
        meta: { title: '考勤管理', titleKey: 'menu.oaAttendance', icon: 'AlarmClock' }
      },
      {
        path: 'schedule',
        name: 'OaSchedule',
        component: () => import('@/views/oa/schedule/index.vue'),
        meta: { title: '日程管理', titleKey: 'menu.oaSchedule', icon: 'Calendar' }
      },
      {
        path: 'task',
        name: 'OaTask',
        component: () => import('@/views/oa/task/index.vue'),
        meta: { title: '任务管理', titleKey: 'menu.oaTask', icon: 'List' }
      },
      {
        path: 'business-trip',
        name: 'OaBusinessTrip',
        component: () => import('@/views/oa/businessTrip/index.vue'),
        meta: { title: '出差申请', titleKey: 'menu.oaBusinessTrip', icon: 'Promotion' }
      },
      {
        path: 'car',
        name: 'OaCar',
        component: () => import('@/views/oa/car/index.vue'),
        meta: { title: '用车申请', titleKey: 'menu.oaCar', icon: 'Van' }
      },
      {
        path: 'meeting',
        name: 'OaMeeting',
        component: () => import('@/views/oa/meeting/index.vue'),
        meta: { title: '会议管理', titleKey: 'menu.oaMeeting', icon: 'VideoCamera' }
      }
    ]
  },

  // ==================== 商品中心 ====================
  {
    path: '/product',
    component: Layout,
    redirect: '/product/goods',
    meta: { title: '商品中心', titleKey: 'menu.product', icon: 'Goods', roles: ['admin', 'product'] },
    children: [
      {
        path: 'goods',
        name: 'ProductGoods',
        component: () => import('@/views/product/goods/index.vue'),
        meta: { title: '商品管理', titleKey: 'menu.productGoods', icon: 'Box' }
      },
      {
        path: 'category',
        name: 'ProductCategory',
        component: () => import('@/views/product/category/index.vue'),
        meta: { title: '商品分类', titleKey: 'menu.productCategory', icon: 'Menu' }
      },
      {
        path: 'brand',
        name: 'ProductBrand',
        component: () => import('@/views/product/brand/index.vue'),
        meta: { title: '品牌管理', titleKey: 'menu.productBrand', icon: 'Medal' }
      },
      {
        path: 'unit',
        name: 'ProductUnit',
        component: () => import('@/views/product/unit/index.vue'),
        meta: { title: '单位管理', titleKey: 'menu.productUnit', icon: 'DataAnalysis' }
      }
    ]
  },

  // ==================== 采购管理 ====================
  {
    path: '/purchase',
    component: Layout,
    redirect: '/purchase/request',
    meta: { title: '采购管理', titleKey: 'menu.purchase', icon: 'ShoppingCartFull', roles: ['admin', 'purchase'] },
    children: [
      {
        path: 'request',
        name: 'PurchaseRequest',
        component: () => import('@/views/purchase/request/index.vue'),
        meta: { title: '采购申请', titleKey: 'menu.purchaseRequest', icon: 'DocumentAdd' }
      },
      {
        path: 'order',
        name: 'PurchaseOrder',
        component: () => import('@/views/purchase/order/index.vue'),
        meta: { title: '采购订单', titleKey: 'menu.purchaseOrder', icon: 'List' }
      },
      {
        path: 'inbound',
        name: 'PurchaseInbound',
        component: () => import('@/views/purchase/inbound/index.vue'),
        meta: { title: '采购入库', titleKey: 'menu.purchaseInbound', icon: 'Box' }
      },
      {
        path: 'return',
        name: 'PurchaseReturn',
        component: () => import('@/views/purchase/return/index.vue'),
        meta: { title: '采购退货', titleKey: 'menu.purchaseReturn', icon: 'RefreshLeft' }
      },
      {
        path: 'supplier',
        name: 'SupplierManage',
        component: () => import('@/views/purchase/supplier/index.vue'),
        meta: { title: '供应商管理', titleKey: 'menu.purchaseSupplier', icon: 'OfficeBuilding' }
      }
    ]
  },

  // ==================== 销售管理 ====================
  {
    path: '/sales',
    component: Layout,
    redirect: '/sales/order',
    meta: { title: '销售管理', titleKey: 'menu.sales', icon: 'ShoppingBag', roles: ['admin', 'sales'] },
    children: [
      {
        path: 'order',
        name: 'SalesOrder',
        component: () => import('@/views/sales/order/index.vue'),
        meta: { title: '销售订单', titleKey: 'menu.salesOrder', icon: 'List' }
      },
      {
        path: 'outbound',
        name: 'SalesOutbound',
        component: () => import('@/views/sales/outbound/index.vue'),
        meta: { title: '销售出库', titleKey: 'menu.salesOutbound', icon: 'Box' }
      },
      {
        path: 'return',
        name: 'SalesReturn',
        component: () => import('@/views/sales/return/index.vue'),
        meta: { title: '销售退货', titleKey: 'menu.salesReturn', icon: 'RefreshRight' }
      },
      {
        path: 'customer',
        name: 'SalesCustomer',
        component: () => import('@/views/sales/customer/index.vue'),
        meta: { title: '客户管理', titleKey: 'menu.salesCustomer', icon: 'User' }
      }
    ]
  },

  // ==================== 库存管理 ====================
  {
    path: '/inventory',
    component: Layout,
    redirect: '/inventory/query',
    meta: { title: '库存管理', titleKey: 'menu.inventory', icon: 'House', roles: ['admin', 'inventory'] },
    children: [
      {
        path: 'query',
        name: 'InventoryQuery',
        component: () => import('@/views/inventory/query/index.vue'),
        meta: { title: '库存查询', titleKey: 'menu.inventoryQuery', icon: 'Search' }
      },
      {
        path: 'flow',
        name: 'InventoryFlow',
        component: () => import('@/views/inventory/flow/index.vue'),
        meta: { title: '库存流水', titleKey: 'menu.inventoryFlow', icon: 'Clock' }
      },
      {
        path: 'warning',
        name: 'InventoryWarning',
        component: () => import('@/views/inventory/warning/index.vue'),
        meta: { title: '库存预警', titleKey: 'menu.inventoryWarning', icon: 'Warning' }
      },
      {
        path: 'stocktake',
        name: 'InventoryStocktake',
        component: () => import('@/views/inventory/stocktake/index.vue'),
        meta: { title: '库存盘点', titleKey: 'menu.inventoryStocktake', icon: 'DocumentChecked' }
      },
      {
        path: 'adjust',
        name: 'InventoryAdjust',
        component: () => import('@/views/inventory/adjust/index.vue'),
        meta: { title: '库存调整', titleKey: 'menu.inventoryAdjust', icon: 'EditPen' }
      }
    ]
  },

  // ==================== WMS 仓储管理 ====================
  {
    path: '/wms',
    component: Layout,
    redirect: '/wms/warehouse',
    meta: { title: 'WMS', titleKey: 'menu.wms', icon: 'OfficeBuilding', roles: ['admin', 'wms'] },
    children: [
      {
        path: 'warehouse',
        name: 'WmsWarehouse',
        component: () => import('@/views/wms/warehouse/index.vue'),
        meta: { title: '仓库管理', titleKey: 'menu.wmsWarehouse', icon: 'HomeFilled' }
      },
      {
        path: 'area',
        name: 'WmsArea',
        component: () => import('@/views/wms/area/index.vue'),
        meta: { title: '库区管理', titleKey: 'menu.wmsArea', icon: 'Grid' }
      },
      {
        path: 'location',
        name: 'WmsLocation',
        component: () => import('@/views/wms/location/index.vue'),
        meta: { title: '库位管理', titleKey: 'menu.wmsLocation', icon: 'MapLocation' }
      },
      {
        path: 'transfer',
        name: 'WmsTransfer',
        component: () => import('@/views/wms/transfer/index.vue'),
        meta: { title: '调拨管理', titleKey: 'menu.wmsTransfer', icon: 'Switch' }
      },
      {
        path: 'batch',
        name: 'WmsBatch',
        component: () => import('@/views/wms/batch/index.vue'),
        meta: { title: '批次管理', titleKey: 'menu.wmsBatch', icon: 'CollectionTag' }
      },
      {
        path: 'barcode',
        name: 'WmsBarcode',
        component: () => import('@/views/wms/barcode/index.vue'),
        meta: { title: '条码管理', titleKey: 'menu.wmsBarcode', icon: 'Grid' }
      }
    ]
  },

  // ==================== 生产管理 (PLM/MES) ====================
  {
    path: '/production',
    component: Layout,
    redirect: '/production/bom',
    meta: { title: '生产管理', titleKey: 'menu.production', icon: 'Cpu', roles: ['admin', 'production'] },
    children: [
      {
        path: 'bom',
        name: 'ProductionBom',
        component: () => import('@/views/production/bom/index.vue'),
        meta: { title: 'BOM管理', titleKey: 'menu.productionBom', icon: 'Document' }
      },
      {
        path: 'process',
        name: 'ProductionProcess',
        component: () => import('@/views/production/process/index.vue'),
        meta: { title: '工艺路线', titleKey: 'menu.productionProcess', icon: 'Share' }
      },
      {
        path: 'capacity',
        name: 'ProductionCapacity',
        component: () => import('@/views/production/capacity/index.vue'),
        meta: { title: '产能数据', titleKey: 'menu.productionCapacity', icon: 'DataLine' }
      },
      {
        path: 'mps',
        name: 'ProductionMps',
        component: () => import('@/views/production/mps/index.vue'),
        meta: { title: '主生产计划', titleKey: 'menu.productionMps', icon: 'Calendar' }
      },
      {
        path: 'mrp',
        name: 'ProductionMrp',
        component: () => import('@/views/production/mrp/index.vue'),
        meta: { title: '物料需求计划', titleKey: 'menu.productionMrp', icon: 'Tickets' }
      },
      {
        path: 'order',
        name: 'ProductionOrder',
        component: () => import('@/views/production/order/index.vue'),
        meta: { title: '生产订单', titleKey: 'menu.productionOrder', icon: 'List' }
      },
      {
        path: 'operation',
        name: 'ProductionOperation',
        component: () => import('@/views/production/operation/index.vue'),
        meta: { title: '工序管理', titleKey: 'menu.productionOperation', icon: 'Operation' }
      },
      {
        path: 'workshop',
        name: 'ProductionWorkshop',
        component: () => import('@/views/production/workshop/index.vue'),
        meta: { title: '车间管理', titleKey: 'menu.productionWorkshop', icon: 'OfficeBuilding' }
      },
      {
        path: 'outsourcing',
        name: 'ProductionOutsourcing',
        component: () => import('@/views/production/outsourcing/index.vue'),
        meta: { title: '委外加工', titleKey: 'menu.productionOutsourcing', icon: 'Connection' }
      },
      {
        path: 'equipment',
        name: 'ProductionEquipment',
        component: () => import('@/views/production/equipment/index.vue'),
        meta: { title: '设备管理', titleKey: 'menu.productionEquipment', icon: 'Tools' }
      }
    ]
  },

  // ==================== 财务管理 ====================
  {
    path: '/finance',
    component: Layout,
    redirect: '/finance/subject',
    meta: { title: '财务管理', titleKey: 'menu.finance', icon: 'Money', roles: ['admin', 'finance'] },
    children: [
      {
        path: 'subject',
        name: 'FinanceSubject',
        component: () => import('@/views/finance/subject/index.vue'),
        meta: { title: '会计科目', titleKey: 'menu.financeSubject', icon: 'Collection' }
      },
      {
        path: 'voucher',
        name: 'FinanceVoucher',
        component: () => import('@/views/finance/voucher/index.vue'),
        meta: { title: '凭证管理', titleKey: 'menu.financeVoucher', icon: 'Document' }
      },
      {
        path: 'ledger',
        name: 'FinanceLedger',
        component: () => import('@/views/finance/ledger/index.vue'),
        meta: { title: '总账查询', titleKey: 'menu.financeLedger', icon: 'Notebook' }
      },
      {
        path: 'voucherTemplate',
        name: 'FinanceVoucherTemplate',
        component: () => import('@/views/finance/voucherTemplate/index.vue'),
        meta: { title: '凭证模板', titleKey: 'menu.financeVoucherTemplate', icon: 'MagicStick' }
      },
      {
        path: 'trialBalance',
        name: 'FinanceTrialBalance',
        component: () => import('@/views/finance/trialBalance/index.vue'),
        meta: { title: '试算平衡', titleKey: 'menu.financeTrialBalance', icon: 'DataLine' }
      },
      {
        path: 'report',
        name: 'FinanceReport',
        component: () => import('@/views/finance/report/index.vue'),
        meta: { title: '财务报表', titleKey: 'menu.financeReport', icon: 'DataAnalysis' }
      },
      {
        path: 'period',
        name: 'FinancePeriod',
        component: () => import('@/views/finance/period/index.vue'),
        meta: { title: '期末结账', titleKey: 'menu.financePeriod', icon: 'Calendar' }
      },
      {
        path: 'receivable',
        name: 'FinanceReceivable',
        component: () => import('@/views/finance/receivable/index.vue'),
        meta: { title: '应收管理', titleKey: 'menu.financeReceivable', icon: 'ArrowDown' }
      },
      {
        path: 'payable',
        name: 'FinancePayable',
        component: () => import('@/views/finance/payable/index.vue'),
        meta: { title: '应付管理', titleKey: 'menu.financePayable', icon: 'ArrowUp' }
      },
      {
        path: 'receipt',
        name: 'FinanceReceipt',
        component: () => import('@/views/finance/receipt/index.vue'),
        meta: { title: '收款单', titleKey: 'menu.financeReceipt', icon: 'CreditCard' }
      },
      {
        path: 'payment',
        name: 'FinancePayment',
        component: () => import('@/views/finance/payment/index.vue'),
        meta: { title: '付款单', titleKey: 'menu.financePayment', icon: 'CreditCard' }
      },
      {
        path: 'expense',
        name: 'FinanceExpense',
        component: () => import('@/views/finance/expense/index.vue'),
        meta: { title: '费用管理', titleKey: 'menu.financeExpense', icon: 'Wallet' }
      },
      {
        path: 'invoice',
        name: 'FinanceInvoice',
        component: () => import('@/views/finance/invoice/index.vue'),
        meta: { title: '发票管理', titleKey: 'menu.financeInvoice', icon: 'Ticket' }
      },
      {
        path: 'businessIntegration',
        name: 'FinanceBusinessIntegration',
        component: () => import('@/views/finance/businessIntegration/index.vue'),
        meta: { title: '业务-财务集成', titleKey: 'menu.financeBusinessIntegration', icon: 'Connection' }
      },
      {
        path: 'receivableAging',
        name: 'FinanceReceivableAging',
        component: () => import('@/views/finance/receivableAging/index.vue'),
        meta: { title: '应收账龄分析', titleKey: 'menu.financeReceivableAging', icon: 'TrendCharts' }
      },
      {
        path: 'payableAging',
        name: 'FinancePayableAging',
        component: () => import('@/views/finance/payableAging/index.vue'),
        meta: { title: '应付账龄分析', titleKey: 'menu.financePayableAging', icon: 'TrendCharts' }
      },
      {
        path: 'bankAccount',
        name: 'FinanceBankAccount',
        component: () => import('@/views/finance/bankAccount/index.vue'),
        meta: { title: '银行账户与资金', titleKey: 'menu.financeBankAccount', icon: 'CreditCard' }
      },
      {
        path: 'bankReconcile',
        name: 'FinanceBankReconcile',
        component: () => import('@/views/finance/bankReconcile/index.vue'),
        meta: { title: '银行对账', titleKey: 'menu.financeBankReconcile', icon: 'Document' }
      },
      {
        path: 'cashier',
        name: 'FinanceCashier',
        component: () => import('@/views/finance/cashier/index.vue'),
        meta: { title: '出纳管理', titleKey: 'menu.financeCashier', icon: 'Wallet' }
      },
      {
        path: 'onlineBank',
        name: 'FinanceOnlineBank',
        component: () => import('@/views/finance/onlineBank/index.vue'),
        meta: { title: '网上银行', titleKey: 'menu.financeOnlineBank', icon: 'CreditCard' }
      },
      {
        path: 'tax',
        name: 'FinanceTax',
        component: () => import('@/views/finance/tax/index.vue'),
        meta: { title: '税务管理', titleKey: 'menu.financeTax', icon: 'Ticket' }
      },
      {
        path: 'fundPlan',
        name: 'FinanceFundPlan',
        component: () => import('@/views/finance/fundPlan/index.vue'),
        meta: { title: '资金计划', titleKey: 'menu.financeFundPlan', icon: 'Coin' }
      },
      {
        path: 'cashFlow',
        name: 'FinanceCashFlow',
        component: () => import('@/views/finance/cashFlow/index.vue'),
        meta: { title: '现金流预测', titleKey: 'menu.financeCashFlow', icon: 'DataLine' }
      },
      {
        path: 'multiBook',
        name: 'FinanceMultiBook',
        component: () => import('@/views/finance/multiBook/index.vue'),
        meta: { title: '多账簿管理', titleKey: 'menu.financeMultiBook', icon: 'Notebook' }
      }
    ]
  },

  // ==================== BI报表 ====================
  {
    path: '/bi',
    component: Layout,
    redirect: '/bi/sales-analysis',
    meta: { title: 'BI报表', titleKey: 'menu.bi', icon: 'DataAnalysis', roles: ['admin', 'bi'] },
    children: [
      {
        path: 'sales-analysis',
        name: 'BiSalesAnalysis',
        component: () => import('@/views/bi/salesAnalysis/index.vue'),
        meta: { title: '销售分析', titleKey: 'menu.biSalesAnalysis', icon: 'TrendCharts' }
      },
      {
        path: 'purchase-analysis',
        name: 'BiPurchaseAnalysis',
        component: () => import('@/views/bi/purchaseAnalysis/index.vue'),
        meta: { title: '采购分析', titleKey: 'menu.biPurchaseAnalysis', icon: 'ShoppingCart' }
      },
      {
        path: 'inventory-analysis',
        name: 'BiInventoryAnalysis',
        component: () => import('@/views/bi/inventoryAnalysis/index.vue'),
        meta: { title: '库存分析', titleKey: 'menu.biInventoryAnalysis', icon: 'Box' }
      },
      {
        path: 'profit-analysis',
        name: 'BiProfitAnalysis',
        component: () => import('@/views/bi/profitAnalysis/index.vue'),
        meta: { title: '利润分析', titleKey: 'menu.biProfitAnalysis', icon: 'Money' }
      },
      {
        path: 'reportDesigner',
        name: 'BiReportDesigner',
        component: () => import('@/views/bi/reportDesigner/index.vue'),
        meta: { title: '自定义报表设计器', titleKey: 'menu.biReportDesigner', icon: 'EditPen' }
      },
      {
        path: 'dashboardCustom',
        name: 'BiDashboardCustom',
        component: () => import('@/views/bi/dashboardCustom/index.vue'),
        meta: { title: '仪表盘自定义', titleKey: 'menu.biDashboardCustom', icon: 'DataBoard' }
      },
      {
        path: 'alertRule',
        name: 'BiAlertRule',
        component: () => import('@/views/bi/alertRule/index.vue'),
        meta: { title: '预警规则配置', titleKey: 'menu.biAlertRule', icon: 'Warning' }
      },
      {
        path: 'dataDrill',
        name: 'BiDataDrill',
        component: () => import('@/views/bi/dataDrill/index.vue'),
        meta: { title: '数据钻取', titleKey: 'menu.biDataDrill', icon: 'Share' }
      },
      {
        path: 'comparisonAnalysis',
        name: 'BiComparisonAnalysis',
        component: () => import('@/views/bi/comparisonAnalysis/index.vue'),
        meta: { title: '同比环比分析', titleKey: 'menu.biComparisonAnalysis', icon: 'TrendCharts' }
      }
    ]
  },

  // ==================== 系统管理 ====================
  {
    path: '/system',
    component: Layout,
    redirect: '/system/user',
    meta: { title: '系统管理', titleKey: 'menu.system', icon: 'Setting', roles: ['admin'] },
    children: [
      {
        path: 'user',
        name: 'SystemUser',
        component: () => import('@/views/system/user/index.vue'),
        meta: { title: '用户管理', titleKey: 'menu.systemUser', icon: 'UserFilled' }
      },
      {
        path: 'role',
        name: 'SystemRole',
        component: () => import('@/views/system/role/index.vue'),
        meta: { title: '角色管理', titleKey: 'menu.systemRole', icon: 'User' }
      },
      {
        path: 'menu',
        name: 'SystemMenu',
        component: () => import('@/views/system/menu/index.vue'),
        meta: { title: '菜单管理', titleKey: 'menu.systemMenu', icon: 'Menu' }
      },
      {
        path: 'dept',
        name: 'SystemDept',
        component: () => import('@/views/system/dept/index.vue'),
        meta: { title: '部门管理', titleKey: 'menu.systemDept', icon: 'OfficeBuilding' }
      },
      {
        path: 'dict',
        name: 'SystemDict',
        component: () => import('@/views/system/dict/index.vue'),
        meta: { title: '字典管理', titleKey: 'menu.systemDict', icon: 'Document' }
      },
      {
        path: 'log',
        name: 'SystemLog',
        component: () => import('@/views/system/log/index.vue'),
        meta: { title: '操作日志', titleKey: 'menu.systemLog', icon: 'Notebook' }
      },
      {
        path: 'config',
        name: 'SystemConfig',
        component: () => import('@/views/system/config/index.vue'),
        meta: { title: '系统配置', titleKey: 'menu.systemConfig', icon: 'Tools' }
      },
      {
        path: 'orgSwitch',
        name: 'SystemOrgSwitch',
        component: () => import('@/views/system/orgSwitch/index.vue'),
        meta: { title: '多组织/多公司', titleKey: 'menu.systemOrgSwitch', icon: 'OfficeBuilding' }
      },
      {
        path: 'i18n',
        name: 'SystemI18n',
        component: () => import('@/views/system/i18n/index.vue'),
        meta: { title: '多语言 (i18n)', titleKey: 'menu.systemI18n', icon: 'ChatLineRound' }
      },
      {
        path: 'docNumber',
        name: 'SystemDocNumber',
        component: () => import('@/views/system/docNumber/index.vue'),
        meta: { title: '单据编号规则', titleKey: 'menu.systemDocNumber', icon: 'CollectionTag' }
      },
      {
        path: 'printTemplate',
        name: 'SystemPrintTemplate',
        component: () => import('@/views/system/printTemplate/index.vue'),
        meta: { title: '打印模板设计', titleKey: 'menu.systemPrintTemplate', icon: 'Printer' }
      },
      {
        path: 'workflowDesigner',
        name: 'SystemWorkflowDesigner',
        component: () => import('@/views/system/workflowDesigner/index.vue'),
        meta: { title: '工作流设计器', titleKey: 'menu.systemWorkflowDesigner', icon: 'Share' }
      },
      {
        path: 'dataImport',
        name: 'SystemDataImport',
        component: () => import('@/views/system/dataImport/index.vue'),
        meta: { title: '数据导入导出', titleKey: 'menu.systemDataImport', icon: 'Upload' }
      },
      {
        path: 'apiGateway',
        name: 'SystemApiGateway',
        component: () => import('@/views/system/apiGateway/index.vue'),
        meta: { title: 'API 网关', titleKey: 'menu.systemApiGateway', icon: 'Connection' }
      },
      {
        path: 'monitor',
        name: 'SystemMonitor',
        component: () => import('@/views/system/monitor/index.vue'),
        meta: { title: '系统监控', titleKey: 'menu.systemMonitor', icon: 'Monitor' }
      }
    ]
  },

  // ==================== 人力资源（HR） ====================
  {
    path: '/hr',
    component: Layout,
    redirect: '/hr/employee',
    meta: { title: '人力资源', titleKey: 'menu.hr', icon: 'Avatar' },
    children: [
      {
        path: 'employee',
        name: 'HrEmployee',
        component: () => import('@/views/hr/employee/index.vue'),
        meta: { title: '员工档案', titleKey: 'menu.hrEmployee', icon: 'UserFilled' }
      },
      {
        path: 'organization',
        name: 'HrOrganization',
        component: () => import('@/views/hr/organization/index.vue'),
        meta: { title: '组织架构', titleKey: 'menu.hrOrganization', icon: 'OfficeBuilding' }
      },
      {
        path: 'recruit/position',
        name: 'HrRecruitPosition',
        component: () => import('@/views/hr/recruit/position/index.vue'),
        meta: { title: '招聘职位', titleKey: 'menu.hrRecruitPosition', icon: 'TrophyBase' }
      },
      {
        path: 'recruit/resume',
        name: 'HrRecruitResume',
        component: () => import('@/views/hr/recruit/resume/index.vue'),
        meta: { title: '简历管理', titleKey: 'menu.hrRecruitResume', icon: 'Document' }
      },
      {
        path: 'recruit/interview',
        name: 'HrRecruitInterview',
        component: () => import('@/views/hr/recruit/interview/index.vue'),
        meta: { title: '面试管理', titleKey: 'menu.hrRecruitInterview', icon: 'ChatDotRound' }
      },
      {
        path: 'training/course',
        name: 'HrTrainingCourse',
        component: () => import('@/views/hr/training/course/index.vue'),
        meta: { title: '培训课程', titleKey: 'menu.hrTrainingCourse', icon: 'Reading' }
      },
      {
        path: 'training/plan',
        name: 'HrTrainingPlan',
        component: () => import('@/views/hr/training/plan/index.vue'),
        meta: { title: '培训计划', titleKey: 'menu.hrTrainingPlan', icon: 'Calendar' }
      },
      {
        path: 'training/record',
        name: 'HrTrainingRecord',
        component: () => import('@/views/hr/training/record/index.vue'),
        meta: { title: '培训记录', titleKey: 'menu.hrTrainingRecord', icon: 'List' }
      },
      {
        path: 'attendance/clock',
        name: 'HrAttendanceClock',
        component: () => import('@/views/hr/attendance/clock/index.vue'),
        meta: { title: '打卡记录', titleKey: 'menu.hrAttendanceClock', icon: 'AlarmClock' }
      },
      {
        path: 'attendance/schedule',
        name: 'HrAttendanceSchedule',
        component: () => import('@/views/hr/attendance/schedule/index.vue'),
        meta: { title: '排班管理', titleKey: 'menu.hrAttendanceSchedule', icon: 'Timer' }
      },
      {
        path: 'attendance/statistics',
        name: 'HrAttendanceStatistics',
        component: () => import('@/views/hr/attendance/statistics/index.vue'),
        meta: { title: '考勤统计', titleKey: 'menu.hrAttendanceStatistics', icon: 'DataAnalysis' }
      },
      {
        path: 'performance/kpi',
        name: 'HrPerformanceKpi',
        component: () => import('@/views/hr/performance/kpi/index.vue'),
        meta: { title: 'KPI设置', titleKey: 'menu.hrPerformanceKpi', icon: 'Aim' }
      },
      {
        path: 'performance/assessment',
        name: 'HrPerformanceAssessment',
        component: () => import('@/views/hr/performance/assessment/index.vue'),
        meta: { title: '绩效考核', titleKey: 'menu.hrPerformanceAssessment', icon: 'TrendCharts' }
      },
      {
        path: 'performance/score',
        name: 'HrPerformanceScore',
        component: () => import('@/views/hr/performance/score/index.vue'),
        meta: { title: '评分管理', titleKey: 'menu.hrPerformanceScore', icon: 'Star' }
      },
      {
        path: 'salary/calculation',
        name: 'HrSalaryCalculation',
        component: () => import('@/views/hr/salary/calculation/index.vue'),
        meta: { title: '工资计算', titleKey: 'menu.hrSalaryCalculation', icon: 'Money' }
      },
      {
        path: 'salary/tax',
        name: 'HrSalaryTax',
        component: () => import('@/views/hr/salary/tax/index.vue'),
        meta: { title: '个税管理', titleKey: 'menu.hrSalaryTax', icon: 'Ticket' }
      },
      {
        path: 'insurance',
        name: 'HrInsurance',
        component: () => import('@/views/hr/insurance/index.vue'),
        meta: { title: '社保公积金', titleKey: 'menu.hrInsurance', icon: 'Shield' }
      }
    ]
  }
]

// 404 路由
export const notFoundRoute = {
  path: '/:pathMatch(.*)*',
  component: () => import('@/views/error/404.vue'),
  meta: { hidden: true }
}

const router = createRouter({
  history: createWebHistory(),
  routes: [...constantRoutes, ...asyncRoutes, notFoundRoute],
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) return savedPosition
    return { top: 0 }
  }
})

export default router
