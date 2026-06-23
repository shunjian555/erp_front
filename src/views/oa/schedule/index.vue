<template>
  <div class="page-container">
    <BaseSearch :search-items="searchItems" @search="handleSearch" @reset="handleReset" />
    <div class="table-toolbar">
      <div class="toolbar-left">
        <el-button type="primary" :icon="Plus" @click="handleAdd">新建日程</el-button>
        <el-button :icon="Calendar" plain @click="handleViewToday">今日日程</el-button>
      </div>
      <div class="toolbar-right">
        <el-button :icon="Refresh" circle @click="loadData" />
      </div>
    </div>
    <BaseTable :columns="columns" :table-data="tableData" :loading="loading" :total="total" :current-page.sync="queryParams.pageNum" :page-size.sync="queryParams.pageSize" :show-index="true" @current-change="handlePageChange" @size-change="handleSizeChange">
      <template #type="{ row }">
        <el-tag :type="typeMap[row.type]?.type || 'info'" size="small">{{ row.type }}</el-tag>
      </template>
      <template #status="{ row }">
        <el-tag :type="statusMap[row.status]?.type || 'info'" size="small">{{ row.status }}</el-tag>
      </template>
      <template #priority="{ row }">
        <el-tag :type="row.priority === '高' ? 'danger' : row.priority === '中' ? 'warning' : 'info'" size="small">{{ row.priority }}</el-tag>
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
        <el-form-item label="日程标题" prop="title"><el-input v-model="formData.title" /></el-form-item>
        <el-form-item label="类型" prop="type">
          <el-select v-model="formData.type" style="width: 100%">
            <el-option v-for="o in typeOptions" :key="o" :label="o" :value="o" />
          </el-select>
        </el-form-item>
        <el-form-item label="开始时间" prop="startTime"><el-input v-model="formData.startTime" placeholder="例如 2025-06-23 09:00" /></el-form-item>
        <el-form-item label="结束时间" prop="endTime"><el-input v-model="formData.endTime" placeholder="例如 2025-06-23 10:00" /></el-form-item>
        <el-form-item label="地点" prop="location"><el-input v-model="formData.location" /></el-form-item>
        <el-form-item label="参与人" prop="participants"><el-input v-model="formData.participants" /></el-form-item>
        <el-form-item label="优先级" prop="priority">
          <el-radio-group v-model="formData.priority">
            <el-radio value="高">高</el-radio>
            <el-radio value="中">中</el-radio>
            <el-radio value="低">低</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="内容" prop="content"><el-input v-model="formData.content" type="textarea" :rows="3" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="cancelDialog">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>

    <!-- 详情 -->
    <el-dialog v-model="viewVisible" title="日程详情" width="600px">
      <el-descriptions v-if="viewRow" :column="2" border>
        <el-descriptions-item label="日程标题" :span="2">{{ viewRow.title }}</el-descriptions-item>
        <el-descriptions-item label="类型">{{ viewRow.type }}</el-descriptions-item>
        <el-descriptions-item label="优先级">{{ viewRow.priority }}</el-descriptions-item>
        <el-descriptions-item label="开始时间">{{ viewRow.startTime }}</el-descriptions-item>
        <el-descriptions-item label="结束时间">{{ viewRow.endTime }}</el-descriptions-item>
        <el-descriptions-item label="地点">{{ viewRow.location }}</el-descriptions-item>
        <el-descriptions-item label="参与人">{{ viewRow.participants }}</el-descriptions-item>
        <el-descriptions-item label="状态">{{ viewRow.status }}</el-descriptions-item>
        <el-descriptions-item label="内容" :span="2">{{ viewRow.content }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Refresh, Calendar, ArrowDown } from '@element-plus/icons-vue'
import BaseSearch from '@/components/BaseSearch.vue'
import BaseTable from '@/components/BaseTable.vue'

const typeMap = { '会议': { type: 'primary' }, '拜访': { type: 'success' }, '培训': { type: 'warning' }, '出差': { type: 'danger' }, '其他': { type: 'info' } }
const statusMap = { '待开始': { type: 'info' }, '进行中': { type: 'warning' }, '已完成': { type: 'success' }, '已取消': { type: 'danger' } }
const typeOptions = ['会议', '拜访', '培训', '出差', '其他']
const priorityOptions = ['高', '中', '低']
const statusOptions = ['待开始', '进行中', '已完成', '已取消']

const searchItems = [
  { prop: 'title', label: '日程标题', type: 'input' },
  { prop: 'type', label: '类型', type: 'select', options: typeOptions.map(v => ({ value: v, label: v })) },
  { prop: 'status', label: '状态', type: 'select', options: statusOptions.map(v => ({ value: v, label: v })) }
]
const columns = [
  { prop: 'title', label: '日程标题', minWidth: 200, showOverflowTooltip: true },
  { prop: 'type', label: '类型', width: 100, slot: 'type' },
  { prop: 'startTime', label: '开始时间', width: 160 },
  { prop: 'endTime', label: '结束时间', width: 160 },
  { prop: 'location', label: '地点', width: 140 },
  { prop: 'participants', label: '参与人', width: 120 },
  { prop: 'priority', label: '优先级', width: 100, slot: 'priority' },
  { prop: 'status', label: '状态', width: 100, slot: 'status' }
]
const loading = ref(false), tableData = ref([]), total = ref(0)
const dialogVisible = ref(false), dialogTitle = ref('新建日程'), submitLoading = ref(false), formRef = ref(null)
const viewVisible = ref(false), viewRow = ref(null)
const queryParams = reactive({ pageNum: 1, pageSize: 10, title: '', type: '', status: '' })
const formData = reactive({ id: undefined, title: '', type: '会议', startTime: '', endTime: '', location: '', participants: '', priority: '中', content: '', status: '待开始' })
const formRules = { title: [{ required: true, message: '请输入日程标题', trigger: 'blur' }], startTime: [{ required: true, message: '请输入开始时间', trigger: 'blur' }] }
const types = ['会议', '拜访', '培训', '出差', '其他']
const priorities = ['高', '中', '低']
const statuses = ['待开始', '进行中', '已完成', '已取消']
const locations = ['第一会议室', '第二会议室', '客户现场', '培训室', '线上会议', '展厅']
const participantsList = ['全体员工', '销售部', '管理层', '研发组', '项目组', '财务部']
const titles = ['Q2 销售总结会', '拜访华为总部', '新员工入职培训', '项目周会', '客户方案评审', '年度预算讨论', '产品发布准备', '技术分享会']

async function loadData() {
  loading.value = true
  try {
    const { title = '', type = '', status = '', pageNum = 1, pageSize = 10 } = queryParams
    const all = Array.from({ length: 42 }, (_, i) => ({
      id: i + 1,
      title: titles[i % titles.length],
      type: types[i % types.length],
      startTime: `2025-${String((i % 6) + 1).padStart(2, '0')}-${String((i % 28) + 1).padStart(2, '0')} 09:00`,
      endTime: `2025-${String((i % 6) + 1).padStart(2, '0')}-${String((i % 28) + 1).padStart(2, '0')} 10:00`,
      location: locations[i % locations.length],
      participants: participantsList[i % participantsList.length],
      priority: priorities[i % priorities.length],
      status: statuses[i % statuses.length],
      content: '请相关同事准时参加'
    }))
    let filtered = all
    if (title) filtered = filtered.filter(x => x.title.includes(title))
    if (type) filtered = filtered.filter(x => x.type === type)
    if (status) filtered = filtered.filter(x => x.status === status)
    const start = (Number(pageNum) - 1) * Number(pageSize)
    tableData.value = filtered.slice(start, start + Number(pageSize))
    total.value = filtered.length
  } finally { loading.value = false }
}
function handleSearch(p) { Object.assign(queryParams, p, { pageNum: 1 }); loadData() }
function handleReset() { Object.keys(queryParams).forEach(k => { if (k !== 'pageNum' && k !== 'pageSize') queryParams[k] = '' }); loadData() }
function handlePageChange(p) { queryParams.pageNum = p; loadData() }
function handleSizeChange(s) { queryParams.pageSize = s; queryParams.pageNum = 1; loadData() }
function handleAdd() { dialogTitle.value = '新建日程'; Object.keys(formData).forEach(k => formData[k] = ''); formData.id = undefined; formData.type = '会议'; formData.priority = '中'; formData.status = '待开始'; dialogVisible.value = true }
function handleEdit(row) { dialogTitle.value = '编辑日程'; Object.assign(formData, row); dialogVisible.value = true }
function handleView(row) { viewRow.value = row; viewVisible.value = true }
function handleViewToday() {
  ElMessage.info('今日日程: 共有 3 条（演示）')
}
async function handleComplete(row) {
  await ElMessageBox.confirm(`确定将「${row.title}」标记为已完成?`, '提示', { type: 'warning' })
  ElMessage.success('已标记完成')
  loadData()
}
function cancelDialog() { dialogVisible.value = false; formRef.value?.resetFields() }
async function handleSubmit() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return
  submitLoading.value = true
  try { await new Promise(r => setTimeout(r, 500)); ElMessage.success('保存成功'); dialogVisible.value = false; loadData() }
  catch { ElMessage.error('保存失败') }
  finally { submitLoading.value = false }
}
async function handleDelete(row) {
  await ElMessageBox.confirm(`确定删除「${row.title}」?`, '提示', { type: 'warning' })
  ElMessage.success('删除成功')
  loadData()
}
function getActions(row) {
  const actions = [
    { key: 'view', label: '查看', type: 'primary', handler: handleView },
    { key: 'edit', label: '编辑', type: 'primary', handler: handleEdit }
  ]
  if (row.status !== '已完成' && row.status !== '已取消') {
    actions.push({ key: 'complete', label: '标记完成', type: 'success', handler: handleComplete })
  }
  actions.push({ key: 'delete', label: '删除', type: 'danger', handler: handleDelete })
  return actions
}
function handleCommand(cmd, row) { getActions(row).find(a => a.key === cmd)?.handler(row) }
onMounted(() => loadData())
</script>
