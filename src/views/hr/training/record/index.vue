<template>
  <div class="page-container">
    <BaseSearch :search-items="searchItems" @search="handleSearch" @reset="handleReset" />
    <div class="table-toolbar">
      <div class="toolbar-left">
        <el-button type="primary" :icon="Plus" @click="handleAdd">添加记录</el-button>
        <el-button type="success" :icon="Download" plain @click="handleExport">导出报表</el-button>
        <el-button type="warning" :icon="Ticket" plain @click="handleCertificate">证书管理</el-button>
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
      <template #result="{ row }">
        <el-tag :type="resultMap[row.result]?.type || 'info'" size="small" effect="dark">{{ row.result }}</el-tag>
      </template>
      <template #score="{ row }">
        <el-progress :percentage="Math.min(row.score, 100)" :stroke-width="8" :color="row.score >= 80 ? '#67C23A' : row.score >= 60 ? '#E6A23C' : '#F56C6C'" style="width: 70px" />
      </template>
      <template #certificate="{ row }">
        <el-tag :type="row.certificate === '有' ? 'success' : 'info'" size="small" effect="plain">{{ row.certificate === '有' ? '已发证' : '无' }}</el-tag>
      </template>
      <template #operation="{ row }">
        <MoreActions :items="rowActions(row)" :max="3" />
      </template>
    </BaseTable>

    <BaseDialog v-model="dialogVisible" :title="dialogTitle" width="560px" :confirm-loading="submitLoading" @confirm="handleSubmit" @cancel="cancelDialog">
      <BaseForm ref="formRef" v-model="formData" :form-items="formItems" :form-rules="formRules" :col-count="2" />
    </BaseDialog>

    <el-drawer v-model="drawerVisible" direction="rtl" size="480px">
      <template #header><span class="drawer-title">培训记录详情</span></template>
      <div v-if="currentRow" class="drawer-body">
        <el-descriptions :column="1" border size="small">
          <el-descriptions-item label="员工姓名">{{ currentRow.employeeName }} ({{ currentRow.empNo }})</el-descriptions-item>
          <el-descriptions-item label="所属部门">{{ currentRow.deptName }}</el-descriptions-item>
          <el-descriptions-item label="培训课程">{{ currentRow.courseName }}</el-descriptions-item>
          <el-descriptions-item label="培训日期">{{ currentRow.trainDate }}</el-descriptions-item>
          <el-descriptions-item label="培训时长">{{ currentRow.duration }}</el-descriptions-item>
          <el-descriptions-item label="培训结果"><el-tag :type="resultMap[currentRow.result]?.type || 'info'" size="small">{{ currentRow.result }}</el-tag></el-descriptions-item>
          <el-descriptions-item label="成绩分数"><el-progress :percentage="Math.min(currentRow.score, 100)" :color="currentRow.score >= 80 ? '#67C23A' : currentRow.score >= 60 ? '#E6A23C' : '#F56C6C'" style="width: 120px" /></el-descriptions-item>
          <el-descriptions-item label="证书状态">{{ currentRow.certificate === '有' ? '已发放' : '未发放' }}</el-descriptions-item>
        </el-descriptions>
        <div class="drawer-actions">
          <el-button type="success" v-if="currentRow.certificate !== '有'" @click="handleIssueCert(currentRow)">发放证书</el-button>
          <el-button type="warning" v-if="currentRow.result === '不合格'" @click="handleRetrain(currentRow)">安排重训</el-button>
        </div>
      </div>
    </el-drawer>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Delete, Refresh, Download, Ticket } from '@element-plus/icons-vue'
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
    { label: '发放证书', type: 'success', important: true, hidden: row.certificate === '有' || row.result === '不合格', onClick: () => handleIssueCert(row) },
    { label: '重新培训', type: 'warning', hidden: row.result !== '不合格', onClick: () => handleRetrain(row) },
    { label: '删除', type: 'danger', onClick: () => handleDeleteWithConfirm(row) }
  ]
}
function handleDeleteWithConfirm(row) {
  ElMessageBox.confirm('确定删除该培训记录？', '提示', { type: 'warning' })
    .then(() => handleDelete(row))
    .catch(() => {})
}
import { getTrainingRecordList } from '@/api/hr'

const searchItems = [
  { prop: 'employeeName', label: '员工姓名', type: 'input' },
  { prop: 'empNo', label: '工号', type: 'input' },
  { prop: 'deptName', label: '部门', type: 'select', options: [
    { value: '', label: '全部' }, { value: '技术部', label: '技术部' }, { value: '销售部', label: '销售部' },
    { value: '财务部', label: '财务部' }, { value: '生产部', label: '生产部' }
  ]},
  { prop: 'courseName', label: '培训课程', type: 'input' },
  { prop: 'result', label: '培训结果', type: 'select', options: [
    { value: '', label: '全部' }, { value: '合格', label: '合格' }, { value: '优秀', label: '优秀' }, { value: '不合格', label: '不合格' }
  ]}
]

const columns = [
  { prop: 'employeeName', label: '员工姓名', width: 95 },
  { prop: 'empNo', label: '工号', width: 115 },
  { prop: 'deptName', label: '部门', width: 95 },
  { prop: 'courseName', label: '培训课程', minWidth: 150 },
  { prop: 'trainDate', label: '培训日期', width: 110 },
  { prop: 'duration', label: '时长', width: 75, align: 'center' },
  { prop: 'result', label: '结果', width: 80, slot: 'result' },
  { prop: 'score', label: '分数', width: 100, slot: 'score' },
  { prop: 'certificate', label: '证书', width: 80, slot: 'certificate' }
]

const formItems = [
  { prop: 'employeeName', label: '员工姓名 *', type: 'input', span: 12 },
  { prop: 'empNo', label: '工号 *', type: 'input', span: 12 },
  { prop: 'deptName', label: '部门', type: 'select', span: 12, options: [
    { value: '技术部', label: '技术部' }, { value: '销售部', label: '销售部' }, { value: '财务部', label: '财务部' }, { value: '生产部', label: '生产部' }
  ]},
  { prop: 'courseName', label: '培训课程 *', type: 'input', span: 12 },
  { prop: 'trainDate', label: '培训日期 *', type: 'date', span: 12 },
  { prop: 'duration', label: '培训时长 *', type: 'input', span: 12, attrs: { placeholder: '如：4小时' } },
  { prop: 'result', label: '培训结果 *', type: 'select', span: 12, options: [
    { value: '优秀', label: '优秀' }, { value: '合格', label: '合格' }, { value: '不合格', label: '不合格' }
  ]},
  { prop: 'score', label: '成绩分数', type: 'number', min: 0, max: 100, span: 12 },
  { prop: 'remark', label: '备注', type: 'textarea', rows: 3, span: 24 }
]
const formRules = {
  employeeName: [{ required: true, message: '请输入员工姓名', trigger: 'blur' }],
  empNo: [{ required: true, message: '请输入工号', trigger: 'blur' }],
  courseName: [{ required: true, message: '请输入培训课程', trigger: 'blur' }],
  trainDate: [{ required: true, message: '请选择培训日期', trigger: 'change' }],
  duration: [{ required: true, message: '请输入培训时长', trigger: 'blur' }],
  result: [{ required: true, message: '请选择培训结果', trigger: 'change' }]
}

const resultMap = { '优秀': { type: 'success' }, '合格': { type: 'primary' }, '不合格': { type: 'danger' } }

const loading = ref(false), tableData = ref([]), total = ref(0), selectedRows = ref([])
const dialogVisible = ref(false), dialogTitle = ref('添加培训记录'), submitLoading = ref(false), formRef = ref(null)
const drawerVisible = ref(false), currentRow = ref(null)
const queryParams = reactive({ pageNum: 1, pageSize: 10, employeeName: '', empNo: '', deptName: '', courseName: '', result: '' })
const formData = reactive({ id: undefined, employeeName: '', empNo: '', deptName: '', courseName: '', trainDate: '', duration: '', result: '合格', score: undefined, remark: '' })

async function loadData() {
  loading.value = true
  try { const res = await getTrainingRecordList(queryParams); tableData.value = res.data.list || []; total.value = res.data.total || 0 }
  finally { loading.value = false }
}
function handleSearch(p) { Object.assign(queryParams, p, { pageNum: 1 }); loadData() }
function handleReset() { Object.assign(queryParams, { pageNum: 1, employeeName: '', empNo: '', deptName: '', courseName: '', result: '' }); loadData() }
function handlePageChange(p) { queryParams.pageNum = p; loadData() }
function handleSizeChange(s) { queryParams.pageSize = s; queryParams.pageNum = 1; loadData() }
function handleSelectionChange(r) { selectedRows.value = r }

function handleAdd() { dialogTitle.value = '添加培训记录'; resetForm(); dialogVisible.value = true }
function handleEdit(row) { dialogTitle.value = '编辑培训记录'; Object.assign(formData, { ...row }); dialogVisible.value = true }
function handleView(row) { currentRow.value = { ...row }; drawerVisible.value = true }
function resetForm() { Object.keys(formData).forEach(k => { formData[k] = k === 'result' ? '合格' : '' }); formData.id = undefined }
function cancelDialog() { dialogVisible.value = false; formRef.value?.resetFields() }

async function handleSubmit() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return
  submitLoading.value = true
  try { await new Promise(r => setTimeout(r, 400)); ElMessage.success('操作成功'); dialogVisible.value = false; loadData() }
  catch { ElMessage.error('操作失败') } finally { submitLoading.value = false }
}

async function handleDelete(row) { ElMessage.success('记录已删除'); loadData() }
async function handleBatchDelete() { if (!selectedRows.value.length) return ElMessage.warning('请选择数据'); ElMessage.success('批量删除成功'); loadData() }
function handleExport() { ElMessage.success('正在导出培训记录报表...') }
function handleCertificate() { ElMessage.info('打开证书模板管理') }
function handleIssueCert(row) { ElMessage.success(`已为 ${row.employeeName} 发放「${row.courseName}」培训证书`); loadData() }
function handleRetrain(row) { ElMessage.info(`为 ${row.employeeName} 安排重新培训`) }

onMounted(() => loadData())
</script>

<style lang="scss" scoped>
.page-container .table-toolbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; padding: 14px 18px; background: #fff; border-radius: var(--border-radius-base); .toolbar-left { display: flex; gap: 10px; } .toolbar-right { display: flex; gap: 8px; } }
.drawer-title { font-size: 16px; font-weight: 600; }
.drawer-body .drawer-actions { margin-top: 20px; display: flex; gap: 10px; }
</style>
