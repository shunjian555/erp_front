<template>
  <div class="page-container">
    <BaseSearch :search-items="searchItems" @search="handleSearch" @reset="handleReset" />
    <div class="table-toolbar">
      <div class="toolbar-left">
        <el-button type="primary" :icon="Plus" @click="handleAdd">新增出纳单</el-button>
        <el-button :icon="Download" plain @click="handleExport">导出</el-button>
      </div>
      <div class="toolbar-right"><el-button :icon="Refresh" circle @click="loadData" /></div>
    </div>
    <BaseTable :columns="columns" :table-data="tableData" :loading="loading" :total="total" :current-page.sync="queryParams.pageNum" :page-size.sync="queryParams.pageSize" :show-index="true" @current-change="handlePageChange" @size-change="handleSizeChange">
      <template #type="{ row }"><el-tag :type="row.type === '收款' ? 'success' : 'warning'" size="small">{{ row.type }}</el-tag></template>
      <template #status="{ row }"><BaseStatusTag :type="row.status === 1 ? 'success' : 'info'">{{ row.status === 1 ? '已记账' : '未记账' }}</BaseStatusTag></template>
      <template #operation="{ row }">
        <el-button v-for="action in getActions(row).slice(0, 3)" :key="action.key" :type="action.type" link size="small" @click="action.handler(row)">{{ action.label }}</el-button>
        <el-dropdown v-if="getActions(row).length > 3" trigger="click" @command="(cmd) => handleCommand(cmd, row)">
          <el-button type="primary" link size="small">更多<el-icon class="el-icon--right"><ArrowDown /></el-icon></el-button>
          <template #dropdown><el-dropdown-menu><el-dropdown-item v-for="action in getActions(row).slice(3)" :key="action.key" :command="action.key">{{ action.label }}</el-dropdown-item></el-dropdown-menu></template>
        </el-dropdown>
      </template>
    </BaseTable>
    <BaseDialog v-model="dialogVisible" :title="dialogTitle" width="600px" :confirm-loading="submitLoading" @confirm="handleSubmit" @cancel="cancelDialog"><BaseForm ref="formRef" v-model="formData" :form-items="formItems" :form-rules="formRules" :col-count="2" /></BaseDialog>
    <el-dialog v-model="viewVisible" title="出纳单详情" width="600px">
      <el-descriptions v-if="viewRow" :column="2" border>
        <el-descriptions-item label="单号">{{ viewRow.code }}</el-descriptions-item>
        <el-descriptions-item label="类型">{{ viewRow.type }}</el-descriptions-item>
        <el-descriptions-item label="收/付方">{{ viewRow.party }}</el-descriptions-item>
        <el-descriptions-item label="账户">{{ viewRow.account }}</el-descriptions-item>
        <el-descriptions-item label="金额">{{ viewRow.amount }}</el-descriptions-item>
        <el-descriptions-item label="状态">{{ viewRow.status === 1 ? '已记账' : '未记账' }}</el-descriptions-item>
        <el-descriptions-item label="日期">{{ viewRow.date }}</el-descriptions-item>
        <el-descriptions-item label="出纳员">{{ viewRow.cashier }}</el-descriptions-item>
        <el-descriptions-item label="备注" :span="2">{{ viewRow.remark }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>
<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Download, Refresh, ArrowDown } from '@element-plus/icons-vue'
import BaseSearch from '@/components/BaseSearch.vue'
import BaseTable from '@/components/BaseTable.vue'
import BaseDialog from '@/components/BaseDialog.vue'
import BaseForm from '@/components/BaseForm.vue'
import BaseStatusTag from '@/components/BaseStatusTag.vue'
const searchItems = [{ prop: 'code', label: '单号', type: 'input' }, { prop: 'party', label: '收/付方', type: 'input' }]
const columns = [{ prop: 'code', label: '单号', width: 160 }, { prop: 'type', label: '类型', width: 80, slot: 'type' }, { prop: 'party', label: '收/付方', width: 140 }, { prop: 'account', label: '账户', width: 120 }, { prop: 'amount', label: '金额', width: 110, align: 'right' }, { prop: 'cashier', label: '出纳员', width: 90 }, { prop: 'date', label: '日期', width: 110 }, { prop: 'status', label: '状态', width: 80, slot: 'status' }]
const formItems = [{ prop: 'code', label: '单号', type: 'input', span: 12 }, { prop: 'type', label: '类型', type: 'select', options: [{ value: '收款', label: '收款' }, { value: '付款', label: '付款' }], span: 12 }, { prop: 'party', label: '收/付方', type: 'input', span: 12 }, { prop: 'account', label: '账户', type: 'select', options: [{ value: '工行001', label: '工行001' }, { value: '建行002', label: '建行002' }, { value: '现金', label: '现金' }], span: 12 }, { prop: 'amount', label: '金额', type: 'number', span: 12 }, { prop: 'date', label: '日期', type: 'date', span: 12 }, { prop: 'remark', label: '备注', type: 'textarea', rows: 2, span: 24 }]
const formRules = { code: [{ required: true, message: '请输入单号', trigger: 'blur' }], amount: [{ required: true, message: '请输入金额', trigger: 'blur' }] }
const loading = ref(false), tableData = ref([]), total = ref(0)
const dialogVisible = ref(false), dialogTitle = ref(''), submitLoading = ref(false), formRef = ref(null)
const viewVisible = ref(false), viewRow = ref(null)
const queryParams = reactive({ pageNum: 1, pageSize: 10, code: '', party: '' })
const formData = reactive({ id: undefined, code: '', type: '收款', party: '', account: '工行001', amount: undefined, date: '', remark: '' })
async function loadData() {
  loading.value = true
  try {
    const all = Array.from({ length: 22 }, (_, i) => {
      const tp = i % 2 === 0 ? '收款' : '付款'
      return { id: i + 1, code: `CN${String(i + 1).padStart(5, '0')}`, type: tp, party: ['A客户', 'B供应商', 'C客户', 'D供应商'][i % 4], account: ['工行001', '建行002', '现金'][i % 3], amount: (1000 + i * 350).toFixed(2), cashier: ['出纳小李', '出纳小王'][i % 2], date: `2024-${String((i % 12) + 1).padStart(2, '0')}-${String((i % 28) + 1).padStart(2, '0')}`, status: i % 3 === 0 ? 0 : 1, remark: '' }
    })
    const { code = '', party = '', pageNum = 1, pageSize = 10 } = queryParams
    let filtered = all
    if (code) filtered = filtered.filter(x => x.code.includes(code))
    if (party) filtered = filtered.filter(x => x.party.includes(party))
    const start = (Number(pageNum) - 1) * Number(pageSize)
    tableData.value = filtered.slice(start, start + Number(pageSize))
    total.value = filtered.length
  } finally { loading.value = false }
}
function handleSearch(p) { Object.assign(queryParams, p, { pageNum: 1 }); loadData() }
function handleReset() { Object.keys(queryParams).forEach(k => { if (k !== 'pageNum' && k !== 'pageSize') queryParams[k] = '' }); loadData() }
function handlePageChange(p) { queryParams.pageNum = p; loadData() }
function handleSizeChange(s) { queryParams.pageSize = s; queryParams.pageNum = 1; loadData() }
function handleAdd() { dialogTitle.value = '新增出纳单'; Object.keys(formData).forEach(k => formData[k] = ''); formData.id = undefined; formData.type = '收款'; formData.account = '工行001'; dialogVisible.value = true }
function handleView(row) { viewRow.value = row; viewVisible.value = true }
function handlePrint(row) { browserPrint({ title: `出纳单-${row.code}` }) }
function handleEdit(r) { dialogTitle.value = '编辑出纳单'; Object.assign(formData, r); dialogVisible.value = true }
function handlePost(row) { row.status = 1; ElMessage.success('记账成功') }
function handleExport() { exportToExcel(tableData.value, columns, '出纳单据') }
function cancelDialog() { dialogVisible.value = false; formRef.value?.resetFields() }
async function handleSubmit() { const valid = await formRef.value?.validate().catch(() => false); if (!valid) return; submitLoading.value = true; try { await new Promise(r => setTimeout(r, 500)); ElMessage.success('操作成功'); dialogVisible.value = false; loadData() } catch { ElMessage.error('操作失败') } finally { submitLoading.value = false } }
async function handleDelete(row) { await ElMessageBox.confirm(`确定删除「${row.code}」?`, '提示', { type: 'warning' }); ElMessage.success('删除成功'); loadData() }
function getActions(row) {
  const actions = [{ key: 'view', label: '查看', type: 'primary', handler: handleView }, { key: 'print', label: '打印', type: 'primary', handler: handlePrint }, { key: 'edit', label: '编辑', type: 'primary', handler: handleEdit }]
  if (row.status === 0) actions.push({ key: 'post', label: '记账', type: 'success', handler: handlePost })
  actions.push({ key: 'delete', label: '删除', type: 'danger', handler: handleDelete })
  return actions
}
function handleCommand(cmd, row) { getActions(row).find(a => a.key === cmd)?.handler(row) }
onMounted(() => loadData())
</script>
<style lang="scss" scoped>.page-container .table-toolbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; padding: 14px 18px; background: #fff; border-radius: var(--border-radius-base); .toolbar-left { display: flex; gap: 10px; } .toolbar-right { display: flex; gap: 8px; } }</style>
