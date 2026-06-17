<template>
  <div class="page-container template-page">
    <BaseSearch :search-items="searchItems" @search="handleSearch" @reset="handleReset" />
    <div class="table-toolbar">
      <div class="toolbar-left">
        <el-button type="primary" :icon="Plus" @click="handleAdd">新增模板</el-button>
        <el-button :icon="MagicStick" plain @click="handleInit">初始化预置</el-button>
        <el-button :icon="VideoPlay" plain @click="handleTestGenerate">测试生成</el-button>
      </div>
      <div class="toolbar-right">
        <el-button :icon="Refresh" circle @click="loadData" />
      </div>
    </div>

    <div class="biz-type-cards">
      <div
        v-for="t in bizTypes"
        :key="t.value"
        :class="['biz-type-card', { active: queryParams.bizType === t.value }]"
        @click="filterByBizType(t.value)"
      >
        <el-icon :size="20" :color="t.color"><component :is="t.icon" /></el-icon>
        <div class="card-text">
          <div class="card-label">{{ t.label }}</div>
          <div class="card-count">{{ getCountByBiz(t.value) }} 条规则</div>
        </div>
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
      <template #bizType="{ row }">
        <el-tag :type="bizTypeTagType(row.bizType)">{{ bizTypeName(row.bizType) }}</el-tag>
      </template>
      <template #direction="{ row }">
        <el-tag :type="row.direction === 'debit' ? 'success' : 'danger'" size="small">
          {{ row.direction === 'debit' ? '借方' : '贷方' }}
        </el-tag>
      </template>
      <template #subjectCode="{ row }">
        <span class="subject-code">{{ row.subjectCode }}</span>
      </template>
      <template #assistConfig="{ row }">
        <el-tag v-for="k in Object.keys(row.assistConfig || {})" :key="k" size="small" type="info" effect="plain" style="margin-right: 4px">
          {{ assistName(k) }}: {{ row.assistConfig[k] }}
        </el-tag>
        <span v-if="!Object.keys(row.assistConfig || {}).length" class="text-muted">—</span>
      </template>
      <template #enabled="{ row }">
        <el-switch v-model="row.enabled" @change="(v) => handleToggle(row, v)" />
      </template>
      <template #operation="{ row }">
        <el-button type="primary" link size="small" @click="handleEdit(row)">编辑</el-button>
        <el-button type="danger" link size="small" @click="handleDelete(row)">删除</el-button>
      </template>
    </BaseTable>

    <!-- 编辑对话框 -->
    <BaseDialog v-model="dialogVisible" :title="dialogTitle" width="640px" :confirm-loading="submitLoading" @confirm="handleSubmit" @cancel="cancelDialog">
      <BaseForm ref="formRef" v-model="formData" :form-items="formItems" :form-rules="formRules" :col-count="2" />
      <el-alert type="info" :closable="false" show-icon style="margin-top: 12px">
        <template #title>
          变量说明：摘要中可使用 {orderNo} {customerName} {supplierName} {applicant} {warehouseName} 等变量，系统将自动从业务单据替换
        </template>
      </el-alert>
    </BaseDialog>

    <!-- 测试生成对话框 -->
    <el-dialog v-model="testDialogVisible" title="测试生成凭证" width="800px">
      <el-alert type="warning" :closable="false" show-icon style="margin-bottom: 12px">
        <template #title>仅作演示：模拟一张销售出库单，查看将自动生成的凭证分录</template>
      </el-alert>
      <el-descriptions :column="2" border>
        <el-descriptions-item label="业务单据">SO20250605001（销售出库）</el-descriptions-item>
        <el-descriptions-item label="客户">北京客户A公司</el-descriptions-item>
        <el-descriptions-item label="商品">商品A</el-descriptions-item>
        <el-descriptions-item label="仓库">主仓库</el-descriptions-item>
        <el-descriptions-item label="销售额">20,000.00</el-descriptions-item>
        <el-descriptions-item label="税额">2,600.00</el-descriptions-item>
        <el-descriptions-item label="总金额">22,600.00</el-descriptions-item>
        <el-descriptions-item label="成本">15,000.00</el-descriptions-item>
      </el-descriptions>
      <h4 style="margin: 16px 0 8px">将生成的凭证：</h4>
      <el-table :data="testEntries" border size="small">
        <el-table-column label="行" type="index" width="50" align="center" />
        <el-table-column prop="summary" label="摘要" min-width="240" />
        <el-table-column prop="subjectCode" label="科目" width="120" />
        <el-table-column prop="subjectName" label="科目名称" width="120" />
        <el-table-column prop="debitAmount" label="借方" width="100" align="right" />
        <el-table-column prop="creditAmount" label="贷方" width="100" align="right" />
      </el-table>
      <div style="margin-top: 12px; padding: 12px; background: #fafbfc; border-radius: 4px;">
        <strong>借贷合计：</strong>
        <span class="money debit">借方 {{ formatMoney(totalTestDebit) }}</span> ｜
        <span class="money credit">贷方 {{ formatMoney(totalTestCredit) }}</span>
        <el-tag v-if="isTestBalanced" type="success" size="small" style="margin-left: 8px">平衡</el-tag>
        <el-tag v-else type="danger" size="small" style="margin-left: 8px">不平衡</el-tag>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Plus, Refresh, MagicStick, VideoPlay,
  ShoppingCart, Box, Money, Wallet, Tickets, Document, Connection
} from '@element-plus/icons-vue'
import BaseSearch from '@/components/BaseSearch.vue'
import BaseTable from '@/components/BaseTable.vue'
import BaseDialog from '@/components/BaseDialog.vue'
import BaseForm from '@/components/BaseForm.vue'
import request from '@/utils/request'

const searchItems = [
  { prop: 'bizType', label: '业务类型', type: 'select', span: 8, options: [
    { value: '', label: '全部' },
    { value: 'sales_outbound', label: '销售出库' },
    { value: 'sales_return', label: '销售退货' },
    { value: 'purchase_inbound', label: '采购入库' },
    { value: 'purchase_return', label: '采购退货' },
    { value: 'receipt', label: '收款单' },
    { value: 'payment', label: '付款单' },
    { value: 'expense', label: '费用报销' },
    { value: 'stocktake', label: '库存盘点' },
    { value: 'fx_adjust', label: '期末调汇' }
  ]}
]

const columns = [
  { prop: 'bizType', label: '业务类型', width: 130, slot: 'bizType' },
  { prop: 'templateName', label: '模板名称', minWidth: 200 },
  { prop: 'summary', label: '摘要模板', minWidth: 220, showOverflowTooltip: true },
  { prop: 'direction', label: '方向', width: 80, slot: 'direction' },
  { prop: 'subjectCode', label: '科目', width: 110, slot: 'subjectCode' },
  { prop: 'amountSource', label: '金额来源', width: 130 },
  { prop: 'assistConfig', label: '辅助核算', minWidth: 200, slot: 'assistConfig' },
  { prop: 'sort', label: '顺序', width: 60, align: 'center' },
  { prop: 'enabled', label: '启用', width: 70, slot: 'enabled' }
]

const bizTypes = [
  { value: 'sales_outbound', label: '销售出库', icon: 'ShoppingCart', color: '#67c23a' },
  { value: 'purchase_inbound', label: '采购入库', icon: 'Box', color: '#409eff' },
  { value: 'receipt', label: '收款单', icon: 'Money', color: '#e6a23c' },
  { value: 'payment', label: '付款单', icon: 'Wallet', color: '#f56c6c' },
  { value: 'expense', label: '费用报销', icon: 'Tickets', color: '#909399' },
  { value: 'stocktake', label: '库存盘点', icon: 'Document', color: '#9b59b6' }
]

const queryParams = reactive({ pageNum: 1, pageSize: 20, bizType: '' })
const tableData = ref([])
const allData = ref([])
const total = ref(0)
const loading = ref(false)

const dialogVisible = ref(false)
const dialogTitle = ref('')
const submitLoading = ref(false)
const formRef = ref(null)
const formData = reactive({
  id: undefined, bizType: 'sales_outbound', templateName: '', summary: '',
  direction: 'debit', subjectCode: '', amountSource: '', assistConfig: {}, sort: 1, enabled: true
})

const formItems = [
  { prop: 'bizType', label: '业务类型', type: 'select', span: 12, options: bizTypes.map(t => ({ value: t.value, label: t.label })) },
  { prop: 'templateName', label: '模板名称', type: 'input', span: 12 },
  { prop: 'summary', label: '摘要模板', type: 'input', span: 24, placeholder: '支持变量: {orderNo} {customerName} {supplierName} {applicant}' },
  { prop: 'direction', label: '方向', type: 'radio', span: 12, options: [{ value: 'debit', label: '借方' }, { value: 'credit', label: '贷方' }] },
  { prop: 'subjectCode', label: '科目编码', type: 'input', span: 12, placeholder: '如 5001' },
  { prop: 'amountSource', label: '金额来源', type: 'select', span: 12, options: [
    { value: 'salesAmount', label: '销售额' },
    { value: 'taxAmount', label: '税额' },
    { value: 'totalAmount', label: '总金额' },
    { value: 'costAmount', label: '成本' },
    { value: 'goodsAmount', label: '商品金额' },
    { value: 'amount', label: '金额' },
    { value: 'lossAmount', label: '盘亏金额' },
    { value: 'profitAmount', label: '盘盈金额' },
    { value: 'fxAmount', label: '调汇金额' }
  ] },
  { prop: 'sort', label: '顺序', type: 'number', span: 12, min: 1, max: 99 },
  { prop: 'enabled', label: '启用', type: 'switch', span: 12, activeText: '启用', inactiveText: '停用' }
]

const formRules = {
  bizType: [{ required: true, message: '请选择业务类型' }],
  templateName: [{ required: true, message: '请输入模板名称' }],
  summary: [{ required: true, message: '请输入摘要模板' }],
  direction: [{ required: true, message: '请选择方向' }],
  subjectCode: [{ required: true, message: '请输入科目编码' }],
  amountSource: [{ required: true, message: '请选择金额来源' }]
}

const testDialogVisible = ref(false)
const testEntries = ref([])
const totalTestDebit = computed(() => testEntries.value.reduce((s, e) => s + (Number(e.debitAmount) || 0), 0))
const totalTestCredit = computed(() => testEntries.value.reduce((s, e) => s + (Number(e.creditAmount) || 0), 0))
const isTestBalanced = computed(() => Math.abs(totalTestDebit.value - totalTestCredit.value) < 0.01)

async function loadData() {
  loading.value = true
  try {
    const res = await request({ url: '/api/finance/voucherTemplate/list', method: 'get', params: { pageNum: 1, pageSize: 1000 } })
    allData.value = res.data.list || []
    applyFilter()
  } finally {
    loading.value = false
  }
}

function applyFilter() {
  let data = allData.value
  if (queryParams.bizType) data = data.filter(t => t.bizType === queryParams.bizType)
  total.value = data.length
  const start = (queryParams.pageNum - 1) * queryParams.pageSize
  tableData.value = data.slice(start, start + queryParams.pageSize)
}

function getCountByBiz(biz) {
  return allData.value.filter(t => t.bizType === biz).length
}
function filterByBizType(v) {
  queryParams.bizType = queryParams.bizType === v ? '' : v
  queryParams.pageNum = 1
  applyFilter()
}
function bizTypeName(v) {
  return bizTypes.find(t => t.value === v)?.label || v
}
function bizTypeTagType(v) {
  return { sales_outbound: 'success', purchase_inbound: '', receipt: 'warning', payment: 'danger', expense: 'info', stocktake: '' }[v] || ''
}
function assistName(v) {
  return { customer: '客户', supplier: '供应商', dept: '部门', staff: '职员', project: '项目', goods: '商品', warehouse: '仓库', bankAccount: '银行账户' }[v] || v
}
function formatMoney(v) {
  if (v === null || v === undefined || v === '') return '0.00'
  return Number(v).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function handleAdd() {
  dialogTitle.value = '新增凭证模板'
  Object.keys(formData).forEach(k => {
    if (typeof formData[k] === 'object') formData[k] = {}
    else if (typeof formData[k] === 'boolean') formData[k] = true
    else if (typeof formData[k] === 'number') formData[k] = 1
    else formData[k] = ''
  })
  formData.bizType = 'sales_outbound'
  formData.direction = 'debit'
  formData.sort = 1
  formData.enabled = true
  formData.id = undefined
  dialogVisible.value = true
}
function handleEdit(row) {
  dialogTitle.value = '编辑凭证模板'
  Object.assign(formData, row)
  formData.assistConfig = { ...(row.assistConfig || {}) }
  dialogVisible.value = true
}
function cancelDialog() { dialogVisible.value = false }
async function handleSubmit() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return
  submitLoading.value = true
  try {
    await request({ url: '/api/finance/voucherTemplate/save', method: 'post', data: formData })
    ElMessage.success('保存成功')
    dialogVisible.value = false
    loadData()
  } catch (e) {
    ElMessage.error(e.message || '保存失败')
  } finally {
    submitLoading.value = false
  }
}
async function handleDelete(row) {
  await ElMessageBox.confirm(`确定删除模板【${row.templateName}】?`, '提示', { type: 'warning' })
  await request({ url: '/api/finance/voucherTemplate/delete', method: 'post', data: { id: row.id } })
  ElMessage.success('删除成功')
  loadData()
}
async function handleToggle(row, v) {
  await request({ url: '/api/finance/voucherTemplate/save', method: 'post', data: { id: row.id, enabled: v } })
  ElMessage.success(v ? '已启用' : '已停用')
}
function handleInit() {
  ElMessageBox.confirm('将重新初始化预置凭证模板（19条），是否继续?', '提示', { type: 'info' })
    .then(() => { ElMessage.success('初始化成功'); loadData() })
    .catch(() => {})
}
function handleTestGenerate() {
  testEntries.value = [
    { summary: '销售应收-北京客户A', subjectCode: '1122', subjectName: '应收账款', debitAmount: 22600, creditAmount: 0 },
    { summary: '销售收入-商品A', subjectCode: '5001', subjectName: '主营业务收入', debitAmount: 0, creditAmount: 20000 },
    { summary: '销项税-SO20250605001', subjectCode: '2221.01', subjectName: '应交增值税', debitAmount: 0, creditAmount: 2600 },
    { summary: '主营业务成本-SO20250605001', subjectCode: '5401', subjectName: '主营业务成本', debitAmount: 15000, creditAmount: 0 },
    { summary: '销售出库-商品A', subjectCode: '1405', subjectName: '库存商品', debitAmount: 0, creditAmount: 15000 }
  ]
  testDialogVisible.value = true
}

function handleSearch(p) { Object.assign(queryParams, p, { pageNum: 1 }); applyFilter() }
function handleReset() { queryParams.bizType = ''; queryParams.pageNum = 1; applyFilter() }
function handlePageChange(p) { queryParams.pageNum = p; applyFilter() }
function handleSizeChange(s) { queryParams.pageSize = s; queryParams.pageNum = 1; applyFilter() }

onMounted(() => loadData())
</script>

<style lang="scss" scoped>
.template-page {
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
  .biz-type-cards {
    display: grid;
    grid-template-columns: repeat(6, 1fr);
    gap: 12px;
    margin-bottom: 16px;
    .biz-type-card {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 14px;
      background: #fff;
      border-radius: var(--border-radius-base);
      border: 1px solid #ebeef5;
      cursor: pointer;
      transition: all 0.2s;
      &:hover { box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
      &.active { border-color: #409eff; background: #ecf5ff; }
      .card-text {
        .card-label { font-weight: 600; color: #303133; }
        .card-count { font-size: 12px; color: #909399; }
      }
    }
  }
  .subject-code { font-family: monospace; font-weight: 500; }
  .text-muted { color: #c0c4cc; }
  .money { font-family: monospace; font-weight: 500; }
  .money.debit { color: #67c23a; }
  .money.credit { color: #f56c6c; }
}
</style>
