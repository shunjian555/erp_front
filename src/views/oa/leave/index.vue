<template>
  <div class="page-container">
    <BaseSearch :search-items="searchItems" @search="handleSearch" @reset="handleReset" />
    <div class="table-toolbar">
      <div class="toolbar-left"><el-button type="primary" :icon="Plus" @click="handleAdd">{{ $t('oa.submitLeave') }}</el-button></div>
      <div class="toolbar-right"><el-button :icon="Refresh" circle @click="loadData" /></div>
    </div>
    <BaseTable :columns="columns" :table-data="tableData" :loading="loading" :total="total" :current-page.sync="queryParams.pageNum" :page-size.sync="queryParams.pageSize" :show-index="true" @current-change="handlePageChange" @size-change="handleSizeChange">
      <template #leaveType="{ row }"><el-tag size="small">{{ leaveTypeMap[row.leaveType] || row.leaveType }}</el-tag></template>
      <template #status="{ row }"><BaseStatusTag :type="row.status === 2 ? 'success' : row.status === 0 ? 'warning' : 'info'">{{ statusLabelList[row.status] || $t('common.normal') }}</BaseStatusTag></template>
      <template #operation="{ row }"><el-button type="primary" link size="small" @click="handleView(row)">{{ $t('common.detail') }}</el-button><el-button v-if="row.status === 0" type="danger" link size="small" @click="handleCancel(row)">{{ $t('common.cancel') }}</el-button></template>
    </BaseTable>
    <BaseDialog v-model="dialogVisible" :title="$t('oa.submitLeaveApply')" width="550px" :confirm-loading="submitLoading" @confirm="handleSubmit" @cancel="cancelDialog">
      <BaseForm ref="formRef" v-model="formData" :form-items="formItems" :form-rules="formRules" :col-count="1" />
    </BaseDialog>
    <BaseDialog v-model="viewDialogVisible" :title="$t('oa.leaveDetail')" width="620px" :show-footer="false" @cancel="viewDialogVisible = false">
      <el-descriptions v-if="viewData.id" :column="2" border>
        <el-descriptions-item :label="$t('oa.inputTitle')">{{ viewData.title }}</el-descriptions-item>
        <el-descriptions-item :label="$t('oa.leaveType')">
          <el-tag size="small">{{ leaveTypeMap[viewData.leaveType] || viewData.leaveType }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item :label="$t('oa.startDate')">{{ viewData.startDate }}</el-descriptions-item>
        <el-descriptions-item :label="$t('oa.endDate')">{{ viewData.endDate }}</el-descriptions-item>
        <el-descriptions-item :label="$t('oa.leaveDays')">{{ viewData.days }} {{ $t('oa.days') }}</el-descriptions-item>
        <el-descriptions-item :label="$t('oa.approvalStatus')">
          <BaseStatusTag :type="viewData.status === 2 ? 'success' : viewData.status === 0 ? 'warning' : 'info'">{{ statusLabelList[viewData.status] || $t('common.normal') }}</BaseStatusTag>
        </el-descriptions-item>
        <el-descriptions-item :label="$t('oa.applicant')">{{ viewData.applicantName || '-' }}</el-descriptions-item>
        <el-descriptions-item :label="$t('oa.applyTime')">{{ viewData.createTime || '-' }}</el-descriptions-item>
        <el-descriptions-item :label="$t('oa.leaveReason')" :span="2">{{ viewData.reason || '-' }}</el-descriptions-item>
        <template v-if="viewData.status !== 0">
          <el-descriptions-item :label="$t('oa.approver')">{{ viewData.approverName || '-' }}</el-descriptions-item>
          <el-descriptions-item :label="$t('oa.approveTime')">{{ viewData.approveTime || '-' }}</el-descriptions-item>
          <el-descriptions-item v-if="viewData.status === 1" :label="$t('oa.rejectReason')" :span="2">{{ viewData.approveRemark || '-' }}</el-descriptions-item>
        </template>
      </el-descriptions>
    </BaseDialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Refresh } from '@element-plus/icons-vue'
import BaseSearch from '@/components/BaseSearch.vue'
import BaseTable from '@/components/BaseTable.vue'
import BaseDialog from '@/components/BaseDialog.vue'
import BaseForm from '@/components/BaseForm.vue'
import BaseStatusTag from '@/components/BaseStatusTag.vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const leaveTypeMap = computed(() => ({ annual: t('oa.leaveTypeAnnual'), sick: t('oa.leaveTypeSick'), personal: t('oa.leaveTypePersonal'), marriage: t('oa.leaveTypeMarriage'), maternity: t('oa.leaveTypeMaternity') }))
const statusLabelList = computed(() => [t('oa.approvalTabsPending'), t('oa.rejectSuccess'), t('oa.approveSuccess')])
const searchItems = computed(() => [
  { prop: 'startDate', label: t('oa.startDate'), type: 'date' },
  { prop: 'endDate', label: t('oa.endDate'), type: 'date' }
])
const columns = computed(() => [
  { prop: 'title', label: t('oa.inputTitle'), minWidth: 150 },
  { prop: 'leaveType', label: t('oa.leaveType'), width: 90, slot: 'leaveType' },
  { prop: 'startDate', label: t('oa.startTime'), width: 160 },
  { prop: 'endDate', label: t('oa.endTime'), width: 160 },
  { prop: 'days', label: t('oa.tripDays'), width: 70, align: 'center' },
  { prop: 'reason', label: t('oa.reason'), minWidth: 150, showOverflowTooltip: true },
  { prop: 'status', label: t('common.status'), width: 90, slot: 'status' }
])
const formItems = computed(() => [
  { prop: 'title', label: t('oa.inputTitle'), type: 'input' },
  { prop: 'leaveType', label: t('oa.leaveType'), type: 'select', options: Object.entries(leaveTypeMap.value).map(([v, l]) => ({ value: v, label: l })) },
  { prop: 'startDate', label: t('oa.startDate'), type: 'date' },
  { prop: 'endDate', label: t('oa.endDate'), type: 'date' },
  { prop: 'reason', label: t('oa.reason'), type: 'textarea', rows: 3 }
])
const formRules = computed(() => ({ title: [{ required: true, message: t('oa.inputTitle'), trigger: 'blur' }], leaveType: [{ required: true, message: t('oa.selectType'), trigger: 'change' }] }))

const loading = ref(false), tableData = ref([]), total = ref(0)
const dialogVisible = ref(false), submitLoading = ref(false), formRef = ref(null)
const viewDialogVisible = ref(false)
const viewData = reactive({ id: undefined, title: '', leaveType: '', startDate: '', endDate: '', days: '', reason: '', status: 0, applicantName: '', createTime: '', approverName: '', approveTime: '', approveRemark: '' })
const queryParams = reactive({ pageNum: 1, pageSize: 10, startDate: '', endDate: '' })
const formData = reactive({ id: undefined, title: '', leaveType: '', startDate: '', endDate: '', reason: '' })

async function loadData() { loading.value = true; try { const res = await (await import('@/utils/request')).default({ url: '/api/oa/leave/list', method: 'get', params: queryParams }); tableData.value = res.data.list || []; total.value = res.data.total || 0 } finally { loading.value = false } }
function handleSearch(p) { Object.assign(queryParams, p, { pageNum: 1 }); loadData() }
function handleReset() { Object.keys(queryParams).forEach(k => { if (k !== 'pageNum' && k !== 'pageSize') queryParams[k] = '' }); loadData() }
function handlePageChange(p) { queryParams.pageNum = p; loadData() }
function handleSizeChange(s) { queryParams.pageSize = s; queryParams.pageNum = 1; loadData() }
function handleAdd() { Object.keys(formData).forEach(k => formData[k] = ''); formData.id = undefined; dialogVisible.value = true }
function cancelDialog() { dialogVisible.value = false; formRef.value?.resetFields() }
async function handleSubmit() { const valid = await formRef.value?.validate().catch(() => false); if (!valid) return; submitLoading.value = true; try { await new Promise(r => setTimeout(r, 500)); ElMessage.success(t('oa.submitSuccess')); dialogVisible.value = false; loadData() } catch { ElMessage.error(t('oa.submitFailed')) } finally { submitLoading.value = false } }
function handleView(row) { Object.assign(viewData, row); viewDialogVisible.value = true }
async function handleCancel(row) { await ElMessageBox.confirm(t('oa.cancelConfirm'), t('header.tips'), { type: 'warning' }); ElMessage.success(t('oa.cancelSuccess')); loadData() }
onMounted(() => loadData())
</script>

<style lang="scss" scoped>
.page-container .table-toolbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; padding: 14px 18px; background: #fff; border-radius: var(--border-radius-base); .toolbar-left { display: flex; gap: 10px; } .toolbar-right { display: flex; gap: 8px; } }
</style>
