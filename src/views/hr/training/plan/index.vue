<template>
  <div class="page-container">
    <BaseSearch :search-items="searchItems" @search="handleSearch" @reset="handleReset" />
    <div class="table-toolbar">
      <div class="toolbar-left">
        <el-button type="primary" :icon="Plus" @click="handleAdd">制定计划</el-button>
        <el-button type="success" :icon="Check" plain @click="handleBatchApprove">批量审批</el-button>
        <el-button type="warning" :icon="DocumentCopy" plain @click="handleCopyPlan">复制计划</el-button>
        <el-button type="danger" :icon="Delete" plain @click="handleBatchDelete">批量删除</el-button>
      </div>
      <div class="toolbar-right">
        <el-button :icon="Refresh" circle @click="loadData" />
      </div>
    </div>
    <BaseTable
      ref="tableRef"
      :columns="columns"
      :table-data="tableData"
      :loading="loading"
      :total="total"
      :current-page.sync="queryParams.pageNum"
      :page-size.sync="queryParams.pageSize"
      :show-selection="true"
      :show-index="true"
      @selection-change="handleSelectionChange"
      @current-change="handlePageChange"
      @size-change="handleSizeChange"
    >
      <template #budget="{ row }">
        <span style="color: var(--el-color-primary); font-weight: 600">¥{{ Number(row.budget).toLocaleString() }}</span>
      </template>
      <template #actualCost="{ row }">
        <span :style="{ color: Number(row.actualCost) > Number(row.budget) ? '#F56C6C' : '#67C23A', fontWeight: 600 }">¥{{ Number(row.actualCost).toLocaleString() }}</span>
      </template>
      <template #status="{ row }">
        <el-tag :type="planStatusMap[row.status]?.type || 'info'" size="small" effect="dark">{{ row.status }}</el-tag>
      </template>
      <template #operation="{ row }">
        <MoreActions :items="rowActions(row)" :max="3" />
      </template>
    </BaseTable>

    <BaseDialog v-model="dialogVisible" :title="dialogTitle" width="640px" :confirm-loading="submitLoading" @confirm="handleSubmit" @cancel="cancelDialog">
      <BaseForm ref="formRef" v-model="formData" :form-items="formItems" :form-rules="formRules" :col-count="2" />
    </BaseDialog>

    <el-drawer v-model="drawerVisible" direction="rtl" size="560px">
      <template #header><span class="drawer-title">培训计划详情</span></template>
      <div v-if="currentRow" class="drawer-body">
        <el-descriptions :column="2" border size="small">
          <el-descriptions-item label="计划名称" :span="2">{{ currentRow.planName }}</el-descriptions-item>
          <el-descriptions-item label="目标部门">{{ currentRow.targetDept }}</el-descriptions-item>
          <el-descriptions-item label="创建人">{{ currentRow.creator }}</el-descriptions-item>
          <el-descriptions-item label="开始日期">{{ currentRow.startDate }}</el-descriptions-item>
          <el-descriptions-item label="结束日期">{{ currentRow.endDate }}</el-descriptions-item>
          <el-descriptions-item label="预算金额">¥{{ Number(currentRow.budget).toLocaleString() }}</el-descriptions-item>
          <el-descriptions-item label="实际花费">¥{{ Number(currentRow.actualCost).toLocaleString() }}</el-descriptions-item>
          <el-descriptions-item label="状态" :span="2"><el-tag :type="planStatusMap[currentRow.status]?.type || 'info'" size="small">{{ currentRow.status }}</el-tag></el-descriptions-item>
          <el-descriptions-item label="包含课程" :span="2">{{ currentRow.courseNames || '-' }}</el-descriptions-item>
        </el-descriptions>
        <div class="drawer-actions">
          <el-button type="primary" @click="handleExecute(currentRow)" v-if="currentRow.status === '计划中'">执行计划</el-button>
          <el-button type="success" @click="handleRecord(currentRow)">查看培训记录</el-button>
          <el-button type="warning" @click="handleEdit(currentRow)">编辑计划</el-button>
        </div>
      </div>
    </el-drawer>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Delete, Refresh, Check, DocumentCopy } from '@element-plus/icons-vue'
import BaseSearch from '@/components/BaseSearch.vue'
import BaseTable from '@/components/BaseTable.vue'
import BaseDialog from '@/components/BaseDialog.vue'
import BaseForm from '@/components/BaseForm.vue'
import MoreActions from '@/components/MoreActions.vue'

// 每行操作按钮配置
function rowActions(row) {
  return [
    { label: '查看', type: 'primary', important: true, onClick: () => handleView(row) },
    { label: '编辑', type: 'primary', important: true, onClick: () => handleEdit(row) },
    { label: '执行', type: 'success', important: true, hidden: row.status !== '计划中', onClick: () => handleExecute(row) },
    { label: '培训记录', type: 'primary', onClick: () => handleRecord(row) },
    { label: '调整预算', type: 'warning', onClick: () => handleAdjustBudget(row) },
    { label: '取消', type: 'danger', onClick: () => handleCancelWithConfirm(row) }
  ]
}
function handleCancelWithConfirm(row) {
  ElMessageBox.confirm('确定取消该培训计划？', '提示', { type: 'warning' })
    .then(() => handleCancel(row))
    .catch(() => {})
}
import { getTrainingPlanList } from '@/api/hr'

const searchItems = [
  { prop: 'planName', label: '计划名称', type: 'input' },
  { prop: 'targetDept', label: '目标部门', type: 'select', options: [
    { value: '', label: '全部' }, { value: '技术部', label: '技术部' }, { value: '销售部', label: '销售部' },
    { value: '全体员工', label: '全体员工' }, { value: '管理层', label: '管理层' }, { value: '新员工', label: '新员工' }
  ]},
  { prop: 'status', label: '状态', type: 'select', options: [
    { value: '', label: '全部' }, { value: '计划中', label: '计划中' }, { value: '执行中', label: '执行中' },
    { value: '已完成', label: '已完成' }, { value: '已取消', label: '已取消' }
  ]}
]

const columns = [
  { prop: 'planName', label: '计划名称', minWidth: 200, align: 'left' },
  { prop: 'targetDept', label: '目标部门', width: 110 },
  { prop: 'startDate', label: '开始日期', width: 110 },
  { prop: 'endDate', label: '结束日期', width: 110 },
  { prop: 'budget', label: '预算', width: 110, align: 'right', slot: 'budget' },
  { prop: 'actualCost', label: '实际花费', width: 110, align: 'right', slot: 'actualCost' },
  { prop: 'creator', label: '创建人', width: 90 },
  { prop: 'status', label: '状态', width: 90, slot: 'status' }
]

const formItems = [
  { prop: 'planName', label: '计划名称 *', type: 'input', span: 24 },
  { prop: 'targetDept', label: '目标部门 *', type: 'select', span: 12, options: [
    { value: '技术部', label: '技术部' }, { value: '销售部', label: '销售部' }, { value: '全体员工', label: '全体员工' },
    { value: '管理层', label: '管理层' }, { value: '新员工', label: '新员工' }
  ]},
  { prop: 'startDate', label: '开始日期 *', type: 'date', span: 12 },
  { prop: 'endDate', label: '结束日期 *', type: 'date', span: 12 },
  { prop: 'budget', label: '预算金额(元) *', type: 'number', min: 0, precision: 0, span: 12 },
  { prop: 'description', label: '计划说明', type: 'textarea', rows: 3, span: 24 }
]
const formRules = {
  planName: [{ required: true, message: '请输入计划名称', trigger: 'blur' }],
  targetDept: [{ required: true, message: '请选择目标部门', trigger: 'change' }],
  startDate: [{ required: true, message: '请选择开始日期', trigger: 'change' }],
  endDate: [{ required: true, message: '请选择结束日期', trigger: 'change' }],
  budget: [{ required: true, message: '请输入预算金额', trigger: 'blur' }]
}

const planStatusMap = { '计划中': { type: 'info' }, '执行中': { type: 'primary' }, '已完成': { type: 'success' }, '已取消': { type: 'danger' } }

const loading = ref(false), tableData = ref([]), total = ref(0), selectedRows = ref([])
const dialogVisible = ref(false), dialogTitle = ref('制定培训计划'), submitLoading = ref(false), formRef = ref(null)
const drawerVisible = ref(false), currentRow = ref(null)
const queryParams = reactive({ pageNum: 1, pageSize: 10, planName: '', targetDept: '', status: '' })
const formData = reactive({ id: undefined, planName: '', targetDept: '', startDate: '', endDate: '', budget: undefined, description: '' })

async function loadData() {
  loading.value = true
  try { const res = await getTrainingPlanList(queryParams); tableData.value = res.data.list || []; total.value = res.data.total || 0 }
  finally { loading.value = false }
}
function handleSearch(p) { Object.assign(queryParams, p, { pageNum: 1 }); loadData() }
function handleReset() { Object.assign(queryParams, { pageNum: 1, planName: '', targetDept: '', status: '' }); loadData() }
function handlePageChange(p) { queryParams.pageNum = p; loadData() }
function handleSizeChange(s) { queryParams.pageSize = s; queryParams.pageNum = 1; loadData() }
function handleSelectionChange(r) { selectedRows.value = r }

function handleAdd() { dialogTitle.value = '制定培训计划'; resetForm(); dialogVisible.value = true }
function handleEdit(row) { dialogTitle.value = '编辑培训计划'; Object.assign(formData, { ...row }); dialogVisible.value = true }
function handleView(row) { currentRow.value = { ...row }; drawerVisible.value = true }
function resetForm() { Object.keys(formData).forEach(k => { formData[k] = '' }); formData.id = undefined }
function cancelDialog() { dialogVisible.value = false; formRef.value?.resetFields() }

async function handleSubmit() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return
  submitLoading.value = true
  try { await new Promise(r => setTimeout(r, 500)); ElMessage.success('操作成功'); dialogVisible.value = false; loadData() }
  catch { ElMessage.error('操作失败') } finally { submitLoading.value = false }
}

function handleExecute(row) { ElMessage.success(`培训计划「${row.planName}」已进入执行阶段`); loadData() }
function handleRecord(row) { ElMessage.info(`查看「${row.planName}」的培训记录`) }
function handleAdjustBudget(row) { ElMessage.info('打开预算调整窗口') }
async function handleCancel(row) { ElMessage.success('计划已取消'); loadData() }
async function handleBatchApprove() { if (!selectedRows.value.length) return ElMessage.warning('请选择数据'); ElMessage.success('批量审批完成') }
function handleCopyPlan() { if (!selectedRows.value.length) return ElMessage.warning('请选择要复制的计划'); ElMessage.success('计划复制成功') }
async function handleBatchDelete() { if (!selectedRows.value.length) return ElMessage.warning('请选择数据'); await ElMessageBox.confirm(`确定删除 ${selectedRows.value.length} 条？`); ElMessage.success('批量删除成功'); loadData() }

onMounted(() => loadData())
</script>

<style lang="scss" scoped>
.page-container .table-toolbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; padding: 14px 18px; background: #fff; border-radius: var(--border-radius-base); .toolbar-left { display: flex; gap: 10px; } .toolbar-right { display: flex; gap: 8px; } }
.drawer-title { font-size: 16px; font-weight: 600; }
.drawer-body .drawer-actions { margin-top: 20px; display: flex; gap: 10px; }
</style>
