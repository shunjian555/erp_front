<template>
  <div class="page-container">
    <BaseSearch :search-items="searchItems" @search="handleSearch" @reset="handleReset" />
    <div class="table-toolbar">
      <div class="toolbar-left"><el-button type="primary" :icon="Plus" @click="handleAdd">{{ t('crm.addOpportunity') }}</el-button><el-button :icon="Delete" plain @click="handleBatchDelete">{{ t('crm.batchDelete') }}</el-button></div>
      <div class="toolbar-right"><el-button :icon="Refresh" circle @click="loadData" /></div>
    </div>
    <BaseTable :columns="columns" :table-data="tableData" :loading="loading" :total="total" :current-page.sync="queryParams.pageNum" :page-size.sync="queryParams.pageSize" :show-selection="true" :show-index="true" @selection-change="handleSelectionChange" @current-change="handlePageChange" @size-change="handleSizeChange">
      <template #stage="{ row }"><el-tag :type="stageMap[row.stage]?.type || 'info'" size="small">{{ stageMap[row.stage]?.label || row.stage }}</el-tag></template>
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

const { t } = useI18n()

const stageMap = { 1: { label: t('crmOpportunity.stage1'), type: 'info' }, 2: { label: t('crmOpportunity.stage2'), type: '' }, 3: { label: t('crmOpportunity.stage3'), type: 'warning' }, 4: { label: t('crmOpportunity.stage4'), type: 'success' }, 5: { label: t('crmOpportunity.stage5'), type: 'success' } }
const searchItems = [ { prop: 'opportunityName', label: t('crmOpportunity.name'), type: 'input' }, { prop: 'customerName', label: t('crm.customerName'), type: 'input' }, { prop: 'stage', label: t('crmOpportunity.stage'), type: 'select', options: Object.entries(stageMap).map(([v, l]) => ({ value: Number(v), label: l.label })) } ]
const columns = [ { prop: 'opportunityName', label: t('crmOpportunity.name'), minWidth: 150 }, { prop: 'customerName', label: t('crm.customerName'), width: 130 }, { prop: 'expectedAmount', label: t('crmOpportunity.expectedAmount'), width: 120 }, { prop: 'stage', label: t('crmOpportunity.stage'), width: 100, slot: 'stage' }, { prop: 'ownerName', label: t('crmOpportunity.owner'), width: 100 }, { prop: 'createTime', label: t('crm.createTime'), width: 170 } ]
const formItems = [ { prop: 'opportunityName', label: t('crmOpportunity.name'), type: 'input', span: 12 }, { prop: 'customerName', label: t('crm.customerName'), type: 'input', span: 12 }, { prop: 'expectedAmount', label: t('crmOpportunity.expectedAmount'), type: 'number', span: 12 }, { prop: 'stage', label: t('crmOpportunity.stage'), type: 'select', span: 12, options: Object.entries(stageMap).map(([v, l]) => ({ value: Number(v), label: l.label })) }, { prop: 'remark', label: t('crm.remark'), type: 'textarea', span: 24 } ]
const formRules = { opportunityName: [{ required: true, message: t('crmOpportunity.name'), trigger: 'blur' }] }

const loading = ref(false), tableData = ref([]), total = ref(0), selectedRows = ref([])
const dialogVisible = ref(false), dialogTitle = ref(''), submitLoading = ref(false), formRef = ref(null)
const queryParams = reactive({ pageNum: 1, pageSize: 10, opportunityName: '', customerName: '', stage: '' })
const formData = reactive({ id: undefined, opportunityName: '', customerName: '', expectedAmount: undefined, stage: '', remark: '' })

async function loadData() { loading.value = true; try { const res = await (await import('@/utils/request')).default({ url: '/api/crm/opportunity/list', method: 'get', params: queryParams }); tableData.value = res.data.list || []; total.value = res.data.total || 0 } finally { loading.value = false } }
function handleSearch(p) { Object.assign(queryParams, p, { pageNum: 1 }); loadData() }
function handleReset() { Object.keys(queryParams).forEach(k => { if (k !== 'pageNum' && k !== 'pageSize') queryParams[k] = '' }); loadData() }
function handlePageChange(p) { queryParams.pageNum = p; loadData() }; function handleSizeChange(s) { queryParams.pageSize = s; queryParams.pageNum = 1; loadData() }
function handleSelectionChange(r) { selectedRows.value = r }
function handleAdd() { dialogTitle.value = t('crm.addOpportunity'); Object.keys(formData).forEach(k => formData[k] = ''); formData.id = undefined; dialogVisible.value = true }
function handleEdit(r) { dialogTitle.value = t('crm.editOpportunity'); Object.assign(formData, r); dialogVisible.value = true }
function cancelDialog() { dialogVisible.value = false; formRef.value?.resetFields() }
async function handleSubmit() { const valid = await formRef.value?.validate().catch(() => false); if (!valid) return; submitLoading.value = true; try { await new Promise(r => setTimeout(r, 500)); ElMessage.success(t('common.success')); dialogVisible.value = false; loadData() } catch { ElMessage.error(t('common.failed')) } finally { submitLoading.value = false } }
async function handleDelete(row) { await ElMessageBox.confirm(t('common.confirmDelete'), t('header.tips'), { type: 'warning' }); ElMessage.success(t('common.success')); loadData() }
async function handleBatchDelete() { if (!selectedRows.value.length) return ElMessage.warning(t('common.noData')); await ElMessageBox.confirm(t('common.confirmDelete'), t('header.tips'), { type: 'warning' }); ElMessage.success(t('common.success')); loadData() }
onMounted(() => loadData())
</script>

<style lang="scss" scoped>
.page-container .table-toolbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; padding: 14px 18px; background: #fff; border-radius: var(--border-radius-base); .toolbar-left { display: flex; gap: 10px; } .toolbar-right { display: flex; gap: 8px; } }
</style>
