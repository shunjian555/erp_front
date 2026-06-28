<template>
  <div class="page-container">
    <BaseSearch :search-items="searchItems" @search="handleSearch" @reset="handleReset" />
    <div class="table-toolbar">
      <div class="toolbar-left">
        <el-button type="primary" :icon="Plus" @click="handleAdd">{{ $t('oa.newSchedule') }}</el-button>
        <el-button :icon="Calendar" plain @click="handleViewToday">{{ $t('oa.todaySchedule') }}</el-button>
      </div>
      <div class="toolbar-right"><el-button :icon="Refresh" circle @click="loadData" /></div>
    </div>
    <BaseTable :columns="columns" :table-data="tableData" :loading="loading" :total="total" :current-page.sync="queryParams.pageNum" :page-size.sync="queryParams.pageSize" :show-index="true" @current-change="handlePageChange" @size-change="handleSizeChange">
      <template #type="{ row }"><el-tag :type="row.type === t('oa.typeMeeting') ? 'primary' : row.type === t('oa.typeVisit') ? 'success' : row.type === t('oa.typeTraining') ? 'warning' : row.type === t('oa.typeBusinessTrip') ? 'danger' : 'info'" size="small">{{ row.type }}</el-tag></template>
      <template #status="{ row }"><el-tag :type="row.status === t('oa.statusCompleted') ? 'success' : row.status === t('oa.statusInProgress') ? 'warning' : row.status === t('oa.statusCancelled') ? 'danger' : 'info'" size="small">{{ row.status }}</el-tag></template>
      <template #priority="{ row }"><el-tag :type="row.priority === t('oa.priorityHigh') ? 'danger' : row.priority === t('oa.priorityMedium') ? 'warning' : 'info'" size="small">{{ row.priority }}</el-tag></template>
      <template #operation="{ row }">
        <MoreActions :items="[
          { label: $t('common.detail'), onClick: () => handleView(row) },
          { label: $t('common.edit'), onClick: () => handleEdit(row) },
          { label: $t('oa.markComplete'), type: 'success', hidden: row.status === t('oa.statusCompleted') || row.status === t('oa.statusCancelled'), onClick: () => handleComplete(row) },
          { label: $t('common.delete'), type: 'danger', onClick: () => handleDelete(row) }
        ]" />
      </template>
    </BaseTable>

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="600px" :close-on-click-modal="false" @close="cancelDialog">
      <el-form ref="formRef" :model="formData" :rules="formRules" label-width="100px">
        <el-form-item :label="$t('oa.scheduleTitle')" prop="title"><el-input v-model="formData.title" /></el-form-item>
        <el-form-item :label="$t('oa.type')" prop="type">
          <el-select v-model="formData.type" style="width: 100%">
            <el-option v-for="o in typeOptions" :key="o" :label="o" :value="o" />
          </el-select>
        </el-form-item>
        <el-form-item :label="$t('oa.startTime')" prop="startTime"><el-input v-model="formData.startTime" :placeholder="$t('oa.placeholderDateTime')" /></el-form-item>
        <el-form-item :label="$t('oa.endTime')" prop="endTime"><el-input v-model="formData.endTime" :placeholder="$t('oa.placeholderDateTimeEnd')" /></el-form-item>
        <el-form-item :label="$t('oa.location')" prop="location"><el-input v-model="formData.location" /></el-form-item>
        <el-form-item :label="$t('oa.participants')" prop="participants"><el-input v-model="formData.participants" /></el-form-item>
        <el-form-item :label="$t('oa.priority')" prop="priority">
          <el-radio-group v-model="formData.priority">
            <el-radio v-for="p in priorityOptions" :key="p" :value="p">{{ p }}</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item :label="$t('oa.content')" prop="content"><el-input v-model="formData.content" type="textarea" :rows="3" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="cancelDialog">{{ $t('common.cancel') }}</el-button>
        <el-button type="primary" :loading="submitLoading" @click="handleSubmit">{{ $t('common.confirm') }}</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="viewVisible" :title="$t('oa.scheduleDetail')" width="600px">
      <el-descriptions v-if="viewRow" :column="2" border>
        <el-descriptions-item :label="$t('oa.scheduleTitle')" :span="2">{{ viewRow.title }}</el-descriptions-item>
        <el-descriptions-item :label="$t('oa.type')">{{ viewRow.type }}</el-descriptions-item>
        <el-descriptions-item :label="$t('oa.priority')">{{ viewRow.priority }}</el-descriptions-item>
        <el-descriptions-item :label="$t('oa.startTime')">{{ viewRow.startTime }}</el-descriptions-item>
        <el-descriptions-item :label="$t('oa.endTime')">{{ viewRow.endTime }}</el-descriptions-item>
        <el-descriptions-item :label="$t('oa.location')">{{ viewRow.location }}</el-descriptions-item>
        <el-descriptions-item :label="$t('oa.participants')">{{ viewRow.participants }}</el-descriptions-item>
        <el-descriptions-item :label="$t('common.status')">{{ viewRow.status }}</el-descriptions-item>
        <el-descriptions-item :label="$t('oa.content')" :span="2">{{ viewRow.content }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Refresh, Calendar } from '@element-plus/icons-vue'
import BaseSearch from '@/components/BaseSearch.vue'
import BaseTable from '@/components/BaseTable.vue'
import MoreActions from '@/components/MoreActions.vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const typeOptions = computed(() => [t('oa.typeMeeting'), t('oa.typeVisit'), t('oa.typeTraining'), t('oa.typeBusinessTrip'), t('oa.typeOther')])
const priorityOptions = computed(() => [t('oa.priorityHigh'), t('oa.priorityMedium'), t('oa.priorityLow')])
const statusOptions = computed(() => [t('oa.statusPending'), t('oa.statusInProgress'), t('oa.statusCompleted'), t('oa.statusCancelled')])
const searchItems = computed(() => [
  { prop: 'title', label: t('oa.scheduleTitle'), type: 'input' },
  { prop: 'type', label: t('oa.type'), type: 'select', options: typeOptions.value.map(v => ({ value: v, label: v })) },
  { prop: 'status', label: t('common.status'), type: 'select', options: statusOptions.value.map(v => ({ value: v, label: v })) }
])
const columns = computed(() => [
  { prop: 'title', label: t('oa.scheduleTitle'), minWidth: 200, showOverflowTooltip: true },
  { prop: 'type', label: t('oa.type'), width: 100, slot: 'type' },
  { prop: 'startTime', label: t('oa.startTime'), width: 160 },
  { prop: 'endTime', label: t('oa.endTime'), width: 160 },
  { prop: 'location', label: t('oa.location'), width: 140 },
  { prop: 'participants', label: t('oa.participants'), width: 120 },
  { prop: 'priority', label: t('oa.priority'), width: 100, slot: 'priority' },
  { prop: 'status', label: t('common.status'), width: 100, slot: 'status' }
])
const loading = ref(false), tableData = ref([]), total = ref(0)
const dialogVisible = ref(false), dialogTitle = ref(''), submitLoading = ref(false), formRef = ref(null)
const viewVisible = ref(false), viewRow = ref(null)
const queryParams = reactive({ pageNum: 1, pageSize: 10, title: '', type: '', status: '' })
const formData = reactive({ id: undefined, title: '', type: '', startTime: '', endTime: '', location: '', participants: '', priority: '', content: '', status: '' })
const formRules = computed(() => ({ title: [{ required: true, message: t('oa.inputScheduleTitle'), trigger: 'blur' }], startTime: [{ required: true, message: t('oa.inputStartTime'), trigger: 'blur' }] }))
const locations = ['第一会议室', '第二会议室', '客户现场', '培训室', '线上会议', '展厅']
const participantsList = ['全体员工', '销售部', '管理层', '研发组', '项目组', '财务部']
const titles = ['Q2 销售总结会', '拜访华为总部', '新员工入职培训', '项目周会', '客户方案评审', '年度预算讨论', '产品发布准备', '技术分享会']

async function loadData() {
  loading.value = true
  try {
    const allT = typeOptions.value, allS = statusOptions.value, allP = priorityOptions.value
    const { title = '', type = '', status = '', pageNum = 1, pageSize = 10 } = queryParams
    const all = Array.from({ length: 42 }, (_, i) => ({
      id: i + 1, title: titles[i % titles.length], type: allT[i % allT.length],
      startTime: `2025-${String((i % 6) + 1).padStart(2, '0')}-${String((i % 28) + 1).padStart(2, '0')} 09:00`,
      endTime: `2025-${String((i % 6) + 1).padStart(2, '0')}-${String((i % 28) + 1).padStart(2, '0')} 10:00`,
      location: locations[i % locations.length], participants: participantsList[i % participantsList.length],
      priority: allP[i % allP.length], status: allS[i % allS.length], content: '请相关同事准时参加'
    }))
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
function handleAdd() { dialogTitle.value = t('oa.newSchedule'); Object.keys(formData).forEach(k => formData[k] = ''); formData.id = undefined; formData.type = typeOptions.value[0]; formData.priority = t('oa.priorityMedium'); formData.status = t('oa.statusPending'); dialogVisible.value = true }
function handleEdit(row) { dialogTitle.value = t('oa.editSchedule'); Object.assign(formData, row); dialogVisible.value = true }
function handleView(row) { viewRow.value = row; viewVisible.value = true }
function handleViewToday() { ElMessage.info(t('oa.todayScheduleCount', { count: 3 })) }
async function handleComplete(row) { await ElMessageBox.confirm(t('oa.markCompleteConfirm', { title: row.title }), t('header.tips'), { type: 'warning' }); ElMessage.success(t('oa.markCompleteSuccess')); loadData() }
function cancelDialog() { dialogVisible.value = false; formRef.value?.resetFields() }
async function handleSubmit() { const valid = await formRef.value?.validate().catch(() => false); if (!valid) return; submitLoading.value = true; try { await new Promise(r => setTimeout(r, 500)); ElMessage.success(t('oa.saveSuccess')); dialogVisible.value = false; loadData() } catch { ElMessage.error(t('oa.saveFailed')) } finally { submitLoading.value = false } }
async function handleDelete(row) { await ElMessageBox.confirm(t('oa.deleteScheduleConfirm', { title: row.title }), t('header.tips'), { type: 'warning' }); ElMessage.success(t('oa.deleteSuccess')); loadData() }
onMounted(() => loadData())
</script>

<style lang="scss" scoped>
.page-container .table-toolbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; padding: 14px 18px; background: #fff; border-radius: var(--border-radius-base); .toolbar-left { display: flex; gap: 10px; } .toolbar-right { display: flex; gap: 8px; } }
</style>
