<template>
  <div class="page-container">
    <BaseSearch :search-items="searchItems" @search="handleSearch" @reset="handleReset" />
    <div class="table-toolbar">
      <div class="toolbar-left"><el-button type="primary" :icon="Plus" @click="handleAdd">{{ $t('purchase.newPurchaseReq') }}</el-button></div>
      <div class="toolbar-right"><el-button :icon="Refresh" circle @click="loadData" /></div>
    </div>
    <BaseTable :columns="columns" :table-data="tableData" :loading="loading" :total="total" :current-page.sync="queryParams.pageNum" :page-size.sync="queryParams.pageSize" :show-index="true" @current-change="handlePageChange" @size-change="handleSizeChange">
      <template #budgetAmount="{ row }">{{ formatMoney(row.budgetAmount) }}</template>
      <template #status="{ row }"><el-tag :type="statusMap[row.status]?.type || 'info'" size="small">{{ statusMap[row.status]?.label || '—' }}</el-tag></template>
      <template #operation="{ row }">
        <el-button v-for="action in getActions(row).slice(0, 3)" :key="action.key" :type="action.type" link size="small" @click="action.handler(row)">{{ action.label }}</el-button>
        <el-dropdown v-if="getActions(row).length > 3" trigger="click" @command="(cmd) => handleCommand(cmd, row)">
          <el-button type="primary" link size="small">{{ $t('common.moreActions') }}<el-icon class="el-icon--right"><ArrowDown /></el-icon></el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item v-for="action in getActions(row).slice(3)" :key="action.key" :command="action.key">{{ action.label }}</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </template>
    </BaseTable>
    <BaseDialog v-model="dialogVisible" :title="dialogTitle" width="600px" :confirm-loading="submitLoading" @confirm="handleSubmit" @cancel="cancelDialog"><BaseForm ref="formRef" v-model="formData" :form-items="formItems" :form-rules="formRules" :col-count="2" /></BaseDialog>

    <el-dialog v-model="viewVisible" :title="$t('purchase.purchaseReqDetail')" width="700px" :close-on-click-modal="false">
      <el-descriptions v-if="viewRow" :column="2" border>
        <el-descriptions-item :label="$t('purchase.reqNo')">{{ viewRow.requestNo }}</el-descriptions-item>
        <el-descriptions-item :label="$t('purchase.reqStatus')"><el-tag :type="statusMap[viewRow.status]?.type || 'info'" size="small">{{ statusMap[viewRow.status]?.label || '—' }}</el-tag></el-descriptions-item>
        <el-descriptions-item :label="$t('purchase.goodsName')">{{ viewRow.goodsName }}</el-descriptions-item>
        <el-descriptions-item :label="$t('purchase.quantity')">{{ viewRow.quantity }}</el-descriptions-item>
        <el-descriptions-item :label="$t('purchase.budgetAmount')">{{ formatMoney(viewRow.budgetAmount) }}</el-descriptions-item>
        <el-descriptions-item :label="$t('purchase.applicant')">{{ viewRow.applicant }}</el-descriptions-item>
        <el-descriptions-item :label="$t('purchase.applyDate')">{{ viewRow.applyDate }}</el-descriptions-item>
        <el-descriptions-item :label="$t('purchase.reason')" :span="2">{{ viewRow.reason }}</el-descriptions-item>
        <el-descriptions-item :label="$t('purchase.supplierCreateTime')" :span="2">{{ viewRow.createTime }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>

    <el-dialog v-model="approveVisible" :title="approveTitle" width="500px" :close-on-click-modal="false">
      <el-form :model="approveForm" label-width="100px">
        <el-form-item :label="$t('purchase.reqNo')"><el-input :value="approveRow?.requestNo" disabled /></el-form-item>
        <el-form-item :label="$t('purchase.applicant')"><el-input :value="approveRow?.applicant" disabled /></el-form-item>
        <el-form-item :label="$t('purchase.goodsName')"><el-input :value="approveRow?.goodsName" disabled /></el-form-item>
        <el-form-item :label="$t('purchase.budgetAmount')"><el-input :value="formatMoney(approveRow?.budgetAmount)" disabled /></el-form-item>
        <el-form-item :label="approveForm.approved ? $t('purchase.approveComment') : $t('purchase.rejectReason')" required>
          <el-input v-model="approveForm.comment" type="textarea" :rows="3" :placeholder="approveForm.approved ? $t('purchase.approveComment') : $t('purchase.rejectReason')" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="approveVisible = false">{{ $t('common.cancel') }}</el-button>
        <el-button :type="approveForm.approved ? 'success' : 'danger'" :loading="approveLoading" @click="submitApprove">{{ $t('common.confirm') }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Refresh, ArrowDown } from '@element-plus/icons-vue'
import BaseSearch from '@/components/BaseSearch.vue'
import BaseTable from '@/components/BaseTable.vue'
import BaseDialog from '@/components/BaseDialog.vue'
import BaseForm from '@/components/BaseForm.vue'
import request from '@/utils/request'
import { useI18n } from 'vue-i18n'

const { t, locale } = useI18n()

function formatMoney(v) {
  if (v === null || v === undefined || v === '') return '0.00'
  return Number(v).toLocaleString(locale.value === 'zh-CN' ? 'zh-CN' : 'en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

const statusMap = computed(() => ({ 0: { label: t('purchase.reqStatusPending'), type: 'warning' }, 1: { label: t('purchase.reqStatusApproved'), type: 'success' }, 2: { label: t('purchase.reqStatusRejected'), type: 'danger' }, 3: { label: t('purchase.reqStatusCancelled'), type: 'info' } }))
const searchItems = computed(() => [ { prop: 'requestNo', label: t('purchase.reqNo'), type: 'input' }, { prop: 'goodsName', label: t('purchase.goodsName'), type: 'input' }, { prop: 'status', label: t('purchase.reqStatus'), type: 'select', options: Object.entries(statusMap.value).map(([v, l]) => ({ value: Number(v), label: l.label })) } ])
const columns = computed(() => [ { prop: 'requestNo', label: t('purchase.reqNo'), width: 190 }, { prop: 'goodsName', label: t('purchase.goodsName'), width: 140 }, { prop: 'quantity', label: t('purchase.quantity'), width: 80, align: 'center' }, { prop: 'budgetAmount', label: t('purchase.budgetAmount'), width: 120, slot: 'budgetAmount', align: 'right' }, { prop: 'applicant', label: t('purchase.applicant'), width: 90 }, { prop: 'applyDate', label: t('purchase.applyDate'), width: 120 }, { prop: 'status', label: t('purchase.reqStatus'), width: 100, slot: 'status' } ])
const formItems = computed(() => [ { prop: 'requestNo', label: t('purchase.reqNo'), type: 'input', span: 12 }, { prop: 'goodsName', label: t('purchase.goodsName'), type: 'input', span: 12 }, { prop: 'quantity', label: t('purchase.quantity'), type: 'number', span: 12 }, { prop: 'budgetAmount', label: t('purchase.budgetAmount'), type: 'number', precision: 2, span: 12 }, { prop: 'reason', label: t('purchase.reason'), type: 'textarea', rows: 3, span: 24 } ])
const formRules = computed(() => ({ requestNo: [{ required: true, message: t('purchase.inputReqNo'), trigger: 'blur' }] }))

const loading = ref(false), tableData = ref([]), total = ref(0)
const dialogVisible = ref(false), dialogTitle = ref(''), submitLoading = ref(false), formRef = ref(null)
const queryParams = reactive({ pageNum: 1, pageSize: 10, requestNo: '', goodsName: '', status: '' })
const formData = reactive({ id: undefined, requestNo: '', goodsName: '', quantity: undefined, budgetAmount: undefined, reason: '' })
const viewVisible = ref(false), viewRow = ref(null)
const approveVisible = ref(false), approveLoading = ref(false), approveRow = ref(null)
const approveForm = reactive({ approved: true, comment: '' })
const approveTitle = ref('')

async function loadData() { loading.value = true; try { const res = await request({ url: '/api/purchase/request/list', method: 'get', params: queryParams }); tableData.value = res.data.list || []; total.value = res.data.total || 0 } finally { loading.value = false } }
function handleSearch(p) { Object.assign(queryParams, p, { pageNum: 1 }); loadData() }
function handleReset() { Object.keys(queryParams).forEach(k => { if (k !== 'pageNum' && k !== 'pageSize') queryParams[k] = '' }); loadData() }
function handlePageChange(p) { queryParams.pageNum = p; loadData() }; function handleSizeChange(s) { queryParams.pageSize = s; queryParams.pageNum = 1; loadData() }
function handleAdd() { dialogTitle.value = t('purchase.newPurchaseReq'); Object.keys(formData).forEach(k => formData[k] = ''); formData.id = undefined; dialogVisible.value = true }
function handleEdit(r) { dialogTitle.value = t('purchase.editPurchaseReq'); Object.assign(formData, r); dialogVisible.value = true }
function handleView(r) { viewRow.value = r; viewVisible.value = true }
function openApprove(r, approved) { approveRow.value = r; approveForm.approved = approved; approveForm.comment = ''; approveTitle.value = approved ? t('purchase.approveAction') : t('purchase.rejectAction'); approveVisible.value = true }
async function submitApprove() { if (!approveForm.comment.trim()) { ElMessage.warning(approveForm.approved ? t('purchase.approveComment') : t('purchase.rejectReason')); return } approveLoading.value = true; try { await request({ url: '/api/purchase/request/approve', method: 'post', data: { id: approveRow.value.id, approved: approveForm.approved, comment: approveForm.comment } }).catch(() => {}); ElMessage.success(approveForm.approved ? t('purchase.approveSuccess') : t('purchase.rejectSuccess')); approveVisible.value = false; loadData() } finally { approveLoading.value = false } }
function cancelDialog() { dialogVisible.value = false; formRef.value?.resetFields() }
async function handleSubmit() { const valid = await formRef.value?.validate().catch(() => false); if (!valid) return; submitLoading.value = true; try { await new Promise(r => setTimeout(r, 500)); ElMessage.success(t('common.success')); dialogVisible.value = false; loadData() } catch { ElMessage.error(t('common.failed')) } finally { submitLoading.value = false } }
async function handleDelete(row) { await ElMessageBox.confirm(t('purchase.deleteReqConfirm', { no: row.requestNo }), t('header.tips'), { type: 'warning' }); ElMessage.success(t('common.success')); loadData() }

function getActions(row) {
  const actions = [ { key: 'view', label: t('common.detail'), type: 'primary', handler: handleView } ]
  if (row.status === 0) { actions.push({ key: 'approve', label: t('purchase.approveAction'), type: 'success', handler: (r) => openApprove(r, true) }); actions.push({ key: 'reject', label: t('purchase.rejectAction'), type: 'danger', handler: (r) => openApprove(r, false) }) }
  if (row.status === 0 || row.status === 1) { actions.push({ key: 'edit', label: t('common.edit'), type: 'primary', handler: handleEdit }) }
  if (row.status !== 3) { actions.push({ key: 'delete', label: t('common.delete'), type: 'danger', handler: handleDelete }) }
  return actions
}

function handleCommand(cmd, row) { const action = getActions(row).find(a => a.key === cmd); action?.handler(row) }
onMounted(() => loadData())
</script>

<style lang="scss" scoped>
.page-container .table-toolbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; padding: 14px 18px; background: #fff; border-radius: var(--border-radius-base); .toolbar-left { display: flex; gap: 10px; } .toolbar-right { display: flex; gap: 8px; } }
</style>
