/**
 * Mock 数据 - 人力资源（HR）
 */
import Mock from 'mockjs'
const Random = Mock.Random

const surnames = ['张', '王', '李', '赵', '刘', '陈', '杨', '黄', '周', '吴']
const maleNames = ['伟', '强', '磊', '军', '勇', '杰', '涛', '明', '超', '华']
const femaleNames = ['芳', '娜', '敏', '静', '丽', '娟', '艳', '霞', '燕', '玲']
function genCName() {
  const surname = surnames[Random.integer(0, surnames.length - 1)]
  const names = Math.random() > 0.4 ? maleNames : femaleNames
  return surname + names[Random.integer(0, names.length - 1)] + (Math.random() > 0.5 ? names[Random.integer(0, names.length - 1)] : '')
}

function genDeptList() {
  return ['技术部', '销售部', '财务部', '行政部', '采购部', '仓储部', '生产部', '人力资源部', '市场部', '客服部']
}

function genDateStr(daysAgo) {
  const d = new Date()
  d.setDate(d.getDate() - daysAgo)
  return d.toISOString().split('T')[0]
}

/**
 * 生成 mock 列表数据
 * - 默认每页 30 条，支持通过 pageSize 控制
 * - 支持按 params.keyword 进行模糊匹配
 * - 支持按 params.{field} 精确匹配
 * - 返回 { list, total, statistics }
 */
function genList(opts, config) {
  const { total = 50, fields, statistics } = opts
  const params = (config && (config.params || config.query)) || opts.params || opts.query || {}
  // 兼容 page/pageNum, pageSize/limit
  const page = Number(params.page ?? params.pageNum ?? 1) || 1
  const pageSize = Number(params.pageSize ?? params.limit ?? 30) || 30
  const keyword = params.keyword || ''
  const filters = { ...params }
  delete filters.page
  delete filters.pageNum
  delete filters.pageSize
  delete filters.limit
  delete filters.keyword
  const ps = Math.max(1, Math.min(pageSize, 200))
  const totalCount = Math.max(total, ps)
  const fullList = Array.from({ length: totalCount }, (_, i) => {
    const item = { id: i + 1 }
    Object.entries(fields).forEach(([k, v]) => {
      if (typeof v === 'function') item[k] = v(i)
      else if (v === '{{date}}') item[k] = Random.datetime('yyyy-MM-dd HH:mm:ss')
      else if (v === '{{date-only}}') item[k] = genDateStr(Random.integer(0, 30))
      else if (Array.isArray(v)) item[k] = v[Random.integer(0, v.length - 1)]
      else item[k] = v
    })
    return item
  })
  // 关键字过滤
  let filtered = fullList
  if (keyword) {
    const kw = String(keyword).toLowerCase()
    filtered = fullList.filter((it) => {
      return Object.values(it).some((v) => String(v).toLowerCase().includes(kw))
    })
  }
  // 自定义过滤
  Object.keys(filters).forEach((fk) => {
    if (filters[fk] === '' || filters[fk] === undefined || filters[fk] === null) return
    filtered = filtered.filter((it) => String(it[fk]) === String(filters[fk]))
  })
  const list = filtered.slice((page - 1) * ps, page * ps)
  return { code: 200, data: { list, total: filtered.length, statistics } }
}

/**
 * 创建一个接收 mockConfig 的列表响应函数
 */
function listResponse(opts) {
  return (config) => genList(opts, config)
}

// ==================== 员工档案 ====================
export default [
  // 员工档案列表
  {
    url: '/api/hr/employee/list',
    method: 'get',
    response: listResponse({
      total: 86,
      fields: {
        empNo: (i) => `EMP${String(i + 1001).padStart(5, '0')}`,
        name: genCName,
        gender: ['男', '女'],
        deptName: ['技术部', '销售部', '财务部', '行政部', '采购部', '仓储部', '生产部', '人力资源部'],
        position: ['工程师', '经理', '专员', '主管', '总监', '助理', '总监'],
        phone: (i) => `1${['3','5','7','8','9'][Random.integer(0,4)]}${Random.string('number', 9)}`,
        email: (i) => `emp${i + 1001}@company.com`,
        idCard: (i) => `${['110','310','440','320','330'][Random.integer(0,4)]}${Random.string('number', 16)}`,
        entryDate: '{{date}}',
        status: ['在职', '试用期', '离职', '退休'],
        education: ['本科', '硕士', '博士', '大专', '高中']
      }
    })
  },
  // 员工详情
  {
    url: /\/api\/hr\/employee\/detail\//,
    method: 'get',
    response: () => ({ code: 200, data: {
      id: 1, empNo: 'EMP01001', name: genCName(), gender: '男', birthDate: '1990-05-15',
      idCard: '110101199005151234', phone: '13800138001', email: 'zhangwei@company.com',
      deptName: '技术部', position: '高级工程师', entryDate: '2020-03-15',
      status: '在职', education: '本科', school: '北京大学', major: '计算机科学',
      address: '北京市朝阳区建国路88号', emergencyContact: '张三', emergencyPhone: '13900139001',
      bankName: '工商银行', bankAccount: '6222021234567890123', baseSalary: 15000,
      remark: ''
    }})
  },

  // ==================== 组织架构 ====================
  {
    url: '/api/hr/organization/tree',
    method: 'get',
    response: () => ({ code: 200, data: [
      { id: 1, name: '总公司', leader: '王总', employeeCount: 86, children: [
        { id: 2, name: '技术部', leader: '李明', employeeCount: 20, children: [
          { id: 21, name: '前端组', leader: '赵强', employeeCount: 8 },
          { id: 22, name: '后端组', leader: '刘杰', employeeCount: 10 },
          { id: 23, name: '测试组', leader: '陈芳', employeeCount: 2 }
        ]},
        { id: 3, name: '销售部', leader: '张伟', employeeCount: 18 },
        { id: 4, name: '财务部', leader: '周敏', employeeCount: 6 },
        { id: 5, name: '行政部', leader: '吴静', employeeCount: 5 },
        { id: 6, name: '人力资源部', leader: '郑娜', employeeCount: 8 },
        { id: 7, name: '采购部', leader: '孙磊', employeeCount: 7 },
        { id: 8, name: '仓储部', leader: '钱军', employeeCount: 10 },
        { id: 9, name: '生产部', leader: '冯勇', employeeCount: 12 }
      ]}
    ]})
  },

  // ==================== 招聘职位 ====================
  {
    url: '/api/hr/recruit/position/list',
    method: 'get',
    response: listResponse({
      total: 25,
      fields: {
        jobCode: (i) => `JOB${String(i + 1001).padStart(4, '0')}`,
        title: ['前端开发工程师', '后端开发工程师', '产品经理', 'UI设计师', '销售经理', '会计', '人事专员', '仓库管理员', '质检员', '生产主管'][Random.integer(0, 9)],
        deptName: ['技术部', '销售部', '财务部', '人力资源部', '仓储部', '生产部'],
        recruitCount: [1, 2, 3, 5],
        hiredCount: (i) => Random.integer(0, 3),
        salaryMin: (i) => [8000, 10000, 12000, 15000, 20000, 25000][Random.integer(0, 5)],
        salaryMax: (i) => [12000, 15000, 18000, 25000, 35000, 50000][Random.integer(0, 5)],
        experience: ['不限', '1-3年', '3-5年', '5年以上'],
        education: ['本科', '硕士', '大专'],
        status: ['招聘中', '已暂停', '已关闭'],
        publisher: genCName,
        publishDate: '{{date}}'
      }
    })
  },

  // ==================== 简历管理 ====================
  {
    url: '/api/hr/recruit/resume/list',
    method: 'get',
    response: listResponse({
      total: 60,
      fields: {
        name: genCName,
        gender: ['男', '女'],
        age: (i) => Random.integer(22, 45),
        phone: (i) => `1${['3','5','7','8','9'][Random.integer(0,4)]}${Random.string('number', 9)}`,
        email: (i) => `resume${i + 1}@mail.com`,
        applyPosition: ['前端开发工程师', '后端开发工程师', '产品经理', 'UI设计师', '销售经理', '会计'],
        education: ['本科', '硕士', '博士', '大专'],
        school: ['清华大学', '北京大学', '浙江大学', '复旦大学', '上海交通大学', '中山大学'],
        experience: (i) => `${Random.integer(1, 15)}年`,
        currentCompany: ['阿里巴巴', '腾讯', '字节跳动', '美团', '京东', '百度', '网易', '滴滴'],
        currentSalary: (i) => `${Random.integer(10, 60)}K`,
        source: ['招聘网站', '内部推荐', '猎头', '校园招聘', '人才市场'],
        status: ['待筛选', '初试通过', '复试通过', '已发offer', '已拒绝', '已入职'],
        submitTime: '{{date}}'
      }
    })
  },

  // ==================== 面试管理 ====================
  {
    url: /\/api\/hr\/recruit\/interview\/list/,
    method: 'get',
    response: listResponse({
      total: 40,
      fields: {
        candidateName: genCName,
        applyPosition: ['前端开发工程师', '后端开发工程师', '产品经理', '销售经理', '会计'],
        interviewRound: ['初试', '复试', '终试', 'HR面'],
        interviewer: genCName,
        interviewDate: '{{date}}',
        status: ['待面试', '面试中', '通过', '未通过', '已取消'],
        score: (i) => (Random.float(50, 100, 0, 0)),
        evaluation: ['综合能力优秀，建议录用', '技术能力一般，需进一步考察', '沟通能力强，团队协作好', '经验丰富，符合岗位要求', '专业基础薄弱，不建议录用']
      }
    })
  },

  // ==================== 培训课程 ====================
  {
    url: '/api/hr/training/course/list',
    method: 'get',
    response: listResponse({
      total: 30,
      fields: {
        courseCode: (i) => `TC${String(i + 1001).padStart(4, '0')}`,
        courseName: ['新员工入职培训', '企业文化培训', 'Excel高级应用', '项目管理实战', '沟通技巧提升', '领导力发展', '安全生产培训', '质量管理体系', '商务礼仪', '时间管理'][Random.integer(0, 9)],
        category: ['入职培训', '技能提升', '管理发展', '安全培训', '企业文化'],
        teacher: genCName,
        duration: (i) => `${Random.integer(1, 8)}小时`,
        maxParticipants: [20, 30, 50, 100],
        status: ['进行中', '未开始', '已结束'],
        createTime: '{{date}}'
      }
    })
  },

  // ==================== 培训计划 ====================
  {
    url: '/api/hr/training/plan/list',
    method: 'get',
    response: listResponse({
      total: 24,
      fields: {
        planName: (i) => `${['Q1','Q2','Q3','Q4'][Random.integer(0,3)]}季度培训计划-${Random.ctitle(4,8)}`,
        targetDept: ['技术部', '销售部', '全体员工', '管理层', '新员工'],
        courseNames: (i) => '新员工入职培训,企业文化建设',
        startDate: '{{date}}',
        endDate: '{{date}}',
        budget: (i) => Random.float(5000, 50000, 0, 0),
        actualCost: (i) => Random.float(3000, 40000, 0, 0),
        status: ['计划中', '执行中', '已完成', '已取消'],
        creator: genCName
      }
    })
  },

  // ==================== 培训记录 ====================
  {
    url: /\/api\/hr\/training\/record\/list/,
    method: 'get',
    response: listResponse({
      total: 120,
      fields: {
        employeeName: genCName,
        empNo: (i) => `EMP${String(Random.integer(1001, 1100)).padStart(5, '0')}`,
        deptName: ['技术部', '销售部', '财务部', '行政部', '生产部'],
        courseName: ['新员工入职培训', 'Excel高级应用', '项目管理实战', '沟通技巧提升', '安全生产培训'],
        trainDate: '{{date}}',
        duration: (i) => `${Random.integer(1, 8)}小时`,
        result: ['合格', '优秀', '不合格'],
        score: (i) => (Random.float(60, 100, 0, 0)),
        certificate: ['有', '无']
      }
    })
  },

  // ==================== 打卡记录 ====================
  {
    url: /\/api\/hr\/attendance\/clock\/list/,
    method: 'get',
    response: listResponse({
      total: 500,
      fields: {
        employeeName: genCName,
        empNo: (i) => `EMP${String(Random.integer(1001, 1100)).padStart(5, '0')}`,
        deptName: ['技术部', '销售部', '财务部', '行政部', '生产部', '仓储部'],
        date: (i) => {
          const d = new Date(); d.setDate(d.getDate() - Random.integer(0, 30))
          return d.toISOString().split('T')[0]
        },
        clockIn: (i) => `0${Random.integer(7, 9)}:${String(Random.integer(0, 59)).padStart(2,'0')}:${String(Random.integer(0, 59)).padStart(2,'0')}`,
        clockOut: (i) => `${Random.integer(17, 21)}:${String(Random.integer(0, 59)).padStart(2,'0')}:${String(Random.integer(0, 59)).padStart(2,'0')}`,
        status: ['正常', '迟到', '早退', '缺卡', '旷工', '请假'],
        workHours: (i) => `${(Random.float(4, 10, 1, 1))}`
      }
    })
  },

  // ==================== 排班管理 ====================
  {
    url: '/api/hr/attendance/schedule/list',
    method: 'get',
    response: listResponse({
      total: 35,
      fields: {
        scheduleName: (i) => `${['周一','周二','周三','周四','周五','周六','周日'][i % 7]}排班`,
        deptName: ['技术部', '销售部', '生产部', '仓储部', '客服部'],
        shiftType: ['白班', '夜班', '轮班', '弹性工作制'],
        startTime: ['08:30', '09:00', '20:00'],
        endTime: ['17:30', '18:00', '06:00'],
        breakTime: '12:00-13:00',
        effectiveDate: '{{date}}',
        status: ['生效中', '已过期', '草稿'],
        creator: genCName
      }
    })
  },

  // ==================== 考勤统计 ====================
  {
    url: /\/api\/hr\/attendance\/statistics\/list/,
    method: 'get',
    response: listResponse({
      total: 86,
      fields: {
        employeeName: genCName,
        empNo: (i) => `EMP${String(i + 1001).padStart(5, '0')}`,
        deptName: ['技术部', '销售部', '财务部', '行政部', '采购部', '仓储部', '生产部'],
        month: '2026-05',
        workDays: (i) => Random.integer(18, 23),
        actualDays: (i) => Random.integer(15, 23),
        lateCount: (i) => Random.integer(0, 5),
        earlyCount: (i) => Random.integer(0, 3),
        absentCount: (i) => Random.integer(0, 2),
        leaveDays: (i) => Random.integer(0, 5),
        overtimeHours: (i) => `${Random.float(0, 20, 1, 1)}`,
        attendanceRate: (i) => `${(Random.float(85, 100, 1, 1))}%`
      }
    })
  },

  // ==================== KPI设置 ====================
  {
    url: '/api/hr/performance/kpi/list',
    method: 'get',
    response: listResponse({
      total: 20,
      statistics: { totalKpi: 20, enabledKpi: 16, categories: 6, avgWeight: 18 },
      fields: {
        code: (i) => `KPI${String(i + 1001).padStart(5, '0')}`,
        name: ['销售额完成率', '客户满意度', '项目交付率', '代码质量评分', '出勤率', 'Bug修复及时率', '新增客户数', '培训完成率', '成本控制率', '团队协作评分', '创新能力', '服务响应时间'],
        kpiName: ['销售额完成率', '客户满意度', '项目交付率', '代码质量评分', '出勤率', 'Bug修复及时率', '新增客户数', '培训完成率'],
        category: ['销售类', '服务类', '项目类', '技术类', '考勤类', '学习类'],
        positionType: ['全员', '销售岗', '技术岗', '管理岗'],
        weight: (i) => Random.integer(5, 35),
        cycle: ['月度', '季度', '半年度', '年度'],
        targetType: ['数值型', '比率型', '评分型'],
        calcMethod: ['累计法', '区间法', '扣分法', '加分法'],
        unit: ['%', '分', '个', '次', '小时'],
        targetValue: (i) => Random.integer(80, 100),
        description: '考核指标详细描述',
        updateTime: '{{date}}',
        status: ['启用', '禁用']
      }
    })
  },

  // ==================== 绩效考核 ====================
  {
    url: '/api/hr/performance/assessment/list',
    method: 'get',
    response: listResponse({
      total: 45,
      statistics: { totalCount: 45, completed: 28, inProgress: 12, pending: 5 },
      fields: {
        code: (i) => `AS${String(i + 10001).padStart(6, '0')}`,
        name: (i) => `${['2026年Q1','2026年Q2','2026年度'][Random.integer(0,2)]}绩效考核`,
        assessmentName: (i) => `${['2026年Q1','2026年Q2','2026年度'][Random.integer(0,2)]}绩效考核`,
        type: ['月度考核', '季度考核', '半年度考核', '年度考核'],
        employeeName: genCName,
        deptName: ['技术部', '销售部', '财务部', '行政部', '生产部'],
        position: ['工程师', '经理', '专员', '主管'],
        totalScore: (i) => Random.integer(60, 100),
        selfScore: (i) => Random.integer(70, 100),
        leaderScore: (i) => Random.integer(65, 98),
        finalScore: (i) => Random.integer(60, 98),
        grade: ['S', 'A', 'B', 'C', 'D'],
        level: ['S', 'A', 'B', 'C', 'D'],
        period: ['2026-Q1', '2026-Q2', '2026-05', '2026年度'],
        progress: (i) => Random.integer(20, 100),
        createTime: '{{date}}',
        status: ['自评中', '上级评中', '已完成', '申诉中', '草稿', '已退回', '待评分', '待审批']
      }
    })
  },

  // ==================== 评分管理 ====================
  {
    url: '/api/hr/performance/score/list',
    method: 'get',
    response: listResponse({
      total: 80,
      statistics: { totalCount: 80, avgScore: 86, sRank: 6, aRank: 28 },
      fields: {
        employeeName: genCName,
        employeeNo: (i) => `EMP${String(i + 1001).padStart(5, '0')}`,
        deptName: ['技术部', '销售部', '财务部', '行政部', '生产部'],
        position: ['工程师', '经理', '专员', '主管', '总监'],
        grade: ['S', 'A', 'B', 'C', 'D'],
        totalScore: (i) => Random.integer(60, 100),
        type: ['月度考核', '季度考核', '半年度考核', '年度考核'],
        period: ['2026-Q1', '2026-Q2', '2026-05', '2026年度'],
        rank: (i) => Random.integer(1, 100),
        kpiItem: ['销售额完成率', '客户满意度', '项目交付率', '代码质量评分', '出勤率', '新增客户数', '培训完成率'],
        targetValue: (i) => Random.integer(80, 100),
        actualValue: (i) => Random.integer(60, 110),
        completionRate: (i) => `${(Random.float(60, 120, 1, 1))}%`,
        score: (i) => Random.integer(50, 120),
        weight: (i) => [10, 15, 20, 25, 30][Random.integer(0, 4)],
        scorer: genCName,
        scoreTime: '{{date}}'
      }
    })
  },

  // ==================== 工资计算 ====================
  {
    url: '/api/hr/salary/wage/list',
    method: 'get',
    response: listResponse({
      total: 86,
      statistics: { totalAmount: '¥1,865,240.00', avgSalary: '¥18,652.00', employeeCount: 86, taxTotal: '¥189,650.00' },
      fields: {
        employeeName: genCName,
        employeeNo: (i) => `EMP${String(i + 1001).padStart(5, '0')}`,
        empNo: (i) => `EMP${String(i + 1001).padStart(5, '0')}`,
        deptName: ['技术部', '销售部', '财务部', '行政部', '采购部', '仓储部', '生产部'],
        position: ['工程师', '经理', '专员', '主管', '总监', '助理'],
        baseSalary: (i) => Random.float(5000, 30000, 0, 0),
        performanceSalary: (i) => Random.float(1000, 10000, 0, 0),
        overtimePay: (i) => Random.float(0, 3000, 0, 0),
        bonus: (i) => Random.float(0, 5000, 0, 0),
        allowance: (i) => Random.float(500, 2000, 0, 0),
        grossSalary: (i) => Random.float(6000, 38000, 0, 0),
        socialInsurance: (i) => Random.float(1000, 3500, 0, 0),
        housingFund: (i) => Random.float(500, 2500, 0, 0),
        tax: (i) => Random.float(0, 4000, 0, 0),
        otherDeduct: (i) => Random.float(0, 500, 0, 0),
        netSalary: (i) => Random.float(4500, 32000, 0, 0),
        salaryMonth: '2026-05',
        payMonth: '2026-05',
        status: ['已发放', '待发放', '待核算', '待确认']
      }
    })
  },

  // ==================== 个税管理 ====================
  {
    url: '/api/hr/salary/tax/list',
    method: 'get',
    response: listResponse({
      total: 86,
      statistics: { totalTax: '¥189,650.00', avgTax: '¥2,205.23', taxpayers: 86, maxTaxRate: 30, taxableIncome: '¥1,865,240.00', declared: 62, pending: 18 },
      fields: {
        employeeName: genCName,
        employeeNo: (i) => `EMP${String(i + 1001).padStart(5, '0')}`,
        empNo: (i) => `EMP${String(i + 1001).padStart(5, '0')}`,
        deptName: ['技术部', '销售部', '财务部', '行政部', '管理岗'],
        grossIncome: (i) => Random.float(8000, 38000, 0, 0),
        cumulativeIncome: (i) => Random.float(0, 200000, 0, 0),
        taxableIncome: (i) => Random.float(0, 25000, 0, 0),
        taxRate: (i) => ['3%', '10%', '20%', '25%', '30%'],
        taxAmount: (i) => Random.float(0, 4500, 0, 0),
        paidTax: (i) => Random.float(0, 5000, 0, 0),
        balance: (i) => Random.float(-500, 800, 0, 0),
        quickDeduction: (i) => [0, 210, 1410, 2660, 4410, 7160][Random.integer(0, 5)],
        accumulatedIncome: (i) => Random.float(0, 200000, 0, 0),
        accumulatedTax: (i) => Random.float(0, 30000, 0, 0),
        payMonth: '2026-05',
        month: '2026-05',
        declareTime: '{{date}}',
        status: ['已申报', '待申报', '补缴', '已完成']
      }
    })
  },

  // ==================== 社保公积金 ====================
  {
    url: '/api/hr/socialInsurance/list',
    method: 'get',
    response: listResponse({
      total: 86,
      fields: {
        employeeName: genCName,
        empNo: (i) => `EMP${String(i + 1001).padStart(5, '0')}`,
        deptName: ['技术部', '销售部', '财务部', '行政部', '采购部', '仓储部', '生产部'],
        pensionBase: (i) => Random.float(3000, 25000, 0, 0),
        pensionPersonal: (i) => Random.float(240, 2000, 0, 0),
        pensionCompany: (i) => Random.float(480, 4000, 0, 0),
        medicalBase: (i) => Random.float(3000, 25000, 0, 0),
        medicalPersonal: (i) => Random.float(60, 500, 0, 0),
        medicalCompany: (i) => Random.float(180, 1500, 0, 0),
        unemploymentBase: (i) => Random.float(3000, 25000, 0, 0),
        unemploymentPersonal: (i) => Random.float(15, 125, 0, 0),
        unemploymentCompany: (i) => Random.float(30, 250, 0, 0),
        injuryCompany: (i) => Random.float(15, 250, 0, 0),
        maternityCompany: (i) => Random.float(30, 250, 0, 0),
        housingFundBase: (i) => Random.float(3000, 25000, 0, 0),
        housingFundPersonal: (i) => Random.float(240, 2000, 0, 0),
        housingFundCompany: (i) => Random.float(240, 2000, 0, 0),
        totalPersonal: (i) => Random.float(315, 4625, 0, 0),
        totalCompany: (i) => Random.float(975, 8350, 0, 0),
        payMonth: '2026-05',
        status: ['正常缴纳', '暂停', '补缴中']
      }
    })
  },

  // 通用保存
  { url: '/api/hr/socialInsurance/save', method: 'post', response: () => ({ code: 200, msg: '保存成功', data: { id: Random.id() } }) },
  // 通用删除
  { url: /\/api\/hr\/socialInsurance\/delete\/.*/, method: 'delete', response: () => ({ code: 200, msg: '删除成功', data: null }) },
  // 通用缴费
  { url: /\/api\/hr\/socialInsurance\/pay\/.*/, method: 'post', response: () => ({ code: 200, msg: '缴费成功', data: null }) },

  // ==================== 工资计算 mock ====================
  { url: '/api/hr/salary/wage/calculate', method: 'post', response: () => ({ code: 200, msg: '计算成功', data: null }) },
  { url: /\/api\/hr\/salary\/wage\/approve\/.*/, method: 'post', response: () => ({ code: 200, msg: '审批成功', data: null }) },
  { url: /\/api\/hr\/salary\/wage\/slip\/.*/, method: 'get', response: () => ({ code: 200, msg: '获取成功', data: 'blob:mock-slip' }) },

  // ==================== 个税管理 mock ====================
  { url: '/api/hr/salary/tax/save', method: 'post', response: () => ({ code: 200, msg: '保存成功', data: { id: Random.id() } }) },
  { url: /\/api\/hr\/salary\/tax\/delete\/.*/, method: 'delete', response: () => ({ code: 200, msg: '删除成功', data: null }) },
  { url: /\/api\/hr\/salary\/tax\/declare\/.*/, method: 'post', response: () => ({ code: 200, msg: '申报成功', data: null }) },

  // ==================== KPI mock ====================
  { url: '/api/hr/performance/kpi/save', method: 'post', response: () => ({ code: 200, msg: '保存成功', data: { id: Random.id() } }) },
  { url: /\/api\/hr\/performance\/kpi\/delete\/.*/, method: 'delete', response: () => ({ code: 200, msg: '删除成功', data: null }) },
  { url: /\/api\/hr\/performance\/kpi\/toggle\/.*/, method: 'post', response: () => ({ code: 200, msg: '操作成功', data: null }) },

  // ==================== 考核 mock ====================
  { url: '/api/hr/performance/assessment/save', method: 'post', response: () => ({ code: 200, msg: '保存成功', data: { id: Random.id() } }) },
  { url: /\/api\/hr\/performance\/assessment\/delete\/.*/, method: 'delete', response: () => ({ code: 200, msg: '删除成功', data: null }) },
  { url: '/api/hr/performance/assessment/score', method: 'post', response: () => ({ code: 200, msg: '提交评分成功', data: null }) },

  // ==================== 评分管理 mock ====================
  { url: '/api/hr/performance/score/save', method: 'post', response: () => ({ code: 200, msg: '保存成功', data: { id: Random.id() } }) },
  { url: /\/api\/hr\/performance\/score\/delete\/.*/, method: 'delete', response: () => ({ code: 200, msg: '删除成功', data: null }) }
]
