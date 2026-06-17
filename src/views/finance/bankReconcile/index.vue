<template>
  <div class="page-container reconcile-page">
    <div class="filter-bar">
      <el-form :model="query" inline>
        <el-form-item label="银行账户">
          <el-select v-model="query.accountId" style="width: 240px" @change="loadData">
            <el-option v-for="acc in accounts" :key="acc.id" :label="`${acc.accountName} (${acc.accountNo})`" :value="acc.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="对账期间">
          <el-date-picker v-model="query.period" type="month" value-format="YYYY-MM" placeholder="选择月份" @change="loadData" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="query.matched" style="width: 120px" @change="applyFilter" clearable>
            <el-option label="全部" value="" />
            <el-option label="已对账" value="true" />
            <el-option label="未对账" value="false" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Refresh" @click="loadData">刷新</el-button>
          <el-button type="success" :icon="MagicStick" @click="handleAutoMatch">智能对账</el-button>
          <el-button :icon="Download" plain>导入流水</el-button>
        </el-form-item>
      </el-form>
    </div>

    <div class="summary-cards">
      <el-row :gutter="12">
        <el-col :span="6">
          <div class="metric-card">
            <div class="metric-label">本期收入</div>
            <div class="metric-value money success">{{ formatMoney(totalIn) }}</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="metric-card">
            <div class="metric-label">本期支出</div>
            <div class="metric-value money danger">{{ formatMoney(totalOut) }}</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="metric-card">
            <div class="metric-label">已对账笔数</div>
            <div class="metric-value money primary">{{ matchedCount }} / {{ statementData.length }}</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="metric-card">
            <div class="metric-label">对账率</div>
            <div class="metric-value money primary">{{ matchRate }}%</div>
          </div>
        </el-col>
      </el-row>
    </div>

    <BaseTable
      :columns="columns"
      :table-data="statementData"
      :total="total"
      :current-page.sync="query.pageNum"
      :page-size.sync="query.pageSize"
      :show-index="true"
      @current-change="p => { query.pageNum = p; applyFilter() }"
      @size-change="s => { query.pageSize = s; query.pageNum = 1; applyFilter() }"
    >
      <template #date="{ row }">{{ row.date }}</template>
      <template #type="{ row }">
        <el-tag :type="row.type === 'in' ? 'success' : 'danger'" size="small">
          {{ row.type === 'in' ? '收入' : '支出' }}
        </el-tag>
      </template>
      <template #amount="{ row }">
        <span :class="row.type === 'in' ? 'money success' : 'money danger'">
          {{ row.type === 'in' ? '+' : '-' }}{{ formatMoney(row.amount) }}
        </span>
      </template>
      <template #matched="{ row }">
        <el-tag v-if="row.matched" type="success" size="small">已对账</el-tag>
        <el-tag v-else type="warning" size="small">未对账</el-tag>
      </template>
      <template #voucherNo="{ row }">
        <span v-if="row.voucherNo" class="voucher-link">{{ row.voucherNo }}</span>
        <span v-else class="text-muted">—</span>
      </template>
      <template #operation="{ row }">
        <el-button v-if="!row.matched" type="primary" link size="small" @click="openMatchDialog(row)">勾对</el-button>
        <el-button v-else type="danger" link size="small" @click="handleUnmatch(row)">取消</el-button>
      </template>
    </BaseTable>

    <!-- 勾对凭证对话框 -->
    <el-dialog v-model="matchDialogVisible" title="勾对凭证" width="540px">
      <el-alert type="info" :closable="false" show-icon style="margin-bottom: 12px">
        <template #title>对账单据：{{ currentStmt?.summary }} · {{ formatMoney(currentStmt?.amount) }}</template>
      </el-alert>
      <el-form :model="matchForm" label-width="100px">
        <el-form-item label="选择凭证">
          <el-input v-model="matchForm.voucherNo" placeholder="请输入凭证号搜索" @input="onSearchVoucher">
            <template #prefix><el-icon><Search /></el-icon></template>
          </el-input>
        </el-form-item>
        <el-form-item label="匹配结果" v-if="voucherOptions.length">
          <el-radio-group v-model="matchForm.voucherId" class="voucher-list">
            <el-radio v-for="v in voucherOptions" :key="v.id" :value="v.id" border>
              <div class="voucher-option">
                <div class="voucher-no">{{ v.voucherNo }}</div>
                <div class="voucher-summary">{{ v.summary }}</div>
                <div class="voucher-amount">{{ formatMoney(v.amount) }}</div>
              </div>
            </el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label=" " v-else>
          <span class="text-muted">无匹配凭证，请先过账</span>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="matchDialogVisible = false">取消</el-button>
        <el-button type="primary" :disabled="!matchForm.voucherId" @click="confirmMatch">确认对账</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Refresh, MagicStick, Download, Search } from '@element-plus/icons-vue'
import BaseTable from '@/components/BaseTable.vue'
import request from '@/utils/request'

const query = reactive({ accountId: 1, period: '2025-06', matched: '', pageNum: 1, pageSize: 20 })
const accounts = ref([])
const allStatements = ref([])
const statementData = ref([])
const total = ref(0)

const matchDialogVisible = ref(false)
const currentStmt = ref(null)
const matchForm = reactive({ voucherId: '', voucherNo: '' })
const voucherOptions = ref([])

const totalIn = computed(() => allStatements.value.filter(s => s.type === 'in').reduce((sum, s) => sum + s.amount, 0))
const totalOut = computed(() => allStatements.value.filter(s => s.type === 'out').reduce((sum, s) => sum + s.amount, 0))
const matchedCount = computed(() => allStatements.value.filter(s => s.matched).length)
const matchRate = computed(() => allStatements.value.length > 0 ? ((matchedCount.value / allStatements.value.length) * 100).toFixed(1) : 0)

const columns = [
  { prop: 'date', label: '日期', width: 120 },
  { prop: 'accountName', label: '账户', width: 180 },
  { prop: 'summary', label: '摘要', minWidth: 200, showOverflowTooltip: true },
  { prop: 'bizType', label: '业务类型', width: 100 },
  { prop: 'type', label: '收/支', width: 80, slot: 'type', align: 'center' },
  { prop: 'amount', label: '金额', width: 140, slot: 'amount', align: 'right' },
  { prop: 'matched', label: '对账状态', width: 100, slot: 'matched', align: 'center' },
  { prop: 'voucherNo', label: '对应凭证', width: 150, slot: 'voucherNo' },
  { prop: 'operation', label: '操作', width: 120, slot: 'operation', fixed: 'right' }
]

async function loadData() {
  const [accRes, stmtRes] = await Promise.all([
    request({ url: '/api/finance/bankAccount/list', method: 'get' }),
    request({ url: '/api/finance/bankReconcile/statement', method: 'get', params: { accountId: query.accountId, period: query.period } })
  ])
  accounts.value = accRes.data.list || []
  allStatements.value = stmtRes.data.list || []
  applyFilter()
}

function applyFilter() {
  let data = [...allStatements.value]
  if (query.matched === 'true') data = data.filter(s => s.matched)
  else if (query.matched === 'false') data = data.filter(s => !s.matched)
  total.value = data.length
  const start = (query.pageNum - 1) * query.pageSize
  statementData.value = data.slice(start, start + query.pageSize)
}

function openMatchDialog(row) {
  currentStmt.value = row
  matchForm.voucherId = ''
  matchForm.voucherNo = ''
  voucherOptions.value = []
  matchDialogVisible.value = true
}
function onSearchVoucher() {
  // 模拟搜索凭证
  if (!matchForm.voucherNo) {
    voucherOptions.value = []
    return
  }
  voucherOptions.value = [
    { id: 1, voucherNo: '记-20250608-004', summary: '收到货款-北京客户A', amount: 22600 },
    { id: 2, voucherNo: '记-20250615-005', summary: '销售收款-SO20250615', amount: 33900 }
  ].filter(v => v.voucherNo.includes(matchForm.voucherNo) || v.summary.includes(matchForm.voucherNo))
}
async function confirmMatch() {
  const v = voucherOptions.value.find(x => x.id === matchForm.voucherId)
  if (!v) return
  await request({ url: '/api/finance/bankReconcile/match', method: 'post', data: { statementId: currentStmt.value.id, voucherId: v.id, voucherNo: v.voucherNo } })
  ElMessage.success('对账成功')
  matchDialogVisible.value = false
  loadData()
}
async function handleUnmatch(row) {
  await ElMessageBox.confirm(`确认取消对账【${row.summary}】?`, '提示', { type: 'warning' })
  await request({ url: '/api/finance/bankReconcile/unmatch', method: 'post', data: { statementId: row.id } })
  ElMessage.success('已取消对账')
  loadData()
}
async function handleAutoMatch() {
  const res = await request({ url: '/api/finance/bankReconcile/autoMatch', method: 'post', data: { accountId: query.accountId } })
  ElMessage.success(`智能对账完成：自动勾对 ${res.data?.matched || 0} 笔`)
  loadData()
}
function formatMoney(v) {
  if (v === null || v === undefined || v === '') return '0.00'
  return Number(v).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

onMounted(() => loadData())
</script>

<style lang="scss" scoped>
.reconcile-page {
  .filter-bar {
    background: #fff;
    padding: 16px;
    border-radius: var(--border-radius-base);
    margin-bottom: 16px;
  }
  .summary-cards { margin-bottom: 16px; }
  .metric-card {
    padding: 16px;
    background: #fff;
    border-radius: var(--border-radius-base);
    text-align: center;
    .metric-label { font-size: 12px; color: #909399; }
    .metric-value { font-size: 20px; font-weight: 600; margin-top: 6px; font-family: monospace; }
  }
  .voucher-link { color: #409eff; cursor: pointer; font-family: monospace; }
  .text-muted { color: #c0c4cc; }
  .voucher-list { display: flex; flex-direction: column; gap: 8px; width: 100%; }
  .voucher-option { display: flex; align-items: center; gap: 12px; padding: 4px 0; }
  .voucher-no { font-family: monospace; font-weight: 500; min-width: 140px; }
  .voucher-summary { flex: 1; color: #606266; font-size: 12px; }
  .voucher-amount { font-family: monospace; font-weight: 600; color: #f56c6c; }
  .money { font-family: monospace; font-weight: 500; }
  .money.success { color: #67c23a; }
  .money.danger { color: #f56c6c; }
  .money.primary { color: #409eff; }
}
</style>
