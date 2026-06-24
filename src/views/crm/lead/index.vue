<template>
  <div class="page-container">
    <BaseSearch :search-items="searchItems" @search="handleSearch" @reset="handleReset" />
    <div class="table-toolbar">
      <div class="toolbar-left">
        <el-button type="primary" :icon="Plus" @click="handleAdd">{{ t('crm.addLead') }}</el-button>
        <el-button :icon="Delete" plain @click="handleBatchDelete">{{ t('crm.batchDelete') }}</el-button>
      </div>
      <div class="toolbar-right"><el-button :icon="Refresh" circle @click="loadData" /></div>
    </div>
    <BaseTable :columns="columns" :table-data="tableData" :loading="loading" :total="total" :current-page.sync="queryParams.pageNum" :page-size.sync="queryParams.pageSize" :show-selection="true" :show-index="true" @selection-change="handleSelectionChange" @current-change="handlePageChange" @size-change="handleSizeChange">
      <template #status="{ row }"><BaseStatusTag :type="row.status === 1 ? 'success' : 'warning'">{{ row.status === 1 ? t('crm.converted') : t('crm.following') }}</BaseStatusTag></template>
      <template #operation="{ row }"><el-button type="primary" link size="small" @click="handleEdit(row)">{{ t('common.edit') }}</el-button><el-button type="danger" link size="small" @click="handleDelete(row)">{{ t('common.delete') }}</el-button></template>
    </BaseTable>
    <BaseDialog v-model="dialogVisible" :title="dialogTitle" width="600px" :confirm-loading="submitLoading" @confirm="handleSubmit" @cancel="cancelDialog"><BaseForm ref="formRef" v-model="formData" :form-items="formItems" :form-rules="formRules" :col-count="2" /></BaseDialog>
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

const searchItems = [
  { prop: 'companyName', label: t('crm.companyName'), type: 'input' },
  { prop: 'contactName', label: t('crm.contactName'), type: 'input' },
  { prop: 'phone', label: t('crm.phone'), type: 'input' }
]
const columns = [
  { prop: 'companyName', label: t('crm.companyName'), minWidth: 150 },
  { prop: 'contactName', label: t('crm.contactName'), width: 110 },
  { prop: 'phone', label: t('crm.phone'), width: 130 },
  { prop: 'source', label: t('crm.source'), width: 100 },
  { prop: 'status', label: t('common.status'), width: 90, slot: 'status' },
  { prop: 'createTime', label: t('crm.createTime'), width: 170 }
]
const formItems = [
  { prop: 'companyName', label: t('crm.companyName'), type: 'input', span: 12 },
  { prop: 'contactName', label: t('crm.contactName'), type: 'input', span: 12 },
  { prop: 'phone', label: t('crm.phone'), type: 'input', span: 12 },
  { prop: 'source', label: t('crm.source'), type: 'select', span: 12, options: [{ value: t('crm.official'), label: t('crm.official') }, { value: t('crm.referral'), label: t('crm.referral') }, { value: t('crm.exhibition'), label: t('crm.exhibition') }] },
  { prop: 'remark', label: t('crm.remark'), type: 'textarea', span: 24 }
]
const formRules = { companyName: [{ required: true, message: t('crm.companyName') + ' required', trigger: 'blur' }] }

const loading = ref(false), tableData = ref([]), total = ref(0), selectedRows = ref([])
const dialogVisible = ref(false), dialogTitle = ref(''), submitLoading = ref(false), formRef = ref(null)
const queryParams = reactive({ pageNum: 1, pageSize: 10, companyName: '', contactName: '', phone: '' })
const formData = reactive({ id: undefined, companyName: '', contactName: '', phone: '', source: '', remark: '' })

async function loadData() {
  loading.value = true
  try {
    const res = await (await import('@/utils/request')).default({ url: '/api/crm/lead/list', method: 'get', params: queryParams })
    tableData.value = res.data.list || []; total.value = res.data.total || 0
  } finally { loading.value = false }
}
function handleSearch(p) { Object.assign(queryParams, p, { pageNum: 1 }); loadData() }
function handleReset() { Object.keys(queryParams).forEach(k => { if (k !== 'pageNum' && k !== 'pageSize') queryParams[k] = '' }); loadData() }
function handlePageChange(p) { queryParams.pageNum = p; loadData() }
function handleSizeChange(s) { queryParams.pageSize = s; queryParams.pageNum = 1; loadData() }
function handleSelectionChange(r) { selectedRows.value = r }
function handleAdd() { dialogTitle.value = t('crm.addLead'); Object.keys(formData).forEach(k => formData[k] = ''); formData.id = undefined; dialogVisible.value = true }
function handleEdit(r) { dialogTitle.value = t('crm.editLead'); Object.assign(formData, r); dialogVisible.value = true }
function cancelDialog() { dialogVisible.value = false; formRef.value?.resetFields() }
async function handleSubmit() {
  const valid = await formRef.value?.validate().catch(() => false); if (!valid) return
  submitLoading.value = true
  try { await new Promise(r => setTimeout(r, 500)); ElMessage.success(t('common.success')); dialogVisible.value = false; loadData() }
  catch { ElMessage.error(t('common.failed')) }
  finally { submitLoading.value = false }
}
async function handleDelete(row) { await ElMessageBox.confirm(t('common.confirmDelete'), t('header.tips'), { type: 'warning' }); ElMessage.success(t('common.success')); loadData() }
async function handleBatchDelete() { if (!selectedRows.value.length) return ElMessage.warning(t('common.noData')); await ElMessageBox.confirm(t('common.confirmDelete'), t('header.tips'), { type: 'warning' }); ElMessage.success(t('common.success')); loadData() }
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
