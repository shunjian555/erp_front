/**
 * 浏览器原生打印工具
 */

/**
 * 触发浏览器打印对话框
 * @param {Object} options - 打印配置
 * @param {string} options.title - 打印任务名称
 * @param {HTMLElement} options.element - 要打印的 DOM 元素（可选，默认打印整个 body）
 * @param {string} options.style - 注入到打印窗口的额外样式
 */
export function browserPrint({ title = '打印', element = null, style = '' } = {}) {
  // 如果指定了元素，将该元素克隆到一个 iframe 中打印
  if (element) {
    const iframe = document.createElement('iframe')
    iframe.style.position = 'fixed'
    iframe.style.right = '-9999px'
    iframe.style.bottom = '0'
    iframe.style.width = '0'
    iframe.style.height = '0'
    iframe.style.border = '0'
    document.body.appendChild(iframe)

    const doc = iframe.contentWindow.document
    doc.open()
    doc.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${title}</title>
  <style>
    @page { size: A4; margin: 12mm; }
    body { font-family: -apple-system, "Microsoft YaHei", sans-serif; color: #303133; padding: 0; margin: 0; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    th, td { border: 1px solid #ebeef5; padding: 6px 10px; text-align: left; }
    th { background: #f5f7fa; font-weight: 600; }
    h1, h2, h3 { margin: 0 0 12px; }
    .print-header { border-bottom: 2px solid #409eff; padding-bottom: 12px; margin-bottom: 16px; }
    .print-footer { margin-top: 16px; padding-top: 8px; border-top: 1px solid #ebeef5; font-size: 12px; color: #909399; text-align: right; }
    ${style}
  </style>
</head>
<body>
  ${element.innerHTML}
  <div class="print-footer">打印时间：${new Date().toLocaleString()}</div>
</body>
</html>`)
    doc.close()

    iframe.contentWindow.focus()
    setTimeout(() => {
      iframe.contentWindow.print()
      setTimeout(() => document.body.removeChild(iframe), 1000)
    }, 200)
    return
  }

  // 默认打印整个页面
  const originalTitle = document.title
  document.title = title
  window.print()
  setTimeout(() => {
    document.title = originalTitle
  }, 1000)
}

/**
 * 导出页面区域为可打印 HTML（用户可在新窗口中再打印）
 * @param {string} html - 内容 HTML
 * @param {string} title - 窗口/标题
 */
export function openPrintWindow(html, title = '打印预览') {
  const w = window.open('', '_blank', 'width=900,height=700')
  if (!w) {
    return false
  }
  w.document.open()
  w.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${title}</title>
  <style>
    @page { size: A4; margin: 12mm; }
    body { font-family: -apple-system, "Microsoft YaHei", sans-serif; color: #303133; padding: 16px; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; margin: 8px 0; }
    th, td { border: 1px solid #ebeef5; padding: 6px 10px; text-align: left; }
    th { background: #f5f7fa; font-weight: 600; }
    .toolbar { margin-bottom: 12px; }
    .toolbar button { padding: 6px 14px; background: #409eff; color: #fff; border: 0; border-radius: 4px; cursor: pointer; }
    @media print { .toolbar { display: none; } }
  </style>
</head>
<body>
  <div class="toolbar"><button onclick="window.print()">打印</button></div>
  ${html}
</body>
</html>`)
  w.document.close()
  return true
}
