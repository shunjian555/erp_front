/**
 * Excel 导入导出工具（无需依赖，纯前端实现）
 * 导出使用 SpreadsheetML 2003 格式（XML），Excel 可直接打开
 * 导入支持 .xls（XML）、.csv
 */

/**
 * 将对象数组导出为 Excel 文件
 * @param {Array<Object>} data - 要导出的数据
 * @param {Array<{prop:string,label:string}>} columns - 列定义 [{prop:'name', label:'名称'}]
 * @param {string} filename - 文件名（不含后缀）
 */
export function exportToExcel(data, columns, filename = 'export') {
  if (!Array.isArray(data) || !Array.isArray(columns) || columns.length === 0) {
    throw new Error('导出数据或列配置无效')
  }

  const escapeXml = (v) => {
    if (v === null || v === undefined) return ''
    return String(v)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;')
  }

  const isNum = (v) => typeof v === 'number' || (!isNaN(parseFloat(v)) && isFinite(v) && /^-?\d+(\.\d+)?$/.test(String(v).trim()))

  let rows = ''
  // 表头
  rows += '<Row>' + columns.map(c => `<Cell><Data ss:Type="String">${escapeXml(c.label)}</Data></Cell>`).join('') + '</Row>'
  // 数据
  data.forEach(item => {
    rows += '<Row>' + columns.map(c => {
      const val = item[c.prop]
      if (isNum(val)) {
        return `<Cell><Data ss:Type="Number">${val}</Data></Cell>`
      }
      return `<Cell><Data ss:Type="String">${escapeXml(val)}</Data></Cell>`
    }).join('') + '</Row>'
  })

  const xml = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <Styles>
  <Style ss:ID="Default" ss:Name="Normal">
   <Font ss:FontName="微软雅黑" x:CharSet="134" ss:Size="11"/>
  </Style>
  <Style ss:ID="Header">
   <Font ss:FontName="微软雅黑" x:CharSet="134" ss:Size="11" ss:Bold="1"/>
   <Interior ss:Color="#F5F7FA" ss:Pattern="Solid"/>
  </Style>
 </Styles>
 <Worksheet ss:Name="Sheet1">
  <Table>${rows}</Table>
 </Worksheet>
</Workbook>`

  downloadFile(xml, `${filename}.xls`, 'application/vnd.ms-excel;charset=utf-8')
}

/**
 * 解析 Excel/CSV 文件为对象数组
 * @param {File} file
 * @param {Array<{prop:string,label:string}>} columns
 * @returns {Promise<Array<Object>>}
 */
export function importFromExcel(file, columns = []) {
  return new Promise((resolve, reject) => {
    if (!file) return reject(new Error('未选择文件'))

    const reader = new FileReader()
    const ext = (file.name.split('.').pop() || '').toLowerCase()

    reader.onload = (e) => {
      try {
        const text = e.target.result
        if (ext === 'xls' || (text && text.trim().startsWith('<?xml'))) {
          resolve(parseXlsXml(text, columns))
        } else {
          resolve(parseCsv(text, columns))
        }
      } catch (err) {
        reject(err)
      }
    }
    reader.onerror = () => reject(new Error('文件读取失败'))
    reader.readAsText(file, 'utf-8')
  })
}

function parseXlsXml(xml, columns) {
  const parser = new DOMParser()
  const doc = parser.parseFromString(xml, 'text/xml')
  const rows = Array.from(doc.querySelectorAll('Row'))
  if (rows.length === 0) return []
  // 第一行为表头
  const headerCells = Array.from(rows[0].querySelectorAll('Cell Data'))
  const headers = headerCells.map(d => (d.textContent || '').trim())
  const data = []
  for (let i = 1; i < rows.length; i++) {
    const cells = Array.from(rows[i].querySelectorAll('Cell Data'))
    const row = {}
    cells.forEach((d, idx) => {
      const col = columns.find(c => c.label === headers[idx]) || { prop: headers[idx] }
      row[col.prop] = (d.textContent || '').trim()
    })
    if (Object.keys(row).length) data.push(row)
  }
  return data
}

function parseCsv(text, columns) {
  // 移除 BOM
  if (text.charCodeAt(0) === 0xFEFF) text = text.slice(1)
  const lines = text.split(/\r?\n/).filter(l => l.length)
  if (lines.length === 0) return []
  const splitLine = (line) => {
    const result = []
    let cur = ''
    let inQuote = false
    for (let i = 0; i < line.length; i++) {
      const ch = line[i]
      if (ch === '"') {
        if (inQuote && line[i + 1] === '"') { cur += '"'; i++ }
        else inQuote = !inQuote
      } else if (ch === ',' && !inQuote) {
        result.push(cur); cur = ''
      } else cur += ch
    }
    result.push(cur)
    return result
  }
  const headers = splitLine(lines[0]).map(h => h.trim())
  const data = []
  for (let i = 1; i < lines.length; i++) {
    const values = splitLine(lines[i])
    const row = {}
    values.forEach((v, idx) => {
      const col = columns.find(c => c.label === headers[idx]) || { prop: headers[idx] }
      row[col.prop] = v
    })
    if (Object.keys(row).length) data.push(row)
  }
  return data
}

/**
 * 触发文件下载
 */
function downloadFile(content, filename, mime) {
  const blob = new Blob(['\ufeff' + content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/**
 * 生成 CSV 字符串（备用方案）
 */
export function toCsv(data, columns) {
  const escape = (v) => {
    const s = v === null || v === undefined ? '' : String(v)
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  const header = columns.map(c => escape(c.label)).join(',')
  const body = data.map(row => columns.map(c => escape(row[c.prop])).join(',')).join('\n')
  return header + '\n' + body
}
