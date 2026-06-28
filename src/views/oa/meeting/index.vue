<template>
  <div class="page-container">
    <BaseSearch :search-items="searchItems" @search="handleSearch" @reset="handleReset" />
    <div class="table-toolbar">
      <div class="toolbar-left"><el-button type="primary" :icon="Plus" @click="handleAdd">{{ $t('oa.bookMeeting') }}</el-button></div>
      <div class="toolbar-right"><el-button :icon="Refresh" circle @click="loadData" /></div>
    </div>
    <BaseTable :columns="columns" :table-data="tableData" :loading="loading" :total="total" :current-page.sync="queryParams.pageNum" :page-size.sync="queryParams.pageSize" :show-index="true" @current-change="handlePageChange" @size-change="handleSizeChange">
      <template #status="{ row }"><el-tag :type="row.status === t('oa.statusEnded') ? 'success' : row.status === t('oa.statusInProgress') ? 'warning' : row.status === t('oa.statusCancelled') ? 'danger' : 'info'" size="small">{{ row.status }}</el-tag></template>
      <template #type="{ row }"><el-tag :type="row.type === t('oa.typeOnline') ? 'primary' : 'success'" size="small">{{ row.type }}</el-tag></template>
      <template #operation="{ row }">
        <MoreActions :items="[
          { label: $t('common.detail'), onClick: () => handleView(row) },
          { label: $t('common.edit'), onClick: () => handleEdit(row) },
          { label: $t('oa.checkIn'), type: 'success', hidden: row.status !== t('oa.statusInProgress'), onClick: () => handleSignIn(row) },
          { label: $t('common.delete'), type: 'danger', onClick: () => handleDelete(row) }
        ]" />
      </template>
    </BaseTable>

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="600px" :close-on-click-modal="false" @close="cancelDialog">
      <el-form ref="formRef" :model="formData" :rules="formRules" label-width="100px">
        <el-form-item :label="$t('oa.meetingTopic')" prop="title"><el-input v-model="formData.title" /></el-form-item>
        <el-form-item :label="$t('oa.meetingType')" prop="type">
          <el-radio-group v-model="formData.type"><el-radio :value="t('oa.typeOnline')">{{ t('oa.typeOnline') }}</el-radio><el-radio :value="t('oa.typeOffline')">{{ t('oa.typeOffline') }}</el-radio></el-radio-group>
        </el-form-item>
        <el-form-item :label="$t('oa.meetingRoom')" prop="room"><el-select v-model="formData.room" style="width: 100%" :disabled="formData.type === t('oa.typeOnline')"><el-option v-for="o in rooms" :key="o" :label="o" :value="o" /></el-select></el-form-item>
        <el-form-item :label="$t('oa.startTime')" prop="startTime"><el-input v-model="formData.startTime" :placeholder="$t('oa.placeholderDateTime')" /></el-form-item>
        <el-form-item :label="$t('oa.endTime')" prop="endTime"><el-input v-model="formData.endTime" :placeholder="$t('oa.placeholderDateTimeEnd')" /></el-form-item>
        <el-form-item :label="$t('oa.host')" prop="host"><el-input v-model="formData.host" /></el-form-item>
        <el-form-item :label="$t('oa.participants')" prop="participants"><el-input v-model="formData.participants" /></el-form-item>
        <el-form-item :label="$t('oa.meetingContent')" prop="content"><el-input v-model="formData.content" type="textarea" :rows="3" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="cancelDialog">{{ $t('common.cancel') }}</el-button>
        <el-button type="primary" :loading="submitLoading" @click="handleSubmit">{{ $t('common.confirm') }}</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="viewVisible" :title="$t('oa.meetingDetail')" width="600px">
      <el-descriptions v-if="viewRow" :column="2" border>
        <el-descriptions-item :label="$t('oa.meetingTopic')" :span="2">{{ viewRow.title }}</el-descriptions-item>
        <el-descriptions-item :label="$t('oa.meetingType')">{{ viewRow.type }}</el-descriptions-item>
        <el-descriptions-item v-if="viewRow.type === t('oa.typeOffline')" :label="$t('oa.meetingRoom')">{{ viewRow.room }}</el-descriptions-item>
        <el-descriptions-item :label="$t('oa.startTime')">{{ viewRow.startTime }}</el-descriptions-item>
        <el-descriptions-item :label="$t('oa.endTime')">{{ viewRow.endTime }}</el-descriptions-item>
        <el-descriptions-item :label="$t('oa.host')">{{ viewRow.host }}</el-descriptions-item>
        <el-descriptions-item :label="$t('oa.participants')">{{ viewRow.participants }}</el-descriptions-item>
        <el-descriptions-item :label="$t('common.status')">{{ viewRow.status }}</el-descriptions-item>
        <el-descriptions-item :label="$t('oa.checkInCount')" :span="2">{{ viewRow.signInCount || 0 }} / {{ viewRow.totalCount || 0 }}</el-descriptions-item>
        <el-descriptions-item :label="$t('oa.meetingContent')" :span="2">{{ viewRow.content }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>

    <el-dialog v-model="signInVisible" :title="$t('oa.attendees')" width="500px">
      <el-table :data="signInList" border size="small">
        <el-table-column type="index" label="#" width="60" align="center" />
        <el-table-column prop="name" :label="$t('oa.employeeName')" />
        <el-table-column prop="dept" :label="$t('oa.department')" />
        <el-table-column prop="status" :label="$t('oa.attendanceStatus')">
          <template #default="{ row }"><el-tag :type="row.status === t('oa.checkedIn') ? 'success' : 'info'" size="small">{{ row.status }}</el-tag></template>
        </el-table-column>
        <el-table-column prop="signTime" :label="$t('oa.startTime')" />
      </el-table>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Refresh } from '@element-plus/icons-vue'
import BaseSearch from '@/components/BaseSearch.vue'
import BaseTable from '@/components/BaseTable.vue'
import MoreActions from '@/components/MoreActions.vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const typeOptions = computed(() => [{ value: t('oa.typeOnline'), label: t('oa.typeOnline') }, { value: t('oa.typeOffline'), label: t('oa.typeOffline') }])
const statusOptions = computed(() => [t('oa.statusPending'), t('oa.statusInProgress'), t('oa.statusEnded'), t('oa.statusCancelled')])
const rooms = computed(() => [t('oa.meetingRoom1'), t('oa.meetingRoom2'), t('oa.meetingRoom3'), t('oa.meetingRoom4'), t('oa.meetingRoom5')])
const searchItems = computed(() => [
  { prop: 'title', label: t('oa.meetingTopic'), type: 'input' },
  { prop: 'type', label: t('oa.meetingType'), type: 'select', options: typeOptions.value },
  { prop: 'status', label: t('common.status'), type: 'select', options: statusOptions.value.map(v => ({ value: v, label: v })) }
])
const columns = computed(() => [
  { prop: 'title', label: t('oa.meetingTopic'), minWidth: 200, showOverflowTooltip: true },
  { prop: 'type', label: t('oa.type'), width: 80, slot: 'type' },
  { prop: 'room', label: t('oa.meetingRoom'), width: 120 },
  { prop: 'startTime', label: t('oa.startTime'), width: 160 },
  { prop: 'endTime', label: t('oa.endTime'), width: 160 },
  { prop: 'host', label: t('oa.host'), width: 100 },
  { prop: 'participants', label: t('oa.participants'), width: 120 },
  { prop: 'status', label: t('common.status'), width: 100, slot: 'status' }
])
const loading = ref(false), tableData = ref([]), total = ref(0)
const dialogVisible = ref(false), dialogTitle = ref(''), submitLoading = ref(false), formRef = ref(null)
const viewVisible = ref(false), viewRow = ref(null)
const signInVisible = ref(false), signInList = ref([])
const queryParams = reactive({ pageNum: 1, pageSize: 10, title: '', type: '', status: '' })
const formData = reactive({ id: undefined, title: '', type: '', room: '', startTime: '', endTime: '', host: '', participants: '', content: '' })
const formRules = computed(() => ({ title: [{ required: true, message: t('oa.inputMeetingTopic'), trigger: 'blur' }], startTime: [{ required: true, message: t('oa.inputStartTime'), trigger: 'blur' }] }))
const titles = ['Q2 销售总结会议', '项目启动会', '客户需求评审', '技术方案讨论', '月度经营分析', '产品发布会', '部门例会', '年度规划会']
const hosts = ['张总监', '李经理', '王副总', '陈总', '刘总']
const participantsList = ['全体员工', '销售部', '管理层', '研发组', '项目组', '财务部', '市场部']
const names = ['张伟', '李娜', '王强', '赵敏', '刘芳', '陈晨', '黄磊', '周杰', '吴昊', '孙梦']
const depts = ['销售部', '研发部', '市场部', '财务部', '人事部']

async function loadData() {
  loading.value = true
  try {
    const allS = statusOptions.value, typeOnline = t('oa.typeOnline'), typeOffline = t('oa.typeOffline')
    const { title = '', type = '', status = '', pageNum = 1, pageSize = 10 } = queryParams
    const all = Array.from({ length: 28 }, (_, i) => {
      const stt = i % 4, tp = i % 2 === 0 ? typeOnline : typeOffline, rmc = tp === typeOnline ? rooms[(i + 4) % rooms.length] : rooms[i % 5]
      const total = 8 + (i % 5) * 2, signed = stt === 2 ? total : (stt === 1 ? Math.floor(total * 0.7) : 0)
      return { id: i + 1, title: titles[i % titles.length], type: tp, room: rmc,
        startTime: `2025-${String((i % 6) + 1).padStart(2, '0')}-${String((i % 28) + 1).padStart(2, '0')} 09:00`,
        endTime: `2025-${String((i % 6) + 1).padStart(2, '0')}-${String((i % 28) + 1).padStart(2, '0')} 10:00`,
        host: hosts[i % hosts.length], participants: participantsList[i % participantsList.length],
        status: allS[stt], signInCount: signed, totalCount: total, content: '请相关同事准时参会' }
    })
    let filtered = all
    if (title) filtered = filtered.filter(x => x.title.includes(title))
    if (type) filtered = filtered.filter(x => x.type === type)
    if (status) filtered = filtered.filter(x => x.status === status)
    const start = (Number(pageNum) - 1) * Number(pageSize)
    tableData.value = filtered.slice(start, start + Number(pageSize)); total.value = filtered.length
  } finally { loading.value = false }
}
function handleSearch(p) { Object.assign(queryParams, p, { pageNum: 1 }); loadData() }
function handleReset() { Object.keys(queryParams).forEach(k => { if (k !== 'pageNum' && k !== 'pageSize') queryParams[k] = '' }); loadData() }
function handlePageChange(p) { queryParams.pageNum = p; loadData() }
function handleSizeChange(s) { queryParams.pageSize = s; queryParams.pageNum = 1; loadData() }
function handleAdd() { dialogTitle.value = t('oa.bookMeeting'); Object.keys(formData).forEach(k => formData[k] = ''); formData.id = undefined; formData.type = t('oa.typeOffline'); formData.room = rooms.value[0]; dialogVisible.value = true }
function handleEdit(row) { dialogTitle.value = t('oa.editMeeting'); Object.assign(formData, row); dialogVisible.value = true }
function handleView(row) { viewRow.value = row; viewVisible.value = true }
function handleSignIn(row) { signInList.value = Array.from({ length: row.totalCount || 5 }, (_, i) => ({ name: names[i % names.length], dept: depts[i % depts.length], status: i < (row.signInCount || 0) ? t('oa.checkedIn') : t('oa.notCheckedIn'), signTime: i < (row.signInCount || 0) ? `2025-${String(((i % 6) + 1)).padStart(2, '0')}-${String((i % 28) + 1).padStart(2, '0')} ${String(8 + (i % 10)).padStart(2, '0')}:${String((i * 5) % 60).padStart(2, '0')}:00` : '' })); signInVisible.value = true }
function cancelDialog() { dialogVisible.value = false; formRef.value?.resetFields() }
async function handleSubmit() { const valid = await formRef.value?.validate().catch(() => false); if (!valid) return; submitLoading.value = true; try { await new Promise(r => setTimeout(r, 500)); ElMessage.success(t('oa.bookSuccess')); dialogVisible.value = false; loadData() } catch { ElMessage.error(t('oa.bookFailed')) } finally { submitLoading.value = false } }
async function handleDelete(row) { await ElMessageBox.confirm(t('oa.deleteMeetingConfirm', { title: row.title }), t('header.tips'), { type: 'warning' }); ElMessage.success(t('oa.deleteSuccess')); loadData() }
onMounted(() => loadData())
</script>

<style lang="scss" scoped>
.page-container .table-toolbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; padding: 14px 18px; background: #fff; border-radius: var(--border-radius-base); .toolbar-left { display: flex; gap: 10px; } .toolbar-right { display: flex; gap: 8px; } }
</style>
