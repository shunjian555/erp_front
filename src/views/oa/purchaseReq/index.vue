<template>
  <div class="page-container">
    <BaseSearch :search-items="searchItems" @search="handleSearch" @reset="handleReset" />
    <div class="table-toolbar">
      <div class="toolbar-left"><el-button type="primary" :icon="Plus" @click="handleAdd">新增采购申请</el-button><el-button :icon="Delete" plain @click="handleBatchDelete">批量删除</el-button></div>
      <div class="toolbar-right"><el-button :icon="Refresh" circle @click="loadData" /></div>
    </div>
    <BaseTable :columns="columns" :table-data="tableData" :loading="loading" :total="total" :current-page.sync="queryParams.pageNum" :page-size.sync="queryParams.pageSize" :show-selection="true" :show-index="true" @selection-change="handleSelectionChange" @current-change="handlePageChange" @size-change="handleSizeChange">
      <template #status="{ row }"><BaseStatusTag :type="row.status === 1 ? 'success' : row.status === 0 ? 'warning' : 'info'">{{ ['待审核','已通过','已驳回'][row.status] || '未知' }}</BaseStatusTag></template>
      <template #operation="{ row }"><el-button type="primary" link size="small" @click="handleEdit(row)">编辑</el-button><el-button type="danger" link size="small" @click="handleDelete(row)">删除</el-button></template>
    </BaseTable>
    <BaseDialog v-model="dialogVisible" :title="dialogTitle" width="650px" :confirm-loading="submitLoading" @confirm="handleSubmit" @cancel="cancelDialog"><BaseForm ref="formRef" v-model="formData" :form-items="formItems" :form-rules="formRules" :col-count="2" /></BaseDialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Delete, Refresh } from '@element-plus/icons-vue'
import BaseSearch from '@/components/BaseSearch.vue'
import BaseTable from '@/components/BaseTable.vue'
import BaseDialog from '@/components/BaseDialog.vue'
import BaseForm from '@/components/BaseForm.vue'
import BaseStatusTag from '@/components/BaseStatusTag.vue'

const searchItems = [ { prop: 'reqNo', label: '申请单号', type: 'input' }, { prop: 'goodsName', label: '物品名称', type: 'input' } ]
const columns = [ { prop: 'reqNo', label: '申请单号', width: 180 }, { prop: 'goodsName', label: '物品名称', width: 140 }, { prop: 'quantity', label: '数量', width: 80, align: 'center' }, { prop: 'budgetAmount', label: '预算金额', width: 120 }, { prop: 'applicant', label: '申请人', width: 100 }, { prop: 'applyDate', label: '申请日期', width: 120 }, { prop: 'status', label: '状态', width: 90, slot: 'status' } ]
const formItems = [ { prop: 'reqNo', label: '申请单号', type: 'input', span: 12 }, { prop: 'goodsName', label: '物品名称', type: 'input', span: 12 }, { prop: 'quantity', label: '数量', type: 'number', span: 12 }, { prop: 'budgetAmount', label: '预算金额', type: 'number', precision: 2, span: 12 }, { prop: 'reason', label: '申请原因', type: 'textarea', rows: 3, span: 24 } ]
const formRules = { reqNo: [{ required: true, message: '请输入申请单号', trigger: 'blur' }], goodsName: [{ required: true, message: '请输入物品名称', trigger: 'blur' }] }

const loading = ref(false), tableData = ref([]), total = ref(0), selectedRows = ref([])
const dialogVisible = ref(false), dialogTitle = ref(''), submitLoading = ref(false), formRef = ref(null)
const queryParams = reactive({ pageNum: 1, pageSize: 10, reqNo: '', goodsName: '' })
const formData = reactive({ id: undefined, reqNo: '', goodsName: '', quantity: undefined, budgetAmount: undefined, reason: '' })

async function loadData() { loading.value = true; try { const res = await (await import('@/utils/request')).default({ url: '/api/oa/purchaseReq/list', method: 'get', params: queryParams }); tableData.value = res.data.list || []; total.value = res.data.total || 0 } finally { loading.value = false } }
function handleSearch(p) { Object.assign(queryParams, p, { pageNum: 1 }); loadData() }
function handleReset() { Object.keys(queryParams).forEach(k => { if (k !== 'pageNum' && k !== 'pageSize') queryParams[k] = '' }); loadData() }
function handlePageChange(p) { queryParams.pageNum = p; loadData() }; function handleSizeChange(s) { queryParams.pageSize = s; queryParams.pageNum = 1; loadData() }
function handleSelectionChange(r) { selectedRows.value = r }
function handleAdd() { dialogTitle.value = '新增采购申请'; Object.keys(formData).forEach(k => formData[k] = ''); formData.id = undefined; dialogVisible.value = true }
function handleEdit(r) { dialogTitle.value = '编辑采购申请'; Object.assign(formData, r); dialogVisible.value = true }
function cancelDialog() { dialogVisible.value = false; formRef.value?.resetFields() }
async function handleSubmit() { const valid = await formRef.value?.validate().catch(() => false); if (!valid) return; submitLoading.value = true; try { await new Promise(r => setTimeout(r, 500)); ElMessage.success('操作成功'); dialogVisible.value = false; loadData() } catch { ElMessage.error('操作失败') } finally { submitLoading.value = false } }
async function handleDelete(row) { await ElMessageBox.confirm('确定删除?', '提示', { type: 'warning' }); ElMessage.success('删除成功'); loadData() }
async function handleBatchDelete() { if (!selectedRows.value.length) return ElMessage.warning('请选择数据'); await ElMessageBox.confirm('确定?', '提示', { type: 'warning' }); ElMessage.success('删除成功'); loadData() }
onMounted(() => loadData())
</script>

<style lang="scss" scoped>
.page-container .table-toolbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; padding: 14px 18px; background: #fff; border-radius: var(--border-radius-base); .toolbar-left { display: flex; gap: 10px; } .toolbar-right { display: flex; gap: 8px; } }
</style>
