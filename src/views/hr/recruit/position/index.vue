<template>
  <div class="page-container">
    <BaseSearch :search-items="searchItems" @search="handleSearch" @reset="handleReset" />
    <div class="table-toolbar">
      <div class="toolbar-left">
        <el-button type="primary" :icon="Plus" @click="handleAdd">发布职位</el-button>
        <el-button type="success" :icon="CopyDocument" plain @click="handleCopy">复制职位</el-button>
        <el-button type="danger" :icon="Delete" plain @click="handleBatchDelete">批量关闭</el-button>
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
        <el-tag :type="statusTypeMap[row.status]" effect="dark" size="small">{{ row.status }}</el-tag>
      </template>
      <template #operation="{ row }">
        <MoreActions :items="rowActions(row)" :max="3" />
      </template>
    </BaseTable>

    <BaseDialog v-model="dialogVisible" :title="dialogTitle" width="650px" :confirm-loading="submitLoading" @confirm="handleSubmit" @cancel="cancelDialog">
      <BaseForm ref="formRef" v-model="formData" :form-items="formItems" :form-rules="formRules" :col-count="2" />
    </BaseDialog>

    <!-- 职位详情抽屉 -->
    <el-drawer v-model="drawerVisible" direction="rtl" size="500px">
      <template #header><span class="drawer-title">职位详情 - {{ currentRow?.title }}</span></template>
      <div v-if="currentRow" class="drawer-body">
        <el-descriptions :column="1" border size="small">
          <el-descriptions-item label="职位编号">{{ currentRow.jobCode }}</el-descriptions-item>
          <el-descriptions-item label="职位名称">{{ currentRow.title }}</el-descriptions-item>
          <el-descriptions-item label="所属部门">{{ currentRow.deptName }}</el-descriptions-item>
          <el-descriptions-item label="招聘人数">{{ currentRow.recruitCount }}人</el-descriptions-item>
          <el-descriptions-item label="已录用">{{ currentRow.hiredCount }}人</el-descriptions-item>
          <el-descriptions-item label="薪资范围">¥{{ currentRow.salaryMin }} - ¥{{ currentRow.salaryMax }}</el-descriptions-item>
          <el-descriptions-item label="经验要求">{{ currentRow.experience }}</el-descriptions-item>
          <el-descriptions-item label="学历要求">{{ currentRow.education }}</el-descriptions-item>
          <el-descriptions-item label="发布人">{{ currentRow.publisher }}</el-descriptions-item>
          <el-descriptions-item label="发布时间">{{ currentRow.publishDate }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="statusTypeMap[currentRow.status]" size="small">{{ currentRow.status }}</el-tag>
          </el-descriptions-item>
        </el-descriptions>
        <div class="drawer-btns">
          <el-button type="primary" @click="handleViewResumes(currentRow)">查看简历 ({{ currentRow.resumeCount || 0 }})</el-button>
          <el-button type="success" @click="handleShare(currentRow)">分享职位</el-button>
        </div>
      </div>
    </el-drawer>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Delete, Refresh, CopyDocument } from '@element-plus/icons-vue'
import BaseSearch from '@/components/BaseSearch.vue'
import BaseTable from '@/components/BaseTable.vue'
import BaseDialog from '@/components/BaseDialog.vue'
import BaseForm from '@/components/BaseForm.vue'
import MoreActions from '@/components/MoreActions.vue'
import { getPositionList } from '@/api/hr'

// 每行操作按钮配置
function rowActions(row) {
  return [
    { label: '查看', type: 'primary', important: true, onClick: () => handleView(row) },
    { label: '编辑', type: 'primary', important: true, onClick: () => handleEdit(row) },
    { label: '刷新', type: 'primary', important: true, onClick: () => handleRefresh(row) },
    { label: row.status === '招聘中' ? '暂停' : '重新开启', type: 'warning', onClick: () => handleToggleStatus(row) },
    { label: '关闭', type: 'danger', onClick: () => handleCloseWithConfirm(row) }
  ]
}
function handleCloseWithConfirm(row) {
  ElMessageBox.confirm('确定关闭该职位？', '提示', { type: 'warning' })
    .then(() => handleClose(row))
    .catch(() => {})
}

const searchItems = [
  { prop: 'title', label: '职位名称', type: 'input' },
  { prop: 'deptName', label: '所属部门', type: 'select', options: [
    { value: '', label: '全部' }, { value: '技术部', label: '技术部' }, { value: '销售部', label: '销售部' },
    { value: '财务部', label: '财务部' }, { value: '人力资源部', label: '人力资源部' }
  ]},
  { prop: 'status', label: '状态', type: 'select', options: [
    { value: '', label: '全部' }, { value: '招聘中', label: '招聘中' }, { value: '已暂停', label: '已暂停' }, { value: '已关闭', label: '已关闭' }
  ]}
]

const columns = [
  { prop: 'jobCode', label: '职位编号', width: 130 },
  { prop: 'title', label: '职位名称', minWidth: 150, align: 'left' },
  { prop: 'deptName', label: '部门', width: 110 },
  { prop: 'recruitCount', label: '招聘数', width: 80, align: 'center' },
  { prop: 'hiredCount', label: '已录用', width: 80, align: 'center' },
  { prop: 'salaryMin', label: '最低薪资', width: 100, align: 'right' },
  { prop: 'salaryMax', label: '最高薪资', width: 100, align: 'right' },
  { prop: 'experience', label: '经验要求', width: 95 },
  { prop: 'education', label: '学历要求', width: 85 },
  { prop: 'publisher', label: '发布人', width: 90 },
  { prop: 'status', label: '状态', width: 90, slot: 'status' },
  { prop: 'publishDate', label: '发布时间', width: 170 }
]

const formItems = [
  { prop: 'title', label: '职位名称 *', type: 'input', span: 12 },
  { prop: 'deptName', label: '所属部门 *', type: 'select', span: 12, options: [
    { value: '技术部', label: '技术部' }, { value: '销售部', label: '销售部' }, { value: '财务部', label: '财务部' },
    { value: '人力资源部', label: '人力资源部' }, { value: '生产部', label: '生产部' }
  ]},
  { prop: 'recruitCount', label: '招聘人数 *', type: 'number', min: 1, span: 12 },
  { prop: 'experience', label: '经验要求', type: 'select', span: 12, options: [
    { value: '不限', label: '不限' }, { value: '1-3年', label: '1-3年' }, { value: '3-5年', label: '3-5年' }, { value: '5年以上', label: '5年以上' }
  ]},
  { prop: 'education', label: '学历要求 *', type: 'select', span: 12, options: [
    { value: '不限', label: '不限' }, { value: '大专', label: '大专' }, { value: '本科', label: '本科' }, { value: '硕士', label: '硕士' }
  ]},
  { prop: 'salaryMin', label: '最低薪资(元)', type: 'number', min: 0, precision: 0, span: 12 },
  { prop: 'salaryMax', label: '最高薪资(元)', type: 'number', min: 0, precision: 0, span: 12 },
  { prop: 'description', label: '职位描述', type: 'textarea', rows: 4, span: 24 },
  { prop: 'requirement', label: '任职要求', type: 'textarea', rows: 4, span: 24 },
  { prop: 'status', label: '发布状态', type: 'radio', span: 24, options: [
    { value: '招聘中', label: '立即发布' }, { value: '已暂停', label: '暂存草稿' }
  ]}
]
const formRules = {
  title: [{ required: true, message: '请输入职位名称', trigger: 'blur' }],
  deptName: [{ required: true, message: '请选择部门', trigger: 'change' }],
  recruitCount: [{ required: true, message: '请输入招聘人数', trigger: 'blur' }],
  education: [{ required: true, message: '请选择学历要求', trigger: 'change' }]
}

const statusTypeMap = { '招聘中': 'success', '已暂停': 'warning', '已关闭': 'danger' }

const loading = ref(false), tableData = ref([]), total = ref(0), selectedRows = ref([])
const dialogVisible = ref(false), dialogTitle = ref('发布新职位'), submitLoading = ref(false), formRef = ref(null)
const drawerVisible = ref(false), currentRow = ref(null)
const queryParams = reactive({ pageNum: 1, pageSize: 10, title: '', deptName: '', status: '' })
const formData = reactive({
  id: undefined, title: '', deptName: '', recruitCount: 1, experience: '不限',
  education: '本科', salaryMin: undefined, salaryMax: undefined,
  description: '', requirement: '', status: '招聘中'
})

async function loadData() {
  loading.value = true
  try { const res = await getPositionList(queryParams); tableData.value = res.data.list || []; total.value = res.data.total || 0 }
  finally { loading.value = false }
}
function handleSearch(p) { Object.assign(queryParams, p, { pageNum: 1 }); loadData() }
function handleReset() { Object.assign(queryParams, { pageNum: 1, title: '', deptName: '', status: '' }); loadData() }
function handlePageChange(p) { queryParams.pageNum = p; loadData() }
function handleSizeChange(s) { queryParams.pageSize = s; queryParams.pageNum = 1; loadData() }
function handleSelectionChange(r) { selectedRows.value = r }

function handleAdd() { dialogTitle.value = '发布新职位'; resetForm(); dialogVisible.value = true }
function handleEdit(row) { dialogTitle.value = '编辑职位'; Object.assign(formData, { ...row }); dialogVisible.value = true }
function handleView(row) { currentRow.value = { ...row }; drawerVisible.value = true }
function resetForm() { Object.keys(formData).forEach(k => { formData[k] = k === 'recruitCount' ? 1 : k === 'status' ? '招聘中' : k === 'experience' ? '不限' : k === 'education' ? '本科' : '' }); formData.id = undefined }
function cancelDialog() { dialogVisible.value = false; formRef.value?.resetFields() }

async function handleSubmit() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return
  submitLoading.value = true
  try { await new Promise(r => setTimeout(r, 500)); ElMessage.success('操作成功'); dialogVisible.value = false; loadData() }
  catch { ElMessage.error('操作失败') } finally { submitLoading.value = false }
}

async function handleClose(row) { ElMessage.success('职位已关闭'); loadData() }
async function handleToggleStatus(row) {
  const newStatus = row.status === '招聘中' ? '已暂停' : '招聘中'
  ElMessage.success(`职位已${newStatus === '招聘中' ? '重新开启' : '暂停'}发布`); loadData()
}
async function handleBatchDelete() {
  if (!selectedRows.value.length) return ElMessage.warning('请选择数据')
  await ElMessageBox.confirm(`确定关闭选中的 ${selectedRows.value.length} 个职位？`, '提示', { type: 'warning' })
  ElMessage.success('批量操作成功'); loadData()
}
function handleCopy() { if (!selectedRows.value.length) return ElMessage.warning('请先选择要复制的职位'); ElMessage.success('职位复制成功，请在编辑后发布') }
function handleRefresh(row) { ElMessage.success('职位信息已刷新') }
function handleViewResumes(row) { ElMessage.info(`跳转到「${row.title}」的简历列表`) }
function handleShare(row) { ElMessage.success('职位链接已复制到剪贴板') }

onMounted(() => loadData())
</script>

<style lang="scss" scoped>
.page-container .table-toolbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; padding: 14px 18px; background: #fff; border-radius: var(--border-radius-base); .toolbar-left { display: flex; gap: 10px; } .toolbar-right { display: flex; gap: 8px; } }
.drawer-title { font-size: 16px; font-weight: 600; }
.drawer-body { .drawer-btns { margin-top: 20px; display: flex; gap: 10px; } }
</style>
