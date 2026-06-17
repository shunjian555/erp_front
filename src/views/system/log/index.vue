<template>
  <div class="page-container">
    <BaseSearch :search-items="searchItems" @search="handleSearch" @reset="handleReset" />
    <div class="table-toolbar">
      <div class="toolbar-left"><el-button :icon="Delete" type="danger" plain @click="handleClean">清空日志</el-button><el-button :icon="Download" plain>导出</el-button></div>
      <div class="toolbar-right"><el-button :icon="Refresh" circle @click="loadData" /></div>
    </div>
    <BaseTable :columns="columns" :table-data="tableData" :loading="loading" :total="total" :current-page.sync="queryParams.pageNum" :page-size.sync="queryParams.pageSize" :show-index="true" @current-change="handlePageChange" @size-change="handleSizeChange">
      <template #type="{ row }">
        <el-tag :type="logTypeMap[row.type]?.tagType || 'info'" size="small">{{ logTypeMap[row.type]?.label || '未知' }}</el-tag>
      </template>
      <template #status="{ row }">
        <BaseStatusTag :type="row.status === 1 ? 'success' : 'danger'">{{ row.status === 1 ? '成功' : '失败' }}</BaseStatusTag>
      </template>
    </BaseTable>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Delete, Download, Refresh } from '@element-plus/icons-vue'
import BaseSearch from '@/components/BaseSearch.vue'
import BaseTable from '@/components/BaseTable.vue'
import BaseStatusTag from '@/components/BaseStatusTag.vue'

const logTypeMap = {
  login: { label: '登录', tagType: '' },
  operate: { label: '操作', tagType: 'warning' },
  query: { label: '查询', tagType: 'success' },
  export: { label: '导出', tagType: 'info' },
  exception: { label: '异常', tagType: 'danger' }
}

const searchItems = [
  { prop: 'module', label: '操作模块', type: 'input' },
  { prop: 'type', label: '操作类型', type: 'select', options: Object.entries(logTypeMap).map(([v, l]) => ({ value: v, label: l.label })) },
  { prop: 'operator', label: '操作人', type: 'input' },
  { prop: 'status', label: '状态', type: 'select', options: [{ value: '', label: '全部' }, { value: 1, label: '成功' }, { value: 0, label: '失败' }] }
]

const columns = [
  { prop: 'module', label: '操作模块', width: 130 },
  { prop: 'type', label: '操作类型', width: 90, slot: 'type' },
  { prop: 'description', label: '操作描述', minWidth: 180, showOverflowTooltip: true },
  { prop: 'operator', label: '操作人', width: 110 },
  { prop: 'ip', label: 'IP地址', width: 130 },
  { prop: 'status', label: '状态', width: 80, slot: 'status' },
  { prop: 'duration', label: '耗时(ms)', width: 90, align: 'center' },
  { prop: 'createTime', label: '操作时间', width: 170 }
]

const loading = ref(false), tableData = ref([]), total = ref(0)
const queryParams = reactive({ pageNum: 1, pageSize: 10, module: '', type: '', operator: '', status: '' })

async function loadData() {
  loading.value = true
  try {
    const res = await (await import('@/utils/request')).default({ url: '/api/system/log/list', method: 'get', params: queryParams })
    tableData.value = res.data.list || []; total.value = res.data.total || 0
  } finally { loading.value = false }
}

function handleSearch(p) { Object.assign(queryParams, p, { pageNum: 1 }); loadData() }
function handleReset() { Object.keys(queryParams).forEach(k => { if (k !== 'pageNum' && k !== 'pageSize') queryParams[k] = '' }); loadData() }
function handlePageChange(p) { queryParams.pageNum = p; loadData() }
function handleSizeChange(s) { queryParams.pageSize = s; queryParams.pageNum = 1; loadData() }

async function handleClean() {
  await ElMessageBox.confirm('确定清空所有操作日志？此操作不可恢复！', '警告', { type: 'warning' })
  ElMessage.success('日志已清空'); loadData()
}

onMounted(() => loadData())
</script>

<style lang="scss" scoped>
.page-container .table-toolbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; padding: 14px 18px; background: #fff; border-radius: var(--border-radius-base); .toolbar-left { display: flex; gap: 10px; } .toolbar-right { display: flex; gap: 8px; } }
</style>