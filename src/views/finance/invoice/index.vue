<template>
  <div class="page-container">
    <BaseSearch :search-items="searchItems" @search="handleSearch" @reset="handleReset" />
    <div class="table-toolbar">
      <div class="toolbar-left"><el-button type="primary" :icon="Plus" @click="handleAdd">新增发票</el-button></div>
      <div class="toolbar-right"><el-button :icon="Refresh" circle @click="loadData" /></div>
    </div>
    <BaseTable :columns="columns" :table-data="tableData" :loading="loading" :total="total" :current-page.sync="queryParams.pageNum" :page-size.sync="queryParams.pageSize" :show-index="true" @current-change="handlePageChange" @size-change="handleSizeChange">
      <template #invoiceType="{ row }"><el-tag :type="row.invoiceType === 'in' ? 'success' : 'danger'" size="small">{{ row.invoiceType === 'in' ? '进项' : '销项' }}</el-tag></template>
      <template #operation="{ row }"><el-button type="primary" link size="small" @click="handleEdit(row)">编辑</el-button><el-button type="danger" link size="small" @click="handleDelete(row)">删除</el-button></template>
    </BaseTable>
    <BaseDialog v-model="dialogVisible" title="新增发票" width="550px" :confirm-loading="submitLoading" @confirm="handleSubmit" @cancel="cancelDialog"><BaseForm ref="formRef" v-model="formData" :form-items="formItems" :form-rules="formRules" /></BaseDialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Refresh } from '@element-plus/icons-vue'
import BaseSearch from '@/components/BaseSearch.vue'
import BaseTable from '@/components/BaseTable.vue'
import BaseDialog from '@/components/BaseDialog.vue'
import BaseForm from '@/components/BaseForm.vue'

const searchItems = [ { prop: 'invoiceNo', label: '发票号码', type: 'input' }, { prop: 'invoiceType', label: '类型', type: 'select', options: [{ value: '', label: '全部' }, { value: 'in', label: '进项' }, { value: 'out', label: '销项' }] } ]
const columns = [ { prop: 'invoiceNo', label: '发票号码', width: 170 }, { prop: 'invoiceType', label: '类型', width: 80, slot: 'invoiceType' }, { prop: 'title', label: '抬头', width: 150 }, { prop: 'amount', label: '金额', width: 120 }, { prop: 'taxAmount', label: '税额', width: 100 }, { prop: 'issueDate', label: '开票日期', width: 120 }, { prop: 'status', label: '状态', width: 80 } ]
const formItems = [ { prop: 'invoiceNo', label: '发票号码', type: 'input' }, { prop: 'invoiceType', label: '类型', type: 'radio', options: [{ value: 'in', label: '进项' }, { value: 'out', label: '销项' }] }, { prop: 'title', label: '抬头', type: 'input' }, { prop: 'amount', label: '金额', type: 'number', precision: 2 }, { prop: 'taxAmount', label: '税额', type: 'number', precision: 2 } ]
const formRules = { invoiceNo: [{ required: true, message: '请输入发票号码', trigger: 'blur' }] }

const loading = ref(false), tableData = ref([]), total = ref(0)
const dialogVisible = ref(false), submitLoading = ref(false), formRef = ref(null)
const queryParams = reactive({ pageNum: 1, pageSize: 10, invoiceNo: '', invoiceType: '' })
const formData = reactive({ id: undefined, invoiceNo: '', invoiceType: 'in', title: '', amount: undefined, taxAmount: undefined })

async function loadData() { loading.value = true; try { const res = await (await import('@/utils/request')).default({ url: '/api/finance/invoice/list', method: 'get', params: queryParams }); tableData.value = res.data.list || []; total.value = res.data.total || 0 } finally { loading.value = false } }
function handleSearch(p) { Object.assign(queryParams, p, { pageNum: 1 }); loadData() }
function handleReset() { Object.keys(queryParams).forEach(k => { if (k !== 'pageNum' && k !== 'pageSize') queryParams[k] = '' }); loadData() }
function handlePageChange(p) { queryParams.pageNum = p; loadData() }; function handleSizeChange(s) { queryParams.pageSize = s; queryParams.pageNum = 1; loadData() }
function handleAdd() { Object.keys(formData).forEach(k => formData[k] = ''); formData.id = undefined; dialogVisible.value = true }
function handleEdit(r) { Object.assign(formData, r); dialogVisible.value = true }
function cancelDialog() { dialogVisible.value = false; formRef.value?.resetFields() }
async function handleSubmit() { const valid = await formRef.value?.validate().catch(() => false); if (!valid) return; submitLoading.value = true; try { await new Promise(r => setTimeout(r, 500)); ElMessage.success('操作成功'); dialogVisible.value = false; loadData() } catch { ElMessage.error('操作失败') } finally { submitLoading.value = false } }
async function handleDelete(row) { await ElMessageBox.confirm('确定删除?', '提示', { type: 'warning' }); ElMessage.success('删除成功'); loadData() }
onMounted(() => loadData())
</script>

<style lang="scss" scoped>
.page-container .table-toolbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; padding: 14px 18px; background: #fff; border-radius: var(--border-radius-base); .toolbar-left { display: flex; gap: 10px; } .toolbar-right { display: flex; gap: 8px; } }
</style>
