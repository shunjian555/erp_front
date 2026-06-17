import { describe, it, expect, beforeEach } from 'vitest'
import { getToken, setToken, removeToken } from './auth'

describe('auth 工具函数', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('setToken 和 getToken 正常存取', () => {
    setToken('test-token-123')
    expect(getToken()).toBe('test-token-123')
  })

  it('getToken 无 token 时返回 null', () => {
    expect(getToken()).toBeNull()
  })

  it('removeToken 正确删除', () => {
    setToken('test-token')
    removeToken()
    expect(getToken()).toBeNull()
  })

  it('setToken 覆盖旧值', () => {
    setToken('old-token')
    setToken('new-token')
    expect(getToken()).toBe('new-token')
  })
})