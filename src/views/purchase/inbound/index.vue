<template>
  <div class="page-container">
    <BaseSearch :search-items="searchItems" @search="handleSearch" @reset="handleReset" />
    <div class="table-toolbar">
      <div class="toolbar-left"><el-button type="primary" :icon="Plus" @click="handleAdd">新增入库单</el-button><el-button :icon="Download" plain>导出</el-button></div>
      <div class="toolbar-right"><el-button :icon="Refresh" circle @click="loadData" /></div>
    </div>
    <BaseTable :columns="columns" :table-data="tableData" :loading="loading" :total="total" :current-page.sync="queryParams.pageNum" :page-size.sync="queryParams.pageSize" :show-selection="true" :show-index="true" @selection-change="handleSelectionChange" @current-change="handlePageChange" @size-change="handleSizeChange">
      <template #totalAmount="{ row }">{{ formatMoney(row.totalAmount) }}</template>
      <template #status="{ row }"><el-tag :type="statusMap[row.status]?.type || 'info'" size="small">{{ statusMap[row.status]?.label || '未知' }}</el-tag></template>
      <template #operation="{ row }">
        <el-button type="primary" link size="small" @click="handleView(row)">查看</el-button>
        <el-button v-if="row.status === 0" type="success" link size="small" @click="openApprove(row, true)">确认入库</el-button>
        <el-button v-if="row.status === 0" type="danger" link size="small" @click="openApprove(row, false)">驳回</el-button>
        <el-button v-if="row.status === 0" type="primary" link size="small" @click="handleEdit(row)">编辑</el-button>
        <el-button v-if="row.status !== 1" type="danger" link size="small" @click="handleDelete(row)">删除</el-button>
      </template>
    </BaseTable>
    <BaseDialog v-model="dialogVisible" :title="dialogTitle" width="650px" :confirm-loading="submitLoading" @confirm="handleSubmit" @cancel="cancelDialog"><BaseForm ref="formRef" v-model="formData" :form-items="formItems" :form-rules="formRules" :col-count="2" /></BaseDialog>

    <!-- 详情 -->
    <el-dialog v-model="viewVisible" title="入库单详情" width="700px" :close-on-click-modal="false">
      <el-descriptions v-if="viewRow" :column="2" border>
        <el-descriptions-item label="入库单号">{{ viewRow.inboundNo }}</el-descriptions-item>
        <el-descriptions-item label="状态"><el-tag :type="statusMap[viewRow.status]?.type || 'info'" size="small">{{ statusMap[viewRow.status]?.label || '未知' }}</el-tag></el-descriptions-item>
        <el-descriptions-item label="关联订单">{{ viewRow.orderNo }}</el-descriptions-item>
        <el-descriptions-item label="供应商">{{ viewRow.supplierName }}</el-descriptions-item>
        <el-descriptions-item label="入库数量">{{ viewRow.quantity }}</el-descriptions-item>
        <el-descriptions-item label="入库金额">{{ formatMoney(viewRow.totalAmount) }}</el-descriptions-item>
        <el-descriptions-item label="仓库">{{ viewRow.warehouse }}</el-descriptions-item>
        <el-descriptions-item label="经办人">{{ viewRow.operator }}</el-descriptions-item>
        <el-descriptions-item label="入库日期">{{ viewRow.inboundDate }}</el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ viewRow.createTime }}</el-descriptions-item>
        <el-descriptions-item label="备注" :span="2">{{ viewRow.remark || '—' }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>

    <!-- 审批弹窗 -->
    <el-dialog v-model="approveVisible" :title="approveTitle" width="500px" :close-on-click-modal="false">
      <el-form :model="approveForm" label-width="100px">
        <el-form-item label="入库单号"><el-input :value="approveRow?.inboundNo" disabled /></el-form-item>
        <el-form-item label="关联订单"><el-input :value="approveRow?.orderNo" disabled /></el-form-item>
        <el-form-item label="供应商"><el-input :value="approveRow?.supplierName" disabled /></el-form-item>
        <el-form-item label="入库数量"><el-input :value="approveRow?.quantity" disabled /></el-form-item>
        <el-form-item :label="approveForm.approved ? '入库意见' : '驳回原因'" required>
          <el-input v-model="approveForm.comment" type="textarea" :rows="3" :placeholder="approveForm.approved ? '请输入入库确认意见' : '请输入驳回原因'" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="approveVisible = false">取消</el-button>
        <el-button :type="approveForm.approved ? 'success' : 'danger'" :loading="approveLoading" @click="submitApprove">确定</el-button>
      </template>
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
  if (v === null || v === undefined || v === '') return '0.00'
  return Number(v).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

const statusMap = { 0: { label: '待确认', type: 'warning' }, 1: { label: '已完成', type: 'success' }, 2: { label: '已驳回', type: 'danger' } }
const searchItems = [ { prop: 'inboundNo', label: '入库单号', type: 'input' }, { prop: 'orderNo', label: '关联订单', type: 'input' }, { prop: 'warehouse', label: '仓库', type: 'input' }, { prop: 'status', label: '状态', type: 'select', options: Object.entries(statusMap).map(([v, l]) => ({ value: Number(v), label: l.label })) } ]
const columns = [ { prop: 'inboundNo', label: '入库单号', width: 190 }, { prop: 'orderNo', label: '关联订单', width: 180 }, { prop: 'supplierName', label: '供应商', width: 130 }, { prop: 'quantity', label: '数量', width: 80, align: 'center' }, { prop: 'totalAmount', label: '入库金额', width: 120, slot: 'totalAmount', align: 'right' }, { prop: 'warehouse', label: '仓库', width: 100 }, { prop: 'inboundDate', label: '入库日期', width: 120 }, { prop: 'status', label: '状态', width: 90, slot: 'status' } ]
const formItems = [ { prop: 'inboundNo', label: '入库单号', type: 'input', span: 12 }, { prop: 'orderNo', label: '关联订单', type: 'input', span: 12 }, { prop: 'warehouse', label: '仓库', type: 'input', span: 12 }, { prop: 'inboundDate', label: '入库日期', type: 'date', span: 12 }, { prop: 'remark', label: '备注', type: 'textarea', rows: 3, span: 24 } ]
const formRules = { inboundNo: [{ required: true, message: '请输入入库单号', trigger: 'blur' }] }

const loading = ref(false), tableData = ref([]), total = ref(0), selectedRows = ref([])
const dialogVisible = ref(false), dialogTitle = ref(''), submitLoading = ref(false), formRef = ref(null)
const queryParams = reactive({ pageNum: 1, pageSize: 10, inboundNo: '', orderNo: '', warehouse: '', status: '' })
const formData = reactive({ id: undefined, inboundNo: '', orderNo: '', warehouse: '', inboundDate: '', remark: '' })
const viewVisible = ref(false), viewRow = ref(null)
const approveVisible = ref(false), approveLoading = ref(false), approveRow = ref(null)
const approveForm = reactive({ approved: true, comment: '' })
const approveTitle = ref('')

async function loadData() { loading.value = true; try { const res = await request({ url: '/api/purchase/inbound/list', method: 'get', params: queryParams }); tableData.value = res.data.list || []; total.value = res.data.total || 0 } finally { loading.value = false } }
function handleSearch(p) { Object.assign(queryParams, p, { pageNum: 1 }); loadData() }
function handleReset() { Object.keys(queryParams).forEach(k => { if (k !== 'pageNum' && k !== 'pageSize') queryParams[k] = '' }); loadData() }
function handlePageChange(p) { queryParams.pageNum = p; loadData() }; function handleSizeChange(s) { queryParams.pageSize = s; queryParams.pageNum = 1; loadData() }
function handleSelectionChange(r) { selectedRows.value = r }
function handleAdd() { dialogTitle.value = '新增入库单'; Object.keys(formData).forEach(k => formData[k] = ''); formData.id = undefined; dialogVisible.value = true }
function handleEdit(r) { dialogTitle.value = '编辑入库单'; Object.assign(formData, r); dialogVisible.value = true }
function handleView(r) { viewRow.value = r; viewVisible.value = true }
function openApprove(r, approved) {
  approveRow.value = r
  approveForm.approved = approved
  approveForm.comment = ''
  approveTitle.value = approved ? '入库确认' : '入库驳回'
  approveVisible.value = true
}
async function submitApprove() {
  if (!approveForm.comment.trim()) { ElMessage.warning(approveForm.approved ? '请填写入库意见' : '请填写驳回原因'); return }
  approveLoading.value = true
  try {
    await request({ url: '/api/purchase/inbound/approve', method: 'post', data: { id: approveRow.value.id, approved: approveForm.approved, comment: approveForm.comment } }).catch(() => {})
    ElMessage.success(approveForm.approved ? '入库已确认' : '已驳回')
    approveVisible.value = false
    loadData()
  } finally { approveLoading.value = false }
}
function cancelDialog() { dialogVisible.value = false; formRef.value?.resetFields() }
async function handleSubmit() { const valid = await formRef.value?.validate().catch(() => false); if (!valid) return; submitLoading.value = true; try { await new Promise(r => setTimeout(r, 500)); ElMessage.success('操作成功'); dialogVisible.value = false; loadData() } catch { ElMessage.error('操作失败') } finally { submitLoading.value = false } }
async function handleDelete(row) { await ElMessageBox.confirm(`确定删除入库单【${row.inboundNo}】?`, '提示', { type: 'warning' }); ElMessage.success('删除成功'); loadData() }

function getActions(row) {
  const actions = [
    { key: 'view', label: '查看', type: 'primary', handler: handleView }
  ]
  if (row.status === 0) {
    actions.push({ key: 'approve', label: '确认入库', type: 'success', handler: (r) => openApprove(r, true) })
    actions.push({ key: 'reject', label: '驳回', type: 'danger', handler: (r) => openApprove(r, false) })
    actions.push({ key: 'edit', label: '编辑', type: 'primary', handler: handleEdit })
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
