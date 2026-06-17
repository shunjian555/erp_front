<template>
  <div class="page-container bi-page">
    <div class="hero-card">
      <el-icon :size="32" color="#fff"><Connection /></el-icon>
      <div class="hero-content">
        <div class="hero-title">业务-财务一体化</div>
        <div class="hero-sub">业务单据 → 凭证自动集成 · 单据追溯 · 凭证来源链路</div>
      </div>
      <div class="hero-stats">
        <div class="hs-item">
          <div class="hs-value">{{ totalDocs }}</div>
          <div class="hs-label">业务单据</div>
        </div>
        <div class="hs-item">
          <div class="hs-value">{{ generatedCount }}</div>
          <div class="hs-label">已生成凭证</div>
        </div>
        <div class="hs-item">
          <div class="hs-value text-warn">{{ pendingCount }}</div>
          <div class="hs-label">待生成</div>
        </div>
        <div class="hs-item">
          <div class="hs-value">{{ matchRate }}%</div>
          <div class="hs-label">集成率</div>
        </div>
      </div>
    </div>

    <el-tabs v-model="activeTab" type="border-card" class="bi-tabs">
      <!-- Tab 1: 业务单据列表 -->
      <el-tab-pane label="业务单据" name="docs">
        <BaseSearch :search-items="searchItems" @search="handleSearch" @reset="handleReset" />
        <div class="table-toolbar">
          <div class="toolbar-left">
            <el-button type="primary" :icon="Refresh" @click="loadData">刷新</el-button>
            <el-button type="success" :icon="VideoPlay" :disabled="!selectedRows.length" @click="handleBatchGenerate">
              批量生成凭证（{{ selectedRows.length }}）
            </el-button>
            <el-button :icon="Download" plain>导出</el-button>
          </div>
        </div>
        <BaseTable
          :columns="columns"
          :table-data="tableData"
          :loading="loading"
          :total="total"
          :current-page.sync="query.pageNum"
          :page-size.sync="query.pageSize"
          :show-index="true"
          :show-selection="true"
          @selection-change="rows => selectedRows = rows"
          @current-change="p => { query.pageNum = p; loadData() }"
          @size-change="s => { query.pageSize = s; query.pageNum = 1; loadData() }"
        >
          <template #bizType="{ row }">
            <el-tag :type="bizTypeTagType(row.bizType)">{{ bizTypeName(row.bizType) }}</el-tag>
          </template>
          <template #amount="{ row }">
            <span class="money">{{ formatMoney(row.amount) }}</span>
          </template>
          <template #status="{ row }">
            <el-tag v-if="row.status === 'generated'" type="success" size="small">
              <el-icon style="vertical-align: middle"><CircleCheckFilled /></el-icon>
              已生成
            </el-tag>
            <el-tag v-else type="warning" size="small">
              <el-icon style="vertical-align: middle"><WarningFilled /></el-icon>
              待生成
            </el-tag>
          </template>
          <template #voucherNo="{ row }">
            <span v-if="row.voucherNo" class="voucher-link" @click="openTraceDialog(row)">{{ row.voucherNo }}</span>
            <span v-else class="text-muted">—</span>
          </template>
          <template #operation="{ row }">
            <el-button v-if="row.status === 'pending'" type="primary" link size="small" @click="openGenerateDialog(row)">生成凭证</el-button>
            <el-button v-else type="info" link size="small" @click="openTraceDialog(row)">追溯</el-button>
          </template>
        </BaseTable>
      </el-tab-pane>

      <!-- Tab 2: 凭证链路追溯 -->
      <el-tab-pane label="凭证追溯" name="trace">
        <el-card>
          <template #header>
            <div class="trace-header">
              <span>凭证链路追溯（输入凭证号查询）</span>
            </div>
          </template>
          <el-form :model="traceQuery" inline>
            <el-form-item label="凭证号">
              <el-input v-model="traceQuery.voucherNo" placeholder="如：记-20250605-002" style="width: 300px" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" :icon="Search" @click="loadTrace">查询</el-button>
            </el-form-item>
          </el-form>
        </el-card>
        <div v-if="traceResult" class="trace-result">
          <el-card>
            <template #header>
              <div class="trace-info">
                <el-icon color="#67c23a" :size="20"><CircleCheckFilled /></el-icon>
                <span style="font-weight: 600">凭证来源：{{ traceResult.sourceDoc?.bizType || 'manual' }} · {{ traceResult.sourceDoc?.docNo || '手工凭证' }}</span>
              </div>
            </template>
            <el-steps :active="traceResult.chain.length" direction="vertical" finish-status="success">
              <el-step v-for="(node, idx) in traceResult.chain" :key="idx" :title="node.node" :description="`单据号：${node.no}`" />
            </el-steps>
          </el-card>
        </div>
      </el-tab-pane>

      <!-- Tab 3: 集成规则 -->
      <el-tab-pane label="集成规则" name="rules">
        <el-alert type="info" :closable="false" show-icon style="margin-bottom: 16px">
          <template #title>系统已为 6 类核心业务单据预置凭证生成规则，可在「凭证模板」页面进行调整</template>
        </el-alert>
        <el-row :gutter="12">
          <el-col v-for="r in ruleCards" :key="r.bizType" :span="8">
            <el-card class="rule-card" shadow="hover">
              <div class="rule-header">
                <el-icon :size="24" :color="r.color"><component :is="r.icon" /></el-icon>
                <div class="rule-title">{{ r.label }}</div>
                <el-tag size="small" :type="r.enabled ? 'success' : 'info'">
                  {{ r.enabled ? '启用' : '停用' }}
                </el-tag>
              </div>
              <div class="rule-summary">业务单据：<b>{{ r.docName }}</b></div>
              <div class="rule-entries">
                <div v-for="(e, i) in r.entries" :key="i" class="rule-entry">
                  <span class="re-direction" :class="e.direction">{{ e.direction === 'debit' ? '借' : '贷' }}</span>
                  <span class="re-subject">{{ e.subjectCode }} {{ e.subjectName }}</span>
                  <span class="re-source">{{ e.source }}</span>
                </div>
              </div>
              <div class="rule-footer">
                <el-button link type="primary" size="small" @click="$router.push('/finance/voucherTemplate')">配置</el-button>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </el-tab-pane>
    </el-tabs>

    <!-- 生成凭证对话框 -->
    <el-dialog v-model="generateDialogVisible" :title="`生成凭证 - ${currentDoc?.docNo}`" width="700px">
      <el-alert :type="generateResult?.balance ? 'success' : 'error'" :closable="false" show-icon style="margin-bottom: 12px">
        <template #title>预览将生成的凭证：{{ generateResult?.voucherNo }}</template>
      </el-alert>
      <el-table v-if="generateResult" :data="generateResult.entries" border>
        <el-table-column type="index" label="行" width="50" align="center" />
        <el-table-column prop="summary" label="摘要" />
        <el-table-column prop="subjectCode" label="科目编码" width="100" />
        <el-table-column label="借方" width="120" align="right">
          <template #default="{ row }">{{ row.debitAmount ? formatMoney(row.debitAmount) : '' }}</template>
        </el-table-column>
        <el-table-column label="贷方" width="120" align="right">
          <template #default="{ row }">{{ row.creditAmount ? formatMoney(row.creditAmount) : '' }}</template>
        </el-table-column>
      </el-table>
      <div v-if="generateResult" class="balance-info">
        <strong>借贷合计：</strong>
        <span class="money debit">借方 {{ formatMoney(totalGenDebit) }}</span> ｜
        <span class="money credit">贷方 {{ formatMoney(totalGenCredit) }}</span>
        <el-tag :type="generateResult.balance ? 'success' : 'danger'" size="small" style="margin-left: 8px">
          {{ generateResult.balance ? '平衡' : '不平衡' }}
        </el-tag>
      </div>
      <template #footer>
        <el-button @click="generateDialogVisible = false">取消</el-button>
        <el-button type="primary" :icon="Check" @click="confirmGenerate">确认生成</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Connection, Refresh, VideoPlay, Download, Search,
  CircleCheckFilled, WarningFilled, Check,
  ShoppingCart, Box, Money, Wallet, Tickets, Document
} from '@element-plus/icons-vue'
import BaseSearch from '@/components/BaseSearch.vue'
import BaseTable from '@/components/BaseTable.vue'
import request from '@/utils/request'

const activeTab = ref('docs')
const query = reactive({ pageNum: 1, pageSize: 20, bizType: '', status: '' })
const tableData = ref([])
const allData = ref([])
const total = ref(0)
const loading = ref(false)
const selectedRows = ref([])

const traceQuery = reactive({ voucherNo: '' })
const traceResult = ref(null)

const generateDialogVisible = ref(false)
const currentDoc = ref(null)
const generateResult = ref(null)

const totalDocs = computed(() => allData.value.length)
const generatedCount = computed(() => allData.value.filter(d => d.status === 'generated').length)
const pendingCount = computed(() => allData.value.filter(d => d.status === 'pending').length)
const matchRate = computed(() => totalDocs.value > 0 ? ((generatedCount.value / totalDocs.value) * 100).toFixed(1) : 0)
const totalGenDebit = computed(() => (generateResult.value?.entries || []).reduce((s, e) => s + (Number(e.debitAmount) || 0), 0))
const totalGenCredit = computed(() => (generateResult.value?.entries || []).reduce((s, e) => s + (Number(e.creditAmount) || 0), 0))

const searchItems = [
  { prop: 'bizType', label: '业务类型', type: 'select', span: 8, options: [
    { value: '', label: '全部' },
    { value: 'sales_outbound', label: '销售出库' },
    { value: 'purchase_inbound', label: '采购入库' },
    { value: 'receipt', label: '收款单' },
    { value: 'payment', label: '付款单' },
    { value: 'expense', label: '费用报销' },
    { value: 'stocktake', label: '库存盘点' }
  ]},
  { prop: 'status', label: '状态', type: 'select', span: 8, options: [
    { value: '', label: '全部' },
    { value: 'generated', label: '已生成' },
    { value: 'pending', label: '待生成' }
  ]}
]

const columns = [
  { prop: 'docNo', label: '单据号', width: 150, fixed: true },
  { prop: 'bizType', label: '业务类型', width: 130, slot: 'bizType' },
  { prop: 'date', label: '单据日期', width: 110 },
  { prop: 'customerName', label: '客户', width: 150 },
  { prop: 'supplierName', label: '供应商', width: 150 },
  { prop: 'applicant', label: '申请人', width: 100 },
  { prop: 'amount', label: '金额', width: 130, slot: 'amount', align: 'right' },
  { prop: 'status', label: '状态', width: 110, slot: 'status', align: 'center' },
  { prop: 'voucherNo', label: '对应凭证', width: 160, slot: 'voucherNo' },
  { prop: 'operation', label: '操作', width: 120, slot: 'operation', fixed: 'right' }
]

const ruleCards = [
  { bizType: 'sales_outbound', label: '销售出库', icon: 'ShoppingCart', color: '#67c23a', enabled: true, docName: '销售出库单',
    entries: [
      { direction: 'debit', subjectCode: '1122', subjectName: '应收账款', source: '销售金额' },
      { direction: 'credit', subjectCode: '5001', subjectName: '主营业务收入', source: '销售收入' },
      { direction: 'credit', subjectCode: '2221.01', subjectName: '应交增值税-销项税', source: '税额' },
      { direction: 'debit', subjectCode: '5401', subjectName: '主营业务成本', source: '成本' },
      { direction: 'credit', subjectCode: '1405', subjectName: '库存商品', source: '成本' }
    ] },
  { bizType: 'purchase_inbound', label: '采购入库', icon: 'Box', color: '#409eff', enabled: true, docName: '采购入库单',
    entries: [
      { direction: 'debit', subjectCode: '1405', subjectName: '库存商品', source: '商品金额' },
      { direction: 'debit', subjectCode: '2221.01', subjectName: '应交增值税-进项税', source: '税额' },
      { direction: 'credit', subjectCode: '2202', subjectName: '应付账款', source: '总金额' }
    ] },
  { bizType: 'receipt', label: '收款单', icon: 'Money', color: '#e6a23c', enabled: true, docName: '收款单',
    entries: [
      { direction: 'debit', subjectCode: '1002.01', subjectName: '银行存款-工行', source: '收款金额' },
      { direction: 'credit', subjectCode: '1122', subjectName: '应收账款', source: '核销金额' }
    ] },
  { bizType: 'payment', label: '付款单', icon: 'Wallet', color: '#f56c6c', enabled: true, docName: '付款单',
    entries: [
      { direction: 'debit', subjectCode: '2202', subjectName: '应付账款', source: '付款金额' },
      { direction: 'credit', subjectCode: '1002.01', subjectName: '银行存款-工行', source: '付款金额' }
    ] },
  { bizType: 'expense', label: '费用报销', icon: 'Tickets', color: '#909399', enabled: true, docName: '费用单',
    entries: [
      { direction: 'debit', subjectCode: '5602.02', subjectName: '管理费用-差旅', source: '费用金额' },
      { direction: 'credit', subjectCode: '1002.01', subjectName: '银行存款-工行', source: '支付金额' }
    ] },
  { bizType: 'stocktake', label: '库存盘点', icon: 'Document', color: '#9b59b6', enabled: true, docName: '盘点单',
    entries: [
      { direction: 'debit', subjectCode: '5501', subjectName: '营业外支出-盘亏', source: '盘亏金额' },
      { direction: 'credit', subjectCode: '1405', subjectName: '库存商品', source: '盘亏金额' }
    ] }
]

async function loadData() {
  loading.value = true
  try {
    const res = await request({ url: '/api/finance/businessDoc/list', method: 'get', params: { pageNum: 1, pageSize: 1000 } })
    allData.value = res.data.list || []
    applyFilter()
  } finally {
    loading.value = false
  }
}

function applyFilter() {
  let data = [...allData.value]
  if (query.bizType) data = data.filter(d => d.bizType === query.bizType)
  if (query.status) data = data.filter(d => d.status === query.status)
  total.value = data.length
  const start = (query.pageNum - 1) * query.pageSize
  tableData.value = data.slice(start, start + query.pageSize)
}

function bizTypeName(v) {
  return ruleCards.find(r => r.bizType === v)?.label || v
}
function bizTypeTagType(v) {
  return { sales_outbound: 'success', purchase_inbound: '', receipt: 'warning', payment: 'danger', expense: 'info', stocktake: '' }[v] || ''
}
function formatMoney(v) {
  if (v === null || v === undefined || v === '') return '0.00'
  return Number(v).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

async function openGenerateDialog(row) {
  currentDoc.value = row
  const res = await request({ url: '/api/finance/businessDoc/generateVoucher', method: 'post', data: { docId: row.id, docNo: row.docNo, bizType: row.bizType } })
  generateResult.value = res.data
  generateDialogVisible.value = true
}
async function confirmGenerate() {
  ElMessage.success(`凭证已生成：${generateResult.value.voucherNo}，请到「凭证管理」审核过账`)
  generateDialogVisible.value = false
  // 实际应保存到凭证库，此处仅更新本地状态
  const doc = allData.value.find(d => d.id === currentDoc.value.id)
  if (doc) {
    doc.status = 'generated'
    doc.voucherNo = generateResult.value.voucherNo
  }
  applyFilter()
}
async function openTraceDialog(row) {
  activeTab.value = 'trace'
  traceQuery.voucherNo = row.voucherNo
  await loadTrace()
}
async function loadTrace() {
  if (!traceQuery.voucherNo) { ElMessage.warning('请输入凭证号'); return }
  const res = await request({ url: '/api/finance/voucher/sourceTrace', method: 'get', params: { voucherNo: traceQuery.voucherNo } })
  traceResult.value = res.data
}
async function handleBatchGenerate() {
  await ElMessageBox.confirm(`确认批量为选中的 ${selectedRows.value.length} 个单据生成凭证？`, '提示', { type: 'warning' })
  let ok = 0
  for (const row of selectedRows.value) {
    if (row.status === 'pending') {
      const res = await request({ url: '/api/finance/businessDoc/generateVoucher', method: 'post', data: { docId: row.id, docNo: row.docNo, bizType: row.bizType } })
      row.status = 'generated'
      row.voucherNo = res.data.voucherNo
      ok++
    }
  }
  ElMessage.success(`已为 ${ok} 个单据生成凭证`)
  applyFilter()
}
function handleSearch(p) { Object.assign(query, p, { pageNum: 1 }); applyFilter() }
function handleReset() { query.bizType = ''; query.status = ''; applyFilter() }

onMounted(() => loadData())
</script>

<style lang="scss" scoped>
.bi-page {
  .hero-card {
    display: flex;
    align-items: center;
    gap: 20px;
    padding: 24px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: #fff;
    border-radius: var(--border-radius-base);
    margin-bottom: 16px;
    .hero-content { flex: 1; }
    .hero-title { font-size: 20px; font-weight: 600; }
    .hero-sub { font-size: 13px; opacity: 0.85; margin-top: 4px; }
    .hero-stats { display: flex; gap: 32px; }
    .hs-item { text-align: center; }
    .hs-value { font-size: 24px; font-weight: 600; }
    .hs-value.text-warn { color: #fee140; }
    .hs-label { font-size: 12px; opacity: 0.85; margin-top: 2px; }
  }
  .bi-tabs { background: #fff; border-radius: var(--border-radius-base); padding: 16px; }
  .table-toolbar { display: flex; gap: 10px; margin: 16px 0; }
  .rule-card {
    margin-bottom: 16px;
    .rule-header {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 10px;
      .rule-title { flex: 1; font-weight: 600; }
    }
    .rule-summary { font-size: 13px; color: #606266; margin-bottom: 10px; }
    .rule-entries {
      .rule-entry {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 6px 0;
        font-size: 12px;
        border-bottom: 1px dashed #ebeef5;
        &:last-child { border-bottom: none; }
        .re-direction {
          display: inline-block;
          width: 24px;
          height: 20px;
          text-align: center;
          border-radius: 3px;
          color: #fff;
          font-size: 11px;
          line-height: 20px;
          &.debit { background: #67c23a; }
          &.credit { background: #f56c6c; }
        }
        .re-subject { flex: 1; }
        .re-source { color: #909399; font-size: 11px; }
      }
    }
    .rule-footer { margin-top: 10px; text-align: right; }
  }
  .voucher-link { color: #409eff; cursor: pointer; font-family: monospace; }
  .text-muted { color: #c0c4cc; }
  .text-warn { color: #fee140; }
  .balance-info {
    margin-top: 12px;
    padding: 12px;
    background: #fafbfc;
    border-radius: 4px;
  }
  .trace-header { font-weight: 600; }
  .trace-info { display: flex; align-items: center; gap: 8px; }
  .trace-result { margin-top: 16px; }
  .money { font-family: monospace; font-weight: 500; }
  .money.debit { color: #67c23a; }
  .money.credit { color: #f56c6c; }
}
</style>
