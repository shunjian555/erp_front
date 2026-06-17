import request from '@/utils/request'

// 获取客户列表
export function getCustomerList(params) {
  return request({
    url: '/api/crm/customer/list',
    method: 'get',
    params
  })
}

// 获取客户详情
export function getCustomerDetail(id) {
  return request({
    url: `/api/crm/customer/${id}`,
    method: 'get'
  })
}

// 新增客户
export function addCustomer(data) {
  return request({
    url: '/api/crm/customer',
    method: 'post',
    data
  })
}

// 编辑客户
export function updateCustomer(data) {
  return request({
    url: '/api/crm/customer',
    method: 'put',
    data
  })
}

// 删除客户
export function deleteCustomer(id) {
  return request({
    url: `/api/crm/customer/${id}`,
    method: 'delete'
  })
}

// 更新客户状态
export function updateCustomerStatus(id, status) {
  return request({
    url: `/api/crm/customer/status/${id}`,
    method: 'put',
    data: { status }
  })
}
