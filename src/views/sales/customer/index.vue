<template>
  <div class="page-container">
    <BaseSearch :search-items="searchItems" @search="handleSearch" @reset="handleReset" />
    <div class="table-toolbar">
      <div class="toolbar-left"><el-button type="primary" :icon="Plus" @click="handleAdd">{{ t('sales.addCustomer') }}</el-button><el-button :icon="Download" plain>{{ t('common.export') }}</el-button></div>
      <div class="toolbar-right"><el-button :icon="Refresh" circle @click="loadData" /></div>
    </div>
    <BaseTable :columns="columns" :table-data="tableData" :loading="loading" :total="total" :current-page.sync="queryParams.pageNum" :page-size.sync="queryParams.pageSize" :show-selection="true" :show-index="true" @selection-change="handleSelectionChange" @current-change="handlePageChange" @size-change="handleSizeChange">
      <template #level="{ row }"><el-tag :type="levelMap[row.level]?.type || 'info'" size="small">{{ levelMap[row.level]?.label || row.level }}</el-tag></template>
      <template #status="{ row }"><el-tag :type="row.status === 1 ? 'success' : 'info'" size="small">{{ row.status === 1 ? t('common.enable') : t('common.disable') }}</el-tag></template>
      <template #operation="{ row }"><el-button type="primary" link size="small" @click="handleView(row)">{{ t('common.detail') }}</el-button><el-button type="primary" link size="small" @click="handleEdit(row)">{{ t('common.edit') }}</el-button><el-button type="danger" link size="small" @click="handleDelete(row)">{{ t('common.delete') }}</el-button></template>
    </BaseTable>
    <BaseDialog v-model="dialogVisible" :title="dialogTitle" width="600px" :confirm-loading="submitLoading" @confirm="handleSubmit" @cancel="cancelDialog"><BaseForm ref="formRef" v-model="formData" :form-items="formItems" :form-rules="formRules" :col-count="2" /></BaseDialog>

    <!-- Detail -->
    <el-dialog v-model="viewVisible" :title="t('sales.customerDetail')" width="640px" :close-on-click-modal="false">
      <el-descriptions v-if="viewRow" :column="2" border>
        <el-descriptions-item :label="t('sales.customerName')">{{ viewRow.customerName }}</el-descriptions-item>
        <el-descriptions-item :label="t('sales.contactName')">{{ viewRow.contactName }}</el-descriptions-item>
        <el-descriptions-item :label="t('sales.phone')">{{ viewRow.phone }}</el-descriptions-item>
        <el-descriptions-item :label="t('sales.email')">{{ viewRow.email }}</el-descriptions-item>
        <el-descriptions-item :label="t('sales.level')"><el-tag :type="levelMap[viewRow.level]?.type || 'info'" size="small">{{ levelMap[viewRow.level]?.label || viewRow.level }}</el-tag></el-descriptions-item>
        <el-descriptions-item :label="t('sales.detailStatus')"><el-tag :type="viewRow.status === 1 ? 'success' : 'info'" size="small">{{ viewRow.status === 1 ? t('common.enable') : t('common.disable') }}</el-tag></el-descriptions-item>
        <el-descriptions-item :label="t('sales.address')" :span="2">{{ viewRow.address }}</el-descriptions-item>
        <el-descriptions-item :label="t('sales.detailCreateTime')" :span="2">{{ viewRow.createTime }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Download, Refresh } from '@element-plus/icons-vue'
import { useI18n } from 'vue-i18n'
import BaseSearch from '@/components/BaseSearch.vue'
import BaseTable from '@/components/BaseTable.vue'
import BaseDialog from '@/components/BaseDialog.vue'
import BaseForm from '@/components/BaseForm.vue'
import request from '@/utils/request'

const { t } = useI18n()

const levelMap = computed(() => ({
  A: { label: t('sales.levelA'), type: 'danger' },
  B: { label: t('sales.levelB'), type: 'warning' },
  C: { label: t('sales.levelC'), type: 'info' }
}))

const searchItems = computed(() => [
  { prop: 'customerName', label: t('sales.customerName'), type: 'input' },
  { prop: 'contactName', label: t('sales.contactName'), type: 'input' },
  { prop: 'phone', label: t('sales.phone'), type: 'input' }
])

const columns = computed(() => [
  { prop: 'customerName', label: t('sales.customerName'), width: 150 },
  { prop: 'contactName', label: t('sales.contactName'), width: 110 },
  { prop: 'phone', label: t('sales.phone'), width: 130 },
  { prop: 'address', label: t('sales.address'), minWidth: 180, showOverflowTooltip: true },
  { prop: 'level', label: t('sales.level'), width: 70, slot: 'level' },
  { prop: 'status', label: t('sales.detailStatus'), width: 80, slot: 'status' },
  { prop: 'createTime', label: t('sales.detailCreateTime'), width: 170 }
])

const formItems = computed(() => [
  { prop: 'customerName', label: t('sales.customerName'), type: 'input', span: 12 },
  { prop: 'contactName', label: t('sales.contactName'), type: 'input', span: 12 },
  { prop: 'phone', label: t('sales.phone'), type: 'input', span: 12 },
  { prop: 'email', label: t('sales.email'), type: 'input', span: 12 },
  { prop: 'address', label: t('sales.address'), type: 'textarea', rows: 2, span: 24 },
  { prop: 'remark', label: t('common.remark'), type: 'textarea', rows: 3, span: 24 }
])

const formRules = computed(() => ({
  customerName: [{ required: true, message: t('sales.validateCustomerName'), trigger: 'blur' }],
  phone: [{ required: true, message: t('sales.validatePhone'), trigger: 'blur' }]
}))

const loading = ref(false), tableData = ref([]), total = ref(0), selectedRows = ref([])
const dialogVisible = ref(false), dialogTitle = ref(''), submitLoading = ref(false), formRef = ref(null)
const queryParams = reactive({ pageNum: 1, pageSize: 10, customerName: '', contactName: '', phone: '' })
const formData = reactive({ id: undefined, customerName: '', contactName: '', phone: '', email: '', address: '', remark: '' })
const viewVisible = ref(false), viewRow = ref(null)

async function loadData() { loading.value = true; try { const res = await request({ url: '/api/sales/customer/list', method: 'get', params: queryParams }); tableData.value = res.data.list || []; total.value = res.data.total || 0 } finally { loading.value = false } }
function handleSearch(p) { Object.assign(queryParams, p, { pageNum: 1 }); loadData() }
function handleReset() { Object.keys(queryParams).forEach(k => { if (k !== 'pageNum' && k !== 'pageSize') queryParams[k] = '' }); loadData() }
function handlePageChange(p) { queryParams.pageNum = p; loadData() }; function handleSizeChange(s) { queryParams.pageSize = s; queryParams.pageNum = 1; loadData() }
function handleSelectionChange(r) { selectedRows.value = r }
function handleAdd() { dialogTitle.value = t('sales.addCustomer'); Object.keys(formData).forEach(k => formData[k] = ''); formData.id = undefined; dialogVisible.value = true }
function handleView(r) { viewRow.value = r; viewVisible.value = true }
function handleEdit(r) { dialogTitle.value = t('sales.editCustomer'); Object.assign(formData, r); dialogVisible.value = true }
function cancelDialog() { dialogVisible.value = false; formRef.value?.resetFields() }
async function handleSubmit() { const valid = await formRef.value?.validate().catch(() => false); if (!valid) return; submitLoading.value = true; try { await new Promise(r => setTimeout(r, 500)); ElMessage.success(t('common.success')); dialogVisible.value = false; loadData() } catch { ElMessage.error(t('common.failed')) } finally { submitLoading.value = false } }
async function handleDelete(row) { await ElMessageBox.confirm(t('common.confirmDelete'), t('common.hint'), { type: 'warning' }); ElMessage.success(t('common.deleteSuccess')); loadData() }
onMounted(() => loadData())
</script>

<style lang="scss" scoped>
.page-container .table-toolbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; padding: 14px 18px; background: #fff; border-radius: var(--border-radius-base); .toolbar-left { display: flex; gap: 10px; } .toolbar-right { display: flex; gap: 8px; } }
</style>
