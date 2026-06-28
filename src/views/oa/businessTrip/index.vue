<template>
  <div class="page-container">
    <BaseSearch :search-items="searchItems" @search="handleSearch" @reset="handleReset" />
    <div class="table-toolbar">
      <div class="toolbar-left"><el-button type="primary" :icon="Plus" @click="handleAdd">{{ $t('oa.newBusinessTrip') }}</el-button></div>
      <div class="toolbar-right"><el-button :icon="Refresh" circle @click="loadData" /></div>
    </div>
    <BaseTable :columns="columns" :table-data="tableData" :loading="loading" :total="total" :current-page.sync="queryParams.pageNum" :page-size.sync="queryParams.pageSize" :show-index="true" @current-change="handlePageChange" @size-change="handleSizeChange">
      <template #status="{ row }"><el-tag :type="statusTagType(row.status)" size="small">{{ statusLabelMap[row.status] }}</el-tag></template>
      <template #operation="{ row }">
        <MoreActions :items="[
          { label: $t('common.detail'), onClick: () => handleView(row) },
          { label: $t('oa.approve'), type: 'success', hidden: row.status !== 0, onClick: () => openApprove(row, true) },
          { label: $t('oa.reject'), type: 'danger', hidden: row.status !== 0, onClick: () => openApprove(row, false) },
          { label: $t('common.edit'), hidden: row.status !== 0, onClick: () => handleEdit(row) },
          { label: $t('common.delete'), type: 'danger', onClick: () => handleDelete(row) }
        ]" />
      </template>
    </BaseTable>

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="600px" :close-on-click-modal="false" @close="cancelDialog">
      <el-form ref="formRef" :model="formData" :rules="formRules" label-width="100px">
        <el-form-item :label="$t('oa.traveler')" prop="applicant"><el-input v-model="formData.applicant" /></el-form-item>
        <el-form-item :label="$t('oa.department')" prop="dept"><el-input v-model="formData.dept" /></el-form-item>
        <el-form-item :label="$t('oa.destination')" prop="destination"><el-input v-model="formData.destination" /></el-form-item>
        <el-form-item :label="$t('oa.startDate')" prop="startDate"><el-input v-model="formData.startDate" :placeholder="$t('oa.placeholderDate')" /></el-form-item>
        <el-form-item :label="$t('oa.endDate')" prop="endDate"><el-input v-model="formData.endDate" :placeholder="$t('oa.placeholderEndDate')" /></el-form-item>
        <el-form-item :label="$t('oa.tripDays')" prop="days"><el-input-number v-model="formData.days" :min="1" :max="60" style="width: 100%" /></el-form-item>
        <el-form-item :label="$t('oa.tripBudget')" prop="budget"><el-input-number v-model="formData.budget" :min="0" :precision="2" style="width: 100%" /></el-form-item>
        <el-form-item :label="$t('oa.tripReason')" prop="reason"><el-input v-model="formData.reason" type="textarea" :rows="3" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="cancelDialog">{{ $t('common.cancel') }}</el-button>
        <el-button type="primary" :loading="submitLoading" @click="handleSubmit">{{ $t('common.confirm') }}</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="approveVisible" :title="approveTitle" width="500px" :close-on-click-modal="false">
      <el-form :model="approveForm" label-width="100px">
        <el-form-item :label="$t('oa.traveler')"><el-input :value="approveRow?.applicant" disabled /></el-form-item>
        <el-form-item :label="$t('oa.destination')"><el-input :value="approveRow?.destination" disabled /></el-form-item>
        <el-form-item :label="$t('oa.tripDays')">{{ approveRow?.days }} {{ $t('oa.days') }}</el-form-item>
        <el-form-item :label="$t('oa.tripBudget')">{{ formatMoney(approveRow?.budget) }}</el-form-item>
        <el-form-item :label="approveForm.approved ? $t('oa.approvalComment') : $t('oa.approveRejectReason')" required>
          <el-input v-model="approveForm.comment" type="textarea" :rows="3" :placeholder="approveForm.approved ? $t('oa.inputApproveComment') : $t('oa.inputRejectReason')" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="approveVisible = false">{{ $t('common.cancel') }}</el-button>
        <el-button :type="approveForm.approved ? 'success' : 'danger'" :loading="approveLoading" @click="submitApprove">{{ $t('common.confirm') }}</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="viewVisible" :title="$t('oa.businessTripDetail')" width="600px">
      <el-descriptions v-if="viewRow" :column="2" border>
        <el-descriptions-item :label="$t('oa.applicant')">{{ viewRow.applicant }}</el-descriptions-item>
        <el-descriptions-item :label="$t('oa.department')">{{ viewRow.dept }}</el-descriptions-item>
        <el-descriptions-item :label="$t('oa.destination')">{{ viewRow.destination }}</el-descriptions-item>
        <el-descriptions-item :label="$t('oa.tripDays')">{{ viewRow.days }} {{ $t('oa.days') }}</el-descriptions-item>
        <el-descriptions-item :label="$t('oa.startDate')">{{ viewRow.startDate }}</el-descriptions-item>
        <el-descriptions-item :label="$t('oa.endDate')">{{ viewRow.endDate }}</el-descriptions-item>
        <el-descriptions-item :label="$t('oa.tripBudget')">{{ formatMoney(viewRow.budget) }}</el-descriptions-item>
        <el-descriptions-item :label="$t('common.status')">{{ statusLabelMap[viewRow.status] }}</el-descriptions-item>
        <el-descriptions-item :label="$t('oa.tripReason')" :span="2">{{ viewRow.reason }}</el-descriptions-item>
        <el-descriptions-item v-if="viewRow.approver" :label="$t('oa.approver')">{{ viewRow.approver }}</el-descriptions-item>
        <el-descriptions-item v-if="viewRow.approveTime" :label="$t('oa.approveTime')">{{ viewRow.approveTime }}</el-descriptions-item>
        <el-descriptions-item v-if="viewRow.approveComment" :label="$t('oa.approvalComment')" :span="2">{{ viewRow.approveComment }}</el-descriptions-item>
      </el-descriptions>
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

const { t, locale } = useI18n()
function formatMoney(v) { if (v === null || v === undefined || v === '') return '0.00'; return Number(v).toLocaleString(locale.value === 'zh-CN' ? 'zh-CN' : 'en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }

const statusLabelMap = computed(() => ({ 0: t('oa.approvalTabsPending'), 1: t('oa.approveSuccess'), 2: t('oa.rejectSuccess') }))
function statusTagType(s) { return { 0: 'warning', 1: 'success', 2: 'danger' }[s] || 'info' }
const statusOptions = computed(() => [{ value: 0, label: t('oa.approvalTabsPending') }, { value: 1, label: t('oa.approveSuccess') }, { value: 2, label: t('oa.rejectSuccess') }])
const searchItems = computed(() => [
  { prop: 'applicant', label: t('oa.traveler'), type: 'input' },
  { prop: 'destination', label: t('oa.destination'), type: 'input' },
  { prop: 'status', label: t('common.status'), type: 'select', options: statusOptions.value }
])
const columns = computed(() => [
  { prop: 'applicant', label: t('oa.traveler'), width: 100 },
  { prop: 'dept', label: t('oa.department'), width: 120 },
  { prop: 'destination', label: t('oa.destination'), width: 160 },
  { prop: 'startDate', label: t('oa.startDate'), width: 120 },
  { prop: 'endDate', label: t('oa.endDate'), width: 120 },
  { prop: 'days', label: t('oa.tripDays'), width: 80, align: 'center' },
  { prop: 'budget', label: t('oa.tripBudget'), width: 130, align: 'right' },
  { prop: 'status', label: t('common.status'), width: 100, slot: 'status' }
])
const loading = ref(false), tableData = ref([]), total = ref(0)
const dialogVisible = ref(false), dialogTitle = ref(''), submitLoading = ref(false), formRef = ref(null)
const viewVisible = ref(false), viewRow = ref(null)
const approveVisible = ref(false), approveLoading = ref(false), approveRow = ref(null), approveTitle = ref('')
const approveForm = reactive({ approved: true, comment: '' })
const queryParams = reactive({ pageNum: 1, pageSize: 10, applicant: '', destination: '', status: '' })
const formData = reactive({ id: undefined, applicant: '', dept: '', destination: '', startDate: '', endDate: '', days: 1, budget: 0, reason: '' })
const formRules = computed(() => ({ applicant: [{ required: true, message: t('oa.inputTraveler'), trigger: 'blur' }], destination: [{ required: true, message: t('oa.inputDestination'), trigger: 'blur' }] }))
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
      return { id: i + 1, applicant: names[i % names.length], dept: depts[i % depts.length], destination: destinations[i % destinations.length],
        startDate: `2025-${String((i % 6) + 1).padStart(2, '0')}-${String((i % 28) + 1).padStart(2, '0')}`,
        endDate: `2025-${String((i % 6) + 1).padStart(2, '0')}-${String(((i % 28) + 5) % 28 + 1).padStart(2, '0')}`,
        days: ((i % 5) + 1), budget: 2000 + (i * 500) % 10000, status: stt, reason: reasons[i % reasons.length],
        approver: stt !== 0 ? '张总监' : '', approveTime: stt !== 0 ? `2025-${String((i % 6) + 1).padStart(2, '0')}-${String((i % 28) + 1).padStart(2, '0')} 14:00:00` : '',
        approveComment: stt === 1 ? '同意，注意安全' : (stt === 2 ? '费用超标，请重新申请' : '') }
    })
    let filtered = all
    if (applicant) filtered = filtered.filter(x => x.applicant.includes(applicant))
    if (destination) filtered = filtered.filter(x => x.destination.includes(destination))
    if (status !== '') filtered = filtered.filter(x => x.status === Number(status))
    const start = (Number(pageNum) - 1) * Number(pageSize)
    tableData.value = filtered.slice(start, start + Number(pageSize)); total.value = filtered.length
  } finally { loading.value = false }
}
function handleSearch(p) { Object.assign(queryParams, p, { pageNum: 1 }); loadData() }
function handleReset() { Object.keys(queryParams).forEach(k => { if (k !== 'pageNum' && k !== 'pageSize') queryParams[k] = '' }); loadData() }
function handlePageChange(p) { queryParams.pageNum = p; loadData() }
function handleSizeChange(s) { queryParams.pageSize = s; queryParams.pageNum = 1; loadData() }
function handleAdd() { dialogTitle.value = t('oa.newBusinessTrip'); Object.keys(formData).forEach(k => formData[k] = ''); formData.id = undefined; formData.days = 1; formData.budget = 0; dialogVisible.value = true }
function handleEdit(row) { dialogTitle.value = t('oa.editBusinessTrip'); Object.assign(formData, row); dialogVisible.value = true }
function handleView(row) { viewRow.value = row; viewVisible.value = true }
function openApprove(row, approved) { approveRow.value = row; approveForm.approved = approved; approveForm.comment = ''; approveTitle.value = approved ? t('oa.approveAction') : t('oa.rejectAction'); approveVisible.value = true }
async function submitApprove() { if (!approveForm.comment.trim()) { ElMessage.warning(approveForm.approved ? t('oa.inputApproveComment') : t('oa.inputRejectReason')); return } approveLoading.value = true; try { await new Promise(r => setTimeout(r, 500)); ElMessage.success(approveForm.approved ? t('oa.approveAndDispatch') : t('oa.rejectSuccess')); approveVisible.value = false; loadData() } finally { approveLoading.value = false } }
function cancelDialog() { dialogVisible.value = false; formRef.value?.resetFields() }
async function handleSubmit() { const valid = await formRef.value?.validate().catch(() => false); if (!valid) return; submitLoading.value = true; try { await new Promise(r => setTimeout(r, 500)); ElMessage.success(t('oa.submitSuccess')); dialogVisible.value = false; loadData() } catch { ElMessage.error(t('oa.submitFailed')) } finally { submitLoading.value = false } }
async function handleDelete(row) { await ElMessageBox.confirm(t('oa.deleteTripConfirm', { applicant: row.applicant }), t('header.tips'), { type: 'warning' }); ElMessage.success(t('oa.deleteSuccess')); loadData() }
onMounted(() => loadData())
</script>

<style lang="scss" scoped>
.page-container .table-toolbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; padding: 14px 18px; background: #fff; border-radius: var(--border-radius-base); .toolbar-left { display: flex; gap: 10px; } .toolbar-right { display: flex; gap: 8px; } }
</style>
