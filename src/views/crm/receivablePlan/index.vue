<template>
  <div class="page-container">
    <BaseSearch :search-items="searchItems" @search="handleSearch" @reset="handleReset" />
    <div class="table-toolbar">
      <div class="toolbar-left">
        <el-button type="primary" :icon="Plus" @click="handleAdd">{{ t('crmReceivable.addPlan') }}</el-button>
      </div>
      <div class="toolbar-right">
        <el-button :icon="Refresh" circle @click="loadData" />
      </div>
    </div>
    <BaseTable :columns="columns" :table-data="tableData" :loading="loading" :total="total" :current-page.sync="queryParams.pageNum" :page-size.sync="queryParams.pageSize" :show-index="true" @current-change="handlePageChange" @size-change="handleSizeChange">
      <template #amount="{ row }">{{ formatMoney(row.amount) }}</template>
      <template #status="{ row }">
        <el-tag :type="row.status === t('crmReceivable.paid') ? 'success' : row.status === t('crmReceivable.overdue') ? 'danger' : row.status === t('crmReceivable.partialPaid') ? 'warning' : 'info'" size="small">{{ row.status }}</el-tag>
      </template>
      <template #operation="{ row }">
        <el-button v-for="action in getActions(row).slice(0, 3)" :key="action.key" :type="action.type" link size="small" @click="action.handler(row)">{{ action.label }}</el-button>
        <el-dropdown v-if="getActions(row).length > 3" trigger="click" @command="(cmd) => handleCommand(cmd, row)">
          <el-button type="primary" link size="small">{{ t('common.moreActions') }}<el-icon class="el-icon--right"><ArrowDown /></el-icon></el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item v-for="action in getActions(row).slice(3)" :key="action.key" :command="action.key">{{ action.label }}</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </template>
    </BaseTable>

    <!-- 新增/编辑弹窗 -->
    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="600px" :close-on-click-modal="false" @close="cancelDialog">
      <el-form ref="formRef" :model="formData" :rules="formRules" label-width="100px">
        <el-form-item :label="t('crm.customerName')" prop="customer"><el-input v-model="formData.customer" /></el-form-item>
        <el-form-item :label="t('crmReceivable.contractNo')" prop="contractNo"><el-input v-model="formData.contractNo" /></el-form-item>
        <el-form-item :label="t('crmReceivable.period')" prop="period"><el-input-number v-model="formData.period" :min="1" :max="20" style="width: 100%" /></el-form-item>
        <el-form-item :label="t('crmReceivable.amount')" prop="amount"><el-input-number v-model="formData.amount" :min="0" :precision="2" style="width: 100%" /></el-form-item>
        <el-form-item :label="t('crmReceivable.planDate')" prop="planDate"><el-input v-model="formData.planDate" :placeholder="t('crmReceivable.planDatePlaceholder')" /></el-form-item>
        <el-form-item :label="t('common.status')" prop="status">
          <el-select v-model="formData.status" style="width: 100%">
            <el-option v-for="o in statusOptions" :key="o" :label="o" :value="o" />
          </el-select>
        </el-form-item>
        <el-form-item :label="t('crmReceivable.owner')" prop="owner"><el-input v-model="formData.owner" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="cancelDialog">{{ t('common.cancel') }}</el-button>
        <el-button type="primary" :loading="submitLoading" @click="handleSubmit">{{ t('common.confirm') }}</el-button>
      </template>
    </el-dialog>

    <!-- 登记回款弹窗 -->
    <el-dialog v-model="receiveVisible" :title="t('crmReceivable.registerPayment')" width="500px" @close="cancelReceive">
      <el-form ref="receiveRef" :model="receiveForm" :rules="receiveRules" label-width="100px">
        <el-form-item :label="t('crm.customerName')"><el-input :value="receiveRow?.customer" disabled /></el-form-item>
        <el-form-item :label="t('crmReceivable.amount')" prop="paidAmount"><el-input-number v-model="receiveForm.paidAmount" :min="0" :precision="2" style="width: 100%" /></el-form-item>
        <el-form-item :label="t('crmReceivable.paidDate')" prop="paidDate"><el-input v-model="receiveForm.paidDate" :placeholder="t('crmReceivable.planDatePlaceholder')" /></el-form-item>
        <el-form-item :label="t('crmReceivable.paidMethod')" prop="paidMethod">
          <el-select v-model="receiveForm.paidMethod" style="width: 100%">
            <el-option v-for="o in paidMethods" :key="o" :label="o" :value="o" />
          </el-select>
        </el-form-item>
        <el-form-item :label="t('crm.remark')" prop="remark"><el-input v-model="receiveForm.remark" type="textarea" :rows="2" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="cancelReceive">{{ t('common.cancel') }}</el-button>
        <el-button type="primary" :loading="receiveLoading" @click="submitReceive">{{ t('common.confirm') }}</el-button>
      </template>
    </el-dialog>

    <!-- 详情 -->
    <el-dialog v-model="viewVisible" :title="t('crmReceivable.planDetail')" width="600px">
      <el-descriptions v-if="viewRow" :column="2" border>
        <el-descriptions-item :label="t('crm.customerName')">{{ viewRow.customer }}</el-descriptions-item>
        <el-descriptions-item :label="t('crmReceivable.contractNo')">{{ viewRow.contractNo }}</el-descriptions-item>
        <el-descriptions-item :label="t('crmReceivable.period')">第{{ viewRow.period }}{{ t('crmReceivable.periodUnit') }}</el-descriptions-item>
        <el-descriptions-item :label="t('crmReceivable.amount')">{{ formatMoney(viewRow.amount) }}</el-descriptions-item>
        <el-descriptions-item :label="t('crmReceivable.planDate')">{{ viewRow.planDate }}</el-descriptions-item>
        <el-descriptions-item :label="t('common.status')">{{ viewRow.status }}</el-descriptions-item>
        <el-descriptions-item :label="t('crmReceivable.owner')">{{ viewRow.owner }}</el-descriptions-item>
        <el-descriptions-item :label="t('crmReceivable.paidAmount')">{{ formatMoney(viewRow.paidAmount || 0) }}</el-descriptions-item>
        <el-descriptions-item v-if="viewRow.paidDate" :label="t('crmReceivable.paidDate')">{{ viewRow.paidDate }}</el-descriptions-item>
        <el-descriptions-item v-if="viewRow.paidMethod" :label="t('crmReceivable.paidMethod')">{{ viewRow.paidMethod }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Refresh, ArrowDown } from '@element-plus/icons-vue'
import { useI18n } from 'vue-i18n'
import BaseSearch from '@/components/BaseSearch.vue'
import BaseTable from '@/components/BaseTable.vue'

const { t } = useI18n()

function formatMoney(v) { if (v === null || v === undefined || v === '') return '0.00'; return Number(v).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }

const searchItems = [
  { prop: 'customer', label: t('crm.customerName'), type: 'input' },
  { prop: 'status', label: t('common.status'), type: 'select', options: [
    { value: 'pending', label: t('crmReceivable.pending') },
    { value: 'partial', label: t('crmReceivable.partialPaid') },
    { value: 'paid', label: t('crmReceivable.paid') },
    { value: 'overdue', label: t('crmReceivable.overdue') }
  ]}
]
const columns = [
  { prop: 'customer', label: t('crm.customerName'), minWidth: 180 },
  { prop: 'contractNo', label: t('crmReceivable.contractNo'), width: 160 },
  { prop: 'period', label: t('crmReceivable.period'), width: 80, align: 'center' },
  { prop: 'amount', label: t('crmReceivable.amount'), width: 130, slot: 'amount', align: 'right' },
  { prop: 'planDate', label: t('crmReceivable.planDate'), width: 130 },
  { prop: 'paidAmount', label: t('crmReceivable.paidAmount'), width: 130, slot: 'amount', align: 'right' },
  { prop: 'status', label: t('common.status'), width: 100, slot: 'status' },
  { prop: 'owner', label: t('crmReceivable.owner'), width: 100 }
]
const statusOptions = ['pending', 'partial', 'paid', 'overdue']
const statusLabelMap = { pending: t('crmReceivable.pending'), partial: t('crmReceivable.partialPaid'), paid: t('crmReceivable.paid'), overdue: t('crmReceivable.overdue') }
const paidMethods = [t('crmReceivable.bankTransfer'), t('crmReceivable.acceptanceDraft'), t('crmReceivable.cash'), t('crmReceivable.alipay'), t('crmReceivable.wechat'), t('crmReceivable.other')]

const loading = ref(false), tableData = ref([]), total = ref(0)
const dialogVisible = ref(false), dialogTitle = ref(''), submitLoading = ref(false), formRef = ref(null)
const viewVisible = ref(false), viewRow = ref(null)
const receiveVisible = ref(false), receiveLoading = ref(false), receiveRef = ref(null), receiveRow = ref(null)
const receiveForm = reactive({ paidAmount: 0, paidDate: '', paidMethod: t('crmReceivable.bankTransfer'), remark: '' })
const queryParams = reactive({ pageNum: 1, pageSize: 10, customer: '', status: '' })
const formData = reactive({ id: undefined, customer: '', contractNo: '', period: 1, amount: undefined, planDate: '', status: 'pending', owner: '' })
const formRules = { customer: [{ required: true, message: t('crm.customerName'), trigger: 'blur' }], amount: [{ required: true, message: t('crmReceivable.amount'), trigger: 'blur' }] }
const receiveRules = { paidAmount: [{ required: true, message: t('crmReceivable.amount'), trigger: 'blur' }], paidDate: [{ required: true, message: t('crmReceivable.paidDate'), trigger: 'blur' }] }
const customers = ['华为技术有限公司', '小米科技', '比亚迪汽车', '宁德时代新能源', '海康威视', '京东方科技', '三一重工']
const owners = ['张伟', '李娜', '王强', '赵敏', '刘芳']

async function loadData() {
  loading.value = true
  try {
    const { customer = '', status = '', pageNum = 1, pageSize = 10 } = queryParams
    const all = Array.from({ length: 38 }, (_, i) => {
      const statusCode = ['pending', 'partial', 'paid', 'overdue'][i % 4]
      return {
        id: i + 1,
        customer: customers[i % customers.length],
        contractNo: `HT-2025-${String(i + 1).padStart(4, '0')}`,
        period: (i % 4) + 1,
        amount: 50000 + (i * 3000) % 200000,
        planDate: `2025-${String((i % 12) + 1).padStart(2, '0')}-${String((i % 28) + 1).padStart(2, '0')}`,
        paidAmount: i % 3 === 0 ? 50000 + (i * 3000) % 200000 : (i % 3 === 1 ? Math.floor((50000 + (i * 3000) % 200000) / 2) : 0),
        status: statusLabelMap[statusCode],
        statusCode,
        owner: owners[i % owners.length],
        paidDate: i % 3 !== 2 ? `2025-${String((i % 12) + 1).padStart(2, '0')}-${String((i % 28) + 1).padStart(2, '0')}` : '',
        paidMethod: i % 3 !== 2 ? [t('crmReceivable.bankTransfer'), t('crmReceivable.acceptanceDraft'), t('crmReceivable.alipay')][i % 3] : ''
      }
    })
    let filtered = all
    if (customer) filtered = filtered.filter(x => x.customer.includes(customer))
    if (status) filtered = filtered.filter(x => x.statusCode === status)
    const start = (Number(pageNum) - 1) * Number(pageSize)
    tableData.value = filtered.slice(start, start + Number(pageSize))
    total.value = filtered.length
  } finally { loading.value = false }
}
function handleSearch(p) { Object.assign(queryParams, p, { pageNum: 1 }); loadData() }
function handleReset() { Object.keys(queryParams).forEach(k => { if (k !== 'pageNum' && k !== 'pageSize') queryParams[k] = '' }); loadData() }
function handlePageChange(p) { queryParams.pageNum = p; loadData() }
function handleSizeChange(s) { queryParams.pageSize = s; queryParams.pageNum = 1; loadData() }
function handleAdd() { dialogTitle.value = t('crmReceivable.addPlan'); Object.keys(formData).forEach(k => formData[k] = ''); formData.id = undefined; formData.period = 1; formData.status = 'pending'; dialogVisible.value = true }
function handleEdit(row) { dialogTitle.value = t('crmReceivable.editPlan'); Object.assign(formData, row); dialogVisible.value = true }
function handleView(row) { viewRow.value = row; viewVisible.value = true }
function cancelDialog() { dialogVisible.value = false; formRef.value?.resetFields() }
async function handleSubmit() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return
  submitLoading.value = true
  try { await new Promise(r => setTimeout(r, 500)); ElMessage.success(t('common.success')); dialogVisible.value = false; loadData() }
  catch { ElMessage.error(t('common.failed')) }
  finally { submitLoading.value = false }
}
function openReceive(row) {
  receiveRow.value = row
  Object.assign(receiveForm, { paidAmount: row.amount, paidDate: row.planDate, paidMethod: t('crmReceivable.bankTransfer'), remark: '' })
  receiveVisible.value = true
}
function cancelReceive() { receiveVisible.value = false; receiveRef.value?.resetFields() }
async function submitReceive() {
  const valid = await receiveRef.value?.validate().catch(() => false)
  if (!valid) return
  receiveLoading.value = true
  try { await new Promise(r => setTimeout(r, 500)); ElMessage.success(t('common.success')); receiveVisible.value = false; loadData() }
  catch { ElMessage.error(t('common.failed')) }
  finally { receiveLoading.value = false }
}
async function handleDelete(row) {
  await ElMessageBox.confirm(t('crmReceivable.confirmDelete', { customer: row.customer, period: row.period }), t('header.tips'), { type: 'warning' })
  ElMessage.success(t('common.success'))
  loadData()
}
function getActions(row) {
  const actions = [
    { key: 'view', label: t('common.detail'), type: 'primary', handler: handleView },
    { key: 'edit', label: t('common.edit'), type: 'primary', handler: handleEdit },
    { key: 'receive', label: t('crmReceivable.registerPayment'), type: 'success', handler: openReceive }
  ]
  if (row.statusCode !== 'paid') {
    actions.push({ key: 'delete', label: t('common.delete'), type: 'danger', handler: handleDelete })
  }
  return actions
}
function handleCommand(cmd, row) { getActions(row).find(a => a.key === cmd)?.handler(row) }
onMounted(() => loadData())
</script>

<style lang="scss" scoped>
.page-container .table-toolbar {
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 16px; padding: 14px 18px; background: #fff; border-radius: var(--border-radius-base);
  .toolbar-left { display: flex; gap: 10px; }
  .toolbar-right { display: flex; gap: 8px; }
}
</style>
