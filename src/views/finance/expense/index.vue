<template>
  <div class="page-container">
    <BaseSearch :search-items="searchItems" @search="handleSearch" @reset="handleReset" />
    <div class="table-toolbar">
      <div class="toolbar-left"><el-button type="primary" :icon="Plus" @click="handleAdd">新增费用</el-button></div>
      <div class="toolbar-right"><el-button :icon="Refresh" circle @click="loadData" /></div>
    </div>
    <BaseTable :columns="columns" :table-data="tableData" :loading="loading" :total="total" :current-page.sync="queryParams.pageNum" :page-size.sync="queryParams.pageSize" :show-index="true" @current-change="handlePageChange" @size-change="handleSizeChange">
      <template #status="{ row }"><BaseStatusTag :type="row.status === 1 ? 'success' : 'warning'">{{ row.status === 1 ? '已报销' : '待报销' }}</BaseStatusTag></template>
      <template #operation="{ row }"><el-button type="primary" link size="small" @click="handleEdit(row)">编辑</el-button><el-button type="danger" link size="small" @click="handleDelete(row)">删除</el-button></template>
    </BaseTable>
    <BaseDialog v-model="dialogVisible" title="新增费用" width="550px" :confirm-loading="submitLoading" @confirm="handleSubmit" @cancel="cancelDialog"><BaseForm ref="formRef" v-model="formData" :form-items="formItems" :form-rules="formRules" /></BaseDialog>
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

const searchItems = [ { prop: 'expenseNo', label: '费用单号', type: 'input' }, { prop: 'category', label: '费用类别', type: 'select', options: [{ value: '', label: '全部' }, { value: 'travel', label: '差旅费' }, { value: 'office', label: '办公费' }, { value: 'entertainment', label: '招待费' }] } ]
const columns = [ { prop: 'expenseNo', label: '费用单号', width: 190 }, { prop: 'category', label: '类别', width: 100 }, { prop: 'description', label: '说明', minWidth: 180, showOverflowTooltip: true }, { prop: 'amount', label: '金额', width: 120 }, { prop: 'applicant', label: '申请人', width: 90 }, { prop: 'applyDate', label: '日期', width: 120 }, { prop: 'status', label: '状态', width: 90, slot: 'status' } ]
const formItems = [ { prop: 'expenseNo', label: '费用单号', type: 'input' }, { prop: 'category', label: '类别', type: 'select', options: searchItems[1].options.filter(o => o.value) }, { prop: 'amount', label: '金额', type: 'number', precision: 2 }, { prop: 'description', label: '说明', type: 'textarea', rows: 3 } ]
const formRules = { expenseNo: [{ required: true, message: '请输入费用单号', trigger: 'blur' }] }

const loading = ref(false), tableData = ref([]), total = ref(0)
const dialogVisible = ref(false), submitLoading = ref(false), formRef = ref(null)
const queryParams = reactive({ pageNum: 1, pageSize: 10, expenseNo: '', category: '' })
const formData = reactive({ id: undefined, expenseNo: '', category: '', amount: undefined, description: '' })

async function loadData() { loading.value = true; try { const res = await (await import('@/utils/request')).default({ url: '/api/finance/expense/list', method: 'get', params: queryParams }); tableData.value = res.data.list || []; total.value = res.data.total || 0 } finally { loading.value = false } }
function handleSearch(p) { Object.assign(queryParams, p, { pageNum: 1 }); loadData() }
function handleReset() { Object.keys(queryParams).forEach(k => { if (k !== 'pageNum' && k !== 'pageSize') queryParams[k] = '' }); loadData() }
function handlePageChange(p) { queryParams.pageNum = p; loadData() }; function handleSizeChange(s) { queryParams.pageSize = s; queryParams.pageNum = 1; loadData() }
function handleAdd() { Object.keys(formData).forEach(k => formData[k] = ''); formData.id = undefined; dialogVisible.value = true }
function handleEdit(r) { Object.assign(formData, r); dialogVisible.value = true }
function cancelDialog() { dialogVisible.value = false; formRef.value?.resetFields() }
async function handleSubmit() { const valid = await formRef.value?.validate().catch(() => false); if (!valid) return; submitLoading.value = true; try { await new Promise(r => setTimeout(r, 500)); ElMessage.success('提交成功'); dialogVisible.value = false; loadData() } catch { ElMessage.error('提交失败') } finally { submitLoading.value = false } }
async function handleDelete(row) { await ElMessageBox.confirm('确定删除?', '提示', { type: 'warning' }); ElMessage.success('删除成功'); loadData() }
onMounted(() => loadData())
</script>

<style lang="scss" scoped>
.page-container .table-toolbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; padding: 14px 18px; background: #fff; border-radius: var(--border-radius-base); .toolbar-left { display: flex; gap: 10px; } .toolbar-right { display: flex; gap: 8px; } }
</style>
