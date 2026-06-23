<template>
  <div class="page-container">
    <div class="plan-stats">
      <div class="stat-card"><div class="stat-label">本月预算收入</div><div class="stat-value">¥{{ stats.income.toLocaleString() }}</div></div>
      <div class="stat-card"><div class="stat-label">本月预算支出</div><div class="stat-value">¥{{ stats.expense.toLocaleString() }}</div></div>
      <div class="stat-card"><div class="stat-label">预算结余</div><div class="stat-value" :style="{ color: stats.balance >= 0 ? '#67c23a' : '#f56c6c' }">¥{{ stats.balance.toLocaleString() }}</div></div>
      <div class="stat-card"><div class="stat-label">执行率</div><div class="stat-value">{{ stats.rate }}%</div></div>
    </div>
    <BaseSearch :search-items="searchItems" @search="handleSearch" @reset="handleReset" />
    <div class="table-toolbar">
      <div class="toolbar-left">
        <el-button type="primary" :icon="Plus" @click="handleAdd">新增计划</el-button>
        <el-button :icon="Promotion" @click="handleTransfer">资金调拨</el-button>
      </div>
    </div>
    <BaseTable :columns="columns" :table-data="tableData" :loading="loading" :total="total" :current-page.sync="queryParams.pageNum" :page-size.sync="queryParams.pageSize" :show-index="true" @current-change="handlePageChange" @size-change="handleSizeChange">
      <template #type="{ row }"><el-tag :type="row.type === '收入' ? 'success' : 'warning'" size="small">{{ row.type }}</el-tag></template>
      <template #status="{ row }"><BaseStatusTag :type="row.status === 1 ? 'success' : row.status === 2 ? 'info' : 'warning'">{{ { 0: '待审批', 1: '已审批', 2: '已执行' }[row.status] }}</BaseStatusTag></template>
      <template #operation="{ row }">
        <el-button v-for="action in getActions(row).slice(0, 3)" :key="action.key" :type="action.type" link size="small" @click="action.handler(row)">{{ action.label }}</el-button>
        <el-dropdown v-if="getActions(row).length > 3" trigger="click" @command="(cmd) => handleCommand(cmd, row)">
          <el-button type="primary" link size="small">更多<el-icon class="el-icon--right"><ArrowDown /></el-icon></el-button>
          <template #dropdown><el-dropdown-menu><el-dropdown-item v-for="action in getActions(row).slice(3)" :key="action.key" :command="action.key">{{ action.label }}</el-dropdown-item></el-dropdown-menu></template>
        </el-dropdown>
      </template>
    </BaseTable>
    <BaseDialog v-model="dialogVisible" :title="dialogTitle" width="600px" :confirm-loading="submitLoading" @confirm="handleSubmit" @cancel="cancelDialog"><BaseForm ref="formRef" v-model="formData" :form-items="formItems" :form-rules="formRules" :col-count="2" /></BaseDialog>
    <el-dialog v-model="transferVisible" title="资金调拨" width="500px">
      <el-form :model="transferForm" label-width="100px">
        <el-form-item label="转出账户" required><el-select v-model="transferForm.from" style="width: 100%"><el-option v-for="a in accounts" :key="a" :label="a" :value="a" /></el-select></el-form-item>
        <el-form-item label="转入账户" required><el-select v-model="transferForm.to" style="width: 100%"><el-option v-for="a in accounts" :key="a" :label="a" :value="a" /></el-select></el-form-item>
        <el-form-item label="金额" required><el-input-number v-model="transferForm.amount" :min="0" :precision="2" style="width: 100%" /></el-form-item>
        <el-form-item label="备注"><el-input v-model="transferForm.remark" type="textarea" :rows="2" /></el-form-item>
      </el-form>
      <template #footer><el-button @click="transferVisible = false">取消</el-button><el-button type="primary" @click="confirmTransfer">确认调拨</el-button></template>
    </el-dialog>
  </div>
</template>
<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Promotion, ArrowDown } from '@element-plus/icons-vue'
import BaseSearch from '@/components/BaseSearch.vue'
import BaseTable from '@/components/BaseTable.vue'
import BaseDialog from '@/components/BaseDialog.vue'
import BaseForm from '@/components/BaseForm.vue'
import BaseStatusTag from '@/components/BaseStatusTag.vue'
import { exportToExcel } from '@/utils/excel'
import { browserPrint } from '@/utils/print'
const accounts = ['工行001', '建行002', '招行003', '现金']
const stats = reactive({ income: 5800000, expense: 4250000 })
stats.balance = stats.income - stats.expense
stats.rate = Math.round((stats.expense / stats.income) * 100)
const searchItems = [{ prop: 'period', label: '期间', type: 'input' }]
const columns = [{ prop: 'period', label: '期间', width: 110 }, { prop: 'type', label: '类型', width: 80, slot: 'type' }, { prop: 'subject', label: '科目', width: 160 }, { prop: 'amount', label: '金额', width: 130, align: 'right' }, { prop: 'applicant', label: '申请人', width: 100 }, { prop: 'status', label: '状态', width: 90, slot: 'status' }, { prop: 'createTime', label: '创建时间', width: 170 }]
const formItems = [{ prop: 'period', label: '期间', type: 'input', span: 12 }, { prop: 'type', label: '类型', type: 'select', options: [{ value: '收入', label: '收入' }, { value: '支出', label: '支出' }], span: 12 }, { prop: 'subject', label: '科目', type: 'input', span: 12 }, { prop: 'amount', label: '金额', type: 'number', span: 12 }, { prop: 'applicant', label: '申请人', type: 'input', span: 12 }, { prop: 'remark', label: '备注', type: 'textarea', rows: 2, span: 24 }]
const formRules = { period: [{ required: true, message: '请输入期间', trigger: 'blur' }], amount: [{ required: true, message: '请输入金额', trigger: 'blur' }] }
const loading = ref(false), tableData = ref([]), total = ref(0)
const dialogVisible = ref(false), dialogTitle = ref(''), submitLoading = ref(false), formRef = ref(null)
const transferVisible = ref(false), transferForm = reactive({ from: '工行001', to: '建行002', amount: 0, remark: '' })
const queryParams = reactive({ pageNum: 1, pageSize: 10, period: '' })
const formData = reactive({ id: undefined, period: '2024-07', type: '收入', subject: '', amount: undefined, applicant: '', remark: '' })
async function loadData() {
  loading.value = true
  try {
    const all = Array.from({ length: 20 }, (_, i) => {
      const tp = i % 3 === 0 ? '收入' : '支出'
      return { id: i + 1, period: `2024-${String((i % 12) + 1).padStart(2, '0')}`, type: tp, subject: ['销售收入', '采购支出', '工资', '水电费', '办公费', '投资收益'][i % 6], amount: (50000 + i * 8000).toFixed(2), applicant: ['财务小张', '财务小李'][i % 2], status: i % 4, createTime: `2024-${String((i % 12) + 1).padStart(2, '0')}-${String((i % 28) + 1).padStart(2, '0')} 10:00:00` }
    })
    const { period = '', pageNum = 1, pageSize = 10 } = queryParams
    let filtered = all
    if (period) filtered = filtered.filter(x => x.period.includes(period))
    const start = (Number(pageNum) - 1) * Number(pageSize)
    tableData.value = filtered.slice(start, start + Number(pageSize))
    total.value = filtered.length
  } finally { loading.value = false }
}
function handleSearch(p) { Object.assign(queryParams, p, { pageNum: 1 }); loadData() }
function handleReset() { Object.keys(queryParams).forEach(k => { if (k !== 'pageNum' && k !== 'pageSize') queryParams[k] = '' }); loadData() }
function handlePageChange(p) { queryParams.pageNum = p; loadData() }
function handleSizeChange(s) { queryParams.pageSize = s; queryParams.pageNum = 1; loadData() }
function handleAdd() { dialogTitle.value = '新增资金计划'; Object.keys(formData).forEach(k => formData[k] = ''); formData.id = undefined; formData.period = '2024-07'; formData.type = '收入'; dialogVisible.value = true }
function handleTransfer() { Object.keys(transferForm).forEach(k => transferForm[k] = ''); transferForm.from = '工行001'; transferForm.to = '建行002'; transferVisible.value = true }
async function confirmTransfer() { if (!transferForm.amount) { ElMessage.warning('请输入金额'); return }; ElMessage.success(`已调拨 ¥${transferForm.amount} 至 ${transferForm.to}`); transferVisible.value = false }
function cancelDialog() { dialogVisible.value = false; formRef.value?.resetFields() }
async function handleSubmit() { const valid = await formRef.value?.validate().catch(() => false); if (!valid) return; submitLoading.value = true; try { await new Promise(r => setTimeout(r, 500)); ElMessage.success('操作成功'); dialogVisible.value = false; loadData() } catch { ElMessage.error('操作失败') } finally { submitLoading.value = false } }
async function handleDelete(row) { await ElMessageBox.confirm(`确定删除该计划?`, '提示', { type: 'warning' }); ElMessage.success('删除成功'); loadData() }
function getActions(row) {
  const actions = [{ key: 'view', label: '查看', type: 'primary', handler: (r) => ElMessage.info(`查看 ${r.subject}`) }, { key: 'edit', label: '编辑', type: 'primary', handler: (r) => { dialogTitle.value = '编辑计划'; Object.assign(formData, r); dialogVisible.value = true } }]
  if (row.status === 0) actions.push({ key: 'approve', label: '审批', type: 'success', handler: (r) => { r.status = 1; ElMessage.success('已审批') } })
  if (row.status === 1) actions.push({ key: 'execute', label: '执行', type: 'warning', handler: (r) => { r.status = 2; ElMessage.success('已执行') } })
  actions.push({ key: 'delete', label: '删除', type: 'danger', handler: handleDelete })
  return actions
}
function handleCommand(cmd, row) { getActions(row).find(a => a.key === cmd)?.handler(row) }
onMounted(() => loadData())
</script>
<style lang="scss" scoped>
.plan-stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 20px }
.stat-card { padding: 20px; background: linear-gradient(135deg, #fff, #f5f7fa); border: 1px solid #ebeef5; border-radius: 8px; text-align: center }
.stat-label { font-size: 13px; color: #909399; margin-bottom: 8px }
.stat-value { font-size: 24px; font-weight: 700; color: #303133 }
.table-toolbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; padding: 14px 18px; background: #fff; border-radius: var(--border-radius-base); .toolbar-left { display: flex; gap: 10px; } .toolbar-right { display: flex; gap: 8px; } }
</style>
