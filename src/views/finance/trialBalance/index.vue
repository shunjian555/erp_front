<template>
  <div class="page-container trial-balance-page">
    <BaseSearch :search-items="searchItems" @search="handleSearch" @reset="handleReset" />
    <div class="table-toolbar">
      <div class="toolbar-left">
        <el-button type="primary" :icon="Download" plain>导出</el-button>
        <el-button :icon="Printer" plain>打印</el-button>
      </div>
      <div class="toolbar-right">
        <el-radio-group v-model="queryParams.level" size="small" @change="loadData">
          <el-radio-button label="all">全部</el-radio-button>
          <el-radio-button label="detail">明细</el-radio-button>
          <el-radio-button label="leaf">末级</el-radio-button>
        </el-radio-group>
      </div>
    </div>

    <div class="balance-summary">
      <el-row :gutter="12">
        <el-col :span="6">
          <div class="metric-card">
            <div class="metric-label">期初借方</div>
            <div class="metric-value money debit">{{ formatMoney(totalOpeningDebit) }}</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="metric-card">
            <div class="metric-label">期初贷方</div>
            <div class="metric-value money credit">{{ formatMoney(totalOpeningCredit) }}</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="metric-card">
            <div class="metric-label">本期借方</div>
            <div class="metric-value money debit">{{ formatMoney(totalPeriodDebit) }}</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="metric-card">
            <div class="metric-label">本期贷方</div>
            <div class="metric-value money credit">{{ formatMoney(totalPeriodCredit) }}</div>
          </div>
        </el-col>
      </el-row>
      <div class="balance-status" :class="{ balanced: isBalanced, unbalanced: !isBalanced }">
        <el-icon :size="20">
          <component :is="isBalanced ? CircleCheck : WarningFilled" />
        </el-icon>
        <span>借贷平衡检查：</span>
        <strong>{{ isBalanced ? '平衡（试算通过）' : '不平衡（试算失败）' }}</strong>
        <span v-if="!isBalanced" class="diff">差额：{{ formatMoney(Math.abs(totalOpeningDebit + totalPeriodDebit - totalOpeningCredit - totalPeriodCredit)) }}</span>
      </div>
    </div>

    <BaseTable
      :columns="columns"
      :table-data="tableData"
      :loading="loading"
      :total="total"
      :show-summary="true"
      :summary-method="summaryMethod"
      :show-index="true"
    >
      <template #openingDebit="{ row }">{{ formatMoney(row.openingDebit) }}</template>
      <template #openingCredit="{ row }">{{ formatMoney(row.openingCredit) }}</template>
      <template #periodDebit="{ row }">{{ formatMoney(row.periodDebit) }}</template>
      <template #periodCredit="{ row }">{{ formatMoney(row.periodCredit) }}</template>
      <template #endingDebit="{ row }">{{ formatMoney(row.endingDebit) }}</template>
      <template #endingCredit="{ row }">{{ formatMoney(row.endingCredit) }}</template>
    </BaseTable>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { Download, Printer, CircleCheck, WarningFilled } from '@element-plus/icons-vue'
import BaseSearch from '@/components/BaseSearch.vue'
import BaseTable from '@/components/BaseTable.vue'
import request from '@/utils/request'

const searchItems = [
  { prop: 'period', label: '会计期间', type: 'select', span: 8, options: [
    { value: '2025-04', label: '2025-04' },
    { value: '2025-05', label: '2025-05' },
    { value: '2025-06', label: '2025-06' }
  ]}
]
const queryParams = reactive({ period: '2025-06', level: 'all' })

const columns = [
  { prop: 'subjectCode', label: '科目编码', width: 140, fixed: true },
  { prop: 'subjectName', label: '科目名称', minWidth: 200 },
  { prop: 'category', label: '类别', width: 100 },
  { prop: 'openingDebit', label: '期初借方', width: 140, slot: 'openingDebit', align: 'right' },
  { prop: 'openingCredit', label: '期初贷方', width: 140, slot: 'openingCredit', align: 'right' },
  { prop: 'periodDebit', label: '本期借方', width: 140, slot: 'periodDebit', align: 'right' },
  { prop: 'periodCredit', label: '本期贷方', width: 140, slot: 'periodCredit', align: 'right' },
  { prop: 'endingDebit', label: '期末借方', width: 140, slot: 'endingDebit', align: 'right' },
  { prop: 'endingCredit', label: '期末贷方', width: 140, slot: 'endingCredit', align: 'right' }
]

const tableData = ref([])
const total = ref(0)
const loading = ref(false)

const totalOpeningDebit = computed(() => tableData.value.reduce((s, r) => s + (Number(r.openingDebit) || 0), 0))
const totalOpeningCredit = computed(() => tableData.value.reduce((s, r) => s + (Number(r.openingCredit) || 0), 0))
const totalPeriodDebit = computed(() => tableData.value.reduce((s, r) => s + (Number(r.periodDebit) || 0), 0))
const totalPeriodCredit = computed(() => tableData.value.reduce((s, r) => s + (Number(r.periodCredit) || 0), 0))
const isBalanced = computed(() => {
  const diff = (totalOpeningDebit.value + totalPeriodDebit.value) - (totalOpeningCredit.value + totalPeriodCredit.value)
  return Math.abs(diff) < 0.01
})

async function loadData() {
  loading.value = true
  try {
    const res = await request({ url: '/api/finance/trialBalance/query', method: 'get', params: queryParams })
    tableData.value = res.data.list || []
    total.value = res.data.total || 0
  } finally {
    loading.value = false
  }
}

function summaryMethod({ columns }) {
  const map = {
    openingDebit: formatMoney(totalOpeningDebit.value),
    openingCredit: formatMoney(totalOpeningCredit.value),
    periodDebit: formatMoney(totalPeriodDebit.value),
    periodCredit: formatMoney(totalPeriodCredit.value),
    endingDebit: formatMoney(totalOpeningDebit.value + totalPeriodDebit.value),
    endingCredit: formatMoney(totalOpeningCredit.value + totalPeriodCredit.value)
  }
  return columns.map((col, i) => {
    if (i === 0) return '合计'
    if (col.property && map[col.property]) return map[col.property]
    return ''
  })
}

function formatMoney(v) {
  if (v === null || v === undefined || v === '') return '0.00'
  return Number(v).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function handleSearch(p) { Object.assign(queryParams, p); loadData() }
function handleReset() { queryParams.period = '2025-06'; loadData() }

onMounted(() => loadData())
</script>

<style lang="scss" scoped>
.trial-balance-page {
  .table-toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
    padding: 14px 18px;
    background: #fff;
    border-radius: var(--border-radius-base);
    .toolbar-left { display: flex; gap: 10px; }
  }
  .balance-summary {
    margin-bottom: 16px;
    .metric-card {
      padding: 16px;
      background: #fff;
      border-radius: var(--border-radius-base);
      text-align: center;
      .metric-label { font-size: 12px; color: #909399; margin-bottom: 6px; }
      .metric-value { font-size: 20px; font-weight: 600; }
    }
  }
  .balance-status {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 12px;
    padding: 12px 16px;
    border-radius: var(--border-radius-base);
    font-size: 14px;
    &.balanced { background: #f0f9eb; color: #67c23a; }
    &.unbalanced { background: #fef0f0; color: #f56c6c; }
    .diff { margin-left: 12px; font-family: monospace; }
  }
  .money { font-family: monospace; font-weight: 500; }
  .money.debit { color: #67c23a; }
  .money.credit { color: #f56c6c; }
}
</style>
