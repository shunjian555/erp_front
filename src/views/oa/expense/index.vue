<template>
  <div class="page-container">
    <BaseSearch :search-items="searchItems" @search="handleSearch" @reset="handleReset" />
    <div class="table-toolbar">
      <div class="toolbar-left"><el-button type="primary" :icon="Plus" @click="handleAdd">{{ $t('oa.submitExpense') }}</el-button></div>
      <div class="toolbar-right"><el-button :icon="Refresh" circle @click="loadData" /></div>
    </div>
    <BaseTable :columns="columns" :table-data="tableData" :loading="loading" :total="total" :current-page.sync="queryParams.pageNum" :page-size.sync="queryParams.pageSize" :show-index="true" @current-change="handlePageChange" @size-change="handleSizeChange">
      <template #status="{ row }"><BaseStatusTag :type="row.status === 2 ? 'success' : row.status === 0 ? 'warning' : 'info'">{{ statusLabelList[row.status] || $t('common.normal') }}</BaseStatusTag></template>
      <template #operation="{ row }"><el-button type="primary" link size="small" @click="handleEdit(row)">{{ $t('common.edit') }}</el-button><el-button type="danger" link size="small" @click="handleDelete(row)">{{ $t('common.delete') }}</el-button></template>
    </BaseTable>
    <BaseDialog v-model="dialogVisible" :title="$t('oa.submitExpenseApply')" width="600px" :confirm-loading="submitLoading" @confirm="handleSubmit" @cancel="cancelDialog"><BaseForm ref="formRef" v-model="formData" :form-items="formItems" :form-rules="formRules" :col-count="1" /></BaseDialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Refresh } from '@element-plus/icons-vue'
import BaseSearch from '@/components/BaseSearch.vue'
import BaseTable from '@/components/BaseTable.vue'
import BaseDialog from '@/components/BaseDialog.vue'
import BaseForm from '@/components/BaseForm.vue'
import BaseStatusTag from '@/components/BaseStatusTag.vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const statusLabelList = computed(() => [t('oa.approvalTabsPending'), t('oa.rejectSuccess'), t('oa.approveSuccess')])
const searchItems = computed(() => [
  { prop: 'title', label: t('oa.expenseTitle'), type: 'input' },
  { prop: 'expenseType', label: t('oa.expenseType'), type: 'select', options: [{ value: 'travel', label: t('oa.expenseTypeTravel') }, { value: 'office', label: t('oa.expenseTypeOffice') }, { value: 'meal', label: t('oa.expenseTypeMeal') }, { value: 'other', label: t('oa.expenseTypeOther') }] }
])
const columns = computed(() => [
  { prop: 'title', label: t('oa.expenseTitle'), minWidth: 150 },
  { prop: 'expenseType', label: t('oa.expenseType'), width: 100 },
  { prop: 'amount', label: t('oa.amount'), width: 120 },
  { prop: 'description', label: t('oa.description'), minWidth: 180, showOverflowTooltip: true },
  { prop: 'status', label: t('common.status'), width: 90, slot: 'status' },
  { prop: 'createTime', label: t('oa.createTime'), width: 170 }
])
const formItems = computed(() => [
  { prop: 'title', label: t('oa.inputTitle'), type: 'input' },
  { prop: 'expenseType', label: t('oa.expenseType'), type: 'select', options: [{ value: 'travel', label: t('oa.expenseTypeTravel') }, { value: 'office', label: t('oa.expenseTypeOffice') }, { value: 'meal', label: t('oa.expenseTypeMeal') }, { value: 'other', label: t('oa.expenseTypeOther') }] },
  { prop: 'amount', label: t('oa.amount'), type: 'number', precision: 2 },
  { prop: 'description', label: t('oa.description'), type: 'textarea', rows: 3 }
])
const formRules = computed(() => ({ title: [{ required: true, message: t('oa.inputTitle'), trigger: 'blur' }], amount: [{ required: true, message: t('oa.amount'), trigger: 'blur' }] }))

const loading = ref(false), tableData = ref([]), total = ref(0)
const dialogVisible = ref(false), submitLoading = ref(false), formRef = ref(null)
const queryParams = reactive({ pageNum: 1, pageSize: 10, title: '', expenseType: '' })
const formData = reactive({ id: undefined, title: '', expenseType: '', amount: undefined, description: '' })

async function loadData() { loading.value = true; try { const res = await (await import('@/utils/request')).default({ url: '/api/oa/expense/list', method: 'get', params: queryParams }); tableData.value = res.data.list || []; total.value = res.data.total || 0 } finally { loading.value = false } }
function handleSearch(p) { Object.assign(queryParams, p, { pageNum: 1 }); loadData() }
function handleReset() { Object.keys(queryParams).forEach(k => { if (k !== 'pageNum' && k !== 'pageSize') queryParams[k] = '' }); loadData() }
function handlePageChange(p) { queryParams.pageNum = p; loadData() }
function handleSizeChange(s) { queryParams.pageSize = s; queryParams.pageNum = 1; loadData() }
function handleAdd() { Object.keys(formData).forEach(k => formData[k] = ''); formData.id = undefined; dialogVisible.value = true }
function handleEdit(r) { Object.assign(formData, r); dialogVisible.value = true }
function cancelDialog() { dialogVisible.value = false; formRef.value?.resetFields() }
async function handleSubmit() { const valid = await formRef.value?.validate().catch(() => false); if (!valid) return; submitLoading.value = true; try { await new Promise(r => setTimeout(r, 500)); ElMessage.success(t('oa.submitSuccess')); dialogVisible.value = false; loadData() } catch { ElMessage.error(t('oa.submitFailed')) } finally { submitLoading.value = false } }
async function handleDelete(row) { await ElMessageBox.confirm(t('oa.deleteConfirm'), t('header.tips'), { type: 'warning' }); ElMessage.success(t('oa.deleteSuccess')); loadData() }
onMounted(() => loadData())
</script>

<style lang="scss" scoped>
.page-container .table-toolbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; padding: 14px 18px; background: #fff; border-radius: var(--border-radius-base); .toolbar-left { display: flex; gap: 10px; } .toolbar-right { display: flex; gap: 8px; } }
</style>
