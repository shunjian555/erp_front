import { createRouter, createWebHistory } from 'vue-router'
import Layout from '@/layout/index.vue'

/**
 * 静态路由（不需要权限）
 */
export const constantRoutes = [
  {
    path: '/login',
    component: () => import('@/views/login/index.vue'),
    meta: { title: '登录', hidden: true }
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
    meta: { title: '首页', icon: 'HomeFilled' },
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/dashboard/index.vue'),
        meta: { title: '工作台', icon: 'Odometer', affix: true, keepAlive: true }
      }
    ]
  },
  {
    path: '/profile',
    component: Layout,
    meta: { title: '个人中心', hidden: true },
    children: [
      {
        path: '',
        name: 'Profile',
        component: () => import('@/views/profile/index.vue'),
        meta: { title: '个人中心', icon: 'User' }
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
    meta: { title: 'CRM', icon: 'UserFilled', roles: ['admin', 'crm'] },
    children: [
      {
        path: 'customer',
        name: 'CrmCustomer',
        component: () => import('@/views/crm/customer/index.vue'),
        meta: { title: '客户管理', icon: 'User' }
      },
      {
        path: 'contact',
        name: 'CrmContact',
        component: () => import('@/views/crm/contact/index.vue'),
        meta: { title: '联系人管理', icon: 'Phone' }
      },
      {
        path: 'lead',
        name: 'CrmLead',
        component: () => import('@/views/crm/lead/index.vue'),
        meta: { title: '线索管理', icon: 'Connection' }
      },
      {
        path: 'opportunity',
        name: 'CrmOpportunity',
        component: () => import('@/views/crm/opportunity/index.vue'),
        meta: { title: '商机管理', icon: 'TrendCharts' }
      },
      {
        path: 'quote',
        name: 'CrmQuote',
        component: () => import('@/views/crm/quote/index.vue'),
        meta: { title: '报价管理', icon: 'Document' }
      },
      {
        path: 'contract',
        name: 'CrmContract',
        component: () => import('@/views/crm/contract/index.vue'),
        meta: { title: '合同管理', icon: 'Tickets' }
      },
      {
        path: 'follow',
        name: 'CrmFollow',
        component: () => import('@/views/crm/follow/index.vue'),
        meta: { title: '跟进记录', icon: 'ChatLineRound' }
      },
      {
        path: 'pool',
        name: 'CrmPool',
        component: () => import('@/views/crm/pool/index.vue'),
        meta: { title: '客户公海', icon: 'DataBoard' }
      },
      {
        path: 'receivable-plan',
        name: 'CrmReceivablePlan',
        component: () => import('@/views/crm/receivablePlan/index.vue'),
        meta: { title: '回款计划', icon: 'Coin' }
      }
    ]
  },

  // ==================== OA 办公自动化 ====================
  {
    path: '/oa',
    component: Layout,
    redirect: '/oa/approval',
    meta: { title: 'OA', icon: 'Notebook', roles: ['admin', 'oa'] },
    children: [
      {
        path: 'approval',
        name: 'OaApproval',
        component: () => import('@/views/oa/approval/index.vue'),
        meta: { title: '审批中心', icon: 'Checked' }
      },
      {
        path: 'leave',
        name: 'OaLeave',
        component: () => import('@/views/oa/leave/index.vue'),
        meta: { title: '请假申请', icon: 'Calendar' }
      },
      {
        path: 'expense',
        name: 'OaExpense',
        component: () => import('@/views/oa/expense/index.vue'),
        meta: { title: '报销申请', icon: 'Wallet' }
      },
      {
        path: 'purchase-req',
        name: 'OaPurchaseReq',
        component: () => import('@/views/oa/purchaseReq/index.vue'),
        meta: { title: '采购申请', icon: 'ShoppingCart' }
      },
      {
        path: 'notice',
        name: 'OaNotice',
        component: () => import('@/views/oa/notice/index.vue'),
        meta: { title: '公告管理', icon: 'Bell' }
      },
      {
        path: 'message',
        name: 'OaMessage',
        component: () => import('@/views/oa/message/index.vue'),
        meta: { title: '消息中心', icon: 'ChatDotRound' }
      },
      {
        path: 'attendance',
        name: 'OaAttendance',
        component: () => import('@/views/oa/attendance/index.vue'),
        meta: { title: '考勤管理', icon: 'AlarmClock' }
      },
      {
        path: 'schedule',
        name: 'OaSchedule',
        component: () => import('@/views/oa/schedule/index.vue'),
        meta: { title: '日程管理', icon: 'Calendar' }
      },
      {
        path: 'task',
        name: 'OaTask',
        component: () => import('@/views/oa/task/index.vue'),
        meta: { title: '任务管理', icon: 'List' }
      },
      {
        path: 'business-trip',
        name: 'OaBusinessTrip',
        component: () => import('@/views/oa/businessTrip/index.vue'),
        meta: { title: '出差申请', icon: 'Promotion' }
      },
      {
        path: 'car',
        name: 'OaCar',
        component: () => import('@/views/oa/car/index.vue'),
        meta: { title: '用车申请', icon: 'Van' }
      },
      {
        path: 'meeting',
        name: 'OaMeeting',
        component: () => import('@/views/oa/meeting/index.vue'),
        meta: { title: '会议管理', icon: 'VideoCamera' }
      }
    ]
  },

  // ==================== 商品中心 ====================
  {
    path: '/product',
    component: Layout,
    redirect: '/product/goods',
    meta: { title: '商品中心', icon: 'Goods', roles: ['admin', 'product'] },
    children: [
      {
        path: 'goods',
        name: 'ProductGoods',
        component: () => import('@/views/product/goods/index.vue'),
        meta: { title: '商品管理', icon: 'Box' }
      },
      {
        path: 'category',
        name: 'ProductCategory',
        component: () => import('@/views/product/category/index.vue'),
        meta: { title: '商品分类', icon: 'Menu' }
      },
      {
        path: 'brand',
        name: 'ProductBrand',
        component: () => import('@/views/product/brand/index.vue'),
        meta: { title: '品牌管理', icon: 'Medal' }
      },
      {
        path: 'unit',
        name: 'ProductUnit',
        component: () => import('@/views/product/unit/index.vue'),
        meta: { title: '单位管理', icon: 'DataAnalysis' }
      }
    ]
  },

  // ==================== 采购管理 ====================
  {
    path: '/purchase',
    component: Layout,
    redirect: '/purchase/request',
    meta: { title: '采购管理', icon: 'ShoppingCartFull', roles: ['admin', 'purchase'] },
    children: [
      {
        path: 'request',
        name: 'PurchaseRequest',
        component: () => import('@/views/purchase/request/index.vue'),
        meta: { title: '采购申请', icon: 'DocumentAdd' }
      },
      {
        path: 'order',
        name: 'PurchaseOrder',
        component: () => import('@/views/purchase/order/index.vue'),
        meta: { title: '采购订单', icon: 'List' }
      },
      {
        path: 'inbound',
        name: 'PurchaseInbound',
        component: () => import('@/views/purchase/inbound/index.vue'),
        meta: { title: '采购入库', icon: 'Box' }
      },
      {
        path: 'return',
        name: 'PurchaseReturn',
        component: () => import('@/views/purchase/return/index.vue'),
        meta: { title: '采购退货', icon: 'RefreshLeft' }
      },
      {
        path: 'supplier',
        name: 'SupplierManage',
        component: () => import('@/views/purchase/supplier/index.vue'),
        meta: { title: '供应商管理', icon: 'OfficeBuilding' }
      }
    ]
  },

  // ==================== 销售管理 ====================
  {
    path: '/sales',
    component: Layout,
    redirect: '/sales/order',
    meta: { title: '销售管理', icon: 'ShoppingBag', roles: ['admin', 'sales'] },
    children: [
      {
        path: 'order',
        name: 'SalesOrder',
        component: () => import('@/views/sales/order/index.vue'),
        meta: { title: '销售订单', icon: 'List' }
      },
      {
        path: 'outbound',
        name: 'SalesOutbound',
        component: () => import('@/views/sales/outbound/index.vue'),
        meta: { title: '销售出库', icon: 'Box' }
      },
      {
        path: 'return',
        name: 'SalesReturn',
        component: () => import('@/views/sales/return/index.vue'),
        meta: { title: '销售退货', icon: 'RefreshRight' }
      },
      {
        path: 'customer',
        name: 'SalesCustomer',
        component: () => import('@/views/sales/customer/index.vue'),
        meta: { title: '客户管理', icon: 'User' }
      }
    ]
  },

  // ==================== 库存管理 ====================
  {
    path: '/inventory',
    component: Layout,
    redirect: '/inventory/query',
    meta: { title: '库存管理', icon: 'House', roles: ['admin', 'inventory'] },
    children: [
      {
        path: 'query',
        name: 'InventoryQuery',
        component: () => import('@/views/inventory/query/index.vue'),
        meta: { title: '库存查询', icon: 'Search' }
      },
      {
        path: 'flow',
        name: 'InventoryFlow',
        component: () => import('@/views/inventory/flow/index.vue'),
        meta: { title: '库存流水', icon: 'Clock' }
      },
      {
        path: 'warning',
        name: 'InventoryWarning',
        component: () => import('@/views/inventory/warning/index.vue'),
        meta: { title: '库存预警', icon: 'Warning' }
      },
      {
        path: 'stocktake',
        name: 'InventoryStocktake',
        component: () => import('@/views/inventory/stocktake/index.vue'),
        meta: { title: '库存盘点', icon: 'DocumentChecked' }
      },
      {
        path: 'adjust',
        name: 'InventoryAdjust',
        component: () => import('@/views/inventory/adjust/index.vue'),
        meta: { title: '库存调整', icon: 'EditPen' }
      }
    ]
  },

  // ==================== WMS 仓储管理 ====================
  {
    path: '/wms',
    component: Layout,
    redirect: '/wms/warehouse',
    meta: { title: 'WMS', icon: 'OfficeBuilding', roles: ['admin', 'wms'] },
    children: [
      {
        path: 'warehouse',
        name: 'WmsWarehouse',
        component: () => import('@/views/wms/warehouse/index.vue'),
        meta: { title: '仓库管理', icon: 'HomeFilled' }
      },
      {
        path: 'area',
        name: 'WmsArea',
        component: () => import('@/views/wms/area/index.vue'),
        meta: { title: '库区管理', icon: 'Grid' }
      },
      {
        path: 'location',
        name: 'WmsLocation',
        component: () => import('@/views/wms/location/index.vue'),
        meta: { title: '库位管理', icon: 'MapLocation' }
      },
      {
        path: 'transfer',
        name: 'WmsTransfer',
        component: () => import('@/views/wms/transfer/index.vue'),
        meta: { title: '调拨管理', icon: 'Switch' }
      },
      {
        path: 'batch',
        name: 'WmsBatch',
        component: () => import('@/views/wms/batch/index.vue'),
        meta: { title: '批次管理', icon: 'CollectionTag' }
      },
      {
        path: 'barcode',
        name: 'WmsBarcode',
        component: () => import('@/views/wms/barcode/index.vue'),
        meta: { title: '条码管理', icon: 'Grid' }
      }
    ]
  },

  // ==================== 生产管理 (PLM/MES) ====================
  {
    path: '/production',
    component: Layout,
    redirect: '/production/bom',
    meta: { title: '生产管理', icon: 'Cpu', roles: ['admin', 'production'] },
    children: [
      {
        path: 'bom',
        name: 'ProductionBom',
        component: () => import('@/views/production/bom/index.vue'),
        meta: { title: 'BOM管理', icon: 'Document' }
      },
      {
        path: 'process',
        name: 'ProductionProcess',
        component: () => import('@/views/production/process/index.vue'),
        meta: { title: '工艺路线', icon: 'Share' }
      },
      {
        path: 'capacity',
        name: 'ProductionCapacity',
        component: () => import('@/views/production/capacity/index.vue'),
        meta: { title: '产能数据', icon: 'DataLine' }
      },
      {
        path: 'mps',
        name: 'ProductionMps',
        component: () => import('@/views/production/mps/index.vue'),
        meta: { title: '主生产计划', icon: 'Calendar' }
      },
      {
        path: 'mrp',
        name: 'ProductionMrp',
        component: () => import('@/views/production/mrp/index.vue'),
        meta: { title: '物料需求计划', icon: 'Tickets' }
      },
      {
        path: 'order',
        name: 'ProductionOrder',
        component: () => import('@/views/production/order/index.vue'),
        meta: { title: '生产订单', icon: 'List' }
      },
      {
        path: 'operation',
        name: 'ProductionOperation',
        component: () => import('@/views/production/operation/index.vue'),
        meta: { title: '工序管理', icon: 'Operation' }
      },
      {
        path: 'workshop',
        name: 'ProductionWorkshop',
        component: () => import('@/views/production/workshop/index.vue'),
        meta: { title: '车间管理', icon: 'OfficeBuilding' }
      },
      {
        path: 'outsourcing',
        name: 'ProductionOutsourcing',
        component: () => import('@/views/production/outsourcing/index.vue'),
        meta: { title: '委外加工', icon: 'Connection' }
      },
      {
        path: 'equipment',
        name: 'ProductionEquipment',
        component: () => import('@/views/production/equipment/index.vue'),
        meta: { title: '设备管理', icon: 'Tools' }
      }
    ]
  },

  // ==================== 财务管理 ====================
  {
    path: '/finance',
    component: Layout,
    redirect: '/finance/subject',
    meta: { title: '财务管理', icon: 'Money', roles: ['admin', 'finance'] },
    children: [
      {
        path: 'subject',
        name: 'FinanceSubject',
        component: () => import('@/views/finance/subject/index.vue'),
        meta: { title: '会计科目', icon: 'Collection' }
      },
      {
        path: 'voucher',
        name: 'FinanceVoucher',
        component: () => import('@/views/finance/voucher/index.vue'),
        meta: { title: '凭证管理', icon: 'Document' }
      },
      {
        path: 'ledger',
        name: 'FinanceLedger',
        component: () => import('@/views/finance/ledger/index.vue'),
        meta: { title: '总账查询', icon: 'Notebook' }
      },
      {
        path: 'voucherTemplate',
        name: 'FinanceVoucherTemplate',
        component: () => import('@/views/finance/voucherTemplate/index.vue'),
        meta: { title: '凭证模板', icon: 'MagicStick' }
      },
      {
        path: 'trialBalance',
        name: 'FinanceTrialBalance',
        component: () => import('@/views/finance/trialBalance/index.vue'),
        meta: { title: '试算平衡', icon: 'DataLine' }
      },
      {
        path: 'report',
        name: 'FinanceReport',
        component: () => import('@/views/finance/report/index.vue'),
        meta: { title: '财务报表', icon: 'DataAnalysis' }
      },
      {
        path: 'period',
        name: 'FinancePeriod',
        component: () => import('@/views/finance/period/index.vue'),
        meta: { title: '期末结账', icon: 'Calendar' }
      },
      {
        path: 'receivable',
        name: 'FinanceReceivable',
        component: () => import('@/views/finance/receivable/index.vue'),
        meta: { title: '应收管理', icon: 'ArrowDown' }
      },
      {
        path: 'payable',
        name: 'FinancePayable',
        component: () => import('@/views/finance/payable/index.vue'),
        meta: { title: '应付管理', icon: 'ArrowUp' }
      },
      {
        path: 'receipt',
        name: 'FinanceReceipt',
        component: () => import('@/views/finance/receipt/index.vue'),
        meta: { title: '收款单', icon: 'CreditCard' }
      },
      {
        path: 'payment',
        name: 'FinancePayment',
        component: () => import('@/views/finance/payment/index.vue'),
        meta: { title: '付款单', icon: 'CreditCard' }
      },
      {
        path: 'expense',
        name: 'FinanceExpense',
        component: () => import('@/views/finance/expense/index.vue'),
        meta: { title: '费用管理', icon: 'Wallet' }
      },
      {
        path: 'invoice',
        name: 'FinanceInvoice',
        component: () => import('@/views/finance/invoice/index.vue'),
        meta: { title: '发票管理', icon: 'Ticket' }
      },
      {
        path: 'businessIntegration',
        name: 'FinanceBusinessIntegration',
        component: () => import('@/views/finance/businessIntegration/index.vue'),
        meta: { title: '业务-财务集成', icon: 'Connection' }
      },
      {
        path: 'receivableAging',
        name: 'FinanceReceivableAging',
        component: () => import('@/views/finance/receivableAging/index.vue'),
        meta: { title: '应收账龄分析', icon: 'TrendCharts' }
      },
      {
        path: 'payableAging',
        name: 'FinancePayableAging',
        component: () => import('@/views/finance/payableAging/index.vue'),
        meta: { title: '应付账龄分析', icon: 'TrendCharts' }
      },
      {
        path: 'bankAccount',
        name: 'FinanceBankAccount',
        component: () => import('@/views/finance/bankAccount/index.vue'),
        meta: { title: '银行账户与资金', icon: 'CreditCard' }
      },
      {
        path: 'bankReconcile',
        name: 'FinanceBankReconcile',
        component: () => import('@/views/finance/bankReconcile/index.vue'),
        meta: { title: '银行对账', icon: 'Document' }
      }
    ]
  },

  // ==================== BI报表 ====================
  {
    path: '/bi',
    component: Layout,
    redirect: '/bi/sales-analysis',
    meta: { title: 'BI报表', icon: 'DataAnalysis', roles: ['admin', 'bi'] },
    children: [
      {
        path: 'sales-analysis',
        name: 'BiSalesAnalysis',
        component: () => import('@/views/bi/salesAnalysis/index.vue'),
        meta: { title: '销售分析', icon: 'TrendCharts' }
      },
      {
        path: 'purchase-analysis',
        name: 'BiPurchaseAnalysis',
        component: () => import('@/views/bi/purchaseAnalysis/index.vue'),
        meta: { title: '采购分析', icon: 'ShoppingCart' }
      },
      {
        path: 'inventory-analysis',
        name: 'BiInventoryAnalysis',
        component: () => import('@/views/bi/inventoryAnalysis/index.vue'),
        meta: { title: '库存分析', icon: 'Box' }
      },
      {
        path: 'profit-analysis',
        name: 'BiProfitAnalysis',
        component: () => import('@/views/bi/profitAnalysis/index.vue'),
        meta: { title: '利润分析', icon: 'Money' }
      }
    ]
  },

  // ==================== 系统管理 ====================
  {
    path: '/system',
    component: Layout,
    redirect: '/system/user',
    meta: { title: '系统管理', icon: 'Setting', roles: ['admin'] },
    children: [
      {
        path: 'user',
        name: 'SystemUser',
        component: () => import('@/views/system/user/index.vue'),
        meta: { title: '用户管理', icon: 'UserFilled' }
      },
      {
        path: 'role',
        name: 'SystemRole',
        component: () => import('@/views/system/role/index.vue'),
        meta: { title: '角色管理', icon: 'User' }
      },
      {
        path: 'menu',
        name: 'SystemMenu',
        component: () => import('@/views/system/menu/index.vue'),
        meta: { title: '菜单管理', icon: 'Menu' }
      },
      {
        path: 'dept',
        name: 'SystemDept',
        component: () => import('@/views/system/dept/index.vue'),
        meta: { title: '部门管理', icon: 'OfficeBuilding' }
      },
      {
        path: 'dict',
        name: 'SystemDict',
        component: () => import('@/views/system/dict/index.vue'),
        meta: { title: '字典管理', icon: 'Document' }
      },
      {
        path: 'log',
        name: 'SystemLog',
        component: () => import('@/views/system/log/index.vue'),
        meta: { title: '操作日志', icon: 'Notebook' }
      },
      {
        path: 'config',
        name: 'SystemConfig',
        component: () => import('@/views/system/config/index.vue'),
        meta: { title: '系统配置', icon: 'Tools' }
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
