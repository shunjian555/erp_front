/**
 * 通用工具函数
 */

// 防抖
export function debounce(fn, delay = 300) {
  let timer = null
  return function (...args) {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      fn.apply(this, args)
    }, delay)
  }
}

// 节流
export function throttle(fn, delay = 300) {
  let lastTime = 0
  return function (...args) {
    const now = Date.now()
    if (now - lastTime >= delay) {
      fn.apply(this, args)
      lastTime = now
    }
  }
}

// 深拷贝
export function deepClone(source) {
  if (!source || typeof source !== 'object') return source
  const targetObj = source.constructor === Array ? [] : {}
  Object.keys(source).forEach((key) => {
    if (source[key] && typeof source[key] === 'object') {
      targetObj[key] = deepClone(source[key])
    } else {
      targetObj[key] = source[key]
    }
  })
  return targetObj
}

// 格式化日期
export function formatDate(date, format = 'YYYY-MM-DD HH:mm:ss') {
  if (!date) return ''
  const d = new Date(date)
  const map = {
    YYYY: d.getFullYear(),
    MM: String(d.getMonth() + 1).padStart(2, '0'),
    DD: String(d.getDate()).padStart(2, '0'),
    HH: String(d.getHours()).padStart(2, '0'),
    mm: String(d.getMinutes()).padStart(2, '0'),
    ss: String(d.getSeconds()).padStart(2, '0')
  }
  return format.replace(/YYYY|MM|DD|HH|mm|ss/g, (match) => map[match])
}

// 格式化金额
export function formatMoney(amount, decimals = 2) {
  if (!amount && amount !== 0) return '--'
  return Number(amount).toLocaleString('zh-CN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  })
}

// 生成随机ID
export function generateId() {
  return Math.random().toString(36).substring(2, 15)
}

// 树形数据转扁平数组
export function treeToList(tree, childrenKey = 'children') {
  const list = []
  const stack = [...tree]
  while (stack.length) {
    const node = stack.pop()
    list.push(node)
    if (node[childrenKey]?.length) {
      stack.push(...node[childrenKey])
    }
  }
  return list
}

// 扁平数组转树形数据
export function listToTree(list, idKey = 'id', parentKey = 'parentId', childrenKey = 'children') {
  const map = {}
  const tree = []
  list.forEach((item) => {
    map[item[idKey]] = { ...item, [childrenKey]: [] }
  })
  list.forEach((item) => {
    const parent = map[item[parentKey]]
    if (parent) {
      parent[childrenKey].push(map[item[idKey]])
    } else {
      tree.push(map[item[idKey]])
    }
  })
  return tree
}

// 获取文件扩展名
export function getFileExtension(filename) {
  return filename.slice(((filename.lastIndexOf('.') - 1) >>> 0) + 2)
}

// 文件大小格式化
export function formatFileSize(bytes) {
  if (!bytes) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const index = Math.floor(Math.log(bytes) / Math.log(1024))
  return `${(bytes / Math.pow(1024, index)).toFixed(2)} ${units[index]}`
}
