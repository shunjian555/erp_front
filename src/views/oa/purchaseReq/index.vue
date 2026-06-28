<template>
  <div class="page-container">
    <BaseSearch :search-items="searchItems" @search="handleSearch" @reset="handleReset" />
    <div class="table-toolbar">
      <div class="toolbar-left"><el-button type="primary" :icon="Plus" @click="handleAdd">{{ $t('oa.newPurchaseReq') }}</el-button><el-button :icon="Delete" plain @click="handleBatchDelete">{{ $t('common.delete') }}</el-button></div>
      <div class="toolbar-right"><el-button :icon="Refresh" circle @click="loadData" /></div>
    </div>
    <BaseTable :columns="columns" :table-data="tableData" :loading="loading" :total="total" :current-page.sync="queryParams.pageNum" :page-size.sync="queryParams.pageSize" :show-selection="true" :show-index="true" @selection-change="handleSelectionChange" @current-change="handlePageChange" @size-change="handleSizeChange">
      <template #status="{ row }"><BaseStatusTag :type="row.status === 1 ? 'success' : row.status === 0 ? 'warning' : 'info'">{{ statusLabelList[row.status] || $t('common.normal') }}</BaseStatusTag></template>
      <template #operation="{ row }"><el-button type="primary" link size="small" @click="handleEdit(row)">{{ $t('common.edit') }}</el-button><el-button type="danger" link size="small" @click="handleDelete(row)">{{ $t('common.delete') }}</el-button></template>
    </BaseTable>
    <BaseDialog v-model="dialogVisible" :title="dialogTitle" width="650px" :confirm-loading="submitLoading" @confirm="handleSubmit" @cancel="cancelDialog"><BaseForm ref="formRef" v-model="formData" :form-items="formItems" :form-rules="formRules" :col-count="2" /></BaseDialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Delete, Refresh } from '@element-plus/icons-vue'
import BaseSearch from '@/components/BaseSearch.vue'
import BaseTable from '@/components/BaseTable.vue'
import BaseDialog from '@/components/BaseDialog.vue'
import BaseForm from '@/components/BaseForm.vue'
import BaseStatusTag from '@/components/BaseStatusTag.vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const statusLabelList = computed(() => [t('oa.approvalTabsPending'), t('oa.approveSuccess'), t('oa.rejectSuccess')])
const searchItems = computed(() => [
  { prop: 'reqNo', label: t('oa.reqNo'), type: 'input' },
  { prop: 'goodsName', label: t('oa.goodsName'), type: 'input' }
])
const columns = computed(() => [
  { prop: 'reqNo', label: t('oa.reqNo'), width: 180 },
  { prop: 'goodsName', label: t('oa.goodsName'), width: 140 },
  { prop: 'quantity', label: t('oa.quantity'), width: 80, align: 'center' },
  { prop: 'budgetAmount', label: t('oa.budgetAmount'), width: 120 },
  { prop: 'applicant', label: t('oa.applicant'), width: 100 },
  { prop: 'applyDate', label: t('oa.applyDate'), width: 120 },
  { prop: 'status', label: t('common.status'), width: 90, slot: 'status' }
])
const formItems = computed(() => [
  { prop: 'reqNo', label: t('oa.reqNo'), type: 'input', span: 12 },
  { prop: 'goodsName', label: t('oa.goodsName'), type: 'input', span: 12 },
  { prop: 'quantity', label: t('oa.quantity'), type: 'number', span: 12 },
  { prop: 'budgetAmount', label: t('oa.budgetAmount'), type: 'number', precision: 2, span: 12 },
  { prop: 'reason', label: t('oa.applyReason'), type: 'textarea', rows: 3, span: 24 }
])
const formRules = computed(() => ({ reqNo: [{ required: true, message: t('oa.reqNo'), trigger: 'blur' }], goodsName: [{ required: true, message: t('oa.goodsName'), trigger: 'blur' }] }))

const loading = ref(false), tableData = ref([]), total = ref(0), selectedRows = ref([])
const dialogVisible = ref(false), dialogTitle = ref(''), submitLoading = ref(false), formRef = ref(null)
const queryParams = reactive({ pageNum: 1, pageSize: 10, reqNo: '', goodsName: '' })
const formData = reactive({ id: undefined, reqNo: '', goodsName: '', quantity: undefined, budgetAmount: undefined, reason: '' })

async function loadData() { loading.value = true; try { const res = await (await import('@/utils/request')).default({ url: '/api/oa/purchaseReq/list', method: 'get', params: queryParams }); tableData.value = res.data.list || []; total.value = res.data.total || 0 } finally { loading.value = false } }
function handleSearch(p) { Object.assign(queryParams, p, { pageNum: 1 }); loadData() }
function handleReset() { Object.keys(queryParams).forEach(k => { if (k !== 'pageNum' && k !== 'pageSize') queryParams[k] = '' }); loadData() }
function handlePageChange(p) { queryParams.pageNum = p; loadData() }
function handleSizeChange(s) { queryParams.pageSize = s; queryParams.pageNum = 1; loadData() }
function handleSelectionChange(r) { selectedRows.value = r }
function handleAdd() { dialogTitle.value = t('oa.newPurchaseReq'); Object.keys(formData).forEach(k => formData[k] = ''); formData.id = undefined; dialogVisible.value = true }
function handleEdit(r) { dialogTitle.value = t('oa.editPurchaseReq'); Object.assign(formData, r); dialogVisible.value = true }
function cancelDialog() { dialogVisible.value = false; formRef.value?.resetFields() }
async function handleSubmit() { const valid = await formRef.value?.validate().catch(() => false); if (!valid) return; submitLoading.value = true; try { await new Promise(r => setTimeout(r, 500)); ElMessage.success(t('oa.operationSuccess')); dialogVisible.value = false; loadData() } catch { ElMessage.error(t('oa.operationFailed')) } finally { submitLoading.value = false } }
async function handleDelete(row) { await ElMessageBox.confirm(t('oa.deleteConfirm'), t('header.tips'), { type: 'warning' }); ElMessage.success(t('oa.deleteSuccess')); loadData() }
async function handleBatchDelete() { if (!selectedRows.value.length) return ElMessage.warning(t('oa.selectData')); await ElMessageBox.confirm(t('oa.batchDeleteConfirm'), t('header.tips'), { type: 'warning' }); ElMessage.success(t('oa.deleteSuccess')); loadData() }
onMounted(() => loadData())
</script>

<style lang="scss" scoped>
.page-container .table-toolbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; padding: 14px 18px; background: #fff; border-radius: var(--border-radius-base); .toolbar-left { display: flex; gap: 10px; } .toolbar-right { display: flex; gap: 8px; } }
</style>
