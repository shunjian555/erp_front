/**
 * Mock 数据 - 登录模块
 */
import Mock from 'mockjs'
const Random = Mock.Random

export default [
  // 用户登录
  {
    url: '/api/auth/login',
    method: 'post',
    response: ({ body }) => {
      const { username, password } = body
      if (username === 'admin' && password === '123456') {
        return {
          code: 200,
          message: '登录成功',
          data: {
            token: `mock-token-${Date.now()}-${Random.string(16)}`
          }
        }
      }
      return {
        code: 401,
        message: '用户名或密码错误'
      }
    }
  },
  // 获取用户信息
  {
    url: '/api/auth/userinfo',
    method: 'get',
    response: () => ({
      code: 200,
      message: '获取成功',
      data: {
        userInfo: {
          id: 1, username: 'admin', nickname: '系统管理员', avatar: '',
          email: 'admin@smarterp.com', phone: '13800138000'
        },
        roles: ['admin'],
        permissions: ['*']
      }
    })
  },
  // 退出登录
  {
    url: '/api/auth/logout',
    method: 'post',
    response: () => ({ code: 200, message: '退出成功' })
  }
]
