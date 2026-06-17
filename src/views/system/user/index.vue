<template>
  <div class="page-container">
    <BaseSearch :search-items="searchItems" @search="handleSearch" @reset="handleReset" />
    <div class="table-toolbar">
      <div class="toolbar-left"><el-button type="primary" :icon="Plus" @click="handleAdd">新增用户</el-button><el-button type="danger" :icon="Delete" plain @click="handleBatchDelete">批量删除</el-button></div>
      <div class="toolbar-right"><el-button :icon="Refresh" circle @click="loadData" /></div>
    </div>
    <BaseTable :columns="columns" :table-data="tableData" :loading="loading" :total="total" :current-page.sync="queryParams.pageNum" :page-size.sync="queryParams.pageSize" :show-selection="true" :show-index="true" @selection-change="handleSelectionChange" @current-change="handlePageChange" @size-change="handleSizeChange">
      <template #status="{ row }"><BaseStatusTag :type="row.status === 1 ? 'success' : 'danger'">{{ row.status === 1 ? '正常' : '禁用' }}</BaseStatusTag></template>
      <template #operation="{ row }"><el-button type="primary" link size="small" @click="handleEdit(row)">编辑</el-button><el-button type="danger" link size="small" @click="handleDelete(row)">删除</el-button><el-button type="warning" link size="small" @click="handleResetPwd(row)">重置密码</el-button></template>
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
import BaseStatusTag from '@/components/BaseStatusTag.vue'

const searchItems = [ { prop: 'username', label: '用户名', type: 'input' }, { prop: 'realName', label: '姓名', type: 'input' }, { prop: 'phone', label: '手机号', type: 'input' }, { prop: 'status', label: '状态', type: 'select', options: [{ value: '', label: '全部' }, { value: 1, label: '正常' }, { value: 0, label: '禁用' }] } ]
const columns = [ { prop: 'username', label: '用户名', width: 120 }, { prop: 'realName', label: '姓名', width: 100 }, { prop: 'phone', label: '手机号', width: 130 }, { prop: 'email', label: '邮箱', minWidth: 180, showOverflowTooltip: true }, { prop: 'roleName', label: '角色', width: 110 }, { prop: 'deptName', label: '部门', width: 120 }, { prop: 'lastLoginTime', label: '最后登录', width: 170 }, { prop: 'status', label: '状态', width: 80, slot: 'status' } ]
const formItems = [ { prop: 'username', label: '用户名', type: 'input', span: 12 }, { prop: 'realName', label: '姓名', type: 'input', span: 12 }, { prop: 'phone', label: '手机号', type: 'input', span: 12 }, { prop: 'email', label: '邮箱', type: 'input', span: 12 }, { prop: 'roleName', label: '角色', type: 'select', span: 12, options: [{ value: 'admin', label: '管理员' }, { value: 'user', label: '普通用户' }] }, { prop: 'deptName', label: '部门', type: 'select', span: 12, options: [{ value: 'tech', label: '技术部' }, { value: 'sales', label: '销售部' }] }, { prop: 'status', label: '状态', type: 'radio', span: 24, options: [{ value: 1, label: '正常' }, { value: 0, label: '禁用' }] } ]
const formRules = { username: [{ required: true, message: '请输入用户名', trigger: 'blur' }], realName: [{ required: true, message: '请输入姓名', trigger: 'blur' }], phone: [{ required: true, message: '请输入手机号', trigger: 'blur' }] }

const loading = ref(false), tableData = ref([]), total = ref(0), selectedRows = ref([])
const dialogVisible = ref(false), dialogTitle = ref(''), submitLoading = ref(false), formRef = ref(null)
const queryParams = reactive({ pageNum: 1, pageSize: 10, username: '', realName: '', phone: '', status: '' })
const formData = reactive({ id: undefined, username: '', realName: '', phone: '', email: '', roleName: '', deptName: '', status: 1 })

async function loadData() { loading.value = true; try { const res = await (await import('@/utils/request')).default({ url: '/api/system/user/list', method: 'get', params: queryParams }); tableData.value = res.data.list || []; total.value = res.data.total || 0 } finally { loading.value = false } }
function handleSearch(p) { Object.assign(queryParams, p, { pageNum: 1 }); loadData() }
function handleReset() { Object.keys(queryParams).forEach(k => { if (k !== 'pageNum' && k !== 'pageSize') queryParams[k] = '' }); loadData() }
function handlePageChange(p) { queryParams.pageNum = p; loadData() }; function handleSizeChange(s) { queryParams.pageSize = s; queryParams.pageNum = 1; loadData() }
function handleSelectionChange(r) { selectedRows.value = r }
function handleAdd() { dialogTitle.value = '新增用户'; Object.keys(formData).forEach(k => formData[k] = ''); formData.id = undefined; dialogVisible.value = true }
function handleEdit(r) { dialogTitle.value = '编辑用户'; Object.assign(formData, r); dialogVisible.value = true }
function cancelDialog() { dialogVisible.value = false; formRef.value?.resetFields() }
async function handleSubmit() { const valid = await formRef.value?.validate().catch(() => false); if (!valid) return; submitLoading.value = true; try { await new Promise(r => setTimeout(r, 500)); ElMessage.success('操作成功'); dialogVisible.value = false; loadData() } catch { ElMessage.error('操作失败') } finally { submitLoading.value = false } }
async function handleDelete(row) { await ElMessageBox.confirm(`确定删除"${row.username}"?`, '提示', { type: 'warning' }); ElMessage.success('删除成功'); loadData() }
async function handleBatchDelete() { if (!selectedRows.value.length) return ElMessage.warning('请选择数据'); await ElMessageBox.confirm(`确定删除 ${selectedRows.value.length} 条?`, '提示', { type: 'warning' }); ElMessage.success('删除成功'); loadData() }
async function handleResetPwd(row) { await ElMessageBox.confirm(`确定重置 "${row.username}" 的密码?`, '提示', { type: 'warning' }); ElMessage.success('密码已重置为默认密码') }
onMounted(() => loadData())
</script>

<style lang="scss" scoped>
.page-container .table-toolbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; padding: 14px 18px; background: #fff; border-radius: var(--border-radius-base); .toolbar-left { display: flex; gap: 10px; } .toolbar-right { display: flex; gap: 8px; } }
</style>
