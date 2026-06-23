<template>
  <div class="page-container">
    <BaseSearch :search-items="searchItems" @search="handleSearch" @reset="handleReset" />
    <div class="table-toolbar">
      <div class="toolbar-left"><el-button type="primary" :icon="Plus" v-permission="['purchase:supplier:add']" @click="handleAdd">新增供应商</el-button><el-button :icon="Delete" plain @click="handleBatchDelete">批量删除</el-button><el-button :icon="Download" plain>导出</el-button></div>
      <div class="toolbar-right"><el-button :icon="Refresh" circle @click="loadData" /></div>
    </div>
    <BaseTable :columns="columns" :table-data="tableData" :loading="loading" :total="total" :current-page.sync="queryParams.pageNum" :page-size.sync="queryParams.pageSize" :show-selection="true" :show-index="true" @selection-change="handleSelectionChange" @current-change="handlePageChange" @size-change="handleSizeChange">
      <template #level="{ row }"><el-tag :type="levelMap[row.level]?.type || 'info'" size="small">{{ levelMap[row.level]?.label || row.level }}</el-tag></template>
      <template #status="{ row }"><el-tag :type="row.status === 1 ? 'success' : 'danger'" size="small">{{ row.status === 1 ? '正常' : '停用' }}</el-tag></template>
      <template #operation="{ row }">
        <el-button v-for="action in getActions(row).slice(0, 3)" :key="action.key" :type="action.type" link size="small" @click="action.handler(row)">{{ action.label }}</el-button>
        <el-dropdown v-if="getActions(row).length > 3" trigger="click" @command="(cmd) => handleCommand(cmd, row)">
          <el-button type="primary" link size="small">更多<el-icon class="el-icon--right"><ArrowDown /></el-icon></el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item v-for="action in getActions(row).slice(3)" :key="action.key" :command="action.key">{{ action.label }}</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </template>
    </BaseTable>
    <BaseDialog v-model="dialogVisible" :title="dialogTitle" width="650px" :confirm-loading="submitLoading" @confirm="handleSubmit" @cancel="cancelDialog"><BaseForm ref="formRef" v-model="formData" :form-items="formItems" :form-rules="formRules" :col-count="2" /></BaseDialog>

    <!-- 详情 -->
    <el-dialog v-model="viewVisible" title="供应商详情" width="640px" :close-on-click-modal="false">
      <el-descriptions v-if="viewRow" :column="2" border>
        <el-descriptions-item label="供应商名称">{{ viewRow.supplierName }}</el-descriptions-item>
        <el-descriptions-item label="级别"><el-tag :type="levelMap[viewRow.level]?.type || 'info'" size="small">{{ levelMap[viewRow.level]?.label || viewRow.level }}</el-tag></el-descriptions-item>
        <el-descriptions-item label="联系人">{{ viewRow.contactPerson }}</el-descriptions-item>
        <el-descriptions-item label="联系电话">{{ viewRow.phone }}</el-descriptions-item>
        <el-descriptions-item label="邮箱" :span="2">{{ viewRow.email || '—' }}</el-descriptions-item>
        <el-descriptions-item label="地址" :span="2">{{ viewRow.address || '—' }}</el-descriptions-item>
        <el-descriptions-item label="状态"><el-tag :type="viewRow.status === 1 ? 'success' : 'danger'" size="small">{{ viewRow.status === 1 ? '正常' : '停用' }}</el-tag></el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ viewRow.createTime }}</el-descriptions-item>
        <el-descriptions-item label="备注" :span="2">{{ viewRow.remark || '—' }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>
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
import request from '@/utils/request'

const levelMap = { '战略': { label: '战略', type: 'danger' }, '核心': { label: '核心', type: 'warning' }, '普通': { label: '普通', type: 'info' } }
const searchItems = [ { prop: 'supplierName', label: '供应商名称', type: 'input' }, { prop: 'contactPerson', label: '联系人', type: 'input' }, { prop: 'phone', label: '电话', type: 'input' }, { prop: 'level', label: '级别', type: 'select', options: [{ value: '战略', label: '战略' }, { value: '核心', label: '核心' }, { value: '普通', label: '普通' }] } ]
const columns = [ { prop: 'supplierName', label: '名称', width: 160 }, { prop: 'contactPerson', label: '联系人', width: 110 }, { prop: 'phone', label: '电话', width: 130 }, { prop: 'address', label: '地址', minWidth: 200, showOverflowTooltip: true }, { prop: 'level', label: '级别', width: 80, slot: 'level' }, { prop: 'status', label: '状态', width: 80, slot: 'status' }, { prop: 'createTime', label: '创建时间', width: 170 } ]
const formItems = [ { prop: 'supplierName', label: '名称', type: 'input', span: 12 }, { prop: 'contactPerson', label: '联系人', type: 'input', span: 12 }, { prop: 'phone', label: '电话', type: 'input', span: 12 }, { prop: 'email', label: '邮箱', type: 'input', span: 12 }, { prop: 'address', label: '地址', type: 'textarea', rows: 2, span: 24 }, { prop: 'level', label: '级别', type: 'select', span: 12, options: searchItems[3].options }, { prop: 'status', label: '状态', type: 'radio', span: 12, options: [{ value: 1, label: '正常' }, { value: 0, label: '停用' }] }, { prop: 'remark', label: '备注', type: 'textarea', rows: 3, span: 24 } ]
const formRules = { supplierName: [{ required: true, message: '请输入名称', trigger: 'blur' }], contactPerson: [{ required: true, message: '请输入联系人', trigger: 'blur' }], phone: [{ required: true, message: '请输入电话', trigger: 'blur' }] }

const loading = ref(false), tableData = ref([]), total = ref(0), selectedRows = ref([])
const dialogVisible = ref(false), dialogTitle = ref(''), submitLoading = ref(false), formRef = ref(null)
const queryParams = reactive({ pageNum: 1, pageSize: 10, supplierName: '', contactPerson: '', phone: '', level: '' })
const formData = reactive({ id: undefined, supplierName: '', contactPerson: '', phone: '', email: '', address: '', level: '', status: 1, remark: '' })
const viewVisible = ref(false), viewRow = ref(null)

async function loadData() { loading.value = true; try { const res = await request({ url: '/api/purchase/supplier/list', method: 'get', params: queryParams }); tableData.value = res.data.list || []; total.value = res.data.total || 0 } finally { loading.value = false } }
function handleSearch(p) { Object.assign(queryParams, p, { pageNum: 1 }); loadData() }
function handleReset() { Object.keys(queryParams).forEach(k => { if (k !== 'pageNum' && k !== 'pageSize') queryParams[k] = '' }); loadData() }
function handlePageChange(p) { queryParams.pageNum = p; loadData() }; function handleSizeChange(s) { queryParams.pageSize = s; queryParams.pageNum = 1; loadData() }
function handleSelectionChange(r) { selectedRows.value = r }
function handleAdd() { dialogTitle.value = '新增供应商'; Object.keys(formData).forEach(k => formData[k] = ''); formData.id = undefined; formData.status = 1; dialogVisible.value = true }
function handleEdit(r) { dialogTitle.value = '编辑供应商'; Object.assign(formData, r); dialogVisible.value = true }
function handleView(r) { viewRow.value = r; viewVisible.value = true }
function cancelDialog() { dialogVisible.value = false; formRef.value?.resetFields() }
async function handleSubmit() { const valid = await formRef.value?.validate().catch(() => false); if (!valid) return; submitLoading.value = true; try { await new Promise(r => setTimeout(r, 500)); ElMessage.success('操作成功'); dialogVisible.value = false; loadData() } catch { ElMessage.error('操作失败') } finally { submitLoading.value = false } }
async function handleDelete(row) { await ElMessageBox.confirm(`确定删除"${row.supplierName}"?`, '提示', { type: 'warning' }); ElMessage.success('删除成功'); loadData() }
async function handleBatchDelete() { if (!selectedRows.value.length) return ElMessage.warning('请选择数据'); await ElMessageBox.confirm(`确定删除 ${selectedRows.value.length} 条?`, '提示', { type: 'warning' }); ElMessage.success('删除成功'); loadData() }
async function handleToggleStatus(row) { const next = row.status === 1 ? 0 : 1; const action = next === 1 ? '启用' : '停用'; await ElMessageBox.confirm(`确定${action}供应商"${row.supplierName}"?`, '提示', { type: 'warning' }); ElMessage.success(`${action}成功`); loadData() }

function getActions(row) {
  return [
    { key: 'view', label: '查看', type: 'primary', handler: handleView },
    { key: 'edit', label: '编辑', type: 'primary', handler: handleEdit },
    { key: 'toggle', label: row.status === 1 ? '停用' : '启用', type: row.status === 1 ? 'warning' : 'success', handler: handleToggleStatus },
    { key: 'delete', label: '删除', type: 'danger', handler: handleDelete }
  ]
}

function handleCommand(cmd, row) {
  const action = getActions(row).find(a => a.key === cmd)
  action?.handler(row)
}
onMounted(() => loadData())
</script>

<style lang="scss" scoped>
.page-container .table-toolbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; padding: 14px 18px; background: #fff; border-radius: var(--border-radius-base); .toolbar-left { display: flex; gap: 10px; } .toolbar-right { display: flex; gap: 8px; } }
</style>
