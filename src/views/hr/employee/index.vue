<template>
  <div class="page-container">
    <BaseSearch :search-items="searchItems" @search="handleSearch" @reset="handleReset" />
    <div class="table-toolbar">
      <div class="toolbar-left">
        <el-button type="primary" :icon="Plus" @click="handleAdd">新增员工</el-button>
        <el-button type="success" :icon="Upload" plain @click="handleImport">批量导入</el-button>
        <el-button type="warning" :icon="Download" plain @click="handleExport">导出</el-button>
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
      <template #gender="{ row }">
        <el-tag :type="row.gender === '男' ? 'primary' : 'danger'" size="small">{{ row.gender }}</el-tag>
      </template>
      <template #status="{ row }">
        <BaseStatusTag :type="statusMap[row.status]?.type || 'info'">{{ row.status }}</BaseStatusTag>
      </template>
      <template #education="{ row }">
        <el-tag type="info" size="small" effect="plain">{{ row.education }}</el-tag>
      </template>
      <template #operation="{ row }">
        <MoreActions :items="rowActions(row)" :max="3" />
      </template>
    </BaseTable>

    <!-- 新增/编辑弹窗 -->
    <BaseDialog v-model="dialogVisible" :title="dialogTitle" width="720px" :confirm-loading="submitLoading" @confirm="handleSubmit" @cancel="cancelDialog">
      <BaseForm ref="formRef" v-model="formData" :form-items="formItems" :form-rules="formRules" :col-count="2" />
    </BaseDialog>

    <!-- 详情抽屉 -->
    <el-drawer v-model="drawerVisible" direction="rtl" size="560px" :destroy-on-close="true">
      <template #header><span class="drawer-title">员工档案 - {{ currentRow?.name }}</span></template>
      <div class="drawer-content" v-if="currentRow">
        <el-descriptions :column="1" border size="small">
          <el-descriptions-item label="工号">{{ currentRow.empNo }}</el-descriptions-item>
          <el-descriptions-item label="姓名">{{ currentRow.name }}</el-descriptions-item>
          <el-descriptions-item label="性别">{{ currentRow.gender }}</el-descriptions-item>
          <el-descriptions-item label="部门">{{ currentRow.deptName }}</el-descriptions-item>
          <el-descriptions-item label="职位">{{ currentRow.position }}</el-descriptions-item>
          <el-descriptions-item label="手机号">{{ currentRow.phone }}</el-descriptions-item>
          <el-descriptions-item label="邮箱">{{ currentRow.email }}</el-descriptions-item>
          <el-descriptions-item label="入职日期">{{ currentRow.entryDate }}</el-descriptions-item>
          <el-descriptions-item label="学历">{{ currentRow.education }}</el-descriptions-item>
          <el-descriptions-item label="状态"><BaseStatusTag :type="statusMap[currentRow.status]?.type || 'info'">{{ currentRow.status }}</BaseStatusTag></el-descriptions-item>
        </el-descriptions>
        <div class="drawer-actions">
          <el-button type="primary" :icon="EditPen" @click="handleEditFromDrawer">编辑档案</el-button>
          <el-button type="warning" @click="handlePrint">打印档案</el-button>
        </div>
      </div>
    </el-drawer>

    <!-- 调岗弹窗 -->
    <BaseDialog v-model="transferDialogVisible" title="员工调岗" width="480px" :confirm-loading="submitLoading" @confirm="handleSubmitTransfer" @cancel="transferDialogVisible = false">
      <BaseForm ref="transferFormRef" v-model="transferData" :form-items="transferFormItems" :form-rules="transferFormRules" :col-count="1" />
    </BaseDialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Delete, Refresh, Upload, Download, EditPen } from '@element-plus/icons-vue'
import BaseSearch from '@/components/BaseSearch.vue'
import BaseTable from '@/components/BaseTable.vue'
import BaseDialog from '@/components/BaseDialog.vue'
import BaseForm from '@/components/BaseForm.vue'
import BaseStatusTag from '@/components/BaseStatusTag.vue'
import MoreActions from '@/components/MoreActions.vue'
import { getEmployeeList, saveEmployee, deleteEmployee } from '@/api/hr'

// 每行操作按钮配置
function rowActions(row) {
  return [
    { label: '详情', type: 'primary', important: true, onClick: () => handleView(row) },
    { label: '编辑', type: 'primary', important: true, onClick: () => handleEdit(row) },
    { label: '调岗', type: 'primary', important: true, onClick: () => handleTransfer(row) },
    { label: '离职', type: 'warning', onClick: () => handleLeave(row) },
    { label: '删除', type: 'danger', onClick: () => handleDeleteWithConfirm(row) }
  ]
}
function handleDeleteWithConfirm(row) {
  ElMessageBox.confirm('确定删除该员工档案？', '提示', { type: 'warning' })
    .then(() => handleDelete(row))
    .catch(() => {})
}

const searchItems = [
  { prop: 'empNo', label: '工号', type: 'input' },
  { prop: 'name', label: '姓名', type: 'input' },
  { prop: 'deptName', label: '部门', type: 'select', options: [
    { value: '', label: '全部' }, { value: '技术部', label: '技术部' }, { value: '销售部', label: '销售部' },
    { value: '财务部', label: '财务部' }, { value: '行政部', label: '行政部' }, { value: '生产部', label: '生产部' }
  ]},
  { prop: 'status', label: '状态', type: 'select', options: [
    { value: '', label: '全部' }, { value: '在职', label: '在职' }, { value: '试用期', label: '试用期' }, { value: '离职', label: '离职' }
  ]},
  { prop: 'position', label: '职位', type: 'input' }
]

const columns = [
  { prop: 'empNo', label: '工号', width: 120 },
  { prop: 'name', label: '姓名', width: 90 },
  { prop: 'gender', label: '性别', width: 70, slot: 'gender' },
  { prop: 'deptName', label: '部门', width: 100 },
  { prop: 'position', label: '职位', width: 110 },
  { prop: 'phone', label: '手机号', width: 130 },
  { prop: 'email', label: '邮箱', minWidth: 160, showOverflowTooltip: true },
  { prop: 'entryDate', label: '入职日期', width: 120 },
  { prop: 'status', label: '状态', width: 85, slot: 'status' },
  { prop: 'education', label: '学历', width: 80, slot: 'education' }
]

const formItems = [
  { prop: 'empNo', label: '工号 *', type: 'input', span: 12 },
  { prop: 'name', label: '姓名 *', type: 'input', span: 12 },
  { prop: 'gender', label: '性别 *', type: 'radio', span: 12, options: [{ value: '男', label: '男' }, { value: '女', label: '女' }] },
  { prop: 'phone', label: '手机号 *', type: 'input', span: 12 },
  { prop: 'email', label: '邮箱', type: 'input', span: 12 },
  { prop: 'idCard', label: '身份证号', type: 'input', span: 12 },
  { prop: 'deptName', label: '部门 *', type: 'select', span: 12, options: [
    { value: '技术部', label: '技术部' }, { value: '销售部', label: '销售部' }, { value: '财务部', label: '财务部' },
    { value: '行政部', label: '行政部' }, { value: '采购部', label: '采购部' }, { value: '仓储部', label: '仓储部' }, { value: '生产部', label: '生产部' }
  ]},
  { prop: 'position', label: '职位 *', type: 'select', span: 12, options: [
    { value: '工程师', label: '工程师' }, { value: '经理', label: '经理' }, { value: '专员', label: '专员' },
    { value: '主管', label: '主管' }, { value: '总监', label: '总监' }, { value: '助理', label: '助理' }
  ]},
  { prop: 'entryDate', label: '入职日期 *', type: 'date', span: 12 },
  { prop: 'education', label: '学历', type: 'select', span: 12, options: [
    { value: '高中', label: '高中' }, { value: '大专', label: '大专' }, { value: '本科', label: '本科' },
    { value: '硕士', label: '硕士' }, { value: '博士', label: '博士' }
  ]},
  { prop: 'school', label: '毕业院校', type: 'input', span: 12 },
  { prop: 'major', label: '专业', type: 'input', span: 12 },
  { prop: 'address', label: '住址', type: 'textarea', rows: 2, span: 24 },
  { prop: 'bankName', label: '开户银行', type: 'input', span: 12 },
  { prop: 'bankAccount', label: '银行账号', type: 'input', span: 12 },
  { prop: 'baseSalary', label: '基本工资', type: 'number', min: 0, precision: 2, span: 12 },
  { prop: 'status', label: '状态', type: 'radio', span: 12, options: [
    { value: '在职', label: '在职' }, { value: '试用期', label: '试用期' }
  ]},
  { prop: 'remark', label: '备注', type: 'textarea', rows: 3, span: 24 }
]

const formRules = {
  empNo: [{ required: true, message: '请输入工号', trigger: 'blur' }],
  name: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
  gender: [{ required: true, message: '请选择性别', trigger: 'change' }],
  phone: [{ required: true, message: '请输入手机号', trigger: 'blur' }],
  deptName: [{ required: true, message: '请选择部门', trigger: 'change' }],
  position: [{ required: true, message: '请选择职位', trigger: 'change' }],
  entryDate: [{ required: true, message: '请选择入职日期', trigger: 'change' }]
}

const statusMap = { '在职': { type: 'success' }, '试用期': { type: 'warning' }, '离职': { type: 'danger' }, '退休': { type: 'info' } }

// 调岗表单
const transferFormItems = [
  { prop: 'targetDept', label: '目标部门 *', type: 'select', options: [
    { value: '技术部', label: '技术部' }, { value: '销售部', label: '销售部' }, { value: '财务部', label: '财务部' },
    { value: '行政部', label: '行政部' }, { value: '生产部', label: '生产部' }
  ]},
  { prop: 'targetPosition', label: '目标职位 *', type: 'select', options: [
    { value: '工程师', label: '工程师' }, { value: '经理', label: '经理' }, { value: '主管', label: '主管' }
  ]},
  { prop: 'effectiveDate', label: '生效日期 *', type: 'date' },
  { prop: 'reason', label: '调岗原因', type: 'textarea', rows: 3 }
]
const transferFormRules = {
  targetDept: [{ required: true, message: '请选择目标部门', trigger: 'change' }],
  targetPosition: [{ required: true, message: '请选择目标职位', trigger: 'change' }],
  effectiveDate: [{ required: true, message: '请选择生效日期', trigger: 'change' }]
}

// 数据状态
const tableRef = ref(null)
const loading = ref(false)
const tableData = ref([])
const total = ref(0)
const selectedRows = ref([])
const dialogVisible = ref(false)
const dialogTitle = ref('新增员工')
const submitLoading = ref(false)
const formRef = ref(null)
const drawerVisible = ref(false)
const currentRow = ref(null)
const transferDialogVisible = ref(false)
const transferFormRef = ref(null)

const queryParams = reactive({ pageNum: 1, pageSize: 10, empNo: '', name: '', deptName: '', status: '', position: '' })
const formData = reactive({
  id: undefined, empNo: '', name: '', gender: '男', phone: '', email: '', idCard: '',
  deptName: '', position: '', entryDate: '', education: '本科', school: '', major: '',
  address: '', bankName: '', bankAccount: '', baseSalary: undefined, status: '在职', remark: ''
})
const transferData = reactive({ targetDept: '', targetPosition: '', effectiveDate: '', reason: '' })

async function loadData() {
  loading.value = true
  try {
    const res = await getEmployeeList(queryParams)
    tableData.value = res.data.list || []
    total.value = res.data.total || 0
  } finally { loading.value = false }
}
function handleSearch(p) { Object.assign(queryParams, p, { pageNum: 1 }); loadData() }
function handleReset() { Object.assign(queryParams, { pageNum: 1, empNo: '', name: '', deptName: '', status: '', position: '' }); loadData() }
function handlePageChange(p) { queryParams.pageNum = p; loadData() }
function handleSizeChange(s) { queryParams.pageSize = s; queryParams.pageNum = 1; loadData() }
function handleSelectionChange(r) { selectedRows.value = r }

function handleAdd() {
  dialogTitle.value = '新增员工'; resetForm(); dialogVisible.value = true
}
function handleEdit(row) {
  dialogTitle.value = '编辑员工'; Object.assign(formData, { ...row }); dialogVisible.value = true
}
function handleView(row) {
  currentRow.value = { ...row }; drawerVisible.value = true
}
function handleEditFromDrawer() {
  drawerVisible.value = false; handleEdit(currentRow.value)
}

function resetForm() {
  Object.keys(formData).forEach(k => { if (k === 'gender') formData[k] = '男'; else if (k === 'status') formData[k] = '在职'; else if (k === 'education') formData[k] = '本科'; else formData[k] = '' })
  formData.id = undefined
}

function cancelDialog() { dialogVisible.value = false; formRef.value?.resetFields() }

async function handleSubmit() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return
  submitLoading.value = true
  try {
    await new Promise(r => setTimeout(r, 500))
    ElMessage.success('操作成功'); dialogVisible.value = false; loadData()
  } catch { ElMessage.error('操作失败') } finally { submitLoading.value = false }
}

async function handleDelete(row) {
  ElMessage.success('删除成功'); loadData()
}
async function handleBatchDelete() {
  if (!selectedRows.value.length) return ElMessage.warning('请选择数据')
  await ElMessageBox.confirm(`确定删除选中的 ${selectedRows.value.length} 条记录？`, '提示', { type: 'warning' })
  ElMessage.success('批量删除成功'); loadData()
}

function handleTransfer(row) {
  currentRow.value = row
  Object.assign(transferData, { targetDept: '', targetPosition: '', effectiveDate: '', reason: '' })
  transferDialogVisible.value = true
}

async function handleSubmitTransfer() {
  const valid = await transferFormRef.value?.validate().catch(() => false)
  if (!valid) return
  submitLoading.value = true
  try {
    await new Promise(r => setTimeout(r, 400))
    ElMessage.success('调岗申请已提交'); transferDialogVisible.value = false; loadData()
  } catch { ElMessage.error('操作失败') } finally { submitLoading.value = false }
}

async function handleLeave(row) {
  await ElMessageBox.confirm(`确定将员工"${row.name}"设为离职状态？`, '离职确认', { type: 'warning' })
  ElMessage.success('离职处理完成'); loadData()
}
function handleImport() { ElMessage.info('打开批量导入功能...') }
function handleExport() { ElMessage.success('正在导出员工数据...') }
function handlePrint() { ElMessage.info('打印员工档案...') }

onMounted(() => loadData())
</script>

<style lang="scss" scoped>
.page-container .table-toolbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; padding: 14px 18px; background: #fff; border-radius: var(--border-radius-base); .toolbar-left { display: flex; gap: 10px; } .toolbar-right { display: flex; gap: 8px; } }
.drawer-title { font-size: 16px; font-weight: 600; color: var(--text-primary); }
.drawer-content { .drawer-actions { margin-top: 20px; padding-top: 16px; border-top: 1px solid var(--border-color-lighter); display: flex; gap: 10px; } }
</style>
