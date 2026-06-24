<template>
  <div class="page-container">
    <BaseSearch :search-items="searchItems" @search="handleSearch" @reset="handleReset" />
    <div class="table-toolbar">
      <div class="toolbar-left">
        <el-button type="primary" :icon="Plus" v-permission="['crm:contact:add']" @click="handleAdd">{{ t('crm.addContact') }}</el-button>
        <el-button :icon="Delete" plain @click="handleBatchDelete">{{ t('crm.batchDelete') }}</el-button>
        <el-button :icon="Download" plain>{{ t('common.export') }}</el-button>
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
        <el-button type="primary" link size="small" @click="handleEdit(row)">{{ t('common.edit') }}</el-button>
        <el-button type="danger" link size="small" @click="handleDelete(row)">{{ t('common.delete') }}</el-button>
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
import { useI18n } from 'vue-i18n'
import BaseSearch from '@/components/BaseSearch.vue'
import BaseTable from '@/components/BaseTable.vue'
import BaseDialog from '@/components/BaseDialog.vue'
import BaseForm from '@/components/BaseForm.vue'

const { t } = useI18n()

const searchItems = [
  { prop: 'name', label: t('crm.name'), type: 'input' },
  { prop: 'phone', label: t('crm.phone'), type: 'input' },
  { prop: 'customerName', label: t('crm.belongCustomer'), type: 'input' }
]

const columns = [
  { prop: 'contactName', label: t('crm.name'), width: 120 },
  { prop: 'phone', label: t('crm.phone'), width: 130 },
  { prop: 'customerName', label: t('crm.belongCustomer'), width: 140 },
  { prop: 'position', label: t('crm.position'), width: 120 },
  { prop: 'email', label: t('crm.email'), width: 180 },
  { prop: 'createTime', label: t('crm.createTime'), width: 170 }
]

const formItems = [
  { prop: 'name', label: t('crm.name'), type: 'input', span: 12 },
  { prop: 'phone', label: t('crm.phone'), type: 'input', span: 12 },
  { prop: 'email', label: t('crm.email'), type: 'input', span: 12 },
  { prop: 'position', label: t('crm.position'), type: 'input', span: 12 },
  { prop: 'customerName', label: t('crm.belongCustomer'), type: 'input', span: 24 },
  { prop: 'remark', label: t('crm.remark'), type: 'textarea', span: 24 }
]
const formRules = { name: [{ required: true, message: t('crm.name') + ' required', trigger: 'blur' }] }

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
