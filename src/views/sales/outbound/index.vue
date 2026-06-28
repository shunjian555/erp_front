<template>
  <div class="page-container">
    <BaseSearch :search-items="searchItems" @search="handleSearch" @reset="handleReset" />
    <div class="table-toolbar">
      <div class="toolbar-left"><el-button type="primary" :icon="Plus" @click="handleAdd">{{ t('sales.addOutbound') }}</el-button></div>
      <div class="toolbar-right"><el-button :icon="Refresh" circle @click="loadData" /></div>
    </div>
    <BaseTable :columns="columns" :table-data="tableData" :loading="loading" :total="total" :current-page.sync="queryParams.pageNum" :page-size.sync="queryParams.pageSize" :show-index="true" @current-change="handlePageChange" @size-change="handleSizeChange">
      <template #status="{ row }"><BaseStatusTag :type="row.status === 1 ? 'success' : 'warning'">{{ row.status === 1 ? t('sales.statusShipped') : t('sales.statusPendingShip') }}</BaseStatusTag></template>
      <template #operation="{ row }"><el-button type="primary" link size="small" @click="handleView(row)">{{ t('common.detail') }}</el-button></template>
    </BaseTable>
    <BaseDialog v-model="dialogVisible" :title="t('sales.addOutbound')" width="600px" :confirm-loading="submitLoading" @confirm="handleSubmit" @cancel="cancelDialog"><BaseForm ref="formRef" v-model="formData" :form-items="formItems" :form-rules="formRules" :col-count="2" /></BaseDialog>

    <!-- Detail -->
    <el-dialog v-model="viewVisible" :title="t('sales.outboundDetail')" width="640px" :close-on-click-modal="false">
      <el-descriptions v-if="viewRow" :column="2" border>
        <el-descriptions-item :label="t('sales.detailOutboundNo')">{{ viewRow.outboundNo }}</el-descriptions-item>
        <el-descriptions-item :label="t('sales.detailRelatedOrder')">{{ viewRow.orderNo }}</el-descriptions-item>
        <el-descriptions-item :label="t('sales.detailCustomer')">{{ viewRow.customerName }}</el-descriptions-item>
        <el-descriptions-item :label="t('sales.detailQuantity')">{{ viewRow.quantity }}</el-descriptions-item>
        <el-descriptions-item :label="t('sales.detailOutboundDate')">{{ viewRow.outboundDate }}</el-descriptions-item>
        <el-descriptions-item :label="t('sales.detailStatus')"><BaseStatusTag :type="viewRow.status === 1 ? 'success' : 'warning'">{{ viewRow.status === 1 ? t('sales.statusShipped') : t('sales.statusPendingShip') }}</BaseStatusTag></el-descriptions-item>
        <el-descriptions-item :label="t('sales.detailCreateTime')" :span="2">{{ viewRow.createTime }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Plus, Refresh } from '@element-plus/icons-vue'
import { useI18n } from 'vue-i18n'
import BaseSearch from '@/components/BaseSearch.vue'
import BaseTable from '@/components/BaseTable.vue'
import BaseDialog from '@/components/BaseDialog.vue'
import BaseForm from '@/components/BaseForm.vue'
import BaseStatusTag from '@/components/BaseStatusTag.vue'
import request from '@/utils/request'

const { t } = useI18n()

const searchItems = computed(() => [
  { prop: 'outboundNo', label: t('sales.outboundNo'), type: 'input' },
  { prop: 'orderNo', label: t('sales.orderNoLabel'), type: 'input' }
])

const columns = computed(() => [
  { prop: 'outboundNo', label: t('sales.outboundNo'), width: 190 },
  { prop: 'orderNo', label: t('sales.orderNoLabel'), width: 180 },
  { prop: 'customerName', label: t('sales.customer'), width: 120 },
  { prop: 'quantity', label: t('sales.quantity'), width: 80, align: 'center' },
  { prop: 'outboundDate', label: t('sales.outboundDate'), width: 120 },
  { prop: 'status', label: t('sales.detailStatus'), width: 90, slot: 'status' }
])

const formItems = computed(() => [
  { prop: 'outboundNo', label: t('sales.outboundNo'), type: 'input', span: 12 },
  { prop: 'orderNo', label: t('sales.orderNoLabel'), type: 'input', span: 12 },
  { prop: 'customerName', label: t('sales.customer'), type: 'input', span: 12 },
  { prop: 'outboundDate', label: t('sales.outboundDate'), type: 'date', span: 12 },
  { prop: 'remark', label: t('common.remark'), type: 'textarea', rows: 3, span: 24 }
])

const formRules = computed(() => ({
  outboundNo: [{ required: true, message: t('sales.validateOutboundNo'), trigger: 'blur' }]
}))

const loading = ref(false), tableData = ref([]), total = ref(0)
const dialogVisible = ref(false), submitLoading = ref(false), formRef = ref(null)
const queryParams = reactive({ pageNum: 1, pageSize: 10, outboundNo: '', orderNo: '' })
const formData = reactive({ id: undefined, outboundNo: '', orderNo: '', customerName: '', outboundDate: '', remark: '' })
const viewVisible = ref(false), viewRow = ref(null)

async function loadData() { loading.value = true; try { const res = await request({ url: '/api/sales/outbound/list', method: 'get', params: queryParams }); tableData.value = res.data.list || []; total.value = res.data.total || 0 } finally { loading.value = false } }
function handleSearch(p) { Object.assign(queryParams, p, { pageNum: 1 }); loadData() }
function handleReset() { Object.keys(queryParams).forEach(k => { if (k !== 'pageNum' && k !== 'pageSize') queryParams[k] = '' }); loadData() }
function handlePageChange(p) { queryParams.pageNum = p; loadData() }; function handleSizeChange(s) { queryParams.pageSize = s; queryParams.pageNum = 1; loadData() }
function handleAdd() { Object.keys(formData).forEach(k => formData[k] = ''); formData.id = undefined; dialogVisible.value = true }
function handleView(r) { viewRow.value = r; viewVisible.value = true }
function cancelDialog() { dialogVisible.value = false; formRef.value?.resetFields() }
async function handleSubmit() { const valid = await formRef.value?.validate().catch(() => false); if (!valid) return; submitLoading.value = true; try { await new Promise(r => setTimeout(r, 500)); ElMessage.success(t('common.success')); dialogVisible.value = false; loadData() } catch { ElMessage.error(t('common.failed')) } finally { submitLoading.value = false } }
onMounted(() => loadData())
</script>

<style lang="scss" scoped>
.page-container .table-toolbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; padding: 14px 18px; background: #fff; border-radius: var(--border-radius-base); .toolbar-left { display: flex; gap: 10px; } .toolbar-right { display: flex; gap: 8px; } }
</style>
