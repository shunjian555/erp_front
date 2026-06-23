<template>
  <div class="page-container">
    <BaseSearch :search-items="searchItems" @search="handleSearch" @reset="handleReset" />
    <div class="table-toolbar">
      <div class="toolbar-left">
        <el-button type="primary" :icon="Plus" @click="handleAdd">预约会议</el-button>
      </div>
      <div class="toolbar-right">
        <el-button :icon="Refresh" circle @click="loadData" />
      </div>
    </div>
    <BaseTable :columns="columns" :table-data="tableData" :loading="loading" :total="total" :current-page.sync="queryParams.pageNum" :page-size.sync="queryParams.pageSize" :show-index="true" @current-change="handlePageChange" @size-change="handleSizeChange">
      <template #status="{ row }">
        <el-tag :type="statusMap[row.status]?.type || 'info'" size="small">{{ row.status }}</el-tag>
      </template>
      <template #type="{ row }">
        <el-tag :type="row.type === '线上' ? 'primary' : 'success'" size="small">{{ row.type }}</el-tag>
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
        <el-form-item label="会议主题" prop="title"><el-input v-model="formData.title" /></el-form-item>
        <el-form-item label="会议类型" prop="type">
          <el-radio-group v-model="formData.type">
            <el-radio value="线上">线上</el-radio>
            <el-radio value="线下">线下</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="会议室" prop="room">
          <el-select v-model="formData.room" style="width: 100%" :disabled="formData.type === '线上'">
            <el-option v-for="o in rooms" :key="o" :label="o" :value="o" />
          </el-select>
        </el-form-item>
        <el-form-item label="开始时间" prop="startTime"><el-input v-model="formData.startTime" placeholder="例如 2025-06-23 09:00" /></el-form-item>
        <el-form-item label="结束时间" prop="endTime"><el-input v-model="formData.endTime" placeholder="例如 2025-06-23 10:00" /></el-form-item>
        <el-form-item label="主持人" prop="host"><el-input v-model="formData.host" /></el-form-item>
        <el-form-item label="参与人" prop="participants"><el-input v-model="formData.participants" /></el-form-item>
        <el-form-item label="会议内容" prop="content"><el-input v-model="formData.content" type="textarea" :rows="3" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="cancelDialog">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>

    <!-- 详情 -->
    <el-dialog v-model="viewVisible" title="会议详情" width="600px">
      <el-descriptions v-if="viewRow" :column="2" border>
        <el-descriptions-item label="会议主题" :span="2">{{ viewRow.title }}</el-descriptions-item>
        <el-descriptions-item label="会议类型">{{ viewRow.type }}</el-descriptions-item>
        <el-descriptions-item v-if="viewRow.type === '线下'" label="会议室">{{ viewRow.room }}</el-descriptions-item>
        <el-descriptions-item label="开始时间">{{ viewRow.startTime }}</el-descriptions-item>
        <el-descriptions-item label="结束时间">{{ viewRow.endTime }}</el-descriptions-item>
        <el-descriptions-item label="主持人">{{ viewRow.host }}</el-descriptions-item>
        <el-descriptions-item label="参与人">{{ viewRow.participants }}</el-descriptions-item>
        <el-descriptions-item label="状态">{{ viewRow.status }}</el-descriptions-item>
        <el-descriptions-item label="签到人数" :span="2">{{ viewRow.signInCount || 0 }} / {{ viewRow.totalCount || 0 }}</el-descriptions-item>
        <el-descriptions-item label="会议内容" :span="2">{{ viewRow.content }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>

    <!-- 签到列表 -->
    <el-dialog v-model="signInVisible" title="签到人员" width="500px">
      <el-table :data="signInList" border size="small">
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column prop="name" label="姓名" />
        <el-table-column prop="dept" label="部门" />
        <el-table-column prop="status" label="签到状态">
          <template #default="{ row }">
            <el-tag :type="row.status === '已签到' ? 'success' : 'info'" size="small">{{ row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="signTime" label="签到时间" />
      </el-table>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Refresh, ArrowDown } from '@element-plus/icons-vue'
import BaseSearch from '@/components/BaseSearch.vue'
import BaseTable from '@/components/BaseTable.vue'

const statusMap = { '待开始': { type: 'info' }, '进行中': { type: 'warning' }, '已结束': { type: 'success' }, '已取消': { type: 'danger' } }
const statusOptions = ['待开始', '进行中', '已结束', '已取消']
const typeOptions = [{ value: '线上', label: '线上' }, { value: '线下', label: '线下' }]
const rooms = ['第一会议室', '第二会议室', '第三会议室', '多功能厅', '接待室']

const searchItems = [
  { prop: 'title', label: '会议主题', type: 'input' },
  { prop: 'type', label: '会议类型', type: 'select', options: typeOptions },
  { prop: 'status', label: '状态', type: 'select', options: statusOptions.map(v => ({ value: v, label: v })) }
]
const columns = [
  { prop: 'title', label: '会议主题', minWidth: 200, showOverflowTooltip: true },
  { prop: 'type', label: '类型', width: 80, slot: 'type' },
  { prop: 'room', label: '会议室', width: 120 },
  { prop: 'startTime', label: '开始时间', width: 160 },
  { prop: 'endTime', label: '结束时间', width: 160 },
  { prop: 'host', label: '主持人', width: 100 },
  { prop: 'participants', label: '参与人', width: 120 },
  { prop: 'status', label: '状态', width: 100, slot: 'status' }
]
const loading = ref(false), tableData = ref([]), total = ref(0)
const dialogVisible = ref(false), dialogTitle = ref('预约会议'), submitLoading = ref(false), formRef = ref(null)
const viewVisible = ref(false), viewRow = ref(null)
const signInVisible = ref(false), signInList = ref([])
const queryParams = reactive({ pageNum: 1, pageSize: 10, title: '', type: '', status: '' })
const formData = reactive({ id: undefined, title: '', type: '线下', room: '第一会议室', startTime: '', endTime: '', host: '', participants: '', content: '' })
const formRules = { title: [{ required: true, message: '请输入会议主题', trigger: 'blur' }], startTime: [{ required: true, message: '请输入开始时间', trigger: 'blur' }] }
const titles = ['Q2 销售总结会议', '项目启动会', '客户需求评审', '技术方案讨论', '月度经营分析', '产品发布会', '部门例会', '年度规划会']
const hosts = ['张总监', '李经理', '王副总', '陈总', '刘总']
const typeList = ['线上', '线下']
const roomList = ['第一会议室', '第二会议室', '第三会议室', '腾讯会议', '钉钉会议', '多功能厅']
const statuses = ['待开始', '进行中', '已结束', '已取消']
const participantsList = ['全体员工', '销售部', '管理层', '研发组', '项目组', '财务部', '市场部']
const names = ['张伟', '李娜', '王强', '赵敏', '刘芳', '陈晨', '黄磊', '周杰', '吴昊', '孙梦']
const depts = ['销售部', '研发部', '市场部', '财务部', '人事部']

async function loadData() {
  loading.value = true
  try {
    const { title = '', type = '', status = '', pageNum = 1, pageSize = 10 } = queryParams
    const all = Array.from({ length: 28 }, (_, i) => {
      const stt = i % 4
      const tp = typeList[i % 2]
      const rmc = tp === '线上' ? roomList[(i + 4) % roomList.length] : roomList[i % 5]
      const total = 8 + (i % 5) * 2
      const signed = stt === 2 ? total : (stt === 1 ? Math.floor(total * 0.7) : 0)
      return {
        id: i + 1,
        title: titles[i % titles.length],
        type: tp,
        room: rmc,
        startTime: `2025-${String((i % 6) + 1).padStart(2, '0')}-${String((i % 28) + 1).padStart(2, '0')} 09:00`,
        endTime: `2025-${String((i % 6) + 1).padStart(2, '0')}-${String((i % 28) + 1).padStart(2, '0')} 10:00`,
        host: hosts[i % hosts.length],
        participants: participantsList[i % participantsList.length],
        status: statuses[stt],
        signInCount: signed,
        totalCount: total,
        content: '请相关同事准时参会'
      }
    })
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
function handleAdd() { dialogTitle.value = '预约会议'; Object.keys(formData).forEach(k => formData[k] = ''); formData.id = undefined; formData.type = '线下'; formData.room = '第一会议室'; dialogVisible.value = true }
function handleEdit(row) { dialogTitle.value = '编辑会议'; Object.assign(formData, row); dialogVisible.value = true }
function handleView(row) { viewRow.value = row; viewVisible.value = true }
function handleSignIn(row) {
  signInList.value = Array.from({ length: row.totalCount || 5 }, (_, i) => ({
    name: names[i % names.length],
    dept: depts[i % depts.length],
    status: i < (row.signInCount || 0) ? '已签到' : '未签到',
    signTime: i < (row.signInCount || 0) ? `2025-${String(((i % 6) + 1)).padStart(2, '0')}-${String((i % 28) + 1).padStart(2, '0')} ${String(8 + (i % 10)).padStart(2, '0')}:${String((i * 5) % 60).padStart(2, '0')}:00` : ''
  }))
  signInVisible.value = true
}
function cancelDialog() { dialogVisible.value = false; formRef.value?.resetFields() }
async function handleSubmit() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return
  submitLoading.value = true
  try { await new Promise(r => setTimeout(r, 500)); ElMessage.success('预约成功'); dialogVisible.value = false; loadData() }
  catch { ElMessage.error('预约失败') }
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
  if (row.status === '进行中') {
    actions.push({ key: 'sign', label: '签到', type: 'success', handler: handleSignIn })
  }
  actions.push({ key: 'delete', label: '删除', type: 'danger', handler: handleDelete })
  return actions
}
function handleCommand(cmd, row) { getActions(row).find(a => a.key === cmd)?.handler(row) }
onMounted(() => loadData())
</script>
