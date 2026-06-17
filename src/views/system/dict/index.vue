<template>
  <div class="page-container">
    <BaseSearch :search-items="searchItems" @search="handleSearch" @reset="handleReset" />
    <div class="table-toolbar">
      <div class="toolbar-left"><el-button type="primary" :icon="Plus" @click="handleAdd">新增字典</el-button></div>
      <div class="toolbar-right"><el-button :icon="Refresh" circle @click="loadData" /></div>
    </div>
    <BaseTable :columns="columns" :table-data="tableData" :loading="loading" :total="total" :current-page.sync="queryParams.pageNum" :page-size.sync="queryParams.pageSize" :show-index="true" @current-change="handlePageChange" @size-change="handleSizeChange">
      <template #status="{ row }"><BaseStatusTag :type="row.status === 1 ? 'success' : 'danger'">{{ row.status === 1 ? '正常' : '停用' }}</BaseStatusTag></template>
      <template #operation="{ row }"><el-button type="primary" link size="small" @click="handleEdit(row)">编辑</el-button><el-button type="danger" link size="small" @click="handleDelete(row)">删除</el-button></template>
    </BaseTable>
    <BaseDialog v-model="dialogVisible" :title="dialogTitle" width="550px" :confirm-loading="submitLoading" @confirm="handleSubmit" @cancel="cancelDialog"><BaseForm ref="formRef" v-model="formData" :form-items="formItems" :form-rules="formRules" /></BaseDialog>
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
import BaseStatusTag from '@/components/BaseStatusTag.vue'

const searchItems = [ { prop: 'dictType', label: '类型编码', type: 'input' }, { prop: 'dictLabel', label: '标签', type: 'input' } ]
const columns = [ { prop: 'dictType', label: '类型编码', width: 150 }, { prop: 'dictLabel', label: '标签', width: 140 }, { prop: 'dictValue', label: '值', width: 100 }, { prop: 'remark', label: '备注', minWidth: 180, showOverflowTooltip: true }, { prop: 'sort', label: '排序', width: 70, align: 'center' }, { prop: 'status', label: '状态', width: 80, slot: 'status' } ]
const formItems = [ { prop: 'dictType', label: '类型编码', type: 'input' }, { prop: 'dictLabel', label: '标签', type: 'input' }, { prop: 'dictValue', label: '值', type: 'input' }, { prop: 'remark', label: '备注', type: 'textarea', rows: 2 }, { prop: 'sort', label: '排序', type: 'number' }, { prop: 'status', label: '状态', type: 'radio', options: [{ value: 1, label: '正常' }, { value: 0, label: '停用' }] } ]
const formRules = { dictType: [{ required: true, message: '请输入类型编码', trigger: 'blur' }], dictLabel: [{ required: true, message: '请输入标签', trigger: 'blur' }] }

const loading = ref(false), tableData = ref([]), total = ref(0)
const dialogVisible = ref(false), dialogTitle = ref(''), submitLoading = ref(false), formRef = ref(null)
const queryParams = reactive({ pageNum: 1, pageSize: 10, dictType: '', dictLabel: '' })
const formData = reactive({ id: undefined, dictType: '', dictLabel: '', dictValue: '', remark: '', sort: 0, status: 1 })

async function loadData() { loading.value = true; try { const res = await (await import('@/utils/request')).default({ url: '/api/system/dict/list', method: 'get', params: queryParams }); tableData.value = res.data.list || []; total.value = res.data.total || 0 } finally { loading.value = false } }
function handleSearch(p) { Object.assign(queryParams, p, { pageNum: 1 }); loadData() }
function handleReset() { Object.keys(queryParams).forEach(k => { if (k !== 'pageNum' && k !== 'pageSize') queryParams[k] = '' }); loadData() }
function handlePageChange(p) { queryParams.pageNum = p; loadData() }; function handleSizeChange(s) { queryParams.pageSize = s; queryParams.pageNum = 1; loadData() }
function handleAdd() { dialogTitle.value = '新增字典'; Object.keys(formData).forEach(k => formData[k] = ''); formData.id = undefined; dialogVisible.value = true }
function handleEdit(r) { dialogTitle.value = '编辑字典'; Object.assign(formData, r); dialogVisible.value = true }
function cancelDialog() { dialogVisible.value = false; formRef.value?.resetFields() }
async function handleSubmit() { const valid = await formRef.value?.validate().catch(() => false); if (!valid) return; submitLoading.value = true; try { await new Promise(r => setTimeout(r, 500)); ElMessage.success('操作成功'); dialogVisible.value = false; loadData() } catch { ElMessage.error('操作失败') } finally { submitLoading.value = false } }
async function handleDelete(row) { await ElMessageBox.confirm('确定删除?', '提示', { type: 'warning' }); ElMessage.success('删除成功'); loadData() }
onMounted(() => loadData())
</script>

<style lang="scss" scoped>
.page-container .table-toolbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; padding: 14px 18px; background: #fff; border-radius: var(--border-radius-base); .toolbar-left { display: flex; gap: 10px; } .toolbar-right { display: flex; gap: 8px; } }
</style>
