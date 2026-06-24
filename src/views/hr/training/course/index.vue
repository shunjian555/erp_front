<template>
  <div class="page-container">
    <BaseSearch :search-items="searchItems" @search="handleSearch" @reset="handleReset" />
    <div class="table-toolbar">
      <div class="toolbar-left">
        <el-button type="primary" :icon="Plus" @click="handleAdd">新建课程</el-button>
        <el-button type="success" :icon="VideoPlay" plain @click="handlePublish">批量发布</el-button>
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
      <template #category="{ row }">
        <el-tag size="small" effect="plain">{{ row.category }}</el-tag>
      </template>
      <template #status="{ row }">
        <el-tag :type="courseStatusMap[row.status]?.type || 'info'" size="small" effect="dark">{{ row.status }}</el-tag>
      </template>
      <template #operation="{ row }">
        <MoreActions :items="rowActions(row)" :max="3" />
      </template>
    </BaseTable>

    <BaseDialog v-model="dialogVisible" :title="dialogTitle" width="620px" :confirm-loading="submitLoading" @confirm="handleSubmit" @cancel="cancelDialog">
      <BaseForm ref="formRef" v-model="formData" :form-items="formItems" :form-rules="formRules" :col-count="2" />
    </BaseDialog>

    <!-- 课程详情抽屉 -->
    <el-drawer v-model="drawerVisible" direction="rtl" size="520px">
      <template #header><span class="drawer-title">课程详情 - {{ currentRow?.courseName }}</span></template>
      <div v-if="currentRow" class="drawer-body">
        <el-descriptions :column="1" border size="small">
          <el-descriptions-item label="课程编号">{{ currentRow.courseCode }}</el-descriptions-item>
          <el-descriptions-item label="课程名称">{{ currentRow.courseName }}</el-descriptions-item>
          <el-descriptions-item label="分类"><el-tag size="small">{{ currentRow.category }}</el-tag></el-descriptions-item>
          <el-descriptions-item label="讲师">{{ currentRow.teacher }}</el-descriptions-item>
          <el-descriptions-item label="课程时长">{{ currentRow.duration }}</el-descriptions-item>
          <el-descriptions-item label="最大人数">{{ currentRow.maxParticipants }}人</el-descriptions-item>
          <el-descriptions-item label="状态"><el-tag :type="courseStatusMap[currentRow.status]?.type || 'info'" size="small">{{ currentRow.status }}</el-tag></el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ currentRow.createTime }}</el-descriptions-item>
        </el-descriptions>
        <div class="drawer-actions">
          <el-button type="primary" @click="handleArrange(currentRow)">排课安排</el-button>
          <el-button type="success" @click="handleMaterials(currentRow)">上传课件</el-button>
          <el-button type="warning" @click="handleEdit(currentRow)">编辑课程</el-button>
        </div>
      </div>
    </el-drawer>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Delete, Refresh, VideoPlay } from '@element-plus/icons-vue'
import BaseSearch from '@/components/BaseSearch.vue'
import BaseTable from '@/components/BaseTable.vue'
import BaseDialog from '@/components/BaseDialog.vue'
import BaseForm from '@/components/BaseForm.vue'
import MoreActions from '@/components/MoreActions.vue'

// 每行操作按钮配置
function rowActions(row) {
  const toggleLabel = row.status === '进行中' ? '归档' : row.status === '未开始' ? '发布' : '重新开启'
  return [
    { label: '查看', type: 'primary', important: true, onClick: () => handleView(row) },
    { label: '编辑', type: 'primary', important: true, onClick: () => handleEdit(row) },
    { label: '排课', type: 'success', important: true, onClick: () => handleArrange(row) },
    { label: '课件管理', type: 'primary', onClick: () => handleMaterials(row) },
    { label: toggleLabel, type: 'warning', onClick: () => handleToggleStatus(row) },
    { label: '删除', type: 'danger', onClick: () => handleDeleteWithConfirm(row) }
  ]
}
function handleDeleteWithConfirm(row) {
  ElMessageBox.confirm('确定删除该课程？', '提示', { type: 'warning' })
    .then(() => handleDelete(row))
    .catch(() => {})
}
import { getCourseList } from '@/api/hr'

const searchItems = [
  { prop: 'courseName', label: '课程名称', type: 'input' },
  { prop: 'category', label: '课程分类', type: 'select', options: [
    { value: '', label: '全部' }, { value: '入职培训', label: '入职培训' }, { value: '技能提升', label: '技能提升' },
    { value: '管理发展', label: '管理发展' }, { value: '安全培训', label: '安全培训' }, { value: '企业文化', label: '企业文化' }
  ]},
  { prop: 'teacher', label: '讲师', type: 'input' },
  { prop: 'status', label: '状态', type: 'select', options: [
    { value: '', label: '全部' }, { value: '进行中', label: '进行中' }, { value: '未开始', label: '未开始' }, { value: '已结束', label: '已结束' }
  ]}
]

const columns = [
  { prop: 'courseCode', label: '课程编号', width: 130 },
  { prop: 'courseName', label: '课程名称', minWidth: 160, align: 'left' },
  { prop: 'category', label: '分类', width: 100, slot: 'category' },
  { prop: 'teacher', label: '讲师', width: 90 },
  { prop: 'duration', label: '时长', width: 85, align: 'center' },
  { prop: 'maxParticipants', label: '最大人数', width: 90, align: 'center' },
  { prop: 'status', label: '状态', width: 85, slot: 'status' },
  { prop: 'createTime', label: '创建时间', width: 170 }
]

const formItems = [
  { prop: 'courseCode', label: '课程编号 *', type: 'input', span: 12 },
  { prop: 'courseName', label: '课程名称 *', type: 'input', span: 12 },
  { prop: 'category', label: '课程分类 *', type: 'select', span: 12, options: [
    { value: '入职培训', label: '入职培训' }, { value: '技能提升', label: '技能提升' },
    { value: '管理发展', label: '管理发展' }, { value: '安全培训', label: '安全培训' }, { value: '企业文化', label: '企业文化' }
  ]},
  { prop: 'teacher', label: '讲师 *', type: 'input', span: 12 },
  { prop: 'duration', label: '课程时长 *', type: 'input', span: 12, attrs: { placeholder: '如：4小时' } },
  { prop: 'maxParticipants', label: '最大人数', type: 'number', min: 1, span: 12 },
  { prop: 'targetAudience', label: '适用对象', type: 'input', span: 12, attrs: { placeholder: '如：全体员工、新员工、管理层' } },
  { prop: 'description', label: '课程简介', type: 'textarea', rows: 4, span: 24 },
  { prop: 'status', label: '状态', type: 'radio', span: 24, options: [
    { value: '未开始', label: '未开始（保存草稿）' }, { value: '进行中', label: '立即发布' }
  ]}
]
const formRules = {
  courseCode: [{ required: true, message: '请输入课程编号', trigger: 'blur' }],
  courseName: [{ required: true, message: '请输入课程名称', trigger: 'blur' }],
  category: [{ required: true, message: '请选择分类', trigger: 'change' }],
  teacher: [{ required: true, message: '请输入讲师', trigger: 'blur' }],
  duration: [{ required: true, message: '请输入课程时长', trigger: 'blur' }]
}

const courseStatusMap = { '进行中': { type: 'success' }, '未开始': { type: 'info' }, '已结束': { type: 'warning' } }

const loading = ref(false), tableData = ref([]), total = ref(0), selectedRows = ref([])
const dialogVisible = ref(false), dialogTitle = ref('新建课程'), submitLoading = ref(false), formRef = ref(null)
const drawerVisible = ref(false), currentRow = ref(null)
const queryParams = reactive({ pageNum: 1, pageSize: 10, courseName: '', category: '', teacher: '', status: '' })
const formData = reactive({
  id: undefined, courseCode: '', courseName: '', category: '技能提升', teacher: '',
  duration: '', maxParticipants: 30, targetAudience: '', description: '', status: '未开始'
})

async function loadData() {
  loading.value = true
  try { const res = await getCourseList(queryParams); tableData.value = res.data.list || []; total.value = res.data.total || 0 }
  finally { loading.value = false }
}
function handleSearch(p) { Object.assign(queryParams, p, { pageNum: 1 }); loadData() }
function handleReset() { Object.assign(queryParams, { pageNum: 1, courseName: '', category: '', teacher: '', status: '' }); loadData() }
function handlePageChange(p) { queryParams.pageNum = p; loadData() }
function handleSizeChange(s) { queryParams.pageSize = s; queryParams.pageNum = 1; loadData() }
function handleSelectionChange(r) { selectedRows.value = r }

function handleAdd() { dialogTitle.value = '新建课程'; resetForm(); dialogVisible.value = true }
function handleEdit(row) { dialogTitle.value = '编辑课程'; Object.assign(formData, { ...row }); dialogVisible.value = true }
function handleView(row) { currentRow.value = { ...row }; drawerVisible.value = true }
function resetForm() { Object.keys(formData).forEach(k => { formData[k] = k === 'category' ? '技能提升' : k === 'maxParticipants' ? 30 : k === 'status' ? '未开始' : '' }); formData.id = undefined }
function cancelDialog() { dialogVisible.value = false; formRef.value?.resetFields() }

async function handleSubmit() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return
  submitLoading.value = true
  try { await new Promise(r => setTimeout(r, 500)); ElMessage.success('操作成功'); dialogVisible.value = false; loadData() }
  catch { ElMessage.error('操作失败') } finally { submitLoading.value = false }
}

async function handleDelete(row) { ElMessage.success('课程已删除'); loadData() }
async function handleBatchDelete() { if (!selectedRows.value.length) return ElMessage.warning('请选择数据'); ElMessage.success('批量删除成功'); loadData() }
function handlePublish() { if (!selectedRows.value.length) return ElMessage.warning('请选择数据'); ElMessage.success('课程已发布') }
function handleArrange(row) { ElMessage.success(`正在为「${row.courseName}」排课...`) }
function handleMaterials(row) { ElMessage.info(`打开「${row.courseName}」的课件管理`) }
function handleToggleStatus(row) { ElMessage.success('状态更新成功'); loadData() }

onMounted(() => loadData())
</script>

<style lang="scss" scoped>
.page-container .table-toolbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; padding: 14px 18px; background: #fff; border-radius: var(--border-radius-base); .toolbar-left { display: flex; gap: 10px; } .toolbar-right { display: flex; gap: 8px; } }
.drawer-title { font-size: 16px; font-weight: 600; }
.drawer-body .drawer-actions { margin-top: 20px; display: flex; gap: 10px; }
</style>
