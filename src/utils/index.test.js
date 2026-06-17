import { describe, it, expect, vi } from 'vitest'
import {
  debounce,
  throttle,
  deepClone,
  formatDate,
  formatMoney,
  generateId,
  treeToList,
  listToTree,
  getFileExtension,
  formatFileSize
} from './index'

describe('deepClone', () => {
  it('深拷贝对象', () => {
    const obj = { a: 1, b: { c: 2 } }
    const cloned = deepClone(obj)
    expect(cloned).toEqual(obj)
    expect(cloned).not.toBe(obj)
    expect(cloned.b).not.toBe(obj.b)
  })

  it('深拷贝数组', () => {
    const arr = [1, [2, 3], { a: 4 }]
    const cloned = deepClone(arr)
    expect(cloned).toEqual(arr)
    expect(cloned).not.toBe(arr)
  })

  it('基本类型直接返回', () => {
    expect(deepClone(null)).toBe(null)
    expect(deepClone(undefined)).toBe(undefined)
    expect(deepClone(42)).toBe(42)
    expect(deepClone('hello')).toBe('hello')
  })
})

describe('formatDate', () => {
  it('格式化日期对象', () => {
    const date = new Date(2024, 5, 15, 10, 30, 45)
    expect(formatDate(date)).toBe('2024-06-15 10:30:45')
  })

  it('自定义格式', () => {
    const date = new Date(2024, 0, 1)
    expect(formatDate(date, 'YYYY-MM-DD')).toBe('2024-01-01')
  })

  it('空值返回空字符串', () => {
    expect(formatDate(null)).toBe('')
    expect(formatDate(undefined)).toBe('')
  })
})

describe('formatMoney', () => {
  it('格式化正数', () => {
    expect(formatMoney(12345.67)).toBe('12,345.67')
  })

  it('格式化零', () => {
    expect(formatMoney(0)).toBe('0.00')
  })

  it('空值返回占位符', () => {
    expect(formatMoney(null)).toBe('--')
    expect(formatMoney(undefined)).toBe('--')
  })

  it('自定义小数位', () => {
    expect(formatMoney(1234, 0)).toBe('1,234')
  })
})

describe('generateId', () => {
  it('生成唯一ID', () => {
    const id1 = generateId()
    const id2 = generateId()
    expect(id1).not.toBe(id2)
    expect(typeof id1).toBe('string')
    expect(id1.length).toBeGreaterThan(0)
  })
})

describe('treeToList', () => {
  it('树形转扁平', () => {
    const tree = [
      { id: 1, children: [{ id: 2 }, { id: 3 }] },
      { id: 4, children: [{ id: 5 }] }
    ]
    const list = treeToList(tree)
    expect(list.map(i => i.id).sort()).toEqual([1, 2, 3, 4, 5])
  })

  it('空数组', () => {
    expect(treeToList([])).toEqual([])
  })
})

describe('listToTree', () => {
  it('扁平转树形', () => {
    const list = [
      { id: 1, parentId: 0 },
      { id: 2, parentId: 1 },
      { id: 3, parentId: 1 },
      { id: 4, parentId: 0 }
    ]
    const tree = listToTree(list)
    expect(tree.length).toBe(2)
    expect(tree[0].children.length).toBe(2)
  })
})

describe('getFileExtension', () => {
  it('获取文件扩展名', () => {
    expect(getFileExtension('test.pdf')).toBe('pdf')
    expect(getFileExtension('archive.tar.gz')).toBe('gz')
  })

  it('无扩展名', () => {
    expect(getFileExtension('noext')).toBe('')
  })
})

describe('formatFileSize', () => {
  it('格式化文件大小', () => {
    expect(formatFileSize(0)).toBe('0 B')
    expect(formatFileSize(1024)).toBe('1.00 KB')
    expect(formatFileSize(1048576)).toBe('1.00 MB')
  })
})

describe('debounce', () => {
  it('防抖：延迟执行', async () => {
    vi.useFakeTimers()
    const fn = vi.fn()
    const debounced = debounce(fn, 100)
    debounced()
    debounced()
    debounced()
    expect(fn).not.toHaveBeenCalled()
    vi.advanceTimersByTime(100)
    expect(fn).toHaveBeenCalledTimes(1)
    vi.useRealTimers()
  })
})

describe('throttle', () => {
  it('节流：限制调用频率', () => {
    vi.useFakeTimers()
    const fn = vi.fn()
    const throttled = throttle(fn, 100)
    throttled()
    throttled()
    throttled()
    expect(fn).toHaveBeenCalledTimes(1)
    vi.advanceTimersByTime(100)
    throttled()
    expect(fn).toHaveBeenCalledTimes(2)
    vi.useRealTimers()
  })
})