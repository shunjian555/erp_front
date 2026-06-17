<template>
  <div class="page-container">
    <BaseSearch :search-items="searchItems" @search="handleSearch" @reset="handleReset" />
    <div class="table-toolbar">
      <div class="toolbar-left"><el-button type="primary" :icon="Plus" @click="handleAdd">新增商机</el-button><el-button :icon="Delete" plain @click="handleBatchDelete">批量删除</el-button></div>
      <div class="toolbar-right"><el-button :icon="Refresh" circle @click="loadData" /></div>
    </div>
    <BaseTable :columns="columns" :table-data="tableData" :loading="loading" :total="total" :current-page.sync="queryParams.pageNum" :page-size.sync="queryParams.pageSize" :show-selection="true" :show-index="true" @selection-change="handleSelectionChange" @current-change="handlePageChange" @size-change="handleSizeChange">
      <template #stage="{ row }"><el-tag :type="stageMap[row.stage]?.type || 'info'" size="small">{{ stageMap[row.stage]?.label || row.stage }}</el-tag></template>
      <template #operation="{ row }"><el-button type="primary" link size="small" @click="handleEdit(row)">编辑</el-button><el-button type="danger" link size="small" @click="handleDelete(row)">删除</el-button></template>
    </BaseTable>
    <BaseDialog v-model="dialogVisible" :title="dialogTitle" width="600px" :confirm-loading="submitLoading" @confirm="handleSubmit" @cancel="cancelDialog"><BaseForm ref="formRef" v-model="formData" :form-items="formItems" :form-rules="formRules" :col-count="2" /></BaseDialog>
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

const stageMap = { 1: { label: '初步接触', type: 'info' }, 2: { label: '需求确认', type: '' }, 3: { label: '方案报价', type: 'warning' }, 4: { label: '谈判签约', type: 'success' }, 5: { label: '已成交', type: 'success' } }
const searchItems = [ { prop: 'opportunityName', label: '商机名称', type: 'input' }, { prop: 'customerName', label: '客户名称', type: 'input' }, { prop: 'stage', label: '阶段', type: 'select', options: Object.entries(stageMap).map(([v, l]) => ({ value: Number(v), label: l.label })) } ]
const columns = [ { prop: 'opportunityName', label: '商机名称', minWidth: 150 }, { prop: 'customerName', label: '客户', width: 130 }, { prop: 'expectedAmount', label: '预计金额', width: 120 }, { prop: 'stage', label: '阶段', width: 100, slot: 'stage' }, { prop: 'ownerName', label: '负责人', width: 100 }, { prop: 'createTime', label: '创建时间', width: 170 } ]
const formItems = [ { prop: 'opportunityName', label: '商机名称', type: 'input', span: 12 }, { prop: 'customerName', label: '客户名称', type: 'input', span: 12 }, { prop: 'expectedAmount', label: '预计金额', type: 'number', span: 12 }, { prop: 'stage', label: '阶段', type: 'select', span: 12, options: Object.entries(stageMap).map(([v, l]) => ({ value: Number(v), label: l.label })) }, { prop: 'remark', label: '备注', type: 'textarea', span: 24 } ]
const formRules = { opportunityName: [{ required: true, message: '请输入商机名称', trigger: 'blur' }] }

const loading = ref(false), tableData = ref([]), total = ref(0), selectedRows = ref([])
const dialogVisible = ref(false), dialogTitle = ref(''), submitLoading = ref(false), formRef = ref(null)
const queryParams = reactive({ pageNum: 1, pageSize: 10, opportunityName: '', customerName: '', stage: '' })
const formData = reactive({ id: undefined, opportunityName: '', customerName: '', expectedAmount: undefined, stage: '', remark: '' })

async function loadData() { loading.value = true; try { const res = await (await import('@/utils/request')).default({ url: '/api/crm/opportunity/list', method: 'get', params: queryParams }); tableData.value = res.data.list || []; total.value = res.data.total || 0 } finally { loading.value = false } }
function handleSearch(p) { Object.assign(queryParams, p, { pageNum: 1 }); loadData() }
function handleReset() { Object.keys(queryParams).forEach(k => { if (k !== 'pageNum' && k !== 'pageSize') queryParams[k] = '' }); loadData() }
function handlePageChange(p) { queryParams.pageNum = p; loadData() }; function handleSizeChange(s) { queryParams.pageSize = s; queryParams.pageNum = 1; loadData() }
function handleSelectionChange(r) { selectedRows.value = r }
function handleAdd() { dialogTitle.value = '新增商机'; Object.keys(formData).forEach(k => formData[k] = ''); formData.id = undefined; dialogVisible.value = true }
function handleEdit(r) { dialogTitle.value = '编辑商机'; Object.assign(formData, r); dialogVisible.value = true }
function cancelDialog() { dialogVisible.value = false; formRef.value?.resetFields() }
async function handleSubmit() { const valid = await formRef.value?.validate().catch(() => false); if (!valid) return; submitLoading.value = true; try { await new Promise(r => setTimeout(r, 500)); ElMessage.success('操作成功'); dialogVisible.value = false; loadData() } catch { ElMessage.error('操作失败') } finally { submitLoading.value = false } }
async function handleDelete(row) { await ElMessageBox.confirm('确定删除?', '提示', { type: 'warning' }); ElMessage.success('删除成功'); loadData() }
async function handleBatchDelete() { if (!selectedRows.value.length) return ElMessage.warning('请选择数据'); await ElMessageBox.confirm('确定?', '提示', { type: 'warning' }); ElMessage.success('删除成功'); loadData() }
onMounted(() => loadData())
</script>

<style lang="scss" scoped>
.page-container .table-toolbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; padding: 14px 18px; background: #fff; border-radius: var(--border-radius-base); .toolbar-left { display: flex; gap: 10px; } .toolbar-right { display: flex; gap: 8px; } }
</style>
