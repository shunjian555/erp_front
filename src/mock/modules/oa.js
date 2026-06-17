/**
 * Mock 数据 - OA 办公自动化
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
  // 审批中心
  {
    url: '/api/oa/approval/list',
    method: 'get',
    response: () => genList({ total: 68, recordName: '审批单', fields: {
      approvalNo: `AP${Random.string('number', 8)}`, title: '{{title}}',
      type: ['采购审批','费用报销','请假申请','出差申请','合同审批'],
      applicant: genCName(),
      department: ['技术部','销售部','市场部','财务部','人事部'],
      status: [0, 1, 2], createTime: '{{date}}'
    }})
  },
  // 请假申请
  {
    url: '/api/oa/leave/list',
    method: 'get',
    response: () => genList({ total: 45, recordName: '请假单', fields: {
      leaveNo: `LV${Random.string('number', 8)}`, applicant: genCName(),
      leaveType: ['年假','事假','病假','婚假','产假'],
      startDate: Random.datetime('yyyy-MM-dd HH:mm'),
      endDate: Random.datetime('yyyy-MM-dd HH:mm'),
      days: Random.float(0.5, 15, 1, 1),
      reason: Random.cparagraph(1, 2), status: [0, 1, 2],
      createTime: '{{date}}'
    }})
  },
  // 报销申请
  {
    url: '/api/oa/expense/list',
    method: 'get',
    response: () => genList({ total: 78, recordName: '报销单', fields: {
      expenseNo: `EX${Random.string('number', 8)}`, applicant: genCName(),
      category: ['差旅费','办公费','招待费','交通费','通讯费'],
      amount: '{{amount}}', description: Random.cparagraph(1, 2),
      status: [0, 1, 2], createTime: '{{date}}'
    }})
  },
  // OA采购申请
  {
    url: '/api/oa/purchaseReq/list',
    method: 'get',
    response: () => genList({ total: 32, recordName: '采购申请', fields: {
      requestNo: `PR${Random.string('number', 8)}`, goodsName: '{{title}}',
      quantity: Random.integer(1, 100), budgetAmount: '{{amount}}',
      reason: Random.cparagraph(1, 2), applicant: genCName(),
      status: [0, 1, 2, 3], createTime: '{{date}}'
    }})
  },
  // 公告管理
  {
    url: '/api/oa/notice/list',
    method: 'get',
    response: () => genList({ total: 25, recordName: '公告', fields: {
      noticeTitle: '{{title}}', content: Random.cparagraph(2, 4),
      publisher: genCName(), type: ['通知','公告','新闻'],
      isTop: [0, 1], readCount: Random.integer(50, 500),
      createTime: '{{date}}'
    }})
  },
  // 消息中心
  {
    url: '/api/oa/message/list',
    method: 'get',
    response: () => genList({ total: 120, recordName: '消息', fields: {
      messageTitle: '{{title}}', content: Random.csentence(5, 20),
      sender: genCName(), type: ['系统通知','审批通知','任务提醒','消息'],
      isRead: [0, 1], createTime: '{{date}}'
    }})
  }
]
