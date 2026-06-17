<template>
  <div class="page-container ledger-page">
    <el-tabs v-model="activeTab" type="border-card" class="ledger-tabs">
      <!-- Tab 1: 明细账 -->
      <el-tab-pane label="明细账" name="detail">
        <BaseSearch :search-items="detailSearchItems" @search="handleDetailSearch" @reset="handleDetailReset" />
        <div class="table-toolbar">
          <div class="toolbar-left">
            <el-button type="primary" :icon="Download" plain>导出</el-button>
            <el-button :icon="Printer" plain>打印</el-button>
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
            <el-button type="primary" :icon="Download" plain>导出</el-button>
            <el-button :icon="Printer" plain>打印</el-button>
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
            <el-button type="primary" :icon="Download" plain>导出</el-button>
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
  return [
    { voucherDate: '合计', debitAmount: formatMoney(sumDebit), creditAmount: formatMoney(sumCredit) }
  ]
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
  const sum = (i) => data.reduce((s, r) => s + (Number(r[Object.keys(r)[i]]) || 0), 0)
  const opD = data.reduce((s, r) => s + (Number(r.openingDebit) || 0), 0)
  const opC = data.reduce((s, r) => s + (Number(r.openingCredit) || 0), 0)
  const pd = data.reduce((s, r) => s + (Number(r.periodDebit) || 0), 0)
  const pc = data.reduce((s, r) => s + (Number(r.periodCredit) || 0), 0)
  return [
    { subjectCode: '合计', openingDebit: formatMoney(opD), openingCredit: formatMoney(opC), periodDebit: formatMoney(pd), periodCredit: formatMoney(pc) }
  ]
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
  { prop: 'endingDebit', label: '期末借方', width: 130, align: 'right' },
  { prop: 'endingCredit', label: '期末贷方', width: 130, align: 'right' }
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
  return [
    { subjectCode: '合计', openingDebit: formatMoney(opD), openingCredit: formatMoney(opC), periodDebit: formatMoney(pd), periodCredit: formatMoney(pc), endingDebit: formatMoney(opD + pd), endingCredit: formatMoney(opC + pc) }
  ]
}

function formatMoney(v) {
  if (v === null || v === undefined || v === '') return '0.00'
  return Number(v).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
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
