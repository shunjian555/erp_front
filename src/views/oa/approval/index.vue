<template>
  <div class="page-container">
    <el-tabs v-model="activeTab" class="approval-tabs">
      <el-tab-pane label="待审批" name="pending" />
      <el-tab-pane label="已审批" name="approved" />
      <el-tab-pane label="我发起的" name="mine" />
    </el-tabs>
    <BaseSearch :search-items="searchItems" @search="handleSearch" @reset="handleReset" />
    <div class="table-toolbar">
      <div class="toolbar-left"><el-button :icon="Refresh" circle @click="loadData" /></div>
    </div>
    <BaseTable :columns="columns" :table-data="tableData" :loading="loading" :total="total" :current-page.sync="queryParams.pageNum" :page-size.sync="queryParams.pageSize" :show-index="true" @current-change="handlePageChange" @size-change="handleSizeChange">
      <template #type="{ row }"><el-tag size="small">{{ typeMap[row.type] || row.type }}</el-tag></template>
      <template #status="{ row }"><BaseStatusTag :type="row.status === 1 ? 'success' : row.status === 0 ? 'warning' : 'danger'">{{ ['待审批','已通过','已拒绝'][row.status] || '未知' }}</BaseStatusTag></template>
      <template #operation="{ row }">
        <el-button type="primary" link size="small" @click="handleView(row)">查看</el-button>
        <el-button v-if="activeTab === 'pending'" type="success" link size="small" @click="handleApprove(row, 1)">通过</el-button>
        <el-button v-if="activeTab === 'pending'" type="danger" link size="small" @click="handleApprove(row, 2)">拒绝</el-button>
      </template>
    </BaseTable>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Refresh } from '@element-plus/icons-vue'
import BaseSearch from '@/components/BaseSearch.vue'
import BaseTable from '@/components/BaseTable.vue'
import BaseStatusTag from '@/components/BaseStatusTag.vue'

const activeTab = ref('pending')
const typeMap = { leave: '请假', expense: '报销', purchase: '采购申请' }
const searchItems = [ { prop: 'title', label: '标题', type: 'input' }, { prop: 'applicant', label: '申请人', type: 'input' }, { prop: 'type', label: '类型', type: 'select', options: Object.entries(typeMap).map(([v, l]) => ({ value: v, label: l })) } ]
const columns = [ { prop: 'title', label: '标题', minWidth: 180 }, { prop: 'type', label: '类型', width: 100, slot: 'type' }, { prop: 'applicant', label: '申请人', width: 110 }, { prop: 'dept', label: '部门', width: 120 }, { prop: 'applyTime', label: '申请时间', width: 170 }, { prop: 'status', label: '状态', width: 90, slot: 'status' } ]

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
function handlePageChange(p) { queryParams.pageNum = p; loadData() }; function handleSizeChange(s) { queryParams.pageSize = s; queryParams.pageNum = 1; loadData() }

function handleView(row) { ElMessage.info(`查看: ${row.title}`) }
async function handleApprove(row, status) {
  const action = status === 1 ? '通过' : '拒绝'
  await ElMessageBox.confirm(`确定${action}该申请吗？`, '提示', { type: 'warning' })
  ElMessage.success(`${action}成功`); loadData()
}
onMounted(() => loadData())
</script>

<style lang="scss" scoped>
.page-container .approval-tabs { margin-bottom: 16px; background: #fff; padding: 0 18px; border-radius: var(--border-radius-base); }
.page-container .table-toolbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; padding: 14px 18px; background: #fff; border-radius: var(--border-radius-base); .toolbar-left { display: flex; gap: 8px; } }
</style>
