<template>
  <div class="page-container">
    <BaseSearch :search-items="searchItems" @search="handleSearch" @reset="handleReset" />
    <div class="table-toolbar">
      <div class="toolbar-left"><el-button type="primary" :icon="Plus" @click="handleAdd">{{ $t('purchase.newReturn') }}</el-button></div>
      <div class="toolbar-right"><el-button :icon="Refresh" circle @click="loadData" /></div>
    </div>
    <BaseTable :columns="columns" :table-data="tableData" :loading="loading" :total="total" :current-page.sync="queryParams.pageNum" :page-size.sync="queryParams.pageSize" :show-index="true" @current-change="handlePageChange" @size-change="handleSizeChange">
      <template #amount="{ row }">{{ formatMoney(row.amount) }}</template>
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

    <el-dialog v-model="viewVisible" :title="$t('purchase.returnDetail')" width="700px" :close-on-click-modal="false">
      <el-descriptions v-if="viewRow" :column="2" border>
        <el-descriptions-item :label="$t('purchase.returnNo')">{{ viewRow.returnNo }}</el-descriptions-item>
        <el-descriptions-item :label="$t('purchase.returnStatus')"><el-tag :type="statusMap[viewRow.status]?.type || 'info'" size="small">{{ statusMap[viewRow.status]?.label || '—' }}</el-tag></el-descriptions-item>
        <el-descriptions-item :label="$t('purchase.orderNo')">{{ viewRow.orderNo }}</el-descriptions-item>
        <el-descriptions-item :label="$t('purchase.supplier')">{{ viewRow.supplierName }}</el-descriptions-item>
        <el-descriptions-item :label="$t('purchase.quantity')">{{ viewRow.quantity }}</el-descriptions-item>
        <el-descriptions-item :label="$t('purchase.returnAmount')">{{ formatMoney(viewRow.amount) }}</el-descriptions-item>
        <el-descriptions-item :label="$t('purchase.applicant')">{{ viewRow.applicant }}</el-descriptions-item>
        <el-descriptions-item :label="$t('purchase.applyDate')">{{ viewRow.applyDate }}</el-descriptions-item>
        <el-descriptions-item :label="$t('purchase.reason')" :span="2">{{ viewRow.reason }}</el-descriptions-item>
        <el-descriptions-item :label="$t('purchase.supplierCreateTime')" :span="2">{{ viewRow.createTime }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>

    <el-dialog v-model="approveVisible" :title="approveTitle" width="500px" :close-on-click-modal="false">
      <el-form :model="approveForm" label-width="100px">
        <el-form-item :label="$t('purchase.returnNo')"><el-input :value="approveRow?.returnNo" disabled /></el-form-item>
        <el-form-item :label="$t('purchase.orderNo')"><el-input :value="approveRow?.orderNo" disabled /></el-form-item>
        <el-form-item :label="$t('purchase.supplier')"><el-input :value="approveRow?.supplierName" disabled /></el-form-item>
        <el-form-item :label="$t('purchase.returnAmount')"><el-input :value="formatMoney(approveRow?.amount)" disabled /></el-form-item>
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

const statusMap = computed(() => ({ 0: { label: t('purchase.returnStatusProcessing'), type: 'warning' }, 1: { label: t('purchase.returnStatusCompleted'), type: 'success' }, 2: { label: t('purchase.returnStatusRejected'), type: 'danger' } }))
const searchItems = computed(() => [ { prop: 'returnNo', label: t('purchase.returnNo'), type: 'input' }, { prop: 'supplierName', label: t('purchase.supplier'), type: 'input' }, { prop: 'status', label: t('purchase.returnStatus'), type: 'select', options: Object.entries(statusMap.value).map(([v, l]) => ({ value: Number(v), label: l.label })) } ])
const columns = computed(() => [ { prop: 'returnNo', label: t('purchase.returnNo'), width: 190 }, { prop: 'orderNo', label: t('purchase.orderNo'), width: 180 }, { prop: 'supplierName', label: t('purchase.supplier'), width: 130 }, { prop: 'amount', label: t('purchase.returnAmount'), width: 120, slot: 'amount', align: 'right' }, { prop: 'reason', label: t('purchase.reason'), minWidth: 150, showOverflowTooltip: true }, { prop: 'status', label: t('purchase.returnStatus'), width: 90, slot: 'status' }, { prop: 'createTime', label: t('purchase.supplierCreateTime'), width: 170 } ])
const formItems = computed(() => [ { prop: 'returnNo', label: t('purchase.returnNo'), type: 'input', span: 12 }, { prop: 'orderNo', label: t('purchase.orderNo'), type: 'input', span: 12 }, { prop: 'supplierName', label: t('purchase.supplier'), type: 'input', span: 12 }, { prop: 'amount', label: t('purchase.returnAmount'), type: 'number', precision: 2, span: 12 }, { prop: 'reason', label: t('purchase.reason'), type: 'textarea', rows: 3, span: 24 } ])
const formRules = computed(() => ({ returnNo: [{ required: true, message: t('purchase.inputReturnNo'), trigger: 'blur' }] }))

const loading = ref(false), tableData = ref([]), total = ref(0)
const dialogVisible = ref(false), dialogTitle = ref(''), submitLoading = ref(false), formRef = ref(null)
const queryParams = reactive({ pageNum: 1, pageSize: 10, returnNo: '', supplierName: '', status: '' })
const formData = reactive({ id: undefined, returnNo: '', orderNo: '', supplierName: '', amount: undefined, reason: '' })
const viewVisible = ref(false), viewRow = ref(null)
const approveVisible = ref(false), approveLoading = ref(false), approveRow = ref(null)
const approveForm = reactive({ approved: true, comment: '' })
const approveTitle = ref('')

async function loadData() { loading.value = true; try { const res = await request({ url: '/api/purchase/return/list', method: 'get', params: queryParams }); tableData.value = res.data.list || []; total.value = res.data.total || 0 } finally { loading.value = false } }
function handleSearch(p) { Object.assign(queryParams, p, { pageNum: 1 }); loadData() }
function handleReset() { Object.keys(queryParams).forEach(k => { if (k !== 'pageNum' && k !== 'pageSize') queryParams[k] = '' }); loadData() }
function handlePageChange(p) { queryParams.pageNum = p; loadData() }; function handleSizeChange(s) { queryParams.pageSize = s; queryParams.pageNum = 1; loadData() }
function handleAdd() { dialogTitle.value = t('purchase.newReturn'); Object.keys(formData).forEach(k => formData[k] = ''); formData.id = undefined; dialogVisible.value = true }
function handleEdit(r) { dialogTitle.value = t('purchase.editReturn'); Object.assign(formData, r); dialogVisible.value = true }
function handleView(r) { viewRow.value = r; viewVisible.value = true }
function openApprove(r, approved) { approveRow.value = r; approveForm.approved = approved; approveForm.comment = ''; approveTitle.value = approved ? t('purchase.returnApprove') : t('purchase.returnReject'); approveVisible.value = true }
async function submitApprove() { if (!approveForm.comment.trim()) { ElMessage.warning(approveForm.approved ? t('purchase.approveComment') : t('purchase.rejectReason')); return } approveLoading.value = true; try { await request({ url: '/api/purchase/return/approve', method: 'post', data: { id: approveRow.value.id, approved: approveForm.approved, comment: approveForm.comment } }).catch(() => {}); ElMessage.success(approveForm.approved ? t('purchase.reviewSuccess') : t('purchase.rejectSuccess')); approveVisible.value = false; loadData() } finally { approveLoading.value = false } }
function cancelDialog() { dialogVisible.value = false; formRef.value?.resetFields() }
async function handleSubmit() { const valid = await formRef.value?.validate().catch(() => false); if (!valid) return; submitLoading.value = true; try { await new Promise(r => setTimeout(r, 500)); ElMessage.success(t('common.success')); dialogVisible.value = false; loadData() } catch { ElMessage.error(t('common.failed')) } finally { submitLoading.value = false } }
async function handleDelete(row) { await ElMessageBox.confirm(t('purchase.deleteReturnConfirm', { no: row.returnNo }), t('header.tips'), { type: 'warning' }); ElMessage.success(t('common.success')); loadData() }

function getActions(row) {
  const actions = [ { key: 'view', label: t('common.detail'), type: 'primary', handler: handleView } ]
  if (row.status === 0) { actions.push({ key: 'approve', label: t('purchase.approveAction'), type: 'success', handler: (r) => openApprove(r, true) }); actions.push({ key: 'reject', label: t('purchase.rejectAction'), type: 'danger', handler: (r) => openApprove(r, false) }); actions.push({ key: 'edit', label: t('common.edit'), type: 'primary', handler: handleEdit }); actions.push({ key: 'delete', label: t('common.delete'), type: 'danger', handler: handleDelete }) }
  return actions
}

function handleCommand(cmd, row) { const action = getActions(row).find(a => a.key === cmd); action?.handler(row) }
onMounted(() => loadData())
</script>

<style lang="scss" scoped>
.page-container .table-toolbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; padding: 14px 18px; background: #fff; border-radius: var(--border-radius-base); .toolbar-left { display: flex; gap: 10px; } .toolbar-right { display: flex; gap: 8px; } }
</style>
