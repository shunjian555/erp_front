<template>
  <div class="page-container">
    <BaseSearch :search-items="searchItems" @search="handleSearch" @reset="handleReset" />
    <div class="table-toolbar">
      <div class="toolbar-left"><el-button type="primary" :icon="Plus" @click="handleAdd">新增库位</el-button><el-button :icon="Download" plain>导出</el-button></div>
      <div class="toolbar-right"><el-button :icon="Refresh" circle @click="loadData" /></div>
    </div>
    <BaseTable :columns="columns" :table-data="tableData" :loading="loading" :total="total" :current-page.sync="queryParams.pageNum" :page-size.sync="queryParams.pageSize" :show-selection="true" :show-index="true" @selection-change="handleSelectionChange" @current-change="handlePageChange" @size-change="handleSizeChange">
      <template #status="{ row }"><BaseStatusTag :type="row.status === 1 ? 'success' : 'info'">{{ row.status === 1 ? '可用' : '占用' }}</BaseStatusTag></template>
      <template #operation="{ row }"><el-button type="primary" link size="small" @click="handleEdit(row)">编辑</el-button><el-button type="danger" link size="small" @click="handleDelete(row)">删除</el-button></template>
    </BaseTable>
    <BaseDialog v-model="dialogVisible" title="新增库位" width="550px" :confirm-loading="submitLoading" @confirm="handleSubmit" @cancel="cancelDialog"><BaseForm ref="formRef" v-model="formData" :form-items="formItems" :form-rules="formRules" :col-count="2" /></BaseDialog>
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
import BaseStatusTag from '@/components/BaseStatusTag.vue'

const searchItems = [ { prop: 'locationCode', label: '库位编码', type: 'input' }, { prop: 'areaName', label: '所属库区', type: 'input' } ]
const columns = [ { prop: 'locationCode', label: '编码', width: 140 }, { prop: 'areaName', label: '库区', width: 120 }, { prop: 'warehouseName', label: '仓库', width: 120 }, { prop: 'rowCol', label: '行列', width: 100, align: 'center' }, { prop: 'maxWeight', label: '承重(kg)', width: 100, align: 'center' }, { prop: 'status', label: '状态', width: 80, slot: 'status' } ]
const formItems = [ { prop: 'locationCode', label: '编码', type: 'input', span: 12 }, { prop: 'areaName', label: '库区', type: 'input', span: 12 }, { prop: 'rowCol', label: '行列', type: 'input', span: 12 }, { prop: 'maxWeight', label: '承重(kg)', type: 'number', span: 12 } ]
const formRules = { locationCode: [{ required: true, message: '请输入编码', trigger: 'blur' }] }

const loading = ref(false), tableData = ref([]), total = ref(0), selectedRows = ref([])
const dialogVisible = ref(false), submitLoading = ref(false), formRef = ref(null)
const queryParams = reactive({ pageNum: 1, pageSize: 10, locationCode: '', areaName: '' })
const formData = reactive({ id: undefined, locationCode: '', areaName: '', warehouseName: '', rowCol: '', maxWeight: undefined })

async function loadData() { loading.value = true; try { const res = await (await import('@/utils/request')).default({ url: '/api/wms/location/list', method: 'get', params: queryParams }); tableData.value = res.data.list || []; total.value = res.data.total || 0 } finally { loading.value = false } }
function handleSearch(p) { Object.assign(queryParams, p, { pageNum: 1 }); loadData() }
function handleReset() { Object.keys(queryParams).forEach(k => { if (k !== 'pageNum' && k !== 'pageSize') queryParams[k] = '' }); loadData() }
function handlePageChange(p) { queryParams.pageNum = p; loadData() }; function handleSizeChange(s) { queryParams.pageSize = s; queryParams.pageNum = 1; loadData() }
function handleSelectionChange(r) { selectedRows.value = r }
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
