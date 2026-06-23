<template>
  <div class="page-container ledger-page">
    <el-tabs v-model="activeTab" type="border-card" class="ledger-tabs">
      <!-- Tab 1: 明细账 -->
      <el-tab-pane label="明细账" name="detail">
        <BaseSearch :search-items="detailSearchItems" @search="handleDetailSearch" @reset="handleDetailReset" />
        <div class="table-toolbar">
          <div class="toolbar-left">
            <el-button type="primary" :icon="Download" plain @click="handleExportClick">导出</el-button>
            <el-button :icon="Printer" plain @click="handlePrintClick">打印</el-button>
          </div>
          <div class="toolbar-right">
            <el-tag>期间：{{ queryDetail.period }}</el-tag>
          </div>
        </div>
        <div v-if="currentSubject" class="subject-info">
          <el-descriptions :column="4" border size="small">
            <el-descriptions-item label="科目编码">{{ currentSubject.subjectCode }}</el-descriptions-item>
            <el-descriptions-item label="科目名称">{{ currentSubject.subjectName }}</el-descriptions-item>
            <el-descriptions-item label="期初借方">{{ formatMoney(currentSubject.openingDebit) }}</el-descriptions-item>
            <el-descriptions-item label="期初贷方">{{ formatMoney(currentSubject.openingCredit) }}</el-descriptions-item>
          </el-descriptions>
        </div>
        <BaseTable
          :columns="detailColumns"
          :table-data="detailData"
          :loading="detailLoading"
          :total="detailTotal"
          :current-page.sync="queryDetail.pageNum"
          :page-size.sync="queryDetail.pageSize"
          :show-summary="true"
          :summary-method="detailSummary"
          :show-index="true"
          @current-change="handleDetailPageChange"
          @size-change="handleDetailSizeChange"
        >
          <template #debitAmount="{ row }">
            <span class="money debit">{{ formatMoney(row.debitAmount) }}</span>
          </template>
          <template #creditAmount="{ row }">
            <span class="money credit">{{ formatMoney(row.creditAmount) }}</span>
          </template>
        </BaseTable>
      </el-tab-pane>

      <!-- Tab 2: 科目余额表 -->
      <el-tab-pane label="科目余额表" name="balance">
        <BaseSearch :search-items="balanceSearchItems" @search="handleBalanceSearch" @reset="handleBalanceReset" />
        <div class="table-toolbar">
          <div class="toolbar-left">
            <el-button type="primary" :icon="Download" plain @click="handleExportClick">导出</el-button>
            <el-button :icon="Printer" plain @click="handlePrintClick">打印</el-button>
          </div>
        </div>
        <BaseTable
          :columns="balanceColumns"
          :table-data="balanceData"
          :loading="balanceLoading"
          :total="balanceTotal"
          :show-summary="true"
          :summary-method="balanceSummary"
          :show-index="true"
        >
          <template #openingDebit="{ row }">{{ formatMoney(row.openingDebit) }}</template>
          <template #openingCredit="{ row }">{{ formatMoney(row.openingCredit) }}</template>
          <template #periodDebit="{ row }">{{ formatMoney(row.periodDebit) }}</template>
          <template #periodCredit="{ row }">{{ formatMoney(row.periodCredit) }}</template>
          <template #endingDebit="{ row }">{{ formatMoney(row.endingDebit) }}</template>
          <template #endingCredit="{ row }">{{ formatMoney(row.endingCredit) }}</template>
        </BaseTable>
      </el-tab-pane>

      <!-- Tab 3: 总账 -->
      <el-tab-pane label="总账" name="general">
        <BaseSearch :search-items="generalSearchItems" @search="handleGeneralSearch" @reset="handleGeneralReset" />
        <div class="table-toolbar">
          <div class="toolbar-left">
            <el-button type="primary" :icon="Download" plain @click="handleGeneralExport">导出</el-button>
          </div>
        </div>
        <BaseTable
          :columns="generalColumns"
          :table-data="generalData"
          :loading="generalLoading"
          :show-summary="true"
          :summary-method="generalSummary"
        >
          <template #openingDebit="{ row }">{{ formatMoney(row.openingDebit) }}</template>
          <template #openingCredit="{ row }">{{ formatMoney(row.openingCredit) }}</template>
          <template #periodDebit="{ row }">{{ formatMoney(row.periodDebit) }}</template>
          <template #periodCredit="{ row }">{{ formatMoney(row.periodCredit) }}</template>
          <template #endingDebit="{ row }">{{ formatMoney(row.endingDebit) }}</template>
          <template #endingCredit="{ row }">{{ formatMoney(row.endingCredit) }}</template>
        </BaseTable>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Download, Printer } from '@element-plus/icons-vue'
import BaseSearch from '@/components/BaseSearch.vue'
import BaseTable from '@/components/BaseTable.vue'
import request from '@/utils/request'

const activeTab = ref('detail')

// ========== Tab 1 明细账 ==========
const queryDetail = reactive({ pageNum: 1, pageSize: 20, subjectCode: '1122', period: '2025-06' })
const detailSearchItems = [
  { prop: 'subjectCode', label: '科目编码', type: 'input', span: 8 },
  { prop: 'period', label: '会计期间', type: 'select', span: 8, options: [
    { value: '2025-04', label: '2025-04' },
    { value: '2025-05', label: '2025-05' },
    { value: '2025-06', label: '2025-06' }
  ]}
]
const detailColumns = [
  { prop: 'voucherDate', label: '日期', width: 110, fixed: true },
  { prop: 'voucherNo', label: '凭证号', width: 170 },
  { prop: 'summary', label: '摘要', minWidth: 250, showOverflowTooltip: true },
  { prop: 'debitAmount', label: '借方', width: 130, slot: 'debitAmount', align: 'right' },
  { prop: 'creditAmount', label: '贷方', width: 130, slot: 'creditAmount', align: 'right' },
  { prop: 'direction', label: '方向', width: 60, align: 'center' }
]
const detailData = ref([])
const detailTotal = ref(0)
const detailLoading = ref(false)
const currentSubject = ref(null)

async function loadDetail() {
  detailLoading.value = true
  try {
    const [detailRes, balanceRes] = await Promise.all([
      request({ url: '/api/finance/ledgerDetail/query', method: 'get', params: queryDetail }),
      request({ url: '/api/finance/subjectBalance/query', method: 'get', params: { period: queryDetail.period } })
    ])
    detailData.value = detailRes.data.list || []
    detailTotal.value = detailRes.data.total || 0
    const allBal = balanceRes.data.list || []
    currentSubject.value = allBal.find(s => s.subjectCode === queryDetail.subjectCode) || null
  } finally {
    detailLoading.value = false
  }
}

function detailSummary({ columns, data }) {
  const sumDebit = data.reduce((s, r) => s + (Number(r.debitAmount) || 0), 0)
  const sumCredit = data.reduce((s, r) => s + (Number(r.creditAmount) || 0), 0)
  return columns.map((col, i) => {
    if (i === 0) return '合计'
    if (col.property === 'debitAmount') return formatMoney(sumDebit)
    if (col.property === 'creditAmount') return formatMoney(sumCredit)
    return ''
  })
}

// ========== Tab 2 科目余额表 ==========
const queryBalance = reactive({ period: '2025-06', category: '' })
const balanceSearchItems = [
  { prop: 'period', label: '会计期间', type: 'select', span: 8, options: [
    { value: '2025-04', label: '2025-04' },
    { value: '2025-05', label: '2025-05' },
    { value: '2025-06', label: '2025-06' }
  ]},
  { prop: 'category', label: '科目类别', type: 'select', span: 8, options: [
    { value: '', label: '全部' },
    { value: 'asset', label: '资产类' },
    { value: 'liability', label: '负债类' },
    { value: 'equity', label: '权益类' },
    { value: 'cost', label: '成本类' },
    { value: 'profit', label: '损益类' }
  ]}
]
const balanceColumns = [
  { prop: 'subjectCode', label: '科目编码', width: 140, fixed: true },
  { prop: 'subjectName', label: '科目名称', minWidth: 180 },
  { prop: 'category', label: '类别', width: 100 },
  { prop: 'direction', label: '方向', width: 80, align: 'center' },
  { prop: 'openingDebit', label: '期初借方', width: 130, slot: 'openingDebit', align: 'right' },
  { prop: 'openingCredit', label: '期初贷方', width: 130, slot: 'openingCredit', align: 'right' },
  { prop: 'periodDebit', label: '本期借方', width: 130, slot: 'periodDebit', align: 'right' },
  { prop: 'periodCredit', label: '本期贷方', width: 130, slot: 'periodCredit', align: 'right' },
  { prop: 'endingDebit', label: '期末借方', width: 130, slot: 'endingDebit', align: 'right' },
  { prop: 'endingCredit', label: '期末贷方', width: 130, slot: 'endingCredit', align: 'right' }
]
const balanceData = ref([])
const balanceTotal = ref(0)
const balanceLoading = ref(false)

async function loadBalance() {
  balanceLoading.value = true
  try {
    const res = await request({ url: '/api/finance/subjectBalance/query', method: 'get', params: queryBalance })
    balanceData.value = res.data.list || []
    balanceTotal.value = res.data.total || 0
  } finally {
    balanceLoading.value = false
  }
}

function balanceSummary({ columns, data }) {
  const opD = data.reduce((s, r) => s + (Number(r.openingDebit) || 0), 0)
  const opC = data.reduce((s, r) => s + (Number(r.openingCredit) || 0), 0)
  const pd = data.reduce((s, r) => s + (Number(r.periodDebit) || 0), 0)
  const pc = data.reduce((s, r) => s + (Number(r.periodCredit) || 0), 0)
  const ed = data.reduce((s, r) => s + (Number(r.endingDebit) || 0), 0)
  const ec = data.reduce((s, r) => s + (Number(r.endingCredit) || 0), 0)
  const map = { openingDebit: opD, openingCredit: opC, periodDebit: pd, periodCredit: pc, endingDebit: ed, endingCredit: ec }
  return columns.map((col, i) => {
    if (i === 0) return '合计'
    if (col.property && map[col.property] !== undefined) return formatMoney(map[col.property])
    return ''
  })
}

// ========== Tab 3 总账 ==========
const queryGeneral = reactive({ period: '2025-06', startDate: '', endDate: '' })
const generalSearchItems = [
  { prop: 'period', label: '会计期间', type: 'select', span: 8, options: [
    { value: '2025-04', label: '2025-04' },
    { value: '2025-05', label: '2025-05' },
    { value: '2025-06', label: '2025-06' }
  ]}
]
const generalColumns = [
  { prop: 'subjectCode', label: '科目编码', width: 140, fixed: true },
  { prop: 'subjectName', label: '科目名称', minWidth: 200 },
  { prop: 'openingDebit', label: '期初借方', width: 130, slot: 'openingDebit', align: 'right' },
  { prop: 'openingCredit', label: '期初贷方', width: 130, slot: 'openingCredit', align: 'right' },
  { prop: 'periodDebit', label: '本期借方', width: 130, slot: 'periodDebit', align: 'right' },
  { prop: 'periodCredit', label: '本期贷方', width: 130, slot: 'periodCredit', align: 'right' },
  { prop: 'endingDebit', label: '期末借方', width: 130, slot: 'endingDebit', align: 'right' },
  { prop: 'endingCredit', label: '期末贷方', width: 130, slot: 'endingCredit', align: 'right' }
]
const generalData = ref([])
const generalLoading = ref(false)

async function loadGeneral() {
  generalLoading.value = true
  try {
    const res = await request({ url: '/api/finance/generalLedger/query', method: 'get', params: queryGeneral })
    generalData.value = res.data.list || []
  } finally {
    generalLoading.value = false
  }
}

function generalSummary({ columns, data }) {
  const opD = data.reduce((s, r) => s + (Number(r.openingDebit) || 0), 0)
  const opC = data.reduce((s, r) => s + (Number(r.openingCredit) || 0), 0)
  const pd = data.reduce((s, r) => s + (Number(r.periodDebit) || 0), 0)
  const pc = data.reduce((s, r) => s + (Number(r.periodCredit) || 0), 0)
  const map = {
    openingDebit: opD, openingCredit: opC,
    periodDebit: pd, periodCredit: pc,
    endingDebit: opD + pd, endingCredit: opC + pc
  }
  return columns.map((col, i) => {
    if (i === 0) return '合计'
    if (col.property && map[col.property] !== undefined) return formatMoney(map[col.property])
    return ''
  })
}

function formatMoney(v) {
  if (v === null || v === undefined || v === '') return '0.00'
  return Number(v).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

const MONEY_FIELDS = ['debitAmount', 'creditAmount', 'openingDebit', 'openingCredit', 'periodDebit', 'periodCredit', 'endingDebit', 'endingCredit']

function rowToCell(col, row) {
  const v = row[col.prop]
  if (MONEY_FIELDS.includes(col.prop)) return formatMoney(v)
  return v ?? ''
}

function exportExcel(columns, data, filename, title) {
  const headers = columns.map(c => c.label)
  const rows = data.map(row => columns.map(c => rowToCell(c, row)))
  const thead = '<tr>' + headers.map(h => `<th style="background:#f0f0f0">${h}</th>`).join('') + '</tr>'
  const tbody = rows.map(r => '<tr>' + r.map(c => `<td>${c}</td>`).join('') + '</tr>').join('')
  const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
<head><meta charset="utf-8"></head><body>
${title ? `<h2 style="text-align:center;font-family:SimSun">${title}</h2>` : ''}
<table border="1" style="border-collapse:collapse;font-family:SimSun">${thead}${tbody}</table>
</body></html>`
  const blob = new Blob(['\uFEFF' + html], { type: 'application/vnd.ms-excel;charset=utf-8' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `${filename}.xls`
  a.click()
  URL.revokeObjectURL(a.href)
  ElMessage.success('导出成功')
}

function handleExportClick() {
  if (activeTab.value === 'detail') {
    exportExcel(detailColumns, detailData.value, '明细账-' + queryDetail.period, `明细账 - 期间 ${queryDetail.period}`)
  } else if (activeTab.value === 'balance') {
    exportExcel(balanceColumns, balanceData.value, '科目余额表-' + queryBalance.period, `科目余额表 - 期间 ${queryBalance.period}`)
  } else if (activeTab.value === 'general') {
    exportExcel(generalColumns, generalData.value, '总账-' + queryGeneral.period, `总账 - 期间 ${queryGeneral.period}`)
  }
}

function handlePrintClick() {
  if (activeTab.value === 'detail') {
    printTable(detailColumns, detailData.value, `明细账 - 期间 ${queryDetail.period}`)
  } else if (activeTab.value === 'balance') {
    printTable(balanceColumns, balanceData.value, `科目余额表 - 期间 ${queryBalance.period}`)
  }
}

function printTable(columns, data, title) {
  const headers = columns.map(c => c.label)
  const rows = data.map(row => columns.map(c => rowToCell(c, row)))
  const style = `
    @page { size: A4 landscape; margin: 12mm; }
    body { font-family: SimSun, "宋体", serif; margin: 0; padding: 16px; color: #000; }
    h2 { text-align: center; margin: 0 0 16px; font-size: 18px; }
    table { border-collapse: collapse; width: 100%; font-size: 12px; }
    th, td { border: 1px solid #333; padding: 6px 8px; text-align: left; }
    th { background: #f0f0f0; font-weight: bold; }
  `
  const thead = '<tr>' + headers.map(h => `<th>${h}</th>`).join('') + '</tr>'
  const tbody = rows.map(r => '<tr>' + r.map(c => `<td>${c}</td>`).join('') + '</tr>').join('')
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>${title}</title><style>${style}</style></head><body>
    <h2>${title}</h2>
    <table><thead>${thead}</thead><tbody>${tbody}</tbody></table>
  </body></html>`

  const iframe = document.createElement('iframe')
  iframe.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden;'
  document.body.appendChild(iframe)
  const win = iframe.contentWindow
  const doc = win.document
  doc.open()
  doc.write(html)
  doc.close()

  const trigger = () => {
    try { win.focus(); win.print() } catch (e) { ElMessage.error('打印失败') }
    setTimeout(() => { if (iframe.parentNode) iframe.parentNode.removeChild(iframe) }, 1000)
  }
  if (doc.readyState === 'complete') trigger()
  else iframe.onload = trigger
}

// Tab 切换 + 搜索
function handleDetailSearch(p) { Object.assign(queryDetail, p, { pageNum: 1 }); loadDetail() }
function handleDetailReset() { Object.keys(queryDetail).forEach(k => { if (k !== 'pageNum' && k !== 'pageSize' && k !== 'subjectCode') queryDetail[k] = '2025-06' }); loadDetail() }
function handleDetailPageChange(p) { queryDetail.pageNum = p; loadDetail() }
function handleDetailSizeChange(s) { queryDetail.pageSize = s; queryDetail.pageNum = 1; loadDetail() }

function handleBalanceSearch(p) { Object.assign(queryBalance, p); loadBalance() }
function handleBalanceReset() { Object.keys(queryBalance).forEach(k => queryBalance[k] = ''); queryBalance.period = '2025-06'; loadBalance() }

function handleGeneralSearch(p) { Object.assign(queryGeneral, p); loadGeneral() }
function handleGeneralReset() { Object.keys(queryGeneral).forEach(k => queryGeneral[k] = ''); queryGeneral.period = '2025-06'; loadGeneral() }

watch(activeTab, (val) => {
  if (val === 'detail') loadDetail()
  else if (val === 'balance') loadBalance()
  else if (val === 'general') loadGeneral()
})

onMounted(() => loadDetail())
</script>

<style lang="scss" scoped>
.ledger-page {
  .ledger-tabs {
    background: #fff;
    border-radius: var(--border-radius-base);
  }
  .table-toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin: 16px 0;
    .toolbar-left { display: flex; gap: 10px; }
  }
  .subject-info { margin-bottom: 16px; }
  .money { font-family: monospace; font-weight: 500; }
  .money.debit { color: #67c23a; }
  .money.credit { color: #f56c6c; }
}
</style>
