<template>
  <div class="page-container">
    <BaseSearch :search-items="searchItems" @search="handleSearch" @reset="handleReset" />
    <div class="table-toolbar">
      <div class="toolbar-left"><el-button type="primary" :icon="Plus" @click="handleAdd">{{ t('crm.addQuote') }}</el-button><el-button :icon="Delete" plain @click="handleBatchDelete">{{ t('crm.batchDelete') }}</el-button></div>
      <div class="toolbar-right"><el-button :icon="Refresh" circle @click="loadData" /></div>
    </div>
    <BaseTable :columns="columns" :table-data="tableData" :loading="loading" :total="total" :current-page.sync="queryParams.pageNum" :page-size.sync="queryParams.pageSize" :show-selection="true" :show-index="true" @selection-change="handleSelectionChange" @current-change="handlePageChange" @size-change="handleSizeChange">
      <template #status="{ row }"><BaseStatusTag :type="row.status === 1 ? 'success' : row.status === 0 ? 'warning' : 'info'">{{ [t('crmQuote.draft'), t('crmQuote.sent'), t('crmQuote.expired')][row.status] || t('common.status') }}</BaseStatusTag></template>
      <template #operation="{ row }"><el-button type="primary" link size="small" @click="handleEdit(row)">{{ t('common.edit') }}</el-button><el-button type="danger" link size="small" @click="handleDelete(row)">{{ t('common.delete') }}</el-button></template>
    </BaseTable>
    <BaseDialog v-model="dialogVisible" :title="dialogTitle" width="650px" :confirm-loading="submitLoading" @confirm="handleSubmit" @cancel="cancelDialog"><BaseForm ref="formRef" v-model="formData" :form-items="formItems" :form-rules="formRules" :col-count="2" /></BaseDialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Delete, Refresh } from '@element-plus/icons-vue'
import { useI18n } from 'vue-i18n'
import BaseSearch from '@/components/BaseSearch.vue'
import BaseTable from '@/components/BaseTable.vue'
import BaseDialog from '@/components/BaseDialog.vue'
import BaseForm from '@/components/BaseForm.vue'
import BaseStatusTag from '@/components/BaseStatusTag.vue'

const { t } = useI18n()

const searchItems = [ { prop: 'quoteNo', label: t('crmQuote.quoteNo'), type: 'input' }, { prop: 'customerName', label: t('crm.customerName'), type: 'input' } ]
const columns = [ { prop: 'quoteNo', label: t('crmQuote.quoteNo'), width: 180 }, { prop: 'customerName', label: t('crm.customerName'), width: 140 }, { prop: 'totalAmount', label: t('crmQuote.totalAmount'), width: 120 }, { prop: 'validDate', label: t('crmQuote.validDate'), width: 120 }, { prop: 'status', label: t('common.status'), width: 90, slot: 'status' }, { prop: 'createTime', label: t('crm.createTime'), width: 170 } ]
const formItems = [ { prop: 'quoteNo', label: t('crmQuote.quoteNo'), type: 'input', span: 12 }, { prop: 'customerName', label: t('crm.customerName'), type: 'input', span: 12 }, { prop: 'totalAmount', label: t('crmQuote.totalAmount'), type: 'number', span: 12 }, { prop: 'validDate', label: t('crmQuote.validDate'), type: 'date', span: 12 }, { prop: 'remark', label: t('crm.remark'), type: 'textarea', span: 24 } ]
const formRules = { quoteNo: [{ required: true, message: t('crmQuote.quoteNo'), trigger: 'blur' }], customerName: [{ required: true, message: t('crm.customerName'), trigger: 'blur' }] }

const loading = ref(false), tableData = ref([]), total = ref(0), selectedRows = ref([])
const dialogVisible = ref(false), dialogTitle = ref(''), submitLoading = ref(false), formRef = ref(null)
const queryParams = reactive({ pageNum: 1, pageSize: 10, quoteNo: '', customerName: '' })
const formData = reactive({ id: undefined, quoteNo: '', customerName: '', totalAmount: undefined, validDate: '', remark: '' })

async function loadData() { loading.value = true; try { const res = await (await import('@/utils/request')).default({ url: '/api/crm/quote/list', method: 'get', params: queryParams }); tableData.value = res.data.list || []; total.value = res.data.total || 0 } finally { loading.value = false } }
function handleSearch(p) { Object.assign(queryParams, p, { pageNum: 1 }); loadData() }
function handleReset() { Object.keys(queryParams).forEach(k => { if (k !== 'pageNum' && k !== 'pageSize') queryParams[k] = '' }); loadData() }
function handlePageChange(p) { queryParams.pageNum = p; loadData() }; function handleSizeChange(s) { queryParams.pageSize = s; queryParams.pageNum = 1; loadData() }
function handleSelectionChange(r) { selectedRows.value = r }
function handleAdd() { dialogTitle.value = t('crm.addQuote'); Object.keys(formData).forEach(k => formData[k] = ''); formData.id = undefined; dialogVisible.value = true }
function handleEdit(r) { dialogTitle.value = t('crm.editQuote'); Object.assign(formData, r); dialogVisible.value = true }
function cancelDialog() { dialogVisible.value = false; formRef.value?.resetFields() }
async function handleSubmit() { const valid = await formRef.value?.validate().catch(() => false); if (!valid) return; submitLoading.value = true; try { await new Promise(r => setTimeout(r, 500)); ElMessage.success(t('common.success')); dialogVisible.value = false; loadData() } catch { ElMessage.error(t('common.failed')) } finally { submitLoading.value = false } }
async function handleDelete(row) { await ElMessageBox.confirm(t('common.confirmDelete'), t('header.tips'), { type: 'warning' }); ElMessage.success(t('common.success')); loadData() }
async function handleBatchDelete() { if (!selectedRows.value.length) return ElMessage.warning(t('common.noData')); await ElMessageBox.confirm(t('common.confirmDelete'), t('header.tips'), { type: 'warning' }); ElMessage.success(t('common.success')); loadData() }
onMounted(() => loadData())
</script>

<style lang="scss" scoped>
.page-container .table-toolbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; padding: 14px 18px; background: #fff; border-radius: var(--border-radius-base); .toolbar-left { display: flex; gap: 10px; } .toolbar-right { display: flex; gap: 8px; } }
</style>
