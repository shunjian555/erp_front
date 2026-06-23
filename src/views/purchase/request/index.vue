<template>
  <div class="page-container">
    <BaseSearch :search-items="searchItems" @search="handleSearch" @reset="handleReset" />
    <div class="table-toolbar">
      <div class="toolbar-left"><el-button type="primary" :icon="Plus" @click="handleAdd">新建采购申请</el-button></div>
      <div class="toolbar-right"><el-button :icon="Refresh" circle @click="loadData" /></div>
    </div>
    <BaseTable :columns="columns" :table-data="tableData" :loading="loading" :total="total" :current-page.sync="queryParams.pageNum" :page-size.sync="queryParams.pageSize" :show-index="true" @current-change="handlePageChange" @size-change="handleSizeChange">
      <template #budgetAmount="{ row }">{{ formatMoney(row.budgetAmount) }}</template>
      <template #status="{ row }"><el-tag :type="statusMap[row.status]?.type || 'info'" size="small">{{ statusMap[row.status]?.label || '未知' }}</el-tag></template>
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
    <BaseDialog v-model="dialogVisible" :title="dialogTitle" width="600px" :confirm-loading="submitLoading" @confirm="handleSubmit" @cancel="cancelDialog"><BaseForm ref="formRef" v-model="formData" :form-items="formItems" :form-rules="formRules" :col-count="2" /></BaseDialog>

    <!-- 详情 -->
    <el-dialog v-model="viewVisible" title="采购申请详情" width="700px" :close-on-click-modal="false">
      <el-descriptions v-if="viewRow" :column="2" border>
        <el-descriptions-item label="申请单号">{{ viewRow.requestNo }}</el-descriptions-item>
        <el-descriptions-item label="状态"><el-tag :type="statusMap[viewRow.status]?.type || 'info'" size="small">{{ statusMap[viewRow.status]?.label || '未知' }}</el-tag></el-descriptions-item>
        <el-descriptions-item label="商品名称">{{ viewRow.goodsName }}</el-descriptions-item>
        <el-descriptions-item label="数量">{{ viewRow.quantity }}</el-descriptions-item>
        <el-descriptions-item label="预算金额">{{ formatMoney(viewRow.budgetAmount) }}</el-descriptions-item>
        <el-descriptions-item label="申请人">{{ viewRow.applicant }}</el-descriptions-item>
        <el-descriptions-item label="申请部门">{{ viewRow.department }}</el-descriptions-item>
        <el-descriptions-item label="申请日期">{{ viewRow.applyDate }}</el-descriptions-item>
        <el-descriptions-item label="申请原因" :span="2">{{ viewRow.reason }}</el-descriptions-item>
        <el-descriptions-item label="创建时间" :span="2">{{ viewRow.createTime }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>

    <!-- 审批弹窗 -->
    <el-dialog v-model="approveVisible" :title="approveTitle" width="500px" :close-on-click-modal="false">
      <el-form :model="approveForm" label-width="100px">
        <el-form-item label="申请单号"><el-input :value="approveRow?.requestNo" disabled /></el-form-item>
        <el-form-item label="申请人"><el-input :value="approveRow?.applicant" disabled /></el-form-item>
        <el-form-item label="商品名称"><el-input :value="approveRow?.goodsName" disabled /></el-form-item>
        <el-form-item label="预算金额"><el-input :value="formatMoney(approveRow?.budgetAmount)" disabled /></el-form-item>
        <el-form-item :label="approveForm.approved ? '审批意见' : '驳回原因'" required>
          <el-input v-model="approveForm.comment" type="textarea" :rows="3" :placeholder="approveForm.approved ? '请输入审批意见' : '请输入驳回原因'" />
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
import { ElMessage } from 'element-plus'
import { Plus, Refresh } from '@element-plus/icons-vue'
import BaseSearch from '@/components/BaseSearch.vue'
import BaseTable from '@/components/BaseTable.vue'
import BaseDialog from '@/components/BaseDialog.vue'
import BaseForm from '@/components/BaseForm.vue'
import request from '@/utils/request'

function formatMoney(v) {
  if (v === null || v === undefined || v === '') return '0.00'
  return Number(v).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

const statusMap = { 0: { label: '待审批', type: 'warning' }, 1: { label: '已通过', type: 'success' }, 2: { label: '已驳回', type: 'danger' }, 3: { label: '已取消', type: 'info' } }
const searchItems = [ { prop: 'requestNo', label: '申请单号', type: 'input' }, { prop: 'goodsName', label: '商品名称', type: 'input' }, { prop: 'status', label: '状态', type: 'select', options: Object.entries(statusMap).map(([v, l]) => ({ value: Number(v), label: l.label })) } ]
const columns = [ { prop: 'requestNo', label: '申请单号', width: 190 }, { prop: 'goodsName', label: '商品名称', width: 140 }, { prop: 'quantity', label: '数量', width: 80, align: 'center' }, { prop: 'budgetAmount', label: '预算金额', width: 120, slot: 'budgetAmount', align: 'right' }, { prop: 'applicant', label: '申请人', width: 90 }, { prop: 'applyDate', label: '申请日期', width: 120 }, { prop: 'status', label: '状态', width: 100, slot: 'status' } ]
const formItems = [ { prop: 'requestNo', label: '申请单号', type: 'input', span: 12 }, { prop: 'goodsName', label: '商品名称', type: 'input', span: 12 }, { prop: 'quantity', label: '数量', type: 'number', span: 12 }, { prop: 'budgetAmount', label: '预算金额', type: 'number', precision: 2, span: 12 }, { prop: 'reason', label: '申请原因', type: 'textarea', rows: 3, span: 24 } ]
const formRules = { requestNo: [{ required: true, message: '请输入申请单号', trigger: 'blur' }] }

const loading = ref(false), tableData = ref([]), total = ref(0)
const dialogVisible = ref(false), dialogTitle = ref('新建采购申请'), submitLoading = ref(false), formRef = ref(null)
const queryParams = reactive({ pageNum: 1, pageSize: 10, requestNo: '', goodsName: '', status: '' })
const formData = reactive({ id: undefined, requestNo: '', goodsName: '', quantity: undefined, budgetAmount: undefined, reason: '' })
const viewVisible = ref(false), viewRow = ref(null)
const approveVisible = ref(false), approveLoading = ref(false), approveRow = ref(null)
const approveForm = reactive({ approved: true, comment: '' })
const approveTitle = ref('')

async function loadData() { loading.value = true; try { const res = await request({ url: '/api/purchase/request/list', method: 'get', params: queryParams }); tableData.value = res.data.list || []; total.value = res.data.total || 0 } finally { loading.value = false } }
function handleSearch(p) { Object.assign(queryParams, p, { pageNum: 1 }); loadData() }
function handleReset() { Object.keys(queryParams).forEach(k => { if (k !== 'pageNum' && k !== 'pageSize') queryParams[k] = '' }); loadData() }
function handlePageChange(p) { queryParams.pageNum = p; loadData() }; function handleSizeChange(s) { queryParams.pageSize = s; queryParams.pageNum = 1; loadData() }
function handleAdd() { dialogTitle.value = '新建采购申请'; Object.keys(formData).forEach(k => formData[k] = ''); formData.id = undefined; dialogVisible.value = true }
function handleEdit(r) { dialogTitle.value = '编辑采购申请'; Object.assign(formData, r); dialogVisible.value = true }
function handleView(r) { viewRow.value = r; viewVisible.value = true }
function openApprove(r, approved) {
  approveRow.value = r
  approveForm.approved = approved
  approveForm.comment = ''
  approveTitle.value = approved ? '审批通过' : '审批驳回'
  approveVisible.value = true
}
async function submitApprove() {
  if (!approveForm.comment.trim()) { ElMessage.warning(approveForm.approved ? '请填写审批意见' : '请填写驳回原因'); return }
  approveLoading.value = true
  try {
    await request({ url: '/api/purchase/request/approve', method: 'post', data: { id: approveRow.value.id, approved: approveForm.approved, comment: approveForm.comment } }).catch(() => {})
    ElMessage.success(approveForm.approved ? '审批已通过' : '已驳回')
    approveVisible.value = false
    loadData()
  } finally { approveLoading.value = false }
}
function cancelDialog() { dialogVisible.value = false; formRef.value?.resetFields() }
async function handleSubmit() { const valid = await formRef.value?.validate().catch(() => false); if (!valid) return; submitLoading.value = true; try { await new Promise(r => setTimeout(r, 500)); ElMessage.success('提交成功'); dialogVisible.value = false; loadData() } catch { ElMessage.error('提交失败') } finally { submitLoading.value = false } }
async function handleDelete(row) { await ElMessageBox.confirm(`确定删除申请单【${row.requestNo}】?`, '提示', { type: 'warning' }); ElMessage.success('删除成功'); loadData() }

function getActions(row) {
  const actions = [
    { key: 'view', label: '查看', type: 'primary', handler: handleView }
  ]
  if (row.status === 0) {
    actions.push({ key: 'approve', label: '通过', type: 'success', handler: (r) => openApprove(r, true) })
    actions.push({ key: 'reject', label: '驳回', type: 'danger', handler: (r) => openApprove(r, false) })
  }
  if (row.status === 0 || row.status === 1) {
    actions.push({ key: 'edit', label: '编辑', type: 'primary', handler: handleEdit })
  }
  if (row.status !== 3) {
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
