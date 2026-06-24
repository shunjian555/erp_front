<template>
  <div class="page-container">
    <BaseSearch :search-items="searchItems" @search="handleSearch" @reset="handleReset" />
    <div class="table-toolbar">
      <div class="toolbar-left">
        <el-button type="primary" :icon="Plus" @click="handleAdd">创建面试</el-button>
        <el-button type="success" :icon="Check" plain @click="handleBatchPass">批量通过</el-button>
        <el-button type="warning" :icon="EditPen" plain @click="handleBatchScore">批量评分</el-button>
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
      <template #interviewRound="{ row }">
        <el-tag :type="roundMap[row.interviewRound]?.type || 'info'" size="small" effect="dark">{{ row.interviewRound }}</el-tag>
      </template>
      <template #status="{ row }">
        <el-tag :type="interviewStatusMap[row.status]?.type || 'info'" size="small">{{ row.status }}</el-tag>
      </template>
      <template #score="{ row }">
        <el-progress :percentage="Math.min(row.score, 100)" :stroke-width="8" :color="scoreColor(row.score)" style="width: 80px" />
      </template>
      <template #operation="{ row }">
        <MoreActions :items="rowActions(row)" :max="3" />
      </template>
    </BaseTable>

    <!-- 新增/编辑弹窗 -->
    <BaseDialog v-model="dialogVisible" :title="dialogTitle" width="580px" :confirm-loading="submitLoading" @confirm="handleSubmit" @cancel="cancelDialog">
      <BaseForm ref="formRef" v-model="formData" :form-items="formItems" :form-rules="formRules" :col-count="2" />
    </BaseDialog>

    <!-- 评分弹窗 -->
    <BaseDialog v-model="scoreDialogVisible" title="面试评分" width="520px" :confirm-loading="submitLoading" @confirm="handleSubmitScore" @cancel="scoreDialogVisible = false">
      <el-alert title="请根据面试表现进行客观评分（0-100分）" type="info" :closable="false" show-icon style="margin-bottom: 16px" />
      <BaseForm ref="scoreFormRef" v-model="scoreFormData" :form-items="scoreFormItems" :form-rules="scoreFormRules" :col-count="1" />
    </BaseDialog>

    <!-- 详情抽屉 -->
    <el-drawer v-model="drawerVisible" direction="rtl" size="500px">
      <template #header><span class="drawer-title">面试详情</span></template>
      <div v-if="currentRow" class="drawer-body">
        <el-descriptions :column="1" border size="small">
          <el-descriptions-item label="候选人">{{ currentRow.candidateName }}</el-descriptions-item>
          <el-descriptions-item label="应聘职位">{{ currentRow.applyPosition }}</el-descriptions-item>
          <el-descriptions-item label="面试轮次"><el-tag :type="roundMap[currentRow.interviewRound]?.type || 'info'" size="small">{{ currentRow.interviewRound }}</el-tag></el-descriptions-item>
          <el-descriptions-item label="面试官">{{ currentRow.interviewer }}</el-descriptions-item>
          <el-descriptions-item label="面试时间">{{ currentRow.interviewDate }}</el-descriptions-item>
          <el-descriptions-item label="状态"><el-tag :type="interviewStatusMap[currentRow.status]?.type || 'info'" size="small">{{ currentRow.status }}</el-tag></el-descriptions-item>
          <el-descriptions-item label="得分"><el-progress :percentage="Math.min(currentRow.score, 100)" :color="scoreColor(currentRow.score)" style="width: 120px" /></el-descriptions-item>
          <el-descriptions-item label="评价意见">{{ currentRow.evaluation || '-' }}</el-descriptions-item>
        </el-descriptions>
      </div>
    </el-drawer>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Refresh, Check, EditPen } from '@element-plus/icons-vue'
import BaseSearch from '@/components/BaseSearch.vue'
import BaseTable from '@/components/BaseTable.vue'
import BaseDialog from '@/components/BaseDialog.vue'
import BaseForm from '@/components/BaseForm.vue'
import MoreActions from '@/components/MoreActions.vue'

// 每行操作按钮配置
function rowActions(row) {
  return [
    { label: '详情', type: 'primary', important: true, onClick: () => handleView(row) },
    { label: '编辑', type: 'primary', important: true, onClick: () => handleEdit(row) },
    { label: '开始面试', type: 'success', important: true, hidden: row.status !== '待面试', onClick: () => handleStart(row) },
    { label: '评分', type: 'primary', hidden: row.status === '待面试' || row.status === '已取消', onClick: () => handleScore(row) },
    { label: '改期', type: 'warning', onClick: () => handleReschedule(row) },
    { label: '下一轮', type: 'warning', hidden: row.status !== '通过', onClick: () => handleNextRound(row) },
    { label: '取消', type: 'danger', onClick: () => handleCancelWithConfirm(row) }
  ]
}
function handleCancelWithConfirm(row) {
  ElMessageBox.confirm('确定取消该面试？', '提示', { type: 'warning' })
    .then(() => handleCancel(row))
    .catch(() => {})
}
import { getInterviewList } from '@/api/hr'

const searchItems = [
  { prop: 'candidateName', label: '候选人', type: 'input' },
  { prop: 'applyPosition', label: '应聘职位', type: 'input' },
  { prop: 'interviewRound', label: '面试轮次', type: 'select', options: [
    { value: '', label: '全部' }, { value: '初试', label: '初试' }, { value: '复试', label: '复试' },
    { value: '终试', label: '终试' }, { value: 'HR面', label: 'HR面' }
  ]},
  { prop: 'status', label: '状态', type: 'select', options: [
    { value: '', label: '全部' }, { value: '待面试', label: '待面试' }, { value: '面试中', label: '面试中' },
    { value: '通过', label: '通过' }, { value: '未通过', label: '未通过' }, { value: '已取消', label: '已取消' }
  ]}
]

const columns = [
  { prop: 'candidateName', label: '候选人', width: 95 },
  { prop: 'applyPosition', label: '应聘职位', width: 140 },
  { prop: 'interviewRound', label: '轮次', width: 85, slot: 'interviewRound' },
  { prop: 'interviewer', label: '面试官', width: 90 },
  { prop: 'interviewDate', label: '面试时间', width: 170 },
  { prop: 'status', label: '状态', width: 90, slot: 'status' },
  { prop: 'score', label: '得分', width: 120, slot: 'score' },
  { prop: 'evaluation', label: '评价', minWidth: 180, showOverflowTooltip: true }
]

const formItems = [
  { prop: 'candidateName', label: '候选人 *', type: 'input', span: 12 },
  { prop: 'applyPosition', label: '应聘职位 *', type: 'input', span: 12 },
  { prop: 'interviewRound', label: '面试轮次 *', type: 'select', span: 12, options: [
    { value: '初试', label: '初试' }, { value: '复试', label: '复试' }, { value: '终试', label: '终试' }, { value: 'HR面', label: 'HR面' }
  ]},
  { prop: 'interviewer', label: '面试官 *', type: 'input', span: 12 },
  { prop: 'interviewDate', label: '面试时间 *', type: 'datetime', span: 12 },
  { prop: 'location', label: '面试地点', type: 'input', span: 12 },
  { prop: 'remark', label: '备注', type: 'textarea', rows: 3, span: 24 }
]
const formRules = {
  candidateName: [{ required: true, message: '请输入候选人姓名', trigger: 'blur' }],
  applyPosition: [{ required: true, message: '请输入应聘职位', trigger: 'blur' }],
  interviewRound: [{ required: true, message: '请选择面试轮次', trigger: 'change' }],
  interviewer: [{ required: true, message: '请输入面试官', trigger: 'blur' }],
  interviewDate: [{ required: true, message: '请选择面试时间', trigger: 'change' }]
}

const scoreFormItems = [
  { prop: 'professionalScore', label: '专业能力 (0-100)', type: 'number', min: 0, max: 100 },
  { prop: 'communicationScore', label: '沟通表达 (0-100)', type: 'number', min: 0, max: 100 },
  { prop: 'attitudeScore', label: '态度积极性 (0-100)', type: 'number', min: 0, max: 100 },
  { prop: 'teamworkScore', label: '团队协作 (0-100)', type: 'number', min: 0, max: 100 },
  { prop: 'overallComment', label: '综合评价', type: 'textarea', rows: 3 }
]
const scoreFormRules = {
  professionalScore: [{ required: true, message: '请评分', trigger: 'blur' }],
  communicationScore: [{ required: true, message: '请评分', trigger: 'blur' }]
}
const roundMap = { '初试': { type: 'primary' }, '复试': { type: 'warning' }, '终试': { type: 'danger' }, 'HR面': { type: 'success' } }
const interviewStatusMap = { '待面试': { type: 'info' }, '面试中': { type: 'primary' }, '通过': { type: 'success' }, '未通过': { type: 'danger' }, '已取消': { type: 'info' } }

function scoreColor(s) { if (s >= 90) return '#67C23A'; if (s >= 70) return '#409EFF'; if (s >= 60) return '#E6A23C'; return '#F56C6C' }

const loading = ref(false), tableData = ref([]), total = ref(0), selectedRows = ref([])
const dialogVisible = ref(false), dialogTitle = ref('创建面试'), submitLoading = ref(false), formRef = ref(null)
const drawerVisible = ref(false), currentRow = ref(null)
const scoreDialogVisible = ref(false), scoreFormRef = ref(null)
const queryParams = reactive({ pageNum: 1, pageSize: 10, candidateName: '', applyPosition: '', interviewRound: '', status: '' })
const formData = reactive({ id: undefined, candidateName: '', applyPosition: '', interviewRound: '初试', interviewer: '', interviewDate: '', location: '', remark: '' })
const scoreFormData = reactive({ professionalScore: undefined, communicationScore: undefined, attitudeScore: undefined, teamworkScore: undefined, overallComment: '' })

async function loadData() {
  loading.value = true
  try { const res = await getInterviewList(queryParams); tableData.value = res.data.list || []; total.value = res.data.total || 0 }
  finally { loading.value = false }
}
function handleSearch(p) { Object.assign(queryParams, p, { pageNum: 1 }); loadData() }
function handleReset() { Object.assign(queryParams, { pageNum: 1, candidateName: '', applyPosition: '', interviewRound: '', status: '' }); loadData() }
function handlePageChange(p) { queryParams.pageNum = p; loadData() }
function handleSizeChange(s) { queryParams.pageSize = s; queryParams.pageNum = 1; loadData() }
function handleSelectionChange(r) { selectedRows.value = r }

function handleAdd() { dialogTitle.value = '创建面试'; resetForm(); dialogVisible.value = true }
function handleEdit(row) { dialogTitle.value = '编辑面试'; Object.assign(formData, { ...row }); dialogVisible.value = true }
function handleView(row) { currentRow.value = { ...row }; drawerVisible.value = true }
function resetForm() { Object.keys(formData).forEach(k => { formData[k] = k === 'interviewRound' ? '初试' : '' }); formData.id = undefined }
function cancelDialog() { dialogVisible.value = false; formRef.value?.resetFields() }

async function handleSubmit() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return
  submitLoading.value = true
  try { await new Promise(r => setTimeout(r, 500)); ElMessage.success('操作成功'); dialogVisible.value = false; loadData() }
  catch { ElMessage.error('操作失败') } finally { submitLoading.value = false }
}

function handleStart(row) { ElMessage.success(`面试「${row.candidateName} - ${row.interviewRound}」已开始`) }
function handleScore(row) { currentRow.value = row; Object.assign(scoreFormData, { professionalScore: undefined, communicationScore: undefined, attitudeScore: undefined, teamworkScore: undefined, overallComment: '' }); scoreDialogVisible.value = true }
async function handleSubmitScore() {
  const valid = await scoreFormRef.value?.validate().catch(() => false)
  if (!valid) return
  submitLoading.value = true
  try { await new Promise(r => setTimeout(r, 400)); ElMessage.success('评分成功'); scoreDialogVisible.value = false; loadData() }
  catch { ElMessage.error('操作失败') } finally { submitLoading.value = false }
}
function handleReschedule(row) { ElMessage.info(`安排改期：${row.candidateName}`) }
function handleNextRound(row) { ElMessage.success(`已将「${row.candidateName}」进入下一轮面试`) }
async function handleCancel(row) { ElMessage.success('面试已取消'); loadData() }
async function handleBatchPass() { if (!selectedRows.value.length) return ElMessage.warning('请选择数据'); ElMessage.success(`已通过 ${selectedRows.value.length} 条面试`) }
function handleBatchScore() { if (!selectedRows.value.length) return ElMessage.warning('请选择数据'); ElMessage.info('打开批量评分面板') }

onMounted(() => loadData())
</script>

<style lang="scss" scoped>
.page-container .table-toolbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; padding: 14px 18px; background: #fff; border-radius: var(--border-radius-base); .toolbar-left { display: flex; gap: 10px; } .toolbar-right { display: flex; gap: 8px; } }
.drawer-title { font-size: 16px; font-weight: 600; }
</style>
