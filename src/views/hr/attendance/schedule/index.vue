<template>
  <div class="page-container">
    <BaseSearch :search-items="searchItems" @search="handleSearch" @reset="handleReset" />
    <div class="table-toolbar">
      <div class="toolbar-left">
        <el-button type="primary" :icon="Plus" @click="handleAdd">新建排班</el-button>
        <el-button type="success" :icon="CopyDocument" plain @click="handleCopyWeek">复制排班</el-button>
        <el-button type="warning" :icon="Calendar" plain @click="handleBatchSet">批量设置</el-button>
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
      <template #shiftType="{ row }">
        <el-tag :type="shiftTypeMap[row.shiftType]?.type || 'info'" size="small" effect="dark">{{ row.shiftType }}</el-tag>
      </template>
      <template #status="{ row }">
        <el-tag :type="scheduleStatusMap[row.status]?.type || 'info'" size="small">{{ row.status }}</el-tag>
      </template>
      <template #operation="{ row }">
        <MoreActions :items="rowActions(row)" :max="3" />
      </template>
    </BaseTable>

    <BaseDialog v-model="dialogVisible" :title="dialogTitle" width="580px" :confirm-loading="submitLoading" @confirm="handleSubmit" @cancel="cancelDialog">
      <BaseForm ref="formRef" v-model="formData" :form-items="formItems" :form-rules="formRules" :col-count="2" />
    </BaseDialog>

    <el-drawer v-model="drawerVisible" direction="rtl" size="480px">
      <template #header><span class="drawer-title">排班详情 - {{ currentRow?.scheduleName }}</span></template>
      <div v-if="currentRow" class="drawer-body">
        <el-descriptions :column="1" border size="small">
          <el-descriptions-item label="排班名称">{{ currentRow.scheduleName }}</el-descriptions-item>
          <el-descriptions-item label="适用部门">{{ currentRow.deptName }}</el-descriptions-item>
          <el-descriptions-item label="班次类型"><el-tag :type="shiftTypeMap[currentRow.shiftType]?.type || 'info'" size="small">{{ currentRow.shiftType }}</el-tag></el-descriptions-item>
          <el-descriptions-item label="上班时间">{{ currentRow.startTime }}</el-descriptions-item>
          <el-descriptions-item label="下班时间">{{ currentRow.endTime }}</el-descriptions-item>
          <el-descriptions-item label="休息时间">{{ currentRow.breakTime || '-' }}</el-descriptions-item>
          <el-descriptions-item label="生效日期">{{ currentRow.effectiveDate }}</el-descriptions-item>
          <el-descriptions-item label="状态"><el-tag :type="scheduleStatusMap[currentRow.status]?.type || 'info'" size="small">{{ currentRow.status }}</el-tag></el-descriptions-item>
          <el-descriptions-item label="创建人">{{ currentRow.creator }}</el-descriptions-item>
        </el-descriptions>
        <div class="drawer-actions">
          <el-button type="primary" @click="handleAssignEmp(currentRow)">分配人员</el-button>
          <el-button type="success" v-if="currentRow.status !== '生效中'" @click="handleActivate(currentRow)">立即生效</el-button>
          <el-button type="warning" @click="handleDuplicate(currentRow)">复制排班</el-button>
        </div>
      </div>
    </el-drawer>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Delete, Refresh, CopyDocument, Calendar } from '@element-plus/icons-vue'
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
    { label: '生效', type: 'success', important: true, hidden: row.status === '生效中', onClick: () => handleActivate(row) },
    { label: '复制', type: 'warning', onClick: () => handleDuplicate(row) },
    { label: '分配人员', type: 'primary', onClick: () => handleAssignEmp(row) },
    { label: '删除', type: 'danger', onClick: () => handleDeleteWithConfirm(row) }
  ]
}
function handleDeleteWithConfirm(row) {
  ElMessageBox.confirm('确定删除该排班？', '提示', { type: 'warning' })
    .then(() => handleDelete(row))
    .catch(() => {})
}
import { getScheduleList } from '@/api/hr'

const searchItems = [
  { prop: 'scheduleName', label: '排班名称', type: 'input' },
  { prop: 'deptName', label: '适用部门', type: 'select', options: [
    { value: '', label: '全部' }, { value: '技术部', label: '技术部' }, { value: '销售部', label: '销售部' },
    { value: '生产部', label: '生产部' }, { value: '仓储部', label: '仓储部' }, { value: '客服部', label: '客服部' }
  ]},
  { prop: 'shiftType', label: '班次类型', type: 'select', options: [
    { value: '', label: '全部' }, { value: '白班', label: '白班' }, { value: '夜班', label: '夜班' },
    { value: '轮班', label: '轮班' }, { value: '弹性工作制', label: '弹性工作制' }
  ]},
  { prop: 'status', label: '状态', type: 'select', options: [
    { value: '', label: '全部' }, { value: '生效中', label: '生效中' }, { value: '已过期', label: '已过期' }, { value: '草稿', label: '草稿' }
  ]}
]

const columns = [
  { prop: 'scheduleName', label: '排班名称', width: 140 },
  { prop: 'deptName', label: '适用部门', width: 100 },
  { prop: 'shiftType', label: '班次类型', width: 110, slot: 'shiftType' },
  { prop: 'startTime', label: '上班时间', width: 95 },
  { prop: 'endTime', label: '下班时间', width: 95 },
  { prop: 'breakTime', label: '休息时间', width: 100 },
  { prop: 'effectiveDate', label: '生效日期', width: 110 },
  { prop: 'creator', label: '创建人', width: 85 },
  { prop: 'status', label: '状态', width: 85, slot: 'status' }
]

const formItems = [
  { prop: 'scheduleName', label: '排班名称 *', type: 'input', span: 12 },
  { prop: 'deptName', label: '适用部门 *', type: 'select', span: 12, options: [
    { value: '技术部', label: '技术部' }, { value: '销售部', label: '销售部' }, { value: '生产部', label: '生产部' },
    { value: '仓储部', label: '仓储部' }, { value: '客服部', label: '客服部' }
  ]},
  { prop: 'shiftType', label: '班次类型 *', type: 'select', span: 12, options: [
    { value: '白班', label: '白班' }, { value: '夜班', label: '夜班' }, { value: '轮班', label: '轮班' }, { value: '弹性工作制', label: '弹性工作制' }
  ]},
  { prop: 'startTime', label: '上班时间 *', type: 'input', span: 12, attrs: { placeholder: '如：08:30' } },
  { prop: 'endTime', label: '下班时间 *', type: 'input', span: 12, attrs: { placeholder: '如：17:30' } },
  { prop: 'breakTime', label: '休息时段', type: 'input', span: 12, attrs: { placeholder: '如：12:00-13:00' } },
  { prop: 'effectiveDate', label: '生效日期 *', type: 'date', span: 12 },
  { prop: 'description', label: '备注说明', type: 'textarea', rows: 3, span: 24 }
]
const formRules = {
  scheduleName: [{ required: true, message: '请输入排班名称', trigger: 'blur' }],
  deptName: [{ required: true, message: '请选择部门', trigger: 'change' }],
  shiftType: [{ required: true, message: '请选择班次类型', trigger: 'change' }],
  startTime: [{ required: true, message: '请输入上班时间', trigger: 'blur' }],
  endTime: [{ required: true, message: '请输入下班时间', trigger: 'blur' }],
  effectiveDate: [{ required: true, message: '请选择生效日期', trigger: 'change' }]
}

const shiftTypeMap = { '白班': { type: 'primary' }, '夜班': { type: 'warning' }, '轮班': { type: 'success' }, '弹性工作制': { type: 'info' } }
const scheduleStatusMap = { '生效中': { type: 'success' }, '已过期': { type: 'info' }, '草稿': { type: 'warning' } }

const loading = ref(false), tableData = ref([]), total = ref(0), selectedRows = ref([])
const dialogVisible = ref(false), dialogTitle = ref('新建排班'), submitLoading = ref(false), formRef = ref(null)
const drawerVisible = ref(false), currentRow = ref(null)
const queryParams = reactive({ pageNum: 1, pageSize: 10, scheduleName: '', deptName: '', shiftType: '', status: '' })
const formData = reactive({ id: undefined, scheduleName: '', deptName: '', shiftType: '白班', startTime: '08:30', endTime: '17:30', breakTime: '12:00-13:00', effectiveDate: '', description: '' })

async function loadData() {
  loading.value = true
  try { const res = await getScheduleList(queryParams); tableData.value = res.data.list || []; total.value = res.data.total || 0 }
  finally { loading.value = false }
}
function handleSearch(p) { Object.assign(queryParams, p, { pageNum: 1 }); loadData() }
function handleReset() { Object.assign(queryParams, { pageNum: 1, scheduleName: '', deptName: '', shiftType: '', status: '' }); loadData() }
function handlePageChange(p) { queryParams.pageNum = p; loadData() }
function handleSizeChange(s) { queryParams.pageSize = s; queryParams.pageNum = 1; loadData() }
function handleSelectionChange(r) { selectedRows.value = r }

function handleAdd() { dialogTitle.value = '新建排班'; resetForm(); dialogVisible.value = true }
function handleEdit(row) { dialogTitle.value = '编辑排班'; Object.assign(formData, { ...row }); dialogVisible.value = true }
function handleView(row) { currentRow.value = { ...row }; drawerVisible.value = true }
function resetForm() { Object.keys(formData).forEach(k => { formData[k] = k === 'shiftType' ? '白班' : k === 'startTime' ? '08:30' : k === 'endTime' ? '17:30' : k === 'breakTime' ? '12:00-13:00' : '' }); formData.id = undefined }
function cancelDialog() { dialogVisible.value = false; formRef.value?.resetFields() }

async function handleSubmit() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return
  submitLoading.value = true
  try { await new Promise(r => setTimeout(r, 400)); ElMessage.success('操作成功'); dialogVisible.value = false; loadData() }
  catch { ElMessage.error('操作失败') } finally { submitLoading.value = false }
}

async function handleDelete(row) { ElMessage.success('排班已删除'); loadData() }
async function handleBatchDelete() { if (!selectedRows.value.length) return ElMessage.warning('请选择数据'); ElMessage.success('批量删除成功'); loadData() }
function handleActivate(row) { ElMessage.success(`排班「${row.scheduleName}」已生效`); loadData() }
function handleDuplicate(row) { dialogTitle.value = `复制排班 - ${row.scheduleName}`; Object.assign(formData, { ...row, id: undefined, scheduleName: `${row.scheduleName}(副本)` }); dialogVisible.value = true }
function handleAssignEmp(row) { ElMessage.success(`打开「${row.scheduleName}」的人员分配`) }
function handleCopyWeek() { if (!selectedRows.value.length) return ElMessage.warning('请选择数据'); ElMessage.success('排班已复制到下一周') }
function handleBatchSet() { ElMessage.info('打开批量排班设置') }

onMounted(() => loadData())
</script>

<style lang="scss" scoped>
.page-container .table-toolbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; padding: 14px 18px; background: #fff; border-radius: var(--border-radius-base); .toolbar-left { display: flex; gap: 10px; } .toolbar-right { display: flex; gap: 8px; } }
.drawer-title { font-size: 16px; font-weight: 600; }
.drawer-body .drawer-actions { margin-top: 20px; display: flex; gap: 10px; }
</style>
