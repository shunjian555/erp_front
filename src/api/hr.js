/**
 * HR 模块 API 接口
 */
import request from '@/utils/request'

// ==================== 员工档案 ====================
export function getEmployeeList(params) {
  return request({ url: '/api/hr/employee/list', method: 'get', params })
}
export function getEmployeeDetail(id) {
  return request({ url: `/api/hr/employee/detail/${id}`, method: 'get' })
}
export function saveEmployee(data) {
  return request({ url: '/api/hr/employee/save', method: 'post', data })
}
export function deleteEmployee(id) {
  return request({ url: `/api/hr/employee/delete/${id}`, method: 'delete' })
}

// ==================== 组织架构 ====================
export function getOrgTree() {
  return request({ url: '/api/hr/organization/tree', method: 'get' })
}

// ==================== 招聘职位 ====================
export function getPositionList(params) {
  return request({ url: '/api/hr/recruit/position/list', method: 'get', params })
}

// ==================== 简历管理 ====================
export function getResumeList(params) {
  return request({ url: '/api/hr/recruit/resume/list', method: 'get', params })
}

// ==================== 面试管理 ====================
export function getInterviewList(params) {
  return request({ url: '/api/hr/recruit/interview/list', method: 'get', params })
}

// ==================== 培训课程 ====================
export function getCourseList(params) {
  return request({ url: '/api/hr/training/course/list', method: 'get', params })
}

// ==================== 培训计划 ====================
export function getTrainingPlanList(params) {
  return request({ url: '/api/hr/training/plan/list', method: 'get', params })
}

// ==================== 培训记录 ====================
export function getTrainingRecordList(params) {
  return request({ url: '/api/hr/training/record/list', method: 'get', params })
}

// ==================== 打卡记录 ====================
export function getClockList(params) {
  return request({ url: '/api/hr/attendance/clock/list', method: 'get', params })
}

// ==================== 排班管理 ====================
export function getScheduleList(params) {
  return request({ url: '/api/hr/attendance/schedule/list', method: 'get', params })
}

// ==================== 考勤统计 ====================
export function getAttendanceStatistics(params) {
  return request({ url: '/api/hr/attendance/statistics/list', method: 'get', params })
}

// ==================== KPI设置 ====================
export function getKpiList(params) {
  return request({ url: '/api/hr/performance/kpi/list', method: 'get', params })
}
export function saveKpi(data) {
  return request({ url: '/api/hr/performance/kpi/save', method: 'post', data })
}
export function deleteKpi(id) {
  return request({ url: `/api/hr/performance/kpi/delete/${id}`, method: 'delete' })
}
export function toggleKpiStatus(id) {
  return request({ url: `/api/hr/performance/kpi/toggle/${id}`, method: 'post' })
}

// ==================== 绩效考核 ====================
export function getAssessmentList(params) {
  return request({ url: '/api/hr/performance/assessment/list', method: 'get', params })
}
export function saveAssessment(data) {
  return request({ url: '/api/hr/performance/assessment/save', method: 'post', data })
}
export function deleteAssessment(id) {
  return request({ url: `/api/hr/performance/assessment/delete/${id}`, method: 'delete' })
}
export function submitAssessmentScore(data) {
  return request({ url: '/api/hr/performance/assessment/score', method: 'post', data })
}

// ==================== 评分管理 ====================
export function getScoreList(params) {
  return request({ url: '/api/hr/performance/score/list', method: 'get', params })
}
export function getScoreRecordList(params) {
  return request({ url: '/api/hr/performance/score/list', method: 'get', params })
}
export function saveScoreRecord(data) {
  return request({ url: '/api/hr/performance/score/save', method: 'post', data })
}
export function deleteScoreRecord(id) {
  return request({ url: `/api/hr/performance/score/delete/${id}`, method: 'delete' })
}

// ==================== 工资计算 ====================
export function getWageList(params) {
  return request({ url: '/api/hr/salary/wage/list', method: 'get', params })
}
export function getSalaryList(params) {
  return request({ url: '/api/hr/salary/wage/list', method: 'get', params })
}
export function calculateSalary(data) {
  return request({ url: '/api/hr/salary/wage/calculate', method: 'post', data })
}
export function approveSalary(id) {
  return request({ url: `/api/hr/salary/wage/approve/${id}`, method: 'post' })
}
export function exportSalarySlip(id) {
  return request({ url: `/api/hr/salary/wage/slip/${id}`, method: 'get', responseType: 'blob' })
}

// ==================== 个税管理 ====================
export function getTaxList(params) {
  return request({ url: '/api/hr/salary/tax/list', method: 'get', params })
}
export function getTaxRecordList(params) {
  return request({ url: '/api/hr/salary/tax/list', method: 'get', params })
}
export function saveTaxRecord(data) {
  return request({ url: '/api/hr/salary/tax/save', method: 'post', data })
}
export function deleteTaxRecord(id) {
  return request({ url: `/api/hr/salary/tax/delete/${id}`, method: 'delete' })
}
export function declareTax(id) {
  return request({ url: `/api/hr/salary/tax/declare/${id}`, method: 'post' })
}

// ==================== 社保公积金 ====================
export function getSocialInsuranceList(params) {
  return request({ url: '/api/hr/socialInsurance/list', method: 'get', params })
}
export function getInsuranceList(params) {
  return request({ url: '/api/hr/socialInsurance/list', method: 'get', params })
}
export function saveInsurance(data) {
  return request({ url: '/api/hr/socialInsurance/save', method: 'post', data })
}
export function deleteInsurance(id) {
  return request({ url: `/api/hr/socialInsurance/delete/${id}`, method: 'delete' })
}
export function payInsurance(id) {
  return request({ url: `/api/hr/socialInsurance/pay/${id}`, method: 'post' })
}
