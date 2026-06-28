<template>
  <div class="page-container">
    <BaseSearch :search-items="searchItems" @search="handleSearch" @reset="handleReset" />
    <div class="table-toolbar">
      <div class="toolbar-left"><el-button type="primary" :icon="Plus" @click="handleAdd">{{ $t('oa.newCarRequest') }}</el-button></div>
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
        <el-form-item :label="$t('oa.applicant')" prop="applicant"><el-input v-model="formData.applicant" /></el-form-item>
        <el-form-item :label="$t('oa.department')" prop="dept"><el-input v-model="formData.dept" /></el-form-item>
        <el-form-item :label="$t('oa.carType')" prop="carType"><el-select v-model="formData.carType" style="width: 100%"><el-option v-for="o in carTypeOptions" :key="o" :label="o" :value="o" /></el-select></el-form-item>
        <el-form-item :label="$t('oa.useTime')" prop="useTime"><el-input v-model="formData.useTime" :placeholder="$t('oa.placeholderDateTime')" /></el-form-item>
        <el-form-item :label="$t('oa.returnTime')" prop="returnTime"><el-input v-model="formData.returnTime" :placeholder="$t('oa.placeholderTimeEnd')" /></el-form-item>
        <el-form-item :label="$t('oa.destination')" prop="destination"><el-input v-model="formData.destination" /></el-form-item>
        <el-form-item :label="$t('oa.passengers')" prop="passengers"><el-input-number v-model="formData.passengers" :min="1" :max="50" style="width: 100%" /></el-form-item>
        <el-form-item :label="$t('oa.carReason')" prop="reason"><el-input v-model="formData.reason" type="textarea" :rows="3" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="cancelDialog">{{ $t('common.cancel') }}</el-button>
        <el-button type="primary" :loading="submitLoading" @click="handleSubmit">{{ $t('common.confirm') }}</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="approveVisible" :title="approveTitle" width="500px" :close-on-click-modal="false">
      <el-form :model="approveForm" label-width="100px">
        <el-form-item :label="$t('oa.applicant')"><el-input :value="approveRow?.applicant" disabled /></el-form-item>
        <el-form-item :label="$t('oa.carType')"><el-input :value="approveRow?.carType" disabled /></el-form-item>
        <el-form-item :label="$t('oa.destination')"><el-input :value="approveRow?.destination" disabled /></el-form-item>
        <el-form-item :label="$t('oa.useTime')"><el-input :value="approveRow?.useTime" disabled /></el-form-item>
        <el-form-item v-if="approveForm.approved" :label="$t('oa.plateNo')" required><el-input v-model="approveForm.carNo" :placeholder="$t('oa.placeholderPlate')" /></el-form-item>
        <el-form-item v-if="approveForm.approved" :label="$t('oa.driver')" required><el-input v-model="approveForm.driver" /></el-form-item>
        <el-form-item v-if="approveForm.approved" :label="$t('oa.driverPhone')"><el-input v-model="approveForm.phone" /></el-form-item>
        <el-form-item v-if="!approveForm.approved" :label="$t('oa.approveRejectReason')" required><el-input v-model="approveForm.comment" type="textarea" :rows="3" :placeholder="$t('oa.inputRejectReason')" /></el-form-item>
        <el-form-item v-else :label="$t('oa.remark')"><el-input v-model="approveForm.comment" type="textarea" :rows="2" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="approveVisible = false">{{ $t('common.cancel') }}</el-button>
        <el-button :type="approveForm.approved ? 'success' : 'danger'" :loading="approveLoading" @click="submitApprove">{{ $t('common.confirm') }}</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="viewVisible" :title="$t('oa.carRequestDetail')" width="600px">
      <el-descriptions v-if="viewRow" :column="2" border>
        <el-descriptions-item :label="$t('oa.applicant')">{{ viewRow.applicant }}</el-descriptions-item>
        <el-descriptions-item :label="$t('oa.department')">{{ viewRow.dept }}</el-descriptions-item>
        <el-descriptions-item :label="$t('oa.carType')">{{ viewRow.carType }}</el-descriptions-item>
        <el-descriptions-item :label="$t('oa.passengers')">{{ viewRow.passengers }}</el-descriptions-item>
        <el-descriptions-item :label="$t('oa.useTime')">{{ viewRow.useTime }}</el-descriptions-item>
        <el-descriptions-item :label="$t('oa.returnTime')">{{ viewRow.returnTime }}</el-descriptions-item>
        <el-descriptions-item :label="$t('oa.destination')">{{ viewRow.destination }}</el-descriptions-item>
        <el-descriptions-item :label="$t('common.status')">{{ statusLabelMap[viewRow.status] }}</el-descriptions-item>
        <el-descriptions-item :label="$t('oa.carReason')" :span="2">{{ viewRow.reason }}</el-descriptions-item>
        <el-descriptions-item v-if="viewRow.carNo" :label="$t('oa.plateNo')">{{ viewRow.carNo }}</el-descriptions-item>
        <el-descriptions-item v-if="viewRow.driver" :label="$t('oa.driver')">{{ viewRow.driver }}</el-descriptions-item>
        <el-descriptions-item v-if="viewRow.driverPhone" :label="$t('oa.driverPhone')" :span="2">{{ viewRow.driverPhone }}</el-descriptions-item>
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

const { t } = useI18n()

const carTypeOptions = computed(() => [t('oa.carTypeBusiness'), t('oa.carTypeSedan'), t('oa.carTypeMinibus'), t('oa.carTypeBus'), t('oa.carTypeTruck')])
const statusLabelMap = computed(() => ({ 0: t('oa.approvalTabsPending'), 1: t('oa.approveSuccess'), 2: t('oa.rejectSuccess'), 3: t('oa.approveAndDispatch') }))
function statusTagType(s) { return { 0: 'warning', 1: 'success', 2: 'danger', 3: 'primary' }[s] || 'info' }
const statusOptions = computed(() => [{ value: 0, label: t('oa.approvalTabsPending') }, { value: 1, label: t('oa.approveSuccess') }, { value: 2, label: t('oa.rejectSuccess') }, { value: 3, label: t('oa.approveAndDispatch') }])
const searchItems = computed(() => [
  { prop: 'applicant', label: t('oa.applicant'), type: 'input' },
  { prop: 'status', label: t('common.status'), type: 'select', options: statusOptions.value }
])
const columns = computed(() => [
  { prop: 'applicant', label: t('oa.applicant'), width: 100 },
  { prop: 'dept', label: t('oa.department'), width: 120 },
  { prop: 'carType', label: t('oa.carType'), width: 100 },
  { prop: 'useTime', label: t('oa.useTime'), width: 160 },
  { prop: 'returnTime', label: t('oa.returnTime'), width: 160 },
  { prop: 'destination', label: t('oa.destination'), width: 140 },
  { prop: 'passengers', label: t('oa.passengers'), width: 100, align: 'center' },
  { prop: 'status', label: t('common.status'), width: 100, slot: 'status' }
])
const loading = ref(false), tableData = ref([]), total = ref(0)
const dialogVisible = ref(false), dialogTitle = ref(''), submitLoading = ref(false), formRef = ref(null)
const viewVisible = ref(false), viewRow = ref(null)
const approveVisible = ref(false), approveLoading = ref(false), approveRow = ref(null), approveTitle = ref('')
const approveForm = reactive({ approved: true, comment: '', carNo: '', driver: '', phone: '' })
const queryParams = reactive({ pageNum: 1, pageSize: 10, applicant: '', status: '' })
const formData = reactive({ id: undefined, applicant: '', dept: '', carType: '', useTime: '', returnTime: '', destination: '', passengers: 1, reason: '' })
const formRules = computed(() => ({ applicant: [{ required: true, message: t('oa.inputApplicant'), trigger: 'blur' }], useTime: [{ required: true, message: t('oa.inputUseTime'), trigger: 'blur' }] }))
const names = ['张伟', '李娜', '王强', '赵敏', '刘芳', '陈晨', '黄磊', '周杰']
const depts = ['销售部', '市场部', '研发部', '采购部', '财务部', '行政部']
const destinations = ['机场', '客户A公司', '客户B工厂', '高铁站', '展览中心', '总部', '分公司']
const drivers = ['王师傅', '李师傅', '张师傅', '刘师傅', '赵师傅']
const carNumbers = ['京A12345', '京B67890', '京C11111', '京D22222', '京E33333']

async function loadData() {
  loading.value = true
  try {
    const allCT = carTypeOptions.value
    const { applicant = '', status = '', pageNum = 1, pageSize = 10 } = queryParams
    const all = Array.from({ length: 30 }, (_, i) => {
      const stt = i % 4
      return { id: i + 1, applicant: names[i % names.length], dept: depts[i % depts.length], carType: allCT[i % allCT.length],
        useTime: `2025-${String((i % 6) + 1).padStart(2, '0')}-${String((i % 28) + 1).padStart(2, '0')} 09:00`,
        returnTime: `2025-${String((i % 6) + 1).padStart(2, '0')}-${String((i % 28) + 1).padStart(2, '0')} 18:00`,
        destination: destinations[i % destinations.length], passengers: ((i % 5) + 1), status: stt,
        reason: ['客户接待', '员工通勤', '货物运输', '参展', '外出会议'][i % 5],
        carNo: stt >= 1 ? carNumbers[i % carNumbers.length] : '', driver: stt >= 1 ? drivers[i % drivers.length] : '',
        driverPhone: stt >= 1 ? `138${String(10000000 + i).slice(-8)}` : '', approver: stt !== 0 ? '张总监' : '',
        approveTime: stt !== 0 ? `2025-${String((i % 6) + 1).padStart(2, '0')}-${String((i % 28) + 1).padStart(2, '0')} 14:00:00` : '',
        approveComment: stt === 2 ? '当天车辆紧张，请改期' : (stt === 1 ? '已安排司机' : (stt === 3 ? '准时出发' : '')) }
    })
    let filtered = all
    if (applicant) filtered = filtered.filter(x => x.applicant.includes(applicant))
    if (status !== '') filtered = filtered.filter(x => x.status === Number(status))
    const start = (Number(pageNum) - 1) * Number(pageSize)
    tableData.value = filtered.slice(start, start + Number(pageSize)); total.value = filtered.length
  } finally { loading.value = false }
}
function handleSearch(p) { Object.assign(queryParams, p, { pageNum: 1 }); loadData() }
function handleReset() { Object.keys(queryParams).forEach(k => { if (k !== 'pageNum' && k !== 'pageSize') queryParams[k] = '' }); loadData() }
function handlePageChange(p) { queryParams.pageNum = p; loadData() }
function handleSizeChange(s) { queryParams.pageSize = s; queryParams.pageNum = 1; loadData() }
function handleAdd() { dialogTitle.value = t('oa.newCarRequest'); Object.keys(formData).forEach(k => formData[k] = ''); formData.id = undefined; formData.carType = carTypeOptions.value[0]; formData.passengers = 1; dialogVisible.value = true }
function handleEdit(row) { dialogTitle.value = t('oa.editCarRequest'); Object.assign(formData, row); dialogVisible.value = true }
function handleView(row) { viewRow.value = row; viewVisible.value = true }
function openApprove(row, approved) { approveRow.value = row; approveForm.approved = approved; approveForm.comment = ''; approveForm.carNo = ''; approveForm.driver = ''; approveForm.phone = ''; approveTitle.value = approved ? t('oa.approveAndDispatch') : t('oa.rejectCarRequest'); approveVisible.value = true }
async function submitApprove() { if (!approveForm.approved) { if (!approveForm.comment.trim()) { ElMessage.warning(t('oa.inputRejectReason')); return } } else { if (!approveForm.carNo.trim() || !approveForm.driver.trim()) { ElMessage.warning(t('oa.inputPlateAndDriver')); return } } approveLoading.value = true; try { await new Promise(r => setTimeout(r, 500)); ElMessage.success(approveForm.approved ? t('oa.approveAndDispatchSuccess') : t('oa.rejectSuccess')); approveVisible.value = false; loadData() } finally { approveLoading.value = false } }
function cancelDialog() { dialogVisible.value = false; formRef.value?.resetFields() }
async function handleSubmit() { const valid = await formRef.value?.validate().catch(() => false); if (!valid) return; submitLoading.value = true; try { await new Promise(r => setTimeout(r, 500)); ElMessage.success(t('oa.submitSuccess')); dialogVisible.value = false; loadData() } catch { ElMessage.error(t('oa.submitFailed')) } finally { submitLoading.value = false } }
async function handleDelete(row) { await ElMessageBox.confirm(t('oa.deleteCarConfirm', { applicant: row.applicant }), t('header.tips'), { type: 'warning' }); ElMessage.success(t('oa.deleteSuccess')); loadData() }
onMounted(() => loadData())
</script>

<style lang="scss" scoped>
.page-container .table-toolbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; padding: 14px 18px; background: #fff; border-radius: var(--border-radius-base); .toolbar-left { display: flex; gap: 10px; } .toolbar-right { display: flex; gap: 8px; } }
</style>
