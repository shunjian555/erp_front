<template>
  <div class="page-container">
    <div class="table-toolbar">
      <div class="toolbar-left"><el-button type="primary" :icon="Plus" @click="handleAdd">新增角色</el-button><el-button :icon="Download" plain>导出</el-button></div>
      <div class="toolbar-right">
        <el-button :icon="Refresh" circle @click="loadData" /></div>
    </div>
    <BaseTable :columns="columns" :table-data="tableData" :loading="loading" :total="total" :current-page.sync="queryParams.pageNum" :page-size.sync="queryParams.pageSize" :show-index="true" @current-change="handlePageChange" @size-change="handleSizeChange">
      <template #status="{ row }"><BaseStatusTag :type="row.status === 1 ? 'success' : 'danger'">{{ row.status === 1 ? '启用' : '停用' }}</BaseStatusTag></template>
      <template #operation="{ row }"><el-button type="primary" link size="small" @click="handleEdit(row)">编辑</el-button><el-button type="primary" link size="small" @click="handlePermission(row)">权限配置</el-button><el-button type="danger" link size="small" @click="handleDelete(row)">删除</el-button></template>
    </BaseTable>
    <BaseDialog v-model="dialogVisible" :title="dialogTitle" width="550px" :confirm-loading="submitLoading" @confirm="handleSubmit" @cancel="cancelDialog"><BaseForm ref="formRef" v-model="formData" :form-items="formItems" :form-rules="formRules" /></BaseDialog>
    <BaseDialog v-model="permDialogVisible" title="权限配置" width="500px" @cancel="permDialogVisible = false"><el-tree ref="treeRef" :data="permissionData" show-checkbox node-key="id" default-expand-all :props="{ children: 'children', label: 'label' }" /></BaseDialog>
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

const searchItems = [ { prop: 'roleName', label: '角色名称', type: 'input' }, { prop: 'code', label: '角色编码', type: 'input' } ]
const columns = [ { prop: 'code', label: '编码', width: 130 }, { prop: 'roleName', label: '名称', width: 150 }, { prop: 'description', label: '描述', minWidth: 200, showOverflowTooltip: true }, { prop: 'userCount', label: '用户数', width: 80, align: 'center' }, { prop: 'sort', label: '排序', width: 70, align: 'center' }, { prop: 'status', label: '状态', width: 80, slot: 'status' }, { prop: 'createTime', label: '创建时间', width: 170 } ]
const formItems = [ { prop: 'code', label: '编码', type: 'input' }, { prop: 'roleName', label: '名称', type: 'input' }, { prop: 'description', label: '描述', type: 'textarea', rows: 3 }, { prop: 'status', label: '状态', type: 'radio', options: [{ value: 1, label: '启用' }, { value: 0, label: '停用' }] } ]
const formRules = { code: [{ required: true, message: '请输入编码', trigger: 'blur' }], roleName: [{ required: true, message: '请输入名称', trigger: 'blur' }] }

const permissionData = [
  { id: 1, label: '系统管理', children: [
    { id: 11, label: '用户管理' }, { id: 12, label: '角色管理' }, { id: 13, label: '菜单管理' }, { id: 14, label: '字典管理' }
  ]},
  { id: 2, label: '业务管理', children: [
    { id: 21, label: '客户管理' }, { id: 22, label: '供应商管理' }, { id: 23, label: '订单管理' }
  ]},
  { id: 3, label: '报表中心', children: [
    { id: 31, label: '销售报表' }, { id: 32, label: '采购报表' }, { id: 33, label: '库存报表' }
  ]}
]

const loading = ref(false), tableData = ref([]), total = ref(0)
const dialogVisible = ref(false), dialogTitle = ref(''), submitLoading = ref(false), formRef = ref(null)
const permDialogVisible = ref(false), treeRef = ref(null)
const queryParams = reactive({ pageNum: 1, pageSize: 10, roleName: '', code: '' })
const formData = reactive({ id: undefined, code: '', roleName: '', description: '', status: 1 })

async function loadData() { loading.value = true; try { const res = await (await import('@/utils/request')).default({ url: '/api/system/role/list', method: 'get', params: queryParams }); tableData.value = res.data.list || []; total.value = res.data.total || 0 } finally { loading.value = false } }
function handleSearch(p) { Object.assign(queryParams, p, { pageNum: 1 }); loadData() }
function handleReset() { Object.keys(queryParams).forEach(k => { if (k !== 'pageNum' && k !== 'pageSize') queryParams[k] = '' }); loadData() }
function handlePageChange(p) { queryParams.pageNum = p; loadData() }; function handleSizeChange(s) { queryParams.pageSize = s; queryParams.pageNum = 1; loadData() }
function handleAdd() { dialogTitle.value = '新增角色'; Object.keys(formData).forEach(k => formData[k] = ''); formData.id = undefined; dialogVisible.value = true }
function handleEdit(r) { dialogTitle.value = '编辑角色'; Object.assign(formData, r); dialogVisible.value = true }
function handlePermission(row) { permDialogVisible.value = true; setTimeout(() => treeRef.value?.setCheckedKeys([11, 13, 21, 31]), 200) }
function cancelDialog() { dialogVisible.value = false; formRef.value?.resetFields() }
async function handleSubmit() { const valid = await formRef.value?.validate().catch(() => false); if (!valid) return; submitLoading.value = true; try { await new Promise(r => setTimeout(r, 500)); ElMessage.success('操作成功'); dialogVisible.value = false; loadData() } catch { ElMessage.error('操作失败') } finally { submitLoading.value = false } }
async function handleDelete(row) { await ElMessageBox.confirm('确定删除?', '提示', { type: 'warning' }); ElMessage.success('删除成功'); loadData() }
onMounted(() => loadData())
</script>

<style lang="scss" scoped>
.page-container .table-toolbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; padding: 14px 18px; background: #fff; border-radius: var(--border-radius-base); .toolbar-left { display: flex; gap: 10px; } .toolbar-right { display: flex; gap: 8px; } }
</style>
