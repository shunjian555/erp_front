<template>
  <div class="page-container">
    <BaseSearch :search-items="searchItems" @search="handleSearch" @reset="handleReset" />
    <div class="table-toolbar">
      <div class="toolbar-left"><el-button type="primary" :icon="Plus" @click="handleAdd">新增客户</el-button><el-button :icon="Download" plain>导出</el-button></div>
      <div class="toolbar-right"><el-button :icon="Refresh" circle @click="loadData" /></div>
    </div>
    <BaseTable :columns="columns" :table-data="tableData" :loading="loading" :total="total" :current-page.sync="queryParams.pageNum" :page-size.sync="queryParams.pageSize" :show-selection="true" :show-index="true" @selection-change="handleSelectionChange" @current-change="handlePageChange" @size-change="handleSizeChange">
      <template #level="{ row }"><el-tag :type="levelMap[row.level]?.type || 'info'" size="small">{{ levelMap[row.level]?.label || row.level }}</el-tag></template>
      <template #operation="{ row }"><el-button type="primary" link size="small" @click="handleEdit(row)">编辑</el-button><el-button type="danger" link size="small" @click="handleDelete(row)">删除</el-button></template>
    </BaseTable>
    <BaseDialog v-model="dialogVisible" :title="dialogTitle" width="600px" :confirm-loading="submitLoading" @confirm="handleSubmit" @cancel="cancelDialog"><BaseForm ref="formRef" v-model="formData" :form-items="formItems" :form-rules="formRules" :col-count="2" /></BaseDialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Download, Refresh } from '@element-plus/icons-vue'
import BaseSearch from '@/components/BaseSearch.vue'
import BaseTable from '@/components/BaseTable.vue'
import BaseDialog from '@/components/BaseDialog.vue'
import BaseForm from '@/components/BaseForm.vue'

const levelMap = { A: { label: 'A级', type: 'danger' }, B: { label: 'B级', type: 'warning' }, C: { label: 'C级', type: 'info' } }
const searchItems = [ { prop: 'customerName', label: '客户名称', type: 'input' }, { prop: 'contactName', label: '联系人', type: 'input' }, { prop: 'phone', label: '电话', type: 'input' } ]
const columns = [ { prop: 'customerName', label: '客户名称', width: 150 }, { prop: 'contactName', label: '联系人', width: 110 }, { prop: 'phone', label: '电话', width: 130 }, { prop: 'address', label: '地址', minWidth: 180, showOverflowTooltip: true }, { prop: 'level', label: '等级', width: 70, slot: 'level' }, { prop: 'status', label: '状态', width: 80 }, { prop: 'createTime', label: '创建时间', width: 170 } ]
const formItems = [ { prop: 'customerName', label: '客户名称', type: 'input', span: 12 }, { prop: 'contactName', label: '联系人', type: 'input', span: 12 }, { prop: 'phone', label: '电话', type: 'input', span: 12 }, { prop: 'email', label: '邮箱', type: 'input', span: 12 }, { prop: 'address', label: '地址', type: 'textarea', rows: 2, span: 24 }, { prop: 'remark', label: '备注', type: 'textarea', rows: 3, span: 24 } ]
const formRules = { customerName: [{ required: true, message: '请输入客户名称', trigger: 'blur' }], phone: [{ required: true, message: '请输入电话', trigger: 'blur' }] }

const loading = ref(false), tableData = ref([]), total = ref(0), selectedRows = ref([])
const dialogVisible = ref(false), dialogTitle = ref(''), submitLoading = ref(false), formRef = ref(null)
const queryParams = reactive({ pageNum: 1, pageSize: 10, customerName: '', contactName: '', phone: '' })
const formData = reactive({ id: undefined, customerName: '', contactName: '', phone: '', email: '', address: '', remark: '' })

async function loadData() { loading.value = true; try { const res = await (await import('@/utils/request')).default({ url: '/api/sales/customer/list', method: 'get', params: queryParams }); tableData.value = res.data.list || []; total.value = res.data.total || 0 } finally { loading.value = false } }
function handleSearch(p) { Object.assign(queryParams, p, { pageNum: 1 }); loadData() }
function handleReset() { Object.keys(queryParams).forEach(k => { if (k !== 'pageNum' && k !== 'pageSize') queryParams[k] = '' }); loadData() }
function handlePageChange(p) { queryParams.pageNum = p; loadData() }; function handleSizeChange(s) { queryParams.pageSize = s; queryParams.pageNum = 1; loadData() }
function handleSelectionChange(r) { selectedRows.value = r }
function handleAdd() { dialogTitle.value = '新增客户'; Object.keys(formData).forEach(k => formData[k] = ''); formData.id = undefined; dialogVisible.value = true }
function handleEdit(r) { dialogTitle.value = '编辑客户'; Object.assign(formData, r); dialogVisible.value = true }
function cancelDialog() { dialogVisible.value = false; formRef.value?.resetFields() }
async function handleSubmit() { const valid = await formRef.value?.validate().catch(() => false); if (!valid) return; submitLoading.value = true; try { await new Promise(r => setTimeout(r, 500)); ElMessage.success('操作成功'); dialogVisible.value = false; loadData() } catch { ElMessage.error('操作失败') } finally { submitLoading.value = false } }
async function handleDelete(row) { await ElMessageBox.confirm('确定删除?', '提示', { type: 'warning' }); ElMessage.success('删除成功'); loadData() }
onMounted(() => loadData())
</script>

<style lang="scss" scoped>
.page-container .table-toolbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; padding: 14px 18px; background: #fff; border-radius: var(--border-radius-base); .toolbar-left { display: flex; gap: 10px; } .toolbar-right { display: flex; gap: 8px; } }
</style>
