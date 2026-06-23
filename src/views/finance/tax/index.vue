<template>
  <div class="page-container">
    <el-tabs v-model="activeTab" class="tax-tabs">
      <el-tab-pane label="金税发票" name="invoice">
        <div class="table-toolbar">
          <div class="toolbar-left">
            <el-button type="primary" :icon="Plus" @click="handleAdd">新增发票</el-button>
            <el-button type="success" :icon="Connection" @click="handleSync">金税同步</el-button>
            <el-button :icon="Download" plain @click="handleExport">导出</el-button>
          </div>
        </div>
        <BaseSearch :search-items="searchItems" @search="handleSearch" @reset="handleReset" />
        <BaseTable :columns="invoiceColumns" :table-data="tableData" :loading="loading" :total="total" :current-page.sync="queryParams.pageNum" :page-size.sync="queryParams.pageSize" :show-index="true" @current-change="handlePageChange" @size-change="handleSizeChange">
          <template #type="{ row }"><el-tag :type="row.type === '销项' ? 'primary' : 'warning'" size="small">{{ row.type }}</el-tag></template>
          <template #status="{ row }"><BaseStatusTag :type="row.status === 1 ? 'success' : 'warning'">{{ row.status === 1 ? '已认证' : '待认证' }}</BaseStatusTag></template>
          <template #operation="{ row }">
            <el-button v-for="action in getInvoiceActions(row).slice(0, 3)" :key="action.key" :type="action.type" link size="small" @click="action.handler(row)">{{ action.label }}</el-button>
            <el-dropdown v-if="getInvoiceActions(row).length > 3" trigger="click" @command="(cmd) => handleCommand(cmd, row)">
              <el-button type="primary" link size="small">更多<el-icon class="el-icon--right"><ArrowDown /></el-icon></el-button>
              <template #dropdown><el-dropdown-menu><el-dropdown-item v-for="action in getInvoiceActions(row).slice(3)" :key="action.key" :command="action.key">{{ action.label }}</el-dropdown-item></el-dropdown-menu></template>
            </el-dropdown>
          </template>
        </BaseTable>
      </el-tab-pane>
      <el-tab-pane label="税务申报" name="declare">
        <div class="declare-grid">
          <div v-for="d in declareList" :key="d.id" class="declare-card">
            <div class="declare-title">{{ d.title }}</div>
            <div class="declare-info">
              <el-tag :type="d.status === '已申报' ? 'success' : 'warning'" size="small">{{ d.status }}</el-tag>
              <span class="declare-period">所属期: {{ d.period }}</span>
            </div>
            <div class="declare-amount">应纳税额: ¥{{ d.amount.toLocaleString() }}</div>
            <div class="declare-actions">
              <el-button type="primary" size="small" @click="handleDeclare(d)">{{ d.status === '已申报' ? '查看' : '立即申报' }}</el-button>
            </div>
          </div>
        </div>
      </el-tab-pane>
      <el-tab-pane label="税控状态" name="status">
        <div class="status-grid">
          <div class="status-card ok">
            <el-icon><CircleCheckFilled /></el-icon>
            <div>
              <div class="status-label">金税盘</div>
              <div class="status-value">在线 · 已连接</div>
            </div>
          </div>
          <div class="status-card ok">
            <el-icon><CircleCheckFilled /></el-icon>
            <div>
              <div class="status-label">税务数字证书</div>
              <div class="status-value">有效 · 至 2026-12-31</div>
            </div>
          </div>
          <div class="status-card warn">
            <el-icon><WarningFilled /></el-icon>
            <div>
              <div class="status-label">待办任务</div>
              <div class="status-value">增值税申报 · 截止 2024-07-15</div>
            </div>
          </div>
        </div>
      </el-tab-pane>
    </el-tabs>
    <BaseDialog v-model="dialogVisible" :title="dialogTitle" width="600px" :confirm-loading="submitLoading" @confirm="handleSubmit" @cancel="cancelDialog"><BaseForm ref="formRef" v-model="formData" :form-items="formItems" :form-rules="formRules" :col-count="2" /></BaseDialog>
  </div>
</template>
<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Connection, Download, ArrowDown, CircleCheckFilled, WarningFilled } from '@element-plus/icons-vue'
import BaseSearch from '@/components/BaseSearch.vue'
import BaseTable from '@/components/BaseTable.vue'
import BaseDialog from '@/components/BaseDialog.vue'
import BaseForm from '@/components/BaseForm.vue'
import BaseStatusTag from '@/components/BaseStatusTag.vue'
const activeTab = ref('invoice')
const searchItems = [{ prop: 'code', label: '发票号', type: 'input' }]
const invoiceColumns = [{ prop: 'code', label: '发票号', width: 160 }, { prop: 'type', label: '类型', width: 80, slot: 'type' }, { prop: 'party', label: '购/销方', width: 160 }, { prop: 'amount', label: '金额', width: 120, align: 'right' }, { prop: 'taxRate', label: '税率', width: 80, align: 'center' }, { prop: 'date', label: '开票日期', width: 120 }, { prop: 'status', label: '认证', width: 90, slot: 'status' }]
const formItems = [{ prop: 'code', label: '发票号', type: 'input', span: 12 }, { prop: 'type', label: '类型', type: 'select', options: [{ value: '销项', label: '销项' }, { value: '进项', label: '进项' }], span: 12 }, { prop: 'party', label: '购/销方', type: 'input', span: 12 }, { prop: 'amount', label: '金额', type: 'number', span: 12 }, { prop: 'taxRate', label: '税率(%)', type: 'number', span: 12 }, { prop: 'date', label: '开票日期', type: 'date', span: 12 }]
const formRules = { code: [{ required: true, message: '请输入发票号', trigger: 'blur' }] }
const declareList = [
  { id: 1, title: '增值税申报', period: '2024-06', status: '待申报', amount: 38420.50 },
  { id: 2, title: '企业所得税预缴', period: '2024-Q2', status: '已申报', amount: 18560.20 },
  { id: 3, title: '附加税申报', period: '2024-06', status: '待申报', amount: 4610.46 },
  { id: 4, title: '个人所得税', period: '2024-06', status: '已申报', amount: 12300.00 }
]
const loading = ref(false), tableData = ref([]), total = ref(0)
const dialogVisible = ref(false), dialogTitle = ref(''), submitLoading = ref(false), formRef = ref(null)
const queryParams = reactive({ pageNum: 1, pageSize: 10, code: '' })
const formData = reactive({ id: undefined, code: '', type: '销项', party: '', amount: undefined, taxRate: 13, date: '' })
async function loadData() {
  loading.value = true
  try {
    const all = Array.from({ length: 18 }, (_, i) => ({ id: i + 1, code: `INV${String(i + 1).padStart(6, '0')}`, type: i % 2 === 0 ? '销项' : '进项', party: ['A客户', 'B供应商', 'C客户', 'D供应商'][i % 4], amount: (5000 + i * 800).toFixed(2), taxRate: [13, 9, 6][i % 3], date: `2024-${String((i % 12) + 1).padStart(2, '0')}-${String((i % 28) + 1).padStart(2, '0')}`, status: i % 4 === 0 ? 0 : 1 }))
    const { code = '', pageNum = 1, pageSize = 10 } = queryParams
    let filtered = all
    if (code) filtered = filtered.filter(x => x.code.includes(code))
    const start = (Number(pageNum) - 1) * Number(pageSize)
    tableData.value = filtered.slice(start, start + Number(pageSize))
    total.value = filtered.length
  } finally { loading.value = false }
}
function handleSearch(p) { Object.assign(queryParams, p, { pageNum: 1 }); loadData() }
function handleReset() { Object.keys(queryParams).forEach(k => { if (k !== 'pageNum' && k !== 'pageSize') queryParams[k] = '' }); loadData() }
function handlePageChange(p) { queryParams.pageNum = p; loadData() }
function handleSizeChange(s) { queryParams.pageSize = s; queryParams.pageNum = 1; loadData() }
function handleAdd() { dialogTitle.value = '新增发票'; Object.keys(formData).forEach(k => formData[k] = ''); formData.id = undefined; formData.type = '销项'; formData.taxRate = 13; dialogVisible.value = true }
function handleSync() { ElMessage.success('已从金税系统同步 8 张新发票'); loadData() }
function handleExport() { exportToExcel(invoiceData, invoiceColumns, '税务发票') }
function handleDeclare(d) { ElMessageBox.confirm(d.status === '已申报' ? '查看申报详情?' : `确认申报 ${d.title}?`, '提示').then(() => { if (d.status !== '已申报') { d.status = '已申报'; ElMessage.success('申报成功') } }).catch(() => {}) }
function cancelDialog() { dialogVisible.value = false; formRef.value?.resetFields() }
async function handleSubmit() { const valid = await formRef.value?.validate().catch(() => false); if (!valid) return; submitLoading.value = true; try { await new Promise(r => setTimeout(r, 500)); ElMessage.success('操作成功'); dialogVisible.value = false; loadData() } catch { ElMessage.error('操作失败') } finally { submitLoading.value = false } }
async function handleDelete(row) { await ElMessageBox.confirm(`确定删除「${row.code}」?`, '提示', { type: 'warning' }); ElMessage.success('删除成功'); loadData() }
function getInvoiceActions(row) {
  const actions = [{ key: 'view', label: '查看', type: 'primary', handler: (r) => ElMessage.info(`查看发票 ${r.code}`) }]
  if (row.status === 0) actions.push({ key: 'auth', label: '认证', type: 'success', handler: (r) => { r.status = 1; ElMessage.success('认证成功') } })
  actions.push({ key: 'print', label: '打印', type: 'primary', handler: (r) => ElMessage.info(`打印发票 ${r.code}`) })
  actions.push({ key: 'delete', label: '删除', type: 'danger', handler: handleDelete })
  return actions
}
function handleCommand(cmd, row) { getInvoiceActions(row).find(a => a.key === cmd)?.handler(row) }
onMounted(() => loadData())
</script>
<style lang="scss" scoped>.tax-tabs { background: #fff; padding: 16px 20px; border-radius: 8px }
.table-toolbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; padding: 0 0 14px 0; .toolbar-left { display: flex; gap: 10px; } }
.declare-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px }
.declare-card { padding: 20px; background: #fff; border: 1px solid #ebeef5; border-radius: 8px; transition: all .2s; &:hover { box-shadow: 0 2px 12px rgba(64,158,255,.2) } }
.declare-title { font-size: 16px; font-weight: 600; margin-bottom: 12px }
.declare-info { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; .declare-period { color: #909399; font-size: 13px } }
.declare-amount { color: #f56c6c; font-weight: 600; margin-bottom: 12px }
.status-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 16px }
.status-card { display: flex; align-items: center; gap: 16px; padding: 20px; background: #fff; border: 1px solid #ebeef5; border-radius: 8px; .el-icon { font-size: 36px } &.ok .el-icon { color: #67c23a } &.warn .el-icon { color: #e6a23c } }
.status-label { font-size: 13px; color: #909399 }
.status-value { font-size: 15px; font-weight: 600; margin-top: 4px }
</style>
