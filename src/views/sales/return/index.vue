<template>
  <div class="page-container">
    <BaseSearch :search-items="searchItems" @search="handleSearch" @reset="handleReset" />
    <div class="table-toolbar">
      <div class="toolbar-left"><el-button type="primary" :icon="Plus" @click="handleAdd">{{ t('sales.addReturn') }}</el-button></div>
      <div class="toolbar-right"><el-button :icon="Refresh" circle @click="loadData" /></div>
    </div>
    <BaseTable :columns="columns" :table-data="tableData" :loading="loading" :total="total" :current-page.sync="queryParams.pageNum" :page-size.sync="queryParams.pageSize" :show-index="true" @current-change="handlePageChange" @size-change="handleSizeChange">
      <template #amount="{ row }">{{ formatMoney(row.amount) }}</template>
      <template #status="{ row }"><BaseStatusTag :type="row.status === 1 ? 'success' : 'warning'">{{ row.status === 1 ? t('sales.statusCompleted') : t('sales.statusProcessing') }}</BaseStatusTag></template>
      <template #operation="{ row }"><el-button type="primary" link size="small" @click="handleView(row)">{{ t('common.detail') }}</el-button><el-button type="danger" link size="small" @click="handleDelete(row)">{{ t('common.delete') }}</el-button></template>
    </BaseTable>
    <BaseDialog v-model="dialogVisible" :title="t('sales.addReturn')" width="600px" :confirm-loading="submitLoading" @confirm="handleSubmit" @cancel="cancelDialog"><BaseForm ref="formRef" v-model="formData" :form-items="formItems" :form-rules="formRules" :col-count="2" /></BaseDialog>

    <!-- Detail -->
    <el-dialog v-model="viewVisible" :title="t('sales.returnDetail')" width="640px" :close-on-click-modal="false">
      <el-descriptions v-if="viewRow" :column="2" border>
        <el-descriptions-item :label="t('sales.detailReturnNo')">{{ viewRow.returnNo }}</el-descriptions-item>
        <el-descriptions-item :label="t('sales.detailStatus')"><BaseStatusTag :type="viewRow.status === 1 ? 'success' : 'warning'">{{ viewRow.status === 1 ? t('sales.statusCompleted') : t('sales.statusProcessing') }}</BaseStatusTag></el-descriptions-item>
        <el-descriptions-item :label="t('sales.detailRelatedOrderNo')">{{ viewRow.orderNo }}</el-descriptions-item>
        <el-descriptions-item :label="t('sales.detailCustomer')">{{ viewRow.customerName }}</el-descriptions-item>
        <el-descriptions-item :label="t('sales.detailReturnAmount')">{{ formatMoney(viewRow.amount) }}</el-descriptions-item>
        <el-descriptions-item :label="t('sales.detailReturnReason')">{{ viewRow.reason }}</el-descriptions-item>
        <el-descriptions-item :label="t('sales.detailCreateTime')" :span="2">{{ viewRow.createTime }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Refresh } from '@element-plus/icons-vue'
import { useI18n } from 'vue-i18n'
import BaseSearch from '@/components/BaseSearch.vue'
import BaseTable from '@/components/BaseTable.vue'
import BaseDialog from '@/components/BaseDialog.vue'
import BaseForm from '@/components/BaseForm.vue'
import BaseStatusTag from '@/components/BaseStatusTag.vue'
import request from '@/utils/request'

const { t, locale } = useI18n()

function formatMoney(v) {
  if (v === null || v === undefined || v === '') return '0.00'
  return Number(v).toLocaleString(locale.value === 'zh-CN' ? 'zh-CN' : 'en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

const searchItems = computed(() => [
  { prop: 'returnNo', label: t('sales.returnNo'), type: 'input' },
  { prop: 'customerName', label: t('sales.customer'), type: 'input' }
])

const columns = computed(() => [
  { prop: 'returnNo', label: t('sales.returnNo'), width: 190 },
  { prop: 'orderNo', label: t('sales.orderNoLabel'), width: 180 },
  { prop: 'customerName', label: t('sales.customer'), width: 120 },
  { prop: 'amount', label: t('sales.amount'), width: 120, slot: 'amount', align: 'right' },
  { prop: 'reason', label: t('sales.reason'), minWidth: 150, showOverflowTooltip: true },
  { prop: 'status', label: t('sales.detailStatus'), width: 90, slot: 'status' },
  { prop: 'createTime', label: t('sales.detailCreateTime'), width: 170 }
])

const formItems = computed(() => [
  { prop: 'returnNo', label: t('sales.returnNo'), type: 'input', span: 12 },
  { prop: 'orderNo', label: t('sales.orderNoLabel'), type: 'input', span: 12 },
  { prop: 'customerName', label: t('sales.customer'), type: 'input', span: 12 },
  { prop: 'amount', label: t('sales.amount'), type: 'number', precision: 2, span: 12 },
  { prop: 'reason', label: t('sales.reason'), type: 'textarea', rows: 3, span: 24 }
])

const formRules = computed(() => ({
  returnNo: [{ required: true, message: t('sales.validateReturnNo'), trigger: 'blur' }]
}))

const loading = ref(false), tableData = ref([]), total = ref(0)
const dialogVisible = ref(false), submitLoading = ref(false), formRef = ref(null)
const queryParams = reactive({ pageNum: 1, pageSize: 10, returnNo: '', customerName: '' })
const formData = reactive({ id: undefined, returnNo: '', orderNo: '', customerName: '', amount: undefined, reason: '' })
const viewVisible = ref(false), viewRow = ref(null)

async function loadData() { loading.value = true; try { const res = await request({ url: '/api/sales/return/list', method: 'get', params: queryParams }); tableData.value = res.data.list || []; total.value = res.data.total || 0 } finally { loading.value = false } }
function handleSearch(p) { Object.assign(queryParams, p, { pageNum: 1 }); loadData() }
function handleReset() { Object.keys(queryParams).forEach(k => { if (k !== 'pageNum' && k !== 'pageSize') queryParams[k] = '' }); loadData() }
function handlePageChange(p) { queryParams.pageNum = p; loadData() }; function handleSizeChange(s) { queryParams.pageSize = s; queryParams.pageNum = 1; loadData() }
function handleAdd() { Object.keys(formData).forEach(k => formData[k] = ''); formData.id = undefined; dialogVisible.value = true }
function handleView(r) { viewRow.value = r; viewVisible.value = true }
function cancelDialog() { dialogVisible.value = false; formRef.value?.resetFields() }
async function handleSubmit() { const valid = await formRef.value?.validate().catch(() => false); if (!valid) return; submitLoading.value = true; try { await new Promise(r => setTimeout(r, 500)); ElMessage.success(t('common.success')); dialogVisible.value = false; loadData() } catch { ElMessage.error(t('common.failed')) } finally { submitLoading.value = false } }
async function handleDelete(row) { await ElMessageBox.confirm(t('common.confirmDelete'), t('common.hint'), { type: 'warning' }); ElMessage.success(t('common.deleteSuccess')); loadData() }
onMounted(() => loadData())
</script>

<style lang="scss" scoped>
.page-container .table-toolbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; padding: 14px 18px; background: #fff; border-radius: var(--border-radius-base); .toolbar-left { display: flex; gap: 10px; } .toolbar-right { display: flex; gap: 8px; } }
</style>
