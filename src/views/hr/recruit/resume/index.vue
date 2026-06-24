<template>
  <div class="page-container">
    <BaseSearch :search-items="searchItems" @search="handleSearch" @reset="handleReset" />
    <div class="table-toolbar">
      <div class="toolbar-left">
        <el-button type="primary" :icon="Plus" @click="handleAdd">录入简历</el-button>
        <el-button type="success" :icon="Check" plain @click="handleBatchPass">批量通过</el-button>
        <el-button type="warning" :icon="CircleClose" plain @click="handleBatchReject">批量拒绝</el-button>
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
        <el-tag :type="resumeStatusMap[row.status]?.type || 'info'" size="small" effect="dark">{{ row.status }}</el-tag>
      </template>
      <template #source="{ row }">
        <el-tag size="small" effect="plain" type="info">{{ row.source }}</el-tag>
      </template>
      <template #operation="{ row }">
        <MoreActions :items="rowActions(row)" :max="3" />
      </template>
    </BaseTable>

    <!-- 新增/编辑简历弹窗 -->
    <BaseDialog v-model="dialogVisible" :title="dialogTitle" width="700px" :confirm-loading="submitLoading" @confirm="handleSubmit" @cancel="cancelDialog">
      <BaseForm ref="formRef" v-model="formData" :form-items="formItems" :form-rules="formRules" :col-count="2" />
    </BaseDialog>

    <!-- 简历详情抽屉 -->
    <el-drawer v-model="drawerVisible" direction="rtl" size="560px" :destroy-on-close="true">
      <template #header>
        <div class="drawer-header">
          <span class="drawer-title">简历详情</span>
          <el-tag :type="resumeStatusMap[currentRow?.status]?.type || 'info'">{{ currentRow?.status }}</el-tag>
        </div>
      </template>
      <div class="drawer-body" v-if="currentRow">
        <div class="profile-card">
          <div class="avatar-area">
            <el-avatar :size="64" :style="{ backgroundColor: currentRow.gender === '男' ? '#409EFF' : '#F56C6C' }">
              {{ currentRow.name.charAt(0) }}
            </el-avatar>
            <div class="basic-info">
              <h3>{{ currentRow.name }} <el-tag size="small" :type="currentRow.gender === '男' ? 'primary' : 'danger'">{{ currentRow.gender }}</el-tag></h3>
              <p>{{ currentRow.applyPosition }} | {{ currentRow.experience }} | {{ currentRow.education }}</p>
              <p class="contact-info"><el-icon><Phone /></el-icon> {{ currentRow.phone }} | <el-icon><Message /></el-icon> {{ currentRow.email }}</p>
            </div>
          </div>
        </div>

        <el-tabs v-model="activeTab">
          <el-tab-pane label="基本信息" name="basic">
            <el-descriptions :column="1" border size="small">
              <el-descriptions-item label="年龄">{{ currentRow.age }}岁</el-descriptions-item>
              <el-descriptions-item label="现职公司">{{ currentRow.currentCompany }}</el-descriptions-item>
              <el-descriptions-item label="目前薪资">{{ currentRow.currentSalary }}/月</el-descriptions-item>
              <el-descriptions-item label="来源渠道">{{ currentRow.source }}</el-descriptions-item>
              <el-descriptions-item label="提交时间">{{ currentRow.submitTime }}</el-descriptions-item>
            </el-descriptions>
          </el-tab-pane>
          <el-tab-pane label="操作记录" name="log">
            <el-timeline>
              <el-timeline-item timestamp="2026-06-20 10:30" type="primary" placement="top">
                <p>简历被筛选通过，进入初试阶段</p>
              </el-timeline-item>
              <el-timeline-item timestamp="2026-06-18 14:00" type="success" placement="top">
                <p>候选人投递简历</p>
              </el-timeline-item>
            </el-timeline>
          </el-tab-pane>
        </el-tabs>

        <div class="drawer-actions">
          <el-button type="primary" @click="handleArrangeInterview(currentRow)">安排面试</el-button>
          <el-button type="success" @click="handleOffer(currentRow)">发送 Offer</el-button>
          <el-button type="warning" @click="handleForward(currentRow)">转发简历</el-button>
          <el-button type="danger" @click="handleReject(currentRow)">拒绝</el-button>
        </div>
      </div>
    </el-drawer>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Delete, Refresh, Check, CircleClose, Phone, Message } from '@element-plus/icons-vue'
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
    { label: '安排面试', type: 'success', important: true, onClick: () => handleArrangeInterview(row) },
    { label: '发Offer', type: 'success', onClick: () => handleOffer(row) },
    { label: '转发', type: 'warning', onClick: () => handleForward(row) },
    { label: '拒绝', type: 'danger', onClick: () => handleRejectWithConfirm(row) }
  ]
}
function handleRejectWithConfirm(row) {
  ElMessageBox.confirm('确定拒绝该候选人？', '提示', { type: 'warning' })
    .then(() => handleReject(row))
    .catch(() => {})
}
import { getResumeList } from '@/api/hr'

const searchItems = [
  { prop: 'name', label: '姓名', type: 'input' },
  { prop: 'applyPosition', label: '应聘职位', type: 'input' },
  { prop: 'status', label: '状态', type: 'select', options: [
    { value: '', label: '全部' }, { value: '待筛选', label: '待筛选' }, { value: '初试通过', label: '初试通过' },
    { value: '复试通过', label: '复试通过' }, { value: '已发offer', label: '已发offer' }, { value: '已拒绝', label: '已拒绝' }, { value: '已入职', label: '已入职' }
  ]},
  { prop: 'source', label: '来源', type: 'select', options: [
    { value: '', label: '全部' }, { value: '招聘网站', label: '招聘网站' }, { value: '内部推荐', label: '内部推荐' },
    { value: '猎头', label: '猎头' }, { value: '校园招聘', label: '校园招聘' }
  ]}
]

const columns = [
  { prop: 'name', label: '姓名', width: 85 },
  { prop: 'gender', label: '性别', width: 65, slot: 'gender' },
  { prop: 'age', label: '年龄', width: 60, align: 'center' },
  { prop: 'applyPosition', label: '应聘职位', width: 140 },
  { prop: 'education', label: '学历', width: 75 },
  { prop: 'experience', label: '工作经验', width: 90 },
  { prop: 'currentCompany', label: '现职公司', width: 110, showOverflowTooltip: true },
  { prop: 'currentSalary', label: '期望薪资', width: 90, align: 'right' },
  { prop: 'source', label: '来源', width: 90, slot: 'source' },
  { prop: 'status', label: '状态', width: 95, slot: 'status' },
  { prop: 'submitTime', label: '提交时间', width: 170 }
]

const formItems = [
  { prop: 'name', label: '姓名 *', type: 'input', span: 12 },
  { prop: 'gender', label: '性别 *', type: 'radio', span: 12, options: [{ value: '男', label: '男' }, { value: '女', label: '女' }] },
  { prop: 'age', label: '年龄', type: 'number', min: 18, max: 65, span: 12 },
  { prop: 'phone', label: '手机号 *', type: 'input', span: 12 },
  { prop: 'email', label: '邮箱', type: 'input', span: 12 },
  { prop: 'applyPosition', label: '应聘职位 *', type: 'input', span: 12 },
  { prop: 'education', label: '最高学历', type: 'select', span: 12, options: [
    { value: '大专', label: '大专' }, { value: '本科', label: '本科' }, { value: '硕士', label: '硕士' }, { value: '博士', label: '博士' }
  ]},
  { prop: 'school', label: '毕业院校', type: 'input', span: 12 },
  { prop: 'experience', label: '工作经验', type: 'input', span: 12 },
  { prop: 'currentCompany', label: '现职公司', type: 'input', span: 12 },
  { prop: 'currentSalary', label: '期望薪资', type: 'input', span: 12 },
  { prop: 'source', label: '来源渠道', type: 'select', span: 12, options: [
    { value: '招聘网站', label: '招聘网站' }, { value: '内部推荐', label: '内部推荐' },
    { value: '猎头', label: '猎头' }, { value: '校园招聘', label: '校园招聘' }, { value: '人才市场', label: '人才市场' }
  ]},
  { prop: 'remark', label: '备注', type: 'textarea', rows: 3, span: 24 }
]
const formRules = {
  name: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
  gender: [{ required: true, message: '请选择性别', trigger: 'change' }],
  phone: [{ required: true, message: '请输入手机号', trigger: 'blur' }],
  applyPosition: [{ required: true, message: '请输入应聘职位', trigger: 'blur' }]
}

const resumeStatusMap = { '待筛选': { type: 'info' }, '初试通过': { type: 'primary' }, '复试通过': { type: '' }, '已发offer': { type: 'success' }, '已拒绝': { type: 'danger' }, '已入职': { type: 'success' } }

const loading = ref(false), tableData = ref([]), total = ref(0), selectedRows = ref([])
const dialogVisible = ref(false), dialogTitle = ref('录入简历'), submitLoading = ref(false), formRef = ref(null)
const drawerVisible = ref(false), currentRow = ref(null), activeTab = ref('basic')
const queryParams = reactive({ pageNum: 1, pageSize: 10, name: '', applyPosition: '', status: '', source: '' })
const formData = reactive({
  id: undefined, name: '', gender: '男', age: undefined, phone: '', email: '',
  applyPosition: '', education: '本科', school: '', experience: '',
  currentCompany: '', currentSalary: '', source: '招聘网站', remark: ''
})

async function loadData() {
  loading.value = true
  try { const res = await getResumeList(queryParams); tableData.value = res.data.list || []; total.value = res.data.total || 0 }
  finally { loading.value = false }
}
function handleSearch(p) { Object.assign(queryParams, p, { pageNum: 1 }); loadData() }
function handleReset() { Object.assign(queryParams, { pageNum: 1, name: '', applyPosition: '', status: '', source: '' }); loadData() }
function handlePageChange(p) { queryParams.pageNum = p; loadData() }
function handleSizeChange(s) { queryParams.pageSize = s; queryParams.pageNum = 1; loadData() }
function handleSelectionChange(r) { selectedRows.value = r }

function handleAdd() { dialogTitle.value = '录入简历'; resetForm(); dialogVisible.value = true }
function handleEdit(row) { dialogTitle.value = '编辑简历'; Object.assign(formData, { ...row }); dialogVisible.value = true }
function handleView(row) { currentRow.value = { ...row }; activeTab.value = 'basic'; drawerVisible.value = true }
function resetForm() { Object.keys(formData).forEach(k => { formData[k] = k === 'gender' ? '男' : k === 'education' ? '本科' : k === 'source' ? '招聘网站' : '' }); formData.id = undefined }
function cancelDialog() { dialogVisible.value = false; formRef.value?.resetFields() }

async function handleSubmit() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return
  submitLoading.value = true
  try { await new Promise(r => setTimeout(r, 500)); ElMessage.success('操作成功'); dialogVisible.value = false; loadData() }
  catch { ElMessage.error('操作失败') } finally { submitLoading.value = false }
}

async function handleReject(row) { ElMessage.success('已标记为拒绝'); loadData() }
async function handleBatchPass() { if (!selectedRows.value.length) return ElMessage.warning('请选择数据'); ElMessage.success(`已通过 ${selectedRows.value.length} 份简历`) }
async function handleBatchReject() { if (!selectedRows.value.length) return ElMessage.warning('请选择数据'); ElMessage.success(`已拒绝 ${selectedRows.value.length} 份简历`) }
async function handleBatchDelete() { if (!selectedRows.value.length) return ElMessage.warning('请选择数据'); await ElMessageBox.confirm(`确定删除选中的 ${selectedRows.value.length} 条？`); ElMessage.success('批量删除成功'); loadData() }
function handleArrangeInterview(row) { ElMessage.success(`已为「${row.name}」创建面试安排，请前往面试管理查看`) }
function handleOffer(row) { ElMessage.success(`已向「${row.name}」发送 Offer 邮件`) }
function handleForward(row) { ElMessage.success('简历链接已复制') }

onMounted(() => loadData())
</script>

<style lang="scss" scoped>
.page-container .table-toolbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; padding: 14px 18px; background: #fff; border-radius: var(--border-radius-base); .toolbar-left { display: flex; gap: 10px; } .toolbar-right { display: flex; gap: 8px; } }
.drawer-header { display: flex; align-items: center; gap: 10px; .drawer-title { font-size: 16px; font-weight: 600; } }
.drawer-body {
  .profile-card { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px; padding: 20px; margin-bottom: 16px;
    .avatar-area { display: flex; gap: 16px; align-items: center;
      .basic-info { color: #fff;
        h3 { margin: 0 0 6px 0; font-size: 18px; display: flex; align-items: center; gap: 8px; }
        p { margin: 2px 0; font-size: 13px; opacity: 0.9; }
        .contact-info { display: flex; gap: 12px; align-items: center; font-size: 12px; }
      }
    }
  }
  .drawer-actions { margin-top: 20px; display: flex; gap: 10px; flex-wrap: wrap; }
}
</style>
