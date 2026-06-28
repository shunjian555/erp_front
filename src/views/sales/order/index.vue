<template>
  <div class="page-container">
    <BaseSearch :search-items="searchItems" @search="handleSearch" @reset="handleReset" />
    <div class="table-toolbar">
      <div class="toolbar-left"><el-button type="primary" :icon="Plus" @click="handleAdd">{{ t('sales.addOrder') }}</el-button><el-button :icon="Download" plain>{{ t('common.export') }}</el-button></div>
      <div class="toolbar-right"><el-button :icon="Refresh" circle @click="loadData" /></div>
    </div>
    <BaseTable :columns="columns" :table-data="tableData" :loading="loading" :total="total" :current-page.sync="queryParams.pageNum" :page-size.sync="queryParams.pageSize" :show-selection="true" :show-index="true" @selection-change="handleSelectionChange" @current-change="handlePageChange" @size-change="handleSizeChange">
      <template #totalAmount="{ row }">{{ formatMoney(row.totalAmount) }}</template>
      <template #status="{ row }"><el-tag :type="salesStatusMap[row.status]?.type || 'info'" size="small">{{ salesStatusMap[row.status]?.label || t('sales.unknown') }}</el-tag></template>
      <template #operation="{ row }"><el-button type="primary" link size="small" @click="handleView(row)">{{ t('common.detail') }}</el-button><el-button type="primary" link size="small" @click="handleEdit(row)">{{ t('common.edit') }}</el-button><el-button type="danger" link size="small" @click="handleDelete(row)">{{ t('common.delete') }}</el-button></template>
    </BaseTable>
    <BaseDialog v-model="dialogVisible" :title="dialogTitle" width="700px" :confirm-loading="submitLoading" @confirm="handleSubmit" @cancel="cancelDialog"><BaseForm ref="formRef" v-model="formData" :form-items="formItems" :form-rules="formRules" :col-count="2" /></BaseDialog>

    <!-- Detail -->
    <el-dialog v-model="viewVisible" :title="t('sales.orderDetail')" width="640px" :close-on-click-modal="false">
      <el-descriptions v-if="viewRow" :column="2" border>
        <el-descriptions-item :label="t('sales.detailOrderNo')">{{ viewRow.orderNo }}</el-descriptions-item>
        <el-descriptions-item :label="t('sales.detailStatus')"><el-tag :type="salesStatusMap[viewRow.status]?.type || 'info'" size="small">{{ salesStatusMap[viewRow.status]?.label || t('sales.unknown') }}</el-tag></el-descriptions-item>
        <el-descriptions-item :label="t('sales.detailCustomerName')">{{ viewRow.customerName }}</el-descriptions-item>
        <el-descriptions-item :label="t('sales.detailQuantity')">{{ viewRow.quantity }}</el-descriptions-item>
        <el-descriptions-item :label="t('sales.detailOrderAmount')">{{ formatMoney(viewRow.totalAmount) }}</el-descriptions-item>
        <el-descriptions-item :label="t('sales.detailDeliveryDate')">{{ viewRow.deliveryDate }}</el-descriptions-item>
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

const { t, locale } = useI18n()

function formatMoney(v) {
  if (v === null || v === undefined || v === '') return '0.00'
  return Number(v).toLocaleString(locale.value === 'zh-CN' ? 'zh-CN' : 'en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

const salesStatusMap = computed(() => ({
  0: { label: t('sales.statusPending'), type: 'info' },
  1: { label: t('sales.statusConfirmed'), type: 'primary' },
  2: { label: t('sales.statusPartialShip'), type: 'warning' },
  3: { label: t('sales.statusShippedOrder'), type: 'success' },
  4: { label: t('sales.statusDone'), type: 'success' }
}))

const searchItems = computed(() => [
  { prop: 'orderNo', label: t('sales.orderNo'), type: 'input' },
  { prop: 'customerName', label: t('sales.customerName'), type: 'input' },
  { prop: 'status', label: t('sales.detailStatus'), type: 'select', options: Object.entries(salesStatusMap.value).map(([v, l]) => ({ value: Number(v), label: l.label })) }
])

const columns = computed(() => [
  { prop: 'orderNo', label: t('sales.orderNo'), width: 190 },
  { prop: 'customerName', label: t('sales.customer'), width: 130 },
  { prop: 'totalAmount', label: t('sales.amount'), width: 130, slot: 'totalAmount', align: 'right' },
  { prop: 'quantity', label: t('sales.quantity'), width: 80, align: 'center' },
  { prop: 'status', label: t('sales.detailStatus'), width: 100, slot: 'status' },
  { prop: 'createTime', label: t('sales.detailCreateTime'), width: 170 }
])

const formItems = computed(() => [
  { prop: 'orderNo', label: t('sales.orderNo'), type: 'input', span: 12 },
  { prop: 'customerName', label: t('sales.customer'), type: 'input', span: 12 },
  { prop: 'totalAmount', label: t('sales.totalAmount'), type: 'number', precision: 2, span: 12 },
  { prop: 'deliveryDate', label: t('sales.deliveryDate'), type: 'date', span: 12 },
  { prop: 'remark', label: t('common.remark'), type: 'textarea', rows: 3, span: 24 }
])

const formRules = computed(() => ({
  orderNo: [{ required: true, message: t('sales.validateOrderNo'), trigger: 'blur' }],
  customerName: [{ required: true, message: t('sales.validateSelectCustomer'), trigger: 'blur' }]
}))

const loading = ref(false), tableData = ref([]), total = ref(0), selectedRows = ref([])
const dialogVisible = ref(false), dialogTitle = ref(''), submitLoading = ref(false), formRef = ref(null)
const queryParams = reactive({ pageNum: 1, pageSize: 10, orderNo: '', customerName: '', status: '' })
const formData = reactive({ id: undefined, orderNo: '', customerName: '', totalAmount: undefined, deliveryDate: '', remark: '' })
const viewVisible = ref(false), viewRow = ref(null)

async function loadData() { loading.value = true; try { const res = await request({ url: '/api/sales/order/list', method: 'get', params: queryParams }); tableData.value = res.data.list || []; total.value = res.data.total || 0 } finally { loading.value = false } }
function handleSearch(p) { Object.assign(queryParams, p, { pageNum: 1 }); loadData() }
function handleReset() { Object.keys(queryParams).forEach(k => { if (k !== 'pageNum' && k !== 'pageSize') queryParams[k] = '' }); loadData() }
function handlePageChange(p) { queryParams.pageNum = p; loadData() }; function handleSizeChange(s) { queryParams.pageSize = s; queryParams.pageNum = 1; loadData() }
function handleSelectionChange(r) { selectedRows.value = r }
function handleAdd() { dialogTitle.value = t('sales.addSalesOrder'); Object.keys(formData).forEach(k => formData[k] = ''); formData.id = undefined; dialogVisible.value = true }
function handleView(r) { viewRow.value = r; viewVisible.value = true }
function handleEdit(r) { dialogTitle.value = t('sales.editSalesOrder'); Object.assign(formData, r); dialogVisible.value = true }
function cancelDialog() { dialogVisible.value = false; formRef.value?.resetFields() }
async function handleSubmit() { const valid = await formRef.value?.validate().catch(() => false); if (!valid) return; submitLoading.value = true; try { await new Promise(r => setTimeout(r, 500)); ElMessage.success(t('common.success')); dialogVisible.value = false; loadData() } catch { ElMessage.error(t('common.failed')) } finally { submitLoading.value = false } }
async function handleDelete(row) { await ElMessageBox.confirm(t('common.confirmDelete'), t('common.hint'), { type: 'warning' }); ElMessage.success(t('common.deleteSuccess')); loadData() }
onMounted(() => loadData())
</script>

<style lang="scss" scoped>
.page-container .table-toolbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; padding: 14px 18px; background: #fff; border-radius: var(--border-radius-base); .toolbar-left { display: flex; gap: 10px; } .toolbar-right { display: flex; gap: 8px; } }
</style>
