<template>
  <div class="page-container">
    <BaseSearch :search-items="searchItems" @search="handleSearch" @reset="handleReset" />
    <div class="table-toolbar">
      <div class="toolbar-left">
        <el-button type="primary" :icon="Plus" @click="handleAdd">出差申请</el-button>
      </div>
      <div class="toolbar-right">
        <el-button :icon="Refresh" circle @click="loadData" />
      </div>
    </div>
    <BaseTable :columns="columns" :table-data="tableData" :loading="loading" :total="total" :current-page.sync="queryParams.pageNum" :page-size.sync="queryParams.pageSize" :show-index="true" @current-change="handlePageChange" @size-change="handleSizeChange">
      <template #status="{ row }">
        <el-tag :type="statusMap[row.status]?.type || 'info'" size="small">{{ row.status }}</el-tag>
      </template>
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

    <!-- 新增/编辑弹窗 -->
    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="600px" :close-on-click-modal="false" @close="cancelDialog">
      <el-form ref="formRef" :model="formData" :rules="formRules" label-width="100px">
        <el-form-item label="出差人" prop="applicant"><el-input v-model="formData.applicant" /></el-form-item>
        <el-form-item label="部门" prop="dept"><el-input v-model="formData.dept" /></el-form-item>
        <el-form-item label="目的地" prop="destination"><el-input v-model="formData.destination" /></el-form-item>
        <el-form-item label="开始日期" prop="startDate"><el-input v-model="formData.startDate" placeholder="例如 2025-06-23" /></el-form-item>
        <el-form-item label="结束日期" prop="endDate"><el-input v-model="formData.endDate" placeholder="例如 2025-06-30" /></el-form-item>
        <el-form-item label="天数" prop="days"><el-input-number v-model="formData.days" :min="1" :max="60" style="width: 100%" /></el-form-item>
        <el-form-item label="预算金额" prop="budget"><el-input-number v-model="formData.budget" :min="0" :precision="2" style="width: 100%" /></el-form-item>
        <el-form-item label="出差事由" prop="reason"><el-input v-model="formData.reason" type="textarea" :rows="3" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="cancelDialog">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>

    <!-- 审批弹窗 -->
    <el-dialog v-model="approveVisible" :title="approveTitle" width="500px" :close-on-click-modal="false">
      <el-form :model="approveForm" label-width="100px">
        <el-form-item label="出差人"><el-input :value="approveRow?.applicant" disabled /></el-form-item>
        <el-form-item label="目的地"><el-input :value="approveRow?.destination" disabled /></el-form-item>
        <el-form-item label="出差天数">{{ approveRow?.days }} 天</el-form-item>
        <el-form-item label="预算金额">{{ formatMoney(approveRow?.budget) }}</el-form-item>
        <el-form-item :label="approveForm.approved ? '审批意见' : '驳回原因'" required>
          <el-input v-model="approveForm.comment" type="textarea" :rows="3" :placeholder="approveForm.approved ? '请输入审批意见' : '请输入驳回原因'" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="approveVisible = false">取消</el-button>
        <el-button :type="approveForm.approved ? 'success' : 'danger'" :loading="approveLoading" @click="submitApprove">确定</el-button>
      </template>
    </el-dialog>

    <!-- 详情 -->
    <el-dialog v-model="viewVisible" title="出差申请详情" width="600px">
      <el-descriptions v-if="viewRow" :column="2" border>
        <el-descriptions-item label="申请人">{{ viewRow.applicant }}</el-descriptions-item>
        <el-descriptions-item label="部门">{{ viewRow.dept }}</el-descriptions-item>
        <el-descriptions-item label="目的地">{{ viewRow.destination }}</el-descriptions-item>
        <el-descriptions-item label="出差天数">{{ viewRow.days }} 天</el-descriptions-item>
        <el-descriptions-item label="开始日期">{{ viewRow.startDate }}</el-descriptions-item>
        <el-descriptions-item label="结束日期">{{ viewRow.endDate }}</el-descriptions-item>
        <el-descriptions-item label="预算金额">{{ formatMoney(viewRow.budget) }}</el-descriptions-item>
        <el-descriptions-item label="状态">{{ viewRow.status }}</el-descriptions-item>
        <el-descriptions-item label="出差事由" :span="2">{{ viewRow.reason }}</el-descriptions-item>
        <el-descriptions-item v-if="viewRow.approver" label="审批人">{{ viewRow.approver }}</el-descriptions-item>
        <el-descriptions-item v-if="viewRow.approveTime" label="审批时间">{{ viewRow.approveTime }}</el-descriptions-item>
        <el-descriptions-item v-if="viewRow.approveComment" label="审批意见" :span="2">{{ viewRow.approveComment }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Refresh, ArrowDown } from '@element-plus/icons-vue'
import BaseSearch from '@/components/BaseSearch.vue'
import BaseTable from '@/components/BaseTable.vue'

function formatMoney(v) { if (v === null || v === undefined || v === '') return '0.00'; return Number(v).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }

const statusMap = { 0: { label: '待审批', type: 'warning' }, 1: { label: '已通过', type: 'success' }, 2: { label: '已驳回', type: 'danger' } }
const statusOptions = [{ value: 0, label: '待审批' }, { value: 1, label: '已通过' }, { value: 2, label: '已驳回' }]

const searchItems = [
  { prop: 'applicant', label: '出差人', type: 'input' },
  { prop: 'destination', label: '目的地', type: 'input' },
  { prop: 'status', label: '状态', type: 'select', options: statusOptions }
]
const columns = [
  { prop: 'applicant', label: '出差人', width: 100 },
  { prop: 'dept', label: '部门', width: 120 },
  { prop: 'destination', label: '目的地', width: 160 },
  { prop: 'startDate', label: '开始日期', width: 120 },
  { prop: 'endDate', label: '结束日期', width: 120 },
  { prop: 'days', label: '天数', width: 80, align: 'center' },
  { prop: 'budget', label: '预算金额', width: 130, align: 'right' },
  { prop: 'status', label: '状态', width: 100, slot: 'status' }
]
const loading = ref(false), tableData = ref([]), total = ref(0)
const dialogVisible = ref(false), dialogTitle = ref('新增出差申请'), submitLoading = ref(false), formRef = ref(null)
const viewVisible = ref(false), viewRow = ref(null)
const approveVisible = ref(false), approveLoading = ref(false), approveRow = ref(null), approveTitle = ref('')
const approveForm = reactive({ approved: true, comment: '' })
const queryParams = reactive({ pageNum: 1, pageSize: 10, applicant: '', destination: '', status: '' })
const formData = reactive({ id: undefined, applicant: '', dept: '', destination: '', startDate: '', endDate: '', days: 1, budget: 0, reason: '' })
const formRules = { applicant: [{ required: true, message: '请输入出差人', trigger: 'blur' }], destination: [{ required: true, message: '请输入目的地', trigger: 'blur' }] }
const names = ['张伟', '李娜', '王强', '赵敏', '刘芳', '陈晨', '黄磊', '周杰']
const depts = ['销售部', '市场部', '研发部', '采购部', '财务部']
const destinations = ['北京', '上海', '广州', '深圳', '杭州', '成都', '武汉', '南京', '苏州', '重庆']
const reasons = ['客户拜访', '参加展会', '项目实施', '技术交流', '考察学习']

async function loadData() {
  loading.value = true
  try {
    const { applicant = '', destination = '', status = '', pageNum = 1, pageSize = 10 } = queryParams
    const all = Array.from({ length: 36 }, (_, i) => {
      const stt = i % 3
      return {
        id: i + 1,
        applicant: names[i % names.length],
        dept: depts[i % depts.length],
        destination: destinations[i % destinations.length],
        startDate: `2025-${String((i % 6) + 1).padStart(2, '0')}-${String((i % 28) + 1).padStart(2, '0')}`,
        endDate: `2025-${String((i % 6) + 1).padStart(2, '0')}-${String(((i % 28) + 5) % 28 + 1).padStart(2, '0')}`,
        days: ((i % 5) + 1),
        budget: 2000 + (i * 500) % 10000,
        status: stt,
        reason: reasons[i % reasons.length],
        approver: stt !== 0 ? '张总监' : '',
        approveTime: stt !== 0 ? `2025-${String((i % 6) + 1).padStart(2, '0')}-${String((i % 28) + 1).padStart(2, '0')} 14:00:00` : '',
        approveComment: stt === 1 ? '同意，注意安全' : (stt === 2 ? '费用超标，请重新申请' : '')
      }
    })
    let filtered = all
    if (applicant) filtered = filtered.filter(x => x.applicant.includes(applicant))
    if (destination) filtered = filtered.filter(x => x.destination.includes(destination))
    if (status !== '') filtered = filtered.filter(x => x.status === Number(status))
    const start = (Number(pageNum) - 1) * Number(pageSize)
    tableData.value = filtered.slice(start, start + Number(pageSize))
    total.value = filtered.length
  } finally { loading.value = false }
}
function handleSearch(p) { Object.assign(queryParams, p, { pageNum: 1 }); loadData() }
function handleReset() { Object.keys(queryParams).forEach(k => { if (k !== 'pageNum' && k !== 'pageSize') queryParams[k] = '' }); loadData() }
function handlePageChange(p) { queryParams.pageNum = p; loadData() }
function handleSizeChange(s) { queryParams.pageSize = s; queryParams.pageNum = 1; loadData() }
function handleAdd() { dialogTitle.value = '新增出差申请'; Object.keys(formData).forEach(k => formData[k] = ''); formData.id = undefined; formData.days = 1; formData.budget = 0; dialogVisible.value = true }
function handleEdit(row) { dialogTitle.value = '编辑出差申请'; Object.assign(formData, row); dialogVisible.value = true }
function handleView(row) { viewRow.value = row; viewVisible.value = true }
function openApprove(row, approved) {
  approveRow.value = row
  approveForm.approved = approved
  approveForm.comment = ''
  approveTitle.value = approved ? '审批通过' : '审批驳回'
  approveVisible.value = true
}
async function submitApprove() {
  if (!approveForm.comment.trim()) { ElMessage.warning(approveForm.approved ? '请填写审批意见' : '请填写驳回原因'); return }
  approveLoading.value = true
  try { await new Promise(r => setTimeout(r, 500)); ElMessage.success(approveForm.approved ? '审批已通过' : '已驳回'); approveVisible.value = false; loadData() }
  finally { approveLoading.value = false }
}
function cancelDialog() { dialogVisible.value = false; formRef.value?.resetFields() }
async function handleSubmit() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return
  submitLoading.value = true
  try { await new Promise(r => setTimeout(r, 500)); ElMessage.success('提交成功'); dialogVisible.value = false; loadData() }
  catch { ElMessage.error('提交失败') }
  finally { submitLoading.value = false }
}
async function handleDelete(row) {
  await ElMessageBox.confirm(`确定删除「${row.applicant}」的出差申请?`, '提示', { type: 'warning' })
  ElMessage.success('删除成功')
  loadData()
}
function getActions(row) {
  const actions = [{ key: 'view', label: '查看', type: 'primary', handler: handleView }]
  if (row.status === 0) {
    actions.push({ key: 'approve', label: '通过', type: 'success', handler: (r) => openApprove(r, true) })
    actions.push({ key: 'reject', label: '驳回', type: 'danger', handler: (r) => openApprove(r, false) })
    actions.push({ key: 'edit', label: '编辑', type: 'primary', handler: handleEdit })
  }
  actions.push({ key: 'delete', label: '删除', type: 'danger', handler: handleDelete })
  return actions
}
function handleCommand(cmd, row) { getActions(row).find(a => a.key === cmd)?.handler(row) }
onMounted(() => loadData())
</script>
