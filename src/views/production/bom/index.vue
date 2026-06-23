<template>
  <div class="page-container">
    <BaseSearch :search-items="searchItems" @search="handleSearch" @reset="handleReset" />
    <div class="table-toolbar">
      <div class="toolbar-left"><el-button type="primary" :icon="Plus" @click="handleAdd">新增BOM</el-button><el-button :icon="Download" plain>导出</el-button></div>
      <div class="toolbar-right"><el-button :icon="Refresh" circle @click="loadData" /></div>
    </div>
    <BaseTable :columns="columns" :table-data="tableData" :loading="loading" :total="total" :current-page.sync="queryParams.pageNum" :page-size.sync="queryParams.pageSize" :show-index="true" @current-change="handlePageChange" @size-change="handleSizeChange">
      <template #isMain="{ row }"><el-tag :type="row.isMain ? 'success' : 'info'" size="small">{{ row.isMain ? '主BOM' : '替代' }}</el-tag></template>
      <template #status="{ row }"><el-tag :type="statusMap[row.status]?.type || 'info'" size="small">{{ statusMap[row.status]?.label || '未知' }}</el-tag></template>
      <template #cost="{ row }">{{ formatMoney(row.cost) }}</template>
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

    <el-dialog v-model="viewVisible" title="BOM详情" width="720px" :close-on-click-modal="false">
      <el-descriptions v-if="viewRow" :column="2" border>
        <el-descriptions-item label="BOM编号">{{ viewRow.bomNo }}</el-descriptions-item>
        <el-descriptions-item label="版本">{{ viewRow.version }}</el-descriptions-item>
        <el-descriptions-item label="产品编码">{{ viewRow.productCode }}</el-descriptions-item>
        <el-descriptions-item label="产品名称">{{ viewRow.productName }}</el-descriptions-item>
        <el-descriptions-item label="层级">{{ viewRow.level }}</el-descriptions-item>
        <el-descriptions-item label="类型"><el-tag :type="viewRow.isMain ? 'success' : 'info'" size="small">{{ viewRow.isMain ? '主BOM' : '替代' }}</el-tag></el-descriptions-item>
        <el-descriptions-item label="状态"><el-tag :type="statusMap[viewRow.status]?.type || 'info'" size="small">{{ statusMap[viewRow.status]?.label || '未知' }}</el-tag></el-descriptions-item>
        <el-descriptions-item label="单位">{{ viewRow.productUnit }}</el-descriptions-item>
        <el-descriptions-item label="总用量">{{ viewRow.totalQty }}</el-descriptions-item>
        <el-descriptions-item label="单位成本">{{ formatMoney(viewRow.cost) }}</el-descriptions-item>
        <el-descriptions-item label="生效日期">{{ viewRow.effectiveDate }}</el-descriptions-item>
        <el-descriptions-item label="创建人">{{ viewRow.createBy }}</el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ viewRow.createTime }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Download, Refresh, ArrowDown } from '@element-plus/icons-vue'
import BaseSearch from '@/components/BaseSearch.vue'
import BaseTable from '@/components/BaseTable.vue'
import BaseDialog from '@/components/BaseDialog.vue'
import BaseForm from '@/components/BaseForm.vue'
import request from '@/utils/request'

function formatMoney(v) {
  if (v == null || v === '') return '0.00'
  return Number(v).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

const statusMap = { 0: { label: '草稿', type: 'info' }, 1: { label: '已生效', type: 'success' }, 2: { label: '已失效', type: 'warning' } }
const searchItems = [
  { prop: 'bomNo', label: 'BOM编号', type: 'input' },
  { prop: 'productName', label: '产品名称', type: 'input' },
  { prop: 'status', label: '状态', type: 'select', options: Object.entries(statusMap).map(([v, l]) => ({ value: Number(v), label: l.label })) }
]
const columns = [
  { prop: 'bomNo', label: 'BOM编号', width: 180 },
  { prop: 'productName', label: '产品名称', minWidth: 160 },
  { prop: 'version', label: '版本', width: 80 },
  { prop: 'level', label: '层级', width: 70, align: 'center' },
  { prop: 'isMain', label: '类型', width: 90, slot: 'isMain' },
  { prop: 'totalQty', label: '总用量', width: 90, align: 'right' },
  { prop: 'cost', label: '单位成本', width: 110, slot: 'cost', align: 'right' },
  { prop: 'status', label: '状态', width: 100, slot: 'status' },
  { prop: 'effectiveDate', label: '生效日期', width: 120 },
  { prop: 'createBy', label: '创建人', width: 90 }
]
const formItems = [
  { prop: 'bomNo', label: 'BOM编号', type: 'input' },
  { prop: 'productCode', label: '产品编码', type: 'input' },
  { prop: 'productName', label: '产品名称', type: 'input' },
  { prop: 'version', label: '版本', type: 'input' },
  { prop: 'level', label: '层级', type: 'number' },
  { prop: 'productUnit', label: '单位', type: 'select', options: [{ label: '个', value: '个' }, { label: '件', value: '件' }, { label: '套', value: '套' }, { label: '台', value: '台' }] },
  { prop: 'effectiveDate', label: '生效日期', type: 'date' },
  { prop: 'remark', label: '备注', type: 'textarea', rows: 3, span: 24 }
]
const formRules = {
  bomNo: [{ required: true, message: '请输入BOM编号', trigger: 'blur' }],
  productName: [{ required: true, message: '请输入产品名称', trigger: 'blur' }]
}

const loading = ref(false), tableData = ref([]), total = ref(0)
const dialogVisible = ref(false), dialogTitle = ref(''), submitLoading = ref(false), formRef = ref(null)
const queryParams = reactive({ pageNum: 1, pageSize: 10, bomNo: '', productName: '', status: '' })
const formData = reactive({ id: undefined, bomNo: '', productCode: '', productName: '', version: 'V1.0', level: 0, productUnit: '套', effectiveDate: '', remark: '' })
const viewVisible = ref(false), viewRow = ref(null)

async function loadData() { loading.value = true; try { const res = await request({ url: '/api/production/bom/list', method: 'get', params: queryParams }); tableData.value = res.data.list || []; total.value = res.data.total || 0 } finally { loading.value = false } }
function handleSearch(p) { Object.assign(queryParams, p, { pageNum: 1 }); loadData() }
function handleReset() { Object.keys(queryParams).forEach(k => { if (k !== 'pageNum' && k !== 'pageSize') queryParams[k] = '' }); loadData() }
function handlePageChange(p) { queryParams.pageNum = p; loadData() }
function handleSizeChange(s) { queryParams.pageSize = s; queryParams.pageNum = 1; loadData() }
function handleAdd() { dialogTitle.value = '新增BOM'; Object.keys(formData).forEach(k => formData[k] = ''); formData.version = 'V1.0'; formData.id = undefined; dialogVisible.value = true }
function handleView(r) { viewRow.value = r; viewVisible.value = true }
function handleEdit(r) { dialogTitle.value = '编辑BOM'; Object.assign(formData, r); dialogVisible.value = true }
function cancelDialog() { dialogVisible.value = false; formRef.value?.resetFields() }
async function handleSubmit() { const valid = await formRef.value?.validate().catch(() => false); if (!valid) return; submitLoading.value = true; try { await new Promise(r => setTimeout(r, 500)); ElMessage.success('保存成功'); dialogVisible.value = false; loadData() } catch { ElMessage.error('保存失败') } finally { submitLoading.value = false } }
async function handleDelete(row) { await ElMessageBox.confirm(`确定删除BOM【${row.bomNo}】?`, '提示', { type: 'warning' }); ElMessage.success('删除成功'); loadData() }
async function handleEnable(row) { await ElMessageBox.confirm(`确定启用BOM【${row.bomNo}】?`, '提示', { type: 'warning' }); ElMessage.success('启用成功'); loadData() }
async function handleDisable(row) { await ElMessageBox.confirm(`确定停用BOM【${row.bomNo}】?`, '提示', { type: 'warning' }); ElMessage.success('已停用'); loadData() }

function getActions(row) {
  const actions = [{ key: 'view', label: '查看', type: 'primary', handler: handleView }]
  if (row.status === 0) {
    actions.push({ key: 'edit', label: '编辑', type: 'primary', handler: handleEdit })
    actions.push({ key: 'enable', label: '启用', type: 'success', handler: handleEnable })
  }
  if (row.status === 1) {
    actions.push({ key: 'disable', label: '停用', type: 'warning', handler: handleDisable })
  }
  if (row.status !== 1) {
    actions.push({ key: 'delete', label: '删除', type: 'danger', handler: handleDelete })
  }
  return actions
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
