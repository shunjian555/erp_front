<template>
  <div class="page-container">
    <BaseSearch :search-items="searchItems" @search="handleSearch" @reset="handleReset" />
    <div class="table-toolbar">
      <div class="toolbar-left">
        <el-button type="primary" :icon="Plus" v-permission="['crm:contact:add']" @click="handleAdd">新增联系人</el-button>
        <el-button :icon="Delete" plain @click="handleBatchDelete">批量删除</el-button>
        <el-button :icon="Download" plain>导出</el-button>
      </div>
      <div class="toolbar-right">
        <el-button :icon="Refresh" circle @click="loadData" />
      </div>
    </div>

    <BaseTable :columns="columns" :table-data="tableData" :loading="loading" :total="total"
      :current-page.sync="queryParams.pageNum" :page-size.sync="queryParams.pageSize" :show-selection="true"
      :show-index="true" @selection-change="handleSelectionChange" @current-change="handlePageChange"
      @size-change="handleSizeChange">
      <template #operation="{ row }">
        <el-button type="primary" link size="small" @click="handleEdit(row)">编辑</el-button>
        <el-button type="danger" link size="small" @click="handleDelete(row)">删除</el-button>
      </template>
    </BaseTable>

    <BaseDialog v-model="dialogVisible" :title="dialogTitle" width="600px" :confirm-loading="submitLoading"
      @confirm="handleSubmit" @cancel="cancelDialog">
      <BaseForm ref="formRef" v-model="formData" :form-items="formItems" :form-rules="formRules" :col-count="2" />
    </BaseDialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Delete, Download, Refresh } from '@element-plus/icons-vue'
import BaseSearch from '@/components/BaseSearch.vue'
import BaseTable from '@/components/BaseTable.vue'
import BaseDialog from '@/components/BaseDialog.vue'
import BaseForm from '@/components/BaseForm.vue'

const searchItems = [
  { prop: 'name', label: '姓名', type: 'input' },
  { prop: 'phone', label: '电话', type: 'input' },
  { prop: 'customerName', label: '所属客户', type: 'input' }
]

const columns = [
  { prop: 'name', label: '姓名', width: 120 },
  { prop: 'phone', label: '电话', width: 130 },
  { prop: 'customerName', label: '所属客户', width: 140 },
  { prop: 'position', label: '职位', width: 120 },
  { prop: 'email', label: '邮箱', width: 180 },
  { prop: 'createTime', label: '创建时间', width: 170 }
]

const formItems = [
  { prop: 'name', label: '姓名', type: 'input', span: 12 },
  { prop: 'phone', label: '电话', type: 'input', span: 12 },
  { prop: 'email', label: '邮箱', type: 'input', span: 12 },
  { prop: 'position', label: '职位', type: 'input', span: 12 },
  { prop: 'customerName', label: '所属客户', type: 'input', span: 24 },
  { prop: 'remark', label: '备注', type: 'textarea', span: 24 }
]
const formRules = { name: [{ required: true, message: '请输入姓名', trigger: 'blur' }] }

const loading = ref(false), tableData = ref([]), total = ref(0), selectedRows = ref([])
const dialogVisible = ref(false), dialogTitle = ref(''), submitLoading = ref(false), formRef = ref(null)
const queryParams = reactive({ pageNum: 1, pageSize: 10, name: '', phone: '', customerName: '' })
const formData = reactive({ id: undefined, name: '', phone: '', email: '', position: '', customerName: '', remark: '' })

async function loadData() {
  loading.value = true
  try {
    const res = await (await import('@/utils/request')).default({ url: '/api/crm/contact/list', method: 'get', params: queryParams })
    tableData.value = res.data.list || []
    total.value = res.data.total || 0
  } finally { loading.value = false }
}
function handleSearch(p) {
  Object.assign(queryParams, p, { pageNum: 1 }); loadData()
}
function handleReset() {
  Object.keys(queryParams).forEach(k => { if (k !== 'pageNum' && k !== 'pageSize') queryParams[k] = '' }); loadData()
}
function handlePageChange(p) {
  queryParams.pageNum = p; loadData()
}
function handleSizeChange(s) { queryParams.pageSize = s; queryParams.pageNum = 1; loadData() }
function handleSelectionChange(r) {
  selectedRows.value = r
}
function handleAdd() { dialogTitle.value = '新增联系人'; Object.keys(formData).forEach(k => formData[k] = ''); formData.id = undefined; dialogVisible.value = true }
function handleEdit(r) { dialogTitle.value = '编辑联系人'; Object.assign(formData, r); dialogVisible.value = true }
function cancelDialog() { dialogVisible.value = false; formRef.value?.resetFields() }
async function handleSubmit() {
  const valid = await formRef.value?.validate().catch(() => false); if (!valid) return
  submitLoading.value = true
  try { await new Promise(r => setTimeout(r, 500)); ElMessage.success(formData.id ? '编辑成功' : '新增成功'); dialogVisible.value = false; loadData() }
  catch { ElMessage.error('操作失败') }
  finally { submitLoading.value = false }
}
async function handleDelete(row) {
  await ElMessageBox.confirm(`确定要删除吗？`, '提示', { type: 'warning' })
  ElMessage.success('删除成功'); loadData()
}
async function handleBatchDelete() {
  if (!selectedRows.value.length) return ElMessage.warning('请选择数据')
  await ElMessageBox.confirm(`确定删除 ${selectedRows.value.length} 条?`, '提示', { type: 'warning' })
  ElMessage.success('删除成功'); loadData()
}
onMounted(() => loadData())
</script>

<style lang="scss" scoped>
.page-container .table-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding: 14px 18px;
  background: #fff;
  border-radius: var(--border-radius-base);

  .toolbar-left {
    display: flex;
    gap: 10px;
  }

  .toolbar-right {
    display: flex;
    gap: 8px;
  }
}
</style>
