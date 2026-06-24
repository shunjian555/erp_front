<template>
  <div class="page-container">
    <BaseSearch :search-items="searchItems" @search="handleSearch" @reset="handleReset" />
    <div class="table-toolbar">
      <div class="toolbar-left">
        <el-button type="primary" :icon="Plus" @click="handleAdd">补录打卡</el-button>
        <el-button type="success" :icon="Check" plain @click="handleBatchApprove">批量审核</el-button>
        <el-button type="warning" :icon="EditPen" plain @click="handleBatchFix">批量修正</el-button>
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
      <template #status="{ row }">
        <el-tag :type="clockStatusMap[row.status]?.type || 'info'" size="small">{{ row.status }}</el-tag>
      </template>
      <template #operation="{ row }">
        <MoreActions :items="rowActions(row)" :max="3" />
      </template>
    </BaseTable>

    <!-- 补录/修正弹窗 -->
    <BaseDialog v-model="dialogVisible" :title="dialogTitle" width="500px" :confirm-loading="submitLoading" @confirm="handleSubmit" @cancel="cancelDialog">
      <BaseForm ref="formRef" v-model="formData" :form-items="formItems" :form-rules="formRules" :col-count="1" />
    </BaseDialog>

    <!-- 详情抽屉 -->
    <el-drawer v-model="drawerVisible" direction="rtl" size="460px">
      <template #header><span class="drawer-title">打卡记录详情</span></template>
      <div v-if="currentRow" class="drawer-body">
        <el-descriptions :column="1" border size="small">
          <el-descriptions-item label="员工">{{ currentRow.employeeName }} ({{ currentRow.empNo }})</el-descriptions-item>
          <el-descriptions-item label="部门">{{ currentRow.deptName }}</el-descriptions-item>
          <el-descriptions-item label="日期">{{ currentRow.date }}</el-descriptions-item>
          <el-descriptions-item label="上班打卡">{{ currentRow.clockIn }}</el-descriptions-item>
          <el-descriptions-item label="下班打卡">{{ currentRow.clockOut }}</el-descriptions-item>
          <el-descriptions-item label="工作时长">{{ currentRow.workHours }}小时</el-descriptions-item>
          <el-descriptions-item label="状态"><el-tag :type="clockStatusMap[currentRow.status]?.type || 'info'" size="small">{{ currentRow.status }}</el-tag></el-descriptions-item>
        </el-descriptions>
        <div class="drawer-actions">
          <el-button type="warning" v-if="currentRow.status !== '正常'" @click="handleFix(currentRow)">修正异常</el-button>
          <el-button type="success" @click="handleLeaveLink(currentRow)">关联请假单</el-button>
        </div>
      </div>
    </el-drawer>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Delete, Refresh, Check, EditPen } from '@element-plus/icons-vue'
import BaseSearch from '@/components/BaseSearch.vue'
import BaseTable from '@/components/BaseTable.vue'
import BaseDialog from '@/components/BaseDialog.vue'
import BaseForm from '@/components/BaseForm.vue'
import MoreActions from '@/components/MoreActions.vue'

// 每行操作按钮配置
function rowActions(row) {
  return [
    { label: '详情', type: 'primary', important: true, onClick: () => handleView(row) },
    { label: '修正', type: 'warning', important: true, hidden: row.status === '正常', onClick: () => handleFix(row) },
    { label: '审批', type: 'success', important: true, hidden: !['缺卡', '迟到'].includes(row.status), onClick: () => handleApprove(row) },
    { label: '关联请假', type: 'primary', onClick: () => handleLeaveLink(row) },
    { label: '删除', type: 'danger', onClick: () => handleDeleteWithConfirm(row) }
  ]
}
function handleDeleteWithConfirm(row) {
  ElMessageBox.confirm('确定删除该打卡记录？', '提示', { type: 'warning' })
    .then(() => handleDelete(row))
    .catch(() => {})
}
import { getClockList } from '@/api/hr'

const searchItems = [
  { prop: 'employeeName', label: '员工姓名', type: 'input' },
  { prop: 'empNo', label: '工号', type: 'input' },
  { prop: 'deptName', label: '部门', type: 'select', options: [
    { value: '', label: '全部' }, { value: '技术部', label: '技术部' }, { value: '销售部', label: '销售部' },
    { value: '生产部', label: '生产部' }, { value: '仓储部', label: '仓储部' }
  ]},
  { prop: 'date', label: '日期', type: 'date' },
  { prop: 'status', label: '状态', type: 'select', options: [
    { value: '', label: '全部' }, { value: '正常', label: '正常' }, { value: '迟到', label: '迟到' },
    { value: '早退', label: '早退' }, { value: '缺卡', label: '缺卡' }, { value: '旷工', label: '旷工' }, { value: '请假', label: '请假' }
  ]}
]

const columns = [
  { prop: 'employeeName', label: '姓名', width: 90 },
  { prop: 'empNo', label: '工号', width: 115 },
  { prop: 'deptName', label: '部门', width: 95 },
  { prop: 'date', label: '日期', width: 110, align: 'center' },
  { prop: 'clockIn', label: '上班打卡', width: 100 },
  { prop: 'clockOut', label: '下班打卡', width: 100 },
  { prop: 'workHours', label: '工作时长', width: 90, align: 'center' },
  { prop: 'status', label: '状态', width: 80, slot: 'status' }
]

const formItems = [
  { prop: 'empNo', label: '工号 *', type: 'input' },
  { prop: 'date', label: '日期 *', type: 'date' },
  { prop: 'clockIn', label: '上班时间', type: 'input', attrs: { placeholder: '如：08:30:00' } },
  { prop: 'clockOut', label: '下班时间', type: 'input', attrs: { placeholder: '如：17:30:00' } },
  { prop: 'reason', label: '补录原因 *', type: 'textarea', rows: 3 }
]
const formRules = {
  empNo: [{ required: true, message: '请输入工号', trigger: 'blur' }],
  date: [{ required: true, message: '请选择日期', trigger: 'change' }],
  reason: [{ required: true, message: '请输入补录原因', trigger: 'blur' }]
}

const clockStatusMap = { '正常': { type: 'success' }, '迟到': { type: 'warning' }, '早退': { type: 'warning' }, '缺卡': { type: 'danger' }, '旷工': { type: 'danger' }, '请假': { type: 'info' } }

const loading = ref(false), tableData = ref([]), total = ref(0), selectedRows = ref([])
const dialogVisible = ref(false), dialogTitle = ref('补录打卡'), submitLoading = ref(false), formRef = ref(null)
const drawerVisible = ref(false), currentRow = ref(null)
const queryParams = reactive({ pageNum: 1, pageSize: 10, employeeName: '', empNo: '', deptName: '', date: '', status: '' })
const formData = reactive({ id: undefined, empNo: '', date: '', clockIn: '', clockOut: '', reason: '' })

async function loadData() {
  loading.value = true
  try { const res = await getClockList(queryParams); tableData.value = res.data.list || []; total.value = res.data.total || 0 }
  finally { loading.value = false }
}
function handleSearch(p) { Object.assign(queryParams, p, { pageNum: 1 }); loadData() }
function handleReset() { Object.assign(queryParams, { pageNum: 1, employeeName: '', empNo: '', deptName: '', date: '', status: '' }); loadData() }
function handlePageChange(p) { queryParams.pageNum = p; loadData() }
function handleSizeChange(s) { queryParams.pageSize = s; queryParams.pageNum = 1; loadData() }
function handleSelectionChange(r) { selectedRows.value = r }

function handleAdd() { dialogTitle.value = '补录打卡'; resetForm(); dialogVisible.value = true }
function handleView(row) { currentRow.value = { ...row }; drawerVisible.value = true }
function resetForm() { Object.keys(formData).forEach(k => { formData[k] = '' }); formData.id = undefined }
function cancelDialog() { dialogVisible.value = false; formRef.value?.resetFields() }

async function handleSubmit() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return
  submitLoading.value = true
  try { await new Promise(r => setTimeout(r, 400)); ElMessage.success('补录成功'); dialogVisible.value = false; loadData() }
  catch { ElMessage.error('操作失败') } finally { submitLoading.value = false }
}

function handleFix(row) { dialogTitle.value = '修正打卡'; Object.assign(formData, { empNo: row.empNo, date: row.date, clockIn: row.clockIn, clockOut: row.clockOut, reason: '' }); dialogVisible.value = true }
async function handleApprove(row) { ElMessage.success(`已审批 ${row.employeeName} 的${row.status}记录`); loadData() }
async function handleDelete(row) { ElMessage.success('记录已删除'); loadData() }
async function handleBatchApprove() { if (!selectedRows.value.length) return ElMessage.warning('请选择数据'); ElMessage.success('批量审核完成') }
function handleBatchFix() { if (!selectedRows.value.length) return ElMessage.warning('请选择数据'); ElMessage.info('打开批量修正面板') }
async function handleBatchDelete() { if (!selectedRows.value.length) return ElMessage.warning('请选择数据'); ElMessage.success('批量删除成功'); loadData() }
function handleLeaveLink(row) { ElMessage.info(`关联 ${row.employeeName} 在 ${row.date} 的请假申请`) }

onMounted(() => loadData())
</script>

<style lang="scss" scoped>
.page-container .table-toolbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; padding: 14px 18px; background: #fff; border-radius: var(--border-radius-base); .toolbar-left { display: flex; gap: 10px; } .toolbar-right { display: flex; gap: 8px; } }
.drawer-title { font-size: 16px; font-weight: 600; }
.drawer-body .drawer-actions { margin-top: 20px; display: flex; gap: 10px; }
</style>
