<template>
  <div class="page-container">
    <BaseSearch :search-items="searchItems" @search="handleSearch" @reset="handleReset" />
    <div class="table-toolbar">
      <div class="toolbar-left"><el-button type="primary" :icon="Plus" @click="handleAdd">新增出库单</el-button></div>
      <div class="toolbar-right"><el-button :icon="Refresh" circle @click="loadData" /></div>
    </div>
    <BaseTable :columns="columns" :table-data="tableData" :loading="loading" :total="total" :current-page.sync="queryParams.pageNum" :page-size.sync="queryParams.pageSize" :show-index="true" @current-change="handlePageChange" @size-change="handleSizeChange">
      <template #status="{ row }"><BaseStatusTag :type="row.status === 1 ? 'success' : 'warning'">{{ row.status === 1 ? '已出库' : '待出库' }}</BaseStatusTag></template>
      <template #operation="{ row }"><el-button type="primary" link size="small" @click="handleView(row)">查看</el-button></template>
    </BaseTable>
    <BaseDialog v-model="dialogVisible" title="新增出库单" width="600px" :confirm-loading="submitLoading" @confirm="handleSubmit" @cancel="cancelDialog"><BaseForm ref="formRef" v-model="formData" :form-items="formItems" :form-rules="formRules" :col-count="2" /></BaseDialog>

    <!-- 详情 -->
    <el-dialog v-model="viewVisible" title="出库单详情" width="640px" :close-on-click-modal="false">
      <el-descriptions v-if="viewRow" :column="2" border>
        <el-descriptions-item label="出库单号">{{ viewRow.outboundNo }}</el-descriptions-item>
        <el-descriptions-item label="关联订单">{{ viewRow.orderNo }}</el-descriptions-item>
        <el-descriptions-item label="客户">{{ viewRow.customerName }}</el-descriptions-item>
        <el-descriptions-item label="数量">{{ viewRow.quantity }}</el-descriptions-item>
        <el-descriptions-item label="出库日期">{{ viewRow.outboundDate }}</el-descriptions-item>
        <el-descriptions-item label="状态"><BaseStatusTag :type="viewRow.status === 1 ? 'success' : 'warning'">{{ viewRow.status === 1 ? '已出库' : '待出库' }}</BaseStatusTag></el-descriptions-item>
        <el-descriptions-item label="创建时间" :span="2">{{ viewRow.createTime }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Plus, Refresh } from '@element-plus/icons-vue'
import BaseSearch from '@/components/BaseSearch.vue'
import BaseTable from '@/components/BaseTable.vue'
import BaseDialog from '@/components/BaseDialog.vue'
import BaseForm from '@/components/BaseForm.vue'
import BaseStatusTag from '@/components/BaseStatusTag.vue'
import request from '@/utils/request'

const searchItems = [ { prop: 'outboundNo', label: '出库单号', type: 'input' }, { prop: 'orderNo', label: '关联订单', type: 'input' } ]
const columns = [ { prop: 'outboundNo', label: '出库单号', width: 190 }, { prop: 'orderNo', label: '关联订单', width: 180 }, { prop: 'customerName', label: '客户', width: 120 }, { prop: 'quantity', label: '数量', width: 80, align: 'center' }, { prop: 'outboundDate', label: '出库日期', width: 120 }, { prop: 'status', label: '状态', width: 90, slot: 'status' } ]
const formItems = [ { prop: 'outboundNo', label: '出库单号', type: 'input', span: 12 }, { prop: 'orderNo', label: '关联订单', type: 'input', span: 12 }, { prop: 'customerName', label: '客户', type: 'input', span: 12 }, { prop: 'outboundDate', label: '出库日期', type: 'date', span: 12 }, { prop: 'remark', label: '备注', type: 'textarea', rows: 3, span: 24 } ]
const formRules = { outboundNo: [{ required: true, message: '请输入出库单号', trigger: 'blur' }] }

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
async function handleSubmit() { const valid = await formRef.value?.validate().catch(() => false); if (!valid) return; submitLoading.value = true; try { await new Promise(r => setTimeout(r, 500)); ElMessage.success('提交成功'); dialogVisible.value = false; loadData() } catch { ElMessage.error('提交失败') } finally { submitLoading.value = false } }
onMounted(() => loadData())
</script>

<style lang="scss" scoped>
.page-container .table-toolbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; padding: 14px 18px; background: #fff; border-radius: var(--border-radius-base); .toolbar-left { display: flex; gap: 10px; } .toolbar-right { display: flex; gap: 8px; } }
</style>
