<template>
  <div class="page-container">
    <el-tabs v-model="activeTab" class="approval-tabs">
      <el-tab-pane :label="$t('oa.approvalTabsPending')" name="pending" />
      <el-tab-pane :label="$t('oa.approvalTabsApproved')" name="approved" />
      <el-tab-pane :label="$t('oa.approvalTabsMine')" name="mine" />
    </el-tabs>
    <BaseSearch :search-items="searchItems" @search="handleSearch" @reset="handleReset" />
    <div class="table-toolbar">
      <div class="toolbar-left"><el-button :icon="Refresh" circle @click="loadData" /></div>
    </div>
    <BaseTable :columns="columns" :table-data="tableData" :loading="loading" :total="total" :current-page.sync="queryParams.pageNum" :page-size.sync="queryParams.pageSize" :show-index="true" @current-change="handlePageChange" @size-change="handleSizeChange">
      <template #type="{ row }"><el-tag size="small">{{ typeLabelMap[row.type] || row.type }}</el-tag></template>
      <template #status="{ row }"><BaseStatusTag :type="row.status === 1 ? 'success' : row.status === 0 ? 'warning' : 'danger'">{{ statusLabelList[row.status] || $t('common.normal') }}</BaseStatusTag></template>
      <template #operation="{ row }">
        <el-button type="primary" link size="small" @click="handleView(row)">{{ $t('common.detail') }}</el-button>
        <el-button v-if="activeTab === 'pending'" type="success" link size="small" @click="handleApprove(row, 1)">{{ $t('oa.approve') }}</el-button>
        <el-button v-if="activeTab === 'pending'" type="danger" link size="small" @click="handleApprove(row, 2)">{{ $t('oa.reject') }}</el-button>
      </template>
    </BaseTable>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Refresh } from '@element-plus/icons-vue'
import BaseSearch from '@/components/BaseSearch.vue'
import BaseTable from '@/components/BaseTable.vue'
import BaseStatusTag from '@/components/BaseStatusTag.vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const activeTab = ref('pending')

const typeLabelMap = computed(() => ({ leave: t('oa.approvalTypeMap.leave'), expense: t('oa.approvalTypeMap.expense'), purchase: t('oa.approvalTypeMap.purchase') }))
const statusLabelList = computed(() => [t('oa.approvalTabsPending'), t('oa.approveSuccess'), t('oa.rejectSuccess')])
const searchItems = computed(() => [
  { prop: 'title', label: t('oa.inputTitle'), type: 'input' },
  { prop: 'applicant', label: t('oa.applicant'), type: 'input' },
  { prop: 'type', label: t('oa.type'), type: 'select', options: Object.entries(typeLabelMap.value).map(([v, l]) => ({ value: v, label: l })) }
])
const columns = computed(() => [
  { prop: 'title', label: t('oa.inputTitle'), minWidth: 180 },
  { prop: 'type', label: t('oa.type'), width: 100, slot: 'type' },
  { prop: 'applicant', label: t('oa.applicant'), width: 110 },
  { prop: 'dept', label: t('oa.department'), width: 120 },
  { prop: 'applyTime', label: t('oa.applyTime'), width: 170 },
  { prop: 'status', label: t('common.status'), width: 90, slot: 'status' }
])

const loading = ref(false), tableData = ref([]), total = ref(0)
const queryParams = reactive({ pageNum: 1, pageSize: 10, title: '', applicant: '', type: '' })

async function loadData() {
  loading.value = true
  try {
    const res = await (await import('@/utils/request')).default({ url: '/api/oa/approval/list', method: 'get', params: { ...queryParams, status: activeTab.value } })
    tableData.value = res.data.list || []; total.value = res.data.total || 0
  } finally { loading.value = false }
}
function handleSearch(p) { Object.assign(queryParams, p, { pageNum: 1 }); loadData() }
function handleReset() { Object.keys(queryParams).forEach(k => { if (k !== 'pageNum' && k !== 'pageSize') queryParams[k] = '' }); loadData() }
function handlePageChange(p) { queryParams.pageNum = p; loadData() }
function handleSizeChange(s) { queryParams.pageSize = s; queryParams.pageNum = 1; loadData() }
function handleView(row) { ElMessage.info(`${t('common.detail')}: ${row.title}`) }
async function handleApprove(row, status) {
  const action = status === 1 ? t('oa.approve') : t('oa.reject')
  await ElMessageBox.confirm(t('oa.approveRejectAction', { action }), t('header.tips'), { type: 'warning' })
  ElMessage.success(t(status === 1 ? 'oa.approveSuccess' : 'oa.rejectSuccess')); loadData()
}
onMounted(() => loadData())
</script>

<style lang="scss" scoped>
.page-container .approval-tabs { margin-bottom: 16px; background: #fff; padding: 0 18px; border-radius: var(--border-radius-base); }
.page-container .table-toolbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; padding: 14px 18px; background: #fff; border-radius: var(--border-radius-base); .toolbar-left { display: flex; gap: 8px; } }
</style>
