<template>
  <div class="page-container">
    <div class="bank-grid">
      <div v-for="b in bankAccounts" :key="b.id" class="bank-card" :class="{ active: currentAccount?.id === b.id }" @click="currentAccount = b">
        <div class="bank-icon" :style="{ background: b.color }">{{ b.shortName }}</div>
        <div class="bank-info">
          <div class="bank-name">{{ b.name }}</div>
          <div class="bank-no">****{{ b.no.slice(-4) }}</div>
          <div class="bank-balance">¥{{ b.balance.toLocaleString() }}</div>
        </div>
      </div>
    </div>
    <div class="table-toolbar">
      <div class="toolbar-left">
        <el-button type="primary" :icon="Refresh" @click="loadTransactions">同步交易</el-button>
        <el-button :icon="Printer" @click="handlePrint">打印</el-button>
        <el-button :icon="Download" plain @click="handleExport">导出对账单</el-button>
      </div>
    </div>
    <BaseSearch :search-items="searchItems" @search="handleSearch" @reset="handleReset" />
    <BaseTable :columns="columns" :table-data="tableData" :loading="loading" :total="total" :current-page.sync="queryParams.pageNum" :page-size.sync="queryParams.pageSize" :show-index="true" @current-change="handlePageChange" @size-change="handleSizeChange">
      <template #direction="{ row }"><el-tag :type="row.direction === '收入' ? 'success' : 'danger'" size="small">{{ row.direction }}</el-tag></template>
      <template #status="{ row }"><BaseStatusTag :type="row.status === '已对账' ? 'success' : 'info'">{{ row.status }}</BaseStatusTag></template>
      <template #operation="{ row }">
        <el-button v-for="action in getActions(row).slice(0, 3)" :key="action.key" :type="action.type" link size="small" @click="action.handler(row)">{{ action.label }}</el-button>
        <el-dropdown v-if="getActions(row).length > 3" trigger="click" @command="(cmd) => handleCommand(cmd, row)">
          <el-button type="primary" link size="small">更多<el-icon class="el-icon--right"><ArrowDown /></el-icon></el-button>
          <template #dropdown><el-dropdown-menu><el-dropdown-item v-for="action in getActions(row).slice(3)" :key="action.key" :command="action.key">{{ action.label }}</el-dropdown-item></el-dropdown-menu></template>
        </el-dropdown>
      </template>
    </BaseTable>
    <el-dialog v-model="payVisible" title="发起支付" width="500px">
      <el-form :model="payForm" label-width="100px">
        <el-form-item label="收款方" required><el-input v-model="payForm.payee" /></el-form-item>
        <el-form-item label="收款账号" required><el-input v-model="payForm.payeeAccount" /></el-form-item>
        <el-form-item label="金额" required><el-input-number v-model="payForm.amount" :min="0" :precision="2" style="width: 100%" /></el-form-item>
        <el-form-item label="用途"><el-input v-model="payForm.purpose" type="textarea" :rows="2" /></el-form-item>
      </el-form>
      <template #footer><el-button @click="payVisible = false">取消</el-button><el-button type="primary" @click="confirmPay">确认支付</el-button></template>
    </el-dialog>
  </div>
</template>
<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Refresh, Download, Plus, ArrowDown } from '@element-plus/icons-vue'
import BaseSearch from '@/components/BaseSearch.vue'
import BaseTable from '@/components/BaseTable.vue'
import BaseStatusTag from '@/components/BaseStatusTag.vue'
const bankAccounts = [
  { id: 1, name: '工商银行基本户', shortName: 'ICBC', no: '6222021234567890', balance: 2850000.50, color: '#c62828' },
  { id: 2, name: '建设银行一般户', shortName: 'CCB', no: '6217001234567890', balance: 1850500.20, color: '#1565c0' },
  { id: 3, name: '招商银行', shortName: 'CMB', no: '6225881234567890', balance: 680000.00, color: '#c62828' }
]
const currentAccount = ref(bankAccounts[0])
const searchItems = [{ prop: 'date', label: '交易日期', type: 'date' }, { prop: 'direction', label: '收/支', type: 'select', options: [{ value: '收入', label: '收入' }, { value: '支出', label: '支出' }] }]
const columns = [{ prop: 'date', label: '日期', width: 110 }, { prop: 'direction', label: '收/支', width: 80, slot: 'direction' }, { prop: 'payee', label: '对方户名', width: 160 }, { prop: 'amount', label: '金额', width: 120, align: 'right' }, { prop: 'balance', label: '余额', width: 120, align: 'right' }, { prop: 'purpose', label: '用途', minWidth: 200 }, { prop: 'status', label: '状态', width: 90, slot: 'status' }]
const loading = ref(false), tableData = ref([]), total = ref(0)
const payVisible = ref(false), payForm = reactive({ payee: '', payeeAccount: '', amount: 0, purpose: '' })
const queryParams = reactive({ pageNum: 1, pageSize: 10, date: '', direction: '' })
async function loadTransactions() {
  ElMessage.success('正在同步银企直联数据...')
  await new Promise(r => setTimeout(r, 600))
  ElMessage.success('同步完成，新增 5 笔交易')
  loadData()
}
async function loadData() {
  loading.value = true
  try {
    const all = Array.from({ length: 30 }, (_, i) => {
      const d = i % 2 === 0 ? '收入' : '支出'
      return { id: i + 1, date: `2024-${String((i % 12) + 1).padStart(2, '0')}-${String((i % 28) + 1).padStart(2, '0')}`, direction: d, payee: ['A客户', 'B供应商', 'C客户', 'D公司', 'E物流'][i % 5], amount: (1000 + i * 220).toFixed(2), balance: (2000000 + i * 5000).toFixed(2), purpose: ['货款', '运费', '服务费', '退款', '工资'][i % 5], status: i % 3 === 0 ? '未对账' : '已对账' }
    })
    const { direction = '', pageNum = 1, pageSize = 10 } = queryParams
    let filtered = all
    if (direction) filtered = filtered.filter(x => x.direction === direction)
    const start = (Number(pageNum) - 1) * Number(pageSize)
    tableData.value = filtered.slice(start, start + Number(pageSize))
    total.value = filtered.length
  } finally { loading.value = false }
}
function handleSearch(p) { Object.assign(queryParams, p, { pageNum: 1 }); loadData() }
function handleReset() { Object.keys(queryParams).forEach(k => { if (k !== 'pageNum' && k !== 'pageSize') queryParams[k] = '' }); loadData() }
function handlePageChange(p) { queryParams.pageNum = p; loadData() }
function handleSizeChange(s) { queryParams.pageSize = s; queryParams.pageNum = 1; loadData() }
function handleExport() { ElMessage.success('已导出对账单') }
function openPay() { Object.keys(payForm).forEach(k => payForm[k] = ''); payVisible.value = true }
async function confirmPay() { if (!payForm.payee || !payForm.amount) { ElMessage.warning('请填写收款方和金额'); return }; ElMessage.success(`已发起支付 ¥${payForm.amount}`); payVisible.value = false; loadData() }
async function handleReconcile(row) { row.status = '已对账'; ElMessage.success('对账完成') }
function getActions(row) {
  const actions = [{ key: 'view', label: '查看', type: 'primary', handler: (r) => ElMessage.info(`查看 ${r.payee} 的交易`) }]
  if (row.status === '未对账') actions.push({ key: 'reconcile', label: '对账', type: 'success', handler: handleReconcile })
  actions.push({ key: 'pay', label: '发起支付', type: 'warning', handler: openPay })
  return actions
}
function handleCommand(cmd, row) { getActions(row).find(a => a.key === cmd)?.handler(row) }
onMounted(() => loadData())
</script>
<style lang="scss" scoped>
.bank-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; margin-bottom: 20px }
.bank-card { display: flex; align-items: center; gap: 16px; padding: 20px; background: linear-gradient(135deg, #fff, #f5f7fa); border: 1px solid #ebeef5; border-radius: 8px; cursor: pointer; transition: all .2s; &.active, &:hover { border-color: #409eff; box-shadow: 0 2px 12px rgba(64,158,255,.2) } }
.bank-icon { width: 56px; height: 56px; border-radius: 50%; color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 14px }
.bank-name { font-size: 15px; font-weight: 600; color: #303133 }
.bank-no { font-size: 13px; color: #909399; margin-top: 4px }
.bank-balance { font-size: 18px; font-weight: 700; color: #67c23a; margin-top: 4px }
.table-toolbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; padding: 14px 18px; background: #fff; border-radius: var(--border-radius-base); .toolbar-left { display: flex; gap: 10px; } .toolbar-right { display: flex; gap: 8px; } }
</style>
