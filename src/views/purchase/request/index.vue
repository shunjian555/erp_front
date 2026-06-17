<template>
  <div class="page-container">
    <BaseSearch :search-items="searchItems" @search="handleSearch" @reset="handleReset" />
    <div class="table-toolbar">
      <div class="toolbar-left"><el-button type="primary" :icon="Plus" @click="handleAdd">新建采购申请</el-button></div>
      <div class="toolbar-right"><el-button :icon="Refresh" circle @click="loadData" /></div>
    </div>
    <BaseTable :columns="columns" :table-data="tableData" :loading="loading" :total="total" :current-page.sync="queryParams.pageNum" :page-size.sync="queryParams.pageSize" :show-index="true" @current-change="handlePageChange" @size-change="handleSizeChange">
      <template #status="{ row }"><el-tag :type="statusMap[row.status]?.type || 'info'" size="small">{{ statusMap[row.status]?.label || '未知' }}</el-tag></template>
      <template #operation="{ row }"><el-button type="primary" link size="small" @click="handleView(row)">查看</el-button><el-button v-if="row.status === 0" type="primary" link size="small" @click="handleApprove(row)">审批</el-button></template>
    </BaseTable>
    <BaseDialog v-model="dialogVisible" title="新建采购申请" width="600px" :confirm-loading="submitLoading" @confirm="handleSubmit" @cancel="cancelDialog"><BaseForm ref="formRef" v-model="formData" :form-items="formItems" :form-rules="formRules" :col-count="2" /></BaseDialog>
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

const statusMap = { 0: { label: '待审批', type: 'warning' }, 1: { label: '已通过', type: 'success' }, 2: { label: '已驳回', type: 'danger' }, 3: { label: '已取消', type: 'info' } }
const searchItems = [ { prop: 'requestNo', label: '申请单号', type: 'input' }, { prop: 'goodsName', label: '商品名称', type: 'input' }, { prop: 'status', label: '状态', type: 'select', options: Object.entries(statusMap).map(([v, l]) => ({ value: Number(v), label: l.label })) } ]
const columns = [ { prop: 'requestNo', label: '申请单号', width: 190 }, { prop: 'goodsName', label: '商品名称', width: 140 }, { prop: 'quantity', label: '数量', width: 80, align: 'center' }, { prop: 'budgetAmount', label: '预算金额', width: 120 }, { prop: 'applicant', label: '申请人', width: 90 }, { prop: 'applyDate', label: '申请日期', width: 120 }, { prop: 'status', label: '状态', width: 100, slot: 'status' } ]
const formItems = [ { prop: 'requestNo', label: '申请单号', type: 'input', span: 12 }, { prop: 'goodsName', label: '商品名称', type: 'input', span: 12 }, { prop: 'quantity', label: '数量', type: 'number', span: 12 }, { prop: 'budgetAmount', label: '预算金额', type: 'number', precision: 2, span: 12 }, { prop: 'reason', label: '申请原因', type: 'textarea', rows: 3, span: 24 } ]
const formRules = { requestNo: [{ required: true, message: '请输入申请单号', trigger: 'blur' }] }

const loading = ref(false), tableData = ref([]), total = ref(0)
const dialogVisible = ref(false), submitLoading = ref(false), formRef = ref(null)
const queryParams = reactive({ pageNum: 1, pageSize: 10, requestNo: '', goodsName: '', status: '' })
const formData = reactive({ id: undefined, requestNo: '', goodsName: '', quantity: undefined, budgetAmount: undefined, reason: '' })

async function loadData() { loading.value = true; try { const res = await (await import('@/utils/request')).default({ url: '/api/purchase/request/list', method: 'get', params: queryParams }); tableData.value = res.data.list || []; total.value = res.data.total || 0 } finally { loading.value = false } }
function handleSearch(p) { Object.assign(queryParams, p, { pageNum: 1 }); loadData() }
function handleReset() { Object.keys(queryParams).forEach(k => { if (k !== 'pageNum' && k !== 'pageSize') queryParams[k] = '' }); loadData() }
function handlePageChange(p) { queryParams.pageNum = p; loadData() }; function handleSizeChange(s) { queryParams.pageSize = s; queryParams.pageNum = 1; loadData() }
function handleAdd() { Object.keys(formData).forEach(k => formData[k] = ''); formData.id = undefined; dialogVisible.value = true }
function handleView(r) { ElMessage.info(`查看: ${r.requestNo}`) }
function handleApprove(r) { ElMessage.success('审批操作'); loadData() }
function cancelDialog() { dialogVisible.value = false; formRef.value?.resetFields() }
async function handleSubmit() { const valid = await formRef.value?.validate().catch(() => false); if (!valid) return; submitLoading.value = true; try { await new Promise(r => setTimeout(r, 500)); ElMessage.success('提交成功'); dialogVisible.value = false; loadData() } catch { ElMessage.error('提交失败') } finally { submitLoading.value = false } }
onMounted(() => loadData())
</script>

<style lang="scss" scoped>
.page-container .table-toolbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; padding: 14px 18px; background: #fff; border-radius: var(--border-radius-base); .toolbar-left { display: flex; gap: 10px; } .toolbar-right { display: flex; gap: 8px; } }
</style>
