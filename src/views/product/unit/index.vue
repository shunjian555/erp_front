<template>
  <div class="page-container">
    <BaseSearch :search-items="searchItems" @search="handleSearch" @reset="handleReset" />
    <div class="table-toolbar">
      <div class="toolbar-left"><el-button type="primary" :icon="Plus" @click="handleAdd">新增单位</el-button></div>
      <div class="toolbar-right"><el-button :icon="Refresh" circle @click="loadData" /></div>
    </div>
    <BaseTable :columns="columns" :table-data="tableData" :loading="loading" :total="total" :current-page.sync="queryParams.pageNum" :page-size.sync="queryParams.pageSize" :show-index="true" @current-change="handlePageChange" @size-change="handleSizeChange">
      <template #operation="{ row }"><el-button type="primary" link size="small" @click="handleEdit(row)">编辑</el-button><el-button type="danger" link size="small" @click="handleDelete(row)">删除</el-button></template>
    </BaseTable>
    <BaseDialog v-model="dialogVisible" :title="dialogTitle" width="450px" :confirm-loading="submitLoading" @confirm="handleSubmit" @cancel="cancelDialog"><BaseForm ref="formRef" v-model="formData" :form-items="formItems" :form-rules="formRules" /></BaseDialog>
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

const searchItems = [ { prop: 'name', label: '单位名称', type: 'input' } ]
const columns = [ { prop: 'name', label: '单位名称', width: 150 }, { prop: 'code', label: '编码', width: 120 }, { prop: 'description', label: '说明', minWidth: 200 }, { prop: 'status', label: '状态', width: 90 }, { prop: 'createTime', label: '创建时间', width: 170 } ]
const formItems = [ { prop: 'name', label: '单位名称', type: 'input' }, { prop: 'code', label: '编码', type: 'input' }, { prop: 'description', label: '说明', type: 'textarea', rows: 2 } ]
const formRules = { name: [{ required: true, message: '请输入单位名称', trigger: 'blur' }], code: [{ required: true, message: '请输入编码', trigger: 'blur' }] }

const loading = ref(false), tableData = ref([]), total = ref(0)
const dialogVisible = ref(false), dialogTitle = ref(''), submitLoading = ref(false), formRef = ref(null)
const queryParams = reactive({ pageNum: 1, pageSize: 10, name: '' })
const formData = reactive({ id: undefined, name: '', code: '', description: '' })

async function loadData() {
  loading.value = true
  try {
    tableData.value = [
      { id: 1, name: '个', code: 'PC', description: '单个', status: 1, createTime: '2024-01-01 00:00:00' },
      { id: 2, name: '件', code: 'PCS', description: '一件', status: 1, createTime: '2024-01-01 00:00:00' },
      { id: 3, name: '箱', code: 'BOX', description: '一箱（24个）', status: 1, createTime: '2024-01-01 00:00:00' },
      { id: 4, name: '套', code: 'SET', description: '一套', status: 1, createTime: '2024-01-01 00:00:00' },
      { id: 5, name: 'kg', code: 'KG', description: '千克', status: 1, createTime: '2024-01-01 00:00:00' },
      { id: 6, name: '升', code: 'L', description: '升', status: 1, createTime: '2024-01-01 00:00:00' }
    ]
    total.value = 6
  } finally { loading.value = false }
}
function handleSearch(p) { Object.assign(queryParams, p, { pageNum: 1 }); loadData() }
function handleReset() { Object.keys(queryParams).forEach(k => { if (k !== 'pageNum' && k !== 'pageSize') queryParams[k] = '' }); loadData() }
function handlePageChange(p) { queryParams.pageNum = p; loadData() }; function handleSizeChange(s) { queryParams.pageSize = s; queryParams.pageNum = 1; loadData() }
function handleAdd() { dialogTitle.value = '新增单位'; Object.keys(formData).forEach(k => formData[k] = ''); formData.id = undefined; dialogVisible.value = true }
function handleEdit(r) { dialogTitle.value = '编辑单位'; Object.assign(formData, r); dialogVisible.value = true }
function cancelDialog() { dialogVisible.value = false; formRef.value?.resetFields() }
async function handleSubmit() { const valid = await formRef.value?.validate().catch(() => false); if (!valid) return; submitLoading.value = true; try { await new Promise(r => setTimeout(r, 500)); ElMessage.success('操作成功'); dialogVisible.value = false; loadData() } catch { ElMessage.error('操作失败') } finally { submitLoading.value = false } }
async function handleDelete(row) { await ElMessageBox.confirm('确定删除?', '提示', { type: 'warning' }); ElMessage.success('删除成功'); loadData() }
onMounted(() => loadData())
</script>

<style lang="scss" scoped>
.page-container .table-toolbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; padding: 14px 18px; background: #fff; border-radius: var(--border-radius-base); .toolbar-left { display: flex; gap: 10px; } .toolbar-right { display: flex; gap: 8px; } }
</style>
