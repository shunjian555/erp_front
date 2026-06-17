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
  }
]
