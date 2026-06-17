<template>
  <div class="page-container voucher-page">
    <BaseSearch :search-items="searchItems" @search="handleSearch" @reset="handleReset" />

    <div class="table-toolbar">
      <div class="toolbar-left">
        <el-button type="primary" :icon="Plus" @click="handleAdd">新建凭证</el-button>
        <el-button :icon="MagicStick" plain @click="handleGenerate">业务单据生成</el-button>
        <el-button :icon="Download" plain>导出</el-button>
        <el-button :icon="Printer" plain>打印</el-button>
      </div>
      <div class="toolbar-right">
        <el-button :icon="Refresh" circle @click="loadData" />
      </div>
    </div>

    <!-- 状态统计卡片 -->
    <div class="status-cards">
      <div class="status-card" v-for="s in statusStats" :key="s.key" :class="`status-${s.key}`">
        <div class="status-num">{{ s.count }}</div>
        <div class="status-label">{{ s.label }}</div>
      </div>
    </div>

    <BaseTable
      :columns="columns"
      :table-data="tableData"
      :loading="loading"
      :total="total"
      :current-page.sync="queryParams.pageNum"
      :page-size.sync="queryParams.pageSize"
      :show-index="true"
      @current-change="handlePageChange"
      @size-change="handleSizeChange"
    >
      <template #status="{ row }">
        <el-tag :type="statusType(row.status)">{{ statusLabel(row.status) }}</el-tag>
      </template>
      <template #source="{ row }">
        <el-tag size="small" effect="plain">{{ sourceLabel(row.source) }}</el-tag>
      </template>
      <template #totalDebit="{ row }">
        <span class="money debit">{{ formatMoney(row.totalDebit) }}</span>
      </template>
      <template #totalCredit="{ row }">
        <span class="money credit">{{ formatMoney(row.totalCredit) }}</span>
      </template>
      <template #operation="{ row }">
        <el-button type="primary" link size="small" @click="handleView(row)">查看</el-button>
        <el-button v-if="row.status === 0" type="primary" link size="small" @click="handleEdit(row)">编辑</el-button>
        <el-button v-if="row.status === 0" type="success" link size="small" @click="handleAudit(row)">审核</el-button>
        <el-button v-if="row.status === 1" type="success" link size="small" @click="handlePost(row)">过账</el-button>
        <el-button v-if="row.status === 1" type="warning" link size="small" @click="handleUnaudit(row)">反审</el-button>
        <el-button v-if="row.status === 2" type="warning" link size="small" @click="handleUnpost(row)">反过账</el-button>
        <el-button v-if="row.status === 2" type="danger" link size="small" @click="handleCancel(row)">冲销</el-button>
        <el-button v-if="row.status === 0" type="danger" link size="small" @click="handleDelete(row)">删除</el-button>
      </template>
    </BaseTable>

    <!-- 凭证编辑对话框（核心：分录编辑） -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="960px"
      :close-on-click-modal="false"
      @close="cancelDialog"
      top="5vh"
    >
      <div v-if="formData.id" class="voucher-meta">
        <el-descriptions :column="4" border size="small">
          <el-descriptions-item label="制单人">{{ formData.creatorName }}</el-descriptions-item>
          <el-descriptions-item label="制单时间">{{ formData.createdAt }}</el-descriptions-item>
          <el-descriptions-item v-if="formData.auditorName" label="审核人">{{ formData.auditorName }}</el-descriptions-item>
          <el-descriptions-item v-if="formData.auditTime" label="审核时间">{{ formData.auditTime }}</el-descriptions-item>
          <el-descriptions-item v-if="formData.posterName" label="过账人">{{ formData.posterName }}</el-descriptions-item>
          <el-descriptions-item v-if="formData.postTime" label="过账时间">{{ formData.postTime }}</el-descriptions-item>
          <el-descriptions-item v-if="formData.status >= 2" label="状态">
            <el-tag :type="statusType(formData.status)" size="small">{{ statusLabel(formData.status) }}</el-tag>
          </el-descriptions-item>
        </el-descriptions>
      </div>

      <el-form :model="formData" label-width="90px" :disabled="readonly">
        <el-row :gutter="16">
          <el-col :span="8">
            <el-form-item label="凭证号">
              <el-input v-model="formData.voucherNo" placeholder="留空自动生成" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="日期">
              <el-date-picker v-model="formData.voucherDate" type="date" value-format="YYYY-MM-DD" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="4">
            <el-form-item label="附件">
              <el-input-number v-model="formData.attachment" :min="0" controls-position="right" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="4">
            <el-form-item label="来源">
              <el-tag size="small">{{ sourceLabel(formData.source) }}</el-tag>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>

      <!-- 分录编辑表 -->
      <div class="entry-section">
        <div class="section-header">
          <span class="section-title">分录明细</span>
          <div class="section-actions">
            <span class="balance-info" :class="{ 'balanced': isBalanced, 'unbalanced': !isBalanced }">
              借方合计: {{ formatMoney(totalDebit) }} ｜ 贷方合计: {{ formatMoney(totalCredit) }} ｜ 差额: {{ formatMoney(Math.abs(totalDebit - totalCredit)) }}
            </span>
            <el-button v-if="!readonly" type="primary" link :icon="Plus" @click="addEntry">新增分录</el-button>
            <el-button v-if="!readonly && formData.entries.length > 2" type="danger" link :icon="Delete" @click="removeLastEntry">删除末行</el-button>
          </div>
        </div>

        <el-table :data="formData.entries" border :show-summary="true" :summary-method="summaryMethod" size="default">
          <el-table-column label="行" width="50" align="center">
            <template #default="{ $index }">{{ $index + 1 }}</template>
          </el-table-column>
          <el-table-column label="摘要" min-width="200">
            <template #default="{ row }">
              <el-input v-if="!readonly" v-model="row.summary" placeholder="分录摘要" size="small" />
              <span v-else>{{ row.summary }}</span>
            </template>
          </el-table-column>
          <el-table-column label="科目" min-width="280">
            <template #default="{ row }">
              <el-cascader
                v-if="!readonly"
                v-model="row.subjectPath"
                :options="subjectTreeOptions"
                :props="{ value: 'id', label: 'name', children: 'children', checkStrictly: true, emitPath: false }"
                placeholder="选择科目"
                :show-all-levels="false"
                @change="(v) => onSubjectChange(row, v)"
                style="width: 100%"
                filterable
                size="small"
              />
              <span v-else>{{ row.subjectCode }} {{ row.subjectName }}</span>
            </template>
          </el-table-column>
          <el-table-column label="借方金额" width="140" align="right">
            <template #default="{ row }">
              <el-input-number
                v-if="!readonly"
                v-model="row.debitAmount"
                :precision="2"
                :controls="false"
                size="small"
                style="width: 100%"
                @change="onDebitChange(row)"
              />
              <span v-else class="money debit">{{ formatMoney(row.debitAmount) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="贷方金额" width="140" align="right">
            <template #default="{ row }">
              <el-input-number
                v-if="!readonly"
                v-model="row.creditAmount"
                :precision="2"
                :controls="false"
                size="small"
                style="width: 100%"
                @change="onCreditChange(row)"
              />
              <span v-else class="money credit">{{ formatMoney(row.creditAmount) }}</span>
            </template>
          </el-table-column>
          <el-table-column v-if="!readonly" label="操作" width="60" align="center" fixed="right">
            <template #default="{ $index }">
              <el-button type="danger" link size="small" :disabled="formData.entries.length <= 2" @click="removeEntry($index)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <el-form :model="formData" label-width="90px" style="margin-top: 12px">
        <el-form-item label="备注">
          <el-input v-model="formData.remark" type="textarea" :rows="2" :disabled="readonly" />
        </el-form-item>
      </el-form>

      <template #footer>
        <div class="dialog-footer">
          <div class="footer-info">
            <el-tag v-if="isBalanced" type="success">借贷平衡</el-tag>
            <el-tag v-else type="danger">借贷不平：差额 {{ formatMoney(Math.abs(totalDebit - totalCredit)) }}</el-tag>
          </div>
          <div>
            <el-button @click="cancelDialog">关闭</el-button>
            <el-button v-if="!readonly" type="primary" :loading="submitLoading" @click="handleSubmit">保存为草稿</el-button>
            <el-button v-if="!readonly && formData.id" type="success" :loading="submitLoading" @click="handleSubmitAndAudit">保存并审核</el-button>
          </div>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Download, Printer, Refresh, MagicStick, Delete } from '@element-plus/icons-vue'
import BaseSearch from '@/components/BaseSearch.vue'
import BaseTable from '@/components/BaseTable.vue'
import request from '@/utils/request'

const searchItems = [
  { prop: 'voucherNo', label: '凭证号', type: 'input', span: 6 },
  { prop: 'fiscalPeriod', label: '会计期间', type: 'select', span: 6, options: [
    { value: '', label: '全部' },
    { value: '2025-04', label: '2025-04' },
    { value: '2025-05', label: '2025-05' },
    { value: '2025-06', label: '2025-06' }
  ]},
  { prop: 'status', label: '状态', type: 'select', span: 6, options: [
    { value: '', label: '全部' },
    { value: 0, label: '草稿' },
    { value: 1, label: '已审核' },
    { value: 2, label: '已过账' },
    { value: 3, label: '已冲销' }
  ]},
  { prop: 'source', label: '来源', type: 'select', span: 6, options: [
    { value: '', label: '全部' },
    { value: 'manual', label: '手工' },
    { value: 'sales_outbound', label: '销售出库' },
    { value: 'purchase_inbound', label: '采购入库' },
    { value: 'receipt', label: '收款单' },
    { value: 'payment', label: '付款单' },
    { value: 'expense', label: '费用报销' },
    { value: 'stocktake', label: '库存盘点' }
  ]}
]

const columns = [
  { prop: 'voucherNo', label: '凭证号', width: 170, fixed: true },
  { prop: 'voucherDate', label: '日期', width: 110 },
  { prop: 'source', label: '来源', width: 90, slot: 'source' },
  { prop: 'summary', label: '摘要', minWidth: 220, showOverflowTooltip: true },
  { prop: 'totalDebit', label: '借方金额', width: 130, slot: 'totalDebit', align: 'right' },
  { prop: 'totalCredit', label: '贷方金额', width: 130, slot: 'totalCredit', align: 'right' },
  { prop: 'attachment', label: '附件', width: 60, align: 'center' },
  { prop: 'creatorName', label: '制单人', width: 90 },
  { prop: 'status', label: '状态', width: 90, slot: 'status' }
]

const queryParams = reactive({ pageNum: 1, pageSize: 10, voucherNo: '', fiscalPeriod: '', status: '', source: '' })
const tableData = ref([])
const total = ref(0)
const loading = ref(false)
const statusStats = ref([
  { key: 'draft', label: '草稿', count: 0 },
  { key: 'audited', label: '已审核', count: 0 },
  { key: 'posted', label: '已过账', count: 0 },
  { key: 'canceled', label: '已冲销', count: 0 }
])

const dialogVisible = ref(false)
const dialogTitle = ref('')
const readonly = ref(false)
const submitLoading = ref(false)
const formData = reactive({
  id: undefined, voucherNo: '', voucherDate: new Date().toISOString().slice(0, 10), voucherPeriod: '',
  source: 'manual', sourceBillNo: '', totalDebit: 0, totalCredit: 0, attachment: 0,
  creatorId: 1, creatorName: 'admin', auditorId: null, auditorName: null, auditTime: null,
  posterId: null, posterName: null, postTime: null, status: 0, remark: '',
  entries: [
    { lineNo: 1, subjectId: null, subjectCode: '', subjectName: '', summary: '', debitAmount: 0, creditAmount: 0, subjectPath: null },
    { lineNo: 2, subjectId: null, subjectCode: '', subjectName: '', summary: '', debitAmount: 0, creditAmount: 0, subjectPath: null }
  ]
})

const subjectTreeOptions = ref([])

const totalDebit = computed(() => formData.entries.reduce((s, e) => s + (Number(e.debitAmount) || 0), 0))
const totalCredit = computed(() => formData.entries.reduce((s, e) => s + (Number(e.creditAmount) || 0), 0))
const isBalanced = computed(() => Math.abs(totalDebit.value - totalCredit.value) < 0.01)

async function loadData() {
  loading.value = true
  try {
    const res = await request({ url: '/api/finance/voucher/list', method: 'get', params: queryParams })
    tableData.value = res.data.list || []
    total.value = res.data.total || 0
    updateStats(tableData.value)
  } finally {
    loading.value = false
  }
}

function updateStats(list) {
  const all = [...list]
  statusStats.value[0].count = all.filter(v => v.status === 0).length
  statusStats.value[1].count = all.filter(v => v.status === 1).length
  statusStats.value[2].count = all.filter(v => v.status === 2).length
  statusStats.value[3].count = all.filter(v => v.status === 3).length
}

async function loadSubjects() {
  const res = await request({ url: '/api/finance/subject/list', method: 'get', params: { pageNum: 1, pageSize: 1000 } })
  const all = res.data.list || []
  const buildTree = (pid) => all.filter(s => s.parentId === pid).map(s => ({
    id: s.id, code: s.code, name: `${s.code} ${s.name}`,
    disabled: !s.isLeaf, isLeaf: s.isLeaf,
    children: buildTree(s.id)
  }))
  subjectTreeOptions.value = buildTree(null)
}

function statusLabel(s) {
  return { 0: '草稿', 1: '已审核', 2: '已过账', 3: '已冲销' }[s] || '—'
}
function statusType(s) {
  return { 0: 'info', 1: 'warning', 2: 'success', 3: 'danger' }[s] || ''
}
function sourceLabel(s) {
  return { manual: '手工', sales_outbound: '销售', purchase_inbound: '采购', receipt: '收款', payment: '付款', expense: '费用', stocktake: '盘点', cancel: '冲销', fx_adjust: '调汇' }[s] || s
}
function formatMoney(v) {
  if (v === null || v === undefined || v === '') return '0.00'
  return Number(v).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function addEntry() {
  formData.entries.push({ lineNo: formData.entries.length + 1, subjectId: null, subjectCode: '', subjectName: '', summary: '', debitAmount: 0, creditAmount: 0, subjectPath: null })
}
function removeEntry(i) {
  formData.entries.splice(i, 1)
  formData.entries.forEach((e, idx) => e.lineNo = idx + 1)
}
function removeLastEntry() {
  formData.entries.pop()
  formData.entries.forEach((e, idx) => e.lineNo = idx + 1)
}
function onDebitChange(row) {
  if (row.debitAmount > 0) row.creditAmount = 0
}
function onCreditChange(row) {
  if (row.creditAmount > 0) row.debitAmount = 0
}
function onSubjectChange(row, subjectId) {
  const findNode = (nodes) => {
    for (const n of nodes) {
      if (n.id === subjectId) return n
      if (n.children) { const c = findNode(n.children); if (c) return c }
    }
    return null
  }
  const node = findNode(subjectTreeOptions.value)
  if (node) {
    row.subjectId = subjectId
    row.subjectCode = node.code
    row.subjectName = node.name.replace(`${node.code} `, '')
  }
}
function summaryMethod({ columns, data }) {
  return [
    { [columns[0].label]: '合计', [columns[3].label]: formatMoney(totalDebit.value), [columns[4].label]: formatMoney(totalCredit.value) }
  ]
}

function handleAdd() {
  dialogTitle.value = '新建凭证'
  readonly.value = false
  Object.keys(formData).forEach(k => {
    if (k === 'voucherDate') formData[k] = new Date().toISOString().slice(0, 10)
    else if (k === 'attachment') formData[k] = 0
    else if (k === 'source') formData[k] = 'manual'
    else if (k === 'status') formData[k] = 0
    else if (k === 'creatorName') formData[k] = 'admin'
    else if (k === 'entries') formData[k] = [
      { lineNo: 1, subjectId: null, subjectCode: '', subjectName: '', summary: '', debitAmount: 0, creditAmount: 0, subjectPath: null },
      { lineNo: 2, subjectId: null, subjectCode: '', subjectName: '', summary: '', debitAmount: 0, creditAmount: 0, subjectPath: null }
    ]
    else if (k !== 'voucherPeriod' && k !== 'voucherNo') formData[k] = ''
    else formData[k] = ''
  })
  formData.id = undefined
  dialogVisible.value = true
}

async function handleEdit(row) {
  dialogTitle.value = '编辑凭证'
  readonly.value = false
  const res = await request({ url: '/api/finance/voucher/detail', method: 'get', params: { id: row.id } })
  Object.assign(formData, res.data)
  formData.entries = res.data.entries.map((e, i) => ({ ...e, subjectPath: e.subjectId }))
  dialogVisible.value = true
}

async function handleView(row) {
  dialogTitle.value = `查看凭证 - ${row.voucherNo}`
  readonly.value = true
  const res = await request({ url: '/api/finance/voucher/detail', method: 'get', params: { id: row.id } })
  Object.assign(formData, res.data)
  formData.entries = res.data.entries.map((e, i) => ({ ...e, subjectPath: e.subjectId }))
  dialogVisible.value = true
}

function cancelDialog() {
  dialogVisible.value = false
}

async function handleSubmit() {
  await doSave(false)
}
async function handleSubmitAndAudit() {
  await doSave(true)
}
async function doSave(thenAudit) {
  if (formData.entries.some(e => !e.subjectId)) {
    ElMessage.warning('请为所有分录选择科目')
    return
  }
  if (!isBalanced.value) {
    ElMessage.warning('借贷不平衡，请检查分录')
    return
  }
  submitLoading.value = true
  try {
    formData.totalDebit = totalDebit.value
    formData.totalCredit = totalCredit.value
    formData.fiscalPeriod = formData.voucherDate.slice(0, 7)
    await request({ url: '/api/finance/voucher/save', method: 'post', data: { ...formData } })
    if (thenAudit && formData.id) {
      await request({ url: '/api/finance/voucher/audit', method: 'post', data: { id: formData.id } })
    }
    ElMessage.success(thenAudit ? '保存并审核成功' : '保存成功')
    dialogVisible.value = false
    loadData()
  } catch (e) {
    ElMessage.error(e.message || '保存失败')
  } finally {
    submitLoading.value = false
  }
}

async function handleAudit(row) {
  await ElMessageBox.confirm(`确定审核凭证【${row.voucherNo}】?`, '提示', { type: 'warning' })
  await request({ url: '/api/finance/voucher/audit', method: 'post', data: { id: row.id } })
  ElMessage.success('审核成功')
  loadData()
}
async function handleUnaudit(row) {
  await ElMessageBox.confirm(`确定反审核凭证【${row.voucherNo}】?`, '提示', { type: 'warning' })
  await request({ url: '/api/finance/voucher/unaudit', method: 'post', data: { id: row.id } })
  ElMessage.success('反审核成功')
  loadData()
}
async function handlePost(row) {
  await ElMessageBox.confirm(`确定过账凭证【${row.voucherNo}】?过账后数据将写入总账。`, '提示', { type: 'warning' })
  await request({ url: '/api/finance/voucher/post', method: 'post', data: { id: row.id } })
  ElMessage.success('过账成功')
  loadData()
}
async function handleUnpost(row) {
  await ElMessageBox.confirm(`确定反过账凭证【${row.voucherNo}】?反过账后将从总账移除。`, '提示', { type: 'warning' })
  await request({ url: '/api/finance/voucher/unpost', method: 'post', data: { id: row.id } })
  ElMessage.success('反过账成功')
  loadData()
}
async function handleCancel(row) {
  await ElMessageBox.confirm(
    `确定冲销凭证【${row.voucherNo}】?系统将自动生成一张红字凭证。`,
    '冲销',
    { type: 'warning' }
  )
  await request({ url: '/api/finance/voucher/cancel', method: 'post', data: { id: row.id } })
  ElMessage.success('冲销成功，已生成红字凭证')
  loadData()
}
async function handleDelete(row) {
  await ElMessageBox.confirm(`确定删除凭证【${row.voucherNo}】?`, '提示', { type: 'warning' })
  await request({ url: '/api/finance/voucher/delete', method: 'post', data: { id: row.id } })
  ElMessage.success('删除成功')
  loadData()
}

function handleGenerate() {
  ElMessage.info('请到「业务单据 → 凭证模板」配置业务单据自动生成凭证规则')
}

function handleSearch(p) { Object.assign(queryParams, p, { pageNum: 1 }); loadData() }
function handleReset() {
  Object.keys(queryParams).forEach(k => { if (!['pageNum', 'pageSize'].includes(k)) queryParams[k] = '' })
  loadData()
}
function handlePageChange(p) { queryParams.pageNum = p; loadData() }
function handleSizeChange(s) { queryParams.pageSize = s; queryParams.pageNum = 1; loadData() }

onMounted(async () => {
  await loadSubjects()
  loadData()
})
</script>

<style lang="scss" scoped>
.voucher-page {
  .table-toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
    padding: 14px 18px;
    background: #fff;
    border-radius: var(--border-radius-base);
    .toolbar-left { display: flex; gap: 10px; }
    .toolbar-right { display: flex; gap: 8px; }
  }
  .status-cards {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 12px;
    margin-bottom: 16px;
    .status-card {
      background: #fff;
      border-radius: var(--border-radius-base);
      padding: 16px 20px;
      border-left: 4px solid #409eff;
      .status-num { font-size: 26px; font-weight: 600; color: #303133; }
      .status-label { font-size: 13px; color: #909399; margin-top: 4px; }
      &.status-draft { border-color: #909399; }
      &.status-audited { border-color: #e6a23c; }
      &.status-posted { border-color: #67c23a; }
      &.status-canceled { border-color: #f56c6c; }
    }
  }
  .voucher-meta { margin-bottom: 16px; }
  .entry-section {
    background: #fafbfc;
    padding: 12px;
    border-radius: 4px;
    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
      .section-title { font-weight: 600; color: #303133; }
      .section-actions { display: flex; gap: 12px; align-items: center; }
      .balance-info { font-size: 13px; color: #606266; font-family: monospace; }
      .balance-info.balanced { color: #67c23a; }
      .balance-info.unbalanced { color: #f56c6c; font-weight: 600; }
    }
  }
  .money { font-family: 'Courier New', monospace; font-weight: 500; }
  .money.debit { color: #67c23a; }
  .money.credit { color: #f56c6c; }
  .dialog-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
}
</style>
