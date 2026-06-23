<template>
  <div class="page-container aging-page">
    <div class="summary-cards">
      <el-row :gutter="12">
        <el-col :span="6">
          <div class="metric-card">
            <div class="metric-label">应收总金额</div>
            <div class="metric-value money">{{ formatMoney(summary.totalAmount) }}</div>
            <div class="metric-extra">共 {{ summary.totalCount }} 笔</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="metric-card">
            <div class="metric-label">未收金额</div>
            <div class="metric-value money warn">{{ formatMoney(summary.totalRemain) }}</div>
            <div class="metric-extra">占总额 {{ totalRemainRate }}%</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="metric-card">
            <div class="metric-label">逾期金额</div>
            <div class="metric-value money danger">{{ formatMoney(overdueAmount) }}</div>
            <div class="metric-extra">{{ overdueCount }} 笔逾期</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="metric-card">
            <div class="metric-label">周转天数</div>
            <div class="metric-value money primary">{{ avgDays }} 天</div>
            <div class="metric-extra">DSO 应收账款周转</div>
          </div>
        </el-col>
      </el-row>
    </div>

    <el-tabs v-model="activeTab" type="border-card" class="aging-tabs">
      <!-- 账龄分布 -->
      <el-tab-pane label="账龄分布" name="aging">
        <div class="aging-chart" v-if="bucketData.length">
          <div v-for="b in bucketData" :key="b.bucket" class="aging-bar">
            <div class="aging-bar-label">
              <span>{{ b.bucket }} 天</span>
              <span class="aging-bar-count">{{ b.count }} 笔 · {{ formatMoney(b.totalRemain) }}</span>
            </div>
            <div class="aging-bar-track">
              <div
                class="aging-bar-fill"
                :class="getBucketClass(b.bucket)"
                :style="{ width: getBarWidth(b.totalRemain) + '%' }"
              >
                <span v-if="getBarWidth(b.totalRemain) > 10">{{ formatMoney(b.totalRemain) }}</span>
              </div>
            </div>
          </div>
        </div>
        <BaseTable
          :columns="bucketColumns"
          :table-data="bucketData"
          :show-summary="true"
          :summary-method="bucketSummary"
        >
          <template #totalAmount="{ row }">{{ formatMoney(row.totalAmount) }}</template>
          <template #totalRemain="{ row }">{{ formatMoney(row.totalRemain) }}</template>
        </BaseTable>
      </el-tab-pane>

      <!-- 客户统计 -->
      <el-tab-pane label="客户统计" name="customer">
        <BaseTable
          :columns="customerColumns"
          :table-data="customerData"
          :show-summary="true"
          :summary-method="customerSummary"
        >
          <template #totalAmount="{ row }">{{ formatMoney(row.totalAmount) }}</template>
          <template #totalRemain="{ row }">{{ formatMoney(row.totalRemain) }}</template>
        </BaseTable>
      </el-tab-pane>

      <!-- 明细列表 -->
      <el-tab-pane label="明细列表" name="detail">
        <BaseSearch :search-items="searchItems" @search="handleSearch" @reset="handleReset" />
        <div class="table-toolbar">
          <div class="toolbar-left">
            <el-button type="primary" :icon="Download" plain>导出</el-button>
            <el-button :icon="Refresh" plain @click="loadData">刷新</el-button>
          </div>
        </div>
        <BaseTable
          :columns="detailColumns"
          :table-data="detailData"
          :total="detailTotal"
          :current-page.sync="query.pageNum"
          :page-size.sync="query.pageSize"
          :show-index="true"
          @current-change="p => { query.pageNum = p; loadData() }"
          @size-change="s => { query.pageSize = s; query.pageNum = 1; loadData() }"
        >
          <template #amount="{ row }">{{ formatMoney(row.amount) }}</template>
          <template #receivedAmount="{ row }">{{ formatMoney(row.receivedAmount) }}</template>
          <template #remainAmount="{ row }">
            <span :class="row.remainAmount > 0 ? 'money danger' : 'money success'">
              {{ formatMoney(row.remainAmount) }}
            </span>
          </template>
          <template #bucket="{ row }">
            <el-tag :type="getBucketTagType(row.bucket)" size="small">{{ row.bucket }} 天</el-tag>
          </template>
          <template #status="{ row }">
            <el-tag v-if="row.status === 'paid'" type="success" size="small">已收清</el-tag>
            <el-tag v-else-if="row.status === 'partial'" type="warning" size="small">部分收</el-tag>
            <el-tag v-else-if="row.status === 'overdue'" type="danger" size="small">已逾期</el-tag>
            <el-tag v-else type="info" size="small">未收</el-tag>
          </template>
        </BaseTable>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { Download, Refresh } from '@element-plus/icons-vue'
import BaseSearch from '@/components/BaseSearch.vue'
import BaseTable from '@/components/BaseTable.vue'
import request from '@/utils/request'

const activeTab = ref('aging')
const query = reactive({ pageNum: 1, pageSize: 20, customerName: '', bucket: '' })

const summary = ref({ totalCount: 0, totalAmount: 0, totalRemain: 0 })
const bucketData = ref([])
const customerData = ref([])
const detailData = ref([])
const detailTotal = ref(0)

const overdueAmount = computed(() => {
  return detailData.value.filter(d => d.days > 30).reduce((s, d) => s + d.remainAmount, 0) || 0
})
const overdueCount = computed(() => detailData.value.filter(d => d.days > 30 && d.remainAmount > 0).length || 0)
const totalRemainRate = computed(() => summary.value.totalAmount > 0 ? ((summary.value.totalRemain / summary.value.totalAmount) * 100).toFixed(1) : 0)
const avgDays = computed(() => {
  if (!detailData.value.length) return 0
  const totalDays = detailData.value.reduce((s, d) => s + d.days, 0)
  return Math.round(totalDays / detailData.value.length)
})

const searchItems = [
  { prop: 'customerName', label: '客户名称', type: 'input', span: 8 },
  { prop: 'bucket', label: '账龄', type: 'select', span: 8, options: [
    { value: '', label: '全部' },
    { value: '0-30', label: '0-30 天' },
    { value: '31-60', label: '31-60 天' },
    { value: '61-90', label: '61-90 天' },
    { value: '91-180', label: '91-180 天' },
    { value: '180+', label: '180 天以上' }
  ]}
]

const bucketColumns = [
  { prop: 'bucket', label: '账龄区间', width: 150 },
  { prop: 'count', label: '笔数', width: 100, align: 'center' },
  { prop: 'totalAmount', label: '应收金额', width: 160, slot: 'totalAmount', align: 'right' },
  { prop: 'totalRemain', label: '未收金额', width: 160, slot: 'totalRemain', align: 'right' },
  { prop: 'ratio', label: '占比', width: 120, align: 'center' }
]

const customerColumns = [
  { prop: 'customerName', label: '客户名称', minWidth: 200 },
  { prop: 'count', label: '笔数', width: 100, align: 'center' },
  { prop: 'totalAmount', label: '应收金额', width: 160, slot: 'totalAmount', align: 'right' },
  { prop: 'totalRemain', label: '未收金额', width: 160, slot: 'totalRemain', align: 'right' },
  { prop: 'ratio', label: '占比', width: 120, align: 'center' }
]

const detailColumns = [
  { prop: 'receivableNo', label: '应收单号', width: 150, fixed: true },
  { prop: 'customerName', label: '客户', width: 150 },
  { prop: 'orderNo', label: '订单号', width: 150 },
  { prop: 'issueDate', label: '发生日期', width: 110 },
  { prop: 'dueDate', label: '到期日', width: 110 },
  { prop: 'amount', label: '应收金额', width: 130, slot: 'amount', align: 'right' },
  { prop: 'receivedAmount', label: '已收金额', width: 130, slot: 'receivedAmount', align: 'right' },
  { prop: 'remainAmount', label: '未收金额', width: 130, slot: 'remainAmount', align: 'right' },
  { prop: 'days', label: '账龄天数', width: 100, align: 'center' },
  { prop: 'bucket', label: '账龄', width: 110, slot: 'bucket', align: 'center' },
  { prop: 'status', label: '状态', width: 100, slot: 'status', align: 'center' }
]

async function loadData() {
  const [agingRes, custRes] = await Promise.all([
    request({ url: '/api/finance/receivable/aging', method: 'get', params: { customerName: query.customerName } }),
    request({ url: '/api/finance/receivable/customerStat', method: 'get' })
  ])
  const aging = agingRes.data || {}
  summary.value = aging.summary || { totalCount: 0, totalAmount: 0, totalRemain: 0 }
  const allBuckets = aging.buckets || []
  let data = [...(aging.details || [])]
  if (query.bucket) data = data.filter(d => d.bucket === query.bucket)
  detailTotal.value = data.length
  const start = (query.pageNum - 1) * query.pageSize
  detailData.value = data.slice(start, start + query.pageSize)
  bucketData.value = allBuckets.map(b => ({ ...b, ratio: aging.summary.totalRemain > 0 ? ((b.totalRemain / aging.summary.totalRemain) * 100).toFixed(1) + '%' : '0%' }))
  customerData.value = (custRes.data.list || []).map(c => ({ ...c, ratio: aging.summary.totalRemain > 0 ? ((c.totalRemain / aging.summary.totalRemain) * 100).toFixed(1) + '%' : '0%' }))
}

function getBarWidth(v) {
  const max = Math.max(...bucketData.value.map(b => b.totalRemain), 1)
  return (v / max) * 100
}
function getBucketClass(b) {
  return { '0-30': 'b-low', '31-60': 'b-mid', '61-90': 'b-high', '91-180': 'b-vhigh', '180+': 'b-danger' }[b] || ''
}
function getBucketTagType(b) {
  return { '0-30': 'success', '31-60': '', '61-90': 'warning', '91-180': 'danger', '180+': 'danger' }[b] || ''
}
function bucketSummary({ columns, data }) {
  const totalCount = data.reduce((s, r) => s + (Number(r.count) || 0), 0)
  const totalAmount = data.reduce((s, r) => s + (Number(r.totalAmount) || 0), 0)
  const totalRemain = data.reduce((s, r) => s + (Number(r.totalRemain) || 0), 0)
  const map = { count: totalCount, totalAmount: formatMoney(totalAmount), totalRemain: formatMoney(totalRemain), ratio: '100%' }
  return columns.map((col, i) => {
    if (i === 0) return '合计'
    if (col.property && map[col.property] !== undefined) return map[col.property]
    return ''
  })
}
function customerSummary({ columns, data }) {
  const totalCount = data.reduce((s, r) => s + (Number(r.count) || 0), 0)
  const totalAmount = data.reduce((s, r) => s + (Number(r.totalAmount) || 0), 0)
  const totalRemain = data.reduce((s, r) => s + (Number(r.totalRemain) || 0), 0)
  const map = { count: totalCount, totalAmount: formatMoney(totalAmount), totalRemain: formatMoney(totalRemain), ratio: '100%' }
  return columns.map((col, i) => {
    if (i === 0) return '合计'
    if (col.property && map[col.property] !== undefined) return map[col.property]
    return ''
  })
}
function formatMoney(v) {
  if (v === null || v === undefined || v === '') return '0.00'
  return Number(v).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
function handleSearch(p) { Object.assign(query, p, { pageNum: 1 }); loadData() }
function handleReset() { query.customerName = ''; query.bucket = ''; loadData() }

onMounted(() => loadData())
</script>

<style lang="scss" scoped>
.aging-page {
  .summary-cards { margin-bottom: 16px; }
  .metric-card {
    padding: 20px;
    background: #fff;
    border-radius: var(--border-radius-base);
    text-align: center;
    .metric-label { font-size: 13px; color: #909399; }
    .metric-value { font-size: 24px; font-weight: 600; margin: 8px 0; font-family: monospace; }
    .metric-extra { font-size: 12px; color: #909399; }
  }
  .aging-tabs { background: #fff; border-radius: var(--border-radius-base); padding: 16px; }
  .table-toolbar { display: flex; gap: 10px; margin: 16px 0; }
  .aging-chart {
    margin-bottom: 20px;
    .aging-bar { margin-bottom: 12px; }
    .aging-bar-label {
      display: flex;
      justify-content: space-between;
      margin-bottom: 4px;
      font-size: 13px;
      .aging-bar-count { color: #909399; }
    }
    .aging-bar-track {
      height: 28px;
      background: #f5f7fa;
      border-radius: 4px;
      overflow: hidden;
      .aging-bar-fill {
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: flex-end;
        padding: 0 12px;
        color: #fff;
        font-size: 12px;
        font-weight: 500;
        transition: width 0.3s;
        &.b-low { background: linear-gradient(90deg, #67c23a, #85ce61); }
        &.b-mid { background: linear-gradient(90deg, #409eff, #66b1ff); }
        &.b-high { background: linear-gradient(90deg, #e6a23c, #ebb563); }
        &.b-vhigh { background: linear-gradient(90deg, #f56c6c, #f89898); }
        &.b-danger { background: linear-gradient(90deg, #c45656, #d36f6f); }
      }
    }
  }
  .money { font-family: monospace; font-weight: 500; }
  .money.warn { color: #e6a23c; }
  .money.danger { color: #f56c6c; }
  .money.success { color: #67c23a; }
  .money.primary { color: #409eff; }
}
</style>
