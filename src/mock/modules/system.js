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
      const menuTree = [
        { path: '/dashboard', title: '工作台', icon: 'Odometer', affix: true },
        { path: '/crm', title: 'CRM', icon: 'UserFilled', children: [
          { path: '/crm/customer', title: '客户管理', icon: 'User' },
          { path: '/crm/contact', title: '联系人管理', icon: 'Phone' },
          { path: '/crm/lead', title: '线索管理', icon: 'Connection' },
          { path: '/crm/opportunity', title: '商机管理', icon: 'TrendCharts' },
          { path: '/crm/quote', title: '报价管理', icon: 'Document' },
          { path: '/crm/contract', title: '合同管理', icon: 'Tickets' },
          { path: '/crm/follow', title: '跟进记录', icon: 'ChatLineRound' },
          { path: '/crm/pool', title: '客户公海', icon: 'DataBoard' },
          { path: '/crm/receivable-plan', title: '回款计划', icon: 'Coin' }
        ]},
        { path: '/oa', title: 'OA', icon: 'Notebook', children: [
          { path: '/oa/approval', title: '审批中心', icon: 'Checked' },
          { path: '/oa/leave', title: '请假申请', icon: 'Calendar' },
          { path: '/oa/expense', title: '报销申请', icon: 'Wallet' },
          { path: '/oa/purchase-req', title: '采购申请', icon: 'ShoppingCart' },
          { path: '/oa/notice', title: '公告管理', icon: 'Bell' },
          { path: '/oa/message', title: '消息中心', icon: 'ChatDotRound' },
          { path: '/oa/attendance', title: '考勤管理', icon: 'AlarmClock' },
          { path: '/oa/schedule', title: '日程管理', icon: 'Calendar' },
          { path: '/oa/task', title: '任务管理', icon: 'List' },
          { path: '/oa/business-trip', title: '出差申请', icon: 'Promotion' },
          { path: '/oa/car', title: '用车申请', icon: 'Van' },
          { path: '/oa/meeting', title: '会议管理', icon: 'VideoCamera' }
        ]},
        { path: '/product', title: '商品中心', icon: 'Goods', children: [
          { path: '/product/goods', title: '商品管理', icon: 'Box' },
          { path: '/product/category', title: '商品分类', icon: 'Menu' },
          { path: '/product/brand', title: '品牌管理', icon: 'Medal' },
          { path: '/product/unit', title: '单位管理', icon: 'DataAnalysis' }
        ]},
        { path: '/purchase', title: '采购管理', icon: 'ShoppingCartFull', children: [
          { path: '/purchase/request', title: '采购申请', icon: 'DocumentAdd' },
          { path: '/purchase/order', title: '采购订单', icon: 'List' },
          { path: '/purchase/inbound', title: '采购入库', icon: 'Box' },
          { path: '/purchase/return', title: '采购退货', icon: 'RefreshLeft' },
          { path: '/purchase/supplier', title: '供应商管理', icon: 'OfficeBuilding' }
        ]},
        { path: '/sales', title: '销售管理', icon: 'ShoppingBag', children: [
          { path: '/sales/order', title: '销售订单', icon: 'List' },
          { path: '/sales/outbound', title: '销售出库', icon: 'Box' },
          { path: '/sales/return', title: '销售退货', icon: 'RefreshRight' },
          { path: '/sales/customer', title: '客户管理', icon: 'User' }
        ]},
        { path: '/inventory', title: '库存管理', icon: 'House', children: [
          { path: '/inventory/query', title: '库存查询', icon: 'Search' },
          { path: '/inventory/flow', title: '库存流水', icon: 'Clock' },
          { path: '/inventory/warning', title: '库存预警', icon: 'Warning' },
          { path: '/inventory/stocktake', title: '库存盘点', icon: 'DocumentChecked' },
          { path: '/inventory/adjust', title: '库存调整', icon: 'EditPen' }
        ]},
        { path: '/wms', title: 'WMS', icon: 'OfficeBuilding', children: [
          { path: '/wms/warehouse', title: '仓库管理', icon: 'HomeFilled' },
          { path: '/wms/area', title: '库区管理', icon: 'Grid' },
          { path: '/wms/location', title: '库位管理', icon: 'MapLocation' },
          { path: '/wms/transfer', title: '调拨管理', icon: 'Switch' },
          { path: '/wms/batch', title: '批次管理', icon: 'CollectionTag' },
          { path: '/wms/barcode', title: '条码管理', icon: 'Grid' }
        ]},
        { path: '/production', title: '生产管理', icon: 'Cpu', children: [
          { path: '/production/bom', title: 'BOM管理', icon: 'Document' },
          { path: '/production/process', title: '工艺路线', icon: 'Share' },
          { path: '/production/capacity', title: '产能数据', icon: 'DataLine' },
          { path: '/production/mps', title: '主生产计划', icon: 'Calendar' },
          { path: '/production/mrp', title: '物料需求计划', icon: 'Tickets' },
          { path: '/production/order', title: '生产订单', icon: 'List' },
          { path: '/production/operation', title: '工序管理', icon: 'Operation' },
          { path: '/production/workshop', title: '车间管理', icon: 'OfficeBuilding' },
          { path: '/production/outsourcing', title: '委外加工', icon: 'Connection' },
          { path: '/production/equipment', title: '设备管理', icon: 'Tools' }
        ]},
        { path: '/finance', title: '财务管理', icon: 'Money', children: [
          { path: '/finance/subject', title: '会计科目', icon: 'Collection' },
          { path: '/finance/voucher', title: '凭证管理', icon: 'Document' },
          { path: '/finance/voucherTemplate', title: '凭证模板', icon: 'MagicStick' },
          { path: '/finance/ledger', title: '总账查询', icon: 'Notebook' },
          { path: '/finance/trialBalance', title: '试算平衡', icon: 'DataLine' },
          { path: '/finance/report', title: '财务报表', icon: 'DataAnalysis' },
          { path: '/finance/period', title: '期末结账', icon: 'Calendar' },
          { path: '/finance/receivable', title: '应收管理', icon: 'ArrowDown' },
          { path: '/finance/payable', title: '应付管理', icon: 'ArrowUp' },
          { path: '/finance/receipt', title: '收款单', icon: 'CreditCard' },
          { path: '/finance/payment', title: '付款单', icon: 'CreditCard' },
          { path: '/finance/expense', title: '费用管理', icon: 'Wallet' },
          { path: '/finance/invoice', title: '发票管理', icon: 'Ticket' },
          { path: '/finance/businessIntegration', title: '业务-财务集成', icon: 'Connection' },
          { path: '/finance/receivableAging', title: '应收账龄分析', icon: 'TrendCharts' },
          { path: '/finance/payableAging', title: '应付账龄分析', icon: 'TrendCharts' },
          { path: '/finance/bankAccount', title: '银行账户与资金', icon: 'CreditCard' },
          { path: '/finance/bankReconcile', title: '银行对账', icon: 'Document' }
        ]},
        { path: '/bi', title: 'BI报表', icon: 'DataAnalysis', children: [
          { path: '/bi/sales-analysis', title: '销售分析', icon: 'TrendCharts' },
          { path: '/bi/purchase-analysis', title: '采购分析', icon: 'ShoppingCart' },
          { path: '/bi/inventory-analysis', title: '库存分析', icon: 'Box' },
          { path: '/bi/profit-analysis', title: '利润分析', icon: 'Money' }
        ]},
        { path: '/system', title: '系统管理', icon: 'Setting', children: [
          { path: '/system/user', title: '用户管理', icon: 'UserFilled' },
          { path: '/system/role', title: '角色管理', icon: 'User' },
          { path: '/system/menu', title: '菜单管理', icon: 'Menu' },
          { path: '/system/dept', title: '部门管理', icon: 'OfficeBuilding' },
          { path: '/system/dict', title: '字典管理', icon: 'Document' },
          { path: '/system/log', title: '操作日志', icon: 'Notebook' },
          { path: '/system/config', title: '系统配置', icon: 'Tools' }
        ]}
      ]
      return { code: 200, data: menuTree }
    }
  }
]
