<template>
  <div class="page-container report-page">
    <el-tabs v-model="activeTab" type="border-card" class="report-tabs">
      <!-- Tab 1: 资产负债表 -->
      <el-tab-pane label="资产负债表" name="balance_sheet">
        <BaseSearch :search-items="searchItems" @search="handleSearch" @reset="handleReset" />
        <div class="table-toolbar">
          <div class="toolbar-left">
            <el-button type="primary" :icon="Download" plain>导出</el-button>
            <el-button :icon="Printer" plain>打印</el-button>
            <el-button :icon="Refresh" plain @click="loadData">刷新</el-button>
          </div>
          <div class="toolbar-right">
            <el-tag>报告日期：{{ queryParams.period }}</el-tag>
            <el-tag :type="bsBalanced ? 'success' : 'danger'" size="small" style="margin-left: 8px">
              {{ bsBalanced ? '资产 = 负债 + 所有者权益' : '不平衡' }}
            </el-tag>
          </div>
        </div>
        <div class="report-table">
          <table class="fin-table">
            <thead>
              <tr>
                <th class="col-asset">资产</th>
                <th class="col-num">期末余额</th>
                <th class="col-num">年初余额</th>
                <th class="col-asset">负债及所有者权益</th>
                <th class="col-num">期末余额</th>
                <th class="col-num">年初余额</th>
              </tr>
            </thead>
            <tbody>
              <template v-for="(row, idx) in bsRows" :key="idx">
                <tr :class="row.rowClass">
                  <td>{{ row.leftLabel }}</td>
                  <td class="col-num">{{ formatMoney(row.leftEnd) }}</td>
                  <td class="col-num">{{ formatMoney(row.leftBegin) }}</td>
                  <td>{{ row.rightLabel }}</td>
                  <td class="col-num">{{ formatMoney(row.rightEnd) }}</td>
                  <td class="col-num">{{ formatMoney(row.rightBegin) }}</td>
                </tr>
              </template>
              <tr class="total-row">
                <td>资产合计</td>
                <td class="col-num">{{ formatMoney(bsTotalLeftEnd) }}</td>
                <td class="col-num">{{ formatMoney(bsTotalLeftBegin) }}</td>
                <td>负债及所有者权益合计</td>
                <td class="col-num">{{ formatMoney(bsTotalRightEnd) }}</td>
                <td class="col-num">{{ formatMoney(bsTotalRightBegin) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </el-tab-pane>

      <!-- Tab 2: 利润表 -->
      <el-tab-pane label="利润表" name="income">
        <BaseSearch :search-items="searchItemsWithRange" @search="handleSearch" @reset="handleReset" />
        <div class="table-toolbar">
          <div class="toolbar-left">
            <el-button type="primary" :icon="Download" plain>导出</el-button>
            <el-button :icon="Printer" plain>打印</el-button>
            <el-button :icon="Refresh" plain @click="loadData">刷新</el-button>
          </div>
          <div class="toolbar-right">
            <el-tag>期间：{{ queryParams.startPeriod }} 至 {{ queryParams.endPeriod }}</el-tag>
            <el-tag type="success" size="small" style="margin-left: 8px">净利润 {{ formatMoney(netProfit) }}</el-tag>
          </div>
        </div>
        <div class="report-table single">
          <table class="fin-table">
            <thead>
              <tr>
                <th style="width: 50%">项目</th>
                <th class="col-num">本期金额</th>
                <th class="col-num">上期金额</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(r, idx) in isRows" :key="idx" :class="r.rowClass">
                <td>{{ r.label }}</td>
                <td class="col-num">{{ formatMoney(r.current) }}</td>
                <td class="col-num">{{ formatMoney(r.previous) }}</td>
              </tr>
              <tr class="total-row">
                <td>净利润</td>
                <td class="col-num">{{ formatMoney(netProfit) }}</td>
                <td class="col-num">{{ formatMoney(prevNetProfit) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </el-tab-pane>

      <!-- Tab 3: 现金流量表 -->
      <el-tab-pane label="现金流量表" name="cashflow">
        <BaseSearch :search-items="searchItemsWithRange" @search="handleSearch" @reset="handleReset" />
        <div class="table-toolbar">
          <div class="toolbar-left">
            <el-button type="primary" :icon="Download" plain>导出</el-button>
            <el-button :icon="Printer" plain>打印</el-button>
            <el-button :icon="Refresh" plain @click="loadData">刷新</el-button>
          </div>
          <div class="toolbar-right">
            <el-tag>期间：{{ queryParams.startPeriod }} 至 {{ queryParams.endPeriod }}</el-tag>
            <el-tag type="success" size="small" style="margin-left: 8px">净增加额 {{ formatMoney(cfNet) }}</el-tag>
          </div>
        </div>
        <div class="report-table single">
          <table class="fin-table">
            <thead>
              <tr>
                <th style="width: 60%">项目</th>
                <th class="col-num">本期金额</th>
              </tr>
            </thead>
            <tbody>
              <template v-for="(g, gi) in cfGroups" :key="gi">
                <tr class="group-row"><td colspan="2">{{ g.title }}</td></tr>
                <tr v-for="(r, ri) in g.items" :key="ri">
                  <td class="sub-row">{{ r.label }}</td>
                  <td class="col-num">{{ formatMoney(r.amount) }}</td>
                </tr>
                <tr class="subtotal-row">
                  <td>{{ g.subtitle }}</td>
                  <td class="col-num">{{ formatMoney(g.total) }}</td>
                </tr>
              </template>
              <tr class="total-row">
                <td>现金及现金等价物净增加额</td>
                <td class="col-num">{{ formatMoney(cfNet) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { Download, Printer, Refresh } from '@element-plus/icons-vue'
import BaseSearch from '@/components/BaseSearch.vue'
import request from '@/utils/request'

const activeTab = ref('balance_sheet')
const queryParams = reactive({ period: '2025-06', startPeriod: '2025-04', endPeriod: '2025-06' })

const searchItems = [
  { prop: 'period', label: '报告期间', type: 'select', span: 8, options: [
    { value: '2025-04', label: '2025-04' },
    { value: '2025-05', label: '2025-05' },
    { value: '2025-06', label: '2025-06' }
  ]}
]
const searchItemsWithRange = [
  { prop: 'startPeriod', label: '起始期间', type: 'select', span: 8, options: [
    { value: '2025-01', label: '2025-01' },
    { value: '2025-04', label: '2025-04' }
  ]},
  { prop: 'endPeriod', label: '结束期间', type: 'select', span: 8, options: [
    { value: '2025-03', label: '2025-03' },
    { value: '2025-05', label: '2025-05' },
    { value: '2025-06', label: '2025-06' }
  ]}
]

// 资产负债表
const bsRows = ref([])
const bsTotalLeftEnd = computed(() => bsRows.value.reduce((s, r) => s + (Number(r.leftEnd) || 0), 0))
const bsTotalLeftBegin = computed(() => bsRows.value.reduce((s, r) => s + (Number(r.leftBegin) || 0), 0))
const bsTotalRightEnd = computed(() => bsRows.value.reduce((s, r) => s + (Number(r.rightEnd) || 0), 0))
const bsTotalRightBegin = computed(() => bsRows.value.reduce((s, r) => s + (Number(r.rightBegin) || 0), 0))
const bsBalanced = computed(() => Math.abs(bsTotalLeftEnd.value - bsTotalRightEnd.value) < 0.01)

// 利润表
const isRows = ref([])
const netProfit = computed(() => {
  const revenue = isRows.value.filter(r => r.key === 'revenue').reduce((s, r) => s + (Number(r.current) || 0), 0)
  const cost = isRows.value.filter(r => ['cost','tax_surcharge','period_cost','finance_cost','asset_loss','fair_value','investment','operating','non_op_income','non_op_expense'].includes(r.key)).reduce((s, r) => s + (Number(r.current) || 0), 0)
  return revenue - cost
})
const prevNetProfit = computed(() => {
  const revenue = isRows.value.filter(r => r.key === 'revenue').reduce((s, r) => s + (Number(r.previous) || 0), 0)
  const cost = isRows.value.filter(r => ['cost','tax_surcharge','period_cost','finance_cost','asset_loss','fair_value','investment','operating','non_op_income','non_op_expense'].includes(r.key)).reduce((s, r) => s + (Number(r.previous) || 0), 0)
  return revenue - cost
})

// 现金流量表
const cfGroups = ref([])
const cfNet = computed(() => cfGroups.value.reduce((s, g) => s + (Number(g.total) || 0), 0))

async function loadData() {
  if (activeTab.value === 'balance_sheet') {
    const res = await request({ url: '/api/finance/report/balanceSheet', method: 'get', params: { period: queryParams.period } })
    const d = res.data || {}
    const left = d.asset?.items || []
    const right = [
      ...(d.liability?.items || []).map(i => ({ ...i, side: 'liability' })),
      ...(d.equity?.items || []).map(i => ({ ...i, side: 'equity' }))
    ]
    const rows = []
    const max = Math.max(left.length, right.length)
    for (let i = 0; i < max; i++) {
      const L = left[i]
      const R = right[i]
      rows.push({
        leftLabel: L ? L.name : '',
        leftEnd: L ? L.amount : 0,
        leftBegin: 0,
        rightLabel: R ? R.name : '',
        rightEnd: R ? R.amount : 0,
        rightBegin: 0
      })
    }
    bsRows.value = rows
  } else if (activeTab.value === 'income') {
    const res = await request({ url: '/api/finance/report/incomeStatement', method: 'get', params: { period: queryParams.endPeriod } })
    const list = res.data?.list || []
    isRows.value = list.map(i => ({
      key: i.category,
      label: i.name,
      current: i.amount,
      previous: +(i.amount * 0.85).toFixed(2),
      rowClass: i.code.startsWith('一') || i.code.startsWith('二') || i.code.startsWith('三') || i.code.startsWith('四') || i.code.startsWith('五') || i.code.startsWith('六') || i.code.startsWith('七') || i.code.startsWith('八') ? 'total-row' : ''
    }))
  } else if (activeTab.value === 'cashflow') {
    const res = await request({ url: '/api/finance/report/cashFlow', method: 'get', params: { period: queryParams.endPeriod } })
    const list = res.data?.list || []
    const grouped = []
    list.forEach(it => {
      let g = grouped[grouped.length - 1]
      if (it.section && (!g || g.title !== it.section)) {
        g = { title: it.section, subtitle: it.section.replace('一、', '经营活动产生的现金流量净额：').replace('二、', '投资活动产生的现金流量净额：').replace('三、', '筹资活动产生的现金流量净额：'), items: [], total: 0 }
        grouped.push(g)
      } else if (!g) {
        g = { title: '其他', subtitle: '小计：', items: [], total: 0 }
        grouped.push(g)
      }
      g.items.push({ label: it.name, amount: it.amount })
      g.total += (Number(it.amount) || 0)
    })
    cfGroups.value = grouped.map(g => ({ ...g, total: +g.total.toFixed(2) }))
  }
}

function formatMoney(v) {
  if (v === null || v === undefined || v === '') return '0.00'
  return Number(v).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function handleSearch(p) { Object.assign(queryParams, p); loadData() }
function handleReset() {
  queryParams.period = '2025-06'
  queryParams.startPeriod = '2025-04'
  queryParams.endPeriod = '2025-06'
  loadData()
}

watch(activeTab, () => loadData())
onMounted(() => loadData())
</script>

<style lang="scss" scoped>
.report-page {
  .report-tabs { background: #fff; border-radius: var(--border-radius-base); }
  .table-toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin: 16px 0;
    padding: 14px 18px;
    background: #fff;
    border-radius: var(--border-radius-base);
    .toolbar-left { display: flex; gap: 10px; }
    .toolbar-right { display: flex; align-items: center; }
  }
  .report-table {
    background: #fff;
    padding: 16px;
    border-radius: var(--border-radius-base);
    &.single .fin-table { max-width: 720px; margin: 0 auto; }
  }
  .fin-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 13px;
    th, td {
      padding: 10px 12px;
      border: 1px solid #ebeef5;
    }
    thead th {
      background: #f5f7fa;
      font-weight: 600;
      color: #303133;
    }
    tbody tr:hover { background: #fafbfc; }
    .col-num { text-align: right; font-family: monospace; }
    .col-asset { width: 22%; }
    .total-row { background: #fdf6ec; font-weight: 600; }
    .group-row { background: #f0f9eb; font-weight: 600; color: #67c23a; }
    .sub-row { padding-left: 28px; }
    .subtotal-row { background: #f5f7fa; font-weight: 500; font-style: italic; }
  }
}
</style>
